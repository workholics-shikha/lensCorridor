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
import { ArrowLeft, BadgeIndianRupee, CalendarClock, Wrench } from 'lucide-react-native';
import { useRepair } from '@/context/RepairContext';
import { createRepairRequest, type RepairScope } from '@/lib/api';
import { Colors, Shadow } from '@/lib/theme';
import { useResponsiveMetrics } from '@/lib/responsive';

const REPAIR_ISSUES = [
  'Frame Alignment',
  'Lens Replacement',
  'Nose Pad Change',
  'Temple Repair',
  'Screw Tightening',
  'General Service',
];

const REPAIR_SCOPES: Array<{ label: string; value: RepairScope }> = [
  { label: 'Frame', value: 'frame' },
  { label: 'Lens', value: 'lens' },
  { label: 'Full Product', value: 'full-product' },
  { label: 'Fitting', value: 'fitting' },
  { label: 'Other', value: 'other' },
];

const parseAmount = (value: string) => {
  const numeric = Number(value || 0);
  return Number.isFinite(numeric) ? numeric : 0;
};

const parseExpectedDeliveryDate = (value: string) => {
  const trimmed = value.trim();
  if (!trimmed) {
    return '';
  }

  const slashMatch = trimmed.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (slashMatch) {
    const [, day, month, year] = slashMatch;
    const parsed = new Date(`${year}-${month}-${day}T00:00:00`);
    return Number.isNaN(parsed.getTime()) ? '' : parsed.toISOString();
  }

  const isoMatch = trimmed.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (isoMatch) {
    const parsed = new Date(`${trimmed}T00:00:00`);
    return Number.isNaN(parsed.getTime()) ? '' : parsed.toISOString();
  }

  return '';
};

export default function RepairRequestScreen() {
  const viewport = useResponsiveMetrics();
  const { selectedOrder, repairDraft, updateRepairDraft, setCreatedRecord } = useRepair();
  const [saving, setSaving] = useState(false);
  const [submitError, setSubmitError] = useState('');

  const estimatedAmount = useMemo(() => parseAmount(repairDraft.estimatedAmount), [repairDraft.estimatedAmount]);
  const advanceAmount = useMemo(() => parseAmount(repairDraft.advanceAmount), [repairDraft.advanceAmount]);
  const remainingAmount = Math.max(0, estimatedAmount - advanceAmount);

  if (!selectedOrder) {
    return (
      <View style={styles.center}>
        <Text style={styles.emptyTitle}>No order selected for repair.</Text>
        <TouchableOpacity style={styles.primaryButton} onPress={() => router.replace('/repair-search')}>
          <Text style={styles.primaryButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const handleCreateRepair = async () => {
    if (!repairDraft.issueType.trim()) {
      setSubmitError('Please choose or enter the repair issue.');
      return;
    }

    if (advanceAmount > estimatedAmount) {
      setSubmitError('Advance amount cannot exceed the estimate.');
      return;
    }

    const expectedDeliveryDate = parseExpectedDeliveryDate(repairDraft.expectedDeliveryDate);
    if (repairDraft.expectedDeliveryDate.trim() && !expectedDeliveryDate) {
      setSubmitError('Use expected delivery date in DD/MM/YYYY or YYYY-MM-DD format.');
      return;
    }

    setSaving(true);
    setSubmitError('');

    try {
      const record = await createRepairRequest({
        orderId: selectedOrder.id,
        customerName: selectedOrder.customer.name || 'Customer',
        customerPhone: selectedOrder.customer.phone,
        repairScope: repairDraft.repairScope,
        issueType: repairDraft.issueType,
        remarks: repairDraft.remarks,
        estimatedAmount,
        advanceAmount,
        expectedDeliveryDate: expectedDeliveryDate || undefined,
        originalOrderSnapshot: selectedOrder,
        store: selectedOrder.meta?.store || null,
        salesperson: selectedOrder.meta?.salesperson || null,
      });

      setCreatedRecord(record);
      router.push('/repair-invoice');
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : 'Unable to create repair request.');
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
        <Text style={styles.headerTitle}>Repair Request</Text>
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.content,
          {
            maxWidth: viewport.contentMaxWidth,
            alignSelf: 'center',
            width: '100%',
            paddingHorizontal: viewport.horizontalPadding,
          },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.summaryCard}>
          <View style={styles.summaryTitleRow}>
            <Wrench size={16} color={Colors.primary} />
            <Text style={styles.summaryTitle}>Original Order</Text>
          </View>
          <Text style={styles.summaryCustomer}>{selectedOrder.customer.name || 'Customer'}</Text>
          <Text style={styles.summaryText}>Invoice: {selectedOrder.orderNumber}</Text>
          <Text style={styles.summaryText}>Order ID: {selectedOrder.id}</Text>
          <Text style={styles.summaryText}>Mobile: {selectedOrder.customer.phone}</Text>
          <Text style={styles.summaryText}>Store: {selectedOrder.meta?.store?.name || 'Store not assigned'}</Text>
        </View>

        <SectionTitle title="Repair Issue" />
        <View style={styles.choiceWrap}>
          {REPAIR_ISSUES.map((issue) => (
            <ChoiceChip
              key={issue}
              label={issue}
              active={repairDraft.issueType === issue}
              onPress={() => updateRepairDraft({ issueType: issue })}
            />
          ))}
        </View>

        <TextInput
          value={repairDraft.issueType}
          onChangeText={(issueType) => updateRepairDraft({ issueType })}
          placeholder="Or type a specific repair issue"
          placeholderTextColor="#9CA3AF"
          style={styles.textInput}
        />

        <SectionTitle title="Repair Scope" />
        <View style={styles.choiceWrap}>
          {REPAIR_SCOPES.map((scope) => (
            <ChoiceChip
              key={scope.value}
              label={scope.label}
              active={repairDraft.repairScope === scope.value}
              onPress={() => updateRepairDraft({ repairScope: scope.value })}
            />
          ))}
        </View>

        <SectionTitle title="Estimated Charges" />
        <View style={styles.amountGrid}>
          <View style={styles.amountField}>
            <Text style={styles.fieldLabel}>Estimated Amount</Text>
            <TextInput
              value={repairDraft.estimatedAmount}
              onChangeText={(estimatedAmount) => updateRepairDraft({ estimatedAmount: estimatedAmount.replace(/[^0-9.]/g, '') })}
              placeholder="0"
              placeholderTextColor="#9CA3AF"
              keyboardType="decimal-pad"
              style={styles.textInput}
            />
          </View>
          <View style={styles.amountField}>
            <Text style={styles.fieldLabel}>Advance Amount</Text>
            <TextInput
              value={repairDraft.advanceAmount}
              onChangeText={(advanceAmount) => updateRepairDraft({ advanceAmount: advanceAmount.replace(/[^0-9.]/g, '') })}
              placeholder="0"
              placeholderTextColor="#9CA3AF"
              keyboardType="decimal-pad"
              style={styles.textInput}
            />
          </View>
        </View>

        <SectionTitle title="Expected Delivery Date" />
        <View style={styles.inlineField}>
          <CalendarClock size={16} color="#6B7280" />
          <TextInput
            value={repairDraft.expectedDeliveryDate}
            onChangeText={(expectedDeliveryDate) => updateRepairDraft({ expectedDeliveryDate })}
            placeholder="DD/MM/YYYY or YYYY-MM-DD"
            placeholderTextColor="#9CA3AF"
            style={styles.inlineInput}
          />
        </View>

        <SectionTitle title="Remarks" />
        <TextInput
          value={repairDraft.remarks}
          onChangeText={(remarks) => updateRepairDraft({ remarks })}
          placeholder="Add repair notes, parts required, or handling instructions"
          placeholderTextColor="#9CA3AF"
          multiline
          textAlignVertical="top"
          style={styles.remarksInput}
        />

        <View style={styles.settlementCard}>
          <View style={styles.summaryTitleRow}>
            <BadgeIndianRupee size={16} color="#B45309" />
            <Text style={styles.summaryTitle}>Repair Summary</Text>
          </View>
          <Text style={styles.settlementText}>Estimated total: Rs. {estimatedAmount.toLocaleString('en-IN')}</Text>
          <Text style={styles.settlementText}>Advance collected: Rs. {advanceAmount.toLocaleString('en-IN')}</Text>
          <Text style={styles.settlementValue}>Balance due on delivery: Rs. {remainingAmount.toLocaleString('en-IN')}</Text>
        </View>

        {submitError ? <Text style={styles.errorText}>{submitError}</Text> : null}

        <TouchableOpacity
          style={[styles.primaryButton, !repairDraft.issueType.trim() && styles.primaryButtonDisabled]}
          onPress={handleCreateRepair}
          activeOpacity={0.88}
          disabled={!repairDraft.issueType.trim() || saving}
        >
          <Text style={styles.primaryButtonText}>{saving ? 'Generating...' : 'Generate Repair Invoice'}</Text>
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
    paddingTop: 16,
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
  textInput: {
    minHeight: 46,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E4E7EF',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 14,
    fontSize: 13,
    color: '#1F2430',
    marginTop: 12,
  },
  amountGrid: {
    gap: 12,
  },
  amountField: {
    flex: 1,
  },
  fieldLabel: {
    fontSize: 12.5,
    fontWeight: '600',
    color: '#475569',
    marginBottom: 8,
  },
  inlineField: {
    minHeight: 46,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E4E7EF',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
  },
  inlineInput: {
    flex: 1,
    marginLeft: 10,
    fontSize: 13,
    color: '#1F2430',
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
  },
  settlementCard: {
    marginTop: 18,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#F5D7B2',
    backgroundColor: '#FFF9F2',
    padding: 16,
    ...Shadow.sm,
  },
  settlementText: {
    marginTop: 4,
    fontSize: 12.5,
    color: '#6B7280',
  },
  settlementValue: {
    marginTop: 10,
    fontSize: 14,
    fontWeight: '700',
    color: '#B45309',
  },
  errorText: {
    marginTop: 14,
    fontSize: 12.5,
    color: Colors.error,
  },
  primaryButton: {
    minHeight: 46,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary,
    marginTop: 18,
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
