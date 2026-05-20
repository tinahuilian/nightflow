<template>
  <div class="flex" :class="message.role === 'user' ? 'justify-end' : 'justify-start'">
    <div
      class="max-w-[85%] animate-fade-in"
      :class="message.role === 'user' ? 'msg-bubble-user' : 'msg-bubble-ai'"
    >
      <!-- AI 消息 -->
      <template v-if="message.role === 'assistant'">
        <p
          class="text-white/85 leading-relaxed whitespace-pre-wrap"
          :class="[textSizeClass, slowTypingClass]"
        >
          {{ displayContent }}
        </p>

        <!-- 工具调用状态（轻提示，不打扰） -->
        <div
          v-if="hasToolCalls"
          class="mt-2 flex flex-wrap gap-1"
        >
          <span
            v-for="tool in activeTools"
            :key="tool"
            class="text-[10px] text-purple-mist/50 flex items-center gap-1"
          >
            <span class="w-1 h-1 rounded-full bg-purple-mist/40 animate-pulse-soft" />
            {{ toolLabel(tool) }}
          </span>
        </div>
      </template>

      <!-- 用户消息 -->
      <template v-else>
        <p
          class="text-white/75 leading-relaxed whitespace-pre-wrap"
          :class="textSizeClass"
        >
          {{ message.content }}
        </p>
      </template>

      <!-- 时间戳（hover 显示） -->
      <p class="text-white/20 text-[10px] mt-1 text-right opacity-0 group-hover:opacity-100 transition-opacity">
        {{ timeStr }}
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { Message } from '@ai-sdk/vue'
import type { ConversationStage } from '@/types'


const props = defineProps<{
  message: Message
  stage: ConversationStage
}>()

// 助眠故事内容慢速显示（CSS 控制）
const displayContent = computed(() => props.message.content)

const hasToolCalls = computed(() => {
  return props.message.toolInvocations && props.message.toolInvocations.length > 0
})

const activeTools = computed(() => {
  if (!props.message.toolInvocations) return []
  return props.message.toolInvocations
    .filter(t => t.state === 'result')
    .map(t => t.toolName)
})

const toolLabel = (toolName: string): string => {
  const labels: Record<string, string> = {
    save_emotion: '记录了情绪',
    save_sleep_log: '记录了入睡时间',
    play_ambient_sound: '播放了环境音',
    play_sleep_story: '开始了助眠故事',
    start_breathing_exercise: '启动了呼吸引导',
    recommend_sleep_tip: '生成了睡眠建议',
  }
  return labels[toolName] ?? toolName
}

const textSizeClass = computed(() => {
  if (props.stage === 'sleep_mode' || props.stage === 'goodnight') {
    return 'text-xs'
  }
  return 'text-sm'
})

const slowTypingClass = computed(() => {
  if (props.stage === 'sleep_mode') return 'tracking-wide'
  return ''
})

const timeStr = computed(() => {
  if (!props.message.createdAt) return ''
  return new Date(props.message.createdAt).toLocaleTimeString('zh-CN', {
    hour: '2-digit',
    minute: '2-digit',
  })
})
</script>
