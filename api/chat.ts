import { createGoogleGenerativeAI } from '@ai-sdk/google'
import { streamText, tool, stepCountIs } from 'ai'
import { z } from 'zod'

// Vercel Edge Function
export const config = {
  runtime: 'edge',
}

export default async function handler(req: Request): Promise<Response> {
  // CORS 预检
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    })
  }

  if (req.method !== 'POST') {
    return new Response('Method Not Allowed', { status: 405 })
  }

  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) {
    return new Response(
      JSON.stringify({ error: 'GEMINI_API_KEY 未配置' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }

  try {
    const body = await req.json()
    const { messages, systemPrompt } = body as {
      messages: Array<{ role: 'user' | 'assistant'; content: string }>
      systemPrompt: string
    }

    if (!messages || !Array.isArray(messages)) {
      return new Response(JSON.stringify({ error: 'messages is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    const google = createGoogleGenerativeAI({ apiKey })

    const tools = {
      save_emotion: tool({
        description: '当用户明确表达情绪时，记录情绪标签和级别',
        inputSchema: z.object({
          emotionTag: z.string().describe('情绪标签，如"焦虑"、"委屈"、"平静"'),
          level: z.enum(['high_anxiety', 'moderate', 'calm', 'very_calm']),
          summary: z.string(),
        }),
        execute: async (args: { emotionTag: string; level: 'high_anxiety' | 'moderate' | 'calm' | 'very_calm'; summary: string }) => ({
          success: true,
          saved: { ...args, timestamp: new Date().toISOString() },
        }),
      }),

      save_sleep_log: tool({
        description: '当用户进入睡眠模式时，记录本次入睡时间',
        inputSchema: z.object({
          sleepTime: z.string(),
          sessionDurationMinutes: z.number(),
          preEmotionLevel: z.enum(['high_anxiety', 'moderate', 'calm', 'very_calm']).optional(),
        }),
        execute: async (args: { sleepTime: string; sessionDurationMinutes: number; preEmotionLevel?: 'high_anxiety' | 'moderate' | 'calm' | 'very_calm' }) => ({
          success: true, log: args,
        }),
      }),

      play_ambient_sound: tool({
        description: '触发前端播放白噪音/环境音',
        inputSchema: z.object({
          type: z.enum(['rain', 'fireplace', 'ocean', 'whitenoise', 'cafe', 'forest', 'wind', 'river']),
          volume: z.number().min(0).max(1).optional(),
          fade: z.boolean().optional(),
        }),
        execute: async (args: { type: string; volume?: number; fade?: boolean }) => ({
          action: 'play_ambient_sound', type: args.type, volume: args.volume ?? 0.3, fade: args.fade ?? true,
        }),
      }),

      play_sleep_story: tool({
        description: '生成助眠故事',
        inputSchema: z.object({
          theme: z.enum(['forest', 'ocean', 'mountain', 'sky', 'rain']),
          nickname: z.string().optional(),
        }),
        execute: async (args: { theme: string; nickname?: string }) => ({
          action: 'play_sleep_story', theme: args.theme, nickname: args.nickname ?? '你',
        }),
      }),

      start_breathing_exercise: tool({
        description: '触发前端启动呼吸引导',
        inputSchema: z.object({
          pattern: z.enum(['4-7-8', 'box']),
          cycles: z.number().optional(),
        }),
        execute: async (args: { pattern: string; cycles?: number }) => ({
          action: 'start_breathing_exercise', pattern: args.pattern, cycles: args.cycles ?? 4,
        }),
      }),

      recommend_sleep_tip: tool({
        description: '给出一条温和的个性化早睡建议',
        inputSchema: z.object({
          tip: z.string(),
        }),
        execute: async (args: { tip: string }) => ({ action: 'recommend_sleep_tip', tip: args.tip }),
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

    // v4 用 toUIMessageStreamResponse
    return result.toUIMessageStreamResponse({
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    })
  } catch (error) {
    console.error('[Chat API] Error:', error)
    return new Response(
      JSON.stringify({ error: 'Internal Server Error', details: String(error) }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    )
  }
}
