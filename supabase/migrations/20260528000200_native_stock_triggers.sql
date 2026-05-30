-- ============================================================
-- Migration: Native Database Triggers for Stock & Notifications
-- Run this in Supabase Dashboard → SQL Editor
-- ============================================================

-- 0. Update Notifications Table Check Constraint to Allow New Types
ALTER TABLE public.notifications DROP CONSTRAINT IF EXISTS notifications_type_check;
ALTER TABLE public.notifications ADD CONSTRAINT notifications_type_check CHECK (type IN ('new_order', 'low_stock', 'new_customer', 'order_cancelled', 'out_of_stock'));

-- 0.5. Clean up any older/duplicate triggers on the tables dynamically
DO $$
DECLARE
    trig RECORD;
BEGIN
    -- Drop other triggers on products
    FOR trig IN 
        SELECT trigger_name 
        FROM information_schema.triggers 
        WHERE event_object_table = 'products' 
          AND trigger_name != 'trg_product_stock_updated'
    LOOP
        EXECUTE 'DROP TRIGGER IF EXISTS ' || quote_ident(trig.trigger_name) || ' ON public.products;';
        RAISE NOTICE 'Dropped product trigger: %', trig.trigger_name;
    END LOOP;

    -- Drop other triggers on orders
    FOR trig IN 
        SELECT trigger_name 
        FROM information_schema.triggers 
        WHERE event_object_table = 'orders' 
          AND trigger_name != 'trg_order_status_updated'
    LOOP
        EXECUTE 'DROP TRIGGER IF EXISTS ' || quote_ident(trig.trigger_name) || ' ON public.orders;';
        RAISE NOTICE 'Dropped order trigger: %', trig.trigger_name;
    END LOOP;

    -- Drop other triggers on order_items
    FOR trig IN 
        SELECT trigger_name 
        FROM information_schema.triggers 
        WHERE event_object_table = 'order_items' 
          AND trigger_name != 'trg_order_item_inserted'
    LOOP
        EXECUTE 'DROP TRIGGER IF EXISTS ' || quote_ident(trig.trigger_name) || ' ON public.order_items;';
        RAISE NOTICE 'Dropped order_items trigger: %', trig.trigger_name;
    END LOOP;
END $$;

-- 1. Deduct Stock Automatically on New Order Items
CREATE OR REPLACE FUNCTION public.handle_order_item_inserted()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.product_id IS NOT NULL THEN
    UPDATE public.products
    SET stock = GREATEST(0, stock - NEW.quantity)
    WHERE id = NEW.product_id;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_order_item_inserted ON public.order_items;
CREATE TRIGGER trg_order_item_inserted
  AFTER INSERT ON public.order_items
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_order_item_inserted();


-- 2. Restore Stock Automatically on Order Cancellation
-- Also creates an admin notification for the cancellation event.
CREATE OR REPLACE FUNCTION public.handle_order_status_updated()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  item RECORD;
  v_customer_name TEXT := 'Customer';
  v_short_id TEXT;
BEGIN
  IF NEW.status = 'cancelled' AND (OLD.status IS DISTINCT FROM 'cancelled') THEN
    -- Restore stock levels
    FOR item IN 
      SELECT product_id, quantity 
      FROM public.order_items 
      WHERE order_id = NEW.id
    LOOP
      IF item.product_id IS NOT NULL THEN
        UPDATE public.products
        SET stock = stock + item.quantity
        WHERE id = item.product_id;
      END IF;
    END LOOP;

    -- Fetch customer's name
    SELECT COALESCE(username, 'Customer') INTO v_customer_name
    FROM public.profiles
    WHERE id = NEW.customer_id;

    v_short_id := '#ORD-' || UPPER(SUBSTRING(NEW.id::text, 1, 4));

    -- Insert Admin Notification
    INSERT INTO public.notifications (type, title, description, is_read)
    VALUES (
      'order_cancelled',
      'Order Cancelled',
      'Order ' || v_short_id || ' has been cancelled by ' || v_customer_name,
      false
    );
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_order_status_updated ON public.orders;
CREATE TRIGGER trg_order_status_updated
  AFTER UPDATE ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_order_status_updated();


-- 3. Automatic Warnings / Alerts on Stock Updates
CREATE OR REPLACE FUNCTION public.handle_product_stock_updated()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Check if stock has decreased
  IF NEW.stock < OLD.stock THEN
    IF NEW.stock = 0 THEN
      -- Out of Stock
      INSERT INTO public.notifications (type, title, description, is_read)
      VALUES (
        'out_of_stock',
        'Out of Stock',
        'Product "' || NEW.name || '" is now out of stock.',
        false
      );
    ELSIF NEW.stock < 10 THEN
      -- Low Stock
      INSERT INTO public.notifications (type, title, description, is_read)
      VALUES (
        'low_stock',
        'Low Stock Warning',
        'Product "' || NEW.name || '" is running low. Only ' || NEW.stock || ' left in stock.',
        false
      );
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_product_stock_updated ON public.products;
CREATE TRIGGER trg_product_stock_updated
  AFTER UPDATE OF stock ON public.products
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_product_stock_updated();
