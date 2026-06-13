import { motion } from "framer-motion";
import { Section } from "./Section";

export function WishMessage({ message, recipient }: { message: string; recipient: string }) {
  const words = message.split(" ");
  return (
    <Section
      id="wish"
      eyebrow="A wish"
      title={
        <>
          For you, <em className="text-gradient-gold not-italic font-display italic">{recipient}</em>
        </>
      }
    >
      <p className="font-display italic text-xl sm:text-2xl md:text-4xl leading-relaxed text-balance text-foreground/90 max-w-3xl mx-auto">
        {words.map((w, i) => (
          <motion.span
            key={i}
            initial={{ opacity: 0, y: 10, filter: "blur(6px)" }}
            whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            viewport={{ once: true, amount: 0.4 }}
            transition={{ duration: 0.5, delay: i * 0.04 }}
            className="inline-block mr-[0.25em]"
          >
            {w}
          </motion.span>
        ))}
      </p>
    </Section>
  );
}