import { AnimatePresence, motion } from "framer-motion";
import { useState } from "react";
import { Gift, Sparkles } from "lucide-react";
import { Section } from "./Section";

export function SecretSurprise({ title, body }: { title: string; body: string }) {
  const [open, setOpen] = useState(false);

  return (
    <Section
      eyebrow="Tap me"
      title={<>A small <em className="font-display italic text-gradient-gold">secret</em></>}
      subtitle="Something I've been saving for the end of the page."
    >
      <div className="relative mx-auto max-w-xl">
        <AnimatePresence mode="wait">
          {!open ? (
            <motion.button
              key="closed"
              onClick={() => setOpen(true)}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.6, rotate: -10 }}
              whileHover={{ scale: 1.05, rotate: 2 }}
              whileTap={{ scale: 0.95 }}
              transition={{ duration: 0.5 }}
              className="group mx-auto block relative"
              aria-label="Open the secret"
            >
              <div className="relative h-48 w-48 md:h-60 md:w-60 mx-auto rounded-3xl bg-gradient-rose shadow-glow grid place-items-center animate-gentle-pulse">
                <Gift size={64} className="text-foreground" strokeWidth={1.2} />
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 h-6 w-32 rounded-full bg-gradient-gold" />
              </div>
              <p className="mt-6 text-xs uppercase tracking-[0.4em] text-gold-soft/80">tap to open</p>
            </motion.button>
          ) : (
            <motion.div
              key="open"
              initial={{ opacity: 0, scale: 0.8, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
              className="glass rounded-3xl p-10 shadow-glow text-center"
            >
              <Sparkles className="mx-auto mb-4 text-gold animate-twinkle" />
              <h3 className="font-display text-3xl md:text-4xl italic mb-4 text-gradient-gold">{title}</h3>
              <p className="font-display text-lg md:text-xl text-foreground/90 italic leading-relaxed">{body}</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </Section>
  );
}