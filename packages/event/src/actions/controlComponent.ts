import type { ControlComponentActionConfig, ActionConfig } from '@inuyasha/core'
import type { EventContext } from '../types'

export async function executeControlComponent(
  action: ActionConfig,
  context: EventContext
): Promise<void> {
  const config = action.config as ControlComponentActionConfig
  const component = context.componentRegistry.getComponent(config.componentId)
  if (component && typeof component[config.method] === 'function') {
    const args = config.args || []
    await component[config.method](...args)
  } else {
    console.warn(`Component ${config.componentId} or method ${config.method} not found`)
  }
}
