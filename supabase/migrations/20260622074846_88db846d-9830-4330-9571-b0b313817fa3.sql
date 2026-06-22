
-- ENUMS
CREATE TYPE public.app_role AS ENUM ('customer', 'admin');
CREATE TYPE public.product_status AS ENUM ('active', 'inactive');
CREATE TYPE public.order_status AS ENUM ('menunggu_pembayaran','menunggu_verifikasi','diproses','dikemas','dikirim','dalam_perjalanan','selesai','ditolak','dibatalkan');
CREATE TYPE public.payment_status AS ENUM ('pending','approved','rejected');

-- UPDATED_AT helper
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$ BEGIN NEW.updated_at = now(); RETURN NEW; END; $$ LANGUAGE plpgsql SET search_path = public;

-- PROFILES
CREATE TABLE public.profiles (
  id UUID NOT NULL PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  fullname TEXT NOT NULL DEFAULT '',
  email TEXT,
  phone TEXT,
  avatar TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "profiles_select_own" ON public.profiles FOR SELECT TO authenticated USING (auth.uid() = id);
CREATE POLICY "profiles_update_own" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);
CREATE POLICY "profiles_insert_own" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);
CREATE TRIGGER trg_profiles_updated BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- USER ROLES
CREATE TABLE public.user_roles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role);
$$;

CREATE POLICY "user_roles_select_own" ON public.user_roles FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "user_roles_admin_all" ON public.user_roles FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

-- handle_new_user trigger: create profile + default customer role
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, fullname, email, phone)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'fullname',''), NEW.email, NEW.raw_user_meta_data->>'phone');
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'customer') ON CONFLICT DO NOTHING;
  RETURN NEW;
END; $$;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- CATEGORIES
CREATE TABLE public.product_categories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  icon TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.product_categories TO anon, authenticated;
GRANT ALL ON public.product_categories TO service_role;
ALTER TABLE public.product_categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "categories_public_read" ON public.product_categories FOR SELECT USING (true);
CREATE POLICY "categories_admin_write" ON public.product_categories FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

-- PRODUCTS
CREATE TABLE public.products (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  sku TEXT,
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT,
  category_id UUID REFERENCES public.product_categories(id) ON DELETE SET NULL,
  brand TEXT,
  price NUMERIC(12,2) NOT NULL DEFAULT 0,
  stock INTEGER NOT NULL DEFAULT 0,
  weight NUMERIC(10,2) NOT NULL DEFAULT 0,
  images TEXT[] NOT NULL DEFAULT '{}',
  status product_status NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.products TO anon, authenticated;
GRANT ALL ON public.products TO service_role;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
CREATE POLICY "products_public_read" ON public.products FOR SELECT USING (true);
CREATE POLICY "products_admin_write" ON public.products FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE TRIGGER trg_products_updated BEFORE UPDATE ON public.products FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- CARTS
CREATE TABLE public.carts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.carts TO authenticated;
GRANT ALL ON public.carts TO service_role;
ALTER TABLE public.carts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "carts_own" ON public.carts FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- CART ITEMS
CREATE TABLE public.cart_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  cart_id UUID NOT NULL REFERENCES public.carts(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  qty INTEGER NOT NULL DEFAULT 1,
  price NUMERIC(12,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(cart_id, product_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.cart_items TO authenticated;
GRANT ALL ON public.cart_items TO service_role;
ALTER TABLE public.cart_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "cart_items_own" ON public.cart_items FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.carts c WHERE c.id = cart_id AND c.user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.carts c WHERE c.id = cart_id AND c.user_id = auth.uid()));

-- SHIPPING ADDRESSES
CREATE TABLE public.shipping_addresses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  recipient_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  province TEXT NOT NULL,
  city TEXT NOT NULL,
  district TEXT,
  village TEXT,
  postal_code TEXT,
  full_address TEXT NOT NULL,
  is_default BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.shipping_addresses TO authenticated;
GRANT ALL ON public.shipping_addresses TO service_role;
ALTER TABLE public.shipping_addresses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "address_own" ON public.shipping_addresses FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- ORDERS
CREATE TABLE public.orders (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  order_number TEXT NOT NULL UNIQUE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  recipient_name TEXT NOT NULL,
  recipient_phone TEXT NOT NULL,
  shipping_address TEXT NOT NULL,
  province TEXT, city TEXT, district TEXT, village TEXT, postal_code TEXT,
  subtotal NUMERIC(12,2) NOT NULL DEFAULT 0,
  shipping_cost NUMERIC(12,2) NOT NULL DEFAULT 0,
  total NUMERIC(12,2) NOT NULL DEFAULT 0,
  payment_method TEXT NOT NULL,
  courier TEXT NOT NULL,
  tracking_number TEXT,
  status order_status NOT NULL DEFAULT 'menunggu_pembayaran',
  reject_reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.orders TO authenticated;
GRANT ALL ON public.orders TO service_role;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "orders_select_own" ON public.orders FOR SELECT TO authenticated USING (auth.uid() = user_id OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "orders_insert_own" ON public.orders FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "orders_admin_update" ON public.orders FOR UPDATE TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE TRIGGER trg_orders_updated BEFORE UPDATE ON public.orders FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ORDER ITEMS
CREATE TABLE public.order_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
  product_name TEXT NOT NULL,
  qty INTEGER NOT NULL DEFAULT 1,
  price NUMERIC(12,2) NOT NULL DEFAULT 0
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.order_items TO authenticated;
GRANT ALL ON public.order_items TO service_role;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "order_items_select" ON public.order_items FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM public.orders o WHERE o.id = order_id AND (o.user_id = auth.uid() OR public.has_role(auth.uid(),'admin'))));
CREATE POLICY "order_items_insert" ON public.order_items FOR INSERT TO authenticated WITH CHECK (EXISTS (SELECT 1 FROM public.orders o WHERE o.id = order_id AND o.user_id = auth.uid()));

-- PAYMENT CONFIRMATIONS
CREATE TABLE public.payment_confirmations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  transfer_bank TEXT NOT NULL,
  sender_name TEXT NOT NULL,
  amount NUMERIC(12,2) NOT NULL DEFAULT 0,
  proof_image TEXT,
  status payment_status NOT NULL DEFAULT 'pending',
  uploaded_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.payment_confirmations TO authenticated;
GRANT ALL ON public.payment_confirmations TO service_role;
ALTER TABLE public.payment_confirmations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "payment_select" ON public.payment_confirmations FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM public.orders o WHERE o.id = order_id AND (o.user_id = auth.uid() OR public.has_role(auth.uid(),'admin'))));
CREATE POLICY "payment_insert_own" ON public.payment_confirmations FOR INSERT TO authenticated WITH CHECK (EXISTS (SELECT 1 FROM public.orders o WHERE o.id = order_id AND o.user_id = auth.uid()));
CREATE POLICY "payment_admin_update" ON public.payment_confirmations FOR UPDATE TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

-- ORDER STATUS HISTORY
CREATE TABLE public.order_status_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  status order_status NOT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.order_status_history TO authenticated;
GRANT ALL ON public.order_status_history TO service_role;
ALTER TABLE public.order_status_history ENABLE ROW LEVEL SECURITY;
CREATE POLICY "status_history_select" ON public.order_status_history FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM public.orders o WHERE o.id = order_id AND (o.user_id = auth.uid() OR public.has_role(auth.uid(),'admin'))));
CREATE POLICY "status_history_insert" ON public.order_status_history FOR INSERT TO authenticated WITH CHECK (EXISTS (SELECT 1 FROM public.orders o WHERE o.id = order_id AND (o.user_id = auth.uid() OR public.has_role(auth.uid(),'admin'))));

-- REVIEWS
CREATE TABLE public.reviews (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL DEFAULT 5,
  comment TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.reviews TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.reviews TO authenticated;
GRANT ALL ON public.reviews TO service_role;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
CREATE POLICY "reviews_public_read" ON public.reviews FOR SELECT USING (true);
CREATE POLICY "reviews_own_write" ON public.reviews FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- NOTIFICATIONS
CREATE TABLE public.notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  body TEXT,
  is_read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.notifications TO authenticated;
GRANT ALL ON public.notifications TO service_role;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "notifications_own" ON public.notifications FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- SITE SETTINGS (single row config: bank accounts, contact)
CREATE TABLE public.site_settings (
  id INTEGER PRIMARY KEY DEFAULT 1,
  data JSONB NOT NULL DEFAULT '{}',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT single_row CHECK (id = 1)
);
GRANT SELECT ON public.site_settings TO anon, authenticated;
GRANT ALL ON public.site_settings TO service_role;
ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "settings_public_read" ON public.site_settings FOR SELECT USING (true);
CREATE POLICY "settings_admin_write" ON public.site_settings FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

-- CMS: testimonials, faqs, articles
CREATE TABLE public.testimonials (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL, role TEXT, content TEXT NOT NULL, avatar TEXT, rating INTEGER DEFAULT 5,
  is_active BOOLEAN NOT NULL DEFAULT true, created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.testimonials TO anon, authenticated;
GRANT ALL ON public.testimonials TO service_role;
ALTER TABLE public.testimonials ENABLE ROW LEVEL SECURITY;
CREATE POLICY "testi_public_read" ON public.testimonials FOR SELECT USING (true);
CREATE POLICY "testi_admin_write" ON public.testimonials FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

CREATE TABLE public.faqs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  question TEXT NOT NULL, answer TEXT NOT NULL, sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true, created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.faqs TO anon, authenticated;
GRANT ALL ON public.faqs TO service_role;
ALTER TABLE public.faqs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "faq_public_read" ON public.faqs FOR SELECT USING (true);
CREATE POLICY "faq_admin_write" ON public.faqs FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

CREATE TABLE public.articles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE, title TEXT NOT NULL, excerpt TEXT, content TEXT, cover_image TEXT,
  is_published BOOLEAN NOT NULL DEFAULT false, created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.articles TO anon, authenticated;
GRANT ALL ON public.articles TO service_role;
ALTER TABLE public.articles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "article_public_read" ON public.articles FOR SELECT USING (is_published = true);
CREATE POLICY "article_admin_all" ON public.articles FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

CREATE TABLE public.banners (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT, subtitle TEXT, image TEXT, link TEXT, sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true, created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.banners TO anon, authenticated;
GRANT ALL ON public.banners TO service_role;
ALTER TABLE public.banners ENABLE ROW LEVEL SECURITY;
CREATE POLICY "banner_public_read" ON public.banners FOR SELECT USING (true);
CREATE POLICY "banner_admin_write" ON public.banners FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

-- ORDER NUMBER GENERATOR (daily sequence)
CREATE SEQUENCE IF NOT EXISTS public.order_seq;
CREATE OR REPLACE FUNCTION public.generate_order_number()
RETURNS TEXT LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE seq_val BIGINT; BEGIN
  seq_val := nextval('public.order_seq');
  RETURN 'TH-' || to_char(now(),'YYYYMMDD') || '-' || lpad((seq_val % 10000)::text, 4, '0');
END; $$;

-- Seed default site settings
INSERT INTO public.site_settings (id, data) VALUES (1, '{
  "store_name":"TukangHub",
  "contact_phone":"0800-0000-0000",
  "contact_email":"halo@tukanghub.id",
  "banks":[
    {"bank":"BCA","number":"0000000000","holder":"PT TukangHub Indonesia"},
    {"bank":"Mandiri","number":"0000000000","holder":"PT TukangHub Indonesia"},
    {"bank":"BRI","number":"0000000000","holder":"PT TukangHub Indonesia"},
    {"bank":"BNI","number":"0000000000","holder":"PT TukangHub Indonesia"}
  ]
}'::jsonb);
