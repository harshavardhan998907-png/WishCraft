import { create } from 'zustand'

export type ToastKind = 'success' | 'error' | 'info'

export interface ToastMessage {
  id: string
  kind: ToastKind
  message: string
}

interface ToastStore {
  toasts: ToastMessage[]
  push: (kind: ToastKind, message: string) => void
  remove: (id: string) => void
}

export const useToastStore = create<ToastStore>((set) => ({
  toasts: [],
  push: (kind, message) => {
    const id = crypto.randomUUID()
    set((state) => ({ toasts: [...state.toasts, { id, kind, message }] }))
    window.setTimeout(() => set((state) => ({ toasts: state.toasts.filter((toast) => toast.id !== id) })), 4000)
  },
  remove: (id) => set((state) => ({ toasts: state.toasts.filter((toast) => toast.id !== id) })),
}))
