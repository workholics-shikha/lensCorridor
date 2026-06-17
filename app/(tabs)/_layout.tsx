import { Tabs } from 'expo-router';
import { Bell, Home, ShoppingBag } from 'lucide-react-native';
import { View, Text, StyleSheet, useWindowDimensions } from 'react-native';
import { Colors } from '@/lib/theme';
import { useCart } from '@/context/CartContext';

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
    backgroundColor: Colors.accent, borderRadius: 10,
    minWidth: 16, height: 16, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 3,
  },
  text: { color: Colors.white, fontSize: 9, fontWeight: '800' },
});

export default function TabsLayout() {
  const { width, height } = useWindowDimensions();
  const isTablet = width >= 768;
  const isLandscape = width > height;
  const isTabletLandscape = isTablet && isLandscape;
  const tabIconSize = isTabletLandscape ? 24 : isTablet ? 26 : 24;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: Colors.primary,
        tabBarInactiveTintColor: Colors.gray400,
        tabBarStyle: {
          backgroundColor: Colors.white,
          borderTopWidth: 0,
          height: isTabletLandscape ? 68 : isTablet ? 72 : 60,
          paddingBottom: isTablet ? 10 : 6,
          paddingTop: isTablet ? 8 : 6,
          paddingHorizontal: isTablet ? 18 : 10,
          borderTopLeftRadius: isTablet ? 22 : 18,
          borderTopRightRadius: isTablet ? 22 : 18,
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: 0,
          shadowColor: '#13213A',
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.06,
          shadowRadius: 8,
          elevation: 5,
        },
        tabBarLabelStyle: {
          fontSize: isTablet ? 11 : 10,
          fontWeight: '500',
          marginTop: isTablet ? 2 : 1,
        },
        tabBarItemStyle: { paddingVertical: isTablet ? 2 : 1 },
        sceneStyle: {
          backgroundColor: '#F3F4FB',
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color }) => <Home size={tabIconSize} color={color} />,
        }}
      />
      <Tabs.Screen
        name="wishlist"
        options={{
          href: null,
          title: 'Wishlist',
          tabBarIcon: ({ color }) => <ShoppingBag size={tabIconSize} color={color} />,
        }}
      />
      <Tabs.Screen
        name="orders"
        options={{
          title: 'Orders',
          tabBarIcon: ({ color }) => (
            <View>
              <ShoppingBag size={tabIconSize} color={color} />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Notification',
          tabBarIcon: ({ color }) => <Bell size={tabIconSize} color={color} />,
        }}
      />
    </Tabs>
  );
}
