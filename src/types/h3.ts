/**
 * H3核心类型定义文件
 * 
 * 这个文件定义了H3框架的核心类型，包括H3服务器实例、配置选项和相关接口。
 * 这些类型是整个框架的基础，定义了如何创建和配置H3服务器。
 */

// 导入WebSocket相关类型，用于实时通信
import type * as crossws from "crossws";
// 导入H3事件类型，表示一个HTTP请求/响应对
import type { H3Event } from "./event";
// 导入事件处理相关类型，用于处理HTTP请求
import type {
  EventHandler,
  EventHandlerRequest,
  ResolvedEventHandler,
} from "./handler";
// 导入错误类型，用于处理和格式化错误
import type { H3Error } from "../error";
// 导入HTTP方法类型，如GET、POST等
import type { HTTPMethod } from "./http";
// 导入事件上下文类型，用于存储额外信息
import type { H3EventContext } from "./context";

// 重新导出错误类型，方便其他模块使用
export type { H3Error } from "../error";

/**
 * H3服务器配置接口
 * 
 * 这个接口定义了创建和配置H3服务器的选项。
 * 
 * 这就像是餐厅的营业手册，定义了餐厅如何运营、如何处理特殊情况，
 * 以及各种工作流程。
 */
export interface H3Config {
  /**
   * 调试模式
   * 
   * 当设置为true时，会输出更多的调试信息。
   * 这就像是餐厅的实习模式，每个步骤都会有更详细的检查和记录。
   */
  debug?: boolean;
  
  /**
   * WebSocket选项
   * 
   * 配置WebSocket功能的选项，用于实时双向通信。
   * 这就像是餐厅的即时通讯系统，允许厨师和服务员实时交流。
   */
  websocket?: WebSocketOptions;

  /**
   * 错误处理函数
   * 
   * 当服务器发生错误时调用的函数。
   * 这就像是餐厅的突发事件处理程序，当发生问题时（如菜品做错或没有库存），
   * 决定如何处理和响应。
   * 
   * @param error - 发生的错误
   * @param event - 当前的H3事件
   * @returns 可能是一个Promise，可能返回void或其他值
   */
  onError?: (error: H3Error, event: H3Event) => MaybePromise<void | unknown>;
  
  /**
   * 请求处理前函数
   * 
   * 在每个请求被处理前调用的函数。
   * 这就像是餐厅的迎宾程序，在顾客点餐前进行的准备工作，
   * 比如检查座位、提供菜单等。
   * 
   * @param event - 当前的H3事件
   * @returns 可能是一个Promise
   */
  onRequest?: (event: H3Event) => MaybePromise<void>;
  
  /**
   * 响应发送前函数
   * 
   * 在响应发送给客户端前调用的函数。
   * 这就像是餐厅的上菜前检查，确保菜品的外观和质量符合标准，
   * 可能还会进行最后的装饰或调整。
   * 
   * @param event - 当前的H3事件
   * @param response - 准备发送的响应
   * @returns 可能是一个Promise
   */
  onBeforeResponse?: (
    event: H3Event,
    response: Response | PreparedResponse,
  ) => MaybePromise<void>;
}

/**
 * 准备好的响应类型
 * 
 * 这个类型定义了一个准备好的HTTP响应，包含响应初始化选项和响应体。
 * 
 * 这就像是已经准备好的菜品，包括菜品本身和其外观、温度等属性。
 * 服务员只需要把它拿给顾客就可以了。
 */
export type PreparedResponse = ResponseInit & { body?: BodyInit | null };

/**
 * WebSocket选项接口
 * 
 * 这个接口定义了WebSocket连接的配置选项。WebSocket是一种允许服务器
 * 和客户端之间进行实时双向通信的协议。
 * 
 * 这就像是餐厅的即时通讯系统的设置，允许厨师和服务员实时交流，
 * 而不需要服务员不断地跑来跑去传递信息。
 */
export interface WebSocketOptions {
  /**
   * 解析钩子
   * 
   * 用于解析WebSocket连接请求的钩子函数。
   * 这就像是决定哪些人可以使用餐厅的即时通讯系统的规则。
   */
  resolve?: crossws.ResolveHooks;
  
  /**
   * 事件钩子
   * 
   * WebSocket连接生命周期中的各种事件钩子，如连接、消息、关闭等。
   * 这就像是定义当有人连接、发送消息或断开连接时餐厅应该如何响应。
   */
  hooks?: Partial<crossws.Hooks>;
  
  /**
   * 适配器钩子
   * 
   * 用于不同平台适配器的钩子函数。
   * 这就像是餐厅如何适应不同的通讯设备，比如电话、对讲机或手机应用。
   */
  adapterHooks?: Partial<crossws.AdapterHooks>;
}

/**
 * H3路由接口
 * 
 * 这个接口定义了一个HTTP路由，包含路径、HTTP方法和处理函数。
 * 路由决定了哪个处理函数处理哪个请求。
 * 
 * 这就像是餐厅的菜单项，定义了哪个厨师负责哪类菜品。
 * 当顾客点了“北京烤鸭”，这个订单就会被路由到专门做烤鸭的厨师那里。
 */
export interface H3Route {
  /**
   * 路由路径
   * 
   * 路由匹配的URL路径模式，如"/users/:id"。
   * 这就像是菜单上的菜品名称，指定了这个路由处理什么请求。
   */
  route?: string;
  
  /**
   * HTTP方法
   * 
   * 路由匹配的HTTP方法，如GET、POST等。
   * 这就像是菜品的烹饪方式，比如“炒”、“焖”或“烤”。
   */
  method?: HTTPMethod;
  
  /**
   * 处理函数
   * 
   * 当路由匹配时执行的函数。
   * 这就像是负责制作这道菜的厨师。
   */
  handler: EventHandler;
}

/**
 * 添加路由类型
 * 
 * 这个类型定义了添加路由的函数签名。
 * 
 * 这就像是向餐厅菜单添加新菜品的方法，指定菜品名称和负责的厨师。
 * 
 * @param route - 路由路径
 * @param handler - 处理函数或H3实例
 * @returns H3实例，允许链式调用
 */
type AddRoute = (route: string, handler: EventHandler | H3) => H3;

/**
 * 可能是Promise类型
 * 
 * 这个类型表示一个值可能是同步的，也可能是异步的Promise。
 * 
 * 这就像是餐厅的点餐响应，可能是立即给出的（“有现成菜”），
 * 也可能需要等待一段时间（“需要现做，请稍等”）。
 * 
 * @template T - 值的类型，默认为unknown
 */
type MaybePromise<T = unknown> = T | Promise<T>;

/**
 * H3服务器接口
 * 
 * 这个接口定义了H3服务器实例的结构和方法。H3服务器是整个框架的核心，
 * 负责处理HTTP请求和路由。
 * 
 * 这就像是整个餐厅的管理系统，协调所有的厨师、服务员和设备，
 * 确保顾客的请求被正确处理。
 */
export interface H3 {
  /**
   * 服务器配置
   * 
   * H3服务器的配置选项。
   * 这就像是餐厅的营业规则和设置。
   */
  readonly config: H3Config;

  /**
   * WebSocket选项
   * 
   * 服务器的WebSocket配置，用于实时双向通信。
   * 这就像是餐厅的即时通讯系统设置。
   */
  websocket: WebSocketOptions;

  /**
   * 发送请求
   * 
   * 发送HTTP请求并获取响应的方法。
   * 这就像是餐厅向其他餐厅或供应商发送订单的方式。
   * 
   * @param request - 请求对象、URL或字符串
   * @param options - 请求选项和上下文
   * @returns 响应对象或其Promise
   */
  fetch(
    request: Request | URL | string,
    options?: RequestInit & { h3?: H3EventContext },
  ): Response | Promise<Response>;

  /**
   * 主事件处理器
   * 
   * 服务器的主要事件处理函数，处理所有传入的HTTP请求。
   * 这就像是餐厅的总经理，负责协调所有的点餐请求。
   */
  handler: EventHandler<EventHandlerRequest, MaybePromise<unknown>>;
  
  /**
   * 内部事件处理器
   * 
   * 内部使用的事件处理函数，不应直接调用。
   * 这就像是餐厅的副经理，协助总经理处理内部事务。
   */
  _handler: EventHandler<EventHandlerRequest, MaybePromise<unknown>>;

  /**
   * 解析事件处理器
   * 
   * 根据HTTP方法和路径解析出匹配的事件处理器。
   * 这就像是餐厅的点餐系统，根据顾客的要求决定哪个厨师来处理这个订单。
   * 
   * @param method - HTTP方法
   * @param path - 请求路径
   * @returns 解析出的处理器或undefined的Promise
   */
  resolve: (
    method: HTTPMethod,
    path: string,
  ) => Promise<ResolvedEventHandler | undefined>;

  /**
   * 添加中间件或路由
   * 
   * 向服务器添加中间件或路由处理器。
   * 这就像是餐厅添加新的工作流程或菜单项。
   * 
   * @param route - 路由路径
   * @param handler - 处理函数或H3实例
   * @param details - 路由详情
   * @returns H3实例，允许链式调用
   */
  use(
    route: string,
    handler: EventHandler | H3,
    details?: Partial<H3Route>,
  ): H3;
  
  /**
   * 添加中间件
   * 
   * 向服务器添加全局中间件。
   * 这就像是餐厅添加新的工作流程，应用于所有订单。
   * 
   * @param handler - 处理函数或H3实例
   * @param details - 路由详情
   * @returns H3实例，允许链式调用
   */
  use(handler: EventHandler | H3, details?: Partial<H3Route>): H3;
  
  /**
   * 添加路由对象
   * 
   * 向服务器添加路由对象。
   * 这就像是餐厅添加一个完整定义的菜单项。
   * 
   * @param details - 路由对象
   * @returns H3实例，允许链式调用
   */
  use(details: H3Route): H3;

  /**
   * 添加指定HTTP方法的路由
   * 
   * 向服务器添加特定HTTP方法的路由处理器。
   * 这就像是餐厅添加一个特定烹饪方式的菜单项。
   * 
   * @param method - HTTP方法
   * @param path - 路由路径
   * @param handler - 处理函数或H3实例
   * @returns H3实例，允许链式调用
   */
  on: (
    method: "" | HTTPMethod | Lowercase<HTTPMethod>,
    path: string,
    handler: EventHandler | H3,
  ) => H3;
  
  /**
   * 添加支持所有HTTP方法的路由
   * 
   * 向服务器添加一个处理所有HTTP方法的路由。
   * 这就像是餐厅添加一个万能菜品，无论顾客如何要求，都由同一个厨师处理。
   */
  all: AddRoute;
  
  /**
   * 添加GET方法的路由
   * 
   * 向服务器添加一个处理GET请求的路由。
   * 这就像是餐厅添加一个只提供查询服务的菜单项。
   */
  get: AddRoute;
  
  /**
   * 添加POST方法的路由
   * 
   * 向服务器添加一个处理POST请求的路由。
   * 这就像是餐厅添加一个只接受新订单的菜单项。
   */
  post: AddRoute;
  
  /**
   * 添加PUT方法的路由
   * 
   * 向服务器添加一个处理PUT请求的路由。
   * 这就像是餐厅添加一个只接受更新订单的菜单项。
   */
  put: AddRoute;
  
  /**
   * 添加DELETE方法的路由
   * 
   * 向服务器添加一个处理DELETE请求的路由。
   * 这就像是餐厅添加一个只接受取消订单的菜单项。
   */
  delete: AddRoute;
  
  /**
   * 添加PATCH方法的路由
   * 
   * 向服务器添加一个处理PATCH请求的路由。
   * 这就像是餐厅添加一个只接受部分修改订单的菜单项。
   */
  patch: AddRoute;
  
  /**
   * 添加HEAD方法的路由
   * 
   * 向服务器添加一个处理HEAD请求的路由。
   * 这就像是餐厅添加一个只提供菜品信息而不提供实际菜品的菜单项。
   */
  head: AddRoute;
  
  /**
   * 添加OPTIONS方法的路由
   * 
   * 向服务器添加一个处理OPTIONS请求的路由。
   * 这就像是餐厅添加一个只提供菜品可用选项的菜单项。
   */
  options: AddRoute;
  
  /**
   * 添加CONNECT方法的路由
   * 
   * 向服务器添加一个处理CONNECT请求的路由。
   * 这就像是餐厅添加一个建立特殊连接的菜单项。
   */
  connect: AddRoute;
  
  /**
   * 添加TRACE方法的路由
   * 
   * 向服务器添加一个处理TRACE请求的路由。
   * 这就像是餐厅添加一个只用于跟踪订单过程的菜单项。
   */
  trace: AddRoute;
}
