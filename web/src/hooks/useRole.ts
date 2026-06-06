import { useAuth } from './useAuth'

export function useRole() {
  const { role, loading } = useAuth()

  return {
    role,
    loading,
    isAdmin: role === 'admin',
    isUser: role === 'user',
  }
}
