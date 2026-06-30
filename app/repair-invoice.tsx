import type { ReactNode } from 'react';
import { router } from 'expo-router';
import {
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from 'react-native';
import { ReceiptText, Wrench } from 'lucide-react-native';
import { useRepair } from '@/context/RepairContext';
import { Colors, Shadow } from '@/lib/theme';

export default function RepairInvoiceScreen() {
  const { width } = useWindowDimensions();
  const isCompact = width < 820;
  const { createdRecord, reset } = useRepair();

  if (!createdRecord) {
    return (
      <View style={styles.center}>
        <Text style={styles.emptyTitle}>No repair invoice found.</Text>
        <TouchableOpacity style={styles.primaryButton} onPress={() => router.replace('/repair-search')}>
          <Text style={styles.primaryButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const createdDate = new Date(createdRecord.createdAt).toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
  const expectedDeliveryDate = createdRecord.expectedDeliveryDate
    ? new Date(createdRecord.expectedDeliveryDate).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    })
    : '-';

  return (
    <View style={styles.screen}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={[styles.sheet, isCompact && styles.sheetCompact]}>
          <View style={[styles.topRow, isCompact && styles.topRowCompact]}>
            <View>
              <Text style={styles.brandTitle}>Lens Corridor</Text>
              <Text style={styles.brandSub}>Retail Repair Desk</Text>
            </View>
            <View style={styles.metaBlock}>
              <Text style={styles.invoiceTitle}>REPAIR INVOICE</Text>
              <Text style={styles.invoiceMeta}>Ref: {createdRecord.referenceNumber}</Text>
              <Text style={styles.invoiceMeta}>Date: {createdDate}</Text>
            </View>
          </View>

          <Section title="Customer & Order">
            <InfoRow label="Customer" value={createdRecord.customerName} />
            <InfoRow label="Mobile" value={createdRecord.customerPhone} />
            <InfoRow label="Original Invoice" value={createdRecord.originalOrderNumber} />
            <InfoRow label="Original Order ID" value={createdRecord.originalOrderId} />
          </Section>

          <Section title="Repair Details">
            <InfoRow label="Repair Scope" value={createdRecord.repairScope.replace('-', ' ')} />
            <InfoRow label="Issue" value={createdRecord.issueType} />
            <InfoRow label="Remarks" value={createdRecord.remarks || '-'} />
            <InfoRow label="Expected Delivery" value={expectedDeliveryDate} />
            <InfoRow label="Status" value={createdRecord.status} />
          </Section>

          <Section title="Amount Summary">
            <AmountRow label="Estimated Amount" value={`Rs. ${createdRecord.estimatedAmount.toLocaleString('en-IN')}`} />
            <AmountRow label="Advance Received" value={`Rs. ${createdRecord.advanceAmount.toLocaleString('en-IN')}`} />
            <AmountRow label="Balance on Delivery" value={`Rs. ${createdRecord.remainingAmount.toLocaleString('en-IN')}`} accent />
          </Section>

          <View style={styles.noteCard}>
            <ReceiptText size={16} color={Colors.primary} />
            <Text style={styles.noteText}>
              Repair requests stay linked to the original order so store staff can track service, estimate, and delivery follow-up cleanly.
            </Text>
          </View>

          <View style={[styles.actionRow, isCompact && styles.actionRowCompact]}>
            <TouchableOpacity
              style={[styles.secondaryButton, isCompact && styles.actionButtonCompact]}
              activeOpacity={0.88}
              onPress={() => router.back()}
            >
              <Text style={styles.secondaryButtonText}>Back</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.primaryButton, isCompact && styles.actionButtonCompact]}
              activeOpacity={0.88}
              onPress={() => {
                reset();
                router.replace('/repair-search');
              }}
            >
              <Wrench size={15} color="#FFFFFF" />
              <Text style={styles.primaryButtonText}>New Repair Ticket</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <View style={styles.sectionBody}>{children}</View>
    </View>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  );
}

function AmountRow({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent?: boolean;
}) {
  return (
    <View style={styles.amountRow}>
      <Text style={styles.amountLabel}>{label}</Text>
      <Text style={[styles.amountValue, accent && styles.amountValueAccent]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#EEF2F8',
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1F2430',
    marginBottom: 16,
  },
  scrollContent: {
    alignItems: 'center',
    padding: 16,
  },
  sheet: {
    width: '100%',
    maxWidth: 820,
    borderRadius: 24,
    backgroundColor: '#FFFFFF',
    padding: 24,
    marginTop: Platform.OS === 'ios' ? 28 : 18,
    ...Shadow.sm,
  },
  sheetCompact: {
    padding: 16,
    borderRadius: 18,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    borderBottomWidth: 1,
    borderBottomColor: '#E4EAF3',
    paddingBottom: 16,
    marginBottom: 18,
  },
  topRowCompact: {
    flexDirection: 'column',
    alignItems: 'flex-start',
  },
  brandTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#0F172A',
  },
  brandSub: {
    marginTop: 4,
    fontSize: 12.5,
    color: '#64748B',
  },
  metaBlock: {
    alignItems: 'flex-end',
  },
  invoiceTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.primary,
    marginBottom: 6,
  },
  invoiceMeta: {
    fontSize: 12.5,
    color: '#475569',
    marginTop: 2,
  },
  section: {
    borderWidth: 1,
    borderColor: '#DEE6F1',
    borderRadius: 14,
    overflow: 'hidden',
    marginBottom: 16,
  },
  sectionTitle: {
    minHeight: 42,
    backgroundColor: '#F8FBFF',
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
  },
  sectionBody: {
    padding: 14,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
    gap: 12,
  },
  infoLabel: {
    flex: 1,
    fontSize: 13,
    color: '#64748B',
  },
  infoValue: {
    flex: 1,
    fontSize: 13,
    textAlign: 'right',
    color: '#0F172A',
    fontWeight: '600',
  },
  amountRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
    gap: 12,
  },
  amountLabel: {
    flex: 1,
    fontSize: 13.5,
    color: '#1E293B',
  },
  amountValue: {
    fontSize: 13.5,
    color: '#1E293B',
    fontWeight: '700',
  },
  amountValueAccent: {
    color: Colors.primary,
  },
  noteCard: {
    borderRadius: 14,
    backgroundColor: '#F5F9FF',
    borderWidth: 1,
    borderColor: '#DCE9FF',
    padding: 14,
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  noteText: {
    flex: 1,
    marginLeft: 10,
    fontSize: 12.5,
    lineHeight: 18,
    color: '#334155',
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 18,
  },
  actionRowCompact: {
    flexDirection: 'column',
    gap: 10,
  },
  actionButtonCompact: {
    width: '100%',
    marginRight: 0,
  },
  secondaryButton: {
    flex: 1,
    minHeight: 42,
    borderRadius: 12,
    backgroundColor: '#EEF1F6',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  secondaryButtonText: {
    fontSize: 13.5,
    fontWeight: '700',
    color: '#1F2430',
  },
  primaryButton: {
    flex: 1,
    minHeight: 42,
    borderRadius: 12,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  primaryButtonText: {
    fontSize: 13.5,
    fontWeight: '700',
    color: '#FFFFFF',
    marginLeft: 8,
  },
});
