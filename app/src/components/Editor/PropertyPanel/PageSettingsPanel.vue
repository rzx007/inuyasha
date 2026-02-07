<script setup lang="ts">
import { computed, ref } from 'vue'
import { useEditorStore } from '@/stores/editor'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Sparkles, Link, ChevronDown, ChevronRight } from 'lucide-vue-next'
import DataBindingDialog from '../DataBindingDialog.vue'
import type { DataBinding } from '@inuyasha/core'

const editorStore = useEditorStore()
const isDataBindingDialogVisible = ref(false)
const currentBindingProp = ref<string | null>(null)

const pageConfig = computed(() => editorStore.pageConfig)
const rootComponent = computed(() => editorStore.getPageRoot())

// 统一的padding值
const paddingValue = computed({
  get: () => {
    const style = rootComponent.value.style || {}
    const top = style.paddingTop || '0px'
    const right = style.paddingRight || '0px'
    const bottom = style.paddingBottom || '0px'
    const left = style.paddingLeft || '0px'

    // 如果四个方向都一样，返回统一值
    if (top === right && right === bottom && bottom === left) {
      return top
    }
    return ''
  },
  set: (value: string) => {
    updateRootStyle('paddingTop', value)
    updateRootStyle('paddingRight', value)
    updateRootStyle('paddingBottom', value)
    updateRootStyle('paddingLeft', value)
  }
})

// 统一的margin值
const marginValue = computed({
  get: () => {
    const style = rootComponent.value.style || {}
    const top = style.marginTop || '0px'
    const right = style.marginRight || '0px'
    const bottom = style.marginBottom || '0px'
    const left = style.marginLeft || '0px'

    // 如果四个方向都一样，返回统一值
    if (top === right && right === bottom && bottom === left) {
      return top
    }
    return ''
  },
  set: (value: string) => {
    updateRootStyle('marginTop', value)
    updateRootStyle('marginRight', value)
    updateRootStyle('marginBottom', value)
    updateRootStyle('marginLeft', value)
  }
})

// 颜色选择器相关状态
const colorPickerRefs = ref<Record<string, HTMLInputElement | null>>({})

// 展开状态
const isPaddingExpanded = ref(false)
const isMarginExpanded = ref(false)

// 打开颜色选择器
function openColorPicker(key: string) {
  const colorInput = colorPickerRefs.value[key]
  if (colorInput) {
    colorInput.click()
  }
}

// 更新 PageRoot 样式
function updateRootStyle(key: string, value: any) {
  const updatedStyle = {
    ...rootComponent.value.style,
    [key]: value
  }
  
  editorStore.updateComponent(rootComponent.value.id, {
    style: updatedStyle
  })
}

// 更新页面基本信息
function updatePageInfo(key: 'name' | 'title', value: string) {
  editorStore.setPageConfig({
    ...pageConfig.value,
    [key]: value,
  })
}

// 打开数据绑定对话框
function openDataBindingDialog(propKey: string) {
  currentBindingProp.value = propKey
  isDataBindingDialogVisible.value = true
}

// 更新属性绑定
function updatePropBinding(propKey: string, binding: DataBinding | null) {
  const updatedProps = {
    ...rootComponent.value.props,
    [`${propKey}_binding`]: binding
  }
  
  editorStore.updateComponent(rootComponent.value.id, {
    props: updatedProps
  })
}
</script>

<template>
  <div class="overflow-y-auto flex-1 bg-white">
    <!-- 页面基本信息 -->
    <div class="space-y-0 border-b border-slate-100">
      <div class="px-4 py-3 bg-slate-50/50 border-b border-slate-100">
        <h4 class="text-xs font-semibold text-slate-500 uppercase tracking-wider">
          页面信息
        </h4>
      </div>
      <div class="border-b border-slate-100 last:border-0 px-4 py-4">
        <div class="text-xs font-medium text-slate-500 mb-1.5">
          <span>页面名称</span>
        </div>
        <Input
          :model-value="pageConfig.name"
          placeholder="未命名页面"
          @update:model-value="val => updatePageInfo('name', String(val))"
          class="w-full px-3 py-2 bg-white border border-slate-200 rounded-md text-sm text-slate-700 focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500 transition-all"
        />
      </div>
      <div class="border-b border-slate-100 last:border-0 px-4 py-4">
        <div class="text-xs font-medium text-slate-500 mb-1.5">
          <span>页面标题</span>
        </div>
        <Input
          :model-value="pageConfig.title"
          placeholder="新页面"
          @update:model-value="val => updatePageInfo('title', String(val))"
          class="w-full px-3 py-2 bg-white border border-slate-200 rounded-md text-sm text-slate-700 focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500 transition-all"
        />
      </div>
    </div>

    <!-- 页面样式配置 -->
    <div class="space-y-0 border-t border-slate-100">
      <div class="px-4 py-3 bg-slate-50/50 border-b border-slate-100">
        <h4 class="text-xs font-semibold text-slate-500 uppercase tracking-wider">
          页面样式
        </h4>
      </div>
      <div class="border-b border-slate-100 last:border-0 px-4 py-4 group">
        <div class="flex items-center justify-between text-xs font-medium text-slate-500 mb-1.5">
          <span>背景颜色</span>
          <Button
            variant="ghost"
            size="sm"
            title="绑定数据"
            @click="openDataBindingDialog('backgroundColor')"
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
              backgroundColor: rootComponent.style?.backgroundColor || '#ffffff'
            }"
          />
          <input
            type="text"
            :value="rootComponent.style?.backgroundColor || '#ffffff'"
            @input="
              e => updateRootStyle('backgroundColor', (e.target as HTMLInputElement).value)
            "
            class="flex-1 min-w-0 bg-transparent border-none text-sm text-slate-700 focus:ring-0 p-0"
            placeholder="#ffffff"
          />
          <input
            :ref="el => (colorPickerRefs['backgroundColor'] = el as HTMLInputElement)"
            type="color"
            :value="rootComponent.style?.backgroundColor || '#ffffff'"
            @input="
              e => updateRootStyle('backgroundColor', (e.target as HTMLInputElement).value)
            "
            class="opacity-0 absolute w-0 h-0"
            id="color-picker-page-backgroundColor"
          />
          <div
            for="color-picker-page-backgroundColor"
            @click="openColorPicker('backgroundColor')"
            class="cursor-pointer p-1 hover:bg-slate-100 rounded shrink-0"
          >
            <Sparkles :size="14" class="text-slate-400" />
          </div>
        </div>
      </div>
      <div class="border-b border-slate-100 last:border-0 px-4 py-4 group">
        <div class="flex items-center justify-between text-xs font-medium text-slate-500 mb-1.5">
          <span>背景图片</span>
          <Button
            variant="ghost"
            size="sm"
            title="绑定数据"
            @click="openDataBindingDialog('style.backgroundImage')"
            class="h-4 w-4 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <Link class="h-3 w-3 text-slate-300" />
          </Button>
        </div>
        <Input
          :model-value="rootComponent.style?.backgroundImage || ''"
          placeholder="输入图片 URL"
          @update:model-value="val => updateRootStyle('backgroundImage', val)"
          class="w-full px-3 py-2 bg-white border border-slate-200 rounded-md text-sm text-slate-700 focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500 transition-all"
        />
      </div>
      <div class="border-b border-slate-100 last:border-0 px-4 py-4">
        <div class="text-xs font-medium text-slate-500 mb-1.5">
          <span>背景尺寸</span>
        </div>
        <Input
          :model-value="rootComponent.style?.backgroundSize || ''"
          placeholder="cover"
          @update:model-value="val => updateRootStyle('backgroundSize', val)"
          class="w-full px-3 py-2 bg-white border border-slate-200 rounded-md text-sm text-slate-700 focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500 transition-all"
        />
      </div>
      <div class="border-b border-slate-100 last:border-0 px-4 py-4">
        <div class="text-xs font-medium text-slate-500 mb-1.5">
          <span>背景位置</span>
        </div>
        <Input
          :model-value="rootComponent.style?.backgroundPosition || ''"
          placeholder="center"
          @update:model-value="val => updateRootStyle('backgroundPosition', val)"
          class="w-full px-3 py-2 bg-white border border-slate-200 rounded-md text-sm text-slate-700 focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500 transition-all"
        />
      </div>
      <div class="border-b border-slate-100 last:border-0 px-4 py-4">
        <div class="text-xs font-medium text-slate-500 mb-1.5">
          <span>背景重复</span>
        </div>
        <Input
          :model-value="rootComponent.style?.backgroundRepeat || ''"
          placeholder="no-repeat"
          @update:model-value="val => updateRootStyle('backgroundRepeat', val)"
          class="w-full px-3 py-2 bg-white border border-slate-200 rounded-md text-sm text-slate-700 focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500 transition-all"
        />
      </div>

      <!-- 内边框 -->
      <div class="border-b border-slate-100 last:border-0 px-4 py-4">
        <div class="flex items-center justify-between text-xs font-medium text-slate-500 mb-1.5">
          <span>内边框</span>
          <button
            @click="isPaddingExpanded = !isPaddingExpanded"
            class="text-slate-400 hover:text-slate-600 transition-colors"
          >
            <component :is="isPaddingExpanded ? ChevronDown : ChevronRight" :size="12" />
          </button>
        </div>
        <div v-if="!isPaddingExpanded" class="mb-2">
          <Input
            :model-value="paddingValue"
            placeholder="0px"
            @update:model-value="paddingValue = $event"
            class="w-full px-3 py-2 bg-white border border-slate-200 rounded-md text-sm text-slate-700 focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500 transition-all"
          />
        </div>
        <div v-else class="grid grid-cols-2 gap-2">
          <div>
            <label class="text-xs text-slate-400 mb-1 block">上</label>
            <Input
              :model-value="rootComponent.style?.paddingTop || ''"
              placeholder="0px"
              @update:model-value="val => updateRootStyle('paddingTop', val)"
              class="w-full px-2 py-1 bg-white border border-slate-200 rounded text-xs text-slate-700 focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
            />
          </div>
          <div>
            <label class="text-xs text-slate-400 mb-1 block">右</label>
            <Input
              :model-value="rootComponent.style?.paddingRight || ''"
              placeholder="0px"
              @update:model-value="val => updateRootStyle('paddingRight', val)"
              class="w-full px-2 py-1 bg-white border border-slate-200 rounded text-xs text-slate-700 focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
            />
          </div>
          <div>
            <label class="text-xs text-slate-400 mb-1 block">下</label>
            <Input
              :model-value="rootComponent.style?.paddingBottom || ''"
              placeholder="0px"
              @update:model-value="val => updateRootStyle('paddingBottom', val)"
              class="w-full px-2 py-1 bg-white border border-slate-200 rounded text-xs text-slate-700 focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
            />
          </div>
          <div>
            <label class="text-xs text-slate-400 mb-1 block">左</label>
            <Input
              :model-value="rootComponent.style?.paddingLeft || ''"
              placeholder="0px"
              @update:model-value="val => updateRootStyle('paddingLeft', val)"
              class="w-full px-2 py-1 bg-white border border-slate-200 rounded text-xs text-slate-700 focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
            />
          </div>
        </div>
      </div>

      <!-- 外边框 -->
      <div class="border-b border-slate-100 last:border-0 px-4 py-4">
        <div class="flex items-center justify-between text-xs font-medium text-slate-500 mb-1.5">
          <span>外边框</span>
          <button
            @click="isMarginExpanded = !isMarginExpanded"
            class="text-slate-400 hover:text-slate-600 transition-colors"
          >
            <component :is="isMarginExpanded ? ChevronDown : ChevronRight" :size="12" />
          </button>
        </div>
        <div v-if="!isMarginExpanded" class="mb-2">
          <Input
            :model-value="marginValue"
            placeholder="0px"
            @update:model-value="marginValue = $event"
            class="w-full px-3 py-2 bg-white border border-slate-200 rounded-md text-sm text-slate-700 focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500 transition-all"
          />
        </div>
        <div v-else class="grid grid-cols-2 gap-2">
          <div>
            <label class="text-xs text-slate-400 mb-1 block">上</label>
            <Input
              :model-value="rootComponent.style?.marginTop || ''"
              placeholder="0px"
              @update:model-value="val => updateRootStyle('marginTop', val)"
              class="w-full px-2 py-1 bg-white border border-slate-200 rounded text-xs text-slate-700 focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
            />
          </div>
          <div>
            <label class="text-xs text-slate-400 mb-1 block">右</label>
            <Input
              :model-value="rootComponent.style?.marginRight || ''"
              placeholder="0px"
              @update:model-value="val => updateRootStyle('marginRight', val)"
              class="w-full px-2 py-1 bg-white border border-slate-200 rounded text-xs text-slate-700 focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
            />
          </div>
          <div>
            <label class="text-xs text-slate-400 mb-1 block">下</label>
            <Input
              :model-value="rootComponent.style?.marginBottom || ''"
              placeholder="0px"
              @update:model-value="val => updateRootStyle('marginBottom', val)"
              class="w-full px-2 py-1 bg-white border border-slate-200 rounded text-xs text-slate-700 focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
            />
          </div>
          <div>
            <label class="text-xs text-slate-400 mb-1 block">左</label>
            <Input
              :model-value="rootComponent.style?.marginLeft || ''"
              placeholder="0px"
              @update:model-value="val => updateRootStyle('marginLeft', val)"
              class="w-full px-2 py-1 bg-white border border-slate-200 rounded text-xs text-slate-700 focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
            />
          </div>
        </div>
      </div>
    </div>

    <!-- Data Binding Dialog -->
    <DataBindingDialog
      v-model="isDataBindingDialogVisible"
      :prop-key="currentBindingProp"
      @save="({ propKey, binding }) => updatePropBinding(propKey, binding)"
    />
  </div>
</template>

