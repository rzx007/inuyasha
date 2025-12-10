<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useEditorStore } from '@/stores/editor'
import { useDataSourceStore } from '@/stores/dataSource'
import { useComponentStore } from '@/stores/component'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem, SelectGroup, SelectLabel } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ChevronRight, ChevronDown, Check } from 'lucide-vue-next'
import type { ComponentSchema } from '@/types/component'
import type { DataBinding } from '@/types/dataSource'

interface Props {
  modelValue: boolean
  propKey: string | null
}
const props = defineProps<Props>()
const emit = defineEmits(['update:modelValue', 'save'])

const editorStore = useEditorStore()
const dataSourceStore = useDataSourceStore()
const componentStore = useComponentStore()
const activeTab = ref('dataSource')
const selectedDataSource = ref<string | null>(null)
const selectedComponent = ref<string | null>(null)
const dataPath = ref('')
const selectedPropertyPath = ref<string>('')

// Path Selection Logic
const dataSourceTree = computed(() => {
  if (!selectedDataSource.value) return []
  const ds = dataSourceStore.dataSources[selectedDataSource.value]
  if (!ds || !ds.data) return []
  
  // Recursively build tree from data
  return buildTreeFromData(ds.data)
})

function buildTreeFromData(data: any, prefix = ''): any[] {
  if (typeof data !== 'object' || data === null) return []
  
  return Object.keys(data).map(key => {
    const value = data[key]
    const currentPath = prefix ? `${prefix}.${key}` : key
    const isObject = typeof value === 'object' && value !== null
    const isArray = Array.isArray(value)
    
    return {
      label: key,
      path: currentPath,
      type: isArray ? 'array' : (isObject ? 'object' : typeof value),
      value: isObject ? undefined : value,
      children: isObject ? buildTreeFromData(value, currentPath) : undefined
    }
  })
}

const expandedPaths = ref<Set<string>>(new Set())
const toggleExpand = (path: string) => {
  if (expandedPaths.value.has(path)) {
    expandedPaths.value.delete(path)
  } else {
    expandedPaths.value.add(path)
  }
}

const selectPath = (path: string) => {
  dataPath.value = path
}

const allComponents = computed(() => {
  const components: ComponentSchema[] = []
  const traverse = (schema: ComponentSchema) => {
    components.push(schema)
    if (schema.children) {
      schema.children.forEach(traverse)
    }
  }
  // 从 rootComponent 开始遍历
  const rootComponent = editorStore.pageConfig.rootComponent
  if (rootComponent) {
    traverse(rootComponent)
  }
  return components
})

// 获取选中组件的属性选项（按分组）
const componentPropertyOptions = computed(() => {
  if (!selectedComponent.value) return []
  
  const component = allComponents.value.find(c => c.id === selectedComponent.value)
  if (!component) return []
  
  const componentMeta = componentStore.getComponentMeta(component.type)
  
  const options: Array<{
    label: string
    options: Array<{ label: string; value: string }>
  }> = []
  
  // ModelValue 分组
  if (componentMeta?.propsSchema) {
    const modelValueOptions = componentMeta.propsSchema
      .filter(schema => schema.vModel)
      .map(schema => ({
        label: schema.key,
        value: schema.key
      }))
    if (modelValueOptions.length > 0) {
      options.push({
        label: 'ModelValue (双向绑定)',
        options: modelValueOptions
      })
    }
  }
  
  // Props 分组
  const propsOptions = Object.keys(component.props).map(key => ({
    label: key,
    value: key
  }))
  if (propsOptions.length > 0) {
    options.push({
      label: 'Props (属性)',
      options: propsOptions
    })
  }
  
  // Style 分组
  const styleOptions = Object.keys(component.style).map(key => ({
    label: key,
    value: key
  }))
  if (styleOptions.length > 0) {
    options.push({
      label: 'Style (样式)',
      options: styleOptions
    })
  }
  
  return options
})

const allDataSources = computed(() => dataSourceStore.dataSources)

// 初始化状态(对话框打开或propKey变化时)
watch(
  [() => props.modelValue, () => props.propKey],
  ([isOpen, propKey]) => {
    if (isOpen && propKey) {
      const selectedComp = editorStore.selectedComponent
      if (!selectedComp) return

      let binding: DataBinding | undefined
      
      // 检查是否是样式绑定
      if (propKey.startsWith('style.')) {
        binding = selectedComp.schema.props[`${propKey}_binding`]
      } else {
        binding = selectedComp.schema.props[`${propKey}_binding`]
      }

      if (binding) {
        if (binding.type === 'dataSource' && binding.dataSourceId) {
          activeTab.value = 'dataSource'
          selectedDataSource.value = binding.dataSourceId
          dataPath.value = binding.path || ''
        } else if (binding.type === 'component' && binding.componentId) {
          activeTab.value = 'componentState'
          selectedComponent.value = binding.componentId
          
          let simplifiedPath = binding.path || ''
            
          selectedPropertyPath.value = simplifiedPath
        }
      } else {
        // 如果没有绑定，则重置
        activeTab.value = 'dataSource'
        selectedDataSource.value = null
        dataPath.value = ''
        selectedComponent.value = null
        selectedPropertyPath.value = ''
      }
    }
  },
  { immediate: true }
)

function handleSave() {
  let binding: DataBinding | null = null
  if (activeTab.value === 'dataSource' && selectedDataSource.value) {
    binding = {
      type: 'dataSource',
      dataSourceId: selectedDataSource.value,
      path: dataPath.value,
    }
  } else if (activeTab.value === 'componentState' && selectedComponent.value && selectedPropertyPath.value) {
    binding = {
      type: 'component',
      componentId: selectedComponent.value,
      path: selectedPropertyPath.value,
    }
  }
  if (binding && props.propKey) {
    emit('save', { propKey: props.propKey, binding })
  }
  emit('update:modelValue', false)
}
</script>

<template>
  <Dialog :open="modelValue" @update:open="(val) => emit('update:modelValue', val)">
    <DialogContent class="max-w-xl h-[600px] flex flex-col">
      <DialogHeader>
        <DialogTitle>数据绑定</DialogTitle>
      </DialogHeader>
      
      <Tabs v-model="activeTab" class="w-full flex-1 flex flex-col min-h-0">
        <TabsList class="grid w-full grid-cols-2">
          <TabsTrigger value="dataSource">数据源</TabsTrigger>
          <TabsTrigger value="componentState">组件状态</TabsTrigger>
        </TabsList>
        
        <TabsContent value="dataSource" class="flex-1 flex flex-col gap-4 mt-4 min-h-0">
          <div class="space-y-2 shrink-0">
            <label class="text-sm font-medium">数据源</label>
            <Select v-model="selectedDataSource">
              <SelectTrigger class="w-full">
                <SelectValue placeholder="选择一个数据源" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem
                  v-for="ds in allDataSources"
                  :key="ds.id"
                  :value="ds.id"
                >
                  {{ ds.name }}
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div class="space-y-2 shrink-0">
            <label class="text-sm font-medium">数据路径</label>
            <div class="flex gap-2">
              <Input v-model="dataPath" placeholder="例如：data.user.name" />
            </div>
          </div>

          <div class="flex-1 border rounded-md overflow-hidden flex flex-col">
             <div class="bg-slate-50 px-3 py-2 border-b text-xs font-medium text-slate-500">
               数据结构预览 (点击选择)
             </div>
             <div class="flex-1 overflow-auto p-2">
               <div v-if="!selectedDataSource" class="text-slate-400 text-sm text-center py-4">
                 请先选择数据源
               </div>
               <div v-else-if="dataSourceTree.length === 0" class="text-slate-400 text-sm text-center py-4">
                 该数据源暂无数据，请先运行测试获取数据
               </div>
               <div v-else class="space-y-1">
                 <!-- Recursive Tree Node Component -->
                 <template v-for="node in dataSourceTree" :key="node.path">
                   <div class="text-sm">
                     <div 
                       class="flex items-center gap-1 hover:bg-slate-100 rounded px-2 py-1 cursor-pointer group"
                       :class="{ 'bg-blue-50 text-blue-600': dataPath === node.path }"
                       @click="node.children ? toggleExpand(node.path) : selectPath(node.path)"
                     >
                       <div v-if="node.children" class="w-4 h-4 flex items-center justify-center">
                         <ChevronDown v-if="expandedPaths.has(node.path)" :size="14" />
                         <ChevronRight v-else :size="14" />
                       </div>
                       <div v-else class="w-4 h-4"></div>
                       
                       <span class="font-mono">{{ node.label }}</span>
                       <span v-if="node.type" class="text-xs text-slate-400 ml-2">{{ node.type }}</span>
                       <span v-if="node.value !== undefined" class="text-xs text-slate-400 ml-auto truncate max-w-[100px]">{{ node.value }}</span>
                       <Check v-if="dataPath === node.path" :size="14" class="ml-auto text-blue-600" />
                     </div>
                     
                     <!-- Children -->
                     <div v-if="node.children && expandedPaths.has(node.path)" class="pl-4 border-l border-slate-100 ml-2">
                       <template v-for="child in node.children" :key="child.path">
                          <!-- Simplified recursive rendering for 1 level deep to avoid complex component logic in single file -->
                          <!-- In a real app, extract this to a recursive component -->
                          <div 
                             class="flex items-center gap-1 hover:bg-slate-100 rounded px-2 py-1 cursor-pointer"
                             :class="{ 'bg-blue-50 text-blue-600': dataPath === child.path }"
                             @click="selectPath(child.path)"
                           >
                             <div class="w-4 h-4"></div>
                             <span class="font-mono">{{ child.label }}</span>
                             <span v-if="child.type" class="text-xs text-slate-400 ml-2">{{ child.type }}</span>
                             <Check v-if="dataPath === child.path" :size="14" class="ml-auto text-blue-600" />
                           </div>
                       </template>
                     </div>
                   </div>
                 </template>
               </div>
             </div>
          </div>
        </TabsContent>
        
        <TabsContent value="componentState" class="space-y-4 mt-4 min-h-0 overflow-auto">
          <div class="space-y-2">
            <label class="text-sm font-medium">组件</label>
            <Select v-model="selectedComponent">
              <SelectTrigger class="w-full">
                <SelectValue placeholder="选择一个组件" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem
                  v-for="comp in allComponents"
                  :key="comp.id"
                  :value="comp.id"
                >
                  {{ comp.label }} ({{ comp.semanticId }})
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div v-if="selectedComponent" class="space-y-2">
            <label class="text-sm font-medium">属性</label>
            <Select v-model="selectedPropertyPath">
              <SelectTrigger class="w-full">
                <SelectValue placeholder="选择要绑定的属性" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup
                  v-for="group in componentPropertyOptions"
                  :key="group.label"
                >
                  <SelectLabel>{{ group.label }}</SelectLabel>
                  <SelectItem
                    v-for="option in group.options"
                    :key="option.value"
                    :value="option.value"
                  >
                    {{ option.label }}
                  </SelectItem>
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>
        </TabsContent>
      </Tabs>
      
      <DialogFooter class="mt-4">
        <Button variant="outline" @click="emit('update:modelValue', false)">取消</Button>
        <Button @click="handleSave">保存</Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>
