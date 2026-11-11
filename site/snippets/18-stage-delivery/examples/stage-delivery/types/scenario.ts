// 【新增文件】固定机制观察的路径选择，不是Runtime的新停止状态。
/** 观察入口选择；模型替身按此生成固定请求，真实CLI不读取它。 */
export type Scenario = 'repair' | 'stale' | 'recheck';
