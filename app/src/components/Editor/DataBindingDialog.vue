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
  if (componentMeta?.defaultModelValue) {
    const modelValueOptions = Object.keys(componentMeta.defaultModelValue).map(key => ({
      label: key,
      value: `modelValue.${key}`
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
    value: `props.${key}`
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
    value: `style.${key}`
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


// Initialize state when dialog opens or propKey changes
watch(
  [() => props.modelValue, () => props.propKey],
  ([isOpen, propKey]) => {
    if (isOpen && propKey) {
      const selectedComp = editorStore.selectedComponent
      if (!selectedComp) return

      let binding: DataBinding | undefined
      
      // Check if it's a style binding
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
          selectedPropertyPath.value = binding.path || ''
        }
      } else {
        // Reset if no binding
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
    <DialogContent class="max-w-md">
      <DialogHeader>
        <DialogTitle>数据绑定</DialogTitle>
      </DialogHeader>
      
      <Tabs v-model="activeTab" class="w-full">
        <TabsList class="grid w-full grid-cols-2">
          <TabsTrigger value="dataSource">数据源</TabsTrigger>
          <TabsTrigger value="componentState">组件状态</TabsTrigger>
        </TabsList>
        
        <TabsContent value="dataSource" class="space-y-4 mt-4">
          <div class="space-y-2">
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
          <div class="space-y-2">
            <label class="text-sm font-medium">数据路径</label>
            <Input v-model="dataPath" placeholder="例如：data.user.name" />
          </div>
        </TabsContent>
        
        <TabsContent value="componentState" class="space-y-4 mt-4">
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
      
      <DialogFooter>
        <Button variant="outline" @click="emit('update:modelValue', false)">取消</Button>
        <Button @click="handleSave">保存</Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>