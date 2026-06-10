-- Create function to check if a user exists by email
-- This is used by the invitation acceptance flow to determine
-- whether to show "Login" or "Sign Up" button

CREATE OR REPLACE FUNCTION public.check_user_exists(user_email TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  user_count INTEGER;
BEGIN
  -- Check if user exists in auth.users
  SELECT COUNT(*)
  INTO user_count
  FROM auth.users
  WHERE email = user_email;
  
  RETURN user_count > 0;
END;
$$;

-- Grant execute permission to authenticated and anon users
GRANT EXECUTE ON FUNCTION public.check_user_exists(TEXT) TO authenticated, anon;

COMMENT ON FUNCTION public.check_user_exists IS 'Check if a user account exists for the given email address';
