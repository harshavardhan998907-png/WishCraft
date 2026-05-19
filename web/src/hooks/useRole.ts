import { useAuth } from './useAuth'

export function useRole() {
  const { role, loading } = useAuth()

  return {
    role,
    loading,
    isAdmin: role === 'admin',
    isModerator: role === 'moderator',
    isCreator: role === 'creator',
    isUser: role === 'user',
  }
}
