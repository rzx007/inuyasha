import type { z } from 'zod';
import type { LanguageModel, ModelMessage, ToolCallPart, ToolResultPart, TextPart, ImagePart } from 'ai';

/**
 * Re-export useful types from ai SDK
 */
export type { ModelMessage, ToolCallPart, ToolResultPart, TextPart, ImagePart };

/**
 * Agent 统一消息格式
 * 基本上是 ModelMessage 的超集，但为了简便，我们定义一个统一接口
 * 在 transform 阶段转换为 ModelMessage
 */
export type AgentMessage = 
  | { role: 'system'; content: string; id?: string; metadata?: Record<string, unknown> }
  | { role: 'user'; content: string | Array<TextPart | ImagePart>; id?: string; metadata?: Record<string, unknown> }
  | { role: 'assistant'; content: string | Array<TextPart | ToolCallPart>; id?: string; metadata?: Record<string, unknown> }
  | { role: 'tool'; content: Array<{ type: 'tool-result'; toolCallId: string; toolName: string; result?: unknown; isError?: boolean }>; id?: string; metadata?: Record<string, unknown> };

/**
 * Agent 工具定义
 * 兼容 AI SDK 的 tool() 定义，但在 execute 中支持 abortSignal
 */
export interface AgentTool<T = any> {
  description?: string;
  parameters: z.ZodType<T>;
  execute?: (args: T, options: { abortSignal?: AbortSignal }) => Promise<any>;
}

/**
 * Agent 事件类型
 */
export type AgentEventType = 
  | 'message'      // 收到/发送消息
  | 'tool-call'    // 工具调用开始
  | 'tool-result'  // 工具调用结束
  | 'error'        // 发生错误
  | 'finish';      // 任务结束

export interface AgentEvent {
  type: AgentEventType;
  payload: any;
}

/**
 * Stream 函数签名
 * 用于对接 Vercel AI SDK 或其他流式生成源
 */
export type StreamFn = (
  messages: AgentMessage[],
  tools: Record<string, AgentTool>,
  options: {
    model?: LanguageModel | string;
    abortSignal?: AbortSignal;
    onChunk?: (chunk: any) => void;
    system?: string;
  }
) => Promise<{
  fullStream: AsyncIterable<any>;
  response: Promise<{ messages: Array<ModelMessage> }>; // AI SDK standard response
  finishReason: PromiseLike<string | null>;
  toolCalls?: PromiseLike<Array<ToolCallPart>>;
}>;

/**
 * Agent 配置
 */
export interface AgentConfig {
  streamFn: StreamFn;
  tools?: Record<string, AgentTool>;
  systemPrompt?: string;
  model?: LanguageModel | string;
  maxSteps?: number; // 防止无限循环的最大步数
}

/**
 * Agent 循环配置
 * 提供给 loop 函数的运行时配置
 */
export interface AgentLoopConfig {
  getSteeringMessages: () => AgentMessage[];
  getFollowUpMessages: () => AgentMessage[];
  abortSignal?: AbortSignal;
  onEvent?: (event: AgentEvent) => void;
}
