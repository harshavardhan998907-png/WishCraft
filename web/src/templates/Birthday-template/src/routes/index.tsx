import { createFileRoute } from "@tanstack/react-router";
import { MotionConfig } from "framer-motion";
import { birthdayData } from "@/lib/birthday-data";
import { Nav } from "@/components/birthday/Nav";
import { Hero } from "@/components/birthday/Hero";
import { WishMessage } from "@/components/birthday/WishMessage";
import { Quote } from "@/components/birthday/Quote";
import { MemoryGallery } from "@/components/birthday/MemoryGallery";
import { Timeline } from "@/components/birthday/Timeline";
import { Letter } from "@/components/birthday/Letter";
import { SecretSurprise } from "@/components/birthday/SecretSurprise";
import { Constellation } from "@/components/birthday/Constellation";
import { Celebration } from "@/components/birthday/Celebration";
import { Footer } from "@/components/birthday/Footer";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: `Happy Birthday, ${birthdayData.recipient.name} — A Letter in Light` },
      { name: "description", content: `A premium birthday wish website made for ${birthdayData.recipient.name}.` },
      { property: "og:title", content: `Happy Birthday, ${birthdayData.recipient.name}` },
      { property: "og:description", content: birthdayData.tagline },
    ],
  }),
  component: Index,
});

function Index() {
  const d = birthdayData;
  return (
    <MotionConfig reducedMotion="user">
      <main className="relative bg-background text-foreground overflow-x-hidden">
        <Nav name={d.recipient.name} />
      <Hero
        name={d.recipient.name}
        nickname={d.recipient.nickname}
        tagline={d.tagline}
        date={d.recipient.birthday}
      />
        {d.message && <WishMessage message={d.message} recipient={d.recipient.name} />}
        {d.quote?.text && <Quote text={d.quote.text} author={d.quote.author} />}
        {d.memories?.length > 0 && <MemoryGallery memories={d.memories} />}
        {d.timeline?.length > 0 && <Timeline items={d.timeline} />}
        {d.letter && <Letter letter={d.letter} sender={d.sender.name} />}
        {d.secret?.body && <SecretSurprise title={d.secret.title} body={d.secret.body} />}
        {d.constellation?.length > 0 && <Constellation stars={d.constellation} />}
        <Celebration name={d.recipient.name} />
        <Footer sender={d.sender.name} recipient={d.recipient.name} />
      </main>
    </MotionConfig>
  );
}
