/**
 * 组件实例注册表
 */
export class ComponentInstanceRegistry {
  private registry = new Map<string, any>()

  register(id: string, instance: any) {
    if (id && instance) {
      this.registry.set(id, instance)
    }
  }

  unregister(id: string) {
    if (id) {
      this.registry.delete(id)
    }
  }

  getComponent(id: string) {
    return this.registry.get(id)
  }
}
