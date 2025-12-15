import { nanoid } from 'nanoid'
import type { ComponentId, ComponentSchema, ComponentType } from '@inuyasha/core'
import { SelectedComponent, PageConfig, EditorMode } from '@inuyasha/core'
import { findComponentById, removeComponentById, findComponentParent, isDescendant } from '@inuyasha/component'

/**
 * Editor store logic
 */
export class EditorStore {
  // 编辑器模式
  mode: EditorMode = EditorMode.Edit
  
  // 当前页面配置
  pageConfig: PageConfig
  
  // 选中的组件
  selectedComponent: SelectedComponent | null = null
  
  // 操作历史（用于撤销/重做）
  history: any[] = []
  historyIndex = -1

  constructor(pageConfig: PageConfig) {
    this.pageConfig = pageConfig
  }

  // 计算属性
  get isEditMode() {
    return this.mode === EditorMode.Edit
  }

  get isPreviewMode() {
    return this.mode === EditorMode.Preview
  }

  get hasSelected() {
    return this.selectedComponent !== null
  }

  // 切换模式
  setMode(newMode: EditorMode) {
    this.mode = newMode
    if (newMode === EditorMode.Preview) {
      this.selectedComponent = null
    }
  }

  // 创建默认的 PageRoot
  createDefaultPageRoot(type: ComponentType, name: string, defaultProps: any, defaultStyle: any): ComponentSchema {
    return {
      id: nanoid(),
      semanticId: 'pageRoot1',
      type,
      label: name,
      props: { ...defaultProps },
      style: { ...defaultStyle },
      children: [],
    }
  }

  // 在整个组件树中查找组件（包括 rootComponent 本身）
  findComponentInTree(id: ComponentId): ComponentSchema | null {
    const root = this.pageConfig.rootComponent
    if (root.id === id) {
      return root
    }
    if (root.children) {
      return findComponentById(id, root.children)
    }
    return null
  }

  // 设置页面配置
  setPageConfig(config: PageConfig) {
    // 确保 rootComponent 存在
    if (!config.rootComponent) {
      // This should be handled by the caller with proper defaults
      throw new Error('PageConfig must have a rootComponent')
    }
    // 确保 dataSources 字段存在（向后兼容）
    if (!config.dataSources) {
      config.dataSources = {}
    }

    this.pageConfig = config
  }

  // 获取 PageRoot
  getPageRoot(): ComponentSchema {
    return this.pageConfig.rootComponent
  }

  // 添加组件
  addComponent(component: ComponentSchema, parentId?: ComponentId, index?: number) {
    if (parentId) {
      // 添加到指定父组件
      const parent = this.findComponentInTree(parentId)
      if (parent && parent.children) {
        if (typeof index === 'number' && index >= 0 && index <= parent.children.length) {
          parent.children.splice(index, 0, component)
        } else {
          parent.children.push(component)
        }
      }
    } else {
      // 添加到 PageRoot 的 children
      if (!this.pageConfig.rootComponent.children) {
        this.pageConfig.rootComponent.children = []
      }
      const children = this.pageConfig.rootComponent.children
      if (typeof index === 'number' && index >= 0 && index <= children.length) {
        children.splice(index, 0, component)
      } else {
        children.push(component)
      }
    }
    this.pageConfig.updatedAt = Date.now()
    return this.pageConfig
  }

  // 删除组件（不能删除 PageRoot）
  deleteComponent(id: ComponentId) {
    // 防止删除 PageRoot
    if (id === this.pageConfig.rootComponent.id) {
      console.warn('Cannot delete PageRoot component')
      return
    }
    
    const root = this.pageConfig.rootComponent
    if (root.children) {
      removeComponentById(id, root.children)
    }
    
    if (this.selectedComponent?.id === id) {
      this.selectedComponent = null
    }
    this.pageConfig.updatedAt = Date.now()
    return this.pageConfig
  }

  // 更新组件
  updateComponent(id: ComponentId, updates: Partial<ComponentSchema>) {
    const component = this.findComponentInTree(id)
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
      this.pageConfig.updatedAt = Date.now()
    }
    return this.pageConfig
  }

  // 选中组件
  selectComponent(id: ComponentId | null) {
    if (!id) {
      this.selectedComponent = null
      return
    }
    const component = this.findComponentInTree(id)
    if (component) {
      this.selectedComponent = {
        id,
        schema: component,
      }
    }
  }

  // 移动组件（支持跨容器和排序）
  moveComponent(
    dragId: ComponentId,
    targetParentId: ComponentId,
    targetIndex?: number,
    slotName?: string
  ) {
    const root = this.pageConfig.rootComponent

    // 1. 查找被拖拽组件
    const component = this.findComponentInTree(dragId)
    if (!component) {
      console.warn(`Drag component ${dragId} not found`)
      return
    }

    // 2. 查找目标父容器
    const targetParent = this.findComponentInTree(targetParentId)
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
    if (oldParentId === targetParentId && oldIndex !== -1 && oldIndex < finalIndex) {
        finalIndex--
    }

    // 边界检查
    if (finalIndex < 0) finalIndex = 0
    if (finalIndex > targetParent.children.length) finalIndex = targetParent.children.length
    
    targetParent.children.splice(finalIndex, 0, component)
    this.pageConfig.updatedAt = Date.now()
    return this.pageConfig
  }
}
