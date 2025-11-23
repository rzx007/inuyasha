<script setup lang="ts">
import { ref, computed } from 'vue'
import { useEditorStore } from '@/stores/editor'
import { useDataSourceStore } from '@/stores/dataSource'
import { ElDialog, ElTabs, ElTabPane, ElSelect, ElOption, ElButton, ElInput } from 'element-plus'
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
      path: dataPath.value,
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
    title="Data Binding"
    width="500px"
    @update:model-value="(val) => emit('update:modelValue', val)"
  >
    <ElTabs v-model="activeTab">
      <ElTabPane label="Data Source" name="dataSource">
        <div class="p-4 space-y-4">
          <ElSelect v-model="selectedDataSource" placeholder="Select a data source" class="w-full">
            <ElOption
              v-for="ds in allDataSources"
              :key="ds.id"
              :label="ds.name"
              :value="ds.id"
            />
          </ElSelect>
          <ElInput v-model="dataPath" placeholder="e.g., data.user.name" />
        </div>
      </ElTabPane>
      <ElTabPane label="Component State" name="componentState">
        <div class="p-4 space-y-4">
          <ElSelect v-model="selectedComponent" placeholder="Select a component" class="w-full">
            <ElOption
              v-for="comp in allComponents"
              :key="comp.id"
              :label="`${comp.label} (${comp.id})`"
              :value="comp.id"
            />
          </ElSelect>
          <ElInput v-model="dataPath" placeholder="e.g., props.value" />
        </div>
      </ElTabPane>
    </ElTabs>
    <template #footer>
      <ElButton @click="emit('update:modelValue', false)">Cancel</ElButton>
      <ElButton type="primary" @click="handleSave">Save</ElButton>
    </template>
  </ElDialog>
</template>
