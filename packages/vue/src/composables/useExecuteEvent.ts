import type { EventBinding } from '@inuyasha/core'
import { executeEvent as executeEventCore } from '@inuyasha/core/event'
import { useEditor } from '../stores/editor'
import { useDataSource } from '../stores/dataSource'
import { useFormState } from '../stores/formState'
import { useComponentInstance } from '../stores/componentInstance'
import { getInuyashaVueOptions } from '../config'

export function useExecuteEvent() {
  const editorStore = useEditor()
  const dataSourceStore = useDataSource()
  const formStateStore = useFormState()
  const componentRegistry = useComponentInstance()
  const { toast } = getInuyashaVueOptions()

  return async (event: EventBinding) => {
    const context = {
      editorStore: {
        pageConfig: editorStore.pageConfig,
        updateComponent: editorStore.updateComponent.bind(editorStore)
      },
      dataSourceStore: { dataSources: dataSourceStore.dataSources },
      formStateStore: { getComponentState: formStateStore.getComponentState.bind(formStateStore) },
      componentRegistry: { getComponent: componentRegistry.getComponent.bind(componentRegistry) },
      toast
    }
    await executeEventCore(event, { ...context, dataSourceStore })
  }
}
