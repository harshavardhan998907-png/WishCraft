export function Footer({ sender, recipient }: { sender: string; recipient: string }) {
  return (
    <footer className="relative px-5 md:px-10 py-16 border-t border-border/40">
      <div className="mx-auto max-w-5xl flex flex-col md:flex-row md:items-center md:justify-between gap-6 text-center md:text-left">
        <div>
          <p className="font-display italic text-2xl text-foreground">
            for <span className="text-gradient-gold">{recipient}</span>, with all of it.
          </p>
          <p className="mt-1 text-xs uppercase tracking-[0.4em] text-muted-foreground">
            handmade by {sender}
          </p>
        </div>
        <div className="text-xs uppercase tracking-[0.3em] text-muted-foreground/60">
          a TemplateHub birthday
        </div>
      </div>
    </footer>
  );
}