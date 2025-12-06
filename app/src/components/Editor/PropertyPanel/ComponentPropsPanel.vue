<script setup lang="ts">
import { computed, ref } from 'vue'
import { useComponentStore } from '@/stores/component'
import DataBindingDialog from '../DataBindingDialog.vue'
import PropField from './PropField.vue'
import { useComponentProps } from './useComponentProps'

interface Props {
  componentId: string
}
const props = defineProps<Props>()

const componentStore = useComponentStore()
const { updateBinding, selectedComponent } = useComponentProps()

const isDataBindingDialogVisible = ref(false)
const currentBindingProp = ref<string | null>(null)

const componentMeta = computed(() => {
  if (!selectedComponent.value) return null
  return componentStore.getComponentMeta(selectedComponent.value.schema.type)
})

const propsSchema = computed(() => componentMeta.value?.propsSchema || [])

// 统一定义样式配置项，方便渲染
const styleSchema = [
  { key: 'width', label: '宽度', type: 'text', placeholder: 'auto' },
  { key: 'height', label: '高度', type: 'text', placeholder: 'auto' },
  { key: 'padding', label: '内边距', type: 'text', placeholder: '0' },
  { key: 'margin', label: '外边距', type: 'text', placeholder: '0' },
  { key: 'backgroundColor', label: '背景颜色', type: 'color' },
  { key: 'color', label: '文字颜色', type: 'color' },
  { key: 'fontSize', label: '字体大小', type: 'text', placeholder: '14px' },
]

function handleOpenBinding(key: string) {
  currentBindingProp.value = key
  isDataBindingDialogVisible.value = true
}

function handleSaveBinding({ propKey, binding }: { propKey: string, binding: any }) {
  // 解析 key 类型
  if (propKey.startsWith('style.')) {
    updateBinding(propKey.replace('style.', ''), binding, true)
  } else {
    updateBinding(propKey, binding, false)
  }
}
</script>

<template>
  <div class="overflow-y-auto h-full bg-white">
    <!-- 属性配置区域 -->
    <div class="space-y-0">
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
        class="border-b border-slate-100 last:border-0 px-4 py-4"
      >
        <PropField 
          :config="propSchema" 
          @open-binding="handleOpenBinding" 
        />
      </div>
    </div>

    <!-- 样式配置区域 -->
    <div class="space-y-0 border-t border-slate-100">
      <div class="px-4 py-3 bg-slate-50/50 border-b border-slate-100">
        <h4 class="text-xs font-semibold text-slate-500 uppercase tracking-wider">
          样式配置
        </h4>
      </div>
      <div 
        v-for="styleProp in styleSchema" 
        :key="styleProp.key"
        class="border-b border-slate-100 last:border-0 px-4 py-4"
      >
        <PropField 
          :config="styleProp" 
          :is-style="true" 
          @open-binding="handleOpenBinding" 
        />
      </div>
    </div>

    <!-- 数据绑定弹窗 -->
    <DataBindingDialog
      v-model="isDataBindingDialogVisible"
      :prop-key="currentBindingProp"
      @save="handleSaveBinding"
    />
  </div>
</template>
