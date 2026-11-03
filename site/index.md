---
layout: home
hero:
  name: 从零建设 Agent 系统
  text: 从原理走向可复用框架
  tagline: 用 TypeScript 亲手实现 Agent Runtime 与 Harness，再让命令行和桌面 Coding Agent 使用同一个底座。
  actions:
    - theme: brand
      text: 开始第01篇
      link: /guide/01-model-call
    - theme: alt
      text: 了解学习方式
      link: /learning-method
features:
  - title: 理解系统
    details: 用具体任务、数据和图解说明每项机制的位置，以及它为什么需要存在。
  - title: 逐步实现
    details: 分步讲解关键代码，观察运行与故障，再用不同任务检验复用。
  - title: 建设框架
    details: 分离通用内核、能力接入与应用，逐步建立恢复、安全、观察和评估能力。
---

课程面向具备 TypeScript、Node.js 和一般应用开发经验的 Agent 初学者。

基础闭环只是起点。最终工程目标是可独立消费的框架包，以及通过公开接口使用它的命令行与桌面 Coding Agent。学习过程中会区分当前已实现的能力、实验策略与后续建设内容。

已提供[第01篇：从包入口发起一次模型调用](/guide/01-model-call)、[第02篇：让模型提出工具请求](/guide/02-tool-requests)和[第03篇：执行工具，把结果交回模型](/guide/03-tool-feedback)。[第04篇：让 Runtime 自动继续与停止](/guide/04-agent-loop)进一步建立带调用上限的自动循环，应用通过函数注入模型接入。下一步换任务检验同一内核。
