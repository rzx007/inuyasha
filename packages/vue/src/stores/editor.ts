import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { ComponentId, ComponentSchema } from '@inuyasha/core'
import type { SelectedComponent, PageConfig } from '@inuyasha/core'
import { EditorMode } from '@inuyasha/core'
import { EditorStore as EditorStoreCore } from '@inuyasha/core/editor'
import { nanoid } from 'nanoid'
import { useDataSource } from './dataSource'
import { useFormState } from './formState'
import { useComponentInstance } from './componentInstance'
import { getInuyashaVueOptions } from '../config'

let editorStoreCore: EditorStoreCore | null = null

function getEditorStoreCore(): EditorStoreCore {
  if (!editorStoreCore) {
    const { pageRootMeta } = getInuyashaVueOptions()
    editorStoreCore = new EditorStoreCore({
      id: '',
      name: '未命名页面',
      title: '新页面',
      rootComponent: {
        id: nanoid(),
        semanticId: 'pageRoot1',
        type: pageRootMeta.type,
        label: pageRootMeta.name,
        props: { ...pageRootMeta.defaultProps },
        style: { ...pageRootMeta.defaultStyle },
        children: []
      },
      dataSources: {},
      createdAt: Date.now(),
      updatedAt: Date.now()
    })
  }
  return editorStoreCore
}

export const useEditor = defineStore('editor', () => {
  const core = getEditorStoreCore()

  // 编辑器模式
  const mode = ref<EditorMode>(core.mode)

  // 当前页面配置
  const pageConfig = ref<PageConfig>(core.pageConfig)

  // 选中的组件
  const selectedComponent = ref<SelectedComponent | null>(core.selectedComponent)

  // 操作历史（用于撤销/重做）
  const history = ref<any[]>(core.history)
  const historyIndex = ref(core.historyIndex)

  // 计算属性
  const isEditMode = computed(() => mode.value === EditorMode.Edit)
  const isPreviewMode = computed(() => mode.value === EditorMode.Preview)
  const hasSelected = computed(() => selectedComponent.value !== null)

  // 创建默认的 PageRoot
  function createDefaultPageRoot(): ComponentSchema {
    const { pageRootMeta } = getInuyashaVueOptions()
    return core.createDefaultPageRoot(
      pageRootMeta.type,
      pageRootMeta.name,
      pageRootMeta.defaultProps,
      pageRootMeta.defaultStyle
    )
  }

  // 用不可变更新后的 root 触发 Vue 响应式（structural sharing，仅变更路径克隆）
  function syncPageConfig() {
    pageConfig.value = { ...core.pageConfig }
  }

  // 在整个组件树中查找组件（包括 rootComponent 本身）
  function findComponentInTree(id: ComponentId): ComponentSchema | null {
    return core.findComponentInTree(id)
  }

  // 切换模式
  function setMode(newMode: EditorMode) {
    core.setMode(newMode)
    mode.value = newMode
    if (newMode === EditorMode.Preview) {
      selectedComponent.value = null
    }
  }

  // 设置页面配置
  function setPageConfig(config: PageConfig) {
    // 确保 rootComponent 存在
    if (!config.rootComponent) {
      config.rootComponent = createDefaultPageRoot()
    }
    // 确保 dataSources 字段存在（向后兼容）
    if (!config.dataSources) {
      config.dataSources = {}
    }

    core.setPageConfig(config)
    pageConfig.value = { ...core.pageConfig }

    // 同步 dataSources 到 dataSourceStore
    const dataSourceStore = useDataSource()
    dataSourceStore.importDataSources(config.dataSources)
  }

  // 获取 PageRoot
  function getPageRoot(): ComponentSchema {
    return core.getPageRoot()
  }

  // 添加组件
  function addComponent(component: ComponentSchema, parentId?: ComponentId, index?: number) {
    core.addComponentImmutable(component, parentId, index)
    syncPageConfig()
  }

  // 删除组件（不能删除 PageRoot）
  function deleteComponent(id: ComponentId) {
    if (selectedComponent.value?.id === id) {
      core.selectComponent(null)
      selectedComponent.value = null
    }

    const result = core.deleteComponentImmutable(id)
    if (result) {
      syncPageConfig()
    }

    const formStateStore = useFormState()
    formStateStore.removeComponentState(id)

    const componentRegistry = useComponentInstance()
    componentRegistry.unregister(id)
  }

  // 更新组件
  function updateComponent(id: ComponentId, updates: Partial<ComponentSchema>) {
    core.updateComponentImmutable(id, updates)
    syncPageConfig()
    // 如果当前选中的是被更新的组件，需要重新获取新的引用
    if (selectedComponent.value?.id === id) {
      const updated = findComponentInTree(id)
      if (updated) {
        selectedComponent.value = { id: updated.id, schema: updated }
      }
    }
  }

  // 选中组件
  function selectComponent(id: ComponentId | null) {
    core.selectComponent(id)
    selectedComponent.value = core.selectedComponent
  }

  // 移动组件（支持跨容器和排序）
  function moveComponent(
    dragId: ComponentId,
    targetParentId: ComponentId,
    targetIndex?: number,
    slotName?: string
  ) {
    const result = core.moveComponentImmutable(dragId, targetParentId, targetIndex, slotName)
    if (result) {
      syncPageConfig()
    }
  }

  return {
    // state
    mode,
    pageConfig,
    selectedComponent,
    history,
    historyIndex,

    // getters
    isEditMode,
    isPreviewMode,
    hasSelected,

    // actions
    setMode,
    setPageConfig,
    getPageRoot,
    addComponent,
    deleteComponent,
    updateComponent,
    selectComponent,
    moveComponent,
    findComponentInTree,
    createDefaultPageRoot
  }
})
