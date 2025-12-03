<script setup lang="ts">
import type { DialogTriggerProps } from "reka-ui"
import type { HTMLAttributes } from "vue"
import { reactiveOmit } from "@vueuse/core"
import { DialogTrigger, useForwardProps } from "reka-ui"
import { cn } from "@/lib/utils"

const props = defineProps<DialogTriggerProps & { class?: HTMLAttributes["class"] }>()

const delegatedProps = reactiveOmit(props, "class")
const forwardedProps = useForwardProps(delegatedProps)
</script>

<template>
  <DialogTrigger
    data-slot="dialog-trigger"
    v-bind="forwardedProps"
    :class="cn('outline-none', props.class)"
  >
    <slot />
  </DialogTrigger>
</template>
