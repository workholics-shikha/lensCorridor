import { useEffect, useMemo, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Image, ImageBackground, Platform, useWindowDimensions,
} from 'react-native';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Menu, ShoppingCart } from 'lucide-react-native';
import { fetchFrameShapes } from '@/lib/api';
import { FrameShape } from '@/lib/types';
import { Colors, Spacing, Radius, FontSize, Shadow } from '@/lib/theme';
import { useCart } from '@/context/CartContext';

const logoImage = require('@/assets/images/whiteLogo.png');
const frameShapesTitleIcon = require('@/assets/images/healthicons_eyeglasses-24px.png');
const eyeTestTitleIcon = require('@/assets/images/ChatGPT Image Apr 9, 2026, 04_10_40 PM 2.png');
const repairTitleIcon = require('@/assets/images/ChatGPT Image Apr 9, 2026, 03_07_39 PM 6.png');
const eyeTestCardImage = require('@/assets/images/types-of-eye-exams 1.png');
const repairCardImage = require('@/assets/images/Optical-Lens-Lab-Replacement 1.png');

const QUICK_CARDS = [
  {
    key: 'eye-test',
    title: 'Eye Test',
    body: 'Book A Quick And Accurate Eye\nCheckup With Experts.',
    titleIcon: eyeTestTitleIcon,
    image: eyeTestCardImage,
    action: () => router.push('/prescription'),
  },
  {
    key: 'repair',
    title: 'Repair',
    body: 'Get Your Glasses Repaired\nQuickly And Hassle-Free.',
    titleIcon: repairTitleIcon,
    image: repairCardImage,
    action: () => {},
  },
];

export default function HomeScreen() {
  const { width, height } = useWindowDimensions();
  const isTablet = width >= 768;
  const isLandscape = width > height;
  const isTabletLandscape = isTablet && isLandscape;
  const { cartCount } = useCart();
  const [selectedShape, setSelectedShape] = useState('rectangle');
  const [frameShapes, setFrameShapes] = useState<FrameShape[]>([]);

  const metrics = useMemo(() => {
    const horizontalPadding = isTabletLandscape ? 26 : 20;
    const shapeCardWidth = isTabletLandscape ? 162 : isTablet ? 154 : 146;
    const shapeCardHeight = isTabletLandscape ? 122 : isTablet ? 132 : 134;
    const serviceCardHeight = isTabletLandscape ? 136 : isTablet ? 196 : 160;

    return {
      horizontalPadding,
      headerTopPadding: Platform.OS === 'ios' ? (isTabletLandscape ? 22 : 52) : (isTabletLandscape ? 18 : 36),
      headerBottomPadding: isTabletLandscape ? 24 : 18,
      logoWidth: isTabletLandscape ? 206 : isTablet ? 248 : 240,
      logoHeight: isTabletLandscape ? 34 : isTablet ? 48 : 42,
      surfaceRadius: isTabletLandscape ? 32 : 30,
      sectionTopPadding: isTabletLandscape ? 26 : 22,
      sectionGap: isTabletLandscape ? 22 : isTablet ? 24 : 16,
      shapeCardWidth: isTabletLandscape ? 172 : shapeCardWidth,
      shapeCardHeight: isTabletLandscape ? 130 : shapeCardHeight,
      shapeImageWidth: isTabletLandscape ? 128 : isTablet ? 138 : 114,
      shapeImageHeight: isTabletLandscape ? 72 : isTablet ? 84 : 74,
      shapeTitleSize: isTabletLandscape ? 20 : isTablet ? 22 : 17,
      serviceCardHeight,
      serviceBodySize: isTabletLandscape ? 17 : 19,
      serviceBodyLineHeight: isTabletLandscape ? 20 : 23,
    };
  }, [height, isTablet, isTabletLandscape, width]);

  useEffect(() => {
    fetchFrameShapes().then(setFrameShapes);
  }, []);

  const handleShapeSelect = (slug: string) => {
    setSelectedShape(slug);
    router.push({ pathname: '/checkout', params: { shape: slug } });
  };

  return (
    <View style={styles.container}>
      <View
        style={[
          styles.header,
          {
            paddingTop: metrics.headerTopPadding,
            paddingBottom: metrics.headerBottomPadding,
            paddingHorizontal: metrics.horizontalPadding,
          },
        ]}
      >
        <LinearGradient
          colors={['#1A6FD4', '#1A6FD4']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.headerPanel}
        >
          <HeaderPrintPattern />
          <View style={styles.headerRow}>
            <TouchableOpacity style={styles.headerIconButton} activeOpacity={0.8}>
              <Menu size={20} color={Colors.white} />
            </TouchableOpacity>

            <View style={styles.brandRow}>
              <Image
                source={logoImage}
                style={[
                  styles.logoImage,
                  { width: metrics.logoWidth, height: metrics.logoHeight },
                ]}
                resizeMode="contain"
              />
            </View>

            <TouchableOpacity
              style={styles.cartButton}
              onPress={() => router.push('/cart')}
              activeOpacity={0.85}
            >
              <ShoppingCart size={18} color={Colors.primary} />
              {cartCount > 0 ? (
                <View style={styles.cartBadge}>
                  <Text style={styles.cartBadgeText}>{cartCount > 9 ? '9+' : cartCount}</Text>
                </View>
              ) : null}
            </TouchableOpacity>
          </View>
        </LinearGradient>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.scrollContent, isTablet && styles.scrollContentTablet]}
      >
        <View
          style={[
            styles.surface,
            {
              borderTopLeftRadius: metrics.surfaceRadius,
              borderTopRightRadius: metrics.surfaceRadius,
              paddingTop: metrics.sectionTopPadding,
              flex: isTablet ? 1 : undefined,
              minHeight: isTablet ? height - 120 : undefined,
            },
          ]}
        >
          <SectionTitle title="Select Frame Shapes" iconSource={frameShapesTitleIcon} />
          {isTabletLandscape ? (
            <View
              style={[
                styles.shapeGrid,
                {
                  paddingHorizontal: metrics.horizontalPadding,
                  marginBottom: metrics.sectionGap + 2,
                },
              ]}
            >
              {frameShapes.map((shape) => {
                const active = selectedShape === shape.shape;

                return (
                  <TouchableOpacity
                    key={shape.id}
                    style={[
                      styles.shapeCard,
                      active && styles.shapeCardActive,
                      {
                        width: metrics.shapeCardWidth,
                        minHeight: metrics.shapeCardHeight,
                      },
                    ]}
                    onPress={() => handleShapeSelect(shape.shape)}
                    activeOpacity={0.85}
                  >
                    {shape.image ? (
                      <Image
                        source={{ uri: shape.image }}
                        style={[
                          styles.shapeImage,
                          {
                            width: metrics.shapeImageWidth,
                            height: metrics.shapeImageHeight,
                          },
                        ]}
                        resizeMode="contain"
                      />
                    ) : (
                      <FrameShapeArtwork slug={shape.shape} active={active} />
                    )}
                  <Text
                      style={[
                        styles.shapeLabel,
                        active && styles.shapeLabelActive,
                        { fontSize: metrics.shapeTitleSize },
                      ]}
                    >
                      {shape.title}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          ) : (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={[
                styles.shapesRow,
                {
                  paddingHorizontal: metrics.horizontalPadding,
                  paddingBottom: metrics.sectionGap + 4,
                },
              ]}
            >
              {frameShapes.map((shape) => {
                const active = selectedShape === shape.shape;

                return (
                  <TouchableOpacity
                    key={shape.id}
                    style={[
                      styles.shapeCard,
                      active && styles.shapeCardActive,
                      {
                        width: metrics.shapeCardWidth,
                        minHeight: metrics.shapeCardHeight,
                      },
                    ]}
                    onPress={() => handleShapeSelect(shape.shape)}
                    activeOpacity={0.85}
                  >
                    {shape.image ? (
                      <Image
                        source={{ uri: shape.image }}
                        style={[
                          styles.shapeImage,
                          {
                            width: metrics.shapeImageWidth,
                            height: metrics.shapeImageHeight,
                          },
                        ]}
                        resizeMode="contain"
                      />
                    ) : (
                      <FrameShapeArtwork slug={shape.shape} active={active} />
                    )}
                  <Text
                      style={[
                        styles.shapeLabel,
                        active && styles.shapeLabelActive,
                        { fontSize: metrics.shapeTitleSize },
                      ]}
                    >
                      {shape.title}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          )}

          <View
            style={[
              styles.quickCardsWrap,
              {
                paddingHorizontal: metrics.horizontalPadding,
                marginTop: metrics.sectionGap,
              },
            ]}
          >
            {QUICK_CARDS.map((card) => (
              <View key={card.key} style={styles.quickCardBlock}>
                <SectionTitle title={card.title} compact iconSource={card.titleIcon} />
                <TouchableOpacity
                  style={styles.quickCard}
                  onPress={card.action}
                  activeOpacity={0.9}
                >
                  <ImageBackground
                    source={card.image}
                    style={[styles.quickCardImage, { height: metrics.serviceCardHeight }]}
                    imageStyle={styles.quickCardImageStyle}
                    resizeMode="cover"
                  >
                    <View style={styles.quickCardOverlay}>
                      <Text
                        style={[
                          styles.quickCardBody,
                          {
                            fontSize: metrics.serviceBodySize,
                            lineHeight: metrics.serviceBodyLineHeight,
                          },
                        ]}
                      >
                        {card.body}
                      </Text>
                      <View style={styles.quickCardButton}>
                        <Text style={styles.quickCardButtonText}>Start Now</Text>
                      </View>
                    </View>
                  </ImageBackground>
                </TouchableOpacity>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

function SectionTitle({
  title,
  compact,
  iconSource,
}: {
  title: string;
  compact?: boolean;
  iconSource?: number;
}) {
  return (
    <View style={[styles.sectionTitleRow, compact && styles.sectionTitleRowCompact]}>
      {iconSource ? (
        <Image source={iconSource} style={styles.sectionTitleIcon} resizeMode="contain" />
      ) : (
        <View style={styles.sectionIconDot} />
      )}
      <Text style={styles.sectionTitle}>{title}</Text>
    </View>
  );
}

function HeaderPrintPattern() {
  return (
    <View pointerEvents="none" style={styles.headerPrint}>
      <EyeglassPatternShape style={{ top: -8, left: 108, transform: [{ rotate: '-16deg' }] }} />
      <EyeglassPatternShape style={{ top: -14, left: 238, transform: [{ rotate: '12deg' }] }} />
      <EyeglassPatternShape style={{ top: 26, left: 342, transform: [{ rotate: '-12deg' }] }} />
      <EyeglassPatternShape style={{ top: -6, left: 468, transform: [{ rotate: '18deg' }] }} />
      <EyeglassPatternShape style={{ top: -12, right: 256, transform: [{ rotate: '-14deg' }] }} />
      <EyeglassPatternShape style={{ top: 18, right: 138, transform: [{ rotate: '12deg' }] }} />
      <EyeglassPatternShape style={{ top: -10, right: 18, transform: [{ rotate: '-18deg' }] }} />
      <EyeglassPatternShape style={{ top: 54, right: 332, transform: [{ rotate: '16deg' }], opacity: 0.18 }} />
      <EyeglassPatternShape style={{ top: 58, right: 38, transform: [{ rotate: '-14deg' }], opacity: 0.18 }} />
    </View>
  );
}

function EyeglassPatternShape({
  style,
}: {
  style?: any;
}) {
  return (
    <View style={[styles.patternEyeglass, style]}>
      <View style={styles.patternBridge} />
      <View style={[styles.patternLens, styles.patternLensLeft]} />
      <View style={[styles.patternLens, styles.patternLensRight]} />
      <View style={[styles.patternTemple, styles.patternTempleLeft]} />
      <View style={[styles.patternTemple, styles.patternTempleRight]} />
    </View>
  );
}

function FrameShapeArtwork({ slug, active }: { slug: string; active: boolean }) {
  const stroke = active ? '#2B2B2B' : '#7C7C7C';

  if (slug === 'contact-lens') {
    return (
      <View style={styles.contactLensWrap}>
        <View style={[styles.contactLens, styles.contactLensLeft]} />
        <View style={[styles.contactLens, styles.contactLensRight]} />
      </View>
    );
  }

  if (slug === 'aviator') {
    return (
      <View style={styles.frameArtwork}>
        <View style={styles.bridgeLine} />
        <View style={[styles.aviatorLens, { borderColor: stroke }]} />
        <View style={[styles.aviatorLens, { borderColor: stroke }]} />
      </View>
    );
  }

  if (slug === 'geometric') {
    return (
      <View style={styles.frameArtwork}>
        <View style={[styles.bridgeLine, { backgroundColor: stroke }]} />
        <View style={[styles.geoLens, { borderColor: stroke }]} />
        <View style={[styles.geoLens, { borderColor: stroke }]} />
      </View>
    );
  }

  const lensStyle = slug === 'rectangle' ? styles.rectLens : styles.squareLens;

  return (
    <View style={styles.frameArtwork}>
      <View style={[styles.bridgeLine, { backgroundColor: stroke }]} />
      <View style={[lensStyle, { borderColor: stroke }]} />
      <View style={[lensStyle, { borderColor: stroke }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1A6FD4',
  },
  header: {
    backgroundColor: '#1A6FD4',
    paddingTop: Platform.OS === 'ios' ? 52 : 36,
    paddingHorizontal: Spacing.md,
    paddingBottom: 0,
  },
  headerPanel: {
    backgroundColor: '#1A6FD4',
    borderTopLeftRadius: 26,
    borderTopRightRadius: 26,
    overflow: 'hidden',
    paddingHorizontal: 0,
    paddingVertical: 0,
  },
  headerPrint: {
    ...StyleSheet.absoluteFillObject,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    // justifyContent: 'space-between',
    paddingHorizontal: 2,
    minHeight: 46,
  },
  patternEyeglass: {
    position: 'absolute',
    width: 76,
    height: 34,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    opacity: 0.24,
  },
  patternLens: {
    position: 'absolute',
    width: 28,
    height: 22,
    borderWidth: 1,
    borderColor: 'rgba(4,47,110,0.5)',
    borderRadius: 12,
    backgroundColor: 'transparent',
  },
  patternLensLeft: {
    left: 9,
  },
  patternLensRight: {
    right: 9,
  },
  patternBridge: {
    position: 'absolute',
    width: 12,
    height: 1,
    backgroundColor: 'rgba(4,47,110,0.5)',
    borderRadius: 999,
  },
  patternTemple: {
    position: 'absolute',
    width: 10,
    height: 1,
    backgroundColor: 'rgba(4,47,110,0.42)',
    borderRadius: 999,
    top: 12,
  },
  patternTempleLeft: {
    left: 1,
    transform: [{ rotate: '-20deg' }],
  },
  patternTempleRight: {
    right: 1,
    transform: [{ rotate: '20deg' }],
  },
  headerFrameGlyph: {
    position: 'absolute',
    width: 42,
    height: 22,
    borderWidth: 1,
    borderColor: 'rgba(7,67,145,0.36)',
    borderRadius: 11,
    opacity: 0.98,
  },
  headerFrameGlyphSmall: {
    position: 'absolute',
    width: 24,
    height: 13,
    borderWidth: 1,
    borderColor: 'rgba(7,67,145,0.32)',
    borderRadius: 7,
    opacity: 0.9,
  },
  headerIconButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandRow: {
    flex: 1,
    alignItems: 'flex-start',
    justifyContent: 'center',
    marginLeft: 8,
  },
  logoImage: {
    maxWidth: '100%',
  },
  cartButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  cartBadge: {
    position: 'absolute',
    top: -2,
    right: -3,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: Colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
  },
  cartBadgeText: {
    color: Colors.white,
    fontSize: 9,
    fontWeight: '800',
  },
  scrollContent: {
    paddingBottom: 10,
  },
  scrollContentTablet: {
    flexGrow: 1,
  },
  surface: {
    marginTop: -4,
    backgroundColor: '#F7F7FC',
    paddingBottom: Spacing.lg,
    minHeight: '100%',
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 14,
    paddingHorizontal: 26,
  },
  sectionTitleRowCompact: {
    paddingHorizontal: 0,
    marginBottom: 12,
  },
  sectionTitleIcon: {
    width: 24,
    height: 24,
  },
  sectionIconDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#E4F0FF',
    borderWidth: 2,
    borderColor: '#1682FF',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#20242E',
  },
  shapesRow: {
    gap: 6,
  },
  shapeGrid: {
    flexDirection: 'row',
    alignItems: 'stretch',
    justifyContent: 'space-between',
    gap: 6,
  },
  shapeCard: {
    borderRadius: 14,
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: '#E8E8EE',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.sm,
    paddingTop: 16,
    paddingBottom: 12,
    ...Shadow.sm,
  },
  shapeCardActive: {
    borderColor: '#FFB05B',
    backgroundColor: '#FFFDFC',
  },
  shapeImage: {
    marginTop: 2,
  },
  shapeLabel: {
    marginTop: 18,
    marginBottom: 2,
    fontWeight: '700',
    color: '#2D2F37',
    textAlign: 'center',
  },
  shapeLabelActive: {
    color: '#23242B',
    fontWeight: '800',
  },
  frameArtwork: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    height: 42,
  },
  bridgeLine: {
    position: 'absolute',
    top: 17,
    width: 14,
    height: 2,
    borderRadius: 1,
    backgroundColor: '#7C7C7C',
  },
  squareLens: {
    width: 30,
    height: 24,
    borderWidth: 2.5,
    borderRadius: 10,
    backgroundColor: '#FCFCFC',
  },
  rectLens: {
    width: 34,
    height: 22,
    borderWidth: 2.5,
    borderRadius: 8,
    backgroundColor: '#FCFCFC',
  },
  aviatorLens: {
    width: 28,
    height: 24,
    borderWidth: 2.5,
    borderRadius: 12,
    backgroundColor: '#FCFCFC',
  },
  geoLens: {
    width: 24,
    height: 24,
    borderWidth: 2.5,
    borderRadius: 7,
    transform: [{ rotate: '20deg' }],
    backgroundColor: '#FCFCFC',
  },
  contactLensWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    height: 42,
  },
  contactLens: {
    width: 23,
    height: 31,
    borderWidth: 1.5,
    borderColor: '#B6D9FF',
    backgroundColor: '#EAF6FF',
    opacity: 0.95,
  },
  contactLensLeft: {
    borderTopLeftRadius: 22,
    borderTopRightRadius: 18,
    borderBottomLeftRadius: 18,
    borderBottomRightRadius: 22,
    transform: [{ rotate: '28deg' }],
  },
  contactLensRight: {
    borderTopLeftRadius: 18,
    borderTopRightRadius: 22,
    borderBottomLeftRadius: 22,
    borderBottomRightRadius: 18,
    transform: [{ rotate: '-12deg' }],
  },
  quickCardsWrap: {
    flexDirection: 'row',
    gap: 20,
  },
  quickCardBlock: {
    flex: 1,
    minWidth: 0,
  },
  quickCard: {
    width: '100%',
    borderRadius: Radius.lg,
    overflow: 'hidden',
    backgroundColor: '#1B1B1F',
    ...Shadow.sm,
  },
  quickCardImage: {
    width: '100%',
    justifyContent: 'flex-end',
  },
  quickCardImageStyle: {
    width: '100%',
    height: '100%',
    borderRadius: Radius.lg,
  },
  quickCardOverlay: {
    flex: 1,
    backgroundColor: 'rgba(16,18,24,0.34)',
    paddingHorizontal: 12,
    paddingTop: 16,
    paddingBottom: 14,
    justifyContent: 'flex-end',
  },
  quickCardBody: {
    color: Colors.white,
    maxWidth: '88%',
    fontWeight: '400',
    marginBottom: 10,
  },
  quickCardButton: {
    alignSelf: 'flex-start',
    paddingHorizontal: 11,
    paddingVertical: 4,
    borderRadius: Radius.full,
    backgroundColor: '#FFB300',
  },
  quickCardButtonText: {
    color: '#1E1E1E',
    fontSize: 11,
    fontWeight: '700',
  },
});
