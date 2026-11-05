// 【修改】流式响应可以在 HTTP 成功后报告服务错误。
// 模型包可识别的调用失败类别。
/** complete/stream 创建错误时使用；Runtime 据此归类，service 表示服务在流中报告失败。 */
export type ModelFailureKind = 'configuration' | 'http' | 'transport' | 'protocol' | 'service';