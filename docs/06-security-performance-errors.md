# Security, Performance, and Error Handling

## Security Model

## Authentication Security

- Supabase Auth manages email/password identity.
- Session state is obtained through `supabase.auth.getUser`.
- Auth changes are subscribed through `onAuthStateChange`.
- Protected frontend routes use `ProtectedRoute`.
- Backend RLS is the real security boundary.

## Row-Level Security

All application tables enable RLS:

- `profiles`
- `templates`
- `wishes`
- `orders`
- `music_tracks`

Policies keep private data scoped:

- Users can only manage their own profiles and wishes.
- Users can only view their own orders.
- Active templates and active music tracks are publicly readable.
- Active wishes are publicly readable to support shared links.

## Storage Security

Buckets are public because generated wish pages must load recipient media without login:

- `wish-photos`
- `wish-music`

Upload is limited to authenticated users. Repair migration adds file size and MIME type limits. Owners can update/delete their own files.

## Payment Security

Payment-sensitive logic is server-side:

- Razorpay key secret is stored only as an Edge Function secret.
- `verify-payment` recomputes HMAC SHA-256 signature.
- The database order must match the payload.
- Only pending orders can activate a wish.
- `activate_paid_wish` updates order and wish in a controlled RPC.

Frontend only receives the public Razorpay key id.

## Environment Protection

Frontend allowed:

```txt
VITE_SUPABASE_URL
VITE_SUPABASE_ANON_KEY
VITE_RAZORPAY_KEY_ID
```

Backend only:

```txt
SUPABASE_SERVICE_ROLE_KEY
RAZORPAY_KEY_SECRET
```

Never commit `.env.local`.

## Input Validation

Current frontend validation:

- Recipient name required.
- Sender name required.
- Message limited to 300 characters.
- Up to 5 photos.
- Photo size up to 5MB.
- Music size up to 10MB.
- Paid amount is validated server-side against template price.

Recommended future hardening:

- Server-side text length checks.
- File path normalization.
- Per-user upload quotas.
- Rate limits for wish creation.
- CAPTCHA or email confirmation for signup if abuse appears.

## Performance Optimization

## Existing Optimizations

### Code Splitting

Template components are lazy-loaded in `templateRegistry`, reducing initial bundle impact for wish pages and previews.

### Vite Build

Vite provides optimized production builds and fast local HMR.

### Memoization

`Editor` uses `useMemo` for preview data so live preview props only change when relevant fields change.

### Lightweight State

Zustand stores are small and scoped:

- Auth store
- Editor store
- Toast store

### Asset Handling

- Photos are hosted in Supabase Storage.
- Template thumbnails are external URLs.
- Public wish pages load only the selected template component.

### Animation Considerations

Framer Motion animations use transform, opacity, scale, and rotation, which are generally GPU-friendly. The particle counts are fixed and predictable.

## Current Build Warning

The production build reports a chunk over 500KB after minification. This is a warning, not an error.

Future optimization options:

- Split vendor chunks.
- Manual chunks for Framer Motion, Supabase, and router packages.
- Move more route-level pages to lazy imports.
- Reduce animation library impact if needed.

## Error Handling

### Frontend

| Area | Strategy |
| --- | --- |
| Auth | Form-level friendly error messages |
| Uploads | Toast errors |
| Payments | Toast and explicit backend deployment errors |
| Template fetch | Demo fallback |
| Wish fetch | Fullscreen not-found message |
| Offline | Offline banner |
| Protected routes | Loading state then redirect |

### Toast System

`toastStore` stores timed messages:

- `success`
- `error`
- `info`

Messages auto-dismiss after 4 seconds and can be manually removed by clicking.

### Backend

Edge Functions return JSON errors with HTTP status codes.

They log:

- Incoming payload summaries
- Missing environment/secrets
- Unauthorized access
- Validation failures
- Payment mismatch details
- Unhandled errors

## Logging Strategy

Current logging:

- Browser console logs for fetch/payment/debug flows.
- Edge Function logs in Supabase dashboard.

Production recommendation:

- Reduce noisy `console.info` logs after launch.
- Add structured server logging for payments.
- Add audit records for payment verification if compliance needs grow.
- Add analytics events for template selection and conversion funnel.

## Accessibility Notes

Current accessibility-positive choices:

- Real buttons for actions.
- `aria-label` and `aria-pressed` on theme toggle.
- Modal uses `role="dialog"` and `aria-modal`.
- High contrast fixes for dark mode cards.

Future accessibility work:

- Add visible labels for all icon-only actions.
- Validate color contrast across all templates.
- Add reduced-motion mode using `prefers-reduced-motion`.
- Improve focus management inside modal.

