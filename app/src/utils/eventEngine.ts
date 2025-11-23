import type { EventBinding } from '@/types/event'
import { useDataSourceStore } from '@/stores/dataSource'
import { useEditorStore } from '@/stores/editor'
import { ElMessage } from 'element-plus'

/**
 * Executes the action defined in an event binding.
 * @param event - The event binding configuration.
 */
export function executeEvent(event: EventBinding) {
  const { action } = event
  const dataSourceStore = useDataSourceStore()
  const editorStore = useEditorStore()

  switch (action.type) {
    case 'showMessage':
      ElMessage({
        message: action.config.message,
        type: action.config.messageType,
      })
      break

    case 'callDataSource':
      dataSourceStore.fetchDataSource(action.config.dataSourceId)
      break

    case 'updateProperty':
      // This is a simplified version. A real implementation would need
      // to resolve the newValue if it's also a binding.
      editorStore.updateComponent(action.config.targetComponentId, {
        props: { [action.config.targetProperty]: action.config.newValue },
      })
      break

    default:
      console.warn('Unknown action type:', action.type)
  }
}
