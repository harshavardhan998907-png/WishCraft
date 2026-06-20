import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

// This function is a thin, CORS-friendly proxy for a creator bundle. The admin
// is already authenticated by `sign-preview`, which returns a short-lived signed
// URL; this endpoint just fetches that URL and returns the raw bundle JS.
//
// It deliberately does NOT return HTML: the Supabase Edge Runtime rewrites the
// Content-Type of HTML responses to text/plain, so the browser would show the
// source instead of rendering it. Returning JS (which the client reads as text)
// avoids that entirely — the preview HTML is assembled client-side into a Blob.
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, apikey, content-type, x-client-info',
  'Access-Control-Max-Age': '86400',
}

// Since this endpoint is public (--no-verify-jwt) and fetches whatever URL it is
// given, restrict it to genuine Supabase storage signed URLs for the
// templates-pending bucket on THIS project. Without this it would be an open
// server-side fetch proxy (SSRF).
function isAllowedSignedUrl(candidate: string): boolean {
  const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
  if (!supabaseUrl) return false
  let parsed: URL
  let base: URL
  try {
    parsed = new URL(candidate)
    base = new URL(supabaseUrl)
  } catch {
    return false
  }
  return (
    parsed.origin === base.origin &&
    parsed.pathname.startsWith('/storage/v1/object/sign/templates-pending/')
  )
}

function jsonError(message: string, status: number): Response {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}

serve(async (req) => {
  // CORS preflight: answer 200 with the full header set and no body.
  if (req.method === 'OPTIONS') {
    return new Response('ok', { status: 200, headers: corsHeaders })
  }
  if (req.method !== 'GET') return jsonError('Method not allowed', 405)

  const url = new URL(req.url)
  const signedUrl = url.searchParams.get('signedUrl')?.trim() ?? ''

  if (!signedUrl) return jsonError('signedUrl query param is required', 400)
  if (!isAllowedSignedUrl(signedUrl)) {
    return jsonError('signedUrl must be a templates-pending signed URL for this project', 400)
  }

  try {
    // The signed URL is self-authenticating; no service role or admin check here.
    const bundleResponse = await fetch(signedUrl)
    if (!bundleResponse.ok) {
      return jsonError(`Could not read template bundle (storage responded ${bundleResponse.status})`, 502)
    }

    const bundleSource = await bundleResponse.text()

    return new Response(bundleSource, {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/javascript; charset=utf-8' },
    })
  } catch (error) {
    console.error('[preview-template] unhandled error', error)
    return jsonError(error instanceof Error ? error.message : 'Preview failed', 500)
  }
})
