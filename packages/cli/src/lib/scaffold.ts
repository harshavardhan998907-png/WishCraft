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

  return `import type { CSSProperties } from 'react'

export type TemplateProps = {
  recipientName: string
  senderName: string
  customMessage: string
  photoUrls: string[]
  musicUrl?: string
  previewMode?: boolean
}

const shellStyles: CSSProperties = {
  minHeight: '100vh',
  padding: '48px 24px',
  color: '#F8F7F4',
  background:
    'radial-gradient(circle at top, rgba(255, 200, 79, 0.28), transparent 32%), linear-gradient(135deg, #15141f 0%, #241c3f 48%, #0f2a2d 100%)',
  fontFamily:
    '"Inter", "SF Pro Display", "Segoe UI", system-ui, -apple-system, BlinkMacSystemFont, sans-serif',
}

const cardStyles: CSSProperties = {
  maxWidth: '960px',
  margin: '0 auto',
  borderRadius: '32px',
  padding: '32px',
  background: 'rgba(255, 255, 255, 0.08)',
  border: '1px solid rgba(255, 255, 255, 0.14)',
  boxShadow: '0 24px 80px rgba(0, 0, 0, 0.35)',
  backdropFilter: 'blur(24px)',
}

export default function ${safeFunctionName}({
  recipientName,
  senderName,
  customMessage,
  photoUrls,
  previewMode,
}: TemplateProps) {
  const heading = recipientName || 'Someone special'
  const subheading = senderName ? \`With love, \${senderName}\` : 'A WishCraft template'

  return (
    <main style={shellStyles}>
      <section style={cardStyles}>
        <p style={{ margin: 0, letterSpacing: '0.22em', textTransform: 'uppercase', color: '#FFC84F', fontSize: 12, fontWeight: 800 }}>
          WishCraft template
        </p>
        <h1 style={{ margin: '16px 0 12px', fontSize: 'clamp(40px, 8vw, 84px)', lineHeight: 0.95 }}>
          {heading}
        </h1>
        <p style={{ margin: 0, fontSize: 18, lineHeight: 1.7, maxWidth: 620, color: 'rgba(248, 247, 244, 0.82)' }}>
          {customMessage || 'Start here by telling a story with images, motion, and a little magic.'}
        </p>
        <div style={{ marginTop: 28, display: 'flex', flexWrap: 'wrap', gap: 12 }}>
          <span style={{ padding: '10px 14px', borderRadius: 999, background: 'rgba(255, 122, 94, 0.16)', border: '1px solid rgba(255, 122, 94, 0.32)' }}>
            {subheading}
          </span>
          <span style={{ padding: '10px 14px', borderRadius: 999, background: 'rgba(73, 199, 164, 0.16)', border: '1px solid rgba(73, 199, 164, 0.32)' }}>
            {photoUrls.length} photo{photoUrls.length === 1 ? '' : 's'}
          </span>
          {previewMode ? (
            <span style={{ padding: '10px 14px', borderRadius: 999, background: 'rgba(255, 255, 255, 0.08)', border: '1px solid rgba(255, 255, 255, 0.12)' }}>
              Preview mode
            </span>
          ) : null}
        </div>
      </section>
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
