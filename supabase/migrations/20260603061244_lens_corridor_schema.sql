/*
  # Lens Corridor - Complete Database Schema

  ## Overview
  Full schema for the Lens Corridor eyewear shopping platform.

  ## New Tables
  1. `profiles` - User profile data linked to auth.users
     - id, full_name, phone, avatar_url, created_at
  2. `salespeople` - Salesperson records for splash screen selection
     - id, name, employee_id, active
  3. `categories` - Frame shape categories (Square, Rectangle, Aviator, etc.)
     - id, name, slug, icon_name, sort_order
  4. `products` - Eyewear products
     - id, name, description, price, discount_price, category_id, brand, images, frame_material, frame_color, lens_type, gender, in_stock
  5. `cart_items` - User shopping cart
     - id, user_id, product_id, quantity
  6. `wishlists` - User wishlist
     - id, user_id, product_id
  7. `orders` - Customer orders
     - id, user_id, status, total_amount, shipping_address, payment_method
  8. `order_items` - Items within an order
     - id, order_id, product_id, quantity, unit_price
  9. `prescriptions` - Uploaded prescriptions per order or user
     - id, user_id, order_id, file_url, notes, right_eye_sph, right_eye_cyl, left_eye_sph, left_eye_cyl

  ## Security
  - RLS enabled on all tables
  - Users can only access their own data
*/

-- Profiles
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text DEFAULT '',
  phone text DEFAULT '',
  avatar_url text DEFAULT '',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Salespeople
CREATE TABLE IF NOT EXISTS salespeople (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  employee_id text UNIQUE NOT NULL,
  active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE salespeople ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active salespeople"
  ON salespeople FOR SELECT
  USING (active = true);

-- Seed salespeople
INSERT INTO salespeople (name, employee_id) VALUES
  ('Raj Kumar', 'EMP001'),
  ('Priya Sharma', 'EMP002'),
  ('Amit Patel', 'EMP003'),
  ('Sunita Singh', 'EMP004'),
  ('Vikram Nair', 'EMP005')
ON CONFLICT (employee_id) DO NOTHING;

-- Categories
CREATE TABLE IF NOT EXISTS categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text UNIQUE NOT NULL,
  icon_name text DEFAULT '',
  sort_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view categories"
  ON categories FOR SELECT
  USING (true);

INSERT INTO categories (name, slug, icon_name, sort_order) VALUES
  ('Square', 'square', 'square', 1),
  ('Rectangle', 'rectangle', 'rectangle-horizontal', 2),
  ('Aviator', 'aviator', 'triangle', 3),
  ('Geometric', 'geometric', 'hexagon', 4),
  ('Contact Lens', 'contact-lens', 'circle', 5),
  ('Round', 'round', 'circle', 6),
  ('Wayfarer', 'wayfarer', 'square', 7)
ON CONFLICT (slug) DO NOTHING;

-- Products
CREATE TABLE IF NOT EXISTS products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text DEFAULT '',
  price numeric(10,2) NOT NULL DEFAULT 0,
  discount_price numeric(10,2),
  category_id uuid REFERENCES categories(id),
  brand text DEFAULT '',
  images text[] DEFAULT '{}',
  frame_material text DEFAULT '',
  frame_color text DEFAULT '',
  lens_type text DEFAULT '',
  gender text DEFAULT 'unisex',
  in_stock boolean DEFAULT true,
  rating numeric(3,2) DEFAULT 4.0,
  review_count integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view products"
  ON products FOR SELECT
  USING (true);

-- Cart Items
CREATE TABLE IF NOT EXISTS cart_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  product_id uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  quantity integer NOT NULL DEFAULT 1,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, product_id)
);

ALTER TABLE cart_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own cart"
  ON cart_items FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert into cart"
  ON cart_items FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own cart"
  ON cart_items FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete from cart"
  ON cart_items FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Wishlists
CREATE TABLE IF NOT EXISTS wishlists (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  product_id uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, product_id)
);

ALTER TABLE wishlists ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own wishlist"
  ON wishlists FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert into wishlist"
  ON wishlists FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete from wishlist"
  ON wishlists FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Orders
CREATE TABLE IF NOT EXISTS orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'pending',
  total_amount numeric(10,2) NOT NULL DEFAULT 0,
  shipping_address jsonb DEFAULT '{}',
  payment_method text DEFAULT 'cod',
  payment_status text DEFAULT 'pending',
  salesperson_id uuid REFERENCES salespeople(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own orders"
  ON orders FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own orders"
  ON orders FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own orders"
  ON orders FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Order Items
CREATE TABLE IF NOT EXISTS order_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id uuid NOT NULL REFERENCES products(id),
  quantity integer NOT NULL DEFAULT 1,
  unit_price numeric(10,2) NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own order items"
  ON order_items FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM orders
      WHERE orders.id = order_items.order_id
      AND orders.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert order items"
  ON order_items FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM orders
      WHERE orders.id = order_items.order_id
      AND orders.user_id = auth.uid()
    )
  );

-- Prescriptions
CREATE TABLE IF NOT EXISTS prescriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  order_id uuid REFERENCES orders(id),
  file_url text DEFAULT '',
  notes text DEFAULT '',
  right_eye_sph numeric(5,2),
  right_eye_cyl numeric(5,2),
  right_eye_axis integer,
  left_eye_sph numeric(5,2),
  left_eye_cyl numeric(5,2),
  left_eye_axis integer,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE prescriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own prescriptions"
  ON prescriptions FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert prescriptions"
  ON prescriptions FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own prescriptions"
  ON prescriptions FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
