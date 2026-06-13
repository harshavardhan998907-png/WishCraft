import { motion } from "framer-motion";
import { Quote as QuoteIcon } from "lucide-react";

export function Quote({ text, author }: { text: string; author: string }) {
  return (
    <section className="relative py-20 sm:py-24 md:py-32 px-5 md:px-10 overflow-hidden">
      <div className="absolute inset-0 bg-aurora opacity-40 pointer-events-none" />
      <motion.figure
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.3 }}
        transition={{ duration: 1 }}
        className="relative mx-auto max-w-3xl text-center"
      >
        <QuoteIcon className="mx-auto mb-8 text-gold/60" size={40} strokeWidth={1} />
        <blockquote className="font-display italic text-xl sm:text-2xl md:text-4xl leading-snug text-balance text-foreground/95">
          “{text}”
        </blockquote>
        <figcaption className="mt-8 text-xs uppercase tracking-[0.4em] text-gold-soft/80">
          — {author}
        </figcaption>
      </motion.figure>
    </section>
  );
}