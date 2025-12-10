export * from './z-button'

// 导出所有组件用于批量注册
import { ZButton } from './z-button'
import { ZTabs, ZCollapse, ZRow, ZContainer } from './layout'
import { ZTable } from './data'
import { ZSelect } from './z-select'

export const materialsComponents = {
  ZButton,
  ZTabs,
  ZCollapse,
  ZRow,
  ZTable,
  ZSelect,
  ZContainer,
}