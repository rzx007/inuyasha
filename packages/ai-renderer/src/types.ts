/**
 * AI Renderer 类型定义
 * 框架无关，纯 TypeScript 类型
 */

/** 组件 Catalog 中单个组件的描述 */
export interface AICatalogItem {
  /** 组件类型标识，如 'button', 'input' */
  type: string
  /** 组件的中文/英文描述 */
  description: string
  /** 组件可用的 props 描述 */
  props: Record<
    string,
    {
      type: string
      description?: string
      options?: string[]
      defaultValue?: unknown
    }
  >
  /** 是否可以包含子组件 */
  canNest?: boolean
  /** 可用的插槽 */
  slots?: Array<{ name: string; label: string }>
}

/** AI 生成上下文 */
export interface AIContext {
  /** 可用组件的 Catalog */
  catalog: Record<string, AICatalogItem>
  /** 可选：当前选中的组件 JSON，用于修改模式 */
  selection?: unknown
}

/** AI 生成选项 */
export interface GenerationOptions {
  /** 模型名称，默认 deepseek-chat */
  model?: string
  /** 温度参数，控制随机性 */
  temperature?: number
  /** 最大 Token 数 */
  maxTokens?: number
}

/** AI 客户端配置 */
export interface AIClientConfig {
  /** API Key */
  apiKey: string
  /** API Base URL，默认 https://api.deepseek.com */
  baseURL?: string
  /** 默认模型 */
  defaultModel?: string
}

/** AI 生成的简化组件节点 (AI 输出格式) */
export interface AIComponentNode {
  /** 组件类型，必须是 Catalog 中存在的 type */
  type: string
  /** 组件 props，可包含 _slot 字段指定所属插槽 */
  props?: Record<string, unknown> & {
    /** 指定该组件所属的父容器插槽名称 */
    _slot?: string
  }
  /** 组件样式 */
  style?: Record<string, unknown>
  /** 子组件 */
  children?: AIComponentNode[]
}

/** 流式生成回调 */
export interface StreamCallbacks {
  /** 收到部分 JSON 时触发 */
  onChunk?: (partialData: unknown) => void
  /** 生成完成时触发 */
  onComplete?: (result: AIComponentNode) => void
  /** 发生错误时触发 */
  onError?: (error: Error) => void
}

/** AI 生成结果 */
export interface GenerationResult {
  /** 生成的组件树 */
  root: AIComponentNode
  /** 使用的 Token 数 */
  usage?: {
    promptTokens: number
    completionTokens: number
    totalTokens: number
  }
}
