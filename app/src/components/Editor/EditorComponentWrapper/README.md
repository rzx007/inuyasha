
## 📁 目录结构

```
components/Editor/EditorComponentWrapper/
├── index.vue                      # 主组件（~100 行）
├── useComponentDragDrop.ts         # 拖拽/放置逻辑（~120 行）
├── useComponentOverlay.ts          # Overlay 定位逻辑（~40 行）
├── useComponentSelection.ts        # 选择/删除逻辑（~40 行）
└── ComponentOverlay.vue            # Overlay UI 组件（~60 行）
```

## ✨ 重构成果

### 1. **清晰的职责分离**

| 文件 | 职责 | 行数 |
|------|------|------|
| `index.vue` | 组合所有 hooks，渲染主组件 | ~100 |
| `useComponentSelection.ts` | 选择/删除操作 | ~40 |
| `useComponentOverlay.ts` | Overlay 位置计算 | ~40 |
| `useComponentDragDrop.ts` | 拖拽/放置逻辑 | ~120 |
| `ComponentOverlay.vue` | Overlay UI 渲染 | ~60 |

### 2. **代码优化对比**

| 指标 | 重构前 | 重构后 |
|------|--------|--------|
| 单文件行数 | ~345 行 | ~100 行（主组件） |
| 可维护性 | 低（混合职责） | 高（清晰分离） |
| 可测试性 | 低（难以测试） | 高（独立 hooks） |
| 可复用性 | 低（无法复用） | 高（hooks 可复用） |

### 3. **功能保持**

- ✅ 拖拽手柄
- ✅ 放置指示器
- ✅ 选中边框
- ✅ Overlay 跟随滚动
- ✅ 键盘/按钮删除
- ✅ 点击选择
- ✅ Teleport 到 body

### 4. **技术实现**

- 使用 `useElementBounding` 自动跟踪组件位置
- 监听 canvas-content 滚动事件
- 动态 z-index 计算
- 独立的 ComponentOverlay 组件
- 响应式 overlayRect 和 shouldShowOverlay
