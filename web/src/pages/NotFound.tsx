import { Link } from 'react-router-dom'
import { Button } from '../components/ui/Button'
import { useAuth } from '../hooks/useAuth'

export function NotFound() {
  const { user } = useAuth()
  return (
    <section className="grid min-h-[calc(100vh-70px)] place-items-center px-4 text-center">
      <div>
        <h1 className="text-5xl font-black">Page not found</h1>
        <Link to={user ? "/browse" : "/"} className="mt-6 inline-block"><Button>Go home</Button></Link>
      </div>
    </section>
  )
}

