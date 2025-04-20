/**
 * static.ts - 静态文件服务工具
 * 
 * 这个文件包含了用于提供静态文件服务的函数。
 * 
 * 什么是静态文件？想象一下，当你访问一个网站时，你看到的图片、视频、
 * CSS样式表和JavaScript文件等都是静态文件。这些文件不需要特别的处理，
 * 服务器只需要把它们原封不动地发送给浏览器就可以了。
 * 
 * 这个文件的主要功能是提供一个 serveStatic 函数，它可以根据请求路径
 * 动态地提供静态文件服务。
 */

// 导入我们需要的类型和函数
import type { H3Event, StaticAssetMeta, ServeStaticOptions } from "../types";
import { createError } from "../error";
import {
  withLeadingSlash,     // 确保路径以斜杠开头
  withoutTrailingSlash, // 移除路径末尾的斜杠
  getPathname,          // 获取URL的路径部分
} from "./internal/path";

/**
 * 根据请求路径动态提供静态资源服务
 * 
 * 想象一下，这个函数就像一个图书馆管理员。当有人来借书时，
 * 管理员会根据你要求的书名，去书架上找到这本书，然后给你。
 * 
 * 这个函数就是这样工作的：
 * 1. 它首先检查请求的方法是否是 GET 或 HEAD（这是获取文件的标准方法）
 * 2. 然后它会解析请求路径，找出你想要的文件
 * 3. 如果文件存在，它会设置一些特殊的响应头（如文件类型、大小等）
 * 4. 最后它会返回文件的内容
 * 
 * 这个函数还处理了一些高级功能，如缓存控制（使用ETag和修改时间）
 * 和内容编码（如gzip压缩）。
 * 
 * @param event H3事件对象，包含了HTTP请求的所有信息
 * @param options 静态文件服务的选项，包括如何获取文件元数据和内容
 * @returns 如果成功找到文件，返回文件内容；如果文件未修改，返回空字符串；如果找不到文件且fallthrough为true，返回false
 */
export async function serveStatic(
  event: H3Event,                // H3事件对象
  options: ServeStaticOptions,    // 静态文件服务的选项
): Promise<false | undefined | null | BodyInit> {  // 返回多种可能的类型
  // 检查请求方法是否是 GET 或 HEAD
  // 就像图书馆只允许借书，不允许修改或删除书
  if (event.request.method !== "GET" && event.request.method !== "HEAD") {
    // 如果不允许继续处理（fallthrough为false）
    if (!options.fallthrough) {
      // 设置允许的方法头部
      event.response.headers.set("allow", "GET, HEAD");
      // 抛出405错误（方法不允许）
      throw createError({
        statusMessage: "Method Not Allowed",  // 状态消息：方法不允许
        statusCode: 405,                     // 状态码：405
      });
    }
    // 如果允许继续处理，返回false表示未处理这个请求
    return false;
  }

  // 解析请求路径，得到文件的原始ID
  // 这就像图书馆管理员解析你要求的书名
  const originalId = decodeURI(
    withLeadingSlash(withoutTrailingSlash(getPathname(event.path))),
  );

  // 解析请求的接受编码头，得到浏览器支持的编码方式（如gzip压缩）
  // 这就像图书馆管理员检查你能接受什么格式的书（如电子书、有声书等）
  const acceptEncodings = parseAcceptEncoding(
    event.request.headers.get("accept-encoding") || "",
    options.encodings,
  );

  // 如果有多种编码方式，设置响应头告知浏览器响应会因编码方式不同而变化
  // 这就像告诉你：“根据你能接受的格式，我会给你不同版本的书”
  if (acceptEncodings.length > 1) {
    event.response.headers.set("vary", "accept-encoding");
  }

  // 初始化文件ID和元数据变量
  let id = originalId;  // 最终使用的文件ID
  let meta: StaticAssetMeta | undefined;  // 文件的元数据（如类型、大小等）

  // 生成可能的文件路径列表
  // 这就像图书馆管理员准备了多个可能的书名来查找
  // 例如，如果你要求"/books"，管理员会尝试找"/books"、"/books/index.html"等
  const _ids = idSearchPaths(
    originalId,                          // 原始路径
    acceptEncodings,                      // 支持的编码方式
    options.indexNames || ["/index.html"], // 默认索引文件名
  );

  // 遍历所有可能的文件路径，找到第一个存在的文件
  // 这就像图书馆管理员依次检查每个可能的书名，直到找到一本存在的书
  for (const _id of _ids) {
    // 获取文件的元数据
    const _meta = await options.getMeta(_id);
    // 如果文件存在（有元数据）
    if (_meta) {
      meta = _meta;  // 保存元数据
      id = _id;     // 保存文件ID
      break;        // 结束循环，不再继续查找
    }
  }

  // 如果没有找到文件（没有元数据）
  // 这就像图书馆管理员找遍了所有可能的书名，但都没有找到书
  if (!meta) {
    // 如果不允许继续处理（fallthrough为false）
    if (!options.fallthrough) {
      // 抛出404错误（文件未找到）
      throw createError({
        statusMessage: "Cannot find static asset " + id,  // 状态消息：找不到静态资源
        statusCode: 404,                                // 状态码：404
      });
    }
    // 如果允许继续处理，返回false表示未处理这个请求
    return false;
  }

  // 如果文件有ETag（内容标识符）且响应头中还没有设置，就设置它
  // ETag就像书的版本号，用来判断书是否发生了变化
  if (meta.etag && !event.response.headers.has("etag")) {
    event.response.headers.set("etag", meta.etag);
  }

  // 检查浏览器发送的if-none-match头是否与ETag匹配
  // 这就像浏览器在说：“我已经有这个版本的书了，如果没有新版本就不用给我了”
  const ifNotMatch =
    meta.etag && event.request.headers.get("if-none-match") === meta.etag;
  // 如果匹配（文件没有变化）
  if (ifNotMatch) {
    // 设置304状态码（未修改）
    event.response.status = 304;
    event.response.statusText = "Not Modified";
    // 返回空字符串，因为浏览器已经有缓存的内容
    return "";
  }

  // 如果文件有修改时间
  // 这就像书的出版日期，用来判断书是否是最新版本
  if (meta.mtime) {
    // 将修改时间转换为Date对象
    const mtimeDate = new Date(meta.mtime);

    // 获取浏览器发送的if-modified-since头
    // 这就像浏览器在说：“只给我在这个日期之后修改的书”
    const ifModifiedSinceH = event.request.headers.get("if-modified-since");
    // 如果浏览器发送了if-modified-since头，且文件在该日期之后没有修改
    if (ifModifiedSinceH && new Date(ifModifiedSinceH) >= mtimeDate) {
      // 设置304状态码（未修改）
      event.response.status = 304;
      event.response.statusText = "Not Modified";
      // 返回空字符串，因为浏览器已经有缓存的内容
      return "";
    }

    // 如果响应头中还没有设置last-modified，就设置它
    // 这就像告诉浏览器：“这本书的最后修改日期是...”
    if (!event.response.headers.get("last-modified")) {
      event.response.headers.set("last-modified", mtimeDate.toUTCString());
    }
  }

  // 如果文件有类型信息且响应头中还没有设置content-type，就设置它
  // 这就像告诉浏览器：“这是一本什么类型的书（如文字书、图画书等）”
  if (meta.type && !event.response.headers.get("content-type")) {
    event.response.headers.set("content-type", meta.type);
  }

  // 如果文件有编码信息且响应头中还没有设置content-encoding，就设置它
  // 这就像告诉浏览器：“这本书是用什么方式压缩的（如gzip）”
  if (meta.encoding && !event.response.headers.get("content-encoding")) {
    event.response.headers.set("content-encoding", meta.encoding);
  }

  // 如果文件有大小信息且响应头中还没有设置content-length，就设置它
  // 这就像告诉浏览器：“这本书有多少页”
  if (
    meta.size !== undefined &&
    meta.size > 0 &&
    !event.request.headers.get("content-length")
  ) {
    event.response.headers.set("content-length", meta.size + "");
  }

  // 如果请求方法是HEAD，只返回头部信息，不返回内容
  // 这就像你只想知道书的信息（如出版日期、页数），而不想真的拿到书
  if (event.request.method === "HEAD") {
    return "";
  }

  // 获取文件的实际内容
  // 这就像图书馆管理员最终把书给你
  const contents = await options.getContents(id);
  // 返回文件内容
  return contents;
}

// --- 内部工具函数 ---

/**
 * 解析接受编码头部
 * 
 * 这个函数将浏览器发送的accept-encoding头部解析成服务器支持的编码列表。
 * 想象一下，浏览器说：“我能理解gzip和br压缩”，这个函数就会把这些信息
 * 转换成服务器能理解的格式。
 * 
 * @param header 浏览器发送的accept-encoding头部，如"gzip, deflate, br"
 * @param encodingMap 编码映射表，如{"gzip": ".gz", "br": ".br"}
 * @returns 服务器支持的编码列表，如[".gz", ".br"]
 */
function parseAcceptEncoding(
  header?: string,
  encodingMap?: Record<string, string>,
): string[] {
  // 如果没有编码映射表或头部，返回空数组
  if (!encodingMap || !header) {
    return [];
  }
  // 将头部字符串转换为数组并处理
  return String(header || "")
    .split(",")                         // 按逗号分割，如["gzip", " deflate", " br"]
    .map((e) => encodingMap[e.trim()])   // 将每个编码转换为映射值，如[".gz", ".deflate", ".br"]
    .filter(Boolean);                    // 过滤掉不支持的编码（映射值为null或undefined）
}

/**
 * 生成可能的文件路径列表
 * 
 * 这个函数生成一系列可能的文件路径，包括不同的索引文件和编码组合。
 * 想象一下，如果你要找一本书，图书馆管理员会尝试查找不同的版本，
 * 如普通版、插图版、电子版等。
 * 
 * @param id 原始文件路径，如"/books"
 * @param encodings 支持的编码列表，如[".gz", ".br"]
 * @param indexNames 索引文件名列表，如["/index.html"]
 * @returns 所有可能的文件路径列表
 */
function idSearchPaths(id: string, encodings: string[], indexNames: string[]) {
  // 初始化文件路径数组
  const ids = [];

  // 遍历所有可能的后缀（空字符串和索引文件名）
  // 例如，如果原始路径是"/books"，这里会尝试"/books"和"/books/index.html"
  for (const suffix of ["", ...indexNames]) {
    // 遍历所有可能的编码（包括无编码）
    // 例如，如果支持的编码是[".gz", ".br"]，这里会尝试".gz"、".br"和""（无编码）
    for (const encoding of [...encodings, ""]) {
      // 将路径、后缀和编码组合起来，添加到文件路径数组中
      // 例如："/books"、"/books.gz"、"/books.br"、"/books/index.html"、"/books/index.html.gz"等
      ids.push(`${id}${suffix}${encoding}`);
    }
  }

  // 返回所有可能的文件路径
  return ids;
}
