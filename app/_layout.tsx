import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useFrameworkReady } from '@/hooks/useFrameworkReady';
import { AuthProvider } from '@/context/AuthContext';
import { CartProvider } from '@/context/CartContext';
import { OrderFlowProvider } from '@/context/OrderFlowContext';
import { ReturnExchangeProvider } from '@/context/ReturnExchangeContext';
import { RepairProvider } from '@/context/RepairContext';
import { installTabletTypographyScale } from '@/lib/tabletTypography';
import { SafeAreaProvider } from 'react-native-safe-area-context';

installTabletTypographyScale();

export default function RootLayout() {
  useFrameworkReady();

  return (
    <SafeAreaProvider>
      <AuthProvider>
        <CartProvider>
          <OrderFlowProvider>
            <ReturnExchangeProvider>
              <RepairProvider>
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
                  <Stack.Screen name="eye-test-history" options={{ presentation: 'card' }} />
                  <Stack.Screen name="return-exchange-search" options={{ presentation: 'card' }} />
                  <Stack.Screen name="return-exchange-return" options={{ presentation: 'card' }} />
                  <Stack.Screen name="return-exchange-exchange" options={{ presentation: 'card' }} />
                  <Stack.Screen name="return-exchange-invoice" options={{ presentation: 'card' }} />
                  <Stack.Screen name="repair-search" options={{ presentation: 'card' }} />
                  <Stack.Screen name="repair-request" options={{ presentation: 'card' }} />
                  <Stack.Screen name="repair-invoice" options={{ presentation: 'card' }} />
                  <Stack.Screen name="order-success" options={{ presentation: 'modal' }} />
                  <Stack.Screen name="+not-found" />
                </Stack>
                <StatusBar style="light" />
              </RepairProvider>
            </ReturnExchangeProvider>
          </OrderFlowProvider>
        </CartProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}
