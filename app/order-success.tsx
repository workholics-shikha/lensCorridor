import { router, useLocalSearchParams } from 'expo-router';
import { Check, X } from 'lucide-react-native';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const brandImage = require('@/assets/images/Group-8734.png');

export default function OrderSuccessScreen() {
  const { orderId, invoiceDate } = useLocalSearchParams<{
    orderId?: string;
    invoiceDate?: string;
  }>();

  const resolvedOrderId = orderId || `INV-${Date.now().toString().slice(-8)}`;
  const resolvedInvoiceDate = invoiceDate || new Date().toLocaleDateString('en-GB');

  return (
    <View style={styles.screen}>
      <TouchableOpacity
        style={styles.closeButton}
        onPress={() => router.back()}
        activeOpacity={0.88}
      >
        <X size={18} color="#5E6470" />
      </TouchableOpacity>

      <Image source={brandImage} resizeMode="contain" style={styles.brandImage} />

      <View style={styles.card}>
        <View style={styles.iconCircle}>
          <Check size={42} color="#FFFFFF" strokeWidth={4.2} />
        </View>

        <Text style={styles.title}>Order Placed!</Text>
        <Text style={styles.subtitle}>
          Your order #{resolvedOrderId} has{'\n'}been placed success
        </Text>

        <TouchableOpacity
          style={styles.invoiceButton}
          activeOpacity={0.88}
          onPress={() => {
            router.push({
              pathname: '/invoice',
              params: {
                orderId: resolvedOrderId,
                invoiceDate: resolvedInvoiceDate,
              },
            });
          }}
        >
          <Text style={styles.invoiceButtonText}>View Invoice</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#F8F8FD',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  brandImage: {
    width: 170,
    height: 36,
    marginBottom: 18,
  },
  closeButton: {
    position: 'absolute',
    top: 24,
    right: 24,
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  card: {
    width: '100%',
    maxWidth: 192,
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingTop: 22,
    paddingBottom: 16,
  },
  iconCircle: {
    width: 78,
    height: 78,
    borderRadius: 39,
    backgroundColor: '#156FE5',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  title: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1C2027',
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 11.5,
    lineHeight: 16,
    color: '#8A8F99',
    textAlign: 'center',
    marginBottom: 16,
  },
  invoiceButton: {
    alignSelf: 'stretch',
    minHeight: 28,
    borderRadius: 6,
    backgroundColor: '#EEF1F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  invoiceButtonText: {
    fontSize: 11.5,
    fontWeight: '500',
    color: '#1C2027',
  },
});
