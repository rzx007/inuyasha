<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { Eye, EyeOff, ChevronDown, Check } from 'lucide-vue-next'

type ColorMode = 'HEX' | 'HSL' | 'RGB'

const props = withDefaults(
  defineProps<{
    label?: string
    initialColor?: string
    initialOpacity?: number
  }>(),
  {
    initialColor: '#3B82F6',
    initialOpacity: 100
  }
)

const color = ref(props.initialColor)
const opacity = ref(props.initialOpacity)
const visible = ref(true)
const mode = ref<ColorMode>('HEX')
const isDropdownOpen = ref(false)
const dropdownRef = ref<HTMLDivElement | null>(null)

// Helper to convert HEX to HSL
const hexToHsl = (hex: string) => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  if (!result) {
return { h: 0, s: 0, l: 0 }
}
  let r = parseInt(result[1], 16)
  let g = parseInt(result[2], 16)
  let b = parseInt(result[3], 16)
  r /= 255
  g /= 255
  b /= 255
  const max = Math.max(r, g, b),
    min = Math.min(r, g, b)
  let h = 0,
    s = 0,
    l = (max + min) / 2
  if (max !== min) {
    const d = max - min
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
    switch (max) {
      case r:
        h = (g - b) / d + (g < b ? 6 : 0)
        break
      case g:
        h = (b - r) / d + 2
        break
      case b:
        h = (r - g) / d + 4
        break
      default:
        break
    }
    h /= 6
  }
  return { h: Math.round(h * 360), s: Math.round(s * 100), l: Math.round(l * 100) }
}

const hexToRgb = (hex: string) => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
      }
    : { r: 0, g: 0, b: 0 }
}

const displayValue = computed(() => {
  if (mode.value === 'HEX') {
return color.value.toUpperCase()
}
  if (mode.value === 'HSL') {
    const { h, s, l } = hexToHsl(color.value)
    return `${h}, ${s}%, ${l}%`
  }
  if (mode.value === 'RGB') {
    const { r, g, b } = hexToRgb(color.value)
    return `${r}, ${g}, ${b}`
  }
  return color.value
})

const handleInputChange = (e: Event) => {
  const val = (e.target as HTMLInputElement).value
  if (val.startsWith('#') && (val.length === 4 || val.length === 7)) {
    color.value = val
  }
}

const handleOpacityChange = (e: Event) => {
  const val = Number((e.target as HTMLInputElement).value)
  if (!isNaN(val) && val >= 0 && val <= 100) {
opacity.value = val
}
}

const toggleDropdown = () => (isDropdownOpen.value = !isDropdownOpen.value)
const setMode = (m: ColorMode) => {
  mode.value = m
  isDropdownOpen.value = false
}

const handleClickOutside = (event: MouseEvent) => {
  if (dropdownRef.value && !dropdownRef.value.contains(event.target as Node)) {
    isDropdownOpen.value = false
  }
}

onMounted(() => document.addEventListener('mousedown', handleClickOutside))
onUnmounted(() => document.removeEventListener('mousedown', handleClickOutside))

const modes: ColorMode[] = ['HEX', 'RGB', 'HSL']
</script>

<template>
  <div class="flex flex-col gap-2">
    <span
      v-if="label"
      class="text-[10px] text-muted-foreground font-medium"
    >{{ label }}</span>

    <div class="flex items-center gap-2">
      <!-- Main Input Group -->
      <div
        class="flex-1 flex items-center p-1 bg-secondary/50 rounded-sm border border-transparent hover:border-border hover:bg-secondary transition-all group focus-within:ring-1 focus-within:ring-blue-500 focus-within:bg-background relative"
      >
        <!-- Color Swatch -->
        <div
          class="relative w-5 h-5 mr-2 shrink-0 group/swatch cursor-pointer rounded-[3px] overflow-hidden border border-border/50 shadow-sm"
        >
          <div
            class="absolute inset-0 bg-[url('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAQAAAAECAYAAACp8Z5+AAAAAXNSR0IArs4c6QAAACpJREFUGFdjZEACOtqa/2HgAAIDEBfGxv///38Gkvj///+DheAAEzY2AAA80A797+V25AAAAABJRU5ErkJggg==')] bg-repeat opacity-50"
          />
          <div
            class="w-full h-full relative z-10"
            :style="{ backgroundColor: color, opacity: opacity / 100 }"
          />
          <input
            v-model="color"
            type="color"
            class="absolute inset-0 opacity-0 cursor-pointer w-full h-full z-20"
          >
        </div>

        <!-- Value Input -->
        <input
          type="text"
          :value="displayValue"
          class="flex-1 min-w-0 bg-transparent border-none outline-none text-xs font-mono text-foreground uppercase w-full"
          spellcheck="false"
          @input="handleInputChange"
        >

        <!-- Mode Select Dropdown -->
        <div
          ref="dropdownRef"
          class="relative"
        >
          <button
            class="flex items-center gap-0.5 px-1 py-0.5 hover:bg-black/5 dark:hover:bg-white/10 rounded-sm text-[9px] text-muted-foreground font-medium transition-colors mr-1"
            @click="toggleDropdown"
          >
            {{ mode }}
            <ChevronDown :size="10" />
          </button>

          <div
            v-if="isDropdownOpen"
            class="absolute top-full right-0 mt-1 w-20 bg-popover border border-border rounded-md shadow-lg z-50 py-1 flex flex-col animate-in fade-in zoom-in-95 duration-100"
          >
            <button
              v-for="m in modes"
              :key="m"
              class="flex items-center justify-between px-2 py-1.5 text-[10px] text-left hover:bg-accent hover:text-accent-foreground text-popover-foreground w-full"
              @click="setMode(m)"
            >
              {{ m }}
              <Check
                v-if="mode === m"
                :size="10"
              />
            </button>
          </div>
        </div>

        <!-- Opacity Input (Numeric) -->
        <div
          class="flex items-center gap-0.5 px-1 border-l border-border/50 pl-2 ml-1 w-12 shrink-0"
        >
          <input
            type="text"
            :value="opacity"
            class="w-full bg-transparent border-none outline-none text-right text-xs font-mono text-foreground"
            @input="handleOpacityChange"
          >
          <span class="text-[10px] text-muted-foreground">%</span>
        </div>
      </div>

      <!-- Visibility Toggle -->
      <button
        class="p-1.5 hover:bg-secondary text-muted-foreground hover:text-foreground rounded-sm transition-colors"
        @click="visible = !visible"
      >
        <Eye
          v-if="visible"
          :size="14"
        />
        <EyeOff
          v-else
          :size="14"
        />
      </button>
    </div>

    <!-- Visual Opacity Slider -->
    <div class="flex items-center gap-2 px-0.5 group select-none">
      <div
        class="flex-1 h-2 relative rounded-full overflow-hidden cursor-pointer bg-secondary border border-border/50"
      >
        <!-- Checkerboard background -->
        <div
          class="absolute inset-0 bg-[url('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAQAAAAECAYAAACp8Z5+AAAAAXNSR0IArs4c6QAAACpJREFUGFdjZEACOtqa/2HgAAIDEBfGxv///38Gkvj///+DheAAEzY2AAA80A797+V25AAAAABJRU5ErkJggg==')] bg-repeat opacity-30"
        />

        <!-- Gradient Bar -->
        <div
          class="absolute inset-y-0 left-0 transition-all duration-75 ease-out"
          :style="{
            width: `${opacity}%`,
            background: `linear-gradient(to right, transparent, ${color})`
          }"
        />

        <!-- Slider Thumb (Implicit/Interactive) -->
        <input
          v-model.number="opacity"
          type="range"
          min="0"
          max="100"
          step="1"
          class="absolute inset-0 w-full h-full opacity-0 cursor-ew-resize z-10 m-0 p-0"
        >
      </div>
    </div>
  </div>
</template>
