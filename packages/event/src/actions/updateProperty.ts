import type { UpdatePropertyActionConfig, ActionConfig } from '@inuyasha/core'
import type { EventContext } from '../types'

export async function executeUpdateProperty(
  action: ActionConfig,
  context: EventContext
): Promise<void> {
  const config = action.config as UpdatePropertyActionConfig
  context.editorStore.updateComponent(config.targetComponentId, {
    props: { [config.targetProperty]: config.newValue },
  })
}
