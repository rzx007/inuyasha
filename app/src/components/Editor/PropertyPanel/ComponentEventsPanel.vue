<script setup lang="ts">
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import { Plus, Trash2 } from 'lucide-vue-next'
import ActionConfigFields from './ActionConfigFields.vue'
import { useEventPanel } from './useEventPanel'

interface Props {
  componentId: string
}
const props = defineProps<Props>()

const {
  isEventDialogVisible,
  currentEvent,
  selectedComponent,
  actionTypes,
  triggerOptions,
  componentOptions,
  getMethodOptionsByComponentId,
  openAddEventDialog,
  addAction,
  removeAction,
  handleActionTypeChange,
  handleControlTargetChange,
  handleSaveEvent,
  deleteEvent,
} = useEventPanel()
</script>

<template>
  <div class="p-4 flex-1 overflow-y-auto">
    <div class="flex justify-end mb-4">
      <Button @click="() => openAddEventDialog()">添加事件</Button>
    </div>
    <div v-if="selectedComponent?.schema.events && selectedComponent.schema.events.length > 0">
      <div
        v-for="eventItem in selectedComponent.schema.events"
        :key="eventItem.id"
        class="p-2 border rounded mb-2 flex justify-between items-start bg-white"
      >
        <div class="cursor-pointer flex-1" @click="openAddEventDialog(eventItem)">
          <div class="font-bold text-sm">{{ eventItem.trigger }}</div>
          <div class="text-xs text-gray-500 mt-1">
            <template v-if="eventItem.actions && eventItem.actions.length">
              {{ eventItem.actions.length }} 个动作: 
              {{ eventItem.actions.map(a => a.type).join(', ') }}
            </template>
            <template v-else-if="eventItem.action">
              1 个动作: {{ eventItem.action.type }}
            </template>
            <template v-else>
              无动作
            </template>
          </div>
        </div>
        <Button variant="ghost" size="icon" class="h-6 w-6" @click.stop="deleteEvent(eventItem.id)">
          <Trash2 class="w-4 h-4 text-red-500" />
        </Button>
      </div>
    </div>
    <div v-else class="text-center text-gray-400 text-sm">暂无事件配置</div>

    <!-- Event Configuration Dialog -->
    <Dialog :open="isEventDialogVisible" @update:open="val => (isEventDialogVisible = val)">
      <DialogContent class="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>事件配置</DialogTitle>
        </DialogHeader>
        
        <div class="space-y-4">
          <!-- Trigger Selection -->
           <div class="space-y-2">
            <label class="text-sm font-medium">触发器</label>
            <Select v-model="currentEvent.trigger">
              <SelectTrigger class="w-full">
                <SelectValue placeholder="选择触发器" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem
                  v-for="trigger in triggerOptions"
                  :key="trigger.value"
                  :value="trigger.value"
                >
                  {{ trigger.label }}
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div class="border-t pt-4">
            <div class="flex justify-between items-center mb-2">
              <h3 class="font-medium">动作列表</h3>
              <Button size="sm" variant="outline" @click="addAction">
                <Plus class="w-4 h-4 mr-1" /> 添加动作
              </Button>
            </div>

            <div class="space-y-4">
              <div 
                v-for="(action, index) in currentEvent.actions" 
                :key="index"
                class="border rounded p-3 bg-gray-50 relative"
              >
                <div class="absolute right-2 top-2">
                   <Button variant="ghost" size="icon" class="h-6 w-6" @click="removeAction(index)">
                    <Trash2 class="w-3 h-3 text-gray-400 hover:text-red-500" />
                  </Button>
                </div>
                
                <div class="grid gap-3">
                  <!-- Action Type -->
                  <div>
                    <label class="text-xs text-gray-500 block mb-1">动作类型</label>
                    <Select
                      :model-value="action.type"
                      @update:model-value="(val: any) => handleActionTypeChange(action, val)"
                    >
                      <SelectTrigger class="w-full h-9 text-sm">
                        <SelectValue placeholder="选择动作类型" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem
                          v-for="type in actionTypes"
                          :key="type.value"
                          :value="type.value"
                        >
                          {{ type.label }}
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <!-- Dynamic Config Fields -->
                  <div class="space-y-2 pl-1 border-l-2 border-blue-200">
                    <ActionConfigFields
                      :action="action"
                      :component-options="componentOptions"
                      :get-method-options-by-component-id="getMethodOptionsByComponentId"
                      :on-control-target-change="handleControlTargetChange"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" @click="isEventDialogVisible = false">取消</Button>
          <Button @click="handleSaveEvent">保存</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  </div>
</template>
