import type { ComponentSchema } from '../types'
import type { ExpressionContext } from '../expression'

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
