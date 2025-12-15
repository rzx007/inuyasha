/**
 * 组件注册系统
 */

import type { ComponentType, ComponentSchema } from '@inuyasha/core'
import { useComponentStore } from '@/stores/component'
import { 
  createComponent as createComponentCore, 
  generateSemanticId as generateSemanticIdCore, 
  migrateComponentsSemanticId as migrateComponentsSemanticIdCore, 
  validateComponentSchema as validateComponentSchemaCore,
  generateComponentId as generateComponentIdCore
} from '@inuyasha/component'

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
  return generateSemanticIdCore(type, existingComponents)
}

/**
 * 为组件树补充缺失的 semanticId（用于兼容旧数据）
 * @param components 组件列表
 */
export function migrateComponentsSemanticId(components: ComponentSchema[]): void {
  migrateComponentsSemanticIdCore(components)
}

/**
 * 创建组件实例
 * @param type 组件类型
 * @param overrides 覆盖默认值
 * @param existingComponents 现有组件列表（用于生成语义化标识）
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
