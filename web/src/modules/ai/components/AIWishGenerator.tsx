import { Sparkles, Heart, Globe, PenTool, Type } from 'lucide-react'
import { Card } from '../../../components/ui/Card'
import type { OccasionType } from '../../../types'

interface AIWishGeneratorProps {
  initialOccasion?: OccasionType;
  onApply?: (message: string) => void;
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function AIWishGenerator(props: AIWishGeneratorProps) {
  return (
    <Card className="space-y-6 relative overflow-hidden bg-gradient-to-br from-white to-brand/5 dark:from-[#181824] dark:to-brand/10 border-brand/20">
      <div className="absolute top-0 right-0 p-6 pointer-events-none opacity-10">
        <Sparkles size={120} className="text-brand rotate-12" />
      </div>
      
      <div className="relative z-10 flex items-center justify-between">
        <div className="flex items-center gap-3 text-brand">
          <div className="p-2 bg-brand/10 rounded-xl">
            <Sparkles size={24} />
          </div>
          <h2 className="text-xl font-black text-ink dark:text-white font-heading">AI Wish Assistant</h2>
        </div>
        <span className="px-3 py-1 text-xs font-bold uppercase tracking-wider text-white bg-brand rounded-full shadow-sm">
          Coming Soon
        </span>
      </div>

      <div className="relative z-10 space-y-4">
        <p className="text-sm font-medium leading-relaxed text-zinc-600 dark:text-zinc-300">
          Generate heartfelt, personalized wishes effortlessly. Our AI assistant is currently learning how to craft the perfect message for every occasion.
        </p>

        <div className="bg-white/50 dark:bg-black/20 rounded-xl p-4 backdrop-blur-sm border border-black/5 dark:border-white/5">
          <p className="text-xs font-bold text-zinc-500 dark:text-zinc-400 mb-3 uppercase tracking-wider">Soon you'll be able to:</p>
          <ul className="space-y-3">
            {[
              { icon: Heart, text: 'Generate heartfelt, custom wishes' },
              { icon: Type, text: 'Choose the exact emotional tone' },
              { icon: Sparkles, text: 'Relationship-aware suggestions' },
              { icon: Globe, text: 'Multiple language support' },
              { icon: PenTool, text: 'Smart editing assistance' },
            ].map((feature, i) => (
              <li key={i} className="flex items-center gap-3 text-sm text-zinc-700 dark:text-zinc-200">
                <div className="flex-shrink-0 w-6 h-6 rounded-full bg-brand/10 flex items-center justify-center text-brand">
                  <feature.icon size={12} />
                </div>
                {feature.text}
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="relative z-10 pt-2">
        <button 
          disabled 
          className="w-full py-3 px-4 rounded-xl font-bold text-sm bg-zinc-100 text-zinc-400 dark:bg-white/5 dark:text-zinc-500 cursor-not-allowed transition-all"
        >
          AI features unlock soon
        </button>
      </div>
    </Card>
  )
}
