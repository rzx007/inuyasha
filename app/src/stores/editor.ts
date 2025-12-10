import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { ComponentId, ComponentSchema } from '@/types/component'
import type { SelectedComponent, PageConfig } from '@/types/editor'
import { EditorMode } from '@/types/editor'
import { ComponentType } from '@/types/component'
import { findComponentById, removeComponentById, findComponentParent, isDescendant } from '@/utils/tree'
import { pageRootMeta } from '@/config/components/pageRoot'
import { nanoid } from 'nanoid'
import { useDataSourceStore } from '@/stores/dataSource'

export const useEditorStore = defineStore('editor', () => {
  // 编辑器模式
  const mode = ref<EditorMode>(EditorMode.Edit)
  
  // 创建默认的 PageRoot
  function createDefaultPageRoot(): ComponentSchema {
    return {
      id: nanoid(),
      semanticId: 'pageRoot1',
      type: ComponentType.PageRoot,
      label: pageRootMeta.name,
      props: { ...pageRootMeta.defaultProps },
      style: { ...pageRootMeta.defaultStyle },
      children: [],
    }
  }

  // 在整个组件树中查找组件（包括 rootComponent 本身）
  function findComponentInTree(id: ComponentId): ComponentSchema | null {
    const root = pageConfig.value.rootComponent
    if (root.id === id) {
      return root
    }
    if (root.children) {
      return findComponentById(id, root.children)
    }
    return null
  }

  // 当前页面配置
  const pageConfig = ref<PageConfig>({
    id: '',
    name: '未命名页面',
    title: '新页面',
    rootComponent: createDefaultPageRoot(),
    dataSources: {},
    createdAt: Date.now(),
    updatedAt: Date.now(),
  })
  
  // 选中的组件
  const selectedComponent = ref<SelectedComponent | null>(null)
  
  // 操作历史（用于撤销/重做）
  const history = ref<any[]>([])
  const historyIndex = ref(-1)
  
  // 计算属性
  const isEditMode = computed(() => mode.value === EditorMode.Edit)
  const isPreviewMode = computed(() => mode.value === EditorMode.Preview)
  const hasSelected = computed(() => selectedComponent.value !== null)
  
  // 切换模式
  function setMode(newMode: EditorMode) {
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

    pageConfig.value = config

    // 同步 dataSources 到 dataSourceStore
    const dataSourceStore = useDataSourceStore()
    dataSourceStore.importDataSources(config.dataSources)
  }

  // 获取 PageRoot
  function getPageRoot(): ComponentSchema {
    return pageConfig.value.rootComponent
  }
  
  // 添加组件
  function addComponent(component: ComponentSchema, parentId?: ComponentId, index?: number) {
    if (parentId) {
      // 添加到指定父组件
      const parent = findComponentInTree(parentId)
      if (parent && parent.children) {
        if (typeof index === 'number' && index >= 0 && index <= parent.children.length) {
          parent.children.splice(index, 0, component)
        } else {
          parent.children.push(component)
        }
      }
    } else {
      // 添加到 PageRoot 的 children
      if (!pageConfig.value.rootComponent.children) {
        pageConfig.value.rootComponent.children = []
      }
      const children = pageConfig.value.rootComponent.children
      if (typeof index === 'number' && index >= 0 && index <= children.length) {
        children.splice(index, 0, component)
      } else {
        children.push(component)
      }
    }
    pageConfig.value.updatedAt = Date.now()
  }
  
  // 删除组件（不能删除 PageRoot）
  function deleteComponent(id: ComponentId) {
    // 防止删除 PageRoot
    if (id === pageConfig.value.rootComponent.id) {
      console.warn('Cannot delete PageRoot component')
      return
    }
    
    const root = pageConfig.value.rootComponent
    if (root.children) {
      removeComponentById(id, root.children)
    }
    
    if (selectedComponent.value?.id === id) {
      selectedComponent.value = null
    }
    pageConfig.value.updatedAt = Date.now()
  }
  
  // 更新组件
  function updateComponent(id: ComponentId, updates: Partial<ComponentSchema>) {
    const component = findComponentInTree(id)
    if (component) {
      // 自动清理孤儿组件逻辑（针对 Tabs/Collapse 等使用 _slot 标记子组件的情况）
      if (updates.props && Array.isArray(updates.props.items) && component.children) {
        // 获取所有有效的 slot 名称
        const validSlotNames = updates.props.items
          .map((item: any) => item.name)
          .filter((name: any) => name !== undefined && name !== null)
        
        // 保留那些 _slot 为空（非 slot 组件）或者 _slot 在有效列表中的组件
        const cleanChildren = component.children.filter(child => {
          const slot = child.props?._slot
          if (!slot) return true // 不是 slot 子组件，保留
          return validSlotNames.includes(slot)
        })
        
        // 如果 children 发生了变化，且 updates 中没有显式指定 children，则更新 children
        if (cleanChildren.length !== component.children.length && !updates.children) {
            updates.children = cleanChildren
        }
        console.log('cleanChildren', cleanChildren)
      }

      Object.assign(component, updates)
      pageConfig.value.updatedAt = Date.now()
    }
  }
  
  // 选中组件
  function selectComponent(id: ComponentId | null) {
    if (!id) {
      selectedComponent.value = null
      return
    }
    const component = findComponentInTree(id)
    if (component) {
      selectedComponent.value = {
        id,
        schema: component,
      }
    }
  }
  
  // 移动组件（支持跨容器和排序）
  function moveComponent(
    dragId: ComponentId,
    targetParentId: ComponentId,
    targetIndex?: number,
    slotName?: string
  ) {
    const root = pageConfig.value.rootComponent

    // 1. 查找被拖拽组件
    const component = findComponentInTree(dragId)
    if (!component) {
      console.warn(`Drag component ${dragId} not found`)
      return
    }

    // 2. 查找目标父容器
    const targetParent = findComponentInTree(targetParentId)
    if (!targetParent) {
      console.warn(`Target parent ${targetParentId} not found`)
      return
    }

    // 3. 检查合法性：不能移动到自己内部
    if (dragId === targetParentId) return 
    // 防止把父级移动到自己的子孙节点下面
    if (root.children && isDescendant(targetParentId, dragId, root.children)) {
      console.warn('Cannot move component into its own descendant')
      return
    }
    
    // 4. 获取原父容器信息（用于索引修正）
    let oldIndex = -1
    let oldParentId: string | undefined
    if (root.children) {
      const result = findComponentParent(dragId, root.children)
      if (result) {
        oldIndex = result.index
        oldParentId = result.parent?.id || root.id // 如果 parent 为 null，说明在 root.children 中，父就是 root
      }
    }

    // 5. 从原位置移除
    if (root.children) {
      removeComponentById(dragId, root.children)
    }

    // 6. 更新组件属性 (slot)
    if (slotName) {
        if (!component.props) component.props = {}
        component.props._slot = slotName
    } else {
        if (component.props && component.props._slot) {
            delete component.props._slot
        }
    }
    
    // 7. 插入到新位置
    if (!targetParent.children) {
        targetParent.children = []
    }
    
    // 计算最终插入索引
    let finalIndex = targetIndex !== undefined ? targetIndex : targetParent.children.length
    
    // 如果是同容器内移动，且原位置在目标位置之前，移除后会导致目标位置索引前移
    // 注意：这里我们假设 targetIndex 是基于“移除前”的视图计算的（通常 hover 是这样）
    // 或者我们统一约定：targetIndex 是“期望插入的位置”，如果同容器且 old < target，说明我们想插在更后面
    // 例如 [A, B, C], 把 A (0) 移到 C (2) 后面 (3)。
    // 移除 A -> [B, C]。 插入到 3? 越界。应该是 2。
    // 所以 oldIndex < finalIndex 时，finalIndex--
    if (oldParentId === targetParentId && oldIndex !== -1 && oldIndex < finalIndex) {
        finalIndex--
    }

    // 边界检查
    if (finalIndex < 0) finalIndex = 0
    if (finalIndex > targetParent.children.length) finalIndex = targetParent.children.length
    
    targetParent.children.splice(finalIndex, 0, component)
    pageConfig.value.updatedAt = Date.now()
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
  }
})
