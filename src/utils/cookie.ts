/**
 * cookie.ts - Cookie处理工具
 * 
 * 这个文件包含了用于处理HTTP Cookie的函数。
 * Cookie就像是网站给你的一张小纸条，上面记录了一些信息，
 * 比如你的登录状态、偏好设置等。当你再次访问这个网站时，
 * 浏览器会自动把这张小纸条交给网站，这样网站就能记住你是谁了。
 * 
 * 这个文件提供了四个主要功能：
 * 1. 读取所有Cookie (parseCookies)
 * 2. 获取特定的Cookie (getCookie)
 * 3. 设置Cookie (setCookie)
 * 4. 删除Cookie (deleteCookie)
 */

// 导入我们需要的类型和函数
import type { CookieSerializeOptions, SetCookie } from "cookie-es";
import type { H3Event } from "../types";
import {
  parse as parseCookie,      // 用于解析Cookie字符串
  serialize as serializeCookie,  // 用于将Cookie对象转换为字符串
  parseSetCookie,            // 用于解析Set-Cookie头
} from "cookie-es";

/**
 * 解析请求中的Cookie并返回所有Cookie的名称-值对
 * 
 * 想象一下：当你去商店时，你可能会带着一堆会员卡。这个函数就像是把所有会员卡
 * 从你的钱包里取出来，然后整理成一个清单，这样店员就能知道你有哪些会员卡了。
 * 
 * 在网络世界中，Cookie就像是这些会员卡，它们存储在浏览器中，
 * 每次访问网站时都会自动发送给服务器。
 * 
 * @param event {H3Event} H3事件对象，包含了HTTP请求的所有信息
 * @returns 返回一个对象，包含所有Cookie的名称和值
 * ```ts
 * // 使用示例
 * const cookies = parseCookies(event)
 * console.log(cookies.userId) // 输出：可能是"12345"
 * ```
 */
export function parseCookies(event: H3Event): Record<string, string> {
  // 从请求头中获取cookie字符串，如果没有则使用空字符串
  // 这就像从信封中取出所有的小纸条
  const cookieHeader = event.request.headers.get("cookie") || "";
  
  // 使用parseCookie函数解析cookie字符串，转换成一个对象
  // 例如："name=小明; age=10" 会被转换为 {name: "小明", age: "10"}
  return parseCookie(cookieHeader);
}

/**
 * 根据名称获取特定的Cookie值
 * 
 * 想象一下：你有一堆不同的会员卡，但你只想找出你的图书馆会员卡。
 * 这个函数就是帮你在所有会员卡中找出特定的那一张。
 * 
 * 在网站中，我们经常需要读取特定的Cookie，比如用户ID或登录令牌。
 * 这个函数让我们能够轻松地获取这些特定的值。
 * 
 * @param event {H3Event} H3事件对象，包含了HTTP请求的所有信息
 * @param name 要获取的Cookie的名称，比如"userId"或"token"
 * @returns {*} 返回Cookie的值（字符串）或undefined（如果找不到）
 * ```ts
 * // 使用示例：获取名为'Authorization'的Cookie
 * const authorization = getCookie(request, 'Authorization')
 * if (authorization) {
 *   console.log("用户已登录，令牌是：" + authorization)
 * } else {
 *   console.log("用户未登录")
 * }
 * ```
 */
export function getCookie(event: H3Event, name: string): string | undefined {
  // 首先使用parseCookies函数获取所有的Cookie
  const cookies = parseCookies(event);
  
  // 然后从所有Cookie中找出名称匹配的那一个
  // 这就像在一堆会员卡中找出特定名称的那张卡
  return cookies[name]; // 如果找不到，会返回undefined
}

/**
 * 设置一个Cookie
 * 
 * 想象一下：这就像是商店给你发放一张新的会员卡，或者更新你现有会员卡上的信息。
 * 这张卡片会在你下次访问商店时自动被识别。
 * 
 * 在网站中，我们经常需要设置Cookie来记住用户的信息或偏好设置。
 * 比如，当用户登录时，我们会设置一个Cookie来记住他们的登录状态。
 * 
 * @param event {H3Event} H3事件对象，包含了HTTP响应的所有信息
 * @param name Cookie的名称，比如"userId"或"theme"
 * @param value Cookie的值，比如"12345"或"dark"
 * @param options {CookieSerializeOptions} Cookie的选项，比如过期时间、安全设置等
 * ```ts
 * // 使用示例：设置一个名为'Authorization'的Cookie，值为'1234567'
 * setCookie(res, 'Authorization', '1234567')
 * 
 * // 使用选项：设置一个会在1小时后过期的Cookie
 * setCookie(res, 'theme', 'dark', { maxAge: 3600 })
 * ```
 */
export function setCookie(
  event: H3Event,  // H3事件对象
  name: string,    // Cookie的名称
  value: string,   // Cookie的值
  options?: CookieSerializeOptions,  // Cookie的选项
) {
  // 将Cookie序列化成字符串
  // 这就像把会员卡信息写到卡片上，默认这张卡在网站的所有页面都有效（path: "/"）
  const newCookie = serializeCookie(name, value, { path: "/", ...options });

  // 检查是否已经有其他Cookie设置
  // 这就像检查是否已经准备好了其他会员卡要发给用户
  const currentCookies = event.response.headers.getSetCookie();
  
  // 如果没有其他Cookie，直接设置这个新Cookie
  if (currentCookies.length === 0) {
    event.response.headers.set("set-cookie", newCookie);
    return;
  }

  // 如果已经有其他Cookie，需要合并并去重
  // 这就像确保不会给用户发放重复的会员卡
  
  // 生成新Cookie的唯一标识
  const newCookieKey = _getDistinctCookieKey(
    name,
    (options || {}) as SetCookie,
  );
  
  // 删除所有现有的Cookie设置
  event.response.headers.delete("set-cookie");
  
  // 重新添加所有不重复的Cookie
  for (const cookie of currentCookies) {
    // 获取当前Cookie的唯一标识
    const _key = _getDistinctCookieKey(
      cookie.split("=")?.[0],  // 获取Cookie名称
      parseSetCookie(cookie),  // 解析Cookie选项
    );
    
    // 如果与新Cookie重复，跳过
    if (_key === newCookieKey) {
      continue;
    }
    
    // 添加不重复的Cookie
    event.response.headers.append("set-cookie", cookie);
  }
  
  // 最后添加新Cookie
  event.response.headers.append("set-cookie", newCookie);
}

/**
 * 删除一个Cookie
 * 
 * 想象一下：这就像是收回或注销一张会员卡。当你不再需要某个会员卡时，
 * 商店会把它从系统中删除，这样下次你来时就不会再被识别为会员了。
 * 
 * 在网站中，当用户退出登录或会话结束时，我们通常需要删除相关的Cookie。
 * 这个函数帮助我们完成这个任务。
 * 
 * @param event {H3Event} H3事件对象，包含了HTTP响应的所有信息
 * @param name 要删除的Cookie的名称
 * @param serializeOptions {CookieSerializeOptions} Cookie的选项
 * ```ts
 * // 使用示例：删除名为'SessionId'的Cookie
 * deleteCookie(res, 'SessionId')
 * 
 * // 使用选项：删除特定域名下的Cookie
 * deleteCookie(res, 'tracking', { domain: 'analytics.example.com' })
 * ```
 */
export function deleteCookie(
  event: H3Event,  // H3事件对象
  name: string,    // 要删除的Cookie的名称
  serializeOptions?: CookieSerializeOptions,  // Cookie的选项
) {
  // 删除Cookie的技巧是：设置一个空值，并将过期时间设为0
  // 这就像给会员卡设置立即过期，这样浏览器就会立刻删除它
  setCookie(event, name, "", {  // 空值
    ...serializeOptions,        // 保留原有选项
    maxAge: 0,                  // 设置为立即过期
  });
}

/**
 * 生成Cookie的唯一标识
 * 
 * 这是一个内部函数，用于生成Cookie的唯一标识，以便进行去重。
 * Cookie的唯一性不仅由名称决定，还由域名、路径和其他安全选项共同决定。
 * 
 * 想象一下：这就像是给每张会员卡生成一个独特的编号，这个编号不仅包含卡的名称，
 * 还包含了这张卡可以在哪些商店使用、是否需要密码等信息。
 * 
 * @param name Cookie的名称
 * @param options Cookie的选项
 * @returns 唯一标识字符串
 */
function _getDistinctCookieKey(name: string, options: Partial<SetCookie>) {
  // 将Cookie的各种属性组合成一个唯一标识
  return [
    name,                     // Cookie名称
    options.domain || "",      // 域名（哪个网站可以使用这个Cookie）
    options.path || "/",       // 路径（网站的哪些页面可以使用这个Cookie）
    Boolean(options.secure),   // 是否只在HTTPS连接中发送
    Boolean(options.httpOnly), // 是否禁止JavaScript访问
    Boolean(options.sameSite), // 是否限制跨站点请求
  ].join(";");  // 用分号连接所有属性
}
