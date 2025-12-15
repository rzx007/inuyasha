import type { RunScriptActionConfig, ActionConfig } from '@inuyasha/core'
import type { EventContext } from '../types'

export async function executeRunScript(
  action: ActionConfig,
  context: EventContext
): Promise<void> {
  const config = action.config as RunScriptActionConfig
  try {
    // Safe-ish eval using Function constructor
    // We can inject context like 'editorStore', 'dataSourceStore' etc.
    const func = new Function('context', config.code)
    func({
      ...context,
      window,
      document,
      console
    })
  } catch (err) {
    console.error('Script execution failed:', err)
  }
}
