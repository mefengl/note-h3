/**
 * 类型索引文件
 * 
 * 这个文件是H3框架的类型定义索引，它将所有分散在不同文件中的类型重新导出，
 * 方便用户在一个地方导入所有需要的类型。
 * 
 * 这就像是一个图书馆的总目录，告诉你每本书在哪个书架上，
 * 这样你就不用跑遍整个图书馆去找一本书了。
 */

/**
 * H3核心类型
 * 
 * 这些是H3框架的核心类型，定义了服务器实例、配置选项等基础结构。
 * 
 * H3: 主服务器类型，就像是整个餐厅的管理者
 * H3Config: 服务器配置选项，就像是餐厅的营业规则
 * WebSocketOptions: WebSocket选项，就像是餐厅里特殊的通讯设备设置
 * H3Error: H3错误类型，就像是餐厅可能遇到的各种问题
 */
export type { H3, H3Config, WebSocketOptions, H3Error } from "./h3";

/**
 * 事件类型
 * 
 * H3Event是框架中最基础的事件类型，代表一个HTTP请求和响应的组合。
 * 
 * 这就像是顾客点餐的整个过程：从顾客说出自己想要什么(请求)，
 * 到服务员记录并准备回应(响应)的全过程。
 */
export type { H3Event } from "./event";

/**
 * 处理器类型
 * 
 * 这些类型定义了如何处理HTTP请求的各种方式和组件。
 * 
 * EventHandler: 事件处理函数，就像是厨师，负责处理顾客的点餐请求
 * EventHandlerObject: 事件处理对象，一个带有额外属性的处理函数，就像是一个有特殊技能的厨师
 * EventHandlerRequest: 事件处理请求类型，就像是顾客的点餐单
 * EventHandlerResolver: 事件处理解析器，决定哪个厨师来处理哪个点餐
 * EventHandlerResponse: 事件处理响应类型，就像是准备好的菜品
 * DynamicEventHandler: 动态事件处理器，可以在运行时更换的厨师
 * LazyEventHandler: 懒加载事件处理器，只有需要时才会出现的厨师
 * InferEventInput: 推断事件输入类型，自动猜测顾客想要什么
 * RequestMiddleware: 请求中间件，在厨师做菜前对原料进行预处理的帮手
 * ResponseMiddleware: 响应中间件，在菜品上桌前进行最后装饰的帮手
 */
export type {
  EventHandler,
  EventHandlerObject,
  EventHandlerRequest,
  EventHandlerResolver,
  EventHandlerResponse,
  DynamicEventHandler,
  LazyEventHandler,
  InferEventInput,
  RequestMiddleware,
  ResponseMiddleware,
} from "./handler";

/**
 * 上下文类型
 * 
 * H3EventContext定义了事件的上下文信息，包含了处理请求时可能需要的额外数据。
 * 
 * 这就像是厨师在做菜时需要知道的额外信息：这是普通顾客还是VIP？
 * 是堂食还是外卖？这些信息会影响厨师如何准备和呈现菜品。
 */
export type { H3EventContext } from "./context";

/**
 * 事件流类型
 * 
 * 这些类型用于服务器发送事件(SSE)功能，允许服务器向客户端推送实时更新。
 * 
 * EventStreamMessage: 事件流消息，就像是餐厅的广播通知
 * EventStreamOptions: 事件流选项，控制广播的方式和频率
 * EventStream: 事件流本身，就像是餐厅的广播系统
 * 
 * 例如：当厨房完成一道菜时，可以通过广播系统通知服务员来取餐，
 * 而不需要服务员不断地来厨房询问。
 */
export type { EventStreamMessage, EventStreamOptions } from "./utils/sse";
export type { EventStream } from "../utils/internal/event-stream";

/**
 * Node.js相关类型
 * 
 * 这些类型用于与Node.js HTTP服务器集成。
 * 
 * NodeMiddleware: Node.js中间件，就像是能在Node.js环境中工作的特殊助手
 * NodeHandler: Node.js处理器，就像是专门为Node.js环境设计的厨师
 * 
 * 这些类型让H3框架可以无缝地与Node.js的HTTP模块协同工作，
 * 就像是让餐厅的厨师能够适应不同的厨房环境。
 */
export type { NodeMiddleware, NodeHandler } from "./node";

/**
 * HTTP相关类型
 * 
 * 这些类型定义了HTTP协议中的各种标准元素。
 * 
 * StatusCode: HTTP状态码，表示请求处理的结果，就像是餐厅服务的结果状态
 *            (例如：200表示成功，404表示找不到，500表示服务器出错)
 * HTTPMethod: HTTP方法，表示请求的类型，就像是顾客的不同需求
 *            (例如：GET是获取信息，POST是提交信息)
 * Encoding: 编码方式，决定数据如何被压缩和表示，就像是不同的包装方式
 * MimeType: 媒体类型，表示数据的格式，就像是菜品的类型(中餐、西餐等)
 * RequestHeaders: 请求头，包含请求的元数据，就像是顾客点餐时的特殊要求
 * RequestHeaderName: 请求头名称，就像是特殊要求的具体类型
 * ResponseHeaders: 响应头，包含响应的元数据，就像是菜品的附加信息
 * ResponseHeaderName: 响应头名称，就像是附加信息的具体类型
 */
export type {
  StatusCode,
  HTTPMethod,
  Encoding,
  MimeType,
  RequestHeaders,
  RequestHeaderName,
  ResponseHeaders,
  ResponseHeaderName,
} from "./http";

/**
 * --- 工具类型 ---
 * 
 * 以下是各种辅助功能的类型定义，它们像是餐厅中的各种专用工具，
 * 每一种都有特定的用途，帮助主厨更高效地工作。
 */

/**
 * 缓存相关类型
 * 
 * CacheConditions定义了何时使用缓存的条件。
 * 
 * 这就像是餐厅的预制菜规则：什么情况下可以使用提前做好的菜，
 * 什么情况下必须现做。合理使用缓存可以大大提高服务器性能和响应速度。
 */
export type { CacheConditions } from "./utils/cache";

/**
 * 会话相关类型
 * 
 * 这些类型用于管理用户会话，存储用户状态和数据。
 * 
 * Session: 会话对象，就像是顾客的会员卡，记录了顾客的信息和偏好
 * SessionConfig: 会话配置，就像是会员系统的规则设置
 * SessionData: 会话数据，就像是会员卡上存储的具体信息
 * 
 * 会话功能让服务器能够记住用户，即使在多次请求之间也能保持状态，
 * 就像餐厅认出了回头客并记得他们的偏好。
 */
export type { Session, SessionConfig, SessionData } from "./utils/session";

/**
 * 代理相关类型
 * 
 * 这些类型用于设置HTTP代理，将请求转发到其他服务器。
 * 
 * ProxyOptions: 代理选项，就像是餐厅的外卖合作规则
 * Duplex: 双工通信类型，允许数据双向流动，就像是餐厅和外卖平台之间的双向通讯
 * 
 * 代理功能让一个服务器可以转发请求到另一个服务器，就像餐厅接到了
 * 一个自己不擅长的菜品订单，于是将其转给专门的厨师来处理。
 */
export type { ProxyOptions, Duplex } from "./utils/proxy";

/**
 * 跨域资源共享(CORS)相关类型
 * 
 * H3CorsOptions定义了CORS的配置选项，控制哪些外部网站可以访问API。
 * 
 * 这就像是餐厅的访客政策：哪些人可以进入厨房参观，哪些人只能在餐厅区域。
 * CORS是web安全的重要部分，它防止未经授权的网站访问你的API数据。
 * 
 * 例如：如果你的API在example.com，而用户在访问othersite.com时，
 * othersite.com的JavaScript代码默认是不能访问你的API的，除非你的API
 * 明确允许来自othersite.com的请求。
 */
export type { H3CorsOptions } from "./utils/cors";

/**
 * 请求指纹相关类型
 * 
 * RequestFingerprintOptions定义了如何生成请求的唯一标识(指纹)。
 * 
 * 这就像是餐厅根据顾客的特征(身高、衣着、声音等)来识别顾客，
 * 即使顾客没有出示会员卡。请求指纹可以用于缓存、安全检查等场景。
 * 
 * 例如：即使用户没有登录，服务器也可以通过IP地址、浏览器特征等
 * 生成一个相对唯一的标识，用于限制API调用频率或检测可疑行为。
 */
export type { RequestFingerprintOptions } from "./utils/fingerprint";

/**
 * 静态文件服务相关类型
 * 
 * 这些类型用于配置静态文件(如HTML、CSS、图片等)的服务。
 * 
 * ServeStaticOptions: 静态文件服务选项，就像是餐厅展示菜单和装饰画的规则
 * StaticAssetMeta: 静态资源元数据，就像是每个展示品的详细信息
 * 
 * 静态文件服务是网站的重要组成部分，它处理那些不需要动态生成的内容，
 * 就像餐厅中除了现做的菜品，还有提前准备好的面包、饮料等。
 */
export type { ServeStaticOptions, StaticAssetMeta } from "./utils/static";

/**
 * 数据验证相关类型
 * 
 * 这些类型用于验证输入数据的正确性和合法性。
 * 
 * ValidateFunction: 验证函数，就像是检查食材质量的程序
 * ValidateResult: 验证结果，就像是检查后的报告，说明食材是否合格
 * 
 * 数据验证是保证应用安全和稳定的关键步骤，它确保所有输入数据
 * 符合预期的格式和规则，就像厨师在烹饪前会检查食材的新鲜度和质量。
 */
export type { ValidateFunction, ValidateResult } from "./utils/validate";
