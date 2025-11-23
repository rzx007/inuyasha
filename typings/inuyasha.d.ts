declare global {
  // 展示资源
  interface IResource {
    //唯一名称，防止重复注册
    name: string // 组件标题
    icon?: JSX.Element // 图标
    color?: string
  }

  interface IComponentMaterial {
    componentName: string // 组件名称 用于注册
    compoentsTitle?: string // 组件标题
    designerSchema: any // 组件设计器配置
    resource?: IResource // 组件展示资源
    props?: Record<string, any>
    style?: Record<string, any>
    events?: {
      [key: string]: unknown
    }
    data?: {
      [key: string]: unknown
    }
    slots?: { [key: string]: IComponentMaterial[] }
  }

  interface INodeSchema extends IComponentMaterial {
    id: string
    slots?: { [key: string]: INodeSchema[] }[]
  }

  export interface ITreeSchema extends INodeSchema {
    children?: ITreeSchema[]
    slots?: {
      [key: string]: INodeSchema[]
    }
  }
  const DndTypes = {
    ITEM: 'item',
    SHELL: 'shell'
  }

  interface IDragItems {
    source: 'tree' | ''
    schema: ITreeSchema
  }
}
export {}
