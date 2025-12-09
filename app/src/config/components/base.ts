import type { ComponentMeta } from '@/types/component'
import { ComponentType } from '@/types/component'

export const baseComponents: ComponentMeta[] = [
  {
    type: ComponentType.Container,
    name: '容器',
    icon: 'Box',
    category: 'base',
    canNest: true,
    display: 'block',
    componentName: 'div', // Use div for generic container
    defaultProps: {},
    defaultStyle: {
      padding: '16px',
      backgroundColor: '#fff',
      minHeight: '100px',
    },
    slots: [
      { name: 'default', label: 'Default', allowDrag: true }
    ],
    propsSchema: [
      {
        key: 'padding',
        label: '内边距',
        type: 'text',
        defaultValue: '16px',
      },
      {
        key: 'backgroundColor',
        label: '背景色',
        type: 'color',
        defaultValue: '#fff',
      },
    ],
  },
  {
    type: ComponentType.Text,
    name: '文本',
    icon: 'FileText',
    category: 'base',
    canNest: false,
    display: 'inline-block',
    componentName: 'span', // Use span for simple text
    defaultProps: {},
    defaultStyle: {
      fontSize: '14px',
      color: '#333',
    },
    propsSchema: [
      {
        key: 'content',
        label: '文本内容',
        type: 'textarea',
        defaultValue: '这是一段文本',
        bindable: true,
      },
      {
        key: 'fontSize',
        label: '字体大小',
        type: 'text',
        defaultValue: '14px',
      },
      {
        key: 'color',
        label: '文字颜色',
        type: 'color',
        defaultValue: '#333',
      },
    ],
  },
  {
    type: ComponentType.Button,
    name: '按钮',
    icon: 'Square',
    category: 'base',
    canNest: false,
    display: 'inline-block',
    componentName: 'ZButton',
    defaultProps: {},
    defaultStyle: {
      padding: '8px 16px',
    },
    triggers: [
      { label: '点击', value: 'onClick', event: 'click' },
    ],
    propsSchema: [
      {
        key: 'text',
        label: '按钮文字',
        type: 'text',
        defaultValue: '按钮',
        bindable: true,
      },
      {
        key: 'type',
        label: '按钮类型',
        type: 'select',
        defaultValue: 'primary',
        options: [
          { label: '主要', value: 'primary' },
          { label: '成功', value: 'success' },
          { label: '警告', value: 'warning' },
          { label: '危险', value: 'danger' },
        ],
      },
    ],
  },
  {
    type: ComponentType.Image,
    name: '图片',
    icon: 'Image',
    category: 'base',
    canNest: false,
    display: 'inline-block',
    componentName: 'ElImage',
    defaultProps: {
      src: 'https://fuss10.elemecdn.com/e/5d/4a731a90594a4af544c0c25941171jpeg.jpeg',
      alt: '图片',
    },
    defaultStyle: {
      width: '100%',
      maxWidth: '100%',
    },
    propsSchema: [
      {
        key: 'src',
        label: '图片地址',
        type: 'text',
        defaultValue: '',
        placeholder: '请输入图片URL',
        bindable: true,
      },
      {
        key: 'alt',
        label: '替代文本',
        type: 'text',
        defaultValue: '图片',
      },
    ],
  },
  {
    type: ComponentType.Divider,
    name: '分割线',
    icon: 'Minus',
    category: 'base',
    canNest: false,
    display: 'block',
    componentName: 'ElDivider',
    defaultProps: {
      direction: 'horizontal',
    },
    defaultStyle: {
      margin: '16px 0',
    },
    propsSchema: [
      {
        key: 'direction',
        label: '方向',
        type: 'select',
        defaultValue: 'horizontal',
        options: [
          { label: '水平', value: 'horizontal' },
          { label: '垂直', value: 'vertical' },
        ],
      },
    ],
  },
]
