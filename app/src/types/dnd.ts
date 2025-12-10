import type { ComponentMeta, ComponentSchema, ComponentId } from './component'

export const DndTypes = {
  COMPONENT: 'COMPONENT', // 新组件（从面板拖入）
  EXISTING_COMPONENT: 'EXISTING_COMPONENT' // 已存在组件（用于排序）
}

export interface DragItem {
  type: string
  id?: ComponentId // 已存在组件的 ID
  index?: number // 当前索引
  meta?: ComponentMeta // 新组件的元数据
  cloneFn?: (meta: ComponentMeta) => ComponentSchema // 克隆函数
  parentId?: ComponentId // 父容器 ID (用于跨容器拖拽)
  display?: string // 组件显示类型 (block/inline-block)
}
