<template>
  <div class="flex flex-col items-center justify-center min-h-dvh relative z-10 px-6">
    <!-- 月亮 Logo -->
    <div class="animate-float mb-8">
      <div class="w-20 h-20 relative">
        <div class="w-20 h-20 rounded-full bg-gradient-to-br from-purple-mist/30 to-purple-dream/20 animate-breathe flex items-center justify-center border border-white/10">
          <span class="text-4xl">🌙</span>
        </div>
        <!-- 光晕 -->
        <div class="absolute inset-0 rounded-full bg-purple-soft/10 animate-breathe-slow scale-125" />
      </div>
    </div>

    <!-- 标语 -->
    <div class="text-center mb-12 animate-fade-in">
      <h1 class="text-3xl font-light text-white/90 mb-3 tracking-wide">
        NightFlow
      </h1>
      <p class="text-white/40 text-sm tracking-widest">
        睡不着的时候，我在这里
      </p>
    </div>

    <!-- 引导卡片 -->
    <div class="w-full max-w-sm glass-card p-6 animate-slide-up">
      <!-- Step 1: 输入昵称 -->
      <div v-if="step === 1">
        <p class="text-white/70 text-sm mb-1">怎么称呼你？</p>
        <p class="text-white/40 text-xs mb-5">可以不填，我就叫你「你」</p>
        <input
          v-model="nicknameInput"
          class="night-input w-full mb-5"
          placeholder="你的昵称（可选）"
          maxlength="10"
          @keyup.enter="nextStep"
        />
        <button
          class="w-full py-3 rounded-2xl bg-purple-soft/30 hover:bg-purple-soft/50 text-white/80 text-sm transition-all duration-300 border border-purple-soft/30"
          @click="nextStep"
        >
          继续
        </button>
      </div>

      <!-- Step 2: 设置提醒时间 -->
      <div v-else-if="step === 2">
        <p class="text-white/70 text-sm mb-1">什么时候提醒你休息？</p>
        <p class="text-white/40 text-xs mb-5">每天晚上，我会轻声提醒你</p>
        <div class="flex gap-3 mb-5">
          <button
            v-for="t in timeOptions"
            :key="t"
            class="flex-1 py-2 rounded-xl text-sm transition-all duration-200 border"
            :class="reminderTime === t
              ? 'bg-purple-soft/40 border-purple-soft/60 text-white'
              : 'bg-white/5 border-white/10 text-white/50 hover:bg-white/10'"
            @click="reminderTime = t"
          >
            {{ t }}
          </button>
        </div>
        <button
          class="w-full py-3 rounded-2xl bg-purple-soft/30 hover:bg-purple-soft/50 text-white/80 text-sm transition-all duration-300 border border-purple-soft/30"
          @click="nextStep"
        >
          好的
        </button>
        <button
          class="w-full mt-2 py-2 text-white/30 text-xs hover:text-white/50 transition-colors"
          @click="skipStep"
        >
          暂时跳过
        </button>
      </div>

      <!-- Step 3: 完成 -->
      <div v-else>
        <div class="text-center py-4">
          <div class="text-4xl mb-4 animate-breathe">🌙</div>
          <p class="text-white/70 text-sm leading-relaxed">
            {{ greeting }}
          </p>
          <p class="text-white/40 text-xs mt-3">
            随时都可以来找我聊天
          </p>
        </div>
        <button
          class="w-full mt-6 py-3 rounded-2xl bg-purple-soft/30 hover:bg-purple-soft/50 text-white/80 text-sm transition-all duration-300 border border-purple-soft/30"
          @click="complete"
        >
          开始今晚
        </button>
      </div>
    </div>

    <!-- 步骤指示器 -->
    <div class="flex gap-2 mt-8">
      <div
        v-for="i in 3"
        :key="i"
        class="w-1.5 h-1.5 rounded-full transition-all duration-300"
        :class="step >= i ? 'bg-purple-mist' : 'bg-white/20'"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'

const router = useRouter()
const userStore = useUserStore()

const step = ref(1)
const nicknameInput = ref('')
const reminderTime = ref('22:30')
const timeOptions = ['21:30', '22:00', '22:30', '23:00']

const greeting = computed(() => {
  const name = nicknameInput.value.trim() || '你'
  return `好的，${name}。\n\n以后睡前想说话的时候，可以来找我。`
})

function nextStep() {
  if (step.value < 3) {
    step.value++
  }
}

function skipStep() {
  step.value++
}

function complete() {
  const name = nicknameInput.value.trim()
  if (name) {
    userStore.setNickname(name)
  }
  localStorage.setItem('nightflow_reminder', reminderTime.value)
  userStore.completeOnboarding()
  router.push('/')
}
</script>
