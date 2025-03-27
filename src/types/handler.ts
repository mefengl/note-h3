/**
 * 处理器类型定义文件
 * 
 * 这个文件定义了H3框架中处理HTTP请求的各种处理器类型。
 * 处理器是H3框架的核心概念，它们负责接收HTTP请求并返回响应。
 * 就像餐厅里的厨师接到订单(请求)后准备食物(响应)一样。
 */

// 导入其他必要的类型定义
import type { H3Event } from "./event";  // 导入H3Event类型，表示HTTP事件
import type { Hooks as WSHooks } from "crossws";  // 导入WebSocket钩子类型
import type { HTTPMethod } from "./http";  // 导入HTTP方法类型(如GET、POST等)
import type { H3 } from "./h3";  // 导入H3主类型

/**
 * 事件处理器响应类型
 * 
 * 这个类型定义了处理器可以返回的响应格式。
 * 它可以是任何类型(T)或者是一个Promise(异步操作)，最终会解析为类型T。
 * 就像你点了一份食物，厨师可能立刻给你(同步)，也可能需要一些时间准备(异步Promise)。
 */
export type EventHandlerResponse<T = unknown> = T | Promise<T>;

/**
 * 事件处理器请求接口
 * 
 * 这个接口定义了HTTP请求中可能包含的数据结构。
 * 就像你去餐厅点餐时填写的订单，上面有你想要的食物和特殊要求。
 */
export interface EventHandlerRequest {
  /** 
   * 请求体 - 包含POST请求等发送的数据
   * 就像你在订单上写的具体食物要求
   */
  body?: unknown;
  
  /** 
   * 查询参数 - URL中?后面的参数，如?name=value
   * 就像你在订单上标注的额外选项，例如"不要辣"、"多加糖"
   */
  query?: Record<string, string>;
  
  /** 
   * 路由参数 - URL路径中的动态部分，如/users/:id中的id
   * 就像餐厅里的桌号，告诉服务员食物应该送到哪里
   */
  routerParams?: Record<string, string>;
}

/**
 * 推断事件输入类型
 * 
 * 这是一个高级类型，用于自动推断事件处理器中的输入类型。
 * 对于小学生来说，可以把它想象成一个魔法盒子，能够自动识别你的请求中包含什么信息。
 * 比如它能知道你的请求是要查询菜单还是下订单。
 */
export type InferEventInput<
  Key extends keyof EventHandlerRequest,
  Event extends H3Event,
  T,
> = void extends T ? (Event extends H3Event<infer E> ? E[Key] : never) : T;

/**
 * 可能是Promise的类型
 * 
 * 这个类型表示一个值可能是立即可用的(T)，也可能需要等待(Promise<T>)。
 * 就像你点的食物，可能已经做好了，也可能需要等一会儿才能上桌。
 */
type MaybePromise<T> = T | Promise<T>;

/**
 * 已解析的事件处理器
 * 
 * 当路由系统找到匹配的处理器时，会创建这个对象。
 * 它包含了处理这个请求所需的所有信息。
 * 就像餐厅收到订单后，确定了负责这个订单的厨师和需要准备的菜品。
 */
export type ResolvedEventHandler = {
  /** HTTP方法，如GET、POST等 */
  method?: HTTPMethod;
  /** 匹配的路由路径 */
  route?: string;
  /** 处理这个请求的函数 */
  handler?: EventHandler;
  /** 从URL中提取的参数 */
  params?: Record<string, string>;
};

/**
 * 事件处理器解析器
 * 
 * 这个函数类型用于根据HTTP方法和路径找到对应的处理器。
 * 就像餐厅里的接待员，根据客人的需求(方法和路径)找到合适的服务员和厨师(处理器)。
 */
export type EventHandlerResolver = (
  /** HTTP方法，如GET、POST */
  method: HTTPMethod,
  /** 请求的URL路径 */
  path: string,
) => MaybePromise<undefined | ResolvedEventHandler>;

/**
 * 事件处理器接口
 * 
 * 这是H3框架的核心类型，定义了处理HTTP请求的函数。
 * 一个处理器接收一个事件(请求)并返回一个响应。
 * 
 * 就像厨师接收订单并准备食物：
 * - 事件(event)就是订单，包含客人想要的东西
 * - 响应(Response)就是准备好的食物
 */
export interface EventHandler<
  Request extends EventHandlerRequest = EventHandlerRequest,
  Response extends EventHandlerResponse = EventHandlerResponse,
> extends Partial<Pick<H3, "handler" | "resolve" | "config" | "websocket">> {
  /**
   * 处理函数本身
   * @param event HTTP事件对象，包含请求信息
   * @returns 返回响应数据
   */
  (event: H3Event<Request>): Response;
}

/**
 * 请求中间件
 * 
 * 中间件是在主处理器之前或之后运行的函数。
 * 请求中间件在处理请求之前运行，可以修改请求或执行额外操作。
 * 
 * 想象一下，这就像餐厅里的预处理步骤：
 * - 服务员在把订单交给厨师之前，先检查订单是否完整
 * - 或者确认客人是否有会员卡可以享受折扣
 */
export type RequestMiddleware<
  Request extends EventHandlerRequest = EventHandlerRequest,
> = (event: H3Event<Request>) => void | Promise<void>;

/**
 * 响应中间件
 * 
 * 响应中间件在生成响应之后、发送给客户端之前运行。
 * 它可以修改响应内容或添加额外信息。
 * 
 * 就像食物做好后，上菜前的最后处理：
 * - 厨师完成料理后，服务员在端给客人前可能会添加装饰
 * - 或者在账单上添加优惠信息
 */
export type ResponseMiddleware<
  Request extends EventHandlerRequest = EventHandlerRequest,
  Response extends EventHandlerResponse = EventHandlerResponse,
> = (
  /** HTTP事件对象 */
  event: H3Event<Request>,
  /** 响应对象，包含响应体 */
  response: { body?: Awaited<Response> },
) => void | Promise<void>;

/**
 * 事件处理器对象
 * 
 * 这是一个更复杂的处理器结构，除了主处理函数外，还包含中间件和钩子。
 * 它允许你在请求处理的不同阶段执行代码。
 * 
 * 就像一个完整的餐厅服务流程：
 * - 迎宾(onRequest)：客人进门时的接待
 * - 主厨(handler)：准备食物的核心环节
 * - 上菜(onBeforeResponse)：将食物端给客人前的最后准备
 */
export type EventHandlerObject<
  Request extends EventHandlerRequest = EventHandlerRequest,
  Response extends EventHandlerResponse = EventHandlerResponse,
> = {
  /** 
   * 请求前中间件 - 在主处理器之前执行
   * 可以是单个函数或函数数组
   */
  onRequest?: RequestMiddleware<Request> | RequestMiddleware<Request>[];
  
  /**
   * 响应前中间件 - 在生成响应后、发送前执行
   * 可以是单个函数或函数数组
   */
  onBeforeResponse?:
    | ResponseMiddleware<Request, Response>
    | ResponseMiddleware<Request, Response>[];
  
  /** 
   * WebSocket钩子 - 用于处理WebSocket连接
   * 这是一个实验性功能，就像餐厅正在测试的新服务
   * @experimental 
   */
  websocket?: Partial<WSHooks>;
  
  /**
   * 主处理函数 - 处理请求并生成响应的核心函数
   * 就像厨师准备食物的主要步骤
   */
  handler: EventHandler<Request, Response>;
};

/**
 * 懒加载事件处理器
 * 
 * 这种处理器不会立即创建，而是在需要时才创建。
 * 这可以节省资源，特别是对于不常用的路由。
 * 
 * 就像餐厅里的特殊菜品，不会提前准备，只有在客人点餐时才开始制作。
 */
export type LazyEventHandler = () => EventHandler | Promise<EventHandler>;

/**
 * 动态事件处理器
 * 
 * 这种处理器可以在运行时更改其行为。
 * 通过set方法可以替换处理函数。
 * 
 * 就像餐厅可以根据当天的情况更换菜单或厨师。
 */
export interface DynamicEventHandler extends EventHandler {
  /**
   * 设置新的处理函数
   * @param handler 新的处理函数
   */
  set: (handler: EventHandler) => void;
}
