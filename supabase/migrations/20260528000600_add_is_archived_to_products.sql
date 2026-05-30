-- Add is_archived column to public.products for soft deletion
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS is_archived boolean DEFAULT false;
