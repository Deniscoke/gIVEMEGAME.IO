-- ═══════════════════════════════════════════════════════════════════
-- gIVEMEGAME.IO — Billing migrations (016 + 017)
-- Skopíruj celý tento blok do Supabase Dashboard → SQL Editor → New query → Run
-- ═══════════════════════════════════════════════════════════════════

-- ─── 016: user_billing + billing_events ───
CREATE TABLE IF NOT EXISTS public.user_billing (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  stripe_price_id TEXT,
  subscription_status TEXT NOT NULL DEFAULT 'none',
  current_period_end TIMESTAMPTZ,
  plan_code TEXT NOT NULL DEFAULT 'free',
  billing_state_updated_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_user_billing_user ON public.user_billing(user_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_user_billing_stripe_customer
  ON public.user_billing(stripe_customer_id) WHERE stripe_customer_id IS NOT NULL;

CREATE TABLE IF NOT EXISTS public.billing_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  stripe_event_id TEXT NOT NULL UNIQUE,
  event_type TEXT NOT NULL,
  processed_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_billing_events_stripe_id ON public.billing_events(stripe_event_id);

ALTER TABLE public.user_billing ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own billing" ON public.user_billing;
CREATE POLICY "Users can view own billing"
  ON public.user_billing FOR SELECT USING (auth.uid() = user_id);

GRANT SELECT ON public.user_billing TO authenticated;
GRANT SELECT ON public.billing_events TO authenticated;

-- ─── 017: Payment Link MVP — manual provisioning ───
ALTER TABLE public.user_billing
  ADD COLUMN IF NOT EXISTS paid_access_enabled BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS billing_note TEXT;

COMMENT ON COLUMN public.user_billing.paid_access_enabled IS 'Set true by admin after confirming payment. Source of truth for manual MVP.';
COMMENT ON COLUMN public.user_billing.billing_note IS 'Optional note, e.g. Stripe customer ID, manual activation date.';
