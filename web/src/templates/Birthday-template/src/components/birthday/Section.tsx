import { motion } from "framer-motion";
import type { ReactNode } from "react";

interface Props {
  id?: string;
  eyebrow?: string;
  title?: ReactNode;
  subtitle?: ReactNode;
  children: ReactNode;
  className?: string;
  align?: "left" | "center";
}

export function Section({ id, eyebrow, title, subtitle, children, className = "", align = "center" }: Props) {
  return (
    <section id={id} className={`relative scroll-mt-20 py-20 sm:py-24 md:py-36 px-5 md:px-10 ${className}`}>
      <div className={`mx-auto max-w-6xl ${align === "center" ? "text-center" : ""}`}>
        {(eyebrow || title || subtitle) && (
          <motion.header
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.4 }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            className={`mb-12 sm:mb-14 md:mb-20 ${align === "center" ? "mx-auto max-w-2xl" : ""}`}
          >
            {eyebrow && (
              <p className="inline-flex items-center gap-3 text-[10px] uppercase tracking-[0.4em] sm:tracking-[0.5em] text-gold-soft/80 mb-4 sm:mb-5">
                <span className="h-px w-6 sm:w-8 bg-gold/50" />
                {eyebrow}
                <span className="h-px w-6 sm:w-8 bg-gold/50" />
              </p>
            )}
            {title && (
              <h2 className="font-display text-[clamp(2rem,7vw,4.5rem)] lg:text-7xl font-light leading-[1.05] text-balance text-foreground">
                {title}
              </h2>
            )}
            {subtitle && (
              <p className="mt-5 sm:mt-6 text-base md:text-lg text-balance text-muted-foreground font-light leading-relaxed">
                {subtitle}
              </p>
            )}
          </motion.header>
        )}
        {children}
      </div>
    </section>
  );
}