import * as fs from 'node:fs/promises'
import fetch from 'node-fetch'
import inquirer from 'inquirer'
import chalk from 'chalk'
import { WishCraftError } from '../lib/errors'
import { getAuthPaths } from '../lib/paths'

interface LoginResponse {
  token?: string
  accessToken?: string
  data?: {
    token?: string
    accessToken?: string
  }
  message?: string
}

function normalizeRemoteMessage(raw: string): string {
  const withoutTags = raw.replace(/<[^>]*>/g, ' ')
  return withoutTags.replace(/\s+/g, ' ').trim()
}

function extractToken(response: LoginResponse): string | null {
  return response.token ?? response.accessToken ?? response.data?.token ?? response.data?.accessToken ?? null
}

export async function runLoginCommand(): Promise<void> {
  const answers = await inquirer.prompt<{ email: string; password: string }>([
    {
      name: 'email',
      type: 'input',
      message: 'Creator email',
      validate(value: string) {
        return value.includes('@') ? true : 'Enter a valid email address.'
      },
    },
    {
      name: 'password',
      type: 'password',
      message: 'Password',
      mask: '*',
      validate(value: string) {
        return value.trim().length > 0 ? true : 'Password is required.'
      },
    },
  ])

  const response = await fetch('https://wish-craft-ten.vercel.app/api/auth/creator-login', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      email: answers.email,
      password: answers.password,
    }),
  })

  const bodyText = await response.text()
  let parsed: LoginResponse | null = null
  if (bodyText.trim().length > 0) {
    try {
      parsed = JSON.parse(bodyText) as LoginResponse
    } catch {
      parsed = null
    }
  }

  if (!response.ok) {
    const remoteMessage = parsed?.message ?? normalizeRemoteMessage(bodyText)
    throw new WishCraftError(remoteMessage.length > 0 ? remoteMessage : 'Login failed.')
  }

  const token = parsed ? extractToken(parsed) : null
  if (!token) {
    throw new WishCraftError('Login succeeded but no token was returned.')
  }

  const authPaths = getAuthPaths()
  await fs.mkdir(authPaths.configDir, { recursive: true })
  await fs.writeFile(authPaths.configPath, `${JSON.stringify({ token }, null, 2)}\n`, 'utf8')
  console.log(chalk.green(`Logged in and saved token to ${authPaths.configPath}`))
}
