-- ═══════════════════════════════════════════════════════════════════
-- gIVEMEGAME.IO — Payment Link MVP: manual provisioning support
-- Migration 017
-- Adds columns for manual billing (admin sets paid_access_enabled).
-- Stripe Payment Link flow: no webhooks, no API; admin activates Pro after confirming payment.
-- ═══════════════════════════════════════════════════════════════════

-- Add manual provisioning columns (user_billing created in 016)
ALTER TABLE public.user_billing
  ADD COLUMN IF NOT EXISTS paid_access_enabled BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS billing_note TEXT;

COMMENT ON COLUMN public.user_billing.paid_access_enabled IS 'Set true by admin after confirming payment. Source of truth for manual MVP.';
COMMENT ON COLUMN public.user_billing.billing_note IS 'Optional note, e.g. Stripe customer ID, manual activation date.';
