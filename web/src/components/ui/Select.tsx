import { useState, useRef, useEffect, useId } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronDown, AlertCircle } from 'lucide-react'

interface SelectProps {
  label: string
  value: string
  onChange: (value: string) => void
  options: readonly string[] | string[]
  disabled?: boolean
  required?: boolean
  error?: string
}

export function Select({ label, value, onChange, options, disabled, required, error }: SelectProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [focusedIndex, setFocusedIndex] = useState(-1)
  const containerRef = useRef<HTMLDivElement>(null)
  const listboxId = useId()
  const errorId = useId()

  const toggleOpen = () => {
    if (disabled) return
    setIsOpen(!isOpen)
  }

  // Close when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (disabled) return

    if (e.key === 'Escape') {
      setIsOpen(false)
      containerRef.current?.querySelector('button')?.focus()
      return
    }

    if (e.key === ' ' || e.key === 'Enter') {
      e.preventDefault()
      if (!isOpen) {
        setIsOpen(true)
        const currentIdx = options.indexOf(value)
        setFocusedIndex(currentIdx >= 0 ? currentIdx : 0)
      } else {
        if (focusedIndex >= 0 && focusedIndex < options.length) {
          onChange(options[focusedIndex])
        }
        setIsOpen(false)
        containerRef.current?.querySelector('button')?.focus()
      }
      return
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault()
      if (!isOpen) {
        setIsOpen(true)
        const currentIdx = options.indexOf(value)
        setFocusedIndex(currentIdx >= 0 ? currentIdx : 0)
      } else {
        setFocusedIndex((prev) => (prev + 1) % options.length)
      }
      return
    }

    if (e.key === 'ArrowUp') {
      e.preventDefault()
      if (!isOpen) {
        setIsOpen(true)
        const currentIdx = options.indexOf(value)
        setFocusedIndex(currentIdx >= 0 ? currentIdx : 0)
      } else {
        setFocusedIndex((prev) => (prev - 1 + options.length) % options.length)
      }
      return
    }
  }

  useEffect(() => {
    if (!isOpen) {
      setFocusedIndex(-1)
    }
  }, [isOpen])

  // Scroll active item into view
  useEffect(() => {
    if (isOpen && focusedIndex >= 0) {
      const activeEl = document.getElementById(`opt-${focusedIndex}`)
      activeEl?.scrollIntoView({ block: 'nearest' })
    }
  }, [focusedIndex, isOpen])

  return (
    <div className="block space-y-1.5" ref={containerRef}>
      <span className="text-sm font-semibold text-ink dark:text-white/90">
        {label}
        {required && <span className="ml-1 text-rose-500">*</span>}
      </span>
      
      <div className="relative">
        <button
          type="button"
          aria-haspopup="listbox"
          aria-expanded={isOpen}
          aria-invalid={!!error}
          aria-describedby={error ? errorId : undefined}
          disabled={disabled}
          onClick={toggleOpen}
          onKeyDown={handleKeyDown}
          className={`focus-ring flex w-full items-center justify-between rounded-xl border bg-white px-3 py-2.5 text-sm text-ink transition-colors dark:bg-[#10101a] dark:text-white ${
            error 
              ? 'border-rose-500 bg-rose-50/50 focus:ring-rose-500/50 dark:border-rose-500 dark:bg-rose-950/20' 
              : 'border-black/15 dark:border-white/10'
          } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
        >
          <span>{value}</span>
          <ChevronDown
            size={18}
            className={`text-zinc-500 dark:text-white/50 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
          />
        </button>

        <AnimatePresence>
          {isOpen && (
            <motion.ul
              id={listboxId}
              role="listbox"
              tabIndex={-1}
              initial={{ opacity: 0, scale: 0.96, y: -4 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: -4 }}
              transition={{ duration: 0.15, ease: 'easeOut' }}
              className="absolute left-0 z-50 mt-1 max-h-60 w-full overflow-y-auto rounded-xl border border-black/5 bg-white p-1 shadow-lg dark:bg-[#181824] dark:border-white/10 custom-scrollbar"
            >
              {options.map((opt, idx) => {
                const isSelected = opt === value
                const isFocused = idx === focusedIndex

                return (
                  <li
                    key={opt}
                    id={`opt-${idx}`}
                    role="option"
                    aria-selected={isSelected}
                    onClick={() => {
                      onChange(opt)
                      setIsOpen(false)
                    }}
                    onMouseEnter={() => setFocusedIndex(idx)}
                    className={`relative cursor-pointer select-none rounded-lg px-3 py-2 text-sm transition-colors ${
                      isSelected
                        ? 'bg-brand text-white font-semibold'
                        : isFocused
                        ? 'bg-zinc-100 text-ink dark:bg-white/5 dark:text-white'
                        : 'text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-white/5'
                    }`}
                  >
                    {opt}
                  </li>
                )
              })}
            </motion.ul>
          )}
        </AnimatePresence>
      </div>
      
      {error && (
        <span id={errorId} className="flex items-center gap-1.5 text-sm font-medium text-rose-600 dark:text-rose-400">
          <AlertCircle size={14} />{error}
        </span>
      )}
    </div>
  )
}
