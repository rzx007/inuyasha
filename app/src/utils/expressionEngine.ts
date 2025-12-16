import { useEditorStore } from '@/stores/editor'
import { useDataSourceStore } from '@/stores/dataSource'
import type { DataBinding, ApiDataSourceConfig } from '@inuyasha/core'
import { resolveBinding as resolveBindingCore, resolveVariablesInConfig as resolveVariablesInConfigCore } from '@inuyasha/expression'
import { useFormStateStore } from '@/stores/formState'
import type { ExpressionContext } from '@inuyasha/expression'

/**
 * 创建用于计算属性的响应式表达式上下文。
 * 确保所有响应式依赖被正确追踪。
 * @returns 响应式的表达式上下文
 */
export function createExpressionContext(): ExpressionContext {
  const editorStore = useEditorStore()
  const dataSourceStore = useDataSourceStore()
  const formStateStore = useFormStateStore()

  // 在 computed 中访问响应式属性以建立依赖追踪
  return {
    editorStore: {
      pageConfig: editorStore.pageConfig
    },
    dataSourceStore: {
      dataSources: dataSourceStore.dataSources
    },
    formStateStore: {
      getComponentState: (componentId: string, key: string) => {
        // 使用 store 的方法，该方法内部会访问响应式 states
        return formStateStore.getComponentState(componentId, key)
      }
    }
  }
}

/**
 * 解析数据绑定配置对象的值。
 * @param binding - 数据绑定配置对象。
 * @param context - 可选的表达式上下文。如果未提供, 将自动创建新上下文。
 * @returns 解析后的值，如果未找到则返回 undefined。
 */
export function resolveBinding(binding: DataBinding, context?: ExpressionContext): any {
  const ctx = context || createExpressionContext()
  return resolveBindingCore(binding, ctx)
}


// 解析 API 配置中的所有变量
export function resolveVariablesInConfig(config: ApiDataSourceConfig): ApiDataSourceConfig {
    const editorStore = useEditorStore()
    const dataSourceStore = useDataSourceStore()
    const formStateStore = useFormStateStore()

    const context: ExpressionContext = {
      editorStore: {
        pageConfig: editorStore.pageConfig
      },
      dataSourceStore: {
        dataSources: dataSourceStore.dataSources
      },
      formStateStore: {
        getComponentState: (componentId: string, key: string) => {
          return formStateStore.getComponentState(componentId, key)
        }
      }
    }

    return resolveVariablesInConfigCore(config, context)
}
