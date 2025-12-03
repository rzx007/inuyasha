<template>
  <div class="flex-1 flex flex-col">
    <!-- Request Section -->
    <div class="flex-1 flex flex-col">
      <div class="px-4 py-3 border-b border-border/60 bg-muted/30">
        <div class="flex gap-3 items-center">
          <Select v-model="request.method">
            <SelectTrigger class="w-[85px] !h-8 text-xs font-semibold font-mono bg-background">
              <SelectValue />
            </SelectTrigger>
            <SelectContent class="bg-popover border-border/60 shadow-lg">
              <SelectItem
                v-for="method in ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'HEAD', 'OPTIONS']"
                :key="method"
                :value="method"
                class="text-xs font-mono font-medium"
              >
                {{ method }}
              </SelectItem>
            </SelectContent>
          </Select>
          <Input
            v-model="request.url"
            placeholder="请求地址"
            class="flex-1 h-8 text-sm font-mono bg-background placeholder:text-muted-foreground/70"
          />
          <Button
            :disabled="isLoading"
            class="h-8 px-4 text-xs font-medium bg-primary hover:bg-primary/90 text-primary-foreground dark:text-white"
            @click="$emit('sendRequest')"
          >
            <div
              v-if="isLoading"
              class="w-3 h-3 border border-current border-t-transparent rounded-full animate-spin mr-2"
            />
            <Play v-else class="w-3 h-3" />
            发送
          </Button>
        </div>
      </div>

      <!-- Request Tabs -->
      <div class="flex-1 flex flex-col bg-background">
        <Tabs v-model="activeTab" class="flex-1 flex flex-col">
          <div class="border-b border-border/60 bg-muted/20">
            <div class="flex px-1">
              <button
                v-for="tab in ['headers', 'body', 'query']"
                :key="tab"
                :class="[
                  'px-4 py-2.5 text-xs font-medium border-b-2 transition-all duration-200',
                  activeTab === tab
                    ? 'border-primary text-primary bg-background shadow-sm'
                    : 'border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/40',
                ]"
                @click="activeTab = tab"
              >
                {{ tab.charAt(0).toUpperCase() + tab.slice(1) }}
              </button>
            </div>
          </div>

          <!-- Headers Tab Contents -->
          <TabsContent value="headers" class="flex-1 p-4 space-y-4">
            <HeadersTab v-model:headers="request.headers" />
          </TabsContent>

          <!-- Body Tab Content -->
          <TabsContent value="body" class="flex-1 p-4">
            <BodyTab
              v-model:body="request.body"
              v-model:body-type="request.bodyType"
              v-model:form-data="request.formData"
            />
          </TabsContent>

          <!-- Query Tab Content -->
          <TabsContent value="query" class="flex-1 p-4">
            <QueryTab v-model:params="request.params" />
          </TabsContent>
        </Tabs>
      </div>
    </div>

    <!-- Response Section -->
    <ResponseSection :response="response" :is-loading="isLoading" />
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent } from '@/components/ui/tabs'
import { Play } from 'lucide-vue-next'
import HeadersTab from './HeadersTab.vue'
import BodyTab from './BodyTab.vue'
import QueryTab from './QueryTab.vue'
import ResponseSection from './ResponseSection.vue'
import type { ApiRequest, ApiResponse } from './types'

defineProps<{
  response: ApiResponse | null
  isLoading: boolean
}>()

defineEmits<{
  (e: 'sendRequest'): void
}>()

const request = defineModel<ApiRequest>('request')

// 确保request对象中有formData属性
if (!request.value.formData) {
  request.value.formData = []
}

const getDefaultActiveTab = () => {
  // 如果有body内容，优先显示body
  if (request.value.body && request.value.body.trim()) {
    return 'body'
  }
  // 如果有查询参数，显示query
  if (request.value.params && request.value.params.length > 0) {
    return 'query'
  }
  return 'headers'
}

const activeTab = ref(getDefaultActiveTab())

watch(
  () => [request.value.body, request.value.params],
  () => {
    const newActiveTab = getDefaultActiveTab()
    // 只有在当前tab为空时才自动切换
    if (activeTab.value === 'headers' || !request.value.body) {
      activeTab.value = newActiveTab
    }
  },
  { deep: true },
)
</script>
