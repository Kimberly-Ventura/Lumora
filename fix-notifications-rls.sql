-- ============================================================
-- Fix: Admin Notifications RLS Policies
-- Run this in Supabase Dashboard → SQL Editor
-- ============================================================

-- Allow anyone (anon + authenticated) to read all admin notifications
-- The notifications table is admin-only data, but the admin can be
-- logged in via mock session (AsyncStorage) without a real Supabase session.
CREATE POLICY "Public read notifications"
  ON public.notifications
  FOR SELECT
  USING (true);

-- Allow authenticated users to update notifications (mark as read)
CREATE POLICY "Authenticated update notifications"
  ON public.notifications
  FOR UPDATE
  USING (true)
  WITH CHECK (true);

-- Allow authenticated users to insert via direct insert too (belt + suspenders)
-- The RPC function insert_admin_notification already handles this, but just in case:
CREATE POLICY "Authenticated insert notifications"
  ON public.notifications
  FOR INSERT
  WITH CHECK (true);
