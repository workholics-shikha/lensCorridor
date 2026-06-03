import { router } from 'expo-router';
import { ArrowLeft, CheckCircle2 } from 'lucide-react-native';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useOrderFlow } from '@/context/OrderFlowContext';
import { Shadow } from '@/lib/theme';

export default function PaymentSummaryScreen() {
  const { draft, resetDraft } = useOrderFlow();
  const framePrice = Number(draft.price || 0);
  const lensPrice = 1200;
  const coatingPrice = 300;
  const total = framePrice + lensPrice + coatingPrice;

  const handlePlaceOrder = () => {
    resetDraft();
    router.replace({
      pathname: '/order-success',
      params: { orderId: `ord_${Date.now()}` },
    });
  };

  return (
    <View style={styles.screen}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()} activeOpacity={0.8}>
          <ArrowLeft size={20} color="#1C1D21" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Add Lens Details</Text>
      </View>

      <View style={styles.content}>
        <View style={styles.card}>
          <View style={styles.customerRow}>
            <CheckCircle2 size={18} color="#1C71D8" />
            <Text style={styles.customerName}>{draft.customerName || 'Customer order'}</Text>
          </View>

          <AmountRow label="Frame" value={`₹${framePrice.toLocaleString('en-IN')}`} />
          <AmountRow label="Lens" value={`₹${lensPrice.toLocaleString('en-IN')}`} />
          <AmountRow label="Coating" value={`₹${coatingPrice.toLocaleString('en-IN')}`} />
          <AmountRow label="Discount" value="₹0" />

          <View style={styles.divider} />
          <AmountRow label="Total" value={`₹${total.toLocaleString('en-IN')}`} total />
        </View>

        <TouchableOpacity style={styles.placeButton} onPress={handlePlaceOrder} activeOpacity={0.88}>
          <Text style={styles.placeButtonText}>Place order</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

function AmountRow({ label, value, total }: { label: string; value: string; total?: boolean }) {
  return (
    <View style={styles.amountRow}>
      <Text style={[styles.amountLabel, total && styles.totalText]}>{label}</Text>
      <Text style={[styles.amountValue, total && styles.totalText]}>{value}</Text>
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
    padding: 12,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E7E8F0',
    padding: 14,
    ...Shadow.sm,
  },
  customerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  customerName: {
    marginLeft: 8,
    fontSize: 13,
    fontWeight: '700',
    color: '#202128',
  },
  amountRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  amountLabel: {
    fontSize: 12,
    color: '#6F7380',
  },
  amountValue: {
    fontSize: 12,
    color: '#202128',
    fontWeight: '600',
  },
  divider: {
    height: 1,
    backgroundColor: '#ECECF3',
    marginVertical: 6,
  },
  totalText: {
    fontSize: 14,
    color: '#202128',
    fontWeight: '700',
  },
  placeButton: {
    marginTop: 18,
    minHeight: 44,
    borderRadius: 8,
    backgroundColor: '#1C71D8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
});
