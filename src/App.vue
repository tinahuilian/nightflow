<template>
  <div
    class="min-h-dvh relative overflow-hidden stars-bg transition-all duration-[3000ms]"
    :class="bgClass"
  >
    <!-- 深夜背景渐变 -->
    <div class="fixed inset-0 bg-night-gradient pointer-events-none z-0" />

    <!-- 睡眠模式遮罩 -->
    <Transition name="sleep-veil">
      <div
        v-if="stage === 'sleep_mode' || stage === 'goodnight'"
        class="sleep-veil bg-black"
        :style="{ opacity: sleepVeilOpacity }"
      />
    </Transition>

    <!-- 星星粒子（纯 CSS） -->
    <StarField :dim="stage === 'sleep_mode'" />

    <!-- 路由视图 -->
    <RouterView />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useUserStore } from '@/stores/user'
import StarField from '@/components/ui/StarField.vue'

const userStore = useUserStore()
const stage = computed(() => userStore.conversationStage)

const bgClass = computed(() => {
  if (stage.value === 'sleep_mode' || stage.value === 'goodnight') {
    return 'brightness-75'
  }
  if (stage.value === 'sleep_preparing') {
    return 'brightness-90'
  }
  return ''
})

const sleepVeilOpacity = computed(() => {
  if (stage.value === 'goodnight') return 0.3
  if (stage.value === 'sleep_mode') return 0.2
  return 0
})
</script>
