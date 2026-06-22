import { useEffect, useMemo, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Image, ImageBackground, Platform, useWindowDimensions,
} from 'react-native';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { ArrowLeft, ShoppingCart } from 'lucide-react-native';
import { fetchFrameShapes } from '@/lib/api';
import { FrameShape } from '@/lib/types';
import { Colors, Spacing, Radius, Shadow } from '@/lib/theme';
import { useCart } from '@/context/CartContext';
import { useTabScreenBottomSpace } from '@/lib/tabBar';
import { useResponsiveMetrics } from '@/lib/responsive';

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
    action: () => { },
  },
];

export default function HomeScreen() {
  const { width, height } = useWindowDimensions();
  const viewport = useResponsiveMetrics();
  const isSmallPhone = width < 390;
  const isLargePhone = width >= 480 && !viewport.isTablet;
  const isTablet = viewport.isTablet;
  const isLandscape = viewport.isLandscape;
  const isTabletLandscape = viewport.isTabletLandscape;
  const isTabletPortrait = viewport.isTabletPortrait;
  const isLargeTablet = viewport.isLargeTablet;
  const { cartCount } = useCart();
  const bottomSafeSpace = useTabScreenBottomSpace(isTablet ? 28 : 20);
  const [selectedShape, setSelectedShape] = useState('rectangle');
  const [frameShapes, setFrameShapes] = useState<FrameShape[]>([]);

  const metrics = useMemo(() => {
    const contentWidth = viewport.contentMaxWidth;
    const horizontalPadding = viewport.horizontalPadding;
   const shapeCardWidth =
  isTabletLandscape
    ? (isLargeTablet ? 220 : 195)
    : isTabletPortrait
    ? 185
    : isLargePhone
    ? 178
    : 162;

const shapeCardHeight =
  isTabletLandscape ? 168 :
  isTabletPortrait ? 170 :
  152;
    const serviceCardHeight = isTabletLandscape ? 136 : isTabletPortrait ? 154 : 172;
    const headerTopPadding = Platform.OS === 'ios'
      ? (isTabletLandscape ? 42 : isTabletPortrait ? 62 : 68)
      : (isTabletLandscape ? 28 : isTabletPortrait ? 40 : 48);
    const headerBottomPadding = isTabletLandscape ? 24 : isTablet ? 30 : 24;
    const headerVisualHeight = headerTopPadding
      + headerBottomPadding
      + 46;
    const surfaceMinHeight = Math.max(
      isTabletLandscape ? 420 : 360,
      height - headerVisualHeight - (isTablet ? 8 : 0),
    );

    return {
      contentWidth,
      horizontalPadding,
      headerTopPadding,
      headerBottomPadding,
      logoWidth: isTabletLandscape ? 214 : isTablet ? 248 : 214,
      logoHeight: isTabletLandscape ? 46 : isTablet ? 60 : 46,
      // surfaceRadius: isTabletLandscape ? 60 : isTablet ? 52 : 28,
      // surfaceOverlap: isTabletLandscape ? 18 : isTablet ? 14 : 8,

      surfaceRadius: isTabletLandscape ? 42 : isTablet ? 40 : 28,
      surfaceOverlap: isTabletLandscape ? 0 : isTablet ? 0 : 0,

      sectionTopPadding: isTabletLandscape ? 42 : isTablet ? 38 : 28,
      shapeCardWidth,
      shapeCardHeight,
      shapeImageWidth: isTabletLandscape ? 145 : isTabletPortrait ? 132 : isLargePhone ? 132 : 128,
      shapeImageHeight: isTabletLandscape ? 86 : isTabletPortrait ? 78 : isLargePhone ? 88 : 84,

      shapeTitleSize: isTabletLandscape ? 19 : isTabletPortrait ? 19 : 18,
      serviceCardHeight,
      serviceBodySize: isTabletLandscape ? 12.5 : isTabletPortrait ? 13.5 : 19,
      serviceBodyLineHeight: isTabletLandscape ? 16 : isTabletPortrait ? 18 : 23,

      sectionTitleSize: isTabletLandscape ? 21 : isTablet ? 22 : 24,
      sectionIconSize: isTabletLandscape ? 32 : isTablet ? 34 : 36,
      sectionTitleGap: isTabletLandscape ? 12 : 14,
      
      sectionTitlePadding: isTabletLandscape ? 24 : isTablet ? 24 : 26,
      frameSectionBottomPadding: isTabletLandscape ? 6 : isTablet ? 12 : 16,
      serviceTopMargin: isTabletLandscape ? 22 : isTablet ? 18 : 18,
      quickCardGap: isTabletLandscape ? 14 : isTablet ? 16 : 20,
      surfaceMinHeight,
      centerSpacerMinHeight: isTabletLandscape ? 24 : isTablet ? 20 : 20,
    };
  }, [height, isLargePhone, isLargeTablet, isSmallPhone, isTablet, isTabletLandscape, isTabletPortrait, width]);

  useEffect(() => {
    fetchFrameShapes().then(setFrameShapes);
  }, []);

  const handleBack = () => {
    if (router.canGoBack()) {
      router.back();
      return;
    }

    router.replace('/');
  };

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
            alignItems: 'center',
          },
        ]}
      >
        <LinearGradient
          colors={['#1A6FD4', '#1A6FD4']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.headerPanel, { width: '100%', maxWidth: metrics.contentWidth }]}
        >
          <HeaderPrintPattern />
          <View style={styles.headerRow}>
            {/* <TouchableOpacity style={styles.headerIconButton} activeOpacity={0.8}>
              <Menu size={20} color={Colors.white} />
            </TouchableOpacity> */}

            <TouchableOpacity style={styles.backButton} onPress={handleBack} activeOpacity={0.85}>
              <ArrowLeft size={21} color="#1C1D21" />
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
        contentContainerStyle={[
          styles.scrollContent,
          { minHeight: height },
          { paddingBottom: bottomSafeSpace },
        ]}
      >
        <View
          style={[
            styles.surface,
            {
              borderTopLeftRadius: metrics.surfaceRadius,
              borderTopRightRadius: metrics.surfaceRadius,
              borderCurve: 'continuous',
              paddingTop: metrics.sectionTopPadding,
              width: '100%',
              minHeight: metrics.surfaceMinHeight + bottomSafeSpace,
              overflow: 'hidden',
            },
          ]}
        >
          <View style={styles.surfaceBody}>
            <View>
              <SectionTitle
                title="Select Frame Shapes"
                iconSource={frameShapesTitleIcon}
                titleSize={metrics.sectionTitleSize}
                gap={metrics.sectionTitleGap}
                paddingHorizontal={metrics.sectionTitlePadding}
                iconSize={metrics.sectionIconSize}
              />
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={[
                  styles.shapesRow,
                  isTabletLandscape && styles.shapesRowTablet,
                  {
                    paddingHorizontal: metrics.horizontalPadding,
                    paddingBottom: metrics.frameSectionBottomPadding,
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
                          height: metrics.shapeCardHeight,
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
            </View>

            <View
              style={[
                styles.centerSpacer,
                {
                  minHeight: metrics.centerSpacerMinHeight,
                },
              ]}
            >
              <MiddleSurfacePattern />
            </View>

            <View
              style={[
                styles.quickCardsWrap,
                {
                  paddingHorizontal: metrics.horizontalPadding,
                  marginTop: metrics.serviceTopMargin,
                  gap: metrics.quickCardGap,
                },
              ]}
            >
              {QUICK_CARDS.map((card) => (
                <View
                  key={card.key}
                  style={[
                    styles.quickCardBlock,
                    isTabletLandscape && styles.quickCardBlockTablet,
                  ]}
                >
                  <SectionTitle
                    title={card.title}
                    compact
                    iconSource={card.titleIcon}
                    titleSize={metrics.sectionTitleSize}
                    gap={metrics.sectionTitleGap}
                    iconSize={metrics.sectionIconSize}
                  />
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
        </View>
      </ScrollView>
    </View>
  );
}

function SectionTitle({
  title,
  compact,
  iconSource,
  titleSize = 18,
  gap = 10,
  paddingHorizontal = 26,
  iconSize = 24,
}: {
  title: string;
  compact?: boolean;
  iconSource?: number;
  titleSize?: number;
  gap?: number;
  paddingHorizontal?: number;
  iconSize?: number;
}) {
  return (
    <View
      style={[
        styles.sectionTitleRow,
        compact && styles.sectionTitleRowCompact,
        { gap, paddingHorizontal },
      ]}
    >
      {iconSource ? (
        <Image source={iconSource} style={[styles.sectionTitleIcon, { width: iconSize, height: iconSize }]} resizeMode="contain" />
      ) : (
        <View style={styles.sectionIconDot} />
      )}
      <Text style={[styles.sectionTitle, { fontSize: titleSize }]}>{title}</Text>
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

function MiddleSurfacePattern() {
  return (
    <View pointerEvents="none" style={styles.middlePattern}>
      <EyeglassPatternShape style={{ top: 6, left: 52, transform: [{ rotate: '-12deg' }], opacity: 0.1 }} />
      <EyeglassPatternShape style={{ top: 24, left: 208, transform: [{ rotate: '14deg' }], opacity: 0.08 }} />
      <EyeglassPatternShape style={{ top: 8, right: 220, transform: [{ rotate: '-10deg' }], opacity: 0.08 }} />
      <EyeglassPatternShape style={{ top: 30, right: 48, transform: [{ rotate: '16deg' }], opacity: 0.1 }} />
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
    alignSelf: 'center',
    // borderTopLeftRadius: 26,
    // borderTopRightRadius: 26,
    // overflow: 'hidden',
    // paddingHorizontal: 0,
    // paddingVertical: 0,
  },
  headerPrint: {
    ...StyleSheet.absoluteFill,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 0,
    minHeight: 48,
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
  backButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.white,
    marginRight: 8,
  },
  brandRow: {
    flex: 1,
    alignItems: 'flex-start',
    justifyContent: 'center',
    marginLeft: 0,
  },
  logoImage: {
    maxWidth: '100%',
  },
  cartButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
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
    flexGrow: 1,
  },
  scrollContentTablet: {
    alignItems: 'center',
  },
  surface: {
    flex: 1,
    backgroundColor: '#FBFBFE',
    paddingBottom: Spacing.lg,
    justifyContent: 'flex-start',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    overflow: 'hidden',
    ...(Platform.OS === 'ios' ? { borderCurve: 'continuous' as const } : {}),
  },
  surfaceBody: {
    flex: 1,
    justifyContent: 'flex-start',
  },
  centerSpacer: {
    position: 'relative',
    justifyContent: 'center',
    marginTop: 10,
    marginBottom: 14,
  },
  middlePattern: {
    ...StyleSheet.absoluteFill,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    marginBottom: 18,
  },
  sectionTitleRowCompact: {
    paddingHorizontal: 0,
    marginBottom: 10,
  },
  sectionTitleIcon: {
    width: 26,
    height: 26,
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
    fontSize: 15,
    fontWeight: '500',
    color: '#20242E',
  },
  shapesRow: {
    gap: 12,
  },
  shapesRowTablet: {
    gap: 12,
  },
  shapeCard: {
    borderRadius: 12,
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: '#E8E8EE',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 10,
    paddingTop: 16,
    paddingBottom: 14,
    ...Shadow.sm,
  },
  shapeCardActive: {
    borderColor: '#FFB05B',
    backgroundColor: '#FFFDFC',
  },
  shapeImage: {
    marginTop: 0,
  },
  // shapeLabel: {
  //   marginTop: 12,
  //   marginBottom: 2,
  //   fontWeight: '800',
  //   color: '#2D2F37',
  //   textAlign: 'center',
  //   lineHeight: 18,
  // },
  shapeLabel: {
    marginTop: 14,
    marginBottom: 2,
    fontWeight: '500',
    color: '#2D2F37',
    textAlign: 'center',
    lineHeight: 22,
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
    gap: 14,
  },
  quickCardBlock: {
    flex: 1,
    minWidth: 0,
  },
  quickCardBlockTablet: {
    justifyContent: 'flex-start',
  },
  quickCard: {
    width: '100%',
    borderRadius: 14,
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
    borderRadius: 14,
  },
  quickCardOverlay: {
    flex: 1,
    backgroundColor: 'rgba(16,18,24,0.34)',
    paddingHorizontal: 14,
    paddingTop: 14,
    paddingBottom: 14,
    justifyContent: 'flex-end',
  },
  quickCardBody: {
    color: Colors.white,
    maxWidth: '84%',
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
