<template>
  <div class="h-full flex flex-col bg-background text-foreground font-sans">


    <!-- API测试界面 -->
    <ApiTestInterface
      v-model:request="request"
      :response="response"
      :is-loading="isLoading"
      @send-request="handleSendRequest"
    />
  </div>
</template>

<script setup lang="ts">
import ApiTestInterface from './ApiTestInterface.vue'
import { useApiRequest } from './hooks/useApiRequest'
import type { ApiRequest } from './types'

defineEmits<{
  (e: 'back'): void
}>()

// 使用defineModel替代手动的双向绑定
const request = defineModel<ApiRequest>('request')

// 处理API请求的发送和响应处理
const { response, isLoading, sendRequest } = useApiRequest()

// 发送请求处理函数
const handleSendRequest = () => {
  sendRequest(request.value)
}
</script>
