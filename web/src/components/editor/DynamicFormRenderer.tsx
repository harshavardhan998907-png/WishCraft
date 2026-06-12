import { Input } from '../ui/Input'
import { Textarea } from '../ui/Textarea'
import { ImageUpload } from '../ui/ImageUpload'
import type { FormSchema } from '../../template-engine'

interface DynamicFormRendererProps {
  schema: FormSchema
  values: Record<string, unknown>
  templateId?: string | null
  allowMusic?: boolean
  onChange: (fieldId: string, value: unknown) => void
}

const musicTracks = ['Gentle Piano', 'Warm Celebration', 'Soft Romance', 'Festival Lights', 'Bright Future']

function stringValue(value: unknown): string {
  return typeof value === 'string' ? value : ''
}

function listValue(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string') : []
}

export function DynamicFormRenderer({ schema, values, templateId, allowMusic = true, onChange }: DynamicFormRendererProps) {
  return (
    <div className="space-y-5">
      {schema.map((field) => {
        const value = values[field.id]

        if (field.type === 'textarea') {
          return (
            <Textarea
              key={field.id}
              label={`${field.label}${field.required ? ' (Required)' : ''}`}
              placeholder={field.placeholder}
              maxLength={field.maxLength}
              value={stringValue(value)}
              onChange={(event) => onChange(field.id, event.target.value)}
              required={field.required}
            />
          )
        }

        if (field.type === 'gallery') {
          const urls = listValue(value)
          return (
            <div key={field.id} className="space-y-1.5">
              <label className="text-sm font-semibold text-ink dark:text-white/90">{field.label}</label>
              <ImageUpload
                urls={urls}
                onUploaded={(url) => onChange(field.id, [...urls, url].slice(0, field.maxItems ?? 5))}
                onRemove={(url) => onChange(field.id, urls.filter((item) => item !== url))}
                templateId={templateId}
              />
              {field.helper ? <p className="text-[11px] text-zinc-400 dark:text-zinc-500">{field.helper}</p> : null}
            </div>
          )
        }

        if (field.type === 'music') {
          if (!allowMusic) return null
          return (
            <label key={field.id} className="block space-y-1.5">
              <span className="text-sm font-semibold text-ink dark:text-white/90">{field.label}</span>
              <select
                className="focus-ring w-full rounded-xl border border-black/15 bg-white px-3 py-2.5 text-ink dark:border-white/10 dark:bg-white/10 dark:text-white"
                value={stringValue(value)}
                onChange={(event) => onChange(field.id, event.target.value || null)}
              >
                <option value="">No music</option>
                {musicTracks.map((track) => <option key={track} value={track}>{track}</option>)}
              </select>
            </label>
          )
        }

        return (
          <Input
            key={field.id}
            type={field.type === 'date' ? 'date' : field.type === 'url' ? 'url' : 'text'}
            label={`${field.label}${field.required ? ' (Required)' : ''}`}
            placeholder={field.placeholder}
            helper={field.helper}
            value={stringValue(value)}
            onChange={(event) => onChange(field.id, event.target.value)}
            required={field.required}
          />
        )
      })}
    </div>
  )
}

