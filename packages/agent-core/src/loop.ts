import type { AgentMessage, AgentTool, AgentConfig, AgentLoopConfig, AgentEvent } from './types'

/**
 * 执行工具调用
 * 支持 Steering: 每个工具执行后检查是否有新的 steering 消息
 */
async function executeToolCalls(
  toolCalls: Array<{ toolCallId: string; toolName: string; input?: unknown; args?: any }>,
  tools: Record<string, AgentTool>,
  loopConfig: AgentLoopConfig,
  onResult: (result: any) => void
): Promise<{ steering: boolean }> {
  const { getSteeringMessages, onEvent, abortSignal } = loopConfig

  for (const call of toolCalls) {
    const { toolCallId, toolName } = call
    const args = call.input ?? call.args
    const tool = tools[toolName]

    // 发出工具调用事件
    onEvent?.({ type: 'tool-call', payload: call })

    let output: any
    let isError = false

    if (!tool) {
      output = `Tool ${toolName} not found`
      isError = true
    } else {
      try {
        if (tool.execute) {
          output = await tool.execute(args, { abortSignal })
        } else {
          output = `Tool ${toolName} has no execute function`
          isError = true
        }
      } catch (error: any) {
        output = error.message || String(error)
        isError = true
      }
    }

    // 发出工具结果事件
    const resultPayload = { toolCallId, toolName, result: output, isError }
    onEvent?.({ type: 'tool-result', payload: resultPayload })
    onResult(resultPayload)

    // 检查 Steering
    const steeringMessages = getSteeringMessages()
    if (steeringMessages.length > 0) {
      // 发现 Steering 消息，剩余工具跳过
      return { steering: true }
    }

    // 检查是否已中止
    if (abortSignal?.aborted) {
      throw new Error('Aborted')
    }
  }

  return { steering: false }
}

/**
 * Agent 核心循环
 */
export async function runLoop(
  initialMessages: AgentMessage[],
  tools: Record<string, AgentTool>,
  config: AgentConfig,
  loopConfig: AgentLoopConfig
): Promise<AgentMessage[]> {
  const { streamFn, systemPrompt, model, maxSteps = 10 } = config
  const { getSteeringMessages, getFollowUpMessages, onEvent, abortSignal } = loopConfig

  const messages = [...initialMessages]
  let stepCount = 0

  // 外层循环：处理 Follow-up
  // 只要有 follow-up 消息，就继续执行
  while (true) {
    if (abortSignal?.aborted) {
break
}

    // 内层循环：处理 Tool Calls 和 Steering
    while (stepCount < maxSteps) {
      stepCount++
      if (abortSignal?.aborted) {
break
}

      // 1. 调用 streamFn
      // 注意：这里我们传入所有消息，streamFn 负责与 LLM 交互
      const { fullStream, response, toolCalls, finishReason } = await streamFn(
        messages,
        tools,
        {
          model,
          abortSignal,
          system: systemPrompt,
          onChunk: (chunk) => {
            // 这里可以处理 chunk，例如流式输出到 UI
            // 但通常由外部通过 subscribe 监听，或者在这里发出 message 事件？
            // 现在的设计是 onEvent 处理离散事件，stream 内容可能需要另外处理
            // 暂时忽略 chunk，假设外部通过 streamFn 的副作用或 stream 对象自己处理
          }
        }
      )

      // 等待流结束，获取完整的 assistant 消息
      // 注意：如果外部需要流式内容，应该直接使用 streamFn 返回的 fullStream
      // 这里我们为了维护 messages 状态，需要等待 response
      // 但实际上，为了不阻塞，我们可以并行消费 stream
      // 简单起见，我们等待 response
      try {
        // 消费流以确保完成（如果外部没有消费）
        for await (const _ of fullStream) { }
      } catch (e: any) {
        if (e?.name === 'AbortError' || e?.message === 'Aborted') {
          throw e
        }
      }

      const responseData = await response
      const newMessages = responseData.messages

      // 更新 messages：追加 assistant 消息
      // 注意：streamFn 返回的 messages 仅包含新生成的 assistant 消息
      // 所以我们需要追加到 history
      messages.push(...(newMessages as AgentMessage[]))

      onEvent?.({ type: 'message', payload: messages[messages.length - 1] })

      const calls = await toolCalls

      // 2. 如果没有 tool calls，检查 follow-up 并决定是否结束内层循环
      if (!calls || calls.length === 0) {
        const followUp = getFollowUpMessages()
        if (followUp.length > 0) {
          // 有 follow-up，加入消息，继续外层循环（即跳出内层，回到外层开头）
          messages.push(...followUp)
          onEvent?.({ type: 'message', payload: followUp })
          break // 跳出内层循环
        } else {
          // 没有 tool calls 且没有 follow-up，任务结束
          onEvent?.({ type: 'finish', payload: { reason: 'stop' } })
          return messages
        }
      }

      // 3. 有 tool calls，执行它们
      const toolResults: any[] = []
      const { steering } = await executeToolCalls(calls, tools, loopConfig, (res) => {
        toolResults.push(res)
      })

      // 构造 tool 消息
      const toolMessage: AgentMessage = {
        role: 'tool',
        content: toolResults.map(r => ({
          type: 'tool-result',
          toolCallId: r.toolCallId,
          toolName: r.toolName,
          result: r.result,
          isError: r.isError
        }))
      }
      messages.push(toolMessage)
      onEvent?.({ type: 'message', payload: toolMessage })

      // 4. 处理 Steering
      if (steering) {
        // 有 steering，获取 steering 消息并加入
        const steeringMsgs = getSteeringMessages()
        // 此时，toolResults 可能只有部分结果，剩余的被跳过
        // 我们已经在 toolMessage 中包含了已执行的结果
        // 对于被跳过的工具，我们需要告知 LLM 吗？
        // executeToolCalls 已经返回了 steering=true，意味着循环中断
        // 我们将 steering 消息加入 history
        messages.push(...steeringMsgs)
        onEvent?.({ type: 'message', payload: steeringMsgs })

        // 继续内层循环（即使用新的 history 再次调用 LLM）
        continue
      }

      // 如果没有 steering，继续内层循环（LLM 会看到 tool results 并继续生成）
    }

    // 防止无限循环
    if (stepCount >= maxSteps) {
      onEvent?.({ type: 'finish', payload: { reason: 'max-steps' } })
      return messages
    }
  }

  return messages
}
