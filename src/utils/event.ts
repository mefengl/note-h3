/**
 * 事件工具函数模块
 * 
 * 这个文件提供了一些工具函数，用于处理H3框架中的事件对象。
 * 就像一个玩具工厂，可以检查玩具的类型或创建新的玩具。
 * 在这里，“玩具”就是HTTP请求事件。
 */

// 导入必要的类型和类
import { H3WebEvent } from "../event";  // 导入H3Web事件类
import type { H3EventContext, H3Event } from "../types";  // 导入H3事件相关类型

/**
 * 检查输入是否是H3Event对象
 * 
 * 这个函数就像一个玩具检查器，可以判断一个对象是不是真正的H3事件。
 * 就像你想知道手中的玩具是不是真正的乐高积木，而不是山寨版。
 * 
 * @param input - 要检查的输入对象
 * @returns 如果输入是H3Event对象返回true，否则返回false
 * @see H3Event 相关的H3Event类型定义
 */
export function isEvent(input: any): input is H3Event {
  // 获取输入对象的构造函数
  // 就像查看玩具的制造商标记
  const ctor = input?.constructor;
  
  // 检查构造函数或输入对象本身是否有__is_event__标记
  // 就像查看玩具上是否有“正版认证”的标签
  return (
    ctor.__is_event__ ||
    input.__is_event__ /* 向后兼容h3 v1版本 */
  );
}

/**
 * 创建一个模拟的H3事件对象
 * 
 * 这个函数就像一个玩具工厂，可以创建一个模拟的HTTP请求事件。
 * 在测试中非常有用，因为我们可以不需要真正的服务器就能模拟一个请求。
 * 就像你可以用纸箱和鸟球玩“假装打乒乓球”的游戏，而不需要真正的乒乓球桌。
 * 
 * @param _request - 请求信息，可以是字符串URL、URL对象或Request对象
 * @param options - 可选的请求选项和H3上下文
 * @returns 创建的H3Event对象
 */
export function mockEvent(
  _request: string | URL | Request,
  options?: RequestInit & { h3?: H3EventContext },
): H3Event {
  // 初始化一个Request对象变量
  let request: Request;
  
  // 如果输入是字符串，将其转换为Request对象
  if (typeof _request === "string") {
    // 保存URL字符串
    let url = _request;
    
    // 如果URL以"/"开头，说明是相对路径，需要添加主机名
    // 就像你说“去商店”，但没说是哪个商店，我们就默认是“去本地的商店”
    if (url[0] === "/") {
      url = `http://localhost${url}`;
    }
    
    // 创建新的Request对象
    request = new Request(url, options);
  } 
  // 如果有选项或输入是URL对象，也创建新的Request对象
  else if (options || _request instanceof URL) {
    request = new Request(_request, options);
  } 
  // 如果输入已经是Request对象，直接使用
  else {
    request = _request;
  }
  
  // 最后创建并返回一个H3WebEvent对象
  // 就像把准备好的材料组装成最终的玩具
  return new H3WebEvent(request);
}
