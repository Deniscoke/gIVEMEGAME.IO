# gIVEMEGAME.IO — Stripe Payment Link MVP

Minimal monetization using **Stripe Payment Links** — no Checkout Session API, no webhooks, no secret key. Manual provisioning only.

## Overview

- **Free** and **Pro Teacher Monthly** plans
- User clicks "Upgrade to Pro" → redirects to Stripe-hosted Payment Link
- After payment, Stripe redirects to `/billing/success` or `/billing/cancel`
- **Pro access is activated manually** by an admin in Supabase (no auto-provisioning yet)

## Setup

### 1. Stripe Payment Link

1. Go to [Stripe Dashboard → Payment Links](https://dashboard.stripe.com/payment-links)
2. Create a new Payment Link for your Pro Monthly product
3. Set **After payment** → Success URL: `https://yourdomain.com/billing/success`
4. Set **After payment** → Cancel URL: `https://yourdomain.com/billing/cancel`
5. Copy the Payment Link URL (e.g. `https://buy.stripe.com/...`)

### 2. Environment

Add to `.env`:

```env
STRIPE_PAYMENT_LINK_PRO_MONTHLY=https://buy.stripe.com/your-link-here
BILLING_SUPPORT_EMAIL=support@example.com  # optional, for future use
```

### 3. Database

Run migration 017 (adds `paid_access_enabled`, `billing_note` to `user_billing`):

```sql
-- In Supabase Dashboard → SQL Editor
ALTER TABLE public.user_billing
  ADD COLUMN IF NOT EXISTS paid_access_enabled BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS billing_note TEXT;
```

Or run full migrations: `npm run db:migrate`.

---

## Manual Provisioning

### How to activate Pro for a paying customer

1. **Find the payment in Stripe**
   - Stripe Dashboard → Payments
   - Note the customer email (or metadata)

2. **Find the user in Supabase**
   - Supabase Dashboard → Authentication → Users
   - Search by email
   - Copy the user's **UUID** (id)

3. **Update `user_billing`**

   In SQL Editor:

   ```sql
   -- Create or update row (user_id = UUID from auth.users)
   INSERT INTO public.user_billing (user_id, plan_code, paid_access_enabled, billing_note, billing_state_updated_at)
   VALUES (
     'user-uuid-here',
     'pro_teacher_monthly',
     true,
     'Manual activation 2025-03-13 — Stripe payment confirmed',
     now()
   )
   ON CONFLICT (user_id) DO UPDATE SET
     plan_code = 'pro_teacher_monthly',
     paid_access_enabled = true,
     billing_note = COALESCE(EXCLUDED.billing_note, user_billing.billing_note),
     billing_state_updated_at = now();
   ```

   Or use Table Editor: add/update row in `user_billing` with `paid_access_enabled = true`, `plan_code = 'pro_teacher_monthly'`.

4. User refreshes the app → sees Pro plan

### How to revoke Pro

```sql
UPDATE public.user_billing
SET paid_access_enabled = false, plan_code = 'free', billing_state_updated_at = now()
WHERE user_id = 'user-uuid-here';
```

---

## Premium Features Gated

| Feature | Free | Pro |
|---------|------|-----|
| Game generation rate limit | 10/min | 30/min |
| (Future) Premium Game Pack | No | Yes |
| (Future) Export / advanced features | No | Yes |

Gating is centralized in `lib/billing.js`: `hasPaidAccess(row)`.

---

## Testing Locally

1. Use Stripe **test mode** — create a test Payment Link
2. Set success URL: `http://localhost:3000/billing/success`
3. Set cancel URL: `http://localhost:3000/billing/cancel`
4. Use test card: `4242 4242 4242 4242`
5. Manually provision your test user in Supabase after "payment"

---

## Limitations (Phase 1)

- No automatic provisioning — admin must activate Pro manually
- No Customer Portal — users cannot cancel or manage subscription in-app
- No webhooks — payment status is not synced automatically
- Single Payment Link — no per-user metadata; match customers by email
- No receipt/invoice delivery automation

---

## Phase 2: Webhooks + Auto Provisioning

To migrate to automatic billing:

1. Add Stripe webhook endpoint (`POST /api/stripe/webhook`)
2. Handle `checkout.session.completed` → create/update `user_billing`, set `paid_access_enabled = true`
3. Handle `customer.subscription.deleted` → revoke access
4. Add Customer Portal link (requires Stripe API + secret key)
5. Optional: pass `client_reference_id` = user id in Payment Link (custom field) for easier matching
6. Remove manual provisioning docs; keep as fallback

The current schema (`user_billing` with `paid_access_enabled`, `plan_code`) and `hasPaidAccess()` helper are designed to support this migration with minimal changes.
