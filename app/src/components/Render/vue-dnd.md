# Vue3-DnD 拖拽逻辑完整整理

## 概述

整个拖拽系统基于 `vue3-dnd` + `react-dnd-html5-backend`，实现了从组件面板到画布的完整拖拽流程，包括新组件添加、组件排序和跨容器移动。

## 1. 核心类型定义

### `types/dnd.ts`

```typescript
export const DndTypes = {
  COMPONENT: 'COMPONENT', // 新组件（从面板拖入）
  EXISTING_COMPONENT: 'EXISTING_COMPONENT' // 已存在组件（用于排序）
}

export interface DragItem {
  type: string
  id?: ComponentId // 已存在组件的 ID
  index?: number // 当前索引
  meta?: ComponentMeta // 新组件的元数据
  cloneFn?: (meta: ComponentMeta) => ComponentSchema // 克隆函数
  parentId?: ComponentId // 父容器 ID (用于跨容器拖拽)
  display?: string // 组件显示类型 (block/inline-block)
}
```

## 2. 组件面板 - 拖拽源 (ComponentPanel.vue)

### 拖拽源设置

```typescript
const [collected, dragSource] = useDrag(() => ({
  type: DndTypes.COMPONENT,
  item: { 
    type: DndTypes.COMPONENT, 
    meta: props.meta,
    cloneFn: cloneComponent,
    display: props.meta.display // 传递组件显示类型
  },
  collect: (monitor) => ({
    isDragging: monitor.isDragging(),
  }),
}))
```

### 克隆函数

```typescript
function cloneComponent(meta: ComponentMeta) {
  const rootComponent = editorStore.pageConfig.rootComponent
  const existingComponents = rootComponent.children || []
  return createComponent(meta.type, undefined, existingComponents)
}
```

## 3. 组件包装器 - 拖拽源和目标 (EditorComponentWrapper.vue)

### 拖拽源设置 (用于排序)

```typescript
const [dragCollected, dragSource, dragPreview] = useDrag({
  type: DndTypes.EXISTING_COMPONENT,
  item: () => ({
    type: DndTypes.EXISTING_COMPONENT,
    id: props.schema.id,
    index: props.index,
    parentId: props.parentId,
    display: displayType.value // 传递组件显示类型
  }),
  collect: (monitor) => ({
    isDragging: monitor.isDragging(),
  }),
})
```

### 拖拽目标设置 (用于接收放置)

```typescript
const [dropCollected, dropTarget] = useDrop<DragItem, unknown, { isOver: boolean }>({
  accept: [DndTypes.COMPONENT, DndTypes.EXISTING_COMPONENT],
  hover(item, monitor) {
    // 计算插入位置并设置视觉指示器
    const isInlineSort = item.display === 'inline-block' && displayType.value === 'inline-block'
    
    if (isInlineSort) {
      const hoverMiddleX = (hoverRect.right - hoverRect.left) / 2
      const hoverClientX = clientOffset.x - hoverRect.left
      indicatorPosition.value = hoverClientX < hoverMiddleX ? 'left' : 'right'
    } else {
      const hoverMiddleY = (hoverRect.bottom - hoverRect.top) / 2
      const hoverClientY = clientOffset.y - hoverRect.top
      indicatorPosition.value = hoverClientY < hoverMiddleY ? 'top' : 'bottom'
    }

    // 同容器即时排序逻辑
    if (item.type === DndTypes.EXISTING_COMPONENT && item.parentId === props.parentId) {
      // 只有当确实跨越中点时才触发移动
      const isAfter = isInlineSort ? indicatorPosition.value === 'right' : indicatorPosition.value === 'bottom'
      if (dragIndex < hoverIndex && !isAfter) return
      if (dragIndex > hoverIndex && isAfter) return
      
      editorStore.moveComponent(dragId, props.parentId, hoverIndex, slotName)
      item.index = hoverIndex
    }
  },
  drop(item, monitor) {
    indicatorPosition.value = null // 重置指示器
    
    // 重新计算插入位置
    let targetIndex = props.index !== undefined ? props.index : 0
    const isAfter = // 根据光标位置计算
    if (isAfter) targetIndex += 1

    // 处理新组件添加
    if (item.type === DndTypes.COMPONENT) {
      const newComponent = cloneFn(meta)
      if (props.schema.props?._slot) {
        newComponent.props._slot = props.schema.props._slot
      }
      editorStore.addComponent(newComponent, props.parentId, targetIndex)
    }

    // 处理组件移动
    if (item.type === DndTypes.EXISTING_COMPONENT) {
      editorStore.moveComponent(draggedId, props.parentId, targetIndex, slotName)
      item.parentId = props.parentId
      item.index = targetIndex
    }
  },
  collect: (monitor) => ({
    isOver: monitor.isOver({ shallow: true }),
  })
})
```

### 视觉指示器

```vue
<!-- 拖拽位置指示器 -->
<div v-if="dropCollected.isOver && indicatorPosition === 'top'" 
     class="absolute top-0 left-0 right-0 h-0.5 bg-blue-500 z-50 pointer-events-none"></div>
<div v-if="dropCollected.isOver && indicatorPosition === 'bottom'" 
     class="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-500 z-50 pointer-events-none"></div>
<div v-if="dropCollected.isOver && indicatorPosition === 'left'" 
     class="absolute top-0 bottom-0 left-0 w-0.5 bg-blue-500 z-50 pointer-events-none"></div>
<div v-if="dropCollected.isOver && indicatorPosition === 'right'" 
     class="absolute top-0 bottom-0 right-0 w-0.5 bg-blue-500 z-50 pointer-events-none"></div>
```

## 4. 动态渲染器 - 容器拖拽目标 (DynamicRenderer.vue)

### DropTargetArea 组件

```typescript
const DropTargetArea = defineComponent({
  props: {
    slotName: { type: String, default: undefined },
    customClass: { type: [String, Object, Array], default: '' },
    list: { type: Array, default: () => [] }
  },
  setup(props, { slots }) {
    const [collected, drop] = useDrop(() => ({
      accept: [DndTypes.COMPONENT, DndTypes.EXISTING_COMPONENT],
      drop: (item: DragItem, monitor) => handleDrop(item, monitor, props.slotName),
      collect: (monitor) => ({
        isOver: monitor.isOver({ shallow: true }),
        canDrop: monitor.canDrop(),
      }),
    }))

    return () => h('div', {
      ref: drop,
      class: [
        props.customClass,
        collected.value.isOver ? 'ring-2 ring-primary ring-inset bg-primary/5' : ''
      ]
    }, [
      slots.default ? slots.default() : null,
      slots.footer ? slots.footer() : null
    ])
  }
})
```

### 处理函数

```typescript
function handleDrop(item: DragItem, monitor: DropTargetMonitor, slotName?: string) {
  if (monitor.didDrop()) return // 防止嵌套组件重复处理

  if (item.type === DndTypes.COMPONENT) {
    const newComponent = cloneFn(meta)
    if (slotName) {
      newComponent.props._slot = slotName
    }
    editorStore.addComponent(newComponent, props.schema.id) // 追加到容器末尾
  }

  if (item.type === DndTypes.EXISTING_COMPONENT) {
    editorStore.moveComponent(draggedId, props.schema.id, undefined, slotName) // 追加到容器末尾
  }
}
```

## 5. 编辑器 Store - 数据管理 (editor.ts)

### 添加组件

```typescript
function addComponent(component: ComponentSchema, parentId?: ComponentId, index?: number) {
  if (parentId) {
    const parent = findComponentInTree(parentId)
    if (parent && parent.children) {
      if (typeof index === 'number' && index >= 0 && index <= parent.children.length) {
        parent.children.splice(index, 0, component)
      } else {
        parent.children.push(component)
      }
    }
  } else {
    // 添加到 PageRoot
    const children = pageConfig.value.rootComponent.children
    if (typeof index === 'number' && index >= 0 && index <= children.length) {
      children.splice(index, 0, component)
    } else {
      children.push(component)
    }
  }
  pageConfig.value.updatedAt = Date.now()
}
```

### 移动组件

```typescript
function moveComponent(
  dragId: ComponentId,
  targetParentId: ComponentId,
  targetIndex?: number,
  slotName?: string
) {
  const component = findComponentInTree(dragId)
  const targetParent = findComponentInTree(targetParentId)

  // 合法性检查
  if (dragId === targetParentId) return
  if (isDescendant(dragId, targetParentId)) {
    console.warn('Cannot move component into its own descendant')
    return
  }

  // 获取原位置信息
  const result = findComponentParent(dragId, root.children)
  const oldIndex = result?.index
  const oldParentId = result?.parent?.id || root.id

  // 从原位置移除
  removeComponentById(dragId, root.children)

  // 更新组件属性 (slot)
  if (slotName) {
    component.props._slot = slotName
  } else {
    delete component.props._slot
  }

  // 插入到新位置
  if (!targetParent.children) targetParent.children = []
  
  let finalIndex = targetIndex !== undefined ? targetIndex : targetParent.children.length
  
  // 同容器排序时的索引修正
  if (oldParentId === targetParentId && oldIndex !== -1 && oldIndex < finalIndex) {
    finalIndex--
  }

  targetParent.children.splice(finalIndex, 0, component)
  pageConfig.value.updatedAt = Date.now()
}
```

## 6. 拖拽流程总结

### 新组件添加流程

1. 用户从组件面板拖拽组件卡片
2. `ComponentPanel` 的 `useDrag` 传递组件元数据和克隆函数
3. `EditorComponentWrapper` 的 `useDrop` 接收，调用 `cloneFn` 创建新组件实例
4. `editorStore.addComponent` 在指定位置插入组件

### 组件排序流程

1. 用户拖拽画布中的组件
2. `EditorComponentWrapper` 的 `useDrag` 传递组件ID和当前位置
3. `hover` 回调实时计算插入位置并显示指示器
4. 同容器排序时 `hover` 直接调用 `moveComponent` 实现实时反馈
5. 跨容器或最终落点时 `drop` 回调处理移动

### 关键特性

- **防止重复处理**：使用 `monitor.didDrop()` 避免嵌套组件重复响应
- **智能视觉反馈**：根据组件 `display` 类型显示不同方向的插入线
- **实时排序**：同容器内支持鼠标悬停时的即时排序
- **插槽支持**：组件可拖入不同插槽，自动设置 `_slot` 属性
- **类型安全**：完整的 TypeScript 类型定义和泛型使用

## 7. 视觉反馈细节

- **拖拽中**：组件透明度设为 50%，显示正在拖拽
- **悬停时**：显示蓝色插入线指示插入位置
  - `inline-block` 组件之间：左右垂直线
  - 其他情况：上下水平线
- **选中状态**：蓝色边框高亮
- **空状态**：显示占位符文本

这样的设计确保了拖拽操作既直观又高效，用户能够清楚地知道组件会被放置在哪里。
