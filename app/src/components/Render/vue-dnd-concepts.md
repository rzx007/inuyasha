# Vue3-DnD 概念和使用指南

## 概述

Vue3-DnD 是基于 React DnD 的 Vue 3 拖拽库，为 Vue 应用提供了强大的拖拽功能。本文档介绍其核心概念、API 使用方法和最佳实践。

## 核心概念

### 1. DnDProvider

`DndProvider` 是整个拖拽系统的根组件，它提供了拖拽上下文。

```html
<template>
  <DndProvider :backend="HTML5Backend">
    <!-- 你的拖拽应用 -->
  </DndProvider>
</template>

<script setup>
import { DndProvider } from 'vue3-dnd'
import { HTML5Backend } from 'react-dnd-html5-backend'
</script>
```

**作用**：

- 提供全局拖拽上下文
- 管理拖拽状态

### 2. 拖拽源 (Drag Source)

拖拽源是可以被拖拽的组件，通过 `useDrag` hook 创建。

```typescript
const [collected, dragSource, dragPreview] = useDrag(() => ({
  type: 'BOX', // 拖拽项类型
  item: { id: 'box1' }, // 传递的数据
  collect: monitor => ({
    isDragging: monitor.isDragging() // 收集拖拽状态
  })
}))
```

### 3. 拖拽目标 (Drop Target)

拖拽目标是可以接收拖拽项的组件，通过 `useDrop` hook 创建。

```typescript
const [collected, dropTarget] = useDrop(() => ({
  accept: ['BOX'], // 接受的拖拽类型
  drop: (item, monitor) => {
    // 处理放置逻辑
    console.log('Dropped item:', item)
  },
  collect: monitor => ({
    isOver: monitor.isOver(), // 是否悬停在目标上
    canDrop: monitor.canDrop() // 是否可以放置
  })
}))
```

### 4. 拖拽项类型 (Type)

每个拖拽项都有一个类型，用于区分不同的拖拽项。

```typescript
export const DndTypes = {
  COMPONENT: 'COMPONENT',
  EXISTING_COMPONENT: 'EXISTING_COMPONENT'
}
```

### 5. 拖拽项数据 (Item)

拖拽过程中传递的数据对象。

```typescript
interface DragItem {
  type: string
  id?: string
  meta?: ComponentMeta
  cloneFn?: Function
  display?: string
}
```

## API 详解

### useDrag Hook

#### 参数

```typescript
useDrag(spec: DragSpec | (() => DragSpec))
```

#### DragSpec 规格对象

| 属性             | 类型                                     | 必需 | 描述                   |
| ---------------- | ---------------------------------------- | ---- | ---------------------- |
| `type`           | `string \| symbol`                       | 是   | 拖拽项类型             |
| `item`           | `object \| () => object`                 | 是   | 拖拽项数据             |
| `collect`        | `(monitor: DragSourceMonitor) => object` | 否   | 收集函数，返回拖拽状态 |
| `previewOptions` | `object`                                 | 否   | 拖拽预览选项           |
| `options`        | `object`                                 | 否   | 拖拽选项               |
| `end`            | `(item, monitor) => void`                | 否   | 拖拽结束回调           |
| `canDrag`        | `boolean \| (monitor) => boolean`        | 否   | 是否可以拖拽           |
| `isDragging`     | `(monitor) => boolean`                   | 否   | 自定义拖拽状态判断     |
| `begin`          | `(monitor) => object \| null`            | 否   | 拖拽开始时返回拖拽项   |

#### 返回值

```typescript
const [collected, dragSource, dragPreview] = useDrag(spec)
```

- `collected`: `Ref<object>` - 收集函数返回的值
- `dragSource`: `(el, options?) => HTMLElement` - 拖拽源连接器
- `dragPreview`: `(el, options?) => HTMLElement` - 拖拽预览连接器

### useDrop Hook

#### 参数

```typescript
useDrop(spec: DropSpec | (() => DropSpec))
```

#### DropSpec 规格对象

| 属性      | 类型                                     | 必需 | 描述           |
| --------- | ---------------------------------------- | ---- | -------------- |
| `accept`  | `string \| symbol \| Array`              | 是   | 接受的拖拽类型 |
| `drop`    | `(item, monitor) => any`                 | 否   | 放置时回调     |
| `hover`   | `(item, monitor) => void`                | 否   | 悬停时回调     |
| `canDrop` | `(item, monitor) => boolean`             | 否   | 是否可以放置   |
| `collect` | `(monitor: DropTargetMonitor) => object` | 否   | 收集函数       |

#### 返回值

```typescript
const [collected, dropTarget] = useDrop(spec)
```

- `collected`: `Ref<object>` - 收集函数返回的值
- `dropTarget`: `(el, options?) => HTMLElement` - 拖拽目标连接器

## Monitor 对象

### DragSourceMonitor

拖拽源监听器，提供拖拽过程中的状态信息。

```typescript
interface DragSourceMonitor {
  canDrag(): boolean // 是否可以拖拽
  isDragging(): boolean // 是否正在拖拽
  getItemType(): string | symbol | null // 拖拽项类型
  getItem(): any // 拖拽项数据
  getDropResult(): any // 放置结果
  didDrop(): boolean // 是否已经放置
  getInitialClientOffset(): Point // 初始鼠标位置
  getInitialSourceClientOffset(): Point // 初始拖拽源位置
  getClientOffset(): Point // 当前鼠标位置
  getDifferenceFromInitialOffset(): Point // 偏移差
  getSourceClientOffset(): Point // 拖拽源当前位置
}
```

### DropTargetMonitor

拖拽目标监听器，提供放置目标的状态信息。

```typescript
interface DropTargetMonitor {
  canDrop(): boolean // 是否可以放置
  isOver(options?: { shallow: boolean }): boolean // 是否悬停
  getItemType(): string | symbol | null // 拖拽项类型
  getItem(): any // 拖拽项数据
  getDropResult(): any // 放置结果
  didDrop(): boolean // 是否已经放置
  getInitialClientOffset(): Point // 初始鼠标位置
  getInitialSourceClientOffset(): Point // 初始拖拽源位置
  getClientOffset(): Point // 当前鼠标位置
  getDifferenceFromInitialOffset(): Point // 偏移差
  getSourceClientOffset(): Point // 拖拽源当前位置
}
```

## 后端 (Backend)

### HTML5Backend

基于 HTML5 Drag and Drop API 的后端。

```typescript
import { HTML5Backend } from 'react-dnd-html5-backend'
```

**特点**：

- 支持所有主流浏览器
- 提供原生拖拽体验
- 支持文件拖拽

### TouchBackend

基于触摸事件的移动端后端。

```typescript
import { TouchBackend } from 'react-dnd-touch-backend'
```

**特点**：

- 优化移动端体验
- 支持触摸手势
- 可以与 HTML5Backend 结合使用

## 最佳实践

### 1. 类型定义

为拖拽项定义清晰的类型：

```typescript
export interface DragItem {
  type: string
  id?: string
  data?: any
}

export const DndTypes = {
  CARD: 'card',
  LIST: 'list'
} as const
```

### 2. 避免不必要的重渲染

使用 `useMemo` 或 `computed` 来优化收集函数：

```typescript
const collected = computed(() => ({
  isDragging: monitor.isDragging(),
  isOver: monitor.isOver()
}))
```

### 3. 性能优化

- 避免在 `hover` 回调中进行复杂计算
- 使用 `monitor.didDrop()` 防止重复处理
- 合理设置 `accept` 类型，避免不必要的监听

### 4. 错误处理

```typescript
const [collected, drop] = useDrop(() => ({
  accept: ['BOX'],
  drop: (item, monitor) => {
    try {
      // 处理放置逻辑
      handleDrop(item)
    } catch (error) {
      console.error('Drop error:', error)
    }
  }
}))
```

### 5. 清理资源

Vue3-DnD 会自动处理大部分清理工作，但确保：

- 在组件卸载前断开连接
- 避免内存泄漏

## 常见问题

### Q: 拖拽时出现 "Cannot have two HTML5 backends at the same time" 错误？

A: 确保整个应用只有一个 `DndProvider`。

### Q: 拖拽预览不正确？

A: 使用 `dragPreview` 连接器自定义预览：

```typescript
<div :ref="dragPreview" class="drag-preview">
  <!-- 自定义预览内容 -->
</div>
```

### Q: 如何实现多选拖拽？

A: 在 `item` 中传递多个 ID：

```typescript
item: {
  type: 'MULTI_SELECT',
  ids: ['item1', 'item2', 'item3']
}
```

### Q: 如何禁用拖拽？

A: 使用 `canDrag` 属性：

```typescript
const [collected, drag] = useDrag(() => ({
  type: 'BOX',
  item: { id },
  canDrag: computed(() => !isDisabled.value)
}))
```

## 调试技巧

### 启用调试模式

```typescript
// 在开发环境中启用
if (process.env.NODE_ENV === 'development') {
  window.__REDUX_DEVTOOLS_EXTENSION__?.()
}
```

### 监听拖拽事件

```typescript
const [collected, drop] = useDrop(() => ({
  accept: ['BOX'],
  hover: item => console.log('Hovering:', item),
  drop: item => console.log('Dropped:', item)
}))
```

### 检查拖拽状态

```typescript
const [collected] = useDrop(() => ({
  accept: ['BOX'],
  collect: monitor => ({
    isOver: monitor.isOver(),
    canDrop: monitor.canDrop(),
    itemType: monitor.getItemType(),
    item: monitor.getItem()
  })
}))
```

## 参考资源

- [Vue3-DnD 官方文档](https://www.vue3-dnd.com/)
- [React DnD 文档](https://react-dnd.github.io/react-dnd/)
- [HTML5 Drag and Drop API](https://developer.mozilla.org/en-US/docs/Web/API/HTML_Drag_and_Drop_API)

## 总结

Vue3-DnD 提供了一个强大而灵活的拖拽解决方案。通过理解核心概念（Provider、Drag Source、Drop Target）和合理使用 API，你可以构建出优秀的拖拽交互体验。记住始终关注性能和用户体验，在开发过程中进行充分的测试。
