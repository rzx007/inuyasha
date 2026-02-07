/**
 * Data Source Type Definitions (Zod)
 */

import { z } from 'zod'

export type DataSourceId = string

export const DataSourceTypeSchema = z.enum(['api', 'static'])
export type DataSourceType = z.infer<typeof DataSourceTypeSchema>

/** @deprecated Use 'api' | 'static' literal. Kept for backward compatibility. */
export const DataSourceType = {
  API: 'api' as const,
  STATIC: 'static' as const,
} satisfies Record<string, DataSourceType>

const KeyValueSchema = z.object({
  key: z.string(),
  value: z.string(),
})

export const ApiDataSourceConfigSchema = z.object({
  url: z.string(),
  method: z.enum(['GET', 'POST', 'PUT', 'DELETE']),
  params: z.array(KeyValueSchema),
  headers: z.array(KeyValueSchema),
  body: z.string().optional(),
  autoFetch: z.boolean().optional(),
})
export type ApiDataSourceConfig = z.infer<typeof ApiDataSourceConfigSchema>

export const StaticDataSourceConfigSchema = z.object({
  data: z.any(),
})
export type StaticDataSourceConfig = z.infer<typeof StaticDataSourceConfigSchema>

export const DataSourceSchema = z.object({
  id: z.string(),
  name: z.string(),
  type: DataSourceTypeSchema,
  config: z.union([ApiDataSourceConfigSchema, StaticDataSourceConfigSchema]),
  data: z.any().optional(),
  lastFetched: z.number().optional(),
})
export type DataSource = z.infer<typeof DataSourceSchema>

export const DataBindingSchema = z.object({
  type: z.enum(['dataSource', 'component', 'static']),
  dataSourceId: z.string().optional(),
  componentId: z.string().optional(),
  path: z.string().optional(),
  value: z.any().optional(),
})
export type DataBinding = z.infer<typeof DataBindingSchema>

