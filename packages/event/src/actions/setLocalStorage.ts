import type { SetLocalStorageActionConfig, ActionConfig } from '@inuyasha/core'
import type { EventContext } from '../types'

export async function executeSetLocalStorage(
  action: ActionConfig,
  context: EventContext
): Promise<void> {
  const config = action.config as SetLocalStorageActionConfig
  localStorage.setItem(config.key, JSON.stringify(config.value))
}
