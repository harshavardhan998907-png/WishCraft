# Database and Supabase Documentation

## Supabase Modules

| Module | Used For |
| --- | --- |
| Auth | Email/password users and sessions |
| Postgres | Profiles, templates, wishes, orders, music tracks |
| Storage | Public uploaded photos and music |
| Edge Functions | Payment creation, verification, expiry jobs |
| RLS | User-scoped access control |

## Entity Relationship Diagram

```txt
auth.users
  1
  |
  | id
  v
profiles
  1
  |
  | user_id
  v
wishes >---- templates
  |
  | wish_id
  v
orders >---- templates

music_tracks -- optional occasion metadata
storage.objects -- public files in wish-photos and wish-music buckets
```

## Enums

| Enum | Values |
| --- | --- |
| `template_tier` | `free`, `standard`, `premium` |
| `occasion_type` | `birthday`, `wedding`, `anniversary`, `festival`, `graduation`, `baby_shower`, `farewell`, `valentine`, `other` |
| `wish_status` | `draft`, `active`, `expired`, `deleted` |
| `order_status` | `pending`, `paid`, `failed`, `refunded` |

## Tables

### `profiles`

Purpose: public application profile linked to Supabase Auth users.

| Column | Type | Constraints | Description |
| --- | --- | --- | --- |
| `id` | `uuid` | PK, FK `auth.users(id)`, cascade delete | User id |
| `email` | `text` | not null | User email |
| `full_name` | `text` | nullable | Display name |
| `avatar_url` | `text` | nullable | Optional avatar |
| `created_at` | `timestamptz` | default `now()` | Creation timestamp |

RLS:

- Users can select their own profile.
- Users can insert their own profile.
- Users can update their own profile.

Trigger:

- `on_auth_user_created` calls `handle_new_user()` after insert on `auth.users`.

### `templates`

Purpose: catalog of available wish templates.

| Column | Type | Constraints | Description |
| --- | --- | --- | --- |
| `id` | `uuid` | PK, default `gen_random_uuid()` | Template id |
| `name` | `text` | not null | Display name |
| `slug` | `text` | unique, not null | URL/editor identifier |
| `occasion` | `occasion_type` | not null | Occasion category |
| `tier` | `template_tier` | default `free` | Pricing tier |
| `price_paise` | `integer` | not null, default `0`, repair migration adds `check >= 0` | Price in paise |
| `thumbnail_url` | `text` | nullable | Browse card image |
| `preview_url` | `text` | nullable | Optional preview URL |
| `has_animation` | `boolean` | default false | Animation support |
| `has_music` | `boolean` | default false | Built-in music support |
| `component_name` | `text` | not null | React registry key |
| `is_active` | `boolean` | default true | Public catalog visibility |
| `created_at` | `timestamptz` | default `now()` | Creation timestamp |

RLS:

- Templates are publicly readable when active.

Indexes:

- Unique index on `slug`.

Seed templates:

| Name | Slug | Occasion | Tier | Price |
| --- | --- | --- | --- | --- |
| Birthday Classic | `birthday-classic` | birthday | free | 0 |
| Birthday Glow | `birthday-glow` | birthday | standard | 9900 |
| Wedding Elegant | `wedding-elegant` | wedding | premium | 19900 |
| Anniversary Romantic | `anniversary-romantic` | anniversary | standard | 12900 |
| Festival Diwali | `festival-diwali` | festival | premium | 17900 |
| Graduation Celebration | `graduation-celebration` | graduation | free | 0 |

### `wishes`

Purpose: user-created wish instances and public share records.

| Column | Type | Constraints | Description |
| --- | --- | --- | --- |
| `id` | `uuid` | PK, default `gen_random_uuid()` | Wish id |
| `user_id` | `uuid` | FK `profiles(id)`, cascade delete, not null | Owner |
| `template_id` | `uuid` | FK `templates(id)`, not null | Template used |
| `slug` | `text` | unique, not null | Public URL slug |
| `recipient_name` | `text` | not null | Recipient |
| `sender_name` | `text` | not null | Sender |
| `custom_message` | `text` | nullable | User message |
| `photo_urls` | `text[]` | default `{}` | Uploaded public photo URLs |
| `music_url` | `text` | nullable | Built-in track label or public upload URL |
| `status` | `wish_status` | default `draft` | Lifecycle |
| `is_paid` | `boolean` | default false | Payment activation flag |
| `expires_at` | `timestamptz` | nullable | Public expiry time |
| `created_at` | `timestamptz` | default `now()` | Creation timestamp |
| `activated_at` | `timestamptz` | nullable | Activation time |

RLS:

- Users can view, create, and update own wishes.
- Active wishes are publicly readable by slug.

Indexes:

- `wishes_user_id_created_at_idx`
- `wishes_slug_key`
- `wishes_expiry_idx`
- `wishes_template_id_idx` in repair migration

### `orders`

Purpose: Razorpay payment records connected to paid wish activation.

| Column | Type | Constraints | Description |
| --- | --- | --- | --- |
| `id` | `uuid` | PK, default `gen_random_uuid()` | Internal order id |
| `user_id` | `uuid` | FK `profiles(id)`, cascade delete, not null | Buyer |
| `wish_id` | `uuid` | FK `wishes(id)`, cascade delete, not null | Draft wish |
| `template_id` | `uuid` | FK `templates(id)`, not null | Paid template |
| `amount_paise` | `integer` | not null, repair migration adds `check >= 0` | Charged amount |
| `razorpay_order_id` | `text` | nullable | Razorpay order |
| `razorpay_payment_id` | `text` | nullable | Razorpay payment |
| `razorpay_signature` | `text` | nullable | Checkout signature |
| `status` | `order_status` | default `pending` | Payment status |
| `created_at` | `timestamptz` | default `now()` | Created timestamp |
| `paid_at` | `timestamptz` | nullable | Paid timestamp |

RLS:

- Users can view own orders.
- Users can insert own pending orders.

Indexes:

- `orders_user_id_created_at_idx`
- `orders_razorpay_order_id_idx`
- `orders_wish_id_idx` in repair migration

### `music_tracks`

Purpose: built-in music metadata.

| Column | Type | Constraints | Description |
| --- | --- | --- | --- |
| `id` | `uuid` | PK, default `gen_random_uuid()` | Track id |
| `title` | `text` | not null, unique index in repair migration | Display title |
| `mood` | `text` | nullable | Mood label |
| `occasion` | `occasion_type` | nullable | Associated occasion |
| `url` | `text` | not null | Audio URL |
| `is_active` | `boolean` | default true | Public availability |
| `created_at` | `timestamptz` | default `now()` | Creation timestamp |

RLS:

- Active tracks are publicly readable.

Current frontend note: the editor currently uses a local `musicTracks` string list. The table exists and is seeded, but the editor does not yet query it.

## Storage Buckets

### `wish-photos`

Purpose: public images uploaded by authenticated users.

Configuration in repair migration:

- Public: true
- File size limit: 5MB
- MIME types: JPEG, PNG, WebP, GIF

Policies:

- Anyone can read.
- Authenticated users can upload.
- Owners can update/delete.

### `wish-music`

Purpose: public custom audio uploads for premium templates.

Configuration in repair migration:

- Public: true
- File size limit: 10MB
- MIME types: MP3, MPEG, WAV, OGG, AAC, MP4 audio

Policies:

- Anyone can read.
- Authenticated users can upload.
- Owners can update/delete.

## Migrations

Run order:

1. `001_profiles.sql`
2. `002_templates.sql`
3. `003_wishes.sql`
4. `004_orders.sql`
5. `005_storage_buckets.sql`
6. `006_seed_templates.sql`
7. `007_music_tracks.sql`
8. `008_deployment_helpers.sql`
9. `009_ensure_default_templates.sql`
10. `010_repair_backend_schema.sql`

`010_repair_backend_schema.sql` is idempotent and repairs enums, tables, indexes, RLS, trigger, seed data, storage buckets, storage policies, and schema cache notification.

## RPC Functions

### `handle_new_user()`

Runs after new auth user creation. Inserts or updates `profiles`.

### `activate_paid_wish(target_order_id, target_wish_id, payment_id, payment_signature)`

Security definer function used by `verify-payment`.

Actions:

1. Updates pending order to `paid`.
2. Stores payment id and signature.
3. Sets `paid_at`.
4. Updates draft wish to `active`.
5. Sets `is_paid`, `activated_at`, and `expires_at = now() + interval '7 days'`.

## Analytics, Logging, and Theme Settings

No analytics table exists in the current schema. Logging is implemented through:

- Browser `console.info`, `console.warn`, `console.error`
- Supabase Edge Function logs

Theme settings are client-side only through `localStorage`; there is no database table for user theme preferences.

