-- Update admin user password for gataibence@gmail.com
-- This needs to be done through Supabase dashboard manually since we can't modify auth.users table directly
-- But we can ensure the user exists in profiles table with admin role

-- Ensure gataibence@gmail.com has admin role in profiles table
UPDATE profiles 
SET role = 'admin' 
WHERE email = 'gataibence@gmail.com';

-- If the profile doesn't exist, we'll need to create it when the user first logs in
-- The handle_new_user function will handle this automatically