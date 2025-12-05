## 拖拽渲染逻辑详解

### 整体架构

流程分为三个阶段：

1. 组件面板（ComponentPanel）— 拖拽源
2. 画布（Canvas）— 拖拽目标
3. 组件注册系统（componentRegistry）— 组件创建与 ID 生成

---

### 1. 组件面板（ComponentPanel.vue）— 拖拽源

#### 关键配置

```vue
<VueDraggable
  v-model="baseComponents"
  :sort="false"                    // 禁止排序（组件库不需要排序）
  :group="{ name: 'components', pull: 'clone', put: false }"
  :clone="cloneComponent"          // 克隆函数
  item-key="type"
>
```

- `group: { name: 'components' }`：与画布使用同一组名，允许跨区域拖拽
- `pull: 'clone'`：拖出时克隆，原列表不变
- `put: false`：不允许放入，组件库只作为源
- `sort: false`：禁止排序

#### 克隆函数

```typescript
function cloneComponent(meta: ComponentMeta) {
  const existingComponents = editorStore.pageConfig.components
  return createComponent(meta.type, undefined, existingComponents)
}
```

作用：将 `ComponentMeta` 转换为 `ComponentSchema`（实例），并生成唯一 ID 和语义化 ID。

---

### 2. 画布（Canvas.vue）— 拖拽目标

#### 关键配置

```vue
<VueDraggable
  v-model="components"
  group="components"              // 与组件面板同组
  :animation="200"
  handle=".drag-handle"           // 拖拽手柄
  item-key="id"
>
```

- `group="components"`：接收来自组件面板的拖拽
- `v-model="components"`：双向绑定，拖入后自动更新列表
- `handle=".drag-handle"`：仅通过手柄拖拽（用于排序）

#### 数据绑定

```typescript
const components = computed({
  get: () => editorStore.pageConfig.components,
  set: value => {
    editorStore.setPageConfig({
      ...editorStore.pageConfig,
      components: value,
      updatedAt: Date.now()
    })
  }
})
```

拖入后，`VueDraggable` 自动调用 `set`，更新 store。

---

### 3. 组件注册系统（componentRegistry.ts）— 核心逻辑

#### 3.1 创建组件实例

```typescript
export function createComponent(
  type: ComponentType,
  overrides?: Partial<ComponentSchema>,
  existingComponents: ComponentSchema[] = []
): ComponentSchema | null
```

流程：

1. 从 store 获取 `ComponentMeta`
2. 生成语义化 ID（如 `button1`, `button2`）
3. 生成唯一 ID（`nanoid()`）
4. 合并默认 props/style
5. 若支持嵌套，初始化 `children` 数组

#### 3.2 语义化 ID 生成

```typescript
export function generateSemanticId(
  type: ComponentType,
  existingComponents: ComponentSchema[]
): string
```

逻辑：

- 递归收集所有组件（含嵌套）
- 统计同类型组件数量
- 生成 `{type}{number}`，如 `button1`, `input2`

示例：

- 第一个按钮 → `button1`
- 第二个按钮 → `button2`
- 第一个输入框 → `input1`

#### 3.3 递归收集组件

```typescript
function collectAllComponents(components: ComponentSchema[]): ComponentSchema[]
```

用于统计嵌套组件，确保 ID 唯一。

---

### 完整拖拽流程

```bash
用户操作：从组件面板拖拽一个按钮组件
    ↓
1. ComponentPanel 触发 cloneComponent(meta)
    ↓
2. cloneComponent 调用 createComponent(meta.type, ...)
    ↓
3. createComponent 执行：
   - 获取 ComponentMeta（包含默认配置）
   - 调用 generateSemanticId() 生成 "button1"
   - 生成唯一 ID（nanoid）
   - 创建 ComponentSchema 实例
    ↓
4. VueDraggable 将克隆的 ComponentSchema 传递给 Canvas
    ↓
5. Canvas 的 VueDraggable 接收组件
    ↓
6. v-model 自动更新 components computed
    ↓
7. computed 的 setter 更新 editorStore.pageConfig.components
    ↓
8. 画布重新渲染，显示新组件
```

---

### 关键设计点

1. 克隆模式：组件库使用 `pull: 'clone'`，原列表不变
2. 统一组名：`group="components"` 实现跨区域拖拽
3. 双重 ID：
   - `id`：唯一标识（nanoid）
   - `semanticId`：语义化标识（`button1`），便于调试
4. 响应式更新：通过 computed 的 getter/setter 同步到 store
5. 嵌套支持：递归收集组件，确保嵌套场景下 ID 唯一

---

### 数据流转

```bash
ComponentMeta (元数据)
    ↓ cloneComponent()
ComponentSchema (实例)
    ↓ VueDraggable 传递
Canvas components[]
    ↓ v-model 更新
editorStore.pageConfig.components
    ↓ 响应式更新
UI 重新渲染
```

该设计实现了组件库到画布的拖拽创建，并保持数据一致性和唯一性。
