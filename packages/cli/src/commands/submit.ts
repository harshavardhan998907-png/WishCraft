import * as fs from 'node:fs'
import * as fsp from 'node:fs/promises'
import chalk from 'chalk'
import fetch from 'node-fetch'
import FormData from 'form-data'
import { WishCraftError } from '../lib/errors'
import { getAuthPaths, getProjectPaths } from '../lib/paths'

interface AuthConfig {
  token?: string
}

interface SubmitResponse {
  message?: string
  error?: string
}

function normalizeRemoteMessage(raw: string): string {
  const withoutTags = raw.replace(/<[^>]*>/g, ' ')
  return withoutTags.replace(/\s+/g, ' ').trim()
}

function parseAuthConfig(raw: string): AuthConfig {
  const parsed = JSON.parse(raw) as AuthConfig
  return parsed
}

async function readCreatorToken(): Promise<string> {
  const authPaths = getAuthPaths()
  try {
    const raw = await fsp.readFile(authPaths.configPath, 'utf8')
    const parsed = parseAuthConfig(raw)
    if (!parsed.token || parsed.token.trim().length === 0) {
      throw new WishCraftError('No token found in ~/.wishcraft/config.json. Run wishcraft login first.')
    }
    return parsed.token
  } catch (error) {
    if (error instanceof WishCraftError) throw error
    throw new WishCraftError('Could not read ~/.wishcraft/config.json. Run wishcraft login first.')
  }
}

async function ensureBuiltArtifacts(projectRoot: string): Promise<{ bundlePath: string; configPath: string; previewPath: string }> {
  const paths = getProjectPaths(projectRoot)
  const bundleExists = fs.existsSync(paths.bundlePath)
  const configExists = fs.existsSync(paths.distConfigPath)
  const previewExists = fs.existsSync(paths.distPreviewPath)

  if (!bundleExists || !configExists || !previewExists) {
    throw new WishCraftError('dist/ artifacts are missing. Run wishcraft build before submit.')
  }

  return {
    bundlePath: paths.bundlePath,
    configPath: paths.distConfigPath,
    previewPath: paths.distPreviewPath,
  }
}

export async function runSubmitCommand(projectRoot = process.cwd()): Promise<void> {
  const token = await readCreatorToken()
  const { bundlePath, configPath, previewPath } = await ensureBuiltArtifacts(projectRoot)

  const form = new FormData()
  form.append('bundle', fs.createReadStream(bundlePath), {
    filename: 'bundle.js',
    contentType: 'application/javascript',
  })
  form.append('config', fs.createReadStream(configPath), {
    filename: 'config.json',
    contentType: 'application/json',
  })
  form.append('preview', fs.createReadStream(previewPath), {
    filename: 'preview.png',
    contentType: 'image/png',
  })

  const response = await fetch('https://wish-craft-ten.vercel.app/api/templates/submit', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      ...form.getHeaders(),
    },
    body: form as never,
  })

  const responseText = await response.text()
  if (!response.ok) {
    let parsed: SubmitResponse | null = null
    if (responseText.trim().startsWith('{')) {
      try {
        parsed = JSON.parse(responseText) as SubmitResponse
      } catch {
        parsed = null
      }
    }

    const remoteMessage = parsed?.message ?? parsed?.error ?? normalizeRemoteMessage(responseText)
    throw new WishCraftError(remoteMessage.length > 0 ? remoteMessage : 'Template submission failed.')
  }

  console.log(chalk.green('Template submitted successfully.'))
  if (responseText.trim().length > 0) {
    console.log(responseText.trim())
  }
}
