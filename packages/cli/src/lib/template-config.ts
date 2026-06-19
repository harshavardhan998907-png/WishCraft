import { z } from 'zod'

export const templateCategories = ['birthday', 'wedding', 'anniversary', 'festival', 'graduation', 'baby_shower', 'farewell', 'valentine', 'other'] as const

export const formFieldTypes = ['text', 'textarea', 'gallery', 'music', 'date', 'url', 'toggle', 'repeater', 'section'] as const

export type TemplateCategory = (typeof templateCategories)[number]
export type FormFieldType = (typeof formFieldTypes)[number]

export interface FieldDependency {
  field: string
  value: unknown
}

export interface FormFieldDefinition {
  id: string
  label: string
  type: FormFieldType
  required?: boolean
  placeholder?: string
  helper?: string
  maxLength?: number
  maxItems?: number
  defaultValue?: unknown
  subFields?: FormFieldDefinition[]
  dependsOn?: FieldDependency
}

export type FormSchema = FormFieldDefinition[]

export interface TemplateTheme {
  [colorName: string]: string
}

export interface TemplateProjectConfig {
  name: string
  slug: string
  category: TemplateCategory
  price: number
  sdkVersion: string
  fields: FormSchema
  theme: TemplateTheme
}

export const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/
export const semverPattern = /^\d+\.\d+\.\d+(?:[-+][0-9A-Za-z.-]+)?$/
export const hexColorPattern = /^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/

const hexColorSchema = z.string().regex(hexColorPattern, 'Use a valid hex color like #fff or #ffffff.')
const dependencySchema = z.object({
  field: z.string().min(1, 'dependsOn.field is required.'),
  value: z.unknown(),
}).strict()

export const formFieldSchema: z.ZodType<FormFieldDefinition> = z.lazy(() => z.object({
  id: z.string().min(1, 'Field id is required.'),
  label: z.string().min(1, 'Field label is required.'),
  type: z.enum(formFieldTypes),
  required: z.boolean().optional(),
  placeholder: z.string().optional(),
  helper: z.string().optional(),
  maxLength: z.number().int().positive().optional(),
  maxItems: z.number().int().positive().optional(),
  defaultValue: z.unknown().optional(),
  subFields: z.array(formFieldSchema).optional(),
  dependsOn: dependencySchema.optional(),
}).strict()) as z.ZodType<FormFieldDefinition>

export const templateProjectConfigSchema: z.ZodType<TemplateProjectConfig> = z.object({
  name: z.string().min(1, 'config.json.name is required.'),
  slug: z.string().regex(slugPattern, 'config.json.slug must be lowercase kebab-case.'),
  category: z.enum(templateCategories),
  price: z.number().int().refine((value) => value >= 0, {
    message: 'config.json.price must be a non-negative integer.',
  }),
  sdkVersion: z.string().regex(semverPattern, 'config.json.sdkVersion must be a semver string.'),
  fields: z.array(formFieldSchema),
  theme: z.object({}).catchall(hexColorSchema).refine((value) => Object.keys(value).length > 0, {
    message: 'config.json.theme must include at least one hex color.',
  }),
}).strict()
