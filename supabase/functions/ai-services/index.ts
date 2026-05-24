import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders, jsonResponse } from '../_shared/cors.ts'

type GenerationType = 'wish' | 'recommendation' | 'creator_metadata'

const dailyLimits: Record<GenerationType, number> = {
  wish: 20,
  recommendation: 40,
  creator_metadata: 15,
}

const tonePrompts: Record<string, string> = {
  birthday: 'Warm birthday wish with one vivid personal detail.',
  romantic: 'Romantic, sincere, respectful message.',
  funny: 'Light funny message, kind and family-safe.',
  emotional: 'Emotionally rich message without exaggeration.',
  professional: 'Polished professional celebration message.',
}

function sanitizeText(value: string) {
  return value
    .replace(/<[^>]*>/g, '')
    .replace(/[{}[\]<>]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 700)
}

function safeContext(input: Record<string, unknown>) {
  const allowed = ['occasion', 'tone', 'relationship', 'recipientAge', 'language', 'recipientName', 'templateName', 'templateSlug', 'description']
  return Object.fromEntries(Object.entries(input).filter(([key]) => allowed.includes(key)).map(([key, value]) => [key, String(value ?? '').slice(0, 120)]))
}

async function checkRateLimit(supabase: ReturnType<typeof createClient>, userId: string, generationType: GenerationType) {
  const now = new Date()
  const limit = dailyLimits[generationType]
  const { data } = await supabase
    .from('ai_rate_limits')
    .select('*')
    .eq('user_id', userId)
    .eq('generation_type', generationType)
    .maybeSingle()

  if (!data || new Date(data.reset_at).getTime() <= now.getTime()) {
    await supabase.from('ai_rate_limits').upsert({
      user_id: userId,
      generation_type: generationType,
      request_count: 1,
      reset_at: new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString(),
    }, { onConflict: 'user_id,generation_type' })
    return
  }

  if (data.request_count >= limit) throw new Error('AI daily limit reached. Please try again tomorrow.')

  await supabase
    .from('ai_rate_limits')
    .update({ request_count: data.request_count + 1 })
    .eq('id', data.id)
}

async function callOpenAI(prompt: string) {
  const apiKey = Deno.env.get('OPENAI_API_KEY')
  if (!apiKey) return null

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: Deno.env.get('OPENAI_MODEL') ?? 'gpt-4o-mini',
      messages: [
        { role: 'system', content: 'You write concise, safe, celebration-focused copy. Never include HTML, scripts, private data, or offensive content.' },
        { role: 'user', content: prompt },
      ],
      temperature: 0.8,
      max_tokens: 180,
    }),
  })

  if (!response.ok) return null
  const data = await response.json()
  return {
    text: String(data?.choices?.[0]?.message?.content ?? ''),
    model: String(data?.model ?? Deno.env.get('OPENAI_MODEL') ?? 'gpt-4o-mini'),
    tokens: Number(data?.usage?.total_tokens ?? 0),
  }
}

function fallbackWish(context: Record<string, string>) {
  const occasion = context.occasion || 'special day'
  const relationship = context.relationship || 'someone special'
  const language = context.language || 'English'
  const tone = context.tone || 'emotional'
  return sanitizeText(`For my ${relationship}, wishing you a ${tone} ${occasion} filled with joy, beautiful memories, and little moments that stay with you. May this day feel as wonderful as you make life feel for everyone around you. Language: ${language}.`)
}

async function logGeneration(supabase: ReturnType<typeof createClient>, input: {
  userId: string
  generationType: GenerationType
  context: Record<string, unknown>
  output?: string
  model?: string
  tokens?: number
  status: 'completed' | 'failed'
}) {
  await supabase.from('ai_generation_logs').insert({
    user_id: input.userId,
    generation_type: input.generationType,
    input_context: input.context,
    generated_output: input.output ?? null,
    model_name: input.model ?? null,
    token_usage: input.tokens ?? null,
    generation_status: input.status,
  })
}

async function track(supabase: ReturnType<typeof createClient>, eventName: string, userId: string, metadata: Record<string, unknown> = {}) {
  await supabase.from('analytics_events').insert({ event_name: eventName, user_id: userId, metadata })
}

serve(async (req) => {
  let adminClient: ReturnType<typeof createClient> | null = null
  let currentUserId: string | null = null
  let currentGenerationType: GenerationType | null = null
  try {
    if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
    if (req.method !== 'POST') return jsonResponse({ error: 'Method not allowed' }, { status: 405 })

    const authHeader = req.headers.get('Authorization') ?? ''
    const userClient = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_ANON_KEY')!, {
      global: { headers: { Authorization: authHeader } },
    })
    adminClient = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)
    const { data: userData, error: userError } = await userClient.auth.getUser()
    if (userError || !userData.user) return jsonResponse({ error: 'Unauthorized' }, { status: 401 })

    const userId = userData.user.id
    currentUserId = userId
    const body = await req.json()
    const action = String(body.action ?? '')

    if (action === 'generate_wish') {
      currentGenerationType = 'wish'
      const context = safeContext(body.context ?? {})
      await checkRateLimit(adminClient, userId, 'wish')
      await track(adminClient, 'ai_generation_requested', userId, { generation_type: 'wish' })

      const prompt = `${tonePrompts[context.tone] ?? tonePrompts.emotional} Occasion: ${context.occasion}. Relationship: ${context.relationship}. Recipient age: ${context.recipientAge}. Language: ${context.language}. Keep it under 70 words.`
      const ai = await callOpenAI(prompt)
      const output = sanitizeText(ai?.text || fallbackWish(context))
      await logGeneration(adminClient, { userId, generationType: 'wish', context, output, model: ai?.model ?? 'fallback', tokens: ai?.tokens ?? 0, status: 'completed' })
      await track(adminClient, 'ai_generation_completed', userId, { generation_type: 'wish', model: ai?.model ?? 'fallback' })
      return jsonResponse({ message: output, fallback: !ai })
    }

    if (action === 'recommend_templates') {
      currentGenerationType = 'recommendation'
      const context = safeContext(body.context ?? {})
      await checkRateLimit(adminClient, userId, 'recommendation')
      const { data: templates, error } = await adminClient
        .from('templates')
        .select('id, name, slug, occasion, tier, price_paise, thumbnail_url, has_animation, has_music, component_name, is_active')
        .eq('is_active', true)
        .eq('status', 'published')
        .limit(30)
      if (error) throw error

      const scored = (templates ?? []).map((template: any) => {
        const occasionMatch = context.occasion && template.occasion === context.occasion ? 40 : 0
        const toneBoost = context.tone === 'romantic' && ['wedding', 'anniversary'].includes(template.occasion) ? 20 : 0
        const musicBoost = ['emotional', 'romantic'].includes(context.tone) && template.has_music ? 10 : 0
        const score = 50 + occasionMatch + toneBoost + musicBoost + (template.price_paise > 0 ? 5 : 0)
        return { ...template, recommendation_score: score, recommendation_reason: sanitizeText(`${template.name} fits a ${context.tone || 'personal'} ${context.occasion || 'celebration'} wish.`) }
      }).sort((a, b) => b.recommendation_score - a.recommendation_score).slice(0, 3)

      for (const item of scored) {
        await adminClient.from('ai_template_recommendations').upsert({
          user_id: userId,
          template_id: item.id,
          recommendation_score: item.recommendation_score,
          recommendation_reason: item.recommendation_reason,
        }, { onConflict: 'user_id,template_id' })
      }
      await track(adminClient, 'template_recommendation_served', userId, { count: scored.length, occasion: context.occasion, tone: context.tone })
      return jsonResponse({ recommendations: scored })
    }

    if (action === 'creator_metadata') {
      currentGenerationType = 'creator_metadata'
      const context = safeContext(body.context ?? {})
      await checkRateLimit(adminClient, userId, 'creator_metadata')
      await track(adminClient, 'ai_generation_requested', userId, { generation_type: 'creator_metadata' })
      const prompt = `Suggest creator template metadata as plain text. Template: ${context.templateName}. Occasion: ${context.occasion}. Description: ${context.description}. Include one short description and 3 category tags.`
      const ai = await callOpenAI(prompt)
      const output = sanitizeText(ai?.text || `${context.templateName || 'This template'} is a polished ${context.occasion || 'celebration'} design for heartfelt digital wishes. Tags: ${context.occasion || 'celebration'}, premium, personal.`)
      await logGeneration(adminClient, { userId, generationType: 'creator_metadata', context, output, model: ai?.model ?? 'fallback', tokens: ai?.tokens ?? 0, status: 'completed' })
      await track(adminClient, 'ai_generation_completed', userId, { generation_type: 'creator_metadata', model: ai?.model ?? 'fallback' })
      return jsonResponse({ suggestion: output, fallback: !ai })
    }

    return jsonResponse({ error: 'Unsupported AI action' }, { status: 400 })
  } catch (error) {
    console.error('[ai-services] failed', error)
    if (adminClient && currentUserId && currentGenerationType) {
      await logGeneration(adminClient, {
        userId: currentUserId,
        generationType: currentGenerationType,
        context: { error: error instanceof Error ? error.message : 'AI service failed' },
        status: 'failed',
      })
      await track(adminClient, 'ai_generation_failed', currentUserId, { generation_type: currentGenerationType })
    }
    return jsonResponse({ error: error instanceof Error ? error.message : 'AI service failed safely' }, { status: 500 })
  }
})
