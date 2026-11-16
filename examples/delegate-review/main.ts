// 【新增文件】以固定父子响应观察汇合、验收和只读边界。
import { runCli } from '../../apps/coding-cli/src/main';

const mode = process.argv[2] ?? 'repair';
if (mode !== 'repair' && mode !== 'deny-write') {
  throw new Error('用法：main.ts repair|deny-write');
}
const args = ['--task', 'fixtures/code-tasks/route-delegated.json'];
if (mode === 'deny-write') {
  args.push('--read-only');
}

const edit = {
  path: 'src/routing/normalize.ts',
  oldText: "return path.split('?')[0]!.replace(/\\/$/, '');",
  newText: "const clean = path.split(/[?#]/)[0]!;\n  return clean.replace(/\\/+$/, '') || '/';",
};

process.exitCode = await runCli(args, () => {
  let parentTurn = 0;
  return async ({ systemPrompt, messages, tools = [] }) => {
    const feedback = messages.at(-1);
    if (systemPrompt?.startsWith('你是只读入口调查员')) {
      if (tools.length !== 1 || tools[0]?.name !== 'read_file') {
        throw new Error('子运行只应取得工作区读取能力。');
      }
      if (mode === 'deny-write') {
        if (feedback?.role !== 'toolResult') {
          return request('child_wrong_tool', 'replace_text', edit);
        }
        if (!feedback.isError) {
          throw new Error('子运行中的写入请求应被拒绝。');
        }
        return answer('写入请求被拒绝。');
      }
      if (feedback?.role !== 'toolResult') {
        return request('child_read_entry', 'read_file', { path: 'src/main.ts' });
      }
      if (feedback.isError || !feedback.content.includes('./routing/normalize')) {
        throw new Error('子运行未找到预期入口。');
      }
      return answer('src/main.ts 导出 ./routing/normalize，候选文件为 src/routing/normalize.ts。');
    }

    parentTurn += 1;
    if (parentTurn === 1) {
      return request('parent_delegate', 'delegate_entry_review', { entry: 'src/main.ts' });
    }
    if (parentTurn === 2) {
      if (feedback?.role !== 'toolResult' || feedback.isError) {
        throw new Error('父运行没有收到委派反馈。');
      }
      const child = JSON.parse(feedback.content);
      if (child.status !== 'answered' || !child.childRunId) {
        throw new Error('委派结果缺少独立的运行身份。');
      }
      if (mode === 'deny-write') {
        if (!child.finding.includes('写入请求被拒绝')) {
          throw new Error('未观察到预期的越权拒绝。');
        }
        return answer('已确认子运行没有写入能力。');
      }
      if (!child.finding.includes(edit.path)) {
        throw new Error('没收到当前实现的线索。');
      }
      return request('parent_verify', 'read_file', { path: edit.path });
    }
    if (parentTurn === 3) {
      if (feedback?.role !== 'toolResult' || feedback.isError || !feedback.content.includes(edit.oldText)) {
        throw new Error('父运行无法在当前文件中核对原实现。');
      }
      return request('parent_edit', 'replace_text', edit);
    }
    if (parentTurn === 4) {
      return request('parent_check', 'run_check', {});
    }
    return answer('已调查、修复并提交验收请求，请查看实际验收。');
  };
});

/** 同一格式用于构造父请求和子请求。 */
function request(id: string, name: string, args: Record<string, unknown>) {
  return {
    role: 'assistant',
    content: '',
    stopReason: 'toolUse',
    toolCalls: [{ id, name, arguments: JSON.stringify(args) }],
  } as const;
}

/** 停止当前运行，具体属于父还是子由调用场景决定。 */
function answer(content: string) {
  return { role: 'assistant', content, stopReason: 'stop', toolCalls: [] } as const;
}
