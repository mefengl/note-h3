/**
 * 上下文类型定义文件
 * 
 * 这个文件定义了H3框架中的上下文(Context)类型。
 * 上下文就像是一个背包，里面装着处理HTTP请求时可能需要的各种信息。
 * 当服务器收到请求时，会创建一个上下文对象，把重要信息放进去，
 * 这样处理请求的函数就可以从背包里拿出需要的东西了。
 */

// 导入其他必要的类型定义
import type { H3Route } from "./h3";  // 导入H3路由类型
import type { Session } from "./utils/session";  // 导入会话类型

/**
 * H3事件上下文接口
 * 
 * 这个接口定义了HTTP请求处理过程中可用的上下文信息。
 * 就像一个装满工具和信息的背包，处理请求时可以从中获取需要的东西。
 * 
 * 想象你去游乐园玩，工作人员会给你一个手环，上面有你的信息，
 * 这样你在园内的每个游戏设施都可以通过手环知道你是谁、你可以玩什么。
 * H3EventContext就像这个手环，帮助请求在处理过程中携带重要信息。
 */
export interface H3EventContext extends Record<string, any> {
  /** 
   * 匹配的路由参数
   * 
   * 这些是从URL路径中提取出来的动态参数。
   * 例如，如果路由是 /users/:id，访问 /users/123 时，
   * params 会是 { id: "123" }
   * 
   * 就像游乐园里的票，上面标注了你可以玩哪些项目。
   */
  params?: Record<string, string>;

  /**
   * 匹配的路由节点
   * 
   * 这是当前请求匹配到的路由信息，包含路径、处理器等。
   * 就像游乐园的地图，告诉你当前在哪个位置，周围有什么设施。
   * 
   * @experimental 这个对象的结构可能在非主要版本中发生变化。
   * 这意味着它还在测试中，将来可能会改变，就像游乐园里正在测试的新游戏。
   */
  matchedRoute?: H3Route;

  /** 
   * 缓存的会话数据
   * 
   * 会话是在多个请求之间保存用户数据的方式。
   * 就像游乐园记住你玩过哪些项目、获得了多少积分，
   * 这样你下次再来时，可以继续你的游戏进度。
   */
  sessions?: Record<string, Session>;

  /** 
   * 客户端的可信IP地址
   * 
   * 这是发送请求的用户的网络地址，可以用来识别用户来自哪里。
   * 就像游乐园知道你是从哪个入口进来的，可以帮你找到最近的设施。
   */
  clientAddress?: string;
}
