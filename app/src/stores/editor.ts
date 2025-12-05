import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { ComponentId, ComponentSchema } from '@/types/component'
import type { SelectedComponent, PageConfig } from '@/types/editor'
import { EditorMode } from '@/types/editor'
import { findComponentById, removeComponentById } from '@/utils/tree'

export const useEditorStore = defineStore('editor', () => {
  // 编辑器模式
  const mode = ref<EditorMode>(EditorMode.Edit)
  
  // 当前页面配置
  const pageConfig = ref<PageConfig>({
    id: '',
    name: '未命名页面',
    title: '新页面',
    components: [],
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
    pageConfig.value = config
  }
  
  // 添加组件
  function addComponent(component: ComponentSchema, parentId?: ComponentId) {
    if (parentId) {
      // 添加到指定父组件
      const parent = findComponentById(parentId, pageConfig.value.components)
      if (parent && parent.children) {
        parent.children.push(component)
      }
    } else {
      // 添加到根级别
      pageConfig.value.components.push(component)
    }
    pageConfig.value.updatedAt = Date.now()
  }
  
  // 删除组件
  function deleteComponent(id: ComponentId) {
    removeComponentById(id, pageConfig.value.components)
    if (selectedComponent.value?.id === id) {
      selectedComponent.value = null
    }
    pageConfig.value.updatedAt = Date.now()
  }
  
  // 更新组件
  function updateComponent(id: ComponentId, updates: Partial<ComponentSchema>) {
    const component = findComponentById(id, pageConfig.value.components)
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
    const component = findComponentById(id, pageConfig.value.components)
    if (component) {
      selectedComponent.value = {
        id,
        schema: component,
      }
    }
  }
  
  // 移动组件（拖拽排序）
  function moveComponent(
    fromIndex: number,
    toIndex: number,
    parentId?: ComponentId
  ) {
    const components = parentId
      ? findComponentById(parentId, pageConfig.value.components)?.children
      : pageConfig.value.components
    
    if (components) {
      const [moved] = components.splice(fromIndex, 1)
      components.splice(toIndex, 0, moved)
      pageConfig.value.updatedAt = Date.now()
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
    addComponent,
    deleteComponent,
    updateComponent,
    selectComponent,
    moveComponent,
  }
})

