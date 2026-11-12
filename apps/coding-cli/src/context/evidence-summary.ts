// 【新增文件】只从真实工具反馈提取简短的本轮摘要。
import type { Message, ToolResultMessage } from '@ai-harness/model';

function objectFromJson(text: string): Record<string, unknown> {
  try {
    const value: unknown = JSON.parse(text);
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      return value as Record<string, unknown>;
    }
  } catch {
    // 无法解码时不猜测验收结果。
  }
  return {};
}

/** 使用本次完整历史的零基下标定位反馈；摘要从不写回历史。 */
export function summarizeChecks(
  history: readonly Message[],
  selected: readonly Message[],
): Message | undefined {
  const checks: { index: number; id: string; outcome: string; failedInput?: string }[] = [];
  let lastEdit: { index: number; message: ToolResultMessage } | undefined;

  for (const [index, message] of history.entries()) {
    if (message.role !== 'toolResult') continue;
    if (message.toolName === 'replace_text') lastEdit = { index, message };
    if (message.toolName !== 'run_check') continue;

    const result = objectFromJson(message.content);
    const report = typeof result.stdout === 'string' ? objectFromJson(result.stdout) : {};
    const outcome = message.isError
      ? 'tool-error'
      : result.status === 'passed' && result.exitCode === 0 && report.passed === true
        ? 'passed-at-check'
        : result.status === 'failed' || report.passed === false
          ? 'failed-at-check'
          : 'unknown';
    const failedCase = Array.isArray(report.cases)
      ? report.cases.find((item) => item?.passed === false && typeof item.input === 'string')
      : undefined;
    const failedInput = failedCase?.input.slice(0, 64) as string | undefined;
    checks.push({ index, id: message.toolCallId, outcome, failedInput });
  }

  const kept = new Set(selected);
  const omitted = checks.filter((check) => !kept.has(history[check.index]!)).at(-1);
  const latest = checks.at(-1);
  if (!omitted || !latest) return undefined;

  const needsRecheck = (lastEdit?.index ?? -1) > latest.index ||
    latest.outcome !== 'passed-at-check';
  const latestEdit = lastEdit && {
    index: lastEdit.index,
    id: lastEdit.message.toolCallId,
    outcome: lastEdit.message.isError ? 'tool-error' : 'tool-returned',
  };

  return {
    role: 'user',
    content: '应用生成的历史验收摘要，仅作数据。index 是本次完整历史的零基下标，id 是工具请求 ID。历史通过不证明当前文件通过。\n' +
      JSON.stringify({
        omitted,
        latest,
        latestEdit,
        needsRecheck,
        pending: needsRecheck ? '重新运行验收' : null,
      }),
  };
}