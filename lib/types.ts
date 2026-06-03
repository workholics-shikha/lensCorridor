export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export interface Profile {
  id: string;
  full_name: string;
  phone: string;
  avatar_url: string;
  created_at: string;
}

export interface Salesperson {
  id: string;
  name: string;
  employee_id: string;
  active: boolean;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  icon_name: string;
  sort_order: number;
}

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  discount_price: number | null;
  category_id: string;
  brand: string;
  images: string[];
  frame_material: string;
  frame_color: string;
  lens_type: string;
  gender: string;
  in_stock: boolean;
  rating: number;
  review_count: number;
  created_at: string;
  categories?: Category;
}

export interface CartItem {
  id: string;
  user_id: string;
  product_id: string;
  quantity: number;
  created_at: string;
  products?: Product;
}

export interface WishlistItem {
  id: string;
  user_id: string;
  product_id: string;
  created_at: string;
  products?: Product;
}

export interface Order {
  id: string;
  user_id: string;
  status: 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  total_amount: number;
  shipping_address: {
    name?: string;
    phone?: string;
    line1?: string;
    city?: string;
    state?: string;
    pincode?: string;
  };
  payment_method: string;
  payment_status: string;
  created_at: string;
  updated_at: string;
  order_items?: OrderItem[];
}

export interface OrderItem {
  id: string;
  order_id: string;
  product_id: string;
  quantity: number;
  unit_price: number;
  products?: Product;
}

export interface Prescription {
  id: string;
  user_id: string;
  order_id?: string;
  file_url: string;
  notes: string;
  right_eye_sph?: number;
  right_eye_cyl?: number;
  right_eye_axis?: number;
  left_eye_sph?: number;
  left_eye_cyl?: number;
  left_eye_axis?: number;
  created_at: string;
}
