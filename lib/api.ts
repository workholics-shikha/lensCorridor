import { Platform } from 'react-native';
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

function getApiBaseUrl() {
  const configuredBaseUrl = process.env.EXPO_PUBLIC_API_BASE_URL?.trim();
  if (configuredBaseUrl) {
    return configuredBaseUrl.replace(/\/$/, '');
  }

  if (Platform.OS === 'android') {
    return 'http://10.0.2.2:5000';
  }

  return 'http://localhost:5000';
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
