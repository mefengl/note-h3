/**
 * 代理（Proxy）模块
 * 
 * 这个文件提供了将请求代理到其他服务器的功能。
 * 
 * 什么是代理？
 * 代理就像一个中间人，当客户端发送请求到我们的服务器时，
 * 我们的服务器不直接处理这个请求，而是将它转发到另一个目标服务器，
 * 然后将目标服务器的响应返回给客户端。
 * 
 * 想象一下：
 * 就像你想买一件外国的商品，但不会外语。你找了一个翻译（代理），
 * 你告诉翻译你想要什么，翻译帮你联系卖家并完成购买，然后把商品交给你。
 * 
 * 代理的常见用途：
 * 1. 跨域请求：解决浏览器的同源策略限制
 * 2. 负载均衡：将请求分发到多个后端服务器
 * 3. API 网关：集中管理对多个服务的访问
 * 4. 内容缓存：缓存响应以提高性能
 * 5. 安全过滤：过滤不安全的请求
 */

// 导入必要的类型和函数
import type { H3EventContext, H3Event, ProxyOptions, Duplex } from "../types";
// 导入用于处理 Cookie 字符串的函数
import { splitSetCookieString } from "cookie-es";
// 导入用于清理状态消息和状态码的函数
import { sanitizeStatusMessage, sanitizeStatusCode } from "./sanitize";
// 导入创建错误的函数
import { createError } from "../error";
// 导入代理相关的内部工具函数
import {
  PayloadMethods,  // 包含请求体的 HTTP 方法集合（如 POST、PUT 等）
  getFetch,        // 获取 fetch 函数的工具
  ignoredHeaders,  // 代理时应忽略的头部列表
  mergeHeaders,    // 合并多个头部对象
  rewriteCookieProperty,  // 重写 Cookie 属性
} from "./internal/proxy";
// 导入空对象工具
import { EmptyObject } from "./internal/obj";

/**
 * 将传入的请求代理到目标 URL
 * 
 * 这个函数接收一个请求事件，将其转发到指定的目标服务器，
 * 并处理请求体、方法、头部等内容的正确传递。
 */
export async function proxyRequest(
  event: H3Event,  // H3 框架的请求事件
  target: string,  // 目标 URL，要代理到的地址
  opts: ProxyOptions = {},  // 代理选项，控制代理行为的配置
) {
  // 处理请求体
  let body;  // 存储请求体数据
  let duplex: Duplex | undefined;  // 数据流方向控制
  
  // 如果请求方法可能包含请求体（如 POST、PUT 等）
  if (PayloadMethods.has(event.request.method)) {
    // 如果启用了流式请求，直接传递请求体流
    if (opts.streamRequest) {
      body = event.request.body;  // 使用原始请求体流
      duplex = "half";  // 设置为半双工模式，允许流式传输
    } else {
      // 否则，将请求体完全读取为 ArrayBuffer
      body = await event.request.arrayBuffer();  // 将整个请求体读入内存
    }
  }

  // 确定要使用的 HTTP 方法（GET、POST 等）
  // 优先使用配置中指定的方法，如果没有则使用原始请求的方法
  const method = opts.fetchOptions?.method || event.request.method;

  // 准备请求头部
  // 合并多个来源的头部信息：原始请求头部、配置中的头部等
  const fetchHeaders = mergeHeaders(
    // 获取经过处理的原始请求头部（移除了可能导致问题的头部）
    getProxyRequestHeaders(event, { host: target.startsWith("/") }),  // 如果目标是相对路径，保留 host 头
    opts.fetchOptions?.headers,  // 来自 fetchOptions 的头部
    opts.headers,  // 直接指定的头部
  );

  // 调用实际的代理函数执行请求
  return proxy(event, target, {
    ...opts,  // 保留原始选项
    fetchOptions: {  // 构建 fetch 选项
      method,  // HTTP 方法
      body,    // 请求体
      duplex,  // 流控制
      ...opts.fetchOptions,  // 其他 fetch 选项
      headers: fetchHeaders,  // 合并后的头部
    },
  });
}

/**
 * 向目标 URL 发送代理请求并将响应发送回客户端
 * 
 * 这是代理功能的核心函数，它完成以下工作：
 * 1. 向目标服务器发送请求
 * 2. 接收目标服务器的响应
 * 3. 处理响应头部和 Cookie
 * 4. 将处理后的响应返回给客户端
 */
export async function proxy(
  event: H3Event,  // H3 框架的请求事件
  target: string,  // 目标 URL，要代理到的地址
  opts: ProxyOptions = {},  // 代理选项，控制代理行为的配置
): Promise<BodyInit | undefined | null> {  // 返回响应体数据
  // 声明一个变量来存储目标服务器的响应
  let response: Response | undefined;
  
  try {
    // 尝试发送请求到目标服务器
    // getFetch 获取要使用的 fetch 函数（可能是自定义的或默认的）
    response = await getFetch(opts.fetch)(target, {
      headers: opts.headers as HeadersInit,  // 设置请求头部
      ignoreResponseError: true, // 忽略响应错误，使 $ofetch.raw 透明
      ...opts.fetchOptions,  // 其他 fetch 选项
    });
  } catch (error) {
    // 如果请求失败，抛出一个 502 Bad Gateway 错误
    // 502 表示“网关错误”，即我们的服务器（代理）无法从目标服务器获取有效响应
    throw createError({
      status: 502,
      statusMessage: "Bad Gateway",  // 网关错误
      cause: error,  // 错误原因
    });
  }
  // 设置响应状态码，并确保它是安全的
  // sanitizeStatusCode 函数会检查状态码是否有效，如果无效则使用默认值
  event.response.status = sanitizeStatusCode(
    response.status,  // 目标服务器返回的状态码
    event.response.status,  // 当前响应的状态码（作为默认值）
  );
  // 设置响应状态消息，并确保它是安全的
  event.response.statusText = sanitizeStatusMessage(response.statusText);

  // 创建一个数组来存储所有的 Cookie
  const cookies: string[] = [];

  // 遍历目标服务器响应的所有头部
  for (const [key, value] of response.headers.entries()) {
    // 跳过 content-encoding 头部，因为它可能会影响数据传输
    if (key === "content-encoding") {
      continue;  // 跳过这个头部
    }
    // 跳过 content-length 头部，因为它可能与实际响应内容不匹配
    if (key === "content-length") {
      continue;  // 跳过这个头部
    }
    // 特殊处理 set-cookie 头部，因为它可能包含多个 Cookie
    if (key === "set-cookie") {
      // 将 Cookie 字符串分割为多个独立的 Cookie，并添加到 cookies 数组
      cookies.push(...splitSetCookieString(value));
      continue;  // 跳过这个头部，因为我们将在后面单独处理 Cookie
    }
    // 将其他头部设置到响应中
    event.response.headers.set(key, value);
  }

  // 如果有 Cookie 需要处理
  if (cookies.length > 0) {
    // 处理每个 Cookie，可能需要重写域名或路径
    const _cookies = cookies.map((cookie) => {
      // 如果配置了 Cookie 域名重写规则
      if (opts.cookieDomainRewrite) {
        // 重写 Cookie 的域名属性
        // 这在代理时很重要，因为原始域名可能与当前域名不同
        cookie = rewriteCookieProperty(
          cookie,  // 原始 Cookie 字符串
          opts.cookieDomainRewrite,  // 域名重写规则
          "domain",  // 要重写的属性名
        );
      }
      // 如果配置了 Cookie 路径重写规则
      if (opts.cookiePathRewrite) {
        // 重写 Cookie 的路径属性
        // 这在代理到不同路径时很重要
        cookie = rewriteCookieProperty(cookie, opts.cookiePathRewrite, "path");
      }
      return cookie;  // 返回处理后的 Cookie
    });
    
    // 将处理后的每个 Cookie 添加到响应头部
    for (const cookie of _cookies) {
      // 使用 append 而不是 set，因为可能有多个 Cookie
      event.response.headers.append("set-cookie", cookie);
    }
  }

  // 如果提供了响应回调函数，调用它
  // 这允许用户在响应发送给客户端之前进行自定义处理
  if (opts.onResponse) {
    await opts.onResponse(event, response);
  }

  // 如果响应已经被消费并有已存储的数据，直接返回该数据
  // 这通常是由一些 fetch 库（如 ofetch）处理的
  if ((response as any)._data !== undefined) {
    return (response as any)._data;  // 返回已消费的数据
  }

  // 如果配置为不使用流式传输，则一次性发送所有数据
  if (opts.sendStream === false) {
    // 将响应体完全读取为 ArrayBuffer，然后转换为 Uint8Array 返回
    return new Uint8Array(await response.arrayBuffer());
  }

  // 默认情况下，使用流式传输响应体
  // 这对于大文件或长时间运行的请求更有效
  return response.body;  // 返回原始响应体流
}

/**
 * 代理功能的应用场景示例：
 * 
 * 1. API 网关：将来自客户端的请求路由到不同的微服务
 *    例如：/api/users 路由到用户服务，/api/products 路由到产品服务
 * 
 * 2. 跨域资源共享：允许前端应用访问不同域的 API
 *    例如：前端在 example.com，但需要访问 api.example.com 的数据
 * 
 * 3. 内容修改代理：在返回给客户端前修改响应内容
 *    例如：将第三方 API 的响应格式转换为前端需要的格式
 * 
 * 4. 负载均衡：将请求分发到多个后端服务器
 *    例如：将请求分发到 server1.example.com 和 server2.example.com
 * 
 * 5. 缓存代理：缓存目标服务器的响应，减少请求次数
 *    例如：缓存静态资源或很少变化的 API 响应
 */

/**
 * Get the request headers object without headers known to cause issues when proxying.
 */
export function getProxyRequestHeaders(
  event: H3Event,
  opts?: { host?: boolean },
) {
  const headers = new EmptyObject();
  for (const [name, value] of event.request.headers.entries()) {
    if (!ignoredHeaders.has(name) || (name === "host" && opts?.host)) {
      headers[name] = value;
    }
  }
  return headers;
}

/**
 * Make a fetch request with the event's context and headers.
 */
export function fetchWithEvent<
  T = unknown,
  _R = unknown,
  F extends (req: RequestInfo | URL, opts?: any) => any = typeof fetch,
>(
  event: H3Event,
  req: RequestInfo | URL,
  init?: RequestInit & { context?: H3EventContext },
  options?: { fetch: F },
): unknown extends T ? ReturnType<F> : T {
  return getFetch(options?.fetch)(req, <RequestInit>{
    ...init,
    context: init?.context || event.context,
    headers: {
      ...getProxyRequestHeaders(event, {
        host: typeof req === "string" && req.startsWith("/"),
      }),
      ...init?.headers,
    },
  });
}
