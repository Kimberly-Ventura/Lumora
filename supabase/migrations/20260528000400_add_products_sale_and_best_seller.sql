-- Migration to add On Sale and Best Seller properties to products table
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS on_sale boolean DEFAULT false;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS sale_price numeric DEFAULT NULL;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS is_best_seller boolean DEFAULT false;
