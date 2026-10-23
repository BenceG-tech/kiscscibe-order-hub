-- Use the server-managed, confirmed Auth email for role claims.
-- public.profiles.email is user-editable and must not grant authorization.
CREATE OR REPLACE FUNCTION public.claim_admin_access()
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  current_email text;
  allowed_role public.app_role;
BEGIN
  SELECT lower(email) INTO current_email
  FROM auth.users
  WHERE id = auth.uid()
    AND email_confirmed_at IS NOT NULL;

  IF current_email IS NULL THEN
    RETURN false;
  END IF;

  SELECT role INTO allowed_role
  FROM public.admin_email_allowlist
  WHERE lower(email) = current_email
    AND is_active = true
  LIMIT 1;

  IF allowed_role IS NULL THEN
    RETURN false;
  END IF;

  INSERT INTO public.user_roles (user_id, role)
  VALUES (auth.uid(), allowed_role)
  ON CONFLICT (user_id, role) DO NOTHING;

  IF allowed_role = 'owner' THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (auth.uid(), 'admin')
    ON CONFLICT (user_id, role) DO NOTHING;
  END IF;

  RETURN true;
END;
$function$
