-- App Store / demo: skip AI listing authentication for specific accounts
alter table public.users
  add column if not exists bypass_listing_auth boolean not null default false;

comment on column public.users.bypass_listing_auth is
  'When true, analyze-listing auto-approves; app skips verification asset uploads.';

-- frankposada4@icloud.com — screenshot / sample listings
update public.users u
set
  verified = true,
  is_verified_seller = true,
  kyc_status = 'approved',
  account_trust_score = 95,
  fraud_risk_score = 0,
  bypass_listing_auth = true
from auth.users au
where u.id = au.id
  and lower(au.email) = lower('frankposada4@icloud.com');

-- Publish any existing draft listings for that account
update public.listings l
set
  authentication_status = 'auto_verified',
  status = 'active',
  authenticated = true,
  ai_trust_score = 92,
  verification_confidence = 1,
  trust_badges = '["escrow_protected","ai_authenticated","verified_seller"]'::jsonb
from auth.users au
where l.seller_id = au.id
  and lower(au.email) = lower('frankposada4@icloud.com')
  and l.authentication_status is distinct from 'auto_verified';
