# Project Overview

## Project Name

Template Hub

## Purpose

Template Hub helps users create personalized animated wish pages for special occasions. Instead of sending plain text messages or static cards, users build short cinematic experiences with names, custom messages, photos, motion effects, and optional music.

## Vision

The product vision is to make emotionally expressive digital greetings feel premium, personal, and easy to share. A user should be able to move from idea to shareable celebration link in minutes while the final result feels more polished than a simple social post.

## Problem Solved

Common greeting workflows are fragmented:

- Text greetings feel generic.
- Static cards lack emotional motion.
- Video editors are too heavy for quick wishes.
- Sharing media often creates large files instead of clean links.
- Payment and premium upgrade flows are usually bolted on after the UI.

Template Hub solves this by turning a template selection into a hosted, animated, time-limited public experience.

## Target Users

| User | Need |
| --- | --- |
| Friends and family | Create memorable personal wishes quickly |
| Event organizers | Send polished digital greetings for groups |
| Couples and families | Share wedding, anniversary, and festival wishes |
| Students | Send graduation, farewell, and birthday pages |
| Small creators | Offer paid premium wish templates |

## Key Features

- Home page with cinematic product positioning.
- Template marketplace with live visual cards.
- Occasion library for browsing by celebration type.
- Pricing tier presentation for free, standard, and premium templates.
- Authentication with Supabase email/password.
- Protected editor, preview, dashboard, and share creation routes.
- Live preview while editing a wish.
- Photo upload to public Supabase Storage.
- Premium custom music upload.
- Free wish activation without payment.
- Paid wish activation through Razorpay.
- Public recipient route with tap-to-open reveal.
- Open Graph metadata for shared wishes.
- Expiry handling for 7-day active links.
- Dark/light mode toggle with persistence.
- Toast notifications and offline banner.

## Unique Selling Points

- Cinematic template rendering rather than static cards.
- Shareable public URLs instead of generated image files.
- 7-day link lifecycle for urgency and freshness.
- Payment flow is integrated into the wish activation model.
- Templates are code-rendered React components, enabling deep animation and layout control.
- Demo template fallback keeps browsing resilient when the backend is unavailable.

## Design Philosophy

The UI uses a "celebration studio" design language:

- Warm cream backgrounds in light mode.
- Premium dark surfaces in dark mode.
- Strong ink typography.
- Lavender primary action color.
- Rounded cards with restrained shadows.
- Motion as emotional feedback, not decoration alone.
- Template previews are visually inspectable and occasion-specific.

## Dark and Light Mode Support

Theme support is implemented with:

- `ThemeProvider`
- `template-hub-theme` in `localStorage`
- `dark` class on `document.documentElement`
- Tailwind `darkMode: 'class'`
- Component-level dark styles for cards, forms, navigation, previews, and template frames

The light palette was restored from previous screenshots: cream page backgrounds, white cards, lavender buttons, pastel gradients, and dark ink text. Dark mode uses dedicated surfaces rather than global text hacks.

## Animation System

Animations are powered by Framer Motion. Motion appears in:

- Hero panels
- Template cards
- Floating ribbons
- Orbit glows
- Shimmer sweeps
- Template frame particles
- Photo gallery motion
- Tap-to-open reveal page
- Auth tab transitions

## Cinematic UI Concept

The application treats each wish as a mini-scene. Templates are not just skins; they define atmosphere:

- Birthday: confetti, candles, balloons, glow
- Wedding: rings, petals, gold light
- Anniversary: hearts, romance, soft particles
- Festival: lamps, sparks, warm color
- Graduation: stars, caps, bright celebration

