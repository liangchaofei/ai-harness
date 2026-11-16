// 【新增文件】用固定模型验证并发上限、乱序完成及父取消。
import { runCli } from '../../apps/coding-cli/src/main';

const [mode, trace] = process.argv.slice(2);
if ((mode !== 'repair' && mode !== 'cancel') || !trace) {
  throw new Error('用法：main.ts repair|cancel <新轨迹文件>');
}

const entries = ['src/main.ts', 'README.md', 'src/legacy/normalize.ts'];
const edit = {
  path: 'src/routing/normalize.ts',
  oldText: "return path.split('?')[0]!.replace(/\\/$/, '');",
  newText: "const clean = path.split(/[?#]/)[0]!;\n  return clean.replace(/\\/+$/, '') || '/';",
};
const started: string[] = [];
const finished: string[] = [];
let active = 0;
let peak = 0;
let markThirdStarted!: () => void;
const thirdStarted = new Promise<void>((resolve) => {
  markThirdStarted = resolve;
});
let parentTurn = 0;

process.exitCode = await runCli(
  ['--task', 'fixtures/code-tasks/route-delegated.json', '--trace-file', trace],
  () => async ({ systemPrompt, messages }, _delta, signal) => {
    const feedback = messages.at(-1);
    if (systemPrompt?.startsWith('你是只读入口调查员') && messages[0]?.role === 'user') {
      const { entry } = JSON.parse(messages[0].content);
      if (feedback?.role !== 'toolResult') {
        started.push(entry);
        active += 1;
        peak = Math.max(peak, active);
        if (mode === 'cancel') {
          return new Promise((_, reject) => {
            signal!.addEventListener('abort', () => reject(signal!.reason), { once: true });
            if (started.length === 2) {
              process.emit('SIGINT');
            }
          });
        }

        // 第一项等第三项开始，证明第二项先完成并释放 worker。
        if (entry === entries[0]) {
          await thirdStarted;
        } else if (entry === entries[2]) {
          markThirdStarted();
        }
        return request('child_read', 'read_file', { path: entry });
      }

      if (feedback.isError) {
        throw new Error('读取分配文件失败。');
      }
      active -= 1;
      finished.push(entry);
      return answer(feedback.content);
    }

    parentTurn += 1;
    if (parentTurn === 1) {
      return request('parent_review_batch', 'delegate_entry_review', {
        entry: entries[0],
        relatedEntries: entries.slice(1),
      });
    }
    if (parentTurn === 2) {
      if (feedback?.role !== 'toolResult' || feedback.isError) {
        throw new Error('父运行未取得汇合结果。');
      }
      const { reviews } = JSON.parse(feedback.content);
      if (peak !== 2 || finished[0] !== 'README.md' ||
          JSON.stringify(reviews.map((item: { entry: string }) => item.entry)) !== JSON.stringify(entries) ||
          !reviews[0]?.finding.includes('./routing/normalize')) {
        throw new Error('并发上限、完成顺序或结果顺序不符合预期。');
      }
      return request('parent_verify', 'read_file', { path: edit.path });
    }
    if (parentTurn === 3) {
      if (feedback?.role !== 'toolResult' || feedback.isError || !feedback.content.includes(edit.oldText)) {
        throw new Error('父运行未核对当前实现。');
      }
      return request('parent_edit', 'replace_text', edit);
    }
    if (parentTurn === 4) {
      return request('parent_check', 'run_check', {});
    }
    return answer('已核对、修改并提交实际验收。');
  },
);

if (mode === 'cancel' && (process.exitCode !== 130 || started.length !== 2 || parentTurn !== 1)) {
  throw new Error('取消后仍调度了等待项，或父模型继续执行。');
}
console.log('调度观测', { started, finished, peak, parentTurn });

/** 固定响应复用真实工具请求结构。 */
function request(id: string, name: string, args: Record<string, unknown>) {
  return {
    role: 'assistant',
    stopReason: 'toolUse',
    content: '',
    toolCalls: [{ id, name, arguments: JSON.stringify(args) }],
  } as const;
}

/** 固定回答只结束当前运行。 */
function answer(content: string) {
  return { role: 'assistant', content, stopReason: 'stop', toolCalls: [] } as const;
}
