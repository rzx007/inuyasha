---
name: Inuyasha AI UI 生成功能实施计划 (独立包模式)
overview: 将 AI UI 生成功能封装为独立的、框架无关的 workspace 子项目 (`packages/ai-renderer`)。该包提供基于 Vercel AI SDK 和 DeepSeek 的流式生成能力，App 端仅负责调用和渲染。
todos:
  - id: 1-init-package
    content: 初始化 `packages/ai-renderer` 包结构与配置
    status: completed
  - id: 2-prompt-engine
    content: 实现 `packages/ai-renderer/src/prompt/index.ts` (Prompt 引擎)
    status: completed
  - id: 3-stream-parser
    content: 实现 `packages/ai-renderer/src/parser/stream.ts` (流式解析)
    status: completed
  - id: 4-ai-client
    content: 实现 `packages/ai-renderer/src/client.ts` (AIClient 核心类)
    status: completed
  - id: 5-app-adapter
    content: 在 App 中引入 `@inuyasha/ai-renderer` 并实现 Catalog 适配器
    status: completed
  - id: 6-app-ui
    content: 开发 App 端 AI 面板并集成调用
    status: completed
isProject: false
---

# Inuyasha AI UI 生成功能实施计划 (独立包模式)

本计划将 AI 生成核心逻辑解耦为独立的子项目 `packages/ai-renderer`，确保其框架无关性，便于未来复用或独立测试。

## 1. 架构设计

### 1.1 模块划分

- `**packages/ai-renderer` (新增)**:
  - 纯 TypeScript 项目，无 Vue/React 依赖。
  - 负责：Catalog 生成、Prompt 构建、LLM 通信 (Vercel AI SDK)、流式 JSON 解析。
  - 输出：提供 `AIClient` 类，暴露 `generateUI(prompt, catalog)` 等方法。
- `**app` (现有)**:
  - 负责：UI 交互 (Chat Panel)、调用 `ai-renderer`、将生成的 JSON 转换为 Vue 组件并渲染。

### 1.2 数据流向

```mermaid
graph LR
    subgraph "App (Vue)"
        UserInput[用户 Prompt]
        ComponentRegistry[组件配置]
        EditorStore[编辑器状态]
    end
    
    subgraph "packages/ai-renderer"
        AIClient[AI Client]
        PromptEngine[Prompt 引擎]
        StreamParser[流式解析器]
    end
    
    UserInput --> AIClient
    ComponentRegistry -->|提取 Meta| AIClient
    AIClient -->|构建 Prompt| PromptEngine
    PromptEngine -->|API Request| DeepSeek_API
    DeepSeek_API -->|Stream| AIClient
    AIClient -->|解析 Stream| StreamParser
    StreamParser -->|Callback (Partial JSON)| EditorStore
    EditorStore --> Canvas
```



## 2. 实施步骤

### 第一阶段：创建独立包 `packages/ai-renderer`

#### 2.1 初始化包结构

- 创建 `packages/ai-renderer` 目录。
- 配置 `package.json` (name: `@inuyasha/ai-renderer`, main: `src/index.ts`)。
- 安装依赖: `ai`, `@ai-sdk/openai`, `zod`。

#### 2.2 实现核心类 `AIClient`

- **文件**: `packages/ai-renderer/src/client.ts`
- **功能**:
  - 构造函数接收 API Key 和 Base URL。
  - `generateUI(prompt: string, context: AIContext)`: 核心方法。
  - `streamUI(prompt: string, context: AIContext, onChunk: (data: any) => void)`: 流式方法。

#### 2.3 实现 Prompt 引擎

- **文件**: `packages/ai-renderer/src/prompt/index.ts`
- **功能**:
  - 接收 `ComponentMeta` 数组（或简化版 Catalog）。
  - 构建 System Prompt，注入 JSON Schema 约束。
  - **关键点**: 保持 Prompt 模板与具体业务解耦，通过参数传入组件列表。

#### 2.4 实现流式解析工具

- **文件**: `packages/ai-renderer/src/parser/stream.ts`
- **功能**:
  - 封装 `json-stream-es` 或自定义解析逻辑。
  - 处理不完整的 JSON 字符串，尝试修复并返回合法的局部对象。

### 第二阶段：App 端集成

#### 2.5 引入依赖

- 在 `app/package.json` 中添加 `"@inuyasha/ai-renderer": "workspace:*"`。

#### 2.6 实现 Catalog 适配器

- **文件**: `app/src/utils/ai/adapter.ts`
- **功能**: 将 App 中的 `ComponentMeta` (Vue 相关) 转换为 `ai-renderer` 需要的纯 JSON 描述格式。

#### 2.7 开发 AI 面板

- **文件**: `app/src/components/Editor/Sidebar/AIPanel.vue`
- **逻辑**:
  - 实例化 `AIClient`。
  - 调用 `streamUI`。
  - 在回调中更新 `EditorStore` 的预览状态。
  - **后处理**: 接收到 JSON 后，在 App 端补充 `id` (UUID) 和 `semanticId`，因为这些是编辑器特定的逻辑。

## 3. 接口定义 (Draft)

```typescript
// packages/ai-renderer/src/types.ts

export interface AICatalogItem {
  type: string;
  description: string;
  props: Record<string, { type: string; description?: string; options?: string[] }>;
}

export interface AIContext {
  catalog: Record<string, AICatalogItem>;
  // 可选：当前选中的组件 JSON，用于修改模式
  selection?: any; 
}

export interface GenerationOptions {
  model?: string; // default: deepseek-chat
  temperature?: number;
}
```

## 4. 验证计划

1. **单元测试 (`packages/ai-renderer`)**:
  - 测试 `PromptEngine` 是否能正确生成 Prompt 字符串。
  - 测试 `StreamParser` 能否处理断断续续的 JSON 字符串。
2. **集成测试 (`app`)**:
  - 在 App 中调用 `AIClient`，观察控制台是否打印出流式 JSON。
  - 验证生成的 JSON 结构是否符合 `ComponentSchema`。

