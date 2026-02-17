import { describe, it, expect } from 'vitest'
import { convertToCoreMessages } from '../transform'
import type { AgentMessage } from '../types'

describe('convertToCoreMessages', () => {
  it('converts system message', () => {
    const messages: AgentMessage[] = [
      { role: 'system', content: 'You are helpful.' }
    ]
    const result = convertToCoreMessages(messages)
    expect(result).toEqual([{ role: 'system', content: 'You are helpful.' }])
  })

  it('converts user message', () => {
    const messages: AgentMessage[] = [
      { role: 'user', content: 'Hello' }
    ]
    const result = convertToCoreMessages(messages)
    expect(result).toEqual([{ role: 'user', content: 'Hello' }])
  })

  it('converts assistant message', () => {
    const messages: AgentMessage[] = [
      { role: 'assistant', content: 'Hi there!' }
    ]
    const result = convertToCoreMessages(messages)
    expect(result).toEqual([{ role: 'assistant', content: 'Hi there!' }])
  })

  it('converts tool message with result', () => {
    const messages: AgentMessage[] = [
      {
        role: 'tool',
        content: [{
          type: 'tool-result',
          toolCallId: 'call_1',
          toolName: 'getWeather',
          result: 'Sunny, 25°C'
        }]
      }
    ]
    const result = convertToCoreMessages(messages)
    expect(result).toHaveLength(1)
    expect(result[0].role).toBe('tool')
    expect((result[0] as any).content[0]).toMatchObject({
      type: 'tool-result',
      toolCallId: 'call_1',
      toolName: 'getWeather'
    })
  })

  it('converts tool message with isError', () => {
    const messages: AgentMessage[] = [
      {
        role: 'tool',
        content: [{
          type: 'tool-result',
          toolCallId: 'call_1',
          toolName: 'getWeather',
          result: 'Network error',
          isError: true
        }]
      }
    ]
    const result = convertToCoreMessages(messages)
    expect(result).toHaveLength(1)
    expect((result[0] as any).content[0].output).toMatchObject({
      type: 'error-text',
      value: 'Network error'
    })
  })
})
