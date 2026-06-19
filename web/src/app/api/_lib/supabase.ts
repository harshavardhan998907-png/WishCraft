import { createClient, type SupabaseClient } from '@supabase/supabase-js'

type ServerEnv = {
  SUPABASE_URL: string
  SUPABASE_ANON_KEY: string
  SUPABASE_SERVICE_ROLE_KEY: string
}

type ProcessLike = {
  env?: Record<string, string | undefined>
}

function getProcessEnv(): Record<string, string | undefined> {
  const maybeProcess = globalThis as typeof globalThis & { process?: ProcessLike }
  return maybeProcess.process?.env ?? {}
}

function getServerEnv(): ServerEnv {
  const env = getProcessEnv()
  const supabaseUrl = env.SUPABASE_URL
  const supabaseAnonKey = env.SUPABASE_ANON_KEY
  const supabaseServiceRoleKey = env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !supabaseAnonKey || !supabaseServiceRoleKey) {
    throw new Error('Missing Supabase server environment variables.')
  }

  return {
    SUPABASE_URL: supabaseUrl,
    SUPABASE_ANON_KEY: supabaseAnonKey,
    SUPABASE_SERVICE_ROLE_KEY: supabaseServiceRoleKey,
  }
}

const authClientOptions = {
  auth: {
    autoRefreshToken: false,
    detectSessionInUrl: false,
    persistSession: false,
  },
}

export function createAnonServerClient(): SupabaseClient {
  const env = getServerEnv()
  return createClient(env.SUPABASE_URL, env.SUPABASE_ANON_KEY, authClientOptions)
}

export function createAuthedServerClient(accessToken: string): SupabaseClient {
  const env = getServerEnv()
  return createClient(env.SUPABASE_URL, env.SUPABASE_ANON_KEY, {
    ...authClientOptions,
    global: {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    },
  })
}

export function createServiceRoleServerClient(): SupabaseClient {
  const env = getServerEnv()
  return createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, authClientOptions)
}

export function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'content-type': 'application/json; charset=utf-8',
    },
  })
}

export function readBearerToken(request: Request): string | null {
  const authorization = request.headers.get('authorization')
  if (!authorization) return null

  const [scheme, token, ...rest] = authorization.trim().split(/\s+/)
  if (rest.length > 0 || scheme.toLowerCase() !== 'bearer' || !token) return null
  return token
}
