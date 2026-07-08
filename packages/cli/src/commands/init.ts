import * as path from 'node:path'
import chalk from 'chalk'
import inquirer from 'inquirer'
import { WishCraftError } from '../lib/errors'
import { scaffoldTemplateProject, type InitOptions } from '../lib/scaffold'
import { templateCategories } from '../lib/template-config'

export interface InitCommandOptions {
  name?: string
  slug?: string
  category?: string
  price?: string
  sdkVersion?: string
  /** Skip interactive prompts and scaffold from flags + defaults. */
  yes?: boolean
}

const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/
const pricePattern = /^\d+$/
const semverPattern = /^\d+\.\d+\.\d+(?:[-+][0-9A-Za-z.-]+)?$/

function deriveSlug(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-{2,}/g, '-')
}

function resolveDefaults(cwd: string): Pick<InitOptions, 'name' | 'slug' | 'category' | 'price' | 'sdkVersion'> {
  const folderName = path.basename(cwd)
  const templateName = folderName
    .split(/[-_]/g)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ')

  return {
    name: templateName.length > 0 ? templateName : 'WishCraft Template',
    slug: deriveSlug(templateName.length > 0 ? templateName : folderName || 'wishcraft-template') || 'wishcraft-template',
    category: 'birthday',
    price: 0,
    sdkVersion: '1.0.0',
  }
}

function isCategory(value: string): value is (typeof templateCategories)[number] {
  return (templateCategories as readonly string[]).includes(value)
}

/**
 * Build scaffold options from flags + folder-derived defaults without prompting.
 * Used when --yes is passed or when stdin is not an interactive TTY (CI, AI
 * coding agents). Throws WishCraftError on any invalid value so a bad input
 * fails loudly instead of producing a malformed project.
 */
function resolveNonInteractive(options: InitCommandOptions, projectRoot: string): InitOptions {
  const defaults = resolveDefaults(projectRoot)
  const name = (options.name ?? defaults.name).trim()
  const slug = (options.slug ?? defaults.slug).trim()
  const category = options.category ?? defaults.category
  const price = options.price ?? String(defaults.price)
  const sdkVersion = (options.sdkVersion ?? defaults.sdkVersion).trim()

  if (name.length === 0) {
    throw new WishCraftError('Template name cannot be empty.')
  }
  if (!slugPattern.test(slug)) {
    throw new WishCraftError(`Invalid slug "${slug}". Slug must be lowercase kebab-case.`)
  }
  if (!isCategory(category)) {
    throw new WishCraftError(`Invalid category "${category}". Expected one of: ${templateCategories.join(', ')}.`)
  }
  if (!pricePattern.test(price)) {
    throw new WishCraftError(`Invalid price "${price}". Price must be a non-negative integer in paise.`)
  }
  if (!semverPattern.test(sdkVersion)) {
    throw new WishCraftError(`Invalid SDK version "${sdkVersion}". Expected semver (e.g. 1.0.0).`)
  }

  return { name, slug, category, price: Number.parseInt(price, 10), sdkVersion }
}

export async function runInitCommand(options: InitCommandOptions, projectRoot = process.cwd()): Promise<void> {
  // Non-interactive when explicitly requested or when there's no TTY to prompt
  // on (CI pipelines, AI coding agents). inquirer cannot prompt without a TTY
  // and would otherwise abort mid-flow, leaving a half-scaffolded project.
  if (options.yes || !process.stdin.isTTY) {
    try {
      scaffoldTemplateProject(resolveNonInteractive(options, projectRoot), projectRoot)
      console.log(chalk.green(`Scaffolded a new template project in ${path.resolve(projectRoot)}`))
    } catch (error) {
      if (error instanceof WishCraftError) {
        throw error
      }
      throw new WishCraftError(error instanceof Error ? error.message : 'Failed to scaffold template project.')
    }
    return
  }

  const defaults = resolveDefaults(projectRoot)
  const answers = await inquirer.prompt<{
    name: string
    slug: string
    category: (typeof templateCategories)[number]
    price: string
    sdkVersion: string
  }>([
    {
      name: 'name',
      type: 'input',
      message: 'Template name',
      default: options.name ?? defaults.name,
    },
    {
      name: 'slug',
      type: 'input',
      message: 'Template slug',
      default: options.slug ?? defaults.slug,
      validate(value: string) {
        return slugPattern.test(value) ? true : 'Slug must be lowercase kebab-case.'
      },
    },
    {
      name: 'category',
      type: 'list',
      message: 'Template category',
      choices: templateCategories,
      default: options.category && templateCategories.includes(options.category as (typeof templateCategories)[number]) ? options.category : defaults.category,
    },
    {
      name: 'price',
      type: 'input',
      message: 'Price in paise',
      default: options.price ?? String(defaults.price),
      validate(value: string) {
        return pricePattern.test(value) ? true : 'Price must be a non-negative integer.'
      },
    },
    {
      name: 'sdkVersion',
      type: 'input',
      message: 'SDK version',
      default: options.sdkVersion ?? defaults.sdkVersion,
      validate(value: string) {
        return semverPattern.test(value) ? true : 'SDK version must be semver.'
      },
    },
  ])

  try {
    scaffoldTemplateProject({
      name: answers.name.trim(),
      slug: answers.slug.trim(),
      category: answers.category,
      price: Number.parseInt(answers.price, 10),
      sdkVersion: answers.sdkVersion.trim(),
    }, projectRoot)
    console.log(chalk.green(`Scaffolded a new template project in ${path.resolve(projectRoot)}`))
  } catch (error) {
    if (error instanceof Error) {
      throw new WishCraftError(error.message)
    }
    throw new WishCraftError('Failed to scaffold template project.')
  }
}
