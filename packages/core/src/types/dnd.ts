/**
 * DnD 类型定义 (Zod)
 */

import { z } from 'zod'
import { ComponentMetaSchema } from './component'

export const DndTypes = {
  COMPONENT: 'COMPONENT',
  EXISTING_COMPONENT: 'EXISTING_COMPONENT',
} as const

export const DragItemSchema = z.object({
  type: z.string(),
  id: z.string().optional(),
  index: z.number().optional(),
  meta: ComponentMetaSchema.optional(),
  cloneFn: z.any().optional(), // (meta: ComponentMeta) => ComponentSchema
  parentId: z.string().optional(),
  display: z.string().optional(),
})
export type DragItem = z.infer<typeof DragItemSchema>
