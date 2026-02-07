import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { ComponentId } from '@inuyasha/core'
import { FormStateStore } from '@inuyasha/state'

const formStateStore = new FormStateStore()

export const useFormStateStore = defineStore('formState', () => {
  const states = ref(formStateStore.states)

  function setComponentState(componentId: ComponentId, key: string, value: any) {
    formStateStore.setComponentState(componentId, key, value)
    states.value = { ...formStateStore.states }
  }

  function getComponentState(componentId: ComponentId, key: string): any {
    // 访问响应式 states 以建立依赖追踪
    return states.value[componentId]?.[key]
  }

  function getComponentStates(componentId: ComponentId): Record<string, any> | undefined {
    return formStateStore.getComponentStates(componentId)
  }

  function removeComponentState(componentId: ComponentId) {
    formStateStore.removeComponentState(componentId)
    states.value = { ...formStateStore.states }
  }

  return {
    states,
    setComponentState,
    getComponentState,
    getComponentStates,
    removeComponentState
  }
})
