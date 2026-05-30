-- ============================================================
-- Migration: Fix Products RLS Policies
-- This ensures stock level updates succeed on checkout/cancellation,
-- and admins can insert, update, or delete products.
-- ============================================================

-- 1. Drop any existing policies to avoid conflicts
DROP POLICY IF EXISTS "Public read products" ON public.products;
DROP POLICY IF EXISTS "Allow public read products" ON public.products;
DROP POLICY IF EXISTS "Allow public update products" ON public.products;
DROP POLICY IF EXISTS "Allow public insert products" ON public.products;
DROP POLICY IF EXISTS "Allow public delete products" ON public.products;

-- 2. Allow anyone (anon + authenticated) to read products
CREATE POLICY "Allow public read products"
  ON public.products
  FOR SELECT
  USING (true);

-- 3. Allow anyone to update products (crucial for client-side stock updates on checkout/cancellation)
CREATE POLICY "Allow public update products"
  ON public.products
  FOR UPDATE
  USING (true)
  WITH CHECK (true);

-- 4. Allow insert and delete of products.
-- NOTE: In production, these should be restricted to admin users. However, since the admin portal
-- utilizes a mocked session that bypasses Supabase auth (running under the anonymous key),
-- we keep these policies open to ensure the admin can manage the inventory.
CREATE POLICY "Allow public insert products"
  ON public.products
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Allow public delete products"
  ON public.products
  FOR DELETE
  USING (true);
