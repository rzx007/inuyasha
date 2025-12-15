import type { ComponentSchema } from '@inuyasha/core'
import type { ExpressionContext } from '@inuyasha/expression'

/**
 * Event context for dependency injection
 */
export interface EventContext extends ExpressionContext {
  componentRegistry: {
    getComponent(id: string): any
  }
  editorStore: ExpressionContext['editorStore'] & {
    updateComponent(id: string, updates: Partial<ComponentSchema>): void
  }
  toast?: {
    success?(message: string): void
    error?(message: string): void
    warning?(message: string): void
    info?(message: string): void
  }
}
