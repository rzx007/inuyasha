<script setup lang="ts">
import { ref, computed } from 'vue'
import { useEditorStore } from '@/stores/editor'
import { ElForm, ElFormItem, ElSelect, ElOption } from 'element-plus'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from '@/components/ui/dialog'
import type { EventBinding, ShowMessageActionConfig } from '@/types/event'
import { nanoid } from 'nanoid'

interface Props {
  componentId: string
}
const props = defineProps<Props>()

const editorStore = useEditorStore()
const isEventDialogVisible = ref(false)
const currentEvent = ref<Partial<EventBinding>>({})

const selectedComponent = computed(() => {
  return editorStore.selectedComponent
})

// 打开添加事件对话框
function openAddEventDialog() {
  currentEvent.value = {
    id: nanoid(),
    trigger: 'onClick',
    action: {
      type: 'showMessage',
      config: { message: 'Hello!', messageType: 'success' } as ShowMessageActionConfig
    }
  }
  isEventDialogVisible.value = true
}

// 保存事件
function handleSaveEvent() {
  if (!selectedComponent.value) return
  const events = [...(selectedComponent.value.schema.events || [])]
  const existingIndex = events.findIndex(e => e.id === currentEvent.value.id)

  if (existingIndex > -1) {
    events[existingIndex] = currentEvent.value as EventBinding
  } else {
    events.push(currentEvent.value as EventBinding)
  }

  editorStore.updateComponent(selectedComponent.value.id, { events })
  isEventDialogVisible.value = false
}
</script>

<template>
  <div class="p-4 flex-1 overflow-y-auto">
    <div class="flex justify-end mb-4">
      <Button @click="openAddEventDialog">添加事件</Button>
    </div>
    <div v-if="selectedComponent?.schema.events && selectedComponent.schema.events.length > 0">
      <div
        v-for="eventItem in selectedComponent.schema.events"
        :key="eventItem.id"
        class="p-2 border rounded mb-2"
      >
        <div><strong>触发器:</strong> {{ eventItem.trigger }}</div>
        <div><strong>动作:</strong> {{ eventItem.action.type }}</div>
      </div>
    </div>
    <div v-else class="text-center text-gray-400">没有事件配置。</div>

    <!-- Event Configuration Dialog -->
    <Dialog :open="isEventDialogVisible" @update:open="val => (isEventDialogVisible = val)">
      <DialogContent>
        <DialogHeader>
          <DialogTitle>事件配置</DialogTitle>
        </DialogHeader>
        <ElForm v-if="currentEvent.action" :model="currentEvent" label-position="top">
          <ElFormItem label="触发器">
            <ElSelect v-model="currentEvent.trigger">
              <ElOption label="点击" value="onClick" />
            </ElSelect>
          </ElFormItem>
          <ElFormItem label="动作类型">
            <ElSelect v-model="currentEvent.action.type">
              <ElOption label="显示消息" value="showMessage" />
            </ElSelect>
          </ElFormItem>

          <div v-if="currentEvent.action?.type === 'showMessage' && currentEvent.action.config">
            <ElFormItem label="消息">
              <Input v-model="(currentEvent.action.config as ShowMessageActionConfig).message" />
            </ElFormItem>
            <ElFormItem label="消息类型">
              <ElSelect
                v-model="(currentEvent.action.config as ShowMessageActionConfig).messageType"
              >
                <ElOption label="成功" value="success" />
                <ElOption label="警告" value="warning" />
                <ElOption label="错误" value="error" />
              </ElSelect>
            </ElFormItem>
          </div>
        </ElForm>
        <DialogFooter>
          <Button variant="outline" @click="isEventDialogVisible = false">取消</Button>
          <Button @click="handleSaveEvent">保存</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  </div>
</template>

