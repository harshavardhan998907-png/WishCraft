import { AnimatePresence, motion, useScroll, useTransform } from "framer-motion";
import { useEffect, useState } from "react";
import { Menu, X } from "lucide-react";

const links = [
  { label: "Wish", href: "#wish" },
  { label: "Memories", href: "#memories" },
  { label: "Journey", href: "#journey" },
  { label: "Letter", href: "#letter" },
  { label: "Stars", href: "#stars" },
  { label: "Celebrate", href: "#celebrate" },
];

export function Nav({ name }: { name: string }) {
  const { scrollY } = useScroll();
  const bg = useTransform(scrollY, [0, 200], ["oklch(0.14 0.03 280 / 0)", "oklch(0.10 0.025 280 / 0.75)"]);
  const border = useTransform(scrollY, [0, 200], ["oklch(1 0 0 / 0)", "oklch(1 0 0 / 0.08)"]);
  const [open, setOpen] = useState(false);

  // Lock body scroll while the mobile drawer is open
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <motion.nav
      style={{ backgroundColor: bg, borderColor: border }}
      className="fixed top-0 inset-x-0 z-50 backdrop-blur-xl border-b transition-colors"
    >
      <div className="mx-auto max-w-7xl px-5 md:px-10 h-16 flex items-center justify-between gap-4">
        <a href="#top" className="flex items-center gap-2.5 group min-w-0">
          <span className="h-2 w-2 shrink-0 rounded-full bg-gold animate-gentle-pulse" />
          <span className="font-display text-base sm:text-lg tracking-wide text-foreground/90 group-hover:text-foreground transition truncate">
            For <span className="text-gradient-gold italic">{name}</span>
          </span>
        </a>

        <ul className="hidden md:flex items-center gap-8 text-sm text-muted-foreground">
          {links.map((l) => (
            <li key={l.href}>
              <a href={l.href} className="hover:text-foreground transition relative group">
                {l.label}
                <span className="absolute -bottom-1.5 left-0 right-0 h-px bg-gradient-gold scale-x-0 group-hover:scale-x-100 transition-transform origin-left" />
              </a>
            </li>
          ))}
        </ul>

        <button
          onClick={() => setOpen(!open)}
          className="md:hidden h-11 w-11 -mr-2 grid place-items-center text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/60 rounded-md"
          aria-label={open ? "Close menu" : "Open menu"}
          aria-expanded={open}
          aria-controls="mobile-nav"
        >
          {open ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      <AnimatePresence>
        {open && (
          <motion.div
            id="mobile-nav"
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
            className="md:hidden border-t border-border/40 bg-background/95 backdrop-blur-xl"
          >
            <ul className="px-5 py-3 space-y-1">
              {links.map((l) => (
                <li key={l.href}>
                  <a
                    onClick={() => setOpen(false)}
                    href={l.href}
                    className="block py-3 text-foreground/85 hover:text-foreground font-display text-lg"
                  >
                    {l.label}
                  </a>
                </li>
              ))}
            </ul>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.nav>
  );
}