import type { ComponentMeta } from '@/types/component'
import { ComponentType } from '@/types/component'

export const formComponents: ComponentMeta[] = [
  {
    type: ComponentType.Input,
    name: '输入框',
    icon: '⌨️',
    category: 'form',
    display: 'inline-block',
    defaultProps: {
      label: 'Label',
      placeholder: 'Please input',
    },
    defaultStyle: {
      width: '300px',
    },
    defaultModelValue: {
      value: 'hi', // 输入框的双向绑定值
    },
    propsSchema: [
      {
        key: 'label',
        label: '标签',
        type: 'text',
        defaultValue: 'Label',
        bindable: true,
      },
      {
        key: 'placeholder',
        label: '占位提示',
        type: 'text',
        defaultValue: 'Please input',
      },
    ],
  },
  {
    type: ComponentType.Select,
    name: '选择器',
    icon: '🖱️',
    category: 'form',
    display: 'inline-block',
    defaultProps: {
      label: 'Label',
      options: [
        { label: 'Option 1', value: '1' },
        { label: 'Option 2', value: '2' },
      ],
    },
    defaultStyle: {
      width: '300px',
    },
    defaultModelValue: {
      value: '', // 选择器的双向绑定值
    },
    propsSchema: [
      {
        key: 'label',
        label: '标签',
        type: 'text',
        defaultValue: 'Label',
        bindable: true,
      },
      {
        key: 'options',
        label: '选项',
        type: 'json',
        defaultValue: [],
        bindable: true,
      },
    ],
  },
  {
    type: ComponentType.DatePicker,
    name: '日期选择器',
    icon: '📅',
    category: 'form',
    display: 'inline-block',
    defaultProps: {
      label: 'Label',
    },
    defaultStyle: {
      width: '300px',
    },
    defaultModelValue: {
      value: null, // 日期选择器的双向绑定值
    },
    propsSchema: [
      {
        key: 'label',
        label: '标签',
        type: 'text',
        defaultValue: 'Label',
        bindable: true,
      },
    ],
  },
]
