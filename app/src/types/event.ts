/**
 * Event Binding Configuration
 */
export interface EventBinding {
  id: string
  trigger: string
  /**
   * List of actions to execute
   */
  actions?: ActionConfig[]
  /**
   * @deprecated Use actions instead
   */
  action?: ActionConfig
}

/**
 * Action Configuration
 */
export interface ActionConfig {
  type: ActionType
  config: ActionConfigMap[ActionType]
}

export type ActionType = 
  | 'updateProperty' 
  | 'callDataSource' 
  | 'showMessage' 
  | 'runScript' 
  | 'controlComponent' 
  | 'goToUrl' 
  | 'navigateTo'
  | 'copyToClipboard'
  | 'setGlobalData'
  | 'setLocalStorage'
  | 'download'

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

export interface UpdatePropertyActionConfig {
  targetComponentId: string // Using string directly instead of ComponentId
  targetProperty: string
  newValue: any // Can be a static value or another data binding
}

export interface CallDataSourceActionConfig {
  dataSourceId: string
  params: Record<string, any> // Can be bound to other component values
}

export interface ShowMessageActionConfig {
  message: string
  messageType: 'success' | 'warning' | 'error'
}

export interface RunScriptActionConfig {
  code: string // JavaScript code to execute
}

export interface ControlComponentActionConfig {
  componentId: string
  method: string
  args?: any[]
}

export interface GoToUrlActionConfig {
  url: string
  newTab?: boolean
}

export interface NavigateToActionConfig {
  path?: string
  name?: string
  params?: Record<string, any>
  query?: Record<string, any>
}

export interface CopyToClipboardActionConfig {
  text: string
}

export interface SetGlobalDataActionConfig {
  key: string
  value: any
}

export interface SetLocalStorageActionConfig {
  key: string
  value: any
}

export interface DownloadActionConfig {
  url: string
  filename?: string
}
