-- Default listing seller fee to 7% (Stripe platform fee on seller payout)
ALTER TABLE public.platform_settings
  ALTER COLUMN seller_fee_percentage SET DEFAULT 7.00;

UPDATE public.platform_settings
SET seller_fee_percentage = 7.00
WHERE seller_fee_percentage IS NULL OR seller_fee_percentage = 0;
