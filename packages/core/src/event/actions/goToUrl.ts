import type { GoToUrlActionConfig, ActionConfig } from '../../types'
import type { EventContext } from '../types'

export async function executeGoToUrl(action: ActionConfig, _context: EventContext): Promise<void> {
  const config = action.config as GoToUrlActionConfig
  if (config.newTab) {
    window.open(config.url, '_blank')
  } else {
    window.location.href = config.url
  }
}
