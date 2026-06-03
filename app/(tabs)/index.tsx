import { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Image, Dimensions, Platform, TextInput,
} from 'react-native';
import { router } from 'expo-router';
import { Menu, ShoppingCart, Search, Bell } from 'lucide-react-native';
import { supabase } from '@/lib/supabase';
import { Category, Product } from '@/lib/types';
import { Colors, Spacing, Radius, FontSize, Shadow } from '@/lib/theme';
import { useCart } from '@/context/CartContext';
import ProductCard from '@/components/ProductCard';

const { width } = Dimensions.get('window');
const isTablet = width >= 768;

const FRAME_SHAPES = [
  { slug: 'square', label: 'Square', emoji: '⬛' },
  { slug: 'rectangle', label: 'Rectangle', emoji: '▬' },
  { slug: 'aviator', label: 'Aviator', emoji: '🕶' },
  { slug: 'geometric', label: 'Geometric', emoji: '⬡' },
  { slug: 'contact-lens', label: 'Contact Lens', emoji: '👁' },
];

export default function HomeScreen() {
  const { cartCount } = useCart();
  const [selectedShape, setSelectedShape] = useState('rectangle');
  const [categories, setCategories] = useState<Category[]>([]);
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    supabase.from('categories').select('*').order('sort_order').then(({ data }) => {
      setCategories(data || []);
    });
    supabase
      .from('products')
      .select('*, categories(*)')
      .limit(isTablet ? 8 : 6)
      .order('review_count', { ascending: false })
      .then(({ data }) => setFeaturedProducts(data as Product[] || []));
  }, []);

  const handleShapeSelect = (slug: string) => {
    setSelectedShape(slug);
    router.push({ pathname: '/(tabs)/products', params: { category: slug } });
  };

  const handleSearch = () => {
    if (searchQuery.trim()) {
      router.push({ pathname: '/(tabs)/products', params: { search: searchQuery.trim() } });
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <TouchableOpacity style={styles.menuBtn}>
            <Menu size={22} color={Colors.white} />
          </TouchableOpacity>
          <View style={styles.headerBrand}>
            <Text style={styles.headerLogo}>∞</Text>
            <Text style={styles.headerTitle}>Lens Corridor</Text>
          </View>
          <TouchableOpacity style={styles.cartBtn} onPress={() => router.push('/cart')}>
            <ShoppingCart size={22} color={Colors.white} />
            {cartCount > 0 && (
              <View style={styles.cartBadge}>
                <Text style={styles.cartBadgeText}>{cartCount > 9 ? '9+' : cartCount}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        {/* Search Bar */}
        <View style={styles.searchBar}>
          <Search size={16} color={Colors.gray400} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search eyeglasses, brands..."
            placeholderTextColor={Colors.gray400}
            value={searchQuery}
            onChangeText={setSearchQuery}
            onSubmitEditing={handleSearch}
            returnKeyType="search"
          />
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Frame Shapes */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionIcon}>🕶</Text>
            <Text style={styles.sectionTitle}>Select Frame Shapes</Text>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.shapesRow}>
            {FRAME_SHAPES.map((shape) => (
              <TouchableOpacity
                key={shape.slug}
                style={[styles.shapeCard, selectedShape === shape.slug && styles.shapeCardActive]}
                onPress={() => handleShapeSelect(shape.slug)}
                activeOpacity={0.8}
              >
                <FrameShapeIcon slug={shape.slug} active={selectedShape === shape.slug} />
                <Text style={[styles.shapeLabel, selectedShape === shape.slug && styles.shapeLabelActive]}>
                  {shape.label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Services Row */}
        <View style={[styles.servicesRow, isTablet && styles.servicesRowTablet]}>
          <ServiceCard
            title="Eye Test"
            subtitle="Book A Quick And Accurate Eye Checkup With Experts"
            image="https://images.pexels.com/photos/5765828/pexels-photo-5765828.jpeg?auto=compress&cs=tinysrgb&w=600"
            onPress={() => router.push('/prescription')}
          />
          <ServiceCard
            title="Repair"
            subtitle="Get Your Glasses Repaired Quickly And Hassle-Free."
            image="https://images.pexels.com/photos/3825586/pexels-photo-3825586.jpeg?auto=compress&cs=tinysrgb&w=600"
            onPress={() => {}}
          />
        </View>

        {/* Banner */}
        <TouchableOpacity style={styles.banner} onPress={() => router.push('/(tabs)/products')} activeOpacity={0.9}>
          <Image
            source={{ uri: 'https://images.pexels.com/photos/701877/pexels-photo-701877.jpeg?auto=compress&cs=tinysrgb&w=1200' }}
            style={styles.bannerImage}
            resizeMode="cover"
          />
          <View style={styles.bannerOverlay}>
            <Text style={styles.bannerTag}>NEW ARRIVAL</Text>
            <Text style={styles.bannerTitle}>Up to 50% Off</Text>
            <Text style={styles.bannerSub}>Premium Eyewear Collection</Text>
            <View style={styles.bannerBtn}>
              <Text style={styles.bannerBtnText}>Shop Now</Text>
            </View>
          </View>
        </TouchableOpacity>

        {/* Featured Products */}
        <View style={styles.section}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>Best Sellers</Text>
            <TouchableOpacity onPress={() => router.push('/(tabs)/products')}>
              <Text style={styles.seeAll}>See All</Text>
            </TouchableOpacity>
          </View>
          <View style={[styles.productsGrid, isTablet && styles.productsGridTablet]}>
            {featuredProducts.map((product) => (
              <ProductCard key={product.id} product={product} style={isTablet ? styles.productCardTablet : styles.productCard} />
            ))}
          </View>
        </View>

        {/* Bottom Padding */}
        <View style={{ height: Spacing.xxl }} />
      </ScrollView>
    </View>
  );
}

function FrameShapeIcon({ slug, active }: { slug: string; active: boolean }) {
  const color = active ? Colors.primary : Colors.gray600;
  const size = isTablet ? 40 : 36;

  const shapes: Record<string, React.ReactNode> = {
    'square': <View style={{ width: size * 0.7, height: size * 0.5, borderWidth: 2.5, borderColor: color, borderRadius: 3 }} />,
    'rectangle': <View style={{ width: size * 0.9, height: size * 0.45, borderWidth: 2.5, borderColor: color, borderRadius: 3 }} />,
    'aviator': (
      <View style={{ alignItems: 'center' }}>
        <View style={{ width: size * 0.25, height: 2, backgroundColor: color, marginBottom: 2 }} />
        <View style={{ flexDirection: 'row', gap: 3 }}>
          <View style={{ width: size * 0.38, height: size * 0.38, borderWidth: 2.5, borderColor: color, borderRadius: size * 0.19 }} />
          <View style={{ width: size * 0.38, height: size * 0.38, borderWidth: 2.5, borderColor: color, borderRadius: size * 0.19 }} />
        </View>
      </View>
    ),
    'geometric': <View style={{ width: size * 0.6, height: size * 0.6, borderWidth: 2.5, borderColor: color, transform: [{ rotate: '45deg' }] }} />,
    'contact-lens': <View style={{ width: size * 0.55, height: size * 0.55, borderWidth: 2.5, borderColor: color, borderRadius: size * 0.3, borderStyle: 'dashed' }} />,
  };

  return (
    <View style={{ height: size + 4, alignItems: 'center', justifyContent: 'center' }}>
      {shapes[slug] || <View style={{ width: size * 0.6, height: size * 0.45, borderWidth: 2.5, borderColor: color, borderRadius: 3 }} />}
    </View>
  );
}

function ServiceCard({ title, subtitle, image, onPress }: { title: string; subtitle: string; image: string; onPress: () => void }) {
  return (
    <TouchableOpacity style={styles.serviceCard} onPress={onPress} activeOpacity={0.9}>
      <Image source={{ uri: image }} style={styles.serviceImage} resizeMode="cover" />
      <View style={styles.serviceOverlay}>
        <Text style={styles.serviceTitle}>{title}</Text>
        <Text style={styles.serviceSubtitle}>{subtitle}</Text>
        <View style={styles.serviceBtn}>
          <Text style={styles.serviceBtnText}>Start Now</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: {
    backgroundColor: Colors.primary,
    paddingTop: Platform.OS === 'ios' ? 52 : 36,
    paddingBottom: Spacing.md,
    paddingHorizontal: Spacing.md,
  },
  headerTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: Spacing.sm },
  menuBtn: { padding: 4 },
  headerBrand: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  headerLogo: { fontSize: 22, color: Colors.white, fontWeight: '800' },
  headerTitle: { fontSize: FontSize.lg, fontWeight: '700', color: Colors.white },
  cartBtn: { padding: 4, position: 'relative' },
  cartBadge: {
    position: 'absolute', top: 0, right: 0,
    backgroundColor: Colors.accent, borderRadius: 8, minWidth: 16, height: 16,
    alignItems: 'center', justifyContent: 'center', paddingHorizontal: 3,
  },
  cartBadgeText: { color: Colors.white, fontSize: 9, fontWeight: '800' },
  searchBar: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.white,
    borderRadius: Radius.md, paddingHorizontal: Spacing.sm + 2, paddingVertical: Spacing.xs + 2,
    gap: Spacing.xs,
  },
  searchInput: { flex: 1, fontSize: FontSize.md, color: Colors.text, paddingVertical: 2 },
  section: { marginTop: Spacing.md, paddingHorizontal: Spacing.md },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: Spacing.sm },
  sectionHeaderRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: Spacing.sm },
  sectionIcon: { fontSize: 16 },
  sectionTitle: { fontSize: FontSize.lg, fontWeight: '700', color: Colors.text },
  seeAll: { fontSize: FontSize.sm, fontWeight: '600', color: Colors.primary },
  shapesRow: { paddingVertical: Spacing.xs, gap: Spacing.sm, paddingRight: Spacing.md },
  shapeCard: {
    alignItems: 'center', backgroundColor: Colors.white, borderRadius: Radius.md,
    paddingHorizontal: isTablet ? Spacing.lg : Spacing.md, paddingVertical: Spacing.sm,
    borderWidth: 1.5, borderColor: Colors.border, minWidth: isTablet ? 90 : 76,
    ...Shadow.sm,
  },
  shapeCardActive: { borderColor: Colors.primary, backgroundColor: Colors.primaryLight },
  shapeLabel: { fontSize: FontSize.xs, color: Colors.gray600, marginTop: 4, fontWeight: '500', textAlign: 'center' },
  shapeLabelActive: { color: Colors.primary, fontWeight: '700' },
  servicesRow: {
    flexDirection: 'row', paddingHorizontal: Spacing.md, marginTop: Spacing.md, gap: Spacing.sm,
  },
  servicesRowTablet: { paddingHorizontal: Spacing.lg },
  serviceCard: {
    flex: 1, height: isTablet ? 160 : 130, borderRadius: Radius.lg, overflow: 'hidden', ...Shadow.sm,
  },
  serviceImage: { ...StyleSheet.absoluteFillObject },
  serviceOverlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', padding: Spacing.sm,
    justifyContent: 'flex-end',
  },
  serviceTitle: { fontSize: FontSize.md, fontWeight: '700', color: Colors.white, marginBottom: 2 },
  serviceSubtitle: { fontSize: 10, color: 'rgba(255,255,255,0.85)', marginBottom: Spacing.xs, lineHeight: 14 },
  serviceBtn: {
    backgroundColor: Colors.accent, borderRadius: Radius.sm,
    paddingHorizontal: Spacing.sm, paddingVertical: 4, alignSelf: 'flex-start',
  },
  serviceBtnText: { color: Colors.white, fontSize: 11, fontWeight: '700' },
  banner: {
    marginHorizontal: Spacing.md, marginTop: Spacing.md,
    height: isTablet ? 200 : 160, borderRadius: Radius.lg, overflow: 'hidden', ...Shadow.md,
  },
  bannerImage: { ...StyleSheet.absoluteFillObject },
  bannerOverlay: {
    flex: 1, backgroundColor: 'rgba(0,30,80,0.55)', padding: Spacing.lg, justifyContent: 'center',
  },
  bannerTag: { fontSize: FontSize.xs, fontWeight: '700', color: Colors.accent, letterSpacing: 1.5, marginBottom: 4 },
  bannerTitle: { fontSize: isTablet ? 32 : FontSize.xxxl, fontWeight: '800', color: Colors.white, marginBottom: 2 },
  bannerSub: { fontSize: FontSize.md, color: 'rgba(255,255,255,0.85)', marginBottom: Spacing.md },
  bannerBtn: {
    backgroundColor: Colors.white, borderRadius: Radius.full,
    paddingHorizontal: Spacing.lg, paddingVertical: Spacing.xs + 2, alignSelf: 'flex-start',
  },
  bannerBtnText: { color: Colors.primary, fontWeight: '700', fontSize: FontSize.sm },
  productsGrid: {
    flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm,
  },
  productsGridTablet: { gap: Spacing.md },
  productCard: { width: (width - Spacing.md * 2 - Spacing.sm) / 2 },
  productCardTablet: { width: (width - Spacing.lg * 2 - Spacing.md * 3) / 4 },
});
