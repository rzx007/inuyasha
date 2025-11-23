import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { ComponentMeta, ComponentType } from '@/types/component'

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
  
  return {
    componentLibrary,
    registerComponent,
    registerComponents,
    getComponentMeta,
    getComponentsByCategory,
    getAllComponents,
  }
})

