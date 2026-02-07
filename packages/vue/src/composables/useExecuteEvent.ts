import type { EventBinding } from '@inuyasha/core'
import { executeEvent as executeEventCore } from '@inuyasha/event'
import { useEditorStore } from '../stores/editor'
import { useDataSourceStore } from '../stores/dataSource'
import { useFormStateStore } from '../stores/formState'
import { useComponentRegistry } from '../stores/componentRegistry'
import { getInuyashaVueOptions } from '../config'

export function useExecuteEvent() {
  const editorStore = useEditorStore()
  const dataSourceStore = useDataSourceStore()
  const formStateStore = useFormStateStore()
  const componentRegistry = useComponentRegistry()
  const { toast } = getInuyashaVueOptions()

  return async (event: EventBinding) => {
    const context = {
      editorStore: { pageConfig: editorStore.pageConfig, updateComponent: editorStore.updateComponent.bind(editorStore) },
      dataSourceStore: { dataSources: dataSourceStore.dataSources },
      formStateStore: { getComponentState: formStateStore.getComponentState.bind(formStateStore) },
      componentRegistry: { getComponent: componentRegistry.getComponent.bind(componentRegistry) },
      toast
    }
    await executeEventCore(event, { ...context, dataSourceStore })
  }
}
