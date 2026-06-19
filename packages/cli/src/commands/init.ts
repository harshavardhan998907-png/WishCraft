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
}

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

export async function runInitCommand(options: InitCommandOptions, projectRoot = process.cwd()): Promise<void> {
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
        return /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value) ? true : 'Slug must be lowercase kebab-case.'
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
        return /^\d+$/.test(value) ? true : 'Price must be a non-negative integer.'
      },
    },
    {
      name: 'sdkVersion',
      type: 'input',
      message: 'SDK version',
      default: options.sdkVersion ?? defaults.sdkVersion,
      validate(value: string) {
        return /^\d+\.\d+\.\d+(?:[-+][0-9A-Za-z.-]+)?$/.test(value) ? true : 'SDK version must be semver.'
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
