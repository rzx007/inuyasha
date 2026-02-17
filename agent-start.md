
下面按「Agent 核心逻辑」和「与 Tool Calling、MCP 的区别」来拆解。

---

## 一、Agent 的核心实现逻辑

### 1. 本质：一个「循环 + 状态」的控制器

Agent 不是新 API，而是一套**控制流程**：在「LLM 调用」和「工具执行」之间反复循环，直到满足结束条件。

```
┌─────────────────────────────────────────────────────────────┐
│                     Agent 核心循环                            │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│   用户输入 ──► 状态更新 ──► LLM 调用 ──► 解析输出              │
│                    ▲              │                          │
│                    │              ▼                          │
│                    │        有 tool call?                     │
│                    │              │                          │
│                    │        是 ──► 执行工具 ──► 结果写入状态   │
│                    │              │              │           │
│                    └──────────────┴──────────────┘          │
│                       （循环，直到无 tool call）               │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

核心就是：**状态 + 循环 + 工具执行**。

---

### 2. 状态管理

Agent 维护一个「会话状态」，每次循环都基于它来调用 LLM：

| 状态项 | 作用 |
|--------|------|
| `messages` | 对话历史（user / assistant / toolResult） |
| `systemPrompt` | 系统提示 |
| `tools` | 可用工具列表 |
| `model` | 当前模型 |
| `isStreaming` | 是否在生成中 |
| `streamMessage` | 当前流式中的部分消息 |

每次循环：

1. 用当前 `messages` 调用 LLM
2. 若有 tool call → 执行工具 → 把 tool result 追加到 `messages`
3. 用更新后的 `messages` 再调用 LLM
4. 重复直到 LLM 不再发起 tool call

---

### 3. 循环逻辑（伪代码）

```text
function agentLoop(userInput) {
  state.messages.push({ role: "user", content: userInput });

  while (true) {
    // 1. 调用 LLM
    assistantMessage = await llm.chat(state.messages, state.tools);

    // 2. 写入状态
    state.messages.push(assistantMessage);

    // 3. 检查是否结束
    if (assistantMessage.stopReason === "stop") break;
    if (assistantMessage.stopReason === "error") break;

    // 4. 若有 tool call，执行并继续循环
    if (assistantMessage 包含 toolCall) {
      for (call of toolCalls) {
        result = await executeTool(call);
        state.messages.push({ role: "toolResult", ...result });
      }
      continue;  // 回到步骤 1
    }

    break;
  }

  return state.messages;
}
```

本质就是：**「LLM 调用 → 解析输出 → 执行工具 → 更新状态 → 再调用 LLM」** 的循环。

---

### 4. 和「单次 LLM 调用」的差别

| 对比 | 单次 LLM 调用 | Agent |
|------|----------------|-------|
| 调用次数 | 1 次 | 多次（直到无 tool call） |
| 工具执行 | 由调用方自己处理 | 由 Agent 循环自动处理 |
| 状态 | 调用方维护 | Agent 内部维护 |
| 典型用法 | 简单问答、单步任务 | 多步任务、需要工具链 |

---

## 二、Agent vs Tool Calling vs MCP

### 1. Tool Calling（工具调用）

**定义**：LLM 输出「要调用哪个工具、传什么参数」的格式，由调用方执行。

```
LLM 输出: { "tool": "get_weather", "args": { "city": "北京" } }
         ↓
你的代码: result = getWeather("北京")
         ↓
你: 把 result 塞回 messages，再调一次 LLM
```

- **Tool Calling**：只负责「定义工具 + 解析 LLM 输出」
- **不包含**：循环、状态管理、自动重试、steering 等

---

### 2. Agent（智能体）

**定义**：在 Tool Calling 之上，加上「循环 + 状态 + 控制逻辑」。

```
Tool Calling（能力）
    +
循环（自动多轮）
    +
状态管理（messages 累积）
    +
控制逻辑（steering、follow-up、错误处理）
    =
Agent（智能体）
```

可以理解为：**Agent = Tool Calling + 循环 + 状态 + 控制策略**。

---

### 3. MCP（Model Context Protocol）

**定义**：一套**协议**，用来描述「有哪些工具、怎么调用、返回什么」，和具体实现无关。

```
MCP 定义的是：
- 工具如何被「发现」（list tools）
- 工具如何被「调用」（call tool）
- 输入输出的格式

MCP 不关心：
- 谁在调用（Agent 还是普通程序）
- 是否循环
- 状态怎么存
```

可以类比：

- **Tool Calling**：LLM 侧的「工具调用接口」
- **MCP**：工具侧的「服务发现与调用协议」
- **Agent**：使用 Tool Calling，可能通过 MCP 拿到工具，并负责循环和状态

---

## 三、三者关系示意

```
┌─────────────────────────────────────────────────────────────────┐
│                         MCP（协议层）                             │
│  定义：工具如何被发现、如何被调用、数据格式                         │
│  例如：list_tools, call_tool, 资源、提示词等                       │
└───────────────────────────────┬───────────────────────────────────┘
                                │ 可被
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Tool Calling（能力层）                         │
│  LLM 输出结构化 tool call → 你的代码执行 → 返回结果                 │
│  单次交互，不包含循环                                              │
└───────────────────────────────┬───────────────────────────────────┘
                                │ 被组合进
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                      Agent（编排层）                              │
│  循环 + 状态 + 工具执行 + steering/follow-up                       │
│  自动多轮，直到任务完成或用户打断                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 四、总结对照表

| 概念 | 是什么 | 核心职责 |
|------|--------|----------|
| **Tool Calling** | LLM 的「工具调用能力」 | 定义工具、解析 LLM 的 tool call、执行并返回 |
| **Agent** | 在 Tool Calling 之上的「编排层」 | 循环调用 LLM、维护状态、自动执行工具、处理打断和排队 |
| **MCP** | 工具侧的「协议标准」 | 工具发现、调用格式、资源与提示词等，与 Agent 解耦 |

一句话：**Tool Calling 是能力，Agent 是使用这种能力的循环控制器，MCP 是工具如何被暴露和调用的协议。**