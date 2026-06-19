import * as fs from 'node:fs'
import * as path from 'node:path'
import { fileURLToPath } from 'node:url'

export function readTextFile(filePath: string): string {
  return fs.readFileSync(filePath, 'utf8')
}

export function writeTextFile(filePath: string, content: string): void {
  fs.mkdirSync(path.dirname(filePath), { recursive: true })
  fs.writeFileSync(filePath, content, 'utf8')
}

export function writeBinaryFile(filePath: string, content: Uint8Array): void {
  fs.mkdirSync(path.dirname(filePath), { recursive: true })
  fs.writeFileSync(filePath, content)
}

export function readJsonFile(filePath: string): unknown {
  return JSON.parse(readTextFile(filePath))
}

export function writeJsonFile(filePath: string, value: unknown): void {
  writeTextFile(filePath, `${JSON.stringify(value, null, 2)}\n`)
}

export function fileExists(filePath: string): boolean {
  return fs.existsSync(filePath)
}

export function directoryExists(dirPath: string): boolean {
  return fs.existsSync(dirPath) && fs.statSync(dirPath).isDirectory()
}

export function currentFilePath(metaUrl: string): string {
  return fileURLToPath(metaUrl)
}
