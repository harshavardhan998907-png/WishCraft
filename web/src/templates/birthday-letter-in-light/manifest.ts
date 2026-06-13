import type { TemplateManifest } from '../../template-engine/types'

export const birthdayLetterInLightManifest: TemplateManifest = {
  id: 'birthday-letter-in-light',
  slug: 'birthday-letter-in-light',
  name: 'Birthday Letter In Light',
  description:
    'A premium, animated birthday wish — a love letter written in light, particles, and stars. Features parallax hero, memory gallery, interactive constellation, timeline, personal letter, secret surprise, and confetti celebration.',
  category: 'birthday',
  version: '1.0.0',
  author: 'TemplateHub',
  authorType: 'founder',
  thumbnailUrl: '/templates/birthday-letter-in-light/thumbnail.png',
  rendererType: 'react-component',
  componentKey: 'BirthdayLetterInLight',
  price: 0,
  tier: 'premium',
  status: 'published',
  editableFields: ['recipientName', 'senderName', 'message', 'photos', 'customData'],
  supportedFeatures: ['animation', 'photos', 'custom_message', 'gallery', 'responsive'],
  schema: [
    // ── Basic Information ──────────────────────────────────────────────────
    { id: '_section_basic', label: 'Basic Information', type: 'section' },
    {
      id: 'recipient_name',
      label: "Recipient's Name",
      type: 'text',
      required: true,
      placeholder: 'e.g. Amelia',
      helper: "The birthday person's name — displayed prominently throughout the wish.",
    },
    {
      id: 'sender_name',
      label: 'Your Name',
      type: 'text',
      required: true,
      placeholder: 'e.g. Daniel',
      helper: 'Your name — appears in the letter and footer.',
    },
    {
      id: 'birthday_date',
      label: 'Birthday Date',
      type: 'text',
      required: true,
      placeholder: 'e.g. December 4th',
      helper: 'Displayed below the name on the hero section.',
    },
    {
      id: 'nickname',
      label: 'Nickname',
      type: 'text',
      placeholder: 'e.g. Mia',
      helper: 'Optional — shown as "also known as…" below the name.',
    },

    // ── Hero Section ──────────────────────────────────────────────────────
    { id: '_section_hero', label: 'Hero Section', type: 'section' },
    {
      id: 'tagline',
      label: 'Hero Tagline',
      type: 'textarea',
      placeholder: 'A quiet love letter, written in light.',
      maxLength: 200,
      helper: 'A poetic one-liner displayed beneath the name.',
    },
    {
      id: 'message',
      label: 'Birthday Message',
      type: 'textarea',
      placeholder:
        'Today the world feels a little brighter — because the day it learned your name is the day everything began to glow.',
      maxLength: 300,
      helper: 'The main wish message — revealed word by word with a blur animation.',
    },

    // ── Quote ─────────────────────────────────────────────────────────────
    { id: '_section_quote', label: 'Quote', type: 'section' },
    {
      id: 'useDefaultQuote',
      label: 'Use the default quote',
      type: 'toggle',
      defaultValue: true,
      helper: 'Toggle off to write your own quote.',
    },
    {
      id: 'quote_text',
      label: 'Quote Text',
      type: 'textarea',
      maxLength: 300,
      placeholder: 'Count not the candles…',
      dependsOn: { field: 'useDefaultQuote', value: false },
    },
    {
      id: 'quote_author',
      label: 'Quote Author',
      type: 'text',
      placeholder: 'e.g. William Arthur Ward',
      dependsOn: { field: 'useDefaultQuote', value: false },
    },

    // ── Personal Letter ──────────────────────────────────────────────────
    { id: '_section_letter', label: 'Personal Letter', type: 'section' },
    {
      id: 'useDefaultLetter',
      label: 'Use the default letter',
      type: 'toggle',
      defaultValue: true,
      helper: 'Toggle off to write your own personal letter.',
    },
    {
      id: 'letter_content',
      label: 'Your Letter',
      type: 'textarea',
      maxLength: 2000,
      placeholder: 'Dear friend,\n\nThere is a particular kind of magic…',
      dependsOn: { field: 'useDefaultLetter', value: false },
    },

    // ── Secret Surprise ─────────────────────────────────────────────────
    { id: '_section_secret', label: 'Secret Surprise', type: 'section' },
    {
      id: 'useDefaultSecret',
      label: 'Use the default secret',
      type: 'toggle',
      defaultValue: true,
      helper: 'Toggle off to write your own secret message.',
    },
    {
      id: 'secret_title',
      label: 'Secret Title',
      type: 'text',
      placeholder: 'There is one more thing…',
      dependsOn: { field: 'useDefaultSecret', value: false },
    },
    {
      id: 'secret_message',
      label: 'Secret Message',
      type: 'textarea',
      maxLength: 500,
      placeholder: 'Look out your window at 8:47pm tonight…',
      dependsOn: { field: 'useDefaultSecret', value: false },
    },

    // ── Timeline ─────────────────────────────────────────────────────────
    { id: '_section_timeline', label: 'Timeline', type: 'section' },
    {
      id: 'useDefaultTimeline',
      label: 'Use the default timeline',
      type: 'toggle',
      defaultValue: true,
      helper: 'Toggle off to add your own milestone events.',
    },
    {
      id: 'timeline_events',
      label: 'Timeline Events',
      type: 'repeater',
      dependsOn: { field: 'useDefaultTimeline', value: false },
      helper: 'Add key milestones in your story together.',
      subFields: [
        { id: 'year', label: 'Year', type: 'text', placeholder: 'e.g. 2020' },
        { id: 'title', label: 'Title', type: 'text', placeholder: 'e.g. We met' },
        {
          id: 'description',
          label: 'Description',
          type: 'textarea',
          placeholder: 'A rainy library, two wrong books…',
          maxLength: 200,
        },
      ],
    },

    // ── Memory Constellation ─────────────────────────────────────────────
    { id: '_section_constellation', label: 'Memory Constellation', type: 'section' },
    {
      id: 'useDefaultConstellation',
      label: 'Use the default constellation',
      type: 'toggle',
      defaultValue: true,
      helper: 'Toggle off to add your own star memories.',
    },
    {
      id: 'constellation_messages',
      label: 'Constellation Stars',
      type: 'repeater',
      dependsOn: { field: 'useDefaultConstellation', value: false },
      helper: 'Each star is an interactive memory on the night sky.',
      subFields: [
        { id: 'title', label: 'Title', type: 'text', placeholder: 'e.g. First coffee' },
        {
          id: 'message',
          label: 'Memory',
          type: 'textarea',
          placeholder: 'You ordered something impossible…',
          maxLength: 200,
        },
      ],
    },

    // ── Memory Gallery ──────────────────────────────────────────────────
    { id: '_section_gallery', label: 'Memory Gallery', type: 'section' },
    {
      id: 'useDefaultMemories',
      label: 'Use the default gallery photos',
      type: 'toggle',
      defaultValue: true,
      helper: 'Toggle off to upload your own photos.',
    },
    {
      id: 'photos',
      label: 'Memory Photos',
      type: 'gallery',
      maxItems: 10,
      dependsOn: { field: 'useDefaultMemories', value: false },
      helper: 'Upload up to 10 photos for the masonry gallery.',
    },
    {
      id: 'memory_captions',
      label: 'Photo Captions',
      type: 'repeater',
      dependsOn: { field: 'useDefaultMemories', value: false },
      helper: 'Add a caption for each uploaded photo (in order).',
      subFields: [
        { id: 'caption', label: 'Caption', type: 'text', placeholder: 'Golden hour, the rooftop, July.' },
      ],
    },
  ],
}
