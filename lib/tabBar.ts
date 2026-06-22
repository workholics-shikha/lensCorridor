import { useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { scaleForTablet } from '@/lib/tabletTypography';

export function getTabBarBaseHeight(width: number, height: number) {
  const isTablet = width >= 768;
  const isLandscape = width > height;
  const isTabletLandscape = isTablet && isLandscape;

  if (!isTablet) {
    return 60;
  }

  return isTabletLandscape ? scaleForTablet(68, 70, 74) : scaleForTablet(72, 76, 80);
}

export function getTabBarHorizontalPadding(width: number) {
  const isTablet = width >= 768;

  return isTablet ? scaleForTablet(18, 14, 18) : 10;
}

export function getTabBarTopPadding(width: number) {
  const isTablet = width >= 768;

  return isTablet ? scaleForTablet(8, 7, 8) : 6;
}

export function getTabBarBottomPadding(width: number) {
  const isTablet = width >= 768;

  return isTablet ? scaleForTablet(10, 8, 10) : 6;
}

export function getTabBarRadius(width: number) {
  const isTablet = width >= 768;

  return isTablet ? scaleForTablet(22, 22, 24) : 18;
}

export function useTabScreenBottomSpace(extra = 20) {
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const baseHeight = getTabBarBaseHeight(width, height);
  const bottomPadding = getTabBarBottomPadding(width);

  return baseHeight + bottomPadding + insets.bottom + extra;
}

export function useTabBarLayoutMetrics() {
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const baseHeight = getTabBarBaseHeight(width, height);
  const topPadding = getTabBarTopPadding(width);
  const bottomPadding = getTabBarBottomPadding(width);
  const totalHeight = baseHeight + insets.bottom;

  return {
    baseHeight,
    totalHeight,
    topPadding,
    bottomPadding,
    horizontalPadding: getTabBarHorizontalPadding(width),
    radius: getTabBarRadius(width),
    insetBottom: insets.bottom,
  };
}
