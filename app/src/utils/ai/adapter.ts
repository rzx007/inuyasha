import type { ComponentMeta } from '@inuyasha/core'
import type { AICatalogItem } from '@inuyasha/ai-renderer'

/**
 * 将 ComponentMeta 数组转换为 AI Catalog
 * 提取 AI 生成所需的最小信息，减少 Token 消耗
 */
export function buildAICatalog(
  metas: ComponentMeta[]
): Record<string, AICatalogItem> {
  const catalog: Record<string, AICatalogItem> = {}

  for (const meta of metas) {
    // 跳过 pageRoot，AI 不应生成页面根节点
    if (meta.type === 'pageRoot') continue

    const props: AICatalogItem['props'] = {}

    for (const prop of meta.propsSchema) {
      const propDesc: AICatalogItem['props'][string] = {
        type: prop.type
      }

      if (prop.description) {
        propDesc.description = prop.description
      }

      if (prop.options?.length) {
        propDesc.options = prop.options.map((opt) => String(opt.value))
      }

      if (prop.defaultValue !== undefined) {
        propDesc.defaultValue = prop.defaultValue
      }

      props[prop.key] = propDesc
    }

    // 处理插槽信息
    // 静态插槽：直接从 meta.slots 获取
    // 动态插槽（useDynamicSlots）：如 tabs/collapse，插槽名由 items[].name 决定
    let slots = meta.slots?.map((s) => ({ name: s.name, label: s.label }))

    if (meta.useDynamicSlots) {
      slots = [{ name: '(动态)', label: '由 items 中每项的 name 字段决定，子组件的 _slot 需匹配对应 item.name' }]
    }

    catalog[meta.type] = {
      type: meta.type,
      description: meta.name,
      props,
      canNest: meta.canNest,
      slots
    }
  }

  return catalog
}
