# ZenBuilder (Inuyasha) 项目说明文档

## 项目概述

ZenBuilder 是一个基于 Vue3 + TypeScript 的现代低代码可视化编辑器平台，支持可视化组件拖拽、属性配置、数据绑定、事件驱动等功能，无需编写代码即可快速构建 Web 应用。

**项目别名**: Inuyasha (项目内部命名)

**技术特点**: Monorepo 架构 | Vue 3 + TypeScript | Vite 7 + Turbo | pnpm Workspace

---

## 项目架构

### 整体架构图

```
ZenBuilder (Monorepo)
├── app/                      # 主应用 (可视化编辑器)
├── packages/                 # 核心功能包
│   ├── @inuyasha/core        # 核心类型定义
│   ├── @inuyasha/editor      # 编辑器核心逻辑
│   ├── @inuyasha/component   # 组件系统
│   ├── @inuyasha/state       # 状态管理
│   ├── @inuyasha/event       # 事件引擎
│   ├── @inuyasha/expression  # 表达式引擎
│   └── @inuyasha/utils       # 工具函数库
└── internal/                 # 内部工具
    └── eslint-config         # ESLint 配置
```

### 包依赖关系

```
app
  ├─→ @inuyasha/core
  ├─→ @inuyasha/editor
  ├─→ @inuyasha/component
  ├─→ @inuyasha/state
  ├─→ @inuyasha/event
  ├─→ @inuyasha/expression
  └─→ @inuyasha/utils

@inuyasha/editor
  ├─→ @inuyasha/core
  └─→ @inuyasha/component

@inuyasha/state
  ├─→ @inuyasha/core
  └─→ @inuyasha/expression

@inuyasha/event
  ├─→ @inuyasha/core
  └─→ @inuyasha/expression

@inuyasha/expression
  ├─→ @inuyasha/core
  └─→ @inuyasha/component

@inuyasha/component
  └─→ @inuyasha/core

@inuyasha/utils (独立包，无依赖)
```

---

## 核心功能模块

### 1. 编辑器 (@inuyasha/editor)

**功能**: 提供编辑器的核心逻辑，包括组件树管理、页面配置等

**核心文件**:

- `store.ts`: 编辑器状态管理
- 使用 nanoid 生成唯一组件 ID

**主要职责**:

- 管理页面组件树结构
- 处理组件的增删改操作
- 维护画布状态

### 2. 组件系统 (@inuyasha/component)

**功能**: 提供组件注册、实例化和管理能力

**核心文件**:

- `registry.ts`: 组件注册表
- `factory.ts`: 组件工厂
- `tree.ts`: 组件树操作
- `instanceRegistry.ts`: 组件实例管理

**主要职责**:

- 物料组件注册
- 组件实例创建
- 组件树遍历和查找

### 3. 状态管理 (@inuyasha/state)

**功能**: 管理数据源和表单状态

**核心文件**:

- `datasource.ts`: 数据源管理
- `formState.ts`: 表单状态管理
- `api.ts`: API 调用接口

**主要职责**:

- 数据源配置和存储
- API 请求管理
- 表单数据响应式管理

### 4. 事件引擎 (@inuyasha/event)

**功能**: 事件的注册、触发和执行

**核心文件**:

- `engine.ts`: 事件执行引擎
- `types.ts`: 事件类型定义
- `actions/`: 事件动作处理

**主要职责**:

- 事件配置解析
- 事件触发和执行
- 支持多种事件动作（调用数据源、页面跳转等）

### 5. 表达式引擎 (@inuyasha/expression)

**功能**: 数据绑定解析和表达式求值

**主要职责**:

- 解析数据绑定表达式
- 从数据源获取值
- 支持组件间属性引用

### 6. 核心类型 (@inuyasha/core)

**功能**: 定义项目核心类型和接口

**核心文件**:

- `types/component.ts`: 组件类型
- `types/event.ts`: 事件类型
- `types/dataSource.ts`: 数据源类型
- `types/editor.ts`: 编辑器类型
- `types/dnd.ts`: 拖拽类型

### 7. 工具库 (@inuyasha/utils)

**功能**: 提供通用工具函数

**依赖**: lucide-vue-next (图标库)

---

## 主应用 (app/) 结构

### 目录结构

```
app/
├── src/
│   ├── components/
│   │   ├── Editor/           # 编辑器组件
│   │   │   ├── Canvas.vue    # 画布
│   │   │   ├── PropertyPanel.vue  # 属性面板
│   │   │   ├── DataSourcePanel.vue # 数据源面板
│   │   │   └── LayerPanel.vue     # 图层面板
│   │   ├── Materials/        # 物料组件库
│   │   │   ├── data/         # 数据展示组件
│   │   │   ├── layout/       # 布局组件
│   │   │   ├── z-button/     # 按钮组件
│   │   │   ├── z-select/     # 选择器组件
│   │   │   └── z-divider/    # 分割线组件
│   │   ├── Render/           # 渲染引擎
│   │   │   ├── DynamicRenderer.vue    # 动态渲染器
│   │   │   └── PreviewRenderer.vue    # 预览渲染器
│   │   └── ui/               # UI 组件
│   ├── stores/               # Pinia 状态管理
│   │   ├── editor.ts         # 编辑器状态
│   │   ├── dataSource.ts      # 数据源状态
│   │   └── component.ts      # 组件状态
│   ├── utils/                # 工具函数
│   │   ├── eventEngine.ts    # 事件引擎
│   │   └── expressionEngine.ts  # 表达式引擎
│   ├── types/                # 类型定义
│   ├── pages/                # 页面
│   ├── router/               # 路由配置
│   └── main.ts               # 入口文件
```

### 核心工作流程

#### 1. 数据绑定流程

```
用户操作 (PropertyPanel.vue)
  ↓
DataBindingDialog.vue (打开对话框)
  ↓
选择数据源或组件属性
  ↓
保存绑定配置
  ↓
editorStore.updateComponent (更新组件 Schema)
  ↓
组件 schema 保存绑定关系
```

**绑定类型**:

- 数据源绑定: 绑定到 API 数据源
- 组件属性绑定: 引用其他组件的属性值
- 表达式绑定: 支持复杂表达式

#### 2. 事件驱动流程

```
用户操作 (PropertyPanel.vue)
  ↓
配置事件 (onClick, onChange 等)
  ↓
选择动作 (调用数据源、页面跳转等)
  ↓
editorStore.updateComponent (保存事件配置)
  ↓
运行时触发:
  用户点击 → handleButtonClick → executeEvent → 执行动作
```

#### 3. 完整数据流动流程

```
1. 配置数据源 (DataSourcePanel)
   ↓
2. 数据源信息保存到 dataSourceStore
   ↓
3. 配置组件绑定 (PropertyPanel)
   ↓
4. 组件 schema 保存绑定关系
   ↓
5. 配置触发事件 (PropertyPanel)
   ↓
6. 用户触发事件
   ↓
7. eventEngine 执行 → dataSourceStore.fetchDataSource
   ↓
8. 网络请求获取数据
   ↓
9. 数据更新到 dataSourceStore (触发响应式)
   ↓
10. expressionEngine 解析绑定
    ↓
11. DynamicRenderer 重新渲染组件
```

---

## 技术栈

### 前端框架

- **Vue 3.5.22**: 渐进式 JavaScript 框架
- **Vue Router 4.6.3**: 官方路由管理器
- **Pinia 3.0.4**: Vue 官方状态管理库

### 构建工具

- **Vite 7.1.12**: 下一代前端构建工具
- **Turbo 2.5.8**: 高性能构建系统
- **pnpm 10.0.0**: 快速、节省磁盘空间的包管理器

### UI 框架

- **Element Plus 2.11.8**: Vue 3 UI 组件库
- **Reka UI 2.6.1**: 无样式组件库
- **TailwindCSS 4.1.17**: 原子化 CSS 框架
- **Lucide Vue Next**: 现代图标库

### 开发工具

- **TypeScript 5.9.3**: JavaScript 类型超集
- **ESLint 9.38.0**: 代码质量检查工具
- **Prettier 3.6.2**: 代码格式化工具
- **Commitlint**: Git 提交信息规范
- **Husky 9.1.7**: Git hooks 工具

### 其他依赖

- **VueUse 14.0.0**: Vue 组合式工具集
- **Lodash-es 4.17.21**: JavaScript 工具库
- **ECharts 6.0.0**: 可视化图表库
- **Zod 3.25.76**: TypeScript-first 的 Schema 验证
- **VeeValidate 4.15.1**: Vue 表单验证
- **CodeMirror 6**: 代码编辑器组件
- **Monaco Editor**: VS Code 编辑器核心

### 拖拽相关

- **vue-draggable-plus 0.6.0**: Vue 3 拖拽库
- **vue3-dnd 2.1.0**: Vue 3 React DND 风格拖拽
- **react-dnd-html5-backend 16.0.1**: HTML5 拖拽后端

---

## 开发指南

### 环境要求

- **Node.js**: >= 16.0.0
- **pnpm**: >= 8.0.0
- **操作系统**: Windows, macOS, Linux

### 安装依赖

```bash
# 安装 pnpm (如果未安装)
npm install pnpm -g

# 安装项目依赖
pnpm install
```

### 开发模式

```bash
# 启动主应用 (端口: 3890)
pnpm dev

# 启动所有子包开发模式
pnpm dev --filter=*
```

### 构建

```bash
# 构建所有包
pnpm build

# 构建主应用
pnpm build --filter=inuyasha-web
```

### 代码检查

```bash
# ESLint 检查
pnpm eslint

# Prettier 格式化
pnpm prettier

# 类型检查
pnpm typecheck
```

### 其他命令

```bash
# 依赖升级检查
pnpm upgrade

# 生成变更日志
pnpm changelog

# 上传到 Pinme
pnpm upload
```

---

## 核心概念

### 1. 物料组件 (Materials)

物料组件是可以在画布上拖拽使用的预定义组件，包括:

- **数据组件**: Table、Chart、List 等
- **表单组件**: Input、Select、Button 等
- **布局组件**: Row、Col、Tabs、Collapse 等
- **展示组件**: Text、Image、Statistic 等

### 2. 数据源 (Data Sources)

数据源是外部数据的连接点，支持:

- **API 接口**: RESTful API 调用
- **静态数据**: 预定义的 JSON 数据
- **表达式**: 动态计算的数据

### 3. 数据绑定 (Data Binding)

数据绑定将组件属性连接到数据源或其他组件属性:

- **数据源绑定**: `dataSourceId` + `path`
- **组件绑定**: `componentId` + `path`
- **表达式绑定**: 支持复杂表达式

### 4. 事件系统 (Event System)

事件系统定义用户交互的行为:

- **事件类型**: onClick、onChange、onSubmit 等
- **动作类型**: 调用数据源、页面跳转、显示消息等
- **事件链**: 支持多个动作串联

### 5. 页面配置 (Page Config)

页面的 JSON 配置，包含:

- 组件树结构
- 组件属性和样式
- 数据绑定关系
- 事件配置

---

## 扩展开发

### 添加新的物料组件

1. 在 `app/src/components/Materials/` 创建组件目录
2. 实现组件 UI 和属性配置
3. 在组件注册表中注册
4. 添加到物料面板

### 添加新的事件动作

1. 在 `packages/event/src/actions/` 创建动作处理器
2. 在 `packages/event/src/engine.ts` 注册动作
3. 在 UI 中添加配置选项

### 扩展数据源类型

1. 在 `packages/state/src/datasource.ts` 添加数据源类型
2. 实现数据获取逻辑
3. 在 UI 中添加配置表单

---

## 项目规范

### 代码规范

- 使用 TypeScript 编写所有代码
- 遵循 ESLint 和 Prettier 配置
- 使用组合式 API (Composition API)
- 组件命名使用 PascalCase
- 文件命名使用 camelCase

### Git 提交规范

遵循 Conventional Commits:

- `feat`: 新功能
- `fix`: 修复 bug
- `docs`: 文档更新
- `style`: 代码格式调整
- `refactor`: 代码重构
- `perf`: 性能优化
- `test`: 测试相关
- `chore`: 构建/工具相关

### 文件组织

- 组件: 单一职责，避免过大组件
- 工具函数: 放置在 `utils/` 目录
- 类型定义: 集中管理在 `types/` 目录
- 状态管理: 按 domain 分离 store

---

## 常见问题

### 1. 如何启动项目？

确保 Node.js >= 16，运行:

```bash
pnpm install
pnpm dev
```

### 2. 如何添加新的依赖？

在对应 package.json 添加依赖，然后运行:

```bash
pnpm install
```

### 3. 如何调试？

- 使用 Chrome DevTools
- 安装 Vue Devtools 浏览器插件
- 使用 vite-plugin-vue-devtools

### 4. 如何处理跨域？

配置 Vite proxy:

```javascript
// vite.config.ts
server: {
  proxy: {
    '/api': 'http://localhost:3000'
  }
}
```

---

## 相关文档

- [数据绑定详细说明](./data-binding.md)
- [核心逻辑指南](./guide.md)
- [拖拽实现原理](./app/src/components/Render/vue-dnd.md)
- [拖拽概念说明](./app/src/components/Render/vue-dnd-concepts.md)

---

## 贡献指南

欢迎贡献代码！请遵循以下步骤:

1. Fork 本仓库
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'feat: Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 开启 Pull Request

---

## 许可证

ISC

---

## 联系方式

- **项目主页**: https://rzx007.github.io/inuyasha
- **GitHub**: https://github.com/rzx007/inuyasha

---

**最后更新**: 2026-03-06
**文档版本**: 1.0.0
