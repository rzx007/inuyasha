import type { ActionConfig, ActionType } from '@inuyasha/core'
import type { EventContext } from '../types'
import type { DataSourceStore } from '@inuyasha/state'
import { executeShowMessage } from './showMessage'
import { executeCallDataSource } from './callDataSource'
import { executeUpdateProperty } from './updateProperty'
import { executeRunScript } from './runScript'
import { executeControlComponent } from './controlComponent'
import { executeGoToUrl } from './goToUrl'
import { executeNavigateTo } from './navigateTo'
import { executeCopyToClipboard } from './copyToClipboard'
import { executeSetLocalStorage } from './setLocalStorage'
import { executeDownload } from './download'

const actionHandlers: Record<ActionType, (action: ActionConfig, context: EventContext & { dataSourceStore?: DataSourceStore }) => Promise<void>> = {
  showMessage: executeShowMessage,
  callDataSource: executeCallDataSource as any,
  updateProperty: executeUpdateProperty,
  runScript: executeRunScript,
  controlComponent: executeControlComponent,
  goToUrl: executeGoToUrl,
  navigateTo: executeNavigateTo,
  copyToClipboard: executeCopyToClipboard,
  setGlobalData: async () => {
    console.warn('SetGlobalData not fully implemented (no global store defined)')
  },
  setLocalStorage: executeSetLocalStorage,
  download: executeDownload,
}

export async function executeAction(
  action: ActionConfig,
  context: EventContext & { dataSourceStore?: DataSourceStore }
): Promise<void> {
  const handler = actionHandlers[action.type]
  if (handler) {
    await handler(action, context)
  } else {
    console.warn('Unknown action type:', (action as any).type)
  }
}
