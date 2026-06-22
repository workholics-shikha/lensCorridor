import { useMemo } from 'react';
import { useWindowDimensions } from 'react-native';

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

export function getResponsiveMetrics(width: number, height: number) {
  const shortestSide = Math.min(width, height);
  const longestSide = Math.max(width, height);
  const isLandscape = width > height;
  const isTablet = shortestSide >= 600;
  const isLargeTablet = isTablet && shortestSide >= 800;
  const isExtraLargeTablet = isTablet && longestSide >= 1280;
  const horizontalPadding = isTablet
    ? clamp(Math.round(width * (isLandscape ? 0.024 : 0.03)), 18, isExtraLargeTablet ? 36 : 28)
    : clamp(Math.round(width * 0.05), 14, 20);
  const contentMaxWidth = isTablet
    ? Math.min(width - (horizontalPadding * 2), isExtraLargeTablet ? 1280 : isLargeTablet ? 1120 : 980)
    : width;
  const compact = width < 760 || height < 760;
  const cardGap = isTablet ? clamp(Math.round(shortestSide * 0.018), 14, 22) : 12;
  const controlHeight = isTablet ? clamp(Math.round(shortestSide * 0.07), 48, 60) : 42;

  return {
    width,
    height,
    shortestSide,
    longestSide,
    isLandscape,
    isTablet,
    isTabletPortrait: isTablet && !isLandscape,
    isTabletLandscape: isTablet && isLandscape,
    isLargeTablet,
    isExtraLargeTablet,
    compact,
    horizontalPadding,
    contentMaxWidth,
    cardGap,
    controlHeight,
  };
}

export function useResponsiveMetrics() {
  const { width, height } = useWindowDimensions();

  return useMemo(() => getResponsiveMetrics(width, height), [width, height]);
}
