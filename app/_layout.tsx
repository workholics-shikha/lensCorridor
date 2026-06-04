import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useFrameworkReady } from '@/hooks/useFrameworkReady';
import { AuthProvider } from '@/context/AuthContext';
import { CartProvider } from '@/context/CartContext';
import { OrderFlowProvider } from '@/context/OrderFlowContext';

export default function RootLayout() {
  useFrameworkReady();

  return (
    <AuthProvider>
      <CartProvider>
        <OrderFlowProvider>
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="index" />
            <Stack.Screen name="(auth)" />
            <Stack.Screen name="(tabs)" />
            <Stack.Screen name="product/[id]" options={{ presentation: 'card' }} />
            <Stack.Screen name="cart" options={{ presentation: 'card' }} />
            <Stack.Screen name="checkout" options={{ presentation: 'card' }} />
            <Stack.Screen name="select-lens" options={{ presentation: 'card' }} />
            <Stack.Screen name="lens-details" options={{ presentation: 'card' }} />
            <Stack.Screen name="billing" options={{ presentation: 'card' }} />
            <Stack.Screen name="order-review" options={{ presentation: 'card' }} />
            <Stack.Screen name="payment-summary" options={{ presentation: 'card' }} />
            <Stack.Screen name="invoice" options={{ presentation: 'card' }} />
            <Stack.Screen name="order-details" options={{ presentation: 'card' }} />
            <Stack.Screen name="prescription" options={{ presentation: 'card' }} />
            <Stack.Screen name="order-success" options={{ presentation: 'modal' }} />
            <Stack.Screen name="+not-found" />
          </Stack>
          <StatusBar style="light" />
        </OrderFlowProvider>
      </CartProvider>
    </AuthProvider>
  );
}
