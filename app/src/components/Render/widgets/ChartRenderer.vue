<script setup lang="ts">
import { ref, watch, onMounted } from 'vue'
import type { EChartsOption } from 'echarts'
import * as echarts from 'echarts'

interface Props {
  option: EChartsOption
  style: Record<string, any>
}
const props = withDefaults(defineProps<Props>(), {
  option: () => ({}),
  style: () => ({ width: '100%', height: '400px' }),
})

const chartRef = ref<HTMLElement | null>(null)
let chartInstance: echarts.ECharts | null = null

function initChart() {
  if (chartRef.value) {
    chartInstance = echarts.init(chartRef.value)
    chartInstance.setOption(props.option)
  }
}

function resizeChart() {
  chartInstance?.resize()
}

onMounted(() => {
  initChart()
  window.addEventListener('resize', resizeChart)
})

watch(
  () => props.option,
  (newOption) => {
    chartInstance?.setOption(newOption)
  },
  { deep: true }
)
</script>

<template>
  <div ref="chartRef" :style="style" />
</template>
