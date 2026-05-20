<template>
  <div class="relative">
    <!-- 触发按钮 -->
    <button
      class="w-9 h-9 rounded-xl glass-card flex items-center justify-center transition-all duration-200 hover:bg-white/10"
      :class="{ 'ring-1 ring-purple-mist/40': isOpen }"
      @click="isOpen = !isOpen"
    >
      <span class="text-base">{{ currentTrackEmoji }}</span>
    </button>

    <!-- 下拉面板 -->
    <Transition name="dropdown">
      <div
        v-if="isOpen"
        class="absolute right-0 top-11 w-52 glass-card p-3 z-50 shadow-xl"
        style="box-shadow: 0 20px 60px rgba(0,0,0,0.5)"
      >
        <p class="text-white/40 text-xs mb-2 px-1">环境音</p>

        <!-- 停止按钮 -->
        <button
          class="w-full flex items-center gap-2.5 px-2 py-2 rounded-xl transition-all duration-200 mb-1"
          :class="!audioStore.isPlaying ? 'bg-white/10 text-white/70' : 'hover:bg-white/5 text-white/40'"
          @click="stopAudio"
        >
          <span class="text-base">🔇</span>
          <span class="text-xs">关闭</span>
        </button>

        <!-- 音轨列表 -->
        <button
          v-for="track in tracks"
          :key="track.id"
          class="w-full flex items-center gap-2.5 px-2 py-2 rounded-xl transition-all duration-200"
          :class="audioStore.currentTrack === track.id
            ? 'bg-purple-soft/20 text-white/80'
            : 'hover:bg-white/5 text-white/50'"
          @click="playTrack(track.id)"
        >
          <span class="text-base">{{ track.emoji }}</span>
          <span class="text-xs flex-1 text-left">{{ track.name }}</span>
          <span v-if="audioStore.currentTrack === track.id" class="text-[10px] text-purple-mist/60">
            ♪
          </span>
        </button>

        <!-- 音量控制 -->
        <div class="mt-2 pt-2 border-t border-white/10 px-1">
          <div class="flex items-center gap-2">
            <span class="text-white/30 text-xs">🔈</span>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              :value="audioStore.volume"
              class="flex-1 h-1 appearance-none bg-white/20 rounded-full cursor-pointer accent-purple-soft"
              @input="setVolume"
            />
            <span class="text-white/30 text-xs">🔊</span>
          </div>
        </div>
      </div>
    </Transition>

    <!-- 点击外部关闭 -->
    <div v-if="isOpen" class="fixed inset-0 z-40" @click="isOpen = false" />
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useAudioStore } from '@/stores/audio'
import { AUDIO_TRACKS } from '@/types'
import type { AudioType } from '@/types'

const audioStore = useAudioStore()
const isOpen = ref(false)
const tracks = AUDIO_TRACKS

const currentTrackEmoji = computed(() => {
  if (!audioStore.isPlaying) return '🎵'
  const track = tracks.find(t => t.id === audioStore.currentTrack)
  return track?.emoji ?? '🎵'
})

function playTrack(id: AudioType) {
  audioStore.play(id, { fadeDuration: 2000 })
  isOpen.value = false
}

function stopAudio() {
  audioStore.fadeOut(1500)
  isOpen.value = false
}

function setVolume(e: Event) {
  audioStore.setVolume(parseFloat((e.target as HTMLInputElement).value))
}
</script>

<style scoped>
.dropdown-enter-active,
.dropdown-leave-active {
  transition: opacity 0.2s, transform 0.2s;
}
.dropdown-enter-from,
.dropdown-leave-to {
  opacity: 0;
  transform: translateY(-8px) scale(0.95);
}
</style>
