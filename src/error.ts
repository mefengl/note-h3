/**
 * 错误处理模块
 * 
 * 这个文件负责创建和处理H3框架中的错误。
 * 就像学校里的“错误收集箱”，当出现问题时，
 * 我们把错误收集起来，并以标准的格式告诉用户出了什么问题。
 */

// 导入必要的工具函数
import { hasProp } from "./utils/internal/object";  // 用于检查对象是否有某个属性
import { sanitizeStatusMessage, sanitizeStatusCode } from "./utils/sanitize";  // 用于清理状态码和状态消息

/**
 * H3 运行时错误类
 * 
 * 这是H3框架的自定义错误类，用于处理HTTP请求过程中的错误。
 * 就像学校里的“错误报告单”，上面有各种信息来说明出了什么问题。
 * 
 * @class 这是一个类的定义
 * @extends Error 继承自标准的Error类
 * @property {number} statusCode - HTTP响应状态码，例如404表示“未找到”，500表示“服务器错误”
 * @property {string} statusMessage - HTTP状态消息，例如“Not Found”或“Internal Server Error”
 * @property {boolean} fatal - 表示错误是否是致命错误（非常严重，无法恢复）
 * @property {boolean} unhandled - 表示错误是否未被处理并自动捕获
 * @property {DataT} data - 额外的数据，将包含在响应中，可用于提供关于错误的更多信息
 *                         就像错误报告单上的“详细说明”部分
 */
export class H3Error<DataT = unknown> extends Error {
  /** 
   * 静态标记，用于识别这是H3错误类
   * 就像学校的特殊印章，表示“这是官方错误报告单”
   */
  static __h3_error__ = true;
  
  /** 默认状态码为500（服务器内部错误） */
  statusCode = 500;
  
  /** 默认不是致命错误 */
  fatal = false;
  
  /** 默认不是未处理的错误 */
  unhandled = false;
  
  /** HTTP状态消息，可选 */
  statusMessage?: string;
  
  /** 错误相关的额外数据，可选 */
  data?: DataT;
  
  /** 错误的原因，可选 */
  cause?: unknown;

  /**
   * 创建一个新的H3Error实例
   * @param message 错误消息
   * @param opts 选项，可以包含错误原因
   */
  constructor(message: string, opts: { cause?: unknown } = {}) {
    // @ts-ignore https://v8.dev/features/error-cause
    // 调用父类的构造函数，传入错误消息和选项
    super(message, opts);

    // 为其他运行时环境填充cause属性
    // 就像在错误报告单上添加“错误原因”部分
    if (opts.cause && !this.cause) {
      this.cause = opts.cause;
    }
  }

  /**
   * 将错误转换为JSON格式
   * 
   * 这个方法将错误对象转换为纯文本的JSON格式，方便发送给客户端。
   * 就像把错误报告单转换成电子版本，可以通过电脑发送。
   * 
   * @returns 包含错误信息的纯对象
   */
  toJSON() {
    // 创建一个新对象，只包含需要的属性
    const obj: Pick<
      H3Error<DataT>,
      "message" | "statusCode" | "statusMessage" | "data"
    > = {
      // 包含错误消息
      message: this.message,
      // 包含清理过的状态码，如果无效则使用500
      statusCode: sanitizeStatusCode(this.statusCode, 500),
    };

    // 如果有状态消息，则添加到对象中（先清理一下）
    if (this.statusMessage) {
      obj.statusMessage = sanitizeStatusMessage(this.statusMessage);
    }
    // 如果有额外数据，也添加到对象中
    if (this.data !== undefined) {
      obj.data = this.data;
    }

    // 返回最终的纯对象，将用于转换为JSON字符串
    return obj;
  }
}

/**
 * 创建新的错误对象
 * 
 * 这个函数用于创建一个新的H3Error实例，可以处理内部和运行时错误。
 * 就像一个“错误报告单生成器”，可以快速创建标准格式的错误报告。
 * 
 * @param input {字符串 | (部分H3Error属性 & { status?: 数字; statusText?: 字符串 })} - 错误消息或包含错误属性的对象。
 * 如果提供的是字符串，它将被用作错误的`message`。
 * 
 * @example
 * // 字符串错误，其中`statusCode`默认为`500`
 * throw createError("发生了错误");
 * // 对象错误
 * throw createError({
 *   statusCode: 400,  // 状态码为400（错误请求）
 *   statusMessage: "Bad Request",  // 状态消息为“错误请求”
 *   message: "无效的输入",  // 错误消息
 *   data: { field: "email" }  // 额外数据，指出是email字段有问题
 * });
 * 
 * 
 * @return {H3Error} - H3Error的实例。
 * 
 * @remarks
 * - 通常，`message`包含错误的简短、人类可读的描述，而`statusMessage`是特定于HTTP响应的，
 *   描述与响应状态码相关的状态文本。
 *   就像错误报告单上的“标题”和“错误类型”。
 * - 在客户端-服务器交互中，建议使用简短的`statusMessage`，因为它可以在客户端访问。
 *   否则，在服务器上传递给`createError`的`message`不会传播到客户端。
 *   就像错误报告单上的“内部备注”不会展示给学生。
 * - 考虑避免在`message`中放入动态用户输入，以防止潜在的安全问题。
 *   就像不要直接把学生的原话写在正式的错误报告单上。
 */
export function createError<DataT = unknown>(
  input:
    | string
    | (Partial<H3Error<DataT>> & { status?: number; statusText?: string }),
) {
  // 如果输入是字符串，直接创建一个新的H3Error实例
  // 就像只提供错误消息，使用默认的其他设置
  if (typeof input === "string") {
    return new H3Error<DataT>(input);
  }

  // 如果输入已经是H3Error实例，直接返回它
  // 就像已经有一份填好的错误报告单，不需要再创建新的
  if (isError<DataT>(input)) {
    return input;
  }

  // 从原因中继承 H3Error 属性作为后备
  // 就像从原始错误报告中提取信息，如果新报告没有提供的话
  const cause: unknown = input.cause;

  // 创建新的H3Error实例
  // 使用input.message或input.statusMessage作为错误消息，如果都没有则用空字符串
  // 将cause或input本身设置为错误原因
  const err = new H3Error<DataT>(input.message ?? input.statusMessage ?? "", {
    cause: cause || input,
  });

  // 如果输入对象有stack属性，尝试将其复制到新错误对象
  // 堆栈信息就像错误发生的路径，帮助开发者定位问题
  if (hasProp(input, "stack")) {
    try {
      // 尝试使用属性描述符定义stack属性，这样每次访问都会调用getter
      Object.defineProperty(err, "stack", {
        get() {
          return input.stack;
        },
      });
    } catch {
      // 如果上面的方法失败，尝试直接赋值
      try {
        err.stack = input.stack;
      } catch {
        // 如果两种方法都失败，忽略错误
        // 就像说“好吧，我们无法复制这部分信息，但不影响主要功能”
      }
    }
  }

  // 如果输入对象有data属性，将其复制到新错误对象
  // 这是错误相关的额外数据，就像错误报告单上的“详细信息”部分
  if (input.data) {
    err.data = input.data;
  }

  // 确定状态码，按以下优先级查找：
  // 1. input.statusCode
  // 2. input.status
  // 3. cause对象的statusCode
  // 4. cause对象的status
  const statusCode =
    input.statusCode ??
    input.status ??
    (cause as H3Error)?.statusCode ??
    (cause as { status?: number })?.status;
  // 如果找到了有效的状态码，将其清理后设置到错误对象
  if (typeof statusCode === "number") {
    err.statusCode = sanitizeStatusCode(statusCode);
  }

  // 确定状态消息，按以下优先级查找：
  // 1. input.statusMessage
  // 2. input.statusText
  // 3. cause对象的statusMessage
  // 4. cause对象的statusText
  const statusMessage =
    input.statusMessage ??
    input.statusText ??
    (cause as H3Error)?.statusMessage ??
    (cause as { statusText?: string })?.statusText;
  // 如果找到了状态消息，将其清理后设置到错误对象
  if (statusMessage) {
    err.statusMessage = sanitizeStatusMessage(statusMessage);
  }

  // 确定是否为致命错误，优先使用input的fatal，如果没有则使用cause的fatal
  // 致命错误就像“非常严重的错误，需要立即处理”
  const fatal = input.fatal ?? (cause as H3Error)?.fatal;
  if (fatal !== undefined) {
    err.fatal = fatal;
  }

  // 确定是否为未处理的错误，优先使用input的unhandled，如果没有则使用cause的unhandled
  // 未处理的错误就像“没有人负责处理的错误，需要系统自动捕获”
  const unhandled = input.unhandled ?? (cause as H3Error)?.unhandled;
  if (unhandled !== undefined) {
    err.unhandled = unhandled;
  }

  // 返回创建好的错误对象
  return err;
}

/**
 * 检查给定输入是否是H3Error的实例
 * 
 * 这个函数用于检查一个对象是否是H3Error类型的错误。
 * 就像检查一份文件是否是正式的错误报告单，而不是普通的纸条。
 * 
 * @param input {*} - 要检查的输入对象。
 * @return {boolean} - 如果输入是H3Error的实例返回true，否则返回false。
 */
export function isError<DataT = unknown>(input: any): input is H3Error<DataT> {
  // 检查输入对象的构造函数是否有__h3_error__标记，并且值为true
  // 这就像检查文件上是否有官方的“错误报告单”印章
  return input?.constructor?.__h3_error__ === true;
}
