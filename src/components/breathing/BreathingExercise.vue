<template>
  <!-- 呼吸引导组件 -->
  <div class="my-4 animate-fade-in">
    <div class="glass-card p-5 text-center glow-purple">
      <!-- 标题 -->
      <p class="text-white/40 text-xs mb-4">{{ pattern.name }}</p>

      <!-- 呼吸圆圈 -->
      <div class="flex justify-center mb-4">
        <div class="relative w-32 h-32 flex items-center justify-center">
          <!-- 外圈光晕 -->
          <div
            class="absolute inset-0 rounded-full border-2 transition-all duration-1000"
            :class="ringClass"
            :style="ringStyle"
          />
          <!-- 中圈 -->
          <div
            class="absolute inset-3 rounded-full border transition-all duration-1000"
            :class="innerRingClass"
          />
          <!-- 内核 -->
          <div
            class="absolute inset-6 rounded-full transition-all duration-1000"
            :class="coreClass"
          />
          <!-- 文字 -->
          <div class="relative z-10 text-center">
            <p class="text-white/80 text-lg font-light tabular-nums">{{ displayCount }}</p>
            <p class="text-white/40 text-xs mt-0.5">{{ phaseLabel }}</p>
          </div>
        </div>
      </div>

      <!-- 阶段说明 -->
      <p class="text-white/50 text-sm mb-4">{{ phaseInstruction }}</p>

      <!-- 进度条 -->
      <div class="flex justify-center gap-1.5 mb-4">
        <div
          v-for="i in pattern.cycles"
          :key="i"
          class="w-2 h-2 rounded-full transition-all duration-500"
          :class="i <= completedCycles ? 'bg-purple-mist/70' : 'bg-white/15'"
        />
      </div>

      <!-- 跳过 -->
      <button
        class="text-white/25 text-xs hover:text-white/50 transition-colors"
        @click="$emit('complete')"
      >
        跳过
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import type { BreathingPattern } from '@/types'

const props = defineProps<{
  pattern: BreathingPattern
}>()

const emit = defineEmits<{
  complete: []
}>()

// 呼吸阶段：inhale | hold | exhale
type Phase = 'inhale' | 'hold' | 'exhale'
const phase = ref<Phase>('inhale')
const countdown = ref(props.pattern.inhale)
const completedCycles = ref(0)
const isRunning = ref(true)

let timer: ReturnType<typeof setInterval> | null = null

// ── 阶段配置 ──
const phaseLabel = computed(() => {
  const labels: Record<Phase, string> = { inhale: '吸气', hold: '屏息', exhale: '呼气' }
  return labels[phase.value]
})

const phaseInstruction = computed(() => {
  if (phase.value === 'inhale') return '慢慢吸气，感受空气充满肺部'
  if (phase.value === 'hold') return '轻轻屏住，感受当下的静止'
  return '缓缓呼出，放下所有紧绷'
})

const displayCount = computed(() => String(countdown.value))

// ── 圆圈动画样式 ──
const ringClass = computed(() => {
  if (phase.value === 'inhale') return 'border-purple-mist/60 scale-110'
  if (phase.value === 'hold') return 'border-purple-mist/40 scale-110'
  return 'border-purple-mist/30 scale-100'
})

const ringStyle = computed(() => ({
  transform: phase.value === 'inhale' || phase.value === 'hold' ? 'scale(1.15)' : 'scale(1)',
  transition: phase.value === 'inhale'
    ? `transform ${props.pattern.inhale}s ease-in-out, border-color 0.5s`
    : phase.value === 'exhale'
      ? `transform ${props.pattern.exhale}s ease-in-out, border-color 0.5s`
      : 'border-color 0.5s',
}))

const innerRingClass = computed(() => {
  if (phase.value === 'inhale') return 'border-purple-soft/30'
  if (phase.value === 'hold') return 'border-purple-soft/20'
  return 'border-purple-dream/20'
})

const coreClass = computed(() => {
  if (phase.value === 'inhale') return 'bg-purple-soft/30'
  if (phase.value === 'hold') return 'bg-purple-soft/25'
  return 'bg-purple-dream/15'
})

// ── 呼吸节拍计时器 ──
function startTimer() {
  timer = setInterval(() => {
    countdown.value--

    if (countdown.value <= 0) {
      advancePhase()
    }
  }, 1000)
}

function advancePhase() {
  if (phase.value === 'inhale') {
    if (props.pattern.hold > 0) {
      phase.value = 'hold'
      countdown.value = props.pattern.hold
    } else {
      phase.value = 'exhale'
      countdown.value = props.pattern.exhale
    }
  } else if (phase.value === 'hold') {
    phase.value = 'exhale'
    countdown.value = props.pattern.exhale
  } else {
    // 完成一个循环
    completedCycles.value++
    if (completedCycles.value >= props.pattern.cycles) {
      // 全部完成
      if (timer) clearInterval(timer)
      isRunning.value = false
      setTimeout(() => emit('complete'), 1500)
      return
    }
    phase.value = 'inhale'
    countdown.value = props.pattern.inhale
  }
}

onMounted(() => {
  startTimer()
})

onUnmounted(() => {
  if (timer) clearInterval(timer)
})
</script>
