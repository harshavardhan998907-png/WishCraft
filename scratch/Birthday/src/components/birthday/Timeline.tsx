import { motion } from "framer-motion";
import { Section } from "./Section";

interface Item { year: string; title: string; body: string }

export function Timeline({ items }: { items: Item[] }) {
  return (
    <Section
      id="journey"
      eyebrow="Our timeline"
      title={<>A few <em className="font-display italic text-gradient-gold">chapters</em></>}
      subtitle="A handful of the moments that made the rest of them possible."
    >
      <div className="relative mx-auto max-w-3xl pl-7 md:pl-0">
        {/* center line */}
        <div className="absolute left-[10px] md:left-1/2 top-0 bottom-0 w-px bg-gradient-to-b from-transparent via-gold/40 to-transparent md:-translate-x-px" />

        <ul className="space-y-12 sm:space-y-14 md:space-y-24">
          {items.map((item, i) => {
            const right = i % 2 === 1;
            return (
              <motion.li
                key={i}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.4 }}
                transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                className={`relative md:grid md:grid-cols-2 md:gap-12 ${right ? "md:[&>*:first-child]:col-start-2" : ""}`}
              >
                {/* dot */}
                <span className="absolute -left-[22px] md:left-1/2 md:-translate-x-1/2 top-2 h-3 w-3 rounded-full bg-gold shadow-[0_0_20px_var(--gold)]" />

                <div className={`${right ? "md:text-left md:pl-10" : "md:text-right md:pr-10"} text-left`}>
                  <div className="font-script text-2xl sm:text-3xl text-gradient-gold mb-1">{item.year}</div>
                  <h3 className="font-display text-xl sm:text-2xl md:text-3xl text-foreground mb-2">{item.title}</h3>
                  <p className="text-sm sm:text-base text-muted-foreground font-light leading-relaxed">{item.body}</p>
                </div>
              </motion.li>
            );
          })}
        </ul>
      </div>
    </Section>
  );
}