import type { ComponentId } from '@inuyasha/core'

/**
 * Form state store logic
 */
export class FormStateStore {
  // 嵌套结构存储组件的双向绑定值
  // 结构：{ [componentId]: { [modelValueKey]: value } }
  // 例如：{ 'comp-123': { value: 'hello', checked: true } }
  states: Record<ComponentId, Record<string, any>> = {}

  /**
   * 设置组件的某个双向绑定属性值
   * @param componentId 组件ID
   * @param key 属性名（如 'value', 'checked' 等）
   * @param value 属性值
   */
  setComponentState(componentId: ComponentId, key: string, value: any) {
    if (!this.states[componentId]) {
      this.states[componentId] = {}
    }
    this.states[componentId][key] = value
  }

  /**
   * 获取组件的某个双向绑定属性值
   * @param componentId 组件ID
   * @param key 属性名（如 'value', 'checked' 等）
   * @returns 属性值，如果不存在则返回 undefined
   */
  getComponentState(componentId: ComponentId, key: string): any {
    return this.states[componentId]?.[key]
  }

  /**
   * 获取组件的所有双向绑定属性
   * @param componentId 组件ID
   * @returns 组件的所有双向绑定属性对象
   */
  getComponentStates(componentId: ComponentId): Record<string, any> | undefined {
    return this.states[componentId]
  }

  /**
   * 移除组件时应该同步清除对应的双向绑定值
   * @param componentId 组件ID
   */
  removeComponentState(componentId: ComponentId) {
    delete this.states[componentId]
  }
}
