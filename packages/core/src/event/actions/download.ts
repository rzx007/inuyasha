import type { DownloadActionConfig, ActionConfig } from '../../types'
import type { EventContext } from '../types'

export async function executeDownload(action: ActionConfig, _context: EventContext): Promise<void> {
  const config = action.config as DownloadActionConfig
  const link = document.createElement('a')
  link.href = config.url
  if (config.filename) link.download = config.filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}
