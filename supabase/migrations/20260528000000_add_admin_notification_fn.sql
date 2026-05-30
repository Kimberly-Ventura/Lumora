-- ============================================================
-- Migration: Add insert_admin_notification SECURITY DEFINER function
-- This allows authenticated customers to trigger admin notifications
-- without needing direct INSERT access to the notifications table
-- ============================================================

CREATE OR REPLACE FUNCTION public.insert_admin_notification(
  p_type text,
  p_title text,
  p_description text
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_id uuid;
BEGIN
  INSERT INTO public.notifications (type, title, description, is_read)
  VALUES (p_type, p_title, p_description, false)
  RETURNING id INTO v_id;
  RETURN v_id;
END;
$$;

-- Allow any authenticated user to call this function
GRANT EXECUTE ON FUNCTION public.insert_admin_notification(text, text, text) TO authenticated;
-- Also allow anon in case needed
GRANT EXECUTE ON FUNCTION public.insert_admin_notification(text, text, text) TO anon;
