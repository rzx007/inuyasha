import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { ComponentId } from '@/types/component'

export const useFormStateStore = defineStore('formState', () => {
  // A simple key-value store for form component states
  // Key: componentId, Value: the component's current value
  const states = ref<Record<ComponentId, any>>({})

  function setComponentState(componentId: ComponentId, value: any) {
    states.value[componentId] = value
  }

  function getComponentState(componentId: ComponentId): any {
    return states.value[componentId]
  }

  return {
    states,
    setComponentState,
    getComponentState,
  }
})
