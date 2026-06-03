import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  Platform, Dimensions, ActivityIndicator,
} from 'react-native';
import { useEffect, useState } from 'react';
import { router } from 'expo-router';
import { Package, ChevronRight, ShoppingBag } from 'lucide-react-native';
import { getOrders } from '@/lib/localStore';
import { Order } from '@/lib/types';
import { Colors, Spacing, Radius, FontSize, Shadow } from '@/lib/theme';
import { useAuth } from '@/context/AuthContext';

const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  pending: { bg: '#FEF3C7', text: '#D97706' },
  confirmed: { bg: '#DBEAFE', text: '#1D4ED8' },
  processing: { bg: '#EDE9FE', text: '#7C3AED' },
  shipped: { bg: '#D1FAE5', text: '#065F46' },
  delivered: { bg: '#D1FAE5', text: '#065F46' },
  cancelled: { bg: '#FEE2E2', text: '#B91C1C' },
};

export default function OrdersScreen() {
  const { user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) { setLoading(false); return; }
    setOrders(getOrders(user.id));
    setLoading(false);
  }, [user]);

  if (!user) {
    return (
      <View style={styles.center}>
        <ShoppingBag size={56} color={Colors.gray300} />
        <Text style={styles.emptyTitle}>Sign in to view orders</Text>
        <TouchableOpacity style={styles.signInBtn} onPress={() => router.push('/(auth)/login')}>
          <Text style={styles.signInBtnText}>Sign In</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (loading) return <View style={styles.center}><ActivityIndicator size="large" color={Colors.primary} /></View>;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Orders</Text>
      </View>
      <FlatList
        data={orders}
        keyExtractor={(i) => i.id}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => <OrderCard order={item} />}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Package size={60} color={Colors.gray300} />
            <Text style={styles.emptyTitle}>No orders yet</Text>
            <Text style={styles.emptySub}>Start shopping to see your orders here</Text>
            <TouchableOpacity style={styles.shopBtn} onPress={() => router.push('/(tabs)/products')}>
              <Text style={styles.shopBtnText}>Browse Products</Text>
            </TouchableOpacity>
          </View>
        }
      />
    </View>
  );
}

function OrderCard({ order }: { order: Order }) {
  const statusStyle = STATUS_COLORS[order.status] || STATUS_COLORS.pending;
  const date = new Date(order.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });

  return (
    <View style={cardStyles.card}>
      <View style={cardStyles.topRow}>
        <View>
          <Text style={cardStyles.orderId}>Order #{order.id.slice(-8).toUpperCase()}</Text>
          <Text style={cardStyles.date}>{date}</Text>
        </View>
        <View style={[cardStyles.statusBadge, { backgroundColor: statusStyle.bg }]}>
          <Text style={[cardStyles.statusText, { color: statusStyle.text }]}>
            {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
          </Text>
        </View>
      </View>

      <View style={cardStyles.divider} />

      <View style={cardStyles.itemsRow}>
        {order.order_items?.slice(0, 2).map((item: any) => (
          <Text key={item.id} style={cardStyles.itemName} numberOfLines={1}>
            • {item.products?.name}
          </Text>
        ))}
        {(order.order_items?.length ?? 0) > 2 && (
          <Text style={cardStyles.moreItems}>+{(order.order_items?.length ?? 0) - 2} more</Text>
        )}
      </View>

      <View style={cardStyles.bottomRow}>
        <View>
          <Text style={cardStyles.totalLabel}>Total Amount</Text>
          <Text style={cardStyles.total}>₹{order.total_amount.toLocaleString('en-IN')}</Text>
        </View>
        <View>
          <Text style={cardStyles.payLabel}>Payment</Text>
          <Text style={cardStyles.payMethod}>{order.payment_method === 'cod' ? 'Cash on Delivery' : order.payment_method.toUpperCase()}</Text>
        </View>
      </View>

      {/* Progress Bar */}
      <View style={cardStyles.progressBar}>
        {['confirmed', 'processing', 'shipped', 'delivered'].map((step, idx) => {
          const steps = ['confirmed', 'processing', 'shipped', 'delivered'];
          const currentIdx = steps.indexOf(order.status);
          const active = idx <= currentIdx;
          return (
            <View key={step} style={cardStyles.progressStep}>
              <View style={[cardStyles.progressDot, active && cardStyles.progressDotActive]} />
              {idx < 3 && <View style={[cardStyles.progressLine, active && idx < currentIdx && cardStyles.progressLineActive]} />}
              <Text style={[cardStyles.progressLabel, active && cardStyles.progressLabelActive]}>{step.charAt(0).toUpperCase() + step.slice(1)}</Text>
            </View>
          );
        })}
      </View>
    </View>
  );
}

const cardStyles = StyleSheet.create({
  card: { backgroundColor: Colors.white, borderRadius: Radius.lg, padding: Spacing.md, marginBottom: Spacing.md, ...Shadow.sm },
  topRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  orderId: { fontSize: FontSize.md, fontWeight: '700', color: Colors.text },
  date: { fontSize: FontSize.xs, color: Colors.textMuted, marginTop: 2 },
  statusBadge: { borderRadius: Radius.full, paddingHorizontal: Spacing.sm, paddingVertical: 3 },
  statusText: { fontSize: FontSize.xs, fontWeight: '700' },
  divider: { height: 1, backgroundColor: Colors.border, marginVertical: Spacing.sm },
  itemsRow: { marginBottom: Spacing.sm },
  itemName: { fontSize: FontSize.sm, color: Colors.textSecondary, marginBottom: 2 },
  moreItems: { fontSize: FontSize.xs, color: Colors.primary, fontWeight: '600' },
  bottomRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: Spacing.md },
  totalLabel: { fontSize: FontSize.xs, color: Colors.textMuted },
  total: { fontSize: FontSize.lg, fontWeight: '800', color: Colors.text },
  payLabel: { fontSize: FontSize.xs, color: Colors.textMuted, textAlign: 'right' },
  payMethod: { fontSize: FontSize.sm, fontWeight: '600', color: Colors.text, textAlign: 'right' },
  progressBar: { flexDirection: 'row', alignItems: 'center' },
  progressStep: { flex: 1, alignItems: 'center', position: 'relative' },
  progressDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: Colors.gray300, marginBottom: 4 },
  progressDotActive: { backgroundColor: Colors.primary },
  progressLine: { position: 'absolute', top: 5, left: '55%', right: '-55%', height: 2, backgroundColor: Colors.gray200, zIndex: -1 },
  progressLineActive: { backgroundColor: Colors.primary },
  progressLabel: { fontSize: 9, color: Colors.gray400, textAlign: 'center' },
  progressLabelActive: { color: Colors.primary, fontWeight: '600' },
});

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.background, padding: Spacing.xl },
  header: {
    backgroundColor: Colors.white, paddingTop: Platform.OS === 'ios' ? 52 : 36,
    paddingBottom: Spacing.md, paddingHorizontal: Spacing.md, ...Shadow.sm,
  },
  headerTitle: { fontSize: FontSize.xl, fontWeight: '700', color: Colors.text },
  list: { padding: Spacing.md, paddingBottom: Spacing.xxl },
  empty: { alignItems: 'center', justifyContent: 'center', paddingVertical: Spacing.xxl },
  emptyTitle: { fontSize: FontSize.xl, fontWeight: '700', color: Colors.text, marginTop: Spacing.md, marginBottom: 4 },
  emptySub: { fontSize: FontSize.md, color: Colors.textSecondary, textAlign: 'center', marginBottom: Spacing.lg },
  shopBtn: { backgroundColor: Colors.primary, borderRadius: Radius.md, paddingHorizontal: Spacing.xl, paddingVertical: Spacing.sm + 4 },
  shopBtnText: { color: Colors.white, fontWeight: '700', fontSize: FontSize.md },
  signInBtn: { backgroundColor: Colors.primary, borderRadius: Radius.md, paddingHorizontal: Spacing.xl, paddingVertical: Spacing.sm + 4, marginTop: Spacing.lg },
  signInBtnText: { color: Colors.white, fontWeight: '700', fontSize: FontSize.md },
});
