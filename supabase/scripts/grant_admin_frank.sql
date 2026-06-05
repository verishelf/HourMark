-- Grant dashboard admin access to frankposada4@icloud.com
ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS admin_role text,
  ADD COLUMN IF NOT EXISTS suspended boolean NOT NULL DEFAULT false;

UPDATE public.users u
SET admin_role = 'super_admin', suspended = false
FROM auth.users au
WHERE u.id = au.id
  AND lower(au.email) = lower('frankposada4@icloud.com');

SELECT u.id, au.email, u.full_name, u.username, u.admin_role, u.suspended
FROM public.users u
JOIN auth.users au ON au.id = u.id
WHERE lower(au.email) = lower('frankposada4@icloud.com');
