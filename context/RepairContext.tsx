import React, { createContext, useContext, useMemo, useState } from 'react';
import type { OrderPlacementRecord, RepairRecord, RepairScope } from '@/lib/api';

type RepairDraft = {
  issueType: string;
  repairScope: RepairScope;
  remarks: string;
  estimatedAmount: string;
  advanceAmount: string;
  expectedDeliveryDate: string;
};

type RepairContextType = {
  selectedOrder: OrderPlacementRecord | null;
  repairDraft: RepairDraft;
  createdRecord: RepairRecord | null;
  setSelectedOrder: (order: OrderPlacementRecord | null) => void;
  updateRepairDraft: (patch: Partial<RepairDraft>) => void;
  setCreatedRecord: (record: RepairRecord | null) => void;
  reset: () => void;
};

const defaultRepairDraft: RepairDraft = {
  issueType: '',
  repairScope: 'full-product',
  remarks: '',
  estimatedAmount: '',
  advanceAmount: '',
  expectedDeliveryDate: '',
};

const RepairContext = createContext<RepairContextType | null>(null);

export function RepairProvider({ children }: { children: React.ReactNode }) {
  const [selectedOrder, setSelectedOrder] = useState<OrderPlacementRecord | null>(null);
  const [repairDraft, setRepairDraft] = useState<RepairDraft>(defaultRepairDraft);
  const [createdRecord, setCreatedRecord] = useState<RepairRecord | null>(null);

  const value = useMemo<RepairContextType>(() => ({
    selectedOrder,
    repairDraft,
    createdRecord,
    setSelectedOrder,
    updateRepairDraft: (patch) => {
      setRepairDraft((current) => ({ ...current, ...patch }));
    },
    setCreatedRecord,
    reset: () => {
      setSelectedOrder(null);
      setRepairDraft(defaultRepairDraft);
      setCreatedRecord(null);
    },
  }), [createdRecord, repairDraft, selectedOrder]);

  return (
    <RepairContext.Provider value={value}>
      {children}
    </RepairContext.Provider>
  );
}

export function useRepair() {
  const context = useContext(RepairContext);
  if (!context) {
    throw new Error('useRepair must be used within a RepairProvider');
  }

  return context;
}
