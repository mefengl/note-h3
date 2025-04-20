/**
 * 服务器发送事件(Server-Sent Events, SSE)模块
 * 
 * 这个文件提供了创建和管理服务器发送事件(SSE)的工具函数。
 * 
 * 什么是服务器发送事件？
 * 它是一种允许服务器向浏览器客户端推送实时更新的技术。
 * 与 WebSocket 不同，SSE 是单向的：数据只能从服务器发送到客户端，不能反过来。
 * 
 * 想象一下：
 * SSE 就像一个广播电台，服务器是主播音人，可以持续向听众（客户端）发送消息，
 * 但听众不能通过同一个频道回复主播音人。
 * 
 * SSE 的常见应用场景：
 * - 实时通知和提醒
 * - 股票行情、体育比分等实时更新
 * - 社交媒体动态推送
 * - 实时日志或状态监控
 */

// 导入 H3Event 类型，表示 H3 框架中的请求事件
import type { H3Event } from "../types";
// 导入 EventStreamOptions 类型，定义了事件流的配置选项
import type { EventStreamOptions } from "../types/utils/sse";
// 导入 EventStream 类，这是实现服务器发送事件的核心类
import { EventStream } from "./internal/event-stream";

/**
 * 初始化一个 EventStream 实例来创建[服务器发送事件](https://developer.mozilla.org/en-US/docs/Web/API/Server-sent_events/Using_server-sent_events)
 * 
 * 这个函数允许你创建一个持续的连接，通过这个连接服务器可以主动向客户端推送数据。
 * 
 * @experimental 这个函数处于实验阶段，在某些环境中可能不稳定。
 *
 * @example 使用示例
 *
 * ```ts
 * import { createEventStream, sendEventStream } from "h3";
 *
 * app.use("/sse", (event) => {
 *   // 创建一个事件流
 *   const eventStream = createEventStream(event);
 *
 *   // 每秒发送一条消息
 *   const interval = setInterval(async () => {
 *     await eventStream.push("Hello world");
 *   }, 1000);
 *
 *   // 当连接终止时清理定时器并关闭流
 *   eventStream.onClosed(async () => {
 *     console.log("closing SSE...");
 *     clearInterval(interval);
 *     await eventStream.close();
 *   });
 *
 *   // 发送事件流
 *   return eventStream.send();
 * });
 * ```
 */
export function createEventStream(
  event: H3Event,  // H3 框架的请求事件对象
  opts?: EventStreamOptions,  // 可选的配置选项
): EventStream {
  // 创建并返回一个新的 EventStream 实例
  // 这个实例将处理与客户端的连接和数据发送
  return new EventStream(event, opts);
}

/**
 * 服务器发送事件(SSE)与 WebSocket 的区别：
 * 
 * 1. 通信方式：
 *    - SSE: 单向通信（服务器→客户端）
 *    - WebSocket: 双向通信（服务器↔客户端）
 * 
 * 2. 协议：
 *    - SSE: 基于 HTTP，使用普通的 HTTP 请求
 *    - WebSocket: 独立的 WebSocket 协议，需要协议升级
 * 
 * 3. 重连机制：
 *    - SSE: 内置自动重连机制
 *    - WebSocket: 需要手动实现重连
 * 
 * 4. 消息类型：
 *    - SSE: 只能发送文本数据
 *    - WebSocket: 可以发送文本和二进制数据
 * 
 * 5. 兼容性：
 *    - SSE: 大多数现代浏览器支持，兼容性好
 *    - WebSocket: 需要更新的浏览器支持
 * 
 * 使用 SSE 的实际应用场景示例：
 * 
 * 1. 社交媒体通知：当有新的评论、点赞或消息时，服务器可以实时推送通知
 * 2. 实时价格更新：股票、加密货币或商品价格的实时更新
 * 3. 实时日志流：开发者可以实时查看服务器日志
 * 4. 进度更新：当服务器处理长时间任务时，可以实时更新进度
 * 5. 实时分数板：体育比赛或游戏的实时分数更新
 */
