<template>
  <!-- 星星粒子背景 -->
  <div class="fixed inset-0 pointer-events-none overflow-hidden z-0">
    <div
      v-for="star in stars"
      :key="star.id"
      class="absolute rounded-full bg-white"
      :class="[dim ? 'opacity-30' : 'opacity-80']"
      :style="{
        left: star.x + '%',
        top: star.y + '%',
        width: star.size + 'px',
        height: star.size + 'px',
        animationDelay: star.delay + 's',
        animationDuration: star.duration + 's',
        animation: `twinkle ${star.duration}s ease-in-out ${star.delay}s infinite`,
        transition: 'opacity 3s ease-in-out',
      }"
    />

    <!-- 月晕光圈 -->
    <div
      class="absolute top-8 right-12 w-32 h-32 rounded-full opacity-5"
      :class="dim ? 'opacity-[0.02]' : 'opacity-5'"
      style="background: radial-gradient(circle, #a78bfa, transparent); transition: opacity 3s ease-in-out;"
    />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  dim?: boolean
}>()

// 生成固定的星星列表（SSR 友好，用 seed 生成）
const stars = computed(() => {
  return Array.from({ length: 60 }, (_, i) => {
    const seed = (i + 1) * 137.508 // 黄金角近似
    return {
      id: i,
      x: ((seed * 23.14) % 100),
      y: ((seed * 17.31) % 100),
      size: i % 5 === 0 ? 2 : i % 3 === 0 ? 1.5 : 1,
      delay: (i * 0.3) % 4,
      duration: 2 + (i % 4),
    }
  })
})
</script>
