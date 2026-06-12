import { create } from 'zustand'
import type { EditorState, Template } from '../types'

interface EditorStore extends EditorState {
  setTemplate: (template: Template | null) => void
  setFieldValue: (fieldId: string, value: unknown) => void
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
  formData: {},
  useCustomMusic: false,
}

export const useEditorStore = create<EditorStore>((set) => ({
  ...initialState,
  setTemplate: (template) => set({ template }),
  setFieldValue: (fieldId, value) => set((state) => ({ formData: { ...state.formData, [fieldId]: value } })),
  setRecipientName: (recipientName) => set((state) => ({ recipientName, formData: { ...state.formData, recipient_name: recipientName } })),
  setSenderName: (senderName) => set((state) => ({ senderName, formData: { ...state.formData, sender_name: senderName } })),
  setCustomMessage: (customMessage) => set((state) => {
    const value = customMessage.slice(0, 300)
    return { customMessage: value, formData: { ...state.formData, message: value } }
  }),
  addPhoto: (url) => set((state) => {
    const photoUrls = [...state.photoUrls, url].slice(0, 5)
    return { photoUrls, formData: { ...state.formData, photos: photoUrls } }
  }),
  removePhoto: (url) => set((state) => {
    const photoUrls = state.photoUrls.filter((photo) => photo !== url)
    return { photoUrls, formData: { ...state.formData, photos: photoUrls } }
  }),
  setMusicUrl: (musicUrl) => set((state) => ({ musicUrl, formData: { ...state.formData, music: musicUrl } })),
  setUseCustomMusic: (useCustomMusic) => set({ useCustomMusic }),
  reset: () => set(initialState),
}))
