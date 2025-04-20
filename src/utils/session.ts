/**
 * session.ts - 会话管理工具
 * 
 * 这个文件包含了用于管理用户会话（Session）的函数。
 * 
 * 什么是会话？想象一下，当你登录一个网站时，网站需要记住你是谁。
 * 但因为HTTP协议是无状态的（就像每次请求都是一个全新的对话），
 * 所以网站需要一种方式来跟踪你的状态。会话就是这样的机制。
 * 
 * 会话就像是一个存储在服务器上的小箱子，里面放着与你相关的信息。
 * 每次你访问网站时，服务器会给你一个钥匙（通常存在Cookie中），
 * 这样下次你来时，服务器就知道要打开哪个箱子了。
 * 
 * 这个文件提供了几个主要功能：
 * 1. 创建和获取会话 (useSession, getSession)
 * 2. 更新会话数据 (updateSession)
 * 3. 加密和解密会话数据 (sealSession, unsealSession)
 * 4. 清除会话 (clearSession)
 */

// 导入我们需要的类型和函数
import type { H3Event, Session, SessionConfig, SessionData } from "../types";
import { seal, unseal, defaults as sealDefaults } from "./internal/iron-crypto";
import { getCookie, setCookie } from "./cookie";
import {
  DEFAULT_SESSION_NAME,      // 默认的会话名称
  DEFAULT_SESSION_COOKIE,    // 默认的会话Cookie设置
  kGetSession,               // 内部使用的符号，用于获取会话
} from "./internal/session";
import { EmptyObject } from "./internal/obj";

/**
 * 为当前请求创建一个会话管理器
 * 
 * 想象一下，这个函数就像是一个箱子管理员。它可以帮你创建一个新的箱子，
 * 或者找到你现有的箱子，然后帮你存取、更新或清除里面的东西。
 * 
 * 这个函数返回一个会话管理器对象，它有以下几个方法：
 * - id: 获取会话的唯一标识符
 * - data: 获取会话中存储的数据
 * - update: 更新会话数据
 * - clear: 清除会话
 * 
 * @param event H3事件对象，包含了HTTP请求的所有信息
 * @param config 会话配置，包括名称、密码、过期时间等
 * @returns 会话管理器对象
 */
export async function useSession<T extends SessionData = SessionData>(
  event: H3Event,      // H3事件对象
  config: SessionConfig, // 会话配置
) {
  // 创建一个同步的会话包装器
  // 这就像是给箱子配一把钥匙和一个标签
  const sessionName = config.name || DEFAULT_SESSION_NAME;  // 获取会话名称，如果没有指定就使用默认名称
  await getSession(event, config); // 强制初始化会话
  
  // 创建会话管理器对象
  // 这就像是一个管理箱子的工具箱，有各种功能
  const sessionManager = {
    // 获取会话的唯一ID
    // 这就像是箱子的编号
    get id() {
      return event.context.sessions?.[sessionName]?.id;
    },
    
    // 获取会话中存储的数据
    // 这就像是查看箱子里的东西
    get data() {
      return (event.context.sessions?.[sessionName]?.data || {}) as T;
    },
    
    // 更新会话数据
    // 这就像是往箱子里放东西或修改里面的东西
    update: async (update: SessionUpdate<T>) => {
      await updateSession<T>(event, config, update);
      return sessionManager;  // 返回管理器本身，方便链式调用
    },
    
    // 清除会话
    // 这就像是清空箱子里的所有东西
    clear: () => {
      clearSession(event, config);
      return Promise.resolve(sessionManager);  // 返回管理器本身，方便链式调用
    },
  };
  
  return sessionManager;  // 返回会话管理器
}

/**
 * 获取当前请求的会话
 * 
 * 想象一下，这个函数就像是一个箱子管理员，负责找到或创建属于你的箱子。
 * 它会先检查你是否已经有一个箱子（现有会话），如果有就直接返回。
 * 如果没有，它会创建一个新的箱子，并把它存储在服务器上。
 * 
 * 这个函数会尝试从以下几个地方找到你的会话：
 * 1. 请求头（如果配置了sessionHeader）
 * 2. Cookie（默认位置）
 * 
 * 如果找到了会话，它会解密并验证会话数据。
 * 如果没有找到或验证失败，它会创建一个新的会话。
 * 
 * @param event H3事件对象，包含了HTTP请求的所有信息
 * @param config 会话配置，包括名称、密码、过期时间等
 * @returns 会话对象，包含id、创建时间和数据
 */
export async function getSession<T extends SessionData = SessionData>(
  event: H3Event,      // H3事件对象
  config: SessionConfig,  // 会话配置
): Promise<Session<T>> {
  // 获取会话名称，如果没有指定就使用默认名称
  // 这就像是确定箱子的标签
  const sessionName = config.name || DEFAULT_SESSION_NAME;

  // 如果已经有会话，直接返回
  // 这就像是检查是否已经找到了箱子
  if (!event.context.sessions) {
    // 如果没有会话容器，创建一个空对象
    // 这就像是准备一个架子来放箱子
    event.context.sessions = new EmptyObject();
  }
  
  // 等待现有会话加载完成
  // 这就像是等待别人用完箱子
  const existingSession = event.context.sessions![sessionName] as Session<T>;
  if (existingSession) {
    // 如果已经有会话，返回正在加载的会话或已加载的会话
    // 这就像是：如果箱子正在被搬运，等它到位；如果已经在架子上了，直接拿来用
    return existingSession[kGetSession] || existingSession;
  }

  // 准备一个空的会话对象并存储在上下文中
  // 这就像是准备一个新的空箱子
  const session: Session<T> = {
    id: "",              // 会话ID，初始为空
    createdAt: 0,        // 创建时间，初始为0
    data: new EmptyObject(),  // 会话数据，初始为空对象
  };
  event.context.sessions![sessionName] = session;  // 将新会话存储在上下文中

  // 尝试加载会话
  // 这就像是尝试找到你的旧箱子
  let sealedSession: string | undefined;
  
  // 先尝试从请求头中获取会话
  // 这就像是先检查你是否带着箱子的钥匙
  if (config.sessionHeader !== false) {
    // 确定请求头的名称
    // 这就像是确定钥匙的标签
    const headerName =
      typeof config.sessionHeader === "string"
        ? config.sessionHeader.toLowerCase()  // 如果指定了头名称，使用它
        : `x-${sessionName.toLowerCase()}-session`;  // 否则使用默认格式
    
    // 获取请求头的值
    // 这就像是查看钥匙上的编号
    const headerValue = event.request.headers.get(headerName);
    if (typeof headerValue === "string") {
      sealedSession = headerValue;  // 如果找到了，保存它
    }
  }
  
  // 如果请求头中没有找到，尝试从Cookie中获取
  // 这就像是：如果你没带钥匙，我们看看你的口袋里有没有备用钥匙
  if (!sealedSession) {
    sealedSession = getCookie(event, sessionName);
  }
  
  // 如果找到了加密的会话数据
  // 这就像是：如果找到了钥匙，我们试着打开箱子
  if (sealedSession) {
    // 解密会话数据
    // 这就像是用钥匙打开箱子，看看里面有什么
    const promise = unsealSession(event, config, sealedSession)
      .catch(() => {})  // 如果解密失败，忽略错误
      .then((unsealed) => {
        // 将解密后的数据合并到会话对象中
        // 这就像是把箱子里的东西整理好
        Object.assign(session, unsealed);
        // 删除正在加载的标记
        // 这就像是表示箱子已经准备好了
        delete event.context.sessions![sessionName][kGetSession];
        return session as Session<T>;
      });
    
    // 保存解密的Promise，以便其他地方可以等待它完成
    // 这就像是告诉别人：箱子正在被整理，请稍等
    event.context.sessions![sessionName][kGetSession] = promise;
    await promise;  // 等待解密完成
  }

  // 如果没有找到会话或解密失败，创建一个新的会话
  // 这就像是：如果找不到你的旧箱子，我们给你一个新的
  if (!session.id) {
    // 生成一个新的会话ID
    // 这就像是给新箱子贴上编号
    session.id =
      config.generateId?.() ?? (config.crypto || crypto).randomUUID();
    // 设置创建时间为当前时间
    // 这就像是记录箱子的制造日期
    session.createdAt = Date.now();
    // 更新会话，将其保存到Cookie中
    // 这就像是把新箱子放到架子上，并给你一把钥匙
    await updateSession(event, config);
  }

  // 返回会话对象
  // 这就像是：现在你的箱子准备好了，给你
  return session;
}

/**
 * 会话更新类型
 * 可以是一个部分数据对象，或者一个函数，该函数接收旧数据并返回新数据
 */
type SessionUpdate<T extends SessionData = SessionData> =
  | Partial<SessionData<T>>  // 部分会话数据对象
  | ((oldData: SessionData<T>) => Partial<SessionData<T>> | undefined);  // 或者一个函数

/**
 * 更新当前请求的会话数据
 * 
 * 想象一下，这个函数就像是一个箱子管理员，负责在你的箱子里放入或更新东西。
 * 你可以给它一个新的东西（数据对象），或者一个指南（函数）来告诉它如何修改箱子里的东西。
 * 
 * 当你更新会话数据后，这个函数会自动将加密后的会话数据存储在Cookie中，
 * 这样下次用户访问时，服务器就能识别并恢复他们的会话状态。
 * 
 * @param event H3事件对象，包含了HTTP请求的所有信息
 * @param config 会话配置，包括名称、密码、过期时间等
 * @param update 可选的更新数据或更新函数
 * @returns 更新后的会话对象
 */
export async function updateSession<T extends SessionData = SessionData>(
  event: H3Event,      // H3事件对象
  config: SessionConfig,  // 会话配置
  update?: SessionUpdate<T>,  // 可选的更新数据或函数
): Promise<Session<T>> {
  // 获取会话名称，如果没有指定就使用默认名称
  // 这就像是确定要操作哪个箱子
  const sessionName = config.name || DEFAULT_SESSION_NAME;

  // 获取当前会话
  // 这就像是找到你的箱子，或者如果没有，创建一个新的
  const session: Session<T> =
    (event.context.sessions?.[sessionName] as Session<T>) ||
    (await getSession<T>(event, config));

  // 如果提供了更新数据，则更新会话数据
  // 这就像是检查你想如何修改箱子里的东西
  if (typeof update === "function") {
    // 如果更新是一个函数，调用它并传入当前数据
    // 这就像是按照你的指南来修改箱子里的东西
    update = update(session.data);
  }
  if (update) {
    // 将更新数据合并到会话数据中
    // 这就像是将新的东西放入箱子或更新现有的东西
    Object.assign(session.data, update);
  }

  // 如果启用了Cookie，加密会话并存储在Cookie中
  // 这就像是锁上箱子，并给你一把钥匙（Cookie）
  if (config.cookie !== false) {
    // 加密会话数据
    // 这就像是将箱子锁上，只有有钥匙的人才能打开
    const sealed = await sealSession(event, config);
    
    // 将加密后的会话数据存储在Cookie中
    // 这就像是给你一把钥匙，上面有箱子的编号
    setCookie(event, sessionName, sealed, {
      ...DEFAULT_SESSION_COOKIE,  // 使用默认的Cookie设置
      // 设置过期时间，如果配置了maxAge
      // 这就像是设置钥匙的有效期
      expires: config.maxAge
        ? new Date(session.createdAt + config.maxAge * 1000)  // 创建时间 + 最大寿命
        : undefined,  // 如果没有设置maxAge，则不设置过期时间
      ...config.cookie,  // 合并用户提供的Cookie设置
    });
  }

  // 返回更新后的会话对象
  // 这就像是：现在你的箱子已经更新好了，给你
  return session;
}

/**
 * 加密并签名当前请求的会话数据
 * 
 * 想象一下，这个函数就像是一个保安员，负责将你的箱子锁起来并加上安全印章。
 * 这样，只有持有正确钥匙（密码）的人才能打开箱子，而且可以验证箱子是否被篡改过。
 * 
 * 这个函数使用iron-crypto库来加密和签名会话数据，保证会话数据的安全性和完整性。
 * 
 * @param event H3事件对象，包含了HTTP请求的所有信息
 * @param config 会话配置，包括密码、最大寿命等
 * @returns 加密后的会话数据字符串
 */
export async function sealSession<T extends SessionData = SessionData>(
  event: H3Event,      // H3事件对象
  config: SessionConfig,  // 会话配置
) {
  // 获取会话名称，如果没有指定就使用默认名称
  // 这就像是确定要锁哪个箱子
  const sessionName = config.name || DEFAULT_SESSION_NAME;

  // 获取当前会话
  // 这就像是找到你的箱子，或者如果没有，创建一个新的
  const session: Session<T> =
    (event.context.sessions?.[sessionName] as Session<T>) ||
    (await getSession<T>(event, config));

  // 使用iron-crypto库的seal函数加密会话数据
  // 这就像是用特殊的锁和安全印章锁住箱子
  const sealed = await seal(session, config.password, {
    ...sealDefaults,  // 使用默认的加密设置
    ttl: config.maxAge ? config.maxAge * 1000 : 0,  // 设置生存时间（毫秒）
    ...config.seal,  // 合并用户提供的加密设置
  });

  // 返回加密后的会话数据
  // 这就像是返回一个已经锁好的箱子，只有持有钥匙的人才能打开
  return sealed;
}

/**
 * 解密并验证会话数据
 * 
 * 想象一下，这个函数就像是一个保安员，负责用钥匙打开你的箱子并检查安全印章是否完好。
 * 它会验证箱子是否被篡改过，以及是否过期。
 * 
 * 这个函数使用iron-crypto库来解密和验证会话数据，确保数据的安全性和完整性。
 * 如果会话已过期，它会抛出一个错误。
 * 
 * @param _event H3事件对象（在这个函数中没有使用，但保留为了一致性）
 * @param config 会话配置，包括密码、最大寿命等
 * @param sealed 加密的会话数据字符串
 * @returns 解密后的会话数据
 */
export async function unsealSession(
  _event: H3Event,      // H3事件对象（在这个函数中没有使用）
  config: SessionConfig,  // 会话配置
  sealed: string,       // 加密的会话数据
) {
  // 使用iron-crypto库的unseal函数解密会话数据
  // 这就像是用钥匙打开锁住的箱子，并检查安全印章
  const unsealed = (await unseal(sealed, config.password, {
    ...sealDefaults,  // 使用默认的解密设置
    ttl: config.maxAge ? config.maxAge * 1000 : 0,  // 设置生存时间（毫秒）
    ...config.seal,  // 合并用户提供的解密设置
  })) as Partial<Session>;
  
  // 如果配置了最大寿命，检查会话是否过期
  // 这就像是检查箱子的使用期限是否到期
  if (config.maxAge) {
    // 计算会话的年龄（当前时间 - 创建时间）
    // 这就像是计算箱子已经使用了多长时间
    const age = Date.now() - (unsealed.createdAt || Number.NEGATIVE_INFINITY);
    
    // 如果会话年龄超过了最大寿命，抛出错误
    // 这就像是：如果箱子已经过期，则不能使用
    if (age > config.maxAge * 1000) {
      throw new Error("Session expired!");
    }
  }
  
  // 返回解密后的会话数据
  // 这就像是返回箱子里的东西
  return unsealed;
}

/**
 * 清除当前请求的会话数据
 * 
 * 想象一下，这个函数就像是一个箱子管理员，负责清空你的箱子并收回钥匙。
 * 它会删除服务器上存储的会话数据，并将Cookie中的会话标识符设置为空。
 * 
 * 这个函数通常用于用户退出登录或清除会话状态的情况。
 * 
 * @param event H3事件对象，包含了HTTP请求的所有信息
 * @param config 会话配置，包括名称、Cookie设置等
 * @returns 空的Promise，表示清除操作完成
 */
export function clearSession(
  event: H3Event,      // H3事件对象
  config: Partial<SessionConfig>,  // 会话配置（可以是部分配置）
): Promise<void> {
  // 获取会话名称，如果没有指定就使用默认名称
  // 这就像是确定要清空哪个箱子
  const sessionName = config.name || DEFAULT_SESSION_NAME;
  
  // 如果存在会话，则从上下文中删除它
  // 这就像是清空箱子并从架子上移除
  if (event.context.sessions?.[sessionName]) {
    delete event.context.sessions![sessionName];
  }
  
  // 将Cookie中的会话标识符设置为空
  // 这就像是收回箱子的钥匙，让用户无法再访问该箱子
  setCookie(event, sessionName, "", {
    ...DEFAULT_SESSION_COOKIE,  // 使用默认的Cookie设置
    ...config.cookie,  // 合并用户提供的Cookie设置
  });
  
  // 返回一个已解决的空Promise
  // 这就像是说：“清空工作已完成”
  return Promise.resolve();
}
