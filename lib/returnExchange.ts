import type { OrderDraft } from '@/context/OrderFlowContext';
import type { OrderPlacementRecord } from '@/lib/api';

export type ReturnExchangeType = 'return' | 'exchange';
export type ReturnExchangeItemScope = 'frame' | 'lens' | 'full-product';
export type RefundType = 'original-payment' | 'store-credit' | 'cash';

export type ReturnDraft = {
  reason: string;
  remarks: string;
  itemScope: ReturnExchangeItemScope;
  refundType: RefundType;
};

export type ExchangeDraftMeta = {
  reason: string;
  remarks: string;
  itemScope: ReturnExchangeItemScope;
};

export type ReturnExchangeRecord = {
  id: string;
  referenceNumber: string;
  type: ReturnExchangeType;
  originalOrderId: string;
  originalOrderNumber: string;
  customerName: string;
  customerPhone: string;
  createdAt: string;
  itemScope: ReturnExchangeItemScope;
  reason: string;
  remarks: string;
  refundType?: RefundType;
  originalAmount: number;
  revisedAmount: number;
  settlementAmount: number;
  settlementType: 'refund' | 'collect' | 'even';
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
  originalOrderSnapshot: OrderPlacementRecord;
  replacementDraftSnapshot?: OrderDraft;
};

const records: ReturnExchangeRecord[] = [];

const createId = (prefix: string) =>
  `${prefix}_${Math.random().toString(36).slice(2, 10)}${Date.now().toString(36).slice(-4)}`;

function cloneOrder(order: OrderPlacementRecord): OrderPlacementRecord {
  return {
    ...order,
    customer: { ...order.customer },
    frame: {
      ...order.frame,
      images: order.frame.images.map((item) => ({ ...item })),
    },
    lensSelection: { ...order.lensSelection },
    lensDetails: order.lensDetails.map((item) => ({ ...item })),
    billing: { ...order.billing },
    meta: order.meta ? {
      ...order.meta,
      store: order.meta.store ? { ...order.meta.store } : undefined,
      salesperson: order.meta.salesperson ? { ...order.meta.salesperson } : undefined,
    } : undefined,
  };
}

function cloneDraft(draft: OrderDraft): OrderDraft {
  return {
    ...draft,
    frameImages: draft.frameImages.map((item) => ({ ...item })),
    lensSelection: { ...draft.lensSelection },
    lensDetails: draft.lensDetails.map((item) => ({ ...item })),
    store: draft.store ? { ...draft.store } : null,
    salesperson: draft.salesperson ? { ...draft.salesperson } : null,
  };
}

function buildReferenceNumber(type: ReturnExchangeType) {
  const now = new Date();
  const yyyy = now.getFullYear();
  const mm = `${now.getMonth() + 1}`.padStart(2, '0');
  const dd = `${now.getDate()}`.padStart(2, '0');
  const sequence = `${Math.floor(Math.random() * 10000)}`.padStart(4, '0');
  const prefix = type === 'return' ? 'RET' : 'EXC';
  return `${prefix}-${yyyy}${mm}${dd}-${sequence}`;
}

export function getOriginalLensAmount(order: OrderPlacementRecord) {
  return order.lensSelection.powerType.toLowerCase() === 'frame only'
    ? 0
    : Number(order.lensSelection.lensPrice || 0);
}

export function getOriginalItemAmount(order: OrderPlacementRecord, scope: ReturnExchangeItemScope) {
  const frameAmount = Number(order.frame.price || 0);
  const lensAmount = getOriginalLensAmount(order);

  if (scope === 'frame') {
    return frameAmount;
  }

  if (scope === 'lens') {
    return lensAmount;
  }

  return Number(order.billing.totalPayable || frameAmount + lensAmount);
}

export function getRevisedItemAmount(draft: OrderDraft, scope: ReturnExchangeItemScope) {
  const frameAmount = Number(draft.price || 0);
  const lensAmount = draft.lensSelection.powerType.toLowerCase() === 'frame only'
    ? 0
    : Number(draft.lensSelection.lensPrice || 0);
  const subtotal = frameAmount + lensAmount;
  const totalPayable = Math.max(subtotal - Number(draft.billingDiscount || 0), 0);

  if (scope === 'frame') {
    return frameAmount;
  }

  if (scope === 'lens') {
    return lensAmount;
  }

  return totalPayable;
}

export function getSettlement(originalAmount: number, revisedAmount: number) {
  const delta = Number((revisedAmount - originalAmount).toFixed(2));

  if (delta > 0) {
    return {
      amount: delta,
      type: 'collect' as const,
    };
  }

  if (delta < 0) {
    return {
      amount: Math.abs(delta),
      type: 'refund' as const,
    };
  }

  return {
    amount: 0,
    type: 'even' as const,
  };
}

export function createReturnExchangeRecord(input: {
  type: ReturnExchangeType;
  order: OrderPlacementRecord;
  itemScope: ReturnExchangeItemScope;
  reason: string;
  remarks: string;
  refundType?: RefundType;
  originalAmount: number;
  revisedAmount: number;
  settlementAmount: number;
  settlementType: 'refund' | 'collect' | 'even';
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
  replacementDraft?: OrderDraft;
}) {
  const record: ReturnExchangeRecord = {
    id: createId(input.type),
    referenceNumber: buildReferenceNumber(input.type),
    type: input.type,
    originalOrderId: input.order.id,
    originalOrderNumber: input.order.orderNumber,
    customerName: input.order.customer.name || 'Customer',
    customerPhone: input.order.customer.phone,
    createdAt: new Date().toISOString(),
    itemScope: input.itemScope,
    reason: input.reason,
    remarks: input.remarks,
    refundType: input.refundType,
    originalAmount: input.originalAmount,
    revisedAmount: input.revisedAmount,
    settlementAmount: input.settlementAmount,
    settlementType: input.settlementType,
    store: input.store ?? null,
    salesperson: input.salesperson ?? null,
    originalOrderSnapshot: cloneOrder(input.order),
    replacementDraftSnapshot: input.replacementDraft ? cloneDraft(input.replacementDraft) : undefined,
  };

  records.unshift(record);
  return record;
}

export function getReturnExchangeRecords() {
  return [...records];
}
