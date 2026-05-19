# Component and File Reference

## Web Application Root

| File | Responsibility |
| --- | --- |
| `web/src/main.tsx` | Mounts React, registers `HelmetProvider`, `ThemeProvider`, and `BrowserRouter` |
| `web/src/App.tsx` | Defines all application routes and protected route boundaries |
| `web/src/index.css` | Tailwind imports, global page backgrounds, theme utility classes |
| `web/tailwind.config.ts` | Theme tokens, shadows, Tailwind content scanning, dark-mode strategy |
| `web/vite.config.ts` | Vite React SWC plugin setup |
| `web/package.json` | Scripts, dependencies, and dev dependencies |
| `web/.env.local.example` | Frontend environment variable template |

## Pages

| Page | File | Responsibility |
| --- | --- | --- |
| Home | `web/src/pages/Home.tsx` | Landing page, hero, flow cards, occasion library, showcase, pricing |
| Browse | `web/src/pages/Browse.tsx` | Template marketplace, filters, template cards |
| Auth | `web/src/pages/Auth.tsx` | Login/signup form and friendly auth errors |
| Editor | `web/src/pages/Editor.tsx` | Customization form, uploads, live preview |
| Preview | `web/src/pages/Preview.tsx` | Final preview, wish creation, payment entry |
| Dashboard | `web/src/pages/Dashboard.tsx` | Authenticated user's wish list and share/delete actions |
| Share | `web/src/pages/Share.tsx` | Post-creation share URL display and copy action |
| WishPage | `web/src/pages/WishPage.tsx` | Public recipient reveal and template renderer |
| Expired | `web/src/pages/Expired.tsx` | Expired wish state |
| NotFound | `web/src/pages/NotFound.tsx` | Fallback route |

## Layout Components

### `Navbar`

File: `web/src/components/layout/Navbar.tsx`

Purpose:

- Provides brand link.
- Shows Browse and How it works navigation.
- Shows Dashboard when authenticated.
- Shows Login or Logout action.
- Includes `ThemeToggle`.

Dependencies:

- `useAuth`
- `Button`
- `ThemeToggle`
- React Router navigation

### `PageWrapper`

File: `web/src/components/layout/PageWrapper.tsx`

Purpose:

- Adds `Navbar` to non-fullscreen routes.
- Adds offline banner.
- Keeps public wish route fullscreen by hiding navbar for `/w/`.
- Mounts `ToastViewport`.

### `ProtectedRoute`

File: `web/src/components/layout/ProtectedRoute.tsx`

Purpose:

- Waits for auth loading.
- Redirects anonymous users to `/auth`.
- Renders protected children when authenticated.

## UI Components

### `Button`

File: `web/src/components/ui/Button.tsx`

Props:

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `variant` | `primary`, `secondary`, `ghost`, `danger` | `primary` | Visual style |
| `size` | `sm`, `md`, `lg` | `md` | Height and padding |
| `loading` | `boolean` | false | Shows spinner and disables button |
| `children` | `ReactNode` | required | Button content |

### `Card`

File: `web/src/components/ui/Card.tsx`

Purpose:

- Shared rounded surface.
- Provides border, background, shadow, dark-mode surface, and transition.

### `Badge`, `TierBadge`, `OccasionBadge`, `StatusBadge`

File: `web/src/components/ui/Badge.tsx`

Purpose:

- Small labels for template tier, occasion, and wish status.
- Tone-specific light and dark colors.

### `Input`

File: `web/src/components/ui/Input.tsx`

Purpose:

- Labeled input with helper/error area.
- Uses `focus-ring`.

### `Textarea`

File: `web/src/components/ui/Textarea.tsx`

Purpose:

- Labeled textarea.
- Shows error and character count.
- Used for custom messages with max length.

### `ImageUpload`

File: `web/src/components/ui/ImageUpload.tsx`

Props:

| Prop | Type | Description |
| --- | --- | --- |
| `urls` | `string[]` | Public uploaded image URLs |
| `onFiles` | `(files: FileList) => void` | Upload callback |
| `onRemove` | `(url: string) => void` | Remove callback |
| `disabled` | `boolean` | Disables file input |

### `Modal`

File: `web/src/components/ui/Modal.tsx`

Purpose:

- Generic overlay dialog.
- Closes on Escape and backdrop click.
- Stops propagation inside dialog.

### `ThemeToggle`

File: `web/src/components/ui/ThemeToggle.tsx`

Purpose:

- Animated light/dark switch.
- Calls `toggleTheme`.
- Uses `aria-label` and `aria-pressed`.

### `ToastViewport`

File: `web/src/components/ui/Toast.tsx`

Purpose:

- Displays toast stack.
- Removes toast on click.
- Supports success, error, and info colors.

### `MotionDecor`

File: `web/src/components/ui/MotionDecor.tsx`

Exports:

- `FloatingRibbons`
- `OrbitGlow`
- `ShimmerSweep`

Used for cinematic page and template decoration.

## Editor Components

### `LivePreview`

File: `web/src/components/editor/LivePreview.tsx`

Props:

| Prop | Type | Description |
| --- | --- | --- |
| `template` | `Template \| null` | Selected template metadata |
| `data` | `WishData` | Current wish form data |

Behavior:

- Looks up template component by `component_name`.
- Shows an empty preview state if no component is selected.
- Wraps template with preview frame and lazy suspense fallback.

## Template Components

### `TemplateFrame`

File: `web/src/components/templates/TemplateFrame.tsx`

Purpose:

- Shared full-screen template layout.
- Generates animated particles based on motif.
- Renders recipient name, message, photos or empty gallery prompt, optional custom children, and sender signature.

### `TemplateScenePreview`

File: `web/src/components/templates/TemplateScenePreview.tsx`

Purpose:

- Generates animated preview scenes for browse/showcase cards.
- Maps occasion/slug/name to scene kind.
- Uses occasion-specific gradients and visual motifs.

### `registry`

File: `web/src/components/templates/registry.ts`

Purpose:

- Maps database `component_name` values to lazy React components.
- Enables templates to be selected by backend metadata.

### Individual Templates

| File | Component | Registry Key |
| --- | --- | --- |
| `BirthdayClassic.tsx` | `BirthdayClassic` | `birthday-classic` |
| `BirthdayGlow.tsx` | `BirthdayGlow` | `birthday-glow` |
| `WeddingElegant.tsx` | `WeddingElegant` | `wedding-elegant` |
| `AnniversaryRomantic.tsx` | `AnniversaryRomantic` | `anniversary-romantic` |
| `FestivalDiwali.tsx` | `FestivalDiwali` | `festival-diwali` |
| `GraduationCelebration.tsx` | `GraduationCelebration` | `graduation-celebration` |

## Hooks

### `useAuth`

File: `web/src/hooks/useAuth.ts`

Purpose:

- Reads current Supabase user.
- Subscribes to auth changes.
- Fetches profile.
- Exposes `signUp`, `signIn`, and `signOut`.

### `useTemplates`

File: `web/src/hooks/useTemplates.ts`

Purpose:

- Loads active templates from Supabase.
- Falls back to `demoTemplates` when backend data is unavailable.

### `useWish`

File: `web/src/hooks/useWish.ts`

Purpose:

- Loads public wish and joined template by slug.
- Computes expired state.

## Stores

### `authStore`

File: `web/src/store/authStore.ts`

State:

- `user`
- `profile`

Actions:

- `setUser`
- `setProfile`

### `editorStore`

File: `web/src/store/editorStore.ts`

State:

- `template`
- `recipientName`
- `senderName`
- `customMessage`
- `photoUrls`
- `musicUrl`
- `useCustomMusic`

Actions:

- `setTemplate`
- `setRecipientName`
- `setSenderName`
- `setCustomMessage`
- `addPhoto`
- `removePhoto`
- `setMusicUrl`
- `setUseCustomMusic`
- `reset`

### `toastStore`

File: `web/src/store/toastStore.ts`

State:

- `toasts`

Actions:

- `push`
- `remove`

## Libraries and Utilities

### `supabase.ts`

Creates Supabase client from:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

Warns if missing and uses safe fallback values to avoid immediate import failure.

### `razorpay.ts`

Responsibilities:

- Loads Razorpay Checkout script.
- Invokes `create-razorpay-order`.
- Opens checkout.
- Calls success/failure callbacks.

### `utils.ts`

Exports:

| Function | Purpose |
| --- | --- |
| `generateWishSlug` | Creates 10-character slug with nanoid |
| `formatPrice` | Converts paise to `Free` or `Rs N` |
| `getTimeRemaining` | Human-readable expiry countdown |
| `isWishExpired` | Local expiry check |
| `getShareableUrl` | Builds `/w/:slug` absolute URL |
| `addDays` | Adds days and returns ISO string |

## Supabase Backend Files

| File | Responsibility |
| --- | --- |
| `001_profiles.sql` | Profiles table, RLS, auth trigger |
| `002_templates.sql` | Template enums/table/RLS |
| `003_wishes.sql` | Wish enum/table/RLS/indexes |
| `004_orders.sql` | Order enum/table/RLS/indexes |
| `005_storage_buckets.sql` | Initial public buckets and upload policies |
| `006_seed_templates.sql` | Default template seed data |
| `007_music_tracks.sql` | Music tracks table and seeds |
| `008_deployment_helpers.sql` | Paid wish activation RPC |
| `009_ensure_default_templates.sql` | Idempotent default template upsert |
| `010_repair_backend_schema.sql` | Complete idempotent backend repair |
| `verify_backend.sql` | Backend verification queries |
| `functions/_shared/cors.ts` | CORS and JSON helpers |
| `functions/create-razorpay-order/index.ts` | Razorpay order creation |
| `functions/verify-payment/index.ts` | Razorpay signature verification |
| `functions/expire-wishes/index.ts` | Scheduled expiry updater |
