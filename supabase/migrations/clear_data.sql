-- ==============================================================================
-- PART 2: THE DELETION SCRIPT
-- Run this script SECOND, only AFTER verifying your archive tables exist!
-- It deletes all data in the dependency order to prevent foreign key errors.
-- ==============================================================================

-- 1. Delete order items (depends on orders)
DELETE FROM public.order_items;

-- 2. Delete orders (depends on profiles)
DELETE FROM public.orders;

-- 3. Delete customer notifications (depends on profiles)
DELETE FROM public.customer_notifications;

-- 4. Delete profiles (depends on auth.users)
DELETE FROM public.profiles;

-- 5. Delete authentication users (the root user accounts)
-- Note: This will delete ALL users, including your admin account.
DELETE FROM auth.users;

-- (Optional) If you want to completely reset the sequence IDs back to 1 for the tables (if you use serial IDs):
-- TRUNCATE public.order_items, public.orders, public.customer_notifications, public.profiles RESTART IDENTITY CASCADE;
