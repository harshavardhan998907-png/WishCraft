import { MotionConfig } from 'framer-motion'
import { birthdayData } from '../Birthday-template/src/lib/birthday-data'
import { Nav } from '../Birthday-template/src/components/birthday/Nav'
import { Hero } from '../Birthday-template/src/components/birthday/Hero'
import { WishMessage } from '../Birthday-template/src/components/birthday/WishMessage'
import { Quote } from '../Birthday-template/src/components/birthday/Quote'
import { MemoryGallery } from '../Birthday-template/src/components/birthday/MemoryGallery'
import { Timeline } from '../Birthday-template/src/components/birthday/Timeline'
import { Letter } from '../Birthday-template/src/components/birthday/Letter'
import { SecretSurprise } from '../Birthday-template/src/components/birthday/SecretSurprise'
import { Constellation } from '../Birthday-template/src/components/birthday/Constellation'
import { Celebration } from '../Birthday-template/src/components/birthday/Celebration'
import { Footer } from '../Birthday-template/src/components/birthday/Footer'
import type { TemplateProps } from '../../template-engine/types'
import './birthday-styles.css'

export default function BirthdayLetterInLight({
  recipientName,
  senderName,
  message,
  photos,
  customData,
}: TemplateProps) {
  // Extract custom fields from customData with fallbacks to base values
  const recipient = {
    name: recipientName || birthdayData.recipient.name,
    nickname: (customData?.nickname as string) || birthdayData.recipient.nickname,
    relationship: birthdayData.recipient.relationship,
    birthday: (customData?.birthday_date as string) || birthdayData.recipient.birthday,
    age: birthdayData.recipient.age,
  }

  const sender = {
    name: senderName || birthdayData.sender.name,
  }

  const tagline =
    customData?.tagline !== undefined
      ? (customData.tagline as string)
      : birthdayData.tagline

  const mainMessage = message || birthdayData.message

  // Quote
  const useDefaultQuote = customData?.useDefaultQuote !== false
  const quote = {
    text: useDefaultQuote ? birthdayData.quote.text : (customData?.quote_text as string) || '',
    author: useDefaultQuote ? birthdayData.quote.author : (customData?.quote_author as string) || '',
  }

  // Letter
  const useDefaultLetter = customData?.useDefaultLetter !== false
  const letter = useDefaultLetter ? birthdayData.letter : (customData?.letter_content as string) || ''

  // Secret
  const useDefaultSecret = customData?.useDefaultSecret !== false
  const secret = {
    title: useDefaultSecret ? birthdayData.secret.title : (customData?.secret_title as string) || '',
    body: useDefaultSecret ? birthdayData.secret.body : (customData?.secret_message as string) || '',
  }

  // Timeline
  const useDefaultTimeline = customData?.useDefaultTimeline !== false
  const timelineRaw = customData?.timeline_events as
    | Array<{ year: string; title: string; description: string }>
    | undefined
  const timeline = useDefaultTimeline
    ? birthdayData.timeline
    : (timelineRaw || []).map((item) => ({
        year: item.year || '',
        title: item.title || '',
        body: item.description || '',
      }))

  // Constellation
  const useDefaultConstellation = customData?.useDefaultConstellation !== false
  const constellationRaw = customData?.constellation_messages as
    | Array<{ title: string; message: string }>
    | undefined
  
  const baseConstellation = birthdayData.constellation
  const constellation = useDefaultConstellation
    ? baseConstellation
    : (constellationRaw || []).map((item, idx) => {
        // reuse standard coordinates to position the custom star nodes beautifully
        const defaultCoords = baseConstellation[idx % baseConstellation.length] || { x: 50, y: 50 }
        return {
          x: defaultCoords.x,
          y: defaultCoords.y,
          title: item.title || '',
          body: item.message || '',
        }
      })

  // Memories/Gallery
  const useDefaultMemories = customData?.useDefaultMemories !== false
  const captionsRaw = customData?.memory_captions as Array<{ caption: string }> | undefined

  let memories = birthdayData.memories
  if (!useDefaultMemories && photos && photos.length > 0) {
    memories = photos.map((url, idx) => {
      const capObj = captionsRaw?.[idx]
      return {
        src: url,
        caption: capObj?.caption || `Memory ${idx + 1}`,
      }
    })
  }

  return (
    <div className="birthday-letter-in-light min-h-screen text-foreground">
      <MotionConfig reducedMotion="user">
        <main className="relative bg-background text-foreground overflow-x-hidden">
          <Nav name={recipient.name} />
          <Hero
            name={recipient.name}
            nickname={recipient.nickname}
            tagline={tagline}
            date={recipient.birthday}
          />
          {mainMessage && <WishMessage message={mainMessage} recipient={recipient.name} />}
          {quote.text && <Quote text={quote.text} author={quote.author} />}
          {memories.length > 0 && <MemoryGallery memories={memories} />}
          {timeline.length > 0 && <Timeline items={timeline} />}
          {letter && <Letter letter={letter} sender={sender.name} />}
          {secret.body && <SecretSurprise title={secret.title} body={secret.body} />}
          {constellation.length > 0 && <Constellation stars={constellation} />}
          <Celebration name={recipient.name} />
          <Footer sender={sender.name} recipient={recipient.name} />
        </main>
      </MotionConfig>
    </div>
  )
}
