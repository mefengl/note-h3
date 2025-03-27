/**
 * H3事件类型定义文件
 * 
 * 这个文件定义了H3框架中的事件类型，事件是整个框架的核心概念。
 * 在H3中，每一个HTTP请求都会被转换为一个H3Event对象，包含了请求和响应的所有信息。
 */

// 导入需要的类型
// EventHandlerRequest: 事件处理器请求类型
// H3EventContext: H3事件上下文
// HTTPMethod: HTTP请求方法（GET、POST等）
import type { EventHandlerRequest, H3EventContext, HTTPMethod } from ".";
// ServerRequest: 服务器请求对象，来自srvx库
import type { ServerRequest } from "srvx/types";

/**
 * H3事件接口
 * 
 * 这个接口定义了H3事件的结构，它是整个框架的核心。每一个HTTP请求都会被转换为
 * 一个H3Event对象，并传递给事件处理器函数。
 * 
 * 这就像是餐厅里的点餐单，包含了顾客的所有要求和信息，服务员会把它交给厨师处理。
 * 
 * @template _RequestT - 请求类型，默认为EventHandlerRequest
 */
export interface H3Event<
  _RequestT extends EventHandlerRequest = EventHandlerRequest,
> {
  /**
   * 事件上下文
   * 
   * 存储了与这个请求相关的额外信息，如用户数据、路由参数等。
   * 这就像是点餐单上的特殊注释，比如“不要放辣”或“这是VIP顾客”。
   */
  readonly context: H3EventContext;

  /**
   * Node.js特定属性
   * 
   * 当在Node.js环境中运行时，这里包含原生Node.js的请求和响应对象。
   * 这就像是特定厂商的点餐系统专用信息。
   */
  node?: ServerRequest["node"];

  /**
   * 原始请求对象
   * 
   * 包含了原始的服务器请求信息。
   * 这就像是点餐单的原始副本。
   */
  readonly request: ServerRequest;
  
  /**
   * HTTP请求方法
   * 
   * 请求的类型，如GET、POST、PUT、DELETE等。
   * 这就像是点餐的类型：是要点菜（GET），还是要修改订单（PUT），
   * 或者是要取消点餐（DELETE）。
   */
  readonly method: HTTPMethod;
  
  /**
   * 请求路径
   * 
   * 包含查询参数的完整URL路径。
   * 这就像是顾客的完整要求，包括主菜和配菜。
   */
  readonly path: string;
  
  /**
   * 路径名称
   * 
   * 不包含查询参数的URL路径部分。
   * 这就像是顾客点的主菜，不包括配菜和特殊要求。
   */
  readonly pathname: string;
  
  /**
   * 查询参数
   * 
   * URL中的查询参数，以URLSearchParams对象表示。
   * 这就像是顾客的特殊要求，比如“不要洋葱”、“少放盐”等。
   */
  readonly query: URLSearchParams;
  
  /**
   * 查询字符串
   * 
   * URL中的原始查询字符串部分（问号后面的部分）。
   * 这就像是顾客特殊要求的原始文字记录。
   */
  readonly queryString: string;
  
  /**
   * 完整URL对象
   * 
   * 包含了请求的完整URL信息，可以获取协议、主机名、端口等。
   * 这就像是点餐单的完整信息，包括来源、时间等全部细节。
   */
  readonly url: URL;
  
  /**
   * 请求头部
   * 
   * HTTP请求的头部信息，包含各种元数据。
   * 这就像是点餐单上的附加信息，比如顾客的联系方式、偏好等。
   */
  readonly headers: Headers;
  
  /**
   * 客户端IP地址
   * 
   * 发起请求的客户端IP地址，可能不存在。
   * 这就像是顾客的座位号或联系方式，可能有也可能没有。
   */
  readonly ip?: string | undefined;

  /**
   * 响应对象
   * 
   * 用于构建HTTP响应的对象。
   * 这就像是厨师准备的菜品和盘子，将要送给顾客。
   */
  response: H3EventResponse;
}

/**
 * H3事件响应接口
 * 
 * 这个接口定义了HTTP响应的结构，包含状态码、头部等信息。
 * 当事件处理器处理完请求后，会使用这个对象构建HTTP响应。
 * 
 * 这就像是厨师准备的菜品和盘子，将要送给顾客。
 */
export interface H3EventResponse {
  /**
   * HTTP状态码
   * 
   * 响应的状态码，如200（成功）、404（未找到）、500（服务器错误）等。
   * 这就像是菜品的状态：已完成、缺货或准备出错。
   */
  status?: number;
  
  /**
   * HTTP状态文本
   * 
   * 状态码对应的文本描述，如“OK”、“Not Found”、“Internal Server Error”等。
   * 这就像是对菜品状态的文字说明。
   */
  statusText?: string;

  /**
   * 内部头部初始化数据
   * 
   * 用于初始化响应头部的数据。
   * 这是一个内部属性，不应直接使用。
   */
  _headersInit?: HeadersInit;
  
  /**
   * 内部头部对象
   * 
   * 存储响应头部的内部对象。
   * 这是一个内部属性，不应直接使用。
   */
  _headers?: Headers;

  /**
   * 响应头部
   * 
   * HTTP响应的头部信息，包含各种元数据。
   * 这就像是菜品的附加信息，比如热量、原料、过敏原提示等。
   */
  readonly headers: Headers;

  /**
   * 设置响应头部
   * 
   * 设置一个响应头部的值。
   * 这就像是给菜品添加一个新的标签或说明。
   * 
   * @param name - 头部名称
   * @param value - 头部值
   */
  setHeader(name: string, value: string): void;
}
