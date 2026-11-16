// 【新增文件】使用正式工具会话比较本地验收和系统约束下的验收。
import { fileURLToPath } from 'node:url';
import { rm } from 'node:fs/promises';
import { loadTask } from '../../apps/coding-cli/src/config/task';
import { runCli } from '../../apps/coding-cli/src/main';
import { prepareSession } from '../../apps/coding-cli/src/session/prepare';

const taskFile = 'fixtures/code-tasks/invoice-isolated.json';
const mode = process.argv[2] ?? 'compare';
if (mode !== 'compare' && mode !== 'repair') {
  throw new Error('用法：main.ts compare|repair');
}

if (mode === 'compare') {
  const { checkIsolation, ...task } = await loadTask(taskFile);
  const checkScript = fileURLToPath(new URL('./probe.mjs', import.meta.url));

  for (const isolation of [undefined, checkIsolation]) {
    const session = await prepareSession({ ...task, checkScript, checkIsolation: isolation }, false);
    try {
      const check = session.codeTask.tools.find((tool) => tool.name === 'run_check');
      if (!check) {
        throw new Error('任务缺少验收工具。');
      }

      // 直接观察两种执行环境，用相同探测脚本，避开模型选择的影响。
      const result = JSON.parse(await check.execute({}));
      if (result.status !== 'passed') {
        throw new Error(`探测脚本未正常结束：${result.status} ${result.stderr}`);
      }
      console.log(isolation ?? 'direct', JSON.parse(result.stdout));
    } finally {
      await rm(session.root, { recursive: true, force: true });
    }
  }
} else {
  let turn = 0;
  process.exitCode = await runCli(['--task', taskFile], () => async () => {
    turn += 1;
    if (turn === 1) {
      const oldText = 'return subtotal * (1 - rate) * (1 - rate);';
      return request('isolation_edit', 'replace_text', {
        path: 'src/checkout/invoice.ts',
        oldText,
        newText: 'return subtotal * (1 - rate);',
      });
    }
    if (turn === 2) {
      return request('isolation_check', 'run_check', {});
    }
    return {
      role: 'assistant',
      stopReason: 'stop',
      content: '已提交修改和验收请求，请查看实际交付判断。',
      toolCalls: [],
    };
  });
}

/** 固定响应沿用正式 Runtime 工具请求格式。 */
function request(id: string, name: string, args: Record<string, unknown>) {
  return {
    role: 'assistant',
    stopReason: 'toolUse',
    content: '',
    toolCalls: [{ id, name, arguments: JSON.stringify(args) }],
  } as const;
}
