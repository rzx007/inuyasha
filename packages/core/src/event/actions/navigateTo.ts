import type { NavigateToActionConfig, ActionConfig } from '../../types'
import type { EventContext } from '../types'

export async function executeNavigateTo(
  action: ActionConfig,
  _context: EventContext
): Promise<void> {
  const config = action.config as NavigateToActionConfig
  // Simple hash navigation for now
  if (config.path) {
    window.location.hash = config.path
  }
}
