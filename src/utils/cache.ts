/**
 * cache.ts - 缓存处理工具
 * 
 * 这个文件包含了用于处理HTTP缓存的函数。
 * 
 * 什么是缓存？想象一下，当你去图书馆借一本书时，你可能会先在家里查看你是否已经有这本书了。
 * 如果你已经有了，而且这本书没有更新过，那么你就不需要再去图书馆了。
 * 这就是缓存的基本原理。
 * 
 * 在Web世界中，浏览器会将网站的资源（如图片、CSS、JavaScript文件等）存储在本地。
 * 当你再次访问同一网站时，浏览器会先检查这些资源是否已经被缓存，
 * 如果是，它会再检查这些资源是否过期或被修改。
 * 如果没有变化，浏览器就会直接使用缓存的版本，而不是重新从服务器下载。
 * 
 * 这个文件中的函数帮助我们处理这些缓存相关的头部信息，使我们的应用程序可以更高效地运行。
 */

import type { CacheConditions, H3Event } from "../types";

/**
 * 检查请求的缓存头部（`If-Modified-Since`）并添加缓存头部（Last-Modified, Cache-Control）
 * 
 * 想象一下，这个函数就像是一个图书管理员。当你来借书时，你可能会说：
 * “我上次看到这本书是在2023年1月1日，如果书没有更新，我就不需要再借了。”
 * 管理员会检查这本书的最后修改日期，如果没有变化，就会告诉你可以继续使用你已经有的版本。
 * 
 * 注意：默认情况下会添加`public`缓存控制，这意味着这个资源可以被所有人缓存
 * 
 * @param event H3事件对象，包含了HTTP请求和响应的信息
 * @param opts 缓存条件，包括最大寿命、修改时间、ETag等
 * @returns 当缓存头部匹配时返回`true`。当返回`true`时，不应再发送任何响应内容
 */
export function handleCacheHeaders(
  event: H3Event,      // H3事件对象
  opts: CacheConditions,  // 缓存条件
): boolean {
  // 初始化缓存控制指令数组，默认包含"public"
  // 这就像是准备一个标签，上面写着这本书可以被所有人借阅
  const cacheControls = ["public", ...(opts.cacheControls || [])];
  
  // 初始化缓存匹配标志为false
  // 这就像是初始假设你需要一本新书
  let cacheMatched = false;

  // 如果指定了最大寿命，添加相应的缓存控制指令
  // 这就像是告诉你：“这本书可以借阅X天，之X天后需要重新借阅”
  if (opts.maxAge !== undefined) {
    cacheControls.push(`max-age=${+opts.maxAge}`, `s-maxage=${+opts.maxAge}`);
  }

  // 如果指定了修改时间，处理Last-Modified和If-Modified-Since头部
  // 这就像是检查书的最后修订日期，并与你上次看到的版本进行比较
  if (opts.modifiedTime) {
    // 创建一个日期对象，表示资源的最后修改时间
    // 这就像是查看书的出版日期
    const modifiedTime = new Date(opts.modifiedTime);
    
    // 获取请求中的If-Modified-Since头部
    // 这就像是你告诉图书管理员你上次看到的书的版本日期
    const ifModifiedSince = event.request.headers.get("if-modified-since");
    
    // 设置响应的Last-Modified头部
    // 这就像是图书管理员告诉你这本书的实际最后修订日期
    event.response.headers.set("last-modified", modifiedTime.toUTCString());
    
    // 如果If-Modified-Since头部存在，并且资源自那时起没有修改
    // 这就像是：如果你上次看到的版本与当前版本相同或更新
    if (ifModifiedSince && new Date(ifModifiedSince) >= opts.modifiedTime) {
      // 标记缓存匹配
      // 这就像是图书管理员告诉你：“你已经有最新版本了，不需要重新借阅”
      cacheMatched = true;
    }
  }

  // 如果指定了ETag，处理ETag和If-None-Match头部
  // ETag就像是书的唯一标识符，每当内容变化时就会改变
  if (opts.etag) {
    // 设置响应的ETag头部
    // 这就像是图书管理员告诉你这本书的唯一编号
    event.response.headers.set("etag", opts.etag);
    
    // 获取请求中的If-None-Match头部
    // 这就像是你告诉图书管理员你手上的书的编号
    const ifNonMatch = event.request.headers.get("if-none-match");
    
    // 如果If-None-Match头部与ETag匹配
    // 这就像是：如果你手上的书的编号与当前书的编号相同
    if (ifNonMatch === opts.etag) {
      // 标记缓存匹配
      // 这就像是图书管理员告诉你：“你已经有这本书了，不需要重新借阅”
      cacheMatched = true;
    }
  }

  // 设置响应的Cache-Control头部
  // 这就像是图书管理员给你的书贴上借阅规则的标签
  event.response.headers.set("cache-control", cacheControls.join(", "));

  // 如果缓存匹配，设置响应状态为304 Not Modified
  // 这就像是图书管理员告诉你：“你已经有最新版本了，可以继续使用”
  if (cacheMatched) {
    event.response.status = 304;  // 304表示“未修改”
    return true;  // 返回true表示已处理完毕，不需要发送响应体
  }

  // 如果缓存不匹配，返回false
  // 这就像是图书管理员告诉你：“你需要借阅新版本的书”
  return false;
}
