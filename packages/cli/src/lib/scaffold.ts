import * as fs from 'node:fs'
import * as path from 'node:path'
import { fileExists, writeBinaryFile, writeJsonFile, writeTextFile } from './fs'
import { getProjectPaths } from './paths'
import { templateCategories } from './template-config'

export interface InitOptions {
  name: string
  slug: string
  category: (typeof templateCategories)[number]
  price: number
  sdkVersion: string
}

const previewPng = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jxNcAAAAASUVORK5CYII=',
  'base64',
)

function templateIndexSource(templateName: string): string {
  const sanitizedName = templateName.replace(/[^A-Za-z0-9_$]/g, '')
  const functionName = /^[A-Za-z_$]/.test(sanitizedName) ? sanitizedName : `WishCraft${sanitizedName}`
  const safeFunctionName = functionName.length > 0 ? functionName : 'WishCraftTemplate'

  return `/*
 * WishCraft Template
 *
 * RULES:
 * 1. Export a default React component
 * 2. Accept exactly these props (no additions, no removals)
 * 3. Use only inline styles — no external CSS imports
 * 4. No routing, no fetch calls, no localStorage
 * 5. React is provided globally — do not import it
 *
 * Your template renders inside a sandboxed iframe. External stylesheets,
 * network requests, and browser navigation are NOT available — anything
 * that relies on them will silently break. Keep everything self-contained.
 */

// ❌ DO NOT CHANGE: this type-only import is erased at build time and never
// pulls React in at runtime. It just gives you autocomplete for CSSProperties.
import type { CSSProperties } from 'react'

// ❌ DO NOT CHANGE: Props must stay exactly as defined.
// These are the ONLY values WishCraft passes to your template. Adding or
// renaming a prop here means it will always be undefined when rendered.
export type TemplateProps = {
  recipientName: string
  senderName: string
  message: string
  photos: string[]
  musicUrl?: string
  previewMode?: boolean
}

// ✅ CUSTOMIZE: Change colors, fonts, layout below.
// This palette is the quickest thing to tweak — swap the hex values to
// re-theme the whole page, or replace the styles entirely with your own.
const palette = {
  bgStart: '#1a1035',
  bgMid: '#311b5e',
  bgEnd: '#0b2a4a',
  accent: '#ffb347',
  accentSoft: 'rgba(255, 179, 71, 0.16)',
  text: '#f7f5ff',
  textMuted: 'rgba(247, 245, 255, 0.72)',
  cardBg: 'rgba(255, 255, 255, 0.07)',
  cardBorder: 'rgba(255, 255, 255, 0.16)',
}

// ✅ CUSTOMIZE: animation keyframes live in this single <style> string.
// A single inline <style> tag is allowed; external CSS files are not.
const keyframes = \`
  @keyframes wcFadeUp {
    from { opacity: 0; transform: translateY(28px); }
    to { opacity: 1; transform: translateY(0); }
  }
  @keyframes wcGlow {
    0%, 100% { text-shadow: 0 0 28px rgba(255, 179, 71, 0.35); }
    50% { text-shadow: 0 0 48px rgba(255, 179, 71, 0.6); }
  }
\`

// ✅ CUSTOMIZE: every style object below is yours to redesign.
const shellStyle: CSSProperties = {
  minHeight: '100vh',
  width: '100%',
  boxSizing: 'border-box',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '40px',
  padding: '64px 24px',
  color: palette.text,
  textAlign: 'center',
  background:
    'radial-gradient(circle at 20% 18%, rgba(255, 179, 71, 0.22), transparent 42%), ' +
    'radial-gradient(circle at 82% 82%, rgba(99, 102, 241, 0.28), transparent 46%), ' +
    'linear-gradient(135deg, ' + palette.bgStart + ' 0%, ' + palette.bgMid + ' 52%, ' + palette.bgEnd + ' 100%)',
  fontFamily:
    '"Inter", "SF Pro Display", "Segoe UI", system-ui, -apple-system, BlinkMacSystemFont, sans-serif',
}

const eyebrowStyle: CSSProperties = {
  margin: 0,
  letterSpacing: '0.32em',
  textTransform: 'uppercase',
  color: palette.accent,
  fontSize: '13px',
  fontWeight: 700,
  animation: 'wcFadeUp 0.6s ease both',
}

const heroStyle: CSSProperties = {
  margin: '8px 0 0',
  fontSize: 'clamp(48px, 11vw, 120px)',
  lineHeight: 0.92,
  fontWeight: 800,
  letterSpacing: '-0.02em',
  animation: 'wcFadeUp 0.7s ease both, wcGlow 4s ease-in-out infinite',
}

const cardStyle: CSSProperties = {
  maxWidth: '640px',
  width: '100%',
  borderRadius: '28px',
  padding: '36px 32px',
  background: palette.cardBg,
  border: '1px solid ' + palette.cardBorder,
  boxShadow: '0 28px 90px rgba(0, 0, 0, 0.4)',
  backdropFilter: 'blur(22px)',
  animation: 'wcFadeUp 0.8s ease both',
}

const messageStyle: CSSProperties = {
  margin: 0,
  fontSize: 'clamp(18px, 2.4vw, 24px)',
  lineHeight: 1.7,
  fontWeight: 400,
  color: palette.text,
}

const photoGridStyle: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
  gap: '16px',
  maxWidth: '720px',
  width: '100%',
  animation: 'wcFadeUp 0.9s ease both',
}

const photoFrameStyle: CSSProperties = {
  position: 'relative',
  aspectRatio: '1 / 1',
  borderRadius: '20px',
  overflow: 'hidden',
  border: '1px solid ' + palette.cardBorder,
  boxShadow: '0 16px 50px rgba(0, 0, 0, 0.35)',
}

const photoStyle: CSSProperties = {
  width: '100%',
  height: '100%',
  objectFit: 'cover',
  display: 'block',
}

const emptyPhotoStyle: CSSProperties = {
  maxWidth: '640px',
  width: '100%',
  padding: '28px',
  borderRadius: '20px',
  border: '1px dashed ' + palette.cardBorder,
  color: palette.textMuted,
  fontSize: '15px',
}

const senderStyle: CSSProperties = {
  margin: 0,
  fontSize: '15px',
  color: palette.textMuted,
  animation: 'wcFadeUp 1s ease both',
}

const senderNameStyle: CSSProperties = {
  margin: '4px 0 0',
  fontSize: '22px',
  fontWeight: 600,
  color: palette.accent,
}

const musicPillStyle: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: '8px',
  padding: '8px 16px',
  borderRadius: '999px',
  background: palette.accentSoft,
  border: '1px solid ' + palette.cardBorder,
  fontSize: '13px',
  color: palette.text,
}

const previewBadgeStyle: CSSProperties = {
  position: 'fixed',
  top: '16px',
  right: '16px',
  padding: '8px 14px',
  borderRadius: '999px',
  background: 'rgba(0, 0, 0, 0.45)',
  border: '1px solid ' + palette.cardBorder,
  fontSize: '12px',
  fontWeight: 700,
  letterSpacing: '0.12em',
  textTransform: 'uppercase',
  color: palette.accent,
  backdropFilter: 'blur(8px)',
  zIndex: 10,
}

export default function ${safeFunctionName}({
  recipientName,
  senderName,
  message,
  photos,
  musicUrl,
  previewMode,
}: TemplateProps) {
  // ❌ DO NOT CHANGE: render straight from the props above.
  // Don't fetch data, read localStorage, or navigate — none of it works here.
  const hasPhotos = photos.length > 0

  return (
    <main style={shellStyle}>
      {/* ✅ CUSTOMIZE: animations are defined in this one inline style tag. */}
      <style>{keyframes}</style>

      {/* previewMode: WishCraft sets this true in the editor preview only. */}
      {previewMode ? <div style={previewBadgeStyle}>Preview Mode</div> : null}

      <div>
        <p style={eyebrowStyle}>A wish for you</p>
        {/* recipientName — the hero of the page. */}
        <h1 style={heroStyle}>{recipientName || 'Someone Special'}</h1>
      </div>

      {/* message — shown inside a glassy card. */}
      <div style={cardStyle}>
        <p style={messageStyle}>
          {message || 'Your heartfelt message will appear right here.'}
        </p>
      </div>

      {/* photos — mapped into a responsive grid, with a graceful empty state. */}
      {hasPhotos ? (
        <div style={photoGridStyle}>
          {photos.map((photo, index) => (
            <div key={index} style={photoFrameStyle}>
              <img
                src={photo}
                alt={'Memory ' + (index + 1)}
                style={photoStyle}
                loading="lazy"
              />
            </div>
          ))}
        </div>
      ) : (
        <div style={emptyPhotoStyle}>
          Add photos in the editor to fill this space with memories.
        </div>
      )}

      {/* musicUrl is optional — show a subtle indicator when one is attached. */}
      {musicUrl ? <span style={musicPillStyle}>🎵 With a song attached</span> : null}

      {/* senderName — attribution at the bottom. */}
      <div>
        <p style={senderStyle}>With love,</p>
        <p style={senderNameStyle}>{senderName || 'Someone who cares'}</p>
      </div>
    </main>
  )
}
`
}

function packageJson(slug: string): string {
  return `{
  "name": "@wishcraft/template-${slug}",
  "private": true,
  "version": "0.0.0",
  "type": "module",
  "scripts": {
    "build": "wishcraft build",
    "validate": "wishcraft validate",
    "submit": "wishcraft submit"
  },
  "dependencies": {
    "react": "^18.3.1",
    "react-dom": "^18.3.1"
  },
  "devDependencies": {
    "@types/react": "^18.3.18",
    "@types/react-dom": "^18.3.5",
    "typescript": "^5.9.3"
  }
}
`
}

function tsconfigJson(): string {
  return `{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "strict": true,
    "jsx": "react-jsx",
    "lib": ["ES2022", "DOM"],
    "noEmit": true,
    "esModuleInterop": true,
    "allowSyntheticDefaultImports": true,
    "resolveJsonModule": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "isolatedModules": true,
    "useUnknownInCatchVariables": true
  },
  "include": ["src/**/*.ts", "src/**/*.tsx"]
}
`
}

function readme(templateName: string, slug: string): string {
  return `# ${templateName}

This template was scaffolded by WishCraft.

## Commands

- \`wishcraft validate\`
- \`wishcraft build\`
- \`wishcraft submit\`

## Template slug

\`${slug}\`

## Files

- \`src/index.tsx\`
- \`config.json\`
- \`preview.png\`
- \`package.json\`
- \`tsconfig.json\`
`
}

export function scaffoldTemplateProject(options: InitOptions, projectRoot = process.cwd()): void {
  const paths = getProjectPaths(projectRoot)
  const visibleEntries = fs.readdirSync(paths.root).filter((entry) => !entry.startsWith('.'))

  if (
    visibleEntries.length > 0 ||
    fileExists(paths.configPath) ||
    fileExists(paths.sourcePath) ||
    fileExists(paths.previewPath) ||
    fileExists(path.join(paths.root, 'package.json')) ||
    fileExists(path.join(paths.root, 'tsconfig.json')) ||
    fileExists(path.join(paths.root, 'README.md'))
  ) {
    throw new Error('This directory already looks like a template project. Use a fresh folder for init.')
  }

  fs.mkdirSync(paths.srcDir, { recursive: true })
  writeTextFile(paths.sourcePath, templateIndexSource(options.name))
  writeJsonFile(paths.configPath, {
    name: options.name,
    slug: options.slug,
    category: options.category,
    price: options.price,
    sdkVersion: options.sdkVersion,
    fields: [
      {
        id: 'recipient_name',
        label: "Recipient's Name",
        type: 'text',
        required: true,
        placeholder: 'e.g. Amelia',
      },
      {
        id: 'sender_name',
        label: 'Your Name',
        type: 'text',
        required: true,
        placeholder: 'e.g. Daniel',
      },
      {
        id: 'message',
        label: 'Message',
        type: 'textarea',
        placeholder: 'Write a warm, personal wish...',
        maxLength: 300,
      },
      {
        id: 'photos',
        label: 'Photos',
        type: 'gallery',
        maxItems: 10,
      },
      {
        id: 'music',
        label: 'Music URL',
        type: 'music',
      },
    ],
    theme: {
      primaryColor: '#FF7A5E',
      surfaceColor: '#241C3F',
      backgroundColor: '#15141F',
      fontHeading: '#FFC84F',
      textColor: '#F8F7F4',
    },
  })
  writeBinaryFile(paths.previewPath, previewPng)
  writeTextFile(path.join(paths.root, 'package.json'), packageJson(options.slug))
  writeTextFile(path.join(paths.root, 'tsconfig.json'), tsconfigJson())
  writeTextFile(path.join(paths.root, 'README.md'), readme(options.name, options.slug))
  console.warn('⚠ Replace preview.png with a real screenshot before submitting.')
}
