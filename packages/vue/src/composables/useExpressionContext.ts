import { computed } from 'vue'
import { useEditorStore } from '../stores/editor'
import { useDataSourceStore } from '../stores/dataSource'
import { useFormStateStore } from '../stores/formState'
import type { ExpressionContext } from '@inuyasha/expression'

/** 返回响应式的 ExpressionContext，computed 内部读取所有 store，确保依赖被正确追踪 */
export function useExpressionContext() {
  const editorStore = useEditorStore()
  const dataSourceStore = useDataSourceStore()
  const formStateStore = useFormStateStore()

  return computed<ExpressionContext>(() => ({
    editorStore: { pageConfig: editorStore.pageConfig },
    dataSourceStore: { dataSources: dataSourceStore.dataSources },
    formStateStore: {
      getComponentState: (id, key) => formStateStore.getComponentState(id, key)
    }
  }))
}
