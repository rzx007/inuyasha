import { streamText, tool, stepCountIs } from 'ai';
import type { ModelMessage } from 'ai';
import { convertToCoreMessages } from './transform';
import type { StreamFn, AgentTool } from './types';

/**
 * Default stream function implementation using Vercel AI SDK's streamText
 * This function handles the LLM communication but does NOT execute tools automatically.
 * It returns the tool calls to be executed by the agent loop.
 */
export const defaultStreamFn: StreamFn = async (messages, tools, options) => {
  const { model, abortSignal, onChunk, system } = options;

  if (!model) {
    throw new Error('Model is required for defaultStreamFn');
  }

  // Convert tools to AI SDK format (without execute function to prevent auto-execution)
  const sdkTools: Record<string, any> = {};
  for (const [name, toolDef] of Object.entries(tools)) {
    sdkTools[name] = tool({
      description: toolDef.description,
      inputSchema: toolDef.parameters,
      // We don't provide execute here because we want manual control in the loop
    });
  }

  const result = streamText({
    model: model as any, // dynamic model type
    system,
    messages: convertToCoreMessages(messages),
    tools: Object.keys(sdkTools).length > 0 ? sdkTools : undefined,
    abortSignal,
    stopWhen: stepCountIs(1), // We handle steps manually in the loop
  });

  // Consume the stream to trigger onChunk callbacks
  // We need to return a new stream or just let the caller handle it?
  const originalStream = result.fullStream;

  // Create a tee-like stream to monitor chunks without consuming the returned stream
  const monitoredStream = (async function* () {
    for await (const chunk of originalStream) {
      if (onChunk) {
        onChunk(chunk);
      }
      yield chunk;
    }
  })();

  const responsePromise = Promise.all([result.text, result.toolCalls, result.finishReason])
    .then(([text, toolCalls]) => {
      const content: Array<{ type: 'text'; text: string } | { type: 'tool-call'; toolCallId: string; toolName: string; input: unknown }> = [];
      if (text) content.push({ type: 'text', text });
      if (toolCalls?.length) {
        content.push(...toolCalls.map(tc => ({
          type: 'tool-call' as const,
          toolCallId: tc.toolCallId,
          toolName: tc.toolName,
          input: (tc as { input?: unknown; args?: unknown }).input ?? (tc as { args?: unknown }).args
        })));
      }
      const messages: ModelMessage[] = [{ role: 'assistant', content }];
      return { messages };
    });

  return {
    fullStream: monitoredStream,
    response: responsePromise,
    finishReason: result.finishReason.then(r => (r as string) ?? null),
    toolCalls: Promise.resolve(result.toolCalls),
  };
};
