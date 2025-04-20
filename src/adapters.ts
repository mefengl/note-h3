/**
 * 适配器文件 - adapters.ts
 * 
 * 这个文件的作用是什么？
 * 这个文件提供了不同环境之间的转换适配器，就像不同插座之间的转换器一样。
 * 它允许H3框架在不同的环境（比如Web环境和Node.js环境）中工作。
 * 
 * 为什么需要适配器？
 * 想象一下，你有一个中国插头的电器，但是你去了美国，那里的插座形状不一样。
 * 你需要一个转换器才能使用你的电器。这个文件就是做这样的事情，
 * 但是是为了让代码在不同的环境中工作。
 */

// 从Node.js的http模块导入类型，这些是处理网络请求和响应的基本类型
import type { IncomingMessage, ServerResponse } from "node:http";
// 导入Node.js特定的处理器类型
import type { NodeHandler, NodeMiddleware } from "./types/node";
// 导入H3框架的核心类型
import type {
  H3,
  EventHandler,
  H3EventContext,
  EventHandlerResponse,
} from "./types";
// 从srvx/node导入一个函数，用于将H3处理器转换为Node.js处理器
import { toNodeHandler as _toNodeHandler } from "srvx/node";
// 导入创建错误的函数
import { createError } from "./error";
// 导入表示请求已处理的常量
import { kHandled } from "./response";

/**
 * 将H3应用转换为Web处理器函数
 * 
 * 这个函数就像一个翻译官，它把H3应用转换成Web环境能理解的语言。
 * 
 * 小朋友们可以这样理解：
 * 想象你有一本中文故事书(H3应用)，但你的外国朋友只懂英语。
 * 这个函数就像一个翻译，把中文故事(H3应用)翻译成英语(Web处理器)，
 * 这样你的外国朋友(Web环境)就能理解这个故事了。
 * 
 * @param app - H3应用实例，就像我们要翻译的中文故事书
 * @returns 返回一个Web处理器函数，它接收Web请求并返回Web响应
 */
export function toWebHandler(
  app: H3,
): (request: Request, context?: H3EventContext) => Promise<Response> {
  return (request, context) => {
    // 使用H3应用的fetch方法处理请求，并将结果包装在Promise中返回
    return Promise.resolve(app.fetch(request, { h3: context }));
  };
}

/**
 * 将Web处理器函数转换为H3事件处理器
 * 
 * 这个函数与toWebHandler正好相反，它把Web处理器转换回H3可以理解的事件处理器。
 * 
 * 小朋友们可以这样理解：
 * 如果toWebHandler是把中文翻译成英文，那么fromWebHandler就是把英文翻译回中文。
 * 想象你的外国朋友写了一封英文信(Web处理器)，但你的中国朋友只看得懂中文。
 * 这个函数就像翻译官，把英文信(Web处理器)翻译成中文(H3事件处理器)，
 * 这样你的中国朋友(H3框架)就能理解这封信了。
 * 
 * @param handler - Web处理器函数，接收Web请求并返回Web响应
 * @returns 返回一个H3事件处理器，可以被H3框架使用
 */
export function fromWebHandler(
  handler: (request: Request, context?: H3EventContext) => Promise<Response>,
): EventHandler {
  // 返回一个函数，它接收H3事件对象，然后调用Web处理器函数处理请求
  return (event) => handler(event.request, event.context);
}

/**
 * 将Node.js处理器函数转换为H3事件处理器
 *
 * 这个函数就像一个特殊的翻译官，它把Node.js的处理器函数转换成H3可以理解的事件处理器。
 * 
 * 小朋友们可以这样理解：
 * 想象你有一个会说日语的机器人(Node.js处理器)，但你只懂中文。
 * 这个函数就像一个翻译器，它让日语机器人(Node.js处理器)可以用中文(H3事件)
 * 与你交流，这样你就能理解机器人在说什么了。
 *
 * **注意：** 返回的事件处理器需要在h3 Node.js处理器中执行才能正常工作。
 * 就像翻译器需要在特定的环境中才能正常工作一样。
 */
export function fromNodeHandler(handler: NodeMiddleware): EventHandler;
export function fromNodeHandler(handler: NodeHandler): EventHandler;
export function fromNodeHandler(
  handler: NodeHandler | NodeMiddleware,
): EventHandler {
  // 检查传入的处理器是否是一个函数，如果不是则抛出错误
  if (typeof handler !== "function") {
    throw new TypeError(`Invalid handler. It should be a function: ${handler}`);
  }
  // 返回一个新的函数，这个函数接收H3事件对象
  return (event) => {
    // 检查事件对象是否包含node属性，如果没有则抛出错误
    // 这就像检查翻译器是否具备翻译日语的能力
    if (!event.node) {
      throw new Error(
        "[h3] Executing Node.js middleware is not supported in this server!",
      );
    }
    // 调用callNodeHandler函数来处理Node.js处理器
    // 将事件对象中的req和res传给Node.js处理器
    return callNodeHandler(
      handler,
      event.node.req,
      event.node.res,
    ) as EventHandlerResponse;
  };
}

/**
 * 定义一个Node.js处理器
 * 
 * 这个函数其实很简单，它只是原样返回传入的处理器。它的主要作用是提供类型提示和代码可读性。
 * 
 * 小朋友们可以这样理解：
 * 想象你在画画，你给一支铅笔贴上标签“这是铅笔”。铅笔本身没有变，
 * 但标签可以帮助别人知道这是什么。这个函数就是贴标签的过程。
 * 
 * @param handler - 要定义的Node.js处理器
 * @returns 原样返回传入的处理器
 */
export function defineNodeHandler(handler: NodeHandler) {
  return handler;
}

/**
 * 定义一个Node.js中间件
 * 
 * 与defineNodeHandler类似，这个函数也只是原样返回传入的中间件。它的主要作用是提供类型提示和代码可读性。
 * 
 * 小朋友们可以这样理解：
 * 想象你在画画，你给一支彩笔贴上标签“这是彩笔”。彩笔本身没有变，
 * 但标签可以帮助别人知道这是什么。这个函数就是贴标签的过程。
 * 
 * 中间件和处理器的区别在于，中间件可以在处理请求的过程中插入额外的逻辑，
 * 就像在你画画的过程中，有人可以帮你添加一些特效或者建议。
 * 
 * @param handler - 要定义的Node.js中间件
 * @returns 原样返回传入的中间件
 */
export function defineNodeMiddleware(handler: NodeMiddleware) {
  return handler;
}

/**
 * 将H3应用实例转换为Node.js处理器
 * 
 * 这个函数将H3应用转换成Node.js可以理解的处理器函数。
 * 
 * 小朋友们可以这样理解：
 * 想象你有一个玩具机器人(H3应用)，但它只能在一种特定的玩具工厂(H3环境)里工作。
 * 现在你想把这个机器人带到另一个工厂(Node.js环境)去工作。
 * 这个函数就像一个适配器，它让你的机器人可以在新的工厂里正常工作。
 * 
 * @param app - H3应用实例，就像你的机器人
 * @returns 返回一个Node.js处理器，可以在Node.js环境中使用
 */
export function toNodeHandler(app: H3): NodeHandler {
  // 使用导入的_toNodeHandler函数将H3应用的fetch方法转换为Node.js处理器
  return _toNodeHandler(app.fetch);
}

/**
 * 调用Node.js处理器或中间件
 * 
 * 这个函数负责安全地调用Node.js处理器或中间件，并处理各种可能的结果和错误情况。
 * 
 * 小朋友们可以这样理解：
 * 想象你请一个工人(处理器)来修理你的玩具。这个函数就像一个管家，它：
 * 1. 给工人提供工具(req和res)
 * 2. 等待工人完成工作
 * 3. 如果工作顺利完成，就通知你工作完成了
 * 4. 如果出了问题，就告诉你出了什么问题
 * 
 * 中间件和普通处理器的区别在于，中间件可以决定是否要继续处理请求。
 * 就像一个检查员可以决定是否让工人继续修理玩具。
 * 
 * @param handler - Node.js处理器或中间件函数
 * @param req - Node.js的请求对象
 * @param res - Node.js的响应对象
 * @returns 返回一个Promise，表示处理结果
 */
function callNodeHandler(
  handler: NodeHandler | NodeMiddleware,
  req: IncomingMessage,
  res: ServerResponse,
) {
  // 检查处理器是否是中间件，中间件函数有三个参数(req, res, next)
  const isMiddleware = handler.length > 2;
  
  // 返回一个Promise，表示处理过程
  return new Promise((resolve, reject) => {
    // 监听响应对象的各种事件，并在事件发生时解决或拒绝Promise
    // 就像管家在关注工作的不同状态
    res.once("close", () => resolve(kHandled));  // 当连接关闭时，表示已处理
    res.once("finish", () => resolve(kHandled)); // 当响应结束时，表示已处理
    res.once("pipe", () => resolve(kHandled));   // 当响应被管道化时，表示已处理
    res.once("error", (error) => reject(error)); // 当发生错误时，拒绝Promise
    
    try {
      // 根据处理器类型不同，采用不同的调用方式
      if (isMiddleware) {
        // 如果是中间件，需要提供一个next回调函数
        Promise.resolve(
          handler(req, res, (err) =>
            // next回调函数，如果有错误则拒绝，否则解决Promise
            err ? reject(createError(err)) : resolve(void 0),
          ),
        ).catch((error) => reject(createError(error)));
      } else {
        // 如果是普通处理器，直接调用并处理结果
        return Promise.resolve((handler as NodeHandler)(req, res))
          .then(() => resolve(kHandled))  // 成功时解决Promise
          .catch((error) => reject(createError(error))); // 失败时拒绝Promise
      }
    } catch (error: any) {
      // 捕获并处理任何在调用过程中发生的错误
      reject(createError(error));
    }
  });
}
