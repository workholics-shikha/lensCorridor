import { useEffect, useMemo, useState } from 'react';
import { router } from 'expo-router';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from 'react-native';
import { ArrowLeft } from 'lucide-react-native';
import { useOrderFlow } from '@/context/OrderFlowContext';
import { fetchLensCategories, type LensCategoryOption } from '@/lib/api';
import { getLensPriceFromBand, LENS_PRICE_BY_BAND } from '@/lib/orderPricing';
import { Shadow } from '@/lib/theme';

const FEATURE_ICONS = ['+', '*', '-', '#'];

export default function LensDetailsScreen() {
  const { draft, updateLensSelection } = useOrderFlow();
  const { width } = useWindowDimensions();
  const [categories, setCategories] = useState<LensCategoryOption[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    setLoading(true);
    fetchLensCategories(draft.lensSelection.powerTypeId)
      .then((items) => {
        if (!active) {
          return;
        }

        setCategories(items);
      })
      .finally(() => {
        if (active) {
          setLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, [draft.lensSelection.powerTypeId]);

  const numColumns = width >= 1100 ? 3 : width >= 720 ? 2 : 1;
  const gap = 16;
  const horizontalPadding = 16;
  const cardWidth = useMemo(() => {
    const innerWidth = width - horizontalPadding * 2;
    return (innerWidth - gap * (numColumns - 1)) / numColumns;
  }, [gap, horizontalPadding, numColumns, width]);

  const handleSelectCategory = (item: LensCategoryOption) => {
    const normalizedPowerType = draft.lensSelection.powerType.toLowerCase();

    updateLensSelection({
      lensCategory: item.displayLabel || item.categoryName,
      lensCategoryId: item.id,
      lensPrice: getLensPriceFromBand(item.linkedPricingBand),
    });

    if (
      normalizedPowerType === 'with power'
      || normalizedPowerType === 'progressive/bifocals'
      || normalizedPowerType === 'progressive bifocals'
    ) {
      router.push({
        pathname: '/prescription',
        params: { mode: 'order-flow', nextPath: '/billing' },
      });
      return;
    }

    router.push('/billing');
  };

  const selectedCategoryId = draft.lensSelection.lensCategoryId;

  return (
    <View style={styles.screen}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()} activeOpacity={0.8}>
          <ArrowLeft size={20} color="#1C1D21" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Add Lens Details</Text>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#1C71D8" />
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.sectionLabelRow}>
            <Text style={styles.sectionLabel}>{draft.lensSelection.powerType || 'Lens Category'} </Text>
            <Text style={styles.sectionArrow}>{'>'}</Text>
          </View>

          {categories.length ? (
            <View style={styles.grid}>
              {categories.map((item) => {
                const selected = selectedCategoryId === item.id;
                const features = getFeatureLines(item);
                const price = LENS_PRICE_BY_BAND[item.linkedPricingBand] ?? 1500;

                return (
                  <TouchableOpacity
                    key={item.id}
                    style={[
                      styles.card,
                      { width: cardWidth },
                      selected && styles.cardSelected,
                    ]}
                    activeOpacity={0.92}
                    onPress={() => handleSelectCategory(item)}
                  >
                    <View style={styles.cardTop}>
                      <LensBadge name={item.displayLabel || item.categoryName} />
                      <View style={styles.cardTextWrap}>
                        <Text style={styles.cardTitle} numberOfLines={2}>
                          {item.displayLabel || item.categoryName}
                        </Text>
                        {features.map((feature, index) => (
                          <Text key={`${item.id}-${index}`} style={styles.featureText}>
                            {FEATURE_ICONS[index] ?? '•'} {feature}
                          </Text>
                        ))}
                      </View>
                    </View>

                    <View style={styles.priceRow}>
                      <Text style={styles.priceLabel}>Price</Text>
                      <Text style={styles.priceValue}>Rs. {price}</Text>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          ) : (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyTitle}>No lens categories found</Text>
              <Text style={styles.emptyBody}>
                Add lens-category records mapped to this power type, then reopen this screen.
              </Text>
            </View>
          )}
        </ScrollView>
      )}
    </View>
  );
}

function LensBadge({ name }: { name: string }) {
  const tone = getBadgeTone(name);
  return (
    <View style={[styles.badge, { backgroundColor: tone.background }]}>
      <Text style={[styles.badgeLabel, { color: tone.accent }]}>{tone.label}</Text>
      <View style={[styles.badgeShine, { backgroundColor: tone.shine }]} />
    </View>
  );
}

function getBadgeTone(name: string) {
  const value = name.toLowerCase();

  if (value.includes('anti-glare')) {
    return { background: '#E7F2FF', accent: '#0F74FF', shine: '#B7D7FF', label: 'AG' };
  }

  if (value.includes('ishield') || value.includes('japan')) {
    return { background: '#EEF1FF', accent: '#3559E6', shine: '#D4DBFF', label: 'JP' };
  }

  return { background: '#E7F5FF', accent: '#1783E7', shine: '#B8E0FF', label: 'BLU' };
}

function getFeatureLines(item: LensCategoryOption) {
  const mapped = item.usageAndMapping
    .split(',')
    .map((value) => value.trim())
    .filter(Boolean);

  if (mapped.length >= 2) {
    return mapped.slice(0, 4);
  }

  const descriptionParts = item.description
    .split(/(?:\.\s+|,\s+)/)
    .map((value) => value.trim())
    .filter(Boolean);

  return [...mapped, ...descriptionParts].slice(0, 4);
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#F6F6FB',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E6EC',
    paddingTop: 44,
    paddingBottom: 16,
    paddingHorizontal: 16,
  },
  backButton: {
    width: 30,
    height: 30,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '500',
    color: '#202128',
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 32,
  },
  sectionLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 18,
  },
  sectionLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1D2129',
  },
  sectionArrow: {
    fontSize: 12,
    color: '#1D2129',
    marginTop: 1,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  card: {
    minHeight: 178,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#E7E5E1',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
    marginBottom: 16,
    ...Shadow.sm,
  },
  cardSelected: {
    borderColor: '#F2A14A',
    shadowColor: '#F2A14A',
    shadowOpacity: 0.12,
  },
  cardTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  badge: {
    width: 42,
    height: 30,
    borderRadius: 9,
    marginRight: 10,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  badgeLabel: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  badgeShine: {
    position: 'absolute',
    top: 4,
    left: 5,
    width: 14,
    height: 4,
    borderRadius: 999,
    opacity: 0.75,
  },
  cardTextWrap: {
    flex: 1,
    minWidth: 0,
  },
  cardTitle: {
    fontSize: 15.5,
    lineHeight: 21,
    fontWeight: '500',
    color: '#23262F',
    marginTop: 2,
    marginBottom: 8,
  },
  featureText: {
    fontSize: 12.8,
    lineHeight: 20,
    color: '#686C76',
    marginBottom: 2,
  },
  priceRow: {
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#ECE9E3',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  priceLabel: {
    fontSize: 13.5,
    color: '#22252C',
  },
  priceValue: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0D6CF5',
  },
  emptyCard: {
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#E7E8F0',
    backgroundColor: '#FFFFFF',
    padding: 18,
    ...Shadow.sm,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#202128',
    marginBottom: 4,
  },
  emptyBody: {
    fontSize: 13,
    lineHeight: 19,
    color: '#6F7380',
  },
});
