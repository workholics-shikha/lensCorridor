import { router, useLocalSearchParams } from 'expo-router';
import { Check, X } from 'lucide-react-native';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const brandImage = require('@/assets/images/blueLogo.png');

export default function OrderSuccessScreen() {
  const { orderId, invoiceDate, recordId, invoiceSnapshot } = useLocalSearchParams<{
    orderId?: string;
    invoiceDate?: string;
    recordId?: string;
    invoiceSnapshot?: string;
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
                recordId,
                invoiceSnapshot,
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
    width: 250,
    height: 54,
    marginBottom: 28,
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
    maxWidth: 280,
    borderRadius: 24,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 28,
    paddingBottom: 22,
  },
  iconCircle: {
    width: 92,
    height: 92,
    borderRadius: 46,
    backgroundColor: '#156FE5',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 18,
  },
  title: {
    fontSize: 24,
    fontWeight: '600',
    color: '#1C2027',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15.5,
    lineHeight: 23,
    color: '#8A8F99',
    textAlign: 'center',
    marginBottom: 20,
  },
  invoiceButton: {
    alignSelf: 'stretch',
    minHeight: 50,
    borderRadius: 12,
    backgroundColor: '#EEF1F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  invoiceButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1C2027',
  },
});
