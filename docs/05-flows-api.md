# Flows and API Documentation

## End-to-End Wish Generation Flow

```txt
Browse template
  -> editor form
  -> upload media
  -> live preview
  -> create wish
  -> optional payment
  -> share URL
  -> public recipient view
  -> expiry handling
```

## Template Selection

1. `Browse` calls `useTemplates`.
2. `useTemplates` reads active templates from Supabase.
3. If Supabase fails or returns no rows, it falls back to `demoTemplates`.
4. User filters templates by:
   - Occasion
   - Tier
   - Animation support
   - Music support
5. Clicking a card navigates to `/editor/:templateSlug`.

## Customization

The editor stores data in `editorStore`:

| Field | Source |
| --- | --- |
| `template` | Route slug + Supabase lookup |
| `recipientName` | Input |
| `senderName` | Input |
| `customMessage` | Textarea, max 300 characters |
| `photoUrls` | Supabase Storage public URLs |
| `musicUrl` | Built-in string value or custom upload URL |
| `useCustomMusic` | Set when premium upload succeeds |

## Media Upload

### Photos

- Maximum 5 photos.
- Frontend limit: 5MB per file.
- Storage bucket: `wish-photos`.
- Upload path pattern: `draft/{timestamp}-{filename}`.
- Public URL is added to `photoUrls`.

### Music

- Only shown for premium templates.
- Frontend limit: 10MB.
- Storage bucket: `wish-music`.
- Upload path pattern: `draft/{timestamp}.{ext}`.
- Public URL is stored as `musicUrl`.

## Preview Generation

`LivePreview` receives the selected template and current editor data. It looks up the component by `component_name` in `templateRegistry`, lazy-loads the template, and renders it in a framed preview.

## Wish Creation

`Preview.createWish()`:

1. Requires authenticated user.
2. Ensures `profiles` row exists.
3. Resolves the real database template. Local demo template IDs are not accepted for creation.
4. Generates a 10-character public slug with `nanoid`.
5. Checks for slug collision up to 3 times.
6. Inserts into `wishes`.

Free templates:

- Insert status: `active`
- `is_paid`: false
- `expires_at`: now + 7 days
- `activated_at`: now

Paid templates:

- Insert status: `draft`
- `is_paid`: false
- Payment flow activates the wish after verification.

## Sharing

After creation:

- User is navigated to `/share/:slug`.
- Share page calculates the absolute URL with `getShareableUrl(slug)`.
- Copy action uses `navigator.clipboard.writeText`.

Public URL format:

```txt
{origin}/w/{slug}
```

## Public Viewing

`WishPage`:

1. Reads `slug` from route.
2. Calls `useWish(slug)`.
3. Fetches `wishes` with joined `templates`.
4. Checks local expiry with `isWishExpired`.
5. Displays tap-to-open gate.
6. Starts audio only after user action.
7. Renders the registered template.

## Expiry Handling

Two layers exist:

- Frontend checks `expires_at` and shows `Expired`.
- `expire-wishes` Edge Function updates old active wishes to `expired`.

Schedule `expire-wishes` hourly in production.

## API Surface

The project uses Supabase client APIs and Supabase Edge Functions.

## Supabase Client Queries

### Get Active Templates

Used in `useTemplates`.

```ts
supabase
  .from('templates')
  .select('*')
  .eq('is_active', true)
  .order('tier', { ascending: true })
```

Auth: public via RLS.

Response: array of `Template`.

Fallback: `demoTemplates`.

### Get Template by Slug

Used in `Editor` and `Preview`.

```ts
supabase
  .from('templates')
  .select('*')
  .eq('slug', templateSlug)
  .single()
```

Auth: public via RLS.

### Get Wish by Slug

Used in `useWish`.

```ts
supabase
  .from('wishes')
  .select('*, template:templates(*)')
  .eq('slug', slug)
  .single()
```

Auth:

- Public can read active wishes.
- Owner can read own wishes.

### Insert Wish

Used in `Preview`.

```ts
supabase
  .from('wishes')
  .insert({
    user_id,
    template_id,
    slug,
    recipient_name,
    sender_name,
    custom_message,
    photo_urls,
    music_url,
    status,
    is_paid,
    expires_at,
    activated_at
  })
  .select('id, slug')
  .single()
```

Auth: authenticated owner.

### Upsert Profile

Used in signup and preview.

```ts
supabase
  .from('profiles')
  .upsert({
    id,
    email,
    full_name,
    avatar_url
  })
```

Auth: authenticated owner.

### Upload Photo

```ts
supabase.storage
  .from('wish-photos')
  .upload(path, file)
```

Auth: authenticated.

### Upload Music

```ts
supabase.storage
  .from('wish-music')
  .upload(path, file)
```

Auth: authenticated.

## Edge Functions

### `create-razorpay-order`

Method: `POST`

Purpose: Create a Razorpay order and matching database order for a user's draft wish.

Auth: required. The frontend invocation sends the Supabase JWT automatically through `supabase.functions.invoke`.

Request:

```json
{
  "amount": 19900,
  "wishId": "uuid",
  "templateId": "uuid"
}
```

Validation:

- Method must be POST.
- User must be authenticated.
- `amount`, `wishId`, and `templateId` are required.
- Wish must belong to the authenticated user.
- Wish must match the selected template.
- Wish status must be `draft`.
- Template must exist.
- Amount must match `templates.price_paise`.

Success response:

```json
{
  "order_id": "database-order-uuid",
  "razorpay_order_id": "order_razorpay_id"
}
```

Error responses:

| Status | Example |
| --- | --- |
| 400 | Missing fields, invalid draft wish, amount mismatch |
| 401 | Unauthorized |
| 405 | Method not allowed |
| 500 | Unhandled Razorpay/backend error |

### `verify-payment`

Method: `POST`

Purpose: Verify Razorpay signature and activate paid wish.

Request:

```json
{
  "orderId": "order_razorpay_id",
  "paymentId": "pay_razorpay_id",
  "signature": "razorpay_signature",
  "dbOrderId": "database-order-uuid",
  "wishId": "wish-uuid"
}
```

Validation:

- Method must be POST.
- All fields are required.
- Razorpay HMAC signature must match.
- Database order must exist.
- Database order must match wish id and Razorpay order id.
- Database order must still be `pending`.

Success response:

```json
{
  "verified": true
}
```

Error responses:

| Status | Example |
| --- | --- |
| 400 | Missing fields, invalid signature, order mismatch |
| 405 | Method not allowed |
| 500 | Missing secret or unhandled verification error |

### `expire-wishes`

Method: any request currently triggers the function.

Purpose: Mark active wishes as expired when `expires_at` is in the past.

Auth: should be protected operationally by Supabase scheduling or gateway controls.

Success response:

```json
{
  "ok": true
}
```

Error response:

```json
{
  "error": "database error message"
}
```

## Error Handling Paths

| Flow | Behavior |
| --- | --- |
| Auth errors | Friendly message in form |
| Template fetch failure | Demo template fallback |
| Upload failure | Toast error |
| Missing DB template | Toast error with migration guidance |
| Payment backend missing | Explicit deployment error |
| Payment dismissed | Toast error |
| Public wish not found | Fullscreen not-found message |
| Expired wish | Expired page |

