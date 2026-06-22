import { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Image, Platform, ActivityIndicator, useWindowDimensions,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { ArrowLeft, Heart, ShoppingCart, Star, Shield, Truck, RotateCcw, ChevronRight } from 'lucide-react-native';
import { getProductById } from '@/lib/localStore';
import { Product } from '@/lib/types';
import { Colors, Spacing, Radius, FontSize, Shadow } from '@/lib/theme';
import { useCart } from '@/context/CartContext';
import { useResponsiveMetrics } from '@/lib/responsive';

export default function ProductDetailScreen() {
  const { width } = useWindowDimensions();
  const viewport = useResponsiveMetrics();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(0);
  const [adding, setAdding] = useState(false);
  const { addToCart, toggleWishlist, isWishlisted } = useCart();

  useEffect(() => {
    if (!id) return;
    setProduct(getProductById(id));
    setLoading(false);
  }, [id]);

  const handleAddToCart = async () => {
    if (!product) return;
    setAdding(true);
    await addToCart(product.id);
    setAdding(false);
  };

  const handleBuyNow = async () => {
    if (!product) return;
    await addToCart(product.id);
    router.push('/cart');
  };

  if (loading) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  if (!product) {
    return (
      <View style={styles.loader}>
        <Text style={{ color: Colors.textSecondary }}>Product not found</Text>
      </View>
    );
  }

  const wishlisted = isWishlisted(product.id);
  const finalPrice = product.discount_price ?? product.price;
  const discount = product.discount_price ? Math.round((1 - product.discount_price / product.price) * 100) : 0;
  const images = product.images?.length ? product.images : ['https://images.pexels.com/photos/701877/pexels-photo-701877.jpeg?auto=compress&cs=tinysrgb&w=800'];
  const galleryHeight = viewport.isTablet
    ? Math.min(Math.max(width * (viewport.isLandscape ? 0.34 : 0.42), 340), viewport.isExtraLargeTablet ? 500 : 440)
    : 320;

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Image Gallery */}
        <View style={[styles.gallery, { height: galleryHeight }]}>
          <Image source={{ uri: images[selectedImage] }} style={styles.mainImage} resizeMode="cover" />
          {/* Header Overlay */}
          <View style={styles.galleryHeader}>
            <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
              <ArrowLeft size={20} color={Colors.text} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.wishBtn} onPress={() => toggleWishlist(product.id)}>
              <Heart size={20} color={wishlisted ? Colors.error : Colors.gray600} fill={wishlisted ? Colors.error : 'transparent'} />
            </TouchableOpacity>
          </View>
          {discount > 0 && (
            <View style={styles.discountTag}>
              <Text style={styles.discountTagText}>{discount}% OFF</Text>
            </View>
          )}
          {/* Thumbnails */}
          {images.length > 1 && (
            <View style={styles.thumbnails}>
              {images.map((img, idx) => (
                <TouchableOpacity
                  key={idx}
                  style={[styles.thumb, selectedImage === idx && styles.thumbActive]}
                  onPress={() => setSelectedImage(idx)}
                >
                  <Image source={{ uri: img }} style={styles.thumbImage} resizeMode="cover" />
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        {/* Product Info */}
        <View style={[
          styles.infoSection,
          viewport.isTablet && styles.infoSectionTablet,
          {
            paddingHorizontal: viewport.horizontalPadding,
            alignSelf: 'center',
            width: '100%',
            maxWidth: viewport.contentMaxWidth,
          },
        ]}>
          <View style={styles.brandRow}>
            <Text style={styles.brand}>{product.brand}</Text>
            {product.categories?.name && (
              <View style={styles.categoryChip}>
                <Text style={styles.categoryChipText}>{product.categories.name}</Text>
              </View>
            )}
          </View>
          <Text style={[styles.productName, viewport.isTablet && styles.productNameTablet]}>{product.name}</Text>

          {/* Rating */}
          <View style={styles.ratingRow}>
            {[1,2,3,4,5].map(i => (
              <Star key={i} size={14} color={i <= Math.round(product.rating) ? Colors.accent : Colors.gray300} fill={i <= Math.round(product.rating) ? Colors.accent : 'transparent'} />
            ))}
            <Text style={styles.ratingText}>{product.rating?.toFixed(1)}</Text>
            <Text style={styles.reviewCount}>({product.review_count} reviews)</Text>
          </View>

          {/* Price */}
          <View style={styles.priceSection}>
            <Text style={styles.finalPrice}>₹{finalPrice.toLocaleString('en-IN')}</Text>
            {product.discount_price && (
              <>
                <Text style={styles.originalPrice}>₹{product.price.toLocaleString('en-IN')}</Text>
                <Text style={styles.savings}>Save ₹{(product.price - product.discount_price).toLocaleString('en-IN')}</Text>
              </>
            )}
          </View>

          {/* Specs */}
          <View style={styles.specsCard}>
            <Text style={styles.specsTitle}>Frame Details</Text>
            <View style={styles.specsGrid}>
              {product.frame_material && <SpecItem label="Material" value={product.frame_material} />}
              {product.frame_color && <SpecItem label="Color" value={product.frame_color} />}
              {product.lens_type && <SpecItem label="Lens Type" value={product.lens_type} />}
              {product.gender && <SpecItem label="Gender" value={product.gender.charAt(0).toUpperCase() + product.gender.slice(1)} />}
            </View>
          </View>

          {/* Description */}
          {product.description && (
            <View style={styles.descSection}>
              <Text style={styles.descTitle}>About This Product</Text>
              <Text style={styles.descText}>{product.description}</Text>
            </View>
          )}

          {/* Prescription Upload */}
          <TouchableOpacity style={styles.prescriptionBanner} onPress={() => router.push('/prescription')}>
            <View style={styles.prescriptionLeft}>
              <Text style={styles.prescriptionTitle}>Have a Prescription?</Text>
              <Text style={styles.prescriptionSub}>Upload your power for accurate lenses</Text>
            </View>
            <ChevronRight size={18} color={Colors.primary} />
          </TouchableOpacity>

          {/* Trust Badges */}
          <View style={styles.trustRow}>
            <TrustItem icon={<Truck size={16} color={Colors.primary} />} text="Free Delivery" />
            <TrustItem icon={<RotateCcw size={16} color={Colors.primary} />} text="14-Day Returns" />
            <TrustItem icon={<Shield size={16} color={Colors.primary} />} text="Authentic" />
          </View>
        </View>
      </ScrollView>

      {/* Bottom CTA */}
      <View style={styles.bottomCTA}>
        <TouchableOpacity style={styles.addCartBtn} onPress={handleAddToCart} disabled={adding} activeOpacity={0.85}>
          <ShoppingCart size={18} color={Colors.primary} />
          <Text style={styles.addCartText}>{adding ? 'Adding...' : 'Add to Cart'}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.buyNowBtn} onPress={handleBuyNow} activeOpacity={0.85}>
          <Text style={styles.buyNowText}>Buy Now</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

function SpecItem({ label, value }: { label: string; value: string }) {
  return (
    <View style={specStyles.item}>
      <Text style={specStyles.label}>{label}</Text>
      <Text style={specStyles.value}>{value}</Text>
    </View>
  );
}

function TrustItem({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <View style={trustStyles.item}>
      {icon}
      <Text style={trustStyles.text}>{text}</Text>
    </View>
  );
}

const specStyles = StyleSheet.create({
  item: { width: '50%', marginBottom: Spacing.sm },
  label: { fontSize: FontSize.xs, color: Colors.textMuted, marginBottom: 2 },
  value: { fontSize: FontSize.sm, fontWeight: '600', color: Colors.text },
});

const trustStyles = StyleSheet.create({
  item: { flex: 1, alignItems: 'center', gap: 4 },
  text: { fontSize: FontSize.xs, color: Colors.textSecondary, fontWeight: '500', textAlign: 'center' },
});

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  loader: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.background },
  gallery: { backgroundColor: Colors.gray50, position: 'relative' },
  mainImage: { width: '100%', height: '100%' },
  galleryHeader: {
    position: 'absolute', top: Platform.OS === 'ios' ? 52 : 36,
    left: 0, right: 0,
    flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: Spacing.md,
  },
  backBtn: { backgroundColor: Colors.white, borderRadius: Radius.full, padding: Spacing.sm, ...Shadow.sm },
  wishBtn: { backgroundColor: Colors.white, borderRadius: Radius.full, padding: Spacing.sm, ...Shadow.sm },
  discountTag: {
    position: 'absolute', bottom: Spacing.sm, left: Spacing.sm,
    backgroundColor: Colors.primary, borderRadius: Radius.sm,
    paddingHorizontal: Spacing.sm, paddingVertical: 4,
  },
  discountTagText: { color: Colors.white, fontSize: FontSize.xs, fontWeight: '700' },
  thumbnails: {
    position: 'absolute', bottom: Spacing.sm, right: Spacing.sm,
    flexDirection: 'row', gap: Spacing.xs,
  },
  thumb: { width: 40, height: 40, borderRadius: Radius.sm, overflow: 'hidden', borderWidth: 2, borderColor: 'transparent' },
  thumbActive: { borderColor: Colors.primary },
  thumbImage: { width: '100%', height: '100%' },
  infoSection: { padding: Spacing.md, paddingBottom: 100 },
  infoSectionTablet: { paddingHorizontal: Spacing.xl },
  brandRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginBottom: 4 },
  brand: { fontSize: FontSize.sm, fontWeight: '600', color: Colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.5 },
  categoryChip: { backgroundColor: Colors.primaryLight, borderRadius: Radius.full, paddingHorizontal: Spacing.sm, paddingVertical: 2 },
  categoryChipText: { fontSize: FontSize.xs, fontWeight: '600', color: Colors.primary },
  productName: { fontSize: FontSize.xl, fontWeight: '700', color: Colors.text, marginBottom: Spacing.sm, lineHeight: 26 },
  productNameTablet: { fontSize: FontSize.xxl, lineHeight: 32, maxWidth: '92%' },
  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: Spacing.md },
  ratingText: { fontSize: FontSize.sm, fontWeight: '700', color: Colors.gray700 },
  reviewCount: { fontSize: FontSize.sm, color: Colors.textMuted },
  priceSection: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginBottom: Spacing.md },
  finalPrice: { fontSize: FontSize.xl, fontWeight: '800', color: Colors.text },
  originalPrice: { fontSize: FontSize.md, color: Colors.textMuted, textDecorationLine: 'line-through' },
  savings: { fontSize: FontSize.sm, fontWeight: '600', color: Colors.success, backgroundColor: '#DCFCE7', paddingHorizontal: 6, paddingVertical: 2, borderRadius: Radius.sm },
  specsCard: { backgroundColor: Colors.white, borderRadius: Radius.lg, padding: Spacing.md, marginBottom: Spacing.md, ...Shadow.sm },
  specsTitle: { fontSize: FontSize.md, fontWeight: '700', color: Colors.text, marginBottom: Spacing.sm },
  specsGrid: { flexDirection: 'row', flexWrap: 'wrap' },
  descSection: { marginBottom: Spacing.md },
  descTitle: { fontSize: FontSize.md, fontWeight: '700', color: Colors.text, marginBottom: 6 },
  descText: { fontSize: FontSize.sm, color: Colors.textSecondary, lineHeight: 22 },
  prescriptionBanner: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: Colors.primaryLight, borderRadius: Radius.lg,
    padding: Spacing.md, marginBottom: Spacing.md,
    borderWidth: 1, borderColor: Colors.primary + '40',
  },
  prescriptionLeft: { flex: 1 },
  prescriptionTitle: { fontSize: FontSize.md, fontWeight: '700', color: Colors.primary },
  prescriptionSub: { fontSize: FontSize.xs, color: Colors.primary + 'CC', marginTop: 2 },
  trustRow: { flexDirection: 'row', backgroundColor: Colors.white, borderRadius: Radius.lg, padding: Spacing.md, ...Shadow.sm },
  bottomCTA: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    flexDirection: 'row', gap: Spacing.sm,
    backgroundColor: Colors.white, padding: Spacing.md,
    paddingBottom: Platform.OS === 'ios' ? 28 : Spacing.md,
    borderTopWidth: 1, borderTopColor: Colors.border,
    ...Shadow.lg,
  },
  addCartBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    borderWidth: 2, borderColor: Colors.primary, borderRadius: Radius.md,
    paddingVertical: Spacing.sm + 4,
  },
  addCartText: { fontSize: FontSize.md, fontWeight: '700', color: Colors.primary },
  buyNowBtn: {
    flex: 1, backgroundColor: Colors.primary, borderRadius: Radius.md,
    alignItems: 'center', justifyContent: 'center', paddingVertical: Spacing.sm + 4,
  },
  buyNowText: { fontSize: FontSize.md, fontWeight: '700', color: Colors.white },
});
