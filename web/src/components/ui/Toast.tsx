import { useToastStore } from '../../store/toastStore'

export function ToastViewport() {
  const { toasts, remove } = useToastStore()

  const defaultToasts = toasts.filter((t) => !t.position || t.position === 'default')
  const topLeftToasts = toasts.filter((t) => t.position === 'top-left')

  return (
    <>
      <div className="fixed left-4 md:left-6 top-4 z-50 flex w-[min(360px,calc(100vw-2rem))] flex-col gap-3">
        {topLeftToasts.map((toast) => (
          <button key={toast.id} onClick={() => remove(toast.id)} className={`rounded-lg px-4 py-3 text-left text-sm font-semibold shadow-soft ${toast.kind === 'error' ? 'bg-rose-600 text-white' : toast.kind === 'success' ? 'bg-emerald-600 text-white' : 'bg-ink text-white'}`}>
            {toast.message}
          </button>
        ))}
      </div>
      <div className="fixed right-4 top-1/2 z-50 flex w-[min(360px,calc(100vw-2rem))] -translate-y-1/2 flex-col gap-3">
        {defaultToasts.map((toast) => (
          <button key={toast.id} onClick={() => remove(toast.id)} className={`rounded-lg px-4 py-3 text-left text-sm font-semibold shadow-soft ${toast.kind === 'error' ? 'bg-rose-600 text-white' : toast.kind === 'success' ? 'bg-emerald-600 text-white' : 'bg-ink text-white'}`}>
            {toast.message}
          </button>
        ))}
      </div>
    </>
  )
}
