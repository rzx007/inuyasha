export * from './z-button'

// 导出所有组件用于批量注册
import { ZButton } from './z-button'
import { ZTabs, ZCollapse, ZRow } from './layout'
import { ZSelect } from './z-select'

export const materialsComponents = {
  ZButton,
  ZTabs,
  ZCollapse,
  ZRow,
  ZSelect,
}