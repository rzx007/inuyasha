import { resolveVariablesInConfig as resolveVariablesInConfigCore } from '@inuyasha/expression'
import type { ApiDataSourceConfig } from '@inuyasha/core'
import { useExpressionContext } from './useExpressionContext'

/** 返回用于解析 API 配置中变量的函数 */
export function useResolveVariablesInConfig() {
  const context = useExpressionContext()
  return (config: ApiDataSourceConfig) =>
    resolveVariablesInConfigCore(config, context.value)
}
