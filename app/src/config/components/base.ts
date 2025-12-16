import type { ComponentMeta } from '@inuyasha/core'
import { ComponentType } from '@inuyasha/core'

export const baseComponents: ComponentMeta[] = [
  {
    type: ComponentType.Container,
    name: '容器',
    icon: 'Box',
    category: 'base',
    canNest: true,
    display: 'block',
    componentName: 'ZContainer', // Use div for generic container
    defaultProps: {
      display: 'block',
      direction: 'horizontal',
      size: 'small',
      wrap: false,
      alignment: 'center',
      spacer: '',
      fill: false,
      'fill-ratio': 100,
      class: '',
      style: '',
      'prefix-cls': '',
    },
    defaultStyle: {
      backgroundColor: '#fff',
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
      {
        key: 'display',
        label: '布局模式',
        type: 'select',
        defaultValue: 'block',
        options: [
          { label: '块级', value: 'block' },
          { label: 'Flex (ElSpace)', value: 'flex' },
        ],
      },
      {
        key: 'direction',
        label: '排列方向',
        type: 'select',
        defaultValue: 'horizontal',
        options: [
          { label: '水平', value: 'horizontal' },
          { label: '垂直', value: 'vertical' },
        ],
      },
      {
        key: 'size',
        label: '间距尺寸',
        type: 'select',
        defaultValue: 'small',
        options: [
          { label: '默认', value: 'default' },
          { label: '小', value: 'small' },
          { label: '大', value: 'large' },
        ],
        description: '可输入数字或数组时，请在高级配置中使用 props JSON',
      },
      {
        key: 'wrap',
        label: '自动换行',
        type: 'switch',
        defaultValue: false,
      },
      {
        key: 'alignment',
        label: '对齐方式',
        type: 'select',
        defaultValue: 'center',
        options: [
          { label: 'center', value: 'center' },
          { label: 'start', value: 'start' },
          { label: 'end', value: 'end' },
          { label: 'stretch', value: 'stretch' },
          { label: 'baseline', value: 'baseline' },
          { label: 'normal', value: 'normal' },
        ],
      },
      {
        key: 'justify',
        label: '主轴对齐',
        type: 'select',
        defaultValue: 'start',
        options: [
          { label: 'start', value: 'start' },
          { label: 'end', value: 'end' },
          { label: 'center', value: 'center' },
          { label: 'space-around', value: 'space-around' },
          { label: 'space-between', value: 'space-between' },
          { label: 'space-evenly', value: 'space-evenly' },
        ],
      },
      {
        key: 'spacer',
        label: '分隔符',
        type: 'text',
        defaultValue: '',
        description: '可为字符或 VNode，VNode 请在高级配置中使用 props JSON',
      },
      {
        key: 'fill',
        label: '填充父容器',
        type: 'switch',
        defaultValue: false,
      },
      {
        key: 'fill-ratio',
        label: '填充比例',
        type: 'number',
        defaultValue: 100,
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
    exposedMethods: [
      { name: 'focus', label: '聚焦 (focus)' },
      { name: 'click', label: '触发点击 (click)' },
    ],
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
        key: 'disabled',
        label: '禁用',
        type: 'switch',
        defaultValue: false,
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
    componentName: 'ZDivider',
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
      {
        key: 'label',
        label: '标签',
        type: 'text',
        defaultValue: '',
      },
      {
        key: 'borderStyle',
        label: '边框样式',
        type: 'select',
        defaultValue: 'solid',
        options: [
          { label: '实线', value: 'solid' },
          { label: '虚线', value: 'dashed' },
          { label: '点线', value: 'dotted' },
        ],
      },
      {
        key: 'contentPosition',
        label: '内容位置',
        type: 'select',
        defaultValue: 'center',
        options: [
          { label: '左', value: 'left' },
          { label: '中', value: 'center' },
          { label: '右', value: 'right' },
        ],
      },
    ],
  },
]
