import { Navbar } from './Navbar'
import { ToastViewport } from '../ui/Toast'
import { useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'

const fullscreenRoutePrefixes = ['/w/', '/editor']

function OfflineBanner() {
  const [offline, setOffline] = useState(() => typeof navigator !== 'undefined' && !navigator.onLine)

  useEffect(() => {
    const update = () => setOffline(!navigator.onLine)
    window.addEventListener('online', update)
    window.addEventListener('offline', update)
    return () => {
      window.removeEventListener('online', update)
      window.removeEventListener('offline', update)
    }
  }, [])

  if (!offline) return null
  return <div className="bg-rose-600 px-4 py-2 text-center text-sm font-bold text-white">You are offline. Some features may not work.</div>
}

export function PageWrapper({ children }: { children: React.ReactNode }) {
  const { pathname } = useLocation()
  const fullscreen = fullscreenRoutePrefixes.some((prefix) => pathname.startsWith(prefix))

  return (
    <>
      {fullscreen ? null : (
        <a href="#main-content" className="skip-link">
          Skip to main content
        </a>
      )}
      {fullscreen ? null : <OfflineBanner />}
      {fullscreen ? null : <Navbar />}
      <main id="main-content">{children}</main>
      <ToastViewport />
    </>
  )
}
