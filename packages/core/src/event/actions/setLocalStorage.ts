import type { SetLocalStorageActionConfig, ActionConfig } from '../../types'
import type { EventContext } from '../types'

export async function executeSetLocalStorage(
  action: ActionConfig,
  _context: EventContext
): Promise<void> {
  const config = action.config as SetLocalStorageActionConfig
  localStorage.setItem(config.key, JSON.stringify(config.value))
}
