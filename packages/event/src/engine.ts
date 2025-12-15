import type { EventBinding, ActionConfig } from '@inuyasha/core'
import type { EventContext } from './types'
import type { DataSourceStore } from '@inuyasha/state'
import { executeAction } from './actions'

/**
 * Executes the action defined in an event binding.
 * @param event - The event binding configuration.
 * @param context - The event context containing stores and utilities.
 */
export async function executeEvent(
  event: EventBinding,
  context: EventContext & { dataSourceStore?: DataSourceStore }
) {
  // Support both single action (legacy) and multiple actions
  const actions: ActionConfig[] = event.actions || (event.action ? [event.action] : [])
  
  await Promise.all(actions.map(action => executeAction(action, context)))
}
