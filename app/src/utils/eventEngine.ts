import type { EventBinding } from '@inuyasha/core'
import { useDataSourceStore } from '@/stores/dataSource'
import { useEditorStore } from '@/stores/editor'
import { useComponentRegistry } from '@/stores/componentRegistry'
import { executeEvent as executeEventCore } from '@inuyasha/event'
import type { EventContext } from '@inuyasha/event'
import { useFormStateStore } from '@/stores/formState'
import type { ExpressionContext } from '@inuyasha/expression'
import Toast from '@/components/toast'

/**
 * Executes the action defined in an event binding.
 * @param event - The event binding configuration.
 */
export async function executeEvent(event: EventBinding) {
  const editorStore = useEditorStore()
  const dataSourceStore = useDataSourceStore()
  const formStateStore = useFormStateStore()
  const componentRegistry = useComponentRegistry()

  const expressionContext: ExpressionContext = {
    editorStore: {
      pageConfig: editorStore.pageConfig
    },
    dataSourceStore: {
      dataSources: dataSourceStore.dataSources
    },
    formStateStore: {
      getComponentState: formStateStore.getComponentState.bind(formStateStore)
    }
  }

  const context: EventContext = {
    ...expressionContext,
    componentRegistry: {
      getComponent: componentRegistry.getComponent.bind(componentRegistry)
    },
    editorStore: {
      ...expressionContext.editorStore,
      updateComponent: editorStore.updateComponent.bind(editorStore)
    },
    toast: Toast
  }

  await executeEventCore(event, { ...context, dataSourceStore })
}
