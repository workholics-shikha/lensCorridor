import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { ArrowLeft, FileText, Phone } from 'lucide-react-native';
import { useOrderFlow } from '@/context/OrderFlowContext';
import { fetchOrderPlacementById, type OrderPlacementRecord } from '@/lib/api';
import { buildDraftFromOrder } from '@/lib/orderFlow';
import { Colors, Shadow } from '@/lib/theme';

export default function OrderDetailsScreen() {
  const { orderId } = useLocalSearchParams<{ orderId?: string }>();
  const { draft, updateDraft } = useOrderFlow();
  const [order, setOrder] = useState<OrderPlacementRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!orderId) {
      setError('Order details are not available.');
      setLoading(false);
      return;
    }

    let active = true;

    fetchOrderPlacementById(orderId)
      .then((item) => {
        if (active) {
          setOrder(item);
        }
      })
      .catch(() => {
        if (active) {
          setError('Unable to load order details right now.');
        }
      })
      .finally(() => {
        if (active) {
          setLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, [orderId]);

  const lensRows = useMemo(() => {
    if (!order) {
      return [];
    }

    const rightEye = order.lensDetails.find((item) => item.eye === 'right');
    const leftEye = order.lensDetails.find((item) => item.eye === 'left');

    return [
      {
        label: 'LEFT',
        sph: leftEye?.sph || '-',
        cyl: leftEye?.cyl || '-',
        axis: leftEye?.axis || '-',
      },
      {
        label: 'RIGHT',
        sph: rightEye?.sph || '-',
        cyl: rightEye?.cyl || '-',
        axis: rightEye?.axis || '-',
      },
    ];
  }, [order]);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  if (!order) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>{error || 'Order not found.'}</Text>
      </View>
    );
  }

  const frameImage = order.frame.images.find((item) => item.image)?.image;
  const orderDate = new Date(order.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
  const handleReorder = () => {
    updateDraft(buildDraftFromOrder(order, draft));
    router.push('/billing');
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()} activeOpacity={0.86}>
          <ArrowLeft size={18} color="#1C1D21" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Order Details</Text>
      </View>

      <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
        <View style={styles.card}>
          <View style={styles.customerStrip}>
            <Text style={styles.customerStripText}>
              Customer Name - <Text style={styles.customerStripStrong}>{order.customer.name || 'Customer'}</Text>
            </Text>
            <View style={styles.phoneWrap}>
              <Phone size={11} color={Colors.primary} />
              <Text style={styles.phoneText}>{order.customer.phone}</Text>
            </View>
          </View>

          <View style={styles.productBlock}>
            <View style={styles.productImageShell}>
              {frameImage ? (
                <Image source={{ uri: frameImage }} resizeMode="contain" style={styles.productImage} />
              ) : (
                <View style={styles.imageFallback} />
              )}
            </View>

            <View style={styles.productInfo}>
              <Text style={styles.productTitle}>Lenscorridor frame</Text>
              <Text style={styles.productSubtitle}>
                Frame + {order.lensSelection.lensCategory || order.lensSelection.powerType || 'Lens'}
              </Text>
              <Text style={styles.productPrice}>Rs{order.billing.totalPayable}</Text>
            </View>

            <View style={styles.metaColumn}>
              <Text style={styles.metaText}>Order ID: {order.orderNumber}</Text>
              <Text style={styles.metaText}>Order Date: {orderDate}</Text>
              <Text style={styles.metaText}>Total Price: Rs{order.billing.totalPayable}</Text>
            </View>
          </View>

          <View style={styles.detailPanel}>
            <View style={styles.detailPanelHeader}>
              <Text style={styles.detailPanelName}>{order.customer.name || 'Customer'}</Text>
            </View>

            <View style={styles.rxHeader}>
              <Text style={styles.rxBlank} />
              <Text style={styles.rxHeaderText}>Spherical (SPH)</Text>
              <Text style={styles.rxHeaderText}>Cylindrical (CYL)</Text>
              <Text style={styles.rxHeaderText}>Axis (0-180)</Text>
            </View>

            {lensRows.map((row) => (
              <View key={row.label} style={styles.rxRow}>
                <Text style={styles.eyeLabel}>{row.label}</Text>
                <Text style={styles.rxValue}>{row.sph}</Text>
                <Text style={styles.rxValue}>{row.cyl}</Text>
                <Text style={styles.rxValue}>{row.axis}</Text>
              </View>
            ))}
          </View>

          <View style={styles.bottomRow}>
            <Text style={styles.paymentModeText}>
              Payment Mode  -  <Text style={styles.paymentModeValue}>{order.billing.paymentMode}</Text>
            </Text>

            <TouchableOpacity
              style={styles.invoicePill}
              activeOpacity={0.86}
              onPress={() => router.push({
                pathname: '/invoice',
                params: {
                  orderId: order.orderNumber,
                  invoiceDate: order.invoiceDate,
                },
              })}
            >
              <FileText size={14} color="#F28A22" />
              <Text style={styles.invoicePillText}>Invoice</Text>
            </TouchableOpacity>
          </View>
        </View>

        <TouchableOpacity
          style={styles.reorderButton}
          activeOpacity={0.88}
          onPress={handleReorder}
        >
          <Text style={styles.reorderButtonText}>Reorder</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F4F5FA',
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F4F5FA',
    padding: 24,
  },
  errorText: {
    fontSize: 13,
    color: Colors.error,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    paddingTop: Platform.OS === 'ios' ? 52 : 36,
    paddingBottom: 12,
    paddingHorizontal: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#EAEDF3',
  },
  backButton: {
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '500',
    color: '#20242B',
  },
  body: {
    padding: 14,
    paddingBottom: 48,
  },
  card: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E8ECF3',
    padding: 12,
    ...Shadow.sm,
  },
  customerStrip: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  customerStripText: {
    fontSize: 10.5,
    color: '#8A91A1',
  },
  customerStripStrong: {
    color: '#20242B',
    fontWeight: '600',
  },
  phoneWrap: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  phoneText: {
    marginLeft: 4,
    fontSize: 10.5,
    color: '#20242B',
  },
  productBlock: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 14,
  },
  productImageShell: {
    width: 108,
    height: 72,
    borderRadius: 10,
    backgroundColor: '#F6F8FC',
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  productImage: {
    width: '100%',
    height: '100%',
  },
  imageFallback: {
    width: 64,
    height: 34,
    borderWidth: 2,
    borderRadius: 12,
    borderColor: '#1C1D21',
  },
  productInfo: {
    flex: 1,
    marginLeft: 12,
    marginRight: 8,
  },
  productTitle: {
    fontSize: 13,
    fontWeight: '500',
    color: '#20242B',
  },
  productSubtitle: {
    marginTop: 4,
    fontSize: 10.5,
    color: '#7F8695',
  },
  productPrice: {
    marginTop: 6,
    fontSize: 16,
    fontWeight: '700',
    color: Colors.primary,
  },
  metaColumn: {
    alignItems: 'flex-end',
  },
  metaText: {
    fontSize: 10.5,
    color: '#737B8D',
    marginBottom: 4,
  },
  detailPanel: {
    borderWidth: 1,
    borderColor: '#EEF1F5',
    borderRadius: 12,
    overflow: 'hidden',
  },
  detailPanelHeader: {
    minHeight: 24,
    justifyContent: 'center',
    paddingHorizontal: 12,
    backgroundColor: '#F5F5F6',
  },
  detailPanelName: {
    fontSize: 11,
    color: '#20242B',
    fontWeight: '500',
  },
  rxHeader: {
    flexDirection: 'row',
    paddingHorizontal: 12,
    paddingTop: 12,
    paddingBottom: 6,
  },
  rxBlank: {
    width: 44,
  },
  rxHeaderText: {
    flex: 1,
    fontSize: 10,
    color: '#4C5568',
    textAlign: 'center',
  },
  rxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  eyeLabel: {
    width: 44,
    fontSize: 11,
    color: '#4C5568',
  },
  rxValue: {
    flex: 1,
    fontSize: 11,
    color: '#20242B',
    textAlign: 'center',
  },
  bottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
  },
  paymentModeText: {
    fontSize: 11.5,
    color: '#4C5568',
  },
  paymentModeValue: {
    color: '#F28A22',
    fontWeight: '600',
  },
  invoicePill: {
    minHeight: 28,
    borderRadius: 10,
    backgroundColor: '#FFF7ED',
    paddingHorizontal: 10,
    flexDirection: 'row',
    alignItems: 'center',
  },
  invoicePillText: {
    marginLeft: 6,
    fontSize: 11.5,
    color: '#20242B',
  },
  reorderButton: {
    width: 202,
    maxWidth: '100%',
    minHeight: 32,
    borderRadius: 8,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 18,
  },
  reorderButtonText: {
    fontSize: 13.5,
    color: Colors.white,
    fontWeight: '700',
  },
});
