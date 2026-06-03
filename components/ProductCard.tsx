import { View, Text, StyleSheet, TouchableOpacity, Image, ViewStyle } from 'react-native';
import { router } from 'expo-router';
import { Heart, Star } from 'lucide-react-native';
import { Product } from '@/lib/types';
import { Colors, Spacing, Radius, FontSize, Shadow } from '@/lib/theme';
import { useCart } from '@/context/CartContext';

interface Props {
  product: Product;
  style?: ViewStyle;
}

export default function ProductCard({ product, style }: Props) {
  const { toggleWishlist, isWishlisted } = useCart();
  const wishlisted = isWishlisted(product.id);
  const discount = product.discount_price && product.price
    ? Math.round((1 - product.discount_price / product.price) * 100)
    : 0;

  return (
    <TouchableOpacity
      style={[styles.card, style]}
      onPress={() => router.push({ pathname: '/product/[id]', params: { id: product.id } })}
      activeOpacity={0.9}
    >
      <View style={styles.imageContainer}>
        <Image
          source={{ uri: product.images?.[0] || 'https://images.pexels.com/photos/701877/pexels-photo-701877.jpeg?auto=compress&cs=tinysrgb&w=400' }}
          style={styles.image}
          resizeMode="cover"
        />
        {discount > 0 && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{discount}% OFF</Text>
          </View>
        )}
        <TouchableOpacity
          style={styles.wishlistBtn}
          onPress={() => toggleWishlist(product.id)}
          hitSlop={{ top: 8, right: 8, bottom: 8, left: 8 }}
        >
          <Heart
            size={16}
            color={wishlisted ? Colors.error : Colors.gray400}
            fill={wishlisted ? Colors.error : 'transparent'}
          />
        </TouchableOpacity>
      </View>
      <View style={styles.info}>
        <Text style={styles.brand}>{product.brand}</Text>
        <Text style={styles.name} numberOfLines={2}>{product.name}</Text>
        <View style={styles.ratingRow}>
          <Star size={11} color={Colors.accent} fill={Colors.accent} />
          <Text style={styles.rating}>{product.rating?.toFixed(1)}</Text>
          <Text style={styles.reviews}>({product.review_count})</Text>
        </View>
        <View style={styles.priceRow}>
          <Text style={styles.price}>
            ₹{(product.discount_price ?? product.price).toLocaleString('en-IN')}
          </Text>
          {product.discount_price && (
            <Text style={styles.originalPrice}>₹{product.price.toLocaleString('en-IN')}</Text>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.white,
    borderRadius: Radius.lg,
    overflow: 'hidden',
    ...Shadow.sm,
  },
  imageContainer: {
    height: 140,
    backgroundColor: Colors.gray50,
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  badge: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: Colors.primary,
    borderRadius: Radius.sm,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  badgeText: {
    color: Colors.white,
    fontSize: 9,
    fontWeight: '700',
  },
  wishlistBtn: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: Colors.white,
    borderRadius: Radius.full,
    padding: 5,
    ...Shadow.sm,
  },
  info: {
    padding: Spacing.sm,
  },
  brand: {
    fontSize: FontSize.xs,
    color: Colors.textMuted,
    fontWeight: '500',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  name: {
    fontSize: FontSize.sm,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 4,
    lineHeight: 18,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    marginBottom: 4,
  },
  rating: {
    fontSize: FontSize.xs,
    fontWeight: '600',
    color: Colors.gray700,
  },
  reviews: {
    fontSize: FontSize.xs,
    color: Colors.textMuted,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  price: {
    fontSize: FontSize.md,
    fontWeight: '700',
    color: Colors.text,
  },
  originalPrice: {
    fontSize: FontSize.xs,
    color: Colors.textMuted,
    textDecorationLine: 'line-through',
  },
});
