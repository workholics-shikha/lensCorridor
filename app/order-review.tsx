import { router } from 'expo-router';
import { ArrowLeft } from 'lucide-react-native';
import { Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useOrderFlow } from '@/context/OrderFlowContext';
import { getOrderAmounts } from '@/lib/orderPricing';
import { Shadow } from '@/lib/theme';

export default function OrderReviewScreen() {
  const { draft } = useOrderFlow();
  const primaryFrame = draft.frameImages[0];
  const { framePrice, lensPrice, discount, totalPayable, paidAmount, remainingAmount } = getOrderAmounts(draft);

  return (
    <View style={styles.screen}>
      <Header title="Order Review" />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.summaryCard}>
          <View style={styles.frameCard}>
            {primaryFrame?.image ? (
              <Image source={{ uri: primaryFrame.image }} resizeMode="contain" style={styles.frameImage} />
            ) : (
              <View style={styles.frameFallback} />
            )}
          </View>

          <View style={styles.summaryBody}>
            <Text style={styles.summaryTitle}>{draft.customerName || 'Customer order details'}</Text>
            <Text style={styles.summaryMeta}>Mobile: {draft.phone || 'Not added'}</Text>
            <Text style={styles.summaryMeta}>Lens: {draft.lensSelection.lensType || draft.lensSelection.powerType}</Text>
            <Text style={styles.summaryMeta}>Category: {draft.lensSelection.lensCategory || 'Not selected'}</Text>
          </View>
        </View>

        <View style={styles.billCard}>
          <Row label="Frame Price" value={`Rs. ${framePrice.toLocaleString('en-IN')}`} />
          <Row label="Lens Charges" value={`Rs. ${lensPrice.toLocaleString('en-IN')}`} />
          <Row label="Discount" value={`Rs. ${discount.toLocaleString('en-IN')}`} />
          <Row label="Paid Now" value={`Rs. ${paidAmount.toLocaleString('en-IN')}`} />
          {remainingAmount > 0 ? (
            <Row label="Remaining Amount" value={`Rs. ${remainingAmount.toLocaleString('en-IN')}`} />
          ) : null}
          <View style={styles.divider} />
          <Row label="Grand Total" value={`Rs. ${totalPayable.toLocaleString('en-IN')}`} bold />
        </View>

        <TouchableOpacity style={styles.primaryButton} onPress={() => router.push('/payment-summary')} activeOpacity={0.88}>
          <Text style={styles.primaryButtonText}>Save and Continue to payment</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

function Header({ title }: { title: string }) {
  return (
    <View style={styles.header}>
      <TouchableOpacity style={styles.backButton} onPress={() => router.back()} activeOpacity={0.8}>
        <ArrowLeft size={20} color="#1C1D21" />
      </TouchableOpacity>
      <Text style={styles.headerTitle}>{title}</Text>
    </View>
  );
}

function Row({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  return (
    <View style={styles.row}>
      <Text style={[styles.rowLabel, bold && styles.rowBold]}>{label}</Text>
      <Text style={[styles.rowValue, bold && styles.rowBold]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#F8F8FD',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#ECECF3',
    paddingTop: 44,
    paddingBottom: 14,
    paddingHorizontal: 14,
  },
  backButton: {
    width: 30,
    height: 30,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '500',
    color: '#202128',
  },
  content: {
    paddingHorizontal: 12,
    paddingTop: 14,
    paddingBottom: 40,
  },
  summaryCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E7E8F0',
    padding: 14,
    flexDirection: 'row',
    ...Shadow.sm,
  },
  frameCard: {
    width: 96,
    height: 72,
    borderRadius: 12,
    backgroundColor: '#F7F7FA',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  frameImage: {
    width: 88,
    height: 64,
  },
  frameFallback: {
    width: 72,
    height: 44,
    borderWidth: 3,
    borderRadius: 14,
    borderColor: '#1C1D21',
  },
  summaryBody: {
    flex: 1,
    marginLeft: 12,
  },
  summaryTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#202128',
    marginBottom: 6,
  },
  summaryMeta: {
    fontSize: 12,
    color: '#6F7380',
    marginTop: 2,
  },
  billCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E7E8F0',
    padding: 14,
    marginTop: 12,
    ...Shadow.sm,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  rowLabel: {
    fontSize: 12,
    color: '#6F7380',
  },
  rowValue: {
    fontSize: 12,
    color: '#202128',
    fontWeight: '600',
  },
  rowBold: {
    fontSize: 13,
    color: '#202128',
    fontWeight: '700',
  },
  divider: {
    height: 1,
    backgroundColor: '#ECECF3',
    marginBottom: 10,
  },
  primaryButton: {
    marginTop: 18,
    minHeight: 44,
    borderRadius: 8,
    backgroundColor: '#1C71D8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
});
