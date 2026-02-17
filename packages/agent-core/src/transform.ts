import type { ModelMessage } from 'ai';
import type { AgentMessage } from './types';

/**
 * 将 AgentMessage 转换为 AI SDK 需要的 ModelMessage
 * 主要用于移除不必要的字段，确保类型兼容
 */
export function convertToCoreMessages(messages: AgentMessage[]): ModelMessage[] {
  return messages.map(msg => {
    switch (msg.role) {
      case 'system':
        return {
          role: 'system',
          content: msg.content
        };
      case 'user':
        return {
          role: 'user',
          content: msg.content as any // AI SDK types are complex, casting for now
        };
      case 'assistant':
        return {
          role: 'assistant',
          content: msg.content as any
        };
      case 'tool': {
        // AgentMessage 使用 result+isError，需转换为 AI SDK 6.0 的 output 格式
        const toolContent = (msg.content as Array<{ type: 'tool-result'; toolCallId: string; toolName: string; result?: unknown; isError?: boolean; output?: unknown }>).map(part => {
          const output = part.output ?? (part.isError
            ? { type: 'error-text' as const, value: String(part.result ?? '') }
            : typeof part.result === 'string'
              ? { type: 'text' as const, value: part.result }
              : { type: 'json' as const, value: part.result ?? null });
          return {
            type: 'tool-result' as const,
            toolCallId: part.toolCallId,
            toolName: part.toolName,
            output
          };
        });
        return { role: 'tool', content: toolContent };
      }
      default:
        throw new Error(`Unknown message role: ${(msg as any).role}`);
    }
  }) as ModelMessage[];
}
