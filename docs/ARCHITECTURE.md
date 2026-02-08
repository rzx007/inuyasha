# Inuyasha 架构设计文档

## 1. 整体架构图

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           应用层 (App)                                  │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐              │
│  │  Editor Page │  │ Preview Page  │  │  Router      │              │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘              │
│         │                   │                   │                         │
│  ┌──────▼──────────────────▼───────────────────▼───────────────┐      │
│  │                    Vue 组件层                                    │      │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐            │      │
│  │  │Editor UI  │  │Renderer  │  │ Materials │            │      │
│  │  └────┬─────┘  └────┬─────┘  └────┬─────┘            │      │
│  └───────┼──────────────┼──────────────┼──────────────────────┘      │
│          │              │              │                               │
└──────────┼──────────────┼──────────────┼───────────────────────────────┘
           │              │              │
┌──────────▼──────────────▼──────────────▼───────────────────────┐      │
│                  @inuyasha/vue (Vue绑定层)                       │      │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐        │      │
│  │ Stores       │  │ Composables  │  │ Components  │        │      │
│  │ - editor    │  │ - useXXX     │  │ - EditorUI  │        │      │
│  │ - component │  │              │  │ - RenderUI  │        │      │
│  │ - dataSource│  │              │  │              │        │      │
│  │ - formState │  │              │  │              │        │      │
│  └──────────────┘  └──────────────┘  └──────────────┘        │      │
└───────────────────────────────────────────────────────────────────┘      │
           │                                                           │
┌──────────▼───────────────────────────────────────────────────────────┐      │
│                    @inuyasha/core (核心层)                           │      │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐        │      │
│  │ Component    │  │ Editor       │  │ Event       │        │      │
│  │ - Registry   │  │ - EditorStore│  │ - Engine     │        │      │
│  │ - Tree       │  │              │  │ - Actions    │        │      │
│  │ - Factory    │  │              │  │              │        │      │
│  └──────────────┘  └──────────────┘  └──────────────┘        │      │
│  ┌──────────────┐  ┌──────────────┐                           │      │
│  │ State        │  │ Expression   │                           │      │
│  │ - DataSource │  │ - Binding    │                           │      │
│  │ - FormState  │  │ - Variable   │                           │      │
│  │              │  │ - Utils      │                           │      │
│  └──────────────┘  └──────────────┘                           │      │
│  ┌──────────────────────────────────────────────┐                  │      │
│  │ Types (类型定义 - Zod)                  │                  │      │
│  │ - Component  - DataSource - Event      │                  │      │
│  │ - Editor     - DND                       │                  │      │
│  └──────────────────────────────────────────────┘                  │      │
└───────────────────────────────────────────────────────────────────┘      │
           │                                                           │
┌──────────▼───────────────────────────────────────────────────────────┐      │
│                   第三方依赖                                          │      │
│  - Vue 3 + Pinia    - vue3-dnd    - lodash-es                      │
│  - Nanoid            - Zod         - Element Plus                  │
└───────────────────────────────────────────────────────────────────┘
```

## 2. 核心模块架构

### 2.1 @inuyasha/core 核心包结构

```
@inuyasha/core/
├── src/
│   ├── types/                    # 类型定义层
│   │   ├── component.ts         # 组件类型、Schema、Meta
│   │   ├── editor.ts            # 编辑器配置、模式
│   │   ├── event.ts            # 事件配置、Action类型
│   │   ├── dataSource.ts        # 数据源类型、绑定配置
│   │   └── dnd.ts              # 拖拽相关类型
│   │
│   ├── component/               # 组件系统模块
│   │   ├── registry.ts         # ComponentRegistry - 组件注册表
│   │   ├── tree.ts             # 组件树操作（查找、删除）
│   │   ├── factory.ts          # 组件工厂（创建实例）
│   │   └── instanceRegistry.ts # 组件实例注册
│   │
│   ├── editor/                  # 编辑器核心模块
│   │   └── store.ts           # EditorStore - 页面状态管理
│   │
│   ├── event/                   # 事件系统模块
│   │   ├── engine.ts           # 事件执行引擎
│   │   ├── types.ts            # 事件上下文
│   │   └── actions/            # Action处理器
│   │       ├── showMessage.ts
│   │       ├── callDataSource.ts
│   │       ├── updateProperty.ts
│   │       ├── runScript.ts
│   │       ├── controlComponent.ts
│   │       ├── goToUrl.ts
│   │       ├── navigateTo.ts
│   │       ├── copyToClipboard.ts
│   │       ├── setLocalStorage.ts
│   │       └── download.ts
│   │
│   ├── expression/              # 表达式引擎模块
│   │   ├── binding.ts          # 数据绑定解析
│   │   ├── variable.ts         # 变量解析（{{xxx}}）
│   │   ├── utils.ts            # 表达式工具
│   │   └── types.ts            # 表达式上下文
│   │
│   └── state/                   # 状态管理模块
│       ├── datasource.ts       # DataSourceStore
│       ├── formState.ts        # FormStateStore
│       └── api.ts              # API请求执行
│
└── package.json
```

### 2.2 @inuyasha/vue Vue绑定层

```
@inuyasha/vue/
├── src/
 │   ├── stores/                   # Pinia Stores (响应式层)
 │   │   ├── editor.ts           # useEditor - 包装 EditorStoreCore
 │   │   ├── component.ts        # useComponent - 组件元数据管理
 │   │   ├── dataSource.ts       # useDataSource - 数据源管理
 │   │   ├── formState.ts       # useFormState - 表单状态
 │   │   └── componentRegistry.ts # useComponentRegistry - 组件实例
│   │
│   ├── composables/             # 组合式API
│   │   ├── useExpressionContext.ts  # 表达式上下文
│   │   ├── useResolveBinding.ts     # 数据绑定解析
│   │   ├── useResolveVariablesInConfig.ts
│   │   ├── useExecuteEvent.ts        # 事件执行
│   │   ├── useSchemaRenderer.ts      # Schema渲染器
│   │   ├── useInuyasha.ts          # SDK统一入口
│   │   └── index.ts               # Composables导出
│   │
│   ├── utils/
│   │   └── componentRegistry.ts  # 组件工具函数
│   │
│   ├── sdk.ts                  # SDK核心实现
│   ├── plugin.ts               # Vue插件入口
│   └── config.ts               # Vue配置（PageRoot等）
└── package.json
```

@inuyasha/vue/
├── src/
│ ├── stores/ # Pinia Stores (响应式层)
│ │ ├── editor.ts # useEditorStore - 包装 EditorStoreCore
│ │ ├── component.ts # useComponentStore - 组件元数据管理
│ │ ├── dataSource.ts # useDataSourceStore - 数据源管理
│ │ ├── formState.ts # useFormStateStore - 表单状态
│ │ └── componentRegistry.ts # useComponentRegistry - 组件实例
│ │
│ ├── composables/ # 组合式API
│ │ ├── useExpressionContext.ts # 表达式上下文
│ │ ├── useResolveBinding.ts # 数据绑定解析
│ │ ├── useResolveVariablesInConfig.ts
│ │ ├── useExecuteEvent.ts # 事件执行
│ │ └── plugin.ts # Vue插件入口
│ │
│ ├── utils/
│ │ └── componentRegistry.ts # 组件工具函数
│ │
│ └── config.ts # Vue配置（PageRoot等）
│
└── package.json

```

### 2.3 App 应用层

```

app/
├── src/
│ ├── components/
│ │ ├── Editor/ # 编辑器组件
│ │ │ ├── Canvas.vue # 画布容器
│ │ │ ├── Toolbar.vue # 工具栏
│ │ │ ├── PropertyPanel/ # 属性面板
│ │ │ ├── LayersPanel.vue # 图层面板
│ │ │ ├── DataSourcePanel/ # 数据源面板
│ │ │ ├── ComponentPanel.vue # 组件库面板
│ │ │ ├── EditorComponentWrapper.vue
│ │ │ ├── SlotDropWrapper.vue
│ │ │ └── DebugPanel.vue
│ │ │
│ │ ├── Render/ # 渲染组件
│ │ │ ├── DynamicRenderer.vue # 动态渲染器（核心）
│ │ │ └── PreviewRenderer.vue # 预览渲染器
│ │ │
│ │ ├── Materials/ # 物料组件
│ │ │ ├── base/ # 基础组件
│ │ │ ├── layout/ # 布局组件
│ │ │ ├── data/ # 数据组件
│ │ │ └── form/ # 表单组件
│ │ │
│ │ └── ui/ # UI组件库
│ │ ├── input/
│ │ ├── select/
│ │ ├── dialog/
│ │ ├── form/
│ │ └── ...
│ │
│ ├── pages/
│ │ ├── editor/
│ │ │ └── index.vue # 编辑器主页
│ │ └── preview/
│ │ └── [id].vue # 预览页
│ │
│ └── types/ # 应用类型定义
│
└── package.json

```

## 3. 数据流架构

```

┌─────────────────────────────────────────────────────────────────┐
│ 数据流向图 │
└─────────────────────────────────────────────────────────────────┘

1. 用户交互层
   ├─ 拖拽组件 → EditorStore.addComponent()
   ├─ 编辑属性 → EditorStore.updateComponent()
   ├─ 删除组件 → EditorStore.deleteComponent()
   └─ 移动组件 → EditorStore.moveComponent()

   **使用方式：**

   ```typescript
   import { useEditor } from '@inuyasha/vue'
   const editor = useEditor()
   editor.addComponent(component)
   ```

2. 编辑器状态流
   EditorStoreCore (纯逻辑)
   ↓ (封装)
   Pinia Stores (响应式)
   ↓
   Vue组件 (渲染)

3. 数据绑定流
   ComponentSchema.props[key]
   ↓ (解析绑定)
   useResolveBinding()
   ↓ (查找上下文)
   ExpressionContext {
   ├─ editor.pageConfig
   ├─ dataSource.dataSources
   └─ formState.states
   }
   ↓
   resolveBinding() → 返回实际值

   **使用方式：**

   ```typescript
   import { useEditor, useDataSource, useFormState } from '@inuyasha/vue'
   const editor = useEditor()
   const dataSource = useDataSource()
   const formState = useFormState()
   ```

4. 事件执行流
   组件触发事件 (如 onClick)
   ↓
   handleEvent('onClick')
   ↓
   useExecuteEvent()
   ↓
   EventEngine.executeEvent()
   ↓ (按类型分发)
   ActionHandlers {
   ├─ executeShowMessage
   ├─ executeCallDataSource
   ├─ executeUpdateProperty
   ├─ executeRunScript
   ├─ executeControlComponent
   └─ ...
   }

5. 双向绑定流
   组件值变化 (v-model)
   ↓
   modelValueEvents
   ↓
   判断 storeInProps
   ├─ true → EditorStore.updateComponent()
   └─ false → FormStateStore.setComponentState()
   **使用方式：**
   ```typescript
   // FormState通过SDK自动管理
   import { useFormState } from '@inuyasha/vue'
   const formState = useFormState()
   ```

```

## 4. 组件生命周期

```

┌─────────────────────────────────────────────────────────────────┐
│ 组件生命周期流程 │
└─────────────────────────────────────────────────────────────────┘

1. 组件创建
   ComponentMeta (定义)
   ↓
   ComponentRegistry.registerComponent()
   ↓
   createComponent(meta)
   ↓
   ComponentSchema {
   ├─ id (nanoid)
   ├─ semanticId (如 button1)
   ├─ type
   ├─ props
   ├─ style
   └─ children
   }
   ↓
   EditorStore.addComponent()

2. 组件渲染
   PageConfig.rootComponent
   ↓
   DynamicRenderer (递归渲染)
   ├─ 解析 resolvedProps (处理数据绑定)
   ├─ 解析 resolvedStyle
   ├─ 动态事件绑定
   └─ 渲染子组件 (children/slots)

3. 组件交互
   用户操作
   ↓
   双向绑定更新
   ├─ storeInProps → props更新
   └─ !storeInProps → formState更新
   ↓
   触发 onValueChange 事件
   ↓
   执行事件绑定的 Actions

4. 组件销毁
   EditorStore.deleteComponent()
   ↓
   清理 formState
   ↓
   清理 componentRegistry

````

## 5. 类型系统

### 5.1 ComponentSchema (组件实例)

```typescript
interface ComponentSchema {
  id: string // 唯一ID
  semanticId: string // 语义化ID (button1, input2)
  type: ComponentType // 组件类型
  label: string // 显示标签
  props: ComponentProps // 属性配置
  style: ComponentStyle // 样式配置
  children?: ComponentSchema[] // 子组件
  events?: EventBinding[] // 事件绑定
}
````

### 5.2 ComponentMeta (组件定义)

```typescript
interface ComponentMeta {
  type: ComponentType // 组件类型
  name: string // 组件名称
  category: 'base' | 'layout' | 'data' | 'form'
  defaultProps: ComponentProps // 默认属性
  defaultStyle: ComponentStyle // 默认样式
  propsSchema: ComponentPropSchema[] // 属性schema
  canNest?: boolean // 是否可嵌套
  componentName?: string // Vue组件名
  triggers?: ComponentTrigger[] // 事件触发器
  slots?: ComponentSlot[] // 插槽定义
  methods?: ComponentMethod[] // 暴露方法
}
```

### 5.3 DataBinding (数据绑定)

```typescript
interface DataBinding {
  type: 'dataSource' | 'component' | 'static'
  dataSourceId?: string // 数据源ID
  componentId?: string // 组件ID
  path?: string // 数据路径
  value?: any // 静态值
}
```

### 5.4 EventBinding (事件绑定)

```typescript
interface EventBinding {
  id: string
  trigger: string // 触发器名称 (onClick等)
  actions?: ActionConfig[] // Action数组
}

interface ActionConfig {
  type: ActionType // Action类型
  config: ActionConfigType // Action配置
}

type ActionType =
  | 'updateProperty'
  | 'callDataSource'
  | 'showMessage'
  | 'runScript'
  | 'controlComponent'
  | 'goToUrl'
  | 'navigateTo'
  | 'copyToClipboard'
  | 'setLocalStorage'
  | 'download'
```

## 6. 核心设计原则

### 6.1 分层架构

- **Core层**: 纯逻辑、无框架依赖
- **Vue层**: Pinia响应式包装、Vue组件支持
- **App层**: 业务组件、UI实现

### 6.2 单向数据流

- 编辑器操作 → Store更新 → 组件重新渲染
- 数据绑定解析 → 上下文查找 → 值返回

### 6.3 组件驱动

- ComponentMeta定义组件行为
- ComponentSchema存储实例状态
- 动态渲染基于Schema

### 6.4 类型安全

- Zod定义所有类型
- 完整的TypeScript支持
- 编译时类型检查

### 6.5 可扩展性

- 组件注册机制
- Action处理器可扩展
- 数据源类型可扩展
