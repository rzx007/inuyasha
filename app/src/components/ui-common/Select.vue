<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, type VNode, type Component } from 'vue'
import { ChevronDown, Check } from 'lucide-vue-next'

export interface SelectOption {
  label: string;
  value: string;
  icon?: Component | VNode | string;
}

const props = withDefaults(defineProps<{

  options: SelectOption[];
  placeholder?: string;
}>(), {
  placeholder: "Select..."
})

const emit = defineEmits(['change'])
const modelValue = defineModel<string>({ required: true })

const isOpen = ref(false)
const containerRef = ref<HTMLDivElement | null>(null)

const selected = computed(() => props.options.find(o => o.value === modelValue.value))

const toggle = () => {
  isOpen.value = !isOpen.value
}

const select = (val: string) => {
  modelValue.value = val
  emit('change', val)
  isOpen.value = false
}

const handleClickOutside = (event: MouseEvent) => {
  if (containerRef.value && !containerRef.value.contains(event.target as Node)) {
    isOpen.value = false
  }
}

onMounted(() => {
  document.addEventListener("mousedown", handleClickOutside)
})

onUnmounted(() => {
  document.removeEventListener("mousedown", handleClickOutside)
})
</script>

<template>
  <div
    ref="containerRef"
    class="relative"
  >
    <button 
      class="flex items-center justify-between w-full bg-secondary/50 hover:bg-secondary text-foreground text-xs py-1.5 px-2 rounded-sm border border-transparent hover:border-border transition-all focus:outline-none focus:ring-1 focus:ring-blue-500 group"
      @click="toggle"
    >
      <div class="flex items-center gap-2 truncate">
        <component
          :is="selected.icon"
          v-if="selected?.icon"
        />
        <span :class="{'text-muted-foreground': !selected}">
          {{ selected ? selected.label : placeholder }}
        </span>
      </div>
      <ChevronDown
        :size="12"
        :class="['text-muted-foreground shrink-0 ml-1 transition-transform duration-200', isOpen ? 'rotate-180' : '']"
      />
    </button>

    <div
      v-if="isOpen"
      class="absolute top-full left-0 w-full mt-1 bg-popover border border-border rounded-md shadow-lg z-50 max-h-48 overflow-y-auto py-1 animate-in fade-in zoom-in-95 duration-100"
    >
      <div 
        v-for="option in options" 
        :key="option.value"
        :class="[
          'px-2 py-1.5 text-xs cursor-pointer flex items-center justify-between',
          option.value === modelValue ? 'bg-accent text-accent-foreground' : 'text-foreground hover:bg-accent/50'
        ]"
        @click="select(option.value)"
      >
        <div class="flex items-center gap-2">
          <component
            :is="option.icon"
            v-if="option.icon"
          />
          <span>{{ option.label }}</span>
        </div>
        <Check
          v-if="option.value === modelValue"
          :size="12"
          class="opacity-100"
        />
      </div>
    </div>
  </div>
</template>
