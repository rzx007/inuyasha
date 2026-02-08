# 文档更新总结

## 更新日期

2026-02-08

## 更新原因

SDK 重构后，`@inuyasha/vue` 的调用方式从原始的 store 导入改为标准的 SDK 调用方式，需要更新所有相关文档以反映新的使用方式。

## 更新的文档

### 1. `/docs/WORKFLOW.md`

**更新内容：**

- 初始化流程中的 store 调用方式
  - `useEditorStore` → `useEditor`
  - `useComponentStore` → `useComponent`
  - `useDataSourceStore` → `useDataSource`
  - `useFormStateStore` → `useFormState`
  - `useComponentRegistry` → `useComponentRegistry`
- 所有 `editorStore.xxx()` 调用更新为 `editor.xxx()`
- 所有 `formStateStore.xxx()` 调用更新为 `formState.xxx()`
- 所有 `dataSourceStore.xxx()` 调用更新为 `dataSource.xxx()`

**受影响的流程：**

1. 编辑器初始化流程
2. 组件属性编辑流程
3. 数据绑定解析流程
4. 双向绑定更新流程
5. 事件绑定与执行流程
6. 组件移动与删除流程
7. 预览模式流程
8. 页面配置保存与加载

### 2. `/docs/ARCHITECTURE.md`

**更新内容：**

- `@inuyasha/vue` 包结构说明
  - 新增 `sdk.ts` - SDK核心实现
  - 更新 `composables/useInuyasha.ts` - SDK统一入口
  - Stores 命名更新（去掉 Store 后缀）
- App 层结构说明
  - 删除 `app/src/stores/` 目录说明（已迁移）
- 数据流架构说明
  - 更新所有 store 调用示例为新的 SDK 方式
  - 添加使用方式示例代码块

**受影响的章节：**

- 2.2 @inuyasha/vue Vue绑定层
- 2.3 App 应用层
- 3. 数据流架构
- 5. 双向绑定流

### 3. `/app/docs/drag-drop.md`

**更新内容：**

- 克隆函数示例更新为使用 `useEditor()`
- Drop 处理逻辑更新为使用 `editor.xxx()`
- 数据更新流程添加 SDK 使用方式示例
- 关键差异说明添加统一SDK调用的优势

**受影响的章节：**

- 拖拽源部分
- 拖拽目标部分
- 数据更新流程
- 关键差异说明

## 主要变化模式

### 1. 导入方式变化

```typescript
// 旧方式
import { useEditorStore } from '@/stores/editor'
import { useDataSourceStore } from '@/stores/dataSource'

// 新方式
import { useEditor, useDataSource } from '@inuyasha/vue'
```

### 2. 变量命名变化

```typescript
// 旧方式
const editorStore = useEditorStore()
const dataSourceStore = useDataSourceStore()

// 新方式
const editor = useEditor()
const dataSource = useDataSource()
```

### 3. 方法调用变化

```typescript
// 旧方式
editorStore.updateComponent(id, { props })
editorStore.setPageConfig(config)

// 新方式
editor.updateComponent(id, { props })
editor.setPageConfig(config)
```

## 新增文档内容

### SDK使用示例

在更新过程中添加了完整的使用示例代码块，帮助开发者快速上手新的SDK调用方式。

```typescript
import {
  useEditor,
  useDataSource,
  useFormState,
  useComponent,
  useComponentRegistry
} from '@inuyasha/vue'

const editor = useEditor()
const dataSource = useDataSource()
const formState = useFormState()
const component = useComponent()
const componentRegistry = useComponentRegistry()
```

## 验证清单

- [x] 所有 `useXXXStore` 替换为 `useXXX`
- [x] 所有 `editorStore` 变量名替换为 `editor`
- [x] 所有 `formStateStore` 变量名替换为 `formState`
- [x] 所有 `dataSourceStore` 变量名替换为 `dataSource`
- [x] 所有 `componentStore` 变量名替换为 `component`
- [x] 所有 `componentRegistryStore` 变量名替换为 `componentRegistry`
- [x] 更新包结构说明
- [x] 添加SDK使用示例
- [x] 验证文档一致性

## 相关文档

- [MIGRATION_GUIDE.md](../MIGRATION_GUIDE.md) - 详细的迁移指南
- [SDK_IMPROVEMENTS.md](../SDK_IMPROVEMENTS.md) - SDK改进总结
- [QUICK_START.md](../QUICK_START.md) - 快速开始
- [SDK_README.md](../packages/vue/SDK_README.md) - SDK使用文档
- [app/MIGRATION_SUMMARY.md](../app/MIGRATION_SUMMARY.md) - 应用迁移总结

## 更新后的优势

1. **更清晰的文档** - SDK调用方式统一，文档更易理解
2. **更好的示例** - 添加了完整的使用示例代码块
3. **减少混淆** - 去掉了不一致的命名和调用方式
4. **符合标准** - 文档和代码使用方式保持一致
5. **易于维护** - 统一的API，文档更新更简单

## 后续建议

1. 考虑添加更多实战案例到文档中
2. 更新 README.md 添加 SDK 介绍
3. 创建 API 参考文档
4. 添加视频教程链接
5. 建立文档版本管理系统
