import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { ArrowLeft, FileText, Phone, Wallet, X } from 'lucide-react-native';
import { useOrderFlow } from '@/context/OrderFlowContext';
import { fetchOrderPlacementById, type OrderPlacementRecord, updateOrderPlacementBilling } from '@/lib/api';
import { buildDraftFromOrder } from '@/lib/orderFlow';
import { Colors, Shadow } from '@/lib/theme';
import { useResponsiveMetrics } from '@/lib/responsive';

type PaymentMode = 'Online' | 'Card' | 'Cash';

export default function OrderDetailsScreen() {
  const viewport = useResponsiveMetrics();
  const { orderId } = useLocalSearchParams<{ orderId?: string }>();
  const { draft, updateDraft } = useOrderFlow();
  const isTablet = viewport.isTablet;
  const [order, setOrder] = useState<OrderPlacementRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [collectionAmount, setCollectionAmount] = useState('');
  const [collectionMode, setCollectionMode] = useState<PaymentMode>('Cash');
  const [updatingPayment, setUpdatingPayment] = useState(false);
  const [paymentError, setPaymentError] = useState('');

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

  const paymentEntries = useMemo(() => {
    if (!order) {
      return [];
    }

    const rawPayments = Array.isArray(order.billing.payments) ? order.billing.payments : [];

    if (rawPayments.length > 0) {
      return rawPayments.map((payment, index) => ({
        key: `${payment.collectedAt ?? index}-${index}`,
        label: `Payment ${index + 1}`,
        mode: payment.paymentMode,
        amount: Number(payment.amount ?? 0),
        collectedAt: payment.collectedAt
          ? new Date(payment.collectedAt).toLocaleDateString('en-GB', {
              day: 'numeric',
              month: 'short',
              year: 'numeric',
            })
          : '',
      }));
    }

    const fallbackPaidAmount = Number(order.billing.paidAmount ?? 0);
    if (fallbackPaidAmount <= 0) {
      return [];
    }

    return [{
      key: 'initial-payment',
      label: 'Payment 1',
      mode: order.billing.paymentMode,
      amount: fallbackPaidAmount,
      collectedAt: order.invoiceDate,
    }];
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
  const totalPayable = order.billing.totalPayable.toLocaleString('en-IN');
  const remainingAmount = Number(order.billing.remainingAmount ?? 0);
  const paidAmount = Number(order.billing.paidAmount ?? 0);
  const hasPendingPayment = remainingAmount > 0;
  const canReorder = !hasPendingPayment;
  const handleReorder = () => {
    updateDraft(buildDraftFromOrder(order, draft));
    router.push('/billing');
  };
  const handleOpenPaymentModal = () => {
    setCollectionAmount(String(remainingAmount));
    setCollectionMode(order.billing.paymentMode);
    setPaymentError('');
    setPaymentModalOpen(true);
  };
  const handleCollectPayment = async () => {
    const numericAmount = Number(collectionAmount || 0);

    if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
      setPaymentError('Enter a valid amount to collect.');
      return;
    }

    if (numericAmount > remainingAmount) {
      setPaymentError(`Amount cannot be more than Rs. ${remainingAmount.toLocaleString('en-IN')}.`);
      return;
    }

    setUpdatingPayment(true);
    setPaymentError('');

    try {
      const updatedOrder = await updateOrderPlacementBilling(order.id, {
        additionalCollectedAmount: numericAmount,
        paymentMode: collectionMode,
      });
      setOrder(updatedOrder);
      setPaymentModalOpen(false);
    } catch (paymentUpdateError) {
      setPaymentError(paymentUpdateError instanceof Error ? paymentUpdateError.message : 'Unable to update payment.');
    } finally {
      setUpdatingPayment(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={[styles.backButton, isTablet && styles.backButtonTablet]} onPress={() => router.back()} activeOpacity={0.86}>
          <ArrowLeft size={18} color="#1C1D21" />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, isTablet && styles.headerTitleTablet]}>Order Details</Text>
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.body,
          isTablet && styles.bodyTablet,
          {
            maxWidth: viewport.contentMaxWidth,
            alignSelf: 'center',
            width: '100%',
            paddingHorizontal: viewport.horizontalPadding,
          },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.card, isTablet && styles.cardTablet]}>
          <View style={styles.customerStrip}>
            <Text style={[styles.customerStripText, isTablet && styles.customerStripTextTablet]}>
              Customer Name - <Text style={styles.customerStripStrong}>{order.customer.name || 'Customer'}</Text>
            </Text>
            <View style={styles.phoneWrap}>
              <Phone size={isTablet ? 15 : 11} color={Colors.primary} />
              <Text style={[styles.phoneText, isTablet && styles.phoneTextTablet]}>{order.customer.phone}</Text>
            </View>
          </View>

          <View style={[styles.productBlock, isTablet && styles.productBlockTablet]}>
            <View style={[styles.productImageShell, isTablet && styles.productImageShellTablet]}>
              {frameImage ? (
                <Image source={{ uri: frameImage }} resizeMode="contain" style={styles.productImage} />
              ) : (
                <View style={[styles.imageFallback, isTablet && styles.imageFallbackTablet]} />
              )}
            </View>

            <View style={styles.productInfo}>
              <Text style={[styles.productTitle, isTablet && styles.productTitleTablet]}>Lenscorridor frame</Text>
              <Text style={[styles.productSubtitle, isTablet && styles.productSubtitleTablet]}>
                Frame + {order.lensSelection.lensCategory || order.lensSelection.powerType || 'Lens'}
              </Text>
              <View style={styles.currencyRow}>
                <Text style={[styles.productPrice, isTablet && styles.productPriceTablet]}>Rs.</Text>
                <Text style={[styles.productPrice, styles.currencyAmount, isTablet && styles.productPriceTablet]}>{totalPayable}</Text>
              </View>
            </View>

            <View style={[styles.metaColumn, isTablet && styles.metaColumnTablet]}>
              <Text style={[styles.metaText, isTablet && styles.metaTextTablet]}>Order ID: {order.orderNumber}</Text>
              <Text style={[styles.metaText, isTablet && styles.metaTextTablet]}>Order Date: {orderDate}</Text>
              <View style={styles.metaPriceRow}>
                <Text style={[styles.metaText, isTablet && styles.metaTextTablet]}>Total Price:</Text>
                <Text style={[styles.metaText, styles.metaPriceValue, isTablet && styles.metaTextTablet]}>Rs.</Text>
                <Text style={[styles.metaText, styles.currencyAmount, isTablet && styles.metaTextTablet]}>{totalPayable}</Text>
              </View>
              <Text style={[styles.metaText, isTablet && styles.metaTextTablet]}>
                Paid: Rs. {paidAmount.toLocaleString('en-IN')}
              </Text>
              {hasPendingPayment ? (
                <Text style={[styles.metaText, styles.pendingMetaText, isTablet && styles.metaTextTablet]}>
                  Remaining: Rs. {remainingAmount.toLocaleString('en-IN')}
                </Text>
              ) : null}
            </View>
          </View>

          <View style={[styles.detailPanel, isTablet && styles.detailPanelTablet]}>
            <View style={styles.detailPanelHeader}>
              <Text style={[styles.detailPanelName, isTablet && styles.detailPanelNameTablet]}>{order.customer.name || 'Customer'}</Text>
            </View>

            <View style={[styles.rxHeader, isTablet && styles.rxHeaderTablet]}>
              <Text style={styles.rxBlank} />
              <Text style={[styles.rxHeaderText, isTablet && styles.rxHeaderTextTablet]}>Spherical (SPH)</Text>
              <Text style={[styles.rxHeaderText, isTablet && styles.rxHeaderTextTablet]}>Cylindrical (CYL)</Text>
              <Text style={[styles.rxHeaderText, isTablet && styles.rxHeaderTextTablet]}>Axis (0-180)</Text>
            </View>

            {lensRows.map((row) => (
              <View key={row.label} style={[styles.rxRow, isTablet && styles.rxRowTablet]}>
                <Text style={[styles.eyeLabel, isTablet && styles.eyeLabelTablet]}>{row.label}</Text>
                <Text style={[styles.rxValue, isTablet && styles.rxValueTablet]}>{row.sph}</Text>
                <Text style={[styles.rxValue, isTablet && styles.rxValueTablet]}>{row.cyl}</Text>
                <Text style={[styles.rxValue, isTablet && styles.rxValueTablet]}>{row.axis}</Text>
              </View>
            ))}
          </View>

          {paymentEntries.length > 0 ? (
            <View style={[styles.paymentHistoryCard, isTablet && styles.paymentHistoryCardTablet]}>
              <Text style={[styles.paymentHistoryTitle, isTablet && styles.paymentHistoryTitleTablet]}>
                Payment Summary
              </Text>

              {paymentEntries.map((payment) => (
                <View key={payment.key} style={styles.paymentHistoryRow}>
                  <View style={styles.paymentHistoryLeft}>
                    <Text style={[styles.paymentHistoryLabel, isTablet && styles.paymentHistoryLabelTablet]}>
                      {payment.label}
                    </Text>
                    <Text style={[styles.paymentHistoryMeta, isTablet && styles.paymentHistoryMetaTablet]}>
                      {payment.mode}{payment.collectedAt ? `  |  ${payment.collectedAt}` : ''}
                    </Text>
                  </View>
                  <Text style={[styles.paymentHistoryAmount, isTablet && styles.paymentHistoryAmountTablet]}>
                    Rs. {payment.amount.toLocaleString('en-IN')}
                  </Text>
                </View>
              ))}
            </View>
          ) : null}

          <View style={styles.bottomRow}>
            <Text style={[styles.paymentModeText, isTablet && styles.paymentModeTextTablet]}>
              Payment Mode  -  <Text style={styles.paymentModeValue}>{order.billing.paymentMode}</Text>
            </Text>

            <TouchableOpacity
              style={[styles.invoicePill, isTablet && styles.invoicePillTablet]}
              activeOpacity={0.86}
              onPress={() => router.push({
                pathname: '/invoice',
                params: {
                  recordId: order.id,
                  orderId: order.orderNumber,
                  invoiceDate: order.invoiceDate,
                },
              })}
            >
              <FileText size={isTablet ? 18 : 14} color="#F28A22" />
              <Text style={[styles.invoicePillText, isTablet && styles.invoicePillTextTablet]}>Invoice</Text>
            </TouchableOpacity>
          </View>
        </View>

        {canReorder ? (
          <TouchableOpacity
            style={[styles.reorderButton, isTablet && styles.reorderButtonTablet]}
            activeOpacity={0.88}
            onPress={handleReorder}
          >
            <Text style={[styles.reorderButtonText, isTablet && styles.reorderButtonTextTablet]}>Reorder</Text>
          </TouchableOpacity>
        ) : null}

        {hasPendingPayment ? (
          <TouchableOpacity
            style={[styles.collectButton, isTablet && styles.collectButtonTablet]}
            activeOpacity={0.88}
            onPress={handleOpenPaymentModal}
          >
            <Text style={[styles.collectButtonText, isTablet && styles.collectButtonTextTablet]}>
              Complete Payment
            </Text>
          </TouchableOpacity>
        ) : null}
      </ScrollView>

      <Modal
        visible={paymentModalOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setPaymentModalOpen(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.paymentModalCard, isTablet && styles.paymentModalCardTablet]}>
            <View style={styles.paymentModalHeader}>
              <View style={styles.paymentModalHeaderLeft}>
                <Wallet size={18} color={Colors.primary} />
                <Text style={styles.paymentModalTitle}>Complete Payment</Text>
              </View>
              <TouchableOpacity
                style={styles.paymentModalClose}
                activeOpacity={0.86}
                onPress={() => setPaymentModalOpen(false)}
              >
                <X size={16} color="#667085" />
              </TouchableOpacity>
            </View>

            <Text style={styles.paymentHelperText}>
              Remaining amount: Rs. {remainingAmount.toLocaleString('en-IN')}
            </Text>

            <Text style={styles.paymentFieldLabel}>Amount to collect</Text>
            <TextInput
              value={collectionAmount}
              onChangeText={(value) => {
                setCollectionAmount(value.replace(/[^0-9]/g, ''));
                setPaymentError('');
              }}
              keyboardType="numeric"
              placeholder="Enter amount"
              placeholderTextColor="#98A1B2"
              style={styles.paymentInput}
            />

            <Text style={styles.paymentFieldLabel}>Payment mode</Text>
            <View style={styles.paymentModeRow}>
              {(['Online', 'Card', 'Cash'] as PaymentMode[]).map((mode) => {
                const active = collectionMode === mode;

                return (
                  <TouchableOpacity
                    key={mode}
                    style={[styles.paymentModeChip, active && styles.paymentModeChipActive]}
                    activeOpacity={0.86}
                    onPress={() => setCollectionMode(mode)}
                  >
                    <Text style={[styles.paymentModeChipText, active && styles.paymentModeChipTextActive]}>
                      {mode}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {paymentError ? <Text style={styles.paymentErrorText}>{paymentError}</Text> : null}

            <TouchableOpacity
              style={[styles.paymentSubmitButton, updatingPayment && styles.paymentSubmitButtonDisabled]}
              activeOpacity={0.88}
              onPress={handleCollectPayment}
              disabled={updatingPayment}
            >
              <Text style={styles.paymentSubmitButtonText}>
                {updatingPayment ? 'Updating...' : 'Save Payment'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
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
  bodyTablet: {
    padding: 20,
    paddingBottom: 64,
  },
  card: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E8ECF3',
    padding: 12,
    ...Shadow.sm,
  },
  cardTablet: {
    borderRadius: 20,
    padding: 18,
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
  customerStripTextTablet: {
    lineHeight: 20,
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
  phoneTextTablet: {
    marginLeft: 6,
  },
  productBlock: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 14,
  },
  productBlockTablet: {
    marginBottom: 18,
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
  productImageShellTablet: {
    width: 136,
    height: 92,
    borderRadius: 14,
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
  imageFallbackTablet: {
    width: 82,
    height: 42,
    borderRadius: 14,
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
  productTitleTablet: {
    fontWeight: '600',
  },
  productSubtitle: {
    marginTop: 4,
    fontSize: 10.5,
    color: '#7F8695',
  },
  productSubtitleTablet: {
    marginTop: 6,
  },
  productPrice: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.primary,
  },
  productPriceTablet: {
    fontWeight: '800',
  },
  currencyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
  },
  currencyAmount: {
    marginLeft: 4,
  },
  metaColumn: {
    alignItems: 'flex-end',
  },
  metaColumnTablet: {
    minWidth: 160,
  },
  metaText: {
    fontSize: 10.5,
    color: '#737B8D',
    marginBottom: 4,
  },
  pendingMetaText: {
    color: '#B45309',
    fontWeight: '700',
  },
  metaTextTablet: {
    marginBottom: 6,
  },
  metaPriceRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  metaPriceValue: {
    marginLeft: 4,
  },
  detailPanel: {
    borderWidth: 1,
    borderColor: '#EEF1F5',
    borderRadius: 12,
    overflow: 'hidden',
  },
  detailPanelTablet: {
    borderRadius: 16,
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
  detailPanelNameTablet: {
    fontWeight: '600',
  },
  rxHeader: {
    flexDirection: 'row',
    paddingHorizontal: 12,
    paddingTop: 12,
    paddingBottom: 6,
  },
  rxHeaderTablet: {
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 8,
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
  rxHeaderTextTablet: {
    lineHeight: 20,
  },
  rxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  rxRowTablet: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  eyeLabel: {
    width: 44,
    fontSize: 11,
    color: '#4C5568',
  },
  eyeLabelTablet: {
    width: 52,
  },
  rxValue: {
    flex: 1,
    fontSize: 11,
    color: '#20242B',
    textAlign: 'center',
  },
  rxValueTablet: {
    fontWeight: '500',
  },
  bottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 14,
  },
  paymentHistoryCard: {
    marginTop: 14,
    borderWidth: 1,
    borderColor: '#EEF1F5',
    borderRadius: 12,
    backgroundColor: '#FAFBFD',
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  paymentHistoryCardTablet: {
    marginTop: 18,
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  paymentHistoryTitle: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#20242B',
    marginBottom: 8,
  },
  paymentHistoryTitleTablet: {
    fontSize: 14.5,
    marginBottom: 10,
  },
  paymentHistoryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: '#EEF1F5',
  },
  paymentHistoryLeft: {
    flex: 1,
    paddingRight: 12,
  },
  paymentHistoryLabel: {
    fontSize: 11.5,
    fontWeight: '600',
    color: '#20242B',
  },
  paymentHistoryLabelTablet: {
    fontSize: 13.5,
  },
  paymentHistoryMeta: {
    marginTop: 3,
    fontSize: 10.5,
    color: '#667085',
  },
  paymentHistoryMetaTablet: {
    marginTop: 4,
    fontSize: 12,
  },
  paymentHistoryAmount: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.primary,
  },
  paymentHistoryAmountTablet: {
    fontSize: 14.5,
  },
  paymentModeText: {
    fontSize: 11.5,
    color: '#4C5568',
  },
  paymentModeTextTablet: {
    lineHeight: 22,
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
  invoicePillTablet: {
    minHeight: 38,
    borderRadius: 12,
    paddingHorizontal: 14,
  },
  invoicePillText: {
    marginLeft: 6,
    fontSize: 11.5,
    color: '#20242B',
  },
  invoicePillTextTablet: {
    marginLeft: 8,
    fontWeight: '600',
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
  reorderButtonTablet: {
    width: 260,
    minHeight: 44,
    borderRadius: 12,
    marginTop: 22,
  },
  reorderButtonText: {
    fontSize: 13.5,
    color: Colors.white,
    fontWeight: '700',
  },
  reorderButtonTextTablet: {
    fontWeight: '800',
  },
  collectButton: {
    width: 202,
    maxWidth: '100%',
    minHeight: 32,
    borderRadius: 8,
    backgroundColor: '#FFF7ED',
    borderWidth: 1,
    borderColor: '#F5C48B',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
  },
  collectButtonTablet: {
    width: 260,
    minHeight: 44,
    borderRadius: 12,
    marginTop: 14,
  },
  collectButtonText: {
    fontSize: 13.5,
    color: '#B45309',
    fontWeight: '700',
  },
  collectButtonTextTablet: {
    fontWeight: '800',
  },
  backButtonTablet: {
    width: 38,
    height: 38,
    marginRight: 14,
  },
  headerTitleTablet: {
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.24)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  paymentModalCard: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: Colors.white,
    borderRadius: 18,
    padding: 18,
    ...Shadow.lg,
  },
  paymentModalCardTablet: {
    maxWidth: 420,
    borderRadius: 20,
    padding: 22,
  },
  paymentModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  paymentModalHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  paymentModalTitle: {
    marginLeft: 8,
    fontSize: 16,
    fontWeight: '700',
    color: '#1F2430',
  },
  paymentModalClose: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F3F6FB',
  },
  paymentHelperText: {
    fontSize: 13,
    color: '#667085',
    marginBottom: 14,
  },
  paymentFieldLabel: {
    fontSize: 12.5,
    fontWeight: '600',
    color: '#475467',
    marginBottom: 8,
  },
  paymentInput: {
    minHeight: 44,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E4E7EC',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
    fontSize: 14,
    color: '#1F2430',
    marginBottom: 14,
  },
  paymentModeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  paymentModeChip: {
    minHeight: 38,
    borderRadius: 999,
    paddingHorizontal: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E4E7EF',
  },
  paymentModeChipActive: {
    backgroundColor: '#EAF2FF',
    borderColor: Colors.primary,
  },
  paymentModeChipText: {
    fontSize: 12.5,
    fontWeight: '600',
    color: '#475569',
  },
  paymentModeChipTextActive: {
    color: Colors.primary,
  },
  paymentErrorText: {
    marginTop: 12,
    fontSize: 12.5,
    color: Colors.error,
  },
  paymentSubmitButton: {
    minHeight: 44,
    borderRadius: 12,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
  },
  paymentSubmitButtonDisabled: {
    opacity: 0.65,
  },
  paymentSubmitButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
