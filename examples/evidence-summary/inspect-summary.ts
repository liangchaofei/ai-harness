// 【新增文件】用小型人工记录观察摘要，不执行工具或调用模型。
import type { ToolResultMessage } from '@ai-harness/model';
import { summarizeChecks } from '../../apps/coding-cli/src/context/evidence-summary';

function check(id: string, passed: boolean, input: string): ToolResultMessage {
  return {
    role: 'toolResult',
    toolName: 'run_check',
    toolCallId: id,
    isError: false,
    content: JSON.stringify({
      status: passed ? 'passed' : 'failed',
      exitCode: passed ? 0 : 1,
      stdout: JSON.stringify({ passed, cases: [{ input, passed }] }),
    }),
  };
}

const old = check('check_partial', false, '/');
const latest = check('check_complete', true, '/');
const edit: ToolResultMessage = {
  role: 'toolResult',
  toolName: 'replace_text',
  toolCallId: 'edit_later',
  isError: false,
  content: '{}',
};

const mode = process.argv[2] ?? 'basic';
const history = [old, latest];
if (mode === 'stale') {
  history.push(edit);
} else if (mode === 'malformed') {
  history[1] = { ...latest, content: 'not-json' };
} else if (mode !== 'basic') {
  throw new Error('请选择 basic、stale 或 malformed。');
}

// 这里只演示选择完成后的数据关系，不经过工具批次选择器。
const selected = history.slice(1);
const summary = summarizeChecks(history, selected);
if (!summary) {
  throw new Error('应当有一条被省略的验收摘要。');
}
console.log(summary.content);