import { useMemo, useState } from 'react';
import {
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { router } from 'expo-router';
import { ArrowLeft, CircleDollarSign, RotateCcw } from 'lucide-react-native';
import { useOrderFlow } from '@/context/OrderFlowContext';
import { useReturnExchange } from '@/context/ReturnExchangeContext';
import { createReturnExchangeRequest } from '@/lib/api';
import {
  getOriginalItemAmount,
  type RefundType,
  type ReturnExchangeItemScope,
} from '@/lib/returnExchange';
import { Colors, Shadow } from '@/lib/theme';

const RETURN_REASONS = [
  'Damaged Product',
  'Wrong Product',
  'Power Issue',
  'Customer Cancellation',
  'Quality Concern',
];

const ITEM_SCOPES: Array<{ label: string; value: ReturnExchangeItemScope }> = [
  { label: 'Frame', value: 'frame' },
  { label: 'Lens', value: 'lens' },
  { label: 'Full Product', value: 'full-product' },
];

const REFUND_TYPES: Array<{ label: string; value: RefundType }> = [
  { label: 'Original Payment', value: 'original-payment' },
  { label: 'Store Credit', value: 'store-credit' },
  { label: 'Cash', value: 'cash' },
];

export default function ReturnExchangeReturnScreen() {
  const { draft } = useOrderFlow();
  const {
    selectedOrder,
    returnDraft,
    updateReturnDraft,
    setCreatedRecord,
  } = useReturnExchange();
  const [saving, setSaving] = useState(false);
  const [submitError, setSubmitError] = useState('');

  const refundAmount = useMemo(() => (
    selectedOrder ? getOriginalItemAmount(selectedOrder, returnDraft.itemScope) : 0
  ), [returnDraft.itemScope, selectedOrder]);

  if (!selectedOrder) {
    return (
      <View style={styles.center}>
        <Text style={styles.emptyTitle}>No order selected for return.</Text>
        <TouchableOpacity style={styles.primaryButton} onPress={() => router.replace('/return-exchange-search')}>
          <Text style={styles.primaryButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const handleCreateReturn = async () => {
    if (!returnDraft.reason.trim()) {
      return;
    }

    setSaving(true);
    setSubmitError('');

    try {
      const record = await createReturnExchangeRequest({
        type: 'return',
        orderId: selectedOrder.id,
        customerName: selectedOrder.customer.name || 'Customer',
        customerPhone: selectedOrder.customer.phone,
        itemScope: returnDraft.itemScope,
        reason: returnDraft.reason,
        remarks: returnDraft.remarks,
        refundType: returnDraft.refundType,
        originalAmount: refundAmount,
        revisedAmount: 0,
        settlementAmount: refundAmount,
        settlementType: 'refund',
        originalOrderSnapshot: selectedOrder,
        store: draft.store,
        salesperson: draft.salesperson,
      });

      setCreatedRecord(record);
      router.push('/return-exchange-invoice');
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : 'Unable to create return request.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={styles.screen}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()} activeOpacity={0.86}>
          <ArrowLeft size={20} color="#1C1D21" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Return Request</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.summaryCard}>
          <View style={styles.summaryTitleRow}>
            <RotateCcw size={16} color={Colors.primary} />
            <Text style={styles.summaryTitle}>Original Order</Text>
          </View>
          <Text style={styles.summaryCustomer}>{selectedOrder.customer.name || 'Customer'}</Text>
          <Text style={styles.summaryText}>Invoice: {selectedOrder.orderNumber}</Text>
          <Text style={styles.summaryText}>Order ID: {selectedOrder.id}</Text>
          <Text style={styles.summaryAmount}>Return Value: Rs. {refundAmount.toLocaleString('en-IN')}</Text>
        </View>

        <SectionTitle title="Return Reason" />
        <View style={styles.choiceWrap}>
          {RETURN_REASONS.map((reason) => (
            <ChoiceChip
              key={reason}
              label={reason}
              active={returnDraft.reason === reason}
              onPress={() => updateReturnDraft({ reason })}
            />
          ))}
        </View>

        <SectionTitle title="Select Item" />
        <View style={styles.choiceWrap}>
          {ITEM_SCOPES.map((item) => (
            <ChoiceChip
              key={item.value}
              label={item.label}
              active={returnDraft.itemScope === item.value}
              onPress={() => updateReturnDraft({ itemScope: item.value })}
            />
          ))}
        </View>

        <SectionTitle title="Refund Type" />
        <View style={styles.choiceWrap}>
          {REFUND_TYPES.map((item) => (
            <ChoiceChip
              key={item.value}
              label={item.label}
              active={returnDraft.refundType === item.value}
              onPress={() => updateReturnDraft({ refundType: item.value })}
            />
          ))}
        </View>

        <SectionTitle title="Remarks" />
        <TextInput
          value={returnDraft.remarks}
          onChangeText={(remarks) => updateReturnDraft({ remarks })}
          placeholder="Add remarks for the return"
          placeholderTextColor="#9CA3AF"
          multiline
          textAlignVertical="top"
          style={styles.remarksInput}
        />

        <View style={styles.settlementCard}>
          <View style={styles.summaryTitleRow}>
            <CircleDollarSign size={16} color="#B45309" />
            <Text style={styles.summaryTitle}>Refund Summary</Text>
          </View>
          <Text style={styles.settlementText}>
            Refund amount for {returnDraft.itemScope.replace('-', ' ')}: Rs. {refundAmount.toLocaleString('en-IN')}
          </Text>
          <Text style={styles.settlementText}>
            Refund type: {returnDraft.refundType.replace('-', ' ')}
          </Text>
        </View>

        {submitError ? <Text style={styles.errorText}>{submitError}</Text> : null}

        <TouchableOpacity
          style={[styles.primaryButton, !returnDraft.reason.trim() && styles.primaryButtonDisabled]}
          onPress={handleCreateReturn}
          activeOpacity={0.88}
          disabled={!returnDraft.reason.trim() || saving}
        >
          <Text style={styles.primaryButtonText}>{saving ? 'Generating...' : 'Generate Return Invoice'}</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

function SectionTitle({ title }: { title: string }) {
  return <Text style={styles.sectionTitle}>{title}</Text>;
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
  summaryCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#E8EBF3',
    padding: 16,
    ...Shadow.sm,
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
    color: '#1F2430',
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
    marginTop: 18,
    marginBottom: 10,
    fontSize: 14,
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
    minHeight: 120,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E4E7EF',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 13,
    color: '#1F2430',
    ...Shadow.sm,
  },
  settlementCard: {
    marginTop: 18,
    borderRadius: 18,
    backgroundColor: '#FFF7ED',
    borderWidth: 1,
    borderColor: '#F5D2A7',
    padding: 16,
  },
  settlementText: {
    fontSize: 12.5,
    color: '#9A3412',
    marginTop: 4,
  },
  errorText: {
    marginTop: 14,
    fontSize: 12.5,
    color: Colors.error,
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
