/**
 * body.ts - HTTP请求体处理工具
 * 
 * 这个文件包含了用于读取和验证HTTP请求体的函数。
 * 当我们在网络上发送数据时，数据会放在请求的"身体"(body)部分。
 * 这个文件帮助我们从请求中取出这些数据并确保它们是正确的格式。
 */

// 导入我们需要的类型和函数
import type { InferEventInput, ValidateFunction, H3Event } from "../types";
import { createError } from "../error";
import { validateData } from "./internal/validate";
import { parseURLEncodedBody } from "./internal/body";

/**
 * 读取请求体并尝试解析成JSON对象或URL编码的表单数据
 * 
 * 想象一下：当你在网站上填写表单并点击提交按钮时，你输入的所有信息都会被打包成一个"包裹"发送到服务器。
 * 这个函数就像是拆开这个包裹，把里面的内容取出来给我们使用。
 * 
 * 它可以处理两种常见的数据格式：
 * 1. JSON格式 - 这是一种像字典一样的数据格式，比如：{"名字":"小明", "年龄":10}
 * 2. URL编码格式 - 这是网页表单默认的格式，比如：名字=小明&年龄=10
 * 
 * @example
 * // 在网站代码中这样使用：
 * app.use("/", async (event) => {
 *   const body = await readBody(event);
 *   // 现在body可能是：{"名字":"小明", "年龄":10}
 *   console.log("收到的名字是：" + body.名字); // 输出：收到的名字是：小明
 * });
 *
 * @param event H3事件对象，包含了HTTP请求的所有信息
 * @param encoding 字符编码，默认是'utf-8'（支持中文等各国文字）
 *
 * @return {*} 返回解析后的数据，可能是对象、数组、字符串、数字、布尔值或null
 */
/**
 * readBody函数的具体实现
 */
export async function readBody<
  T, // 用户期望的返回数据类型
  _Event extends H3Event = H3Event, // 事件类型，默认是H3Event
  _T = InferEventInput<"body", _Event, T>, // 根据事件和用户期望推断出的实际返回类型
>(event: _Event): Promise<undefined | _T> { // 函数返回一个Promise，结果可能是undefined或_T类型的数据
  // 从请求中读取原始文本内容
  const text = await event.request.text();
  // 如果内容为空，就返回undefined
  if (!text) {
    return undefined;
  }

  // 获取内容类型，这告诉我们数据是什么格式
  // 就像快递包裹上的标签，告诉我们里面装的是什么
  const contentType = event.request.headers.get("content-type") || "";
  
  // 如果是URL编码的表单数据（网页表单默认格式）
  if (contentType.startsWith("application/x-www-form-urlencoded")) {
    // 使用专门的函数解析这种格式
    // 例如："名字=小明&年龄=10" 会被转换为 {"名字":"小明", "年龄":"10"}
    return parseURLEncodedBody(text) as _T;
  }

  // 否则尝试解析为JSON格式
  try {
    // JSON.parse把JSON字符串转换为JavaScript对象
    // 例如：'{"名字":"小明","年龄":10}' 会被转换为 {名字:"小明", 年龄:10}
    return JSON.parse(text) as _T;
  } catch {
    // 如果解析失败（JSON格式不正确），抛出一个错误
    // 这就像告诉用户："你的表单填写有问题，请检查一下"
    throw createError({
      statusCode: 400, // HTTP状态码400表示"错误的请求"
      statusMessage: "Bad Request", // 状态消息
      message: "Invalid JSON body", // 详细错误信息
    });
  }
}

/**
 * 读取并验证请求体数据
 * 
 * 想象一下：这个函数就像一个严格的门卫。首先它会用readBody函数接收访客(数据)，
 * 然后用我们提供的规则检查这个访客是否符合要求。如果符合要求，就放行(返回数据)；
 * 如果不符合要求，就拒绝访问(抛出错误)。
 * 
 * 这对于确保我们收到的数据是正确的格式非常重要。比如，如果我们期望用户提供年龄，
 * 我们可以检查它是否真的是一个数字，而不是字母或其他内容。
 * 
 * 你可以使用简单的函数来验证数据，也可以使用像`zod`这样的库来定义更复杂的验证规则。
 *
 * @example
 * // 简单验证示例：检查数据是否是一个对象
 * app.use("/", async (event) => {
 *   const body = await readValidatedBody(event, (body) => {
 *     // 检查body是否是一个对象且不是null
 *     return typeof body === "object" && body !== null;
 *   });
 *   // 如果验证通过，body就是一个对象
 * });
 * 
 * @example
 * // 使用zod库进行更复杂的验证
 * import { z } from "zod";
 *
 * app.use("/", async (event) => {
 *   // 创建一个验证规则：数据必须是一个对象
 *   const objectSchema = z.object();
 *   // 使用这个规则验证数据
 *   const body = await readValidatedBody(event, objectSchema.safeParse);
 *   // 如果验证通过，body就是一个符合规则的对象
 * });
 *
 * @param event H3事件对象，包含了HTTP请求的所有信息
 * @param validate 用于验证数据的函数。这个函数会接收解析后的请求体作为参数。
 *                如果返回结果不是false，那么解析后的数据将被返回。
 * @throws 如果验证函数返回`false`或抛出错误，将抛出一个验证错误。
 * @return {*} 返回验证通过的数据，可能是对象、数组、字符串、数字、布尔值或null。
 * @see {readBody} 这个函数内部使用了readBody函数来获取数据
 */
/**
 * readValidatedBody函数的具体实现
 */
export async function readValidatedBody<
  T, // 用户期望的返回数据类型
  Event extends H3Event = H3Event, // 事件类型，默认是H3Event
  _T = InferEventInput<"body", Event, T>, // 根据事件和用户期望推断出的实际返回类型
>(event: Event, validate: ValidateFunction<_T>): Promise<_T> { // 函数返回一个Promise，结果是_T类型的数据
  // 首先使用readBody函数读取请求体
  const _body = await readBody(event);
  
  // 然后使用提供的验证函数验证数据
  // validateData会检查数据是否符合要求，如果不符合会抛出错误
  // 这就像老师检查你的作业，如果有错误会告诉你哪里错了
  return validateData(_body, validate);
}
