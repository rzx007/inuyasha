import { describe, it, expect, vi, beforeEach } from 'vitest'
import { Agent } from '../agent'
import type { AgentConfig, AgentMessage } from '../types'

function createMockStreamFn(responses: Array<{ text?: string; toolCalls?: Array<{ toolCallId: string; toolName: string; input?: unknown }> }>) {
  let callIndex = 0
  return vi.fn(async (messages: AgentMessage[], _tools: Record<string, any>, options: any) => {
    const resp = responses[callIndex++] ?? { text: 'No more responses' }
    const toolCalls = resp.toolCalls ?? []
    return {
      fullStream: (async function* () {
        if (resp.text) yield { type: 'text-delta', text: resp.text }
      })(),
      response: Promise.resolve({
        messages: [{
          role: 'assistant',
          content: resp.text
            ? [{ type: 'text', text: resp.text }]
            : toolCalls.map(tc => ({
                type: 'tool-call' as const,
                toolCallId: tc.toolCallId,
                toolName: tc.toolName,
                input: tc.input
              }))
        }]
      }),
      finishReason: Promise.resolve('stop'),
      toolCalls: Promise.resolve(toolCalls)
    }
  })
}

describe('Agent', () => {
  it('instantiates with config', () => {
    const streamFn = vi.fn()
    const agent = new Agent({
      streamFn,
      systemPrompt: 'You are helpful.',
      tools: {}
    })
    expect(agent.getMessages()).toHaveLength(1)
    expect(agent.getMessages()[0]).toMatchObject({ role: 'system', content: 'You are helpful.' })
  })

  it('subscribe receives events', async () => {
    const events: any[] = []
    const streamFn = createMockStreamFn([{ text: 'Hello!' }])
    const agent = new Agent({
      streamFn,
      systemPrompt: 'Help',
      model: 'test'
    })
    agent.subscribe(e => events.push(e))
    await agent.send('Hi')
    expect(events.some(e => e.type === 'message')).toBe(true)
    expect(events.some(e => e.type === 'finish')).toBe(true)
  })

  it('getMessages returns copy', () => {
    const agent = new Agent({ streamFn: vi.fn(), systemPrompt: 'x' })
    const m1 = agent.getMessages()
    const m2 = agent.getMessages()
    expect(m1).not.toBe(m2)
    expect(m1).toEqual(m2)
  })

  it('abort stops execution', async () => {
    const streamFn = vi.fn(async (_m: any, _t: any, options: { abortSignal?: AbortSignal }) => {
      const signal = options.abortSignal
      return {
        fullStream: (async function* () {
          await new Promise<void>((resolve, reject) => {
            const onAbort = () => reject(new DOMException('Aborted', 'AbortError'))
            signal?.addEventListener?.('abort', onAbort, { once: true })
            setTimeout(() => {
              signal?.removeEventListener?.('abort', onAbort)
              resolve()
            }, 50)
          })
          if (signal?.aborted) throw new DOMException('Aborted', 'AbortError')
          yield { type: 'text-delta', text: 'x' }
        })(),
        response: Promise.resolve({ messages: [] }),
        finishReason: Promise.resolve('stop'),
        toolCalls: Promise.resolve([])
      }
    })
    const agent = new Agent({ streamFn, model: 'test' })
    const events: any[] = []
    agent.subscribe(e => events.push(e))
    const p = agent.send('Hi')
    setTimeout(() => agent.abort(), 10)
    await p
    expect(events.some(e => e.type === 'finish' && e.payload?.reason === 'aborted')).toBe(true)
  })
})
