import type { ComponentId, ComponentSchema } from '@/types/component'

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
