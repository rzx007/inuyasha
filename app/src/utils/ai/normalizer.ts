import { nanoid } from 'nanoid'
import type { ComponentSchema, ComponentMeta, ComponentType } from '@inuyasha/core'
import type { AIComponentNode } from '@inuyasha/ai-renderer'

export interface NormalizeOptions {
  /** 流式模式：使用路径稳定 ID 而非 nanoid，避免频繁更新时闪屏 */
  forStreaming?: boolean
}

/**
 * 将 AI 生成的简化 JSON 转换为编辑器可用的 ComponentSchema
 * 负责补充 id、semanticId、默认值等编辑器特定字段
 */
export function normalizeAIOutput(
  node: AIComponentNode,
  metaMap: Map<string, ComponentMeta>,
  existingComponents: ComponentSchema[] = [],
  options?: NormalizeOptions
): ComponentSchema {
  const counters = new Map<string, number>()
  countExistingTypes(existingComponents, counters)

  return normalizeNode(node, metaMap, counters, '', options?.forStreaming ?? false)
}

/**
 * 将流式生成的 schema 中的临时 ID 替换为正式 nanoid
 */
export function replaceStreamingIds(schema: ComponentSchema): ComponentSchema {
  const isStreamingId = schema.id.startsWith('streaming-')

  const result: ComponentSchema = {
    ...schema,
    id: isStreamingId ? nanoid() : schema.id
  }

  if (schema.children?.length) {
    result.children = schema.children.map(replaceStreamingIds)
  }

  return result
}

/**
 * 递归统计现有组件树中各类型的数量
 */
function countExistingTypes(
  components: ComponentSchema[],
  counters: Map<string, number>
): void {
  for (const comp of components) {
    const count = counters.get(comp.type) ?? 0
    counters.set(comp.type, count + 1)
    if (comp.children?.length) {
      countExistingTypes(comp.children, counters)
    }
  }
}

/**
 * 递归转换单个节点
 * @param path 节点在树中的路径，如 "0" 或 "0-1"，用于流式模式下的稳定 ID
 */
function normalizeNode(
  node: AIComponentNode,
  metaMap: Map<string, ComponentMeta>,
  counters: Map<string, number>,
  path: string,
  forStreaming: boolean
): ComponentSchema {
  const type = node.type as ComponentType
  const meta = metaMap.get(type)

  // 生成 semanticId
  const count = (counters.get(type) ?? 0) + 1
  counters.set(type, count)
  const semanticId = `${type}${count}`

  // 流式模式：使用路径稳定 ID，避免每次更新都换 ID 导致 Vue 整树重挂载
  const id = forStreaming ? `streaming-${path || 'root'}` : nanoid()

  // 合并默认 props
  const schemaDefaults = (meta?.propsSchema ?? []).reduce(
    (acc, prop) => {
      if (prop.defaultValue !== undefined) {
        acc[prop.key] = prop.defaultValue
      }
      return acc
    },
    {} as Record<string, unknown>
  )

  // AI 的 props 最后展开，确保 _slot 等 AI 指定的属性不被默认值覆盖
  const aiProps = node.props ?? {}
  const mergedProps = {
    ...schemaDefaults,
    ...(meta?.defaultProps ?? {}),
    ...aiProps
  }

  // 合并默认样式
  const mergedStyle = {
    ...(meta?.defaultStyle ?? {}),
    ...(node.style ?? {})
  }

  const schema: ComponentSchema = {
    id,
    semanticId,
    type,
    label: meta?.name ?? type,
    props: mergedProps,
    style: mergedStyle
  }

  // 递归处理子组件
  if (node.children?.length) {
    const hasSlots = !!(meta?.slots?.length || meta?.useDynamicSlots)

    schema.children = node.children.map((child, index) => {
      const childPath = path ? `${path}-${index}` : String(index)
      if (hasSlots && !child.props?._slot) {
        const patched = {
          ...child,
          props: { ...(child.props ?? {}), _slot: 'default' }
        }
        return normalizeNode(patched, metaMap, counters, childPath, forStreaming)
      }
      return normalizeNode(child, metaMap, counters, childPath, forStreaming)
    })
  } else if (meta?.canNest) {
    // 如果组件支持嵌套但 AI 没有生成子组件，初始化空数组
    schema.children = []
  }

  return schema
}

/**
 * 从 ComponentMeta 数组构建 type -> meta 的映射
 */
export function buildMetaMap(
  metas: ComponentMeta[]
): Map<string, ComponentMeta> {
  const map = new Map<string, ComponentMeta>()
  for (const meta of metas) {
    map.set(meta.type, meta)
  }
  return map
}
