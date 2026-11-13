// 【新增文件】用极小目标观察追问是否保留，无需启动模型或执行工具。
import type { Message } from '@ai-harness/model';
import { selectInput } from '../../apps/coding-cli/src/context/select-input';

const history: Message[] = [
  { role: 'user', content: '修复页面路径' },
  { role: 'assistant', content: '首段回答', stopReason: 'stop', toolCalls: [] },
  { role: 'user', content: '第一次验收是哪个用例失败？' },
  { role: 'assistant', content: '', stopReason: 'toolUse', toolCalls: [
    { id: 'check', name: 'run_check', arguments: '{}' },
  ] },
  { role: 'toolResult', toolCallId: 'check', toolName: 'run_check', content: '{}', isError: false },
];

for (const message of selectInput(history, 4096)) {
  console.log(message.role, message.role === 'toolResult' ? message.toolCallId : message.content);
}