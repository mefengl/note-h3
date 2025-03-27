/**
 * 响应处理模块
 * 
 * 这个文件负责将各种类型的数据转换成标准的HTTP响应。
 * 就像一个包装工厂，把不同的产品(数据)包装成统一的包装盒(响应)，
 * 这样客户端(浏览器)就能正确地接收和处理这些数据。
 */

// 导入必要的类型和函数
import type { H3Config, H3Event } from "./types";  // H3配置和事件类型
import type { H3Error, PreparedResponse } from "./types/h3";  // H3错误和准备好的响应类型
import type { H3WebEvent } from "./event";  // H3 Web事件类型
import { Response as SrvxResponse } from "srvx";  // 从服务库导入响应类
import { createError } from "./error";  // 导入创建错误的函数
import { isJSONSerializable } from "./utils/internal/object";  // 导入检查对象是否可以转换为JSON的函数

/**
 * 特殊符号常量，用于表示未找到路由
 * 
 * 这个符号就像一个特殊标记，当路由处理器返回这个符号时，
 * 服务器会知道这是一个404错误(未找到路由)。
 * 就像你在商店里找不到想要的玩具，店员会给你一个特殊的标记表示“没有这个商品”。
 */
export const kNotFound = /* @__PURE__ */ Symbol.for("h3.notFound");

/**
 * 特殊符号常量，用于表示请求已经被处理
 * 
 * 这个符号表示请求已经被处理，但不需要返回任何内容。
 * 就像你去餐厅点了餐，服务员说“好的，我们收到了”，但还没有给你上菜。
 */
export const kHandled = /* @__PURE__ */ Symbol.for("h3.handled");

/**
 * 准备HTTP响应
 * 
 * 这个函数将各种类型的数据转换成标准的HTTP响应对象。
 * 就像一个包装工人，把不同的商品打包成统一的包装盒。
 * 
 * @param val 要发送的数据，可以是任何类型
 * @param event HTTP请求事件
 * @param config H3框架配置
 * @returns 标准的HTTP响应对象
 */
export function prepareResponse(
  val: unknown,
  event: H3Event,
  config: H3Config,
): Response {
  // 检查是否是HEAD请求，HEAD请求只返回头信息，不返回主体
  // 就像你只想知道商品的信息，但不想真的买下来
  const isHead = event.method === "HEAD";

  // 如果值是kHandled符号，表示请求已处理，返回空响应
  // 就像服务员说“我们收到了你的请求”，但没有给你具体的东西
  if (val === kHandled) {
    return new Response(null);
  }

  // 如果已经是响应对象，则可能需要合并事件中的响应信息
  // 就像商品已经包装好了，但可能需要添加一些额外的标签或包装
  if (val instanceof Response) {
    const we = event as H3WebEvent;
    const status = we.response.status;  // 状态码，如200成功、404未找到
    const statusText = we.response.statusText;  // 状态文本，如"OK"或"Not Found"
    const headers = we.response._headers || we.response._headersInit;  // 响应头信息
    
    // 如果没有需要合并的信息，直接返回原响应
    if (!status && !statusText && !headers) {
      return val;
    }
    
    // 创建新的响应，合并事件中的响应信息
    // 如果是HEAD请求或特殊状态码，不包含响应体
    return new SrvxResponse(isHead || isNullStatus(status) ? null : val.body, {
      status: status || val.status,  // 优先使用事件中的状态码
      statusText: statusText || val.statusText,  // 优先使用事件中的状态文本
      headers: headers || val.headers,  // 优先使用事件中的头信息
    }) as Response;
  }

  // 对于其他类型的值，需要先准备响应体
  // 就像先把商品整理好，然后再包装
  const body = prepareResponseBody(val, event, config);  // 准备响应体
  const status = event.response.status;  // 获取状态码
  
  // 创建响应初始化对象
  const responseInit: PreparedResponse = {
    // 如果是HEAD请求或特殊状态码，不包含响应体
    body: isHead || isNullStatus(status) ? null : body,
    status,  // 状态码
    statusText: event.response.statusText,  // 状态文本
    headers: event.response._headers || event.response._headersInit,  // 头信息
  };

  // 创建并返回最终的响应对象
  return new SrvxResponse(responseInit.body, responseInit) as Response;
}

/**
 * 检查是否是不应该有响应体的HTTP状态码
 * 
 * 有些状态码根据HTTP规范不应该有响应体，这个函数用来检查。
 * 就像有些特殊的商店通知，只是告诉你信息，但不会给你实际的商品。
 * 
 * @param status HTTP状态码
 * @returns 如果是不应该有响应体的状态码返回true，否则返回false
 */
function isNullStatus(status?: number) {
  return (
    status &&
    (status === 100 ||  // 100 Continue - 继续发送请求
      status === 101 ||  // 101 Switching Protocols - 切换协议
      status === 102 ||  // 102 Processing - 处理中
      status === 204 ||  // 204 No Content - 无内容
      status === 205 ||  // 205 Reset Content - 重置内容
      status === 304)    // 304 Not Modified - 未修改
  );
}

/**
 * 准备响应体
 * 
 * 这个函数负责将不同类型的数据转换成适合HTTP响应的格式。
 * 就像一个翻译家，将不同语言(数据类型)翻译成浏览器能理解的语言(响应体)。
 * 
 * @param val 要发送的数据，可以是任何类型
 * @param event HTTP请求事件
 * @param config H3框架配置
 * @returns 处理后的响应体
 */
export function prepareResponseBody(
  val: unknown,
  event: H3Event,
  config: H3Config,
): BodyInit | null | undefined {
  // 空内容处理 - 如果值是null或undefined，返回空字符串
  // 就像你点了餐，但厨师告诉你“没有了”，给你一个空盘子
  if (val === null || val === undefined) {
    return "";
  }

  // 未找到路由处理 - 如果值是kNotFound符号，返回404错误
  // 就像你去商店找一个不存在的商品，店员告诉你“我们没有这个”
  if (val === kNotFound) {
    return prepareErrorResponseBody(
      {
        statusCode: 404,  // 404状态码表示“未找到”
        statusMessage: `Cannot find any route matching [${event.request.method}] ${event.path}`,  // 错误消息，说明找不到匹配的路由
      },
      event,
      config,
    );
  }

  // 获取值的类型，用于下面的判断
  const valType = typeof val;

  // 文本处理 - 如果是字符串，直接返回
  // 就像你写了一张纸条，直接交给服务员就行了
  if (valType === "string") {
    return val as string;
  }

  // 二进制数据处理 - 如果是Uint8Array(二进制数组)
  // 就像你给服务员一个密封的盒子，里面是特殊的数据
  if (val instanceof Uint8Array) {
    event.response.setHeader("content-length", val.byteLength.toString());
    return val;
  }

  // 错误处理 - 如果是Error对象，转换为错误响应
  // 就像厨师做菜时出了错，服务员需要告诉你出了什么问题
  if (val instanceof Error) {
    return prepareErrorResponseBody(val, event, config);
  }

  // JSON处理 - 如果是可以转换为JSON的对象
  // 就像把复杂的菜单转换成一种特定格式，让所有人都能读懂
  if (isJSONSerializable(val, valType)) {
    // 设置内容类型为JSON，并指定字符编码
    event.response.setHeader("content-type", "application/json; charset=utf-8");
    // 将对象转换为JSON字符串，如果是调试模式则美化输出(缩进2空格)
    return JSON.stringify(val, undefined, config.debug ? 2 : undefined);
  }

  // 大整数处理 - 如果是bigint类型(超过普通整数范围的数字)
  // 就像一个特别大的数字，需要特殊处理
  if (valType === "bigint") {
    event.response.setHeader("content-type", "application/json; charset=utf-8");
    // 将大整数转换为字符串
    return val.toString();
  }

  // Web响应处理 - 如果已经是Response对象
  // 就像厨师已经准备好了一道菜，服务员只需要端给客人
  if (val instanceof Response) {
    // 复制状态码和状态文本
    event.response.status = val.status;
    event.response.statusText = val.statusText;
    // 复制所有响应头
    for (const [name, value] of val.headers) {
      event.response.setHeader(name, value);
    }
    // 返回响应体
    return val.body;
  }

  // Blob处理 - 如果是Blob对象(二进制大对象)
  // 就像一个大文件或图片，需要特殊处理
  if (val instanceof Blob) {
    // 设置内容类型，使用Blob自带的类型
    event.response.setHeader("content-type", val.type);
    // 设置内容长度
    event.response.setHeader("content-length", val.size.toString());
    // 返回Blob的数据流
    return val.stream();
  }

  // 不支持的类型处理 - Symbol或Function不能直接发送
  // 就像你想点一道菜单上没有的菜，服务员会告诉你“不好意思，我们不提供这道菜”
  if (valType === "symbol" || valType === "function") {
    return prepareErrorResponseBody(
      {
        statusCode: 500,  // 500状态码表示服务器内部错误
        statusMessage: `[h3] Cannot send ${valType} as response.`,  // 错误消息，说明不能发送这种类型
      },
      event,
      config,
    );
  }

  // 如果没有匹配到上面的任何类型，尝试直接返回
  // 就像服务员说“我不知道这是什么，但我还是给你端上来”
  return val as BodyInit;
}

/**
 * 准备错误响应体
 * 
 * 这个函数将错误对象转换成标准的错误响应格式。
 * 就像在餐厅里，当厨师做菜出错时，服务员需要以一种标准的方式告诉你出了什么问题。
 * 
 * @param val 错误对象或部分错误信息
 * @param event HTTP请求事件
 * @param config H3框架配置
 * @returns 格式化的错误响应JSON字符串
 */
export function prepareErrorResponseBody(
  val: Partial<H3Error> | Error,
  event: H3Event,
  config: H3Config,
): string {
  // 将任何类型的错误转换为标准的H3Error对象
  const error = createError(val as H3Error);
  
  // 设置响应的状态码和状态消息
  event.response.status = error.statusCode;  // 例如404、500等
  event.response.statusText = error.statusMessage;  // 例如"Not Found"、"Internal Server Error"
  
  // 设置响应内容类型为JSON
  event.response.setHeader("content-type", "application/json; charset=utf-8");
  
  // 将错误信息转换为JSON格式的字符串
  return JSON.stringify({
    statusCode: error.statusCode,  // 错误状态码
    statusMessage: error.statusMessage,  // 错误状态消息
    data: error.data,  // 错误相关的数据
    stack:
      // 如果是调试模式且错误有堆栈信息，则包含堆栈信息
      // 堆栈信息就像错误发生的路径，帮助开发者定位问题
      config.debug && error.stack
        ? error.stack.split("\n").map((l) => l.trim())  // 将堆栈按行分割并去除多余空格
        : undefined,  // 非调试模式下不返回堆栈信息，避免泄露敏感信息
  });
}
