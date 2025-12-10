## 拖拽渲染逻辑详解 (Vue3-DnD 版)

### 整体架构

流程分为三个阶段：

1. 组件面板（ComponentPanel）— 拖拽源 (Drag Source)
2. 画布（Canvas/DynamicRenderer）— 拖拽目标 (Drop Target)
3. 组件注册系统（componentRegistry）— 组件创建与 ID 生成
4. 编辑器状态管理（EditorStore）— 数据更新的核心

---

### 1. 组件面板（ComponentPanel.vue）— 拖拽源

#### 关键配置

使用 `vue3-dnd` 的 `useDrag` Hook：

```typescript
const [collected, dragSource] = useDrag(() => ({
  type: DndTypes.COMPONENT, // 类型标识：新组件
  item: { 
    type: DndTypes.COMPONENT, 
    meta: props.meta,
    cloneFn: cloneComponent // 传递克隆函数，在 Drop 时调用
  },
  collect: (monitor) => ({
    isDragging: monitor.isDragging(),
  }),
}))
```

- **Drag Source**: 每个组件卡片都是一个拖拽源。
- **Payload**: 携带 `ComponentMeta` 和 `cloneFn`。

#### 克隆函数

```typescript
function cloneComponent(meta: ComponentMeta) {
  const rootComponent = editorStore.pageConfig.rootComponent
  const existingComponents = rootComponent.children || []
  return createComponent(meta.type, undefined, existingComponents)
}
```

---

### 2. 画布（DynamicRenderer.vue）— 拖拽目标

#### 关键配置

使用 `vue3-dnd` 的 `useDrop` Hook：

```typescript
const [collected, drop] = useDrop(() => ({
  accept: [DndTypes.COMPONENT, DndTypes.EXISTING_COMPONENT], // 接收新组件和已有组件
  drop: (item: DragItem, monitor) => handleDrop(item, monitor, props.slotName),
  collect: (monitor) => ({
    isOver: monitor.isOver(),
    canDrop: monitor.canDrop(),
  }),
}))
```

#### Drop 处理逻辑

`handleDrop` 函数负责处理放置事件：

1. **新组件 (COMPONENT)**:
   - 调用 `cloneFn(meta)` 创建新实例
   - 调用 `editorStore.updateComponent` 将其添加到 `children`

2. **已有组件 (EXISTING_COMPONENT)**:
   - 调用 `editorStore.moveComponent(dragId, targetParentId, ...)`
   - 实现跨容器移动或同容器排序

---

### 3. 组件排序与移动

为了支持排序，每个画布中的组件（`EditorComponentWrapper`）同时也是 **拖拽源**：

```typescript
// EditorComponentWrapper.vue
const [dragCollected, dragSource] = useDrag({
  type: DndTypes.EXISTING_COMPONENT,
  item: () => ({
    type: DndTypes.EXISTING_COMPONENT,
    id: props.schema.id,
    index: props.index,
    parentId: props.parentId
  })
})
```

当组件被拖拽到新的容器（DropTargetArea）时，触发 `moveComponent`。

---

### 4. 数据更新流程

```bash
用户操作：从组件面板拖拽一个按钮组件到画布 PageRoot
    ↓
1. ComponentPanel (Drag Source) 开始拖拽
    ↓
2. 拖拽进入 DynamicRenderer (Drop Target)
   - Visual Feedback: 显示高亮边框 (isOver)
    ↓
3. 用户释放鼠标 (Drop)
    ↓
4. DynamicRenderer 执行 handleDrop
   - 识别为 DndTypes.COMPONENT
   - 执行 cloneFn -> createComponent -> 生成唯一 ID
    ↓
5. 调用 editorStore.updateComponent
   - 更新 PageRoot 的 children 数组
    ↓
6. Store 更新触发响应式重新渲染
```

### 关键差异 (vs vue-draggable-plus)

1. **手动控制**: 不再依赖 `v-model` 自动同步 DOM 和数据，而是显式调用 Store 方法。
2. **数据源单一**: 所有状态变更必须通过 `EditorStore`，避免了组件内部直接修改 props 的副作用。
3. **更细粒度的事件**: 可以精确控制 `canDrag`, `canDrop`, `hover` 等行为。
