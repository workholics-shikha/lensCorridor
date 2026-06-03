import { useEffect, useRef, useState, type ReactNode } from 'react';
import {
  Alert,
  Image,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import {
  ArrowLeft,
  Camera,
  Image as ImageIcon,
  IndianRupee,
  Search,
  X,
} from 'lucide-react-native';
import { fetchFrameShapes } from '@/lib/api';
import { findLatestCustomerByPhone } from '@/lib/localStore';
import { Shadow } from '@/lib/theme';
import { useOrderFlow } from '@/context/OrderFlowContext';

type FramePreviewItem = {
  id: string;
  image?: string;
  shape?: string;
};

const SELECT_FRAME_ICON = require('@/assets/images/healthicons_eyeglasses-24px.png');

export default function CheckoutScreen() {
  const { width } = useWindowDimensions();
  const { shape } = useLocalSearchParams<{ shape?: string }>();
  const inputRef = useRef<any>(null);
  const isTablet = width >= 768;
  const containerWidth = isTablet ? 1040 : width;
  const { draft, updateDraft } = useOrderFlow();

  const [customerSearch, setCustomerSearch] = useState(draft.phone);
  const [matchedCustomer, setMatchedCustomer] = useState<ReturnType<typeof findLatestCustomerByPhone>>(null);
  const [price, setPrice] = useState(draft.price);
  const [error, setError] = useState('');
  const [framePreviews, setFramePreviews] = useState<FramePreviewItem[]>(draft.frameImages);

  useEffect(() => {
    let active = true;

    fetchFrameShapes().then((items) => {
      if (!active) {
        return;
      }

      const ordered = [...items].sort((a, b) => {
        if (a.shape === shape) {
          return -1;
        }
        if (b.shape === shape) {
          return 1;
        }
        return 0;
      });

      setFramePreviews(
        ordered.slice(0, 3).map((item, index) => ({
          id: `${item.id}-${index}`,
          image: item.image || undefined,
          shape: item.shape,
        }))
      );
    });

    return () => {
      active = false;
    };
  }, [shape]);

  useEffect(() => {
    const timer = setTimeout(() => {
      const normalizedPhone = customerSearch.replace(/\D/g, '').slice(-10);
      if (normalizedPhone.length < 10) {
        setMatchedCustomer(null);
        return;
      }

      setMatchedCustomer(findLatestCustomerByPhone(normalizedPhone));
    }, 250);

    return () => clearTimeout(timer);
  }, [customerSearch]);

  const handleUploadPress = (source: 'camera' | 'gallery') => {
    if (Platform.OS !== 'web') {
      Alert.alert(
        'Upload unavailable',
        `${source === 'camera' ? 'Camera' : 'Gallery'} selection needs an image-picker native module in this app build.`
      );
      return;
    }

    if (!globalThis.document) {
      return;
    }

    const input = globalThis.document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';

    if (source === 'camera') {
      input.setAttribute('capture', 'environment');
    }

    input.onchange = () => {
      const file = input.files?.[0];
      if (!file) {
        return;
      }

      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result !== 'string') {
          return;
        }

        setFramePreviews((current) => {
          const image = typeof reader.result === 'string' ? reader.result : undefined;
          if (!image) {
            return current;
          }

          return [
            ...current,
            {
              id: `${source}-${Date.now()}-${current.length}`,
              image,
            },
          ];
        });
        setError('');
      };

      reader.readAsDataURL(file);
    };

    inputRef.current = input;
    input.click();
  };

  const removeFrame = (id: string) => {
    setFramePreviews((current) => current.filter((item) => item.id !== id));
  };

  const handleNext = () => {
    if (customerSearch.replace(/\D/g, '').slice(-10).length < 10) {
      setError('Please enter a valid mobile number.');
      return;
    }

    if (!price.trim()) {
      setError('Please enter price.');
      return;
    }

    if (framePreviews.length === 0) {
      setError('Please add at least one frame.');
      return;
    }

    updateDraft({
      phone: customerSearch,
      customerName: matchedCustomer?.name ?? draft.customerName,
      price,
      selectedShape: shape ?? draft.selectedShape,
      frameImages: framePreviews,
    });
    setError('');
    router.push('/select-lens');
  };

  return (
    <View style={styles.screen}>
      <View style={styles.header}>
        <View style={[styles.headerInner, { maxWidth: containerWidth }]}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()} activeOpacity={0.85}>
            <ArrowLeft size={21} color="#1C1D21" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Order Placement</Text>
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.scrollContent, isTablet && styles.scrollContentTablet]}
      >
        <View style={[styles.content, { maxWidth: containerWidth }]}>
          <View style={styles.fieldCard}>
            <SectionLabel
              title="Search customer mobile number"
              icon={<SearchCustomerGlyph />}
            />
            <View style={styles.inputShell}>
              <TextInput
                value={customerSearch}
                onChangeText={(value) => {
                  setCustomerSearch(value);
                  setError('');
                }}
                style={styles.textInput}
                placeholder="Search customer mobile number"
                placeholderTextColor="#A5A7AE"
                keyboardType="phone-pad"
              />
              <Search size={18} color="#C0C2CA" strokeWidth={2} />
            </View>
          </View>

          <View style={[styles.frameRow, isTablet ? styles.frameRowTablet : styles.frameRowMobile]}>
            <View style={[styles.frameUploadCard, isTablet && styles.frameUploadCardTablet]}>
              <View style={styles.fieldCard}>
                <SectionLabel
                  title="Select Frame"
                  icon={
                    <Image
                      source={SELECT_FRAME_ICON}
                      style={styles.selectFrameIcon}
                      resizeMode="contain"
                    />
                  }
                />

                <View style={styles.uploadOptions}>
                  <UploadButton
                    label="Add Photo"
                    tint="warm"
                    icon={<Camera size={22} color="#FFAB12" strokeWidth={2.2} />}
                    onPress={() => handleUploadPress('camera')}
                  />
                  <Text style={styles.orLabel}>Or</Text>
                  <UploadButton
                    label="Gallery"
                    tint="cool"
                    icon={<ImageIcon size={22} color="#1B73DE" strokeWidth={2.2} />}
                    onPress={() => handleUploadPress('gallery')}
                  />
                </View>

                <Text style={styles.uploadCaption}>Upload to camera & gallery</Text>
              </View>
            </View>

            <View style={[styles.previewStrip, isTablet && styles.previewStripTablet]}>
              {framePreviews.map((item, index) => (
                <View
                  key={item.id}
                  style={[
                    styles.previewCard,
                    index === 0 ? styles.previewCardLarge : styles.previewCardSmall,
                  ]}
                >
                  <TouchableOpacity
                    style={styles.removeButton}
                    onPress={() => removeFrame(item.id)}
                    activeOpacity={0.85}
                  >
                    <X size={14} color="#FF9B35" strokeWidth={2.2} />
                  </TouchableOpacity>

                  {item.image ? (
                    <Image
                      source={{ uri: item.image }}
                      resizeMode="contain"
                      style={index === 0 ? styles.previewLargeImage : styles.previewSmallImage}
                    />
                  ) : (
                    <FrameArtwork shape={item.shape || 'rectangle'} large={index === 0} />
                  )}
                </View>
              ))}
            </View>
          </View>

          <View style={styles.fieldCard}>
            <SectionLabel
              title="Enter Price"
              icon={<IndianRupee size={18} color="#1B73DE" strokeWidth={2.4} />}
            />
            <View style={styles.inputShell}>
              <TextInput
                value={price}
                onChangeText={(value) => {
                  setPrice(value.replace(/[^0-9.]/g, ''));
                  setError('');
                }}
                style={styles.textInput}
                placeholder="Enter price"
                placeholderTextColor="#A5A7AE"
                keyboardType="decimal-pad"
              />
            </View>
          </View>

          {error ? (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          <TouchableOpacity style={styles.nextButton} onPress={handleNext} activeOpacity={0.88}>
            <Text style={styles.nextButtonText}>Next</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

function SectionLabel({
  title,
  icon,
}: {
  title: string;
  icon: ReactNode;
}) {
  return (
    <View style={styles.sectionLabelRow}>
      {icon}
      <Text style={styles.sectionLabelText}>{title}</Text>
    </View>
  );
}

function UploadButton({
  icon,
  label,
  tint,
  onPress,
}: {
  icon: ReactNode;
  label: string;
  tint: 'warm' | 'cool';
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      style={[styles.uploadButton, tint === 'warm' ? styles.uploadButtonWarm : styles.uploadButtonCool]}
      onPress={onPress}
      activeOpacity={0.88}
    >
      {icon}
      <Text style={styles.uploadButtonText}>{label}</Text>
    </TouchableOpacity>
  );
}

function SearchCustomerGlyph() {
  return (
    <View style={styles.customerGlyph}>
      <View style={styles.customerGlyphTop} />
      <View style={styles.customerGlyphBottom} />
      <View style={styles.customerGlyphDot} />
    </View>
  );
}

function FrameArtwork({ shape, large }: { shape: string; large: boolean }) {
  const stroke = '#1B1C20';

  if (shape === 'aviator') {
    return (
      <View style={[artStyles.row, large ? artStyles.rowLarge : artStyles.rowSmall]}>
        <View style={[artStyles.bridge, large ? artStyles.bridgeLarge : artStyles.bridgeSmall, { backgroundColor: stroke }]} />
        <View style={[artStyles.aviatorLens, large ? artStyles.aviatorLensLarge : artStyles.aviatorLensSmall, { borderColor: stroke }]} />
        <View style={[artStyles.aviatorLens, large ? artStyles.aviatorLensLarge : artStyles.aviatorLensSmall, { borderColor: stroke }]} />
      </View>
    );
  }

  return (
    <View style={[artStyles.row, large ? artStyles.rowLarge : artStyles.rowSmall]}>
      <View style={[artStyles.bridge, large ? artStyles.bridgeLarge : artStyles.bridgeSmall, { backgroundColor: stroke }]} />
      <View style={[shape === 'rectangle' ? artStyles.rectangleLens : artStyles.squareLens, large ? artStyles.lensLarge : artStyles.lensSmall, { borderColor: stroke }]} />
      <View style={[shape === 'rectangle' ? artStyles.rectangleLens : artStyles.squareLens, large ? artStyles.lensLarge : artStyles.lensSmall, { borderColor: stroke }]} />
    </View>
  );
}

const artStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
  },
  rowLarge: {
    height: 154,
  },
  rowSmall: {
    height: 112,
  },
  bridge: {
    position: 'absolute',
    borderRadius: 999,
  },
  bridgeLarge: {
    top: 73,
    width: 22,
    height: 4,
  },
  bridgeSmall: {
    top: 52,
    width: 14,
    height: 3,
  },
  squareLens: {
    borderWidth: 3,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
  },
  rectangleLens: {
    borderWidth: 3,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
  },
  lensLarge: {
    width: 94,
    height: 72,
  },
  lensSmall: {
    width: 50,
    height: 39,
  },
  aviatorLens: {
    borderWidth: 3,
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
  },
  aviatorLensLarge: {
    width: 80,
    height: 66,
  },
  aviatorLensSmall: {
    width: 42,
    height: 36,
  },
});

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#F8F8FD',
  },
  header: {
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#ECECF3',
    paddingTop: Platform.OS === 'ios' ? 52 : 28,
    paddingBottom: 16,
    paddingHorizontal: 16,
  },
  headerInner: {
    width: '100%',
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  headerTitle: {
    fontSize: 17,
    lineHeight: 22,
    fontWeight: '500',
    color: '#202128',
  },
  scrollContent: {
    paddingHorizontal: 12,
    paddingTop: 22,
    paddingBottom: 40,
  },
  scrollContentTablet: {
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  content: {
    width: '100%',
    alignSelf: 'center',
  },
  fieldCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E7E8F0',
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 10,
    ...Shadow.sm,
  },
  sectionLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionLabelText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#202128',
  },
  customerGlyph: {
    width: 18,
    height: 18,
    marginRight: 10,
    borderWidth: 1.4,
    borderColor: '#2080FF',
    borderRadius: 3,
    position: 'relative',
  },
  customerGlyphTop: {
    position: 'absolute',
    top: 3,
    left: 5.5,
    width: 5,
    height: 5,
    borderRadius: 2.5,
    borderWidth: 1.2,
    borderColor: '#2080FF',
  },
  customerGlyphBottom: {
    position: 'absolute',
    left: 3.5,
    bottom: 3,
    width: 9,
    height: 4,
    borderWidth: 1.2,
    borderColor: '#2080FF',
    borderTopWidth: 0,
    borderBottomLeftRadius: 5,
    borderBottomRightRadius: 5,
  },
  customerGlyphDot: {
    position: 'absolute',
    right: -2,
    top: -2,
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: '#2080FF',
  },
  selectFrameIcon: {
    width: 18,
    height: 18,
    marginRight: 10,
  },
  inputShell: {
    minHeight: 34,
    backgroundColor: '#F7F7F8',
    borderRadius: 10,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
  },
  textInput: {
    flex: 1,
    height: 34,
    fontSize: 12.5,
    color: '#1E2028',
  },
  frameRow: {
    gap: 10,
    marginTop: 24,
    marginBottom: 24,
  },
  frameRowTablet: {
    flexDirection: 'row',
    alignItems: 'stretch',
  },
  frameRowMobile: {
    flexDirection: 'column',
  },
  frameUploadCard: {
    width: '100%',
  },
  frameUploadCardTablet: {
    width: 278,
    flexShrink: 0,
  },
  uploadOptions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  uploadButton: {
    flex: 1,
    minHeight: 74,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  uploadButtonWarm: {
    backgroundColor: '#FFF4E7',
  },
  uploadButtonCool: {
    backgroundColor: '#DCEBFF',
  },
  uploadButtonText: {
    marginTop: 8,
    fontSize: 12,
    fontWeight: '500',
    color: '#1F2026',
  },
  orLabel: {
    width: 20,
    textAlign: 'center',
    fontSize: 12,
    color: '#8E919C',
  },
  uploadCaption: {
    marginTop: 14,
    marginBottom: 6,
    textAlign: 'center',
    fontSize: 12,
    color: '#878A94',
  },
  previewStrip: {
    flexDirection: 'row',
    gap: 10,
    flexWrap: 'wrap',
  },
  previewStripTablet: {
    flex: 1,
    flexWrap: 'nowrap',
  },
  previewCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E7E8F0',
    overflow: 'hidden',
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadow.sm,
  },
  previewCardLarge: {
    flex: 1.44,
    minHeight: 170,
    minWidth: 0,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  previewCardSmall: {
    flex: 0.72,
    minHeight: 170,
    minWidth: 0,
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  removeButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#FFF4E7',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
  },
  previewLargeImage: {
    width: '100%',
    height: 132,
  },
  previewSmallImage: {
    width: '100%',
    height: 86,
  },
  errorBox: {
    marginTop: 10,
    borderRadius: 10,
    backgroundColor: '#FEE2E2',
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  errorText: {
    fontSize: 12,
    color: '#B42318',
    fontWeight: '500',
  },
  nextButton: {
    width: 278,
    maxWidth: '100%',
    minHeight: 42,
    borderRadius: 8,
    backgroundColor: '#1C71D8',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 22,
    ...Shadow.sm,
  },
  nextButtonText: {
    fontSize: 13.5,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
