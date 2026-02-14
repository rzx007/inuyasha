import { createDeepSeek } from '@ai-sdk/deepseek'
import { streamText, generateText } from 'ai'
import { PromptEngine } from './prompt'
import { StreamParser } from './parser/stream'
import type {
  AIClientConfig,
  AIComponentNode,
  AIContext,
  GenerationOptions,
  GenerationResult,
  StreamCallbacks
} from './types'

/**
 * AI 客户端
 * 框架无关的核心类，负责与 LLM 通信并返回组件 JSON
 */
export class AIClient {
  private provider: ReturnType<typeof createDeepSeek>
  private defaultModel: string

  constructor(config: AIClientConfig) {
    this.provider = createDeepSeek({
      apiKey: config.apiKey,
      baseURL: config.baseURL
    })
    this.defaultModel = config.defaultModel ?? 'deepseek-chat'
  }

  /**
   * 一次性生成 UI 组件树（非流式）
   * @param prompt 用户的自然语言描述
   * @param context AI 上下文（包含 Catalog 和可选的选中组件）
   * @param options 生成选项
   * @returns 生成结果
   */
  async generateUI(
    prompt: string,
    context: AIContext,
    options?: GenerationOptions
  ): Promise<GenerationResult> {
    const model = options?.model ?? this.defaultModel
    const messages = PromptEngine.buildMessages(prompt, context)

    const result = await generateText({
      model: this.provider(model),
      messages,
      temperature: options?.temperature ?? 0.7,
      maxTokens: options?.maxTokens ?? 4096
    })

    const parsed = this.parseResponse(result.text)

    return {
      root: parsed,
      usage: result.usage
        ? {
            promptTokens: result.usage.promptTokens,
            completionTokens: result.usage.completionTokens,
            totalTokens: result.usage.totalTokens
          }
        : undefined
    }
  }

  /**
   * 流式生成 UI 组件树
   * @param prompt 用户的自然语言描述
   * @param context AI 上下文
   * @param callbacks 流式回调
   * @param options 生成选项
   * @returns AbortController 用于取消生成
   */
  async streamUI(
    prompt: string,
    context: AIContext,
    callbacks: StreamCallbacks,
    options?: GenerationOptions
  ): Promise<{ abort: () => void }> {
    const model = options?.model ?? this.defaultModel
    const messages = PromptEngine.buildMessages(prompt, context)
    const parser = new StreamParser()
    const abortController = new AbortController()

    try {
      const result = streamText({
        model: this.provider(model),
        messages,
        temperature: options?.temperature ?? 0.7,
        maxTokens: options?.maxTokens ?? 4096,
        abortSignal: abortController.signal
      })

      // 异步消费流
      this.consumeStream(result, parser, callbacks).catch((error) => {
        if (error.name !== 'AbortError') {
          callbacks.onError?.(error instanceof Error ? error : new Error(String(error)))
        }
      })
    } catch (error) {
      callbacks.onError?.(error instanceof Error ? error : new Error(String(error)))
    }

    return {
      abort: () => abortController.abort()
    }
  }

  /**
   * 消费流式响应
   */
  private async consumeStream(
    result: ReturnType<typeof streamText>,
    parser: StreamParser,
    callbacks: StreamCallbacks
  ): Promise<void> {
    for await (const chunk of result.textStream) {
      const parsed = parser.append(chunk)
      if (parsed) {
        callbacks.onChunk?.(parsed)
      }
    }

    // 流结束后，尝试最终解析
    const finalText = parser.getBuffer()
    const finalResult = this.parseResponse(finalText)
    callbacks.onComplete?.(finalResult)
  }

  /**
   * 解析 LLM 返回的文本为组件节点
   */
  private parseResponse(text: string): AIComponentNode {
    const trimmed = text.trim()

    // 尝试去除 markdown 代码块包裹
    const codeBlockMatch = trimmed.match(/```(?:json)?\s*\n?([\s\S]*?)```/)
    const jsonStr = codeBlockMatch ? codeBlockMatch[1].trim() : trimmed

    try {
      const parsed = JSON.parse(jsonStr)
      return parsed as AIComponentNode
    } catch {
      throw new Error(`AI 返回的内容无法解析为 JSON:\n${jsonStr.slice(0, 200)}...`)
    }
  }
}
