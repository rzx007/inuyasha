import type { ComponentMeta, ComponentType } from '@inuyasha/core'

// 分类配置：定义分类的显示顺序和标签
export const CATEGORY_CONFIG: Array<{ key: ComponentMeta['category'], label: string }> = [
  { key: 'base', label: '基础组件' },
  { key: 'layout', label: '布局组件' },
  { key: 'data', label: '数据展示' },
  { key: 'form', label: '表单组件' },
]

/**
 * 组件注册表
 */
export class ComponentRegistry {
  private componentLibrary = new Map<ComponentType, ComponentMeta>()

  /**
   * 注册组件
   */
  registerComponent(meta: ComponentMeta) {
    this.componentLibrary.set(meta.type, meta)
  }

  /**
   * 批量注册组件
   */
  registerComponents(metas: ComponentMeta[]) {
    metas.forEach(meta => this.registerComponent(meta))
  }

  /**
   * 获取组件元信息
   */
  getComponentMeta(type: ComponentType): ComponentMeta | undefined {
    return this.componentLibrary.get(type)
  }

  /**
   * 获取所有组件（按分类）
   */
  getComponentsByCategory(category: ComponentMeta['category']) {
    return Array.from(this.componentLibrary.values()).filter(
      meta => meta.category === category
    )
  }

  /**
   * 获取所有组件
   */
  getAllComponents(): ComponentMeta[] {
    return Array.from(this.componentLibrary.values())
  }

  /**
   * 获取按分类分组的组件
   */
  getCategorizedComponents(): Array<{ key: string, label: string, components: ComponentMeta[] }> {
    return CATEGORY_CONFIG.map(category => ({
      key: category.key,
      label: category.label,
      components: this.getComponentsByCategory(category.key),
    }))
  }
}
