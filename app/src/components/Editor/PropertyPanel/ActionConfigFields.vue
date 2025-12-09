<script setup lang="ts">
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import type {
  ActionConfig,
  ShowMessageActionConfig,
  RunScriptActionConfig,
  ControlComponentActionConfig,
  GoToUrlActionConfig,
  NavigateToActionConfig,
  CopyToClipboardActionConfig,
  SetLocalStorageActionConfig,
  DownloadActionConfig,
} from '@/types/event'

interface Props {
  action: ActionConfig
  componentOptions: { label: string; value: string }[]
  getMethodOptionsByComponentId: (id?: string) => Array<{ name: string; label: string }>
  onControlTargetChange: (action: ActionConfig, id: string) => void
}

const props = defineProps<Props>()
</script>

<template>
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
  <template v-else-if="action.type === 'runScript'">
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
  <template v-else-if="action.type === 'controlComponent'">
    <div>
      <label class="text-xs block">目标组件ID</label>
      <Select
        :model-value="(action.config as ControlComponentActionConfig).componentId"
        @update:model-value="(val: any) => onControlTargetChange(action, val != null ? String(val) : '')"
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
  <template v-else-if="action.type === 'goToUrl'">
    <div>
      <label class="text-xs block">URL</label>
      <Input v-model="(action.config as GoToUrlActionConfig).url" />
    </div>
    <div class="flex items-center gap-2 mt-2">
      <input
        type="checkbox"
        :checked="(action.config as GoToUrlActionConfig).newTab"
        @change="(e: any) => (action.config as GoToUrlActionConfig).newTab = e.target.checked"
      />
      <span class="text-xs">新标签页打开</span>
    </div>
  </template>

  <!-- Navigate To -->
  <template v-else-if="action.type === 'navigateTo'">
    <div>
      <label class="text-xs block">路径 (Path)</label>
      <Input v-model="(action.config as NavigateToActionConfig).path" />
    </div>
  </template>

  <!-- Copy To Clipboard -->
  <template v-else-if="action.type === 'copyToClipboard'">
    <div>
      <label class="text-xs block">文本内容</label>
      <Input v-model="(action.config as CopyToClipboardActionConfig).text" />
    </div>
  </template>

  <!-- Set LocalStorage -->
  <template v-else-if="action.type === 'setLocalStorage'">
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
  <template v-else-if="action.type === 'download'">
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
  <template v-else-if="action.type === 'callDataSource'">
    <div class="text-xs text-gray-500">
      请在数据源面板配置数据源ID (需要实现数据源选择器)
    </div>
    <div>
      <label class="text-xs block">数据源ID</label>
      <Input v-model="(action.config as any).dataSourceId" />
    </div>
  </template>
</template>

