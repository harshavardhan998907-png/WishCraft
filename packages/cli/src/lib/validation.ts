import * as fs from 'node:fs'
import * as path from 'node:path'
import { ZodError } from 'zod'
import { fileExists, readJsonFile, readTextFile } from './fs'
import { getProjectPaths } from './paths'
import { templateProjectConfigSchema, hexColorPattern, slugPattern } from './template-config'

export interface ValidationIssue {
  file: string
  message: string
}

export interface ValidationReport {
  valid: boolean
  issues: ValidationIssue[]
  config?: import('./template-config').TemplateProjectConfig
}

function pushIssue(issues: ValidationIssue[], file: string, message: string): void {
  issues.push({ file, message })
}

function formatZodIssue(file: string, issue: { path: Array<string | number>; message: string }): ValidationIssue {
  const suffix = issue.path.length > 0 ? `.${issue.path.map((part) => String(part)).join('.')}` : ''
  return {
    file: `${file}${suffix}`,
    message: issue.message,
  }
}

function validateSourceFile(sourcePath: string, issues: ValidationIssue[]): void {
  if (!fileExists(sourcePath)) {
    pushIssue(issues, 'src/index.tsx', 'Missing src/index.tsx.')
    return
  }

  const source = readTextFile(sourcePath)
  if (!/export\s+default\b/.test(source)) {
    pushIssue(issues, 'src/index.tsx', 'src/index.tsx must export a default component.')
  }

  if (!/TemplateProps/.test(source)) {
    pushIssue(issues, 'src/index.tsx', 'src/index.tsx should accept TemplateProps.')
  }
}

function validatePreview(previewPath: string, issues: ValidationIssue[]): void {
  if (!fileExists(previewPath)) {
    pushIssue(issues, 'preview.png', 'Missing preview.png.')
  }
}

function validateSlug(config: import('./template-config').TemplateProjectConfig, issues: ValidationIssue[]): void {
  if (!slugPattern.test(config.slug)) {
    pushIssue(issues, 'config.json.slug', 'Slug must be lowercase kebab-case.')
  }
}

function validateThemeColors(config: import('./template-config').TemplateProjectConfig, issues: ValidationIssue[]): void {
  for (const [colorName, colorValue] of Object.entries(config.theme)) {
    if (!hexColorPattern.test(colorValue)) {
      pushIssue(issues, `config.json.theme.${colorName}`, 'Theme colors must be valid hex values.')
    }
  }
}

export function loadProjectConfig(projectRoot = process.cwd()): ValidationReport {
  const paths = getProjectPaths(projectRoot)
  const issues: ValidationIssue[] = []

  if (!fileExists(paths.configPath)) {
    pushIssue(issues, 'config.json', 'Missing config.json.')
    return { valid: false, issues }
  }

  try {
    const rawConfig = readJsonFile(paths.configPath)
    const parsedConfig = templateProjectConfigSchema.parse(rawConfig)

    validateSlug(parsedConfig, issues)
    validateThemeColors(parsedConfig, issues)
    validateSourceFile(paths.sourcePath, issues)
    validatePreview(paths.previewPath, issues)

    return {
      valid: issues.length === 0,
      issues,
      config: parsedConfig,
    }
  } catch (error) {
    if (error instanceof ZodError) {
      for (const issue of error.issues) {
        pushIssue(issues, formatZodIssue('config.json', issue).file, formatZodIssue('config.json', issue).message)
      }
      return { valid: false, issues }
    }

    const message = error instanceof Error ? error.message : 'Failed to read config.json.'
    pushIssue(issues, 'config.json', message)
    return { valid: false, issues }
  }
}

export function assertValidProject(projectRoot = process.cwd()): import('./template-config').TemplateProjectConfig {
  const report = loadProjectConfig(projectRoot)
  if (!report.valid || !report.config) {
    const details = report.issues.map((issue) => `- ${issue.file}: ${issue.message}`).join('\n')
    throw new Error(`Validation failed.\n${details}`)
  }

  return report.config
}

export function hasPreviewAndConfig(projectRoot = process.cwd()): boolean {
  const paths = getProjectPaths(projectRoot)
  return fs.existsSync(paths.configPath) && fs.existsSync(paths.previewPath)
}
