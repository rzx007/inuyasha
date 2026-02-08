import { computed } from 'vue'
import { useEditor } from '../stores/editor'
import { useDataSource } from '../stores/dataSource'
import { useFormState } from '../stores/formState'
import type { ExpressionContext } from '@inuyasha/core/expression'

/** 返回响应式的 ExpressionContext，computed 内部读取所有 store，确保依赖被正确追踪 */
export function useExpressionContext() {
  const editorStore = useEditor()
  const dataSourceStore = useDataSource()
  const formStateStore = useFormState()

  return computed<ExpressionContext>(() => ({
    editorStore: { pageConfig: editorStore.pageConfig },
    dataSourceStore: { dataSources: dataSourceStore.dataSources },
    formStateStore: {
      getComponentState: (id, key) => formStateStore.getComponentState(id, key)
    }
  }))
}
