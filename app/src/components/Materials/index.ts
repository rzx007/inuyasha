export * from './z-button'

// 导出所有组件用于批量注册
import { ZButton } from './z-button'
import { ZTabs, ZCollapse, ZRow, ZContainer, ZPageRoot } from './layout'
import { ZTable } from './data'
import { ZSelect } from './z-select'
import { ZDivider } from './z-divider'

export const materialsComponents = {
  ZButton,
  ZTabs,
  ZCollapse,
  ZRow,
  ZTable,
  ZSelect,
  ZContainer,
  ZPageRoot,
  ZDivider,
}