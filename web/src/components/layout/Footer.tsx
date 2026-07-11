import { Link } from 'react-router-dom'
import { Camera, MessageCircle, PlayCircle } from 'lucide-react'

export function Footer() {
  return (
    <footer className="border-t border-black/10 bg-white px-6 py-12 md:py-16 transition-colors dark:border-white/10 dark:bg-[#10101a]">
      <div className="mx-auto max-w-7xl">
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-8 lg:gap-12 mb-12">
          {/* Brand */}
          <div className="col-span-2 lg:col-span-2 space-y-4">
            <Link to="/" className="flex items-center gap-2 text-xl font-black tracking-normal text-ink transition-colors dark:text-white">
              <span className="grid h-8 w-8 place-items-center rounded-md bg-ink text-sm text-white shadow-soft dark:bg-white dark:text-ink">WC</span>
              WishCraft
            </Link>
            <p className="text-sm text-zinc-500 dark:text-zinc-400 max-w-xs leading-relaxed">
              Bespoke animated celebration sites. Turn simple greetings into cinematic memories that last forever.
            </p>
            <div className="flex items-center gap-3 pt-2 text-zinc-400 dark:text-zinc-500">
              <a href="#" className="hover:text-brand transition-colors p-2 -ml-2 rounded-full hover:bg-zinc-100 dark:hover:bg-white/5" aria-label="Twitter">
                <MessageCircle size={20} />
              </a>
              <a href="#" className="hover:text-brand transition-colors p-2 rounded-full hover:bg-zinc-100 dark:hover:bg-white/5" aria-label="Instagram">
                <Camera size={20} />
              </a>
              <a href="#" className="hover:text-brand transition-colors p-2 rounded-full hover:bg-zinc-100 dark:hover:bg-white/5" aria-label="YouTube">
                <PlayCircle size={20} />
              </a>
            </div>
          </div>

          {/* Product */}
          <div className="space-y-4">
            <h4 className="text-sm font-bold text-ink dark:text-white">Product</h4>
            <ul className="space-y-2.5 text-sm">
              <li><Link to="/browse" className="text-zinc-500 hover:text-brand dark:text-zinc-400 dark:hover:text-brand transition-colors">Browse Templates</Link></li>
              <li><Link to="/auth?redirect=/browse" className="text-zinc-500 hover:text-brand dark:text-zinc-400 dark:hover:text-brand transition-colors">Create Wish</Link></li>
              <li><a href="/#how-it-works" className="text-zinc-500 hover:text-brand dark:text-zinc-400 dark:hover:text-brand transition-colors">How It Works</a></li>
            </ul>
          </div>

          {/* Company */}
          <div className="space-y-4">
            <h4 className="text-sm font-bold text-ink dark:text-white">Company</h4>
            <ul className="space-y-2.5 text-sm">
              <li><a href="#" className="text-zinc-500 hover:text-brand dark:text-zinc-400 dark:hover:text-brand transition-colors">About</a></li>
              <li><a href="#" className="text-zinc-500 hover:text-brand dark:text-zinc-400 dark:hover:text-brand transition-colors">Contact</a></li>
              <li><a href="#" className="text-zinc-500 hover:text-brand dark:text-zinc-400 dark:hover:text-brand transition-colors">Support</a></li>
            </ul>
          </div>

          {/* Legal */}
          <div className="space-y-4">
            <h4 className="text-sm font-bold text-ink dark:text-white">Legal</h4>
            <ul className="space-y-2.5 text-sm">
              <li><a href="#" className="text-zinc-500 hover:text-brand dark:text-zinc-400 dark:hover:text-brand transition-colors">Privacy Policy</a></li>
              <li><a href="#" className="text-zinc-500 hover:text-brand dark:text-zinc-400 dark:hover:text-brand transition-colors">Terms of Service</a></li>
            </ul>
          </div>
        </div>

        <div className="pt-8 border-t border-black/10 dark:border-white/10 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-zinc-400 dark:text-zinc-500">
          <p>© {new Date().getFullYear()} WishCraft. All rights reserved.</p>
          <p>Beautiful wishes, live for 7 days.</p>
        </div>
      </div>
    </footer>
  )
}
