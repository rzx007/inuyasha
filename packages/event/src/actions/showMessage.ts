import type { ShowMessageActionConfig, ActionConfig } from '@inuyasha/core'
import type { EventContext } from '../types'

export async function executeShowMessage(
  action: ActionConfig,
  context: EventContext
): Promise<void> {
  const config = action.config as ShowMessageActionConfig
  const { toast } = context
  
  // Ensure Toast exists, otherwise alert
  if (toast && toast[config.messageType]) {
    toast[config.messageType]!(config.message)
  } else {
    console.log(`[${config.messageType}] ${config.message}`)
    if (config.messageType === 'error') console.error(config.message)
  }
}
