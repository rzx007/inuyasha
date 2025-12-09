<script setup lang="ts">
import { ref, computed } from 'vue'
import { useEditorStore } from '@/stores/editor'
import { useComponentStore } from '@/stores/component'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
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
import type { 
  EventBinding, 
  ActionConfig, 
  ActionType,
  ShowMessageActionConfig,
  RunScriptActionConfig,
  ControlComponentActionConfig,
  GoToUrlActionConfig,
  NavigateToActionConfig,
  CopyToClipboardActionConfig,
  SetLocalStorageActionConfig,
  DownloadActionConfig
} from '@/types/event'
import { nanoid } from 'nanoid'

interface Props {
  componentId: string
}
const props = defineProps<Props>()

const editorStore = useEditorStore()
const componentStore = useComponentStore()
const isEventDialogVisible = ref(false)
const currentEvent = ref<Partial<EventBinding>>({})

const selectedComponent = computed(() => {
  return editorStore.selectedComponent
})

function findComponentById(id: string) {
  const root = editorStore.getPageRoot()
  const stack = [root]
  while (stack.length) {
    const node = stack.pop()
    if (!node) continue
    if (node.id === id) return node
    if (node.children) stack.push(...node.children)
  }
  return null
}

function getMethodOptionsByComponentId(componentId?: string) {
  if (!componentId) return []
  const comp = findComponentById(componentId)
  if (!comp) return []
  const meta = componentStore.getComponentMeta(comp.type)
  const list =
    meta?.exposedMethods ||
    meta?.methods?.map(m => ({ name: m.name, label: m.label })) ||
    []
  return list
}

// Action Types List
const actionTypes: { label: string; value: ActionType }[] = [
  { label: '显示消息 (Show Message)', value: 'showMessage' },
  { label: '运行脚本 (Run Script)', value: 'runScript' },
  { label: '控制组件 (Control Component)', value: 'controlComponent' },
  { label: '调用数据源 (Call DataSource)', value: 'callDataSource' },
  { label: '更新属性 (Update Property)', value: 'updateProperty' },
  { label: '跳转链接 (Go To URL)', value: 'goToUrl' },
  { label: '路由跳转 (Navigate To)', value: 'navigateTo' },
  { label: '复制到剪贴板 (Copy Clipboard)', value: 'copyToClipboard' },
  { label: '设置本地存储 (Set LocalStorage)', value: 'setLocalStorage' },
  { label: '下载文件 (Download)', value: 'download' },
]

// 获取当前组件支持的触发器列表
const triggerOptions = computed(() => {
  if (!selectedComponent.value) return []
  const meta = componentStore.getComponentMeta(selectedComponent.value.schema.type)
  return meta?.triggers || []
})

// Helper to get component options for Control Component action
// For now, listing all components in the page except the current one? Or all?
// Using semanticId or id? Usually control by ID, but semantic ID is better for user.
const componentOptions = computed(() => {
  // Simple flattening of the tree for selection
  // TODO: Recursively get all components
  // For now just root children
  const root = editorStore.getPageRoot()
  const options: { label: string; value: string }[] = []
  
  function traverse(node: any) {
    if (node.id) {
       options.push({ label: `${node.label} (${node.semanticId})`, value: node.id })
    }
    if (node.children) {
      node.children.forEach(traverse)
    }
  }
  traverse(root)
  return options
})

// Initializer for new actions
function createDefaultAction(type: ActionType = 'showMessage'): ActionConfig {
  let config: any = {}
  switch (type) {
    case 'showMessage':
      config = { message: 'Hello!', messageType: 'success' }
      break
    case 'runScript':
      config = { code: '// console.log(context)' }
      break
    case 'controlComponent':
      config = { componentId: '', method: 'focus', args: [] }
      break
    case 'goToUrl':
      config = { url: 'https://example.com', newTab: true }
      break
    case 'navigateTo':
      config = { path: '/' }
      break
    case 'copyToClipboard':
      config = { text: '' }
      break
    case 'setLocalStorage':
      config = { key: '', value: '' }
      break
    case 'download':
      config = { url: '' }
      break
    default:
      config = {}
  }
  return { type, config }
}

// 打开添加事件对话框
function openAddEventDialog(existingEvent?: EventBinding) {
  if (existingEvent) {
    // Clone existing
    currentEvent.value = JSON.parse(JSON.stringify(existingEvent))
    // Migrate legacy action to actions array
    if (!currentEvent.value.actions && currentEvent.value.action) {
      currentEvent.value.actions = [currentEvent.value.action]
    } else if (!currentEvent.value.actions) {
      currentEvent.value.actions = []
    }
  } else {
    // New Event
    const defaultTrigger = triggerOptions.value.length > 0 
      ? triggerOptions.value[0].value 
      : 'onClick'
    
    currentEvent.value = {
      id: nanoid(),
      trigger: defaultTrigger,
      actions: [createDefaultAction()]
    }
  }
  isEventDialogVisible.value = true
}

function addAction() {
  if (!currentEvent.value.actions) currentEvent.value.actions = []
  currentEvent.value.actions.push(createDefaultAction())
}

function removeAction(index: number) {
  currentEvent.value.actions?.splice(index, 1)
}

function handleActionTypeChange(action: ActionConfig, newType: ActionType) {
  // Reset config when type changes
  const defaultNew = createDefaultAction(newType)
  action.type = newType
  action.config = defaultNew.config
  if (newType === 'controlComponent') {
    const config = action.config as ControlComponentActionConfig
    const options = getMethodOptionsByComponentId(config.componentId)
    if (!config.method && options.length) {
      config.method = options[0].name
    }
  }
}

function handleControlTargetChange(action: ActionConfig, newId: string) {
  const config = action.config as ControlComponentActionConfig
  config.componentId = newId
  const options = getMethodOptionsByComponentId(newId)
  config.method = options[0]?.name || ''
}

// 保存事件
function handleSaveEvent() {
  if (!selectedComponent.value || !currentEvent.value.id) return
  const events = [...(selectedComponent.value.schema.events || [])]
  const existingIndex = events.findIndex(e => e.id === currentEvent.value.id)

  const eventToSave: EventBinding = {
    id: currentEvent.value.id,
    trigger: currentEvent.value.trigger!,
    actions: currentEvent.value.actions || []
  }

  // Clear legacy action field if it exists
  if ((eventToSave as any).action) delete (eventToSave as any).action

  if (existingIndex > -1) {
    events[existingIndex] = eventToSave
  } else {
    events.push(eventToSave)
  }

  editorStore.updateComponent(selectedComponent.value.id, { events })
  isEventDialogVisible.value = false
}

function deleteEvent(id: string) {
  if (!selectedComponent.value) return
  const events = selectedComponent.value.schema.events?.filter(e => e.id !== id) || []
  editorStore.updateComponent(selectedComponent.value.id, { events })
}
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
                    
                    <!-- Show Message -->
                    <template v-if="action.type === 'showMessage'">
                      <div>
                        <label class="text-xs block">消息内容</label>
                        <Input v-model="(action.config as ShowMessageActionConfig).message" />
                      </div>
                      <div>
                        <label class="text-xs block">类型</label>
                        <Select v-model="(action.config as ShowMessageActionConfig).messageType">
                          <SelectTrigger class="w-full h-9 text-sm">
                            <SelectValue placeholder="选择类型" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="success">成功</SelectItem>
                            <SelectItem value="warning">警告</SelectItem>
                            <SelectItem value="error">错误</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </template>

                    <!-- Run Script -->
                    <template v-if="action.type === 'runScript'">
                       <div>
                        <label class="text-xs block">脚本代码 (JS)</label>
                        <textarea 
                          v-model="(action.config as RunScriptActionConfig).code"
                          class="w-full border rounded p-2 text-xs font-mono h-20"
                          placeholder="// context: { dataSourceStore, editorStore, ... }"
                        ></textarea>
                      </div>
                    </template>

                    <!-- Control Component -->
                    <template v-if="action.type === 'controlComponent'">
                      <div>
                        <label class="text-xs block">目标组件ID</label>
                        <Select
                          :model-value="(action.config as ControlComponentActionConfig).componentId"
                          @update:model-value="(val: any) => handleControlTargetChange(action, val != null ? String(val) : '')"
                        >
                          <SelectTrigger class="w-full h-9 text-sm">
                            <SelectValue placeholder="选择组件" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem
                              v-for="opt in componentOptions"
                              :key="opt.value"
                              :value="opt.value"
                            >
                              {{ opt.label }}
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <label class="text-xs block">方法名</label>
                        <template
                          v-if="getMethodOptionsByComponentId((action.config as ControlComponentActionConfig).componentId).length"
                        >
                          <Select
                            :model-value="(action.config as ControlComponentActionConfig).method"
                            @update:model-value="(val: any) => ((action.config as ControlComponentActionConfig).method = val != null ? String(val) : '')"
                          >
                            <SelectTrigger class="w-full h-9 text-sm">
                              <SelectValue placeholder="选择方法" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem
                                v-for="m in getMethodOptionsByComponentId((action.config as ControlComponentActionConfig).componentId)"
                                :key="m.name"
                                :value="m.name"
                              >
                                {{ m.label }}
                              </SelectItem>
                            </SelectContent>
                          </Select>
                        </template>
                        <template v-else>
                          <Input
                            v-model="(action.config as ControlComponentActionConfig).method"
                            placeholder="方法名"
                          />
                        </template>
                      </div>
                    </template>

                    <!-- Go To URL -->
                    <template v-if="action.type === 'goToUrl'">
                      <div>
                        <label class="text-xs block">URL</label>
                        <Input v-model="(action.config as GoToUrlActionConfig).url" />
                      </div>
                      <div class="flex items-center gap-2 mt-2">
                        <input 
                          type="checkbox" 
                          :checked="(action.config as GoToUrlActionConfig).newTab" 
                          @change="(e: any) => (action.config as GoToUrlActionConfig).newTab = e.target.checked"
                          id="newTab"
                        />
                        <label for="newTab" class="text-xs">新标签页打开</label>
                      </div>
                    </template>
                    
                    <!-- Navigate To -->
                    <template v-if="action.type === 'navigateTo'">
                       <div>
                        <label class="text-xs block">路径 (Path)</label>
                        <Input v-model="(action.config as NavigateToActionConfig).path" />
                      </div>
                    </template>

                    <!-- Copy To Clipboard -->
                    <template v-if="action.type === 'copyToClipboard'">
                       <div>
                        <label class="text-xs block">文本内容</label>
                        <Input v-model="(action.config as CopyToClipboardActionConfig).text" />
                      </div>
                    </template>
                    
                    <!-- Set LocalStorage -->
                    <template v-if="action.type === 'setLocalStorage'">
                       <div class="grid grid-cols-2 gap-2">
                         <div>
                            <label class="text-xs block">Key</label>
                            <Input v-model="(action.config as SetLocalStorageActionConfig).key" />
                         </div>
                         <div>
                            <label class="text-xs block">Value</label>
                            <Input v-model="(action.config as SetLocalStorageActionConfig).value" />
                         </div>
                      </div>
                    </template>

                     <!-- Download -->
                    <template v-if="action.type === 'download'">
                       <div>
                        <label class="text-xs block">文件地址 (URL)</label>
                        <Input v-model="(action.config as DownloadActionConfig).url" />
                      </div>
                       <div>
                        <label class="text-xs block">文件名 (可选)</label>
                        <Input v-model="(action.config as DownloadActionConfig).filename" />
                      </div>
                    </template>

                    <!-- Call DataSource -->
                    <template v-if="action.type === 'callDataSource'">
                        <div class="text-xs text-gray-500">
                          请在数据源面板配置数据源ID (需要实现数据源选择器)
                        </div>
                         <div>
                            <label class="text-xs block">数据源ID</label>
                             <!-- Simple Input for now, should be a selector -->
                            <Input v-model="(action.config as any).dataSourceId" />
                         </div>
                    </template>

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
