import * as fs from 'node:fs/promises'
import * as path from 'node:path'
import chalk from 'chalk'
import { build } from 'esbuild'
import { WishCraftError } from '../lib/errors'
import { getProjectPaths } from '../lib/paths'
import { assertValidProject } from '../lib/validation'

export async function runBuildCommand(projectRoot = process.cwd()): Promise<void> {
  const config = assertValidProject(projectRoot)
  const paths = getProjectPaths(projectRoot)

  await fs.mkdir(paths.distDir, { recursive: true })
  await build({
    entryPoints: [paths.sourcePath],
    bundle: true,
    format: 'iife',
    globalName: 'WishCraftTemplate',
    jsx: 'automatic',
    external: ['react', 'react-dom'],
    minify: true,
    outfile: paths.bundlePath,
    platform: 'browser',
  })

  await fs.copyFile(paths.configPath, paths.distConfigPath)
  await fs.copyFile(paths.previewPath, paths.distPreviewPath)

  const bundleStats = await fs.stat(paths.bundlePath)
  if (bundleStats.size > 500 * 1024) {
    console.error(chalk.yellow(`Warning: dist/bundle.js is ${(bundleStats.size / 1024).toFixed(1)} KB and exceeds the 500 KB limit.`))
  }

  console.log(chalk.green(`Built ${config.slug} into dist/`))
}

export function createBuildError(message: string): WishCraftError {
  return new WishCraftError(message)
}
