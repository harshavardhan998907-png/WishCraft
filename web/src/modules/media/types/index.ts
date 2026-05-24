export type MediaAssetType = 'image' | 'image_thumbnail' | 'music' | 'template_thumbnail'
export type OptimizationStatus = 'pending' | 'optimized' | 'validated' | 'failed'

export interface MediaAsset {
  id: string
  owner_user_id: string | null
  related_wish_id: string | null
  related_template_id: string | null
  asset_type: MediaAssetType
  storage_bucket: string
  storage_path: string
  public_url: string
  mime_type: string | null
  original_size_bytes: number | null
  optimized_size_bytes: number | null
  optimization_status: OptimizationStatus
  is_orphaned: boolean
  expires_at: string | null
  created_at: string
}

export interface UploadProgressState {
  label: string
  value: number
}

export interface ImageUploadResult {
  asset: MediaAsset | null
  url: string
  thumbnailUrl: string | null
  originalSize: number
  optimizedSize: number
}

export interface MusicUploadResult {
  asset: MediaAsset | null
  url: string
  size: number
}

export interface StorageUsageMetrics {
  total_storage_bytes: number
  image_storage_bytes: number
  music_storage_bytes: number
  orphaned_assets: number
  expired_assets: number
  creator_storage_usage: Array<{
    owner_user_id: string
    asset_count: number
    storage_bytes: number
  }>
}

export interface MediaCleanupJob {
  id: string
  job_type: string
  status: 'running' | 'completed' | 'failed'
  assets_processed: number
  started_at: string
  completed_at: string | null
}
