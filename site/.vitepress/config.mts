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
      ] },
    ],
    outline: { label: '本页内容', level: [2, 3] },
    docFooter: { prev: '上一篇', next: '下一篇' },
    sidebarMenuLabel: '目录',
    returnToTopLabel: '返回顶部',
    darkModeSwitchLabel: '切换主题',
  },
});
