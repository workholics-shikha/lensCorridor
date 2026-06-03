import { useEffect, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  TextInput, Dimensions, Platform, ActivityIndicator,
} from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { Search, SlidersHorizontal, X } from 'lucide-react-native';
import { getFilteredProducts } from '@/lib/localStore';
import { fetchFrameShapeCategories } from '@/lib/api';
import { Product, Category } from '@/lib/types';
import { Colors, Spacing, Radius, FontSize, Shadow } from '@/lib/theme';
import ProductCard from '@/components/ProductCard';

const { width } = Dimensions.get('window');
const isTablet = width >= 768;
const numColumns = isTablet ? 4 : 2;
const cardWidth = (width - Spacing.md * 2 - Spacing.sm * (numColumns - 1)) / numColumns;

export default function ProductsScreen() {
  const params = useLocalSearchParams<{ category?: string; search?: string }>();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(params.category ?? null);
  const [searchQuery, setSearchQuery] = useState(params.search ?? '');
  const [loading, setLoading] = useState(false);
  const [sortBy, setSortBy] = useState<'popular' | 'price_asc' | 'price_desc' | 'rating'>('popular');
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    fetchFrameShapeCategories().then(setCategories);
  }, []);

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    setProducts(getFilteredProducts({ categorySlug: selectedCategory, search: searchQuery, sortBy }));
    setLoading(false);
  }, [selectedCategory, searchQuery, sortBy]);

  useEffect(() => {
    if (categories.length > 0 || !selectedCategory) fetchProducts();
  }, [fetchProducts, categories.length]);

  const SORTS = [
    { key: 'popular', label: 'Popular' },
    { key: 'price_asc', label: 'Price: Low to High' },
    { key: 'price_desc', label: 'Price: High to Low' },
    { key: 'rating', label: 'Top Rated' },
  ] as const;

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Browse Eyewear</Text>
        <View style={styles.searchRow}>
          <View style={styles.searchBar}>
            <Search size={15} color={Colors.gray400} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search frames, brands..."
              placeholderTextColor={Colors.gray400}
              value={searchQuery}
              onChangeText={setSearchQuery}
              onSubmitEditing={fetchProducts}
              returnKeyType="search"
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <X size={15} color={Colors.gray400} />
              </TouchableOpacity>
            )}
          </View>
          <TouchableOpacity style={styles.filterBtn} onPress={() => setShowFilters(!showFilters)}>
            <SlidersHorizontal size={18} color={Colors.primary} />
          </TouchableOpacity>
        </View>

        {/* Category Chips */}
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={[{ id: 'all', name: 'All', slug: '' }, ...categories]}
          keyExtractor={(i) => i.id}
          contentContainerStyle={styles.chipsRow}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[styles.chip, (selectedCategory === item.slug || (!selectedCategory && item.slug === '')) && styles.chipActive]}
              onPress={() => setSelectedCategory(item.slug || null)}
            >
              <Text style={[styles.chipText, (selectedCategory === item.slug || (!selectedCategory && item.slug === '')) && styles.chipTextActive]}>
                {item.name}
              </Text>
            </TouchableOpacity>
          )}
        />

        {/* Sort Options */}
        {showFilters && (
          <FlatList
            horizontal showsHorizontalScrollIndicator={false}
            data={SORTS} keyExtractor={(i) => i.key}
            contentContainerStyle={styles.chipsRow}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[styles.chip, sortBy === item.key && styles.chipActive]}
                onPress={() => setSortBy(item.key)}
              >
                <Text style={[styles.chipText, sortBy === item.key && styles.chipTextActive]}>{item.label}</Text>
              </TouchableOpacity>
            )}
          />
        )}
      </View>

      {loading ? (
        <View style={styles.loader}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      ) : (
        <FlatList
          data={products}
          keyExtractor={(i) => i.id}
          numColumns={numColumns}
          contentContainerStyle={styles.list}
          columnWrapperStyle={numColumns > 1 ? styles.row : undefined}
          renderItem={({ item }) => <ProductCard product={item} style={{ width: cardWidth }} />}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={styles.emptyText}>No products found</Text>
              <Text style={styles.emptySub}>Try a different category or search term</Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: {
    backgroundColor: Colors.white,
    paddingTop: Platform.OS === 'ios' ? 52 : 36,
    paddingBottom: Spacing.sm,
    ...Shadow.sm,
  },
  headerTitle: {
    fontSize: FontSize.xl, fontWeight: '700', color: Colors.text,
    paddingHorizontal: Spacing.md, marginBottom: Spacing.sm,
  },
  searchRow: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.sm,
    paddingHorizontal: Spacing.md, marginBottom: Spacing.sm,
  },
  searchBar: {
    flex: 1, flexDirection: 'row', alignItems: 'center', gap: Spacing.xs,
    backgroundColor: Colors.gray50, borderRadius: Radius.md,
    borderWidth: 1, borderColor: Colors.border,
    paddingHorizontal: Spacing.sm, paddingVertical: Spacing.xs + 2,
  },
  searchInput: { flex: 1, fontSize: FontSize.sm, color: Colors.text },
  filterBtn: {
    backgroundColor: Colors.primaryLight, borderRadius: Radius.md,
    padding: Spacing.sm, borderWidth: 1, borderColor: Colors.primary + '30',
  },
  chipsRow: { paddingHorizontal: Spacing.md, gap: Spacing.xs, paddingBottom: Spacing.xs },
  chip: {
    paddingHorizontal: Spacing.sm + 4, paddingVertical: 5,
    borderRadius: Radius.full, borderWidth: 1, borderColor: Colors.border,
    backgroundColor: Colors.white,
  },
  chipActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  chipText: { fontSize: FontSize.sm, fontWeight: '500', color: Colors.gray600 },
  chipTextActive: { color: Colors.white, fontWeight: '700' },
  list: { padding: Spacing.md, paddingBottom: Spacing.xxl },
  row: { gap: Spacing.sm, marginBottom: Spacing.sm },
  loader: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: Spacing.xxl },
  emptyText: { fontSize: FontSize.lg, fontWeight: '600', color: Colors.text, marginBottom: 4 },
  emptySub: { fontSize: FontSize.md, color: Colors.textSecondary },
});
