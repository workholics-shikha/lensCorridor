import type { OrderDraft } from '@/context/OrderFlowContext';
import type { OrderPlacementRecord } from '@/lib/api';

export function buildDraftFromOrder(order: OrderPlacementRecord, currentDraft: OrderDraft): OrderDraft {
  const nextFrames = Array.isArray(order.frame.images) && order.frame.images.length
    ? order.frame.images.map((item, index) => ({
      id: item.id || `history-frame-${index}`,
      image: item.image,
      shape: item.shape,
    }))
    : currentDraft.frameImages;

  return {
    ...currentDraft,
    phone: order.customer.phone || '',
    customerName: order.customer.name || '',
    billingAddress: order.customer.billingAddress || '',
    price: String(order.frame.price || order.billing.totalPayable || ''),
    billingDiscount: String(order.billing.discount ?? 0),
    partialPaymentEnabled: Boolean(order.billing.partialPaymentEnabled),
    partialPaymentAmount: order.billing.partialPaymentEnabled
      ? String(order.billing.paidAmount ?? '')
      : '',
    paymentMode: order.billing.paymentMode,
    selectedShape: order.frame.selectedShape || currentDraft.selectedShape,
    frameImages: nextFrames,
    store: order.meta?.store ?? currentDraft.store,
    salesperson: order.meta?.salesperson ?? currentDraft.salesperson,
    lensSelection: {
      lensType: order.lensSelection.lensType || currentDraft.lensSelection.lensType,
      lensCategory: order.lensSelection.lensCategory || currentDraft.lensSelection.lensCategory,
      lensCategoryId: order.lensSelection.lensCategoryId || currentDraft.lensSelection.lensCategoryId,
      lensPrice: Number(order.lensSelection.lensPrice ?? currentDraft.lensSelection.lensPrice),
      coating: order.lensSelection.coating || currentDraft.lensSelection.coating,
      powerType: order.lensSelection.powerType || currentDraft.lensSelection.powerType,
      powerTypeId: order.lensSelection.powerTypeId || currentDraft.lensSelection.powerTypeId,
      image: order.lensSelection.image || currentDraft.lensSelection.image,
    },
    lensDetails: Array.isArray(order.lensDetails) && order.lensDetails.length
      ? order.lensDetails.map((item, index) => ({
        id: item.id || `history-lens-${index}`,
        label: item.label || 'Distance Vision',
        eye: item.eye,
        sph: item.sph || '',
        cyl: item.cyl || '',
        axis: item.axis || '',
        add: item.add || '',
      }))
      : currentDraft.lensDetails,
  };
}
