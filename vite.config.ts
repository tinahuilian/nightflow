import { defineConfig, loadEnv } from 'vite'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'path'
import type { Plugin, ViteDevServer } from 'vite'

// ── 内联 API 处理插件（开发环境直接处理 /api 请求，无需 vercel dev）──
function apiPlugin(): Plugin {
  return {
    name: 'vite-plugin-api',
    configureServer(server: ViteDevServer) {
      server.middlewares.use('/api/chat', async (req, res) => {
        // 动态导入避免循环依赖
        const { createGoogleGenerativeAI } = await import('@ai-sdk/google')
        const { streamText, tool } = await import('ai')
        const { z } = await import('zod')

        if (req.method === 'OPTIONS') {
          res.writeHead(204, {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type',
          })
          res.end()
          return
        }

        if (req.method !== 'POST') {
          res.writeHead(405)
          res.end('Method Not Allowed')
          return
        }

        try {
          // 读取请求体
          const chunks: Buffer[] = []
          for await (const chunk of req) {
            chunks.push(chunk as Buffer)
          }
          const body = JSON.parse(Buffer.concat(chunks).toString())
          const { messages, systemPrompt } = body

          const apiKey = process.env.GEMINI_API_KEY
          if (!apiKey) {
            res.writeHead(500, { 'Content-Type': 'application/json' })
            res.end(JSON.stringify({ error: 'GEMINI_API_KEY 未配置，请在 .env.local 中添加' }))
            return
          }

          const google = createGoogleGenerativeAI({ apiKey })

          const tools = {
            save_emotion: tool({
              description: '当用户明确表达情绪时，记录情绪标签和级别',
              inputSchema: z.object({
                emotionTag: z.string(),
                level: z.enum(['high_anxiety', 'moderate', 'calm', 'very_calm']),
                summary: z.string(),
              }),
              execute: async (args) => ({ success: true, saved: { ...args, timestamp: new Date().toISOString() } }),
            }),
            save_sleep_log: tool({
              description: '当用户进入睡眠模式时，记录本次入睡时间',
              inputSchema: z.object({
                sleepTime: z.string(),
                sessionDurationMinutes: z.number(),
                preEmotionLevel: z.enum(['high_anxiety', 'moderate', 'calm', 'very_calm']).optional(),
              }),
              execute: async (args) => ({ success: true, log: args }),
            }),
            play_ambient_sound: tool({
              description: '触发前端播放白噪音/环境音',
              inputSchema: z.object({
                type: z.enum(['rain', 'fireplace', 'ocean', 'whitenoise', 'cafe', 'forest', 'wind', 'river']),
                volume: z.number().min(0).max(1).optional(),
                fade: z.boolean().optional(),
              }),
              execute: async (a: any) => { const { type, volume, fade } = a; return => ({
                action: 'play_ambient_sound', type, volume: volume ?? 0.3, fade: fade ?? true,
              }),
            }),
            play_sleep_story: tool({
              description: '生成助眠故事',
              inputSchema: z.object({
                theme: z.enum(['forest', 'ocean', 'mountain', 'sky', 'rain']),
                nickname: z.string().optional(),
              }),
              execute: async (a: any) => { const { theme, nickname } = a; return => ({
                action: 'play_sleep_story', theme, nickname: nickname || '你',
              }),
            }),
            start_breathing_exercise: tool({
              description: '触发前端启动呼吸引导动效',
              inputSchema: z.object({
                pattern: z.enum(['4-7-8', 'box']),
                cycles: z.number().optional(),
              }),
              execute: async (a: any) => { const { pattern, cycles } = a; return => ({
                action: 'start_breathing_exercise', pattern, cycles: cycles ?? 4,
              }),
            }),
          }

          const result = streamText({
            model: google('gemini-1.5-flash'),
            system: systemPrompt,
            messages,
            tools,
            stopWhen: stepCountIs(5),
            temperature: 0.85,
            maxOutputTokens: 512,
          })

          // 转换 Web API Response 到 Node.js http.ServerResponse
          const webResponse = result.toUIMessageStreamResponse({
            headers: { 'Access-Control-Allow-Origin': '*' },
          })

          res.writeHead(webResponse.status, Object.fromEntries(webResponse.headers.entries()))
          const reader = webResponse.body!.getReader()
          while (true) {
            const { done, value } = await reader.read()
            if (done) break
            res.write(value)
          }
          res.end()
        } catch (error) {
          console.error('[API] /api/chat error:', error)
          if (!res.headersSent) {
            res.writeHead(500, { 'Content-Type': 'application/json' })
            res.end(JSON.stringify({ error: String(error) }))
          }
        }
      })

      server.middlewares.use('/api/health', (_req, res) => {
        res.writeHead(200, { 'Content-Type': 'application/json' })
        res.end(JSON.stringify({
          status: 'ok',
          geminiKeySet: !!process.env.GEMINI_API_KEY,
        }))
      })
    },
  }
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  process.env.GEMINI_API_KEY = env.GEMINI_API_KEY

  return {
    plugins: [vue(), apiPlugin()],
    resolve: {
      alias: {
        '@': resolve(__dirname, 'src'),
      },
    },
    server: {
      port: 5173,
    },
  }
})
