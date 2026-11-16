// 应用生命周期：参数→配置→副本→运行→报告→释放监听。
import type { RunInputOptions } from './types/task';
import type { ModelCall, RunEventListener } from '@ai-harness/runtime';
import { parseArgs, helpText } from './config/args';
import { loadTask } from './config/task';
import { createModelCall } from './model';
import { openInvoicePolicy } from './invoice-policy-mcp';
import { decidePendingCheck, inspectPendingCheck, resumePendingCheck, savePendingCheck } from './session/checkpoint';
import { prepareSession } from './session/prepare';
import { appendRun, createSessionLog } from './session/session-log';
import { resumeConversation } from './session/resume-conversation';
import { runSession } from './session/run';
import { reportSession } from './report/report';
import { printProgress, printBlock } from './report/terminal';
import { openRunTrace } from './report/trace';
import type { CliSession } from './types/session';

/** CLI 接收退出码。观察入口可注入模型，并开启全量历史对照。 */
export async function runCli(
  args: readonly string[],
  createCallModel: () => ModelCall = createModelCall,
  fullHistory = false,
): Promise<number> {
  const controller = new AbortController();
  const onInterrupt = () => {
    if (!controller.signal.aborted) {
      console.log('请求取消，等待当前协作操作退出。');
      controller.abort();
    }
  };
  let session: CliSession | undefined;
  let invoicePolicy: Awaited<ReturnType<typeof openInvoicePolicy>> | undefined;
  let trace: Awaited<ReturnType<typeof openRunTrace>> | undefined;
  let phase = '参数';
  process.on('SIGINT', onInterrupt);

  try {
    const options = parseArgs(args);
    if (options.help) {
      console.log(helpText);
      return 0;
    }

    // 只读接续先于任务配置和副本准备分流。
    if ('resumeLog' in options) {
      phase = '会话接续';
      const result = await resumeConversation(
        options.resumeLog,
        options.question,
        createCallModel,
        controller.signal,
      );
      printBlock('接续停止', { status: result.status });
      if (result.status === 'answered') {
        printBlock('接续回答', result.answer.content);
        return 0;
      }
      return result.status === 'cancelled' ? 130 : 1;
    }

    phase = '任务配置';
    const task = await loadTask(options.taskFile, controller.signal);

    // 批准命令只保存决定，之后由独立的恢复调用执行。
    if (options.decideCheck) {
      phase = '记录验收决定';
      const { path, decision } = options.decideCheck;
      const report = await decidePendingCheck(path, task, decision, controller.signal);
      printBlock('验收决定', report);
      return 0;
    }

    if (options.inspectCheck) {
      phase = '检查点诊断';
      const report = await inspectPendingCheck(options.inspectCheck, task, controller.signal);
      printBlock('检查点诊断', report);
      return 0;
    }

    if (options.resumeCheck) {
      phase = '检查点恢复';
      const result = await resumePendingCheck(options.resumeCheck, task, controller.signal);
      if (!('passed' in result)) {
        printBlock('验收未启动', result);
        return 1;
      }
      printBlock('恢复验收', result);
      return result.passed ? 0 : 1;
    }

    phase = '模型配置';
    const callModel = createCallModel();

    phase = '副本准备';
    session = await prepareSession(task, options.planning, controller.signal);
    printBlock('工作副本', session.root);

    // 先独占创建文件，防止两次 CLI 运行混写。
    let logPath: string | undefined;
    if (options.sessionLog) {
      phase = '会话记录';
      logPath = await createSessionLog(options.sessionLog, session.root);
    }

    // 准备模型循环前发现规则工具，首段和追问共用连接。
    if (task.extension === 'invoice-policy-mcp') {
      phase = '发票规则服务连接';
      invoicePolicy = await openInvoicePolicy(controller.signal);
    }

    // 【新增】开始循环前独占创建文件，首段和追问共用句柄。
    if (options.traceFile) {
      phase = '诊断轨迹';
      trace = await openRunTrace(options.traceFile);
    }

    phase = '运行与报告';
    const onEvent: RunEventListener = async (event) => {
      printProgress(event);
      if (
        event.type === 'tool_end' &&
        event.toolName === 'update_plan' &&
        !event.isError &&
        session?.plan
      ) {
        printBlock('任务计划（模型声明）', session.plan.read());
      }
      await trace?.append(event);
    };

    const runOptions: RunInputOptions = {
      fullHistory,
      ...(invoicePolicy ? { invoicePolicyTool: invoicePolicy.tool } : {}),
      ...(options.readOnly ? { readOnly: true } : {}),
      ...(options.approveTools ? { approveTools: true } : {}),
      ...(options.gateCheck ? { deferCheck: true } : {}),
    };
    const first = await runSession(task, session, callModel, controller.signal, onEvent, runOptions);
    // 首段落盘之后才启动追问。
    if (logPath) {
      phase = '会话记录';
      await appendRun(logPath, first, 0);
      phase = '运行与报告';
    }
    let result = first;

    // 沿用已经准备的副本和工具，只给 Runtime 一个新的历史起点。
    if (options.followUp && first.status === 'answered' && !controller.signal.aborted) {
      printBlock('首段停止', {
        status: first.status,
        modelCalls: first.modelCalls,
        toolCalls: first.toolCalls,
        runId: first.runId,
      });
      const nextInput: RunInputOptions = {
        messages: [...first.messages, { role: 'user', content: options.followUp }],
        ...runOptions,
      };
      result = await runSession(task, session, callModel, controller.signal, onEvent, nextInput);
      if (logPath) {
        phase = '会话记录';
        await appendRun(logPath, result, first.messages.length);
        phase = '运行与报告';
      }
    }

    if (options.checkpoint) {
      phase = '保存检查点';
      await savePendingCheck(
        options.checkpoint,
        task,
        session,
        result,
        controller.signal,
        options.gateCheck,
      );
      printBlock('检查点已保存', options.checkpoint);
      return 0;
    }

    return await reportSession(task, session, result);
  } catch {
    if (controller.signal.aborted) {
      return 130;
    }

    // 原异常留在调试器，不打印凭据、响应正文或整个请求。
    console.error(`${phase}失败；请检查配置或在对应函数断点查看原异常。`);
    return 2;
  } finally {
    if (trace) {
      await trace.close().catch(() => console.error('关闭诊断轨迹失败。'));
    }
    // 正常退出、异常和取消都要关闭本任务持有的连接。
    if (invoicePolicy) {
      await invoicePolicy.close().catch(() => console.error('关闭发票规则服务连接失败。'));
    }
    process.off('SIGINT', onInterrupt);
    if (session) {
      console.log('工作副本保留在：', session.root);
    }
  }
}
