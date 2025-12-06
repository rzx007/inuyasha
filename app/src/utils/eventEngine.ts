import type { EventBinding } from '@/types/event'
import { useDataSourceStore } from '@/stores/dataSource'
import { useEditorStore } from '@/stores/editor'
import Toast from '@/components/toast'

/**
 * Executes the action defined in an event binding.
 * @param event - The event binding configuration.
 */
export function executeEvent(event: EventBinding) {
  const { action } = event
  const dataSourceStore = useDataSourceStore()
  const editorStore = useEditorStore()

  switch (action.type) {
    case 'showMessage': {
      const config = action.config as import('@/types/event').ShowMessageActionConfig
      Toast[config.messageType](config.message)
      break
    }

    case 'callDataSource': {
      const config = action.config as import('@/types/event').CallDataSourceActionConfig
      // 支持参数覆盖（如果需要）
      // action.config.params 可以在 fetchDataSource 中被解析和合并
      // 目前 fetchDataSource 主要依赖 config.params，如果需要动态参数覆盖，
      // fetchDataSource 需要支持第二个参数 overrides
      dataSourceStore.fetchDataSource(config.dataSourceId)
      break
    }

    case 'updateProperty': {
      const config = action.config as import('@/types/event').UpdatePropertyActionConfig
      // This is a simplified version. A real implementation would need
      // to resolve the newValue if it's also a binding.
      editorStore.updateComponent(config.targetComponentId, {
        props: { [config.targetProperty]: config.newValue },
      })
      break
    }

    default:
      console.warn('Unknown action type:', action.type)
  }
}
