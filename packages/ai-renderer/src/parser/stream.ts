import { parse as parsePartialJson } from 'partial-json'

/**
 * 流式 JSON 解析器
 * 使用 partial-json 作为主解析器，repairJson 作为 fallback
 * 处理 LLM 流式输出中的不完整 JSON，尝试修复并返回可用的局部对象
 */
export class StreamParser {
  private buffer = ''

  /**
   * 重置解析器状态
   */
  reset(): void {
    this.buffer = ''
  }

  /**
   * 追加新的文本块并尝试解析
   * @param chunk 新接收到的文本片段
   * @returns 解析成功返回对象，否则返回 null
   */
  append(chunk: string): unknown | null {
    this.buffer += chunk
    return this.tryParse()
  }

  /**
   * 获取当前缓冲区的原始文本
   */
  getBuffer(): string {
    return this.buffer
  }

  /**
   * 尝试解析当前缓冲区中的 JSON
   * 优先级：完整 JSON > partial-json > repairJson fallback
   */
  private tryParse(): unknown | null {
    const trimmed = this.buffer.trim()
    if (!trimmed) return null

    // 1. 先尝试直接解析（完整 JSON）
    try {
      return JSON.parse(trimmed)
    } catch {
      // 继续尝试修复
    }

    // 2. 提取 JSON 部分（可能有 markdown 包裹）
    const jsonContent = this.extractJson(trimmed)
    if (!jsonContent) return null

    // 3. 优先使用 partial-json 解析不完整 JSON
    try {
      const result = parsePartialJson(jsonContent)
      if (result && typeof result === 'object') {
        return result
      }
    } catch {
      // partial-json 失败，降级到 repairJson
    }

    // 4. fallback: 使用自定义修复逻辑
    const repaired = this.repairJson(jsonContent)
    if (!repaired) return null

    try {
      return JSON.parse(repaired)
    } catch {
      return null
    }
  }

  /**
   * 从可能包含 markdown 代码块的文本中提取 JSON 内容
   */
  private extractJson(text: string): string | null {
    // 去除 ```json ... ``` 包裹
    const codeBlockMatch = text.match(/```(?:json)?\s*\n?([\s\S]*?)(?:```|$)/)
    if (codeBlockMatch) {
      return codeBlockMatch[1].trim()
    }

    // 查找第一个 { 或 [ 开始的内容
    const startIdx = text.search(/[{[]/)
    if (startIdx === -1) return null

    return text.slice(startIdx)
  }

  /**
   * 尝试修复不完整的 JSON 字符串
   * 通过补全缺失的括号和引号来使其可解析
   */
  private repairJson(json: string): string | null {
    if (!json) return null

    let repaired = json

    // 移除尾部不完整的键值对（如 "key": 或 "key": "val）
    repaired = repaired.replace(/,\s*"[^"]*"?\s*:?\s*"?[^"{}[\],]*$/, '')
    // 移除尾部悬挂的逗号
    repaired = repaired.replace(/,\s*$/, '')

    // 统计未闭合的括号
    const stack: string[] = []
    let inString = false
    let escape = false

    for (const char of repaired) {
      if (escape) {
        escape = false
        continue
      }
      if (char === '\\') {
        escape = true
        continue
      }
      if (char === '"') {
        inString = !inString
        continue
      }
      if (inString) continue

      if (char === '{' || char === '[') {
        stack.push(char)
      } else if (char === '}') {
        if (stack.length > 0 && stack[stack.length - 1] === '{') {
          stack.pop()
        }
      } else if (char === ']') {
        if (stack.length > 0 && stack[stack.length - 1] === '[') {
          stack.pop()
        }
      }
    }

    // 如果在字符串中，先闭合字符串
    if (inString) {
      repaired += '"'
    }

    // 补全未闭合的括号（从栈顶开始）
    while (stack.length > 0) {
      const open = stack.pop()
      repaired += open === '{' ? '}' : ']'
    }

    return repaired
  }
}
