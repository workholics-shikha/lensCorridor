import React, { createContext, useContext, useMemo, useState } from 'react';
import type { OrderPlacementRecord } from '@/lib/api';
import type {
  ExchangeDraftMeta,
  ReturnDraft,
  ReturnExchangeRecord,
  ReturnExchangeType,
} from '@/lib/returnExchange';

type ReturnExchangeContextType = {
  selectedOrder: OrderPlacementRecord | null;
  transactionType: ReturnExchangeType | null;
  returnDraft: ReturnDraft;
  exchangeDraft: ExchangeDraftMeta;
  createdRecord: ReturnExchangeRecord | null;
  setSelectedOrder: (order: OrderPlacementRecord | null) => void;
  setTransactionType: (type: ReturnExchangeType | null) => void;
  updateReturnDraft: (patch: Partial<ReturnDraft>) => void;
  updateExchangeDraft: (patch: Partial<ExchangeDraftMeta>) => void;
  setCreatedRecord: (record: ReturnExchangeRecord | null) => void;
  reset: () => void;
};

const defaultReturnDraft: ReturnDraft = {
  reason: '',
  remarks: '',
  itemScope: 'full-product',
  refundType: 'original-payment',
};

const defaultExchangeDraft: ExchangeDraftMeta = {
  reason: '',
  remarks: '',
  itemScope: 'full-product',
};

const ReturnExchangeContext = createContext<ReturnExchangeContextType | null>(null);

export function ReturnExchangeProvider({ children }: { children: React.ReactNode }) {
  const [selectedOrder, setSelectedOrder] = useState<OrderPlacementRecord | null>(null);
  const [transactionType, setTransactionType] = useState<ReturnExchangeType | null>(null);
  const [returnDraft, setReturnDraft] = useState<ReturnDraft>(defaultReturnDraft);
  const [exchangeDraft, setExchangeDraft] = useState<ExchangeDraftMeta>(defaultExchangeDraft);
  const [createdRecord, setCreatedRecord] = useState<ReturnExchangeRecord | null>(null);

  const value = useMemo<ReturnExchangeContextType>(() => ({
    selectedOrder,
    transactionType,
    returnDraft,
    exchangeDraft,
    createdRecord,
    setSelectedOrder,
    setTransactionType,
    updateReturnDraft: (patch) => {
      setReturnDraft((current) => ({ ...current, ...patch }));
    },
    updateExchangeDraft: (patch) => {
      setExchangeDraft((current) => ({ ...current, ...patch }));
    },
    setCreatedRecord,
    reset: () => {
      setSelectedOrder(null);
      setTransactionType(null);
      setReturnDraft(defaultReturnDraft);
      setExchangeDraft(defaultExchangeDraft);
      setCreatedRecord(null);
    },
  }), [createdRecord, exchangeDraft, returnDraft, selectedOrder, transactionType]);

  return (
    <ReturnExchangeContext.Provider value={value}>
      {children}
    </ReturnExchangeContext.Provider>
  );
}

export function useReturnExchange() {
  const context = useContext(ReturnExchangeContext);
  if (!context) {
    throw new Error('useReturnExchange must be used within a ReturnExchangeProvider');
  }

  return context;
}
