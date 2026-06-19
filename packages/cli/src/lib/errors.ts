export class WishCraftError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'WishCraftError'
  }
}

export function toErrorMessage(error: unknown): string {
  if (error instanceof WishCraftError) return error.message
  if (error instanceof Error) return error.message
  if (typeof error === 'string') return error
  return 'An unexpected error occurred.'
}
