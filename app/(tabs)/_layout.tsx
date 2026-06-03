import { Tabs } from 'expo-router';
import { Bell, Home, ShoppingBag } from 'lucide-react-native';
import { View, Text, StyleSheet } from 'react-native';
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
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: Colors.primary,
        tabBarInactiveTintColor: Colors.gray400,
        tabBarStyle: {
          backgroundColor: Colors.white,
          borderTopWidth: 0,
          height: 74,
          paddingBottom: 10,
          paddingTop: 8,
          paddingHorizontal: 12,
          borderTopLeftRadius: 24,
          borderTopRightRadius: 24,
          position: 'absolute',
          left: 12,
          right: 12,
          bottom: 10,
          shadowColor: '#13213A',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.08,
          shadowRadius: 16,
          elevation: 8,
        },
        tabBarLabelStyle: { fontSize: 11, fontWeight: '500', marginTop: 2 },
        tabBarItemStyle: { paddingVertical: 2 },
        sceneStyle: {
          backgroundColor: '#F3F4FB',
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, size }) => <Home size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="wishlist"
        options={{
          href: null,
          title: 'Wishlist',
          tabBarIcon: ({ color, size }) => <ShoppingBag size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="orders"
        options={{
          title: 'Orders',
          tabBarIcon: ({ color, size }) => (
            <View>
              <ShoppingBag size={size} color={color} />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Notification',
          tabBarIcon: ({ color, size }) => <Bell size={size} color={color} />,
        }}
      />
    </Tabs>
  );
}
