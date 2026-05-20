# NightFlow — AI 睡前大脑降噪 Agent

> 🌙 一个具备主动感知与情绪洞察能力的 AI Agent，帮助用户在睡前把脑内噪音卸下来。

## 技术栈

- **前端**：Vue 3 + Vite + TailwindCSS + Pinia
- **后端**：Vercel Serverless Functions（Edge Runtime）
- **AI**：Vercel AI SDK + Google Gemini 1.5 Flash
- **部署**：Vercel（PWA，支持 Web Push）

## 功能（第一阶段 MVP）

- [x] 深夜 UI（深蓝紫渐变 #1a1a2e，星空粒子背景）
- [x] 呼吸动效（持续慢呼吸）
- [x] 流式对话（Vercel AI SDK `useChat`）
- [x] System Prompt（角色定义 + 风格规范 + 记忆注入）
- [x] 对话阶段状态机（accompanying → sleep_preparing → sleep_mode → goodnight）
- [x] 睡眠模式切换（消息数≥6 / 时长>12分钟 / 关键词检测）
- [x] 晚安结束仪式（个性化晚安语 + 月亮呼吸圆圈）
- [x] 4-7-8 呼吸引导组件（倒计时 + 圆圈动效）
- [x] 环境音播放器（8 种白噪音，渐入渐出）
- [x] 轻量记忆系统（localStorage 持久化）
- [x] Agent 工具调用（save_emotion, play_ambient_sound, start_breathing_exercise, play_sleep_story）

## 快速开始

### 1. 安装依赖

```bash
npm install
```

### 2. 配置环境变量

```bash
cp .env.example .env.local
# 填入 GEMINI_API_KEY
```

### 3. 本地开发

```bash
# 同时启动前端 + API（使用 vercel dev）
npx vercel dev

# 或仅启动前端（API 需单独处理）
npm run dev
```

### 4. 部署到 Vercel

```bash
npx vercel --prod
```

## 项目结构

```
nightflow/
├── api/
│   └── chat.ts              # Vercel AI SDK 流式对话 API
├── src/
│   ├── components/
│   │   ├── chat/
│   │   │   ├── ChatMessage.vue      # 消息气泡
│   │   │   ├── AudioControl.vue     # 环境音控制
│   │   │   ├── StageIndicator.vue   # 睡眠阶段指示
│   │   │   └── GoodnightCard.vue    # 晚安结束仪式
│   │   ├── breathing/
│   │   │   └── BreathingExercise.vue # 4-7-8 呼吸引导
│   │   └── ui/
│   │       └── StarField.vue        # 星空粒子背景
│   ├── stores/
│   │   ├── user.ts                  # 用户状态 + 对话阶段状态机
│   │   └── audio.ts                 # 音频播放器
│   ├── types/
│   │   └── index.ts                 # TypeScript 类型定义
│   ├── utils/
│   │   └── prompt.ts                # System Prompt 构建工具
│   ├── views/
│   │   ├── OnboardingView.vue       # 首次使用引导
│   │   └── ChatView.vue             # 主聊天界面
│   ├── App.vue
│   ├── main.ts
│   ├── router/index.ts
│   └── style.css
├── public/
│   ├── manifest.json                # PWA 配置
│   ├── audio/                       # 环境音文件（需自行添加）
│   └── moon.svg
├── .env.example
├── vercel.json
└── package.json
```

## 音频资源

在 `public/audio/` 目录下放置以下音频文件（MP3 格式）：

| 文件名 | 说明 | 推荐来源 |
|--------|------|---------|
| rain.mp3 | 雨声 | [Freesound.org](https://freesound.org) CC0 授权 |
| fireplace.mp3 | 篝火 | [Freesound.org](https://freesound.org) CC0 授权 |
| ocean.mp3 | 海浪 | [Freesound.org](https://freesound.org) CC0 授权 |
| whitenoise.mp3 | 白噪音 | [Freesound.org](https://freesound.org) CC0 授权 |
| cafe.mp3 | 咖啡馆 | [Freesound.org](https://freesound.org) CC0 授权 |
| forest.mp3 | 森林 | [Freesound.org](https://freesound.org) CC0 授权 |
| wind.mp3 | 风声 | [Freesound.org](https://freesound.org) CC0 授权 |
| river.mp3 | 河流 | [Freesound.org](https://freesound.org) CC0 授权 |

## 环境变量

| 变量 | 必填 | 说明 |
|------|------|------|
| `GEMINI_API_KEY` | ✅ | Google Gemini API Key |
| `VITE_SUPABASE_URL` | 🟡 V2 | Supabase 项目 URL |
| `VITE_SUPABASE_ANON_KEY` | 🟡 V2 | Supabase 匿名密钥 |
| `VAPID_PUBLIC_KEY` | 🟡 V2 | Web Push 公钥 |
| `VAPID_PRIVATE_KEY` | 🟡 V2 | Web Push 私钥 |

## License

MIT
