# Application Architecture

## High-Level Architecture

```txt
Browser
  |
  | React Router pages
  v
React + TypeScript frontend
  |
  | Supabase JS client
  v
Supabase
  |-- Auth
  |-- Postgres tables
  |-- Storage buckets
  |-- Edge Functions
        |
        v
      Razorpay
```

The frontend owns rendering, editor state, preview state, theme state, and route transitions. Supabase owns durable data, authentication, storage, row-level security, and server-side payment verification. Razorpay owns checkout and payment confirmation.

## Frontend Architecture

```txt
main.tsx
  HelmetProvider
    ThemeProvider
      BrowserRouter
        App
          PageWrapper
            Navbar
            Routes
            ToastViewport
```

Key frontend principles:

- Pages own route-level behavior.
- Hooks encapsulate Supabase reads and auth subscriptions.
- Zustand stores hold cross-page auth/editor/toast state.
- Template rendering is registry-based and lazy-loaded.
- Tailwind classes define most styling.
- Component-level `dark:` classes avoid global overrides.

## Backend Architecture

Supabase backend modules:

- Auth creates `auth.users`.
- Trigger `handle_new_user` creates/updates `public.profiles`.
- `templates` stores available template metadata.
- `wishes` stores user-created wish instances.
- `orders` stores Razorpay-linked payment records.
- `music_tracks` stores built-in music metadata.
- Storage buckets serve uploaded photos and music.
- Edge Functions validate paid flows.
- RPC `activate_paid_wish` atomically marks an order paid and activates the wish.

## Routing System

| Route | Component | Access | Purpose |
| --- | --- | --- | --- |
| `/` | `Home` | Public | Landing, features, showcase, pricing |
| `/browse` | `Browse` | Public | Template marketplace and filters |
| `/auth` | `Auth` | Public | Login/signup |
| `/editor/:templateSlug` | `Editor` | Protected | Wish customization |
| `/preview` | `Preview` | Protected | Final preview and creation/payment |
| `/dashboard` | `Dashboard` | Protected | User wishes |
| `/share/:slug` | `Share` | Protected | Share URL after creation |
| `/w/:slug` | `WishPage` | Public fullscreen | Recipient experience |
| `/expired` | `Expired` | Public | Expiry message |
| `*` | `NotFound` | Public | 404 |

Protected routes are enforced in `ProtectedRoute`, which redirects unauthenticated users to `/auth`.

## Folder Structure

```txt
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
  tailwind.config.ts
  vite.config.ts

supabase/
  migrations/
  functions/
  verify_backend.sql

mobile/
  App.tsx
  src/
```

## Component Hierarchy

```txt
PageWrapper
  Navbar
    ThemeToggle
    Button
  Routes
    Home
      Card
      TemplateScenePreview
      MotionDecor
    Browse
      TemplateCard
      Badge
      Skeleton
    Editor
      Input
      Textarea
      ImageUpload
      LivePreview
        TemplateRegistry component
      Modal
    Preview
      LivePreview
      Button
    WishPage
      TemplateRegistry component
    Dashboard
      StatusBadge
  ToastViewport
```

## Data Flow

### Template Browsing

```txt
Browse page
  -> useTemplates()
    -> Supabase templates select
    -> fallback demoTemplates if fetch fails or returns empty
  -> filters in local component state
  -> TemplateCard grid
```

### Editor Flow

```txt
Editor route receives templateSlug
  -> local demo template is applied immediately
  -> Supabase template lookup replaces local fallback if available
  -> Zustand editorStore holds form state
  -> LivePreview renders registered template component
```

### Wish Creation

```txt
Preview
  -> ensure profile exists
  -> resolve real database template
  -> generate unique slug
  -> insert wish
  -> if free: active + expires_at
  -> if paid: draft + Razorpay flow
```

## Theme Architecture

```txt
ThemeProvider
  -> reads localStorage or prefers-color-scheme
  -> toggles html.dark
  -> writes localStorage
  -> ThemeToggle calls toggleTheme
  -> Tailwind dark variants apply component styling
```

## Authentication Flow

```txt
Auth page
  -> useAuth.signUp/signIn
  -> Supabase Auth
  -> profile trigger or explicit profile upsert
  -> authStore stores user/profile
  -> ProtectedRoute gates private pages
```

## Upload Flow

```txt
Editor ImageUpload
  -> validates up to 5 photos
  -> max 5MB each in frontend
  -> storage bucket wish-photos
  -> public URL saved in editorStore.photoUrls

Premium custom music
  -> max 10MB in frontend
  -> storage bucket wish-music
  -> public URL saved in editorStore.musicUrl
```

## Payment Flow

```txt
Preview creates draft wish
  -> initiatePayment()
  -> create-razorpay-order Edge Function
  -> Razorpay Checkout
  -> verify-payment Edge Function
  -> validate HMAC signature
  -> RPC activate_paid_wish()
  -> active wish with 7-day expiry
```

## Public Wish Flow

```txt
/w/:slug
  -> useWish(slug)
  -> fetch wish with template join
  -> check expiry
  -> show tap-to-open gate
  -> play optional audio after user interaction
  -> render lazy template component
```

