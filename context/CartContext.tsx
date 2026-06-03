import React, { createContext, useContext, useEffect, useState } from 'react';
import { CartItem, WishlistItem } from '@/lib/types';
import { useAuth } from './AuthContext';
import {
  addCartItem,
  getCart,
  getWishlist,
  removeCartItem as storeRemoveCartItem,
  toggleWishlistItem,
  updateCartItemQuantity,
} from '@/lib/localStore';

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
    setCartItems(getCart(user.id));
  };

  const fetchWishlist = async () => {
    if (!user) { setWishlistItems([]); return; }
    setWishlistItems(getWishlist(user.id));
  };

  useEffect(() => {
    fetchCart();
    fetchWishlist();
  }, [user]);

  const addToCart = async (productId: string, quantity = 1) => {
    if (!user) return;
    setCartItems(await addCartItem(user.id, productId, quantity));
  };

  const removeFromCart = async (itemId: string) => {
    if (!user) return;
    setCartItems(await storeRemoveCartItem(user.id, itemId));
  };

  const updateQuantity = async (itemId: string, quantity: number) => {
    if (!user) return;
    if (quantity <= 0) {
      await removeFromCart(itemId);
      return;
    }
    setCartItems(await updateCartItemQuantity(user.id, itemId, quantity));
  };

  const toggleWishlist = async (productId: string) => {
    if (!user) return;
    setWishlistItems(await toggleWishlistItem(user.id, productId));
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
