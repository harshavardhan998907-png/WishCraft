import { motion, useInView } from "framer-motion";
import { useRef, useState, useEffect, useMemo } from "react";
import { PartyPopper } from "lucide-react";
import { Section } from "./Section";

function Confetti({ run }: { run: boolean }) {
  const pieces = useMemo(
    () =>
      Array.from({ length: 80 }).map((_, i) => ({
        id: i,
        left: Math.random() * 100,
        delay: Math.random() * 0.6,
        duration: 2.5 + Math.random() * 2.5,
        rotate: Math.random() * 360,
        color: ["var(--gold)", "var(--rose)", "var(--champagne)", "var(--accent)"][i % 4],
        size: 6 + Math.random() * 8,
      })),
    [],
  );

  if (!run) return null;

  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      {pieces.map((p) => (
        <motion.span
          key={p.id}
          initial={{ y: -40, x: 0, rotate: 0, opacity: 1 }}
          animate={{ y: "110vh", x: -50 + Math.random() * 100, rotate: p.rotate * 3, opacity: [1, 1, 0] }}
          transition={{ duration: p.duration, delay: p.delay, ease: "easeIn" }}
          className="absolute top-0 rounded-sm"
          style={{
            left: `${p.left}%`,
            width: p.size,
            height: p.size * 0.4,
            background: p.color,
          }}
        />
      ))}
    </div>
  );
}

function Firework({ x, y, delay }: { x: string; y: string; delay: number }) {
  const sparks = Array.from({ length: 16 });
  return (
    <div className="absolute" style={{ left: x, top: y }}>
      {sparks.map((_, i) => {
        const angle = (i / sparks.length) * Math.PI * 2;
        const dist = 80 + Math.random() * 40;
        return (
          <motion.span
            key={i}
            initial={{ x: 0, y: 0, opacity: 0 }}
            animate={{
              x: Math.cos(angle) * dist,
              y: Math.sin(angle) * dist,
              opacity: [0, 1, 0],
            }}
            transition={{ duration: 1.6, delay, repeat: Infinity, repeatDelay: 3, ease: "easeOut" }}
            className="absolute h-1.5 w-1.5 rounded-full"
            style={{
              background: i % 2 ? "var(--gold)" : "var(--rose)",
              boxShadow: "0 0 10px currentColor",
            }}
          />
        );
      })}
    </div>
  );
}

export function Celebration({ name }: { name: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: false, amount: 0.4 });
  const [burst, setBurst] = useState(0);

  useEffect(() => {
    if (inView) setBurst((b) => b + 1);
  }, [inView]);

  return (
    <Section
      id="celebrate"
      eyebrow="The celebration"
      title={<>And now — <em className="font-display italic text-gradient-gold">we celebrate</em></>}
      subtitle="Tap the button. Make a wish. Don't tell anyone what it is."
    >
      <div ref={ref} className="relative mx-auto max-w-3xl">
        <Confetti run={burst > 0} key={burst} />

        <div className="relative aspect-[4/5] sm:aspect-[4/3] md:aspect-[16/9] rounded-3xl overflow-hidden glass shadow-glow grid place-items-center">
          <div className="absolute inset-0 bg-aurora opacity-50" />
          <Firework x="20%" y="30%" delay={0.2} />
          <Firework x="75%" y="25%" delay={0.9} />
          <Firework x="50%" y="55%" delay={1.5} />

          <div className="relative text-center px-5 sm:px-6">
            <p className="font-script text-3xl sm:text-4xl md:text-5xl text-gradient-gold mb-3">
              cheers to you,
            </p>
            <h3 className="font-display italic text-[clamp(2.25rem,9vw,5rem)] md:text-7xl text-foreground mb-6 sm:mb-8 break-words">
              {name}
            </h3>
            <motion.button
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.96 }}
              onClick={() => setBurst((b) => b + 1)}
              className="inline-flex items-center gap-3 px-6 sm:px-7 py-3.5 rounded-full bg-gradient-gold text-primary-foreground font-medium text-sm tracking-wide shadow-glow min-h-11 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/60"
            >
              <PartyPopper size={18} />
              <span className="whitespace-nowrap">Make it rain confetti</span>
            </motion.button>
          </div>
        </div>
      </div>
    </Section>
  );
}