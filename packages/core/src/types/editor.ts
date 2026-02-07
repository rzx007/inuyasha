/**
 * 编辑器类型定义 (Zod)
 */

import { z } from 'zod'
import { ComponentSchemaSchema } from './component'
import { DataSourceSchema } from './dataSource'

export const EditorModeSchema = z.enum(['edit', 'preview'])
export type EditorMode = z.infer<typeof EditorModeSchema>

/** @deprecated Use 'edit' | 'preview' literal. Kept for backward compatibility. */
export const EditorMode = {
  Edit: 'edit' as const,
  Preview: 'preview' as const,
} satisfies Record<string, EditorMode>

export const SelectedComponentSchema = z.object({
  id: z.string(),
  schema: ComponentSchemaSchema,
})
export type SelectedComponent = z.infer<typeof SelectedComponentSchema>

export const HistoryItemSchema = z.object({
  type: z.enum(['add', 'delete', 'update', 'move']),
  componentId: z.string(),
  data: z.any(),
  timestamp: z.number(),
})
export type HistoryItem = z.infer<typeof HistoryItemSchema>

export const PageConfigSchema = z.object({
  id: z.string(),
  name: z.string(),
  title: z.string(),
  rootComponent: ComponentSchemaSchema,
  dataSources: z.record(DataSourceSchema).optional(),
  createdAt: z.number(),
  updatedAt: z.number(),
})
export type PageConfig = z.infer<typeof PageConfigSchema>
