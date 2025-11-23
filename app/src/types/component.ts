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
  bindable?: boolean // New: Mark if this property can be data-bound
}

