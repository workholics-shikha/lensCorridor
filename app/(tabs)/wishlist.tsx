import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  Platform, useWindowDimensions,
} from 'react-native';
import { router } from 'expo-router';
import { Heart } from 'lucide-react-native';
import { Colors, Spacing, Radius, FontSize, Shadow } from '@/lib/theme';
import { useCart } from '@/context/CartContext';
import { useAuth } from '@/context/AuthContext';
import ProductCard from '@/components/ProductCard';
import { useTabScreenBottomSpace } from '@/lib/tabBar';
import { useResponsiveMetrics } from '@/lib/responsive';

export default function WishlistScreen() {
  const { width } = useWindowDimensions();
  const viewport = useResponsiveMetrics();
  const { wishlistItems } = useCart();
  const { user } = useAuth();
  const bottomSafeSpace = useTabScreenBottomSpace(viewport.isTablet ? 28 : 20);
  const numColumns = viewport.isTabletLandscape ? 4 : viewport.isTablet ? 3 : 2;
  const cardGap = viewport.isTablet ? Spacing.md : Spacing.sm;
  const cardWidth = Math.max(
    0,
    (Math.min(width - (viewport.horizontalPadding * 2), viewport.contentMaxWidth) - (cardGap * (numColumns - 1))) / numColumns
  );

  if (!user) {
    return (
      <View style={styles.center}>
        <Heart size={56} color={Colors.gray300} />
        <Text style={styles.emptyTitle}>Your wishlist is empty</Text>
        <TouchableOpacity style={styles.signInBtn} onPress={() => router.push('/(tabs)')}>
          <Text style={styles.signInBtnText}>Go to Home</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const products = wishlistItems.map(i => i.products).filter(Boolean) as any[];

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Wishlist</Text>
        {wishlistItems.length > 0 && (
          <Text style={styles.count}>{wishlistItems.length} item{wishlistItems.length !== 1 ? 's' : ''}</Text>
        )}
      </View>

      <FlatList
        data={products}
        keyExtractor={(i) => i.id}
        numColumns={numColumns}
        key={`wishlist-${numColumns}`}
        contentContainerStyle={[
          styles.list,
          {
            paddingHorizontal: viewport.horizontalPadding,
            paddingBottom: bottomSafeSpace,
            maxWidth: viewport.contentMaxWidth,
            alignSelf: 'center',
            width: '100%',
          },
        ]}
        columnWrapperStyle={numColumns > 1 ? [styles.row, { gap: cardGap, marginBottom: cardGap }] : undefined}
        renderItem={({ item }) => <ProductCard product={item} style={{ width: cardWidth }} />}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Heart size={64} color={Colors.gray200} />
            <Text style={styles.emptyTitle}>Your wishlist is empty</Text>
            <Text style={styles.emptySub}>Save items you love to find them easily later</Text>
            <TouchableOpacity style={styles.browseBtn} onPress={() => router.push('/(tabs)')}>
              <Text style={styles.browseBtnText}>Go to Home</Text>
            </TouchableOpacity>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.background, padding: Spacing.xl },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: Colors.white, paddingTop: Platform.OS === 'ios' ? 52 : 36,
    paddingBottom: Spacing.md, paddingHorizontal: Spacing.md, ...Shadow.sm,
  },
  headerTitle: { fontSize: FontSize.xl, fontWeight: '700', color: Colors.text },
  count: { fontSize: FontSize.sm, fontWeight: '600', color: Colors.textSecondary },
  list: { paddingTop: Spacing.md },
  row: {},
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: Spacing.xxl },
  emptyTitle: { fontSize: FontSize.xl, fontWeight: '700', color: Colors.text, marginTop: Spacing.md, marginBottom: 4 },
  emptySub: { fontSize: FontSize.md, color: Colors.textSecondary, textAlign: 'center', marginBottom: Spacing.lg },
  browseBtn: { backgroundColor: Colors.primary, borderRadius: Radius.md, paddingHorizontal: Spacing.xl, paddingVertical: Spacing.sm + 4 },
  browseBtnText: { color: Colors.white, fontWeight: '700', fontSize: FontSize.md },
  signInBtn: { backgroundColor: Colors.primary, borderRadius: Radius.md, paddingHorizontal: Spacing.xl, paddingVertical: Spacing.sm + 4, marginTop: Spacing.lg },
  signInBtnText: { color: Colors.white, fontWeight: '700', fontSize: FontSize.md },
});
