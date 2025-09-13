-- Create bootstrap function for first admin user
CREATE OR REPLACE FUNCTION public.bootstrap_first_admin()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    admin_count integer;
    first_user_id uuid;
BEGIN
    -- Check if any admin already exists
    SELECT COUNT(*) INTO admin_count
    FROM profiles
    WHERE role = 'admin';
    
    -- If no admin exists, make the first user an admin
    IF admin_count = 0 THEN
        -- Get the first user (by creation date)
        SELECT user_id INTO first_user_id
        FROM profiles
        ORDER BY created_at ASC
        LIMIT 1;
        
        -- If we found a user, make them admin
        IF first_user_id IS NOT NULL THEN
            UPDATE profiles
            SET role = 'admin'
            WHERE user_id = first_user_id;
            
            RETURN true;
        END IF;
    END IF;
    
    RETURN false;
END;
$$;

-- Create function to check if user is admin (used in RLS policies)
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM profiles
    WHERE user_id = auth.uid()
    AND role = 'admin'
  );
$$;