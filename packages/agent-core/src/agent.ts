import type { AgentConfig, AgentMessage, AgentEvent, AgentLoopConfig } from './types'
import { runLoop } from './loop'

export class Agent {
  private messages: AgentMessage[] = []
  private steeringQueue: AgentMessage[] = []
  private followUpQueue: AgentMessage[] = []
  private abortController: AbortController | null = null
  private listeners: Set<(event: AgentEvent) => void> = new Set()
  private isRunning = false
  private pendingToolCalls = 0

  constructor(private config: AgentConfig) {
    if (config.systemPrompt) {
      this.messages.push({ role: 'system', content: config.systemPrompt })
    }
  }

  /**
   * 发送消息给 Agent
   * 如果 Agent 空闲，立即开始运行
   * 如果 Agent 正在运行：
   *   - 如果正在执行工具，消息作为 steering (打断)
   *   - 如果正在生成文本，消息作为 follow-up (排队)
   */
  async send(content: string, options?: { role?: 'user' | 'system' }): Promise<void> {
    const message: AgentMessage = {
      role: options?.role || 'user',
      content,
      metadata: { emitted: true }
    }

    if (!this.isRunning) {
      this.messages.push(message)
      this.emit({ type: 'message', payload: message })
      await this.start()
    } else {
      // 运行时收到消息
      if (this.pendingToolCalls > 0) {
        // 正在执行工具，优先处理（Steering）
        this.steeringQueue.push(message)
      } else {
        // 正在生成文本或闲置，排队处理（Follow-up）
        this.followUpQueue.push(message)
      }

      // 标记为已发射，避免 onEvent 重复发射
      // 但我们需要确保 loop.ts 能够保留这个 metadata
      if (!message.metadata) {
        message.metadata = {}
      }
      message.metadata.emitted = true

      this.emit({ type: 'message', payload: message })
    }
  }

  /**
   * 停止当前运行
   */
  abort() {
    if (this.abortController) {
      this.abortController.abort()
      this.abortController = null
    }
  }

  /**
   * 订阅事件
   */
  subscribe(callback: (event: AgentEvent) => void): () => void {
    this.listeners.add(callback)
    return () => this.listeners.delete(callback)
  }

  /**
   * 获取当前消息历史
   */
  getMessages(): AgentMessage[] {
    return [...this.messages]
  }

  private emit(event: AgentEvent) {
    this.listeners.forEach(listener => listener(event))
  }

  private async start() {
    if (this.isRunning) {
      return
    }
    this.isRunning = true
    this.abortController = new AbortController()

    try {
      const loopConfig: AgentLoopConfig = {
        getSteeringMessages: () => {
          const msgs = [...this.steeringQueue]
          this.steeringQueue = []
          return msgs
        },
        getFollowUpMessages: () => {
          const msgs = [...this.followUpQueue]
          this.followUpQueue = []
          return msgs
        },
        abortSignal: this.abortController.signal,
        onEvent: (event) => {
          // 追踪工具调用状态
          if (event.type === 'tool-call') {
            this.pendingToolCalls++
          } else if (event.type === 'tool-result') {
            this.pendingToolCalls--
          }

          // 实时更新消息
          if (event.type === 'message') {
            const payload = event.payload
            if (Array.isArray(payload)) {
              this.messages.push(...payload)
              // 过滤掉已经发射过的消息（通常是 send 中发射的）
              if (payload.every(m => m.metadata?.emitted)) {
                return
              }
              // 如果部分发射过，还是需要单独处理？
              // 简化起见，如果 payload 中包含 steering/follow-up，它们通常是一批
              // 这里我们假设 loop.ts 发射的 payload 是同质的
              // 实际上，loop.ts 发射 steeringMsgs 是一批
            } else {
              this.messages.push(payload)
              if (payload.metadata?.emitted) {
                return
              }
            }
          }

          this.emit(event)
        }
      }

      const finalMessages = await runLoop(
        this.messages,
        this.config.tools || {},
        this.config,
        loopConfig
      )

      // 更新消息历史
      this.messages = finalMessages

    } catch (error: any) {
      if (error.name === 'AbortError' || error.message === 'Aborted') {
        this.emit({ type: 'finish', payload: { reason: 'aborted' } })
      } else {
        this.emit({ type: 'error', payload: error })
      }
    } finally {
      this.isRunning = false
      this.abortController = null
      this.pendingToolCalls = 0
      this.steeringQueue = []
      this.followUpQueue = []
    }
  }
}
