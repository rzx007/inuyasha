import type { GoToUrlActionConfig, ActionConfig } from '@inuyasha/core'
import type { EventContext } from '../types'

export async function executeGoToUrl(
  action: ActionConfig,
  context: EventContext
): Promise<void> {
  const config = action.config as GoToUrlActionConfig
  if (config.newTab) {
    window.open(config.url, '_blank')
  } else {
    window.location.href = config.url
  }
}
