import * as os from 'node:os'
import * as path from 'node:path'

export interface ProjectPaths {
  root: string
  configPath: string
  srcDir: string
  sourcePath: string
  previewPath: string
  distDir: string
  bundlePath: string
  distConfigPath: string
  distPreviewPath: string
}

export interface AuthPaths {
  homeDir: string
  configDir: string
  configPath: string
}

export function getProjectPaths(root = process.cwd()): ProjectPaths {
  return {
    root,
    configPath: path.join(root, 'config.json'),
    srcDir: path.join(root, 'src'),
    sourcePath: path.join(root, 'src', 'index.tsx'),
    previewPath: path.join(root, 'preview.png'),
    distDir: path.join(root, 'dist'),
    bundlePath: path.join(root, 'dist', 'bundle.js'),
    distConfigPath: path.join(root, 'dist', 'config.json'),
    distPreviewPath: path.join(root, 'dist', 'preview.png'),
  }
}

export function getAuthPaths(): AuthPaths {
  const homeDir = os.homedir()
  const configDir = path.join(homeDir, '.wishcraft')
  return {
    homeDir,
    configDir,
    configPath: path.join(configDir, 'config.json'),
  }
}
