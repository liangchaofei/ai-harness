// 模型包可识别的调用失败类别。
/** complete 创建错误时使用；Runtime 据此归类，不靠解析异常正文。 */
export type ModelFailureKind = 'configuration' | 'http' | 'transport' | 'protocol';
