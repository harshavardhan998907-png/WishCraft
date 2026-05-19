# Template Hub Supabase Backend

This folder contains the database migrations, backend verification SQL, and Supabase Edge Functions for Template Hub.

## Migration Order

Run migrations in this order from the Supabase SQL Editor or your Supabase migration workflow:

1. `migrations/001_profiles.sql`
2. `migrations/002_templates.sql`
3. `migrations/003_wishes.sql`
4. `migrations/004_orders.sql`
5. `migrations/005_storage_buckets.sql`
6. `migrations/006_seed_templates.sql`
7. `migrations/007_music_tracks.sql`
8. `migrations/008_deployment_helpers.sql`
9. `migrations/009_ensure_default_templates.sql`
10. `migrations/010_repair_backend_schema.sql`

`010_repair_backend_schema.sql` is idempotent. Use it when the hosted Supabase project is missing tables, policies, buckets, functions, seed data, or reports `PGRST205`.

After running SQL, refresh PostgREST:

```sql
notify pgrst, 'reload schema';
```

Then run:

```sql
-- verify_backend.sql
```

## Tables

- `profiles`
- `templates`
- `wishes`
- `orders`
- `music_tracks`

## Storage Buckets

- `wish-photos`
- `wish-music`

Both buckets are public for recipient access. Upload requires authentication.

## Edge Functions

- `create-razorpay-order`
- `verify-payment`
- `expire-wishes`

Deploy:

```bash
supabase functions deploy create-razorpay-order
supabase functions deploy verify-payment
supabase functions deploy expire-wishes
```

Schedule `expire-wishes` to run every hour.

## Required Edge Function Secrets

```txt
RAZORPAY_KEY_ID=your_razorpay_key_id
RAZORPAY_KEY_SECRET=your_razorpay_key_secret
SUPABASE_URL=your_supabase_project_url
SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

Do not put `SUPABASE_SERVICE_ROLE_KEY` or `RAZORPAY_KEY_SECRET` in frontend `.env.local`.

## Documentation

See:

- `../docs/04-database-supabase.md`
- `../docs/05-flows-api.md`
- `../docs/07-deployment-development.md`

