# Template Hub - Complete Project Documentation

> Single-file professional documentation for the complete Template Hub project. This document describes the real implementation in this repository, including web frontend, mobile shell, Supabase database, storage buckets, Edge Functions, Razorpay payment flow, theme system, template system, development workflow, deployment, security, and future maintenance.

---

## IDENTITY AND CONTEXT

**Project Name:** Template Hub

**Project Type:** Full-stack digital wish-page platform

**Primary Product:** A cinematic web application where users create personalized animated wish pages for loved ones.

**Core Idea:** Users choose a template, customize recipient/sender names, message, photos, and optional music, then publish a shareable link that stays live for 7 days. Recipients open the link and see an animated, interactive wish experience.

**Current Repository Scope:**

- Production-focused React web app in `web/`
- Supabase backend in `supabase/`
- Early React Native shell in `mobile/`
- Full documentation in `docs/`

---

## PROJECT VISION

Template Hub turns ordinary greetings into premium digital experiences. Instead of sending a plain WhatsApp message, image, or video, users can create a hosted, animated wish page with cinematic motion, photos, music, personalized text, and a clean share URL.

The long-term vision is a template marketplace for celebrations, where free and premium templates can be monetized through paid wish experiences.

---

## PROBLEM SOLVED

Traditional digital wishes have common limitations:

- Plain text greetings feel generic.
- Static greeting cards do not feel immersive.
- Video editing is too slow for casual users.
- Social media posts are not private or personalized enough.
- File-based sharing is inconvenient.
- Paid/premium greeting experiences need secure payment verification.
- Temporary event pages need automated expiry.

Template Hub solves these by providing:

- Template-driven creation
- Custom message and media support
- Shareable public links
- 7-day active lifecycle
- Cinematic animations
- Premium payment flow
- Supabase-backed authentication, data, and storage

---

## TARGET USERS

| User Type | Use Case |
| --- | --- |
| Friends and family | Send birthday, anniversary, farewell, graduation, and festival wishes |
| Couples | Create wedding or romantic wish pages |
| Students | Send graduation or farewell wishes |
| Event organizers | Share polished greeting links |
| Template creators | Future marketplace opportunity |
| Small businesses | Future branded greetings and event campaigns |

---

## CORE FEATURES

### Public Features

- Landing page with cinematic hero sections
- Occasion Library
- Template showcase
- Pricing cards
- Template browsing page
- Public wish view route: `/w/:slug`
- Expired wish page
- Dark and light mode
- Responsive layouts

### Authenticated Features

- Login and signup
- Protected editor
- Protected preview
- Protected dashboard
- Protected share page
- Wish creation
- Photo uploads
- Premium music uploads
- Dashboard wish management

### Backend Features

- Supabase Auth
- Profiles table linked to `auth.users`
- Templates catalog
- Wishes table
- Orders table
- Music tracks table
- Public storage buckets
- RLS policies
- Razorpay order creation
- Razorpay payment verification
- Paid wish activation RPC
- Scheduled wish expiry Edge Function
- Backend repair migration
- Backend verification SQL

---

## UNIQUE SELLING POINTS

- Animated wish pages instead of static cards
- Shareable URL instead of downloadable file
- Public recipient experience with tap-to-open reveal
- Free and paid template tiers
- Premium custom music support
- Photo memory gallery
- Time-limited 7-day wish lifecycle
- Light/dark premium UI
- Supabase and Razorpay integration
- Template components are real React scenes, not just image skins

---

## TECH STACK

| Layer | Technology | Why It Is Used |
| --- | --- | --- |
| Web Frontend | React 18 | Component-driven UI and stateful interaction |
| Language | TypeScript | Type safety for domain models and components |
| Build Tool | Vite 6 | Fast development server and optimized production builds |
| Routing | React Router DOM v6 | Public and protected client-side routes |
| Styling | Tailwind CSS | Utility-first design system and dark mode support |
| Animation | Framer Motion | Cinematic reveal animations, particles, cards, glows |
| State Management | Zustand | Small global stores for auth, editor, and toast state |
| Backend | Supabase | Auth, Postgres, Storage, and Edge Functions |
| Database | Supabase Postgres | Durable relational schema |
| Storage | Supabase Storage | Public media delivery for photos and music |
| Payments | Razorpay | Paid template checkout |
| Metadata | React Helmet Async | Open Graph metadata for public wish pages |
| IDs | nanoid | Short public wish slug generation |
| Mobile | React Native shell | Future app expansion |

---

## REPOSITORY STRUCTURE

```txt
template-hub/
  README.md
  TEMPLATE_HUB_COMPLETE_PROJECT_DOCUMENTATION.md
  docs/
    01-project-overview.md
    02-architecture.md
    03-frontend-theme-templates.md
    04-database-supabase.md
    05-flows-api.md
    06-security-performance-errors.md
    07-deployment-development.md
    08-roadmap-maintenance.md
    09-component-file-reference.md
  web/
    src/
      components/
        editor/
        layout/
        templates/
        ui/
      hooks/
      lib/
      pages/
      store/
      theme/
      types/
      App.tsx
      main.tsx
      index.css
    package.json
    tailwind.config.ts
    vite.config.ts
    tsconfig.json
  mobile/
    App.tsx
    src/
      navigation/
      screens/
      lib/
      types/
  supabase/
    migrations/
    functions/
    verify_backend.sql
    README.md
```

---

## WEB APPLICATION ARCHITECTURE

### Provider Tree

```txt
main.tsx
  React.StrictMode
    HelmetProvider
      ThemeProvider
        BrowserRouter
          App
            PageWrapper
              Navbar
              Routes
              ToastViewport
```

### Route Architecture

| Route | Component | Access | Purpose |
| --- | --- | --- | --- |
| `/` | `Home` | Public | Landing page |
| `/browse` | `Browse` | Public | Template marketplace |
| `/auth` | `Auth` | Public | Login and signup |
| `/editor/:templateSlug` | `Editor` | Protected | Wish customization |
| `/preview` | `Preview` | Protected | Final preview and create/pay |
| `/dashboard` | `Dashboard` | Protected | User wish list |
| `/share/:slug` | `Share` | Protected | Share link after creation |
| `/w/:slug` | `WishPage` | Public | Recipient wish experience |
| `/expired` | `Expired` | Public | Expired wish message |
| `*` | `NotFound` | Public | 404 fallback |

### Protected Routes

`ProtectedRoute` checks `useAuth()`:

- Shows loading while auth is resolving
- Redirects anonymous users to `/auth`
- Renders children for authenticated users

---

## FRONTEND FOLDER DETAILS

### `web/src/pages/`

| File | Purpose |
| --- | --- |
| `Home.tsx` | Landing page with hero, flow cards, occasion library, template showcase, pricing |
| `Browse.tsx` | Template marketplace with filters and animated cards |
| `Auth.tsx` | Login/signup form |
| `Editor.tsx` | Template customization UI |
| `Preview.tsx` | Final preview, free publish, paid checkout |
| `Dashboard.tsx` | User wish list, status, copy link, delete |
| `Share.tsx` | Shows created wish link |
| `WishPage.tsx` | Public recipient experience |
| `Expired.tsx` | Expired wish page |
| `NotFound.tsx` | 404 page |

### `web/src/components/layout/`

| File | Purpose |
| --- | --- |
| `Navbar.tsx` | Brand, navigation, login/logout, dashboard, theme toggle |
| `PageWrapper.tsx` | Navbar, offline banner, fullscreen route handling, toast viewport |
| `ProtectedRoute.tsx` | Auth guard |
| `Footer.tsx` | Landing page footer |

### `web/src/components/ui/`

| File | Purpose |
| --- | --- |
| `Button.tsx` | Reusable buttons with variants and loading |
| `Card.tsx` | Shared card surface |
| `Badge.tsx` | Tier, occasion, status badges |
| `Input.tsx` | Labeled input |
| `Textarea.tsx` | Labeled textarea with count |
| `ImageUpload.tsx` | Photo upload and thumbnails |
| `Modal.tsx` | Dialog overlay |
| `Skeleton.tsx` | Loading skeleton |
| `ThemeToggle.tsx` | Animated theme switch |
| `Toast.tsx` | Toast display |
| `MotionDecor.tsx` | Floating ribbons, orbit glows, shimmer sweep |

### `web/src/components/templates/`

| File | Purpose |
| --- | --- |
| `registry.ts` | Maps database `component_name` to lazy React components |
| `TemplateFrame.tsx` | Shared full-screen wish template shell |
| `TemplateScenePreview.tsx` | Browse/showcase card preview scenes |
| `BirthdayClassic.tsx` | Free birthday template |
| `BirthdayGlow.tsx` | Standard birthday template |
| `WeddingElegant.tsx` | Premium wedding template |
| `AnniversaryRomantic.tsx` | Standard anniversary template |
| `FestivalDiwali.tsx` | Premium festival template |
| `GraduationCelebration.tsx` | Free graduation template |

### `web/src/hooks/`

| Hook | Purpose |
| --- | --- |
| `useAuth` | Supabase auth session, profile fetching, sign up, login, logout |
| `useTemplates` | Loads templates from Supabase with demo fallback |
| `useWish` | Loads public wish by slug with joined template |

### `web/src/store/`

| Store | Purpose |
| --- | --- |
| `authStore` | Global user and profile |
| `editorStore` | Current template, names, message, photos, music |
| `toastStore` | Timed success/error/info messages |

### `web/src/lib/`

| File | Purpose |
| --- | --- |
| `supabase.ts` | Supabase client |
| `razorpay.ts` | Razorpay Checkout loader and payment initiation |
| `utils.ts` | Slug generation, price formatting, expiry helpers, share URLs |

---

## DOMAIN TYPES

Located in `web/src/types/index.ts`.

```ts
export type TemplateTier = 'free' | 'standard' | 'premium'
export type OccasionType =
  | 'birthday' | 'wedding' | 'anniversary' | 'festival'
  | 'graduation' | 'baby_shower' | 'farewell' | 'valentine' | 'other'
export type WishStatus = 'draft' | 'active' | 'expired' | 'deleted'
export type OrderStatus = 'pending' | 'paid' | 'failed' | 'refunded'
```

Main interfaces:

- `Profile`
- `Template`
- `Wish`
- `Order`
- `EditorState`
- `WishPageData`
- `WishData`

---

## SUPABASE DATABASE OVERVIEW

Template Hub uses Supabase Postgres with:

- Enums
- Relational tables
- Foreign keys
- Row-level security
- Indexes
- Auth trigger
- Payment activation RPC
- Storage bucket policies
- Seed data

### ERD

```txt
auth.users
  |
  | 1:1
  v
profiles
  |
  | 1:N
  v
wishes ---- N:1 ---- templates
  |
  | 1:N
  v
orders ----- N:1 ---- templates

music_tracks
storage.objects
```

---

## DATABASE ENUMS

### `template_tier`

```sql
'free', 'standard', 'premium'
```

### `occasion_type`

```sql
'birthday', 'wedding', 'anniversary', 'festival',
'graduation', 'baby_shower', 'farewell', 'valentine', 'other'
```

### `wish_status`

```sql
'draft', 'active', 'expired', 'deleted'
```

### `order_status`

```sql
'pending', 'paid', 'failed', 'refunded'
```

---

## DATABASE TABLES

## 1. `profiles`

Purpose: Application profile for each Supabase Auth user.

| Column | Type | Constraints | Description |
| --- | --- | --- | --- |
| `id` | `uuid` | PK, FK `auth.users(id)`, cascade delete | User id |
| `email` | `text` | not null | User email |
| `full_name` | `text` | nullable | User display name |
| `avatar_url` | `text` | nullable | Optional avatar |
| `created_at` | `timestamptz` | default `now()` | Created timestamp |

RLS policies:

- Users can view own profile
- Users can update own profile
- Users can insert own profile

Trigger:

- `on_auth_user_created`
- Calls `public.handle_new_user()`
- Inserts or updates profile when a new Auth user is created

---

## 2. `templates`

Purpose: Public catalog of wish templates.

| Column | Type | Constraints | Description |
| --- | --- | --- | --- |
| `id` | `uuid` | PK, default `gen_random_uuid()` | Template id |
| `name` | `text` | not null | Display name |
| `slug` | `text` | unique, not null | URL/editor identifier |
| `occasion` | `occasion_type` | not null | Occasion category |
| `tier` | `template_tier` | not null, default `free` | Pricing tier |
| `price_paise` | `integer` | not null, default 0, check >= 0 in repair migration | Price in paise |
| `thumbnail_url` | `text` | nullable | Template card image |
| `preview_url` | `text` | nullable | Optional preview URL |
| `has_animation` | `boolean` | default false | Animation support |
| `has_music` | `boolean` | default false | Music support |
| `component_name` | `text` | not null | React registry key |
| `is_active` | `boolean` | default true | Public visibility |
| `created_at` | `timestamptz` | default `now()` | Created timestamp |

RLS:

- Public can read active templates.

Indexes:

- Unique index on `slug`

Seed templates:

| Name | Slug | Occasion | Tier | Price |
| --- | --- | --- | --- | --- |
| Birthday Classic | `birthday-classic` | birthday | free | 0 |
| Birthday Glow | `birthday-glow` | birthday | standard | 9900 |
| Wedding Elegant | `wedding-elegant` | wedding | premium | 19900 |
| Anniversary Romantic | `anniversary-romantic` | anniversary | standard | 12900 |
| Festival Diwali | `festival-diwali` | festival | premium | 17900 |
| Graduation Celebration | `graduation-celebration` | graduation | free | 0 |

---

## 3. `wishes`

Purpose: Stores every created wish page.

| Column | Type | Constraints | Description |
| --- | --- | --- | --- |
| `id` | `uuid` | PK, default `gen_random_uuid()` | Wish id |
| `user_id` | `uuid` | FK `profiles(id)`, not null, cascade delete | Owner |
| `template_id` | `uuid` | FK `templates(id)`, not null | Template |
| `slug` | `text` | unique, not null | Public URL slug |
| `recipient_name` | `text` | not null | Recipient |
| `sender_name` | `text` | not null | Sender |
| `custom_message` | `text` | nullable | Message |
| `photo_urls` | `text[]` | default `{}` | Uploaded photo URLs |
| `music_url` | `text` | nullable | Built-in music label or uploaded audio URL |
| `status` | `wish_status` | default `draft` | Lifecycle status |
| `is_paid` | `boolean` | default false | Payment flag |
| `expires_at` | `timestamptz` | nullable | Expiry time |
| `created_at` | `timestamptz` | default `now()` | Created timestamp |
| `activated_at` | `timestamptz` | nullable | Activation time |

RLS:

- Users can view own wishes
- Users can create own wishes
- Users can update own wishes
- Active wishes are publicly readable by slug

Indexes:

- `wishes_user_id_created_at_idx`
- `wishes_slug_key`
- `wishes_expiry_idx`
- `wishes_template_id_idx`

Lifecycle:

```txt
draft -> active -> expired
draft -> deleted
active -> deleted
```

---

## 4. `orders`

Purpose: Stores Razorpay payment records for paid templates.

| Column | Type | Constraints | Description |
| --- | --- | --- | --- |
| `id` | `uuid` | PK, default `gen_random_uuid()` | Internal order id |
| `user_id` | `uuid` | FK `profiles(id)`, not null, cascade delete | Buyer |
| `wish_id` | `uuid` | FK `wishes(id)`, not null, cascade delete | Draft wish |
| `template_id` | `uuid` | FK `templates(id)`, not null | Template purchased |
| `amount_paise` | `integer` | not null, check >= 0 in repair migration | Amount |
| `razorpay_order_id` | `text` | nullable | Razorpay order id |
| `razorpay_payment_id` | `text` | nullable | Razorpay payment id |
| `razorpay_signature` | `text` | nullable | Razorpay signature |
| `status` | `order_status` | default `pending` | Payment status |
| `created_at` | `timestamptz` | default `now()` | Created timestamp |
| `paid_at` | `timestamptz` | nullable | Paid timestamp |

RLS:

- Users can view own orders
- Users can create own pending orders

Indexes:

- `orders_user_id_created_at_idx`
- `orders_razorpay_order_id_idx`
- `orders_wish_id_idx`

---

## 5. `music_tracks`

Purpose: Stores built-in music track metadata.

| Column | Type | Constraints | Description |
| --- | --- | --- | --- |
| `id` | `uuid` | PK, default `gen_random_uuid()` | Track id |
| `title` | `text` | not null, unique in repair migration | Track title |
| `mood` | `text` | nullable | Mood category |
| `occasion` | `occasion_type` | nullable | Occasion mapping |
| `url` | `text` | not null | Audio URL |
| `is_active` | `boolean` | default true | Availability |
| `created_at` | `timestamptz` | default `now()` | Created timestamp |

RLS:

- Active tracks are publicly readable.

Seed tracks:

- Gentle Piano
- Warm Celebration
- Soft Romance
- Festival Lights
- Bright Future

Current implementation note:

- The database table exists and is seeded.
- The editor currently uses a local track name list.
- Future improvement: fetch active tracks from `music_tracks`.

---

## SUPABASE STORAGE

## Bucket: `wish-photos`

Purpose: Stores photos uploaded by wish creators.

Settings:

- Public read
- Upload requires authentication
- File size limit in repair migration: 5MB
- Allowed MIME types: JPEG, PNG, WebP, GIF

Policies:

- Anyone can read wish photos
- Auth users can upload wish photos
- Owners can update own wish photos
- Owners can delete own wish photos

Frontend upload path:

```txt
draft/{timestamp}-{filename}
```

## Bucket: `wish-music`

Purpose: Stores premium custom music uploads.

Settings:

- Public read
- Upload requires authentication
- File size limit in repair migration: 10MB
- Allowed MIME types: MP3, MPEG, WAV, OGG, AAC, MP4 audio

Policies:

- Anyone can read wish music
- Auth users can upload wish music
- Owners can update own wish music
- Owners can delete own wish music

Frontend upload path:

```txt
draft/{timestamp}.{extension}
```

---

## SUPABASE MIGRATIONS

Migration files:

```txt
supabase/migrations/001_profiles.sql
supabase/migrations/002_templates.sql
supabase/migrations/003_wishes.sql
supabase/migrations/004_orders.sql
supabase/migrations/005_storage_buckets.sql
supabase/migrations/006_seed_templates.sql
supabase/migrations/007_music_tracks.sql
supabase/migrations/008_deployment_helpers.sql
supabase/migrations/009_ensure_default_templates.sql
supabase/migrations/010_repair_backend_schema.sql
```

Recommended production setup:

1. Run all migrations in order.
2. Run `010_repair_backend_schema.sql` if any table/policy/bucket/function is missing.
3. Refresh PostgREST schema cache.
4. Run `verify_backend.sql`.

Schema cache refresh:

```sql
notify pgrst, 'reload schema';
```

---

## SUPABASE FUNCTIONS AND RPCS

## Trigger Function: `handle_new_user`

Purpose:

- Creates or updates a profile row when a Supabase Auth user is created.

Runs on:

```txt
after insert on auth.users
```

## RPC: `activate_paid_wish`

Purpose:

- Activates paid wishes after Razorpay signature verification.

Inputs:

| Parameter | Type |
| --- | --- |
| `target_order_id` | `uuid` |
| `target_wish_id` | `uuid` |
| `payment_id` | `text` |
| `payment_signature` | `text` |

Actions:

1. Updates pending order to `paid`.
2. Stores Razorpay payment id.
3. Stores Razorpay signature.
4. Sets `paid_at`.
5. Updates draft wish to `active`.
6. Sets `is_paid = true`.
7. Sets `activated_at = now()`.
8. Sets `expires_at = now() + interval '7 days'`.

---

## SUPABASE EDGE FUNCTIONS

## 1. `create-razorpay-order`

File:

```txt
supabase/functions/create-razorpay-order/index.ts
```

Purpose:

- Creates a Razorpay order.
- Validates authenticated user.
- Validates draft wish belongs to user.
- Validates template price.
- Inserts a pending database order.

Method:

```txt
POST
```

Request:

```json
{
  "amount": 19900,
  "wishId": "wish-uuid",
  "templateId": "template-uuid"
}
```

Success response:

```json
{
  "order_id": "database-order-uuid",
  "razorpay_order_id": "order_razorpay_id"
}
```

Errors:

| Status | Reason |
| --- | --- |
| 400 | Missing payload, invalid wish, amount mismatch |
| 401 | Unauthorized |
| 405 | Method not allowed |
| 500 | Razorpay or backend failure |

## 2. `verify-payment`

File:

```txt
supabase/functions/verify-payment/index.ts
```

Purpose:

- Verifies Razorpay HMAC signature.
- Confirms database order matches payload.
- Calls `activate_paid_wish`.

Method:

```txt
POST
```

Request:

```json
{
  "orderId": "order_razorpay_id",
  "paymentId": "pay_razorpay_id",
  "signature": "razorpay_signature",
  "dbOrderId": "database-order-uuid",
  "wishId": "wish-uuid"
}
```

Success response:

```json
{
  "verified": true
}
```

Errors:

| Status | Reason |
| --- | --- |
| 400 | Missing fields, invalid signature, order mismatch |
| 405 | Method not allowed |
| 500 | Missing secret or backend failure |

## 3. `expire-wishes`

File:

```txt
supabase/functions/expire-wishes/index.ts
```

Purpose:

- Marks active wishes as expired when `expires_at` is in the past.

Database update:

```ts
supabase
  .from('wishes')
  .update({ status: 'expired' })
  .lt('expires_at', new Date().toISOString())
  .eq('status', 'active')
```

Recommended schedule:

```txt
Every 1 hour
```

---

## AUTHENTICATION SYSTEM

Technology:

- Supabase Auth
- Email/password authentication
- Zustand auth store

Main files:

```txt
web/src/hooks/useAuth.ts
web/src/store/authStore.ts
web/src/pages/Auth.tsx
web/src/components/layout/ProtectedRoute.tsx
```

Flow:

```txt
User signs up or logs in
  -> Supabase Auth creates/returns user
  -> profile row is created by trigger or explicit upsert
  -> authStore stores user/profile
  -> protected routes become available
```

Signup fields:

- Full name
- Email
- Password

Login fields:

- Email
- Password

Friendly auth errors:

- Rate limit
- Missing database tables
- Email already registered
- Invalid login credentials

---

## THEME SYSTEM

Main files:

```txt
web/src/theme/ThemeProvider.tsx
web/src/components/ui/ThemeToggle.tsx
web/src/index.css
web/tailwind.config.ts
```

Theme modes:

- `light`
- `dark`

Persistence:

```txt
localStorage["template-hub-theme"]
```

DOM behavior:

```ts
document.documentElement.classList.toggle('dark', theme === 'dark')
document.documentElement.style.colorScheme = theme
```

Tailwind config:

```ts
darkMode: 'class'
```

Design tokens:

| Token | Value | Purpose |
| --- | --- | --- |
| `ink` | `#15141f` | Dark text/surface |
| `brand` | `#7d72de` | Primary lavender |
| `plum` | `#4f3394` | Purple accent |
| `coral` | `#ff7460` | Warm accent |
| `mint` | `#45c8a5` | Green accent |
| `sun` | `#ffc34d` | Gold accent |
| `cream` | `#fff8ed` | Light background |

Light mode:

- Warm cream background
- White cards
- Lavender buttons
- Dark ink text
- Pastel template gradients

Dark mode:

- Dark page background
- Dark component surfaces
- White text with controlled opacity
- Premium muted accents
- Component-level dark mode styling

Important rule:

- Do not use global text color hacks.
- Fix dark mode contrast at the component level.

---

## TEMPLATE SYSTEM

Templates are React components mapped by database `component_name`.

Registry:

```txt
web/src/components/templates/registry.ts
```

Current registry keys:

```txt
birthday-classic
birthday-glow
wedding-elegant
anniversary-romantic
festival-diwali
graduation-celebration
```

Shared template shell:

```txt
web/src/components/templates/TemplateFrame.tsx
```

Template props:

```ts
interface WishData {
  recipientName: string
  senderName: string
  customMessage: string | null
  photoUrls: string[]
  musicUrl: string | null
}
```

Each template renders:

- Occasion title
- Recipient name
- Custom message
- Up to 3 displayed photos
- Empty gallery prompt when no photos exist
- Sender signature
- Animated particles or motifs

Template motifs:

- Confetti
- Glow
- Petals
- Sparks
- Stars
- Hearts

---

## BUILT-IN TEMPLATES

| Template | Slug | Tier | Price | Notes |
| --- | --- | --- | --- | --- |
| Birthday Classic | `birthday-classic` | Free | 0 | Pastel birthday scene |
| Birthday Glow | `birthday-glow` | Standard | Rs 99 | Dark glow birthday scene |
| Wedding Elegant | `wedding-elegant` | Premium | Rs 199 | Gold/ivory wedding scene |
| Anniversary Romantic | `anniversary-romantic` | Standard | Rs 129 | Rose romantic scene |
| Festival Diwali | `festival-diwali` | Premium | Rs 179 | Festive sparks scene |
| Graduation Celebration | `graduation-celebration` | Free | 0 | Bright graduation scene |

---

## ADDING A NEW TEMPLATE

Steps:

1. Create a new component in `web/src/components/templates/`.
2. Accept prop `{ data: WishData }`.
3. Use `TemplateFrame` or a custom full-screen layout.
4. Add lazy import in `registry.ts`.
5. Insert template row into Supabase `templates`.
6. Ensure `component_name` equals registry key.
7. Optionally add fallback entry in `demoTemplates`.
8. Test browse card, editor preview, final preview, public wish route, dark mode, and mobile responsiveness.

---

## WISH GENERATION FLOW

```txt
Browse
  -> Select template
  -> Editor
  -> Enter names/message
  -> Upload photos/music
  -> Live preview
  -> Preview page
  -> Create free wish or pay for premium wish
  -> Share page
  -> Public recipient page
```

## Free Template Flow

```txt
Preview
  -> ensure profile exists
  -> resolve database template
  -> generate slug
  -> insert wish with status active
  -> set expires_at to now + 7 days
  -> redirect to /share/:slug
```

## Paid Template Flow

```txt
Preview
  -> create draft wish
  -> call create-razorpay-order
  -> open Razorpay Checkout
  -> receive success callback
  -> call verify-payment
  -> verify HMAC signature
  -> activate paid wish
  -> redirect to /share/:slug
```

---

## MEDIA UPLOAD FLOW

## Photo Upload

Frontend validation:

- Up to 5 photos
- Max 5MB each

Storage:

- Bucket: `wish-photos`
- Public URL stored in `editorStore.photoUrls`

## Music Upload

Available:

- Premium templates only

Frontend validation:

- Max 10MB

Storage:

- Bucket: `wish-music`
- Public URL stored in `editorStore.musicUrl`

---

## DASHBOARD FLOW

Dashboard route:

```txt
/dashboard
```

Access:

- Authenticated users only

Features:

- Lists user's wishes
- Shows recipient name
- Shows status badge
- Shows time remaining for active wishes
- Shows share URL
- Copy link action
- Soft delete action by setting status to `deleted`
- Empty state with CTA to browse templates

---

## PUBLIC WISH PAGE FLOW

Route:

```txt
/w/:slug
```

Steps:

1. Fetch wish by slug with joined template.
2. If loading, show loading state.
3. If not found, show not found message.
4. If expired, show expired page.
5. If active, show tap-to-open reveal.
6. On tap, render template.
7. If music exists, attempt playback and provide mute/unmute.

Open Graph:

- Title: `{recipientName} has a wish for you`
- Description: `Tap to open your special wish`
- Image: template thumbnail URL

---

## UI/UX DESIGN SYSTEM

Typography:

- Bold headings
- Strong contrast
- Compact body copy
- Uppercase labels with wide tracking for section headings

Cards:

- Rounded corners
- Soft shadows
- White/cream surfaces in light mode
- Dark premium surfaces in dark mode
- No washed-out text in dark mode

Buttons:

- Primary lavender
- Secondary ink/white depending on theme
- Ghost transparent
- Danger coral/rose

Animations:

- Used to create emotional feel
- Floating ribbons
- Orbit glows
- Shimmer sweeps
- Template particles
- Preview card motion
- Tap-to-open reveal

Responsive behavior:

- Desktop: multi-column layouts
- Tablet: reduced columns
- Mobile: stacked panels
- Editor preview hidden on smaller screens with modal preview button
- Public templates use full-screen responsive layouts

---

## PERFORMANCE STRATEGY

Implemented:

- Vite optimized build
- Lazy-loaded template components
- Suspense fallbacks
- Zustand for lightweight global state
- Image lazy loading in preview cards
- GPU-friendly Framer Motion transforms
- Supabase-hosted media assets

Known build note:

- Vite may warn about a chunk larger than 500KB.
- This is not a build failure.

Future improvements:

- Route-level lazy loading
- Manual vendor chunks
- Reduced-motion support
- Image compression before upload
- CDN caching strategy

---

## ERROR HANDLING

Frontend:

- Auth errors shown inline
- Upload errors shown as toasts
- Payment failure shown as toast
- Missing template produces clear migration-related error
- Wish not found shown on public page
- Expired wish shown through `Expired`
- Offline banner shown when browser is offline

Backend:

- Edge Functions return JSON errors
- Payment validation has explicit 400/401/405/500 paths
- Logs use `console.info`, `console.warn`, and `console.error`

Toast types:

- `success`
- `error`
- `info`

---

## SECURITY DOCUMENTATION

Auth security:

- Supabase Auth manages sessions
- Protected routes prevent anonymous creation
- RLS protects backend data

Database security:

- RLS enabled on all application tables
- Users can only manage their own profile/wishes/orders
- Public access is limited to active templates, active music tracks, and active wishes

Storage security:

- Buckets are public because recipient pages need public media
- Upload requires authentication
- Repair migration enforces file size and MIME limits
- Owners can update/delete their own storage objects

Payment security:

- Razorpay secret stays only in Edge Function secrets
- Frontend only uses public key id
- Payment signature verified server-side
- Paid wish activation uses backend RPC

Environment security:

Frontend environment variables:

```txt
VITE_SUPABASE_URL
VITE_SUPABASE_ANON_KEY
VITE_RAZORPAY_KEY_ID
```

Backend-only secrets:

```txt
SUPABASE_SERVICE_ROLE_KEY
RAZORPAY_KEY_SECRET
```

Never expose service role keys or payment secrets in frontend files.

---

## DEVELOPMENT SETUP

## Prerequisites

- Node.js 18 or newer
- npm
- Supabase project
- Razorpay account

## Install

```bash
cd web
npm install
```

## Environment

Create:

```txt
web/.env.local
```

With:

```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_RAZORPAY_KEY_ID=your_razorpay_key_id
```

## Run Locally

```bash
cd web
npm run dev
```

Default URL:

```txt
http://localhost:5173
```

## Build

```bash
cd web
npm run build
```

## Preview Build

```bash
cd web
npm run preview
```

## Lint

```bash
cd web
npm run lint
```

---

## DEPLOYMENT DOCUMENTATION

## Web Deployment

The web app is a static Vite build.

Suitable platforms:

- Vercel
- Netlify
- Cloudflare Pages
- Static CDN hosting

Vercel settings:

| Setting | Value |
| --- | --- |
| Root directory | `web` |
| Build command | `npm run build` |
| Output directory | `dist` |
| Install command | `npm install` |

Netlify settings:

| Setting | Value |
| --- | --- |
| Base directory | `web` |
| Build command | `npm run build` |
| Publish directory | `web/dist` |

React Router redirect for Netlify:

```txt
/* /index.html 200
```

## Supabase Deployment

1. Run migrations.
2. Run repair migration if needed.
3. Refresh schema cache.
4. Verify backend.
5. Configure Edge Function secrets.
6. Deploy Edge Functions.
7. Schedule expiry function.

Edge Function deploy commands:

```bash
supabase functions deploy create-razorpay-order
supabase functions deploy verify-payment
supabase functions deploy expire-wishes
```

Required secrets:

```txt
RAZORPAY_KEY_ID
RAZORPAY_KEY_SECRET
SUPABASE_URL
SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
```

---

## PRODUCTION CHECKLIST

- [ ] `npm run build` passes
- [ ] Supabase migrations are applied
- [ ] `010_repair_backend_schema.sql` has been run if needed
- [ ] `notify pgrst, 'reload schema';` has been run
- [ ] `verify_backend.sql` passes
- [ ] Storage buckets exist
- [ ] RLS policies are enabled
- [ ] Edge Functions are deployed
- [ ] Edge Function secrets are configured
- [ ] `expire-wishes` is scheduled hourly
- [ ] Razorpay test payment works
- [ ] Free wish creation works
- [ ] Paid wish creation works
- [ ] Public wish route works in incognito
- [ ] Photo upload works
- [ ] Premium music upload works
- [ ] Dark and light modes are readable
- [ ] Mobile viewport is checked
- [ ] `.env.local` is not committed

---

## MOBILE APP STATUS

Folder:

```txt
mobile/
```

Current status:

- Early React Native shell
- `App.tsx` renders `AppNavigator`
- `HomeScreen` displays "Template Hub"
- Other screen files exist as project structure

Future mobile goals:

- React Navigation stack
- Supabase mobile auth
- Image picker uploads
- Native audio playback
- Razorpay mobile integration
- Deep links for `templatehub://w/:slug`

---

## FUTURE IMPROVEMENTS

## Product Features

- Admin template management
- Built-in music picker from `music_tracks`
- Image reordering
- Wish editing before expiry
- WhatsApp/native share buttons
- Order history
- Razorpay webhooks
- Email receipts
- Longer live duration as paid upgrade
- No-branding premium option

## Architecture

- Route-level code splitting
- Vendor chunk splitting
- Server-side validation constraints
- Payment audit table
- Upload cleanup for abandoned drafts
- Rate limiting for wish creation
- Central logging/error monitoring

## AI Features

- AI-generated wish messages
- AI template recommendations
- AI image/background generation
- AI occasion copy suggestions

## Monetization

- Premium templates
- Custom music
- Extended expiry
- Creator marketplace
- Event bundles
- Business greeting packages

---

## MAINTENANCE RULES

When adding a template:

- Add component
- Register component
- Add database row
- Update demo fallback if needed
- Test all flows

When changing schema:

- Add migration
- Update repair migration if it remains canonical
- Update TypeScript types
- Update RLS policies
- Update this documentation

When changing theme:

- Preserve light mode unless redesign is intentional
- Fix dark mode with component-level classes
- Verify contrast manually

When changing payment flow:

- Update Edge Functions
- Update frontend payment helper
- Update RPC if needed
- Retest free and paid paths

---

## BUILD AND TEST ORDER

Use this order when onboarding or verifying the project:

```txt
1. Install web dependencies
2. Configure web environment variables
3. Run Supabase migrations
4. Run backend repair migration if needed
5. Refresh Supabase schema cache
6. Verify backend SQL
7. Deploy Edge Functions
8. Configure Edge Function secrets
9. Run web app locally
10. Test authentication
11. Test template browsing
12. Test editor and uploads
13. Test free wish creation
14. Test paid wish creation
15. Test public wish route
16. Test expiry behavior
17. Test dark/light mode
18. Build production bundle
19. Deploy frontend
20. Final production smoke test
```

---

## QUICK COMMAND REFERENCE

```bash
# Run web app
cd web
npm run dev

# Build web app
cd web
npm run build

# Preview production build
cd web
npm run preview

# Lint
cd web
npm run lint
```

```sql
-- Refresh Supabase schema cache
notify pgrst, 'reload schema';
```

```bash
# Deploy Supabase functions
supabase functions deploy create-razorpay-order
supabase functions deploy verify-payment
supabase functions deploy expire-wishes
```

---

## DOCUMENT VERSION

Template Hub Complete Project Documentation v1.0

Generated from the current repository implementation for development, scaling, onboarding, maintenance, deployment, and portfolio presentation.

