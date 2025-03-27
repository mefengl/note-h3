/**
 * H3事件处理模块
 * 
 * 这个文件定义了H3框架中的事件对象，它是整个框架的核心部分之一。
 * 在Web开发中，事件对象封装了HTTP请求和响应，提供了一个统一的接口来处理网络通信。
 */

/**
 * 导入需要的类型
 * 
 * ServerRequest: 服务器请求对象类型，来自服务器库srvx
 * H3Event: H3事件接口类型
 * H3EventContext: H3事件上下文类型，用于存储事件相关的额外数据
 * HTTPMethod: HTTP请求方法类型（如GET、POST等）
 * H3EventResponse: H3事件响应类型
 */
import type { ServerRequest } from "srvx/types";
import type { H3Event, H3EventContext, HTTPMethod } from "./types";
import type { H3EventResponse } from "./types/event";

/**
 * 创建一个空的事件上下文对象
 * 
 * 这里使用了一个特殊的技巧来创建一个空对象，这个对象没有从其他对象继承任何属性。
 * 这就像是创建了一个完全空白的纸，我们可以在上面写任何东西，不用担心有什么默认的内容。
 * 
 * @__PURE__ 标记告诉打包工具这个函数没有副作用，可以安全地进行代码优化。
 */
const H3EventContext = /* @__PURE__ */ (() => {
  // 创建一个空函数
  const C = function () {};
  // 将函数的原型设置为一个空对象，不继承任何属性
  C.prototype = Object.create(null);
  // 返回这个函数，将其类型转换为一个构造函数，创建 H3EventContext 实例
  return C;
})() as unknown as { new (): H3EventContext };

/**
 * 创建一个空的头部对象
 * 
 * 与上面的H3EventContext类似，这里创建了一个空对象来存储HTTP头部信息。
 * 这就像是一个特殊的存储盒，可以存放各种HTTP头部信息，如Content-Type、Cookie等。
 */
const HeadersObject = /* @__PURE__ */ (() => {
  // 创建一个空函数
  const C = function () {};
  // 将函数的原型设置为一个空对象，不继承任何属性
  C.prototype = Object.create(null);
  // 返回这个函数，将其类型转换为一个构造函数
  return C;
})() as unknown as { new (): H3EventContext };

/**
 * H3Web事件类
 * 
 * 这个类是H3框架中的核心类之一，它封装了HTTP请求和响应，
 * 提供了一系列方法来获取和处理请求信息。
 * 
 * 这就像是一个邮差，它接收客户的信件（请求），并帮助我们处理和回复这些信件。
 */
export class H3WebEvent implements H3Event {
  /**
   * 静态标记，用于识别这是一个H3事件对象
   * 
   * 这个标记就像是邮差的制服，让我们可以轻松识别出这是一个H3事件对象。
   */
  static __is_event__ = true;
  
  /**
   * 事件上下文对象，用于存储事件相关的额外数据
   * 
   * 这就像是邮差的记事本，用来记录处理信件时的各种额外信息。
   */
  context: H3EventContext;
  
  /**
   * 服务器请求对象，包含了原始的HTTP请求信息
   * 
   * 这就像是邮差收到的原始信件，包含了所有的详细信息。
   */
  request: ServerRequest;
  
  /**
   * 响应对象，用于构建响应数据
   * 
   * 这就像是邮差准备的回信纸和信封，用来写回复并发送给客户。
   */
  response: H3EventResponse;

  /**
   * 缓存的URL对象，用于解析请求URL
   * 
   * 这些带下划线的属性都是缓存变量，用来存储已经计算过的值，
   * 这样可以提高性能，避免重复计算。
   */
  _url?: URL;
  
  /**
   * 缓存的路径名，如'/users'
   */
  _pathname?: string;
  
  /**
   * 缓存的URL中问号的位置索引
   */
  _urlqindex?: number;
  
  /**
   * 缓存的查询参数对象
   */
  _query?: URLSearchParams;
  
  /**
   * 缓存的查询字符串，如'?name=john'
   */
  _queryString?: string;

  /**
   * 创建一个新的H3Web事件对象
   * 
   * 构造函数初始化了事件对象，设置了上下文、请求和响应对象。
   * 
   * @param request - 服务器请求对象
   * @param context - 可选的事件上下文对象
   */
  constructor(request: ServerRequest, context?: H3EventContext) {
    // 初始化上下文，如果没有提供则创建一个新的
    this.context = context || new H3EventContext();
    // 保存请求对象
    this.request = request;
    // 创建一个新的响应对象
    this.response = new WebEventResponse();
  }

  /**
   * 获取HTTP请求的方法（GET、POST等）
   * 
   * 这就像是查看信件是什么类型，比如是普通信件、快递还是挂号信。
   * 
   * @returns HTTP请求方法，如GET、POST等
   */
  get method(): HTTPMethod {
    // 返回请求的方法，并将其类型转换为HTTPMethod
    return this.request.method as HTTPMethod;
  }

  /**
   * 获取HTTP请求的头部信息
   * 
   * 这就像是查看信件上的收件人、发件人、日期等信息。
   * 
   * @returns HTTP请求头部对象
   */
  get headers(): Headers {
    // 返回请求的头部信息
    return this.request.headers;
  }

  /**
   * 获取解析后的URL对象
   * 
   * URL对象包含了关于请求URL的所有信息，如协议、主机名、路径、查询参数等。
   * 
   * 这就像是将信件上的地址详细解析出来，包括国家、城市、街道等信息。
   * 
   * @returns 解析后的URL对象
   */
  get url() {
    // 如果还没有解析URL，则创建一个新的URL对象
    if (!this._url) {
      this._url = new URL(this.request.url);
    }
    // 返回缓存的URL对象
    return this._url;
  }

  /**
   * 获取完整的路径，包括路径名和查询字符串
   * 
   * 例如：'/users?id=123'
   * 
   * 这就像是信件上的完整地址，包括街道和门牌号。
   * 
   * @returns 完整路径字符串
   */
  get path() {
    // 将路径名和查询字符串组合起来
    return this.pathname + this.queryString;
  }

  /**
   * 获取URL的路径名部分
   * 
   * 例如：'/users'
   * 
   * 这个方法尝试使用最高效的方式来提取路径名，如果可能的话会避免创建URL对象。
   * 
   * 这就像是从完整地址中只提取街道名称，不包括门牌号。
   * 
   * @returns URL的路径名部分
   */
  get pathname() {
    // 如果已经有解析好的URL对象，直接使用它的pathname
    if (this._url) {
      return this._url.pathname; // 重用已解析的URL
    }
    // 如果还没有缓存路径名，则手动解析
    if (!this._pathname) {
      const url = this.request.url;
      // 寻找协议分隔符的位置（如http://）
      const protoIndex = url.indexOf("://");
      if (protoIndex === -1) {
        // 如果没有协议分隔符，回退到使用URL对象
        return this.url.pathname; // 降级优化
      }
      // 寻找路径开始的斜杠的位置
      const pIndex = url.indexOf("/", protoIndex + 4 /* :// */);
      if (pIndex === -1) {
        // 如果没有路径开始的斜杠，回退到使用URL对象
        return this.url.pathname; // 降级优化
      }
      // 寻找查询字符串开始的问号的位置，并缓存这个位置
      const qIndex = (this._urlqindex = url.indexOf("?", pIndex));
      // 提取路径名部分，从路径开始到问号（如果有的话）
      this._pathname = url.slice(pIndex, qIndex === -1 ? undefined : qIndex);
    }
    // 返回缓存的路径名
    return this._pathname;
  }

  /**
   * 获取URL的查询参数对象
   * 
   * 这个对象允许我们访问和操作URL中的查询参数，如'?id=123&name=john'中的id和name。
   * 
   * 这就像是从地址中提取门牌号和房间号等特定信息。
   * 
   * @returns URL查询参数对象
   */
  get query() {
    // 如果已经有解析好的URL对象，直接使用它的searchParams
    if (this._url) {
      return this._url.searchParams; // 重用已解析的URL
    }
    // 如果还没有缓存查询参数对象，则创建一个新的
    if (!this._query) {
      this._query = new URLSearchParams(this.queryString);
    }
    // 返回缓存的查询参数对象
    return this._query;
  }

  /**
   * 获取URL的查询字符串部分
   * 
   * 例如：'?id=123&name=john'
   * 
   * 这就像是从地址中提取门牌号和房间号的完整部分。
   * 
   * @returns URL查询字符串
   */
  get queryString() {
    // 如果已经有解析好的URL对象，直接使用它的search
    if (this._url) {
      return this._url.search; // 重用已解析的URL
    }
    // 如果还没有缓存查询字符串，则手动提取
    if (!this._queryString) {
      const qIndex = this._urlqindex;
      if (qIndex === -1) {
        // 如果没有问号，表示没有查询字符串
        this._queryString = "";
      } else {
        // 如果有问号，提取从问号开始的部分
        this._queryString =
          this._urlqindex === undefined
            ? this.url.search // 降级优化（不太可能发生，因为pathname访问器总是先被使用）
            : this.request.url.slice(this._urlqindex);
      }
    }
    // 返回缓存的查询字符串
    return this._queryString;
  }

  /**
   * 获取Node.js特定的请求对象
   * 
   * 这个属性只在Node.js环境中可用，提供了对原生Node.js HTTP请求对象的访问。
   * 
   * 这就像是获取信件的原始材质和特殊属性。
   * 
   * @returns Node.js特定的请求对象，如果可用的话
   */
  get node() {
    // 返回请求的node属性，在Node.js环境中这是原生Node.js请求对象
    return this.request.node;
  }

  /**
   * 获取客户端IP地址
   * 
   * 这就像是获取发信人的具体地址。
   * 
   * @returns 客户端IP地址字符串
   */
  get ip() {
    // 返回请求的远程地址，即客户端IP
    return this.request.remoteAddress;
  }

  /**
   * 将事件对象转换为字符串表示
   * 
   * 这个方法返回事件的简洁表示形式，包括请求方法和URL。
   * 例如：'[GET] /users?id=123'
   * 
   * 这就像是给信件写一个简短的摘要，例如“来自小明的请求信”。
   * 
   * @returns 事件的字符串表示
   */
  toString(): string {
    // 返回格式化的字符串，包含请求方法和URL
    return `[${this.request.method}] ${this.request.url}`;
  }

  /**
   * 将事件对象转换为JSON格式
   * 
   * 这个方法在将事件对象转换为JSON时使用，返回事件的字符串表示。
   * 
   * 这就像是将信件信息转换成电子格式，方便计算机处理。
   * 
   * @returns 事件的JSON字符串表示
   */
  toJSON(): string {
    // 直接调用toString方法获取字符串表示
    return this.toString();
  }
}

/**
 * Web事件响应类
 * 
 * 这个类实现了H3EventResponse接口，用于处理HTTP响应的头部信息。
 * 它提供了设置和获取HTTP响应头部的方法。
 * 
 * 这就像是邮差准备的回信信封，上面可以写收件人、发件人等信息。
 */
class WebEventResponse implements H3EventResponse {
  /**
   * 头部初始化数据，用于延迟创建Headers对象
   * 
   * 这个属性存储了头部信息，直到真正需要Headers对象时才创建。
   * 这是一种性能优化手段，叫做“懒加载”。
   */
  _headersInit?: Record<string, string>;
  
  /**
   * 缓存的Headers对象
   * 
   * 当需要时，会从_headersInit创建这个Headers对象。
   */
  _headers?: Headers;

  /**
   * 获取响应头部对象
   * 
   * 如果头部对象还没有创建，则使用_headersInit初始化数据创建一个新的。
   * 
   * 这就像是在需要时才准备信封，而不是提前准备好。
   * 
   * @returns 响应头部对象
   */
  get headers() {
    // 如果还没有创建Headers对象，则创建一个
    if (!this._headers) {
      this._headers = new Headers(this._headersInit);
    }
    // 返回头部对象
    return this._headers;
  }

  /**
   * 设置响应头部信息
   * 
   * 这个方法允许设置响应的头部信息，如Content-Type、Set-Cookie等。
   * 
   * 这就像是在回信信封上写上特定的信息。
   * 
   * @param name - 头部名称，如'Content-Type'
   * @param value - 头部值，如'application/json'
   */
  setHeader(name: string, value: string): void {
    // 如果已经创建了Headers对象，直接设置头部
    if (this._headers) {
      this._headers.set(name, value);
    } else {
      // 如果还没有创建Headers对象，将头部信息存在_headersInit中
      if (!this._headersInit) {
        this._headersInit = new HeadersObject();
      }
      // 设置头部值
      this._headersInit[name] = value;
    }
  }
}
