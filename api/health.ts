// 健康检查接口 - 用于验证 API 路由是否正常工作
export const config = {
  runtime: 'edge',
}

export default function handler(_req: Request): Response {
  const hasApiKey = !!process.env.GEMINI_API_KEY

  return new Response(
    JSON.stringify({
      status: 'ok',
      timestamp: new Date().toISOString(),
      geminiKeySet: hasApiKey,
      message: hasApiKey
        ? 'API Key 已配置，接口应正常工作'
        : '⚠️ GEMINI_API_KEY 未设置，请在 Vercel 环境变量中添加',
    }),
    {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    }
  )
}
