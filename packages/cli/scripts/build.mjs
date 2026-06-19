import path from 'node:path'
import fs from 'node:fs'
import { fileURLToPath } from 'node:url'
import * as esbuild from 'esbuild'

const scriptDir = path.dirname(fileURLToPath(import.meta.url))
const root = path.resolve(scriptDir, '..')
const srcDir = path.resolve(root, 'src')
const packageExternalPattern = /^[^./][^:]*$/

function resolveLocalImport(baseDir, request) {
  const absoluteBase = path.resolve(baseDir, request)
  const candidates = [
    absoluteBase,
    `${absoluteBase}.ts`,
    `${absoluteBase}.tsx`,
    `${absoluteBase}.js`,
    `${absoluteBase}.jsx`,
    path.join(absoluteBase, 'index.ts'),
    path.join(absoluteBase, 'index.tsx'),
    path.join(absoluteBase, 'index.js'),
    path.join(absoluteBase, 'index.jsx'),
  ]

  for (const candidate of candidates) {
    if (fs.existsSync(candidate) && fs.statSync(candidate).isFile()) {
      return candidate
    }
  }

  return absoluteBase
}

const wishcraftCliPlugin = {
  name: 'wishcraft-cli-resolver',
  setup(build) {
    build.onResolve({ filter: /.*/ }, (args) => {
      if (args.path.startsWith('.') || args.path.startsWith('/')) {
        return {
          path: resolveLocalImport(args.resolveDir, args.path),
        }
      }

      if (packageExternalPattern.test(args.path)) {
        return {
          path: args.path,
          external: true,
        }
      }

      return null
    })

    build.onLoad({ filter: /\.[cm]?[jt]sx?$/ }, (args) => {
      const contents = fs.readFileSync(args.path, 'utf8')
      const loader = args.path.endsWith('.tsx') ? 'tsx' : 'ts'
      return {
        contents,
        loader,
        resolveDir: path.dirname(args.path),
      }
    })
  },
}

try {
  const cliSource = fs.readFileSync(path.resolve(root, 'src', 'cli.ts'), 'utf8')
  await esbuild.build({
    stdin: {
      contents: cliSource,
      resolveDir: srcDir,
      sourcefile: path.resolve(srcDir, 'cli.ts'),
      loader: 'ts',
    },
    bundle: true,
    platform: 'node',
    format: 'cjs',
    target: 'node18',
    outfile: './dist/cli.js',
    external: ['esbuild'],
    plugins: [wishcraftCliPlugin],
    banner: {
      js: '#!/usr/bin/env node',
    },
  })
} catch (error) {
  const message = error instanceof Error ? error.message : 'CLI build failed.'
  console.error(message)
  process.exitCode = 1
}
