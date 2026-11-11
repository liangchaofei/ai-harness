import { runAgent } from '@ai-harness/runtime';
// 进程信号只由应用转换，Runtime 不依赖终端。
import { createInterrupt } from '../../shared/interrupt';
// 两个任务使用同一事件接口，不复制执行循环。
import { printEvent } from '../../shared/print-event';
import { createModelCall } from '../../shared/model';
// 材料加载与任务证据由工厂成组提供。
import { createReleaseTask } from './task';

// 每次运行独立持有取消源。
const interrupt = createInterrupt();

try {
  // 默认仍为原发布任务，自定义文本保留。
  const task = await createReleaseTask('original', process.argv[2]);
  const result = await runAgent({
    // 循环配置接收同一任务对象中的输入。
    ...task.input,
    callModel: createModelCall(),
    maxModelCalls: 6,
    // 应用选择当前任务策略；不是框架通用最优值。
    timeoutMs: 60_000,
    maxToolCalls: 8,
    // 传入函数引用，Runtime 在动作边界调用它。
    onEvent: printEvent,
    // 只读信号传入 Runtime。
    signal: interrupt.signal,
  });
  // 取消是操作者停止，不作为普通审查/调查失败交付。
  if (result.status === 'cancelled') {
    console.log('运行已取消，未交付答案。');
    process.exitCode = 130;
  } else if (result.status === 'timedOut' || result.status === 'toolLimit') {
    // 约束停止单独展示，不把不完整记录交付为答案。
    console.log(
      '运行受限制停止：',
      result.status,
      '模型调用：',
      result.modelCalls,
      '工具处理：',
      result.toolCalls,
    );
    process.exitCode = 1;
  } else if (!task.report(result)) {
    process.exitCode = 1;
  }
} catch {
  console.error(
    '材料准备、运行配置或展示异常，请在入口 catch 断点检查；未输出原始异常正文。',
  );
  process.exitCode = 1;
} finally {
  // 正常、取消或异常结束都移除 SIGINT 监听。
  interrupt.dispose();
}
