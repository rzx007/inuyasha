import vueConfig from '@zth/eslint-config/vue'
import autoImportGlobals from './.eslintrc-auto-import.json'

export default [
  ...vueConfig,
  {
    files: ['**/*.{js,jsx,ts,tsx,vue}'],
    languageOptions: {
      globals: {
        ...autoImportGlobals.globals
      }
    },
    rules: {
      // 覆盖根目录的自定义规则
      'max-statements': ['warn', 160],
      'max-params': ['warn', 10]
    }
  }
]