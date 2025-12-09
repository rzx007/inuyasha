import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useComponentRegistry = defineStore('componentRegistry', () => {
  // Store component instances keyed by component ID
  const registry = ref<Map<string, any>>(new Map())

  function register(id: string, instance: any) {
    if (id && instance) {
      registry.value.set(id, instance)
    }
  }

  function unregister(id: string) {
    if (id) {
      registry.value.delete(id)
    }
  }

  function getComponent(id: string) {
    return registry.value.get(id)
  }

  return {
    registry,
    register,
    unregister,
    getComponent
  }
})

