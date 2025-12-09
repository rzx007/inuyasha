# Inuyasha - 低代码可视化编辑器平台

一个基于 Vue3 + TypeScript 的现代低代码开发平台，支持可视化组件拖拽、属性配置、数据绑定等功能。

## 项目结构

```
inuyasha/
├── app/                    # 主应用 (Vue3 + Vite)
│   ├── src/
│   │   ├── components/     # 组件库
│   │   │   ├── Editor/     # 编辑器组件
│   │   │   ├── Materials/  # 物料组件
│   │   │   ├── Render/     # 渲染引擎
│   │   │   └── ui/         # UI组件库
│   │   ├── stores/         # 状态管理
│   │   ├── types/          # TypeScript类型定义
│   │   └── utils/          # 工具函数
│   └── public/             # 静态资源
├── packages/               # 子包
│   └── utils/              # 工具库
├── internal/               # 内部工具
│   └── eslint-config/      # ESLint配置
└── docs/                   # 文档
```

## 特性

- **🌟 可视化编辑器**: 拖拽式组件设计，支持实时预览
- **🌟 组件系统**: 丰富的物料组件库，支持自定义扩展
- **🌟 数据绑定**: 灵活的数据源配置和绑定机制
- **🌟 事件引擎**: 可视化事件配置和处理
- **🌟 响应式设计**: 移动端友好的自适应布局
- **🌟 TypeScript**: 完整的类型支持，提升开发体验
- **🌟 现代工具链**: Vite + Turbo + pnpm 的高效开发体验

## 技术栈

- **前端框架**: Vue 3 + TypeScript
- **构建工具**: Vite 7 + Turbo
- **UI框架**: Element Plus + TailwindCSS
- **状态管理**: Pinia
- **包管理**: pnpm (workspace)
- **代码质量**: ESLint + Prettier + Commitlint

## 快速开始

### 环境要求

- Node.js >= 16
- pnpm >= 8.0.0

### 安装依赖

```bash
# 全局安装 pnpm (如果还没有安装)
npm install pnpm -g

# 安装项目依赖
pnpm install
```

### 开发模式

```bash
# 启动主应用开发服务器
pnpm dev

# 启动所有子包开发模式
pnpm dev --filter=*
```

### 构建生产版本

```bash
# 构建主应用
pnpm build

# 构建所有包
pnpm build --filter=*
```

## 可用脚本

```bash
# 代码检查
pnpm eslint

# 代码格式化
pnpm prettier

# 依赖升级检查
pnpm upgrade

# 生成变更日志
pnpm changelog
```

## 项目架构

### 编辑器核心功能

- **画布系统**: 支持组件拖拽放置和位置调整
- **属性面板**: 实时配置组件属性和样式
- **图层面板**: 组件层级管理和选择
- **数据面板**: 数据源管理和绑定配置
- **预览模式**: 实时预览和调试

### 渲染引擎

- **动态渲染**: 基于配置的组件动态渲染
- **事件处理**: 可视化配置的事件响应机制
- **数据流**: 灵活的数据传递和转换

### 组件物料库

- **基础组件**: Button、Input、Select 等常用组件
- **布局组件**: Row、Collapse、Tabs 等布局容器
- **数据组件**: Table、Chart 等数据展示组件
- **自定义扩展**: 支持开发者添加新的物料组件

## 开发指南

1. 遵循项目的 ESLint 和 Prettier 配置
2. 使用 TypeScript 编写类型安全的代码
3. 遵循约定式提交规范 (Conventional Commits)
4. 为新功能编写相应的测试用例
5. 更新相关文档
