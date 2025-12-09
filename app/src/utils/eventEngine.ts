import type { EventBinding, ActionConfig } from '@/types/event'
import { useDataSourceStore } from '@/stores/dataSource'
import { useEditorStore } from '@/stores/editor'
import { useComponentRegistry } from '@/stores/componentRegistry'
import Toast from '@/components/toast'

/**
 * Executes the action defined in an event binding.
 * @param event - The event binding configuration.
 */
export async function executeEvent(event: EventBinding) {
  // Support both single action (legacy) and multiple actions
  const actions: ActionConfig[] = event.actions || (event.action ? [event.action] : [])
  
  await Promise.all(actions.map(action => executeAction(action)))
}

async function executeAction(action: ActionConfig) {
  const dataSourceStore = useDataSourceStore()
  const editorStore = useEditorStore()
  const componentRegistry = useComponentRegistry()

  switch (action.type) {
    case 'showMessage': {
      const config = action.config as import('@/types/event').ShowMessageActionConfig
      // Ensure Toast exists, otherwise alert
      if (Toast && Toast[config.messageType]) {
        Toast[config.messageType](config.message)
      } else {
        console.log(`[${config.messageType}] ${config.message}`)
        if (config.messageType === 'error') console.error(config.message)
      }
      break
    }

    case 'callDataSource': {
      const config = action.config as import('@/types/event').CallDataSourceActionConfig
      await dataSourceStore.fetchDataSource(config.dataSourceId)
      break
    }

    case 'updateProperty': {
      const config = action.config as import('@/types/event').UpdatePropertyActionConfig
      editorStore.updateComponent(config.targetComponentId, {
        props: { [config.targetProperty]: config.newValue },
      })
      break
    }

    case 'runScript': {
      const config = action.config as import('@/types/event').RunScriptActionConfig
      try {
        // Safe-ish eval using Function constructor
        // We can inject context like 'editorStore', 'dataSourceStore' etc.
        const func = new Function('context', config.code)
        func({ dataSourceStore, editorStore, componentRegistry, window, document, console })
      } catch (err) {
        console.error('Script execution failed:', err)
      }
      break
    }

    case 'controlComponent': {
      const config = action.config as import('@/types/event').ControlComponentActionConfig
      const component = componentRegistry.getComponent(config.componentId)
      if (component && typeof component[config.method] === 'function') {
        const args = config.args || []
        await component[config.method](...args)
      } else {
        console.warn(`Component ${config.componentId} or method ${config.method} not found`)
      }
      break
    }

    case 'goToUrl': {
      const config = action.config as import('@/types/event').GoToUrlActionConfig
      if (config.newTab) {
        window.open(config.url, '_blank')
      } else {
        window.location.href = config.url
      }
      break
    }

    case 'navigateTo': {
      const config = action.config as import('@/types/event').NavigateToActionConfig
      // Simple hash navigation for now
      if (config.path) {
         window.location.hash = config.path
      }
      break
    }

    case 'copyToClipboard': {
      const config = action.config as import('@/types/event').CopyToClipboardActionConfig
      try {
        await navigator.clipboard.writeText(config.text)
        Toast.success('Copied to clipboard')
      } catch (err) {
        console.error('Failed to copy:', err)
        Toast.error('Failed to copy')
      }
      break
    }

    case 'setGlobalData': {
      // const config = action.config as import('@/types/event').SetGlobalDataActionConfig
      console.warn('SetGlobalData not fully implemented (no global store defined)')
      break
    }

    case 'setLocalStorage': {
      const config = action.config as import('@/types/event').SetLocalStorageActionConfig
      localStorage.setItem(config.key, JSON.stringify(config.value))
      break
    }

    case 'download': {
      const config = action.config as import('@/types/event').DownloadActionConfig
      const link = document.createElement('a')
      link.href = config.url
      if (config.filename) link.download = config.filename
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      break
    }

    default:
      console.warn('Unknown action type:', (action as any).type)
  }
}
