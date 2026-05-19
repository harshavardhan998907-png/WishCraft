# Deployment and Development Workflow

## Local Development

### Prerequisites

- Node.js 18+
- npm
- Supabase project
- Razorpay account for paid flows

### Install

```bash
cd web
npm install
```

### Environment

Create `web/.env.local`:

```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_RAZORPAY_KEY_ID=your_razorpay_key_id
```

### Run Web App

```bash
cd web
npm run dev
```

Default Vite URL:

```txt
http://localhost:5173
```

### Build

```bash
cd web
npm run build
```

### Preview Production Build

```bash
cd web
npm run preview
```

### Lint

```bash
cd web
npm run lint
```

## Supabase Setup

### Migration Workflow

Run SQL files in order from `supabase/migrations/`:

```txt
001_profiles.sql
002_templates.sql
003_wishes.sql
004_orders.sql
005_storage_buckets.sql
006_seed_templates.sql
007_music_tracks.sql
008_deployment_helpers.sql
009_ensure_default_templates.sql
010_repair_backend_schema.sql
```

For production repair or first-time setup, `010_repair_backend_schema.sql` can be run safely because it is idempotent.

### Refresh Schema Cache

```sql
notify pgrst, 'reload schema';
```

### Verify Backend

Run:

```sql
-- supabase/verify_backend.sql
```

Use the results to confirm tables, templates, storage buckets, and functions exist.

## Edge Function Deployment

Required secrets:

```txt
RAZORPAY_KEY_ID
RAZORPAY_KEY_SECRET
SUPABASE_URL
SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
```

Deploy:

```bash
supabase functions deploy create-razorpay-order
supabase functions deploy verify-payment
supabase functions deploy expire-wishes
```

Schedule:

```txt
expire-wishes: every 1 hour
```

## Production Hosting

The web app is a static Vite build and can be deployed to:

- Vercel
- Netlify
- Cloudflare Pages
- Static hosting with CDN

### Vercel

Recommended settings:

| Setting | Value |
| --- | --- |
| Root directory | `web` |
| Build command | `npm run build` |
| Output directory | `dist` |
| Install command | `npm install` |

Environment variables:

```txt
VITE_SUPABASE_URL
VITE_SUPABASE_ANON_KEY
VITE_RAZORPAY_KEY_ID
```

### Netlify

Recommended settings:

| Setting | Value |
| --- | --- |
| Base directory | `web` |
| Build command | `npm run build` |
| Publish directory | `web/dist` |

For React Router support, add a redirect rule:

```txt
/* /index.html 200
```

## Production Checklist

- Run `npm run build`.
- Run all migrations.
- Run backend verification SQL.
- Deploy Edge Functions.
- Set Edge Function secrets.
- Set frontend hosting env vars.
- Configure Razorpay webhook/keys as needed.
- Schedule `expire-wishes`.
- Test signup/login.
- Test free wish creation.
- Test paid wish creation in Razorpay test mode.
- Test public `/w/:slug` route in incognito.
- Test photo upload.
- Test premium music upload.
- Test dark and light themes.
- Test mobile viewport.

## Debugging Workflow

### Templates Missing

Symptoms:

- Browse falls back to demo templates.
- Preview says template is missing in Supabase.
- Error references `PGRST205`.

Fix:

1. Run `010_repair_backend_schema.sql`.
2. Run `notify pgrst, 'reload schema';`.
3. Run `verify_backend.sql`.

### Signup Fails

Check:

- `profiles` table exists.
- `handle_new_user` trigger exists.
- RLS insert policy exists.
- Auth email settings in Supabase.

### Payment Backend Missing

Check:

- Edge Functions deployed.
- Secrets configured.
- Frontend `VITE_RAZORPAY_KEY_ID` set.
- Razorpay test keys match backend secret.

### Upload Fails

Check:

- Buckets exist.
- Storage policies exist.
- User is authenticated.
- File type and size are allowed.

## Mobile App Status

`mobile/` currently contains an early React Native shell:

- `App.tsx` renders `AppNavigator`.
- `HomeScreen` displays "Template Hub".

The production-ready implementation is currently the `web/` application.

