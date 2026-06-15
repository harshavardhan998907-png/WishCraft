import { createAnonServerClient, createAuthedServerClient, jsonResponse } from '../../_lib/supabase'

type CreatorLoginBody = {
  email?: string
  password?: string
}

type ProfileRole = 'user' | 'admin' | 'moderator' | 'creator'
type ProfileRow = {
  role: string | null
}

function isCreatorRole(role: string | null | undefined): role is Exclude<ProfileRole, 'user' | 'moderator'> {
  return role === 'creator' || role === 'admin'
}

function parseBody(input: unknown): CreatorLoginBody | null {
  if (!input || typeof input !== 'object') return null
  return input as CreatorLoginBody
}

export async function POST(request: Request): Promise<Response> {
  try {
    const body = parseBody(await request.json().catch(() => null))
    const email = body?.email?.trim() ?? ''
    const password = body?.password ?? ''

    if (!email || !password.trim()) {
      return jsonResponse({ error: 'Email and password required' }, 400)
    }

    const authClient = createAnonServerClient()
    const { data, error } = await authClient.auth.signInWithPassword({ email, password })

    if (error || !data.session || !data.user) {
      return jsonResponse({ error: 'Invalid credentials' }, 401)
    }

    const creatorClient = createAuthedServerClient(data.session.access_token)
    const profileResult = await creatorClient
      .from('profiles')
      .select('role')
      .eq('id', data.user.id)
      .maybeSingle()

    const profile = profileResult.data as ProfileRow | null
    const profileError = profileResult.error

    if (profileError || !profile || !isCreatorRole(profile.role)) {
      return jsonResponse({ error: 'Not a creator account' }, 403)
    }

    return jsonResponse({
      token: data.session.access_token,
      email: data.user.email ?? email,
    })
  } catch {
    return jsonResponse({ error: 'Invalid credentials' }, 401)
  }
}
