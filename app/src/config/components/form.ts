import type { ComponentMeta } from '@/types/component'
import { ComponentType } from '@/types/component'

export const formComponents: ComponentMeta[] = [
  {
    type: ComponentType.Input,
    name: '输入框',
    icon: 'Type',
    category: 'form',
    display: 'inline-block',
    componentName: 'ElInput',
    defaultProps: {
      label: 'Label',
      placeholder: 'Please input',
    },
    defaultStyle: {
      width: '300px',
    },
    triggers: [
      { label: '值改变', value: 'onValueChange', event: 'input' }, // ElInput emits 'input' or 'update:modelValue'
      { label: '聚焦', value: 'onFocus', event: 'focus' },
      { label: '失焦', value: 'onBlur', event: 'blur' },
    ],
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
      {
        key: 'modelValue',
        label: '值',
        type: 'text',
        defaultValue: '',
        vModel: true,
        bindable: true,
      },
    ],
  },
  {
    type: ComponentType.Select,
    name: '选择器',
    icon: 'MousePointer',
    category: 'form',
    display: 'inline-block',
    componentName: 'ZSelect',
    defaultProps: {
      label: 'Label',
      clearable: true,
      options: [
        { label: 'Option 1', value: '1' },
        { label: 'Option 2', value: '2' },
      ],
    },
    defaultStyle: {
      width: '300px',
    },
    triggers: [
      { label: '值改变', value: 'onValueChange', event: 'change' },
    ],
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
      {
        key: 'modelValue',
        label: '选中值',
        type: 'text',
        defaultValue: '',
        vModel: true,
        bindable: true,
      },
    ],
  },
  {
    type: ComponentType.DatePicker,
    name: '日期选择器',
    icon: 'Calendar',
    category: 'form',
    display: 'inline-block',
    componentName: 'ElDatePicker',
    defaultProps: {
      label: 'Label',
    },
    defaultStyle: {
      width: '300px',
    },
    triggers: [
      { label: '值改变', value: 'onValueChange', event: 'change' },
    ],
    propsSchema: [
      {
        key: 'label',
        label: '标签',
        type: 'text',
        defaultValue: 'Label',
        bindable: true,
      },
      {
        key: 'modelValue',
        label: '选中日期',
        type: 'text',
        defaultValue: null,
        vModel: true,
        bindable: true,
      },
    ],
  },
]
