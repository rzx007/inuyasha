import type { ComponentMeta } from '@inuyasha/core'

export interface InuyashaVueOptions {
  pageRootMeta: ComponentMeta  // 默认 PageRoot 组件元信息
  toast?: {
    success?(message: string): void
    error?(message: string): void
    warning?(message: string): void
    info?(message: string): void
  }
}

let options: InuyashaVueOptions | null = null

export function setInuyashaVueOptions(opts: InuyashaVueOptions) {
  options = opts
}

export function getInuyashaVueOptions(): InuyashaVueOptions {
  if (!options) throw new Error('Call setInuyashaVueOptions before using stores')
  return options
}
