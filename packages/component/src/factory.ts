import { nanoid } from 'nanoid'
import type { ComponentType, ComponentSchema, ComponentMeta } from '@inuyasha/core'

/**
 * 递归收集所有组件（包括嵌套的 children）
 */
function collectAllComponents(components: ComponentSchema[]): ComponentSchema[] {
  const result: ComponentSchema[] = []
  
  function traverse(comps: ComponentSchema[]) {
    for (const comp of comps) {
      result.push(comp)
      if (comp.children && comp.children.length > 0) {
        traverse(comp.children)
      }
    }
  }
  
  traverse(components)
  return result
}

/**
 * 生成语义化唯一标识
 * @param type 组件类型
 * @param existingComponents 现有组件列表
 * @returns 语义化标识，如 button1, button2 等
 */
export function generateSemanticId(
  type: ComponentType,
  existingComponents: ComponentSchema[]
): string {
  // 收集所有组件（包括嵌套的）
  const allComponents = collectAllComponents(existingComponents)
  
  // 统计同类型组件的数量（只统计已有 semanticId 的组件）
  const sameTypeCount = allComponents.filter(
    comp => comp.type === type && comp.semanticId
  ).length
  
  // 生成语义化标识：{type}{number}
  // 例如：button1, button2, input1 等
  const typeName = type
  const number = sameTypeCount + 1
  
  return `${typeName}${number}`
}

/**
 * 为组件树补充缺失的 semanticId（用于兼容旧数据）
 * @param components 组件列表
 */
export function migrateComponentsSemanticId(components: ComponentSchema[]): void {
  function migrateComponent(comp: ComponentSchema, existingComponents: ComponentSchema[]) {
    // 如果缺少 semanticId，生成一个
    if (!comp.semanticId) {
      comp.semanticId = generateSemanticId(comp.type, existingComponents)
    }
    
    // 递归处理子组件
    if (comp.children && comp.children.length > 0) {
      comp.children.forEach(child => {
        migrateComponent(child, existingComponents)
      })
    }
  }
  
  // 先收集所有现有组件（包括已有 semanticId 的）
  const allExisting = collectAllComponents(components)
  
  // 为每个组件补充 semanticId
  components.forEach(comp => {
    migrateComponent(comp, allExisting)
  })
}

/**
 * 创建组件实例
 * @param meta 组件元信息
 * @param overrides 覆盖默认值
 * @param existingComponents 现有组件列表（用于生成语义化标识）
 */
export function createComponent(
  meta: ComponentMeta,
  overrides?: Partial<ComponentSchema>,
  existingComponents: ComponentSchema[] = []
): ComponentSchema {
  // 生成语义化标识
  const semanticId = generateSemanticId(meta.type, existingComponents)
  
  // 从propsSchema中提取defaultValue
  const schemaDefaults = (meta.propsSchema || []).reduce((acc, prop) => {
    if (prop.defaultValue !== undefined) {
      acc[prop.key] = prop.defaultValue
    }
    return acc
  }, {} as Record<string, any>)

  const component: ComponentSchema = {
    id: nanoid(),
    semanticId,
    type: meta.type,
    label: meta.name,
    props: { ...schemaDefaults, ...meta.defaultProps },
    style: { ...meta.defaultStyle },
    ...overrides,
  }
  
  // 如果组件支持嵌套，初始化children数组
  if (meta.canNest) {
    component.children = component.children || []
  }
  
  return component
}

/**
 * 生成组件ID
 */
export function generateComponentId(): string {
  return nanoid()
}

/**
 * 验证组件Schema
 */
export function validateComponentSchema(schema: ComponentSchema): boolean {
  return !!(
    schema.id &&
    schema.semanticId &&
    schema.type &&
    schema.label &&
    schema.props &&
    schema.style
  )
}
