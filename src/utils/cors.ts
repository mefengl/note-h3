/**
 * cors.ts - 跨源资源共享 (CORS) 处理工具
 * 
 * 这个文件包含了用于处理跨源资源共享 (CORS) 的函数。
 * 
 * 什么是CORS？想象一下，每个网站都像是一个国家，有自己的边界。
 * 正常情况下，一个国家的人不能随便进入另一个国家。
 * 如果你想访问另一个国家，你需要特别的许可。
 * 
 * CORS就是这样的许可系统，它允许一个网站的代码访问另一个网站的资源。
 * 比如，当你的网站想要使用其他网站的图片、数据或API时，
 * 就需要这个系统的帮助。
 * 
 * 这个文件提供了几个主要功能：
 * 1. 检查是否是预检请求 (isPreflightRequest)
 * 2. 添加预检请求的响应头 (appendCorsPreflightHeaders)
 * 3. 添加普通请求的CORS响应头 (appendCorsHeaders)
 * 4. 处理CORS请求 (handleCors)
 */

// 导入我们需要的类型和函数
import type { H3Event } from "../types";
import type { H3CorsOptions } from "../types/utils/cors";
import { noContent } from "./response";
import {
  createAllowHeaderHeaders,    // 创建允许的请求头
  createCredentialsHeaders,    // 创建凭证相关的头
  createExposeHeaders,         // 创建暴露给前端的头
  createMaxAgeHeader,          // 创建缓存时间相关的头
  createMethodsHeaders,        // 创建允许的请求方法相关的头
  createOriginHeaders,         // 创建源相关的头
  resolveCorsOptions,          // 解析CORS选项
} from "./internal/cors";

// 导出一个函数，用于检查请求的源是否被允许
export { isCorsOriginAllowed } from "./internal/cors";

/**
 * 检查传入的请求是否是 CORS 预检请求
 * 
 * 想象一下，当你想要去另一个国家旅行时，你需要先申请签证。
 * 这个签证申请过程就像是浏览器的“预检请求”。
 * 
 * 在浏览器发送真正的请求之前，它会先发送一个特殊的“预检请求”来检查
 * 是否允许跨源访问。这个函数就是用来检查一个请求是否是这种预检请求。
 * 
 * 预检请求有三个特点：
 * 1. 请求方法是 OPTIONS
 * 2. 有 origin 头（表示请求来自哪个网站）
 * 3. 有 access-control-request-method 头（表示实际要使用什么方法）
 */
export function isPreflightRequest(event: H3Event): boolean {
  // 获取请求的源（从哪个网站发来的）
  const origin = event.request.headers.get("origin");
  
  // 获取请求的“访问控制请求方法”头
  // 这个头告诉服务器，实际请求会用什么HTTP方法（GET、POST等）
  const accessControlRequestMethod = event.request.headers.get(
    "access-control-request-method",
  );

  // 判断是否是预检请求：
  // 1. 请求方法必须是 OPTIONS
  // 2. 必须有 origin 头
  // 3. 必须有 access-control-request-method 头
  return (
    event.request.method === "OPTIONS" &&  // 检查是否是 OPTIONS 请求
    !!origin &&                           // 检查是否有 origin 头
    !!accessControlRequestMethod          // 检查是否有 access-control-request-method 头
  );
}

/**
 * 向响应中添加 CORS 预检请求的头部
 * 
 * 想象一下，当你申请去另一个国家的签证时，移民局会给你一个回复，
 * 告诉你可以做什么、不可以做什么。
 * 
 * 这个函数就是给浏览器的预检请求发送这样的回复，告诉浏览器：
 * - 哪些网站可以访问我的资源
 * - 允许使用哪些 HTTP 方法（GET、POST 等）
 * - 允许发送哪些请求头
 * - 是否允许发送认证信息（如请求中的 cookie）
 * - 预检结果缓存时间
 */
export function appendCorsPreflightHeaders(
  event: H3Event,       // H3事件对象
  options: H3CorsOptions, // CORS选项
) {
  // 创建所有需要的CORS头部
  // 这就像准备一套完整的签证回复文件
  const headers = {
    ...createOriginHeaders(event, options),      // 允许的源（哪些网站可以访问）
    ...createCredentialsHeaders(options),        // 是否允许发送认证信息（如cookie）
    ...createMethodsHeaders(options),            // 允许的请求方法（GET、POST等）
    ...createAllowHeaderHeaders(event, options), // 允许的请求头
    ...createMaxAgeHeader(options),              // 预检结果缓存时间
  };
  
  // 将所有头部添加到响应中
  // 这就像把所有签证文件放入回复信封
  for (const [key, value] of Object.entries(headers)) {
    event.response.headers.append(key, value);
  }
}

/**
 * 向响应中添加 CORS 头部
 * 
 * 想象一下，当你成功获得签证并访问另一个国家时，
 * 海关会在你的护照上盖上入境章，表示你被允许进入。
 * 
 * 这个函数就是在每个正常的跨源请求响应中添加必要的CORS头部，
 * 告诉浏览器这个请求被允许跨源访问。这些头部包括：
 * - 允许的源（哪些网站可以访问）
 * - 是否允许发送认证信息（如cookie）
 * - 哪些响应头可以被浏览器访问
 */
export function appendCorsHeaders(event: H3Event, options: H3CorsOptions) {
  // 创建所有需要的CORS头部
  // 这些头部比预检请求的头部少，因为这是实际的请求了
  const headers = {
    ...createOriginHeaders(event, options),      // 允许的源（哪些网站可以访问）
    ...createCredentialsHeaders(options),        // 是否允许发送认证信息（如cookie）
    ...createExposeHeaders(options),             // 哪些响应头可以被浏览器访问
  };
  
  // 将所有头部添加到响应中
  // 这就像把入境章盖在你的护照上
  for (const [key, value] of Object.entries(headers)) {
    event.response.headers.append(key, value);
  }
}

/**
 * 处理传入请求的 CORS
 * 
 * 想象一下，这个函数就像是一个完整的签证和入境系统。
 * 它会检查每个请求，判断是签证申请（预检请求）还是实际入境（普通请求），
 * 然后分别处理。
 * 
 * 如果是预检请求，它会添加预检响应头并返回一个空的响应（204状态码），
 * 就像签证处理完成。
 * 
 * 如果是普通请求，它会添加必要的CORS头部，然后允许请求继续处理。
 * 
 * 如果返回值是空字符串("")，表示请求已经处理完成，不需要进一步操作。
 * 如果返回值是false，表示请求需要继续处理。
 * 
 * @example
 * // 使用示例：在路由中处理CORS
 * const app = createApp();
 * const router = createRouter();
 * router.use("/", async (event) => {
 *   // 处理CORS，允许所有源、所有方法访问
 *   const corsRes = handleCors(event, {
 *     origin: "*",           // 允许所有网站访问
 *     preflight: {
 *       statusCode: 204,     // 预检请求返回204状态码（无内容）
 *     },
 *     methods: "*",          // 允许所有HTTP方法
 *   });
 *   
 *   // 如果是预检请求，直接返回结果
 *   if (corsRes) {
 *     return corsRes;
 *   }
 *   
 *   // 如果不是预检请求，继续处理你的业务逻辑
 *   // Your code here
 * });
 */
export function handleCors(event: H3Event, options: H3CorsOptions): false | "" {
  // 解析和处理CORS选项，设置默认值
  // 这就像是准备签证和入境的规则
  const _options = resolveCorsOptions(options);
  
  // 检查是否是预检请求（签证申请）
  if (isPreflightRequest(event)) {
    // 如果是预检请求，添加预检响应头
    appendCorsPreflightHeaders(event, options);
    
    // 返回一个空的响应（204状态码 - 无内容）
    // 这就像签证处理完成，发回给申请人
    return noContent(event, _options.preflight.statusCode);
  }
  
  // 如果不是预检请求，添加普通的CORS头部
  // 这就像在实际入境时盖上入境章
  appendCorsHeaders(event, options);
  
  // 返回false表示请求需要继续处理
  // 这就像入境手续完成，现在可以进入国家了
  return false;
}
