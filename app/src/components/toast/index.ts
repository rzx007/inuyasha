import { createVNode, render } from 'vue'
import toastTemplate from './Toast.vue'

export interface IProps {
  value?: string
  duration?: number
  background?: string
  color?: string
  type?: 'success' | 'error' | 'info' | 'warning' | 'default'
}

const defaultOpt = {
  duration: 3000,
}

// 预设主题样式
const themes = {
  success: {
    background: '#e0f2fe',
    color: '#0284c7',
  },
  error: {
    background: '#fef2f2',
    color: '#ef4444',
  },
  info: {
    background: '#f4f4f5',
    color: '#909399',
  },
  warning: {
    background: '#fdf6ec',
    color: '#e6a23c',
  },
  default: {
    background: '#000',
    color: '#fff',
  },
}

export interface ResultParams {
  destroy?: () => void
}

const createToast = (options: IProps): ResultParams => {
  const container = document.createElement('div')

  // 如果指定了类型，应用对应的主题
  const themeStyle = options.type ? themes[options.type] : {}

  const opt = { ...defaultOpt, ...themeStyle, ...options }

  const vm = createVNode(toastTemplate, opt)
  render(vm, container)
  document.body.appendChild(container)

  const destroy = () => {
    const dom = vm.el as HTMLDivElement
    if (dom.querySelector('.toast-value')) {
      dom.querySelector('.toast-value')?.classList.add('reomve')
      const t = setTimeout(() => {
        render(null, container)
        document.body.removeChild(container)
        clearTimeout(t)
      }, 500)
    }
  }

  if (opt.duration) {
    const timer = setTimeout(() => {
      destroy()
      clearTimeout(timer)
    }, opt.duration)
  }

  return {
    destroy,
  }
}

const Toast = (options: IProps | string): ResultParams => {
  if (typeof options === 'string') {
    return createToast({ value: options })
  }
  return createToast(options)
}

// 快捷方法
Toast.success = (message: string, options: Partial<IProps> = {}) => {
  return createToast({ value: message, type: 'success', ...options })
}

Toast.error = (message: string, options: Partial<IProps> = {}) => {
  return createToast({ value: message, type: 'error', ...options })
}

Toast.info = (message: string, options: Partial<IProps> = {}) => {
  return createToast({ value: message, type: 'info', ...options })
}

Toast.warning = (message: string, options: Partial<IProps> = {}) => {
  return createToast({ value: message, type: 'warning', ...options })
}

export default Toast

/**
 *  兼容之前的使用方式
 * Toast.success('发布成功！')
 * Toast.error('发布失败，请重试')
 *
 */
