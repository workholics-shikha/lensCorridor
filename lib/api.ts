import Constants from 'expo-constants';
import { getCategories, getFrameShapes, getSalespeople } from './localStore';
import { Category, FrameShape, Salesperson } from './types';

export interface StoreOption {
  id: string;
  name: string;
  code: string;
}

interface SalesmanApiResponse {
  id: string;
  salesmanId: string;
  name: string;
  status?: string;
  store?: {
    id: string;
    name: string;
    code: string;
  } | null;
}

interface FrameShapeApiResponse {
  id?: string;
  _id?: string;
  shape: string;
  title?: string;
  subtitle?: string;
  meta?: string;
  code?: string;
  status?: string;
  priority?: number;
  image?: string;
  imageAlt?: string;
}

interface PowerTypeApiItem {
  _id?: string;
  id?: string;
  name: string;
  tag?: string | null;
  description?: string;
  image?: string;
  icon?: string;
  priority?: number;
  status?: string;
}

export interface PowerTypeOption {
  id: string;
  name: string;
  tag: string;
  description: string;
  image: string;
  priority: number;
}

export interface LensCategoryOption {
  id: string;
  categoryName: string;
  displayLabel: string;
  description: string;
  linkedPricingBand: string;
  usageAndMapping: string;
  priority: number;
  powerTypeIds: string[];
}

export interface OrderPlacementPayload {
  orderNumber?: string;
  customer: {
    name: string;
    phone: string;
    billingAddress: string;
  };
  frame: {
    selectedShape: string;
    price: number;
    images: Array<{
      id: string;
      image?: string;
      shape?: string;
    }>;
  };
  lensSelection: {
    lensType: string;
    lensCategory: string;
    lensCategoryId: string;
    lensPrice: number;
    coating: string;
    powerType: string;
    powerTypeId: string;
    image: string;
  };
  lensDetails: Array<{
    id: string;
    label: string;
    eye: 'left' | 'right';
    sph: string;
    cyl: string;
    axis: string;
    add: string;
  }>;
  billing: {
    discount: number;
    paymentMode: 'Online' | 'Card' | 'Cash';
    subtotal: number;
    totalPayable: number;
    partialPaymentEnabled?: boolean;
    paidAmount?: number;
    remainingAmount?: number;
  };
  meta?: {
    source?: string;
    store?: {
      id: string;
      name: string;
      code: string;
    };
    salesperson?: {
      id: string;
      name: string;
      employeeId: string;
    };
  };
}

export interface OrderPlacementResponse {
  id: string;
  orderNumber: string;
  invoiceDate: string;
  createdAt: string;
}

export interface OrderPlacementRecord extends OrderPlacementResponse {
  customer: {
    name: string;
    phone: string;
    billingAddress: string;
  };
  frame: {
    selectedShape: string;
    price: number;
    images: Array<{
      id: string;
      image?: string;
      shape?: string;
    }>;
  };
  lensSelection: {
    lensType: string;
    lensCategory: string;
    lensCategoryId: string;
    lensPrice: number;
    coating: string;
    powerType: string;
    powerTypeId: string;
    image: string;
  };
  lensDetails: Array<{
    id: string;
    label: string;
    eye: 'left' | 'right';
    sph: string;
    cyl: string;
    axis: string;
    add: string;
  }>;
  billing: {
    discount: number;
    paymentMode: 'Online' | 'Card' | 'Cash';
    subtotal: number;
    totalPayable: number;
    partialPaymentEnabled?: boolean;
    paidAmount?: number;
    remainingAmount?: number;
  };
  meta?: {
    source?: string;
    store?: {
      id: string;
      name: string;
      code: string;
    };
    salesperson?: {
      id: string;
      name: string;
      employeeId: string;
    };
  };
  status: string;
  updatedAt: string;
}

function getApiBaseUrl() {
  const configuredBaseUrl =
    process.env.EXPO_PUBLIC_API_BASE_URL?.trim();

  if (configuredBaseUrl) {
    return configuredBaseUrl.replace(/\/$/, '');
  }

  const isExpoDevelopmentHost =
    Constants.executionEnvironment === 'storeClient';

  const expoHostUri = Constants.expoConfig?.hostUri?.trim();

  if (isExpoDevelopmentHost && expoHostUri) {
    return 'https://lenscorridor-api.onrender.com';
  }

  return 'https://lenscorridor-api.onrender.com';
}

function resolveApiAssetUrl(path?: string) {
  if (!path) {
    return '';
  }

  if (/^https?:\/\//i.test(path)) {
    return path;
  }

  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return `${getApiBaseUrl()}${normalizedPath}`;
}

export async function fetchSalespeople(storeId?: string): Promise<Salesperson[]> {
  try {
    const url = new URL(`${getApiBaseUrl()}/api/salesmen`);
    if (storeId) {
      url.searchParams.set('storeId', storeId);
    }

    const response = await fetch(url.toString());
    if (!response.ok) {
      throw new Error(`Salesman API returned ${response.status}`);
    }

    const data = (await response.json()) as SalesmanApiResponse[];
    return data
      .filter((item) => (item.status ?? 'Active') === 'Active')
      .map((item) => ({
        id: item.id,
        name: item.name,
        employee_id: item.salesmanId,
        active: true,
      }));
  } catch (_error) {
    return getSalespeople();
  }
}

export async function fetchStores(): Promise<StoreOption[]> {
  try {
    const response = await fetch(`${getApiBaseUrl()}/api/salesmen`);
    if (!response.ok) {
      throw new Error(`Salesman API returned ${response.status}`);
    }

    const data = (await response.json()) as SalesmanApiResponse[];
    const uniqueStores = new Map<string, StoreOption>();

    for (const item of data) {
      if (!item.store?.id) {
        continue;
      }

      uniqueStores.set(item.store.id, {
        id: item.store.id,
        name: item.store.name,
        code: item.store.code,
      });
    }

    return [...uniqueStores.values()].sort((a, b) => a.name.localeCompare(b.name));
  } catch (_error) {
    return [];
  }
}

export async function fetchFrameShapes(): Promise<FrameShape[]> {
  try {
    const response = await fetch(`${getApiBaseUrl()}/api/frame-shapes`);
    if (!response.ok) {
      throw new Error(`Frame shape API returned ${response.status}`);
    }

    const data = (await response.json()) as FrameShapeApiResponse[];
    return data
      .filter((item) => item.shape)
      .sort((a, b) => (a.priority ?? 999) - (b.priority ?? 999))
      .map((item, index) => ({
        id: item.id ?? item._id ?? `frame-shape-${index}`,
        shape: item.shape,
        title: item.title?.trim() || item.shape,
        subtitle: item.subtitle ?? '',
        meta: item.meta ?? '',
        code: item.code ?? '',
        status: item.status ?? 'Active',
        priority: item.priority ?? index + 1,
        image: resolveApiAssetUrl(item.image),
        imageAlt: item.imageAlt ?? (item.title?.trim() || item.shape),
      }));
  } catch (_error) {
    return getFrameShapes();
  }
}

export async function fetchFrameShapeCategories(): Promise<Category[]> {
  try {
    const frameShapes = await fetchFrameShapes();
    return frameShapes.map((shape, index) => ({
      id: shape.id,
      name: shape.title,
      slug: shape.shape,
      icon_name: shape.shape,
      sort_order: shape.priority ?? index + 1,
      image: shape.image,
      imageAlt: shape.imageAlt,
    }));
  } catch (_error) {
    return getCategories();
  }
}

const POWER_TYPE_FALLBACK: PowerTypeOption[] = [
  {
    id: 'power-with-power',
    name: 'With Power',
    tag: 'Most common',
    description: 'Positive, Negative or Cylindrical',
    image: 'power-type-with-power',
    priority: 1,
  },
  {
    id: 'power-zero-power',
    name: 'Zero Power',
    tag: 'BLU Screen lenses',
    description: 'Blue light block for screen protection',
    image: 'power-type-zero-power',
    priority: 2,
  },
  {
    id: 'power-reading-power',
    name: 'Reading Power',
    tag: '',
    description: 'With power for near vision only',
    image: 'power-type-reading-power',
    priority: 3,
  },
  {
    id: 'power-progressive-bifocals',
    name: 'Progressive/Bifocals',
    tag: '',
    description: 'Two powers in one eye',
    image: 'power-type-progressive-bifocals',
    priority: 4,
  },
  {
    id: 'power-frame-only',
    name: 'Frame Only',
    tag: '',
    description: 'With no lenses',
    image: 'power-type-frame-only',
    priority: 5,
  },
];

export async function fetchPowerTypes(): Promise<PowerTypeOption[]> {
  try {
    const response = await fetch(`${getApiBaseUrl()}/api/power-types`);
    if (!response.ok) {
      throw new Error(`Power types API returned ${response.status}`);
    }

    const payload = (await response.json()) as { data?: PowerTypeApiItem[] };
    const items = payload.data ?? [];

    return items
      .filter((item) => item.name)
      .sort((a, b) => (a.priority ?? 999) - (b.priority ?? 999))
      .map((item, index) => ({
        id: item.id ?? item._id ?? `power-type-${index}`,
        name: item.name,
        tag: item.tag ?? '',
        description: item.description ?? '',
        image: item.image || item.icon || '',
        priority: item.priority ?? index + 1,
      }));
  } catch (_error) {
    return POWER_TYPE_FALLBACK;
  }
}

const LENS_CATEGORY_FALLBACK: LensCategoryOption[] = [
  {
    id: 'lens-category-with-power-anti-glare-premium',
    categoryName: 'Anti-Glare Premium',
    displayLabel: 'Anti-Glare Premium',
    description: 'Double side anti-glare lens with scratch resistant coating',
    linkedPricingBand: 'Band-A',
    usageAndMapping: 'Double Side Anti-Glare Lens, Scratch Resistant',
    priority: 1,
    powerTypeIds: ['power-with-power'],
  },
  {
    id: 'lens-category-with-power-lenskart-blu-screen',
    categoryName: 'Lenskart BLU Screen Lens',
    displayLabel: 'Lenskart BLU Screen Lens',
    description: 'Screen protection lenses that minimize eye strain',
    linkedPricingBand: 'Band-B',
    usageAndMapping: 'Screen Friendly, Screen Protection, Minimizes Eyestrain, Scratch & Smudge Resistant',
    priority: 2,
    powerTypeIds: ['power-with-power'],
  },
  {
    id: 'lens-category-with-power-owndays-ishield',
    categoryName: 'Owndays Japan BLU+ iShield',
    displayLabel: 'Owndays Japan BLU+ iShield',
    description: 'Night drive and low-light visibility enhancement lenses',
    linkedPricingBand: 'Band-C',
    usageAndMapping: 'Designed in Japan, Night Drive & Selfie Coating, Improves visibility in low-light and reduces glare, Advanced Screen Protection',
    priority: 3,
    powerTypeIds: ['power-with-power'],
  },
  {
    id: 'lens-category-zero-power-blu-screen',
    categoryName: 'BLU Screen Lenses',
    displayLabel: 'BLU Screen Lenses',
    description: 'Screen protection lenses that minimize eyestrain and resist scratches & smudges',
    linkedPricingBand: 'Band-A',
    usageAndMapping: 'Screen Friendly, Minimizes Eyestrain, Scratch & Smudge Resistant',
    priority: 1,
    powerTypeIds: ['power-zero-power'],
  },
  {
    id: 'lens-category-zero-power-owndays-ishield',
    categoryName: 'Owndays Japan BLU+ iShield',
    displayLabel: 'Owndays Japan BLU+ iShield',
    description: 'Japanese night-driving lenses with reflection control and screen protection',
    linkedPricingBand: 'Band-B',
    usageAndMapping: 'Designed in Japan, Reflection Control, Night Driving Support, Screen Protection',
    priority: 2,
    powerTypeIds: ['power-zero-power'],
  },
  {
    id: 'lens-category-progressive-anti-glare',
    categoryName: 'Lenskart Anti-Glare Normal Corridor Progressive',
    displayLabel: 'Lenskart Anti-Glare Normal Corridor Progressive',
    description: 'Anti-glare progressive lenses perfect for outdoors with enhanced reading experience',
    linkedPricingBand: 'Band-A',
    usageAndMapping: 'Anti-glare, Progressive Vision, Outdoor Usage',
    priority: 1,
    powerTypeIds: ['power-progressive-bifocals'],
  },
  {
    id: 'lens-category-progressive-blu',
    categoryName: 'Lenskart BLU Thin Wide Corridor Progressive',
    displayLabel: 'Lenskart BLU Thin Wide Corridor Progressive',
    description: 'Wide field progressive lenses with thin design and blue light protection',
    linkedPricingBand: 'Band-C',
    usageAndMapping: 'Wide Vision, Progressive Lens, Blue Light Protection',
    priority: 2,
    powerTypeIds: ['power-progressive-bifocals'],
  },
  {
    id: 'lens-category-reading-circular-bifocal',
    categoryName: 'Circular Bi-focal KT',
    displayLabel: 'Circular Bi-focal KT',
    description: 'Bi-focal lenses with concentrated circular reading zone and enhanced outdoor vision',
    linkedPricingBand: 'Band-A',
    usageAndMapping: 'Bifocal Vision, Reading Support, Outdoor Usage',
    priority: 1,
    powerTypeIds: ['power-reading-power'],
  },
];

export async function fetchLensCategories(powerTypeId?: string): Promise<LensCategoryOption[]> {
  try {
    const url = new URL(`${getApiBaseUrl()}/api/lens-categories`);
    if (powerTypeId) {
      url.searchParams.set('powerTypeId', powerTypeId);
    }

    const response = await fetch(url.toString());
    if (!response.ok) {
      throw new Error(`Lens categories API returned ${response.status}`);
    }

    const payload = (await response.json()) as {
      data?: Array<{
        id?: string;
        _id?: string;
        categoryName?: string;
        displayLabel?: string;
        description?: string;
        linkedPricingBand?: string;
        usageAndMapping?: string;
        priority?: number;
        powertype_id?: Array<{ id?: string; _id?: string } | string>;
      }>
    };

    return (payload.data ?? [])
      .filter((item) => item.categoryName)
      .sort((a, b) => (a.priority ?? 999) - (b.priority ?? 999))
      .map((item, index) => ({
        id: item.id ?? item._id ?? `lens-category-${index}`,
        categoryName: item.categoryName ?? '',
        displayLabel: item.displayLabel ?? item.categoryName ?? '',
        description: item.description ?? '',
        linkedPricingBand: item.linkedPricingBand ?? '',
        usageAndMapping: item.usageAndMapping ?? '',
        priority: item.priority ?? index + 1,
        powerTypeIds: (item.powertype_id ?? []).map((powerType) => (
          typeof powerType === 'string'
            ? powerType
            : powerType.id ?? powerType._id ?? ''
        )).filter(Boolean),
      }));
  } catch (_error) {
    const fallbackItems = powerTypeId
      ? LENS_CATEGORY_FALLBACK.filter((item) => item.powerTypeIds.includes(powerTypeId))
      : LENS_CATEGORY_FALLBACK;

    return [...fallbackItems].sort((a, b) => a.priority - b.priority);
  }
}

export async function createOrderPlacement(payload: OrderPlacementPayload): Promise<OrderPlacementResponse> {
  const response = await fetch(`${getApiBaseUrl()}/api/order-placement`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error(`Order placement API returned ${response.status}`);
  }

  const result = (await response.json()) as { data?: OrderPlacementResponse };
  if (!result.data) {
    throw new Error('Order placement API returned an invalid payload');
  }

  return result.data;
}

export async function fetchOrderPlacements(input?: {
  search?: string;
  phone?: string;
  orderNumber?: string;
  limit?: number;
}): Promise<OrderPlacementRecord[]> {
  const url = new URL(`${getApiBaseUrl()}/api/order-placement`);
  const normalizedSearch = input?.search?.trim();
  const normalizedPhone = input?.phone?.replace(/\D/g, '').slice(-10);
  const normalizedOrderNumber = input?.orderNumber?.trim();

  if (normalizedSearch) {
    url.searchParams.set('search', normalizedSearch);
  }

  if (normalizedPhone) {
    url.searchParams.set('phone', normalizedPhone);
  }

  if (normalizedOrderNumber) {
    url.searchParams.set('orderNumber', normalizedOrderNumber);
  }

  if (input?.limit) {
    url.searchParams.set('limit', String(input.limit));
  }

  const response = await fetch(url.toString());
  if (!response.ok) {
    throw new Error(`Order placement list API returned ${response.status}`);
  }

  const result = (await response.json()) as { data?: OrderPlacementRecord[] };
  return result.data ?? [];
}

export async function fetchOrderPlacementById(id: string): Promise<OrderPlacementRecord> {
  const response = await fetch(`${getApiBaseUrl()}/api/order-placement/${id}`);
  if (!response.ok) {
    throw new Error(`Order placement details API returned ${response.status}`);
  }

  const result = (await response.json()) as { data?: OrderPlacementRecord };
  if (!result.data) {
    throw new Error('Order placement details API returned an invalid payload');
  }

  return result.data;
}
