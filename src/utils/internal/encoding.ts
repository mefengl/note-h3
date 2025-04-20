/**
 * @file src/utils/internal/encoding.ts
 * @description
 * 这个文件提供了一些内部使用的编码和解码工具函数，特别是针对文本和 Base64 编码。
 * Base64 是一种将二进制数据转换成纯文本字符的方法，常用于在 URL、HTTP 头或文本协议中传输数据。
 * 这个文件特别实现了“URL 安全”的 Base64 编码，这意味着它使用了 `-` 和 `_` 而不是 `+` 和 `/`，
 * 并且去掉了末尾可能出现的 `=` 填充符，这样编码后的字符串可以直接用在 URL 中，不会引起歧义。
 *
 * 部分 Base64 实现参考了 Deno 标准库。
 */

/**
Base64 encoding based on https://github.com/denoland/std/tree/main/encoding (modified with url compatibility)
Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.
https://github.com/denoland/std/blob/main/LICENSE
 */

/**
 * @description
 * 全局文本编码器实例 (TextEncoder)。
 * 用途：将 JavaScript 字符串转换为 UTF-8 编码的字节流 (Uint8Array)。
 * 例如，`textEncoder.encode("你好")` 会返回一个包含 "你好" UTF-8 字节表示的 Uint8Array。
 * 使用 `@__PURE__` 标记是为了帮助代码压缩工具（如 terser）进行优化，
 * 表明这个 new 操作没有副作用，如果未使用 `textEncoder`，则可以安全地移除此代码。
 */
export const textEncoder = /* @__PURE__ */ new TextEncoder();

/**
 * @description
 * 全局文本解码器实例 (TextDecoder)。
 * 用途：将 UTF-8 编码的字节流 (Uint8Array 或 ArrayBuffer) 转换回 JavaScript 字符串。
 * 例如，`textDecoder.decode(utf8ByteArray)` 会将字节数组解码成原始字符串。
 * 同样使用了 `@__PURE__` 标记进行优化提示。
 */
export const textDecoder = /* @__PURE__ */ new TextDecoder();

// 定义 URL 安全 Base64 编码使用的 64 个字符的 ASCII 码。
// 标准 Base64 使用 A-Z, a-z, 0-9, +, /。 
// URL 安全 Base64 将 + 替换为 - (ASCII 45)，将 / 替换为 _ (ASCII 95)。
// ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_
const base64Code = /* @__PURE__ */ [
  65, 66, 67, 68, 69, 70, 71, 72, 73, 74, 75, 76, 77, 78, 79, 80, 81, 82, 83,
  84, 85, 86, 87, 88, 89, 90, 97, 98, 99, 100, 101, 102, 103, 104, 105, 106,
  107, 108, 109, 110, 111, 112, 113, 114, 115, 116, 117, 118, 119, 120, 121,
  122, 48, 49, 50, 51, 52, 53, 54, 55, 56, 57, 45, 95,
];

/**
 * @description
 * 将输入数据（字符串、ArrayBuffer 或 Uint8Array）编码为 URL 安全的 Base64 字符串。
 *
 * 工作原理：
 * 1. 首先，使用 `validateBinaryLike` 确保输入是 Uint8Array 格式。
 * 2. 如果在 Node.js 环境中（检测到 `globalThis.Buffer`），直接使用 Buffer 提供的 `toString('base64url')` 方法，这是最高效的方式。
 * 3. 如果不在 Node.js 环境（例如在浏览器或 Deno 中），则手动实现 Base64 编码逻辑：
 *    - 将输入的字节流（Uint8Array）按每 3 个字节（24 位）分组。
 *    - 将每组 24 位数据重新划分为 4 个 6 位的数据块。
 *    - 每个 6 位数据块的值（0-63）对应 `base64Code` 数组中的一个索引，取出对应的 ASCII 码。
 *    - 将这些 ASCII 码收集起来。
 *    - 处理末尾不足 3 字节的情况（补齐逻辑，但 URL 安全 Base64 通常省略 `=` 填充）。
 * 4. 最后，使用 `String.fromCharCode()` 将收集到的 ASCII 码数组转换为最终的 Base64 字符串。
 *
 * @param data {ArrayBuffer | Uint8Array | string} 需要编码的数据。可以是 ArrayBuffer、Uint8Array 或普通字符串。
 * @returns {string} URL 安全的 Base64 编码字符串。
 */
export function base64Encode(data: ArrayBuffer | Uint8Array | string): string {
  const buff = validateBinaryLike(data);
  if (globalThis.Buffer) {
    // Node.js 环境优化：使用 Buffer 进行高效编码
    return globalThis.Buffer.from(buff).toString("base64url");
  }
  // 浏览器或其他环境的手动实现
  // Credits: https://gist.github.com/enepomnyaschih/72c423f727d395eeaa09697058238727
  const bytes: number[] = []; // 存储结果 Base64 字符的 ASCII 码
  let i;
  const len = buff.length;
  // 处理主要的 3 字节块
  for (i = 2; i < len; i += 3) {
    bytes.push(
      base64Code[buff[i - 2]! >> 2], // 第 1 个 6 位
      base64Code[((buff[i - 2]! & 0x03) << 4) | (buff[i - 1]! >> 4)], // 第 2 个 6 位
      base64Code[((buff[i - 1]! & 0x0f) << 2) | (buff[i]! >> 6)], // 第 3 个 6 位
      base64Code[buff[i]! & 0x3f], // 第 4 个 6 位
    );
  }
  // 处理末尾剩余的字节
  if (i === len + 1) {
    // 剩余 1 个字节
    bytes.push(
      base64Code[buff[i - 2]! >> 2],
      base64Code[(buff[i - 2]! & 0x03) << 4],
    );
  }
  if (i === len) {
    // 剩余 2 个字节
    bytes.push(
      base64Code[buff[i - 2]! >> 2],
      base64Code[((buff[i - 2]! & 0x03) << 4) | (buff[i - 1]! >> 4)],
      base64Code[(buff[i - 1]! & 0x0f) << 2],
    );
  }

  // 将 ASCII 码数组转换为字符串
  return String.fromCharCode(...bytes);
}

/**
 * @description
 * 将 URL 安全的 Base64 字符串解码回原始的 Uint8Array。
 *
 * 工作原理：
 * 1. 如果在 Node.js 环境中，使用 Buffer 提供的 `Buffer.from(b64Url, 'base64url')` 进行高效解码。
 * 2. 如果不在 Node.js 环境：
 *    - 先将输入的 URL 安全 Base64 字符串 (`b64Url`) 转换回标准的 Base64 格式：
 *      将 `-` 替换回 `+`，将 `_` 替换回 `/`。
 *      注意：这里没有添加可能被省略的 `=` 填充符，因为 `atob` 函数通常能正确处理无填充的 Base64。
 *    - 使用浏览器或环境提供的 `atob()` 函数将标准 Base64 字符串解码为“二进制字符串”。
 *      （`atob` 返回的是一个每个字符的码点代表一个字节值的字符串）。
 *    - 创建一个与解码后二进制字符串长度相同的 Uint8Array。
 *    - 遍历二进制字符串，使用 `charCodeAt(i)` 获取每个字符的码点（即字节值），并存入 Uint8Array。
 * 3. 返回包含原始字节数据的 Uint8Array。
 *
 * @param b64Url {string} URL 安全的 Base64 编码字符串。
 * @returns {Uint8Array} 解码后的字节数组。
 */
export function base64Decode(b64Url: string): Uint8Array {
  if (globalThis.Buffer) {
    // Node.js 环境优化：使用 Buffer 进行高效解码
    return new Uint8Array(globalThis.Buffer.from(b64Url, "base64url"));
  }
  // 浏览器或其他环境的实现
  // 替换回标准 Base64 字符
  const b64 = b64Url.replace(/-/g, "+").replace(/_/g, "/");
  // 使用 atob 解码为二进制字符串
  const binString = atob(b64);
  const size = binString.length;
  const bytes = new Uint8Array(size);
  // 将二进制字符串转换为 Uint8Array
  for (let i = 0; i < size; i++) {
    // charCodeAt 获取的是 0-255 的字节值
    bytes[i] = binString.charCodeAt(i);
  }
  return bytes;
}

/**
 * @description
 * 验证输入是否为类二进制数据（字符串、Uint8Array 或 ArrayBuffer），并统一转换为 Uint8Array。
 *
 * 这个函数的作用是提供一个统一的数据处理入口，确保后续操作（如 Base64 编码）
 * 接收到的是标准化的 Uint8Array 格式。
 *
 * - 如果输入是字符串，使用 `textEncoder` 将其编码为 UTF-8 的 Uint8Array。
 * - 如果输入已经是 Uint8Array，直接返回。
 * - 如果输入是 ArrayBuffer，将其包装成一个新的 Uint8Array 返回。
 * - 如果输入是其他类型，抛出一个 TypeError，提示输入类型无效。
 *
 * @param source {unknown} 任意类型的输入。
 * @returns {Uint8Array} 转换后的 Uint8Array。
 * @throws {TypeError} 如果输入不是字符串、Uint8Array 或 ArrayBuffer，则抛出类型错误。
 */
export function validateBinaryLike(source: unknown): Uint8Array {
  if (typeof source === "string") {
    return textEncoder.encode(source);
  } else if (source instanceof Uint8Array) {
    return source;
  } else if (source instanceof ArrayBuffer) {
    return new Uint8Array(source);
  }
  throw new TypeError(
    `The input must be a Uint8Array, a string, or an ArrayBuffer.`,
  );
}
