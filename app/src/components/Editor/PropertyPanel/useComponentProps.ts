import { computed } from 'vue'
import { useEditorStore } from '@/stores/editor'
import { useDataSourceStore } from '@/stores/dataSource'
import type { DataBinding } from '@inuyasha/core'
import { resolveBinding } from '@/utils/expressionEngine'
import { findComponentById } from '@inuyasha/component'

export function useComponentProps() {
  const editorStore = useEditorStore()
  const dataSourceStore = useDataSourceStore()
  
  const selectedComponent = computed(() => editorStore.selectedComponent)

  // 通用获取属性值（支持 props 和 style）
  function getValue(key: string, isStyle = false) {
    if (!selectedComponent.value) return undefined
    const target = isStyle 
      ? selectedComponent.value.schema.style 
      : selectedComponent.value.schema.props
    return target[key]
  }

  // 通用更新属性值
  function updateValue(key: string, value: any, isStyle = false) {
    if (!selectedComponent.value) return

    const id = selectedComponent.value.id
    if (isStyle) {
      const updatedStyle = {
        ...selectedComponent.value.schema.style,
        [key]: value
      }
      editorStore.updateComponent(id, { style: updatedStyle })
    } else {
      const updatedProps = {
        ...selectedComponent.value.schema.props,
        [key]: value
      }
      editorStore.updateComponent(id, { props: updatedProps })
    }
  }

  // 检查是否有绑定
  function hasBinding(key: string, isStyle = false) {
    if (!selectedComponent.value) return false
    const props = selectedComponent.value.schema.props
    const bindingKey = isStyle ? `style.${key}_binding` : `${key}_binding`
    return !!props[bindingKey]
  }

  // 获取绑定配置
  function getBinding(key: string, isStyle = false) {
    if (!selectedComponent.value) return undefined
    const props = selectedComponent.value.schema.props
    const bindingKey = isStyle ? `style.${key}_binding` : `${key}_binding`
    return props[bindingKey]
  }

  // 获取绑定的实际值（用于 Tooltip）
  function getBindingValue(key: string, isStyle = false) {
    const binding = getBinding(key, isStyle)
    if (!binding) return undefined
    return resolveBinding(binding)
  }

  // 获取绑定的显示标签（例如 {{ input1.value }}）
  function getBindingLabel(key: string, isStyle = false) {
    const binding = getBinding(key, isStyle)
    if (!binding) return ''
    return formatBindingLabel(binding)
  }

  // 移除绑定
  function removeBinding(key: string, isStyle = false) {
    updateBinding(key, null, isStyle)
  }

  // 更新绑定
  function updateBinding(key: string, binding: DataBinding | null, isStyle = false) {
    if (!selectedComponent.value) return

    const bindingKey = isStyle ? `style.${key}_binding` : `${key}_binding`
    const updatedProps = { ...selectedComponent.value.schema.props }

    if (binding === null) {
      delete updatedProps[bindingKey]
    } else {
      updatedProps[bindingKey] = binding
    }

    editorStore.updateComponent(selectedComponent.value.id, {
      props: updatedProps
    })
  }

  // 辅助函数：格式化绑定标签
  function formatBindingLabel(binding: DataBinding): string {
    if (binding.type === 'dataSource' && binding.dataSourceId) {
      const ds = dataSourceStore.dataSources[binding.dataSourceId]
      if (ds) {
        return `{{ ${ds.name}${binding.path ? '.' + binding.path : ''} }}`
      }
      return `{{ ${binding.dataSourceId}${binding.path ? '.' + binding.path : ''} }}`
    } else if (binding.type === 'component' && binding.componentId) {
      const root = editorStore.pageConfig.rootComponent
      let comp = null
      if (root.id === binding.componentId) {
        comp = root
      } else if (root.children) {
        comp = findComponentById(binding.componentId, root.children)
      }
      
      if (comp) {
        return `{{ ${comp.semanticId}${binding.path ? '.' + binding.path : ''} }}`
      }
      return `{{ ${binding.componentId}${binding.path ? '.' + binding.path : ''} }}`
    } else if (binding.type === 'static') {
       return `{{ ${binding.value} }}`
    }
    return '{{ Unknown }}'
  }

  return {
    selectedComponent,
    getValue,
    updateValue,
    hasBinding,
    getBindingValue,
    getBindingLabel,
    removeBinding,
    updateBinding
  }
}

