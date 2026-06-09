import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from 'react-native';
import { router } from 'expo-router';
import { ArrowLeft, BadgeIndianRupee, FilePenLine } from 'lucide-react-native';
import { useOrderFlow } from '@/context/OrderFlowContext';
import { useReturnExchange } from '@/context/ReturnExchangeContext';
import {
  fetchFrameShapes,
  fetchLensCategories,
  fetchPowerTypes,
  type LensCategoryOption,
  type PowerTypeOption,
} from '@/lib/api';
import type { FrameShape } from '@/lib/types';
import {
  createReturnExchangeRecord,
  getOriginalItemAmount,
  getRevisedItemAmount,
  getSettlement,
  type ReturnExchangeItemScope,
} from '@/lib/returnExchange';
import { getLensPriceFromBand } from '@/lib/orderPricing';
import { Colors, Shadow } from '@/lib/theme';

const EXCHANGE_REASONS = [
  'Power Update',
  'Frame Defect',
  'Lens Damage',
  'Customer Upgrade',
  'Fit Issue',
];

const ITEM_SCOPES: Array<{ label: string; value: ReturnExchangeItemScope }> = [
  { label: 'Frame', value: 'frame' },
  { label: 'Lens', value: 'lens' },
  { label: 'Full Product', value: 'full-product' },
];

export default function ReturnExchangeExchangeScreen() {
  const { width } = useWindowDimensions();
  const isTablet = width >= 920;
  const { draft, updateDraft, updateLensSelection } = useOrderFlow();
  const {
    selectedOrder,
    exchangeDraft,
    updateExchangeDraft,
    setCreatedRecord,
  } = useReturnExchange();
  const [shapes, setShapes] = useState<FrameShape[]>([]);
  const [powerTypes, setPowerTypes] = useState<PowerTypeOption[]>([]);
  const [categories, setCategories] = useState<LensCategoryOption[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(false);

  useEffect(() => {
    fetchFrameShapes().then(setShapes);
    fetchPowerTypes().then(setPowerTypes);
  }, []);

  useEffect(() => {
    if (!draft.lensSelection.powerTypeId) {
      setCategories([]);
      return;
    }

    setLoadingCategories(true);
    fetchLensCategories(draft.lensSelection.powerTypeId)
      .then(setCategories)
      .finally(() => setLoadingCategories(false));
  }, [draft.lensSelection.powerTypeId]);

  const originalAmount = useMemo(() => (
    selectedOrder ? getOriginalItemAmount(selectedOrder, exchangeDraft.itemScope) : 0
  ), [exchangeDraft.itemScope, selectedOrder]);

  const revisedAmount = useMemo(() => (
    getRevisedItemAmount(draft, exchangeDraft.itemScope)
  ), [draft, exchangeDraft.itemScope]);

  const settlement = useMemo(() => (
    getSettlement(originalAmount, revisedAmount)
  ), [originalAmount, revisedAmount]);

  if (!selectedOrder) {
    return (
      <View style={styles.center}>
        <Text style={styles.emptyTitle}>No order selected for exchange.</Text>
        <TouchableOpacity style={styles.primaryButton} onPress={() => router.replace('/return-exchange-search')}>
          <Text style={styles.primaryButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const handlePowerTypeSelect = (item: PowerTypeOption) => {
    updateLensSelection({
      powerTypeId: item.id,
      powerType: item.name,
      lensType: item.name,
      lensCategory: '',
      lensCategoryId: '',
      lensPrice: 0,
      image: item.image,
    });
  };

  const handleCategorySelect = (item: LensCategoryOption) => {
    updateLensSelection({
      lensCategory: item.displayLabel || item.categoryName,
      lensCategoryId: item.id,
      lensPrice: getLensPriceFromBand(item.linkedPricingBand),
    });
  };

  const handleCreateExchange = () => {
    if (!exchangeDraft.reason.trim()) {
      return;
    }

    const record = createReturnExchangeRecord({
      type: 'exchange',
      order: selectedOrder,
      itemScope: exchangeDraft.itemScope,
      reason: exchangeDraft.reason,
      remarks: exchangeDraft.remarks,
      originalAmount,
      revisedAmount,
      settlementAmount: settlement.amount,
      settlementType: settlement.type,
      store: draft.store,
      salesperson: draft.salesperson,
      replacementDraft: draft,
    });

    setCreatedRecord(record);
    router.push('/return-exchange-invoice');
  };

  const showFrameSection = exchangeDraft.itemScope === 'frame' || exchangeDraft.itemScope === 'full-product';
  const showLensSection = exchangeDraft.itemScope === 'lens' || exchangeDraft.itemScope === 'full-product';

  return (
    <View style={styles.screen}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()} activeOpacity={0.86}>
          <ArrowLeft size={20} color="#1C1D21" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Exchange Request</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={[styles.topGrid, isTablet && styles.topGridTablet]}>
          <View style={[styles.panel, isTablet && styles.panelHalf]}>
            <Text style={styles.panelTitle}>Original Order</Text>
            <Text style={styles.summaryCustomer}>{selectedOrder.customer.name || 'Customer'}</Text>
            <Text style={styles.summaryText}>Invoice: {selectedOrder.orderNumber}</Text>
            <Text style={styles.summaryText}>Order ID: {selectedOrder.id}</Text>
            <Text style={styles.summaryText}>Mobile: {selectedOrder.customer.phone}</Text>
            <Text style={styles.summaryAmount}>Original Value: Rs. {originalAmount.toLocaleString('en-IN')}</Text>
          </View>

          <View style={[styles.panel, isTablet && styles.panelHalf]}>
            <Text style={styles.panelTitle}>Exchange Setup</Text>
            <Text style={styles.sectionTitle}>Exchange Reason</Text>
            <View style={styles.choiceWrap}>
              {EXCHANGE_REASONS.map((reason) => (
                <ChoiceChip
                  key={reason}
                  label={reason}
                  active={exchangeDraft.reason === reason}
                  onPress={() => updateExchangeDraft({ reason })}
                />
              ))}
            </View>

            <Text style={styles.sectionTitle}>Replace Item</Text>
            <View style={styles.choiceWrap}>
              {ITEM_SCOPES.map((item) => (
                <ChoiceChip
                  key={item.value}
                  label={item.label}
                  active={exchangeDraft.itemScope === item.value}
                  onPress={() => updateExchangeDraft({ itemScope: item.value })}
                />
              ))}
            </View>

            <TextInput
              value={exchangeDraft.remarks}
              onChangeText={(remarks) => updateExchangeDraft({ remarks })}
              placeholder="Add exchange remarks"
              placeholderTextColor="#9CA3AF"
              multiline
              textAlignVertical="top"
              style={styles.remarksInput}
            />
          </View>
        </View>

        {showFrameSection ? (
          <View style={styles.panel}>
            <Text style={styles.panelTitle}>Frame Replacement</Text>
            <Text style={styles.sectionTitle}>Frame Shape</Text>
            <View style={styles.choiceWrap}>
              {shapes.map((shape) => (
                <ChoiceChip
                  key={shape.id}
                  label={shape.title}
                  active={draft.selectedShape === shape.shape}
                  onPress={() => updateDraft({ selectedShape: shape.shape })}
                />
              ))}
            </View>

            <Text style={styles.sectionTitle}>Frame Price</Text>
            <TextInput
              value={draft.price}
              onChangeText={(value) => updateDraft({ price: value.replace(/[^0-9.]/g, '') })}
              placeholder="Enter replacement frame price"
              placeholderTextColor="#9CA3AF"
              keyboardType="decimal-pad"
              style={styles.priceInput}
            />
          </View>
        ) : null}

        {showLensSection ? (
          <View style={styles.panel}>
            <Text style={styles.panelTitle}>Lens Replacement</Text>
            <Text style={styles.sectionTitle}>Power Type</Text>
            <View style={styles.choiceWrap}>
              {powerTypes.map((item) => (
                <ChoiceChip
                  key={item.id}
                  label={item.name}
                  active={draft.lensSelection.powerType === item.name}
                  onPress={() => handlePowerTypeSelect(item)}
                />
              ))}
            </View>

            <TouchableOpacity
              style={styles.secondaryButton}
              activeOpacity={0.88}
              onPress={() => router.push({
                pathname: '/prescription',
                params: {
                  mode: 'order-flow',
                  nextPath: '/return-exchange-exchange',
                },
              })}
            >
              <FilePenLine size={15} color={Colors.primary} />
              <Text style={styles.secondaryButtonText}>Update Eye Power</Text>
            </TouchableOpacity>

            <Text style={styles.sectionTitle}>Lens Category</Text>
            {loadingCategories ? (
              <View style={styles.loadingWrap}>
                <ActivityIndicator size="small" color={Colors.primary} />
              </View>
            ) : (
              <View style={styles.choiceWrap}>
                {categories.map((item) => (
                  <ChoiceChip
                    key={item.id}
                    label={`${item.displayLabel || item.categoryName} - Rs. ${getLensPriceFromBand(item.linkedPricingBand)}`}
                    active={draft.lensSelection.lensCategoryId === item.id}
                    onPress={() => handleCategorySelect(item)}
                  />
                ))}
              </View>
            )}
          </View>
        ) : null}

        <View style={styles.settlementCard}>
          <View style={styles.summaryTitleRow}>
            <BadgeIndianRupee size={16} color="#B45309" />
            <Text style={styles.summaryTitle}>Auto Settlement</Text>
          </View>
          <Text style={styles.settlementText}>Original selected value: Rs. {originalAmount.toLocaleString('en-IN')}</Text>
          <Text style={styles.settlementText}>Revised selected value: Rs. {revisedAmount.toLocaleString('en-IN')}</Text>
          <Text style={styles.settlementValue}>
            {settlement.type === 'collect' ? 'Collect Extra' : settlement.type === 'refund' ? 'Refund Back' : 'No Amount Difference'}:
            {' '}Rs. {settlement.amount.toLocaleString('en-IN')}
          </Text>
        </View>

        <TouchableOpacity
          style={[styles.primaryButton, !exchangeDraft.reason.trim() && styles.primaryButtonDisabled]}
          activeOpacity={0.88}
          onPress={handleCreateExchange}
          disabled={!exchangeDraft.reason.trim()}
        >
          <Text style={styles.primaryButtonText}>Generate Exchange Invoice</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

function ChoiceChip({
  label,
  active,
  onPress,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      style={[styles.choiceChip, active && styles.choiceChipActive]}
      activeOpacity={0.88}
      onPress={onPress}
    >
      <Text style={[styles.choiceChipText, active && styles.choiceChipTextActive]}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#F4F6FB',
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    backgroundColor: '#F4F6FB',
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1F2430',
    marginBottom: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: '#E8EBF3',
    paddingTop: Platform.OS === 'ios' ? 52 : 36,
    paddingBottom: 14,
    paddingHorizontal: 16,
  },
  backButton: {
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2430',
  },
  content: {
    padding: 16,
    paddingBottom: 40,
  },
  topGrid: {
    gap: 16,
  },
  topGridTablet: {
    flexDirection: 'row',
  },
  panel: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#E8EBF3',
    padding: 16,
    marginBottom: 16,
    ...Shadow.sm,
  },
  panelHalf: {
    flex: 1,
    marginBottom: 0,
  },
  panelTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1F2430',
    marginBottom: 8,
  },
  summaryCustomer: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1F2430',
  },
  summaryText: {
    marginTop: 4,
    fontSize: 12.5,
    color: '#6B7280',
  },
  summaryAmount: {
    marginTop: 10,
    fontSize: 15,
    fontWeight: '700',
    color: Colors.primary,
  },
  sectionTitle: {
    marginTop: 10,
    marginBottom: 10,
    fontSize: 13,
    fontWeight: '700',
    color: '#1F2430',
  },
  choiceWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  choiceChip: {
    minHeight: 38,
    borderRadius: 999,
    paddingHorizontal: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E4E7EF',
  },
  choiceChipActive: {
    backgroundColor: '#EAF2FF',
    borderColor: Colors.primary,
  },
  choiceChipText: {
    fontSize: 12.5,
    color: '#475569',
    fontWeight: '600',
  },
  choiceChipTextActive: {
    color: Colors.primary,
  },
  remarksInput: {
    minHeight: 96,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E4E7EF',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 13,
    color: '#1F2430',
    marginTop: 14,
  },
  priceInput: {
    minHeight: 44,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E4E7EF',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 14,
    fontSize: 13,
    color: '#1F2430',
  },
  secondaryButton: {
    marginTop: 8,
    minHeight: 42,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#CFE0FF',
    backgroundColor: '#F5F9FF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryButtonText: {
    marginLeft: 8,
    fontSize: 13,
    fontWeight: '700',
    color: Colors.primary,
  },
  loadingWrap: {
    minHeight: 42,
    alignItems: 'center',
    justifyContent: 'center',
  },
  settlementCard: {
    marginTop: 2,
    borderRadius: 18,
    backgroundColor: '#FFF7ED',
    borderWidth: 1,
    borderColor: '#F5D2A7',
    padding: 16,
  },
  summaryTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  summaryTitle: {
    marginLeft: 8,
    fontSize: 14,
    fontWeight: '700',
    color: '#9A3412',
  },
  settlementText: {
    fontSize: 12.5,
    color: '#9A3412',
    marginTop: 4,
  },
  settlementValue: {
    marginTop: 10,
    fontSize: 14,
    fontWeight: '800',
    color: '#B45309',
  },
  primaryButton: {
    minHeight: 46,
    borderRadius: 12,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
  },
  primaryButtonDisabled: {
    opacity: 0.5,
  },
  primaryButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
