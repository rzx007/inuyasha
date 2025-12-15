import type { ComponentId, ComponentSchema } from '@inuyasha/core'

/**
 * Finds a component by its ID in a component tree.
 * @param id - The ID of the component to find.
 * @param components - The array of components to search in.
 * @returns The found component schema, or null if not found.
 */
export function findComponentById(
  id: ComponentId,
  components: ComponentSchema[]
): ComponentSchema | null {
  for (const component of components) {
    if (component.id === id) {
      return component
    }
    if (component.children) {
      const found = findComponentById(id, component.children)
      if (found) return found
    }
  }
  return null
}

/**
 * Finds the parent component and index of a component by its ID.
 * @param id - The ID of the component to find.
 * @param components - The array of components to search in.
 * @param parent - The current parent component (internal use).
 * @returns An object containing the parent component and the index, or null if not found.
 */
export function findComponentParent(
  id: ComponentId,
  components: ComponentSchema[],
  parent: ComponentSchema | null = null
): { parent: ComponentSchema | null; index: number } | null {
  for (let i = 0; i < components.length; i++) {
    const component = components[i]
    if (component.id === id) {
      return { parent, index: i }
    }
    if (component.children) {
      const result = findComponentParent(id, component.children, component)
      if (result) return result
    }
  }
  return null
}

/**
 * Checks if a component is a descendant of another component.
 * @param childId - The ID of the potential child component.
 * @param ancestorId - The ID of the potential ancestor component.
 * @param components - The component tree to search.
 * @returns True if childId is a descendant of ancestorId.
 */
export function isDescendant(
  childId: ComponentId,
  ancestorId: ComponentId,
  components: ComponentSchema[]
): boolean {
  const ancestor = findComponentById(ancestorId, components)
  if (!ancestor || !ancestor.children) return false
  
  return findComponentById(childId, ancestor.children) !== null
}

/**
 * Removes a component by its ID from a component tree.
 * @param id - The ID of the component to remove.
 * @param components - The array of components to search in.
 * @returns True if the component was removed, false otherwise.
 */
export function removeComponentById(
  id: ComponentId,
  components: ComponentSchema[]
): boolean {
  for (let i = 0; i < components.length; i++) {
    if (components[i].id === id) {
      components.splice(i, 1)
      return true
    }
    if (components[i].children && removeComponentById(id, components[i].children as ComponentSchema[])) {
      return true
    }
  }
  return false
}
