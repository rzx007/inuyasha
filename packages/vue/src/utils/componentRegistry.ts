/**
 * 组件注册工具
 */

import type { ComponentType, ComponentSchema } from '@inuyasha/core'
import {
  createComponent as createComponentCore,
  generateSemanticId as generateSemanticIdCore,
  migrateComponentsSemanticId as migrateComponentsSemanticIdCore,
  validateComponentSchema as validateComponentSchemaCore,
  generateComponentId as generateComponentIdCore,
} from '@inuyasha/component'
import { useComponentStore } from '../stores/component'

/**
 * 生成语义化唯一标识
 */
export function generateSemanticId(
  type: ComponentType,
  existingComponents: ComponentSchema[]
): string {
  return generateSemanticIdCore(type, existingComponents)
}

/**
 * 为组件树补充缺失的 semanticId（用于兼容旧数据）
 */
export function migrateComponentsSemanticId(components: ComponentSchema[]): void {
  migrateComponentsSemanticIdCore(components)
}

/**
 * 创建组件实例
 */
export function createComponent(
  type: ComponentType,
  overrides?: Partial<ComponentSchema>,
  existingComponents: ComponentSchema[] = []
): ComponentSchema | null {
  const componentStore = useComponentStore()
  const meta = componentStore.getComponentMeta(type)

  if (!meta) {
    console.warn(`Component type ${type} not found`)
    return null
  }

  return createComponentCore(meta, overrides, existingComponents)
}

/**
 * 生成组件ID
 */
export function generateComponentId(): string {
  return generateComponentIdCore()
}

/**
 * 验证组件Schema
 */
export function validateComponentSchema(schema: ComponentSchema): boolean {
  return validateComponentSchemaCore(schema)
}
