import type { CallDataSourceActionConfig, ActionConfig } from '../../types'
import type { EventContext } from '../types'
import type { DataSourceStore } from '../../state'

export async function executeCallDataSource(
  action: ActionConfig,
  context: EventContext & { dataSourceStore: DataSourceStore }
): Promise<void> {
  const config = action.config as CallDataSourceActionConfig
  await context.dataSourceStore.fetchDataSource(config.dataSourceId, context)
}
