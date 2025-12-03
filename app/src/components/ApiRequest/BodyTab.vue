<template>
  <div class="space-y-4">
    <div class="flex items-center gap-4">
      <h3 class="text-xs font-semibold text-muted-foreground uppercase tracking-wider">请求体</h3>
      <Select v-model="bodyType">
        <SelectTrigger class="w-28 !h-8 text-xs bg-background">
          <SelectValue />
        </SelectTrigger>
        <SelectContent class="bg-popover border-border/60 shadow-lg">
          <SelectItem v-for="type in bodyTypes" :key="type.value" :value="type.value" class="text-xs">
            {{ type.label }}
          </SelectItem>
        </SelectContent>
      </Select>
    </div>

    <!-- JSON 或 Raw Text 输入 -->
    <div
      v-if="bodyType === 'json' || bodyType === 'raw'"
      class="border border-border/60 rounded-md overflow-hidden shadow-sm"
    >
      <Textarea
        v-model="body"
        :placeholder="bodyType === 'json' ? `{}` : 'Enter request body'"
        class="min-h-[200px] font-mono text-xs bg-background border-0 resize-none focus:ring-0 focus:ring-offset-0"
      />
    </div>

    <!-- Form Data 输入 -->
    <div v-else-if="bodyType === 'form'" class="space-y-3">
      <div class="flex items-center justify-between">
        <div class="text-xs text-muted-foreground">表单数据</div>
        <Button
          variant="outline"
          size="sm"
          class="h-7 px-3 text-xs bg-background border-border/60 hover:bg-muted/40 hover:border-border transition-colors shadow-sm"
          @click="addFormData"
        >
          <Plus class="w-3 h-3 mr-1.5" />
          添加表单项
        </Button>
      </div>

      <div class="space-y-2">
        <div
          v-for="item in formData"
          :key="item.id"
          class="flex items-center gap-3 p-2 rounded-md bg-muted/20 border border-border/40"
        >
          <Checkbox v-model="item.enabled" class="w-3.5 h-3.5 accent-primary rounded" />
          <Input
            v-model="item.name"
            placeholder="名称"
            class="flex-1 h-7 text-xs font-mono bg-background border-border/60 focus:border-primary/60 transition-colors rounded-sm"
          />
          <Input
            v-model="item.value"
            placeholder="值"
            class="flex-1 h-7 text-xs font-mono bg-background border-border/60 focus:border-primary/60 transition-colors rounded-sm"
          />
          <Button
            variant="ghost"
            size="sm"
            class="w-7 h-7 p-0 hover:bg-destructive/10 hover:text-destructive text-muted-foreground transition-colors rounded-sm"
            @click="removeFormData(item.id)"
          >
            <X class="w-3 h-3" />
          </Button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, watch } from 'vue'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Plus, X } from 'lucide-vue-next'
import type { FormData } from './types'

// 使用defineModel进行双向绑定
const body = defineModel<string>('body')
const bodyType = defineModel<'json' | 'form' | 'raw' | 'none'>('bodyType')
const formData = defineModel<FormData[]>('formData', { default: [] })

// 可选的请求体类型
const bodyTypes = [
  { value: 'none', label: 'None' },
  { value: 'json', label: 'JSON' },
  { value: 'form', label: 'Form Data' },
  { value: 'raw', label: 'Raw Text' },
]

// 添加表单项
const addFormData = () => {
  const newItem: FormData = {
    id: Date.now().toString(),
    name: '',
    value: '',
    enabled: true,
  }
  formData.value.push(newItem)
}

// 删除表单项
const removeFormData = (id: string) => {
  formData.value = formData.value.filter((item) => item.id !== id)
}

// 当切换到form类型且没有表单项时，添加一个空的表单项
watch(bodyType, (newType) => {
  if (newType === 'form' && (!formData.value || formData.value.length === 0)) {
    addFormData()
  }
})

// 组件挂载时，如果是form类型且没有表单项，添加一个空的表单项
onMounted(() => {
  if (bodyType.value === 'form' && (!formData.value || formData.value.length === 0)) {
    addFormData()
  }
})

// 监听formData变化，更新body内容
watch(
  formData,
  (newFormData) => {
    if (bodyType.value === 'form') {
      // 将formData转换为URLSearchParams格式的字符串
      const enabledItems = newFormData.filter((item) => item.enabled && item.name)
      const formDataObj = new URLSearchParams()
      enabledItems.forEach((item) => {
        formDataObj.append(item.name, item.value || '')
      })
      body.value = formDataObj.toString()
    }
  },
  { deep: true },
)
</script>
