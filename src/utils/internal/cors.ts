/**
 * @file src/utils/internal/cors.ts
 * @description
 * 这个文件就像是 H3 框架处理“跨域资源共享”（CORS）问题的“内部工具箱”。
 * 想象一下，你的网站（比如 `your-site.com`）想从另一个网站（比如 `api.cool-data.com`）获取数据。
 * 默认情况下，浏览器为了安全，会阻止这种“跨域”请求。
 * CORS 就是一套规则，让 `api.cool-data.com` 可以告诉浏览器：“嘿，允许 `your-site.com` 来访问我的数据！”
 *
 * 这个文件里的函数就是帮助 H3 框架根据开发者设置的 CORS 规则，生成正确的 HTTP 响应头信息，
 * 告诉浏览器哪些跨域请求是被允许的。
 * 它处理诸如允许哪些来源（网站）、允许哪些请求方法（GET, POST 等）、是否允许携带凭证（如 Cookies）等细节。
 */
import type { H3Event } from "../../types";
import type {
  H3CorsOptions,
  H3ResolvedCorsOptions,
  H3AccessControlAllowOriginHeader,
  H3AccessControlAllowMethodsHeader,
  H3AccessControlAllowCredentialsHeader,
  H3AccessControlAllowHeadersHeader,
  H3AccessControlExposeHeadersHeader,
  H3AccessControlMaxAgeHeader,
} from "../../types/utils/cors";

/**
 * @description
 * 解析并整理 CORS 配置项。
 *
 * 就像准备做饭前整理食材和调料一样，这个函数会接收开发者传入的 CORS 配置，
 * 并确保所有必要的选项都有一个默认值，即使开发者没有明确指定它们。
 * 这样可以保证后续处理 CORS 时，配置是完整和一致的。
 *
 * 例如，如果开发者没有指定允许哪些来源 (`origin`)，它会默认设置为 `*`，表示允许任何来源。
 * 如果没有指定允许的方法 (`methods`)，也会默认为 `*`，表示允许所有常见的 HTTP 方法。
 *
 * @param options {H3CorsOptions} 开发者传入的原始 CORS 配置对象。可以包含 `origin`, `methods`, `allowHeaders` 等设置。
 * @returns {H3ResolvedCorsOptions} 返回一个“整理好”的 CORS 配置对象，其中所有选项都有确定的值（要么是开发者指定的，要么是默认值）。
 */
export function resolveCorsOptions(
  options: H3CorsOptions = {},
): H3ResolvedCorsOptions {
  const defaultOptions: H3ResolvedCorsOptions = {
    origin: "*",
    methods: "*",
    allowHeaders: "*",
    exposeHeaders: "*",
    credentials: false,
    maxAge: false,
    preflight: {
      statusCode: 204,
    },
  };

  return {
    ...defaultOptions,
    ...options,
    preflight: {
      ...defaultOptions.preflight,
      ...options.preflight,
    },
  };
}

/**
 * @description
 * 检查请求的来源（Origin）是否在允许的 CORS 来源列表中。
 *
 * 想象一下，你家门口有个访客名单。这个函数就像门卫，检查来访者（请求的 `origin`）
 * 是否在你的名单（`options.origin`）上。
 *
 * 这个函数会处理几种情况：
 * 1. 如果没有来源信息 (`origin`)，或者配置允许任何来源 (`*` 或 `null`)，则直接放行 (返回 `true`)。
 * 2. 如果允许的来源是一个列表 (`Array`)，它会逐个检查列表中的项：
 *    - 如果列表项是正则表达式 (`RegExp`)，就用正则表达式去匹配请求的来源。
 *    - 如果列表项是字符串，就直接比较是否完全相等。
 *    只要有一个匹配成功，就放行 (返回 `true`)。
 * 3. 如果允许的来源是一个函数，就把请求的来源传给这个函数，让函数来决定是否允许 (返回函数的结果)。
 *
 * @param origin {string | undefined} 从 HTTP 请求头中获取的 `Origin` 值，表示请求来自哪个网站。可能是 `undefined` 如果请求头没有这个字段。
 * @param options {H3CorsOptions} 开发者配置的 CORS 选项，主要关心其中的 `origin` 字段。
 * @returns {boolean} 如果请求来源被允许，返回 `true`；否则返回 `false`。
 */
export function isCorsOriginAllowed(
  origin: string | undefined,
  options: H3CorsOptions,
): boolean {
  const { origin: originOption } = options;

  if (
    !origin ||
    !originOption ||
    originOption === "*" ||
    originOption === "null"
  ) {
    return true;
  }

  if (Array.isArray(originOption)) {
    return originOption.some((_origin) => {
      if (_origin instanceof RegExp) {
        return _origin.test(origin);
      }

      return origin === _origin;
    });
  }

  return originOption(origin);
}

/**
 * @description
 * 生成 `Access-Control-Allow-Origin` HTTP 响应头。
 *
 * 这个头信息是 CORS 的核心，它告诉浏览器，服务器允许哪个（或哪些）来源访问资源。
 * 这个函数会根据 CORS 配置和实际请求的 `Origin` 头来决定这个响应头的值。
 *
 * 逻辑是这样的：
 * 1. 如果请求没有 `Origin` 头，或者配置允许所有来源 (`*`)，则响应头设置为 `*`。
 * 2. 如果配置指定了一个具体的来源字符串，则响应头设置为该字符串，并加上 `Vary: Origin` 头。
 *    `Vary: Origin` 告诉缓存服务器（如 CDN），对于不同来源的请求，响应内容可能不同，需要分开缓存。
 * 3. 如果配置是来源列表或函数，则调用 `isCorsOriginAllowed` 检查当前请求的来源是否被允许。
 *    如果允许，响应头设置为请求的 `Origin` 值，并加上 `Vary: Origin`。
 *    如果不允许，则不添加 `Access-Control-Allow-Origin` 头 (返回空对象 `{}`)。
 *
 * @param event {H3Event} 当前的 H3 事件对象，可以从中获取请求信息（如请求头）。
 * @param options {H3CorsOptions} 开发者配置的 CORS 选项。
 * @returns {H3AccessControlAllowOriginHeader} 一个包含 `access-control-allow-origin` 键值对的对象，可能还包含 `vary` 键。
 */
export function createOriginHeaders(
  event: H3Event,
  options: H3CorsOptions,
): H3AccessControlAllowOriginHeader {
  const { origin: originOption } = options;
  const origin = event.request.headers.get("origin");

  if (!origin || !originOption || originOption === "*") {
    return { "access-control-allow-origin": "*" };
  }

  if (typeof originOption === "string") {
    return { "access-control-allow-origin": originOption, vary: "origin" };
  }

  return isCorsOriginAllowed(origin, options)
    ? { "access-control-allow-origin": origin, vary: "origin" }
    : {};
}

/**
 * @description
 * 生成 `Access-Control-Allow-Methods` HTTP 响应头。
 *
 * 这个头信息告诉浏览器，服务器允许哪些 HTTP 请求方法（如 GET, POST, PUT, DELETE 等）用于跨域请求。
 * 它通常在处理 CORS “预检请求”（Preflight Request）时返回。
 *
 * - 如果配置中没有指定 `methods`，则不生成此响应头 (返回空对象 `{}`)。
 * - 如果配置指定为 `*`，表示允许所有方法，则响应头设置为 `*`。
 * - 如果配置是一个方法数组（如 `['GET', 'POST']`），则将数组元素用逗号连接成字符串作为响应头的值。
 *
 * @param options {H3CorsOptions} 开发者配置的 CORS 选项。
 * @returns {H3AccessControlAllowMethodsHeader} 一个包含 `access-control-allow-methods` 键值对的对象。
 */
export function createMethodsHeaders(
  options: H3CorsOptions,
): H3AccessControlAllowMethodsHeader {
  const { methods } = options;

  if (!methods) {
    return {};
  }

  if (methods === "*") {
    return { "access-control-allow-methods": "*" };
  }

  return methods.length > 0
    ? { "access-control-allow-methods": methods.join(",") }
    : {};
}

/**
 * @description
 * 生成 `Access-Control-Allow-Credentials` HTTP 响应头。
 *
 * 这个头信息告诉浏览器，是否允许跨域请求携带凭证（如 Cookies、HTTP 认证信息）。
 * 如果设置为 `true`，浏览器才会将 Cookies 等凭证信息发送给跨域服务器。
 *
 * 注意：如果这个头设置为 `true`，那么 `Access-Control-Allow-Origin` 头就不能是 `*`，必须是具体的来源。
 * （这个函数本身不处理这个约束，但上层逻辑需要注意）。
 *
 * - 如果配置中的 `credentials` 为 `true`，则响应头设置为 `true`。
 * - 否则，不生成此响应头 (返回空对象 `{}`)。
 *
 * @param options {H3CorsOptions} 开发者配置的 CORS 选项。
 * @returns {H3AccessControlAllowCredentialsHeader} 一个包含 `access-control-allow-credentials` 键值对的对象。
 */
export function createCredentialsHeaders(
  options: H3CorsOptions,
): H3AccessControlAllowCredentialsHeader {
  const { credentials } = options;

  if (credentials) {
    return { "access-control-allow-credentials": "true" };
  }

  return {};
}

/**
 * @description
 * 生成 `Access-Control-Allow-Headers` HTTP 响应头，可能还会包含 `Vary` 头。
 *
 * 这个头信息告诉浏览器，在实际的跨域请求中，允许携带哪些自定义的 HTTP 请求头。
 * 它也是在处理 CORS “预检请求”时返回的。
 *
 * - 如果配置的 `allowHeaders` 是 `*` 或者为空数组，或者没有配置：
 *   它会检查预检请求中是否有 `Access-Control-Request-Headers` 头。
 *   这个头是浏览器自动加上的，里面列出了实际请求想要使用的自定义头。
 *   如果存在这个请求头，就直接把它里面的值作为 `Access-Control-Allow-Headers` 响应头的值返回，
 *   并加上 `Vary: Access-Control-Request-Headers`。
 *   `Vary` 头告诉缓存，对于请求不同自定义头的预检请求，响应可能不同。
 * - 如果配置的 `allowHeaders` 是一个包含具体头名称的数组，则将数组元素用逗号连接，
 *   作为 `Access-Control-Allow-Headers` 响应头的值，并加上 `Vary: Access-Control-Request-Headers`。
 *
 * @param event {H3Event} 当前的 H3 事件对象，用于获取请求头信息。
 * @param options {H3CorsOptions} 开发者配置的 CORS 选项。
 * @returns {H3AccessControlAllowHeadersHeader} 一个包含 `access-control-allow-headers` 键值对的对象，可能还包含 `vary` 键。
 */
export function createAllowHeaderHeaders(
  event: H3Event,
  options: H3CorsOptions,
): H3AccessControlAllowHeadersHeader {
  const { allowHeaders } = options;

  if (!allowHeaders || allowHeaders === "*" || allowHeaders.length === 0) {
    const header = event.request.headers.get("access-control-request-headers");

    return header
      ? {
          "access-control-allow-headers": header,
          vary: "access-control-request-headers",
        }
      : {};
  }

  return {
    "access-control-allow-headers": allowHeaders.join(","),
    vary: "access-control-request-headers",
  };
}

/**
 * @description
 * 生成 `Access-Control-Expose-Headers` HTTP 响应头。
 *
 * 默认情况下，浏览器只会暴露一些“简单”的响应头给前端 JavaScript 代码（如 `Cache-Control`, `Content-Type` 等）。
 * 如果服务器想让前端能访问其他的响应头（比如自定义的 `X-My-Custom-Header` 或 `Content-Length`），
 * 就需要通过这个 `Access-Control-Expose-Headers` 头来明确指定。
 *
 * - 如果配置中没有 `exposeHeaders`，不生成此响应头。
 * - 如果配置为 `*`，则响应头设置为 `*` (注意：这通常不是推荐的做法)。
 * - 如果配置是一个包含头名称的数组，则将数组元素用逗号连接作为响应头的值。
 *
 * @param options {H3CorsOptions} 开发者配置的 CORS 选项。
 * @returns {H3AccessControlExposeHeadersHeader} 一个包含 `access-control-expose-headers` 键值对的对象。
 */
export function createExposeHeaders(
  options: H3CorsOptions,
): H3AccessControlExposeHeadersHeader {
  const { exposeHeaders } = options;

  if (!exposeHeaders) {
    return {};
  }

  if (exposeHeaders === "*") {
    return { "access-control-expose-headers": exposeHeaders };
  }

  return { "access-control-expose-headers": exposeHeaders.join(",") };
}

/**
 * @description
 * 生成 `Access-Control-Max-Age` HTTP 响应头。
 *
 * 这个头信息告诉浏览器，预检请求的结果（比如允许哪些方法、哪些头）可以在浏览器缓存多久（单位是秒）。
 * 在缓存有效期内，对于同一个资源的相同跨域请求，浏览器就不再发送预检请求了，直接发送实际请求，
 * 这样可以提高性能。
 *
 * - 如果配置了 `maxAge` (一个数字表示秒数)，则生成此响应头。
 * - 否则，不生成此响应头。
 *
 * @param options {H3CorsOptions} 开发者配置的 CORS 选项。
 * @returns {H3AccessControlMaxAgeHeader} 一个包含 `access-control-max-age` 键值对的对象。
 */
export function createMaxAgeHeader(
  options: H3CorsOptions,
): H3AccessControlMaxAgeHeader {
  const { maxAge } = options;

  if (maxAge) {
    return { "access-control-max-age": maxAge };
  }

  return {};
}
