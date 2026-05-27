
UPDATE public.admin_email_allowlist
SET role = 'admin', is_active = true, updated_at = now()
WHERE email = 'kiscsibeetterem@gmail.com';

INSERT INTO public.admin_email_allowlist (email, role, label, is_active)
SELECT 'kiscsibeetterem@gmail.com', 'admin'::app_role, 'Étterem fő admin', true
WHERE NOT EXISTS (
  SELECT 1 FROM public.admin_email_allowlist WHERE email = 'kiscsibeetterem@gmail.com'
);

INSERT INTO public.user_roles (user_id, role)
SELECT u.id, 'admin'::app_role
FROM auth.users u
WHERE lower(u.email) = 'kiscsibeetterem@gmail.com'
ON CONFLICT (user_id, role) DO NOTHING;
