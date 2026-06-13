import { motion } from "framer-motion";
import { Section } from "./Section";

export function Letter({ letter, sender }: { letter: string; sender: string }) {
  return (
    <Section
      id="letter"
      eyebrow="A letter"
      title={<>Read this <em className="font-display italic text-gradient-gold">slowly</em></>}
    >
      <motion.article
        initial={{ opacity: 0, y: 50, rotateX: 10 }}
        whileInView={{ opacity: 1, y: 0, rotateX: 0 }}
        viewport={{ once: true, amount: 0.3 }}
        transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
        style={{ transformPerspective: 1200 }}
        className="relative mx-auto max-w-2xl glass rounded-3xl p-6 sm:p-8 md:p-14 shadow-elegant text-left"
      >
        <div className="absolute -top-4 -left-4 h-10 w-10 rounded-full bg-gradient-rose shadow-glow" />
        <div className="whitespace-pre-line font-display text-lg sm:text-xl md:text-2xl leading-[1.7] text-foreground/90 italic">
          {letter}
        </div>
        <div className="mt-8 sm:mt-10 flex flex-wrap items-end justify-between gap-4">
          <span className="font-script text-3xl sm:text-4xl text-gradient-gold">— {sender}</span>
          <span className="text-[10px] sm:text-xs uppercase tracking-[0.3em] sm:tracking-[0.4em] text-muted-foreground">sealed with light</span>
        </div>
      </motion.article>
    </Section>
  );
}