/**
 * 请求指纹（Fingerprint）模块
 * 
 * 这个文件提供了为传入的 HTTP 请求创建唯一标识的功能。
 * 
 * 什么是请求指纹？
 * 请求指纹就像人的指纹一样，是一个唯一的标识，可以用来区分不同的请求或访问者。
 * 它基于请求的各种属性（如 IP 地址、浏览器信息、请求路径等）生成。
 * 
 * 想象一下：
 * 就像在图书馆借书时，工作人员需要记录“谁借了什么书”。
 * 请求指纹就像是你的借书证，帮助服务器识别“谁发送了这个请求”。
 * 
 * 请求指纹的常见用途：
 * 1. 限制访问频率：防止同一用户短时间内发送过多请求
 * 2. 防止暗网攻击：识别并限制可疑行为
 * 3. 用户跟踪：在不使用 Cookie 的情况下识别用户
 * 4. 统计分析：记录独立访客数量
 * 5. 防止多次提交：避免表单重复提交
 */

// 导入必要的类型和函数
import type { H3Event, RequestFingerprintOptions } from "../types";
// 导入加密模块，用于生成哈希值
import crypto from "uncrypto"; // 支持 Node.js 18
// 导入获取请求 IP 地址的函数
import { getRequestIP } from "./request";

/**
 * 获取传入请求的唯一指纹
 * 
 * 这个函数可以基于请求的多个属性生成一个唯一的标识符，
 * 用于识别和跟踪请求或访问者。
 *
 * @experimental 这个工具的行为可能在未来版本中发生变化
 */
export async function getRequestFingerprint(
  event: H3Event,  // H3 框架的请求事件
  opts: RequestFingerprintOptions = {},  // 指纹选项配置
): Promise<string | null> {  // 返回指纹字符串或空值
  // 创建一个数组来存储指纹的各个部分
  const fingerprint: unknown[] = [];

  // 如果配置中没有禁用 IP 地址，将其添加到指纹中
  if (opts.ip !== false) {
    // 获取请求的 IP 地址，可能使用 X-Forwarded-For 头部
    fingerprint.push(
      getRequestIP(event, { xForwardedFor: opts.xForwardedFor }),
    );
  }

  // 如果配置中启用了方法，将 HTTP 方法（GET、POST 等）添加到指纹中
  if (opts.method === true) {
    fingerprint.push(event.request.method);
  }

  // 如果配置中启用了路径，将请求路径添加到指纹中
  if (opts.path === true) {
    fingerprint.push(event.path);
  }

  // 如果配置中启用了用户代理，将浏览器信息添加到指纹中
  if (opts.userAgent === true) {
    fingerprint.push(event.request.headers.get("user-agent"));
  }

  // 将所有非空值的指纹部分用箭头符号连接成一个字符串
  // filter(Boolean) 用于移除数组中的空值、null 和 undefined
  const fingerprintString = fingerprint.filter(Boolean).join("|");

  // 如果没有有效的指纹部分，返回 null
  if (!fingerprintString) {
    return null;
  }

  // 如果配置中禁用了哈希，直接返回原始指纹字符串
  if (opts.hash === false) {
    return fingerprintString;
  }

  // 使用加密 API 将指纹字符串转换为哈希值
  // 这样可以生成固定长度的字符串，并且不可逆向推导原始数据
  const buffer = await crypto.subtle.digest(
    opts.hash || "SHA-1",  // 使用指定的哈希算法，默认为 SHA-1
    new TextEncoder().encode(fingerprintString),  // 将字符串转换为字节数组
  );

  // 将哈希结果（二进制数据）转换为十六进制字符串
  const hash = [...new Uint8Array(buffer)]  // 将 ArrayBuffer 转换为数组
    .map((b) => b.toString(16).padStart(2, "0"))  // 将每个字节转换为两位十六进制
    .join("");  // 将所有十六进制字符连接成一个字符串

  // 返回最终的哈希指纹
  return hash;
}

/**
 * 请求指纹的实际应用场景示例：
 * 
 * 1. 限制访问频率（Rate Limiting）
 *    例如：限制同一用户每分钟只能发送 10 个请求
 * 
 * 2. 防止暴力破解（Brute Force Protection）
 *    例如：如果同一用户多次登录失败，暂时锁定账户
 * 
 * 3. 无状态会话跟踪（Stateless Session Tracking）
 *    例如：在不使用 Cookie 的情况下识别用户
 * 
 * 4. 防止重复提交（Prevent Duplicate Submissions）
 *    例如：确保同一表单不会被多次提交
 * 
 * 5. 安全审计（Security Auditing）
 *    例如：记录用户的访问模式，发现异常行为
 * 
 * 使用指纹时的注意事项：
 * - 隐私考虑：不要将原始指纹数据暴露给客户端
 * - 准确性：不同用户可能共享同一个 IP 地址（如公司网络）
 * - 变化性：用户的 IP 或浏览器可能会变化
 */
