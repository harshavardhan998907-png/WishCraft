# WishCraft Creator Guide

Welcome! This is the end-to-end guide for building a template and getting it
into the WishCraft marketplace. If you can write a React component, you can ship
a WishCraft template — the CLI handles scaffolding, validation, bundling, and
submission, so you get to spend your time on the fun part: making something
beautiful.

By the end of this guide you'll have a template that's scaffolded, built,
validated, and submitted for review.

---

## 1. Prerequisites

Before you start, make sure you have:

- **Node.js 18 or newer.** Check with `node --version`. The CLI and the build
  toolchain (esbuild) assume an 18+ runtime.
- **The WishCraft CLI**, installed globally:

  ```bash
  npm install -g @wishcraft/cli
  ```

  This gives you the `wishcraft` command. Confirm it's on your `PATH`:

  ```bash
  wishcraft --help
  ```

- **A creator account.** Register at [wishcraft.com](https://wishcraft.com).
  You'll log in with this account from the CLI to submit templates.

---

## 2. Creating your first template

### Log in

Authenticate the CLI with your creator account. Your token is saved to
`~/.wishcraft/config.json` and reused for submissions.

```bash
wishcraft login
```

You'll be prompted for your **creator email** and **password**. On success you'll
see something like `Logged in and saved token to ~/.wishcraft/config.json`.

### Scaffold the project

Create an empty folder and run `init` inside it. The command must be run in a
fresh directory — it refuses to overwrite an existing project.

```bash
mkdir my-confetti-birthday && cd my-confetti-birthday
wishcraft init
```

`init` walks you through a short questionnaire:

| Prompt | Notes |
| --- | --- |
| **Template name** | Human-friendly display name, e.g. `Confetti Birthday`. |
| **Template slug** | Lowercase kebab-case, e.g. `confetti-birthday`. Must match `^[a-z0-9]+(?:-[a-z0-9]+)*$`. This is your template's unique ID in the marketplace. |
| **Template category** | One of the allowed categories (see below). |
| **Price in paise** | A non-negative integer. `0` means free. (₹1 = 100 paise, so `4900` = ₹49.00.) |
| **SDK version** | A semver string, defaults to `1.0.0`. |

**Allowed categories:** `birthday`, `wedding`, `anniversary`, `festival`,
`graduation`, `baby_shower`, `farewell`, `valentine`, `other`.

### Generated folder structure

```
my-confetti-birthday/
├── src/
│   └── index.tsx        # Your template component (default export)
├── config.json          # Template metadata, form fields, and theme
├── preview.png          # Thumbnail shown in the marketplace
├── package.json         # react/react-dom 18 deps + wishcraft scripts
├── tsconfig.json        # Strict TS, react-jsx, browser libs
└── README.md            # Quick command reference
```

> ⚠️ The scaffolded `preview.png` is a 1×1 placeholder. **Replace it with a real
> screenshot of your template before submitting** — reviewers and users see this
> image first.

### `config.json` fields

This file is the contract between your template and the platform. Here's the
shape that `init` generates, annotated:

```json
{
  "name": "Confetti Birthday",
  "slug": "confetti-birthday",
  "category": "birthday",
  "price": 0,
  "sdkVersion": "1.0.0",
  "fields": [
    {
      "id": "recipient_name",
      "label": "Recipient's Name",
      "type": "text",
      "required": true,
      "placeholder": "e.g. Amelia"
    },
    {
      "id": "sender_name",
      "label": "Your Name",
      "type": "text",
      "required": true,
      "placeholder": "e.g. Daniel"
    },
    {
      "id": "message",
      "label": "Message",
      "type": "textarea",
      "placeholder": "Write a warm, personal wish...",
      "maxLength": 300
    },
    {
      "id": "photos",
      "label": "Photos",
      "type": "gallery",
      "maxItems": 10
    },
    {
      "id": "music",
      "label": "Music URL",
      "type": "music"
    }
  ],
  "theme": {
    "primaryColor": "#FF7A5E",
    "backgroundColor": "#15141F",
    "surfaceColor": "#241C3F",
    "textColor": "#F8F7F4",
    "fontHeading": "#FFC84F"
  }
}
```

#### `fields` — the editor form

`fields` defines the inputs users see when customizing your template. Each field
drives a value that gets passed to your component as a prop. Supported `type`
values:

`text`, `textarea`, `gallery`, `music`, `date`, `url`, `toggle`, `repeater`,
`section`.

Field options you can set:

- `id` *(required)* — stable key for the field.
- `label` *(required)* — what the user sees.
- `type` *(required)* — one of the types above.
- `required` — boolean.
- `placeholder`, `helper` — UI hints.
- `maxLength` — for text/textarea (the message field is capped at 300 by
  convention).
- `maxItems` — for galleries (photos are capped at 10 by convention).
- `defaultValue` — initial value.
- `subFields` — nested fields, used with `repeater`/`section`.
- `dependsOn` — `{ "field": "...", "value": ... }` to conditionally show a field.

> Keep the core four — `recipient_name`, `sender_name`, `message`, `photos` —
> because they map directly to the props your component receives (see §3). You're
> free to add extra fields on top.

#### `theme` — your color and type tokens

All four color values must be valid hex (`#fff`, `#ffffff`, or `#ffffffff`):

- `primaryColor` — accent / call-to-action color.
- `backgroundColor` — page background.
- `surfaceColor` — cards and panels.
- `textColor` — body text.
- `fontHeading` — a non-empty string for your heading font/token.

These are metadata for the marketplace and editor; your component is still
responsible for actually applying its own styles.

---

## 3. Building your template

### The `TemplateProps` contract

Your default-exported component is called with **exactly** these props:

```ts
type TemplateProps = {
  recipientName: string
  senderName: string
  message: string
  photos: string[]
  musicUrl?: string
  previewMode?: boolean
}
```

**Use these exact prop names.** The platform maps a wish's data onto this shape
and hands it to your component — if you rename or restructure them, your template
won't receive any data and will render empty (or break). `recipientName`,
`senderName`, `message`, and `photos` are always provided; `musicUrl` and
`previewMode` are optional.

### A minimal working example

`src/index.tsx` must **export a default component** and reference
`TemplateProps` (the validator checks for both). Here's a clean, complete
example you can build from:

```tsx
import type { CSSProperties } from 'react'

export type TemplateProps = {
  recipientName: string
  senderName: string
  message: string
  photos: string[]
  musicUrl?: string
  previewMode?: boolean
}

const shell: CSSProperties = {
  minHeight: '100vh',
  display: 'grid',
  placeItems: 'center',
  padding: '48px 24px',
  background: 'linear-gradient(135deg, #15141f, #241c3f)',
  color: '#F8F7F4',
  fontFamily: 'Inter, system-ui, sans-serif',
}

export default function ConfettiBirthday({
  recipientName,
  senderName,
  message,
  photos,
  musicUrl,
  previewMode,
}: TemplateProps) {
  const heading = recipientName || 'Someone special'
  const hasPhotos = photos.length > 0

  return (
    <main style={shell}>
      <section style={{ maxWidth: 640, textAlign: 'center' }}>
        <h1 style={{ fontSize: 'clamp(40px, 8vw, 80px)', margin: '0 0 16px' }}>
          Happy Birthday, {heading}!
        </h1>

        <p style={{ fontSize: 18, lineHeight: 1.7, opacity: 0.85 }}>
          {message || 'Wishing you a wonderful day.'}
        </p>

        {/* Always handle an empty photos array gracefully */}
        {hasPhotos && (
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginTop: 24 }}>
            {photos.map((url, i) => (
              <img
                key={i}
                src={url}
                alt=""
                style={{ width: 120, height: 120, objectFit: 'cover', borderRadius: 16 }}
              />
            ))}
          </div>
        )}

        {/* Only autoplay music in the real, published view — never in preview */}
        {musicUrl && !previewMode && (
          <audio src={musicUrl} autoPlay loop />
        )}

        {senderName && (
          <p style={{ marginTop: 28, opacity: 0.7 }}>With love, {senderName}</p>
        )}
      </section>
    </main>
  )
}
```

### `previewMode` — be a good preview citizen

When `previewMode` is `true`, your template is being rendered in a small,
non-interactive context (the editor preview, the admin review queue, etc.). In
preview mode you should:

- **Don't autoplay audio.** Gate any `autoPlay` behind `!previewMode`, like the
  `<audio>` element above.
- **Tone down or skip heavy animations.** A static, representative frame reads
  better than a half-finished animation loop in a tiny box.
- **Avoid timers/loops** that assume a full viewport or a long-lived session.

When `previewMode` is falsy (the real `/w/:slug` page), go all out — that's the
moment the recipient actually experiences your work.

---

## 4. Validating and building

### `wishcraft validate`

Run this early and often. It checks that your project is well-formed **before**
you waste time bundling:

```bash
wishcraft validate
```

It verifies:

- `config.json` exists and matches the schema (all required fields, correct
  types).
- `slug` is lowercase kebab-case.
- All four `theme` colors are valid hex, and `fontHeading` is a non-empty string.
- `src/index.tsx` exists, has a `export default`, and references `TemplateProps`.
- `preview.png` exists.

On success you'll see `Validation passed.` Otherwise you'll get a list of issues
keyed by file/field, e.g. `config.json.slug: Slug must be lowercase kebab-case.`

### `wishcraft build`

```bash
wishcraft build
```

This bundles your template with esbuild and writes the publishable artifacts into
`dist/`:

```
dist/
├── bundle.js     # Minified IIFE exposing the WishCraftTemplate global
├── config.json   # Copied from your project root
└── preview.png   # Copied from your project root
```

Under the hood the build is an **IIFE bundle** (`globalName: WishCraftTemplate`),
minified, with `react` and `react-dom` marked **external** and JSX set to
`automatic`. Build also re-runs validation first, so a broken config fails the
build.

#### Bundle size limit

If `dist/bundle.js` exceeds **500 KB**, the build prints a warning:

```
Warning: dist/bundle.js is 612.4 KB and exceeds the 500 KB limit.
```

It's a warning, not a hard failure — but keep bundles lean. Large bundles load
slowly on the phones most recipients use, and reviewers will scrutinize them.
The usual culprit is accidentally bundling a heavy dependency; see §7.

---

## 5. Submitting for review

Once you're happy with the build and your `preview.png` is a real screenshot:

```bash
wishcraft submit
```

`submit` reads your saved login token, confirms `dist/bundle.js`,
`dist/config.json`, and `dist/preview.png` all exist (run `build` first if they
don't), and uploads them to the WishCraft review queue.

> If you see `dist/ artifacts are missing. Run wishcraft build before submit.`,
> just run `wishcraft build` and try again. If you see a token error, run
> `wishcraft login`.

### What happens next

- An admin reviews your submission, typically **within 48 hours**.
- Reviewers check that your template:
  - **Renders correctly** across the standard prop set.
  - Has **no broken fields** — every `config.json` field maps to something your
    component handles, including empty/missing values.
  - Makes **no suspicious network calls** (see the constraints in §7).

### If your template is rejected

Rejection isn't the end — it comes with a **note explaining what to fix**. Read
the note, address the issues, then rebuild and resubmit:

```bash
wishcraft validate
wishcraft build
wishcraft submit
```

There's no limit on resubmissions, so iterate freely.

---

## 6. After approval

Once approved:

- Your template **appears in the marketplace** alongside the rest of the
  collection.
- **Users can create wishes with it** — they pick your template, fill in the
  fields you defined, and publish a shareable `/w/:slug` page powered by your
  component.
- **Revenue sharing** for paid templates is on the roadmap — details coming soon.

---

## 7. Technical constraints

Your template runs inside a **sandboxed iframe** (`sandbox="allow-scripts"`).
This keeps recipients safe from untrusted template code, and it shapes what you
can and can't do:

- **No storage or cookies.** `localStorage`, `sessionStorage`, and `cookie`
  access are unavailable in the sandbox. Keep all state in React.
- **No external `fetch` calls.** Templates must be self-contained. Don't phone
  home, call third-party APIs, or load remote scripts at runtime. Use the data
  passed in via `TemplateProps` (including image/music URLs) instead.
- **React 18 only, loaded from a CDN.** The host page provides `React` and
  `ReactDOM` (v18) globally. **Do not bundle React** — it's already marked
  external in the build, and bundling your own copy will conflict with the
  runtime.
- **External dependencies aren't available at runtime.** Anything you mark as
  external in your build won't be present in the sandbox (only React/ReactDOM
  are). If you need a small helper, bundle it (mind the 500 KB limit) or inline
  it — don't rely on an external you can't ship.
- **No server-side code.** Templates are **pure client-side React**. There's no
  Node runtime, no SSR, no API routes — just a component that renders from props.

---

## 8. Tips for great templates

- **Handle an empty `photos` array gracefully.** Many wishes have zero photos.
  Guard your gallery (`photos.length > 0`) and design a layout that looks
  intentional with no images.
- **Test with `previewMode` both `true` and `false`.** Confirm animations and
  autoplay are suppressed in preview and shine in the live view.
- **Go mobile-first.** Most recipients open wishes on a phone. Use fluid sizing
  (`clamp()`, `%`, `vw`), generous tap targets, and a single-column layout that
  scales up — not a desktop layout squeezed down.
- **Keep animations subtle.** The personal message and photos are the star. Use
  motion to support the moment, not to compete with it. Subtle, tasteful, and
  fast beats flashy and overwhelming.

---

Happy building — we can't wait to see what you make. 🎉
