/**
 * H3框架入口文件
 * 
 * 这个文件是整个H3框架的主要入口点。H3是一个轻量级的HTTP框架，专为高性能和跨平台设计。
 * 它可以在Node.js、浏览器以及其他JavaScript运行环境中使用。
 * 
 * 在这个文件中，我们导出了框架中所有重要的功能组件，让开发者可以方便地使用它们。
 * 文件按功能模块组织，包括类型定义、核心组件、事件处理、错误处理、适配器和各种实用工具函数。
 */

/**
 * 类型定义导出
 * 
 * 这里导出了所有的类型定义，这些类型帮助开发者在使用框架时获得更好的类型提示和检查。
 * 类型定义包括HTTP请求和响应的类型、事件处理器的类型、中间件的类型等。
 */
export * from "./types";

/**
 * H3核心功能
 * 
 * createH3: 创建一个新的H3应用实例，这是使用框架的起点
 * serve: 启动服务器并提供服务的函数
 */
export { createH3, serve } from "./h3";

/**
 * 事件相关函数
 * 
 * isEvent: 检查一个对象是否是H3事件对象
 * mockEvent: 创建一个模拟的事件对象，用于测试
 */
export { isEvent, mockEvent } from "./utils/event";

/**
 * 处理器相关函数
 * 
 * 这些函数用于定义如何处理HTTP请求：
 * defineEventHandler: 定义一个事件处理器，处理HTTP请求并返回响应
 * defineLazyEventHandler: 定义一个懒加载的事件处理器，只在需要时才初始化
 * dynamicEventHandler: 定义一个可以动态变化的事件处理器
 * defineRequestMiddleware: 定义一个请求中间件，在请求处理前执行
 * defineResponseMiddleware: 定义一个响应中间件，在响应发送前执行
 */
export {
  defineEventHandler,
  defineLazyEventHandler,
  dynamicEventHandler,
  defineRequestMiddleware,
  defineResponseMiddleware,
} from "./handler";

/**
 * 错误处理函数
 * 
 * createError: 创建一个标准化的HTTP错误对象，可以指定状态码和错误信息
 * isError: 检查一个对象是否是H3错误对象
 */
export { createError, isError } from "./error";

/**
 * ---- 适配器 ----
 * 
 * 适配器允许H3框架与不同的环境和平台集成，比如Node.js、浏览器等。
 * 这使得同一套代码可以在不同的环境中运行，提高了代码的可移植性。
 */

/**
 * Node.js适配器
 * 
 * 这些函数帮助H3与Node.js的HTTP模块集成：
 * fromWebHandler: 将Web标准的处理器转换为H3处理器
 * toWebHandler: 将H3处理器转换为Web标准的处理器
 * fromNodeHandler: 将Node.js的HTTP处理器转换为H3处理器
 * toNodeHandler: 将H3处理器转换为Node.js的HTTP处理器
 * defineNodeHandler: 定义一个专门用于Node.js环境的处理器
 * defineNodeMiddleware: 定义一个专门用于Node.js环境的中间件
 */
export {
  fromWebHandler,
  toWebHandler,
  fromNodeHandler,
  toNodeHandler,
  defineNodeHandler,
  defineNodeMiddleware,
} from "./adapters";

/**
 * ------ 实用工具函数 ------
 * 
 * H3提供了丰富的实用工具函数，帮助开发者更方便地处理HTTP请求和响应。
 * 这些工具函数被分为不同的类别，如请求处理、响应处理、Cookie处理等。
 */

/**
 * 请求处理工具
 * 
 * 这些函数帮助获取和处理HTTP请求的各个部分：
 * getRequestHost: 获取请求的主机名
 * getRequestIP: 获取发起请求的客户端IP地址
 * getRequestProtocol: 获取请求使用的协议（HTTP或HTTPS）
 * getRequestURL: 获取完整的请求URL
 * isMethod: 检查请求是否使用特定的HTTP方法（如GET、POST等）
 * getQuery: 获取URL查询参数
 * getValidatedQuery: 获取并验证URL查询参数
 * assertMethod: 断言请求必须使用特定的HTTP方法，否则抛出错误
 * getRouterParam: 获取路由参数中的特定值
 * getRouterParams: 获取所有路由参数
 * getValidatedRouterParams: 获取并验证路由参数
 */
export {
  getRequestHost,
  getRequestIP,
  getRequestProtocol,
  getRequestURL,
  isMethod,
  getQuery,
  getValidatedQuery,
  assertMethod,
  getRouterParam,
  getRouterParams,
  getValidatedRouterParams,
} from "./utils/request";

/**
 * 响应处理工具
 * 
 * 这些函数帮助生成和处理HTTP响应：
 * writeEarlyHints: 发送HTTP Early Hints（103状态码），用于预加载资源
 * redirect: 创建HTTP重定向响应
 * iterable: 将可迭代对象转换为HTTP响应
 * noContent: 创建无内容（204）响应
 */
export {
  writeEarlyHints,
  redirect,
  iterable,
  noContent,
} from "./utils/response";

/**
 * 代理工具
 * 
 * 这些函数用于代理HTTP请求到其他服务器：
 * proxy: 将请求代理到另一个URL
 * getProxyRequestHeaders: 获取适合代理请求的头部信息
 * proxyRequest: 代理一个请求并返回响应
 * fetchWithEvent: 使用事件上下文执行fetch请求
 */
export {
  proxy,
  getProxyRequestHeaders,
  proxyRequest,
  fetchWithEvent,
} from "./utils/proxy";

/**
 * 请求体处理工具
 * 
 * 这些函数用于读取和验证HTTP请求体：
 * readBody: 读取请求体的内容
 * readValidatedBody: 读取并验证请求体的内容
 */
export { readBody, readValidatedBody } from "./utils/body";

/**
 * Cookie处理工具
 * 
 * 这些函数用于处理HTTP Cookie：
 * getCookie: 获取特定的Cookie值
 * deleteCookie: 删除一个Cookie
 * parseCookies: 解析请求中的所有Cookie
 * setCookie: 设置一个Cookie
 */
export {
  getCookie,
  deleteCookie,
  parseCookies,
  setCookie,
} from "./utils/cookie";

/**
 * 服务器发送事件(SSE)工具
 * 
 * createEventStream: 创建一个服务器发送事件流，用于实时向客户端推送数据
 * 这是一种比WebSocket更简单的实时通信方式，适合单向数据推送
 */
export { createEventStream } from "./utils/event-stream";

/**
 * 安全处理工具
 * 
 * 这些函数用于确保HTTP状态码和消息的安全：
 * sanitizeStatusCode: 确保状态码是有效的HTTP状态码
 * sanitizeStatusMessage: 确保状态消息不包含危险字符
 */
export { sanitizeStatusCode, sanitizeStatusMessage } from "./utils/sanitize";

/**
 * 缓存处理工具
 * 
 * handleCacheHeaders: 处理HTTP缓存相关的头部信息，帮助实现有效的缓存策略
 */
export { handleCacheHeaders } from "./utils/cache";

/**
 * 静态文件服务工具
 * 
 * serveStatic: 提供静态文件服务，如HTML、CSS、JavaScript、图片等
 */
export { serveStatic } from "./utils/static";

/**
 * 基础路径工具
 * 
 * withBase: 为路由添加基础路径前缀，用于在子路径下部署应用
 */
export { withBase } from "./utils/base";

/**
 * 会话管理工具
 * 
 * 这些函数用于管理用户会话：
 * clearSession: 清除用户会话
 * getSession: 获取用户会话数据
 * sealSession: 加密并密封会话数据
 * unsealSession: 解密并打开密封的会话数据
 * updateSession: 更新会话数据
 * useSession: 在处理器中使用会话
 */
export {
  clearSession,
  getSession,
  sealSession,
  unsealSession,
  updateSession,
  useSession,
} from "./utils/session";

/**
 * 跨域资源共享(CORS)工具
 * 
 * 这些函数用于处理跨域请求：
 * appendCorsHeaders: 添加CORS响应头
 * appendCorsPreflightHeaders: 添加CORS预检请求的响应头
 * handleCors: 完整处理CORS请求
 * isCorsOriginAllowed: 检查请求源是否被允许
 * isPreflightRequest: 检查是否是CORS预检请求
 */
export {
  appendCorsHeaders,
  appendCorsPreflightHeaders,
  handleCors,
  isCorsOriginAllowed,
  isPreflightRequest,
} from "./utils/cors";

/**
 * 请求指纹工具
 * 
 * getRequestFingerprint: 获取请求的唯一指纹，可用于缓存或识别请求
 */
export { getRequestFingerprint } from "./utils/fingerprint";

/**
 * WebSocket工具
 * 
 * 这些函数用于处理WebSocket连接：
 * defineWebSocketHandler: 定义一个WebSocket处理器
 * defineWebSocket: 定义WebSocket行为
 */
export { defineWebSocketHandler, defineWebSocket } from "./utils/ws";

/**
 * ---- 已废弃功能 ----
 * 
 * 这里导出了一些已经被废弃的功能，它们可能在未来的版本中被移除。
 * 建议使用上面提供的新功能替代这些废弃功能。
 */
export * from "./_deprecated";
