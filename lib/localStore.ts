import {
  AppUser,
  AuthSession,
  CartItem,
  Category,
  FrameShape,
  Order,
  OrderItem,
  Prescription,
  Product,
  Profile,
  Salesperson,
  WishlistItem,
} from './types';

const now = () => new Date().toISOString();

const createId = (prefix: string) =>
  `${prefix}_${Math.random().toString(36).slice(2, 10)}${Date.now().toString(36).slice(-4)}`;

const categories: Category[] = [
  { id: 'cat-square', name: 'Square', slug: 'square', icon_name: 'square', sort_order: 1 },
  { id: 'cat-rectangle', name: 'Rectangle', slug: 'rectangle', icon_name: 'rectangle', sort_order: 2 },
  { id: 'cat-aviator', name: 'Aviator', slug: 'aviator', icon_name: 'aviator', sort_order: 3 },
  { id: 'cat-geometric', name: 'Geometric', slug: 'geometric', icon_name: 'geometric', sort_order: 4 },
  { id: 'cat-contact', name: 'Contact Lens', slug: 'contact-lens', icon_name: 'contact-lens', sort_order: 5 },
];

const products: Product[] = [
  {
    id: 'prod-1',
    name: 'AeroFlex Rectangle Pro',
    description: 'Lightweight daily-wear frame with anti-glare ready lenses.',
    price: 3499,
    discount_price: 2499,
    category_id: 'cat-rectangle',
    brand: 'Lens Corridor',
    images: ['https://images.pexels.com/photos/46710/pexels-photo-46710.jpeg?auto=compress&cs=tinysrgb&w=900'],
    frame_material: 'TR90',
    frame_color: 'Matte Black',
    lens_type: 'Blue Light',
    gender: 'unisex',
    in_stock: true,
    rating: 4.7,
    review_count: 184,
    created_at: now(),
  },
  {
    id: 'prod-2',
    name: 'Studio Square Classic',
    description: 'Bold square silhouette for work and weekend styling.',
    price: 2999,
    discount_price: 1999,
    category_id: 'cat-square',
    brand: 'VistaCraft',
    images: ['https://images.pexels.com/photos/701877/pexels-photo-701877.jpeg?auto=compress&cs=tinysrgb&w=900'],
    frame_material: 'Acetate',
    frame_color: 'Tortoise',
    lens_type: 'Single Vision',
    gender: 'unisex',
    in_stock: true,
    rating: 4.6,
    review_count: 132,
    created_at: now(),
  },
  {
    id: 'prod-3',
    name: 'Pilot Gold Aviator',
    description: 'Classic aviator frame with lightweight metal finish.',
    price: 4299,
    discount_price: 3299,
    category_id: 'cat-aviator',
    brand: 'Aether',
    images: ['https://images.pexels.com/photos/1212984/pexels-photo-1212984.jpeg?auto=compress&cs=tinysrgb&w=900'],
    frame_material: 'Metal Alloy',
    frame_color: 'Gold',
    lens_type: 'UV Protected',
    gender: 'men',
    in_stock: true,
    rating: 4.8,
    review_count: 246,
    created_at: now(),
  },
  {
    id: 'prod-4',
    name: 'Facet Geometric Edge',
    description: 'Angular statement frame with a crisp architectural profile.',
    price: 3899,
    discount_price: null,
    category_id: 'cat-geometric',
    brand: 'Prism',
    images: ['https://images.pexels.com/photos/269077/pexels-photo-269077.jpeg?auto=compress&cs=tinysrgb&w=900'],
    frame_material: 'Titanium',
    frame_color: 'Silver',
    lens_type: 'Zero Power',
    gender: 'women',
    in_stock: true,
    rating: 4.4,
    review_count: 89,
    created_at: now(),
  },
  {
    id: 'prod-5',
    name: 'Hydra Soft Contacts',
    description: 'Daily comfort contact lenses for long screen-heavy days.',
    price: 1499,
    discount_price: 1199,
    category_id: 'cat-contact',
    brand: 'ClearDay',
    images: ['https://images.pexels.com/photos/3762879/pexels-photo-3762879.jpeg?auto=compress&cs=tinysrgb&w=900'],
    frame_material: 'Hydrogel',
    frame_color: 'Transparent',
    lens_type: 'Power Lens',
    gender: 'unisex',
    in_stock: true,
    rating: 4.5,
    review_count: 77,
    created_at: now(),
  },
  {
    id: 'prod-6',
    name: 'Metro Slim Rectangle',
    description: 'Minimal profile frame with comfortable flexible temples.',
    price: 2799,
    discount_price: 2199,
    category_id: 'cat-rectangle',
    brand: 'Metro',
    images: ['https://images.pexels.com/photos/46710/pexels-photo-46710.jpeg?auto=compress&cs=tinysrgb&w=900'],
    frame_material: 'Stainless Steel',
    frame_color: 'Gunmetal',
    lens_type: 'Progressive Ready',
    gender: 'unisex',
    in_stock: true,
    rating: 4.3,
    review_count: 54,
    created_at: now(),
  },
];

const salespeople: Salesperson[] = [
  { id: 'sp-1', name: 'Arjun Mehta', employee_id: 'LC102', active: true },
  { id: 'sp-2', name: 'Nisha Rao', employee_id: 'LC118', active: true },
  { id: 'sp-3', name: 'Rohit Sharma', employee_id: 'LC127', active: true },
];

const users = new Map<string, { user: AppUser; password: string }>();
const profiles = new Map<string, Profile>();
const carts = new Map<string, CartItem[]>();
const wishlists = new Map<string, WishlistItem[]>();
const orders = new Map<string, Order[]>();
const prescriptions = new Map<string, Prescription[]>();

let currentUser: AppUser | null = null;

const seedUser: AppUser = { id: 'user-demo', email: 'demo@lenscorridor.com' };
users.set(seedUser.email.toLowerCase(), { user: seedUser, password: 'password123' });
profiles.set(seedUser.id, {
  id: seedUser.id,
  full_name: 'Demo Customer',
  phone: '+91 98765 43210',
  avatar_url: '',
  created_at: now(),
});

orders.set(seedUser.id, [
  {
    id: 'ord_seed_demo_01',
    user_id: seedUser.id,
    status: 'delivered',
    total_amount: 4599,
    shipping_address: {
      name: 'Demo Customer',
      phone: '+91 9876543210',
      line1: '22 Park Street',
      city: 'Kolkata',
      state: 'West Bengal',
      pincode: '700016',
    },
    payment_method: 'card',
    payment_status: 'paid',
    created_at: '2026-05-12T10:30:00.000Z',
    updated_at: '2026-05-16T10:30:00.000Z',
    order_items: [
      {
        id: 'item_seed_demo_01',
        order_id: 'ord_seed_demo_01',
        product_id: 'prod-1',
        quantity: 1,
        unit_price: 2499,
      },
      {
        id: 'item_seed_demo_02',
        order_id: 'ord_seed_demo_01',
        product_id: 'prod-2',
        quantity: 1,
        unit_price: 1999,
      },
    ],
  },
]);

function cloneProduct(product: Product): Product {
  return {
    ...product,
    images: [...product.images],
    categories: categories.find((category) => category.id === product.category_id),
  };
}

function cloneCartItem(item: CartItem): CartItem {
  return {
    ...item,
    products: getProductById(item.product_id) ?? undefined,
  };
}

function cloneWishlistItem(item: WishlistItem): WishlistItem {
  return {
    ...item,
    products: getProductById(item.product_id) ?? undefined,
  };
}

function cloneOrder(order: Order): Order {
  return {
    ...order,
    shipping_address: { ...order.shipping_address },
    order_items: order.order_items?.map((item) => ({
      ...item,
      products: getProductById(item.product_id) ?? undefined,
    })),
  };
}

function normalizePhone(phone: string) {
  return phone.replace(/\D/g, '').slice(-10);
}

export function getSession(): AuthSession | null {
  return currentUser ? { user: currentUser } : null;
}

export function getCurrentUser(): AppUser | null {
  return currentUser;
}

export async function signIn(email: string, password: string): Promise<{ user?: AppUser; error?: string }> {
  const record = users.get(email.trim().toLowerCase());
  if (!record || record.password !== password) {
    return { error: 'Invalid email or password' };
  }

  currentUser = record.user;
  return { user: record.user };
}

export async function signUp(input: {
  fullName: string;
  email: string;
  phone: string;
  password: string;
}): Promise<{ user?: AppUser; error?: string }> {
  const email = input.email.trim().toLowerCase();
  if (users.has(email)) {
    return { error: 'An account with this email already exists' };
  }

  const user: AppUser = { id: createId('user'), email };
  users.set(email, { user, password: input.password });
  profiles.set(user.id, {
    id: user.id,
    full_name: input.fullName,
    phone: input.phone,
    avatar_url: '',
    created_at: now(),
  });
  currentUser = user;
  return { user };
}

export async function signOut(): Promise<void> {
  currentUser = null;
}

export function getSalespeople(): Salesperson[] {
  return salespeople.filter((person) => person.active).map((person) => ({ ...person }));
}

export function getCategories(): Category[] {
  return [...categories].sort((a, b) => a.sort_order - b.sort_order).map((category) => ({ ...category }));
}

export function getFrameShapes(): FrameShape[] {
  return getCategories().map((category) => ({
    id: category.id,
    shape: category.slug,
    title: category.name,
    subtitle: '',
    meta: '',
    code: category.id,
    status: 'Active',
    priority: category.sort_order,
    image: category.image ?? '',
    imageAlt: category.imageAlt ?? category.name,
  }));
}

export function getProducts(): Product[] {
  return products.map(cloneProduct);
}

export function getFeaturedProducts(limit?: number): Product[] {
  const featured = [...products]
    .sort((a, b) => b.review_count - a.review_count)
    .map(cloneProduct);
  return typeof limit === 'number' ? featured.slice(0, limit) : featured;
}

export function getProductById(id: string): Product | null {
  const product = products.find((item) => item.id === id);
  return product ? cloneProduct(product) : null;
}

export function getFilteredProducts(input: {
  categorySlug?: string | null;
  search?: string;
  sortBy?: 'popular' | 'price_asc' | 'price_desc' | 'rating';
}): Product[] {
  const category = input.categorySlug
    ? categories.find((item) => item.slug === input.categorySlug)
    : null;
  const query = input.search?.trim().toLowerCase() ?? '';

  const filtered = products.filter((product) => {
    const matchesCategory = !category || product.category_id === category.id;
    const matchesSearch =
      !query ||
      product.name.toLowerCase().includes(query) ||
      product.brand.toLowerCase().includes(query);

    return matchesCategory && matchesSearch;
  });

  filtered.sort((a, b) => {
    if (input.sortBy === 'price_asc') {
      return (a.discount_price ?? a.price) - (b.discount_price ?? b.price);
    }
    if (input.sortBy === 'price_desc') {
      return (b.discount_price ?? b.price) - (a.discount_price ?? a.price);
    }
    if (input.sortBy === 'rating') {
      return b.rating - a.rating;
    }
    return b.review_count - a.review_count;
  });

  return filtered.map(cloneProduct);
}

export function getProfile(userId: string): Profile | null {
  const profile = profiles.get(userId);
  return profile ? { ...profile } : null;
}

export async function updateProfile(userId: string, input: { full_name: string; phone: string }): Promise<Profile | null> {
  const current = profiles.get(userId);
  if (!current) {
    return null;
  }

  const next: Profile = {
    ...current,
    full_name: input.full_name,
    phone: input.phone,
  };
  profiles.set(userId, next);
  return { ...next };
}

export function getCart(userId: string): CartItem[] {
  return (carts.get(userId) ?? []).map(cloneCartItem);
}

export function getWishlist(userId: string): WishlistItem[] {
  return (wishlists.get(userId) ?? []).map(cloneWishlistItem);
}

export async function addCartItem(userId: string, productId: string, quantity: number): Promise<CartItem[]> {
  const items = [...(carts.get(userId) ?? [])];
  const existing = items.find((item) => item.product_id === productId);

  if (existing) {
    existing.quantity += quantity;
  } else {
    items.push({
      id: createId('cart'),
      user_id: userId,
      product_id: productId,
      quantity,
      created_at: now(),
    });
  }

  carts.set(userId, items);
  return getCart(userId);
}

export async function removeCartItem(userId: string, itemId: string): Promise<CartItem[]> {
  const items = (carts.get(userId) ?? []).filter((item) => item.id !== itemId);
  carts.set(userId, items);
  return getCart(userId);
}

export async function updateCartItemQuantity(userId: string, itemId: string, quantity: number): Promise<CartItem[]> {
  if (quantity <= 0) {
    return removeCartItem(userId, itemId);
  }

  const items = [...(carts.get(userId) ?? [])];
  const existing = items.find((item) => item.id === itemId);
  if (existing) {
    existing.quantity = quantity;
  }

  carts.set(userId, items);
  return getCart(userId);
}

export async function toggleWishlistItem(userId: string, productId: string): Promise<WishlistItem[]> {
  const items = [...(wishlists.get(userId) ?? [])];
  const index = items.findIndex((item) => item.product_id === productId);

  if (index >= 0) {
    items.splice(index, 1);
  } else {
    items.push({
      id: createId('wish'),
      user_id: userId,
      product_id: productId,
      created_at: now(),
    });
  }

  wishlists.set(userId, items);
  return getWishlist(userId);
}

export async function createOrder(input: {
  userId: string;
  totalAmount: number;
  shippingAddress: Order['shipping_address'];
  paymentMethod: string;
  paymentStatus: string;
  items: CartItem[];
}): Promise<Order> {
  const orderId = createId('ord');
  const timestamp = now();
  const orderItems: OrderItem[] = input.items.map((item) => ({
    id: createId('item'),
    order_id: orderId,
    product_id: item.product_id,
    quantity: item.quantity,
    unit_price: item.products?.discount_price ?? item.products?.price ?? 0,
    products: item.products,
  }));

  const order: Order = {
    id: orderId,
    user_id: input.userId,
    status: 'confirmed',
    total_amount: input.totalAmount,
    shipping_address: { ...input.shippingAddress },
    payment_method: input.paymentMethod,
    payment_status: input.paymentStatus,
    created_at: timestamp,
    updated_at: timestamp,
    order_items: orderItems,
  };

  const existing = orders.get(input.userId) ?? [];
  orders.set(input.userId, [order, ...existing]);
  carts.set(input.userId, []);

  return cloneOrder(order);
}

export function getOrders(userId: string): Order[] {
  return (orders.get(userId) ?? []).map(cloneOrder);
}

export function findLatestCustomerByPhone(phone: string): {
  name: string;
  phone: string;
  line1?: string;
  city?: string;
  state?: string;
  pincode?: string;
  lastOrderId: string;
  lastOrderDate: string;
} | null {
  const normalizedPhone = normalizePhone(phone);

  if (!normalizedPhone) {
    return null;
  }

  const matches = [...orders.values()]
    .flat()
    .filter((order) => normalizePhone(order.shipping_address.phone ?? '') === normalizedPhone)
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  const latestOrder = matches[0];
  if (!latestOrder) {
    return null;
  }

  return {
    name: latestOrder.shipping_address.name || 'Customer',
    phone: latestOrder.shipping_address.phone || phone,
    line1: latestOrder.shipping_address.line1,
    city: latestOrder.shipping_address.city,
    state: latestOrder.shipping_address.state,
    pincode: latestOrder.shipping_address.pincode,
    lastOrderId: latestOrder.id,
    lastOrderDate: latestOrder.created_at,
  };
}

export async function savePrescription(
  userId: string,
  input: {
    order_id?: string;
    file_url?: string;
    notes: string;
    right_eye_sph?: number | null;
    right_eye_cyl?: number | null;
    right_eye_axis?: number | null;
    left_eye_sph?: number | null;
    left_eye_cyl?: number | null;
    left_eye_axis?: number | null;
  }
): Promise<Prescription> {
  const prescription: Prescription = {
    id: createId('rx'),
    user_id: userId,
    file_url: input.file_url ?? '',
    notes: input.notes,
    order_id: input.order_id,
    right_eye_sph: input.right_eye_sph ?? undefined,
    right_eye_cyl: input.right_eye_cyl ?? undefined,
    right_eye_axis: input.right_eye_axis ?? undefined,
    left_eye_sph: input.left_eye_sph ?? undefined,
    left_eye_cyl: input.left_eye_cyl ?? undefined,
    left_eye_axis: input.left_eye_axis ?? undefined,
    created_at: now(),
  };

  const existing = prescriptions.get(userId) ?? [];
  prescriptions.set(userId, [prescription, ...existing]);
  return { ...prescription };
}
