import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders, jsonResponse } from '../_shared/cors.ts'

type GenerationType = 'wish' | 'creator_metadata'

const dailyLimits: Record<GenerationType, number> = {
  wish: 20,
  creator_metadata: 15,
}

const tonePrompts: Record<string, string> = {
  birthday: 'Warm birthday wish with one vivid personal detail.',
  romantic: 'Romantic, sincere, respectful message.',
  funny: 'Light funny message, kind and family-safe.',
  emotional: 'Emotionally rich message without exaggeration.',
  professional: 'Polished professional celebration message.',
}

function sanitizeText(value: unknown): string {
  const str = typeof value === 'string' ? value : String(value ?? '')
  return str
    .replace(/<[^>]*>/g, '')
    .replace(/[{}[\]<>]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 700)
}

function safeContext(input: Record<string, unknown>) {
  const allowed = ['occasion', 'tone', 'relationship', 'recipientAge', 'language', 'recipientName', 'templateName', 'templateSlug', 'description']
  return Object.fromEntries(
    Object.entries(input)
      .filter(([key]) => allowed.includes(key))
      .map(([key, value]) => [key, String(value ?? '').slice(0, 120)])
  )
}

async function checkRateLimit(supabase: any, userId: string, generationType: GenerationType) {
  const now = new Date()
  const limit = dailyLimits[generationType]
  const { data, error: selectError } = await supabase
    .from('ai_rate_limits')
    .select('*')
    .eq('user_id', userId)
    .eq('generation_type', generationType)
    .maybeSingle()

  if (selectError) {
    throw new Error(`Database error while checking rate limits: ${selectError.message}`)
  }

  const currentCount = Number(data?.request_count ?? 0)

  if (!data || new Date(data.reset_at).getTime() <= now.getTime()) {
    const { error: upsertError } = await supabase.from('ai_rate_limits').upsert({
      user_id: userId,
      generation_type: generationType,
      request_count: 1,
      reset_at: new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString(),
    }, { onConflict: 'user_id,generation_type' })

    if (upsertError) {
      throw new Error(`Database error while initializing rate limits: ${upsertError.message}`)
    }
    return
  }

  if (currentCount >= limit) {
    throw new Error('AI daily limit reached. Please try again tomorrow.')
  }

  const { error: updateError } = await supabase
    .from('ai_rate_limits')
    .update({ request_count: currentCount + 1 })
    .eq('id', data.id)

  if (updateError) {
    throw new Error(`Database error while updating rate limits: ${updateError.message}`)
  }
}

async function callOpenAI(prompt: string) {
  const apiKey = Deno.env.get('OPENAI_API_KEY')
  if (!apiKey) {
    console.warn('[ai-services] OPENAI_API_KEY is not set in the environment')
    return null
  }

  try {
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

    if (!response.ok) {
      const errorText = await response.text().catch(() => 'No details')
      console.error(`[ai-services] OpenAI API request failed with status ${response.status}: ${errorText}`)
      return null
    }

    const data = await response.json()
    return {
      text: String(data?.choices?.[0]?.message?.content ?? ''),
      model: String(data?.model ?? Deno.env.get('OPENAI_MODEL') ?? 'gpt-4o-mini'),
      tokens: Number(data?.usage?.total_tokens ?? 0),
    }
  } catch (err) {
    console.error('[ai-services] Error communicating with OpenAI:', err)
    return null
  }
}

function fallbackWish(context: Record<string, string>) {
  const occasion = context.occasion || 'special day'
  const relationship = context.relationship || 'someone special'
  const tone = context.tone || 'emotional'
  return sanitizeText(`For my ${relationship}, wishing you a ${tone} ${occasion} filled with joy, beautiful memories, and little moments that stay with you. May this day feel as wonderful as you make life feel for everyone around you.`)
}

async function logGeneration(supabase: any, input: {
  userId: string
  generationType: GenerationType
  context: Record<string, unknown>
  output?: string
  model?: string
  tokens?: number
  status: 'completed' | 'failed'
}) {
  const { error } = await supabase.from('ai_generation_logs').insert({
    user_id: input.userId,
    generation_type: input.generationType,
    input_context: input.context,
    generated_output: input.output ?? null,
    model_name: input.model ?? null,
    token_usage: input.tokens ?? null,
    generation_status: input.status,
  })

  if (error) {
    console.error('[ai-services] Failed to write to ai_generation_logs:', error)
  }
}

async function track(supabase: any, eventName: string, userId: string, metadata: Record<string, unknown> = {}) {
  const { error } = await supabase.from('analytics_events').insert({ event_name: eventName, user_id: userId, metadata })
  if (error) {
    console.error('[ai-services] Failed to write to analytics_events:', error)
  }
}

serve(async (req) => {
  let adminClient: any = null
  let currentUserId: string | null = null
  let currentGenerationType: GenerationType | null = null
  let currentContext: Record<string, unknown> = {}

  try {
    if (req.method === 'OPTIONS') {
      return new Response('ok', { status: 200, headers: corsHeaders })
    }
    if (req.method !== 'POST') {
      return jsonResponse({ error: 'Method not allowed' }, { status: 405 })
    }

    // Validate environment variables first
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

    if (!supabaseUrl || !supabaseAnonKey || !supabaseServiceKey) {
      return jsonResponse(
        { error: 'Server configuration error: missing Supabase environment variables' },
        { status: 500 }
      )
    }

    const authHeader = req.headers.get('Authorization') ?? ''
    const userClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    })
    adminClient = createClient(supabaseUrl, supabaseServiceKey)

    const { data: userData, error: userError } = await userClient.auth.getUser()
    if (userError || !userData?.user) {
      return jsonResponse({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = userData.user.id
    currentUserId = userId

    // Safely parse JSON body
    let body: any
    try {
      body = await req.json()
    } catch {
      return jsonResponse({ error: 'Malformed JSON payload' }, { status: 400 })
    }

    if (!body || typeof body !== 'object') {
      return jsonResponse({ error: 'Invalid payload: request body must be a JSON object' }, { status: 400 })
    }

    const action = String(body.action ?? '')

    if (action === 'generate_wish') {
      currentGenerationType = 'wish'
      const context = safeContext(body.context ?? {})
      currentContext = context
      await checkRateLimit(adminClient, userId, 'wish')
      await track(adminClient, 'ai_generation_requested', userId, { generation_type: 'wish' })

      // Build the prompt parts dynamically to avoid formatting issues
      const promptParts = []
      const tonePromptText = tonePrompts[context.tone] ?? tonePrompts.emotional
      promptParts.push(tonePromptText)
      if (context.occasion) promptParts.push(`Occasion: ${context.occasion}.`)
      if (context.relationship) promptParts.push(`Relationship: ${context.relationship}.`)
      if (context.recipientAge) promptParts.push(`Recipient age: ${context.recipientAge}.`)
      if (context.language) promptParts.push(`Language: ${context.language}.`)
      promptParts.push('Keep it under 70 words.')
      const prompt = promptParts.join(' ')

      const ai = await callOpenAI(prompt)
      const output = sanitizeText(ai?.text || fallbackWish(context))
      await logGeneration(adminClient, {
        userId,
        generationType: 'wish',
        context,
        output,
        model: ai?.model ?? 'fallback',
        tokens: ai?.tokens ?? 0,
        status: 'completed',
      })
      await track(adminClient, 'ai_generation_completed', userId, { generation_type: 'wish', model: ai?.model ?? 'fallback' })
      return jsonResponse({ message: output, fallback: !ai })
    }

    if (action === 'creator_metadata') {
      currentGenerationType = 'creator_metadata'
      const context = safeContext(body.context ?? {})
      currentContext = context
      await checkRateLimit(adminClient, userId, 'creator_metadata')
      await track(adminClient, 'ai_generation_requested', userId, { generation_type: 'creator_metadata' })

      const promptParts = []
      promptParts.push('Suggest creator template metadata as plain text.')
      if (context.templateName) promptParts.push(`Template: ${context.templateName}.`)
      if (context.occasion) promptParts.push(`Occasion: ${context.occasion}.`)
      if (context.description) promptParts.push(`Description: ${context.description}.`)
      promptParts.push('Include one short description and 3 category tags.')
      const prompt = promptParts.join(' ')

      const ai = await callOpenAI(prompt)
      const output = sanitizeText(
        ai?.text ||
        `${context.templateName || 'This template'} is a polished ${context.occasion || 'celebration'} design for heartfelt digital wishes. Tags: ${context.occasion || 'celebration'}, premium, personal.`
      )
      await logGeneration(adminClient, {
        userId,
        generationType: 'creator_metadata',
        context,
        output,
        model: ai?.model ?? 'fallback',
        tokens: ai?.tokens ?? 0,
        status: 'completed',
      })
      await track(adminClient, 'ai_generation_completed', userId, { generation_type: 'creator_metadata', model: ai?.model ?? 'fallback' })
      return jsonResponse({ suggestion: output, fallback: !ai })
    }

    return jsonResponse({ error: 'Unsupported AI action' }, { status: 400 })
  } catch (error) {
    console.error('[ai-services] failed', error)
    if (adminClient && currentUserId && currentGenerationType) {
      try {
        const errorMsg = error instanceof Error ? error.message : 'AI service failed'
        await logGeneration(adminClient, {
          userId: currentUserId,
          generationType: currentGenerationType,
          context: {
            ...currentContext,
            error: errorMsg,
          },
          status: 'failed',
        })
        await track(adminClient, 'ai_generation_failed', currentUserId, { generation_type: currentGenerationType })
      } catch (logDbError) {
        console.error('[ai-services] failed to log failure to DB', logDbError)
      }
    }
    return jsonResponse({ error: error instanceof Error ? error.message : 'AI service failed safely' }, { status: 500 })
  }
})
