import type { App, Plugin } from 'vue'
import { InjectionKey } from 'vue'
import type { ComponentMeta } from '@inuyasha/core'
import { setInuyashaVueOptions, type InuyashaVueOptions } from './config'
import { useEditor } from './stores/editor'
import { useComponentInstance } from './stores/componentInstance'
import { useDataSource } from './stores/dataSource'
import { useFormState } from './stores/formState'
import { useComponentMeta } from './stores/componentMeta'

export interface InuyashaOptions extends InuyashaVueOptions {
  app: App
}

export interface InuyashaInstance {
  stores: {
    editor: ReturnType<typeof useEditor>
    componentInstance: ReturnType<typeof useComponentInstance>
    dataSource: ReturnType<typeof useDataSource>
    formState: ReturnType<typeof useFormState>
    componentMeta: ReturnType<typeof useComponentMeta>
  }
}

export const INUYASHA_KEY: InjectionKey<InuyashaInstance> = Symbol('inuyasha')

/**
 * 创建并初始化一个 Inuyasha 实例。
 *
 * @param options - 配置选项对象，包含应用实例和其他相关配置。
 *   - app: Vue 应用实例，用于提供依赖注入。
 *   - 其他选项将传递给 [setInuyashaVueOptions](file://d:\code\personal-project\inuyasha\packages\vue\src\config.ts#L14-L16) 函数进行处理。
 *
 * @returns 返回初始化完成的 Inuyasha 实例，包含多个状态管理仓库。
 *   - stores: 包含编辑器、组件注册表、数据源、表单状态和组件等状态管理仓库。
 */
export function createInuyasha(options: InuyashaOptions): InuyashaInstance {
  const { app } = options

  // 设置 Inuyasha 的 Vue 相关选项
  setInuyashaVueOptions(options)

  // 初始化各个状态管理仓库，并将其挂载到实例上
  const instance: InuyashaInstance = {
    stores: {
      editor: useEditor(),
      componentInstance: useComponentInstance(),
      dataSource: useDataSource(),
      formState: useFormState(),
      componentMeta: useComponentMeta()
    }
  }

  // 将实例通过依赖注入提供给 Vue 应用
  app.provide(INUYASHA_KEY, instance)

  return instance
}

/**
 * 创建一个 Inuyasha 插件实例。
 *
 * @param options - 插件配置选项，不包含 'app' 属性。
 *                  该参数用于传递给 [createInuyasha](file://d:\code\personal-project\inuyasha\packages\vue\src\sdk.ts#L36-L57) 函数的配置。
 * @returns 返回一个 Vue 插件对象，包含 `install` 方法用于安装插件。
 */
export function createInuyashaPlugin(options: Omit<InuyashaOptions, 'app'>): Plugin {
  return {
    /**
     * 插件安装方法，在 Vue 应用中调用以注册插件。
     *
     * @param app - Vue 应用实例，用于注册插件和访问全局属性。
     */
    install(app: App) {
      // 使用传入的选项和应用实例创建 Inuyasha 实例
      createInuyasha({ ...options, app })

      // 检查是否已安装 Pinia 插件，若未安装则输出警告信息
      if (!app.config.globalProperties.$pinia) {
        console.warn(
          '[InuyashaVue] Pinia not found. Make sure to install Pinia plugin before Inuyasha plugin.'
        )
      }
    }
  }
}
