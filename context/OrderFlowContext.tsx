import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';

export type LensSelection = {
  lensType: string;
  lensCategory: string;
  lensCategoryId: string;
  lensPrice: number;
  coating: string;
  powerType: string;
  powerTypeId: string;
  image: string;
};

export type LensDetail = {
  id: string;
  label: string;
  eye: 'left' | 'right';
  sph: string;
  cyl: string;
  axis: string;
  add: string;
};

export type FrameImage = {
  id: string;
  image?: string;
  shape?: string;
};

export type SelectedStore = {
  id: string;
  name: string;
  code: string;
};

export type SelectedSalesperson = {
  id: string;
  name: string;
  employeeId: string;
};

export type OrderDraft = {
  phone: string;
  customerName: string;
  price: string;
  billingAddress: string;
  billingDiscount: string;
  partialPaymentEnabled: boolean;
  partialPaymentAmount: string;
  paymentMode: 'Online' | 'Card' | 'Cash';
  selectedShape: string;
  frameImages: FrameImage[];
  store: SelectedStore | null;
  salesperson: SelectedSalesperson | null;
  lensSelection: LensSelection;
  lensDetails: LensDetail[];
};

type OrderFlowContextType = {
  draft: OrderDraft;
  updateDraft: (patch: Partial<OrderDraft>) => void;
  updateLensSelection: (patch: Partial<LensSelection>) => void;
  updateLensDetail: (id: string, patch: Partial<LensDetail>) => void;
  resetDraft: () => void;
};

const defaultLensDetails: LensDetail[] = [
  { id: 'lens-right', label: 'Distance Vision', eye: 'right', sph: '', cyl: '', axis: '', add: '' },
  { id: 'lens-left', label: 'Distance Vision', eye: 'left', sph: '', cyl: '', axis: '', add: '' },
];

const defaultDraft: OrderDraft = {
  phone: '',
  customerName: '',
  price: '',
  billingAddress: '',
  billingDiscount: '0',
  partialPaymentEnabled: false,
  partialPaymentAmount: '',
  paymentMode: 'Online',
  selectedShape: '',
  frameImages: [],
  store: null,
  salesperson: null,
  lensSelection: {
    lensType: 'Single Vision',
    lensCategory: 'Blue Cut',
    lensCategoryId: '',
    lensPrice: 0,
    coating: 'Standard',
    powerType: 'Distance',
    powerTypeId: '',
    image: '',
  },
  lensDetails: defaultLensDetails,
};

const OrderFlowContext = createContext<OrderFlowContextType | null>(null);

export function OrderFlowProvider({ children }: { children: React.ReactNode }) {
  const [draft, setDraft] = useState<OrderDraft>(defaultDraft);
  const updateDraft = useCallback((patch: Partial<OrderDraft>) => {
    setDraft((current) => ({ ...current, ...patch }));
  }, []);

  const updateLensSelection = useCallback((patch: Partial<LensSelection>) => {
    setDraft((current) => ({
      ...current,
      lensSelection: {
        ...current.lensSelection,
        ...patch,
      },
    }));
  }, []);

  const updateLensDetail = useCallback((id: string, patch: Partial<LensDetail>) => {
    setDraft((current) => ({
      ...current,
      lensDetails: current.lensDetails.map((item) => (
        item.id === id ? { ...item, ...patch } : item
      )),
    }));
  }, []);

  const resetDraft = useCallback(() => {
    setDraft(defaultDraft);
  }, []);

  const value = useMemo<OrderFlowContextType>(() => ({
    draft,
    updateDraft,
    updateLensSelection,
    updateLensDetail,
    resetDraft,
  }), [draft, resetDraft, updateDraft, updateLensDetail, updateLensSelection]);

  return (
    <OrderFlowContext.Provider value={value}>
      {children}
    </OrderFlowContext.Provider>
  );
}

export function useOrderFlow() {
  const context = useContext(OrderFlowContext);
  if (!context) {
    throw new Error('useOrderFlow must be used within an OrderFlowProvider');
  }

  return context;
}
