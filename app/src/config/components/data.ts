import type { ComponentMeta } from '@/types/component'
import { ComponentType } from '@/types/component'

export const dataComponents: ComponentMeta[] = [
  {
    type: ComponentType.Statistic,
    name: '统计数值',
    icon: '📊',
    category: 'data',
    display: 'inline-block',
    defaultProps: {
      title: 'Title',
      value: '123,456',
    },
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
    icon: '🧾',
    category: 'data',
    display: 'block',
    defaultProps: {
      columns: [
        { prop: 'date', label: 'Date' },
        { prop: 'name', label: 'Name' },
        { prop: 'address', label: 'Address' },
      ],
      data: [
        { date: '2016-05-03', name: 'Tom', address: 'No. 189, Grove St, Los Angeles' },
        { date: '2016-05-02', name: 'Tom', address: 'No. 189, Grove St, Los Angeles' },
        { date: '2016-05-04', name: 'Tom', address: 'No. 189, Grove St, Los Angeles' },
      ],
    },
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
    ],
  },
  {
    type: ComponentType.List,
    name: '列表',
    icon: '📑',
    category: 'data',
    display: 'block',
    defaultProps: {
      header: 'List Header',
      footer: 'List Footer',
      bordered: true,
      items: [
        { title: 'List item 1', description: 'description 1' },
        { title: 'List item 2', description: 'description 2' },
        { title: 'List item 3', description: 'description 3' },
      ],
    },
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
        defaultValue: [],
        bindable: true,
      },
    ],
  },
]
