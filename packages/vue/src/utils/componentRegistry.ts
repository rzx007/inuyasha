/**
 * 组件注册工具
 */

import type { ComponentType, ComponentSchema } from '@inuyasha/core'
import {
  createComponent as createComponentCore,
  generateSemanticId as generateSemanticIdCore,
  validateComponentSchema as validateComponentSchemaCore,
  generateComponentId as generateComponentIdCore
} from '@inuyasha/core/component'
import { useComponentMeta } from '../stores/componentMeta'

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
 * 创建组件实例
 */
export function createComponent(
  type: ComponentType,
  overrides?: Partial<ComponentSchema>,
  existingComponents: ComponentSchema[] = []
): ComponentSchema | null {
  const componentMeta = useComponentMeta()
  const meta = componentMeta.getComponentMeta(type)

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
