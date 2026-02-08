# Component vs ComponentRegistry 职责说明

## 核心区别

### `component.ts` (useComponent)

**职责：管理组件元数据（ComponentMeta）- 组件定义**

**类比：** 组件目录 / 组件库手册

### `componentRegistry.ts` (useComponentRegistry)

**职责：管理组件实例（Component Instance）- 运行时实例**

**类比：** 组件实例管理器 / 组件引用表

---

## 详细对比

### 1. component.ts (组件元数据管理)

#### 存储内容

```typescript
interface ComponentMeta {
  type: ComponentType // 组件类型（如 'ZButton'）
  name: string // 组件名称（如 '按钮'）
  category: 'form' | 'layout' // 组件分类
  defaultProps: ComponentProps // 默认属性
  defaultStyle: ComponentStyle // 默认样式
  propsSchema: PropSchema[] // 属性schema定义
  triggers: Trigger[] // 事件触发器（onClick, onChange）
  slots: Slot[] // 插槽定义
  methods: Method[] // 暴露的方法
  componentName: string // Vue组件名
  canNest: boolean // 是否可嵌套
}
```

#### 主要功能

- **注册组件元数据**：`registerComponent(meta)`
- **批量注册**：`registerComponents(metas)`
- **查询组件定义**：`getComponentMeta(type)`
- **按分类获取**：`getComponentsByCategory(category)`
- **获取所有组件**：`getAllComponents()`

#### 使用场景

```typescript
// 1. 应用启动时注册组件
const component = useComponent()
component.registerComponents([
  { type: 'ZButton', name: '按钮', category: 'form', ... },
  { type: 'ZInput', name: '输入框', category: 'form', ... }
])

// 2. 创建新组件实例时查找定义
const meta = component.getComponentMeta('ZButton')
// 获取组件的 propsSchema、triggers 等定义

// 3. 组件库面板显示所有可用组件
const categorizedComponents = component.getCategorizedComponents
// 返回：{ form: [...], layout: [...], ... }
```

#### 数据流

```
应用启动
  ↓
注册所有 ComponentMeta
  ↓
ComponentPanel 读取 getCategorizedComponents
  ↓
显示组件库列表（按钮、输入框、布局等）
```

---

### 2. componentRegistry.ts (组件实例管理)

#### 存储内容

```typescript
// 组件ID -> Vue组件实例的映射
{
  "comp-abc123": VueComponentInstance<ZButton>,
  "comp-def456": VueComponentInstance<ZInput>,
  ...
}
```

#### 主要功能

- **注册实例**：`register(id, instance)`
- **注销实例**：`unregister(id)`
- **获取实例**：`getComponent(id)`

#### 使用场景

```typescript
// 1. 组件挂载时注册实例
onMounted(() => {
  componentRegistry.register(componentId, componentRef.value)
})

// 2. 组件卸载时注销实例
onUnmounted(() => {
  componentRegistry.unregister(componentId)
})

// 3. 事件执行时调用组件方法
const Action: controlComponent = context => {
  const component = componentRegistry.getComponent(componentId)
  component?.focus() // 调用组件的 focus 方法
  component?.reset() // 调用组件的 reset 方法
}
```

#### 数据流

```
DynamicRenderer 渲染组件
  ↓
组件 onMounted
  ↓
componentRegistry.register(id, instance)
  ↓
用户触发事件（如点击按钮）
  ↓
EventEngine 执行 controlComponent action
  ↓
componentRegistry.getComponent(id)
  ↓
调用组件的方法（如 focus、reset）
```

---

## 实际使用示例

### 场景：拖拽添加一个按钮组件

```typescript
// 1. 从组件库拖拽按钮
// component.ts 提供组件定义
const component = useComponent()
const buttonMeta = component.getComponentMeta('ZButton')
// buttonMeta = { type: 'ZButton', name: '按钮', ... }

// 2. 创建组件实例（使用组件定义）
import { createComponent } from '@/utils/componentRegistry'
const buttonSchema = createComponent('ZButton', overrides, existingComponents)
// buttonSchema = { id: 'btn-123', type: 'ZButton', props: {...}, ... }

// 3. 添加到画布
const editor = useEditor()
editor.addComponent(buttonSchema)

// 4. DynamicRenderer 渲染组件
// DynamicRenderer.vue
onMounted(() => {
  // componentRegistry.ts 注册运行时实例
  componentRegistry.register(buttonSchema.id, buttonComponentRef.value)
})
```

### 场景：点击按钮触发事件

```typescript
// 用户点击按钮，触发 onClick 事件
// EventConfig: controlComponent
{
  type: 'controlComponent',
  config: {
    componentId: 'input-456',
    method: 'focus'
  }
}

// EventEngine 执行事件
function executeControlComponent(config) {
  // componentRegistry.ts 查找运行时实例
  const targetComponent = componentRegistry.getComponent(config.componentId)

  if (targetComponent && targetComponent[config.method]) {
    // 调用组件实例的方法
    targetComponent[config.method](...args)
    // 例如：targetComponent.focus()
  }
}
```

---

## 总结对比表

| 维度            | component.ts                     | componentRegistry.ts           |
| --------------- | -------------------------------- | ------------------------------ |
| **管理对象**    | ComponentMeta（组件定义）        | Component Instance（组件实例） |
| **数据类型**    | 静态配置数据                     | 动态运行时对象                 |
| **存储内容**    | 组件类型、属性schema、事件触发器 | Vue组件实例引用                |
| **主要用途**    | 组件库显示、创建组件实例         | 运行时方法调用、实例管理       |
| **生命周期**    | 应用启动时注册                   | 组件挂载/卸载时注册/注销       |
| **更新频率**    | 低（通常不变）                   | 高（随组件渲染变化）           |
| **查询方式**    | 按类型、分类查询                 | 按ID精确查询                   |
| **类比**        | 组件目录/产品手册                | 运行时实例表/电话簿            |
| **Pinia Store** | useComponent                     | useComponentRegistry           |

---

## 为什么分离设计？

### 1. 单一职责原则

- `component.ts`：专注于组件定义（Meta）
- `componentRegistry.ts`：专注于运行时实例（Instance）

### 2. 性能优化

- ComponentMeta：静态数据，查询高效
- Component Instance：动态数据，按ID精确查找

### 3. 清晰的职责边界

- 组件定义：不需要知道运行时状态
- 组件实例：不需要知道组件的详细定义

### 4. 易于扩展

- 添加新组件：只需注册 ComponentMeta
- 事件系统：通过 componentRegistry 调用实例方法

### 5. 类型安全

- ComponentMeta：提供完整的组件定义类型
- Component Instance：动态类型，运行时检查

---

## 常见问题

### Q1: 为什么不合并成一个 store？

A: 因为职责不同：

- ComponentMeta：静态定义，应用级别
- Component Instance：动态实例，组件级别

合并会导致：

- 数据类型混杂
- 职责不清
- 性能问题（存储大量实例）

### Q2: 什么时候使用哪个？

A:

- 使用 `component` (useComponent)：
  - 创建新组件实例
  - 显示组件库
  - 查询组件定义

- 使用 `componentRegistry` (useComponentRegistry)：
  - 管理组件生命周期（挂载/卸载）
  - 事件系统调用组件方法
  - 运行时查找组件实例

### Q3: 它们如何协同工作？

A:

```
component (ComponentMeta) → 创建 ComponentSchema → DynamicRenderer 渲染
                                                              ↓
                                        componentRegistry 注册实例
                                                              ↓
                                        事件系统查找实例并调用方法
```
