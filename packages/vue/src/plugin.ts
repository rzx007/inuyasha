import type { App, Plugin } from 'vue'
import { setInuyashaVueOptions, type InuyashaVueOptions } from './config'

export function createInuyashaPlugin(options: InuyashaVueOptions): Plugin {
  return {
    install(app: App) {
      setInuyashaVueOptions(options)
      
      // Check if Pinia is installed
      if (!app.config.globalProperties.$pinia) {
        console.warn(
          '[InuyashaVue] Pinia not found. Make sure to install Pinia plugin before Inuyasha plugin.'
        )
      }
    }
  }
}
