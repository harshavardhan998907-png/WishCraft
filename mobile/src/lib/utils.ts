export function formatPrice(paise: number): string {
  return paise === 0 ? 'Free' : `Rs ${(paise / 100).toFixed(0)}`
}
