/**
 * H3事件处理器模块
 * 
 * 这个文件定义了H3框架中的事件处理器相关函数和类型。
 * 事件处理器是整个框架的核心，负责处理HTTP请求并生成响应。
 * 
 * 可以把事件处理器想象成一个工人，当有人来敲门（请求）时，
 * 工人会根据不同的门铃声（请求类型）来决定如何响应。
 */

/**
 * 导入需要的类型
 * 
 * DynamicEventHandler: 动态事件处理器，可以在运行时更改
 * H3Event: H3事件对象，包含请求和响应信息
 * RequestMiddleware: 请求中间件，在处理请求前执行
 * ResponseMiddleware: 响应中间件，在发送响应前执行
 * EventHandler: 事件处理器函数，处理请求并返回响应
 * EventHandlerRequest: 事件处理器请求类型
 * EventHandlerResponse: 事件处理器响应类型
 * EventHandlerObject: 事件处理器对象，包含处理函数和钩子
 */
import type {
  DynamicEventHandler,
  H3Event,
  RequestMiddleware,
  ResponseMiddleware,
} from "./types";
import type {
  EventHandler,
  EventHandlerRequest,
  EventHandlerResponse,
  EventHandlerObject,
} from "./types";

/**
 * 事件处理器钩子类型
 * 
 * 钩子是在事件处理过程中的特定时刻执行的函数。
 * 它们允许我们在处理请求前和生成响应前插入自定义逻辑。
 * 
 * 这就像是工人在开门前和关门后要做的额外工作。
 * 
 * @template Request - 请求类型，默认为EventHandlerRequest
 * @template Response - 响应类型，默认为EventHandlerResponse
 */
type _EventHandlerHooks<
  Request extends EventHandlerRequest = EventHandlerRequest,
  Response extends EventHandlerResponse = EventHandlerResponse,
> = {
  /**
   * 请求前钩子，在处理请求前执行
   * 
   * 这就像是工人在开门前要做的准备工作，比如整理衣物、查看是谁来了等。
   */
  onRequest?: RequestMiddleware<Request>[];
  
  /**
   * 响应前钩子，在发送响应前执行
   * 
   * 这就像是工人在关门前要做的收尾工作，比如整理物品、确认没有遗漏什么等。
   */
  onBeforeResponse?: ResponseMiddleware<Request, Response>[];
};

/**
 * 定义事件处理器
 * 
 * 这个函数用于创建一个新的事件处理器函数。事件处理器可以是一个简单的函数，
 * 也可以是一个带有钩子的对象，允许在请求处理前后执行额外的逻辑。
 * 
 * 这就像是雇佣一个工人来处理特定类型的门铃（请求）。
 * 
 * @template Request - 请求类型，默认为EventHandlerRequest
 * @template Response - 响应类型，默认为EventHandlerResponse
 * @param handler - 事件处理器函数或对象
 * @returns 处理器函数
 */
export function defineEventHandler<
  Request extends EventHandlerRequest = EventHandlerRequest,
  Response = EventHandlerResponse,
>(
  handler:
    | EventHandler<Request, Response>
    | EventHandlerObject<Request, Response>,
): EventHandler<Request, Response>;

// TODO: 在适当的时候移除
// 这个签名提供了与之前签名的向后兼容性，其中第一个泛型是返回类型
/**
 * 定义事件处理器（兼容旧版签名）
 * 
 * 这是一个兼容旧版API的函数重载，允许使用旧的类型签名。
 * 
 * @template Request - 请求类型或响应类型（兼容旧版）
 * @template Response - 响应类型
 * @param handler - 事件处理器函数
 * @returns 处理器函数
 */
export function defineEventHandler<
  Request = EventHandlerRequest,
  Response = EventHandlerResponse,
>(
  handler: EventHandler<
    Request extends EventHandlerRequest ? Request : EventHandlerRequest,
    Request extends EventHandlerRequest ? Response : Request
  >,
): EventHandler<
  Request extends EventHandlerRequest ? Request : EventHandlerRequest,
  Request extends EventHandlerRequest ? Response : Request
>;

/**
 * 定义事件处理器的实现
 * 
 * 这是函数的实际实现部分，处理了函数和对象两种语法。
 * 
 * @template Request - 请求类型
 * @template Response - 响应类型
 * @param handler - 事件处理器函数或对象
 * @returns 处理器函数
 */
export function defineEventHandler<
  Request extends EventHandlerRequest,
  Response = EventHandlerResponse,
>(
  handler:
    | EventHandler<Request, Response>
    | EventHandlerObject<Request, Response>,
): EventHandler<Request, Response> {
  // 函数语法：如果handler是一个函数，直接返回它
  if (typeof handler === "function") {
    return handler;
  }
  
  // 对象语法：如果handler是一个对象，创建钩子并包装处理器
  const _hooks: _EventHandlerHooks<Request, Response> = {
    // 规范化请求钩子，确保它是一个数组
    onRequest: _normalizeArray(handler.onRequest),
    // 规范化响应钩子，确保它是一个数组
    onBeforeResponse: _normalizeArray(handler.onBeforeResponse),
  };
  
  // 创建一个新的处理器函数，它会调用原始处理器并应用钩子
  const _handler: EventHandler<Request, any> = (event) => {
    return _callHandler(event, handler.handler, _hooks);
  };
  
  // 复制原始处理器的resolve方法（用于路由解析）
  _handler.resolve = handler.handler.resolve;
  // 复制WebSocket相关的钩子
  _handler.websocket = { hooks: handler.websocket };
  
  // 返回新的处理器函数
  return _handler as EventHandler<Request, Response>;
}

/**
 * 规范化数组
 * 
 * 这个内部函数将输入转换为数组格式。如果输入已经是数组，则原样返回；
 * 如果输入是单个元素，则将其包装成数组；如果输入为空，则返回undefined。
 * 
 * 这就像是将不同形式的工具都整齐地放在工具箱里，方便使用。
 * 
 * @template T - 数组元素类型
 * @param input - 输入值，可以是单个元素或数组
 * @returns 规范化后的数组或undefined
 */
function _normalizeArray<T>(input?: T | T[]): T[] | undefined {
  // 如果有输入，则检查是否是数组；如果是，直接返回，否则将其包装为数组
  // 如果没有输入，返回undefined
  return input ? (Array.isArray(input) ? input : [input]) : undefined;
}

/**
 * 调用事件处理器并应用钩子
 * 
 * 这个内部函数执行事件处理器函数，并在处理前后应用相应的钩子。
 * 它首先执行所有的onRequest钩子，然后执行主处理器，最后执行所有的onBeforeResponse钩子。
 * 
 * 这就像是工人的工作流程：先准备（onRequest），然后处理门铃（handler），
 * 最后在关门前做最后的检查（onBeforeResponse）。
 * 
 * @template Request - 请求类型
 * @template Response - 响应类型
 * @param event - H3事件对象
 * @param handler - 事件处理器函数
 * @param hooks - 钩子对象
 * @returns 处理器的响应数据
 */
async function _callHandler<
  Request extends EventHandlerRequest = EventHandlerRequest,
  Response extends EventHandlerResponse = EventHandlerResponse,
>(
  event: H3Event,
  handler: EventHandler<Request, Response>,
  hooks: _EventHandlerHooks<Request, Response>,
): Promise<Awaited<Response> | undefined> {
  // 如果有请求前钩子，依次执行每个钩子
  if (hooks.onRequest) {
    for (const hook of hooks.onRequest) {
      await hook(event);
    }
  }
  
  // 执行主处理器函数并获取响应体
  const body = await handler(event);
  // 创建响应对象，包含响应体
  const response = { body };
  
  // 如果有响应前钩子，依次执行每个钩子
  if (hooks.onBeforeResponse) {
    for (const hook of hooks.onBeforeResponse) {
      await hook(event, response);
    }
  }
  
  // 返回最终的响应体（可能已被钩子修改）
  return response.body;
}

/**
 * 定义请求中间件
 * 
 * 这个函数用于创建请求中间件函数。请求中间件在主事件处理器执行前运行，
 * 可以用于验证、日志记录、请求转换等操作。
 * 
 * 这就像是工人在开门前的准备工作，比如查看是谁来了、检查证件等。
 * 
 * @template Request - 请求类型，默认为EventHandlerRequest
 * @param fn - 请求中间件函数
 * @returns 请求中间件函数（原样返回）
 */
export function defineRequestMiddleware<
  Request extends EventHandlerRequest = EventHandlerRequest,
>(fn: RequestMiddleware<Request>): RequestMiddleware<Request> {
  // 直接返回中间件函数，不做任何修改
  // 这个函数主要是为了提供类型安全和代码可读性
  return fn;
}

/**
 * 定义响应中间件
 * 
 * 这个函数用于创建响应中间件函数。响应中间件在主事件处理器执行后、
 * 响应发送前运行，可以用于修改响应、添加头部、压缩数据等操作。
 * 
 * 这就像是工人在关门前的收尾工作，比如整理物品、确认没有遗漏什么等。
 * 
 * @template Request - 请求类型，默认为EventHandlerRequest
 * @param fn - 响应中间件函数
 * @returns 响应中间件函数（原样返回）
 */
export function defineResponseMiddleware<
  Request extends EventHandlerRequest = EventHandlerRequest,
>(fn: ResponseMiddleware<Request>): ResponseMiddleware<Request> {
  // 直接返回中间件函数，不做任何修改
  // 这个函数主要是为了提供类型安全和代码可读性
  return fn;
}

/**
 * 定义动态事件处理器
 * 
 * 这个函数创建一个可以在运行时更改的事件处理器。它允许你在应用运行过程中
 * 动态地切换处理逻辑，而不需要重启服务器。
 * 
 * 这就像是一个可以随时更换的工人。今天可能是小明来处理门铃，
 * 明天可能换成小红，但门铃响起时总会有人去应答。
 * 
 * 例如：当你需要在不同的处理逻辑之间切换时，比如在开发模式和生产模式之间切换，
 * 或者需要在运行时更新路由规则时，这个函数非常有用。
 * 
 * @param initial - 初始事件处理器，可选
 * @returns 动态事件处理器对象，带有set方法用于更新处理器
 */
export function dynamicEventHandler(
  initial?: EventHandler,
): DynamicEventHandler {
  // 保存当前处理器的引用
  let current: EventHandler | undefined = initial;
  
  // 创建一个包装处理器，它会调用当前设置的处理器
  const wrapper = defineEventHandler((event) => {
    if (current) {
      return current(event);
    }
  }) as DynamicEventHandler;
  
  // 添加set方法，允许动态更新处理器
  wrapper.set = (handler) => {
    current = handler;
  };
  
  return wrapper;
}

/**
 * 定义懒加载事件处理器
 * 
 * 这个函数创建一个延迟加载的事件处理器。处理器的实际逻辑只有在第一次需要时
 * 才会被加载，这可以提高应用的启动速度和减少内存使用。
 * 
 * 这就像是一个按需工作的工人。工人不会一直站在门口等待，只有当门铃真的响了，
 * 他才会从休息室出来工作。这样可以节省工人的精力。
 * 
 * 例如：当你有一些很少使用但很复杂的路由处理器时，使用懒加载可以避免在启动时
 * 就加载所有代码，从而加快应用启动速度。
 * 
 * @param load - 加载函数，返回实际的事件处理器或其Promise
 * @returns 懒加载包装的事件处理器
 */
export function defineLazyEventHandler(
  load: () => Promise<EventHandler> | EventHandler,
): EventHandler {
  // 用于存储加载Promise和已解析的处理器
  let _promise: Promise<typeof _resolved>;
  let _resolved: { handler: EventHandler };

  /**
   * 解析处理器函数
   * 
   * 这个内部函数负责加载实际的处理器。它确保处理器只被加载一次，
   * 并在后续调用中重用已加载的处理器。
   * 
   * @returns 包含处理器的Promise对象
   */
  const resolveHandler = () => {
    // 如果处理器已经被解析，直接返回
    if (_resolved) {
      return Promise.resolve(_resolved);
    }
    // 如果Promise还没创建，创建并处理它
    if (!_promise) {
      _promise = Promise.resolve(load()).then((r: any) => {
        // 获取处理器（支持ESM和CommonJS模块格式）
        const handler = r.default || r;
        // 验证处理器是一个函数
        if (typeof handler !== "function") {
          throw new (TypeError as any)(
            "Invalid lazy handler result. It should be a function:",
            handler,
          );
        }
        // 保存解析后的处理器
        _resolved = { handler: r.default || r };
        return _resolved;
      });
    }
    // 返回Promise
    return _promise;
  };

  /**
   * 创建懒加载处理器函数
   * 
   * 这个函数是实际暴露给外部的处理器。它会在需要时加载实际的处理器，
   * 并将事件传递给它。
   * 
   * @param event - H3事件对象
   * @returns 处理结果的Promise
   */
  const handler: EventHandler = (event) => {
    // 如果处理器已加载，直接使用
    if (_resolved) {
      return _resolved.handler(event);
    }
    // 否则，先加载处理器，然后使用
    return resolveHandler().then((r) => r.handler(event));
  };

  /**
   * 解析路由方法
   * 
   * 这个方法用于路由匹配。它会加载实际的处理器，并调用其resolve方法（如果存在）。
   * 
   * @param method - HTTP方法
   * @param path - 请求路径
   * @returns 解析结果的Promise
   */
  handler.resolve = (method, path) =>
    Promise.resolve(
      resolveHandler().then(({ handler }) =>
        handler.resolve ? handler.resolve(method, path) : { handler },
      ),
    );

  return handler;
}
