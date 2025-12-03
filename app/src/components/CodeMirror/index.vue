<script setup lang="ts">
import CodeMirror from 'vue-codemirror6'
import { json } from '@codemirror/lang-json'
import { sql } from '@codemirror/lang-sql'
import { oneDark } from '@codemirror/theme-one-dark'
defineOptions({
  name: 'CodeMirror',
})

// 根据传入的语言类型选择相应的语言支持
const props = defineProps({
  language: {
    type: String,
    default: 'sql',
  },
})

// 获取语言支持
const getLang = () => {
  switch (props.language) {
    case 'json':
      return json()
    case 'sql':
    default:
      return sql()
  }
}

const attrs = useAttrs()
const codeMirrorRef = useTemplateRef<InstanceType<typeof CodeMirror> | null>(null)
defineExpose({ codeMirrorRef })
</script>
<template>
  <code-mirror class="h-[300px]" v-bind="attrs" :indent-with-tab="true" :tab-size="2" :tab="true" :lang="getLang()">
  </code-mirror>
</template>

<style>
.cm-editor {
  height: 100%;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace;
}

.cm-editor.cm-focused {
  outline: none;
}

/* 适配暗色主题 */
.cm-editor {
  /* background-color: hsl(var(--background)) !important; */
}

/* 调整内边距 */
.cm-scroller {
  padding: 0.5rem;
}
</style>
