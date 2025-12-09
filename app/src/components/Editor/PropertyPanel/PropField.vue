<script setup lang="ts">
import { computed, ref } from 'vue'
import { Link } from '@element-plus/icons-vue'
import { Copy, ChevronDown, Unlink } from 'lucide-vue-next'
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
import { Switch } from '@/components/ui/switch'
import { useComponentProps } from './useComponentProps'

interface PropConfig {
  key: string
  label: string
  type: string
  placeholder?: string
  options?: Array<{ label: string; value: any }>
  description?: string
  bindable?: boolean // 默认 true 
}

interface Props {
  config: PropConfig
  isStyle?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  isStyle: false
})

const emit = defineEmits(['open-binding'])

const { 
  getValue, 
  updateValue, 
  hasBinding, 
  getBindingLabel, 
  getBindingValue, 
  removeBinding 
} = useComponentProps()

const propKey = computed(() => props.config.key)
const isBound = computed(() => hasBinding(propKey.value, props.isStyle))
const bindingLabel = computed(() => getBindingLabel(propKey.value, props.isStyle))
const bindingValue = computed(() => getBindingValue(propKey.value, props.isStyle))
const currentValue = computed(() => getValue(propKey.value, props.isStyle))

// 颜色选择器引用
const colorInputRef = ref<HTMLInputElement | null>(null)

function handleUpdate(val: any) {
  if (isBound.value) return
  
  // 数字类型转换
  if (props.config.type === 'number') {
    val = Number(val)
  }
  
  updateValue(propKey.value, val, props.isStyle)
}

function handleOpenBinding() {
  // 构造完整的 key (style.width 或 width) 传给父组件
  const fullKey = props.isStyle ? `style.${propKey.value}` : propKey.value
  emit('open-binding', fullKey)
}

function handleRemoveBinding() {
  removeBinding(propKey.value, props.isStyle)
}

function openColorPicker() {
  colorInputRef.value?.click()
}

// 复制到剪贴板
function copyToClipboard(text: string) {
  if (window.navigator?.clipboard) {
    window.navigator.clipboard.writeText(text).catch(console.error)
  }
}
</script>

<template>
  <div class="prop-field group">
    <!-- Switch 特殊布局：Label 和 Control 在同一行 -->
    <div v-if="config.type === 'switch'" class="flex items-center justify-between py-1">
      <div class="text-xs font-medium text-slate-500">{{ config.label }}</div>
      <Switch
        :model-value="currentValue"
        @update:model-value="handleUpdate"
        :disabled="isBound"
      />
    </div>

    <!-- 标准布局 -->
    <div v-else class="space-y-1.5">
      <!-- Label 和工具栏 -->
      <div class="flex items-center justify-between text-xs font-medium text-slate-500 mb-1.5">
        <span>{{ config.label }}</span>
        <div class="flex items-center gap-1">
          <Button
            v-if="isBound"
            variant="ghost"
            size="sm"
            title="取消绑定"
            @click="handleRemoveBinding"
            class="h-4 w-4 p-0 text-slate-400 hover:text-red-500 transition-colors"
          >
            <Unlink class="h-3 w-3" />
          </Button>
          <Button
            v-if="config.bindable !== false"
            variant="ghost"
            size="sm"
            :title="isBound ? '修改绑定' : '绑定数据'"
            @click="handleOpenBinding"
            class="h-4 w-4 p-0 transition-opacity"
            :class="[
              isBound ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
            ]"
          >
            <Link class="h-3 w-3" :class="isBound ? 'text-primary-500' : 'text-slate-300'" />
          </Button>
        </div>
      </div>

      <!-- Controls -->
      
      <!-- Text / Number Input -->
      <Input
        v-if="config.type === 'text' || config.type === 'number'"
        :type="config.type === 'number' ? 'number' : 'text'"
        :model-value="isBound ? bindingLabel : currentValue"
        :placeholder="config.placeholder"
        :readonly="isBound"
        @update:model-value="handleUpdate"
        class="w-full px-3 py-2 border border-slate-200 rounded-md text-sm text-slate-700 focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500 transition-all"
        :class="[
          isBound ? 'border-primary text-blue-700 cursor-default' : 'bg-white'
        ]"
        :title="isBound ? `已绑定: ${bindingValue}` : ''"
      />

      <!-- Textarea -->
      <Textarea
        v-else-if="config.type === 'textarea'"
        :model-value="isBound ? bindingLabel : currentValue"
        :placeholder="config.placeholder"
        :readonly="isBound"
        @update:model-value="handleUpdate"
        class="w-full px-3 py-2 border border-slate-200 rounded-md text-sm text-slate-700 focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500 transition-all"
        :class="[
          isBound ? 'border-primary text-blue-700 cursor-default' : 'bg-white'
        ]"
        :title="isBound ? `已绑定: ${bindingValue}` : ''"
      />

      <!-- Select -->
      <div v-else-if="config.type === 'select'" class="relative"
        :title="isBound ? `已绑定: ${bindingValue}` : ''"
      >
        <Select
          :model-value="currentValue"
          @update:model-value="handleUpdate"
          :disabled="isBound"
        >
          <SelectTrigger
            class="w-full px-3 py-2 border border-slate-200 rounded-md text-sm text-slate-700 appearance-none focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500 transition-all"
            :class="[
              isBound ? 'border-primary text-blue-700' : 'bg-white'
            ]"
          >
            <!-- 绑定状态显示 label，非绑定状态显示选中的值 -->
            <span v-if="isBound" class="truncate">{{ bindingLabel }}</span>
            <SelectValue v-else :placeholder="config.placeholder || '请选择'" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem
              v-for="opt in config.options"
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

      <!-- Color Picker -->
      <div
        v-else-if="config.type === 'color'"
        class="flex items-center gap-2 border border-slate-200 rounded-md p-1 focus-within:ring-1 focus-within:ring-primary-500 focus-within:border-primary-500"
        :class="[
          isBound ? 'bg-blue-50/50 border-blue-200 cursor-default' : 'bg-white'
        ]"
        :title="isBound ? `已绑定: ${bindingValue}` : ''"
      >
        <div
          @click="openColorPicker"
          class="w-6 h-6 rounded border border-slate-200 shadow-sm shrink-0"
          :style="{ backgroundColor: isBound ? (bindingValue || '#000000') : (currentValue || '#000000') }"
        />
        <input
          type="text"
          :value="isBound ? bindingLabel : (currentValue || '#000000')"
          :readonly="isBound"
          @input="e => handleUpdate((e.target as HTMLInputElement).value)"
          class="flex-1 min-w-0 bg-transparent outline-0 border-none text-sm text-slate-700 focus:ring-0 p-0"
          :class="{ 'cursor-default': isBound }"
          placeholder="#000000"
        />
        <input
          ref="colorInputRef"
          type="color"
          :value="isBound ? (bindingValue || '#000000') : (currentValue || '#000000')"
          :disabled="isBound"
          @input="e => handleUpdate((e.target as HTMLInputElement).value)"
          class="opacity-0"
        />
      </div>

      <!-- JSON Textarea -->
      <div v-else-if="config.type === 'json'" class="relative group">
        <Textarea
          :model-value="JSON.stringify(currentValue, null, 2)"
          class="w-full h-32 p-3 bg-slate-900 text-slate-300 rounded-md text-xs font-mono resize-none focus:outline-none focus:ring-1 focus:ring-primary-500 border border-slate-800"
          @update:model-value="(val) => {
            try {
              handleUpdate(JSON.parse(String(val)))
            } catch(e) {}
          }"
        />
        <div
          class="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1"
        >
          <button
            @click="copyToClipboard(JSON.stringify(currentValue, null, 2))"
            class="p-1 bg-slate-700 hover:bg-slate-600 rounded text-white"
            title="复制"
          >
            <Copy :size="12" />
          </button>
        </div>
      </div>
      
      <!-- Unsupported -->
      <div v-else class="text-sm text-red-500">
        不支持类型: {{ config.type }}
      </div>

      <!-- Description -->
      <p v-if="config.description" class="text-[10px] text-slate-400 mt-1">
        {{ config.description }}
      </p>
    </div>
  </div>
</template>

