<script setup lang="ts">
  import { ElSpace } from 'element-plus'
  

  const props = withDefaults(
    defineProps<{
      display?: 'block' | 'flex'
    }>(),
    {
      display: 'block',
    }
  )

  const boxStyle = computed(() => ({
    display: 'block',
  }))
  </script>
  
  <template>
    <!-- flex 模式：使用 ElSpace 提供间距 -->
    <ElSpace
      v-if="display === 'flex'"
      v-bind="$attrs"
    >
      <slot />
    </ElSpace>
  
    <!-- 非 flex 模式：普通容器（可配 padding） -->
    <div v-else :style="boxStyle">
      <slot />
    </div>
  </template>