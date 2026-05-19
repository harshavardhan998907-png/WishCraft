# Roadmap and Maintenance

## Current System Boundaries

Implemented:

- Web app
- Auth
- Template browsing
- Editor
- Preview
- Free wish publishing
- Paid wish publishing through Razorpay
- Public wish pages
- Storage uploads
- Expiry job
- Dark/light mode

Partially implemented or prepared:

- `music_tracks` database table exists, but editor currently uses a local list.
- Mobile app exists as an early shell.
- Analytics/logging exists only as console and Edge Function logs.

Not currently implemented:

- Admin template management UI
- Analytics dashboard
- User billing history page
- Server-side media transformation
- Team/group wish collaboration
- AI-generated messages/templates

## Scalability Improvements

### Frontend

- Lazy-load route pages with React `lazy`.
- Split vendor chunks in Vite/Rollup.
- Add `prefers-reduced-motion` support.
- Add image dimension validation and compression before upload.
- Add skeletons for each route-level data dependency.

### Backend

- Add database constraints for message length and slug format.
- Add order idempotency rules.
- Add unique pending-order protection per wish.
- Add payment audit table.
- Add storage cleanup for abandoned draft uploads.
- Move built-in music selection to `music_tracks` query.

### Operations

- Add structured logs for Edge Functions.
- Add uptime checks for public routes and functions.
- Add error monitoring such as Sentry.
- Add analytics funnel events.
- Add cron monitoring for `expire-wishes`.

## Feature Roadmap

### Near Term

- Admin panel for templates.
- Built-in music picker sourced from `music_tracks`.
- Better dashboard filters.
- Wish edit-before-expiry flow.
- Copy/share buttons for WhatsApp and native share.
- Image reordering in editor.
- Better mobile editor layout.

### Medium Term

- Template marketplace management.
- Creator accounts and revenue tracking.
- User order history.
- Razorpay webhook support for out-of-band payment updates.
- Email receipts.
- Expiry reminders.
- Downloadable preview snapshots.

### Long Term

- AI-generated wish messages.
- AI-assisted template recommendations.
- AI image background generation.
- Collaborative group wishes.
- Video export.
- Public template creator ecosystem.
- Multi-language templates.
- Subscription plans for creators.

## Monetization Ideas

- Premium templates.
- Custom music uploads.
- HD animation themes.
- Longer live link duration.
- No-branding export.
- Event bundles.
- Creator marketplace commission.
- Business greeting plans.

## Maintenance Guidelines

### When Adding a Template

Update:

- `components/templates/`
- `components/templates/registry.ts`
- `hooks/useTemplates.ts` demo data if fallback support is needed
- Supabase seed migration or admin data
- Documentation

Test:

- Browse card
- Editor preview
- Final preview
- Public wish page
- Dark mode
- Mobile layout

### When Changing Schema

Update:

- New migration
- `010_repair_backend_schema.sql` if it remains the canonical repair script
- `types/index.ts`
- RLS policies
- API docs
- Verification SQL

### When Changing Payment Flow

Update:

- Edge Function validation
- RPC behavior
- Frontend `initiatePayment`
- Error messages
- Security docs
- Manual test checklist

### When Changing Theme

Do:

- Keep light mode screenshot-compatible unless intentionally redesigning.
- Use component-level dark styles.
- Check contrast in both themes.
- Avoid global text color hacks.

Do not:

- Make light cards keep white text in dark mode.
- Override common Tailwind text utilities globally unless there is no safer component-level option.

## Documentation Maintenance

Keep these docs current when implementation changes:

- `README.md`
- `docs/02-architecture.md`
- `docs/04-database-supabase.md`
- `docs/05-flows-api.md`
- `supabase/README.md`

Documentation should describe real behavior, not planned behavior. Planned behavior belongs in this roadmap.

