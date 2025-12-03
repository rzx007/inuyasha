<script setup lang="ts">
import type { DialogCloseProps } from "reka-ui"
import type { HTMLAttributes } from "vue"
import { reactiveOmit } from "@vueuse/core"
import { DialogClose, useForwardProps } from "reka-ui"
import { cn } from "@/lib/utils"
import { X } from "lucide-vue-next"

const props = defineProps<DialogCloseProps & { class?: HTMLAttributes["class"] }>()

const delegatedProps = reactiveOmit(props, "class")
const forwardedProps = useForwardProps(delegatedProps)
</script>

<template>
  <DialogClose
    data-slot="dialog-close"
    v-bind="forwardedProps"
    :class="cn(
      'absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground',
      props.class,
    )"
  >
    <X class="h-4 w-4" />
    <span class="sr-only">Close</span>
  </DialogClose>
</template>
