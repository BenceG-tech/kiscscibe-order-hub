-- Drop the parameterless version of is_admin to fix the function overload conflict
-- Keep only is_admin(check_user_id uuid DEFAULT NULL) which handles both cases
DROP FUNCTION IF EXISTS public.is_admin();