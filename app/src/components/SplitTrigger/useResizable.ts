import { ref } from 'vue'

export function useResizable() {
  const isDragging = ref(false)

  const createResizeHandler = (
    setter: (value: number) => void,
    minValue: number,
    maxValue: number,
    calculateValue: (event: MouseEvent) => number,
  ) => {
    return (e: MouseEvent) => {
      isDragging.value = true
      e.preventDefault()

      const handleMouseMove = (e: MouseEvent) => {
        const newValue = Math.max(minValue, Math.min(maxValue, calculateValue(e)))
        setter(newValue)
      }

      const handleMouseUp = () => {
        isDragging.value = false
        document.removeEventListener('mousemove', handleMouseMove)
        document.removeEventListener('mouseup', handleMouseUp)
      }

      document.addEventListener('mousemove', handleMouseMove)
      document.addEventListener('mouseup', handleMouseUp)
    }
  }

  return {
    isDragging,
    createResizeHandler,
  }
}
