/**
 * 数据清理（Sanitize）模块
 * 
 * 这个文件提供了清理和验证 HTTP 响应状态码和状态消息的函数。
 * 
 * 什么是数据清理？
 * 数据清理是一种安全实践，用于检查和过滤输入或输出数据，
 * 移除或转换可能导致安全问题的内容，确保数据符合预期的格式和规范。
 * 
 * 想象一下：
 * 就像在饮用水处理厂，水需要经过过滤器来清除有害物质。
 * 数据清理就是对数据进行“过滤”，确保它安全、符合规范。
 * 
 * 数据清理的重要性：
 * 1. 防止注入攻击：过滤可能包含恶意代码的输入
 * 2. 确保合规性：符合协议和标准的要求
 * 3. 防止数据损坏：避免非法字符导致的问题
 * 4. 提高兼容性：确保不同系统可以正确处理数据
 */

// 允许的字符：水平制表符、空格或可见的 ASCII 字符：参考 RFC 7230 第 3.1.2 节
// https://www.rfc-editor.org/rfc/rfc7230#section-3.1.2
// eslint-disable-next-line no-control-regex
const DISALLOWED_STATUS_CHARS = /[^\u0009\u0020-\u007E]/g;

/**
 * 确保状态消息可以安全地用于 HTTP 响应
 * 
 * 这个函数清理 HTTP 状态消息，移除所有不允许的字符。
 * 根据 HTTP 协议规范，状态消息只能包含水平制表符、空格或可见的 ASCII 字符。
 * 
 * 例如：如果状态消息中包含表情符号或特殊控制字符，它们将被移除。
 *
 * 允许的字符：水平制表符、空格或可见的 ASCII 字符：
 * 参考 RFC 7230 第 3.1.2 节 https://www.rfc-editor.org/rfc/rfc7230#section-3.1.2
 */
export function sanitizeStatusMessage(statusMessage = ""): string {
  // 使用正则表达式替换所有不允许的字符为空字符串
  // 这样可以移除任何可能导致 HTTP 响应问题的字符
  return statusMessage.replace(DISALLOWED_STATUS_CHARS, "");
}

/**
 * 确保状态码是有效的 HTTP 状态码
 * 
 * 这个函数检查并验证 HTTP 状态码，确保它是一个有效的数字，
 * 并且在合法的 HTTP 状态码范围内（100-999）。
 * 
 * 如果状态码无效或缺失，将返回默认状态码（通常是 200 OK）。
 * 
 * 常见的 HTTP 状态码示例：
 * - 200: 成功
 * - 404: 未找到资源
 * - 500: 服务器内部错误
 */
export function sanitizeStatusCode(
  statusCode?: string | number,  // 要验证的状态码，可以是字符串或数字，也可以不提供
  defaultStatusCode = 200,  // 默认状态码，当提供的状态码无效时使用
): number {  // 返回一个有效的数字状态码
  // 如果没有提供状态码（undefined 或 null），返回默认状态码
  if (!statusCode) {
    return defaultStatusCode;
  }
  
  // 如果状态码是字符串类型，将其转换为数字
  // 例如："404" 转换为数字 404
  if (typeof statusCode === "string") {
    // 使用十进制转换，确保正确解析数字
    statusCode = Number.parseInt(statusCode, 10);
  }
  
  // 验证状态码是否在有效范围内
  // HTTP 状态码必须是 100-999 之间的数字
  if (statusCode < 100 || statusCode > 999) {
    return defaultStatusCode;  // 如果超出范围，返回默认状态码
  }
  
  // 返回验证后的状态码
  return statusCode;
}

/**
 * 数据清理在 Web 开发中的重要性：
 * 
 * 1. 安全性：防止恶意输入导致的安全问题
 *    例如：防止跨站脚本攻击（XSS）或 HTTP 响应分割攻击
 * 
 * 2. 合规性：确保程序符合协议和标准
 *    例如：HTTP 状态消息必须只包含特定字符集
 * 
 * 3. 异常处理：优雅地处理意外或错误的输入
 *    例如：当收到无效状态码时返回默认值
 * 
 * 4. 用户体验：防止因数据格式错误导致的应用崩溃
 *    例如：确保即使收到意外输入，应用仍能正常工作
 */
