import { produce } from 'immer'
import type { ComponentId, ComponentSchema } from '../types'
import { findComponentById, findComponentParent, isDescendant } from '../component'

/** 在组件树（含 root）中查找节点 */
function findInTree(root: ComponentSchema, id: ComponentId): ComponentSchema | null {
  if (root.id === id) return root
  if (root.children) return findComponentById(id, root.children)
  return null
}

/**
 * 不可变更新：更新指定组件
 */
export function updateComponentImmutable(
  root: ComponentSchema,
  id: ComponentId,
  updates: Partial<ComponentSchema>
): ComponentSchema {
  const mergedUpdates = { ...updates }

  // cleanChildren 逻辑（Tabs/Collapse 孤儿清理）- 在 produce 外预计算
  const component = findInTree(root, id)
  if (
    component &&
    updates.props &&
    Array.isArray(updates.props.items) &&
    component.children &&
    !updates.children
  ) {
    const validSlotNames = updates.props.items
      .map((item: { name?: string }) => item.name)
      .filter((name): name is string => name != null)

    const cleanChildren = component.children.filter(child => {
      const slot = child.props?._slot
      if (!slot) return true
      return validSlotNames.includes(slot)
    })

    if (cleanChildren.length !== component.children.length) {
      mergedUpdates.children = cleanChildren
    }
  }

  return produce(root, draft => {
    const node = findInTree(draft, id)
    if (node) Object.assign(node, mergedUpdates)
  })
}

/**
 * 不可变更新：添加组件
 */
export function addComponentImmutable(
  root: ComponentSchema,
  component: ComponentSchema,
  parentId?: ComponentId,
  index?: number
): ComponentSchema {
  return produce(root, draft => {
    const parent = parentId ? findInTree(draft, parentId) : draft
    if (!parent) return

    if (!parent.children) parent.children = []
    if (typeof index === 'number' && index >= 0 && index <= parent.children.length) {
      parent.children.splice(index, 0, component)
    } else {
      parent.children.push(component)
    }
  })
}

/**
 * 在 draft 树中递归查找并删除节点
 */
function removeFromDraft(parent: ComponentSchema, id: ComponentId): boolean {
  if (!parent.children) return false
  const idx = parent.children.findIndex(c => c.id === id)
  if (idx >= 0) {
    parent.children.splice(idx, 1)
    return true
  }
  for (const child of parent.children) {
    if (removeFromDraft(child, id)) return true
  }
  return false
}

/**
 * 不可变更新：删除组件
 */
export function deleteComponentImmutable(root: ComponentSchema, id: ComponentId): ComponentSchema | null {
  if (root.id === id) return null

  return produce(root, draft => {
    if (draft.children) {
      const idx = draft.children.findIndex(c => c.id === id)
      if (idx >= 0) {
        draft.children.splice(idx, 1)
        return
      }
    }
    if (draft.children) {
      for (const child of draft.children) {
        if (removeFromDraft(child, id)) return
      }
    }
  })
}

/**
 * 不可变更新：移动组件
 */
export function moveComponentImmutable(
  root: ComponentSchema,
  dragId: ComponentId,
  targetParentId: ComponentId,
  targetIndex?: number,
  slotName?: string
): ComponentSchema | null {
  const component = findInTree(root, dragId)
  const targetParent = findInTree(root, targetParentId)
  if (!component || !targetParent) return null
  if (dragId === targetParentId) return null
  if (root.children && isDescendant(targetParentId, dragId, root.children)) return null

  // 同容器移动时的索引修正
  const result = findComponentParent(dragId, root.children ?? [])
  const oldParentId = result?.parent?.id ?? root.id
  const oldIndex = result?.index ?? -1

  const rootWithRemoved = deleteComponentImmutable(root, dragId)
  if (!rootWithRemoved) return null

  const componentToAdd = { ...component }
  if (slotName) {
    componentToAdd.props = { ...componentToAdd.props, _slot: slotName }
  } else if (componentToAdd.props?._slot) {
    const { _slot, ...rest } = componentToAdd.props
    componentToAdd.props = Object.keys(rest).length ? rest : undefined
  }

  const finalParent = findInTree(rootWithRemoved, targetParentId)
  if (!finalParent) return null

  let index = targetIndex
  if (index === undefined) index = (finalParent.children?.length ?? 0)
  if (oldParentId === targetParentId && oldIndex >= 0 && oldIndex < index) {
    index--
  }
  index = Math.max(0, Math.min(index, finalParent.children?.length ?? 0))

  return addComponentImmutable(rootWithRemoved, componentToAdd, targetParentId, index)
}
