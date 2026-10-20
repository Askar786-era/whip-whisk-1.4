-- ============================================================================
-- WHIP & WHISK BAKE SALE - SUPABASE DATABASE SCHEMA
-- Copy and paste this script directly into your Supabase project's SQL Editor
-- (Supabase Dashboard → Project → SQL Editor → New Query → Run)
-- ============================================================================

-- 1. Orders Table
CREATE TABLE IF NOT EXISTS public.orders (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    order_id TEXT UNIQUE NOT NULL,
    customer_name TEXT NOT NULL,
    phone TEXT NOT NULL,
    email TEXT DEFAULT '',
    address TEXT NOT NULL,
    delivery_date TEXT DEFAULT '',
    payment_method TEXT DEFAULT 'COD',
    items JSONB NOT NULL DEFAULT '[]'::jsonb,
    subtotal NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    delivery_fee NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    total NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    status TEXT NOT NULL DEFAULT 'Pending',
    cause TEXT DEFAULT '',
    notes TEXT DEFAULT '',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for speedy lookups
CREATE INDEX IF NOT EXISTS idx_orders_order_id ON public.orders(order_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON public.orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON public.orders(created_at DESC);

-- 2. Products Catalog Table
CREATE TABLE IF NOT EXISTS public.products (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    price NUMERIC(10, 2) NOT NULL,
    img TEXT DEFAULT '',
    "desc" TEXT DEFAULT '',
    category TEXT DEFAULT 'delight',
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Inquiries Table (Customer Contact Messages)
CREATE TABLE IF NOT EXISTS public.inquiries (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    message TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. Enable Row Level Security (RLS)
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inquiries ENABLE ROW LEVEL SECURITY;

-- 5. RLS Policies (Allow web client and server to insert & read)
-- Orders
DROP POLICY IF EXISTS "Public can insert orders" ON public.orders;
CREATE POLICY "Public can insert orders" ON public.orders
    FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Public can select orders" ON public.orders;
CREATE POLICY "Public can select orders" ON public.orders
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public can update orders" ON public.orders;
CREATE POLICY "Public can update orders" ON public.orders
    FOR UPDATE USING (true);

-- Products
DROP POLICY IF EXISTS "Public can read products" ON public.products;
CREATE POLICY "Public can read products" ON public.products
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow manage products" ON public.products;
CREATE POLICY "Allow manage products" ON public.products
    FOR ALL USING (true);

-- Inquiries
DROP POLICY IF EXISTS "Public can insert inquiries" ON public.inquiries;
CREATE POLICY "Public can insert inquiries" ON public.inquiries
    FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Public can read inquiries" ON public.inquiries;
CREATE POLICY "Public can read inquiries" ON public.inquiries
    FOR SELECT USING (true);

-- 6. Initial Product Catalog Seed Data
INSERT INTO public.products (id, name, price, img, "desc", category)
VALUES
    ('cookie-tin', 'Yummy Soft Cookie Tin', 14.00, 'assets/images/cookie_tin.jpg', 'Chocolate chip, oatmeal raisin & golden butter tin favorites', 'box'),
    ('bento-cake', 'Mini Celebration Bento Cake', 18.00, 'assets/images/bento_cake.jpg', 'Mini bento chocolate cakes, rainbow sprinkles & white chips', 'arch'),
    ('brownie-pops', 'Heart Brownie Popsicles (Set of 3)', 12.00, 'assets/images/heart_brownie_pops.jpg', 'Ribbon-tied brownie popsicles, sprinkles & chocolate skewers', 'circle'),
    ('fudge-box', 'Box of 4 Glazed Fudge Brownies', 16.00, 'assets/images/fudge_brownies_box.jpg', 'Dense chocolate fudge brownies with shiny dark cocoa glaze', 'delight'),
    ('brownie-skewers', 'Dipped Brownie Bites Skewers (Pack)', 10.00, 'assets/images/brownie_skewers.jpg', 'Bite-sized fudge brownies on bamboo skewers drizzled with white icing', 'delight')
ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    price = EXCLUDED.price,
    img = EXCLUDED.img,
    "desc" = EXCLUDED."desc",
    category = EXCLUDED.category;
