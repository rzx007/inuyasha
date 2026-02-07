import type { CopyToClipboardActionConfig, ActionConfig } from '@inuyasha/core'
import type { EventContext } from '../types'

export async function executeCopyToClipboard(
  action: ActionConfig,
  context: EventContext
): Promise<void> {
  const config = action.config as CopyToClipboardActionConfig
  try {
    await navigator.clipboard.writeText(config.text)
    if (context.toast?.success) {
      context.toast.success('Copied to clipboard')
    }
  } catch (err) {
    console.error('Failed to copy:', err)
    if (context.toast?.error) {
      context.toast.error('Failed to copy')
    }
  }
}
