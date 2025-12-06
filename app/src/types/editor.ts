/**
 * 编辑器类型定义
 */

import type { ComponentId, ComponentSchema } from './component'

/**
 * 编辑器模式
 */
export enum EditorMode {
  Edit = 'edit',
  Preview = 'preview',
}

/**
 * 选中的组件信息
 */
export interface SelectedComponent {
  id: ComponentId
  schema: ComponentSchema
}

/**
 * 操作历史项
 */
export interface HistoryItem {
  type: 'add' | 'delete' | 'update' | 'move'
  componentId: ComponentId
  data: any
  timestamp: number
}

/**
 * 页面配置
 */
export interface PageConfig {
  id: string
  name: string
  title: string
  rootComponent: ComponentSchema
  createdAt: number
  updatedAt: number
}

