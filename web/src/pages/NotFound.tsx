import { Link } from 'react-router-dom'
import { Button } from '../components/ui/Button'

export function NotFound() {
  return (
    <section className="grid min-h-[calc(100vh-70px)] place-items-center px-4 text-center">
      <div>
        <h1 className="text-5xl font-black">Page not found</h1>
        <Link to="/" className="mt-6 inline-block"><Button>Go home</Button></Link>
      </div>
    </section>
  )
}
