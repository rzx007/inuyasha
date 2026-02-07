import { resolveBinding as resolveBindingCore } from '@inuyasha/core/expression'
import type { DataBinding } from '@inuyasha/core'
import { useExpressionContext } from './useExpressionContext'

/** 返回用于解析绑定的函数，内部使用 useExpressionContext，在 computed 中调用时自动建立响应式依赖 */
export function useResolveBinding() {
  const context = useExpressionContext()
  return (binding: DataBinding) => resolveBindingCore(binding, context.value)
}
