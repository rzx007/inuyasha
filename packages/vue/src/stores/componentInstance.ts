import { defineStore } from 'pinia'
import { ref } from 'vue'
import { ComponentInstanceRegistry } from '@inuyasha/core/component'

const registry = new ComponentInstanceRegistry()

export const useComponentInstance = defineStore('componentInstance', () => {
  // Store component instances keyed by component ID
  const registryRef = ref(registry)

  function register(id: string, instance: any) {
    registry.register(id, instance)
  }

  function unregister(id: string) {
    registry.unregister(id)
  }

  function getComponent(id: string) {
    return registry.getComponent(id)
  }

  return {
    registry: registryRef,
    register,
    unregister,
    getComponent
  }
})
