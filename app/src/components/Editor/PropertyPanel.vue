<script setup lang="ts">
import { computed, ref, h } from 'vue'
import { useEditorStore } from '@/stores/editor'
import { useComponentStore } from '@/stores/component'
import {
  ElInput,
  ElSelect,
  ElColorPicker,
  ElSwitch,
  ElButton,
  ElTabs,
  ElTabPane,
  ElForm,
  ElFormItem,
  ElDialog,
  ElOption,
} from 'element-plus'
import { Link } from '@element-plus/icons-vue'
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

// Render prop input control dynamically
function renderPropInput(schema: ComponentPropSchema, value: any, updateFn: (key: string, val: any) => void) {
  const { key, type, options, placeholder } = schema

  switch (type) {
    case 'text':
    case 'textarea':
      return h(ElInput, {
        modelValue: value,
        type: type === 'textarea' ? 'textarea' : 'text',
        placeholder: placeholder,
        'onUpdate:modelValue': (val: any) => updateFn(key, val),
      })
    case 'json':
      // For now, we'll use a textarea for JSON editing.
      // A dedicated JSON editor component would be a good future enhancement.
      return h(ElInput, {
        modelValue: JSON.stringify(value, null, 2),
        type: 'textarea',
        rows: 5,
        'onUpdate:modelValue': (val: string) => {
          try {
            updateFn(key, JSON.parse(val))
          } catch (e) {
            // Handle JSON parsing errors if needed
            console.error("Invalid JSON format")
          }
        },
      })
    case 'color':
      return h(ElColorPicker, {
        modelValue: value,
        'onUpdate:modelValue': (val: any) => updateFn(key, val),
      })
    case 'switch':
      return h(ElSwitch, {
        modelValue: value,
        'onUpdate:modelValue': (val: any) => updateFn(key, val),
      })
    case 'select':
      return h(ElSelect, {
        modelValue: value,
        'onUpdate:modelValue': (val: any) => updateFn(key, val),
        style: 'width: 100%',
      }, () => options?.map(opt => h(ElOption, { key: opt.value, label: opt.label, value: opt.value })))
    default:
      return h('div', `Unsupported prop type: ${type}`)
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
      <h3 class="text-lg font-semibold text-gray-800">Properties</h3>
    </div>
    
    <div v-if="!selectedComponent" class="flex-1 flex items-center justify-center text-gray-400">
      <div class="text-center">
        <div class="text-4xl mb-2">⚙️</div>
        <div>Please select a component</div>
      </div>
    </div>
    
    <div v-else class="flex-1 flex flex-col overflow-hidden">
      <!-- Component Info -->
      <div class="p-4 border-b">
        <div class="text-sm text-gray-600 mb-1">Component Type</div>
        <div class="text-base font-medium">{{ componentMeta?.name }}</div>
      </div>

      <ElTabs v-model="activeTab" class="flex-1 flex flex-col overflow-hidden">
        <ElTabPane label="Properties" name="props" class="p-4 overflow-y-auto">
          <!-- Property Config -->
          <div class="mb-6">
            <h4 class="text-sm font-medium text-gray-700 mb-3">Properties</h4>
            <div class="space-y-4">
              <div
                v-for="propSchema in propsSchema"
                :key="propSchema.key"
                class="property-item"
              >
                <label class="flex items-center justify-between text-sm text-gray-600 mb-1">
                  <span>{{ propSchema.label }}</span>
                  <ElButton
                    v-if="propSchema.bindable"
                    :icon="Link"
                    type="primary"
                    link
                    size="small"
                    title="Bind Data"
                    @click="openDataBindingDialog(propSchema.key)"
                  />
                </label>
                <component
                  :is="renderPropInput(
                    propSchema,
                    selectedComponent.schema.props[propSchema.key],
                    updateProp
                  )"
                />
              </div>
            </div>
          </div>
          
          <!-- Style Config -->
          <div class="mb-6">
            <h4 class="text-sm font-medium text-gray-700 mb-3">Styles</h4>
            <div class="space-y-4">
              <div class="property-item">
                <label class="flex items-center justify-between text-sm text-gray-600 mb-1">
                  <span>Width</span>
                  <ElButton :icon="Link" type="primary" link size="small" title="Bind Data" @click="openDataBindingDialog('style.width')" />
                </label>
                <ElInput
                  :model-value="selectedComponent.schema.style.width || ''"
                  placeholder="auto"
                  @update:model-value="(val) => updateStyle('width', val)"
                />
              </div>
              <div class="property-item">
                <label class="flex items-center justify-between text-sm text-gray-600 mb-1">
                  <span>Height</span>
                  <ElButton :icon="Link" type="primary" link size="small" title="Bind Data" @click="openDataBindingDialog('style.height')" />
                </label>
                <ElInput
                  :model-value="selectedComponent.schema.style.height || ''"
                  placeholder="auto"
                  @update:model-value="(val) => updateStyle('height', val)"
                />
              </div>
              <div class="property-item">
                <label class="flex items-center justify-between text-sm text-gray-600 mb-1">
                  <span>Padding</span>
                  <ElButton :icon="Link" type="primary" link size="small" title="Bind Data" @click="openDataBindingDialog('style.padding')" />
                </label>
                <ElInput
                  :model-value="selectedComponent.schema.style.padding || ''"
                  placeholder="0"
                  @update:model-value="(val) => updateStyle('padding', val)"
                />
              </div>
              <div class="property-item">
                <label class="flex items-center justify-between text-sm text-gray-600 mb-1">
                  <span>Margin</span>
                  <ElButton :icon="Link" type="primary" link size="small" title="Bind Data" @click="openDataBindingDialog('style.margin')" />
                </label>
                <ElInput
                  :model-value="selectedComponent.schema.style.margin || ''"
                  placeholder="0"
                  @update:model-value="(val) => updateStyle('margin', val)"
                />
              </div>
              <div class="property-item">
                <label class="flex items-center justify-between text-sm text-gray-600 mb-1">
                  <span>Background Color</span>
                  <ElButton :icon="Link" type="primary" link size="small" title="Bind Data" @click="openDataBindingDialog('style.backgroundColor')" />
                </label>
                <ElColorPicker
                  :model-value="selectedComponent.schema.style.backgroundColor || '#fff'"
                  @update:model-value="(val) => updateStyle('backgroundColor', val)"
                />
              </div>
              <div class="property-item">
                <label class="flex items-center justify-between text-sm text-gray-600 mb-1">
                  <span>Text Color</span>
                  <ElButton :icon="Link" type="primary" link size="small" title="Bind Data" @click="openDataBindingDialog('style.color')" />
                </label>
                <ElColorPicker
                  :model-value="selectedComponent.schema.style.color || '#333'"
                  @update:model-value="(val) => updateStyle('color', val)"
                />
              </div>
              <div class="property-item">
                <label class="flex items-center justify-between text-sm text-gray-600 mb-1">
                  <span>Font Size</span>
                  <ElButton :icon="Link" type="primary" link size="small" title="Bind Data" @click="openDataBindingDialog('style.fontSize')" />
                </label>
                <ElInput
                  :model-value="selectedComponent.schema.style.fontSize || ''"
                  placeholder="14px"
                  @update:model-value="(val) => updateStyle('fontSize', val)"
                />
              </div>
            </div>
          </div>
        </ElTabPane>

        <ElTabPane label="Events" name="events" class="p-4">
          <div class="flex justify-end mb-4">
            <ElButton @click="openAddEventDialog">Add Event</ElButton>
          </div>
          <div v-if="selectedComponent.schema.events && selectedComponent.schema.events.length > 0">
            <div v-for="eventItem in selectedComponent.schema.events" :key="eventItem.id" class="p-2 border rounded mb-2">
              <div><strong>Trigger:</strong> {{ eventItem.trigger }}</div>
              <div><strong>Action:</strong> {{ eventItem.action.type }}</div>
            </div>
          </div>
          <div v-else class="text-center text-gray-400">
            No events configured.
          </div>
        </ElTabPane>
      </ElTabs>
    </div>

    <!-- Data Binding Dialog -->
    <DataBindingDialog
      v-model="isDataBindingDialogVisible"
      :prop-key="currentBindingProp"
      @save="({ propKey, binding }) => updatePropBinding(propKey, binding)"
    />

    <!-- Event Configuration Dialog -->
    <ElDialog v-model="isEventDialogVisible" title="Configure Event">
      <ElForm v-if="currentEvent.action" :model="currentEvent" label-position="top">
        <ElFormItem label="Trigger">
          <ElSelect v-model="currentEvent.trigger">
            <ElOption label="On Click" value="onClick" />
          </ElSelect>
        </ElFormItem>
        <ElFormItem label="Action Type">
          <ElSelect v-model="currentEvent.action.type">
            <ElOption label="Show Message" value="showMessage" />
          </ElSelect>
        </ElFormItem>
        
        <div v-if="currentEvent.action?.type === 'showMessage' && currentEvent.action.config">
          <ElFormItem label="Message">
            <ElInput v-model="(currentEvent.action.config as ShowMessageActionConfig).message" />
          </ElFormItem>
          <ElFormItem label="Message Type">
            <ElSelect v-model="(currentEvent.action.config as ShowMessageActionConfig).messageType">
              <ElOption label="Success" value="success" />
              <ElOption label="Warning" value="warning" />
              <ElOption label="Error" value="error" />
            </ElSelect>
          </ElFormItem>
        </div>
      </ElForm>
      <template #footer>
        <ElButton @click="isEventDialogVisible = false">Cancel</ElButton>
        <ElButton type="primary" @click="handleSaveEvent">Save</ElButton>
      </template>
    </ElDialog>
  </div>
</template>

<style>
.property-panel .el-tabs__header {
  margin-bottom: 0;
  padding: 0 10px;
}
.property-panel .el-tabs__content {
  flex-grow: 1;
  overflow: hidden;
}
.property-panel .el-tab-pane {
  height: 100%;
}
</style>

