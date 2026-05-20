// 类型定义

export type EmotionLevel = 'high_anxiety' | 'moderate' | 'calm' | 'very_calm'

export type ConversationStage = 'accompanying' | 'sleep_preparing' | 'sleep_mode' | 'goodnight'

export interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
  toolCalls?: ToolCall[]
  emotionDetected?: EmotionLevel
}

export interface ToolCall {
  name: string
  args: Record<string, unknown>
  result?: unknown
}

export interface UserProfile {
  nickname: string
  timezone: string
  preferredSleepTime: string
  reminderTime: string
  pushEnabled: boolean
  recentEmotions: EmotionTag[]
  episodicMemory: EpisodicMemory[]
  audioPreference: AudioType
}

export interface EmotionTag {
  tag: string
  level: EmotionLevel
  timestamp: Date
}

export interface EpisodicMemory {
  content: string
  timestamp: Date
  weight: number
}

export type AudioType = 'rain' | 'fireplace' | 'ocean' | 'whitenoise' | 'cafe' | 'forest' | 'wind' | 'river'

export interface AudioTrack {
  id: AudioType
  name: string
  emoji: string
  url: string
}

// 工具调用结果（前端可处理的）
export interface FrontendToolResult {
  tool: 'play_ambient_sound' | 'play_sleep_story' | 'start_breathing_exercise'
  args: Record<string, unknown>
}

export interface BreathingPattern {
  name: string
  inhale: number  // 吸气秒数
  hold: number    // 屏息秒数
  exhale: number  // 呼气秒数
  cycles: number  // 循环次数
}

export const BREATHING_PATTERNS: Record<string, BreathingPattern> = {
  '4-7-8': {
    name: '4-7-8 呼吸法',
    inhale: 4,
    hold: 7,
    exhale: 8,
    cycles: 4,
  },
  'box': {
    name: '方形呼吸',
    inhale: 4,
    hold: 4,
    exhale: 4,
    cycles: 6,
  },
}

export const AUDIO_TRACKS: AudioTrack[] = [
  { id: 'rain',       name: '雨声',   emoji: '🌧️', url: '/audio/rain.mp3' },
  { id: 'fireplace',  name: '篝火',   emoji: '🔥', url: '/audio/fireplace.mp3' },
  { id: 'ocean',      name: '海浪',   emoji: '🌊', url: '/audio/ocean.mp3' },
  { id: 'whitenoise', name: '白噪音', emoji: '〰️', url: '/audio/whitenoise.mp3' },
  { id: 'cafe',       name: '咖啡馆', emoji: '☕', url: '/audio/cafe.mp3' },
  { id: 'forest',     name: '森林',   emoji: '🌲', url: '/audio/forest.mp3' },
  { id: 'wind',       name: '风声',   emoji: '🍃', url: '/audio/wind.mp3' },
  { id: 'river',      name: '河流',   emoji: '💧', url: '/audio/river.mp3' },
]
