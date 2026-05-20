import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { UserProfile, EmotionLevel, ConversationStage, EpisodicMemory, AudioType } from '@/types'

export const useUserStore = defineStore('user', () => {
  // ── 用户基础信息 ──
  const nickname = ref<string>(localStorage.getItem('nightflow_nickname') || '')
  const isOnboarded = ref<boolean>(localStorage.getItem('nightflow_onboarded') === 'true')
  const audioPreference = ref<AudioType>((localStorage.getItem('nightflow_audio') as AudioType) || 'rain')

  // ── 情绪记忆（本地持久化，V1 不依赖后端） ──
  const recentEmotions = ref<Array<{ tag: string; level: EmotionLevel; timestamp: string }>>(
    JSON.parse(localStorage.getItem('nightflow_emotions') || '[]')
  )
  const episodicMemory = ref<EpisodicMemory[]>(
    JSON.parse(localStorage.getItem('nightflow_episodes') || '[]')
  )

  // ── 对话阶段状态机 ──
  const conversationStage = ref<ConversationStage>('accompanying')
  const messageCount = ref(0)
  const sessionStartTime = ref<Date>(new Date())
  const lastMessageTime = ref<Date>(new Date())

  // ── 计算属性 ──
  const sessionDurationMinutes = computed(() => {
    return (Date.now() - sessionStartTime.value.getTime()) / 60000
  })

  const hasProfile = computed(() => nickname.value.trim().length > 0)

  const profile = computed((): UserProfile => ({
    nickname: nickname.value || '你',
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    preferredSleepTime: '23:00',
    reminderTime: localStorage.getItem('nightflow_reminder') || '22:30',
    pushEnabled: localStorage.getItem('nightflow_push') === 'true',
    recentEmotions: recentEmotions.value.map(e => ({
      ...e,
      timestamp: new Date(e.timestamp),
    })),
    episodicMemory: episodicMemory.value,
    audioPreference: audioPreference.value,
  }))

  // ── Actions ──
  function setNickname(name: string) {
    nickname.value = name
    localStorage.setItem('nightflow_nickname', name)
  }

  function completeOnboarding() {
    isOnboarded.value = true
    localStorage.setItem('nightflow_onboarded', 'true')
  }

  function recordEmotion(tag: string, level: EmotionLevel) {
    const entry = { tag, level, timestamp: new Date().toISOString() }
    recentEmotions.value.unshift(entry)
    // 只保留最近 50 条
    recentEmotions.value = recentEmotions.value.slice(0, 50)
    localStorage.setItem('nightflow_emotions', JSON.stringify(recentEmotions.value))
  }

  function addEpisodicMemory(content: string, weight = 1) {
    const entry: EpisodicMemory = {
      content,
      timestamp: new Date(),
      weight,
    }
    episodicMemory.value.unshift(entry)
    // 保留最近 10 条高权重事件
    episodicMemory.value = episodicMemory.value.slice(0, 10)
    localStorage.setItem('nightflow_episodes', JSON.stringify(episodicMemory.value))
  }

  function setAudioPreference(type: AudioType) {
    audioPreference.value = type
    localStorage.setItem('nightflow_audio', type)
  }

  // ── 对话阶段状态机 ──
  function incrementMessageCount() {
    messageCount.value++
    lastMessageTime.value = new Date()
    checkStageTransition()
  }

  function checkStageTransition() {
    if (conversationStage.value === 'accompanying') {
      // 消息数 ≥ 6 或时长 > 12 分钟 → sleep_preparing
      if (messageCount.value >= 6 || sessionDurationMinutes.value > 12) {
        conversationStage.value = 'sleep_preparing'
      }
    }
    // 注意：sleep_mode 由外部（关键词检测 / AI 判断）触发
  }

  function triggerSleepMode() {
    if (conversationStage.value !== 'goodnight') {
      conversationStage.value = 'sleep_mode'
    }
  }

  function triggerGoodnight() {
    conversationStage.value = 'goodnight'
  }

  function resetSession() {
    conversationStage.value = 'accompanying'
    messageCount.value = 0
    sessionStartTime.value = new Date()
    lastMessageTime.value = new Date()
  }

  return {
    nickname,
    isOnboarded,
    audioPreference,
    recentEmotions,
    episodicMemory,
    conversationStage,
    messageCount,
    sessionStartTime,
    lastMessageTime,
    sessionDurationMinutes,
    hasProfile,
    profile,
    setNickname,
    completeOnboarding,
    recordEmotion,
    addEpisodicMemory,
    setAudioPreference,
    incrementMessageCount,
    triggerSleepMode,
    triggerGoodnight,
    resetSession,
  }
})
