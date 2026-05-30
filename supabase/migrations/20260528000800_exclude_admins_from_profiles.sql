-- ==========================================
-- Update handle_new_user trigger to exclude admins
-- ==========================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Skip profile creation if user is an admin
  IF (NEW.raw_user_meta_data->>'is_admin')::boolean = true OR NEW.email = 'admin@gmail.com' THEN
    RETURN NEW;
  END IF;

  INSERT INTO public.profiles (id, username, email)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1)),
    NEW.email
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;
