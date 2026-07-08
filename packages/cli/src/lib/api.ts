export const WISHCRAFT_API_BASE =
  process.env.WISHCRAFT_API_URL ??
  'https://pgwfnlyrbkbwxklziieo.supabase.co/functions/v1'

export const WISHCRAFT_ENDPOINTS = {
  login: `${WISHCRAFT_API_BASE}/creator-login`,
  submit: `${WISHCRAFT_API_BASE}/template-submit`,
} as const
