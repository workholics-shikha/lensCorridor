import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  Image, Platform, Dimensions,
} from 'react-native';
import { router } from 'expo-router';
import { ArrowLeft, Trash2, Plus, Minus, ShoppingBag } from 'lucide-react-native';
import { Colors, Spacing, Radius, FontSize, Shadow } from '@/lib/theme';
import { useCart } from '@/context/CartContext';
import { CartItem } from '@/lib/types';

const { width } = Dimensions.get('window');
const isTablet = width >= 768;

export default function CartScreen() {
  const { cartItems, removeFromCart, updateQuantity, cartTotal } = useCart();

  if (cartItems.length === 0) {
    return (
      <View style={styles.empty}>
        <View style={styles.emptyHeader}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <ArrowLeft size={20} color={Colors.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Your Cart</Text>
          <View style={{ width: 36 }} />
        </View>
        <View style={styles.emptyBody}>
          <ShoppingBag size={64} color={Colors.gray300} />
          <Text style={styles.emptyTitle}>Your cart is empty</Text>
          <Text style={styles.emptyText}>Looks like you haven't added any items yet</Text>
          <TouchableOpacity style={styles.shopBtn} onPress={() => router.push('/(tabs)/products')}>
            <Text style={styles.shopBtnText}>Start Shopping</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const deliveryFee = cartTotal >= 1500 ? 0 : 99;
  const total = cartTotal + deliveryFee;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <ArrowLeft size={20} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Your Cart ({cartItems.length})</Text>
        <View style={{ width: 36 }} />
      </View>

      <FlatList
        data={cartItems}
        keyExtractor={(i) => i.id}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => <CartItemRow item={item} onRemove={removeFromCart} onUpdate={updateQuantity} />}
        ListFooterComponent={
          <View style={styles.summary}>
            <Text style={styles.summaryTitle}>Order Summary</Text>
            <SummaryRow label="Subtotal" value={`₹${cartTotal.toLocaleString('en-IN')}`} />
            <SummaryRow label="Delivery" value={deliveryFee === 0 ? 'FREE' : `₹${deliveryFee}`} valueStyle={deliveryFee === 0 ? { color: Colors.success } : {}} />
            {deliveryFee === 0 && <Text style={styles.freeDeliveryNote}>You qualify for free delivery!</Text>}
            <View style={styles.divider} />
            <SummaryRow label="Total" value={`₹${total.toLocaleString('en-IN')}`} bold />
          </View>
        }
      />

      <View style={styles.checkout}>
        <View>
          <Text style={styles.checkoutTotal}>₹{total.toLocaleString('en-IN')}</Text>
          <Text style={styles.checkoutItems}>{cartItems.length} item{cartItems.length !== 1 ? 's' : ''}</Text>
        </View>
        <TouchableOpacity style={styles.checkoutBtn} onPress={() => router.push('/checkout')} activeOpacity={0.85}>
          <Text style={styles.checkoutBtnText}>Proceed to Checkout</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

function CartItemRow({ item, onRemove, onUpdate }: { item: CartItem; onRemove: (id: string) => void; onUpdate: (id: string, qty: number) => void }) {
  const product = item.products;
  if (!product) return null;
  const price = product.discount_price ?? product.price;

  return (
    <View style={itemStyles.card}>
      <Image
        source={{ uri: product.images?.[0] || 'https://images.pexels.com/photos/701877/pexels-photo-701877.jpeg?auto=compress&cs=tinysrgb&w=300' }}
        style={itemStyles.image}
        resizeMode="cover"
      />
      <View style={itemStyles.info}>
        <Text style={itemStyles.brand}>{product.brand}</Text>
        <Text style={itemStyles.name} numberOfLines={2}>{product.name}</Text>
        <Text style={itemStyles.price}>₹{price.toLocaleString('en-IN')}</Text>
        <View style={itemStyles.qtyRow}>
          <TouchableOpacity style={itemStyles.qtyBtn} onPress={() => onUpdate(item.id, item.quantity - 1)}>
            <Minus size={12} color={Colors.gray600} />
          </TouchableOpacity>
          <Text style={itemStyles.qty}>{item.quantity}</Text>
          <TouchableOpacity style={itemStyles.qtyBtn} onPress={() => onUpdate(item.id, item.quantity + 1)}>
            <Plus size={12} color={Colors.gray600} />
          </TouchableOpacity>
        </View>
      </View>
      <View style={itemStyles.actions}>
        <Text style={itemStyles.subtotal}>₹{(price * item.quantity).toLocaleString('en-IN')}</Text>
        <TouchableOpacity onPress={() => onRemove(item.id)} style={itemStyles.removeBtn}>
          <Trash2 size={16} color={Colors.error} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

function SummaryRow({ label, value, bold, valueStyle }: { label: string; value: string; bold?: boolean; valueStyle?: object }) {
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: Spacing.sm }}>
      <Text style={[{ fontSize: FontSize.md, color: Colors.textSecondary }, bold && { fontWeight: '700', color: Colors.text }]}>{label}</Text>
      <Text style={[{ fontSize: FontSize.md, color: Colors.text, fontWeight: '600' }, bold && { fontWeight: '800', fontSize: FontSize.lg }, valueStyle]}>{value}</Text>
    </View>
  );
}

const itemStyles = StyleSheet.create({
  card: {
    flexDirection: 'row', backgroundColor: Colors.white, borderRadius: Radius.lg,
    marginBottom: Spacing.sm, padding: Spacing.sm, ...Shadow.sm,
  },
  image: { width: 80, height: 80, borderRadius: Radius.md },
  info: { flex: 1, marginLeft: Spacing.sm },
  brand: { fontSize: FontSize.xs, color: Colors.textMuted, fontWeight: '500', textTransform: 'uppercase' },
  name: { fontSize: FontSize.sm, fontWeight: '600', color: Colors.text, marginVertical: 2, lineHeight: 18 },
  price: { fontSize: FontSize.sm, fontWeight: '700', color: Colors.primary, marginBottom: 6 },
  qtyRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  qtyBtn: {
    width: 26, height: 26, borderRadius: 13, backgroundColor: Colors.gray100,
    alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: Colors.border,
  },
  qty: { fontSize: FontSize.md, fontWeight: '700', color: Colors.text, minWidth: 20, textAlign: 'center' },
  actions: { alignItems: 'flex-end', justifyContent: 'space-between' },
  subtotal: { fontSize: FontSize.md, fontWeight: '700', color: Colors.text },
  removeBtn: { padding: 4 },
});

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  empty: { flex: 1, backgroundColor: Colors.background },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: Colors.white, paddingTop: Platform.OS === 'ios' ? 52 : 36,
    paddingBottom: Spacing.md, paddingHorizontal: Spacing.md, ...Shadow.sm,
  },
  emptyHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: Colors.white, paddingTop: Platform.OS === 'ios' ? 52 : 36,
    paddingBottom: Spacing.md, paddingHorizontal: Spacing.md, ...Shadow.sm,
  },
  backBtn: { padding: 4 },
  headerTitle: { fontSize: FontSize.lg, fontWeight: '700', color: Colors.text },
  emptyBody: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: Spacing.xl },
  emptyTitle: { fontSize: FontSize.xl, fontWeight: '700', color: Colors.text, marginTop: Spacing.md, marginBottom: 6 },
  emptyText: { fontSize: FontSize.md, color: Colors.textSecondary, textAlign: 'center', marginBottom: Spacing.lg },
  shopBtn: { backgroundColor: Colors.primary, borderRadius: Radius.md, paddingHorizontal: Spacing.xl, paddingVertical: Spacing.sm + 4 },
  shopBtnText: { color: Colors.white, fontWeight: '700', fontSize: FontSize.md },
  list: { padding: Spacing.md, paddingBottom: 120 },
  summary: { backgroundColor: Colors.white, borderRadius: Radius.lg, padding: Spacing.md, marginTop: Spacing.sm, ...Shadow.sm },
  summaryTitle: { fontSize: FontSize.lg, fontWeight: '700', color: Colors.text, marginBottom: Spacing.md },
  freeDeliveryNote: { fontSize: FontSize.xs, color: Colors.success, fontWeight: '600', marginBottom: Spacing.sm },
  divider: { height: 1, backgroundColor: Colors.border, marginBottom: Spacing.sm },
  checkout: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: Colors.white, padding: Spacing.md,
    paddingBottom: Platform.OS === 'ios' ? 28 : Spacing.md,
    borderTopWidth: 1, borderTopColor: Colors.border, ...Shadow.lg,
  },
  checkoutTotal: { fontSize: FontSize.xl, fontWeight: '800', color: Colors.text },
  checkoutItems: { fontSize: FontSize.sm, color: Colors.textSecondary },
  checkoutBtn: { backgroundColor: Colors.primary, borderRadius: Radius.md, paddingHorizontal: Spacing.xl, paddingVertical: Spacing.sm + 6 },
  checkoutBtnText: { color: Colors.white, fontWeight: '700', fontSize: FontSize.md },
});
