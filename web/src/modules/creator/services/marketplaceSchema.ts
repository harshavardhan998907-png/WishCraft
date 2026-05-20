export function isMissingMarketplaceSchema(error: unknown) {
  if (!error || typeof error !== 'object') return false
  const maybeError = error as { code?: string; message?: string }
  const message = maybeError.message?.toLowerCase() ?? ''
  return maybeError.code === 'PGRST205'
    || message.includes('creator_profiles')
    || message.includes('creator_template_metrics')
    || message.includes('template_status')
    || message.includes('schema cache')
}

export function marketplaceSchemaMessage() {
  return 'Creator marketplace tables are being prepared. Run migration 014_marketplace_foundation.sql, then refresh this page.'
}
