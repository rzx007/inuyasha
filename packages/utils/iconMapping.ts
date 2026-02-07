import {
  Box,
  FileText,
  Square,
  Image,
  Minus,
  Type,
  MousePointer,
  Calendar,
  CreditCard,
  Columns,
  RectangleHorizontal,
  ChevronDown,
  BarChart3,
  Table,
  List,
  Package
} from 'lucide-vue-next'

export const iconMap = {
  // Base components
  'Box': Box,
  'FileText': FileText,
  'Square': Square,
  'Image': Image,
  'Minus': Minus,

  // Form components
  'Type': Type,
  'MousePointer': MousePointer,
  'Calendar': Calendar,

  // Layout components
  'CreditCard': CreditCard,
  'Columns': Columns,
  'RectangleHorizontal': RectangleHorizontal,
  'ChevronDown': ChevronDown,
  'Package': Package,

  // Data components
  'BarChart3': BarChart3,
  'Table': Table,
  'List': List,
} as const

export type IconName = keyof typeof iconMap

export function getIconComponent(iconName: string|undefined) {
  return iconMap[iconName as IconName] || Square
}
