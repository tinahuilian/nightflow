<template>
  <div
    class="flex flex-col min-h-dvh relative z-10 transition-all duration-[3000ms]"
    :class="containerClass"
  >
    <!-- 顶部导航栏 -->
    <header class="flex items-center justify-between px-5 pt-safe-top pt-4 pb-3 shrink-0">
      <div class="flex items-center gap-2">
        <span class="text-lg animate-float-slow">🌙</span>
        <span class="text-white/50 text-sm tracking-wider font-light">NightFlow</span>
      </div>
      <div class="flex items-center gap-3">
        <!-- 环境音控制 -->
        <AudioControl />
        <!-- 睡眠阶段指示 -->
        <StageIndicator :stage="stage" />
      </div>
    </header>

    <!-- 消息列表 -->
    <div
      ref="messageListRef"
      class="flex-1 overflow-y-auto px-4 py-2 space-y-4"
      :class="{ 'overflow-hidden': stage === 'sleep_mode' }"
    >
      <!-- 欢迎占位（无消息时） -->
      <div
        v-if="displayMessages.length === 0 && !isLoading"
        class="flex flex-col items-center justify-center h-full text-center py-20"
      >
        <div class="animate-float mb-6">
          <div class="w-16 h-16 rounded-full bg-white/5 border border-white/10 flex items-center justify-center">
            <span class="text-3xl">🌙</span>
          </div>
        </div>
        <p class="text-white/40 text-sm leading-relaxed max-w-xs">
          今晚有什么想聊的吗？
        </p>
      </div>

      <!-- 消息列表 -->
      <TransitionGroup name="msg" tag="div" class="space-y-4">
        <ChatMessage
          v-for="msg in displayMessages"
          :key="msg.id"
          :message="msg"
          :stage="stage"
        />
      </TransitionGroup>

      <!-- AI 正在输入指示器（等待响应阶段） -->
      <div v-if="chat.status === 'submitted'" class="flex items-center gap-3 pl-1">
        <div class="flex gap-1">
          <span
            v-for="i in 3"
            :key="i"
            class="w-1.5 h-1.5 rounded-full bg-purple-mist/60"
            :style="{ animation: `pulse-soft 1.5s ease-in-out ${(i-1) * 0.2}s infinite` }"
          />
        </div>
      </div>

      <!-- 晚安结束仪式 -->
      <GoodnightCard
        v-if="stage === 'goodnight' && goodnightMessage"
        :message="goodnightMessage"
        :nickname="userStore.nickname"
        @new-session="startNewSession"
      />

      <!-- 呼吸引导 -->
      <BreathingExercise
        v-if="showBreathing"
        :pattern="breathingPattern"
        @complete="showBreathing = false"
      />
    </div>

    <!-- 底部输入区 -->
    <div
      class="shrink-0 px-4 pb-safe-bottom pb-4 pt-3 transition-opacity duration-[2000ms]"
      :class="inputAreaClass"
    >
      <!-- 快捷回复（陪伴模式时显示） -->
      <div
        v-if="stage === 'accompanying' && displayMessages.length === 0"
        class="flex gap-2 mb-3 overflow-x-auto pb-1 scrollbar-hide"
      >
        <button
          v-for="prompt in quickPrompts"
          :key="prompt"
          class="shrink-0 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-white/50 text-xs hover:bg-white/10 hover:text-white/70 transition-all duration-200"
          @click="sendQuickPrompt(prompt)"
        >
          {{ prompt }}
        </button>
      </div>

      <!-- 输入框 -->
      <div class="flex items-end gap-3">
        <textarea
          ref="inputRef"
          v-model="inputText"
          class="night-input flex-1 text-sm resize-none min-h-[44px] max-h-32 leading-relaxed"
          :placeholder="inputPlaceholder"
          rows="1"
          @keydown.enter.exact.prevent="sendMessage"
          @input="autoResize"
          :disabled="stage === 'goodnight'"
        />
        <button
          class="shrink-0 w-11 h-11 rounded-2xl flex items-center justify-center transition-all duration-200"
          :class="canSend
            ? 'bg-purple-soft/40 border border-purple-soft/50 hover:bg-purple-soft/60 text-white'
            : 'bg-white/5 border border-white/10 text-white/20 cursor-not-allowed'"
          :disabled="!canSend"
          @click="sendMessage"
        >
          <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M12 19V5M5 12l7-7 7 7" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </button>
      </div>

      <!-- 睡眠模式提示 -->
      <p
        v-if="stage === 'sleep_preparing'"
        class="text-center text-white/25 text-xs mt-2 animate-pulse-soft"
      >
        慢慢来，不用急着回复
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick, onMounted, reactive } from 'vue'
import { Chat } from '@ai-sdk/vue'
import { DefaultChatTransport } from 'ai'
import { useUserStore } from '@/stores/user'
import { useAudioStore } from '@/stores/audio'
import { buildSystemPrompt, detectSleepKeywords, getNightGreeting } from '@/utils/prompt'
import type { BreathingPattern, AudioType } from '@/types'
import { BREATHING_PATTERNS } from '@/types'
import ChatMessage from '@/components/chat/ChatMessage.vue'
import AudioControl from '@/components/chat/AudioControl.vue'
import StageIndicator from '@/components/chat/StageIndicator.vue'
import GoodnightCard from '@/components/chat/GoodnightCard.vue'
import BreathingExercise from '@/components/breathing/BreathingExercise.vue'

const userStore = useUserStore()
const audioStore = useAudioStore()

const messageListRef = ref<HTMLElement>()
const inputRef = ref<HTMLTextAreaElement>()
const inputText = ref('')
const showBreathing = ref(false)
const breathingPattern = ref<BreathingPattern>(BREATHING_PATTERNS['4-7-8'])
const goodnightMessage = ref('')

const stage = computed(() => userStore.conversationStage)

// ── Chat v4 实例 ──
const chat = reactive(new Chat({
  transport: new DefaultChatTransport({
    api: '/api/chat',
    body: () => ({
      systemPrompt: buildSystemPrompt(
        userStore.profile,
        userStore.conversationStage,
        userStore.messageCount,
      ),
      stage: userStore.conversationStage,
      userProfile: { nickname: userStore.nickname },
    }),
  }),
  onFinish: ({ message }) => {
    handleToolResults(message as { parts?: Array<{ type: string; toolName?: string; output?: unknown }> })
    scrollToBottom()
  },
  onError: (error: Error) => {
    console.error('Chat error:', error)
  },
}))

// 获取文本内容工具函数
function getMessageText(msg: { parts?: Array<{ type: string; text?: string }> }): string {
  if (!msg.parts) return ''
  return msg.parts
    .filter(p => p.type === 'text')
    .map(p => p.text ?? '')
    .join('')
}

// 过滤掉初始化消息
const displayMessages = computed(() => {
  return chat.messages.filter(m => getMessageText(m) !== '__init__')
})

const isLoading = computed(() => chat.status === 'submitted' || chat.status === 'streaming')

// ── 工具调用结果处理 ──
function handleToolResults(message: { parts?: Array<{ type: string; toolName?: string; output?: unknown }> }) {
  if (!message.parts) return

  for (const part of message.parts) {
    if (part.type !== 'tool-result') continue
    const result = part.output as Record<string, unknown>
    if (!result) continue

    const toolName = part.toolName as string
    const action = result.action as string

    if (toolName === 'save_emotion' && result.saved) {
      const saved = result.saved as { emotionTag: string; level: 'high_anxiety' | 'moderate' | 'calm' | 'very_calm'; summary: string }
      userStore.recordEmotion(saved.emotionTag, saved.level)
    }

    if (action === 'play_ambient_sound') {
      audioStore.play(result.type as AudioType, {
        fadeDuration: result.fade ? 3000 : 500,
        targetVolume: (result.volume as number) ?? 0.3,
      })
    }

    if (action === 'start_breathing_exercise') {
      const pattern = result.pattern as string
      breathingPattern.value = BREATHING_PATTERNS[pattern] ?? BREATHING_PATTERNS['4-7-8']
      showBreathing.value = true
    }

    if (action === 'play_sleep_story') {
      setTimeout(() => userStore.triggerSleepMode(), 1000)
    }

    if (toolName === 'save_sleep_log') {
      userStore.triggerGoodnight()
    }
  }
}

// ── 发送消息 ──
async function sendMessage() {
  const text = inputText.value.trim()
  if (!text || isLoading.value) return

  inputText.value = ''
  resetTextareaHeight()

  userStore.incrementMessageCount()

  if (detectSleepKeywords(text) && stage.value !== 'goodnight') {
    userStore.triggerSleepMode()
  }

  await chat.sendMessage({ text })
  scrollToBottom()
}

// ── 快捷回复 ──
const quickPrompts = [
  '睡不着，脑子停不下来',
  '今天好累',
  '有点烦，不知道为啥',
  '就是想聊聊天',
]

function sendQuickPrompt(text: string) {
  inputText.value = text
  sendMessage()
}

// ── 开始新会话 ──
function startNewSession() {
  chat.messages = []
  userStore.resetSession()
  goodnightMessage.value = ''
  audioStore.stop()
  showBreathing.value = false
}

// ── 发送初始欢迎消息 ──
onMounted(() => {
  setTimeout(() => {
    const greeting = getNightGreeting(userStore.nickname)
    chat.sendMessage({ text: '__init__' })
    console.log('[NightFlow] init greeting:', greeting)
  }, 800)
})

// ── 监听晚安阶段，提取晚安语 ──
watch(() => stage.value, (newStage) => {
  if (newStage === 'goodnight') {
    const msgs = chat.messages
    const lastAiMsg = [...msgs].reverse().find(m => m.role === 'assistant')
    if (lastAiMsg) {
      goodnightMessage.value = getMessageText(lastAiMsg)
    }
  }
})

// ── 监听 stage 变化，自动处理 ──
watch(() => userStore.conversationStage, (newStage) => {
  if (newStage === 'sleep_preparing') {
    if (audioStore.isPlaying) audioStore.setVolume(0.2)
  }
  if (newStage === 'sleep_mode') {
    audioStore.setVolume(0.1)
  }
})

// ── 自动滚动 ──
function scrollToBottom() {
  nextTick(() => {
    messageListRef.value?.scrollTo({
      top: messageListRef.value.scrollHeight,
      behavior: 'smooth',
    })
  })
}

// ── textarea 自动高度 ──
function autoResize(e: Event) {
  const el = e.target as HTMLTextAreaElement
  el.style.height = 'auto'
  el.style.height = Math.min(el.scrollHeight, 128) + 'px'
}

function resetTextareaHeight() {
  if (inputRef.value) {
    inputRef.value.style.height = 'auto'
  }
}

// ── 计算属性 ──
const canSend = computed(() => {
  return inputText.value.trim().length > 0 && !isLoading.value && stage.value !== 'goodnight'
})

const containerClass = computed(() => {
  if (stage.value === 'sleep_mode') return 'opacity-95'
  return ''
})

const inputAreaClass = computed(() => {
  if (stage.value === 'sleep_mode') return 'opacity-40'
  if (stage.value === 'goodnight') return 'opacity-20 pointer-events-none'
  return 'opacity-100'
})

const inputPlaceholder = computed(() => {
  if (stage.value === 'sleep_mode') return '慢慢来...'
  if (stage.value === 'sleep_preparing') return '还有什么想说的吗...'
  return '说说今晚的事...'
})
</script>
