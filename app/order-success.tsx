import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { CheckCircle, ShoppingBag, Home } from 'lucide-react-native';
import { Colors, Spacing, Radius, FontSize, Shadow } from '@/lib/theme';

export default function OrderSuccessScreen() {
  const { orderId } = useLocalSearchParams<{ orderId: string }>();

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <View style={styles.iconCircle}>
          <CheckCircle size={60} color={Colors.success} />
        </View>
        <Text style={styles.title}>Order Placed!</Text>
        <Text style={styles.subtitle}>Your order has been successfully placed and is being processed.</Text>
        {orderId && (
          <View style={styles.orderIdBox}>
            <Text style={styles.orderIdLabel}>Order ID</Text>
            <Text style={styles.orderId}>#{orderId.slice(-8).toUpperCase()}</Text>
          </View>
        )}
        <Text style={styles.eta}>Estimated delivery: 3-5 business days</Text>
        <TouchableOpacity style={styles.trackBtn} onPress={() => router.replace('/(tabs)/orders')}>
          <ShoppingBag size={18} color={Colors.white} />
          <Text style={styles.trackBtnText}>Track Order</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.homeBtn} onPress={() => router.replace('/(tabs)')}>
          <Home size={16} color={Colors.primary} />
          <Text style={styles.homeBtnText}>Back to Home</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1, backgroundColor: Colors.background,
    alignItems: 'center', justifyContent: 'center', padding: Spacing.xl,
  },
  card: {
    backgroundColor: Colors.white, borderRadius: Radius.xl,
    padding: Spacing.xl, alignItems: 'center', width: '100%', maxWidth: 420, ...Shadow.lg,
  },
  iconCircle: {
    width: 100, height: 100, borderRadius: 50,
    backgroundColor: '#DCFCE7', alignItems: 'center', justifyContent: 'center', marginBottom: Spacing.lg,
  },
  title: { fontSize: FontSize.xxl, fontWeight: '800', color: Colors.text, marginBottom: 8 },
  subtitle: { fontSize: FontSize.md, color: Colors.textSecondary, textAlign: 'center', lineHeight: 22, marginBottom: Spacing.lg },
  orderIdBox: {
    backgroundColor: Colors.gray50, borderRadius: Radius.md,
    paddingHorizontal: Spacing.lg, paddingVertical: Spacing.sm, marginBottom: Spacing.md, alignItems: 'center',
  },
  orderIdLabel: { fontSize: FontSize.xs, color: Colors.textMuted, marginBottom: 2 },
  orderId: { fontSize: FontSize.lg, fontWeight: '700', color: Colors.text, letterSpacing: 1.5 },
  eta: { fontSize: FontSize.sm, color: Colors.textMuted, marginBottom: Spacing.xl },
  trackBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: Colors.primary, borderRadius: Radius.md,
    paddingHorizontal: Spacing.xl, paddingVertical: Spacing.sm + 6, marginBottom: Spacing.sm, width: '100%', justifyContent: 'center',
  },
  trackBtnText: { color: Colors.white, fontWeight: '700', fontSize: FontSize.md },
  homeBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    borderWidth: 1, borderColor: Colors.border, borderRadius: Radius.md,
    paddingHorizontal: Spacing.xl, paddingVertical: Spacing.sm + 4, width: '100%', justifyContent: 'center',
  },
  homeBtnText: { color: Colors.primary, fontWeight: '600', fontSize: FontSize.md },
});
