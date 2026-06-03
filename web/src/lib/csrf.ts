import { nanoid } from 'nanoid'

let csrfToken: string | null = null

export function getCsrfToken(): string {
  if (!csrfToken) {
    // Generate a secure token and store in sessionStorage to persist across page refreshes
    const storedToken = typeof window !== 'undefined' ? window.sessionStorage.getItem('csrf_token') : null
    if (storedToken) {
      csrfToken = storedToken
    } else {
      csrfToken = nanoid(32)
      if (typeof window !== 'undefined') {
        window.sessionStorage.setItem('csrf_token', csrfToken)
      }
    }
  }
  return csrfToken
}

export function validateCsrfToken(token: string): boolean {
  return token === getCsrfToken()
}
