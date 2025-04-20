/**
 * 响应工具函数模块
 * 
 * 这个文件包含了一系列帮助我们向网页访问者返回不同类型响应的函数。
 * 就像你写信给朋友一样，这些函数帮助服务器"写信"给浏览器，
 * 告诉浏览器该做什么（比如显示内容、跳转到其他页面等）。
 */

import type { H3Event, StatusCode } from "../types";
import { sanitizeStatusCode } from "./sanitize";
import {
  serializeIterableValue,
  coerceIterable,
  type IterationSource,
  type IteratorSerializer,
} from "./internal/iterable";

/**
 * 返回一个空的响应内容
 * 
 * 这个函数就像是给访问者回了一封空信封 - 没有实际内容，但告诉访问者"我收到你的请求了"。
 * 通常用于那些不需要返回任何数据的操作，比如删除某些内容后，只需告诉浏览器"操作成功了"。
 *
 * 默认情况下，它会返回一个状态码为204的响应。状态码就像是快递单上的状态标记，
 * 204表示"没有内容"，告诉浏览器"请求成功了，但没有内容可以显示"。
 * 
 * @example
 * // 当有人访问网站根目录时，返回一个空响应
 * app.use("/", () => noContent());
 *
 * @param event H3事件对象，包含了请求和响应的所有信息
 * @param code 要发送的状态码。默认是`204 No Content`（无内容）
 */
export function noContent(event: H3Event, code?: StatusCode): "" {
  // 获取当前的响应状态码
  const currentStatus = event.response.status;

  // 如果没有提供新的状态码，并且当前状态码存在且不是200，就使用当前的状态码
  if (!code && currentStatus && currentStatus !== 200) {
    code = event.response.status;
  }

  // 设置响应的状态码，如果提供的状态码无效，则使用204
  event.response.status = sanitizeStatusCode(code, 204);

  // 204响应（无内容）不能有Content-Length头字段
  // 这是HTTP协议的规则，就像寄空信封时不需要写信封里有多少张纸
  // https://www.rfc-editor.org/rfc/rfc7230#section-3.3.2
  if (event.response.status === 204) {
    event.response.headers.delete("content-length");
  }

  // 返回空字符串作为响应体
  return "";
}

/**
 * 发送重定向响应给客户端
 * 
 * 重定向就像是告诉访问者："你要找的东西不在这里，请到这个新地址去找"。
 * 想象一下，当你去图书馆找一本书，但图书管理员告诉你："这本书已经移到了二楼"，
 * 这就是网页中的重定向功能。
 *
 * 这个函数做了两件事：
 * 1. 添加一个`location`头部告诉浏览器新的地址
 * 2. 默认设置状态码为302（临时重定向）
 *
 * 同时，它还在响应体中发送一个简单的HTML页面，包含一个meta刷新标签，
 * 这是为了防止某些浏览器忽略了头部信息，这个HTML页面会自动跳转到新地址。
 * 就像是在路标上不仅写了"前方改道"，还画了一个箭头指向新路一样，双重保险！
 *
 * @example
 * // 当有人访问网站根目录时，将他们重定向到example.com
 * app.use("/", (event) => {
 *   return redirect(event, "https://example.com");
 * });
 *
 * @example
 * // 使用301状态码进行永久重定向（告诉浏览器和搜索引擎：这个地址永远都改变了）
 * app.use("/", (event) => {
 *   return redirect(event, "https://example.com", 301); // 永久重定向
 * });
 */
export function redirect(
  event: H3Event,
  location: string,
  code: StatusCode = 302,
) {
  // 设置响应状态码，默认是302（临时重定向）
  event.response.status = sanitizeStatusCode(code, event.response.status);
  
  // 设置location头部，告诉浏览器要跳转到哪个地址
  event.response.headers.set("location", location);
  
  // 处理URL中的双引号，将它们编码为%22，防止HTML注入攻击
  const encodedLoc = location.replace(/"/g, "%22");
  
  // 创建一个简单的HTML页面，包含meta刷新标签，作为备用的重定向方法
  // content="0; url=..."中的0表示立即刷新
  const html = `<!DOCTYPE html><html><head><meta http-equiv="refresh" content="0; url=${encodedLoc}"></head></html>`;
  
  // 如果还没有设置内容类型，将其设置为HTML
  if (!event.response.headers.has("content-type")) {
    event.response.headers.set("content-type", "text/html");
  }
  
  // 返回HTML内容
  return html;
}

/**
 * 向客户端写入`HTTP/1.1 103 Early Hints`（早期提示）
 * 
 * 这个函数就像是提前告诉浏览器："嘿，我正在准备你要的内容，但你可以先开始准备这些东西！"
 * 
 * 想象你去餐厅点餐，服务员说："您的主菜还在准备中，不过您可以先拿些面包和饮料。"
 * Early Hints就是这样的功能 - 它允许服务器在完整响应准备好之前，
 * 提前告诉浏览器一些信息，比如需要加载的CSS或JavaScript文件，
 * 这样浏览器可以提前开始下载这些资源，加快页面加载速度。
 * 
 * @param event H3事件对象
 * @param hints 提示信息，是一个键值对对象，通常包含资源链接
 */
export function writeEarlyHints(
  event: H3Event,
  hints: Record<string, string>,
): void | Promise<void> {
  // 检查当前环境是否支持writeEarlyHints功能
  // 如果不支持（比如在某些旧版本的Node.js或非Node环境中），就直接返回
  if (!event.node?.res?.writeEarlyHints) {
    return;
  }
  
  // 返回一个Promise，在Early Hints发送完成后解析
  return new Promise((resolve) => {
    // 调用Node.js的writeEarlyHints方法发送提示
    // 当提示发送完成后，调用resolve()完成Promise
    event.node?.res.writeEarlyHints(hints, () => resolve());
  });
}

/**
 * 流式响应：逐块发送数据给客户端
 * 
 * 想象你在看一个很长的视频，但不需要等整个视频下载完才能开始看，
 * 而是边下载边看。这个函数就是让服务器可以"边生成数据边发送"，
 * 而不是等所有数据都准备好了才一次性发送。
 * 
 * 这对于生成大量数据或需要长时间处理的请求特别有用，比如：
 * - 显示实时进度更新
 * - 生成大型报告
 * - 流式传输AI生成的内容
 *
 * 每个数据块必须是字符串或缓冲区(buffer)。
 *
 * 对于生成器(generator)函数，返回值和yield产生的值会被同等对待。
 *
 * @param event - H3事件对象
 * @param iterable - 产生响应数据块的迭代器
 * @param serializer - 将迭代器的值转换为流兼容值的函数
 * @template Value - 迭代器产生的值的类型
 * @template Return - 迭代器返回的最终值的类型
 *
 * @example
 * // 这个例子展示了如何创建一个实时更新的网页，显示任务进度
 * return iterable(event, async function* work() {
 *   // 首先发送HTML文档的开头部分
 *   yield "<!DOCTYPE html>\n<html><body><h1>正在执行...</h1><ol>\n";
 *   
 *   // 执行一些工作...
 *   for (let i = 0; i < 1000) {
 *     // 等待1秒
 *     await delay(1000);
 *     
 *     // 发送进度更新，这会立即显示在用户的浏览器上
 *     yield `<li>完成了任务 #`;
 *     yield i;
 *     yield `</li>\n`;
 *   }
 *   
 *   // 最后发送HTML文档的结尾部分
 *   return `</ol></body></html>`;
 * })
 * 
 * // 辅助函数：延迟指定的毫秒数
 * async function delay(ms) {
 *   return new Promise(resolve => setTimeout(resolve, ms));
 * }
 */
export function iterable<Value = unknown, Return = unknown>(
  _event: H3Event,
  iterable: IterationSource<Value, Return>,
  options?: {
    serializer: IteratorSerializer<Value | Return>;
  },
): ReadableStream {
  // 获取序列化器，如果没有提供，就使用默认的序列化器
  const serializer = options?.serializer ?? serializeIterableValue;
  
  // 确保输入是一个可迭代对象
  const iterator = coerceIterable(iterable);
  
  // 创建一个可读流，这是现代浏览器支持的标准流式传输方式
  return new ReadableStream({
    // 当流需要更多数据时，这个函数会被调用
    async pull(controller) {
      // 获取迭代器的下一个值
      const { value, done } = await iterator.next();
      
      // 如果有值，就将其序列化并加入到流中
      if (value !== undefined) {
        const chunk = serializer(value);
        if (chunk !== undefined) {
          controller.enqueue(chunk); // 将数据块加入队列，发送给客户端
        }
      }
      
      // 如果迭代器已完成，就关闭流
      if (done) {
        controller.close();
      }
    },
    
    // 如果流被取消（比如用户关闭了页面），这个函数会被调用
    cancel() {
      // 如果迭代器有return方法，就调用它来清理资源
      iterator.return?.();
    },
  });
}
