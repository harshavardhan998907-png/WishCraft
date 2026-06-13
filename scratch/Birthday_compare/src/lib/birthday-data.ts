import memory1 from "@/assets/memory-1.jpg";
import memory2 from "@/assets/memory-2.jpg";
import memory3 from "@/assets/memory-3.jpg";
import memory4 from "@/assets/memory-4.jpg";
import memory5 from "@/assets/memory-5.jpg";
import memory6 from "@/assets/memory-6.jpg";

export const birthdayData = {
  recipient: {
    name: "Amelia",
    nickname: "Mia",
    relationship: "my dearest friend",
    birthday: "December 4th",
    age: 28,
  },
  sender: {
    name: "Daniel",
  },
  tagline: "A quiet love letter, written in light.",
  message:
    "Today the world feels a little brighter — because the day it learned your name is the day everything began to glow. Here is a little corner of the internet, made entirely of you.",
  quote: {
    text: "Count not the candles… see the lights they give. Count not the years, but the life you live.",
    author: "William Arthur Ward",
  },
  letter: `Mia,

There is a particular kind of magic in knowing someone for long enough that their laugh becomes a song you can hum in silence. You are that song to me.

I hope this year is generous with you. I hope it brings you slow mornings, loud dinners, soft music, and the kind of weather that makes you want to walk somewhere with no destination. I hope you finally finish that book. I hope you take the trip.

And on the nights it isn't generous — I hope you remember that you have, in me, a permanent address.

Happy birthday, my favourite person.`,
  secret: {
    title: "There is one more thing…",
    body: "Look out your window at 8:47pm tonight. I sent something into the sky for you. — D.",
  },
  memories: [
    { src: memory1, caption: "Golden hour, the rooftop, July." },
    { src: memory2, caption: "Twenty‑seven candles, one wish." },
    { src: memory3, caption: "That dinner that never ended." },
    { src: memory4, caption: "Midnight, and a toast to nothing." },
    { src: memory5, caption: "Letters we still write by hand." },
    { src: memory6, caption: "Sparklers on the shoreline." },
  ],
  timeline: [
    { year: "2012", title: "We met", body: "A rainy library, two wrong books, one right friendship." },
    { year: "2015", title: "First road trip", body: "Three states, one mixtape, infinite singing." },
    { year: "2018", title: "The big move", body: "New city, same window, still calling at midnight." },
    { year: "2021", title: "Your first show", body: "Front row. I cried twice. Don't tell anyone." },
    { year: "2024", title: "And here we are", body: "Another year of being insufferably proud of you." },
  ],
  constellation: [
    { x: 12, y: 22, title: "First coffee", body: "You ordered something impossible. The barista loved you." },
    { x: 28, y: 60, title: "Rainy walk", body: "We made up a language. We still use three words from it." },
    { x: 45, y: 18, title: "The proposal", body: "You said yes to being my person, in a noisy bar, over pasta." },
    { x: 58, y: 72, title: "Sunday calls", body: "Forty‑seven minutes average. The world's longest voicemail." },
    { x: 72, y: 38, title: "Your laugh", body: "A small public hazard. A national treasure." },
    { x: 86, y: 65, title: "Tonight", body: "A page made of you. Click everything. Stay a while." },
  ],
};

export type BirthdayData = typeof birthdayData;