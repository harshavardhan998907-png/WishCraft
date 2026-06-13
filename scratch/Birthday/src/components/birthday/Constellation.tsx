import { AnimatePresence, motion } from "framer-motion";
import { useMemo, useState } from "react";
import { Section } from "./Section";

interface Star { x: number; y: number; title: string; body: string }

export function Constellation({ stars }: { stars: Star[] }) {
  const [active, setActive] = useState<number | null>(null);

  const backgroundStars = useMemo(
    () =>
      Array.from({ length: 80 }).map(() => ({
        x: Math.random() * 100,
        y: Math.random() * 100,
        s: 0.5 + Math.random() * 1.5,
        d: Math.random() * 4,
      })),
    [],
  );

  // build a smooth-ish polyline between stars
  const path = stars.map((s, i) => `${i === 0 ? "M" : "L"} ${s.x} ${s.y}`).join(" ");

  return (
    <Section
      id="stars"
      eyebrow="Memory constellation"
      title={<>Every moment, <em className="font-display italic text-gradient-gold">a star</em></>}
      subtitle="Tap a star. Each one is a memory I keep, lit forever."
    >
      <div className="relative mx-auto aspect-[16/10] md:aspect-[16/9] max-w-5xl rounded-3xl overflow-hidden border border-border/40 shadow-elegant">
        {/* night sky */}
        <div className="absolute inset-0 bg-[radial-gradient(120%_90%_at_50%_120%,oklch(0.22_0.06_280)_0%,oklch(0.10_0.03_280)_55%,oklch(0.06_0.02_280)_100%)]" />
        {/* aurora wash */}
        <div className="absolute inset-0 bg-aurora opacity-30 mix-blend-screen" />
        {/* background stars */}
        {backgroundStars.map((s, i) => (
          <span
            key={i}
            className="absolute rounded-full bg-foreground/80 animate-twinkle"
            style={{
              left: `${s.x}%`,
              top: `${s.y}%`,
              width: s.s,
              height: s.s,
              animationDelay: `${s.d}s`,
            }}
          />
        ))}

        {/* constellation lines */}
        <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
          <motion.path
            d={path}
            fill="none"
            stroke="url(#g)"
            strokeWidth="0.15"
            strokeLinecap="round"
            initial={{ pathLength: 0 }}
            whileInView={{ pathLength: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 3, ease: "easeInOut" }}
          />
          <defs>
            <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="oklch(0.88 0.10 80)" stopOpacity="0.5" />
              <stop offset="100%" stopColor="oklch(0.74 0.14 45)" stopOpacity="0.7" />
            </linearGradient>
          </defs>
        </svg>

        {/* memory stars */}
        {stars.map((s, i) => {
          // Keep labels from overflowing the sky edges
          const labelAnchor =
            s.x < 18 ? "left-1/2 text-left"
            : s.x > 82 ? "right-1/2 text-right"
            : "left-1/2 -translate-x-1/2 text-center";
          return (
            <button
              key={i}
              onClick={() => setActive(i)}
              // Tap area = 44x44 button, centered exactly on (s.x%, s.y%).
              // Translate(-50%, -50%) is applied AFTER `left/top`; no negative margins
              // because those would shift the box before the translate and pull the
              // dot off the SVG line endpoint.
              className="absolute h-11 w-11 -translate-x-1/2 -translate-y-1/2 group grid place-items-center focus-visible:outline-none"
              style={{ left: `${s.x}%`, top: `${s.y}%` }}
              aria-label={s.title}
            >
              {/* glow halo (centered, behind dot) */}
              <span className="absolute h-10 w-10 rounded-full bg-gold/25 blur-md opacity-0 group-hover:opacity-100 group-focus-visible:opacity-100 transition" />
              {/* the dot — visually at (s.x%, s.y%) exactly */}
              <span className="relative h-3 w-3 rounded-full bg-gold shadow-[0_0_24px_var(--gold),0_0_40px_var(--gold)] animate-gentle-pulse group-focus-visible:ring-2 group-focus-visible:ring-gold/70 group-focus-visible:ring-offset-2 group-focus-visible:ring-offset-transparent" />
              {/* label below */}
              <span
                className={`pointer-events-none absolute top-full mt-1 ${labelAnchor} text-[10px] uppercase tracking-[0.25em] text-gold-soft/0 group-hover:text-gold-soft group-focus-visible:text-gold-soft transition max-w-[40vw] truncate`}
              >
                {s.title}
              </span>
            </button>
          );
        })}

        <AnimatePresence>
          {active !== null && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="absolute inset-x-4 bottom-4 md:inset-x-auto md:left-1/2 md:-translate-x-1/2 md:bottom-6 md:max-w-md glass rounded-2xl p-5 shadow-glow"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-[10px] uppercase tracking-[0.4em] text-gold-soft mb-1">memory</p>
                  <h4 className="font-display italic text-xl text-foreground">{stars[active].title}</h4>
                  <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{stars[active].body}</p>
                </div>
                <button
                  onClick={() => setActive(null)}
                  className="text-xs text-muted-foreground hover:text-foreground"
                >
                  close
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </Section>
  );
}