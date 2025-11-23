import js from '@eslint/js'
import globals from 'globals'
import tseslint from 'typescript-eslint'

export default tseslint.config(
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ['**/*.{js,jsx,ts,tsx}'],
    languageOptions: {
      ecmaVersion: 2023,
      globals: {
        ...globals.node,
        ...globals.browser,
        ...globals.es2023
      },
      parser: tseslint.parser,
      parserOptions: {
        ecmaFeatures: {
          jsx: true
        }
      }
    },
    plugins: {
      '@typescript-eslint': tseslint.plugin
    },
    rules: {
      // 基础规则
      'no-console': process.env.NODE_ENV === 'production' ? 'warn' : 'off',
      'no-debugger': process.env.NODE_ENV === 'production' ? 'warn' : 'off',
      'no-var': 'error',
      'no-undef': 0,
      
      // TypeScript 规则
      '@typescript-eslint/no-this-alias': 'off',
      '@typescript-eslint/ban-ts-ignore': 'off',
      '@typescript-eslint/no-unused-vars': 'off',
      '@typescript-eslint/explicit-function-return-type': 'off',
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-var-requires': 'off',
      '@typescript-eslint/no-empty-function': 'off',
      '@typescript-eslint/no-use-before-define': 'off',
      '@typescript-eslint/ban-ts-comment': 'off',
      '@typescript-eslint/ban-types': 'off',
      '@typescript-eslint/no-non-null-assertion': 'off',
      '@typescript-eslint/explicit-module-boundary-types': 'off',
      
      // 代码质量规则
      'no-duplicate-case': 'warn',
      'no-empty': 'warn',
      'no-extra-parens': 'off',
      'no-func-assign': 'warn',
      'no-unreachable': 'warn',
      'curly': 'warn',
      'default-case': 'warn',
      'eqeqeq': 'warn',
      'no-else-return': 'warn',
      'no-empty-function': 'warn',
      'no-lone-blocks': 'warn',
      'no-multi-spaces': 'warn',
      'no-redeclare': 'warn',
      'no-return-assign': 'warn',
      'no-return-await': 'warn',
      'no-self-assign': 'warn',
      'no-self-compare': 'warn',
      'no-useless-catch': 'warn',
      'no-useless-return': 'warn',
      'no-shadow': 'off',
      'no-delete-var': 'off',
      
      // 代码风格规则
      'array-bracket-spacing': 'warn',
      'brace-style': 'warn',
      'camelcase': 'warn',
      'indent': 'off',
      'max-depth': ['warn', 6],
      'max-statements': ['warn', 100],
      'max-nested-callbacks': ['warn', 6],
      'max-params': ['warn', 5],
      'max-statements-per-line': ['warn', { max: 2 }],
      'no-lonely-if': 'warn',
      'no-mixed-spaces-and-tabs': 'warn',
      'no-multiple-empty-lines': 'warn',
      'semi': ['warn', 'never'],
      'space-before-blocks': 'warn',
      'space-in-parens': 'warn',
      'space-infix-ops': 'warn',
      'space-unary-ops': 'warn',
      'switch-colon-spacing': 'warn',
      'arrow-spacing': 'warn',
      'prefer-const': 'warn',
      'prefer-rest-params': 'warn',
      'no-useless-escape': 'warn',
      'no-irregular-whitespace': 'warn',
      'no-prototype-builtins': 'warn',
      'no-fallthrough': 'warn',
      'no-extra-boolean-cast': 'warn',
      'no-case-declarations': 'warn',
      'no-async-promise-executor': 'warn'
    }
  }
)
