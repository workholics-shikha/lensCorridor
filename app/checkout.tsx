import { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, Platform, Dimensions, Image,
} from 'react-native';
import { router } from 'expo-router';
import {
  ArrowLeft, Camera, Image as ImageIcon, IndianRupee, ScanSearch, X,
} from 'lucide-react-native';
import { fetchFrameShapes } from '@/lib/api';
import { FrameShape } from '@/lib/types';
import { Colors, Spacing, Radius, FontSize, Shadow } from '@/lib/theme';

const { width } = Dimensions.get('window');
const isTablet = width >= 768;

export default function CheckoutScreen() {
  const [customerSearch, setCustomerSearch] = useState('');
  const [frameShapes, setFrameShapes] = useState<FrameShape[]>([]);
  const [selectedFrame, setSelectedFrame] = useState('');
  const [price, setPrice] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    fetchFrameShapes().then((items) => {
      setFrameShapes(items);
      setSelectedFrame((current) => current || items[0]?.shape || '');
    });
  }, []);

  const handleNext = () => {
    if (!selectedFrame || !price.trim()) {
      setError('Please select a frame and enter the price before continuing.');
      return;
    }

    setError('');
    router.push('/cart');
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <ArrowLeft size={20} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Order Placement</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        contentContainerStyle={styles.body}
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.maxWidth, isTablet && styles.maxWidthTablet]}>
          <View style={styles.card}>
            <View style={styles.blockHeader}>
              <ScanSearch size={16} color={Colors.primary} />
              <Text style={styles.blockTitle}>Search customer mobile number</Text>
            </View>
            <View style={styles.searchShell}>
              <TextInput
                style={styles.searchInput}
                value={customerSearch}
                onChangeText={setCustomerSearch}
                placeholder="Search customer mobile number"
                placeholderTextColor="#A5A8B2"
                keyboardType="phone-pad"
              />
              <ScanSearch size={16} color="#B4B7C2" />
            </View>
          </View>

          <View style={styles.card}>
            <View style={styles.blockHeader}>
              <Text style={styles.blockTitle}>Select Frame</Text>
            </View>

            <View style={styles.frameGrid}>
              <TouchableOpacity
                style={[styles.uploadTile, styles.frameTile]}
                activeOpacity={0.9}
              >
                <View style={styles.uploadOptions}>
                  <TouchableOpacity style={styles.uploadButton} activeOpacity={0.85}>
                    <Camera size={18} color={Colors.accent} />
                    <Text style={styles.uploadButtonText}>Add Photo</Text>
                  </TouchableOpacity>
                  <Text style={styles.orText}>Or</Text>
                  <TouchableOpacity style={[styles.uploadButton, styles.uploadButtonBlue]} activeOpacity={0.85}>
                    <ImageIcon size={18} color={Colors.primary} />
                    <Text style={[styles.uploadButtonText, styles.uploadButtonTextBlue]}>Gallery</Text>
                  </TouchableOpacity>
                </View>
                <Text style={styles.uploadHint}>Upload to camera & gallery</Text>
              </TouchableOpacity>

              {frameShapes.map((frame) => {
                const active = selectedFrame === frame.shape;

                return (
                  <TouchableOpacity
                    key={frame.id}
                    style={[styles.frameTile, active && styles.frameTileActive]}
                    onPress={() => {
                      setSelectedFrame(frame.shape);
                      setError('');
                    }}
                    activeOpacity={0.88}
                  >
                    <View style={styles.tileClose}>
                      <X size={12} color="#FF9B3D" />
                    </View>
                    {frame.image ? (
                      <Image
                        source={{ uri: frame.image }}
                        style={styles.frameImage}
                        resizeMode="contain"
                      />
                    ) : (
                      <FramePreview shape={frame.shape} active={active} />
                    )}
                    <Text style={styles.frameLabel} numberOfLines={1}>{frame.title}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          <View style={styles.card}>
            <View style={styles.blockHeader}>
              <IndianRupee size={16} color={Colors.primary} />
              <Text style={styles.blockTitle}>Enter Price</Text>
            </View>
            <View style={styles.priceShell}>
              <TextInput
                style={styles.priceInput}
                value={price}
                onChangeText={setPrice}
                placeholder="Enter price"
                placeholderTextColor="#A5A8B2"
                keyboardType="numeric"
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

function FramePreview({ shape, active }: { shape: string; active: boolean }) {
  const stroke = active ? '#1F1F23' : '#34363F';

  if (shape === 'aviator') {
    return (
      <View style={previewStyles.frameRow}>
        <View style={[previewStyles.bridge, { backgroundColor: stroke }]} />
        <View style={[previewStyles.aviatorLens, { borderColor: stroke }]} />
        <View style={[previewStyles.aviatorLens, { borderColor: stroke }]} />
      </View>
    );
  }

  if (shape === 'contact-lens') {
    return (
      <View style={previewStyles.contactLensWrap}>
        <View style={previewStyles.contactLens} />
        <View style={previewStyles.contactLens} />
      </View>
    );
  }

  if (shape === 'geometric') {
    return (
      <View style={previewStyles.frameRow}>
        <View style={[previewStyles.bridge, { backgroundColor: stroke }]} />
        <View style={[previewStyles.geoLens, { borderColor: stroke }]} />
        <View style={[previewStyles.geoLens, { borderColor: stroke }]} />
      </View>
    );
  }

  return (
    <View style={previewStyles.frameRow}>
      <View style={[previewStyles.bridge, { backgroundColor: stroke }]} />
      <View style={[shape === 'rectangle' ? previewStyles.rectangleLens : previewStyles.squareLens, { borderColor: stroke }]} />
      <View style={[shape === 'rectangle' ? previewStyles.rectangleLens : previewStyles.squareLens, { borderColor: stroke }]} />
    </View>
  );
}

const previewStyles = StyleSheet.create({
  frameRow: {
    height: 72,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
  },
  bridge: {
    position: 'absolute',
    top: 34,
    width: 20,
    height: 3,
    borderRadius: 2,
  },
  squareLens: {
    width: 58,
    height: 42,
    borderWidth: 4,
    borderRadius: 17,
    backgroundColor: '#FEFEFF',
  },
  aviatorLens: {
    width: 46,
    height: 38,
    borderWidth: 3,
    borderRadius: 18,
    backgroundColor: '#FEFEFF',
  },
  roundLens: {
    width: 44,
    height: 44,
    borderWidth: 3,
    borderRadius: 22,
    backgroundColor: '#FEFEFF',
  },
  rectangleLens: {
    width: 58,
    height: 34,
    borderWidth: 4,
    borderRadius: 13,
    backgroundColor: '#FEFEFF',
  },
  geoLens: {
    width: 39,
    height: 39,
    borderWidth: 3,
    borderRadius: 10,
    transform: [{ rotate: '18deg' }],
    backgroundColor: '#FEFEFF',
  },
  contactLensWrap: {
    height: 72,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  contactLens: {
    width: 25,
    height: 34,
    borderWidth: 1.5,
    borderColor: '#B6D9FF',
    backgroundColor: '#EAF6FF',
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    borderBottomLeftRadius: 18,
    borderBottomRightRadius: 18,
    transform: [{ rotate: '16deg' }],
  },
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5FB',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    paddingTop: Platform.OS === 'ios' ? 52 : 36,
    paddingBottom: Spacing.md,
    paddingHorizontal: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: '#EFEFF4',
  },
  backBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    flex: 1,
    fontSize: FontSize.lg,
    fontWeight: '600',
    color: '#20222B',
    marginLeft: Spacing.xs,
  },
  headerSpacer: {
    width: 24,
  },
  body: {
    padding: Spacing.md,
    paddingBottom: Spacing.xxl,
    alignItems: isTablet ? 'center' : undefined,
  },
  maxWidth: {
    width: '100%',
  },
  maxWidthTablet: {
    maxWidth: 760,
  },
  card: {
    backgroundColor: Colors.white,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: '#ECECF4',
    ...Shadow.sm,
  },
  blockHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    marginBottom: Spacing.sm,
  },
  blockTitle: {
    fontSize: FontSize.sm,
    fontWeight: '600',
    color: '#242733',
  },
  searchShell: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FAFAFC',
    borderWidth: 1,
    borderColor: '#EFEFF4',
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.sm,
  },
  searchInput: {
    flex: 1,
    height: 42,
    color: Colors.text,
    fontSize: FontSize.sm,
  },
  frameGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  frameTile: {
    flexGrow: 1,
    minWidth: isTablet ? 148 : 132,
    flexBasis: isTablet ? '23%' : '46%',
    minHeight: 122,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: '#ECECF4',
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.sm,
    position: 'relative',
  },
  frameTileActive: {
    borderColor: '#BFD8FF',
    backgroundColor: '#FCFDFF',
  },
  tileClose: {
    position: 'absolute',
    top: 8,
    right: 8,
    zIndex: 1,
  },
  frameImage: {
    width: 100,
    height: 64,
  },
  frameLabel: {
    marginTop: Spacing.xs,
    fontSize: 11,
    fontWeight: '600',
    color: '#30323B',
  },
  uploadTile: {
    alignItems: 'stretch',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
  },
  uploadOptions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.sm,
  },
  uploadButton: {
    flex: 1,
    minHeight: 54,
    borderRadius: Radius.md,
    backgroundColor: '#FFF5E8',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
  },
  uploadButtonBlue: {
    backgroundColor: '#EDF5FF',
  },
  uploadButtonText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#7B4A14',
  },
  uploadButtonTextBlue: {
    color: Colors.primary,
  },
  orText: {
    fontSize: FontSize.xs,
    color: '#B0B3BE',
  },
  uploadHint: {
    marginTop: Spacing.sm,
    fontSize: 11,
    color: '#A6A8B2',
    textAlign: 'center',
  },
  priceShell: {
    backgroundColor: '#FAFAFC',
    borderWidth: 1,
    borderColor: '#EFEFF4',
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.sm,
  },
  priceInput: {
    height: 42,
    color: Colors.text,
    fontSize: FontSize.sm,
  },
  errorBox: {
    backgroundColor: '#FEE2E2',
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    marginBottom: Spacing.md,
  },
  errorText: {
    color: Colors.error,
    fontSize: FontSize.sm,
    fontWeight: '500',
  },
  nextButton: {
    width: isTablet ? 220 : 200,
    backgroundColor: Colors.primary,
    borderRadius: Radius.md,
    paddingVertical: Spacing.sm + 3,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadow.sm,
  },
  nextButtonText: {
    color: Colors.white,
    fontSize: FontSize.sm,
    fontWeight: '700',
  },
});
