import { createGoogleGenerativeAI } from '@ai-sdk/google'
import { streamText, tool } from 'ai'
import { z } from 'zod'

// Vercel Serverless Function / Node.js 开发服务器兼容
export const runtime = 'edge'

const google = createGoogleGenerativeAI({
  apiKey: process.env.GEMINI_API_KEY ?? '',
})

export default async function handler(req: Request): Promise<Response> {
  if (req.method !== 'POST') {
    return new Response('Method Not Allowed', { status: 405 })
  }

  try {
    const body = await req.json()
    const {
      messages,
      systemPrompt,
      stage,
      userProfile,
    } = body as {
      messages: Array<{ role: 'user' | 'assistant'; content: string }>
      systemPrompt: string
      stage: string
      userProfile?: { nickname: string }
    }

    if (!messages || !Array.isArray(messages)) {
      return new Response(JSON.stringify({ error: 'messages is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    // ── 工具定义 ──
    const tools = {
      // 记录情绪
      save_emotion: tool({
        description: '当用户明确表达情绪时，记录情绪标签和级别。触发时机：用户说出明显的情绪词汇',
        parameters: z.object({
          emotionTag: z.string().describe('情绪标签，如"焦虑"、"委屈"、"平静"'),
          level: z.enum(['high_anxiety', 'moderate', 'calm', 'very_calm']).describe('情绪级别'),
          summary: z.string().describe('用一句话概括用户表达的内容（不存储原文）'),
        }),
        execute: async ({ emotionTag, level, summary }) => {
          // V1：返回前端可处理的结果，不调用数据库
          console.log('[Tool] save_emotion:', { emotionTag, level, summary })
          return {
            success: true,
            saved: { emotionTag, level, summary, timestamp: new Date().toISOString() },
          }
        },
      }),

      // 记录入睡时间
      save_sleep_log: tool({
        description: '当用户进入睡眠模式时，记录本次入睡时间',
        parameters: z.object({
          sleepTime: z.string().describe('入睡时间 ISO 字符串'),
          sessionDurationMinutes: z.number().describe('本次会话持续时长（分钟）'),
          preEmotionLevel: z.enum(['high_anxiety', 'moderate', 'calm', 'very_calm']).optional(),
        }),
        execute: async ({ sleepTime, sessionDurationMinutes, preEmotionLevel }) => {
          console.log('[Tool] save_sleep_log:', { sleepTime, sessionDurationMinutes, preEmotionLevel })
          return {
            success: true,
            log: { sleepTime, sessionDurationMinutes, preEmotionLevel },
          }
        },
      }),

      // 播放环境音（前端执行）
      play_ambient_sound: tool({
        description: '触发前端播放白噪音/环境音。在用户情绪开始平缓，或进入睡眠准备阶段时调用',
        parameters: z.object({
          type: z.enum(['rain', 'fireplace', 'ocean', 'whitenoise', 'cafe', 'forest', 'wind', 'river'])
            .describe('环境音类型'),
          volume: z.number().min(0).max(1).optional().describe('音量 0~1，默认 0.3'),
          fade: z.boolean().optional().describe('是否渐入'),
        }),
        execute: async ({ type, volume, fade }) => {
          // 这个工具在前端执行，后端只返回指令
          return {
            action: 'play_ambient_sound',
            type,
            volume: volume ?? 0.3,
            fade: fade ?? true,
          }
        },
      }),

      // 播放助眠故事（V1 文字版）
      play_sleep_story: tool({
        description: '生成并以极慢速度流式输出一段个性化助眠故事（200~400字）。用于情绪平稳、准备入睡时',
        parameters: z.object({
          theme: z.enum(['forest', 'ocean', 'mountain', 'sky', 'rain'])
            .describe('故事主题'),
          nickname: z.string().optional().describe('用户昵称，用于个性化'),
        }),
        execute: async ({ theme, nickname }) => {
          const name = nickname || '你'
          const storyPrompts: Record<string, string> = {
            forest: `请生成一段 200~300 字的助眠故事。主题是：一个人走进一片安静的森林，感受到树叶的气息、远处流水声、脚下松软的地面。用极慢、极轻柔的笔触描写，帮助读者放松入睡。称呼读者为「${name}」，在故事最开始温柔地引入。语言简单、画面感强，禁止出现任何冲突和紧张情节。`,
            ocean: `请生成一段 200~300 字的助眠故事。主题是：${name}躺在一艘小船上，漂浮在平静的海面，感受到阵阵微风和潮水的节律。语言轻柔、节奏缓慢，帮助进入睡眠状态。`,
            mountain: `请生成一段 200~300 字的助眠故事。主题是：一个山顶小屋，${name}裹着毯子，望着窗外深蓝色的夜空和远处山峦的轮廓。极度平和的氛围，帮助深度放松。`,
            sky: `请生成一段 200~300 字的助眠故事。主题是：${name}漂浮在柔软的云朵上，云朵缓缓飘动，下方是宁静的城市夜景。像做一个美梦一样的叙述。`,
            rain: `请生成一段 200~300 字的助眠故事。主题是：${name}躺在温暖的房间里，窗外下着细雨，雨声轻轻敲打着玻璃，室内有一盏昏黄的灯。极度治愈的氛围。`,
          }

          // 这里返回故事生成指令，AI 会根据 tool result 生成故事内容
          return {
            action: 'play_sleep_story',
            theme,
            storyPrompt: storyPrompts[theme],
            instruction: '请现在按照 storyPrompt 的要求，生成助眠故事内容，以极慢的节奏（每字间隔感很强）输出给用户',
          }
        },
      }),

      // 呼吸引导（前端执行动效）
      start_breathing_exercise: tool({
        description: '触发前端启动呼吸引导动效。在用户高度焦虑或需要身体放松时调用',
        parameters: z.object({
          pattern: z.enum(['4-7-8', 'box']).describe('呼吸模式：4-7-8（快速镇静）或 box（方形呼吸）'),
          cycles: z.number().optional().describe('循环次数，默认 4 次'),
        }),
        execute: async ({ pattern, cycles }) => {
          return {
            action: 'start_breathing_exercise',
            pattern,
            cycles: cycles ?? 4,
          }
        },
      }),

      // 推荐睡眠建议（轻量工具）
      recommend_sleep_tip: tool({
        description: '基于用户近期情绪趋势，给出一条温和的个性化早睡建议',
        parameters: z.object({
          tip: z.string().describe('建议内容，温和口吻，不超过 30 字'),
        }),
        execute: async ({ tip }) => {
          return {
            action: 'recommend_sleep_tip',
            tip,
          }
        },
      }),
    }

    // ── 流式输出 ──
    const result = streamText({
      model: google('gemini-1.5-flash'),
      system: systemPrompt,
      messages,
      tools,
      maxSteps: 5,
      temperature: 0.85,
      maxTokens: 512,
      onError: (error) => {
        console.error('[Chat API] streamText error:', error)
      },
    })

    return result.toDataStreamResponse({
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
