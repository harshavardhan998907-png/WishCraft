import { motion, useScroll, useTransform } from "framer-motion";
import { useRef, useState } from "react";
import { ArrowDown, Volume2, VolumeX } from "lucide-react";
import heroBg from "@/assets/hero-bg.jpg";
import { FloatingParticles } from "./FloatingParticles";

interface Props {
  name: string;
  nickname?: string;
  tagline: string;
  date: string;
}

export function Hero({ name, nickname, tagline, date }: Props) {
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });
  const y = useTransform(scrollYProgress, [0, 1], [0, 220]);
  const opacity = useTransform(scrollYProgress, [0, 0.9], [1, 0]);
  const scale = useTransform(scrollYProgress, [0, 1], [1, 1.15]);
  const [muted, setMuted] = useState(true);

  return (
    <section ref={ref} id="top" className="relative min-h-[100svh] overflow-hidden">
      <motion.div style={{ scale, opacity }} className="absolute inset-0">
        <img
          src={heroBg}
          alt=""
          aria-hidden="true"
          fetchPriority="high"
          decoding="async"
          className="h-full w-full object-cover"
          width={1536}
          height={1920}
        />
        <div className="absolute inset-0 bg-aurora mix-blend-screen opacity-60" />
        <div className="absolute inset-0 bg-gradient-to-b from-background/40 via-background/30 to-background" />
      </motion.div>

      <FloatingParticles count={28} />

      <motion.div
        style={{ y, opacity }}
        className="relative z-10 flex min-h-[100svh] flex-col items-center justify-center px-5 sm:px-6 text-center"
      >
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.2 }}
          className="font-script text-3xl md:text-4xl text-gradient-gold mb-4"
        >
          happy birthday
        </motion.p>

        <motion.h1
          initial={{ opacity: 0, y: 40, filter: "blur(12px)" }}
          animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          transition={{ duration: 1.4, delay: 0.4, ease: [0.16, 1, 0.3, 1] }}
          style={{ fontSize: "clamp(3rem, 16vw, 13rem)" }}
          className="font-display font-light leading-[0.9] tracking-tight max-w-full break-words text-balance"
        >
          <span className="block italic text-foreground/95">{name}</span>
        </motion.h1>

        {nickname && (
          <motion.span
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1, delay: 1.4 }}
            className="mt-6 inline-flex items-center gap-3 text-xs uppercase tracking-[0.5em] text-gold-soft/80"
          >
            <span className="h-px w-10 bg-gold/60" />
            also known as {nickname}
            <span className="h-px w-10 bg-gold/60" />
          </motion.span>
        )}

        {tagline && (
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 1.7 }}
            className="mt-8 max-w-xl text-balance text-base md:text-lg text-muted-foreground font-light leading-relaxed"
          >
            {tagline}
          </motion.p>
        )}

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 2 }}
          className="mt-10 text-xs uppercase tracking-[0.4em] text-muted-foreground/70"
        >
          {date}
        </motion.div>
      </motion.div>

      {/* scroll cue */}
      <motion.a
        href="#wish"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1, y: [0, 8, 0] }}
        transition={{ opacity: { delay: 2.3, duration: 1 }, y: { repeat: Infinity, duration: 2.5 } }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10 flex flex-col items-center gap-2 text-xs uppercase tracking-[0.3em] text-muted-foreground hover:text-foreground transition"
      >
        scroll
        <ArrowDown size={14} />
      </motion.a>

      {/* audio toggle */}
      <button
        onClick={() => setMuted(!muted)}
        className="absolute bottom-6 right-4 md:bottom-8 md:right-6 z-10 h-11 w-11 grid place-items-center rounded-full glass text-foreground/80 hover:text-foreground transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/60"
        aria-label={muted ? "Unmute music" : "Mute music"}
        aria-pressed={!muted}
      >
        {muted ? <VolumeX size={16} /> : <Volume2 size={16} />}
      </button>
    </section>
  );
}