/**
 * WebSocket 工具模块
 * 
 * 这个文件提供了创建和管理 WebSocket 连接的工具函数。
 * WebSocket 是一种网络通信协议，允许浏览器和服务器之间建立持久连接，
 * 可以双向传输数据，而不需要像普通 HTTP 请求那样频繁地建立新连接。
 * 
 * 想象一下：普通的 HTTP 就像给朋友写信，每次都要重新写信、寄信、等回信；
 * 而 WebSocket 就像是和朋友打电话，建立连接后可以一直聊天，双方都可以随时说话。
 */

// 从 crossws 库导入 WebSocket 钩子类型
import type { Hooks as WSHooks } from "crossws";
// 导入创建错误的函数
import { createError } from "../error";
// 导入定义事件处理器的函数
import { defineEventHandler } from "../handler";

/**
 * 定义 WebSocket 钩子函数
 * 
 * 钩子函数是在特定事件发生时会被自动调用的函数。
 * 对于 WebSocket，这些事件包括：连接建立、接收消息、连接关闭等。
 * 
 * 例如：
 * - 当有新用户连接到聊天室时，可以通知其他人"新用户加入"
 * - 当收到消息时，可以将消息广播给所有人
 * - 当用户断开连接时，可以清理相关资源
 *
 * @see https://h3.unjs.io/guide/websocket
 */
export function defineWebSocket(hooks: Partial<WSHooks>): Partial<WSHooks> {
  // 这个函数很简单，它只是接收 WebSocket 钩子配置并原样返回
  // 这种模式叫做"身份函数"，主要用于提供类型检查和代码提示
  // 就像是给你的玩具贴上标签，虽然玩具没变，但更容易辨认了
  return hooks;
}

/**
 * 定义 WebSocket 事件处理器
 * 
 * 这个函数创建一个专门处理 WebSocket 连接的处理器。
 * 当普通 HTTP 请求尝试访问这个处理器时，会返回错误提示需要升级协议。
 * 只有正确的 WebSocket 连接请求才会被处理。
 * 
 * 举个例子：
 * 这就像是一个特殊的门，只有拿着"WebSocket钥匙"的人才能进入，
 * 普通访客会被告知"请使用正确的钥匙"。
 *
 * @see https://h3.unjs.io/guide/websocket
 */
export function defineWebSocketHandler(hooks: Partial<WSHooks>) {
  // 返回一个事件处理器，它有两部分功能
  return defineEventHandler({
    // 1. 普通 HTTP 请求处理函数
    handler() {
      // 当普通 HTTP 请求访问这个处理器时，抛出一个错误
      // 状态码 426 表示"需要升级"，提示客户端应该使用 WebSocket 协议
      // 这就像告诉访客："请不要用普通方式敲门，需要使用特殊的WebSocket方式"  
      throw createError({
        statusCode: 426,
        statusMessage: "Upgrade Required", // 意思是"需要升级协议"
      });
    },
    // 2. WebSocket 处理部分，使用传入的钩子配置
    // 当收到正确的 WebSocket 连接请求时，这些钩子函数会被调用
    websocket: hooks,
  });
}

/**
 * WebSocket 使用场景示例：
 * 
 * 1. 实时聊天应用 - 用户发送消息后，服务器可以立即推送给所有在线用户
 * 2. 在线游戏 - 玩家的操作可以实时传输给服务器和其他玩家
 * 3. 实时数据更新 - 股票价格、天气信息等需要实时更新的数据
 * 4. 协作工具 - 多人同时编辑文档，所有人都能看到实时变化
 * 
 * 与普通 HTTP 相比，WebSocket 的优势：
 * - 连接只需建立一次，减少了握手次数
 * - 服务器可以主动向客户端推送数据
 * - 数据传输更高效，没有 HTTP 头部的额外开销
 * - 非常适合需要低延迟的应用场景
 */
