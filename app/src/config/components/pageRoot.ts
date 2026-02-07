import type { ComponentMeta } from '@inuyasha/core'
import { ComponentType } from '@inuyasha/core'

/**
 * PageRoot 组件配置
 * 注意：此组件不添加到 allComponents 数组中，避免出现在组件库
 */
export const pageRootMeta: ComponentMeta = {
  type: ComponentType.PageRoot,
  name: '页面根元素',
  icon: 'Layout',
  componentName: 'ZPageRoot',
  category: 'layout',
  canNest: true,
  display: 'block',
  defaultProps: {},
  defaultStyle: {},
  propsSchema: [],
}

