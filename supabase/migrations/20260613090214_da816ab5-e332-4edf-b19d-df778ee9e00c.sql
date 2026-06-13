INSERT INTO public.admin_email_allowlist (email, role, label, is_active)
VALUES ('kiscsiberendeles@gmail.com', 'staff', 'Étterem rendelés-kezelő', true)
ON CONFLICT (email) DO UPDATE
  SET role = 'staff', is_active = true, updated_at = now();

INSERT INTO public.user_roles (user_id, role)
SELECT u.id, 'staff'::app_role
FROM auth.users u
WHERE lower(u.email) = 'kiscsiberendeles@gmail.com'
ON CONFLICT (user_id, role) DO NOTHING;