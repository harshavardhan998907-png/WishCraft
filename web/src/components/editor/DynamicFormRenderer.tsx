import { Input } from '../ui/Input'
import { Textarea } from '../ui/Textarea'
import { ImageUpload } from '../ui/ImageUpload'
import type { FormFieldDefinition, FormSchema } from '../../template-engine'
import { Plus, Trash2 } from 'lucide-react'

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

function boolValue(value: unknown, defaultVal = false): boolean {
  if (typeof value === 'boolean') return value
  return defaultVal
}

function arrayValue(value: unknown): Record<string, unknown>[] {
  return Array.isArray(value) ? value : []
}

// ─── Toggle Switch ──────────────────────────────────────────────────────────

function ToggleField({
  field,
  value,
  onChange,
}: {
  field: FormFieldDefinition
  value: unknown
  onChange: (id: string, val: unknown) => void
}) {
  const checked = boolValue(value, field.defaultValue === true)
  return (
    <div className="flex items-center justify-between py-3 px-4 rounded-xl bg-zinc-50 dark:bg-white/5 border border-zinc-200 dark:border-white/10">
      <div className="flex-1 min-w-0 mr-4">
        <span className="text-sm font-semibold text-ink dark:text-white/90">{field.label}</span>
        {field.helper ? <p className="text-[11px] text-zinc-400 dark:text-zinc-500 mt-0.5">{field.helper}</p> : null}
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(field.id, !checked)}
        className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/50 focus-visible:ring-offset-2 ${checked ? 'bg-brand' : 'bg-zinc-300 dark:bg-white/20'}`}
      >
        <span
          className={`pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow-lg transform transition-transform duration-200 ${checked ? 'translate-x-5' : 'translate-x-0'}`}
        />
      </button>
    </div>
  )
}

// ─── Repeater Field ─────────────────────────────────────────────────────────

function RepeaterField({
  field,
  value,
  onChange,
}: {
  field: FormFieldDefinition
  value: unknown
  onChange: (id: string, val: unknown) => void
}) {
  const items = arrayValue(value)
  const subFields = field.subFields ?? []

  const addItem = () => {
    const newItem: Record<string, unknown> = {}
    subFields.forEach((sf) => { newItem[sf.id] = '' })
    onChange(field.id, [...items, newItem])
  }

  const removeItem = (index: number) => {
    onChange(field.id, items.filter((_, i) => i !== index))
  }

  const updateItem = (index: number, subFieldId: string, subValue: unknown) => {
    const updated = items.map((item, i) =>
      i === index ? { ...item, [subFieldId]: subValue } : item
    )
    onChange(field.id, updated)
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="text-sm font-semibold text-ink dark:text-white/90">{field.label}</label>
        <span className="text-[11px] text-zinc-400 dark:text-zinc-500">
          {items.length} item{items.length !== 1 ? 's' : ''}
        </span>
      </div>

      {items.map((item, idx) => (
        <div
          key={idx}
          className="relative rounded-xl border border-zinc-200 dark:border-white/10 bg-white dark:bg-white/5 p-4 space-y-3"
        >
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
              #{idx + 1}
            </span>
            <button
              type="button"
              onClick={() => removeItem(idx)}
              className="text-zinc-400 hover:text-red-500 dark:hover:text-red-400 transition-colors p-1 rounded-md hover:bg-red-50 dark:hover:bg-red-400/10"
              aria-label={`Remove item ${idx + 1}`}
            >
              <Trash2 size={14} />
            </button>
          </div>
          {subFields.map((sf) => {
            const subVal = (item as Record<string, unknown>)[sf.id]
            if (sf.type === 'textarea') {
              return (
                <Textarea
                  key={sf.id}
                  label={sf.label}
                  placeholder={sf.placeholder}
                  maxLength={sf.maxLength}
                  value={stringValue(subVal)}
                  onChange={(e) => updateItem(idx, sf.id, e.target.value)}
                />
              )
            }
            return (
              <Input
                key={sf.id}
                label={sf.label}
                placeholder={sf.placeholder}
                value={stringValue(subVal)}
                onChange={(e) => updateItem(idx, sf.id, e.target.value)}
              />
            )
          })}
        </div>
      ))}

      <button
        type="button"
        onClick={addItem}
        className="flex items-center gap-2 w-full justify-center py-2.5 rounded-xl border-2 border-dashed border-zinc-300 dark:border-white/15 text-sm font-semibold text-zinc-500 dark:text-zinc-400 hover:border-brand hover:text-brand dark:hover:border-brand dark:hover:text-brand transition-colors"
      >
        <Plus size={16} />
        Add {field.label?.replace(/s$/, '') ?? 'item'}
      </button>

      {field.helper ? <p className="text-[11px] text-zinc-400 dark:text-zinc-500">{field.helper}</p> : null}
    </div>
  )
}

// ─── Section Header ─────────────────────────────────────────────────────────

function SectionHeader({ field }: { field: FormFieldDefinition }) {
  return (
    <div className="pt-4 pb-1 border-b border-zinc-200 dark:border-white/10">
      <h3 className="text-sm font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
        {field.label}
      </h3>
      {field.helper ? (
        <p className="text-[11px] text-zinc-400 dark:text-zinc-500 mt-1">{field.helper}</p>
      ) : null}
    </div>
  )
}

// ─── Main Renderer ──────────────────────────────────────────────────────────

export function DynamicFormRenderer({ schema, values, templateId, allowMusic = true, onChange }: DynamicFormRendererProps) {
  return (
    <div className="space-y-5">
      {schema.map((field) => {
        // Conditional visibility: if dependsOn is specified, hide when the dependency doesn't match
        if (field.dependsOn) {
          const depVal = values[field.dependsOn.field]
          // For toggles with defaultValue, use the defaultValue if the field hasn't been set yet
          const depField = schema.find((f) => f.id === field.dependsOn!.field)
          const resolvedDepVal = depVal !== undefined ? depVal : depField?.defaultValue
          if (resolvedDepVal !== field.dependsOn.value) return null
        }

        const value = values[field.id]

        // Section header (non-data, just visual grouping)
        if (field.type === 'section') {
          return <SectionHeader key={field.id} field={field} />
        }

        // Toggle switch
        if (field.type === 'toggle') {
          return <ToggleField key={field.id} field={field} value={value} onChange={onChange} />
        }

        // Repeater
        if (field.type === 'repeater') {
          return <RepeaterField key={field.id} field={field} value={value} onChange={onChange} />
        }

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
