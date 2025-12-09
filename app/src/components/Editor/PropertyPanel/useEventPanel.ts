import { computed, ref } from 'vue'
import { nanoid } from 'nanoid'
import { useEditorStore } from '@/stores/editor'
import { useComponentStore } from '@/stores/component'
import type {
  ActionConfig,
  ActionType,
  EventBinding,
  ControlComponentActionConfig,
} from '@/types/event'

export function useEventPanel() {
  const editorStore = useEditorStore()
  const componentStore = useComponentStore()
  const isEventDialogVisible = ref(false)
  const currentEvent = ref<Partial<EventBinding>>({})

  const selectedComponent = computed(() => editorStore.selectedComponent)

  function findComponentById(id: string) {
    const root = editorStore.getPageRoot()
    const stack = [root]
    while (stack.length) {
      const node = stack.pop()
      if (!node) continue
      if (node.id === id) return node
      if (node.children) stack.push(...node.children)
    }
    return null
  }

  function getMethodOptionsByComponentId(componentId?: string) {
    if (!componentId) return []
    const comp = findComponentById(componentId)
    if (!comp) return []
    const meta = componentStore.getComponentMeta(comp.type)
    return (
      meta?.exposedMethods ||
      meta?.methods?.map(m => ({ name: m.name, label: m.label })) ||
      []
    )
  }

  const actionTypes: { label: string; value: ActionType }[] = [
    { label: '显示消息 (Show Message)', value: 'showMessage' },
    { label: '运行脚本 (Run Script)', value: 'runScript' },
    { label: '控制组件 (Control Component)', value: 'controlComponent' },
    { label: '调用数据源 (Call DataSource)', value: 'callDataSource' },
    { label: '更新属性 (Update Property)', value: 'updateProperty' },
    { label: '跳转链接 (Go To URL)', value: 'goToUrl' },
    { label: '路由跳转 (Navigate To)', value: 'navigateTo' },
    { label: '复制到剪贴板 (Copy Clipboard)', value: 'copyToClipboard' },
    { label: '设置本地存储 (Set LocalStorage)', value: 'setLocalStorage' },
    { label: '下载文件 (Download)', value: 'download' },
  ]

  const triggerOptions = computed(() => {
    if (!selectedComponent.value) return []
    const meta = componentStore.getComponentMeta(selectedComponent.value.schema.type)
    return meta?.triggers || []
  })

  const componentOptions = computed(() => {
    const root = editorStore.getPageRoot()
    const options: { label: string; value: string }[] = []
    function traverse(node: any) {
      if (node.id) {
        options.push({ label: `${node.label} (${node.semanticId})`, value: node.id })
      }
      if (node.children) {
        node.children.forEach(traverse)
      }
    }
    traverse(root)
    return options
  })

  function createDefaultAction(type: ActionType = 'showMessage'): ActionConfig {
    let config: any = {}
    switch (type) {
      case 'showMessage':
        config = { message: 'Hello!', messageType: 'success' }
        break
      case 'runScript':
        config = { code: '// console.log(context)' }
        break
      case 'controlComponent':
        config = { componentId: '', method: 'focus', args: [] }
        break
      case 'goToUrl':
        config = { url: 'https://example.com', newTab: true }
        break
      case 'navigateTo':
        config = { path: '/' }
        break
      case 'copyToClipboard':
        config = { text: '' }
        break
      case 'setLocalStorage':
        config = { key: '', value: '' }
        break
      case 'download':
        config = { url: '' }
        break
      default:
        config = {}
    }
    return { type, config }
  }

  function openAddEventDialog(existingEvent?: EventBinding) {
    if (existingEvent) {
      currentEvent.value = JSON.parse(JSON.stringify(existingEvent))
      if (!currentEvent.value.actions && currentEvent.value.action) {
        currentEvent.value.actions = [currentEvent.value.action]
      } else if (!currentEvent.value.actions) {
        currentEvent.value.actions = []
      }
    } else {
      const defaultTrigger =
        triggerOptions.value.length > 0 ? triggerOptions.value[0].value : 'onClick'
      currentEvent.value = {
        id: nanoid(),
        trigger: defaultTrigger,
        actions: [createDefaultAction()],
      }
    }
    isEventDialogVisible.value = true
  }

  function addAction() {
    if (!currentEvent.value.actions) currentEvent.value.actions = []
    currentEvent.value.actions.push(createDefaultAction())
  }

  function removeAction(index: number) {
    currentEvent.value.actions?.splice(index, 1)
  }

  function handleActionTypeChange(action: ActionConfig, newType: ActionType) {
    const next = createDefaultAction(newType)
    action.type = newType
    action.config = next.config
    if (newType === 'controlComponent') {
      const config = action.config as ControlComponentActionConfig
      const options = getMethodOptionsByComponentId(config.componentId)
      if (!config.method && options.length) {
        config.method = options[0].name
      }
    }
  }

  function handleControlTargetChange(action: ActionConfig, newId: string) {
    const config = action.config as ControlComponentActionConfig
    config.componentId = newId
    const options = getMethodOptionsByComponentId(newId)
    config.method = options[0]?.name || ''
  }

  function handleSaveEvent() {
    if (!selectedComponent.value || !currentEvent.value.id) return
    const events = [...(selectedComponent.value.schema.events || [])]
    const existingIndex = events.findIndex(e => e.id === currentEvent.value.id)

    const eventToSave: EventBinding = {
      id: currentEvent.value.id,
      trigger: currentEvent.value.trigger!,
      actions: currentEvent.value.actions || [],
    }
    if ((eventToSave as any).action) delete (eventToSave as any).action
    if (existingIndex > -1) {
      events[existingIndex] = eventToSave
    } else {
      events.push(eventToSave)
    }
    editorStore.updateComponent(selectedComponent.value.id, { events })
    isEventDialogVisible.value = false
  }

  function deleteEvent(id: string) {
    if (!selectedComponent.value) return
    const events = selectedComponent.value.schema.events?.filter(e => e.id !== id) || []
    editorStore.updateComponent(selectedComponent.value.id, { events })
  }

  return {
    isEventDialogVisible,
    currentEvent,
    selectedComponent,
    actionTypes,
    triggerOptions,
    componentOptions,
    getMethodOptionsByComponentId,
    openAddEventDialog,
    addAction,
    removeAction,
    handleActionTypeChange,
    handleControlTargetChange,
    handleSaveEvent,
    deleteEvent,
  }
}

