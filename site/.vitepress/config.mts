import { defineConfig } from 'vitepress';

export default defineConfig({
  lang: 'zh-CN',
  title: '从零建设 Agent 系统',
  description: '用 TypeScript 逐步实现 Agent Runtime、Harness 与桌面 Coding Agent。',
  base: '/ai-harness/',
  cleanUrls: true,
  srcExclude: ['snippets/**'],
  themeConfig: {
    nav: [
      { text: '学习路线', link: '/roadmap' },
      { text: '学习方式', link: '/learning-method' },
    ],
    sidebar: [
      { text: '课程导读', items: [
        { text: '课程目标', link: '/' },
        { text: '阶段路线', link: '/roadmap' },
        { text: '学习方式', link: '/learning-method' },
      ] },
      { text: '第一阶段 · 基础原理与运行内核', items: [
        { text: '01 从包入口发起模型调用', link: '/guide/01-model-call' },
        { text: '02 让模型提出工具请求', link: '/guide/02-tool-requests' },
        { text: '03 执行工具，把结果交回模型', link: '/guide/03-tool-feedback' },
        { text: '04 让 Runtime 自动继续与停止', link: '/guide/04-agent-loop' },
        { text: '05 换任务，检验同一个运行内核', link: '/guide/05-runtime-reuse' },
      ] },
      { text: '第二阶段 · 接入、观察与控制', items: [
        { text: '06 模型适配：换服务，保留同一个 Runtime', link: '/guide/06-model-providers' },
        { text: '07 工具准入与可判断的失败', link: '/guide/07-tool-contracts' },
        { text: '08 运行事件与实时进度', link: '/guide/08-runtime-events' },
        { text: '09 流式模型与完整消息', link: '/guide/09-model-streaming' },
        { text: '10 主动取消一次运行', link: '/guide/10-run-cancellation' },
        { text: '11 整次时限与运行预算', link: '/guide/11-run-budgets' },
        { text: '12 阶段联调：可观察地控制同一内核', link: '/guide/12-stage-integration' },
      ] },
      { text: '第三阶段 · 实际代码任务与交付', items: [
        { text: '13 让 Agent 调查有限工作区', link: '/guide/13-workspace-investigation' },
        { text: '14 修改代码，让真实验收反馈进入下一轮', link: '/guide/14-edit-check-feedback' },
      ] },
    ],
    outline: { label: '本页内容', level: [2, 3] },
    docFooter: { prev: '上一篇', next: '下一篇' },
    sidebarMenuLabel: '目录',
    returnToTopLabel: '返回顶部',
    darkModeSwitchLabel: '切换主题',
  },
});
