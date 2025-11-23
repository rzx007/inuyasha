/**
 * 组件注册系统
 */

import type { ComponentType, ComponentSchema } from '@/types/component'
import { useComponentStore } from '@/stores/component'
import { nanoid } from 'nanoid'

/**
 * 创建组件实例
 */
export function createComponent(
  type: ComponentType,
  overrides?: Partial<ComponentSchema>
): ComponentSchema | null {
  const componentStore = useComponentStore()
  const meta = componentStore.getComponentMeta(type)
  
  if (!meta) {
    console.warn(`Component type ${type} not found`)
    return null
  }
  
  const component: ComponentSchema = {
    id: nanoid(),
    type,
    label: meta.name,
    props: { ...meta.defaultProps },
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
    schema.type &&
    schema.label &&
    schema.props &&
    schema.style
  )
}

