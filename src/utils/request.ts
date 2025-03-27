/**
 * 请求工具函数文件
 * 
 * 这个文件包含了处理HTTP请求的各种实用函数，帮助我们从请求中获取信息，
 * 比如查询参数、路由参数、请求方法、请求协议、主机名、IP地址等。
 * 
 * 就像一个邮递员，这些函数帮助我们打开"信封"(HTTP请求)，并读取里面的内容。
 */

import { createError } from "../error";
import type {
  HTTPMethod,
  InferEventInput,
  ValidateFunction,
  H3Event,
} from "../types";
import { parseQuery } from "./internal/query";
import { validateData } from "./internal/validate";

/**
 * 从请求URL中获取解析后的查询字符串对象
 * 
 * 查询字符串是URL中问号(?)后面的部分，例如：https://example.com/search?name=小明&age=10
 * 这个函数会把查询字符串转换成一个对象：{ name: "小明", age: "10" }
 * 
 * 想象一下：如果URL是一条街道，查询参数就像是街道上的房子，每个房子都有自己的名字(参数名)和住户(参数值)。
 * 这个函数就是帮我们找出所有的房子和住户。
 *
 * @example
 * app.use("/", (event) => {
 *   const query = getQuery(event); // { key: "value", key2: ["value1", "value2"] }
 * });
 */
export function getQuery<
  T,
  Event extends H3Event = H3Event,
  _T = Exclude<InferEventInput<"query", Event, T>, undefined>,
>(event: Event): _T {
  return parseQuery(event.queryString.slice(1)) as _T;
}

/**
 * 获取经过验证的查询参数
 * 
 * 这个函数不仅会获取URL中的查询参数，还会检查这些参数是否符合我们的要求。
 * 就像学校门卫，不仅接收来访者，还会检查他们是否有权限进入。
 * 
 * 例如，如果我们期望查询参数中有一个名为"age"的参数，并且它的值必须是数字，
 * 这个函数可以帮我们检查这个条件是否满足。如果不满足，它会告诉我们出错了。
 * 
 * 你可以使用简单的函数或者像`zod`这样的库来定义验证规则。
 *
 * @example
 * app.use("/", async (event) => {
 *   const query = await getValidatedQuery(event, (data) => {
 *     return "key" in data && typeof data.key === "string";
 *   });
 * });
 * @example
 * import { z } from "zod";
 *
 * app.use("/", async (event) => {
 *   const query = await getValidatedQuery(
 *     event,
 *     z.object({
 *       key: z.string(),
 *     }).parse,
 *   );
 * });
 */
export function getValidatedQuery<
  T,
  Event extends H3Event = H3Event,
  _T = InferEventInput<"query", Event, T>,
>(event: Event, validate: ValidateFunction<_T>): Promise<_T> {
  const query = getQuery(event);
  return validateData(query, validate);
}

/**
 * 获取匹配的路由参数
 * 
 * 路由参数是URL路径中的变量部分。例如，在路由"/users/:id"中，":id"就是一个路由参数。
 * 当访问"/users/123"时，路由参数"id"的值就是"123"。
 * 
 * 想象一下：如果URL路径是一条有标记的小路，路由参数就像是路上的路标，告诉我们现在在哪里。
 * 这个函数帮我们收集所有的路标信息。
 * 
 * 如果`decode`选项为`true`，它会使用`decodeURIComponent`解码匹配的路由参数。
 * 这很有用，因为URL中的特殊字符（如空格、中文等）通常会被编码成%加十六进制数的形式。
 *
 * @example
 * app.use("/", (event) => {
 *   const params = getRouterParams(event); // { key: "value" }
 * });
 */
export function getRouterParams(
  event: H3Event,
  opts: { decode?: boolean } = {},
): NonNullable<H3Event["context"]["params"]> {
  // Fallback object needs to be returned in case router is not used (#149)
  let params = event.context.params || {};
  if (opts.decode) {
    params = { ...params };
    for (const key in params) {
      params[key] = decodeURIComponent(params[key]);
    }
  }
  return params;
}

/**
 * 获取并验证匹配的路由参数
 * 
 * 这个函数不仅会获取URL路径中的路由参数，还会检查这些参数是否符合我们的要求。
 * 就像一个严格的图书管理员，不仅接收还书，还会检查书的状态是否良好。
 * 
 * 例如，如果我们期望路由参数中有一个名为"id"的参数，并且它的值必须是数字，
 * 这个函数可以帮我们检查这个条件是否满足。如果不满足，它会告诉我们出错了。
 * 
 * 如果`decode`选项为`true`，它会使用`decodeURI`解码匹配的路由参数。
 * 
 * 你可以使用简单的函数或者像`zod`这样的库来定义验证规则。
 *
 * @example
 * app.use("/", async (event) => {
 *   const params = await getValidatedRouterParams(event, (data) => {
 *     return "key" in data && typeof data.key === "string";
 *   });
 * });
 * @example
 * import { z } from "zod";
 *
 * app.use("/", async (event) => {
 *   const params = await getValidatedRouterParams(
 *     event,
 *     z.object({
 *       key: z.string(),
 *     }).parse,
 *   );
 * });
 */
export function getValidatedRouterParams<
  T,
  Event extends H3Event = H3Event,
  _T = InferEventInput<"routerParams", Event, T>,
>(
  event: Event,
  validate: ValidateFunction<_T>,
  opts: { decode?: boolean } = {},
): Promise<_T> {
  const routerParams = getRouterParams(event, opts);
  return validateData(routerParams, validate);
}

/**
 * 通过名称获取匹配的路由参数
 * 
 * 这个函数帮助我们获取特定名称的路由参数值。
 * 想象一下：如果所有的路由参数是一个抽屉柜，每个抽屉都有自己的名字，
 * 这个函数就是帮我们找到并打开特定名字的抽屉，看看里面有什么。
 * 
 * 例如，在路由"/users/:id"中，当访问"/users/123"时，
 * 使用`getRouterParam(event, "id")`会返回"123"。
 * 
 * 如果`decode`选项为`true`，它会使用`decodeURI`解码匹配的路由参数。
 * 这对于处理URL中的特殊字符（如空格、中文等）很有用。
 *
 * @example
 * app.use("/", (event) => {
 *   const param = getRouterParam(event, "key");
 * });
 */
export function getRouterParam(
  event: H3Event,
  name: string,
  opts: { decode?: boolean } = {},
): string | undefined {
  const params = getRouterParams(event, opts);
  return params[name];
}

/**
 * 检查传入的请求方法是否符合预期类型
 * 
 * HTTP请求有不同的方法，如GET（获取数据）、POST（提交数据）、PUT（更新数据）、DELETE（删除数据）等。
 * 这个函数帮我们检查请求使用的方法是否是我们期望的。
 * 
 * 想象一下：如果HTTP请求是不同类型的信件（普通信、快递、挂号信等），
 * 这个函数就是帮我们确认收到的是不是我们期望的那种信件。
 * 
 * 如果`allowHead`为`true`，当预期方法是`GET`时，它也会允许`HEAD`请求通过。
 * HEAD请求与GET类似，但服务器只返回响应头，不返回实际内容，常用于检查资源是否存在。
 *
 * @example
 * app.use("/", (event) => {
 *   if (isMethod(event, "GET")) {
 *     // 处理GET请求
 *   } else if (isMethod(event, ["POST", "PUT"])) {
 *     // 处理POST或PUT请求
 *   }
 * });
 */
export function isMethod(
  event: H3Event,
  expected: HTTPMethod | HTTPMethod[],
  allowHead?: boolean,
) {
  if (allowHead && event.request.method === "HEAD") {
    return true;
  }

  if (typeof expected === "string") {
    if (event.request.method === expected) {
      return true;
    }
  } else if (expected.includes(event.request.method as HTTPMethod)) {
    return true;
  }

  return false;
}

/**
 * 断言传入的请求方法是预期类型
 * 
 * 这个函数使用`isMethod`检查请求方法，如果不符合预期，会抛出405错误。
 * 
 * 想象一下：这就像一个严格的门卫，只允许特定类型的访客进入。如果来了其他类型的访客，
 * 门卫会直接拒绝并告诉他们"不允许使用这种方式访问"。
 * 
 * 405错误表示"方法不允许"，意味着服务器知道这个请求方法，但目标资源不支持这种方法。
 * 
 * 如果`allowHead`为`true`，当预期方法是`GET`时，它也会允许`HEAD`请求通过。
 *
 * @example
 * app.use("/", (event) => {
 *   assertMethod(event, "GET");
 *   // 处理GET请求，否则抛出405错误
 * });
 */
export function assertMethod(
  event: H3Event,
  expected: HTTPMethod | HTTPMethod[],
  allowHead?: boolean,
) {
  if (!isMethod(event, expected, allowHead)) {
    throw createError({
      statusCode: 405,
      statusMessage: "HTTP method is not allowed.",
    });
  }
}

/**
 * 获取请求的主机名
 * 
 * 主机名是网站的地址，如"example.com"或"localhost:3000"。
 * 这个函数帮我们从HTTP请求中获取这个地址。
 * 
 * 想象一下：如果HTTP请求是一封信，主机名就是信封上的收件人地址。
 * 这个函数帮我们读取这个地址。
 * 
 * 如果`xForwardedHost`为`true`，且存在`x-forwarded-host`头，它会使用这个头的值。
 * 这在使用代理服务器时很有用，因为原始的主机名可能会被代理服务器修改。
 * 
 * 如果找不到主机头，它会返回空字符串。
 *
 * @example
 * app.use("/", (event) => {
 *   const host = getRequestHost(event); // "example.com"
 * });
 */
export function getRequestHost(
  event: H3Event,
  opts: { xForwardedHost?: boolean } = {},
) {
  if (opts.xForwardedHost) {
    const xForwardedHost = event.request.headers.get("x-forwarded-host");
    if (xForwardedHost) {
      return xForwardedHost;
    }
  }
  return event.request.headers.get("host") || "";
}

/**
 * 获取请求协议
 * 
 * 协议是网络通信的规则，常见的有HTTP和HTTPS。
 * HTTP是普通的网络传输协议，而HTTPS是加密的安全版本。
 * 
 * 想象一下：如果HTTP和HTTPS是两种不同的邮寄方式，
 * HTTP就像普通邮件，任何人都可以在传输过程中查看内容；
 * 而HTTPS就像密封的保密文件，只有收件人才能看到内容。
 * 
 * 这个函数帮我们确定请求使用的是哪种协议。
 * 
 * 如果`x-forwarded-proto`头设置为"https"，它会返回"https"。
 * 你可以通过设置`xForwardedProto`为`false`来禁用这个行为。
 * 
 * 如果无法确定协议，它会使用URL中的协议（去掉末尾的冒号）。
 *
 * @example
 * app.use("/", (event) => {
 *   const protocol = getRequestProtocol(event); // "https"
 * });
 */
export function getRequestProtocol(
  event: H3Event,
  opts: { xForwardedProto?: boolean } = {},
) {
  if (opts.xForwardedProto !== false) {
    const forwardedProto = event.request.headers.get("x-forwarded-proto");
    if (forwardedProto === "https") {
      return "https";
    }
    if (forwardedProto === "http") {
      return "http";
    }
  }
  return event.url.protocol.slice(0, -1);
}

/**
 * 生成完整的请求URL
 * 
 * 这个函数使用`getRequestProtocol`、`getRequestHost`和`event.path`生成完整的请求URL。
 * 
 * 想象一下：如果我们把网址比作一个完整的地址，
 * 协议(http/https)就像是交通方式（汽车/火车），
 * 主机名(example.com)就像是城市名，
 * 路径(/users/123)就像是街道地址。
 * 这个函数把这些部分组合起来，形成一个完整的地址。
 * 
 * 如果`xForwardedHost`为`true`，且存在`x-forwarded-host`头，它会使用这个头的值作为主机名。
 * 
 * 如果`xForwardedProto`为`false`，它不会使用`x-forwarded-proto`头来确定协议。
 *
 * @example
 * app.use("/", (event) => {
 *   const url = getRequestURL(event); // "https://example.com/path"
 * });
 */
export function getRequestURL(
  event: H3Event,
  opts: { xForwardedHost?: boolean; xForwardedProto?: boolean } = {},
) {
  const url = new URL(event.url);
  url.protocol = getRequestProtocol(event, opts);
  if (opts.xForwardedHost) {
    const host = getRequestHost(event, opts);
    if (host) {
      url.host = host;
      if (!host.includes(":")) {
        url.port = "";
      }
    }
  }
  return url;
}

/**
 * 尝试从传入的请求中获取客户端IP地址
 * 
 * IP地址是互联网上每台计算机的唯一标识，就像每个人的身份证号码。
 * 这个函数帮我们找出发送请求的计算机的IP地址。
 * 
 * 想象一下：如果互联网是一个巨大的城市，IP地址就是每栋房子的门牌号。
 * 这个函数帮我们找出发送请求的那栋房子的门牌号。
 * 
 * 如果`xForwardedFor`为`true`，且存在`x-forwarded-for`头，它会使用这个头的第一个IP地址。
 * 这在使用代理服务器时很有用，因为原始的IP地址会被记录在这个头中。
 * 
 * 如果无法确定IP地址，它会返回`undefined`（表示未定义）。
 *
 * @example
 * app.use("/", (event) => {
 *   const ip = getRequestIP(event); // "192.0.2.0"
 * });
 */
export function getRequestIP(
  event: H3Event,
  opts: {
    /**
     * Use the X-Forwarded-For HTTP header set by proxies.
     *
     * Note: Make sure that this header can be trusted (your application running behind a CDN or reverse proxy) before enabling.
     */
    xForwardedFor?: boolean;
  } = {},
): string | undefined {
  if (opts.xForwardedFor) {
    // https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/X-Forwarded-For#syntax
    const _header = event.request.headers.get("x-forwarded-for");
    const xForwardedFor = (_header || "")?.split(",").shift()?.trim();
    if (xForwardedFor) {
      return xForwardedFor;
    }
  }

  return event.context.clientAddress || event.ip || undefined;
}
