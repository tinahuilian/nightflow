<template>
  <!-- 晚安结束仪式卡片 -->
  <div class="animate-fade-in py-4">
    <!-- 分隔线 -->
    <div class="flex items-center gap-3 mb-6">
      <div class="flex-1 h-px bg-gradient-to-r from-transparent to-purple-mist/20" />
      <span class="text-purple-mist/40 text-sm">🌙</span>
      <div class="flex-1 h-px bg-gradient-to-l from-transparent to-purple-mist/20" />
    </div>

    <!-- 晚安语卡片 -->
    <div class="glass-card p-5 glow-purple text-center">
      <p class="text-white/80 text-sm leading-relaxed whitespace-pre-wrap mb-4">
        {{ message }}
      </p>

      <!-- 呼吸圆圈 -->
      <div class="flex justify-center mb-6">
        <div class="w-16 h-16 relative">
          <div class="absolute inset-0 rounded-full border border-purple-mist/20 animate-breathe-slow" />
          <div class="absolute inset-2 rounded-full border border-purple-mist/15 animate-breathe" />
          <div class="absolute inset-4 rounded-full bg-purple-mist/10 animate-breathe" />
        </div>
      </div>

      <p class="text-white/30 text-xs mb-4">
        {{ sleepTime }}
      </p>

      <!-- 新会话按钮 -->
      <button
        class="px-5 py-2.5 rounded-2xl bg-white/5 border border-white/10 text-white/40 text-xs hover:bg-white/10 hover:text-white/60 transition-all duration-300"
        @click="$emit('new-session')"
      >
        开始新的一晚
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  message: string
  nickname: string
}>()

defineEmits<{
  'new-session': []
}>()

const sleepTime = computed(() => {
  const now = new Date()
  return `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')} · 晚安，${props.nickname || '你'}`
})
</script>
