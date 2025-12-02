<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useEditorStore } from '@/stores/editor'
import { useDataSourceStore } from '@/stores/dataSource'
import { useComponentStore } from '@/stores/component'
import { ElDialog, ElTabs, ElTabPane, ElSelect, ElOption, ElButton, ElInput, ElOptionGroup } from 'element-plus'
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
  editorStore.pageConfig.components.forEach(traverse)
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

// 当选择的组件改变时，清空已选择的属性路径
watch(selectedComponent, () => {
  selectedPropertyPath.value = ''
})

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
              :label="`${comp.label} (${comp.semanticId})`"
              :value="comp.id"
            />
          </ElSelect>
          
          <!-- 选择属性（分组显示） -->
          <ElSelect
            v-if="selectedComponent"
            v-model="selectedPropertyPath"
            placeholder="选择要绑定的属性"
            class="w-full"
          >
            <ElOptionGroup
              v-for="group in componentPropertyOptions"
              :key="group.label"
              :label="group.label"
            >
              <ElOption
                v-for="option in group.options"
                :key="option.value"
                :label="option.label"
                :value="option.value"
              />
            </ElOptionGroup>
          </ElSelect>
        </div>
      </ElTabPane>
    </ElTabs>
    <template #footer>
      <ElButton @click="emit('update:modelValue', false)">取消</ElButton>
      <ElButton type="primary" @click="handleSave">保存</ElButton>
    </template>
  </ElDialog>
</template>