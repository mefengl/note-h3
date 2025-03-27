/**
 * 基础工具函数模块
 * 
 * 这个文件提供了一些基础工具函数，用于处理URL路径和事件处理器。
 * 就像一个工具箱，里面有一些常用的工具，可以帮助我们处理网站的路径问题。
 */

// 导入必要的类型和函数
import type { H3, EventHandler } from "../types";  // 导入H3应用和事件处理器类型
import { withoutBase, withoutTrailingSlash } from "./internal/path";  // 导入路径处理函数

/**
 * 创建一个新的事件处理器，在调用原始处理器之前先移除事件的基础URL
 * 
 * 这个函数就像一个门卫，当有访客来到你的大楼时，门卫会先检查访客要去的具体楼层和房间。
 * 例如，如果所有与“/api”开头的请求都应该由API处理器处理，这个函数会先把“/api”前缀去掉，
 * 然后再交给API处理器。这样API处理器就不需要知道它是在“/api”下运行的。
 *
 * @example
 * // 创建API应用，当访问根路径“/”时返回“Hello API!”
 * const api = createApp()
 *  .get("/", () => "Hello API!");
 * // 创建主应用，并将所有“/api/**”的请求转发给API应用
 * const app = createApp();
 *  .use("/api/**", withBase("/api", api.handler));
 *
 * @param base 要前缀的基础路径，就像大楼的入口名称
 * @param handler 要使用的事件处理器，将使用调整后的路径，就像大楼内的具体房间管理员
 */
export function withBase(base: string, input: EventHandler | H3): EventHandler {
  // 移除基础路径末尾的斜杠，例如将“/api/”变成“/api”
  // 就像标准化大楼的名称，不管是写“第一栋”还是“第一栋楼”，都指同一个地方
  base = withoutTrailingSlash(base);

  // 获取原始处理器，可能是一个H3应用的handler属性或直接是一个处理器函数
  // 就像找到大楼内的具体房间管理员
  const _originalHandler = (input as H3)?.handler || (input as EventHandler);

  // 创建新的处理器函数
  const _handler: EventHandler = async (event) => {
    // 保存原始路径，以便处理完成后恢复
    // 就像记住访客原本要去的地方，以便之后能够引导他们回去
    const _pathBefore = event.url.pathname || "/";
    
    // 移除基础路径，例如将“/api/users”变成“/users”
    // 就像告诉房间管理员，访客要去的是“用户房间”，而不是“API大楼的用户房间”
    event.url.pathname = withoutBase(event.pathname || "/", base);
    
    // 调用原始处理器并等待其完成，然后恢复原始路径
    // 就像让房间管理员处理访客的请求，处理完成后再把访客带回大楼入口
    return Promise.resolve(_originalHandler(event)).finally(() => {
      event.url.pathname = _pathBefore;
    });
  };

  // 复制WebSocket处理器，如果原始处理器有的话
  // 就像也让新的门卫知道如何处理实时通信请求
  _handler.websocket = _originalHandler.websocket;
  
  // 复制路由解析函数，如果原始处理器有的话
  // 就像也让新的门卫知道如何找到大楼内的具体房间
  _handler.resolve = _originalHandler.resolve
    ? (method, path) => {
        // 在解析路由时也移除基础路径
        return _originalHandler.resolve!(method, withoutBase(path, base));
      }
    : undefined;

  // 返回新的处理器
  return _handler;
}
