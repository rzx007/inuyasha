import { computed, ref, type ComputedRef, type Ref } from 'vue'
import { useElementBounding, useEventListener, useResizeObserver } from '@vueuse/core'

export function useComponentOverlay(
  componentRef: Ref<HTMLElement | null>,
  isSelected: ComputedRef<boolean>,
  isDropOver: Ref<{ isOver: boolean }>
) {
  const { top, left, width, height, update } = useElementBounding(componentRef)
  const canvasScrollTop = ref(0)

  const overlayRect = computed(() => ({
    top: top.value,
    left: left.value,
    width: width.value,
    height: height.value
  }))

  const overlayZIndex = computed(() => (canvasScrollTop.value > 0 ? 29 : 30))

  const shouldShowOverlay = computed(() => isSelected.value || isDropOver.value.isOver)

  function syncCanvasScrollTop() {
    const el = document.querySelector('.canvas-content')
    canvasScrollTop.value = el ? (el as HTMLElement).scrollTop : 0
  }

  useEventListener(
    () => document.querySelector('.canvas-content'),
    'scroll',
    () => {
      syncCanvasScrollTop()
      update()
    },
    { passive: true }
  )

  useResizeObserver(
    () => document.querySelector('.canvas-content'),
    () => {
      update()
    }
  )

  return {
    overlayRect,
    overlayZIndex,
    shouldShowOverlay,
    update
  }
}
