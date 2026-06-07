# Frontend, Theme, and Template System

All frontend work must follow the global [WishCraft UI/UX Rules](00-wishcraft-ui-ux-rules.md). Treat WishCraft as an emotional celebration platform first: favor visual browsing, cinematic previews, simple navigation, meaningful whitespace, accessible controls, and responsive layouts over analytics density or technical metadata.

## Frontend Files

| File/Folder | Purpose |
| --- | --- |
| `src/main.tsx` | Application bootstrap, providers, router |
| `src/App.tsx` | Route definitions |
| `src/index.css` | Tailwind imports, global backgrounds, utility classes |
| `src/pages/` | Route-level screens |
| `src/components/layout/` | Navbar, page wrapper, protected route |
| `src/components/ui/` | Buttons, cards, badges, inputs, modal, toast, motion utilities |
| `src/components/templates/` | Cinematic wish templates and preview scenes |
| `src/components/editor/` | Live template preview |
| `src/hooks/` | Auth, template, and wish data hooks |
| `src/store/` | Zustand state stores |
| `src/theme/` | Theme provider and theme hook |
| `src/lib/` | Supabase, Razorpay, utility functions |
| `src/types/` | Shared TypeScript domain types |

## Page Documentation

### `Home`

The landing page contains:

- Animated hero area
- Feature statements
- Occasion Library cards
- Template showcase carousel
- Pricing cards
- Footer

It uses `FloatingRibbons`, `OrbitGlow`, `ShimmerSweep`, `Card`, `Button`, and `TemplateScenePreview`.

### `Browse`

The template marketplace:

- Loads templates with `useTemplates`
- Filters by occasion, tier, animation, and music
- Uses `TemplateCard` for each template
- Navigates to `/editor/:templateSlug`
- Displays demo templates if Supabase is unavailable

### `Auth`

The authentication form:

- Supports login and signup tabs
- Uses Supabase email/password
- Maps raw auth/backend errors into friendlier messages
- Redirects to `/dashboard` on success

### `Editor`

The wish editor:

- Resolves the selected template by slug
- Stores form state in `editorStore`
- Uploads images to `wish-photos`
- Uploads premium music to `wish-music`
- Shows `LivePreview`
- Validates required recipient and sender names

### `Preview`

The final preview and publishing page:

- Ensures the profile row exists
- Resolves the database template
- Creates active wishes for free templates
- Creates draft wishes for paid templates
- Starts Razorpay checkout for paid templates
- Handles payment verification callback

### `Dashboard`

The dashboard lists a user's wishes, displays status badges, share URLs, and provides copy/delete actions. Delete is implemented as a soft status update to `deleted`.

### `WishPage`

The public recipient experience:

- Loads wish by slug
- Sets Open Graph metadata
- Shows a tap-to-open gate
- Plays optional music after interaction
- Renders the lazy-loaded template component
- Shows `Expired` if the wish is expired

## UI Components

| Component | Purpose |
| --- | --- |
| `Button` | Primary, secondary, ghost, and danger buttons |
| `Card` | Shared card surface with light/dark styling |
| `Badge` | Tier, occasion, and status badges |
| `Input` | Labeled form input |
| `Textarea` | Labeled message input with count and max length |
| `ImageUpload` | Photo upload drop area and thumbnail grid |
| `Modal` | Accessible dialog wrapper with Escape close |
| `Skeleton` | Loading state surface |
| `ThemeToggle` | Animated dark/light switch |
| `ToastViewport` | Timed toast notification stack |
| `MotionDecor` | Reusable animated visual primitives |

## Theme System

### Provider

`ThemeProvider` exposes:

```ts
type Theme = 'light' | 'dark'

{
  theme: Theme
  toggleTheme: () => void
  setTheme: (theme: Theme) => void
}
```

### Persistence

The selected theme is stored in:

```txt
localStorage["template-hub-theme"]
```

If no stored value exists, the provider reads `prefers-color-scheme`.

### DOM Strategy

The provider applies:

```ts
document.documentElement.classList.toggle('dark', theme === 'dark')
document.documentElement.style.colorScheme = theme
```

Tailwind uses:

```ts
darkMode: 'class'
```

### Theme Tokens

Defined in `tailwind.config.ts`:

| Token | Current Value | Use |
| --- | --- | --- |
| `ink` | `#15141f` | Primary dark text/surface |
| `brand` | `#7d72de` | Primary actions and lavender accents |
| `plum` | `#4f3394` | Deep purple accent |
| `coral` | `#ff7460` | Warm danger/celebration accent |
| `mint` | `#45c8a5` | Green celebration accent |
| `sun` | `#ffc34d` | Gold/yellow accent |
| `cream` | `#fff8ed` | Light page background |

### Global CSS Strategy

`index.css` defines:

- Root font and color
- Light and dark body backgrounds
- `.focus-ring`
- `.glass-panel`
- `.premium-ring`
- Dark-mode fixes for select elements and common utility overrides

Component-level dark classes should be preferred for specific components. Global hacks for text contrast should be avoided.

## Template System

### Registry

Templates are registered in `components/templates/registry.ts`:

```ts
export const templateRegistry = {
  'birthday-classic': lazy(...),
  'birthday-glow': lazy(...),
  'wedding-elegant': lazy(...),
  'anniversary-romantic': lazy(...),
  'festival-diwali': lazy(...),
  'graduation-celebration': lazy(...),
}
```

`component_name` in the database must match a registry key.

### TemplateFrame

`TemplateFrame` is the shared template shell. It receives:

| Prop | Type | Purpose |
| --- | --- | --- |
| `data` | `WishData` | Names, message, photos, music URL |
| `theme` | `string` | Tailwind background/text classes |
| `title` | `string` | Occasion label |
| `accent` | `string` | Particle color classes |
| `motif` | union | Confetti, glow, petals, sparks, stars, hearts |
| `children` | `ReactNode` | Optional template-specific content |

### Built-In Templates

| Template | Slug | Tier | Theme |
| --- | --- | --- | --- |
| Birthday Classic | `birthday-classic` | Free | Pastel birthday gradient |
| Birthday Glow | `birthday-glow` | Standard | Dark cinematic birthday |
| Wedding Elegant | `wedding-elegant` | Premium | Elegant gold/floral |
| Anniversary Romantic | `anniversary-romantic` | Standard | Soft rose romance |
| Festival Diwali | `festival-diwali` | Premium | Warm festive sparks |
| Graduation Celebration | `graduation-celebration` | Free | Bright blue/celebration |

### Preview Scenes

`TemplateScenePreview` creates visual cards for template browsing and showcase sections. It maps occasion/slug/name to a scene and uses generated gradients, decorative icons, sparkles, and motion.

### Adding a New Template

1. Create `src/components/templates/NewTemplate.tsx`.
2. Use `TemplateFrame` or a custom full-screen component.
3. Add the lazy import to `registry.ts`.
4. Add seed data to migrations or insert a row into `templates`.
5. Ensure `component_name` equals the registry key.
6. Add demo fallback data to `useTemplates.ts` if needed.
7. Test browse, editor preview, final preview, public wish, dark mode, and mobile.
