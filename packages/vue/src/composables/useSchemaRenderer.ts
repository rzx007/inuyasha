import { computed, type MaybeRefOrGetter, toValue } from 'vue'
import type { ComponentSchema } from '@inuyasha/core'
import { useResolveBinding } from './useResolveBinding'
import { useExecuteEvent } from './useExecuteEvent'
import { useEditor } from '../stores/editor'
import { useComponentMeta } from '../stores/componentMeta'
import { useFormState } from '../stores/formState'
import type { ComponentPropSchema } from '@inuyasha/core'

/**
 * Schema 渲染所需的所有解析逻辑，供 DynamicRenderer / PreviewRenderer 复用
 */
export function useSchemaRenderer(schema: MaybeRefOrGetter<ComponentSchema>) {
  const resolveBinding = useResolveBinding()
  const executeEvent = useExecuteEvent()
  const editorStore = useEditor()
  const componentStore = useComponentMeta()
  const formStateStore = useFormState()

  const componentMeta = computed(() => {
    const s = toValue(schema)
    return s ? componentStore.getComponentMeta(s.type) : undefined
  })

  const resolvedProps = computed(() => {
    const s = toValue(schema)
    if (!s) return {}
    const newProps = { ...s.props }
    for (const key in newProps) {
      const bindingKey = `${key}_binding`
      if (newProps[bindingKey]) {
        const resolvedValue = resolveBinding(newProps[bindingKey])
        if (resolvedValue !== undefined) {
          newProps[key] = resolvedValue
        }
      }
    }
    return newProps
  })

  const resolvedStyle = computed(() => {
    const s = toValue(schema)
    if (!s) return {}
    const newStyle = { ...s.style }
    const propsObj = s.props
    for (const key in propsObj) {
      if (key.startsWith('style.') && key.endsWith('_binding')) {
        const styleKey = key.substring(6, key.length - 8)
        const binding = propsObj[key]
        const resolvedValue = resolveBinding(binding)
        if (resolvedValue !== undefined) {
          newStyle[styleKey] = resolvedValue
        }
      }
    }
    return newStyle
  })

  function handleEvent(trigger: string) {
    const s = toValue(schema)
    if (!s) return
    const events = s.events || []
    const matchedEvent = events.find(e => e.trigger === trigger)
    if (matchedEvent) {
      executeEvent(matchedEvent)
    }
  }

  const modelValueBindings = computed(() => {
    const s = toValue(schema)
    const meta = componentMeta.value
    if (!s || !meta?.propsSchema) return {}
    const bindings: Record<string, unknown> = {}
    meta.propsSchema
      .filter((schema: ComponentPropSchema) => schema.vModel)
      .forEach((propSchema: ComponentPropSchema) => {
        if (propSchema.storeInProps) {
          bindings[propSchema.key] = resolvedProps.value[propSchema.key]
        } else {
          bindings[propSchema.key] = formStateStore.getComponentState(s.id, propSchema.key)
        }
      })
    return bindings
  })

  const modelValueEvents = computed(() => {
    const s = toValue(schema)
    const meta = componentMeta.value
    if (!s || !meta?.propsSchema) return {}
    const events: Record<string, (value: unknown) => void> = {}
    meta.propsSchema
      .filter((schema: ComponentPropSchema) => schema.vModel)
      .forEach((propSchema: ComponentPropSchema) => {
        events[`update:${propSchema.key}`] = (value: unknown) => {
          const current = propSchema.storeInProps
            ? s.props[propSchema.key]
            : formStateStore.getComponentState(s.id, propSchema.key)
          if (JSON.stringify(current) === JSON.stringify(value)) return

          if (propSchema.storeInProps) {
            editorStore.updateComponent(s.id, {
              props: { ...s.props, [propSchema.key]: value }
            })
          } else {
            formStateStore.setComponentState(s.id, propSchema.key, value)
          }
          handleEvent('onValueChange')
        }
      })
    return events
  })

  const dynamicEvents = computed(() => {
    const meta = componentMeta.value
    if (!meta?.triggers) return {}
    const events: Record<string, () => void> = {}
    meta.triggers.forEach(trigger => {
      if (trigger.event) {
        events[trigger.event] = () => handleEvent(trigger.value)
      }
    })
    return events
  })

  function getSlotChildren(slotName?: string) {
    const s = toValue(schema)
    if (!s?.children) return []
    if (!slotName) {
      return s.children.filter(child => !child.props?._slot)
    }
    return s.children.filter(child => child.props?._slot === slotName)
  }

  const canUseDynamicRender = computed(() => !!componentMeta.value?.componentName)

  const needsModelValue = computed(
    () => componentMeta.value?.propsSchema?.some((s: ComponentPropSchema) => s.vModel) || false
  )

  const dynamicSlotItems = computed(() => {
    const meta = componentMeta.value
    if (!meta?.useDynamicSlots || !Array.isArray(resolvedProps.value.items)) {
      return []
    }
    return resolvedProps.value.items
  })

  function initVModel() {
    const s = toValue(schema)
    const meta = componentMeta.value
    if (!s || !meta?.propsSchema) return
    meta.propsSchema
      .filter((propSchema: ComponentPropSchema) => propSchema.vModel && !propSchema.storeInProps)
      .forEach((propSchema: ComponentPropSchema) => {
        const existingValue = formStateStore.getComponentState(s.id, propSchema.key)
        const propsValue = (s.props as Record<string, unknown>)?.[propSchema.key]
        if (existingValue === undefined) {
          if (propsValue !== undefined) {
            formStateStore.setComponentState(s.id, propSchema.key, propsValue)
          } else if (propSchema.defaultValue !== undefined) {
            formStateStore.setComponentState(s.id, propSchema.key, propSchema.defaultValue)
          }
        }
      })
  }

  return {
    resolvedProps,
    resolvedStyle,
    modelValueBindings,
    modelValueEvents,
    dynamicEvents,
    getSlotChildren,
    canUseDynamicRender,
    needsModelValue,
    dynamicSlotItems,
    componentMeta,
    initVModel
  }
}
