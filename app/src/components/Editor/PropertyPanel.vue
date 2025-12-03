<script setup lang="ts">
import { computed, ref } from 'vue'
import { useEditorStore } from '@/stores/editor'
import { useComponentStore } from '@/stores/component'
import {
  ElForm,
  ElFormItem,
  ElSelect,
  ElOption,
} from 'element-plus'
import { Link } from '@element-plus/icons-vue'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Button } from '@/components/ui/button'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import type { ComponentPropSchema } from '@/types/component'
import type { EventBinding, ShowMessageActionConfig } from '@/types/event'
import { nanoid } from 'nanoid'
import DataBindingDialog from './DataBindingDialog.vue'
import type { DataBinding } from '@/types/dataSource'

const editorStore = useEditorStore()
const componentStore = useComponentStore()
const activeTab = ref('props')
const isEventDialogVisible = ref(false)
const isDataBindingDialogVisible = ref(false)
const currentEvent = ref<Partial<EventBinding>>({})
const currentBindingProp = ref<string | null>(null)

function updatePropBinding(propKey: string, binding: DataBinding | null) {
  if (!selectedComponent.value) return

  // This is a simplified implementation. A more robust solution
  // would merge bindings with props, e.g., in a `bindings` property
  // on the component schema.
  const updatedProps = {
    ...selectedComponent.value.schema.props,
    [`${propKey}_binding`]: binding,
  }
  
  editorStore.updateComponent(selectedComponent.value.id, {
    props: updatedProps,
  })
}

const selectedComponent = computed(() => editorStore.selectedComponent)

const componentMeta = computed(() => {
  if (!selectedComponent.value) return null
  return componentStore.getComponentMeta(selectedComponent.value.schema.type)
})

const propsSchema = computed(() => componentMeta.value?.propsSchema || [])

function updateProp(key: string, value: any) {
  if (!selectedComponent.value) return
  
  const updatedProps = {
    ...selectedComponent.value.schema.props,
    [key]: value,
  }
  
  editorStore.updateComponent(selectedComponent.value.id, {
    props: updatedProps,
  })
}

function updateStyle(key: string, value: any) {
  if (!selectedComponent.value) return
  
  const updatedStyle = {
    ...selectedComponent.value.schema.style,
    [key]: value,
  }
  
  editorStore.updateComponent(selectedComponent.value.id, {
    style: updatedStyle,
  })
}

// Helper function to get prop value
function getPropValue(schema: ComponentPropSchema) {
  return selectedComponent.value?.schema.props[schema.key]
}

// Helper function to update prop value
function handlePropUpdate(schema: ComponentPropSchema, value: any) {
  updateProp(schema.key, value)
}

// Helper function for JSON update
function handleJsonUpdate(schema: ComponentPropSchema, value: string) {
  try {
    updateProp(schema.key, JSON.parse(value))
  } catch (e) {
    console.error("Invalid JSON format")
  }
}

function openAddEventDialog() {
  currentEvent.value = {
    id: nanoid(),
    trigger: 'onClick',
    action: {
      type: 'showMessage',
      config: { message: 'Hello!', messageType: 'success' } as ShowMessageActionConfig,
    },
  }
  isEventDialogVisible.value = true
}

function openDataBindingDialog(propKey: string) {
  currentBindingProp.value = propKey
  isDataBindingDialogVisible.value = true
}

function handleSaveEvent() {
  if (!selectedComponent.value) return
  const events = [...(selectedComponent.value.schema.events || [])]
  const existingIndex = events.findIndex(e => e.id === currentEvent.value.id)

  if (existingIndex > -1) {
    events[existingIndex] = currentEvent.value as EventBinding
  } else {
    events.push(currentEvent.value as EventBinding)
  }

  editorStore.updateComponent(selectedComponent.value.id, { events })
  isEventDialogVisible.value = false
}
</script>

<template>
  <div class="property-panel h-full flex flex-col bg-white border-l border-gray-200">
    <div class="p-4 border-b border-gray-200">
      <h3 class="text-lg font-semibold text-gray-800">属性配置</h3>
    </div>
    
    <div v-if="!selectedComponent" class="flex-1 flex items-center justify-center text-gray-400">
      <div class="text-center">
        <div class="text-4xl mb-2">⚙️</div>
        <div>请选择一个组件</div>
      </div>
    </div>
    
    <div v-else class="flex-1 flex flex-col overflow-hidden">
      <!-- Component Info -->
      <div class="p-4 border-b">
        <div class="text-sm text-gray-600 mb-1">组件类型</div>
        <div class="text-base font-medium">{{ componentMeta?.name }}</div>
      </div>

      <Tabs v-model="activeTab" class="flex-1 flex flex-col overflow-hidden">
        <TabsList class="w-full justify-start rounded-none border-b">
          <TabsTrigger value="props">Properties</TabsTrigger>
          <TabsTrigger value="events">Events</TabsTrigger>
        </TabsList>
        <TabsContent value="props" class="p-4 overflow-y-auto flex-1">
          <!-- Property Config -->
          <div class="mb-6">
            <h4 class="text-sm font-medium text-gray-700 mb-3">属性配置</h4>
            <div class="space-y-4">
              <div
                v-for="propSchema in propsSchema"
                :key="propSchema.key"
                class="property-item"
              >
                <label class="flex items-center justify-between text-sm text-gray-600 mb-1">
                  <span>{{ propSchema.label }}</span>
                  <Button
                    v-if="propSchema.bindable"
                    variant="ghost"
                    size="sm"
                    title="绑定数据"
                    @click="openDataBindingDialog(propSchema.key)"
                    class="h-6 w-6 p-0"
                  >
                    <Link class="h-4 w-4" />
                  </Button>
                </label>
                
                <!-- Text Input -->
                <Input
                  v-if="propSchema.type === 'text'"
                  :model-value="getPropValue(propSchema)"
                  :placeholder="propSchema.placeholder"
                  @update:model-value="(val) => handlePropUpdate(propSchema, val)"
                />
                
                <!-- Textarea -->
                <Textarea
                  v-else-if="propSchema.type === 'textarea'"
                  :model-value="getPropValue(propSchema)"
                  :placeholder="propSchema.placeholder"
                  @update:model-value="(val) => handlePropUpdate(propSchema, val)"
                />
                
                <!-- JSON Textarea -->
                <Textarea
                  v-else-if="propSchema.type === 'json'"
                  :model-value="JSON.stringify(getPropValue(propSchema), null, 2)"
                  class="min-h-[120px]"
                  @update:model-value="(val) => handleJsonUpdate(propSchema, val)"
                />
                
                <!-- Color Picker -->
                <input
                  v-else-if="propSchema.type === 'color'"
                  type="color"
                  :value="getPropValue(propSchema) || '#000000'"
                  class="w-full h-9 rounded-md border border-input cursor-pointer"
                  @input="(e) => handlePropUpdate(propSchema, (e.target as HTMLInputElement).value)"
                />
                
                <!-- Switch -->
                <Switch
                  v-else-if="propSchema.type === 'switch'"
                  :checked="getPropValue(propSchema)"
                  @update:checked="(val: any) => handlePropUpdate(propSchema, val)"
                />
                
                <!-- Select -->
                <Select
                  v-else-if="propSchema.type === 'select'"
                  :model-value="getPropValue(propSchema)"
                  @update:model-value="(val) => handlePropUpdate(propSchema, val)"
                >
                  <SelectTrigger class="w-full">
                    <SelectValue :placeholder="propSchema.placeholder || '请选择'" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem
                      v-for="opt in propSchema.options"
                      :key="opt.value"
                      :value="opt.value"
                    >
                      {{ opt.label }}
                    </SelectItem>
                  </SelectContent>
                </Select>
                
                <!-- Number Input -->
                <Input
                  v-else-if="propSchema.type === 'number'"
                  type="number"
                  :model-value="getPropValue(propSchema)"
                  @update:model-value="(val) => handlePropUpdate(propSchema, Number(val))"
                />
                
                <!-- Unsupported Type -->
                <div v-else class="text-sm text-red-500">
                  Unsupported prop type: {{ propSchema.type }}
                </div>
              </div>
            </div>
          </div>
          
          <!-- Style Config -->
          <div class="mb-6">
            <h4 class="text-sm font-medium text-gray-700 mb-3">样式配置</h4>
            <div class="space-y-4">
              <div class="property-item">
                <label class="flex items-center justify-between text-sm text-gray-600 mb-1">
                  <span>宽度</span>
                  <Button variant="ghost" size="sm" title="Bind Data" @click="openDataBindingDialog('style.width')" class="h-6 w-6 p-0">
                    <Link class="h-4 w-4" />
                  </Button>
                </label>
                <Input
                  :model-value="selectedComponent.schema.style.width || ''"
                  placeholder="auto"
                  @update:model-value="(val) => updateStyle('width', val)"
                />
              </div>
              <div class="property-item">
                <label class="flex items-center justify-between text-sm text-gray-600 mb-1">
                  <span>高度</span>
                  <Button variant="ghost" size="sm" title="Bind Data" @click="openDataBindingDialog('style.height')" class="h-6 w-6 p-0">
                    <Link class="h-4 w-4" />
                  </Button>
                </label>
                <Input
                  :model-value="selectedComponent.schema.style.height || ''"
                  placeholder="auto"
                  @update:model-value="(val) => updateStyle('height', val)"
                />
              </div>
              <div class="property-item">
                <label class="flex items-center justify-between text-sm text-gray-600 mb-1">
                  <span>内边距</span>
                  <Button variant="ghost" size="sm" title="Bind Data" @click="openDataBindingDialog('style.padding')" class="h-6 w-6 p-0">
                    <Link class="h-4 w-4" />
                  </Button>
                </label>
                <Input
                  :model-value="selectedComponent.schema.style.padding || ''"
                  placeholder="0"
                  @update:model-value="(val) => updateStyle('padding', val)"
                />
              </div>
              <div class="property-item">
                <label class="flex items-center justify-between text-sm text-gray-600 mb-1">
                  <span>外边距</span>
                  <Button variant="ghost" size="sm" title="Bind Data" @click="openDataBindingDialog('style.margin')" class="h-6 w-6 p-0">
                    <Link class="h-4 w-4" />
                  </Button>
                </label>
                <Input
                  :model-value="selectedComponent.schema.style.margin || ''"
                  placeholder="0"
                  @update:model-value="(val) => updateStyle('margin', val)"
                />
              </div>
              <div class="property-item">
                <label class="flex items-center justify-between text-sm text-gray-600 mb-1">
                  <span>背景颜色</span>
                  <Button variant="ghost" size="sm" title="Bind Data" @click="openDataBindingDialog('style.backgroundColor')" class="h-6 w-6 p-0">
                    <Link class="h-4 w-4" />
                  </Button>
                </label>
                <input
                  type="color"
                  :value="selectedComponent.schema.style.backgroundColor || '#ffffff'"
                  class="w-full h-9 rounded-md border border-input cursor-pointer"
                  @input="(e) => updateStyle('backgroundColor', (e.target as HTMLInputElement).value)"
                />
              </div>
              <div class="property-item">
                <label class="flex items-center justify-between text-sm text-gray-600 mb-1">
                    <span>文字颜色</span>
                  <Button variant="ghost" size="sm" title="Bind Data" @click="openDataBindingDialog('style.color')" class="h-6 w-6 p-0">
                    <Link class="h-4 w-4" />
                  </Button>
                </label>
                <input
                  type="color"
                  :value="selectedComponent.schema.style.color || '#333333'"
                  class="w-full h-9 rounded-md border border-input cursor-pointer"
                  @input="(e) => updateStyle('color', (e.target as HTMLInputElement).value)"
                />
              </div>
              <div class="property-item">
                <label class="flex items-center justify-between text-sm text-gray-600 mb-1">
                  <span>字体大小</span>
                  <Button variant="ghost" size="sm" title="Bind Data" @click="openDataBindingDialog('style.fontSize')" class="h-6 w-6 p-0">
                    <Link class="h-4 w-4" />
                  </Button>
                </label>
                <Input
                  :model-value="selectedComponent.schema.style.fontSize || ''"
                  placeholder="14px"
                  @update:model-value="(val) => updateStyle('fontSize', val)"
                />
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="events" class="p-4 flex-1 overflow-y-auto">
          <div class="flex justify-end mb-4">
            <Button @click="openAddEventDialog">添加事件</Button>
          </div>
          <div v-if="selectedComponent.schema.events && selectedComponent.schema.events.length > 0">
            <div v-for="eventItem in selectedComponent.schema.events" :key="eventItem.id" class="p-2 border rounded mb-2">
              <div><strong>触发器:</strong> {{ eventItem.trigger }}</div>
              <div><strong>动作:</strong> {{ eventItem.action.type }}</div>
            </div>
          </div>
          <div v-else class="text-center text-gray-400">
            没有事件配置。
          </div>
        </TabsContent>
      </Tabs>
    </div>

    <!-- Data Binding Dialog -->
    <DataBindingDialog
      v-model="isDataBindingDialogVisible"
      :prop-key="currentBindingProp"
      @save="({ propKey, binding }) => updatePropBinding(propKey, binding)"
    />

    <!-- Event Configuration Dialog -->
    <Dialog :open="isEventDialogVisible" @update:open="(val) => isEventDialogVisible = val">
      <DialogContent>
        <DialogHeader>
          <DialogTitle>事件配置</DialogTitle>
        </DialogHeader>
        <ElForm v-if="currentEvent.action" :model="currentEvent" label-position="top">
          <ElFormItem label="触发器">
            <ElSelect v-model="currentEvent.trigger">
              <ElOption label="点击" value="onClick" />
            </ElSelect>
          </ElFormItem>
          <ElFormItem label="动作类型">
            <ElSelect v-model="currentEvent.action.type">
              <ElOption label="显示消息" value="showMessage" />
            </ElSelect>
          </ElFormItem>
          
          <div v-if="currentEvent.action?.type === 'showMessage' && currentEvent.action.config">
            <ElFormItem label="消息">
              <Input v-model="(currentEvent.action.config as ShowMessageActionConfig).message" />
            </ElFormItem>
            <ElFormItem label="消息类型">
              <ElSelect v-model="(currentEvent.action.config as ShowMessageActionConfig).messageType">
                <ElOption label="成功" value="success" />
                <ElOption label="警告" value="warning" />
                <ElOption label="错误" value="error" />
              </ElSelect>
            </ElFormItem>
          </div>
        </ElForm>
        <DialogFooter>
          <Button variant="outline" @click="isEventDialogVisible = false">取消</Button>
          <Button @click="handleSaveEvent">保存</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  </div>
</template>


