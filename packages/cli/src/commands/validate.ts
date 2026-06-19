import chalk from 'chalk'
import { assertValidProject, loadProjectConfig, type ValidationIssue } from '../lib/validation'
import { WishCraftError } from '../lib/errors'

function formatIssue(issue: ValidationIssue): string {
  return `${issue.file}: ${issue.message}`
}

export function printValidationReport(issues: ValidationIssue[]): void {
  if (issues.length === 0) {
    console.log(chalk.green('Validation passed.'))
    return
  }

  console.error(chalk.red('Validation failed.'))
  for (const issue of issues) {
    console.error(chalk.red(`- ${formatIssue(issue)}`))
  }
}

export function runValidateCommand(projectRoot = process.cwd()): void {
  const report = loadProjectConfig(projectRoot)
  if (!report.valid) {
    const details = report.issues.map((issue) => `- ${formatIssue(issue)}`).join('\n')
    throw new WishCraftError(`Validation failed.\n${details}`)
  }

  console.log(chalk.green('Validation passed.'))
}

export function validateAndReturnConfig(projectRoot = process.cwd()) {
  return assertValidProject(projectRoot)
}
