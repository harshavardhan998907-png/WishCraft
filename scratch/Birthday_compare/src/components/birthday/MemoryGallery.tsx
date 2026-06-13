import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { Section } from "./Section";

interface Memory { src: string; caption: string }

export function MemoryGallery({ memories }: { memories: Memory[] }) {
  const [active, setActive] = useState<number | null>(null);

  useEffect(() => {
    if (active === null) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setActive(null);
      if (e.key === "ArrowRight") setActive((a) => (a === null ? a : (a + 1) % memories.length));
      if (e.key === "ArrowLeft") setActive((a) => (a === null ? a : (a - 1 + memories.length) % memories.length));
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [active, memories.length]);

  if (!memories || memories.length === 0) return null;

  // masonry-like spans
  const spans = ["row-span-2", "row-span-1", "row-span-1", "row-span-2", "row-span-1", "row-span-2"];

  return (
    <Section
      id="memories"
      eyebrow="Memory gallery"
      title={<>The places <em className="font-display italic text-gradient-gold">we've been</em></>}
      subtitle="A small museum of ordinary, brilliant days."
    >
      <div className="grid grid-cols-2 md:grid-cols-3 auto-rows-[130px] sm:auto-rows-[170px] md:auto-rows-[200px] gap-3 md:gap-5">
        {memories.map((m, i) => (
          <motion.button
            key={i}
            onClick={() => setActive(i)}
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.1 }}
            transition={{ duration: 0.7, delay: (i % 6) * 0.08, ease: [0.16, 1, 0.3, 1] }}
            className={`${spans[i % spans.length]} group relative overflow-hidden rounded-2xl bg-card shadow-elegant cursor-zoom-in focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/60`}
            aria-label={`Open memory: ${m.caption}`}
          >
            <img
              src={m.src}
              alt={m.caption}
              loading="lazy"
              decoding="async"
              className="h-full w-full object-cover transition-transform duration-[1.2s] group-hover:scale-110"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-ink/90 via-ink/20 to-transparent opacity-70 group-hover:opacity-100 transition" />
            <div className="absolute inset-x-0 bottom-0 p-4 text-left translate-y-2 group-hover:translate-y-0 transition">
              <p className="font-display italic text-sm md:text-base text-foreground/95">{m.caption}</p>
            </div>
            <div className="absolute inset-0 ring-1 ring-inset ring-gold/0 group-hover:ring-gold/30 transition rounded-2xl" />
          </motion.button>
        ))}
      </div>

      <AnimatePresence>
        {active !== null && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            onClick={() => setActive(null)}
            role="dialog"
            aria-modal="true"
            aria-label={memories[active].caption}
            className="fixed inset-0 z-[80] bg-ink/90 backdrop-blur-md grid place-items-center p-4 sm:p-6"
          >
            <button
              onClick={() => setActive(null)}
              aria-label="Close image"
              className="absolute top-4 right-4 sm:top-5 sm:right-5 h-11 w-11 grid place-items-center rounded-full glass focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/60"
            >
              <X size={18} />
            </button>
            <motion.figure
              initial={{ scale: 0.94, y: 20, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.96, opacity: 0 }}
              transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
              className="max-w-4xl w-full max-h-[85vh] flex flex-col items-center"
              onClick={(e) => e.stopPropagation()}
            >
              <img
                src={memories[active].src}
                alt={memories[active].caption}
                className="w-full max-h-[75vh] object-contain rounded-2xl shadow-glow"
              />
              <figcaption className="mt-4 px-2 text-center font-display italic text-base sm:text-lg text-foreground/90">
                {memories[active].caption}
              </figcaption>
            </motion.figure>
          </motion.div>
        )}
      </AnimatePresence>
    </Section>
  );
}