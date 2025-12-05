import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { ComponentMeta, ComponentType } from '@/types/component'

// 分类配置：定义分类的显示顺序和标签
const CATEGORY_CONFIG: Array<{ key: ComponentMeta['category'], label: string }> = [
  { key: 'base', label: '基础组件' },
  { key: 'layout', label: '布局组件' },
  { key: 'data', label: '数据展示' },
  { key: 'form', label: '表单组件' },
]

export const useComponentStore = defineStore('component', () => {
  // 组件库（已注册的组件）
  const componentLibrary = ref<Map<ComponentType, ComponentMeta>>(new Map())
  
  // 注册组件
  function registerComponent(meta: ComponentMeta) {
    componentLibrary.value.set(meta.type, meta)
  }
  
  // 批量注册组件
  function registerComponents(metas: ComponentMeta[]) {
    metas.forEach(meta => registerComponent(meta))
  }
  
  // 获取组件元信息
  function getComponentMeta(type: ComponentType): ComponentMeta | undefined {
    return componentLibrary.value.get(type)
  }
  
  // 获取所有组件（按分类）
  function getComponentsByCategory(category: ComponentMeta['category']) {
    return Array.from(componentLibrary.value.values()).filter(
      meta => meta.category === category
    )
  }
  
  // 获取所有组件
  function getAllComponents(): ComponentMeta[] {
    return Array.from(componentLibrary.value.values())
  }
  
  // 获取按分类分组的组件
  function getCategorizedComponents(): Array<{ key: string, label: string, components: ComponentMeta[] }> {
    return CATEGORY_CONFIG.map(category => ({
      key: category.key,
      label: category.label,
      components: getComponentsByCategory(category.key),
    }))
  }
  
  return {
    componentLibrary,
    registerComponent,
    registerComponents,
    getComponentMeta,
    getComponentsByCategory,
    getAllComponents,
    getCategorizedComponents,
  }
})

