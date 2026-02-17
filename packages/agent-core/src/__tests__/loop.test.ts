import { describe, it, expect, vi } from 'vitest'
import { runLoop } from '../loop'
import type { AgentMessage, AgentTool } from '../types'
import { z } from 'zod'

describe('runLoop', () => {
  it('returns messages when no tool calls', async () => {
    const streamFn = vi.fn(async () => ({
      fullStream: (async function* () { yield { type: 'text-delta', text: 'Hi' } })(),
      response: Promise.resolve({
        messages: [{ role: 'assistant', content: [{ type: 'text', text: 'Hi' }] }]
      }),
      finishReason: Promise.resolve('stop'),
      toolCalls: Promise.resolve([])
    }))
    const messages: AgentMessage[] = [{ role: 'user', content: 'Hello' }]
    const result = await runLoop(
      messages,
      {},
      { streamFn, model: 'test', maxSteps: 5 },
      { getSteeringMessages: () => [], getFollowUpMessages: () => [] }
    )
    expect(result.length).toBeGreaterThan(0)
    expect(result.some(m => m.role === 'assistant')).toBe(true)
  })

  it('executes tools and continues', async () => {
    const getWeather = vi.fn(async () => 'Sunny, 25°C')
    const tools: Record<string, AgentTool> = {
      getWeather: {
        description: 'Get weather',
        parameters: z.object({ city: z.string() }),
        execute: getWeather
      }
    }
    let callCount = 0
    const streamFn = vi.fn(async (_messages, _tools, _opts) => {
      callCount++
      if (callCount === 1) {
        return {
          fullStream: (async function* () {})(),
          response: Promise.resolve({
            messages: [{
              role: 'assistant',
              content: [{
                type: 'tool-call',
                toolCallId: 'call_1',
                toolName: 'getWeather',
                input: { city: 'Beijing' }
              }]
            }]
          }),
          finishReason: Promise.resolve('tool-calls'),
          toolCalls: Promise.resolve([{
            toolCallId: 'call_1',
            toolName: 'getWeather',
            input: { city: 'Beijing' }
          }])
        }
      }
      return {
        fullStream: (async function* () { yield { type: 'text-delta', text: 'Done' } })(),
        response: Promise.resolve({
          messages: [{ role: 'assistant', content: [{ type: 'text', text: 'Done' }] }]
        }),
        finishReason: Promise.resolve('stop'),
        toolCalls: Promise.resolve([])
      }
    })
    const messages: AgentMessage[] = [{ role: 'user', content: 'Weather in Beijing?' }]
    const events: any[] = []
    const result = await runLoop(
      messages,
      tools,
      { streamFn, model: 'test', maxSteps: 5 },
      {
        getSteeringMessages: () => [],
        getFollowUpMessages: () => [],
        onEvent: e => events.push(e)
      }
    )
    expect(getWeather).toHaveBeenCalledWith({ city: 'Beijing' }, expect.any(Object))
    expect(events.some(e => e.type === 'tool-call')).toBe(true)
    expect(events.some(e => e.type === 'tool-result')).toBe(true)
    expect(result.some(m => m.role === 'tool')).toBe(true)
  })

  it('handles tool execution error', async () => {
    const tools: Record<string, AgentTool> = {
      fail: {
        description: 'Fails',
        parameters: z.object({}),
        execute: async () => { throw new Error('Tool failed') }
      }
    }
    const streamFn = vi.fn(async () => ({
      fullStream: (async function* () {})(),
      response: Promise.resolve({
        messages: [{
          role: 'assistant',
          content: [{
            type: 'tool-call',
            toolCallId: 'call_1',
            toolName: 'fail',
            input: {}
          }]
        }]
      }),
      finishReason: Promise.resolve('tool-calls'),
      toolCalls: Promise.resolve([{ toolCallId: 'call_1', toolName: 'fail', input: {} }])
    }))
    const messages: AgentMessage[] = [{ role: 'user', content: 'Call fail' }]
    const result = await runLoop(
      messages,
      tools,
      { streamFn, model: 'test', maxSteps: 5 },
      { getSteeringMessages: () => [], getFollowUpMessages: () => [] }
    )
    const toolMsg = result.find(m => m.role === 'tool') as any
    expect(toolMsg).toBeDefined()
    expect(toolMsg.content[0].isError).toBe(true)
    expect(toolMsg.content[0].result).toContain('Tool failed')
  })
})
