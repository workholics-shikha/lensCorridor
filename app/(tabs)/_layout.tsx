import { Tabs } from 'expo-router';
import { Bell, Home, ShoppingBag } from 'lucide-react-native';
import { type ColorValue, View, Text, StyleSheet, useWindowDimensions } from 'react-native';
import { Colors } from '@/lib/theme';
import { useCart } from '@/context/CartContext';
import { scaleForTablet } from '@/lib/tabletTypography';
import { useTabBarLayoutMetrics } from '@/lib/tabBar';

function CartBadge() {
  const { cartCount } = useCart();
  if (cartCount === 0) return null;
  return (
    <View style={badge.container}>
      <Text style={badge.text}>{cartCount > 9 ? '9+' : cartCount}</Text>
    </View>
  );
}

const badge = StyleSheet.create({
  container: {
    position: 'absolute', top: -4, right: -8,
    backgroundColor: Colors.accent, borderRadius: scaleForTablet(10),
    minWidth: scaleForTablet(16), height: scaleForTablet(16), alignItems: 'center', justifyContent: 'center', paddingHorizontal: scaleForTablet(3),
  },
  text: { color: Colors.white, fontSize: scaleForTablet(9), fontWeight: '800' },
});

function TabItem({
  focused,
  color,
  label,
  icon,
}: {
  focused: boolean;
  color: ColorValue;
  label: string;
  icon: React.ReactNode;
}) {
  return (
    <View style={styles.tabPill}>
      {icon}
      <Text
        style={[styles.tabPillLabel, focused && styles.tabPillLabelActive, { color }]}
        numberOfLines={1}
        adjustsFontSizeToFit
        minimumFontScale={0.92}
      >
        {label}
      </Text>
    </View>
  );
}

export default function TabsLayout() {
  const { width, height } = useWindowDimensions();
  const isTablet = width >= 768;
  const isLandscape = width > height;
  const isTabletLandscape = isTablet && isLandscape;
  const tabIconSize = isTabletLandscape ? scaleForTablet(24, 26, 28) : isTablet ? scaleForTablet(24, 28, 30) : 24;
  const tabBarMetrics = useTabBarLayoutMetrics();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: Colors.primary,
        tabBarInactiveTintColor: Colors.gray400,
        tabBarShowLabel: false,
        tabBarStyle: {
          backgroundColor: Colors.white,
          borderTopWidth: 0,
          height: tabBarMetrics.totalHeight,
          paddingBottom: tabBarMetrics.bottomPadding + tabBarMetrics.insetBottom,
          paddingTop: tabBarMetrics.topPadding,
          paddingHorizontal: tabBarMetrics.horizontalPadding,
          borderTopLeftRadius: tabBarMetrics.radius,
          borderTopRightRadius: tabBarMetrics.radius,
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: 1000,
          shadowColor: '#13213A',
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.06,
          shadowRadius: 8,
          elevation: 20,
          overflow: 'visible',
        },
        tabBarItemStyle: {
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          paddingVertical: isTablet ? scaleForTablet(2, 2, 3) : 1,
        },
        sceneStyle: {
          backgroundColor: '#F3F4FB',
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, focused }) => (
            <TabItem
              focused={focused}
              color={color}
              label="Home"
              icon={<Home size={tabIconSize} color={color} />}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="wishlist"
        options={{
          href: null,
          title: 'Wishlist',
          tabBarIcon: ({ color, focused }) => (
            <TabItem
              focused={focused}
              color={color}
              label="Wishlist"
              icon={<ShoppingBag size={tabIconSize} color={color} />}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="orders"
        options={{
          title: 'Orders',
          tabBarIcon: ({ color, focused }) => (
            <TabItem
              focused={focused}
              color={color}
              label="Orders"
              icon={<ShoppingBag size={tabIconSize} color={color} />}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Notification',
          tabBarIcon: ({ color, focused }) => (
            <TabItem
              focused={focused}
              color={color}
              label="Notification"
              icon={<Bell size={tabIconSize} color={color} />}
            />
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabPill: {
    minWidth: scaleForTablet(64, 66, 72),
    maxWidth: scaleForTablet(110, 124, 132),
    paddingHorizontal: scaleForTablet(10, 8, 10),
    paddingVertical: scaleForTablet(6, 4, 5),
    borderRadius: scaleForTablet(14, 14, 16),
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    gap: scaleForTablet(2, 2, 3),
  },
  tabPillLabel: {
    width: '100%',
    fontSize: scaleForTablet(10, 11.5, 12.5),
    lineHeight: scaleForTablet(12, 13, 14),
    fontWeight: '600',
    textAlign: 'center',
    includeFontPadding: false,
    letterSpacing: -0.15,
  },
  tabPillLabelActive: {
    fontWeight: '700',
  },
});
