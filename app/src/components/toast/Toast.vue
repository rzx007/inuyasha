<template>
  <div class="toast-box">
    <p class="toast-value" :style="{ background: background, color: color }">
      <span class="flex items-center">
        <component :is="getIcon" v-if="getIcon" class="w-4 h-4 mr-2"></component>
        <span>{{ value }}</span>
      </span>
    </p>
  </div>
</template>

<script lang="ts">
import { defineComponent, computed } from 'vue'
import { CircleCheck, CircleAlert, Info, AlertCircle } from 'lucide-vue-next'

export default defineComponent({
  name: 'Toast',
  components: {
    CircleCheck,
    CircleAlert,
    Info,
    AlertCircle,
  },
  props: {
    value: {
      type: String,
      default: '',
    },
    duration: {
      type: Number,
      default: 3000,
    },
    background: {
      type: String,
      default: '#000',
    },
    color: {
      type: String,
      default: '#fff',
    },
    type: {
      type: String,
      default: 'default',
      validator: (value: string) => ['success', 'error', 'info', 'warning', 'default'].includes(value),
    },
  },
  setup(props) {
    const getIcon = computed(() => {
      if (props.type === 'success' || props.value.includes('成功')) {
        return CircleCheck
      }
      if (props.type === 'error' || props.value.includes('失败')) {
        return CircleAlert
      }
      if (props.type === 'info') {
        return Info
      }
      if (props.type === 'warning') {
        return AlertCircle
      }
      return null
    })

    return {
      getIcon,
    }
  },
})
</script>

<style>
.toast-box {
  position: fixed;
  width: 100vw;
  top: 6vh;
  left: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
}
.toast-value {
  background: rgb(8, 8, 8);
  padding: 8px 20px;
  border-radius: 4px;
  text-align: center;
  display: inline-block;
  animation: anim 0.5s;
  font-size: 14px;
}
@keyframes anim {
  0% {
    opacity: 0;
  }
  100% {
    opacity: 1;
  }
}
.toast-value.reomve {
  animation: reomve 0.5s;
}
@keyframes reomve {
  0% {
    opacity: 1;
  }
  100% {
    opacity: 0;
  }
}
</style>
