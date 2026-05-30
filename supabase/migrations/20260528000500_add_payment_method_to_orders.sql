-- Add payment_method column to public.orders
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS payment_method text;
