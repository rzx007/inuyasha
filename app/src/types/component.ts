import type { EventBinding } from './event'

/**
 * 组件类型定义
 */

/**
 * 组件唯一标识
 */
export type ComponentId = string

/**
 * 组件类型枚举
 */
export enum ComponentType {
  // 基础组件
  Container = 'container',
  Text = 'text',
  Image = 'image',
  Button = 'button',
  Divider = 'divider',
  
  // 布局组件
  Row = 'row',
  Col = 'col',
  Card = 'card',
  Collapse = 'collapse',
  Tabs = 'tabs',
  PageRoot = 'pageRoot',
  
  // 数据展示组件
  Table = 'table',
  Statistic = 'statistic',
  Chart = 'chart',
  List = 'list',
  
  // 表单组件
  Input = 'input',
  Select = 'select',
  DatePicker = 'datePicker',
  Upload = 'upload',
}

/**
 * 组件属性配置（基础）
 */
export interface ComponentProps {
  [key: string]: any
}

/**
 * 组件样式配置
 */
export interface ComponentStyle {
  width?: string | number
  height?: string | number
  padding?: string | number
  margin?: string | number
  backgroundColor?: string
  color?: string
  fontSize?: string | number
  fontWeight?: string | number
  textAlign?: 'left' | 'center' | 'right'
  border?: string
  borderRadius?: string | number
  [key: string]: any
}

/**
 * 组件数据绑定配置
 */
export interface ComponentDataSource {
  type: 'static' | 'api' | 'expression'
  value?: any
  api?: {
    url: string
    method?: 'GET' | 'POST' | 'PUT' | 'DELETE'
    params?: Record<string, any>
  }
  expression?: string
}

/**
 * 组件配置Schema
 */
export interface ComponentSchema {
  id: ComponentId
  semanticId: string // 语义化唯一标识，与 id 等效（如 button1, button2）
  type: ComponentType
  label: string
  props: ComponentProps
  style: ComponentStyle
  children?: ComponentSchema[]
  dataSource?: ComponentDataSource
  events?: EventBinding[]
}

/**
 * 组件注册信息
 */
export interface ComponentMeta {
  type: ComponentType
  name: string
  icon?: string
  category: 'base' | 'layout' | 'data' | 'form'
  defaultProps: ComponentProps
  defaultStyle: ComponentStyle
  propsSchema: ComponentPropSchema[]
  canNest?: boolean // 是否支持嵌套子组件
  display?: 'block' | 'inline-block' // 组件的显示类型
  componentName?: string //  对应的 Vue 组件名称 (e.g：'ElButton', 'ElInput')
  triggers?: ComponentTrigger[] // 组件支持的事件触发器列表
  slots?: ComponentSlot[] // 插槽定义
  methods?: ComponentMethod[] // 组件方法
  exposedMethods?: Array<{ name: string; label: string }> // 可供控制动作调用的方法
  useDynamicSlots?: boolean // 是否根据 items 属性动态生成插槽 (e.g: ElTabs, ElCollapse)
}

/**
 * 组件属性Schema（用于生成属性配置表单）
 */
export interface ComponentPropSchema {
  key: string
  label: string
  type: 'text' | 'number' | 'select' | 'color' | 'switch' | 'textarea' | 'json'
  defaultValue?: any
  options?: Array<{ label: string; value: any }>
  placeholder?: string
  description?: string
  bindable?: boolean //标记是否可以进行数据绑定
  vModel?: boolean //标记是否支持双向绑定
  storeInProps?: boolean //当 vModel 为 true 时，标记是否存储在 props 中（而非 formStateStore）。有些组件的配置项在画布阶段可能需要双向绑定， 但是它发布时只是一个静态的配置
}

/**
 * 组件支持的触发器定义
 */
export interface ComponentTrigger {
  label: string
  value: string // 事件名称，如：'onClick', 'onValueChange', 'onClose'
  event: string // 原生事件名称，如：'click', 'update:modelValue'
}

/**
 * 组件插槽定义
 */
export interface ComponentSlot {
  name: string // 插槽名称，如：'default', 'header'
  label: string 
  allowDrag?: boolean // 是否允许拖拽组件到此插槽 (用于编辑器)
}

/**
 * 组件方法定义
 */
export interface ComponentMethod {
  name: string // 方法名称，如：'validate', 'resetFields'
  label: string 
  params?: string[] // 参数名称
}

