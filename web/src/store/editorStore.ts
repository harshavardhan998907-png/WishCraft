import { create } from 'zustand'
import type { EditorState, Template } from '../types'

interface EditorStore extends EditorState {
  setTemplate: (template: Template | null) => void
  setRecipientName: (name: string) => void
  setSenderName: (name: string) => void
  setCustomMessage: (msg: string) => void
  addPhoto: (url: string) => void
  removePhoto: (url: string) => void
  setMusicUrl: (url: string | null) => void
  setUseCustomMusic: (value: boolean) => void
  reset: () => void
}

const initialState: EditorState = {
  template: null,
  recipientName: '',
  senderName: '',
  customMessage: '',
  photoUrls: [],
  musicUrl: null,
  useCustomMusic: false,
}

export const useEditorStore = create<EditorStore>((set) => ({
  ...initialState,
  setTemplate: (template) => set({ template }),
  setRecipientName: (recipientName) => set({ recipientName }),
  setSenderName: (senderName) => set({ senderName }),
  setCustomMessage: (customMessage) => set({ customMessage: customMessage.slice(0, 300) }),
  addPhoto: (url) => set((state) => ({ photoUrls: [...state.photoUrls, url].slice(0, 5) })),
  removePhoto: (url) => set((state) => ({ photoUrls: state.photoUrls.filter((photo) => photo !== url) })),
  setMusicUrl: (musicUrl) => set({ musicUrl }),
  setUseCustomMusic: (useCustomMusic) => set({ useCustomMusic }),
  reset: () => set(initialState),
}))
