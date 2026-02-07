import type { CallDataSourceActionConfig, ActionConfig } from '@inuyasha/core'
import type { EventContext } from '../types'
import type { DataSourceStore } from '@inuyasha/state'

export async function executeCallDataSource(
  action: ActionConfig,
  context: EventContext & { dataSourceStore: DataSourceStore }
): Promise<void> {
  const config = action.config as CallDataSourceActionConfig
  await context.dataSourceStore.fetchDataSource(config.dataSourceId, context)
}
