// 应用生命周期：参数→配置→副本→运行→报告→释放监听。
import type { RunInputOptions } from './types/task';
import type { ModelCall, RunEventListener } from '@ai-harness/runtime';
import { parseArgs, helpText } from './config/args';
import { loadTask } from './config/task';
import { createModelCall } from './model';
import { prepareSession } from './session/prepare';
import { appendRun, createSessionLog } from './session/session-log';
import { resumeConversation } from './session/resume-conversation';
import { runSession } from './session/run';
import { reportSession } from './report/report';
import { printProgress, printBlock } from './report/terminal';
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
  let phase = '参数';
  process.on('SIGINT', onInterrupt);

  try {
    const options = parseArgs(args);
    if (options.help) {
      console.log(helpText);
      return 0;
    }

    // 【新增】只读接续先于任务配置和副本准备分流。
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

    phase = '模型配置';
    const callModel = createCallModel();

    phase = '副本准备';
    session = await prepareSession(task, options.planning, controller.signal);
    printBlock('工作副本', session.root);

    // 【新增】先独占创建文件，防止两次 CLI 运行混写。
    let logPath: string | undefined;
    if (options.sessionLog) {
      phase = '会话记录';
      logPath = await createSessionLog(options.sessionLog, session.root);
    }

    phase = '运行与报告';
    const onEvent: RunEventListener = (event) => {
      printProgress(event);
      if (
        event.type === 'tool_end' &&
        event.toolName === 'update_plan' &&
        !event.isError &&
        session?.plan
      ) {
        printBlock('任务计划（模型声明）', session.plan.read());
      }
    };

    const first = await runSession(task, session, callModel, controller.signal, onEvent, { fullHistory });
    // 【新增】首段落盘之后才启动追问。
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
        fullHistory,
      };
      result = await runSession(task, session, callModel, controller.signal, onEvent, nextInput);
      if (logPath) {
        phase = '会话记录';
        await appendRun(logPath, result, first.messages.length);
        phase = '运行与报告';
      }
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
    process.off('SIGINT', onInterrupt);
    if (session) {
      console.log('工作副本保留在：', session.root);
    }
  }
}