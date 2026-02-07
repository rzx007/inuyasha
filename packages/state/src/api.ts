import type { ApiDataSourceConfig, DataSourceId } from '@inuyasha/core'
import type { ExpressionContext } from '@inuyasha/expression'
import { resolveVariablesInConfig } from '@inuyasha/expression'

/**
 * Fetches data from an API data source
 */
export async function fetchDataSource(
  id: DataSourceId,
  dataSources: Record<DataSourceId, any>,
  context: ExpressionContext
): Promise<void> {
  const ds = dataSources[id]
  if (!ds || ds.type !== 'api') return

  const originalConfig = ds.config as ApiDataSourceConfig
  // 解析变量
  const config = resolveVariablesInConfig(originalConfig, context)

  try {
    // Basic fetch implementation.
    // Convert array headers to object
    const headersObject = (config.headers || []).reduce((acc: Record<string, string>, curr) => {
      if (curr.key) acc[curr.key] = curr.value
      return acc
    }, {} as Record<string, string>)

    let url = config.url
    if (config.params && config.params.length > 0) {
      const queryString = config.params
        .filter(p => p.key)
        .map(p => `${encodeURIComponent(p.key)}=${encodeURIComponent(p.value)}`)
        .join('&')
      if (queryString) {
        url += (url.includes('?') ? '&' : '?') + queryString
      }
    }

    const response = await fetch(url, {
      method: config.method,
      headers: headersObject,
      body: ['GET', 'HEAD'].includes(config.method) ? undefined : config.body,
    })
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    const data = await response.json()
    
    // Update the data source (this should be handled by the store)
    ds.data = data
    ds.lastFetched = Date.now()
  } catch (error) {
    console.error(`Failed to fetch data source ${id}:`, error)
    ds.data = { error: 'Failed to fetch' }
    ds.lastFetched = Date.now()
  }
}
