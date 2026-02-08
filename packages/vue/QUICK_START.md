# Inuyasha Vue SDK 快速开始

## 安装

```bash
npm install @inuyasha/vue
```

## 基础使用

### 1. 初始化

```typescript
import { createApp } from 'vue'
import { createPinia } from 'pinia'
import { createInuyashaPlugin } from '@inuyasha/vue'
import { pageRootMeta } from './config/components/pageRoot'
import Toast from './components/toast'

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

### 2. 在组件中使用

```vue
<script setup lang="ts">
import { useEditor } from '@inuyasha/vue'

const editor = useEditor()

// 访问编辑器状态
console.log(editor.pageConfig)

// 切换编辑器模式
function toggleMode() {
  editor.setMode(EditorMode.Preview)
}
</script>

<template>
  <div>
    <button @click="toggleMode">切换预览模式</button>
  </div>
</template>
```

## 常用 Hooks

### useEditor

编辑器相关的所有操作。

```typescript
const editor = useEditor()

// 状态
console.log(editor.mode) // 编辑器模式
console.log(editor.pageConfig) // 页面配置
console.log(editor.selectedComponent) // 选中的组件

// 操作
editor.setMode(EditorMode.Preview)
editor.setPageConfig(config)
editor.addComponent(component)
editor.deleteComponent(id)
editor.updateComponent(id, updates)
editor.selectComponent(id)
```

### useDataSource

数据源管理。

```typescript
const dataSource = useDataSource()

// 状态
console.log(dataSource.dataSources)

// 操作
const id = dataSource.addDataSource({
  name: '用户列表',
  type: 'api',
  url: '/api/users'
})

dataSource.updateDataSource(id, { url: '/api/v1/users' })
dataSource.removeDataSource(id)
await dataSource.fetchDataSource(id)
```

### useFormState

表单状态管理。

```typescript
const formState = useFormState()

// 状态
console.log(formState.states)

// 操作
formState.setComponentState(componentId, 'username', 'john')
const value = formState.getComponentState(componentId, 'username')
formState.removeComponentState(componentId)
```

### useComponentRegistry

组件实例注册。

```typescript
const componentRegistry = useComponentRegistry()

// 操作
componentRegistry.register(componentId, componentInstance)
const instance = componentRegistry.getComponent(componentId)
componentRegistry.unregister(componentId)
```

### useComponent

组件元数据管理。

```typescript
const component = useComponent()

// 获取组件元数据
const meta = component.getComponentMeta('ZButton')
console.log(meta)
```

### useInuyasha

获取完整的 Inuyasha 实例。

```typescript
const { stores } = useInuyasha()

// 访问所有 stores
const editor = stores.editor
const dataSource = stores.dataSource
const formState = stores.formState
const componentRegistry = stores.componentRegistry
const component = stores.component
```

## 渲染器使用

### DynamicRenderer

动态渲染组件。

```vue
<script setup lang="ts">
import { useSchemaRenderer } from '@inuyasha/vue'

const props = defineProps<{
  schema: ComponentSchema
}>()

const {
  resolvedProps,
  resolvedStyle,
  dynamicEvents,
  getSlotChildren,
  canUseDynamicRender,
  componentMeta
} = useSchemaRenderer(() => props.schema)
</script>

<template>
  <component
    v-if="canUseDynamicRender"
    :is="componentMeta?.componentName"
    v-bind="resolvedProps"
    :style="resolvedStyle"
    v-on="dynamicEvents"
  />
</template>
```

## 完整示例

### 编辑器页面

```vue
<script setup lang="ts">
import { onMounted } from 'vue'
import { useEditor, useDataSource } from '@inuyasha/vue'

const editor = useEditor()
const dataSource = useDataSource()

onMounted(() => {
  // 加载保存的配置
  const savedConfig = localStorage.getItem('page-config')
  if (savedConfig) {
    try {
      editor.setPageConfig(JSON.parse(savedConfig))
    } catch (e) {
      console.error('加载配置失败', e)
    }
  }
})

function saveConfig() {
  localStorage.setItem('page-config', JSON.stringify(editor.pageConfig))
}
</script>

<template>
  <div class="editor">
    <button @click="saveConfig">保存配置</button>

    <DynamicRenderer
      v-if="editor.pageConfig.rootComponent"
      :schema="editor.pageConfig.rootComponent"
    />
  </div>
</template>
```

### 预览页面

```vue
<script setup lang="ts">
import { onMounted } from 'vue'
import { useEditor, useDataSource } from '@inuyasha/vue'

const editor = useEditor()
const dataSource = useDataSource()

onMounted(async () => {
  // 切换到预览模式
  editor.setMode(EditorMode.Preview)

  // 加载数据源
  const sources = dataSource.exportDataSources()
  for (const [id] of Object.entries(sources)) {
    await dataSource.fetchDataSource(id)
  }
})
</script>

<template>
  <div class="preview">
    <PreviewRenderer
      v-if="editor.pageConfig.rootComponent"
      :schema="editor.pageConfig.rootComponent"
    />
  </div>
</template>
```

## 更多资源

- [SDK 文档](../packages/vue/SDK_README.md)
- [迁移指南](../MIGRATION_GUIDE.md)
- [改进总结](../SDK_IMPROVEMENTS.md)
