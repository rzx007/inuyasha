/**
 * Event Binding Configuration
 */
export interface EventBinding {
  id: string
  trigger: string
  action: ActionConfig
}

/**
 * Action Configuration
 */
export interface ActionConfig {
  type: 'updateProperty' | 'callDataSource' | 'showMessage'
  config: UpdatePropertyActionConfig | CallDataSourceActionConfig | ShowMessageActionConfig
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
