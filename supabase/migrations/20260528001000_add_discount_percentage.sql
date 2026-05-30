-- Add discount_percentage to products
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS discount_percentage numeric DEFAULT 0;
