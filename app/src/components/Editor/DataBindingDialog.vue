<script setup lang="ts">
import { ref, computed } from 'vue'
import { useEditorStore } from '@/stores/editor'
import { useDataSourceStore } from '@/stores/dataSource'
import { useComponentStore } from '@/stores/component'
import { ElDialog, ElTabs, ElTabPane, ElSelect, ElOption, ElButton, ElInput, ElAlert } from 'element-plus'
import type { ComponentSchema } from '@/types/component'
import type { DataBinding } from '@/types/dataSource'
import { ComponentType } from '@/types/component'

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

const allComponents = computed(() => {
  const components: ComponentSchema[] = []
  const traverse = (schema: ComponentSchema) => {
    components.push(schema)
    if (schema.children) {
      schema.children.forEach(traverse)
    }
  }
  editorStore.pageConfig.components.forEach(traverse)
  return components
})

// 判断选中的组件是否是表单组件
const isFormComponent = computed(() => {
  if (!selectedComponent.value) return false
  const component = allComponents.value.find(c => c.id === selectedComponent.value)
  if (!component) return false
  return [
    ComponentType.Input,
    ComponentType.Select,
    ComponentType.DatePicker
  ].includes(component.type)
})

const allDataSources = computed(() => dataSourceStore.dataSources)

function handleSave() {
  let binding: DataBinding | null = null
  if (activeTab.value === 'dataSource' && selectedDataSource.value) {
    binding = {
      type: 'dataSource',
      dataSourceId: selectedDataSource.value,
      path: dataPath.value,
    }
  } else if (activeTab.value === 'componentState' && selectedComponent.value) {
    binding = {
      type: 'component',
      componentId: selectedComponent.value,
      // 对于表单组件，路径留空，因为值直接从 formStateStore 获取
      path: isFormComponent.value ? '' : dataPath.value,
    }
  }

  if (binding && props.propKey) {
    emit('save', { propKey: props.propKey, binding })
  }
  emit('update:modelValue', false)
}
</script>

<template>
  <ElDialog
    :model-value="modelValue"
    title="数据绑定"
    width="500px"
    @update:model-value="(val) => emit('update:modelValue', val)"
  >
    <ElTabs v-model="activeTab">
      <ElTabPane label="数据源" name="dataSource">
        <div class="p-4 space-y-4">
          <ElSelect v-model="selectedDataSource" placeholder="选择一个数据源" class="w-full">
            <ElOption
              v-for="ds in allDataSources"
              :key="ds.id"
              :label="ds.name"
              :value="ds.id"
            />
          </ElSelect>
          <ElInput v-model="dataPath" placeholder="例如：data.user.name" />
        </div>
      </ElTabPane>
      <ElTabPane label="组件状态" name="componentState">
        <div class="p-4 space-y-4">
          <ElSelect v-model="selectedComponent" placeholder="选择一个组件" class="w-full">
            <ElOption
              v-for="comp in allComponents"
              :key="comp.id"
              :label="`${comp.label} (${comp.id})`"
              :value="comp.id"
            />
          </ElSelect>
          
          <!-- 如果是表单组件，显示提示信息 -->
          <ElAlert
            v-if="isFormComponent"
            type="info"
            :closable="false"
            show-icon
          >
            <template #title>
              <div class="text-sm">
                这是一个表单组件，将自动绑定到它的输入值。路径可以留空。
              </div>
            </template>
          </ElAlert>
          
          <!-- 对于非表单组件，显示路径输入框 -->
          <ElInput
            v-if="!isFormComponent"
            v-model="dataPath"
            placeholder="例如：props.value 或 props.text"
          />
        </div>
      </ElTabPane>
    </ElTabs>
    <template #footer>
      <ElButton @click="emit('update:modelValue', false)">取消</ElButton>
      <ElButton type="primary" @click="handleSave">保存</ElButton>
    </template>
  </ElDialog>
</template>