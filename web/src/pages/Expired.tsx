import { Link } from 'react-router-dom'
import { Button } from '../components/ui/Button'

export function Expired() {
  return (
    <section className="grid min-h-screen place-items-center bg-[#fff7e8] px-4 text-center">
      <div className="max-w-xl">
        <div className="mx-auto mb-5 grid h-28 w-28 place-items-center rounded-full bg-white text-5xl shadow-soft dark:bg-white/10">7d</div>
        <h1 className="text-4xl font-black">This wish has expired</h1>
        <p className="mt-4 text-lg text-zinc-700">This wish was active for 7 days and has now expired. Ask your friend to send you a new one!</p>
        <Link to="/" className="mt-6 inline-block"><Button>Create your own wish</Button></Link>
      </div>
    </section>
  )
}
