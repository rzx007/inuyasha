import type { NavigateToActionConfig, ActionConfig } from '@inuyasha/core'
import type { EventContext } from '../types'

export async function executeNavigateTo(
  action: ActionConfig,
  context: EventContext
): Promise<void> {
  const config = action.config as NavigateToActionConfig
  // Simple hash navigation for now
  if (config.path) {
     window.location.hash = config.path
  }
}
