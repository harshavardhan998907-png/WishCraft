# Template Hub

Template Hub is a cinematic wish-page generator for birthdays, weddings, anniversaries, festivals, graduations, and other personal occasions. Users choose an animated template, customize names, messages, photos, and music, then publish a shareable 7-day celebration link.

The project combines a premium animated React interface with a Supabase backend for authentication, database records, media storage, payment-backed activation, and expiring public links.

## Screenshots

Recommended portfolio screenshot filenames:

| Home | Browse | Editor | Wish Page |
| --- | --- | --- | --- |
| `docs/assets/home-light.png` | `docs/assets/browse-light.png` | `docs/assets/editor.png` | `docs/assets/wish.png` |

## Highlights

- Cinematic wish pages with animated reveals, particles, glows, ribbons, photo memories, and music.
- Template marketplace with occasion, tier, animation, and music filtering.
- Free, standard, and premium pricing tiers.
- Supabase email/password authentication and protected creation routes.
- User dashboard for created wishes.
- Photo uploads to Supabase Storage with public delivery.
- Premium custom music upload support.
- Razorpay order creation and signature verification through Supabase Edge Functions.
- Public share route at `/w/:slug` with Open Graph metadata.
- Automatic expiry model for active wishes after 7 days.
- Light and dark themes with persisted user preference.
- Fallback demo templates when Supabase templates are unavailable, while production creation still validates database templates.

## Tech Stack

| Layer | Technology | Purpose |
| --- | --- | --- |
| Web app | React 18, TypeScript | Typed component architecture and UI state |
| Build | Vite 6 | Fast dev server and optimized production bundles |
| Routing | React Router DOM | Page routing and protected routes |
| Styling | Tailwind CSS | Utility-first design system with dark mode |
| Animation | Framer Motion | Cinematic transitions, floating particles, reveal effects |
| State | Zustand | Auth, editor, and toast state stores |
| Backend | Supabase | Auth, Postgres, Storage, Edge Functions |
| Database | Supabase Postgres | Profiles, templates, wishes, orders, music tracks |
| Storage | Supabase Storage | Wish photos and custom music assets |
| Payments | Razorpay | Paid template checkout and order verification |
| Metadata | React Helmet Async | Dynamic title and Open Graph tags |
| IDs | nanoid | Public wish slug generation |

## Repository Structure

```txt
template-hub/
  web/                 Vite React web application
  mobile/              Early React Native shell
  supabase/            SQL migrations, verification SQL, and Edge Functions
  docs/                Production documentation
```

## Documentation

- [Project Overview](docs/01-project-overview.md)
- [Architecture](docs/02-architecture.md)
- [Frontend, Theme, and Templates](docs/03-frontend-theme-templates.md)
- [Database and Supabase](docs/04-database-supabase.md)
- [Flows and API](docs/05-flows-api.md)
- [Security, Performance, and Error Handling](docs/06-security-performance-errors.md)
- [Deployment and Development Workflow](docs/07-deployment-development.md)
- [Roadmap and Maintenance](docs/08-roadmap-maintenance.md)
- [Component and File Reference](docs/09-component-file-reference.md)

## Local Setup

### Prerequisites

- Node.js 18 or newer
- npm
- Supabase project
- Razorpay account for paid templates

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

Do not put `SUPABASE_SERVICE_ROLE_KEY` or `RAZORPAY_KEY_SECRET` in frontend environment files.

### Run

```bash
cd web
npm run dev
```

Open `http://localhost:5173`.

## Supabase Setup

Run migrations in order from `supabase/migrations/`. If the project is missing tables or reports PostgREST schema cache errors, run the idempotent repair migration:

```sql
-- supabase/migrations/010_repair_backend_schema.sql
```

Then refresh the schema cache:

```sql
notify pgrst, 'reload schema';
```

Use `supabase/verify_backend.sql` to confirm backend readiness.

## Edge Function Secrets

Set these secrets in Supabase:

```txt
RAZORPAY_KEY_ID=your_razorpay_key_id
RAZORPAY_KEY_SECRET=your_razorpay_key_secret
SUPABASE_URL=your_supabase_project_url
SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

Deploy:

```bash
supabase functions deploy create-razorpay-order
supabase functions deploy verify-payment
supabase functions deploy expire-wishes
```

Schedule `expire-wishes` hourly.

## Scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Start Vite development server |
| `npm run build` | Type-check and build production bundle |
| `npm run preview` | Preview the production build |
| `npm run lint` | Run ESLint |

## Core Usage Flow

1. User signs up or logs in.
2. User browses templates.
3. User selects a template and enters wish details.
4. User uploads optional photos and, for premium templates, custom music.
5. User previews the cinematic wish.
6. Free templates publish immediately.
7. Paid templates create a draft wish, open Razorpay Checkout, verify payment, and activate the wish.
8. The app shows a share URL.
9. Recipients open `/w/:slug`, tap to reveal, and view the animated page.
10. Expired wishes show the expired page.

## Contributing

1. Keep changes scoped to the feature or fix.
2. Preserve the theme and template architecture.
3. Run `npm run build` before submitting.
4. Update documentation when changing routes, schema, functions, template behavior, or environment requirements.

## License

No license file is currently included. Add one before public distribution.
