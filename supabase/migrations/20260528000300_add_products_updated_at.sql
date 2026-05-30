-- =====================================================================
-- Migration: Add updated_at to products and trigger to auto-update
-- =====================================================================

-- 1. Add updated_at column to public.products if it doesn't exist
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();

-- 2. Create the timestamp handler function if not exists
CREATE OR REPLACE FUNCTION public.handle_update_timestamp()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 3. Bind BEFORE UPDATE trigger to products table to update updated_at automatically
DROP TRIGGER IF EXISTS trg_products_update_timestamp ON public.products;
CREATE TRIGGER trg_products_update_timestamp
  BEFORE UPDATE ON public.products
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_update_timestamp();
