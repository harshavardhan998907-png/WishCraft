# WishCraft UI/UX Rules

These rules are global project standards for every page, component, modal, template page, dashboard page, settings page, editor page, authentication page, admin page, and future feature.

## Product Philosophy

WishCraft is an emotional celebration platform, not a SaaS analytics platform.

Users come to create memories, celebrate loved ones, build birthday experiences, build wedding experiences, build anniversary experiences, and share emotional moments.

Every UI decision should reinforce emotion, celebration, storytelling, and memories. Avoid enterprise software patterns, analytics-dashboard framing, admin-tool density, and technical clutter unless the surface is explicitly administrative.

## Responsive Standard

Every implementation must be fully responsive and verified at:

| Category | Widths |
| --- | --- |
| Mobile | 320px, 360px, 375px, 390px, 412px |
| Tablet | 768px, 820px |
| Desktop | 1280px, 1366px, 1440px, 1536px, 1920px |
| Ultra-wide | 2560px |

Completion requires no horizontal scrolling, no clipping, no text overflow, no broken layouts, no fixed-width layouts, responsive typography/cards/modals/navigation/dropdowns, touch-friendly interactions, and spacing that feels intentional from mobile through ultra-wide.

## Visual Direction

Prefer clean layouts, strong hierarchy, generous whitespace, large previews, large thumbnails, modern cards, and premium visual design.

Avoid clutter, dense layouts, information overload, dashboard-like appearance, excessive statistics, and metadata that does not help users create, edit, preview, or share.

## Information Density

Do not add information simply because space exists. Avoid template IDs, excessive timestamps, redundant metadata, unnecessary statistics, and technical information. If information does not improve a user's creation, editing, previewing, or sharing decision, remove it.

## Navigation

Authenticated top-level navigation stays minimal:

- Dashboard
- My Wishes
- Templates
- Create Wish

Normal user account dropdown:

- Theme Toggle
- Logout

Admin account dropdown:

- Theme Toggle
- Admin Dashboard
- Logout

Do not add unnecessary top-level navigation items.

## Dashboard

The dashboard should feel like a celebration studio, a creative workspace, and a memory creation platform. It should not feel like analytics software, admin software, or business reporting software.

Preferred section order:

1. Welcome Section
2. Continue Editing
3. Quick Create
4. My Wishes
5. Recent Activity
6. Analytics

Analytics must always be visually secondary.

## Templates Page

The templates page should feel closer to Netflix, Apple, and Canva than to a spreadsheet, admin panel, or data table.

Prioritize large previews, large template thumbnails, visual browsing, and fast discovery. Users should see the design before the details. Avoid excessive text, excessive statistics, and metadata overload.

## Motion

WishCraft motion should feel premium and cinematic. Use smooth page transitions, card reveals, elegant hover effects, modern micro-interactions, and premium modal animations. Typical durations should stay around 0.3s to 0.6s.

Avoid animation spam, excessive stagger effects, multiple competing animations, continuous distracting movement, excessive blur, and GPU-heavy decorative effects, especially on mobile. Motion should guide users, never distract them.

## Cards

Cards should prefer a large image or preview, a clear title, and primary actions: Preview, Edit, Share.

Avoid information-heavy cards, tiny action buttons, and excessive metadata. Users should understand the content instantly.

## Mobile

Mobile is equal to desktop. Use large touch targets, comfortable spacing, fast navigation, minimal clutter, and fewer decorative elements when needed. Prioritize usability.

## Accessibility

Interfaces must be keyboard accessible, include proper focus states, accessible labels, screen-reader-friendly structure, and contrast that meets accessibility expectations.

## Final Decision Rule

When making a design decision, choose cleaner, simpler, more emotional, more visual, and more premium over more information, more statistics, more settings, or more complexity.

The implementation is not complete until the experience feels premium, modern, responsive, emotional, and celebration-focused across mobile, tablet, desktop, and ultra-wide screens.
