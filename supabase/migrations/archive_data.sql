-- ==============================================================================
-- PART 1: THE ARCHIVAL SCRIPT
-- Run this script FIRST. It creates copies of your current tables.
-- Note: 'CREATE TABLE AS' automatically creates the table and copies the data.
-- ==============================================================================

-- 1. Backup auth.users (the core authentication table)
CREATE TABLE IF NOT EXISTS public.auth_users_archive AS 
SELECT * FROM auth.users;

-- 2. Backup profiles
CREATE TABLE IF NOT EXISTS public.profiles_archive AS 
SELECT * FROM public.profiles;

-- 3. Backup orders
CREATE TABLE IF NOT EXISTS public.orders_archive AS 
SELECT * FROM public.orders;

-- 4. Backup order_items
CREATE TABLE IF NOT EXISTS public.order_items_archive AS 
SELECT * FROM public.order_items;

-- 5. Backup customer_notifications
CREATE TABLE IF NOT EXISTS public.customer_notifications_archive AS 
SELECT * FROM public.customer_notifications;

-- (Optional Verification)
-- You can verify the backups were successful by running:
-- SELECT count(*) FROM public.profiles_archive;
