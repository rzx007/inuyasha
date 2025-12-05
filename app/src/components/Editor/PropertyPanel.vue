<script setup lang="ts">
import { computed, ref } from 'vue'
import { useEditorStore } from '@/stores/editor'
import { useComponentStore } from '@/stores/component'
import { ElForm, ElFormItem, ElSelect, ElOption } from 'element-plus'
import { Link } from '@element-plus/icons-vue'
import { MousePointer2, Copy, Trash2, ChevronDown, Sparkles } from 'lucide-vue-next'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem
} from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from '@/components/ui/dialog'
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
    [`${propKey}_binding`]: binding
  }

  editorStore.updateComponent(selectedComponent.value.id, {
    props: updatedProps
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
    [key]: value
  }

  editorStore.updateComponent(selectedComponent.value.id, {
    props: updatedProps
  })
}

function updateStyle(key: string, value: any) {
  if (!selectedComponent.value) return

  const updatedStyle = {
    ...selectedComponent.value.schema.style,
    [key]: value
  }

  editorStore.updateComponent(selectedComponent.value.id, {
    style: updatedStyle
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
    console.error('Invalid JSON format')
  }
}

function openAddEventDialog() {
  currentEvent.value = {
    id: nanoid(),
    trigger: 'onClick',
    action: {
      type: 'showMessage',
      config: { message: 'Hello!', messageType: 'success' } as ShowMessageActionConfig
    }
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

function handleCopyComponent() {
  // TODO: 实现复制组件功能
  console.log('复制组件')
}

function handleDeleteComponent() {
  if (!selectedComponent.value) return
  if (confirm('确定要删除这个组件吗？')) {
    editorStore.deleteComponent(selectedComponent.value.id)
  }
}

// 颜色选择器相关状态
const colorPickerRefs = ref<Record<string, HTMLInputElement | null>>({})

function openColorPicker(key: string) {
  const colorInput = colorPickerRefs.value[key]
  if (colorInput) {
    colorInput.click()
  }
}

function copyToClipboard(text: string) {
  if (window.navigator && window.navigator.clipboard) {
    window.navigator.clipboard.writeText(text).catch(err => {
      console.error('Failed to copy text:', err)
    })
  }
}
</script>

<template>
  <div
    class="property-panel w-80 h-full flex flex-col bg-white border-l border-slate-200 shrink-0"
    style="box-shadow: -4px 0 24px rgba(0, 0, 0, 0.02)"
  >
    <div v-if="!selectedComponent" class="flex-1 flex items-center justify-center text-slate-400">
      <div class="text-center">
        <MousePointer2 :size="48" class="mb-4 text-slate-200 mx-auto" />
        <p class="text-sm font-medium">Select a component to edit</p>
      </div>
    </div>

    <div v-else class="flex-1 flex flex-col overflow-hidden">
      <!-- Header -->
      <div class="px-4 py-4 border-b border-slate-100 bg-white">
        <div class="flex items-center justify-between mb-1">
          <Badge variant="secondary" class="font-semibold bg-slate-100 text-primary border border-slate-200">
            {{ selectedComponent.schema.type.toUpperCase() }}
          </Badge>

          <div class="flex gap-2 text-slate-400">
            <button
              @click="handleCopyComponent"
              class="hover:text-slate-600 transition-colors"
              title="复制组件"
            >
              <Copy :size="14" />
            </button>
            <button
              @click="handleDeleteComponent"
              class="hover:text-red-500 transition-colors"
              title="删除组件"
            >
              <Trash2 :size="14" />
            </button>
          </div>
        </div>
        <h2 class="text-lg font-semibold tracking-wider text-slate-900 truncate flex items-center gap-2.5">
          {{ componentMeta?.name || selectedComponent.schema.label }}
          <p class="text-xs font-thin font-mono text-slate-400 mt-1">ID: {{ selectedComponent.schema.semanticId }}</p>
        </h2>
        
      </div>

      <Tabs v-model="activeTab" class="flex-1 flex flex-col overflow-hidden">
        <TabsList class="tabs-list-editor">
          <TabsTrigger value="props" class="tabs-trigger-editor">Properties</TabsTrigger>
          <TabsTrigger value="events" class="tabs-trigger-editor">Events</TabsTrigger>
        </TabsList>
        <TabsContent value="props" class="overflow-y-auto flex-1 bg-white">
          <div class="space-y-0">
            <!-- 属性配置标题 -->
            <div
              v-if="propsSchema.length > 0"
              class="px-4 py-3 bg-slate-50/50 border-b border-slate-100"
            >
              <h4 class="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                属性配置
              </h4>
            </div>
            <div
              v-for="propSchema in propsSchema"
              :key="propSchema.key"
              class="group border-b border-slate-100 last:border-0 px-4 py-4"
            >
              <!-- Switch 类型：标签和开关在同一行 -->
              <div
                v-if="propSchema.type === 'switch'"
                class="flex items-center justify-between py-1"
              >
                <div class="text-xs font-medium text-slate-500">{{ propSchema.label }}</div>
                <button
                  @click="handlePropUpdate(propSchema, !getPropValue(propSchema))"
                  :class="[
                    'relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2',
                    getPropValue(propSchema) ? 'bg-primary-600' : 'bg-slate-200'
                  ]"
                >
                  <span
                    :class="[
                      'inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform',
                      getPropValue(propSchema) ? 'translate-x-[18px]' : 'translate-x-[2px]'
                    ]"
                  />
                </button>
              </div>

              <!-- 其他类型 -->
              <div v-else class="space-y-1.5">
                <div
                  class="flex items-center justify-between text-xs font-medium text-slate-500 mb-1.5"
                >
                  <span>{{ propSchema.label }}</span>
                  <Button
                    v-if="propSchema.bindable"
                    variant="ghost"
                    size="sm"
                    title="绑定数据"
                    @click="openDataBindingDialog(propSchema.key)"
                    class="h-4 w-4 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Link class="h-3 w-3 text-slate-300" />
                  </Button>
                </div>

                <!-- Text Input -->
                <Input
                  v-if="propSchema.type === 'text'"
                  :model-value="getPropValue(propSchema)"
                  :placeholder="propSchema.placeholder"
                  @update:model-value="val => handlePropUpdate(propSchema, val)"
                  class="w-full px-3 py-2 bg-white border border-slate-200 rounded-md text-sm text-slate-700 focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500 transition-all"
                />

                <!-- Textarea -->
                <Textarea
                  v-else-if="propSchema.type === 'textarea'"
                  :model-value="getPropValue(propSchema)"
                  :placeholder="propSchema.placeholder"
                  @update:model-value="val => handlePropUpdate(propSchema, val)"
                  class="w-full px-3 py-2 bg-white border border-slate-200 rounded-md text-sm text-slate-700 focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500 transition-all"
                />

                <!-- JSON Textarea -->
                <div v-else-if="propSchema.type === 'json'" class="relative group">
                  <Textarea
                    :model-value="JSON.stringify(getPropValue(propSchema), null, 2)"
                    class="w-full h-32 p-3 bg-slate-900 text-slate-300 rounded-md text-xs font-mono resize-none focus:outline-none focus:ring-1 focus:ring-primary-500 border border-slate-800"
                    @update:model-value="
                      (val: string | number) => handleJsonUpdate(propSchema, String(val))
                    "
                  />
                  <div
                    class="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1"
                  >
                    <button
                      @click="copyToClipboard(JSON.stringify(getPropValue(propSchema), null, 2))"
                      class="p-1 bg-slate-700 hover:bg-slate-600 rounded text-white"
                      title="复制"
                    >
                      <Copy :size="12" />
                    </button>
                  </div>
                </div>

                <!-- Color Picker -->
                <div
                  v-else-if="propSchema.type === 'color'"
                  class="flex items-center gap-2 border border-slate-200 rounded-md p-1 bg-white focus-within:ring-1 focus-within:ring-primary-500 focus-within:border-primary-500"
                >
                  <div
                    class="w-6 h-6 rounded border border-slate-200 shadow-sm shrink-0"
                    :style="{ backgroundColor: getPropValue(propSchema) || '#000000' }"
                  />
                  <input
                    type="text"
                    :value="getPropValue(propSchema) || '#000000'"
                    @input="e => handlePropUpdate(propSchema, (e.target as HTMLInputElement).value)"
                    class="flex-1 min-w-0 bg-transparent border-none text-sm text-slate-700 focus:ring-0 p-0"
                    placeholder="#000000"
                  />
                  <input
                    :ref="el => (colorPickerRefs[propSchema.key] = el as HTMLInputElement)"
                    type="color"
                    :value="getPropValue(propSchema) || '#000000'"
                    @input="e => handlePropUpdate(propSchema, (e.target as HTMLInputElement).value)"
                    class="opacity-0 absolute w-0 h-0"
                    :id="`color-picker-${propSchema.key}`"
                  />
                  <div
                    :for="`color-picker-${propSchema.key}`"
                    @click="openColorPicker(propSchema.key)"
                    class="cursor-pointer p-1 hover:bg-slate-100 rounded shrink-0"
                  >
                    <Sparkles :size="14" class="text-slate-400" />
                  </div>
                </div>

                <!-- Select -->
                <div v-else-if="propSchema.type === 'select'" class="relative">
                  <Select
                    :model-value="getPropValue(propSchema)"
                    @update:model-value="val => handlePropUpdate(propSchema, val)"
                  >
                    <SelectTrigger
                      class="w-full px-3 py-2 bg-white border border-slate-200 rounded-md text-sm text-slate-700 appearance-none focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500 transition-all"
                    >
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
                  <ChevronDown
                    class="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
                    :size="14"
                  />
                </div>

                <!-- Number Input -->
                <Input
                  v-else-if="propSchema.type === 'number'"
                  type="number"
                  :model-value="getPropValue(propSchema)"
                  @update:model-value="val => handlePropUpdate(propSchema, Number(val))"
                  class="w-full px-3 py-2 bg-white border border-slate-200 rounded-md text-sm text-slate-700 focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500 transition-all"
                />

                <!-- Unsupported Type -->
                <div v-else class="text-sm text-red-500">
                  Unsupported prop type: {{ propSchema.type }}
                </div>

                <!-- Description -->
                <p v-if="propSchema.description" class="text-[10px] text-slate-400 mt-1">
                  {{ propSchema.description }}
                </p>
              </div>
            </div>
          </div>

          <!-- Style Config -->
          <div class="space-y-0 border-t border-slate-100">
            <div class="px-4 py-3 bg-slate-50/50 border-b border-slate-100">
              <h4 class="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                样式配置
              </h4>
            </div>
            <div class="space-y-0">
              <div class="border-b border-slate-100 last:border-0 px-4 py-4 group">
                <div
                  class="flex items-center justify-between text-xs font-medium text-slate-500 mb-1.5"
                >
                  <span>宽度</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    title="绑定数据"
                    @click="openDataBindingDialog('style.width')"
                    class="h-4 w-4 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Link class="h-3 w-3 text-slate-300" />
                  </Button>
                </div>
                <Input
                  :model-value="selectedComponent.schema.style.width || ''"
                  placeholder="auto"
                  @update:model-value="val => updateStyle('width', val)"
                  class="w-full px-3 py-2 bg-white border border-slate-200 rounded-md text-sm text-slate-700 focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500 transition-all"
                />
              </div>
              <div class="border-b border-slate-100 last:border-0 px-4 py-4">
                <div
                  class="flex items-center justify-between text-xs font-medium text-slate-500 mb-1.5"
                >
                  <span>高度</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    title="绑定数据"
                    @click="openDataBindingDialog('style.height')"
                    class="h-4 w-4 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Link class="h-3 w-3 text-slate-300" />
                  </Button>
                </div>
                <Input
                  :model-value="selectedComponent.schema.style.height || ''"
                  placeholder="auto"
                  @update:model-value="val => updateStyle('height', val)"
                  class="w-full px-3 py-2 bg-white border border-slate-200 rounded-md text-sm text-slate-700 focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500 transition-all"
                />
              </div>
              <div class="border-b border-slate-100 last:border-0 px-4 py-4">
                <div
                  class="flex items-center justify-between text-xs font-medium text-slate-500 mb-1.5"
                >
                  <span>内边距</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    title="绑定数据"
                    @click="openDataBindingDialog('style.padding')"
                    class="h-4 w-4 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Link class="h-3 w-3 text-slate-300" />
                  </Button>
                </div>
                <Input
                  :model-value="selectedComponent.schema.style.padding || ''"
                  placeholder="0"
                  @update:model-value="val => updateStyle('padding', val)"
                  class="w-full px-3 py-2 bg-white border border-slate-200 rounded-md text-sm text-slate-700 focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500 transition-all"
                />
              </div>
              <div class="border-b border-slate-100 last:border-0 px-4 py-4">
                <div
                  class="flex items-center justify-between text-xs font-medium text-slate-500 mb-1.5"
                >
                  <span>外边距</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    title="绑定数据"
                    @click="openDataBindingDialog('style.margin')"
                    class="h-4 w-4 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Link class="h-3 w-3 text-slate-300" />
                  </Button>
                </div>
                <Input
                  :model-value="selectedComponent.schema.style.margin || ''"
                  placeholder="0"
                  @update:model-value="val => updateStyle('margin', val)"
                  class="w-full px-3 py-2 bg-white border border-slate-200 rounded-md text-sm text-slate-700 focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500 transition-all"
                />
              </div>
              <div class="border-b border-slate-100 last:border-0 px-4 py-4">
                <div
                  class="flex items-center justify-between text-xs font-medium text-slate-500 mb-1.5"
                >
                  <span>背景颜色</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    title="绑定数据"
                    @click="openDataBindingDialog('style.backgroundColor')"
                    class="h-4 w-4 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Link class="h-3 w-3 text-slate-300" />
                  </Button>
                </div>
                <div
                  class="flex items-center gap-2 border border-slate-200 rounded-md p-1 bg-white focus-within:ring-1 focus-within:ring-primary-500 focus-within:border-primary-500"
                >
                  <div
                    class="w-6 h-6 rounded border border-slate-200 shadow-sm shrink-0"
                    :style="{
                      backgroundColor: selectedComponent.schema.style.backgroundColor || '#ffffff'
                    }"
                  />
                  <input
                    type="text"
                    :value="selectedComponent.schema.style.backgroundColor || '#ffffff'"
                    @input="
                      e => updateStyle('backgroundColor', (e.target as HTMLInputElement).value)
                    "
                    class="flex-1 min-w-0 bg-transparent border-none text-sm text-slate-700 focus:ring-0 p-0"
                    placeholder="#ffffff"
                  />
                  <input
                    :ref="el => (colorPickerRefs['style.backgroundColor'] = el as HTMLInputElement)"
                    type="color"
                    :value="selectedComponent.schema.style.backgroundColor || '#ffffff'"
                    @input="
                      e => updateStyle('backgroundColor', (e.target as HTMLInputElement).value)
                    "
                    class="opacity-0 absolute w-0 h-0"
                    id="color-picker-style-backgroundColor"
                  />
                  <div
                    for="color-picker-style-backgroundColor"
                    @click="openColorPicker('style.backgroundColor')"
                    class="cursor-pointer p-1 hover:bg-slate-100 rounded shrink-0"
                  >
                    <Sparkles :size="14" class="text-slate-400" />
                  </div>
                </div>
              </div>
              <div class="border-b border-slate-100 last:border-0 px-4 py-4">
                <div
                  class="flex items-center justify-between text-xs font-medium text-slate-500 mb-1.5"
                >
                  <span>文字颜色</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    title="绑定数据"
                    @click="openDataBindingDialog('style.color')"
                    class="h-4 w-4 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Link class="h-3 w-3 text-slate-300" />
                  </Button>
                </div>
                <div
                  class="flex items-center gap-2 border border-slate-200 rounded-md p-1 bg-white focus-within:ring-1 focus-within:ring-primary-500 focus-within:border-primary-500"
                >
                  <div
                    class="w-6 h-6 rounded border border-slate-200 shadow-sm shrink-0"
                    :style="{ backgroundColor: selectedComponent.schema.style.color || '#333333' }"
                  />
                  <input
                    type="text"
                    :value="selectedComponent.schema.style.color || '#333333'"
                    @input="e => updateStyle('color', (e.target as HTMLInputElement).value)"
                    class="flex-1 min-w-0 bg-transparent border-none text-sm text-slate-700 focus:ring-0 p-0"
                    placeholder="#333333"
                  />
                  <input
                    :ref="el => (colorPickerRefs['style.color'] = el as HTMLInputElement)"
                    type="color"
                    :value="selectedComponent.schema.style.color || '#333333'"
                    @input="e => updateStyle('color', (e.target as HTMLInputElement).value)"
                    class="opacity-0 absolute w-0 h-0"
                    id="color-picker-style-color"
                  />
                  <div
                    for="color-picker-style-color"
                    @click="openColorPicker('style.color')"
                    class="cursor-pointer p-1 hover:bg-slate-100 rounded shrink-0"
                  >
                    <Sparkles :size="14" class="text-slate-400" />
                  </div>
                </div>
              </div>
              <div class="border-b border-slate-100 last:border-0 px-4 py-4">
                <div
                  class="flex items-center justify-between text-xs font-medium text-slate-500 mb-1.5"
                >
                  <span>字体大小</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    title="绑定数据"
                    @click="openDataBindingDialog('style.fontSize')"
                    class="h-4 w-4 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Link class="h-3 w-3 text-slate-300" />
                  </Button>
                </div>
                <Input
                  :model-value="selectedComponent.schema.style.fontSize || ''"
                  placeholder="14px"
                  @update:model-value="val => updateStyle('fontSize', val)"
                  class="w-full px-3 py-2 bg-white border border-slate-200 rounded-md text-sm text-slate-700 focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500 transition-all"
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
            <div
              v-for="eventItem in selectedComponent.schema.events"
              :key="eventItem.id"
              class="p-2 border rounded mb-2"
            >
              <div><strong>触发器:</strong> {{ eventItem.trigger }}</div>
              <div><strong>动作:</strong> {{ eventItem.action.type }}</div>
            </div>
          </div>
          <div v-else class="text-center text-gray-400">没有事件配置。</div>
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
    <Dialog :open="isEventDialogVisible" @update:open="val => (isEventDialogVisible = val)">
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
              <ElSelect
                v-model="(currentEvent.action.config as ShowMessageActionConfig).messageType"
              >
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
