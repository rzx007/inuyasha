/**
 * Event Binding Configuration (Zod)
 */

import { z } from 'zod'

/** Action type literals */
export const ActionTypeSchema = z.enum([
  'updateProperty',
  'callDataSource',
  'showMessage',
  'runScript',
  'controlComponent',
  'goToUrl',
  'navigateTo',
  'copyToClipboard',
  'setGlobalData',
  'setLocalStorage',
  'download',
])
export type ActionType = z.infer<typeof ActionTypeSchema>

/** Action config schemas */
export const UpdatePropertyActionConfigSchema = z.object({
  targetComponentId: z.string(),
  targetProperty: z.string(),
  newValue: z.any(),
})
export type UpdatePropertyActionConfig = z.infer<typeof UpdatePropertyActionConfigSchema>

export const CallDataSourceActionConfigSchema = z.object({
  dataSourceId: z.string(),
  params: z.record(z.any()),
})
export type CallDataSourceActionConfig = z.infer<typeof CallDataSourceActionConfigSchema>

export const ShowMessageActionConfigSchema = z.object({
  message: z.string(),
  messageType: z.enum(['success', 'warning', 'error']),
})
export type ShowMessageActionConfig = z.infer<typeof ShowMessageActionConfigSchema>

export const RunScriptActionConfigSchema = z.object({
  code: z.string(),
})
export type RunScriptActionConfig = z.infer<typeof RunScriptActionConfigSchema>

export const ControlComponentActionConfigSchema = z.object({
  componentId: z.string(),
  method: z.string(),
  args: z.array(z.any()).optional(),
})
export type ControlComponentActionConfig = z.infer<typeof ControlComponentActionConfigSchema>

export const GoToUrlActionConfigSchema = z.object({
  url: z.string(),
  newTab: z.boolean().optional(),
})
export type GoToUrlActionConfig = z.infer<typeof GoToUrlActionConfigSchema>

export const NavigateToActionConfigSchema = z.object({
  path: z.string().optional(),
  name: z.string().optional(),
  params: z.record(z.any()).optional(),
  query: z.record(z.any()).optional(),
})
export type NavigateToActionConfig = z.infer<typeof NavigateToActionConfigSchema>

export const CopyToClipboardActionConfigSchema = z.object({
  text: z.string(),
})
export type CopyToClipboardActionConfig = z.infer<typeof CopyToClipboardActionConfigSchema>

export const SetGlobalDataActionConfigSchema = z.object({
  key: z.string(),
  value: z.any(),
})
export type SetGlobalDataActionConfig = z.infer<typeof SetGlobalDataActionConfigSchema>

export const SetLocalStorageActionConfigSchema = z.object({
  key: z.string(),
  value: z.any(),
})
export type SetLocalStorageActionConfig = z.infer<typeof SetLocalStorageActionConfigSchema>

export const DownloadActionConfigSchema = z.object({
  url: z.string(),
  filename: z.string().optional(),
})
export type DownloadActionConfig = z.infer<typeof DownloadActionConfigSchema>

/** Config map for type indexing (e.g. ActionConfigMap[ActionType]) */
export interface ActionConfigMap {
  updateProperty: UpdatePropertyActionConfig
  callDataSource: CallDataSourceActionConfig
  showMessage: ShowMessageActionConfig
  runScript: RunScriptActionConfig
  controlComponent: ControlComponentActionConfig
  goToUrl: GoToUrlActionConfig
  navigateTo: NavigateToActionConfig
  copyToClipboard: CopyToClipboardActionConfig
  setGlobalData: SetGlobalDataActionConfig
  setLocalStorage: SetLocalStorageActionConfig
  download: DownloadActionConfig
}

/** Discriminated union for ActionConfig */
export const ActionConfigSchema = z.discriminatedUnion('type', [
  z.object({ type: z.literal('updateProperty'), config: UpdatePropertyActionConfigSchema }),
  z.object({ type: z.literal('callDataSource'), config: CallDataSourceActionConfigSchema }),
  z.object({ type: z.literal('showMessage'), config: ShowMessageActionConfigSchema }),
  z.object({ type: z.literal('runScript'), config: RunScriptActionConfigSchema }),
  z.object({ type: z.literal('controlComponent'), config: ControlComponentActionConfigSchema }),
  z.object({ type: z.literal('goToUrl'), config: GoToUrlActionConfigSchema }),
  z.object({ type: z.literal('navigateTo'), config: NavigateToActionConfigSchema }),
  z.object({ type: z.literal('copyToClipboard'), config: CopyToClipboardActionConfigSchema }),
  z.object({ type: z.literal('setGlobalData'), config: SetGlobalDataActionConfigSchema }),
  z.object({ type: z.literal('setLocalStorage'), config: SetLocalStorageActionConfigSchema }),
  z.object({ type: z.literal('download'), config: DownloadActionConfigSchema }),
])
export type ActionConfig = z.infer<typeof ActionConfigSchema>

export const EventBindingSchema = z.object({
  id: z.string(),
  trigger: z.string(),
  actions: z.array(ActionConfigSchema).optional(),
  action: ActionConfigSchema.optional(),
})
export type EventBinding = z.infer<typeof EventBindingSchema>
