/**
 * 组件类型定义 (Zod)
 */

import { z } from 'zod'
import type { EventBinding } from './event'
import { EventBindingSchema } from './event'

export type ComponentId = string

const componentTypeValues = [
  'container',
  'text',
  'image',
  'button',
  'divider',
  'flex-container',
  'row',
  'col',
  'card',
  'collapse',
  'tabs',
  'pageRoot',
  'table',
  'statistic',
  'chart',
  'list',
  'input',
  'select',
  'datePicker',
  'upload'
] as const

export const ComponentTypeSchema = z.enum(componentTypeValues)
export type ComponentType = z.infer<typeof ComponentTypeSchema>

/** @deprecated Use 'container' | 'text' | ... literal. Kept for backward compatibility. */
export const ComponentType = {
  Container: 'container' as const,
  Text: 'text' as const,
  Image: 'image' as const,
  Button: 'button' as const,
  Divider: 'divider' as const,
  FlexContainer: 'flex-container' as const,
  Row: 'row' as const,
  Col: 'col' as const,
  Card: 'card' as const,
  Collapse: 'collapse' as const,
  Tabs: 'tabs' as const,
  PageRoot: 'pageRoot' as const,
  Table: 'table' as const,
  Statistic: 'statistic' as const,
  Chart: 'chart' as const,
  List: 'list' as const,
  Input: 'input' as const,
  Select: 'select' as const,
  DatePicker: 'datePicker' as const,
  Upload: 'upload' as const
} satisfies Record<string, ComponentType>

export const ComponentPropsSchema = z.record(z.any())
export type ComponentProps = z.infer<typeof ComponentPropsSchema>

export const ComponentStyleSchema = z
  .object({
    width: z.union([z.string(), z.number()]).optional(),
    height: z.union([z.string(), z.number()]).optional(),
    padding: z.union([z.string(), z.number()]).optional(),
    margin: z.union([z.string(), z.number()]).optional(),
    backgroundColor: z.string().optional(),
    color: z.string().optional(),
    fontSize: z.union([z.string(), z.number()]).optional(),
    fontWeight: z.union([z.string(), z.number()]).optional(),
    textAlign: z.enum(['left', 'center', 'right']).optional(),
    border: z.string().optional(),
    borderRadius: z.union([z.string(), z.number()]).optional()
  })
  .catchall(z.any())
export type ComponentStyle = z.infer<typeof ComponentStyleSchema>

export const ComponentDataSourceSchema = z.object({
  type: z.enum(['static', 'api', 'expression']),
  value: z.any().optional(),
  api: z
    .object({
      url: z.string(),
      method: z.enum(['GET', 'POST', 'PUT', 'DELETE']).optional(),
      params: z.record(z.any()).optional()
    })
    .optional(),
  expression: z.string().optional()
})
export type ComponentDataSource = z.infer<typeof ComponentDataSourceSchema>

export interface ComponentSchema {
  id: string
  semanticId: string
  type: ComponentType
  label: string
  props: ComponentProps
  style: ComponentStyle
  children?: ComponentSchema[]
  dataSource?: ComponentDataSource
  events?: EventBinding[]
}

const ComponentSchemaSchema: z.ZodType<ComponentSchema> = z.lazy(() =>
  z.object({
    id: z.string(),
    semanticId: z.string(),
    type: ComponentTypeSchema,
    label: z.string(),
    props: ComponentPropsSchema,
    style: ComponentStyleSchema,
    children: z.array(ComponentSchemaSchema).optional(),
    dataSource: ComponentDataSourceSchema.optional(),
    events: z.array(EventBindingSchema).optional()
  })
)
export { ComponentSchemaSchema }

const PropSchemaOptionSchema = z.object({
  label: z.string(),
  value: z.any()
})

export const ComponentPropSchemaSchema = z.object({
  key: z.string(),
  label: z.string(),
  type: z.enum(['text', 'number', 'select', 'color', 'switch', 'textarea', 'json']),
  defaultValue: z.any().optional(),
  options: z.array(PropSchemaOptionSchema).optional(),
  placeholder: z.string().optional(),
  description: z.string().optional(),
  bindable: z.boolean().optional(),
  vModel: z.boolean().optional(),
  storeInProps: z.boolean().optional()
})
export type ComponentPropSchema = z.infer<typeof ComponentPropSchemaSchema>

export const ComponentTriggerSchema = z.object({
  label: z.string(),
  value: z.string(),
  event: z.string()
})
export type ComponentTrigger = z.infer<typeof ComponentTriggerSchema>

export const ComponentSlotSchema = z.object({
  name: z.string(),
  label: z.string(),
  allowDrag: z.boolean().optional()
})
export type ComponentSlot = z.infer<typeof ComponentSlotSchema>

export const ComponentMethodSchema = z.object({
  name: z.string(),
  label: z.string(),
  params: z.array(z.string()).optional()
})
export type ComponentMethod = z.infer<typeof ComponentMethodSchema>

export const ComponentMetaSchema = z.object({
  type: ComponentTypeSchema,
  name: z.string(),
  icon: z.string().optional(),
  category: z.enum(['base', 'layout', 'data', 'form']),
  defaultProps: ComponentPropsSchema,
  defaultStyle: ComponentStyleSchema,
  propsSchema: z.array(ComponentPropSchemaSchema),
  canNest: z.boolean().optional(),
  display: z.enum(['block', 'inline-block', 'flex']).optional(),
  componentName: z.string().optional(),
  triggers: z.array(ComponentTriggerSchema).optional(),
  slots: z.array(ComponentSlotSchema).optional(),
  methods: z.array(ComponentMethodSchema).optional(),
  exposedMethods: z.array(z.object({ name: z.string(), label: z.string() })).optional(),
  useDynamicSlots: z.boolean().optional()
})
export type ComponentMeta = z.infer<typeof ComponentMetaSchema>
