<template>
  <div class="space-y-3">
    <div class="flex items-center justify-between">
      <h3 class="text-xs font-semibold text-muted-foreground uppercase tracking-wider">查询参数</h3>
      <Button
        variant="outline"
        size="sm"
        class="h-7 px-3 text-xs bg-background border-border/60 hover:bg-muted/40 hover:border-border transition-colors shadow-sm"
        @click="addParam"
      >
        <Plus class="w-3 h-3 mr-1.5" />
        添加查询参数
      </Button>
    </div>
    <div class="space-y-2">
      <div
        v-for="param in params"
        :key="param.id"
        class="flex items-center gap-3 p-2 rounded-md bg-muted/20 border border-border/40"
      >
        <Checkbox v-model="param.enabled" class="w-3.5 h-3.5 accent-primary rounded" />
        <Input
          v-model="param.name"
          placeholder="参数名称"
          class="flex-1 h-7 text-xs font-mono bg-background border-border/60 focus:border-primary/60 transition-colors rounded-sm"
        />
        <Input
          v-model="param.value"
          placeholder="参数值"
          class="flex-1 h-7 text-xs font-mono bg-background border-border/60 focus:border-primary/60 transition-colors rounded-sm"
        />
        <Button
          variant="ghost"
          size="sm"
          class="w-7 h-7 p-0 hover:bg-destructive/10 hover:text-destructive text-muted-foreground transition-colors rounded-sm"
          @click="removeParam(param.id)"
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
import type { Param } from './types'

const params = defineModel<Param[]>('params')

// 方法
const addParam = () => {
  const newParam: Param = {
    id: Date.now().toString(),
    name: '',
    value: '',
    enabled: true,
  }
  params.value?.push(newParam)
}

const removeParam = (id: string) => {
  params.value = params.value?.filter((param) => param.id !== id)
}
onMounted(() => {
  if (params.value?.length === 0) {
    addParam()
  }
})
</script>
