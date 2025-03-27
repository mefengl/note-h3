# H3

## 代码阅读推荐顺序

### 1. 核心概念和入口文件

- [src/index.ts](./src/index.ts)
- [src/h3.ts](./src/h3.ts)
- [src/event.ts](./src/event.ts)
- [src/handler.ts](./src/handler.ts)

### 2. 类型定义

- [src/types/index.ts](./src/types/index.ts)
- [src/types/event.ts](./src/types/event.ts)
- [src/types/h3.ts](./src/types/h3.ts)
- [src/types/handler.ts](./src/types/handler.ts)
- [src/types/context.ts](./src/types/context.ts)

### 3. 核心工具函数

- [src/response.ts](./src/response.ts)
- [src/error.ts](./src/error.ts)
- [src/utils/base.ts](./src/utils/base.ts)
- [src/utils/event.ts](./src/utils/event.ts)
- [src/utils/request.ts](./src/utils/request.ts)
- [src/utils/response.ts](./src/utils/response.ts) *

### 4. HTTP 功能模块

- [src/utils/body.ts](./src/utils/body.ts) *
- [src/utils/cookie.ts](./src/utils/cookie.ts) *
- [src/utils/cors.ts](./src/utils/cors.ts) *
- [src/utils/static.ts](./src/utils/static.ts) *
- [src/utils/session.ts](./src/utils/session.ts) *
- [src/utils/cache.ts](./src/utils/cache.ts) *

### 5. 高级功能

- [src/utils/ws.ts](./src/utils/ws.ts) *
- [src/utils/event-stream.ts](./src/utils/event-stream.ts) *
- [src/utils/proxy.ts](./src/utils/proxy.ts) *
- [src/utils/fingerprint.ts](./src/utils/fingerprint.ts) *
- [src/utils/sanitize.ts](./src/utils/sanitize.ts) *

### 6. 适配器和平台兼容性

- [src/adapters.ts](./src/adapters.ts) *
- [src/types/node.ts](./src/types/node.ts) *

### 7. 内部实现细节

- [src/utils/internal/body.ts](./src/utils/internal/body.ts) *
- [src/utils/internal/cors.ts](./src/utils/internal/cors.ts) *
- [src/utils/internal/encoding.ts](./src/utils/internal/encoding.ts) *
- [src/utils/internal/event-stream.ts](./src/utils/internal/event-stream.ts) *
- [src/utils/internal/iron-crypto.ts](./src/utils/internal/iron-crypto.ts) *
- [src/utils/internal/iterable.ts](./src/utils/internal/iterable.ts) *
- [src/utils/internal/obj.ts](./src/utils/internal/obj.ts) *
- [src/utils/internal/object.ts](./src/utils/internal/object.ts) *
- [src/utils/internal/path.ts](./src/utils/internal/path.ts) *
- [src/utils/internal/proxy.ts](./src/utils/internal/proxy.ts) *
- [src/utils/internal/query.ts](./src/utils/internal/query.ts) *
- [src/utils/internal/session.ts](./src/utils/internal/session.ts) *
- [src/utils/internal/validate.ts](./src/utils/internal/validate.ts) *

### 8. HTTP 类型定义

- [src/types/http/index.ts](./src/types/http/index.ts) *
- [src/types/http/headers.ts](./src/types/http/headers.ts) *
- [src/types/http/mimes.ts](./src/types/http/mimes.ts) *

### 9. 工具类型定义

- [src/types/utils/cache.ts](./src/types/utils/cache.ts) *
- [src/types/utils/cors.ts](./src/types/utils/cors.ts) *
- [src/types/utils/fingerprint.ts](./src/types/utils/fingerprint.ts) *
- [src/types/utils/proxy.ts](./src/types/utils/proxy.ts) *
- [src/types/utils/session.ts](./src/types/utils/session.ts) *
- [src/types/utils/sse.ts](./src/types/utils/sse.ts) *
- [src/types/utils/static.ts](./src/types/utils/static.ts) *
- [src/types/utils/validate.ts](./src/types/utils/validate.ts) *

### 10. 示例代码

- [examples/first-server.ts](./examples/first-server.ts) *
- [examples/router.ts](./examples/router.ts) *
- [examples/body.ts](./examples/body.ts) *
- [examples/cookies.ts](./examples/cookies.ts) *
- [examples/cors.ts](./examples/cors.ts) *
- [examples/headers.ts](./examples/headers.ts) *
- [examples/query-params.ts](./examples/query-params.ts) *
- [examples/url-params.ts](./examples/url-params.ts) *
- [examples/status.ts](./examples/status.ts) *
- [examples/redirect.ts](./examples/redirect.ts) *
- [examples/errors.ts](./examples/errors.ts) *
- [examples/handler-middleware.ts](./examples/handler-middleware.ts) *
- [examples/nested-router.ts](./examples/nested-router.ts) *
- [examples/websocket.ts](./examples/websocket.ts) *
- [examples/server-sent-events.ts](./examples/server-sent-events.ts) *

<!-- automd:badges -->

[![npm version](https://img.shields.io/npm/v/h3)](https://npmjs.com/package/h3)
[![npm downloads](https://img.shields.io/npm/dm/h3)](https://npm.chart.dev/h3)

<!-- /automd -->

H3 (pronounced as /eɪtʃθriː/, like h-3) is a minimal h(ttp) framework built for high performance and portability.

> [!NOTE]
> You are on the v2 development branch. Check out [v1 branch](https://github.com/unjs/h3/tree/v1) for v1.

👉 [Documentation](https://h3.unjs.io)

## Contribution

<details>
  <summary>Local development</summary>

- Clone this repository
- Install the latest LTS version of [Node.js](https://nodejs.org/en/)
- Enable [Corepack](https://github.com/nodejs/corepack) using `corepack enable`
- Install dependencies using `pnpm install`
- Run tests using `pnpm dev` or `pnpm test`

</details>

<!-- /automd -->

## License

<!-- automd:contributors license=MIT author="pi0" -->

Published under the [MIT](https://github.com/unjs/h3/blob/main/LICENSE) license.
Made by [@pi0](https://github.com/pi0) and [community](https://github.com/unjs/h3/graphs/contributors) 💛
<br><br>
<a href="https://github.com/unjs/h3/graphs/contributors">
<img src="https://contrib.rocks/image?repo=unjs/h3" />
</a>

<!-- /automd -->

<!-- automd:with-automd -->

---

_🤖 auto updated with [automd](https://automd.unjs.io)_

<!-- /automd -->
