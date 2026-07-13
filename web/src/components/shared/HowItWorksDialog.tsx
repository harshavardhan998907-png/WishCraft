import { Modal } from '../ui/Modal'
import { Button } from '../ui/Button'
import { HOW_IT_WORKS_STEPS } from '../../data/howItWorks'
import { useNavigate, useLocation } from 'react-router-dom'

interface HowItWorksDialogProps {
  open: boolean
  onClose: () => void
}

export function HowItWorksDialog({ open, onClose }: HowItWorksDialogProps) {
  const navigate = useNavigate()
  const location = useLocation()

  function handleStartCreating() {
    onClose()
    if (location.pathname === '/browse') {
      const el = document.getElementById('templates-gallery')
      if (el) {
        el.scrollIntoView({ behavior: 'smooth' })
        el.classList.add('ring-4', 'ring-brand/50', 'rounded-3xl', 'transition-all', 'duration-500')
        setTimeout(() => el.classList.remove('ring-4', 'ring-brand/50'), 1000)
      }
    } else {
      navigate('/browse#templates-gallery')
    }
  }

  return (
    <Modal open={open} title="How WishCraft Works" onClose={onClose}>
      <div className="space-y-6 pt-2">
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          Create, personalize and share beautiful wishes in just a few simple steps.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {HOW_IT_WORKS_STEPS.map((step) => (
            <div 
              key={step.num} 
              className="group flex flex-col gap-3 rounded-2xl border border-black/5 dark:border-white/10 bg-zinc-50 dark:bg-white/5 p-5 transition-all hover:bg-zinc-100 dark:hover:bg-white/10 hover:-translate-y-0.5"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand/10 text-brand">
                  <step.icon size={20} />
                </div>
                <h3 className="font-bold text-ink dark:text-white">
                  <span className="mr-2 text-brand/60 text-sm">{step.num}</span>
                  {step.title}
                </h3>
              </div>
              <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
                {step.desc}
              </p>
            </div>
          ))}
        </div>

        <div className="flex flex-col gap-3 pt-6 sm:flex-row sm:justify-end border-t border-black/10 dark:border-white/10 mt-6">
          <Button variant="ghost" className="w-full sm:w-auto" onClick={onClose}>
            Close
          </Button>
          <Button variant="primary" className="w-full sm:w-auto" onClick={handleStartCreating}>
            Start Creating
          </Button>
        </div>
      </div>
    </Modal>
  )
}
