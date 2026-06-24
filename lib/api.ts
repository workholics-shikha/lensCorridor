import Constants from 'expo-constants';
import { getCategories, getFrameShapes, getSalespeople } from './localStore';
import { Category, FrameShape, Salesperson } from './types';
import type { ReturnExchangeRecord, ReturnExchangeType, ReturnExchangeItemScope, RefundType } from './returnExchange';

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
    payments?: Array<{
      amount: number;
      paymentMode: 'Online' | 'Card' | 'Cash';
      collectedAt: string;
      paymentDate?: string;
      paymentTime?: string;
    }>;
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
    payments?: Array<{
      amount: number;
      paymentMode: 'Online' | 'Card' | 'Cash';
      collectedAt: string;
      paymentDate?: string;
      paymentTime?: string;
    }>;
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

export interface ReturnExchangePayload {
  type: ReturnExchangeType;
  orderId: string;
  customerName: string;
  customerPhone: string;
  itemScope: ReturnExchangeItemScope;
  reason: string;
  remarks: string;
  refundType?: RefundType;
  originalAmount: number;
  revisedAmount: number;
  settlementAmount: number;
  settlementType: 'refund' | 'collect' | 'even';
  originalOrderSnapshot?: OrderPlacementRecord;
  replacementDraft?: unknown;
  store?: {
    id: string;
    name: string;
    code: string;
  } | null;
  salesperson?: {
    id: string;
    name: string;
    employeeId: string;
  } | null;
}

interface SalesmanPinVerificationResponse {
  success?: boolean;
  error?: string;
}

export interface OrderBillingUpdatePayload {
  additionalCollectedAmount: number;
  paymentMode: 'Online' | 'Card' | 'Cash';
}

export interface EyeTestPayload {
  samePowerBothEyes: boolean;
  hasCylindricalPower: boolean;
  spherical: {
    right: number | null;
    left: number | null;
  };
  cylindrical: {
    right: number | null;
    left: number | null;
  };
  axis: {
    right: number | null;
    left: number | null;
  };
  name: string;
  mobileNumber: string;
  email?: string;
  address?: string;
}

export interface EyeTestRecord extends EyeTestPayload {
  _id: string;
  createdAt: string;
  updatedAt: string;
}

const DEFAULT_CACHE_TTL_MS = 30 * 1000;
const SEARCH_CACHE_TTL_MS = 10 * 1000;
const DEFAULT_REQUEST_TIMEOUT_MS = 12 * 1000;
const MUTATION_REQUEST_TIMEOUT_MS = 20 * 1000;

const responseCache = new Map<string, { expiresAt: number; value: unknown }>();
const inFlightRequests = new Map<string, Promise<unknown>>();
const orderPlacementSubscribers = new Set<(order: OrderPlacementRecord) => void>();

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

function isAbortError(error: unknown) {
  return error instanceof Error && (
    error.name === 'AbortError'
    || error.message.toLowerCase().includes('timed out')
  );
}

async function fetchWithTimeout(
  url: string,
  init?: RequestInit,
  timeoutMs?: number
) {
  const controller = new AbortController();
  const method = (init?.method ?? 'GET').toUpperCase();
  const effectiveTimeout = timeoutMs ?? (method === 'GET' ? DEFAULT_REQUEST_TIMEOUT_MS : MUTATION_REQUEST_TIMEOUT_MS);
  const externalSignal = init?.signal;

  if (externalSignal?.aborted) {
    controller.abort();
  } else if (externalSignal) {
    externalSignal.addEventListener('abort', () => controller.abort(), { once: true });
  }

  const timeoutHandle = setTimeout(() => {
    controller.abort();
  }, effectiveTimeout);

  try {
    return await fetch(url, {
      ...init,
      signal: controller.signal,
    });
  } catch (error) {
    if (isAbortError(error)) {
      throw new Error('The server took too long to respond. Please try again.');
    }

    throw error;
  } finally {
    clearTimeout(timeoutHandle);
  }
}

async function fetchJsonWithCache<T>(
  url: string,
  init?: RequestInit,
  options?: {
    cacheKey?: string;
    ttlMs?: number;
    bypassCache?: boolean;
    timeoutMs?: number;
  }
): Promise<T> {
  const method = (init?.method ?? 'GET').toUpperCase();
  const cacheKey = options?.cacheKey ?? `${method}:${url}`;
  const shouldCache = method === 'GET' && !options?.bypassCache;
  const ttlMs = options?.ttlMs ?? DEFAULT_CACHE_TTL_MS;

  if (shouldCache) {
    const cached = responseCache.get(cacheKey);
    if (cached && cached.expiresAt > Date.now()) {
      return cached.value as T;
    }

    const pending = inFlightRequests.get(cacheKey);
    if (pending) {
      return pending as Promise<T>;
    }
  }

  const request = fetchWithTimeout(url, init, options?.timeoutMs).then(async (response) => {
    if (!response.ok) {
      throw new Error(`API returned ${response.status}`);
    }

    const payload = await response.json();

    if (shouldCache) {
      responseCache.set(cacheKey, {
        value: payload,
        expiresAt: Date.now() + ttlMs,
      });
    }

    return payload as T;
  }).finally(() => {
    if (shouldCache) {
      inFlightRequests.delete(cacheKey);
    }
  });

  if (shouldCache) {
    inFlightRequests.set(cacheKey, request);
  }

  return request;
}

function invalidateCacheByPrefix(prefix: string) {
  for (const key of responseCache.keys()) {
    if (key.startsWith(prefix)) {
      responseCache.delete(key);
    }
  }
}

function syncCachedOrderRecord(updatedOrder: OrderPlacementRecord) {
  responseCache.set(`order:${updatedOrder.id}`, {
    value: { data: updatedOrder },
    expiresAt: Date.now() + SEARCH_CACHE_TTL_MS,
  });

  for (const [key, entry] of responseCache.entries()) {
    if (!key.startsWith('orders:')) {
      continue;
    }

    const cachedPayload = entry.value as { data?: OrderPlacementRecord[] } | undefined;
    if (!cachedPayload?.data?.length) {
      continue;
    }

    let didUpdate = false;
    const nextOrders = cachedPayload.data.map((item) => {
      if (item.id !== updatedOrder.id) {
        return item;
      }

      didUpdate = true;
      return updatedOrder;
    });

    if (!didUpdate) {
      continue;
    }

    responseCache.set(key, {
      ...entry,
      value: {
        ...cachedPayload,
        data: nextOrders,
      },
    });
  }
}

function notifyOrderPlacementUpdated(order: OrderPlacementRecord) {
  for (const subscriber of orderPlacementSubscribers) {
    subscriber(order);
  }
}

export function subscribeOrderPlacementUpdates(listener: (order: OrderPlacementRecord) => void) {
  orderPlacementSubscribers.add(listener);

  return () => {
    orderPlacementSubscribers.delete(listener);
  };
}

export async function fetchSalespeople(storeId?: string): Promise<Salesperson[]> {
  try {
    const url = new URL(`${getApiBaseUrl()}/api/salesmen`);
    if (storeId) {
      url.searchParams.set('storeId', storeId);
    }

    const data = await fetchJsonWithCache<SalesmanApiResponse[]>(
      url.toString(),
      undefined,
      {
        cacheKey: `salesmen:${storeId ?? 'all'}`,
      }
    );
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

export async function verifySalespersonPin(input: { salesmanId: string; pin: string }): Promise<boolean> {
  const response = await fetchWithTimeout(`${getApiBaseUrl()}/api/salesmen/verify-pin`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      salesmanId: input.salesmanId,
      pin: input.pin,
    }),
  });

  const result = (await response.json().catch(() => null)) as SalesmanPinVerificationResponse | null;

  if (!response.ok || !result?.success) {
    throw new Error(result?.error || 'Invalid PIN');
  }

  return true;
}

export async function fetchStores(): Promise<StoreOption[]> {
  try {
    const data = await fetchJsonWithCache<SalesmanApiResponse[]>(
      `${getApiBaseUrl()}/api/salesmen`,
      undefined,
      {
        cacheKey: 'salesmen:all',
      }
    );
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
    const data = await fetchJsonWithCache<FrameShapeApiResponse[]>(
      `${getApiBaseUrl()}/api/frame-shapes`,
      undefined,
      {
        cacheKey: 'frame-shapes',
      }
    );
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
    const payload = await fetchJsonWithCache<{ data?: PowerTypeApiItem[] }>(
      `${getApiBaseUrl()}/api/power-types`,
      undefined,
      {
        cacheKey: 'power-types',
      }
    );
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

    const payload = await fetchJsonWithCache<{
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
    }>(
      url.toString(),
      undefined,
      {
        cacheKey: `lens-categories:${powerTypeId ?? 'all'}`,
      }
    );

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
  const response = await fetchWithTimeout(`${getApiBaseUrl()}/api/order-placement`, {
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

  invalidateCacheByPrefix('orders:');
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

  const result = await fetchJsonWithCache<{ data?: OrderPlacementRecord[] }>(
    url.toString(),
    undefined,
    {
      cacheKey: `orders:${url.toString()}`,
      ttlMs: normalizedSearch || normalizedPhone || normalizedOrderNumber ? SEARCH_CACHE_TTL_MS : DEFAULT_CACHE_TTL_MS,
    }
  );
  return result.data ?? [];
}

export async function fetchOrderPlacementById(
  id: string,
  options?: { bypassCache?: boolean }
): Promise<OrderPlacementRecord> {
  const result = await fetchJsonWithCache<{ data?: OrderPlacementRecord }>(
    `${getApiBaseUrl()}/api/order-placement/${id}`,
    undefined,
    {
      cacheKey: `order:${id}`,
      ttlMs: SEARCH_CACHE_TTL_MS,
      bypassCache: options?.bypassCache,
    }
  );
  if (!result.data) {
    throw new Error('Order placement details API returned an invalid payload');
  }

  return result.data;
}

export async function updateOrderPlacementBilling(
  id: string,
  payload: OrderBillingUpdatePayload
): Promise<OrderPlacementRecord> {
  const response = await fetchWithTimeout(`${getApiBaseUrl()}/api/order-placement/${id}/billing`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  const result = (await response.json().catch(() => null)) as { data?: OrderPlacementRecord; message?: string } | null;

  if (!response.ok || !result?.data) {
    throw new Error(result?.message || `Order billing update API returned ${response.status}`);
  }

  syncCachedOrderRecord(result.data);
  notifyOrderPlacementUpdated(result.data);
  invalidateCacheByPrefix('orders:');
  return result.data;
}

export async function createEyeTestRecord(payload: EyeTestPayload): Promise<EyeTestRecord> {
  const response = await fetchWithTimeout(`${getApiBaseUrl()}/api/eye-tests`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  const result = (await response.json().catch(() => null)) as { data?: EyeTestRecord; message?: string } | null;

  if (!response.ok || !result?.data) {
    throw new Error(result?.message || `Eye test API returned ${response.status}`);
  }

  invalidateCacheByPrefix('eye-tests:');
  return result.data;
}

export async function fetchEyeTests(input?: { mobileNumber?: string }): Promise<EyeTestRecord[]> {
  const url = new URL(`${getApiBaseUrl()}/api/eye-tests`);
  const normalizedPhone = input?.mobileNumber?.replace(/\D/g, '').slice(-10);

  if (normalizedPhone) {
    url.searchParams.set('mobileNumber', normalizedPhone);
  }

  const result = await fetchJsonWithCache<{ data?: EyeTestRecord[] } | null>(
    url.toString(),
    undefined,
    {
      cacheKey: `eye-tests:${normalizedPhone ?? 'all'}`,
      ttlMs: normalizedPhone ? SEARCH_CACHE_TTL_MS : DEFAULT_CACHE_TTL_MS,
    }
  );
  return result?.data ?? [];
}

export async function createReturnExchangeRequest(payload: ReturnExchangePayload): Promise<ReturnExchangeRecord> {
  const response = await fetchWithTimeout(`${getApiBaseUrl()}/api/returns`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  const result = (await response.json().catch(() => null)) as { data?: ReturnExchangeRecord; message?: string } | null;

  if (!response.ok || !result?.data) {
    throw new Error(result?.message || `Return API returned ${response.status}`);
  }

  return result.data;
}
