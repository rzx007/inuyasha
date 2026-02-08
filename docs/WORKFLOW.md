# Inuyasha 业务流程图

## 1. 编辑器初始化流程

```
┌─────────────────────────────────────────────────────────────────┐
│                    应用启动流程                              │
└─────────────────────────────────────────────────────────────────┘

 开始
  ↓
初始化 Vue 应用
  ↓
安装 Inuyasha 插件 (createInuyashaPlugin)
  ├─ pageRootMeta (PageRoot组件定义)
  └─ toast (消息提示)
  ↓
初始化 Pinia Stores (通过 SDK)
  ├─ useEditor
  │   └─ EditorStoreCore (默认PageConfig)
  ├─ useComponent
  │   └─ 加载内置组件元数据
  ├─ useDataSource
  │   └─ DataSourceStoreCore
  ├─ useFormState
  │   └─ FormStateStoreCore
  └─ useComponentRegistry
      └─ ComponentInstanceRegistry
  ↓
加载本地存储的 PageConfig (可选)
  ├─ localStorage.getItem('page-config')
  └─ editor.setPageConfig(config)
  ↓
渲染编辑器页面
  ├─ Canvas (画布)
  ├─ ComponentPanel (组件库)
  ├─ PropertyPanel (属性面板)
  ├─ LayersPanel (图层树)
  └─ DataSourcePanel (数据源面板)
  ↓
初始化完成，等待用户操作
```

## 2. 组件拖拽添加流程

```
┌─────────────────────────────────────────────────────────────────┐
│                  组件拖拽添加到画布                            │
└─────────────────────────────────────────────────────────────────┘

用户从 ComponentPanel 拖拽组件
  ↓
DragSource (物料组件)
  ├─ componentType: 组件类型
  └─ componentMeta: 组件元数据
  ↓
DropTarget (PageRootDropZone / SlotDropWrapper)
  ├─ parentId: 父组件ID
  ├─ slotName: 插槽名 (可选)
  └─ index: 插入位置
  ↓
onDrop 事件触发
  ↓
调用 editor.addComponent()
  ├─ createComponent(meta)
  │   ├─ 生成 id (nanoid)
  │   ├─ 生成 semanticId (如 button1)
  │   ├─ 合并 defaultProps
  │   └─ 合并 defaultStyle
  ├─ editorStore.core.addComponent()
  └─ pageConfig 更新 (触发响应式)
  ↓
DynamicRenderer 重新渲染
  └─ 新组件出现在画布上
```

## 3. 组件属性编辑流程

```
┌─────────────────────────────────────────────────────────────────┐
│                   组件属性配置流程                               │
└─────────────────────────────────────────────────────────────────┘

 用户点击画布上的组件
  ↓
editor.selectComponent(id)
  ├─ selectedComponent = { id, schema }
  └─ PropertyPanel 显示属性
  ↓
PropertyPanel 渲染属性表单
  ├─ 根据 ComponentMeta.propsSchema 生成表单
  ├─ 分类：属性 / 样式 / 事件
  └─ 显示当前值
  ↓
 用户修改属性值
  ├─ 输入框直接输入
  │   ↓
  │   editor.updateComponent(id, { props: {...} })
  │   ↓
  │   pageConfig 更新 → DynamicRenderer 重新渲染
  │
  ├─ 数据绑定配置
  │   ↓
  │   打开 DataBindingDialog
  │   ├─ 选择绑定类型
  │   │   ├─ dataSource: 数据源绑定
  │   │   ├─ component: 组件值绑定
  │   │   └─ static: 静态值
  │   ├─ 选择目标 (数据源ID / 组件ID)
  │   └─ 选择路径
  │   ↓
  │   保存 DataBinding
  │   └─ props[key] = { value, key_binding: DataBinding }
  │
  └─ 样式配置
      ↓
      编辑样式 (颜色、大小、边距等)
      ↓
      editor.updateComponent(id, { style: {...} )
      ↓
      resolvedStyle computed 重新计算
      ↓
      DynamicRenderer 应用新样式
```

## 4. 数据绑定解析流程

```
┌─────────────────────────────────────────────────────────────────┐
│                     数据绑定实时解析                             │
└─────────────────────────────────────────────────────────────────┘

DynamicRenderer 渲染组件
  ↓
computed: resolvedProps
  ↓
遍历 props，查找 xxx_binding 属性
  ↓
发现 binding: props.text_binding
  ↓
调用 resolveBinding(binding, context)
  ↓
ExpressionContext 上下文准备
  ├─ editor.pageConfig.rootComponent
  ├─ dataSource.dataSources
  └─ formState.states
  ↓
 根据 binding.type 解析

 ┌─────────────────────────────────────────────────────────────────┐
 │ case 'dataSource':                                            │
 │   ├─ 按 dataSourceId 查找 DataSource                         │
 │   ├─ 读取 ds.data                                            │
 │   └─ 使用 lodash.get(ds.data, path) 返回值                    │
 └─────────────────────────────────────────────────────────────────┘

 ┌─────────────────────────────────────────────────────────────────┐
 │ case 'component':                                              │
 │   ├─ 按 componentId 查找 ComponentSchema                     │
 │   ├─ 优先级: modelValue → props → style                      │
 │   │   ├─ formState.getComponentState(id, path)                  │
 │   │   ├─ lodash.get(schema.props, path)                      │
 │   │   └─ lodash.get(schema.style, path)                      │
 │   └─ 返回找到的值                                            │
 └─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│ case 'static':                                                │
│   └─ 直接返回 binding.value                                    │
└─────────────────────────────────────────────────────────────────┘

  ↓
resolvedProps[key] = 绑定值
  ↓
v-bind 传递给组件
  ↓
组件显示绑定后的值
```

## 5. 双向绑定更新流程

```
┌─────────────────────────────────────────────────────────────────┐
│                     表单组件双向绑定                             │
└─────────────────────────────────────────────────────────────────┘

用户修改表单组件值 (如输入文字)
  ↓
触发 v-model 更新
  ↓
modelValueEvents[`update:value`](newValue)
  ↓
判断 componentMeta.propsSchema[key].storeInProps

 ┌─────────────────────────────────────────────────────────────────┐
 │ storeInProps = true:                                            │
 │   ↓                                                              │
 │   editor.updateComponent(id, {                                     │
 │     props: { ...props, [key]: newValue }                         │
 │   })                                                             │
 │   ↓                                                              │
 │   ComponentSchema.props 更新                                       │
 │   ↓                                                              │
 │   影响引用此组件绑定的其他组件                                      │
 └─────────────────────────────────────────────────────────────────┘

 ┌─────────────────────────────────────────────────────────────────┐
 │ storeInProps = false (默认):                                     │
 │   ↓                                                              │
 │   formState.setComponentState(id, key, newValue)                   │
 │   ↓                                                              │
 │   FormStateStore.states[id][key] = newValue                       │
 │   ↓                                                              │
 │   不影响 ComponentSchema，仅影响运行时状态                           │
 └─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│ storeInProps = false (默认):                                      │
│   ↓                                                              │
│   formState.setComponentState(id, key, newValue)               │
│   ↓                                                              │
│   FormStateStore.states[id][key] = newValue                       │
│   ↓                                                              │
│   不影响 ComponentSchema，仅影响运行时状态                           │
└─────────────────────────────────────────────────────────────────┘

  ↓
触发 onValueChange 事件
  ↓
handleEvent('onValueChange')
  ↓
查找匹配的 EventBinding
  ↓
执行绑定的 Actions
  (参考事件执行流程)
```

## 6. 事件绑定与执行流程

```
┌─────────────────────────────────────────────────────────────────┐
│                   事件配置与执行流程                             │
└─────────────────────────────────────────────────────────────────┘

用户在 PropertyPanel 配置事件
  ↓
ComponentEventsPanel
  ├─ 选择触发器 (onClick, onChange等)
  └─ 配置 Actions
      ├─ 选择 Action 类型
      │   ├─ showMessage (显示消息)
      │   ├─ callDataSource (调用数据源)
      │   ├─ updateProperty (更新属性)
      │   ├─ runScript (运行脚本)
      │   ├─ controlComponent (控制组件)
      │   ├─ goToUrl (跳转URL)
      │   ├─ navigateTo (路由跳转)
      │   ├─ copyToClipboard (复制)
      │   ├─ setLocalStorage (本地存储)
      │   └─ download (下载)
      └─ 配置 Action 参数
  ↓
保存 EventBinding
  └─ ComponentSchema.events.push(binding)
      ├─ trigger: 触发器名称
      └─ actions: ActionConfig[]
  ↓
保存到 pageConfig

──────────────────────────────────────────────────────────────────

事件触发时 (如用户点击按钮)
  ↓
组件触发原生事件 (如 @click)
  ↓
dynamicEvents.onClick 被调用
  ↓
handleEvent('onClick')
  ↓
查找 schema.events 中 trigger='onClick' 的绑定
  ↓
找到匹配的 EventBinding
  ↓
useExecuteEvent()(event)
  ↓
构建 EventContext
  ├─ editorStore: { pageConfig, updateComponent }
  ├─ dataSourceStore: { dataSources }
  ├─ formStateStore: { getComponentState }
  ├─ componentRegistry: { getComponent }
  └─ toast
  ↓
executeEvent(event, context)
  ↓
遍历 actions，执行每个 Action

┌─────────────────────────────────────────────────────────────────┐
│ Action: showMessage                                             │
│   ├─ 获取配置: message, messageType                           │
│   └─ context.toast[messageType](message)                         │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│ Action: callDataSource                                         │
│   ├─ 获取配置: dataSourceId                                  │
│   ├─ dataSource.fetchDataSource(id, context)                │
│   ├─ resolveVariablesInConfig (解析URL中的变量)                │
│   ├─ fetch(url, options)                                    │
│   ├─ ds.data = response.data                                  │
│   └─ ds.lastFetched = Date.now()                             │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│ Action: updateProperty                                        │
│   ├─ 获取配置: targetComponentId, targetProperty, newValue    │
│   └─ editor.updateComponent(id, {                         │
│       props: { [property]: newValue }                           │
│     })                                                         │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│ Action: runScript                                              │
│   ├─ 获取配置: code (JavaScript字符串)                         │
│   ├─ new Function('context', code)                            │
│   └─ func({ ...context, window, document, console })           │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│ Action: controlComponent                                       │
│   ├─ 获取配置: componentId, method, args                     │
│   ├─ componentRegistry.getComponent(id)                         │
│   └─ component[method](...args)                               │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│ Action: goToUrl                                               │
│   ├─ 获取配置: url, newTab                                  │
│   └─ newTab ? window.open(url, '_blank')                       │
│           : window.location.href = url                          │
└─────────────────────────────────────────────────────────────────┘

  ↓
所有 Actions 执行完成
```

## 7. 数据源配置与调用流程

```
┌─────────────────────────────────────────────────────────────────┐
│                   数据源管理流程                                 │
└─────────────────────────────────────────────────────────────────┘

用户打开 DataSourcePanel
  ↓
显示数据源列表
  ├─ API 数据源 (HTTP请求)
  └─ 静态数据源
  ↓
用户点击"添加数据源"
  ↓
DataSourceForm 表单
  ├─ 数据源类型选择
  │   ├─ api
  │   └─ static
  ├─ 数据源名称
  │   ├─ api: URL, Method, Headers, Body, Params
  │   └─ static: JSON数据
  └─ 自动获取开关
  ↓
保存数据源
  ↓
dataSource.addDataSource(config)
  ├─ 生成 id (nanoid)
  ├─ DataSource {
  │   ├─ id
  │   ├─ name
  │   ├─ type
  │   ├─ config
  │   └─ data: undefined (未获取)
  │   }
  └─ 添加到 pageConfig.dataSources
  ↓
dataSourceStore 数据更新 → 响应式更新
  ↓
DataSourcePanel 列表刷新

──────────────────────────────────────────────────────────────────

数据源调用流程 (通过 Action: callDataSource)
  ↓
fetchDataSource(dataSourceId, ExpressionContext)
  ↓
查找 DataSource 配置
  ↓
解析配置中的变量 ({{xxx}})
  ├─ resolveVariablesInConfig(config, context)
  ├─ 解析 url 中的变量
  ├─ 解析 params 中的变量
  ├─ 解析 headers 中的变量
  └─ 解析 body 中的变量
  ↓
执行 HTTP 请求
  ├─ fetch(url, { method, headers, body })
  └─ 等待响应
  ↓
处理响应
  ├─ 成功: ds.data = response.data
  ├─ 失败: ds.data = { error: '...' }
  └─ ds.lastFetched = Date.now()
  ↓
绑定此数据源的组件自动更新
  (通过 useResolveBinding 重新解析)
```

## 8. 组件移动与删除流程

```
┌─────────────────────────────────────────────────────────────────┐
│                   组件树操作流程                                 │
└─────────────────────────────────────────────────────────────────┘

组件拖拽移动
  ↓
DragSource (EditorComponentWrapper)
  ├─ dragId: 被拖组件ID
  └─ parentId: 当前父组件ID
  ↓
DropTarget (容器组件)
  ├─ targetParentId: 目标父组件ID
  ├─ slotName: 目标插槽 (可选)
  └─ targetIndex: 目标位置
  ↓
onDrop 处理
  ↓
editor.moveComponent(dragId, targetParentId, targetIndex, slotName)
  ↓
EditorStoreCore.moveComponent()
  ├─ 查找被拖组件
  ├─ 查找目标父组件
  ├─ 检查合法性
  │   ├─ 不能拖到自己内部
  │   └─ 检查父子关系
  ├─ 从原位置移除 (removeComponentById)
  ├─ 更新组件的 _slot 属性 (如果有 slotName)
  └─ 插入到新位置
  ↓
pageConfig 更新 → DynamicRenderer 重新渲染

──────────────────────────────────────────────────────────────────

组件删除
  ↓
用户点击删除按钮 (右键菜单 / 属性面板)
  ↓
editor.deleteComponent(id)
  ↓
EditorStoreCore.deleteComponent()
  ├─ 检查不能删除 PageRoot
  ├─ removeComponentById(id)
  ├─ 取消选中 (如果选中了此组件)
  ├─ 清理 formState (formState.removeComponentState(id))
  └─ 清理 componentRegistry (componentRegistry.unregister(id))
  ↓
pageConfig 更新 → DynamicRenderer 重新渲染
```

## 9. 预览模式流程

```
┌─────────────────────────────────────────────────────────────────┐
│                     预览模式切换                                │
└─────────────────────────────────────────────────────────────────┘

用户点击"预览"按钮
  ↓
Toolbar.setMode(EditorMode.Preview)
  ↓
editor.setMode(EditorMode.Preview)
  ├─ mode = Preview
  └─ selectedComponent = null
  ↓
切换路由到 Preview 页面 (或显示预览层)
  ↓
PreviewRenderer 渲染
  ├─ 使用相同的 pageConfig
  ├─ 渲染纯净的组件 (无编辑器UI)
  └─ 支持用户交互 (数据绑定、事件)
  ↓
用户可以像真实应用一样操作
  ├─ 填写表单
  ├─ 点击按钮触发事件
  └─ 数据源自动获取
  ↓
用户点击"返回编辑"
  ↓
editor.setMode(EditorMode.Edit)
  └─ 切换回编辑器界面
```

## 10. 页面配置保存与加载

```
┌─────────────────────────────────────────────────────────────────┐
│                   页面配置持久化                                 │
└─────────────────────────────────────────────────────────────────┘

用户点击"保存" (自动或手动)
  ↓
editor.pageConfig
  ├─ rootComponent (组件树)
  ├─ dataSources (数据源配置)
  ├─ id
  ├─ name
  ├─ title
  ├─ createdAt
  └─ updatedAt
  ↓
JSON.stringify(pageConfig)
  ↓
localStorage.setItem('page-config', json)
  ↓
持久化完成

──────────────────────────────────────────────────────────────────

应用初始化时加载
  ↓
onMounted
  ↓
localStorage.getItem('page-config')
  ↓
JSON.parse(config)
  ↓
editor.setPageConfig(config)
  ├─ 恢复组件树
  ├─ 恢复数据源配置
  └─ 恢复所有状态
  ↓
恢复编辑器状态
```

## 11. 插槽 (Slot) 渲染流程

```
┌─────────────────────────────────────────────────────────────────┐
│                   插槽渲染机制                                  │
└─────────────────────────────────────────────────────────────────┘

DynamicRenderer 渲染容器组件 (如 Tabs)
  ↓
检查 ComponentMeta.slots
  ├─ static slots: 固定插槽定义
  └─ dynamic slots: 从 props.items 生成
  ↓
遍历 slots
  ↓
对于每个 slot
  ├─ 获取 slot.name
  ├─ getSlotChildren(slot.name)
  │   └─ 过滤 props._slot === slot.name 的子组件
  ├─ 渲染子组件
  │   └─ <template #slot.name>
  │         <EditorComponentWrapper v-for="child" />
  │       </template>
  └─ 渲染 SlotDropWrapper (如果 slot.allowDrag 且为空)
      └─ 允许拖拽到插槽

──────────────────────────────────────────────────────────────────

动态插槽 (如 Tabs 从 items 生成)
  ↓
props.items = [
  { name: 'tab1', label: '标签1' },
  { name: 'tab2', label: '标签2' }
]
  ↓
动态生成 slot
  ↓
props._slot 标记子组件属于哪个插槽
  ↓
getSlotChildren('tab1') 过滤出 tab1 下的组件
  ↓
在对应的 slot 渲染
```

## 12. 组件注册流程

```
┌─────────────────────────────────────────────────────────────────┐
│                   组件注册与扩展                                  │
└─────────────────────────────────────────────────────────────────┘

应用启动
  ↓
app/src/config/components/index.ts
  ├─ 导入所有组件元数据
  │   ├─ 基础组件 (base.ts)
  │   ├─ 布局组件 (layout.ts)
  │   ├─ 数据组件 (data.ts)
  │   └─ 表单组件 (form.ts)
  ├─ 导入 Vue 组件
  └─ 导出组件配置
  ↓
Vue 应用初始化
  ↓
注册所有 ComponentMeta
  ├─ componentStore.registerComponents(metas)
  ├─ 每个 meta 包含:
  │   ├─ type, name, icon, category
  │   ├─ defaultProps, defaultStyle
  │   ├─ propsSchema (属性配置)
  │   ├─ triggers (事件触发器)
  │   ├─ slots (插槽定义)
  │   ├─ methods (暴露方法)
  │   ├─ componentName (Vue组件名)
  │   └─ canNest, display
  └─ 注册到 ComponentRegistry
  ↓
ComponentPanel 显示组件库
  └─ 按分类显示所有组件

──────────────────────────────────────────────────────────────────

自定义组件注册 (扩展)
  ↓
开发者创建新组件
  ├─ 实现 Vue 组件
  ├─ 定义 ComponentMeta
  │   ├─ type: 'my-component'
  │   ├─ componentName: 'MyComponent'
  │   ├─ propsSchema: [...]
  │   ├─ triggers: [...]
  │   └─ slots: [...]
  └─ 注册
      └─ componentStore.registerComponent(meta)
  ↓
自定义组件出现在组件库
  └─ 可以拖拽使用
```

## 13. 调试面板流程

```
┌─────────────────────────────────────────────────────────────────┐
│                     调试模式                                      │
└─────────────────────────────────────────────────────────────────┘

用户点击"调试"按钮
  ↓
showDebugPanel = true
  ↓
显示 DebugPanel
  ├─ PageConfig 查看
  │   └─ 显示当前的 pageConfig JSON
  ├─ ComponentTree 查看树形结构
  │   └─ 显示组件层级关系
  ├─ DataSource 查看
  │   └─ 显示所有数据源状态
  ├─ FormState 查看
  │   └─ 显示所有表单状态
  └─ 实时更新
      └─ 随用户操作更新显示
  ↓
开发者可以实时查看状态变化
  ├─ 检查组件树是否正确
  ├─ 检查数据绑定是否生效
  ├─ 检查事件是否正确触发
  └─ 检查数据源是否正确获取
```
