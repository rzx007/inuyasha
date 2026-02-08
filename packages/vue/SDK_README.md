# Inuyasha Vue SDK

## 安装

```bash
npm install @inuyasha/vue
```

## 初始化

### 方式一：使用 Plugin（推荐）

```typescript
import { createApp } from 'vue'
import { createPinia } from 'pinia'
import { createInuyashaPlugin } from '@inuyasha/vue'

const app = createApp(App)
const pinia = createPinia()

app.use(pinia)
app.use(
  createInuyashaPlugin({
    pageRootMeta,
    toast: Toast
  })
)
```

### 方式二：使用 createInuyasha（需要更细粒度控制）

```typescript
import { createApp } from 'vue'
import { createPinia } from 'pinia'
import { createInuyasha } from '@inuyasha/vue'

const app = createApp(App)
const pinia = createPinia()

app.use(pinia)

const inuyasha = createInuyasha({
  app,
  pageRootMeta,
  toast: Toast
})
```

## 使用

### 在组件中使用

```typescript
import { useEditor, useDataSource, useFormState } from '@inuyasha/vue'

const editor = useEditor()
const dataSource = useDataSource()
const formState = useFormState()

// 访问编辑器状态
console.log(editor.pageConfig)

// 访问数据源
console.log(dataSource.dataSources)

// 访问表单状态
console.log(formState.states)
```

### 使用 useInuyasha 获取完整实例

```typescript
import { useInuyasha } from '@inuyasha/vue'

const { stores } = useInuyasha()

// 访问所有 stores
console.log(stores.editor)
console.log(stores.componentInstance)
console.log(stores.dataSource)
console.log(stores.formState)
console.log(stores.componentMeta)
```


#### Store Hooks

- `useEditor()` - 获取编辑器 store
- `useComponentInstance()` - 获取组件注册表 store
- `useDataSource()` - 获取数据源 store
- `useFormState()` - 获取表单状态 store
- `useComponentMate()` - 获取组件 store
- `useInuyasha()` - 获取完整实例
## API

### createInuyasha(options: InuyashaOptions): InuyashaInstance

创建 Inuyasha 实例。

**参数：**

- `options`: 配置选项
  - `app`: Vue 应用实例
  - `pageRootMeta`: PageRoot 组件元信息
  - `toast`: Toast 配置（可选）

**返回：** InuyashaInstance

### createInuyashaPlugin(options: Omit<InuyashaOptions, 'app'>): Plugin

创建 Vue 插件。

**参数：**

- `options`: 配置选项（不需要 app 参数）

**返回：** Vue 插件

### useInuyasha(): InuyashaInstance

获取 Inuyasha 实例。

**返回：** InuyashaInstance

### useEditor()

获取编辑器 store。

**返回：** EditorStore

### useComponentRegistry()

获取组件注册表 store。

**返回：** ComponentRegistryStore

### useDataSource()

获取数据源 store。

**返回：** DataSourceStore

### useFormState()

获取表单状态 store。

**返回：** FormStateStore

### useComponent()

获取组件 store。

**返回：** ComponentStore

## 类型

### InuyashaInstance

```typescript
interface InuyashaInstance {
  stores: {
    editor: ReturnType<typeof useEditorStore>
    componentRegistry: ReturnType<typeof useComponentRegistry>
    dataSource: ReturnType<typeof useDataSourceStore>
    formState: ReturnType<typeof useFormStateStore>
    component: ReturnType<typeof useComponentStore>
  }
}
```

### InuyashaOptions

```typescript
interface InuyashaOptions {
  app: App
  pageRootMeta: ComponentMeta
  toast?: {
    success?(message: string): void
    error?(message: string): void
    warning?(message: string): void
    info?(message: string): void
  }
}
```
