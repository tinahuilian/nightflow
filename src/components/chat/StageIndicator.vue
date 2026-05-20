<template>
  <!-- 睡眠阶段状态指示器 -->
  <div
    v-if="stage !== 'accompanying'"
    class="flex items-center gap-1.5 px-2.5 py-1 rounded-full glass-card"
  >
    <div
      class="w-1.5 h-1.5 rounded-full"
      :class="dotClass"
    />
    <span class="text-[11px] text-white/40">{{ stageLabel }}</span>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { ConversationStage } from '@/types'

const props = defineProps<{
  stage: ConversationStage
}>()

const stageLabel = computed(() => {
  const labels: Record<ConversationStage, string> = {
    accompanying: '',
    sleep_preparing: '准备入睡',
    sleep_mode: '睡眠中',
    goodnight: '晚安',
  }
  return labels[props.stage]
})

const dotClass = computed(() => {
  if (props.stage === 'sleep_mode' || props.stage === 'goodnight') {
    return 'bg-purple-mist/60 animate-pulse-soft'
  }
  return 'bg-blue-400/50 animate-pulse-soft'
})
</script>
