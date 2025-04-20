/**
 * @file src/utils/internal/event-stream.ts
 * @description
 * 这个文件提供了用于处理服务器发送事件 (Server-Sent Events, SSE) 的内部工具。
 * SSE 是一种 Web 技术，允许服务器持续地向客户端单向推送数据流。
 * 想象一下，服务器就像一个广播电台，不断地向收听的客户端（浏览器）发送更新，
 * 例如股票价格、新闻更新或通知，而不需要客户端反复请求。
 *
 * 这个文件主要包含 `EventStream` 类，它封装了创建和管理 SSE 连接的逻辑，
 * 以及一些格式化 SSE 消息和设置相关 HTTP 头的辅助函数。
 */

import type { H3Event } from "../../types";
import type {
  EventStreamMessage,
  EventStreamOptions,
} from "../../types/utils/sse";

/**
 * @description
 * 一个用于处理 [服务器发送事件](https://developer.mozilla.org/zh-CN/docs/Web/API/Server-sent_events/Using_server-sent_events#%E4%BA%8B%E4%BB%B6%E6%B5%81%E6%A0%BC%E5%BC%8F) 的辅助类。
 * 它简化了在 H3 框架中创建和管理 SSE 连接的过程。
 *
 * 核心思想：
 * 1. 创建一个 `TransformStream`：这是一个内置的 Web Streams API，可以同时读写数据，起到中转站的作用。
 * 2. 获取写入器 (`_writer`)：通过 `TransformStream` 的可写端获取写入器，用于向流中写入要发送给客户端的数据。
 * 3. 获取可读流 (`_transformStream.readable`)：`TransformStream` 的可读端，最终会作为 HTTP 响应体发送给客户端。
 * 4. `push` 方法：开发者调用此方法发送事件，数据会被编码并写入 `_writer`。
 * 5. 客户端：通过 HTTP 连接接收 `_transformStream.readable` 中的数据流。
 */
export class EventStream {
  // 当前的 H3 事件对象，包含请求和响应信息
  private readonly _event: H3Event;
  // 内部转换流，用于连接写入和读取
  private readonly _transformStream = new TransformStream();
  // 流的可写端写入器
  private readonly _writer: WritableStreamDefaultWriter;
  // 用于将字符串编码为字节流 (Uint8Array)
  private readonly _encoder: TextEncoder = new TextEncoder();

  // 标记写入器是否已关闭
  private _writerIsClosed = false;
  // 标记流是否处于暂停状态（用于背压处理）
  private _paused = false;
  // 存储暂停期间未能发送的数据
  private _unsentData: undefined | string;
  // 标记流是否已被完全处理和关闭
  private _disposed = false;
  // 标记 send() 方法是否已被调用，以防止重复设置响应头和状态码
  private _handled = false;

  /**
   * @description 创建一个新的 EventStream 实例。
   * @param event {H3Event} 当前的 H3 事件对象。
   * @param opts {EventStreamOptions} 配置选项。
   *   - `autoclose` (boolean, 默认 true): 当客户端连接关闭时，是否自动关闭服务器端的事件流。
   */
  constructor(event: H3Event, opts: EventStreamOptions = {}) {
    this._event = event;
    // 获取写入器
    this._writer = this._transformStream.writable.getWriter();
    // 监听写入器关闭事件
    this._writer.closed.then(() => {
      this._writerIsClosed = true;
    });
    // 如果启用了自动关闭，监听 Node.js 的 'close' 事件
    if (opts.autoclose !== false) {
      // 使用 event.node.res 访问底层的 Node.js 响应对象
      this._event.node?.res.once("close", () => this.close());
    }
  }

  /**
   * @description 向客户端推送新的事件。
   * 可以推送单个字符串、字符串数组、单个 EventStreamMessage 对象或其数组。
   *
   * @param message {string | string[] | EventStreamMessage | EventStreamMessage[]} 要发送的消息或消息数组。
   *   - `string`: 只包含 `data` 字段的简单消息。
   *   - `EventStreamMessage`: 包含 `id`, `event`, `retry`, `data` 字段的结构化消息。
   */
  async push(message: string): Promise<void>;
  async push(message: string[]): Promise<void>;
  async push(message: EventStreamMessage): Promise<void>;
  async push(message: EventStreamMessage[]): Promise<void>;
  async push(
    message: EventStreamMessage | EventStreamMessage[] | string | string[],
  ) {
    // 处理不同类型的输入，统一转换为 EventStreamMessage 或其数组
    if (typeof message === "string") {
      await this._sendEvent({ data: message });
      return;
    }
    if (Array.isArray(message)) {
      if (message.length === 0) {
        return;
      }
      // 如果是字符串数组，转换为 EventStreamMessage 数组
      if (typeof message[0] === "string") {
        const msgs: EventStreamMessage[] = [];
        for (const item of message as string[]) {
          msgs.push({ data: item });
        }
        await this._sendEvents(msgs);
        return;
      }
      // 如果是 EventStreamMessage 数组
      await this._sendEvents(message as EventStreamMessage[]);
      return;
    }
    // 如果是单个 EventStreamMessage 对象
    await this._sendEvent(message);
  }

  /**
   * @description 内部方法：格式化并发送单个事件消息。
   * 会处理暂停状态，将数据暂存到 `_unsentData`。
   * @param message {EventStreamMessage} 要发送的结构化消息。
   */
  private async _sendEvent(message: EventStreamMessage) {
    if (this._writerIsClosed) {
      // 如果写入器已关闭，则不执行任何操作
      return;
    }
    const payload = formatEventStreamMessage(message);
    if (this._paused && !this._unsentData) {
      // 如果处于暂停状态且暂存区为空，则将数据存入暂存区
      this._unsentData = payload;
      return;
    }
    if (this._paused) {
      // 如果处于暂停状态且暂存区已有数据，则追加数据
      this._unsentData += payload;
      return;
    }
    // 如果未暂停，则直接写入数据
    await this._writer
      .write(this._encoder.encode(payload))
      .catch(() => {
        // 写入失败时（例如连接已断开），忽略错误，因为通常会自动 close
      });
  }

  /**
   * @description 内部方法：格式化并发送多个事件消息。
   * @param messages {EventStreamMessage[]} 要发送的消息数组。
   */
  private async _sendEvents(messages: EventStreamMessage[]) {
    if (this._writerIsClosed) {
      return;
    }
    const payload = formatEventStreamMessages(messages);
    if (this._paused && !this._unsentData) {
      this._unsentData = payload;
      return;
    }
    if (this._paused) {
      this._unsentData += payload;
      return;
    }

    await this._writer.write(this._encoder.encode(payload)).catch(() => {
      // 忽略写入错误
    });
  }

  /**
   * @description 暂停事件流的发送。
   * 之后调用 `push` 发送的数据会被暂存，直到调用 `resume`。
   */
  pause() {
    this._paused = true;
  }

  /**
   * @description 检查事件流是否处于暂停状态。
   */
  get isPaused() {
    return this._paused;
  }

  /**
   * @description 恢复事件流的发送，并立即发送所有暂存的数据。
   */
  async resume() {
    this._paused = false;
    // 调用 flush 发送暂存数据
    await this.flush();
  }

  /**
   * @description 立即发送缓冲区中暂存的所有数据。
   * 通常在 `resume` 时自动调用，但也可以手动调用以确保数据尽快发送。
   */
  async flush() {
    if (this._writerIsClosed) {
      return;
    }
    if (this._unsentData?.length) {
      // 如果暂存区有数据
      try {
        // 尝试写入暂存数据
        await this._writer.write(this._encoder.encode(this._unsentData));
        // 清空暂存区
        this._unsentData = undefined;
      } catch {
        // 忽略写入错误
      }
    }
  }

  /**
   * @description 关闭事件流。
   * 这会尝试关闭内部的写入器 (`_writer`)。
   * 如果流已经通过 `send()` 方法发送给客户端，关闭写入器通常也会导致 HTTP 连接关闭。
   */
  async close() {
    if (this._disposed) {
      // 防止重复关闭
      return;
    }
    if (!this._writerIsClosed) {
      try {
        // 确保所有缓冲数据在关闭前发送（flush 包含在 close 内部）
        await this._writer.close();
      } catch {
        // 忽略关闭时可能发生的错误（例如流已经因为其他原因关闭）
      }
    }
    this._disposed = true;
  }

  /**
   * @description 注册一个回调函数，当事件流（写入器）关闭时触发。
   * @param cb {() => any} 回调函数。
   */
  onClosed(cb: () => any) {
    this._writer.closed.then(cb);
  }

  /**
   * @description 准备将事件流作为 HTTP 响应发送。
   * 这个方法应该在所有路由处理函数中被调用并返回其结果。
   * 它会设置必要的 SSE HTTP 响应头，并将内部转换流的可读端 (`ReadableStream`) 返回，
   * H3 框架会将其作为响应体发送给客户端。
   * @returns {Promise<ReadableStream>} 返回一个可读流，用于发送给客户端。
   */
  async send(): Promise<ReadableStream> {
    if (this._handled) {
      // 如果已经调用过 send，直接返回可读流，避免重复设置头和状态码
      return this._transformStream.readable;
    }
    // 设置 SSE 特定的 HTTP 响应头
    setEventStreamHeaders(this._event);
    // 设置 HTTP 状态码为 200 OK
    this._event.response.status = 200;
    this._handled = true;
    // 返回转换流的可读端
    return this._transformStream.readable;
  }
}

/**
 * @description 类型守卫：检查输入是否为 EventStream 类的实例。
 * @param input {unknown} 要检查的值。
 * @returns {boolean} 如果是 EventStream 实例则返回 true，否则返回 false。
 */
export function isEventStream(input: unknown): input is EventStream {
  if (typeof input !== "object" || input === null) {
    return false;
  }
  return input instanceof EventStream;
}

/**
 * @description 将单个 EventStreamMessage 对象格式化为符合 SSE 规范的字符串。
 * 格式：
 * ```
 * id: <message.id>
 * event: <message.event>
 * retry: <message.retry>
 * data: <message.data>
 * 
 * ```
 * （如果字段不存在，则对应的行会被省略）
 * 每个消息以两个换行符 (`\n\n`) 结尾。
 * @param message {EventStreamMessage} 要格式化的消息对象。
 * @returns {string} 格式化后的 SSE 消息字符串。
 */
export function formatEventStreamMessage(message: EventStreamMessage): string {
  let result = "";
  if (message.id) {
    result += `id: ${message.id}\n`;
  }
  if (message.event) {
    result += `event: ${message.event}\n`;
  }
  if (typeof message.retry === "number" && Number.isInteger(message.retry)) {
    result += `retry: ${message.retry}\n`;
  }
  // data 字段是必需的
  result += `data: ${message.data}\n\n`; // 注意末尾的两个换行符
  return result;
}

/**
 * @description 将多个 EventStreamMessage 对象格式化为单个字符串，每个消息之间由格式化后的字符串连接。
 * @param messages {EventStreamMessage[]} 要格式化的消息对象数组。
 * @returns {string} 包含所有格式化消息的字符串。
 */
export function formatEventStreamMessages(
  messages: EventStreamMessage[],
): string {
  let result = "";
  for (const msg of messages) {
    result += formatEventStreamMessage(msg);
  }
  return result;
}

/**
 * @description 为 SSE 连接设置必要的 HTTP 响应头。
 * @param event {H3Event} 当前的 H3 事件对象。
 */
export function setEventStreamHeaders(event: H3Event) {
  // 设置 Content-Type 为 text/event-stream
  event.response.headers.set("content-type", "text/event-stream");
  // 设置 Cache-Control，防止代理或浏览器缓存事件流
  event.response.headers.set(
    "cache-control",
    "private, no-cache, no-store, no-transform, must-revalidate, max-age=0",
  );
  // 特殊头，防止 Nginx 等反向代理缓冲响应体，确保实时性
  event.response.headers.set("x-accel-buffering", "no");

  // 对于 HTTP/1.x 连接，明确设置 Connection: keep-alive
  // HTTP/2 及更高版本默认就是持久连接，不需要这个头
  if (!isHttp2Request(event)) {
    event.response.headers.set("connection", "keep-alive");
  }
}

/**
 * @description 检查当前请求是否通过 HTTP/2 或更高版本协议发出的。
 * HTTP/2 及更高版本的请求通常包含以冒号开头的伪标头 (pseudo-headers)，例如 `:path` 或 `:method`。
 * 通过检查这些标头的存在，可以判断协议版本。
 * @param event {H3Event} 当前的 H3 事件对象。
 * @returns {boolean} 如果是 HTTP/2 或更高版本，返回 true，否则返回 false。
 */
export function isHttp2Request(event: H3Event) {
  // 检查是否存在 HTTP/2 特有的伪标头
  return (
    event.request.headers.has(":path") || event.request.headers.has(":method")
  );
}
