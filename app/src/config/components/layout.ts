import type { ComponentMeta } from '@/types/component'
import { ComponentType } from '@/types/component'

export const layoutComponents: ComponentMeta[] = [
  {
    type: ComponentType.Card,
    name: '卡片',
    icon: '🃏',
    category: 'layout',
    canNest: true,
    display: 'block',
    defaultProps: {
      title: '卡片标题',
      shadow: 'always',
    },
    defaultStyle: {
      padding: '16px',
      borderRadius: '4px',
      backgroundColor: '#fff',
    },
    propsSchema: [
      {
        key: 'title',
        label: '标题',
        type: 'text',
        defaultValue: '卡片标题',
        bindable: true,
      },
      {
        key: 'shadow',
        label: '阴影',
        type: 'select',
        defaultValue: 'always',
        options: [
          { label: '总是', value: 'always' },
          { label: '悬停', value: 'hover' },
          { label: '从不', value: 'never' },
        ],
      },
    ],
  },
  {
    type: ComponentType.Row,
    name: '栅格行',
    icon: '⌗',
    category: 'layout',
    canNest: true,
    display: 'block',
    defaultProps: {
      gutter: 20,
      children: [
        { type: ComponentType.Col, span: 12 },
        { type: ComponentType.Col, span: 12 },
      ],
    },
    defaultStyle: {},
    propsSchema: [
      {
        key: 'gutter',
        label: '栅格间隔',
        type: 'number',
        defaultValue: 20,
      },
    ],
  },
  {
    type: ComponentType.Col,
    name: '栅格列',
    icon: '⎕',
    category: 'layout',
    canNest: true,
    display: 'block',
    defaultProps: {
      span: 12,
    },
    defaultStyle: {
      minHeight: '50px',
    },
    propsSchema: [
      {
        key: 'span',
        label: '栅格占据的列数',
        type: 'number',
        defaultValue: 12,
      },
    ],
  },
  {
    type: ComponentType.Collapse,
    name: '折叠面板',
    icon: '📦',
    category: 'layout',
    canNest: true,
    display: 'block',
    defaultProps: {
      title: 'Collapse Title',
    },
    defaultStyle: {},
    propsSchema: [
      {
        key: 'title',
        label: '标题',
        type: 'text',
        defaultValue: 'Collapse Title',
      },
    ],
  },
]
