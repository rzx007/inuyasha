import type { ComponentMeta } from '@/types/component'
import { ComponentType } from '@/types/component'

export const dataComponents: ComponentMeta[] = [
  {
    type: ComponentType.Statistic,
    name: '统计数值',
    icon: 'BarChart3',
    category: 'data',
    display: 'inline-block',
    defaultProps: {},
    defaultStyle: {
      padding: '16px',
    },
    propsSchema: [
      {
        key: 'title',
        label: '标题',
        type: 'text',
        defaultValue: 'Title',
        bindable: true,
      },
      {
        key: 'value',
        label: '数值',
        type: 'text',
        defaultValue: '123,456',
        bindable: true,
      },
    ],
  },
  {
    type: ComponentType.Table,
    name: '表格',
    icon: 'Table',
    category: 'data',
    display: 'block',
    componentName: 'ZTable',
    defaultProps: {},
    defaultStyle: {},
    propsSchema: [
      {
        key: 'columns',
        label: '列配置',
        type: 'json',
        defaultValue: [
          { prop: 'date', label: 'Date' },
          { prop: 'name', label: 'Name' },
          { prop: 'address', label: 'Address' },
        ],
        bindable: true,
      },
      {
        key: 'data',
        label: '表格数据',
        type: 'json',
        defaultValue: [
          { date: '2016-05-03', name: 'Tom', address: 'No. 189, Grove St, Los Angeles' },
          { date: '2016-05-02', name: 'Tom', address: 'No. 189, Grove St, Los Angeles' },
          { date: '2016-05-04', name: 'Tom', address: 'No. 189, Grove St, Los Angeles' },
        ],
        bindable: true,
      },
      {
        key: 'stripe',
        label: '斑马纹',
        type: 'switch',
        defaultValue: true,
      },
      {
        key: 'border',
        label: '边框',
        type: 'switch',
        defaultValue: true,
      },
      {
        key: 'size',
        label: '表格尺寸',
        type: 'select',
        defaultValue: 'default',
        options: [
          { label: '大', value: 'large' },
          { label: '默认', value: 'default' },
          { label: '小', value: 'small' },
        ],
      },
      {
        key: 'maxHeight',
        label: '最大高度',
        type: 'text',
        defaultValue: '',
        placeholder: '如：400px 或 400',
      },
      {
        key: 'height',
        label: '固定高度',
        type: 'text',
        defaultValue: '',
        placeholder: '如：400px 或 400',
      },
    ],
  },
  {
    type: ComponentType.List,
    name: '列表',
    icon: 'List',
    category: 'data',
    display: 'block',
    defaultProps: {},
    defaultStyle: {},
    propsSchema: [
      {
        key: 'header',
        label: '列表头',
        type: 'text',
        defaultValue: 'List Header',
        bindable: true,
      },
      {
        key: 'footer',
        label: '列表尾',
        type: 'text',
        defaultValue: 'List Footer',
        bindable: true,
      },
      {
        key: 'bordered',
        label: '是否带边框',
        type: 'switch',
        defaultValue: true,
      },
      {
        key: 'items',
        label: '列表项',
        type: 'json',
        defaultValue: [
          { title: 'List item 1', description: 'description 1' },
          { title: 'List item 2', description: 'description 2' },
          { title: 'List item 3', description: 'description 3' },
        ],
        bindable: true,
      },
    ],
  },
]
