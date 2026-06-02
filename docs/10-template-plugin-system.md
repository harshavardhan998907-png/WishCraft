# Template Plugin System

## Current Architecture Analysis

TemplateHub keeps template metadata in `public.templates`, stores user wishes in `public.wishes`, and renders the selected wish through `component_name`. The editor, live preview, public wish page, browse page, dashboard, payments, media uploads, and analytics all depend on that template row staying stable. The plugin system therefore extends the existing metadata contract instead of replacing it.

## Conflict Analysis

- Existing wishes reference `templates.id`, so template rows must remain backward compatible.
- Existing React templates accept `{ data: WishData }`, while the plugin contract uses `TemplateProps`.
- Admin moderation already has creator marketplace concepts, but current business rules require founder-only publishing.
- Public browsing must continue reading only active, published Supabase rows.

## Integration Strategy

- Keep `component_name` as the compatibility key.
- Add `component_key`, `renderer_type`, `manifest_json`, metadata, and storage fields to `public.templates`.
- Register founder templates locally with typed manifests and lazy React component loading.
- Render through `TemplateRenderer`, which validates lookup, lazy loading, preview mode, and render errors.
- Keep creator marketplace code dormant; the plugin manifest includes `authorType` for future expansion.

## Folder Structure

- `web/src/template-engine/`: contracts, registry, validation, renderer, storage helpers.
- `web/src/templates/founder/`: founder-controlled template plugin registrations.
- `web/src/components/templates/registry.ts`: compatibility adapter for older imports.
- `supabase/migrations/023_template_plugin_system.sql`: schema, indexes, RLS, and storage bucket.

## Plugin Import Workflow

1. Build a template separately in React, TypeScript, Tailwind, and Framer Motion.
2. Implement the `TemplateProps` contract, or adapt an existing `{ data: WishData }` template.
3. Copy it into a founder template folder.
4. Add a `TemplateManifest`.
5. Register it with `registerTemplate()`.
6. Open Admin > Templates and create the DB metadata row if it is local-only.
7. Preview the template from the admin panel.
8. Publish it when ready.

## Database And Storage

Migration `023_template_plugin_system.sql` adds plugin metadata, unique `component_key`, plugin indexes, an `updated_at` trigger, and a public `templates` storage bucket. Only admins can upload/update/delete objects under `thumbnails/`, `previews/`, and `assets/`; public users can read published assets.

## Backward Compatibility

Existing templates, wishes, editor state, payment creation, and public rendering continue to work because `component_name` and the original `templates` table remain intact. The old registry now delegates to the new plugin registry with a legacy adapter.

## Testing Strategy

- `npm run build` for TypeScript and production Vite compilation.
- Admin manual checks: list, search, preview, create metadata, edit metadata, publish/unpublish, disable/enable.
- User flow checks: browse, editor live preview, paid/free preview creation, public `/w/:slug` rendering.
- Migration checks: apply migration in staging, confirm RLS for anonymous reads and admin writes.

## Deployment Checklist

- Apply Supabase migrations through `023_template_plugin_system.sql`.
- Confirm `templates` storage bucket exists with policies.
- Seed or create metadata for new local plugins in Admin > Templates.
- Verify every published DB row has a registered `component_key` or `component_name`.
- Run `npm run build`.
- Smoke test browse, editor, payment, and public wish rendering.
