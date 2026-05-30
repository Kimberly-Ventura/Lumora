-- Fix legacy products that were on sale but have 0 or null discount percentage
UPDATE public.products 
SET on_sale = false, sale_price = null 
WHERE on_sale = true AND (discount_percentage IS NULL OR discount_percentage = 0);
