import type { AICatalogItem, AIContext } from '../types'

/**
 * Prompt 引擎
 * 负责将组件 Catalog 和用户输入构建为 LLM 可理解的 System Prompt
 */
export class PromptEngine {
  /**
   * 将 Catalog 转换为精简的文本描述，用于注入 System Prompt
   */
  static formatCatalog(catalog: Record<string, AICatalogItem>): string {
    const lines: string[] = []

    for (const [type, item] of Object.entries(catalog)) {
      const propsDesc = Object.entries(item.props)
        .map(([key, prop]) => {
          let desc = `${key}: ${prop.type}`
          if (prop.options?.length) {
            desc += ` (可选值: ${prop.options.join(', ')})`
          }
          if (prop.description) {
            desc += ` - ${prop.description}`
          }
          return desc
        })
        .join('; ')

      const nestInfo = item.canNest ? ' [可嵌套子组件]' : ''
      const slotsInfo =
        item.slots?.length
          ? ` [插槽: ${item.slots.map((s) => `${s.name}(${s.label})`).join(', ')}]`
          : ''
      lines.push(`- ${type}: ${item.description}${nestInfo}${slotsInfo}`)
      if (propsDesc) {
        lines.push(`  props: { ${propsDesc} }`)
      }
    }

    return lines.join('\n')
  }

  /**
   * 从 Catalog 中提取有插槽的组件，生成 _slot 使用示例
   */
  static buildSlotExamples(catalog: Record<string, AICatalogItem>): string {
    const examples: string[] = []

    for (const [type, item] of Object.entries(catalog)) {
      if (!item.slots?.length) {
        continue
      }

      // 动态插槽组件（tabs/collapse）
      const isDynamic = item.slots.some((s) => s.name === '(动态)')
      if (isDynamic) {
        examples.push(`### ${type} (${item.description}) - 动态插槽
${type} 的插槽由 props.items 中每项的 name 字段决定。
子组件的 _slot 值必须与 items 中某个 item 的 name 一致。
示例：
\`\`\`
{
  "type": "${type}",
  "props": { "items": [{ "name": "1", "title": "标签1" }, { "name": "2", "title": "标签2" }] },
  "children": [
    { "type": "text", "props": { "_slot": "1", "content": "标签1的内容" } },
    { "type": "text", "props": { "_slot": "2", "content": "标签2的内容" } }
  ]
}
\`\`\``)
      } else {
        // 静态插槽组件（card 等）
        const slotNames = item.slots.map((s) => s.name)
        const slotLabels = item.slots.map((s) => `${s.name}(${s.label})`)

        // 为 card 类型生成更准确的示例
        if (type === 'card') {
          examples.push(`### ${type} (${item.description}) - 静态插槽: ${slotLabels.join(', ')}
**注意**: card 没有 title 属性！标题必须通过 header 插槽放置一个 text 子组件来实现。
示例：
\`\`\`
{
  "type": "card",
  "props": { "shadow": "always" },
  "children": [
    { "type": "text", "props": { "_slot": "header", "content": "卡片标题" }, "style": { "fontSize": "16px", "fontWeight": "bold" } },
    { "type": "text", "props": { "_slot": "default", "content": "卡片内容" } }
  ]
}
\`\`\``)
        } else {
          const childExamples = slotNames
            .map(
              (name) =>
                `    { "type": "text", "props": { "_slot": "${name}", "content": "${name}插槽内容" } }`
            )
            .join(',\n')

          examples.push(`### ${type} (${item.description}) - 静态插槽: ${slotLabels.join(', ')}
示例：
\`\`\`
{
  "type": "${type}",
  "props": {},
  "children": [
${childExamples}
  ]
}
\`\`\``)
        }
      }
    }

    return examples.join('\n\n')
  }

  static buildSystemPrompt(context: AIContext): string {
    const catalogText = PromptEngine.formatCatalog(context.catalog)
    const slotExamples = PromptEngine.buildSlotExamples(context.catalog)

    return `你是一个专业的 UI 界面生成专家。你的任务是根据用户的自然语言描述，生成符合规范的 JSON 组件树。

## 可用组件列表

${catalogText}

## 输出规则

1. **必须**输出合法的 JSON，不要包含任何 markdown 标记或注释。
2. 根节点**必须**是一个 \`container\` 类型的组件。
3. **仅使用**上述组件列表中的 type，不要发明新的组件类型。
4. 每个节点的结构如下：
   \`\`\`
   {
     "type": "组件类型",
     "props": { ... },
     "style": { ... },
     "children": [ ... ]
   }
   \`\`\`
5. \`props\` 中只填写有意义的属性，不需要填写所有属性。
6. \`style\` 用于设置内联样式（如 width, height, padding, margin, backgroundColor 等 CSS 属性，使用驼峰命名）。
7. 对于布局，优先使用 \`row\` + \`col\` 实现栅格布局，或使用 \`flex-container\` 实现弹性布局。
8. 不要生成 \`id\` 或 \`semanticId\` 字段，这些会由系统自动补充。
9. 仅输出 JSON，不要输出任何其他文字说明。

## 插槽机制 (_slot) —— 极其重要，必须严格遵守

子组件通过 \`props._slot\` 字段决定渲染到父容器的哪个插槽。

**判断规则：看组件列表中是否有 [插槽: ...] 标注。**

| 父组件类型 | 是否需要 _slot | 说明 |
|---|---|---|
| 有 [插槽: ...] 标注的组件 | **每个子组件都必须写 _slot** | 如 card、tabs、collapse |
| 无插槽标注的容器 | **不需要 _slot** | 如 container、flex-container、row |

**静态插槽**（如 card）：_slot 值为插槽名，如 \`"header"\`、\`"default"\`。
**动态插槽**（如 tabs、collapse）：_slot 值必须与 \`props.items\` 中对应项的 \`name\` 一致。

**错误示范**（缺少 _slot，子组件不会渲染）：
\`\`\`
{ "type": "card", "children": [{ "type": "text", "props": { "content": "标题" } }] }
\`\`\`
**正确示范**：
\`\`\`
{ "type": "card", "children": [{ "type": "text", "props": { "_slot": "header", "content": "标题" } }] }
\`\`\`

${slotExamples ? `## 插槽使用示例\n\n${slotExamples}` : ''}`
  }

  /**
   * 构建修改模式的 System Prompt（当有选中组件时）
   */
  static buildModifyPrompt(context: AIContext): string {
    const basePrompt = PromptEngine.buildSystemPrompt(context)

    if (!context.selection) {
      return basePrompt
    }

    const selectionJson = JSON.stringify(context.selection, null, 2)

    return `${basePrompt}

## 修改模式

当前用户选中了以下组件结构，请基于此进行修改：

\`\`\`json
${selectionJson}
\`\`\`

请根据用户的修改指令，输出修改后的完整 JSON。保持未提及部分不变。`
  }

  /**
   * 构建完整的消息数组，供 LLM 调用
   */
  static buildMessages(
    userPrompt: string,
    context: AIContext
  ): Array<{ role: 'system' | 'user'; content: string }> {
    const systemPrompt = context.selection
      ? PromptEngine.buildModifyPrompt(context)
      : PromptEngine.buildSystemPrompt(context)

    return [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt }
    ]
  }
}
