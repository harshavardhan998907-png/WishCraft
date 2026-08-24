import { create } from 'zustand'
import { generateUUID } from '../lib/uuid'

export type ToastKind = 'success' | 'error' | 'info'

export type ToastPosition = 'default' | 'top-left'

export interface ToastMessage {
  id: string
  kind: ToastKind
  message: string
  position?: ToastPosition
}

interface ToastStore {
  toasts: ToastMessage[]
  push: (kind: ToastKind, message: string, position?: ToastPosition) => void
  remove: (id: string) => void
}

export const useToastStore = create<ToastStore>((set) => ({
  toasts: [],
  push: (kind, message, position = 'default') => {
    const id = generateUUID()
    set((state) => ({ toasts: [...state.toasts, { id, kind, message, position }] }))
    window.setTimeout(() => set((state) => ({ toasts: state.toasts.filter((toast) => toast.id !== id) })), 4000)
  },
  remove: (id) => set((state) => ({ toasts: state.toasts.filter((toast) => toast.id !== id) })),
}))
