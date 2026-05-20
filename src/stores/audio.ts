import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { AudioType } from '@/types'

export const useAudioStore = defineStore('audio', () => {
  const currentTrack = ref<AudioType | null>(null)
  const isPlaying = ref(false)
  const volume = ref(0.3)
  const isFading = ref(false)

  let audioEl: HTMLAudioElement | null = null
  let fadeInterval: ReturnType<typeof setInterval> | null = null

  function play(type: AudioType, options?: { fadeDuration?: number; targetVolume?: number }) {
    const targetVol = options?.targetVolume ?? volume.value
    const fadeDuration = options?.fadeDuration ?? 2000

    if (audioEl && currentTrack.value === type && isPlaying.value) return

    // 停止当前播放
    if (audioEl) {
      audioEl.pause()
      audioEl = null
    }

    currentTrack.value = type
    audioEl = new Audio(`/audio/${type}.mp3`)
    audioEl.loop = true
    audioEl.volume = 0

    audioEl.play().then(() => {
      isPlaying.value = true
      fadeIn(targetVol, fadeDuration)
    }).catch(() => {
      // 用户未交互时自动播放受限，静默处理
      isPlaying.value = false
    })
  }

  function fadeIn(targetVol: number, duration: number) {
    if (!audioEl) return
    isFading.value = true
    const steps = 30
    const stepTime = duration / steps
    const stepVol = targetVol / steps
    let current = 0

    if (fadeInterval) clearInterval(fadeInterval)
    fadeInterval = setInterval(() => {
      current++
      if (audioEl) {
        audioEl.volume = Math.min(stepVol * current, targetVol)
      }
      if (current >= steps) {
        clearInterval(fadeInterval!)
        isFading.value = false
        volume.value = targetVol
      }
    }, stepTime)
  }

  function fadeOut(duration = 2000): Promise<void> {
    return new Promise(resolve => {
      if (!audioEl || !isPlaying.value) { resolve(); return }
      isFading.value = true
      const currentVol = audioEl.volume
      const steps = 30
      const stepTime = duration / steps
      const stepVol = currentVol / steps
      let current = 0

      if (fadeInterval) clearInterval(fadeInterval)
      fadeInterval = setInterval(() => {
        current++
        if (audioEl) {
          audioEl.volume = Math.max(currentVol - stepVol * current, 0)
        }
        if (current >= steps) {
          clearInterval(fadeInterval!)
          stop()
          isFading.value = false
          resolve()
        }
      }, stepTime)
    })
  }

  function stop() {
    if (audioEl) {
      audioEl.pause()
      audioEl.currentTime = 0
      audioEl = null
    }
    isPlaying.value = false
    currentTrack.value = null
  }

  function setVolume(val: number) {
    volume.value = Math.max(0, Math.min(1, val))
    if (audioEl) audioEl.volume = volume.value
  }

  return {
    currentTrack,
    isPlaying,
    volume,
    isFading,
    play,
    fadeIn,
    fadeOut,
    stop,
    setVolume,
  }
})
