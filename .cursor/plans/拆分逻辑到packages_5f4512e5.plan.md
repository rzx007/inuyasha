---
name: 拆分逻辑到packages
overview: 将 app/src 中的业务逻辑按职责拆分为多个独立的 packages，提高代码复用性和可维护性
todos:
  - id: create-core-package
    content: 创建 @inuyasha/core 包，迁移所有类型定义（types/ 目录下的所有文件）
    status: completed
  - id: create-component-package
    content: 创建 @inuyasha/component 包，迁移组件注册、创建、树操作逻辑
    status: completed
  - id: create-expression-package
    content: 创建 @inuyasha/expression 包，迁移表达式引擎和数据绑定解析逻辑
    status: completed
  - id: create-state-package
    content: 创建 @inuyasha/state 包，迁移数据源管理和表单状态管理逻辑
    status: completed
  - id: create-event-package
    content: 创建 @inuyasha/event 包，迁移事件执行引擎逻辑
    status: completed
  - id: create-editor-package
    content: 创建 @inuyasha/editor 包，迁移编辑器核心逻辑
    status: completed
  - id: update-utils-package
    content: 更新 @inuyasha/utils 包，添加 iconMapping 等工具函数
    status: completed
  - id: migrate-app-imports
    content: 更新 app 中的导入路径，使用新的 packages
    status: completed
  - id: update-package-configs
    content: 更新所有包的 package.json、tsconfig.json 和依赖关系
    status: completed
---

# 拆分逻辑到 Packages 计划

## 当前项目结构分析

项目是一个低代码可视化编辑器，主要包含以下核心模块：

1. **组件系统** - 组件注册、创建、树操作 (`stores/component.ts`, `utils/componentRegistry.ts`, `utils/tree.ts`)
2. **编辑器核心** - 页面配置、组件选择、拖拽 (`stores/editor.ts`)
3. **状态管理** - 数据源管理 (`stores/dataSource.ts`) + 表单状态管理 (`stores/formState.ts`)
4. **事件系统** - 事件绑定、动作执行 (`utils/eventEngine.ts`)
5. **表达式引擎** - 数据绑定、变量解析 (`utils/expressionEngine.ts`)
6. **类型定义** - 所有类型定义 (`types/`)

## 拆分方案

### 1. @inuyasha/core - 核心类型和基础接口

**位置**: `packages/core/`

**职责**:

- 所有类型定义（从 `app/src/types/` 迁移）
- 基础接口和枚举
- 共享常量

**文件结构**:

```
packages/core/
├── src/
│   ├── types/
│   │   ├── component.ts
│   │   ├── editor.ts
│   │   ├── event.ts
│   │   ├── dataSource.ts
│   │   └── index.ts
│   └── index.ts
├── package.json
└── tsconfig.json
```

**依赖**: 无

---

### 2. @inuyasha/component - 组件系统

**位置**: `packages/component/`

**职责**:

- 组件注册逻辑 (`stores/component.ts` → `src/registry.ts`)
- 组件创建和验证 (`utils/componentRegistry.ts` → `src/factory.ts`)
- 组件树操作 (`utils/tree.ts` → `src/tree.ts`)
- 组件实例注册表 (`stores/componentRegistry.ts` → `src/instanceRegistry.ts`)

**文件结构**:

```
packages/component/
├── src/
│   ├── registry.ts          # 组件元信息注册
│   ├── factory.ts            # 组件创建和验证
│   ├── tree.ts              # 树操作工具
│   ├── instanceRegistry.ts  # 组件实例注册表
│   └── index.ts
├── package.json
└── tsconfig.json
```

**依赖**: `@inuyasha/core`, `nanoid`

---

### 3. @inuyasha/expression - 表达式引擎

**位置**: `packages/expression/`

**职责**:

- 数据绑定解析 (`utils/expressionEngine.ts` → `src/binding.ts`)
- 变量解析 (`utils/expressionEngine.ts` → `src/variable.ts`)
- 表达式工具 (`packages/utils/expression.ts` → 合并到此包)

**文件结构**:

```
packages/expression/
├── src/
│   ├── binding.ts           # 数据绑定解析
│   ├── variable.ts          # 变量解析
│   ├── utils.ts             # 表达式工具函数
│   └── index.ts
├── package.json
└── tsconfig.json
```

**依赖**: `@inuyasha/core`, `lodash-es`

**注意**: 需要注入 store 实例（editorStore, dataSourceStore, formStateStore），通过依赖注入或工厂函数实现

---

### 4. @inuyasha/state - 状态管理（数据源 + 表单状态）

**位置**: `packages/state/`

**职责**:

- 数据源管理逻辑 (`stores/dataSource.ts` → `src/datasource.ts`)
- API 请求处理 (`stores/dataSource.ts` → `src/api.ts`)
- 表单状态管理 (`stores/formState.ts` → `src/formState.ts`)
- 变量解析集成（依赖 `@inuyasha/expression`）

**文件结构**:

```
packages/state/
├── src/
│   ├── datasource.ts        # 数据源状态管理
│   ├── api.ts               # API 请求逻辑
│   ├── formState.ts         # 表单状态管理
│   └── index.ts
├── package.json
└── tsconfig.json
```

**依赖**: `@inuyasha/core`, `@inuyasha/expression`, `nanoid`

---

### 5. @inuyasha/event - 事件系统

**位置**: `packages/event/`

**职责**:

- 事件动作执行引擎 (`utils/eventEngine.ts` → `src/engine.ts`)
- 动作类型定义和实现

**文件结构**:

```
packages/event/
├── src/
│   ├── engine.ts            # 事件执行引擎
│   ├── actions/             # 各种动作实现
│   │   ├── index.ts
│   │   ├── showMessage.ts
│   │   ├── callDataSource.ts
│   │   ├── updateProperty.ts
│   │   └── ...
│   └── index.ts
├── package.json
└── tsconfig.json
```

**依赖**: `@inuyasha/core`, `@inuyasha/expression`

**注意**: 需要注入 store 实例（editorStore, dataSourceStore, componentRegistry）

---

### 6. @inuyasha/editor - 编辑器核心

**位置**: `packages/editor/`

**职责**:

- 编辑器状态管理 (`stores/editor.ts` → `src/store.ts`)
- 页面配置管理
- 组件选择、移动、更新逻辑

**文件结构**:

```
packages/editor/
├── src/
│   ├── store.ts             # 编辑器状态
│   ├── pageConfig.ts        # 页面配置管理
│   └── index.ts
├── package.json
└── tsconfig.json
```

**依赖**: `@inuyasha/core`, `@inuyasha/component`, `nanoid`

---

### 7. @inuyasha/utils - 工具函数（已存在，需扩展）

**位置**: `packages/utils/` (已存在)

**职责**:

- 通用工具函数（保持现有功能）
- 可以考虑将 `iconMapping.ts` 移到这里（如果需要在多个包中使用）

**需要添加**:

- `iconMapping.ts` (从 `app/src/utils/iconMapping.ts`)

---

## 依赖关系图

```
@inuyasha/core (基础类型)
    ↑
    ├── @inuyasha/component
    ├── @inuyasha/expression
    ├── @inuyasha/state ───────→ @inuyasha/expression
    ├── @inuyasha/event ───────→ @inuyasha/expression
    └── @inuyasha/editor ──────→ @inuyasha/component
```

## 迁移步骤

### 阶段 1: 创建基础包

1. 创建 `@inuyasha/core` 包，迁移所有类型定义
2. 更新 `@inuyasha/utils` 包配置

### 阶段 2: 创建业务包

3. 创建 `@inuyasha/component` 包
4. 创建 `@inuyasha/expression` 包
5. 创建 `@inuyasha/state` 包（包含数据源和表单状态）
6. 创建 `@inuyasha/event` 包
7. 创建 `@inuyasha/editor` 包

### 阶段 3: 迁移和重构

9. 将 `app/src` 中的逻辑迁移到对应包
10. 重构 store 实现，使用包中的逻辑
11. 更新 `app` 中的导入路径

### 阶段 4: 清理和优化

12. 删除 `app/src` 中已迁移的文件
13. 更新所有包的 `package.json` 和 `tsconfig.json`
14. 确保构建和类型检查通过

## 注意事项

1. **依赖注入**: `@inuyasha/expression`、`@inuyasha/event` 等包需要访问 Pinia stores，可以通过以下方式解决：

   - 使用工厂函数接受 store 实例作为参数
   - 或者将这些包设计为纯函数，在 app 层组合
   - `@inuyasha/state` 包中的 datasource 和 formState 逻辑可以直接导出为 Pinia store 定义

2. **类型导出**: 确保 `@inuyasha/core` 正确导出所有类型，其他包通过它引用类型

3. **构建配置**: 每个包需要独立的 `tsconfig.json`，引用根目录的 `tsconfig.base.json`

4. **测试**: 拆分后每个包应该可以独立测试

5. **功能保持**: 迁移过程中保持功能不变，直接替换原有实现