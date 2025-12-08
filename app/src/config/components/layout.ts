import type { ComponentMeta } from '@/types/component'
import { ComponentType } from '@/types/component'

export const layoutComponents: ComponentMeta[] = [
  {
    type: ComponentType.Card,
    name: '卡片',
    icon: 'CreditCard',
    category: 'layout',
    canNest: true,
    display: 'block',
    componentName: 'ElCard',
    defaultProps: {
      title: '卡片标题',
      shadow: 'always',
    },
    defaultStyle: {
      padding: '16px',
      borderRadius: '4px',
      backgroundColor: '#fff',
    },
    slots: [
      { name: 'header', label: 'Header', allowDrag: false },
      { name: 'default', label: 'Default', allowDrag: true }
    ],
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
    icon: 'Columns',
    category: 'layout',
    canNest: true,
    display: 'block',
    componentName: 'ZRow',
    useDynamicSlots: true,
    defaultProps: {
      gutter: 20,
      items: [
        { name: 'col-1', span: 12 },
        { name: 'col-2', span: 12 },
      ],
    },
    defaultStyle: {},
    slots: [], // No static slots, use dynamic slots based on children
    propsSchema: [
      {
        key: 'gutter',
        label: '栅格间隔',
        type: 'number',
        defaultValue: 20,
      },
      {
        key: 'justify',
        label: '水平排列方式',
        type: 'select',
        defaultValue: 'start',
        options: [
          { label: '开始', value: 'start' },
          { label: '结束', value: 'end' },
          { label: '居中', value: 'center' },
          { label: '均匀分布', value: 'space-around' },
          { label: '两端对齐', value: 'space-between' },
          { label: '均匀对齐', value: 'space-evenly' },
        ],
      },
      {
        key: 'align',
        label: '垂直排列方式',
        type: 'select',
        defaultValue: 'top',
        options: [
          { label: '顶部', value: 'top' },
          { label: '居中', value: 'middle' },
          { label: '底部', value: 'bottom' },
        ],
      },
      {
        key: 'items',
        label: '栅格列',
        type: 'json',
        defaultValue: [
          { name: 'col-1', span: 12 },
          { name: 'col-2', span: 12 },
        ],
        bindable: true,
      },
    ],
  },
  {
    type: ComponentType.Collapse,
    name: '折叠面板',
    icon: 'Package',
    category: 'layout',
    canNest: true,
    display: 'block',
    componentName: 'ZCollapse',
    useDynamicSlots: true,
    defaultProps: {
      'model-value': '1',
      items: [
        {
          name: '1',
          title: '折叠项 1',
        },
      ],
    },
    defaultStyle: {},
    slots: [], // No static slots, use dynamic slots based on items
    propsSchema: [
      {
        key: 'model-value',
        label: '默认激活折叠项',
        type: 'text',
        defaultValue: '1',
        bindable: true,
      },
      {
        key: 'items',
        label: '折叠项',
        type: 'json',
        defaultValue: [
          {
            name: '1',
            title: '折叠项 1',
          },
        ],
        bindable: true,
      },
    ],
  },
  {
    type: ComponentType.Tabs,
    name: '标签页',
    icon: 'Tabs',
    category: 'layout',
    canNest: true,
    display: 'block',
    componentName: 'ZTabs',
    useDynamicSlots: true,
    defaultProps: {
      'model-value': '1',
      type: 'card',
      closable: false,
      addable: false,
      editable: false,
      tabPosition: 'top',
      items: [
        {
          name: '1',
          title: '标签项 1',
        },
        {
          name: '2',
          title: '标签项 2',
        },
      ],
    },
    defaultStyle: {
      minHeight: '100px',
    },
    slots: [], // No static slots, use dynamic slots based on items
    propsSchema: [
      {
        key: 'items',
        label: '标签项',
        type: 'json',
        defaultValue: [
          {
            name: '1',
            title: '标签项 1',
          },
          {
            name: '2',
            title: '标签项 2',
          },
        ],
        bindable: true,
      },
      {
        key: 'model-value',
        label: '默认激活标签',
        type: 'text',
        defaultValue: '1',
        bindable: true,
        description: '默认激活的标签页名称',
      },
      {
        key: 'type',
        label: '标签类型',
        type: 'select',
        defaultValue: 'card',
        options: [
          { label: '线条', value: 'line' },
          { label: '卡片', value: 'card' },
          { label: '边框卡片', value: 'border-card' },
        ],
      },
      {
        key: 'tabPosition',
        label: '标签位置',
        type: 'select',
        defaultValue: 'top',
        options: [
          { label: '顶部', value: 'top' },
          { label: '底部', value: 'bottom' },
          { label: '左侧', value: 'left' },
          { label: '右侧', value: 'right' },
        ],
      },
      {
        key: 'closable',
        label: '可关闭',
        type: 'switch',
        defaultValue: false,
        description: '标签是否可关闭',
      },
      {
        key: 'addable',
        label: '可添加',
        type: 'switch',
        defaultValue: false,
        description: '是否可添加标签',
      },
      {
        key: 'editable',
        label: '可编辑',
        type: 'switch',
        defaultValue: false,
        description: '标签是否可编辑',
      },
    ],
  },
]
