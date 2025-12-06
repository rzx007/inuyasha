import type { ComponentMeta } from '@/types/component'
import { ComponentType } from '@/types/component'

/**
 * PageRoot 组件配置
 * 注意：此组件不添加到 allComponents 数组中，避免出现在组件库
 */
export const pageRootMeta: ComponentMeta = {
  type: ComponentType.PageRoot,
  name: '页面根元素',
  icon: 'Layout',
  category: 'layout',
  canNest: true,
  display: 'block',
  defaultProps: {},
  defaultStyle: {},
  propsSchema: [],
}

