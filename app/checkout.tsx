import { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, Platform, Dimensions,
} from 'react-native';
import { router } from 'expo-router';
import { ArrowLeft, MapPin, CreditCard, Banknote, ChevronRight } from 'lucide-react-native';
import { supabase } from '@/lib/supabase';
import { Colors, Spacing, Radius, FontSize, Shadow } from '@/lib/theme';
import { useCart } from '@/context/CartContext';
import { useAuth } from '@/context/AuthContext';

const { width } = Dimensions.get('window');
const isTablet = width >= 768;

type PaymentMethod = 'cod' | 'online' | 'upi';

export default function CheckoutScreen() {
  const { cartItems, cartTotal, refreshCart } = useCart();
  const { user } = useAuth();

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [line1, setLine1] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [pincode, setPincode] = useState('');
  const [payment, setPayment] = useState<PaymentMethod>('cod');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const deliveryFee = cartTotal >= 1500 ? 0 : 99;
  const total = cartTotal + deliveryFee;

  const handlePlaceOrder = async () => {
    if (!user) { router.push('/(auth)/login'); return; }
    if (!name || !phone || !line1 || !city || !state || !pincode) {
      setError('Please fill all address fields'); return;
    }
    setLoading(true);
    setError('');

    const { data: order, error: orderErr } = await supabase.from('orders').insert({
      user_id: user.id,
      status: 'confirmed',
      total_amount: total,
      shipping_address: { name, phone, line1, city, state, pincode },
      payment_method: payment,
      payment_status: payment === 'cod' ? 'pending' : 'paid',
    }).select().maybeSingle();

    if (orderErr || !order) { setLoading(false); setError('Failed to place order. Try again.'); return; }

    const orderItems = cartItems.map(item => ({
      order_id: order.id,
      product_id: item.product_id,
      quantity: item.quantity,
      unit_price: item.products?.discount_price ?? item.products?.price ?? 0,
    }));

    await supabase.from('order_items').insert(orderItems);
    // Clear cart
    for (const item of cartItems) {
      await supabase.from('cart_items').delete().eq('id', item.id);
    }
    await refreshCart();
    setLoading(false);
    router.replace({ pathname: '/order-success', params: { orderId: order.id } });
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <ArrowLeft size={20} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Checkout</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
        <View style={[styles.maxWidth, isTablet && styles.maxWidthTablet]}>
          {/* Delivery Address */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <MapPin size={18} color={Colors.primary} />
              <Text style={styles.sectionTitle}>Delivery Address</Text>
            </View>
            {error ? <View style={styles.errorBox}><Text style={styles.errorText}>{error}</Text></View> : null}
            <Field label="Full Name" value={name} onChangeText={setName} placeholder="Recipient name" />
            <Field label="Phone Number" value={phone} onChangeText={setPhone} placeholder="+91 98765 43210" keyboardType="phone-pad" />
            <Field label="Address Line" value={line1} onChangeText={setLine1} placeholder="House/Flat, Street, Area" />
            <View style={styles.row2}>
              <View style={{ flex: 1 }}>
                <Field label="City" value={city} onChangeText={setCity} placeholder="City" />
              </View>
              <View style={{ flex: 1 }}>
                <Field label="State" value={state} onChangeText={setState} placeholder="State" />
              </View>
            </View>
            <Field label="PIN Code" value={pincode} onChangeText={setPincode} placeholder="6-digit PIN" keyboardType="numeric" maxLength={6} />
          </View>

          {/* Payment Method */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <CreditCard size={18} color={Colors.primary} />
              <Text style={styles.sectionTitle}>Payment Method</Text>
            </View>
            {([
              { key: 'cod', label: 'Cash on Delivery', sub: 'Pay when you receive', icon: <Banknote size={20} color={Colors.success} /> },
              { key: 'upi', label: 'UPI Payment', sub: 'GPay, PhonePe, Paytm', icon: <CreditCard size={20} color={Colors.primary} /> },
              { key: 'online', label: 'Credit / Debit Card', sub: 'Visa, Mastercard, RuPay', icon: <CreditCard size={20} color={Colors.accent} /> },
            ] as const).map(opt => (
              <TouchableOpacity
                key={opt.key}
                style={[styles.paymentOption, payment === opt.key && styles.paymentOptionActive]}
                onPress={() => setPayment(opt.key)}
              >
                {opt.icon}
                <View style={{ flex: 1, marginLeft: Spacing.sm }}>
                  <Text style={[styles.paymentLabel, payment === opt.key && { color: Colors.primary }]}>{opt.label}</Text>
                  <Text style={styles.paymentSub}>{opt.sub}</Text>
                </View>
                <View style={[styles.radio, payment === opt.key && styles.radioActive]}>
                  {payment === opt.key && <View style={styles.radioDot} />}
                </View>
              </TouchableOpacity>
            ))}
          </View>

          {/* Order Summary */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Order Summary</Text>
            <SummaryRow label={`Subtotal (${cartItems.length} items)`} value={`₹${cartTotal.toLocaleString('en-IN')}`} />
            <SummaryRow label="Delivery" value={deliveryFee === 0 ? 'FREE' : `₹${deliveryFee}`} valueColor={deliveryFee === 0 ? Colors.success : undefined} />
            <View style={styles.divider} />
            <SummaryRow label="Total Amount" value={`₹${total.toLocaleString('en-IN')}`} bold />
          </View>
        </View>
      </ScrollView>

      <View style={styles.bottom}>
        <View>
          <Text style={styles.totalLabel}>Total</Text>
          <Text style={styles.totalAmount}>₹{total.toLocaleString('en-IN')}</Text>
        </View>
        <TouchableOpacity
          style={[styles.placeOrderBtn, loading && { opacity: 0.65 }]}
          onPress={handlePlaceOrder}
          disabled={loading}
          activeOpacity={0.85}
        >
          <Text style={styles.placeOrderText}>{loading ? 'Placing Order...' : 'Place Order'}</Text>
          <ChevronRight size={18} color={Colors.white} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

function Field({ label, value, onChangeText, placeholder, keyboardType, maxLength }: any) {
  return (
    <View style={fieldStyles.group}>
      <Text style={fieldStyles.label}>{label}</Text>
      <TextInput
        style={fieldStyles.input}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={Colors.gray400}
        keyboardType={keyboardType}
        maxLength={maxLength}
      />
    </View>
  );
}

function SummaryRow({ label, value, bold, valueColor }: { label: string; value: string; bold?: boolean; valueColor?: string }) {
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: Spacing.sm }}>
      <Text style={{ fontSize: FontSize.sm, color: Colors.textSecondary }}>{label}</Text>
      <Text style={{ fontWeight: bold ? '800' : '600', color: valueColor ?? Colors.text, fontSize: bold ? FontSize.md : FontSize.sm }}>{value}</Text>
    </View>
  );
}

const fieldStyles = StyleSheet.create({
  group: { marginBottom: Spacing.sm },
  label: { fontSize: FontSize.xs, fontWeight: '600', color: Colors.gray700, marginBottom: 4 },
  input: {
    backgroundColor: Colors.gray50, borderRadius: Radius.md,
    borderWidth: 1, borderColor: Colors.border,
    paddingHorizontal: Spacing.sm, paddingVertical: Spacing.sm,
    fontSize: FontSize.md, color: Colors.text,
  },
});

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: Colors.white, paddingTop: Platform.OS === 'ios' ? 52 : 36,
    paddingBottom: Spacing.md, paddingHorizontal: Spacing.md, ...Shadow.sm,
  },
  backBtn: { padding: 4 },
  headerTitle: { fontSize: FontSize.lg, fontWeight: '700', color: Colors.text },
  body: { padding: Spacing.md, paddingBottom: 120, alignItems: isTablet ? 'center' : undefined },
  maxWidth: { width: '100%' },
  maxWidthTablet: { maxWidth: 600 },
  section: { backgroundColor: Colors.white, borderRadius: Radius.lg, padding: Spacing.md, marginBottom: Spacing.md, ...Shadow.sm },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginBottom: Spacing.md },
  sectionTitle: { fontSize: FontSize.lg, fontWeight: '700', color: Colors.text },
  row2: { flexDirection: 'row', gap: Spacing.sm },
  errorBox: { backgroundColor: '#FEE2E2', borderRadius: Radius.md, padding: Spacing.sm, marginBottom: Spacing.sm },
  errorText: { color: Colors.error, fontSize: FontSize.sm },
  paymentOption: {
    flexDirection: 'row', alignItems: 'center',
    borderWidth: 1.5, borderColor: Colors.border, borderRadius: Radius.md,
    padding: Spacing.sm + 2, marginBottom: Spacing.sm,
  },
  paymentOptionActive: { borderColor: Colors.primary, backgroundColor: Colors.primaryLight },
  paymentLabel: { fontSize: FontSize.md, fontWeight: '600', color: Colors.text },
  paymentSub: { fontSize: FontSize.xs, color: Colors.textMuted, marginTop: 1 },
  radio: { width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: Colors.gray300, alignItems: 'center', justifyContent: 'center' },
  radioActive: { borderColor: Colors.primary },
  radioDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: Colors.primary },
  divider: { height: 1, backgroundColor: Colors.border, marginBottom: Spacing.sm },
  bottom: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: Colors.white, padding: Spacing.md,
    paddingBottom: Platform.OS === 'ios' ? 28 : Spacing.md,
    borderTopWidth: 1, borderTopColor: Colors.border, ...Shadow.lg,
  },
  totalLabel: { fontSize: FontSize.xs, color: Colors.textMuted },
  totalAmount: { fontSize: FontSize.xl, fontWeight: '800', color: Colors.text },
  placeOrderBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: Colors.primary, borderRadius: Radius.md,
    paddingHorizontal: Spacing.xl, paddingVertical: Spacing.sm + 6,
  },
  placeOrderText: { color: Colors.white, fontWeight: '700', fontSize: FontSize.md },
});
