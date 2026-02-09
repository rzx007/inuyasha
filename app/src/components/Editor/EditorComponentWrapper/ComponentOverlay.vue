<script setup lang="ts">
interface Props {
  overlayRect: { top: number; left: number; width: number; height: number }
  zIndex: number
  indicatorPosition: 'top' | 'bottom' | 'left' | 'right' | null
  isDropOver: boolean
  isSelected: boolean
  handleDeleteButtonClick: () => void
  handleDragSource: (el: any) => void
  schema: {
    semanticId: string
  }
}

const props = defineProps<Props>()
</script>

<template>
  <div
    class="component-overlay fixed pointer-events-none"
    :style="{
      top: overlayRect.top + 'px',
      left: overlayRect.left + 'px',
      width: overlayRect.width + 'px',
      height: overlayRect.height + 'px',
      zIndex
    }"
  >
    <div
      v-if="isDropOver && indicatorPosition === 'top'"
      class="absolute top-0 left-0 right-0 h-0.5 bg-blue-500 z-50 pointer-events-none"
    />
    <div
      v-if="isDropOver && indicatorPosition === 'bottom'"
      class="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-500 z-50 pointer-events-none"
    />
    <div
      v-if="isDropOver && indicatorPosition === 'left'"
      class="absolute top-0 bottom-0 left-0 w-0.5 bg-blue-500 z-50 pointer-events-none"
    />
    <div
      v-if="isDropOver && indicatorPosition === 'right'"
      class="absolute top-0 bottom-0 right-0 w-0.5 bg-blue-500 z-50 pointer-events-none"
    />

    <div v-if="isSelected" class="absolute inset-[-2px] border-2 border-blue-500 rounded" />

    <div
      v-if="isSelected"
      :ref="handleDragSource"
      class="absolute -top-7 left-[-2px] bg-blue-500 text-white text-xs px-2 py-1 rounded-t flex items-center whitespace-nowrap min-w-fit pointer-events-auto"
    >
      <span class="cursor-move mr-2 whitespace-nowrap">⠿ {{ schema.semanticId }}</span>
      <button
        class="bg-transparent hover:bg-white/20 p-1 rounded shrink-0"
        title="Delete"
        @click.stop="handleDeleteButtonClick"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24">
          <path
            fill="currentColor"
            d="M7 21q-.825 0-1.412-.587T5 19V6H4V4h5V3h6v1h5v2h-1v13q0 .825-.587 1.413T17 21zM17 6H7v13h10zM9 17h2V8H9zm4 0h2V8h-2zM7 6v13z"
          />
        </svg>
      </button>
    </div>
  </div>
</template>
