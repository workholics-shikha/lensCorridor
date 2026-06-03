import React, { createContext, useContext, useMemo, useState } from 'react';

type LensSelection = {
  lensType: string;
  lensCategory: string;
  coating: string;
  powerType: string;
  image: string;
};

type LensDetail = {
  id: string;
  label: string;
  eye: 'left' | 'right';
  sph: string;
  cyl: string;
  axis: string;
  add: string;
};

type FrameImage = {
  id: string;
  image?: string;
  shape?: string;
};

type OrderDraft = {
  phone: string;
  customerName: string;
  price: string;
  selectedShape: string;
  frameImages: FrameImage[];
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
  { id: 'lens-right', label: 'Distance Vision', eye: 'right', sph: '-1.25', cyl: '-0.50', axis: '20', add: '0.00' },
  { id: 'lens-left', label: 'Distance Vision', eye: 'left', sph: '-1.00', cyl: '-0.25', axis: '15', add: '0.00' },
];

const defaultDraft: OrderDraft = {
  phone: '',
  customerName: '',
  price: '',
  selectedShape: '',
  frameImages: [],
  lensSelection: {
    lensType: 'Single Vision',
    lensCategory: 'Blue Cut',
    coating: 'Standard',
    powerType: 'Distance',
    image: '',
  },
  lensDetails: defaultLensDetails,
};

const OrderFlowContext = createContext<OrderFlowContextType | null>(null);

export function OrderFlowProvider({ children }: { children: React.ReactNode }) {
  const [draft, setDraft] = useState<OrderDraft>(defaultDraft);

  const value = useMemo<OrderFlowContextType>(() => ({
    draft,
    updateDraft: (patch) => {
      setDraft((current) => ({ ...current, ...patch }));
    },
    updateLensSelection: (patch) => {
      setDraft((current) => ({
        ...current,
        lensSelection: {
          ...current.lensSelection,
          ...patch,
        },
      }));
    },
    updateLensDetail: (id, patch) => {
      setDraft((current) => ({
        ...current,
        lensDetails: current.lensDetails.map((item) => (
          item.id === id ? { ...item, ...patch } : item
        )),
      }));
    },
    resetDraft: () => {
      setDraft(defaultDraft);
    },
  }), [draft]);

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
