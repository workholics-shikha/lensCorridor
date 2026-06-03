import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { CartItem, WishlistItem } from '@/lib/types';
import { useAuth } from './AuthContext';

interface CartContextType {
  cartItems: CartItem[];
  wishlistItems: WishlistItem[];
  cartCount: number;
  addToCart: (productId: string, quantity?: number) => Promise<void>;
  removeFromCart: (itemId: string) => Promise<void>;
  updateQuantity: (itemId: string, quantity: number) => Promise<void>;
  toggleWishlist: (productId: string) => Promise<void>;
  isWishlisted: (productId: string) => boolean;
  cartTotal: number;
  refreshCart: () => Promise<void>;
}

const CartContext = createContext<CartContextType>({
  cartItems: [],
  wishlistItems: [],
  cartCount: 0,
  addToCart: async () => {},
  removeFromCart: async () => {},
  updateQuantity: async () => {},
  toggleWishlist: async () => {},
  isWishlisted: () => false,
  cartTotal: 0,
  refreshCart: async () => {},
});

export function CartProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [wishlistItems, setWishlistItems] = useState<WishlistItem[]>([]);

  const fetchCart = async () => {
    if (!user) { setCartItems([]); return; }
    const { data } = await supabase
      .from('cart_items')
      .select('*, products(*, categories(*))')
      .eq('user_id', user.id);
    setCartItems((data as CartItem[]) || []);
  };

  const fetchWishlist = async () => {
    if (!user) { setWishlistItems([]); return; }
    const { data } = await supabase
      .from('wishlists')
      .select('*, products(*, categories(*))')
      .eq('user_id', user.id);
    setWishlistItems((data as WishlistItem[]) || []);
  };

  useEffect(() => {
    fetchCart();
    fetchWishlist();
  }, [user]);

  const addToCart = async (productId: string, quantity = 1) => {
    if (!user) return;
    const existing = cartItems.find(i => i.product_id === productId);
    if (existing) {
      await supabase.from('cart_items').update({ quantity: existing.quantity + quantity }).eq('id', existing.id);
    } else {
      await supabase.from('cart_items').insert({ user_id: user.id, product_id: productId, quantity });
    }
    await fetchCart();
  };

  const removeFromCart = async (itemId: string) => {
    await supabase.from('cart_items').delete().eq('id', itemId);
    await fetchCart();
  };

  const updateQuantity = async (itemId: string, quantity: number) => {
    if (quantity <= 0) {
      await removeFromCart(itemId);
      return;
    }
    await supabase.from('cart_items').update({ quantity }).eq('id', itemId);
    await fetchCart();
  };

  const toggleWishlist = async (productId: string) => {
    if (!user) return;
    const existing = wishlistItems.find(i => i.product_id === productId);
    if (existing) {
      await supabase.from('wishlists').delete().eq('id', existing.id);
    } else {
      await supabase.from('wishlists').insert({ user_id: user.id, product_id: productId });
    }
    await fetchWishlist();
  };

  const isWishlisted = (productId: string) => wishlistItems.some(i => i.product_id === productId);

  const cartTotal = cartItems.reduce((sum, item) => {
    const price = item.products?.discount_price ?? item.products?.price ?? 0;
    return sum + price * item.quantity;
  }, 0);

  const cartCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <CartContext.Provider value={{
      cartItems, wishlistItems, cartCount,
      addToCart, removeFromCart, updateQuantity,
      toggleWishlist, isWishlisted, cartTotal,
      refreshCart: fetchCart,
    }}>
      {children}
    </CartContext.Provider>
  );
}

export const useCart = () => useContext(CartContext);
