-- ==========================================
-- Lumora Supabase Schema & Seed Script
-- ==========================================

-- 1. Create Tables
CREATE TABLE public.categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE public.products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  price numeric NOT NULL,
  stock integer DEFAULT 0,
  category_id uuid REFERENCES public.categories(id),
  image_url text,
  model_url text,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE public.orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id uuid, -- No FK constraint as requested
  total_amount numeric NOT NULL,
  status text DEFAULT 'pending',
  shipping_address text,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE public.order_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid REFERENCES public.orders(id) ON DELETE CASCADE,
  product_id uuid, -- No FK constraint to allow seeding items without products
  quantity integer NOT NULL,
  unit_price numeric NOT NULL,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE public.reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid REFERENCES public.products(id) ON DELETE CASCADE,
  customer_id uuid,
  rating integer NOT NULL,
  comment text,
  created_at timestamptz DEFAULT now()
);

-- 2. Enable Row Level Security (RLS)
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

-- 3. RLS Policies
CREATE POLICY "Public read categories" ON public.categories FOR SELECT USING (true);
CREATE POLICY "Public read products" ON public.products FOR SELECT USING (true);
CREATE POLICY "Public read reviews" ON public.reviews FOR SELECT USING (true);

-- Authenticated users can read and insert their own orders/items
CREATE POLICY "Users read own orders" ON public.orders FOR SELECT USING (auth.uid() = customer_id);
CREATE POLICY "Users insert own orders" ON public.orders FOR INSERT WITH CHECK (auth.uid() = customer_id);

CREATE POLICY "Users read own order_items" ON public.order_items FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.orders WHERE orders.id = order_items.order_id AND orders.customer_id = auth.uid())
);
CREATE POLICY "Users insert own order_items" ON public.order_items FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.orders WHERE orders.id = order_items.order_id AND orders.customer_id = auth.uid())
);

-- ==========================================
-- SEED DATA ENGINE
-- ==========================================
DO $$
DECLARE
    cat_chair_id uuid;
    cat_table_id uuid;
    cat_bed_id uuid;
    cat_sofa_id uuid;
    cat_desk_id uuid;
    
    profiles_array uuid[];
    orders_array uuid[];
    
    i integer;
    random_profile_id uuid;
    random_order_id uuid;
    random_amount numeric;
    random_status text;
    random_days integer;
BEGIN
    -- Insert 5 Categories
    INSERT INTO public.categories (name) VALUES ('Chair') RETURNING id INTO cat_chair_id;
    INSERT INTO public.categories (name) VALUES ('Table') RETURNING id INTO cat_table_id;
    INSERT INTO public.categories (name) VALUES ('Bed') RETURNING id INTO cat_bed_id;
    INSERT INTO public.categories (name) VALUES ('Sofa') RETURNING id INTO cat_sofa_id;
    INSERT INTO public.categories (name) VALUES ('Desk') RETURNING id INTO cat_desk_id;

    -- Cache Real Profile IDs
    SELECT array_agg(id) INTO profiles_array FROM public.profiles;

    IF profiles_array IS NULL OR array_length(profiles_array, 1) = 0 THEN
        RAISE NOTICE 'Skipping orders seed: No profiles found in the database. Please create users first.';
        RETURN;
    END IF;

    -- Seed 20 Randomized Orders linked to real customers
    FOR i IN 1..20 LOOP
        random_profile_id := profiles_array[floor(random() * array_length(profiles_array, 1) + 1)];
        random_amount := floor(random() * (150000 - 8000 + 1) + 8000);
        
        -- Randomly assign status
        random_status := CASE floor(random() * 4)
            WHEN 0 THEN 'pending'
            WHEN 1 THEN 'processing'
            WHEN 2 THEN 'delivered'
            ELSE 'cancelled'
        END;
        
        -- Random created_at date across the last 6 months (180 days)
        random_days := floor(random() * 180);

        INSERT INTO public.orders (customer_id, total_amount, status, created_at)
        VALUES (random_profile_id, random_amount, random_status, now() - (random_days || ' days')::interval)
        RETURNING id INTO orders_array[i];
    END LOOP;

    -- Seed 30 Randomized Order Items
    FOR i IN 1..30 LOOP
        random_order_id := orders_array[floor(random() * 20 + 1)];
        
        INSERT INTO public.order_items (order_id, product_id, quantity, unit_price)
        VALUES (
            random_order_id,
            gen_random_uuid(), -- Generating a fake UUID since products are not being seeded yet
            floor(random() * 3 + 1), -- Quantity: 1 to 3
            floor(random() * 50000 + 1000) -- Unit Price: random
        );
    END LOOP;

END $$;
