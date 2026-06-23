import type { PowerTypeOption } from './api';

export const LENS_PRICE_BY_BAND: Record<string, number> = {
  'Band-A': 500,
  'Band-B': 1500,
  'Band-C': 1500,
  'Band-D': 1800,
  'Band-E': 2100,
  'Band-F': 2400,
  'Band-G': 2700,
  'Band-H': 3000,
};

type DraftLike = {
  price?: string;
  billingDiscount?: string;
  partialPaymentEnabled?: boolean;
  partialPaymentAmount?: string;
  lensSelection?: {
    powerType?: string;
    lensPrice?: number;
  };
};

export function getLensPriceFromBand(band?: string) {
  if (!band) {
    return 0;
  }

  return LENS_PRICE_BY_BAND[band] ?? 0;
}

function parseCurrencyLike(value?: string | number) {
  const numericValue = typeof value === 'number' ? value : Number(value || 0);
  if (!Number.isFinite(numericValue)) {
    return 0;
  }

  return numericValue;
}

export function getOrderAmounts(draft: DraftLike) {
  const framePrice = Math.max(parseCurrencyLike(draft.price), 0);
  const powerType = draft.lensSelection?.powerType?.toLowerCase() ?? '';
  const lensPrice = powerType === 'frame only' ? 0 : Math.max(parseCurrencyLike(draft.lensSelection?.lensPrice), 0);
  const subtotal = framePrice + lensPrice;
  const rawDiscount = Math.max(parseCurrencyLike(draft.billingDiscount), 0);
  const discount = Math.min(rawDiscount, subtotal);
  const totalPayable = Math.max(subtotal - discount, 0);
  const rawPartialAmount = Math.max(parseCurrencyLike(draft.partialPaymentAmount), 0);
  const partialPaymentEnabled = Boolean(draft.partialPaymentEnabled);
  const paidAmount = partialPaymentEnabled
    ? Math.min(rawPartialAmount, totalPayable)
    : totalPayable;
  const remainingAmount = Math.max(totalPayable - paidAmount, 0);

  return {
    framePrice,
    lensPrice,
    discount,
    rawDiscount,
    subtotal,
    totalPayable,
    partialPaymentEnabled,
    rawPartialAmount,
    paidAmount,
    remainingAmount,
  };
}
