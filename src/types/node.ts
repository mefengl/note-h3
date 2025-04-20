/**
 * Node.js类型定义文件 - node.ts
 * 
 * 这个文件定义了在Node.js环境中使用H3框架所需的类型。
 * 
 * 小朋友们可以这样理解：
 * 想象你在玩一个积木游戏，这个文件就像是说明书，
 * 告诉你每种积木的形状和用途，这样你才能正确地使用它们。
 */

// 从Node.js的http模块导入两个重要的类型
// IncomingMessage: 表示收到的请求，就像你收到的一封信
// ServerResponse: 表示发出的响应，就像你写回的回信
import type { IncomingMessage, ServerResponse } from "node:http";

/**
 * NodeHandler类型 - Node.js请求处理器
 * 
 * 这是一个函数类型，用于处理从客户端（比如浏览器）发来的请求。
 * 
 * 小朋友们可以这样理解：
 * 想象你是一个邮递员，NodeHandler就是你处理信件的方法：
 * 1. 你收到一封信(req: IncomingMessage)
 * 2. 你需要写一封回信(res: ServerResponse)
 * 3. 你可能立即回复，也可能需要一些时间才能回复(返回unknown或Promise<unknown>)
 * 
 * @param req - 收到的请求，包含了客户端发来的所有信息
 * @param res - 要发送的响应，用来向客户端返回数据
 * @returns 可以返回任何值或者一个Promise(表示异步处理)
 */
export type NodeHandler = (
  req: IncomingMessage,
  res: ServerResponse,
) => unknown | Promise<unknown>;

/**
 * NodeMiddleware类型 - Node.js中间件
 * 
 * 这也是一个函数类型，但比NodeHandler多了一个next参数，用于控制请求处理的流程。
 * 
 * 小朋友们可以这样理解：
 * 想象你在一个流水线上工作：
 * 1. 你收到一个产品(req: IncomingMessage)
 * 2. 你可以对这个产品做一些处理(使用res: ServerResponse)
 * 3. 处理完后，你可以：
 *    - 把产品传给下一个工人继续处理(调用next())
 *    - 如果发现产品有问题，你可以报告错误(调用next(error))
 *    - 你也可以完成所有工作，不再传给下一个工人
 * 
 * 中间件就像流水线上的一个工位，可以决定产品是继续流转还是停止处理。
 * 
 * @param req - 收到的请求
 * @param res - 要发送的响应
 * @param next - 一个函数，调用它表示继续处理请求，传入错误则表示处理出错
 * @returns 可以返回任何值或者一个Promise
 */
export type NodeMiddleware = (
  req: IncomingMessage,
  res: ServerResponse,
  next: (error?: Error) => void,
) => unknown | Promise<unknown>;
