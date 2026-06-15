import { createAnonServerClient, createServiceRoleServerClient, createAuthedServerClient, jsonResponse, readBearerToken } from '../../_lib/supabase'

type TemplateCategory = 'birthday' | 'anniversary' | 'wedding' | 'thankyou' | 'festival' | 'graduation'

type TemplateTheme = {
  primaryColor: string
  backgroundColor: string
  surfaceColor: string
  textColor: string
  fontHeading: string
}

type TemplateSubmissionConfig = {
  name: string
  slug: string
  category: TemplateCategory
  price: number
  sdkVersion: '1.0.0'
  fields: unknown[]
  theme: TemplateTheme
}

type ProfileRow = {
  role: string | null
}

type SubmissionRow = {
  config: unknown
}

type ValidationResult<T> =
  | { success: true; data: T }
  | { success: false; error: string }

const allowedCategories: ReadonlyArray<TemplateCategory> = [
  'birthday',
  'anniversary',
  'wedding',
  'thankyou',
  'festival',
  'graduation',
]

const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/
const hexColorPattern = /^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value)
}

function isTemplateCategory(value: unknown): value is TemplateCategory {
  return typeof value === 'string' && allowedCategories.includes(value as TemplateCategory)
}

function validateHexColor(value: unknown, fieldPath: string): ValidationResult<string> {
  if (typeof value !== 'string' || !hexColorPattern.test(value)) {
    return { success: false, error: `${fieldPath}: Must be a valid hex color.` }
  }

  return { success: true, data: value }
}

function validateTemplateTheme(value: unknown): ValidationResult<TemplateTheme> {
  if (!isRecord(value)) {
    return { success: false, error: 'theme: Theme must be an object.' }
  }

  const primaryColor = value.primaryColor
  const backgroundColor = value.backgroundColor
  const surfaceColor = value.surfaceColor
  const textColor = value.textColor
  const fontHeading = value.fontHeading

  const primaryColorResult = validateHexColor(primaryColor, 'theme.primaryColor')
  if (!primaryColorResult.success) return primaryColorResult

  const backgroundColorResult = validateHexColor(backgroundColor, 'theme.backgroundColor')
  if (!backgroundColorResult.success) return backgroundColorResult

  const surfaceColorResult = validateHexColor(surfaceColor, 'theme.surfaceColor')
  if (!surfaceColorResult.success) return surfaceColorResult

  const textColorResult = validateHexColor(textColor, 'theme.textColor')
  if (!textColorResult.success) return textColorResult

  if (!isNonEmptyString(fontHeading)) {
    return { success: false, error: 'theme.fontHeading: Font heading is required.' }
  }

  return {
    success: true,
    data: {
      primaryColor: primaryColorResult.data,
      backgroundColor: backgroundColorResult.data,
      surfaceColor: surfaceColorResult.data,
      textColor: textColorResult.data,
      fontHeading,
    },
  }
}

function validateTemplateConfig(value: unknown): ValidationResult<TemplateSubmissionConfig> {
  if (!isRecord(value)) {
    return { success: false, error: 'config.json must be a JSON object.' }
  }

  const name = value.name
  const slug = value.slug
  const category = value.category
  const price = value.price
  const sdkVersion = value.sdkVersion
  const fields = value.fields
  const theme = value.theme

  if (!isNonEmptyString(name)) {
    return { success: false, error: 'name: Name is required.' }
  }

  if (!isNonEmptyString(slug) || !slugPattern.test(slug)) {
    return { success: false, error: 'slug: Slug must be kebab-case with no spaces.' }
  }

  if (!isTemplateCategory(category)) {
    return { success: false, error: 'category: Must be one of birthday, anniversary, wedding, thankyou, festival, or graduation.' }
  }

  if (!isFiniteNumber(price) || price < 0) {
    return { success: false, error: 'price: Price must be a non-negative number.' }
  }

  if (sdkVersion !== '1.0.0') {
    return { success: false, error: 'sdkVersion: Must be "1.0.0".' }
  }

  if (!Array.isArray(fields) || fields.length < 1) {
    return { success: false, error: 'fields: Must contain at least one item.' }
  }

  const themeResult = validateTemplateTheme(theme)
  if (!themeResult.success) return themeResult

  return {
    success: true,
    data: {
      name,
      slug,
      category,
      price,
      sdkVersion: '1.0.0',
      fields,
      theme: themeResult.data,
    },
  }
}

function isCreatorRole(role: string | null | undefined): role is 'creator' | 'admin' {
  return role === 'creator' || role === 'admin'
}

function parseJson(input: string): unknown {
  return JSON.parse(input) as unknown
}

async function readFileText(value: FormDataEntryValue | null): Promise<string | null> {
  if (!(value instanceof File)) return null
  return value.text()
}

async function readFileBytes(value: FormDataEntryValue | null): Promise<Uint8Array | null> {
  if (!(value instanceof File)) return null
  return new Uint8Array(await value.arrayBuffer())
}

function toErrorMessage(error: string): string {
  return error
}

export async function POST(request: Request): Promise<Response> {
  const bearerToken = readBearerToken(request)
  if (!bearerToken) {
    return jsonResponse({ error: 'Unauthorized' }, 401)
  }

  try {
    const anonClient = createAnonServerClient()
    const { data: userData, error: userError } = await anonClient.auth.getUser(bearerToken)
    const user = userData.user

    if (userError || !user) {
      return jsonResponse({ error: 'Unauthorized' }, 401)
    }

    const authedClient = createAuthedServerClient(bearerToken)
    const profileResult = await authedClient
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .maybeSingle()

    const profile = profileResult.data as ProfileRow | null
    if (profileResult.error || !profile || !isCreatorRole(profile.role)) {
      return jsonResponse({ error: 'Not a creator account' }, 403)
    }

    const formData = await request.formData()
    const bundleEntry = formData.get('bundle')
    const configEntry = formData.get('config')
    const previewEntry = formData.get('preview')

    const bundleBytes = await readFileBytes(bundleEntry)
    const configText = await readFileText(configEntry)
    const previewBytes = await readFileBytes(previewEntry)

    if (!bundleBytes || !configText || !previewBytes) {
      return jsonResponse({ error: 'Bundle, config, and preview files are required.' }, 400)
    }

    let parsedConfig: unknown
    try {
      parsedConfig = parseJson(configText)
    } catch {
      return jsonResponse({ error: 'config.json is not valid JSON' }, 400)
    }

    const configResult = validateTemplateConfig(parsedConfig)
    if (!configResult.success) {
      return jsonResponse({ error: toErrorMessage(configResult.error) }, 400)
    }

    const config = configResult.data
    const submissionCheck = await authedClient
      .from('template_submissions')
      .select('config')
      .eq('creator_id', user.id)
      .eq('status', 'pending')

    if (submissionCheck.error) {
      return jsonResponse({ error: 'Submission failed' }, 500)
    }

    const submissionRows = (submissionCheck.data ?? []) as SubmissionRow[]
    const duplicateSubmission = submissionRows.some((row) => {
      if (!isRecord(row.config)) return false
      return row.config.slug === config.slug
    })

    if (duplicateSubmission) {
      return jsonResponse({ error: 'A pending submission with this slug exists' }, 409)
    }

    const submissionId = crypto.randomUUID()
    const bundlePath = `pending/${submissionId}/bundle.js`
    const configPath = `pending/${submissionId}/config.json`
    const previewPath = `pending/${submissionId}/preview.png`

    const storageClient = createServiceRoleServerClient()
    const bundleUpload = await storageClient.storage.from('templates-pending').upload(bundlePath, bundleBytes, {
      contentType: 'application/javascript',
      upsert: false,
    })
    if (bundleUpload.error) {
      return jsonResponse({ error: 'Submission failed' }, 500)
    }

    const configUpload = await storageClient.storage.from('templates-pending').upload(configPath, new TextEncoder().encode(JSON.stringify(config, null, 2)), {
      contentType: 'application/json',
      upsert: false,
    })
    if (configUpload.error) {
      return jsonResponse({ error: 'Submission failed' }, 500)
    }

    const previewUpload = await storageClient.storage.from('templates-pending').upload(previewPath, previewBytes, {
      contentType: previewEntry instanceof File ? previewEntry.type || 'image/png' : 'image/png',
      upsert: false,
    })
    if (previewUpload.error) {
      return jsonResponse({ error: 'Submission failed' }, 500)
    }

    const insertResult = await authedClient.from('template_submissions').insert({
      id: submissionId,
      creator_id: user.id,
      config,
      status: 'pending',
      bundle_path: bundlePath,
      preview_path: previewPath,
      submitted_at: new Date().toISOString(),
    })

    if (insertResult.error) {
      return jsonResponse({ error: 'Submission failed' }, 500)
    }

    return jsonResponse({
      submissionId,
      message: 'Template submitted for review',
    })
  } catch {
    return jsonResponse({ error: 'Submission failed' }, 500)
  }
}
