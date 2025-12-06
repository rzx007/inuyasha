<script setup lang="ts">
import { computed } from 'vue'
import { storeToRefs } from 'pinia'
import { TextCursor, X } from 'lucide-vue-next'
import { useEditorStore } from '@/stores/editor'
import type { ComponentSchema } from '@/types/component'

const emit = defineEmits<{
  (e: 'select', value: string): void
  (e: 'close'): void
}>()

const editorStore = useEditorStore()
const { pageConfig } = storeToRefs(editorStore)

const formatVariableName = (name: string) => `{{${name}}}`

const variables = computed(() => {
  const vars: { id: string; name: string; type: string; componentName: string }[] = []

  const traverse = (node: ComponentSchema) => {
    if (['Input', 'Checkbox', 'Select', 'Switch'].includes(node.type)) {
      const nameProp = node.props?.name
      const labelProp = node.props?.label
      const name = nameProp || labelProp || node.type
      vars.push({
        id: node.id,
        name,
        type: node.type,
        componentName: node.label || node.type
      })
    }
    if (node.children) {
      node.children.forEach(traverse)
    }
  }

  if (pageConfig.value.rootComponent) {
    traverse(pageConfig.value.rootComponent)
  }

  return vars
})

const systemVars = ['user.name', 'user.email', 'system.date', 'system.language']
</script>

<template>
  <div
    class="absolute z-50 top-full right-0 mt-1 w-64 bg-white rounded-lg shadow-xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-200"
  >
    <div class="flex items-center justify-between px-3 py-2 bg-slate-50 border-b border-slate-100">
      <span class="text-[10px] font-bold text-slate-500 uppercase tracking-wider"
        >Insert Variable</span
      >
      <button @click="$emit('close')" class="text-slate-400 hover:text-slate-600">
        <X :size="12" />
      </button>
    </div>

    <div class="max-h-60 overflow-y-auto p-1">
      <div
        v-if="variables.length === 0 && systemVars.length === 0"
        class="text-xs text-slate-400 p-2 text-center"
      >
        No variables available
      </div>

      <!-- Component Variables -->
      <div v-if="variables.length > 0" class="mb-1">
        <div class="px-2 py-1 text-[10px] font-semibold text-slate-400">Components</div>
        <button
          v-for="v in variables"
          :key="v.id"
          @click="$emit('select', `{{${v.name}}}`)"
          class="w-full text-left flex items-center gap-2 px-2 py-1.5 rounded hover:bg-indigo-50 text-xs text-slate-700 transition-colors group"
        >
          <TextCursor :size="12" class="text-slate-400 group-hover:text-indigo-500" />
          <div class="flex flex-col min-w-0 flex-1">
            <span class="font-mono font-medium truncate">{{ formatVariableName(v.name) }}</span>
            <span class="text-[9px] text-slate-400 truncate">{{ v.componentName }}</span>
          </div>
        </button>
      </div>

      <!-- System Variables -->
      <div v-if="systemVars.length > 0">
        <div class="px-2 py-1 text-[10px] font-semibold text-slate-400">System</div>
        <button
          v-for="v in systemVars"
          :key="v"
          @click="$emit('select', `{{${v}}}`)"
          class="w-full text-left flex items-center gap-2 px-2 py-1.5 rounded hover:bg-indigo-50 text-xs text-slate-700 transition-colors group"
        >
          <span
            class="w-3 h-3 flex items-center justify-center text-[10px] font-bold text-slate-300 group-hover:text-indigo-500"
            >$</span
          >
          <span class="font-mono font-medium truncate flex-1">{{ formatVariableName(v) }}</span>
        </button>
      </div>
    </div>
  </div>
</template>
