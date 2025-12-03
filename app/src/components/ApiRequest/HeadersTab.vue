<template>
  <div class="space-y-3">
    <div class="flex items-center justify-between">
      <h3 class="text-xs font-semibold text-muted-foreground uppercase tracking-wider">请求头</h3>
      <Button
        variant="outline"
        size="sm"
        class="h-7 px-3 text-xs bg-background border-border/60 hover:bg-muted/40 hover:border-border transition-colors shadow-sm"
        @click="addHeader"
      >
        <Plus class="w-3 h-3 mr-1.5" />
        添加请求头
      </Button>
    </div>
    <div class="space-y-2">
      <div
        v-for="header in headers"
        :key="header.id"
        class="flex items-center gap-3 p-2 rounded-md bg-muted/20 border border-border/40"
      >
        <Checkbox
          :model-value="header.enabled"
          class="w-3.5 h-3.5 accent-primary rounded"
          @update:model-value="(value: boolean) => updateHeader(header.id, 'enabled', value)"
        />
        <Input
          v-model="header.name"
          placeholder="请求头名称"
          class="flex-1 h-7 text-xs font-mono bg-background border-border/60 focus:border-primary/60 transition-colors rounded-sm"
          @change="updateHeader(header.id, 'name', $event)"
        />
        <Input
          v-model="header.value"
          placeholder="请求头值"
          class="flex-1 h-7 text-xs font-mono bg-background border-border/60 focus:border-primary/60 transition-colors rounded-sm"
          @change="updateHeader(header.id, 'value', $event)"
        />
        <Button
          variant="ghost"
          size="sm"
          class="w-7 h-7 p-0 hover:bg-destructive/10 hover:text-destructive text-muted-foreground transition-colors rounded-sm"
          @click="removeHeader(header.id)"
        >
          <X class="w-3 h-3" />
        </Button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Plus, X } from 'lucide-vue-next'
import type { Header } from './types'

interface Props {
  headers: Header[]
}

interface Emits {
  (e: 'update:headers', value: Header[]): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

// 方法
const addHeader = () => {
  const newHeader: Header = {
    id: Date.now().toString(),
    name: '',
    value: '',
    enabled: true,
  }
  emit('update:headers', [...props.headers, newHeader])
}

const updateHeader = (id: string, field: 'name' | 'value' | 'enabled', value: string | boolean) => {
  const updatedHeaders = props.headers.map((header) => (header.id === id ? { ...header, [field]: value } : header))
  emit('update:headers', updatedHeaders)
}

const removeHeader = (id: string) => {
  const updatedHeaders = props.headers.filter((header) => header.id !== id)
  emit('update:headers', updatedHeaders)
}
</script>
