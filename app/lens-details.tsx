import { useEffect, useMemo, useState } from 'react';
import { router } from 'expo-router';
import {
  ActivityIndicator,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from 'react-native';
import { ArrowLeft, Check, FileText } from 'lucide-react-native';
import { useOrderFlow } from '@/context/OrderFlowContext';
import { fetchLensCategories, type LensCategoryOption } from '@/lib/api';
import { getLensPriceFromBand, LENS_PRICE_BY_BAND } from '@/lib/orderPricing';
import { Shadow } from '@/lib/theme';

const FEATURE_ICONS = ['+', '*', '-', '#'];
const SPH_OPTIONS = ['+0.25', '+0.5', '+0.75', '+1', '+1.25', '+1.5', '+1.75', '+2', '+2.25', '+2.5', '+2.75', '+3', '+3.25', '+3.5', '+3.75', '+4'];

export default function LensDetailsScreen() {
  const { draft, updateLensDetail, updateLensSelection } = useOrderFlow();
  const { width } = useWindowDimensions();
  const [categories, setCategories] = useState<LensCategoryOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [samePower, setSamePower] = useState(false);
  const [hasCylindricalPower, setHasCylindricalPower] = useState(false);
  const [prescriptionName, setPrescriptionName] = useState('');
  const [activeEye, setActiveEye] = useState<'right' | 'left'>('right');

  const isReadingPower = draft.lensSelection.powerType.toLowerCase().includes('reading');
  const rightEye = draft.lensDetails.find((item) => item.eye === 'right');
  const leftEye = draft.lensDetails.find((item) => item.eye === 'left');
  const frameImage = draft.frameImages[0]?.image;
  const framePrice = draft.price || '1000';

  useEffect(() => {
    if (isReadingPower) {
      setLoading(false);
      return;
    }

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
  }, [draft.lensSelection.powerTypeId, isReadingPower]);

  const numColumns = width >= 1100 ? 3 : width >= 720 ? 2 : 1;
  const gap = 16;
  const horizontalPadding = 16;
  const isCompactPowerLayout = width < 760;
  const cardWidth = useMemo(() => {
    const innerWidth = width - horizontalPadding * 2;
    return (innerWidth - gap * (numColumns - 1)) / numColumns;
  }, [gap, horizontalPadding, numColumns, width]);

  const handleSelectCategory = (item: LensCategoryOption) => {
    updateLensSelection({
      lensCategory: item.displayLabel || item.categoryName,
      lensCategoryId: item.id,
      lensPrice: getLensPriceFromBand(item.linkedPricingBand),
    });
    router.push('/billing');
  };

  const handleContinue = () => {
    router.push('/order-review');
  };

  const updateSphericalPower = (eye: 'right' | 'left', value: string) => {
    const detailId = eye === 'right' ? 'lens-right' : 'lens-left';
    updateLensDetail(detailId, {
      label: 'Reading Power',
      sph: value,
      cyl: hasCylindricalPower ? (eye === 'right' ? rightEye?.cyl ?? '' : leftEye?.cyl ?? '') : '',
      axis: hasCylindricalPower ? (eye === 'right' ? rightEye?.axis ?? '' : leftEye?.axis ?? '') : '',
      add: value,
    });

    if (samePower && eye === 'right') {
      updateLensDetail('lens-left', {
        label: 'Reading Power',
        sph: value,
        cyl: hasCylindricalPower ? leftEye?.cyl ?? '' : '',
        axis: hasCylindricalPower ? leftEye?.axis ?? '' : '',
        add: value,
      });
    }
  };

  const toggleSamePower = () => {
    const nextValue = !samePower;
    setSamePower(nextValue);
    setActiveEye('right');

    if (nextValue && rightEye) {
      updateLensDetail('lens-left', {
        label: 'Reading Power',
        sph: rightEye.sph,
        add: rightEye.add,
      });
    }
  };

  const toggleCylindricalPower = () => {
    const nextValue = !hasCylindricalPower;
    setHasCylindricalPower(nextValue);

    if (!nextValue) {
      updateLensDetail('lens-right', { cyl: '', axis: '' });
      updateLensDetail('lens-left', { cyl: '', axis: '' });
    }
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
      ) : isReadingPower ? (
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <Text style={styles.powerPageTitle}>Enter your power details</Text>

          <View style={[styles.powerLayout, isCompactPowerLayout && styles.powerLayoutCompact]}>
            <View style={[styles.frameCard, isCompactPowerLayout && styles.frameCardCompact]}>
              {frameImage ? (
                <Image source={{ uri: frameImage }} resizeMode="contain" style={styles.frameImage} />
              ) : (
                <FramePreview />
              )}
              <Text style={styles.frameName}>Lenskorridor frame</Text>
              <Text style={styles.framePrice}>₹{framePrice}</Text>
            </View>

            <View style={[styles.prescriptionWrap, isCompactPowerLayout && styles.prescriptionWrapCompact]}>
              <View style={styles.prescriptionCard}>
                <View style={styles.prescriptionHeader}>
                  <FileText size={16} color="#0D6CF5" />
                  <Text style={styles.prescriptionTitle}>Select your prescription values</Text>
                </View>

                <OptionRow
                  label="I have same power in both eyes"
                  active={samePower}
                  onPress={toggleSamePower}
                />
                <OptionRow
                  label="I have cylindrical power"
                  active={hasCylindricalPower}
                  onPress={toggleCylindricalPower}
                />

                <View style={styles.rxHeaderRow}>
                  <Text style={styles.rxLabel}>Rx</Text>
                  <View style={styles.eyeHeaderGroup}>
                    <Text style={styles.eyeHeader}>RIGHT</Text>
                    <Text style={styles.eyeHeader}>LEFT</Text>
                  </View>
                </View>

                <View style={styles.rxValueRow}>
                  <Text style={styles.rxTypeLabel}>Spherical</Text>
                  <View style={styles.eyeHeaderGroup}>
                    <EyeValueButton
                      value={rightEye?.sph || 'Select'}
                      active={activeEye === 'right'}
                      onPress={() => setActiveEye('right')}
                    />
                    <EyeValueButton
                      value={samePower ? rightEye?.sph || 'Select' : leftEye?.sph || 'Select'}
                      active={activeEye === 'left' && !samePower}
                      onPress={() => setActiveEye('left')}
                      disabled={samePower}
                    />
                  </View>
                </View>

                <View style={styles.numberGrid}>
                  {SPH_OPTIONS.map((value) => {
                    const selectedValue = activeEye === 'right'
                      ? rightEye?.sph
                      : samePower
                        ? rightEye?.sph
                        : leftEye?.sph;
                    const selected = selectedValue === value;

                    return (
                      <TouchableOpacity
                        key={value}
                        style={[styles.numberTile, selected && styles.numberTileSelected]}
                        activeOpacity={0.86}
                        onPress={() => updateSphericalPower(activeEye, value)}
                        disabled={samePower && activeEye === 'left'}
                      >
                        <Text style={[styles.numberTileText, selected && styles.numberTileTextSelected]}>{value}</Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>

              <TextInput
                value={prescriptionName}
                onChangeText={setPrescriptionName}
                placeholder="Prescription Name"
                placeholderTextColor="#A0A4AE"
                style={styles.prescriptionInput}
              />
            </View>
          </View>

          <TouchableOpacity style={styles.savePrescriptionButton} onPress={handleContinue} activeOpacity={0.88}>
            <Text style={styles.savePrescriptionText}>Save Prescription & Go to Cart</Text>
          </TouchableOpacity>
        </ScrollView>
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

function EyeValueButton({
  value,
  active,
  onPress,
  disabled = false,
}: {
  value: string;
  active: boolean;
  onPress: () => void;
  disabled?: boolean;
}) {
  return (
    <TouchableOpacity
      style={[styles.eyeValueButton, active && styles.eyeValueButtonActive, disabled && styles.eyeValueButtonDisabled]}
      onPress={onPress}
      activeOpacity={0.88}
      disabled={disabled}
    >
      <Text style={[styles.eyeValueButtonText, value === 'Select' && styles.eyeValueButtonPlaceholder, active && styles.eyeValueButtonTextActive]}>
        {value}
      </Text>
    </TouchableOpacity>
  );
}

function OptionRow({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return (
    <TouchableOpacity style={styles.optionRow} onPress={onPress} activeOpacity={0.82}>
      <View style={[styles.checkbox, active && styles.checkboxActive]}>
        {active ? <Check size={12} color="#FFFFFF" strokeWidth={3} /> : null}
      </View>
      <Text style={styles.optionLabel}>{label}</Text>
    </TouchableOpacity>
  );
}

function FramePreview() {
  return (
    <View style={styles.previewWrap}>
      <View style={[styles.previewLens, styles.previewLensLeft]} />
      <View style={[styles.previewLens, styles.previewLensRight]} />
      <View style={styles.previewBridge} />
      <View style={styles.previewTempleLeft} />
      <View style={styles.previewTempleRight} />
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
  powerPageTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1D2129',
    marginBottom: 18,
  },
  powerLayout: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  powerLayoutCompact: {
    flexDirection: 'column',
  },
  frameCard: {
    width: 222,
    minHeight: 238,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E8E5E0',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 14,
    paddingVertical: 16,
    alignItems: 'center',
    ...Shadow.sm,
  },
  frameCardCompact: {
    width: '100%',
    marginBottom: 14,
  },
  frameImage: {
    width: '100%',
    height: 126,
    marginTop: 8,
    marginBottom: 14,
  },
  previewWrap: {
    width: 168,
    height: 110,
    marginTop: 18,
    marginBottom: 20,
    position: 'relative',
  },
  previewLens: {
    position: 'absolute',
    top: 25,
    width: 68,
    height: 52,
    borderWidth: 4,
    borderColor: '#232323',
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
  },
  previewLensLeft: {
    left: 10,
    transform: [{ rotate: '-2deg' }],
  },
  previewLensRight: {
    right: 10,
    transform: [{ rotate: '2deg' }],
  },
  previewBridge: {
    position: 'absolute',
    top: 44,
    left: 72,
    width: 24,
    height: 8,
    borderTopWidth: 4,
    borderColor: '#232323',
    borderTopLeftRadius: 10,
    borderTopRightRadius: 10,
  },
  previewTempleLeft: {
    position: 'absolute',
    top: 30,
    left: 0,
    width: 24,
    height: 4,
    backgroundColor: '#232323',
    transform: [{ rotate: '-28deg' }],
    borderRadius: 999,
  },
  previewTempleRight: {
    position: 'absolute',
    top: 30,
    right: 0,
    width: 24,
    height: 4,
    backgroundColor: '#232323',
    transform: [{ rotate: '28deg' }],
    borderRadius: 999,
  },
  frameName: {
    fontSize: 14,
    color: '#6A6F78',
    marginBottom: 3,
  },
  framePrice: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0D6CF5',
  },
  prescriptionWrap: {
    flex: 1,
    marginLeft: 14,
    minWidth: 0,
  },
  prescriptionWrapCompact: {
    width: '100%',
    marginLeft: 0,
  },
  prescriptionCard: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E8E5E0',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 14,
    paddingTop: 12,
    paddingBottom: 12,
    ...Shadow.sm,
  },
  prescriptionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingBottom: 12,
    marginBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F0EEE9',
  },
  prescriptionTitle: {
    marginLeft: 8,
    fontSize: 14.5,
    fontWeight: '500',
    color: '#1D2129',
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  checkbox: {
    width: 14,
    height: 14,
    borderRadius: 3,
    borderWidth: 1,
    borderColor: '#CED3DD',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  checkboxActive: {
    backgroundColor: '#0D6CF5',
    borderColor: '#0D6CF5',
  },
  optionLabel: {
    fontSize: 13.5,
    color: '#3D4350',
  },
  rxHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 12,
    marginBottom: 8,
  },
  rxLabel: {
    fontSize: 12,
    color: '#7D828C',
  },
  eyeHeaderGroup: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  eyeHeader: {
    width: 60,
    textAlign: 'center',
    fontSize: 12,
    color: '#8A8F99',
    marginLeft: 10,
  },
  rxValueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  rxTypeLabel: {
    fontSize: 13.5,
    color: '#1D2129',
  },
  eyeValueButton: {
    minWidth: 60,
    height: 28,
    borderRadius: 9,
    backgroundColor: '#F5F5F6',
    paddingHorizontal: 9,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 10,
    borderWidth: 1,
    borderColor: '#F5F5F6',
  },
  eyeValueButtonActive: {
    borderColor: '#17B394',
    backgroundColor: '#F0FFFB',
  },
  eyeValueButtonDisabled: {
    opacity: 0.65,
  },
  eyeValueButtonText: {
    fontSize: 12.5,
    color: '#1D2129',
  },
  eyeValueButtonTextActive: {
    color: '#123C77',
    fontWeight: '700',
  },
  eyeValueButtonPlaceholder: {
    color: '#666B75',
  },
  numberGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 14,
    marginTop: 4,
  },
  numberTile: {
    width: 70,
    height: 70,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#DCE0ED',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadow.sm,
  },
  numberTileSelected: {
    borderColor: '#17B394',
    backgroundColor: '#F0FFFB',
  },
  numberTileText: {
    fontSize: 17,
    fontWeight: '700',
    color: '#3D447B',
  },
  numberTileTextSelected: {
    color: '#123C77',
  },
  prescriptionInput: {
    height: 40,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E8E5E0',
    backgroundColor: '#FFFFFF',
    marginTop: 10,
    paddingHorizontal: 14,
    fontSize: 13.5,
    color: '#1D2129',
    ...Shadow.sm,
  },
  savePrescriptionButton: {
    marginTop: 22,
    minHeight: 40,
    width: 248,
    borderRadius: 8,
    backgroundColor: '#166DDE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  savePrescriptionText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
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
  primaryButton: {
    marginTop: 20,
    minHeight: 48,
    borderRadius: 12,
    backgroundColor: '#1C71D8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButtonDisabled: {
    backgroundColor: '#AAB8D0',
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
});
