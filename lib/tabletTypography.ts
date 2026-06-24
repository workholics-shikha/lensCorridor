import React from 'react';
import {
  Dimensions,
  FlatList,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

const TABLET_MIN_WIDTH = 600;
const LARGE_TABLET_MIN_WIDTH = 1180;
const TABLET_FONT_SCALE = 1.22;
const LARGE_TABLET_FONT_SCALE = 1.3;

let installed = false;
let originalCreateElement: typeof React.createElement | null = null;

export function getTabletFontScale() {
  const { width, height } = Dimensions.get('window');
  const shortestSide = Math.min(width, height);
  const longestSide = Math.max(width, height);

  if (shortestSide < TABLET_MIN_WIDTH && longestSide < TABLET_MIN_WIDTH) {
    return 1;
  }

  return longestSide >= LARGE_TABLET_MIN_WIDTH ? LARGE_TABLET_FONT_SCALE : TABLET_FONT_SCALE;
}

export function isTabletViewport() {
  return getTabletFontScale() > 1;
}

function scaleValue(value: number, scale: number) {
  return Math.round(value * scale * 10) / 10;
}

export function scaleForTablet(phoneValue: number, tabletValue?: number, largeTabletValue?: number) {
  const scale = getTabletFontScale();

  if (scale === 1) {
    return phoneValue;
  }

  if (scale >= LARGE_TABLET_FONT_SCALE && typeof largeTabletValue === 'number') {
    return largeTabletValue;
  }

  if (typeof tabletValue === 'number') {
    return tabletValue;
  }

  return scaleValue(phoneValue, scale);
}

function scaleStyle(style: unknown, scale: number, keys: string[]): unknown {
  if (scale === 1 || style == null) {
    return style;
  }

  if (typeof style === 'function') {
    return (...args: unknown[]) => scaleStyle(style(...args), scale, keys);
  }

  const flattenedStyle = StyleSheet.flatten(style);

  if (!flattenedStyle || typeof flattenedStyle !== 'object') {
    return style;
  }

  const nextStyle = { ...flattenedStyle } as Record<string, unknown>;
  let changed = false;

  for (const key of keys) {
    if (typeof nextStyle[key] === 'number') {
      nextStyle[key] = scaleValue(nextStyle[key] as number, scale);
      changed = true;
    }
  }

  return changed ? nextStyle : style;
}

function scaleHitSlop(hitSlop: unknown, scale: number) {
  if (scale === 1 || hitSlop == null) {
    return hitSlop;
  }

  if (typeof hitSlop === 'number') {
    return scaleValue(hitSlop, scale);
  }

  if (typeof hitSlop !== 'object') {
    return hitSlop;
  }

  const nextHitSlop = { ...(hitSlop as Record<string, unknown>) };
  let changed = false;

  for (const key of ['top', 'right', 'bottom', 'left', 'horizontal', 'vertical']) {
    if (typeof nextHitSlop[key] === 'number') {
      nextHitSlop[key] = scaleValue(nextHitSlop[key] as number, scale);
      changed = true;
    }
  }

  return changed ? nextHitSlop : hitSlop;
}

const TEXT_STYLE_KEYS = ['fontSize', 'lineHeight'];
const SURFACE_STYLE_KEYS = [
  'width',
  'height',
  'minWidth',
  'maxWidth',
  'minHeight',
  'maxHeight',
  'padding',
  'paddingTop',
  'paddingRight',
  'paddingBottom',
  'paddingLeft',
  'paddingVertical',
  'paddingHorizontal',
  'margin',
  'marginTop',
  'marginRight',
  'marginBottom',
  'marginLeft',
  'marginVertical',
  'marginHorizontal',
  'borderRadius',
  'borderTopLeftRadius',
  'borderTopRightRadius',
  'borderBottomLeftRadius',
  'borderBottomRightRadius',
  'gap',
  'rowGap',
  'columnGap',
];
const INPUT_STYLE_KEYS = [
  ...TEXT_STYLE_KEYS,
  ...SURFACE_STYLE_KEYS,
];
const TOUCHABLE_STYLE_KEYS = [
  ...SURFACE_STYLE_KEYS,
];
const IMAGE_STYLE_KEYS = [
  'width',
  'height',
  'minWidth',
  'maxWidth',
  'minHeight',
  'maxHeight',
  'borderRadius',
  'borderTopLeftRadius',
  'borderTopRightRadius',
  'borderBottomLeftRadius',
  'borderBottomRightRadius',
  'margin',
  'marginTop',
  'marginRight',
  'marginBottom',
  'marginLeft',
  'marginVertical',
  'marginHorizontal',
];

function scaleSharedProps(props: Record<string, unknown>, scale: number, styleKeys: string[]) {
  const nextProps = { ...props };

  if ('style' in props) {
    nextProps.style = scaleStyle(props.style, scale, styleKeys);
  }

  if ('contentContainerStyle' in props) {
    nextProps.contentContainerStyle = scaleStyle(props.contentContainerStyle, scale, SURFACE_STYLE_KEYS);
  }

  if ('hitSlop' in props) {
    nextProps.hitSlop = scaleHitSlop(props.hitSlop, scale);
  }

  if (typeof props.size === 'number') {
    nextProps.size = scaleValue(props.size, scale);
  }

  if (typeof props.iconSize === 'number') {
    nextProps.iconSize = scaleValue(props.iconSize, scale);
  }

  return nextProps;
}

export function installTabletTypographyScale() {
  if (installed) {
    return;
  }

  originalCreateElement = React.createElement;

  React.createElement = ((type: unknown, props: Record<string, unknown> | null, ...children: unknown[]) => {
    const scale = getTabletFontScale();

    if (!props || scale === 1) {
      return originalCreateElement!(type as never, props as never, ...children as never[]);
    }

    if (type === Text) {
      return originalCreateElement!(
        type as never,
        scaleSharedProps(props, scale, [...SURFACE_STYLE_KEYS, ...TEXT_STYLE_KEYS]) as never,
        ...children as never[]
      );
    }

    if (type === TextInput) {
      return originalCreateElement!(
        type as never,
        scaleSharedProps(props, scale, INPUT_STYLE_KEYS) as never,
        ...children as never[]
      );
    }

    if (type === TouchableOpacity || type === Pressable) {
      return originalCreateElement!(
        type as never,
        scaleSharedProps(props, scale, TOUCHABLE_STYLE_KEYS) as never,
        ...children as never[]
      );
    }

    if (type === View || type === ScrollView || type === FlatList) {
      return originalCreateElement!(
        type as never,
        scaleSharedProps(props, scale, SURFACE_STYLE_KEYS) as never,
        ...children as never[]
      );
    }

    if (type === Image) {
      return originalCreateElement!(
        type as never,
        scaleSharedProps(props, scale, IMAGE_STYLE_KEYS) as never,
        ...children as never[]
      );
    }

    if (typeof props.size === 'number' || typeof props.iconSize === 'number') {
      return originalCreateElement!(
        type as never,
        scaleSharedProps(props, scale, []) as never,
        ...children as never[]
      );
    }

    return originalCreateElement!(type as never, props as never, ...children as never[]);
  }) as typeof React.createElement;

  installed = true;
}
