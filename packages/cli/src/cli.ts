import { Command } from 'commander'
import chalk from 'chalk'
import { toErrorMessage, WishCraftError } from './lib/errors'
import { runBuildCommand } from './commands/build'
import { runInitCommand } from './commands/init'
import { runLoginCommand } from './commands/login'
import { runSubmitCommand } from './commands/submit'
import { runValidateCommand } from './commands/validate'

const program = new Command()

program
  .name('wishcraft')
  .description('WishCraft CLI for creator template projects.')
  .version('0.1.0')
  .showHelpAfterError()
  .helpOption('-h, --help', 'Show help for this command.')

const initCommand = new Command('init')
  .description('Scaffold a new WishCraft template project.')
  .option('--name <name>', 'Template name')
  .option('--slug <slug>', 'Template slug')
  .option('--category <category>', 'Template category')
  .option('--price <price>', 'Price in paise')
  .option('--sdk-version <version>', 'SDK version')
  .option('-y, --yes', 'Skip prompts and scaffold from flags + defaults (non-interactive)')
  .action(async (options: { name?: string; slug?: string; category?: string; price?: string; sdkVersion?: string; yes?: boolean }) => {
    await runInitCommand({
      name: options.name,
      slug: options.slug,
      category: options.category,
      price: options.price,
      sdkVersion: options.sdkVersion,
      yes: options.yes,
    })
  })

const validateCommand = new Command('validate')
  .description('Validate config.json, src/index.tsx, slug formatting, and preview.png.')
  .action(() => {
    runValidateCommand()
  })

const buildCommand = new Command('build')
  .description('Validate and bundle the template into dist/.')
  .action(async () => {
    await runBuildCommand()
  })

const submitCommand = new Command('submit')
  .description('Submit the built template bundle to WishCraft.')
  .action(async () => {
    await runSubmitCommand()
  })

const loginCommand = new Command('login')
  .description('Authenticate a creator account and save the token locally.')
  .action(async () => {
    await runLoginCommand()
  })

program.addCommand(initCommand)
program.addCommand(validateCommand)
program.addCommand(buildCommand)
program.addCommand(submitCommand)
program.addCommand(loginCommand)

async function main(): Promise<void> {
  try {
    if (process.argv.length <= 2) {
      program.outputHelp()
      return
    }

    await program.parseAsync(process.argv)
  } catch (error) {
    const message = toErrorMessage(error)
    if (message.trim().length > 0) {
      console.error(chalk.red(message))
    } else {
      console.error(chalk.red('An unexpected error occurred.'))
    }
    process.exitCode = 1
  }
}

void main()
