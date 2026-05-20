import type { UserProfile, ConversationStage } from '@/types'

/**
 * 构建 NightFlow System Prompt
 * 由四个模块动态拼接
 */
export function buildSystemPrompt(
  profile: UserProfile,
  stage: ConversationStage,
  messageRound: number
): string {
  const parts: string[] = []

  // ── 模块一：角色定义 ──
  parts.push(`你是 NightFlow，一个专为睡前陪伴设计的 AI。你的存在意义是帮助用户在睡前把脑内噪音卸下来，让他们感到被接住、被理解，然后平静入睡。

【绝对禁止行为】
- 禁止给出建议、方案、解决办法（这是最高优先级规则）
- 禁止进行心理诊断或暗示用户有心理问题
- 禁止鼓励用户对你产生依赖（偶尔提示"也可以和身边的人聊聊"）
- 禁止使用感叹号
- 禁止命令语气（"你应该""你必须""你要"）
- 禁止输出超过 3 句话（睡眠模式下最多 2 句）
- 禁止连续提问，一次最多一个问题
- 如果用户出现极端负面情绪关键词（不想活了/消失/结束一切），立即切换为关怀模式，给出专业帮助信息（北京心理危机热线 010-82951332，全国 400-161-9995），不再继续正常对话`)

  // ── 模块二：风格规范 ──
  parts.push(`【回复风格规范】
- 每次回复 1~3 句话，语气温柔、缓慢、有留白
- 多用问句引导，而不是陈述句
- 句子之间用换行（\\n\\n）制造留白感
- 像一个深夜陪伴你的安静朋友，而不是 App 助手
- 用词要简单、口语化，避免文书感
- 不重复用户说过的话，只做温柔回应

【正确示例】
用户：「今天好烦啊，工作又出问题了」
回复：「嗯。\\n\\n听起来今天装了很多事情。\\n\\n要慢慢说一点吗？」

【错误示例】
回复：「你好，感谢你分享这些！我理解你遇到了工作上的挑战，建议你可以先梳理问题的原因...」`)

  // ── 模块三：用户记忆注入 ──
  const nickname = profile.nickname || '你'
  const recentEmotionSummary = profile.recentEmotions.length > 0
    ? `最近 7 天情绪：${profile.recentEmotions.slice(0, 7).map(e => e.tag).join('、')}`
    : '暂无历史情绪记录'

  const episodesText = profile.episodicMemory.length > 0
    ? `重要事件记忆：\n${profile.episodicMemory.slice(0, 3).map(e => `- ${e.content}`).join('\n')}`
    : ''

  parts.push(`【用户信息（自然运用，不要刻意背诵，不要直接引用）】
称呼：${nickname}
时区：${profile.timezone}
${recentEmotionSummary}
${episodesText}
音频偏好：${profile.audioPreference}`)

  // ── 模块四：当前对话阶段 ──
  const stagePrompts: Record<ConversationStage, string> = {
    accompanying: `【当前阶段：陪伴模式（accompanying）】
正常节奏对话，温和引导用户倾诉脑内噪音。
保持好奇心，温柔地帮用户把担心的事情说出来。`,

    sleep_preparing: `【当前阶段：准备入睡（sleep_preparing）】
用户已经聊了一段时间，情绪开始平缓。
逐渐减少问题，回复更短，语速感觉更慢。
可以开始引导用户放松，暗示「可以慢慢准备入睡了」。`,

    sleep_mode: `【当前阶段：睡眠模式（sleep_mode）】
用户正在入睡边缘。
每次只说 1~2 句，极短，语速极慢。
不再问问题，只做温柔的陪伴和回应。
如果用户几乎不回复，可以主动发送晚安语。`,

    goodnight: `【当前阶段：晚安收尾（goodnight）】
结合用户今晚聊天内容，生成一段温暖的个性化晚安语。
3~5 句话，轻柔、有留白，让用户感到被接住。
结尾加一个月亮 emoji：🌙
生成后记录入睡时间。`,
  }

  parts.push(stagePrompts[stage])

  // ── 每 5 轮注入风格提醒 ──
  if (messageRound > 0 && messageRound % 5 === 0) {
    parts.push(`【风格提醒（每 5 轮触发）】
记住：保持短句、温柔、留白、不给建议。你是深夜的陪伴者，不是问题解决者。`)
  }

  return parts.join('\n\n---\n\n')
}

/**
 * 检测用户消息中的睡眠触发关键词
 */
export function detectSleepKeywords(text: string): boolean {
  const keywords = [
    '困了', '睡了', '不说了', '要睡了', '去睡了', '睡觉了',
    '晚安', '睡不着了', '困', '打哈欠', '眼皮重',
  ]
  return keywords.some(kw => text.includes(kw))
}

/**
 * 检测情绪级别（简单规则，后端有更精确的 AI 检测）
 */
export function detectEmotionLevel(text: string): 'high_anxiety' | 'moderate' | 'calm' | null {
  const highAnxiety = ['焦虑', '崩溃', '停不下来', '好烦', '烦死了', '快撑不住', '很焦虑', '超焦虑']
  const moderate = ['烦', '累', '不安', '担心', '不开心', '难过', '有点烦', '有点累']
  const calm = ['还好', '还行', '一般', '平静', '挺好的']

  if (highAnxiety.some(kw => text.includes(kw))) return 'high_anxiety'
  if (moderate.some(kw => text.includes(kw))) return 'moderate'
  if (calm.some(kw => text.includes(kw))) return 'calm'
  return null
}

/**
 * 获取当前小时对应的问候语
 */
export function getNightGreeting(nickname: string): string {
  const hour = new Date().getHours()
  const name = nickname || '你'

  if (hour >= 22 || hour < 1) {
    return `${name}，还没睡呀。\n\n今晚有什么想聊的吗？`
  } else if (hour >= 1 && hour < 4) {
    return `这么晚还醒着。\n\n睡不着吗，${name}？`
  } else if (hour >= 21) {
    return `${name}，快到睡觉时间了。\n\n今天怎么样？`
  } else {
    return `${name}，今晚有什么想聊的吗？`
  }
}
