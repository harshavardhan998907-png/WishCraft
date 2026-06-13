import { useMemo } from "react";

export function FloatingParticles({ count = 24 }: { count?: number }) {
  const particles = useMemo(
    () =>
      Array.from({ length: count }).map((_, i) => ({
        id: i,
        left: Math.random() * 100,
        size: 2 + Math.random() * 5,
        delay: Math.random() * 8,
        duration: 7 + Math.random() * 8,
        drift: -40 + Math.random() * 80,
        hue: Math.random() > 0.5 ? "var(--gold)" : "var(--champagne)",
      })),
    [count],
  );

  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      {particles.map((p) => (
        <span
          key={p.id}
          className="absolute bottom-0 rounded-full animate-float-up"
          style={{
            left: `${p.left}%`,
            width: p.size,
            height: p.size,
            background: p.hue,
            filter: "blur(0.5px)",
            boxShadow: `0 0 ${p.size * 3}px ${p.hue}`,
            animationDelay: `${p.delay}s`,
            animationDuration: `${p.duration}s`,
            // @ts-expect-error css var
            "--drift": `${p.drift}px`,
          }}
        />
      ))}
    </div>
  );
}