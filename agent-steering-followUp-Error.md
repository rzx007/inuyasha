
下面说明在 Agent 语境下，**Steering**、**Follow-up** 和**错误处理**分别指什么。

---

## 一、Steering（转向 / 打断）

### 含义

在 Agent 正在执行工具时，用户输入新指令，Agent 会**中断当前计划**，优先处理这条新指令。

### 典型场景

```
用户: "帮我查一下北京的天气"
Agent: 调用 get_weather("北京")...
       （正在执行中）

用户: "算了，改成上海"  ← 这是 steering
Agent: 停止当前工具链，把 "改成上海" 作为新的 user 消息
       → 重新调用 LLM
       → 按新指令执行
```

### 行为要点

| 项目 | 说明 |
|------|------|
| 触发时机 | Agent 正在执行工具（尤其是多个工具依次执行时） |
| 处理方式 | 当前工具执行完后，**不再执行剩余工具**，把 steering 消息当作新的 user 输入 |
| 目的 | 让用户能随时“改主意”，不必等整条工具链跑完 |

### pi-agent-core 的实现思路

- 每个工具执行完后，调用 `getSteeringMessages()`
- 若有 steering 消息 → 剩余 tool calls 被跳过，返回“Skipped due to queued user message”
- 把 steering 消息加入 `messages`，进入下一轮 LLM 调用

---

## 二、Follow-up（后续 / 排队）

### 含义

在 Agent 本应结束时，用户又输入了新指令，这些指令会**排队**，等当前任务完全结束后再处理。

### 典型场景

```
用户: "帮我查一下北京的天气"
Agent: 调用 get_weather("北京") → 返回结果 → 回复用户
       （此时没有 tool call，Agent 准备结束）

用户: "再查一下上海"  ← 这是 follow-up
Agent: 不打断当前回复，等本轮完全结束后
       → 把 "再查一下上海" 作为新的 user 消息
       → 再跑一轮 Agent 循环
```

### 与 Steering 的对比

| 项目 | Steering | Follow-up |
|------|----------|-----------|
| 用户输入时机 | Agent 正在执行工具 | Agent 即将结束或已结束 |
| 处理时机 | 当前工具执行完后立刻处理 | 当前整轮结束后再处理 |
| 对当前任务的影响 | 会中断剩余工具 | 不中断，等当前任务完成 |
| 典型用途 | “别做了，换一个” | “做完这个，再做那个” |

### pi-agent-core 的实现思路

- 只有在「没有 tool call 且没有 steering」时，才调用 `getFollowUpMessages()`
- 若有 follow-up → 把这些消息加入 `messages`，继续外层循环，再跑一轮

---

## 三、错误处理（Error Handling）

### 含义

在 Agent 循环中，对各类异常做统一处理，避免整个 Agent 直接崩溃，并尽量让 LLM 有机会“纠错”。

### 常见错误类型

| 类型 | 示例 | 常见处理方式 |
|------|------|----------------|
| LLM 调用失败 | 网络错误、超时、限流 | 重试、或把错误信息写入 messages 让 LLM 知道 |
| 工具执行失败 | 文件不存在、权限不足 | 把错误作为 tool result 返回给 LLM，让其决定是否重试或换方案 |
| 工具参数校验失败 | 参数不符合 schema | 把校验错误作为 tool result 返回，让 LLM 修正参数 |
| 用户中止 | 用户点击“停止” | 设置 `stopReason: "aborted"`，结束循环 |

### pi-agent-core 的做法

1. **工具执行错误**  
   - 在 `execute` 里 `throw new Error(...)`  
   - Agent 捕获后，构造 `isError: true` 的 tool result 返回给 LLM  
   - LLM 可以根据错误内容决定重试或换策略  

2. **LLM 调用错误**  
   - 流式接口会发出 `error` 事件  
   - Agent 把错误信息写入一条 assistant 消息（如 `errorMessage`）  
   - 用户可调用 `continue()` 从当前状态重试  

3. **用户中止**  
   - 通过 `AbortController` 取消请求  
   - 已生成的部分内容可保留在 messages 中，供后续 `continue` 使用  

---

## 四、三者如何配合

```
Agent 运行中
    │
    ├─ 用户输入 "停止，做 X" 
    │     → Steering：中断当前工具链，优先处理 X
    │
    ├─ 用户输入 "做完后顺便做 Y"
    │     → Follow-up：等当前任务结束，再处理 Y
    │
    └─ 工具执行失败 / LLM 报错
          → 错误处理：把错误信息反馈给 LLM 或用户，支持重试或继续
```

---

## 五、简要总结

| 概念 | 一句话 |
|------|--------|
| **Steering** | 用户在执行过程中“改主意”，Agent 中断当前计划，优先处理新指令 |
| **Follow-up** | 用户在当前任务快结束时“追加任务”，Agent 等当前任务完成后再处理 |
| **错误处理** | 把各类异常（工具失败、LLM 失败、用户中止）转化为可恢复的状态，让 Agent 能继续或重试 |