/**
 * 请求体处理工具文件 - body.ts
 * 
 * 这个文件提供了处理HTTP请求体的工具函数，特别是处理URL编码的表单数据。
 * 
 * 小朋友们可以这样理解：
 * 当你在网页上填写表单（比如你的姓名、年龄）并点击提交按钮时，
 * 这些信息会以特殊的格式发送到服务器。这个文件就是帮助服务器理解这些信息的工具。
 */

// 导入一个特殊的空对象，它比普通的{}更安全，没有原型链上的属性
import { EmptyObject } from "./obj";
// 导入一个检查对象是否有某个属性的函数
import { hasProp } from "./object";

/**
 * 解析URL编码的请求体
 * 
 * 这个函数接收一个URL编码的字符串（通常是表单提交的数据），
 * 并将其转换为JavaScript对象，这样程序就能更容易地使用这些数据。
 * 
 * 小朋友们可以这样理解：
 * 想象你收到一封信，信中的内容是用特殊符号写的（比如name=小明&age=10）。
 * 这个函数就像一个翻译官，它把这些特殊符号翻译成你能理解的语言，
 * 比如变成：{ name: "小明", age: "10" }，这样你就知道发信人叫小明，今年10岁了。
 * 
 * @param body - URL编码的字符串，例如："name=小明&age=10"
 * @returns 解析后的JavaScript对象，例如：{ name: "小明", age: "10" }
 */
export function parseURLEncodedBody(body: string) {
  // 使用URLSearchParams把URL编码的字符串转换成可以遍历的格式
  // 就像把"name=小明&age=10"变成一个可以一个一个拿出来看的盒子
  const form = new URLSearchParams(body);
  
  // 创建一个空对象，用来存放解析后的数据
  // 这就像准备一个空盒子，等着把翻译好的信息放进去
  const parsedForm: Record<string, any> = new EmptyObject();
  
  // 遍历表单中的每一对键值对
  // 就像一个一个地查看信中的每一条信息
  for (const [key, value] of form.entries()) {
    // 检查这个键是否已经存在于结果对象中
    if (hasProp(parsedForm, key)) {
      // 如果已经存在但不是数组，就把它变成数组
      // 想象一下，如果信中有两个"喜欢的水果"，我们需要把它们放在一起
      if (!Array.isArray(parsedForm[key])) {
        // 把现有的值放入数组中
        // 比如把"苹果"变成["苹果"]
        parsedForm[key] = [parsedForm[key]];
      }
      // 把新值添加到数组中
      // 比如在["苹果"]后面添加"香蕉"，变成["苹果", "香蕉"]
      parsedForm[key].push(value);
    } else {
      // 如果这个键不存在，就直接赋值
      // 就像第一次看到"名字"这个信息，就记录下来
      parsedForm[key] = value;
    }
  }
  
  // 返回解析好的对象
  // 就像把翻译好的信息交给需要的人
  return parsedForm as unknown;
}
