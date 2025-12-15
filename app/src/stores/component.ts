import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { ComponentMeta, ComponentType } from '@inuyasha/core'
import { ComponentRegistry, CATEGORY_CONFIG } from '@inuyasha/component'

const registry = new ComponentRegistry()

export const useComponentStore = defineStore('component', () => {
  // 使用一个计数器来触发响应式更新
  const updateTrigger = ref(0)
  
  // 注册组件
  function registerComponent(meta: ComponentMeta) {
    registry.registerComponent(meta)
    updateTrigger.value++
  }
  
  // 批量注册组件
  function registerComponents(metas: ComponentMeta[]) {
    registry.registerComponents(metas)
    updateTrigger.value++
  }
  
  // 获取组件元信息
  function getComponentMeta(type: ComponentType): ComponentMeta | undefined {
    return registry.getComponentMeta(type)
  }
  
  // 获取所有组件（按分类）
  function getComponentsByCategory(category: ComponentMeta['category']) {
    // 访问 updateTrigger 以建立响应式依赖
    updateTrigger.value
    return registry.getComponentsByCategory(category)
  }
  
  // 获取所有组件
  function getAllComponents(): ComponentMeta[] {
    updateTrigger.value
    return registry.getAllComponents()
  }
  
  // 获取按分类分组的组件（使用 computed 确保响应式）
  const getCategorizedComponents = computed(() => {
    updateTrigger.value // 建立响应式依赖
    return registry.getCategorizedComponents()
  })
  
  return {
    componentLibrary: computed(() => registry),
    registerComponent,
    registerComponents,
    getComponentMeta,
    getComponentsByCategory,
    getAllComponents,
    getCategorizedComponents,
  }
})
