import { useMemo, useState } from 'react';
import { router } from 'expo-router';
import {
  Alert,
  Image,
  KeyboardAvoidingView,
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
import { ArrowLeft, ChevronRight, FileText } from 'lucide-react-native';
import { useOrderFlow } from '@/context/OrderFlowContext';
import { createOrderPlacement } from '@/lib/api';
import { formatPersonName } from '@/lib/textFormat';
import { Shadow } from '@/lib/theme';

type PaymentMode = 'Online' | 'Card' | 'Cash';

const userIcon = require('@/assets/images/user.png');

const createFallbackOrderNumber = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = `${now.getMonth() + 1}`.padStart(2, '0');
  const day = `${now.getDate()}`.padStart(2, '0');
  const sequence = `${Math.floor(Math.random() * 10000)}`.padStart(4, '0');
  return `LC-${year}${month}${day}-${sequence}`;
};

export default function BillingScreen() {
  const { draft, updateDraft } = useOrderFlow();
  const { width, height } = useWindowDimensions();
  const [address, setAddress] = useState(draft.billingAddress);
  const [discount, setDiscount] = useState(draft.billingDiscount || '0');
  const [paymentMode, setPaymentMode] = useState<PaymentMode>(draft.paymentMode);
  const [partialPaymentEnabled, setPartialPaymentEnabled] = useState(draft.partialPaymentEnabled);
  const [partialPaymentAmount, setPartialPaymentAmount] = useState(draft.partialPaymentAmount || '');
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [customerName, setCustomerName] = useState(draft.customerName);
  const [customerPhone, setCustomerPhone] = useState(draft.phone);
  const [customerAddress, setCustomerAddress] = useState(draft.billingAddress);
  const [detailsErrors, setDetailsErrors] = useState<{
    name?: string;
    phone?: string;
    address?: string;
  }>({});
  const [submitting, setSubmitting] = useState(false);

  const isCompact = width < 760;
  const isTablet = width >= 768;
  const modalCardWidth = Math.min(width - (isTablet ? 96 : 32), isTablet ? 560 : 380);
  const modalCardMaxHeight = Math.min(height * (isTablet ? 0.8 : 0.86), isTablet ? 680 : 560);
  const framePrice = Number(draft.price || 0);
  const lensPrice = draft.lensSelection.powerType.toLowerCase() === 'frame only' ? 0 : draft.lensSelection.lensPrice;
  const subtotal = framePrice + lensPrice;
  const discountValue = Number(discount || 0);
  const totalPayable = Math.max(subtotal - discountValue, 0);
  const rawPartialAmount = Number(partialPaymentAmount || 0);
  const partialAmountExceedsTotal = partialPaymentEnabled && rawPartialAmount > totalPayable;
  const paidAmount = partialPaymentEnabled
    ? Math.min(Math.max(rawPartialAmount, 0), totalPayable)
    : totalPayable;
  const remainingAmount = Math.max(totalPayable - paidAmount, 0);
  const primaryFrame = getPreferredFrameImage(draft.frameImages);

  const productSubtitle = useMemo(() => {
    if (draft.lensSelection.powerType.toLowerCase() === 'frame only') {
      return 'Frame Only';
    }

    return `Frame + ${draft.lensSelection.lensCategory || draft.lensSelection.powerType}`;
  }, [draft.lensSelection.lensCategory, draft.lensSelection.powerType]);

  const validateCustomerFields = () => {
    const nextErrors: {
      name?: string;
      phone?: string;
      address?: string;
    } = {};

    if (!customerName.trim()) {
      nextErrors.name = 'Please enter customer name.';
    }

    if (!customerPhone.trim()) {
      nextErrors.phone = 'Please enter mobile number.';
    } else if (customerPhone.trim().length !== 10) {
      nextErrors.phone = 'Mobile number must be 10 digits.';
    }

    if (!customerAddress.trim()) {
      nextErrors.address = 'Please enter address.';
    } else if (customerAddress.trim().length < 8) {
      nextErrors.address = 'Address looks too short.';
    }

    setDetailsErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const validateCustomerDetails = () => {
    const customerFieldsValid = validateCustomerFields();

    if (!customerFieldsValid) {
      return false;
    }

    if (partialAmountExceedsTotal) {
      Alert.alert(
        'Invalid partial payment',
        `Amount to collect now cannot be more than Rs. ${totalPayable.toLocaleString('en-IN')}.`
      );
      return false;
    }

    if (partialPaymentEnabled && paidAmount <= 0) {
      Alert.alert('Enter partial payment', 'Please enter an amount to collect now.');
      return false;
    }

    return true;
  };

  return (
    <KeyboardAvoidingView
      style={styles.screen}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 20 : 0}
    >
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()} activeOpacity={0.8}>
          <ArrowLeft size={20} color="#1C1D21" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Cart (1 item)</Text>
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode={Platform.OS === 'ios' ? 'interactive' : 'on-drag'}
      >
        <View style={styles.productCard}>
          <View style={styles.productImageShell}>
            {primaryFrame?.image ? (
              <Image source={{ uri: primaryFrame.image }} resizeMode="contain" style={styles.productImage} />
            ) : (
              <FrameOnlyArt />
            )}
          </View>

          <View style={styles.productBody}>
            <Text style={styles.productTitle}>Lenscorridor frame</Text>
            <View style={styles.productDivider} />
            <View style={styles.productFooter}>
              <Text style={styles.productMeta}>{productSubtitle}</Text>
              <Text style={styles.productPrice}>Rs. {framePrice.toLocaleString('en-IN')}</Text>
            </View>
          </View>
        </View>

        <View style={[styles.topInputRow, isCompact && styles.topInputRowCompact]}>
          <TouchableOpacity
            style={[styles.inlineInputCard, styles.addressCard]}
            activeOpacity={0.88}
            onPress={() => setDetailsOpen(true)}
          >
            <Text style={[styles.inlineInputText, !address && styles.inlineInputPlaceholder]}>
              {address || 'Add Address Details'}
            </Text>
            <ChevronRight size={16} color="#8D9098" />
          </TouchableOpacity>

          <View style={[styles.inlineInputCard, isCompact && styles.discountCardCompact]}>
            <Text style={styles.discountLabel}>Discount</Text>
            <TextInput
              value={discount}
              onChangeText={(value) => {
                const sanitized = value.replace(/[^0-9]/g, '');
                setDiscount(sanitized);
                updateDraft({ billingDiscount: sanitized || '0' });
              }}
              placeholder="Enter Discount"
              placeholderTextColor="#9095A0"
              style={styles.inlineInput}
            />
          </View>
        </View>

        <View style={[styles.bottomGrid, isCompact && styles.bottomGridCompact]}>
          <View style={[styles.infoCard, isCompact && styles.infoCardCompact]}>
            <View style={styles.cardHeader}>
              <FileText size={16} color="#0D6CF5" />
              <Text style={styles.cardHeaderText}>Bill Details</Text>
            </View>

            <BillRow label="Frame price" value={`Rs. ${framePrice.toLocaleString('en-IN')}`} />
            {lensPrice > 0 ? (
              <BillRow label="Lens price" value={`Rs. ${lensPrice.toLocaleString('en-IN')}`} />
            ) : null}
            <BillRow label="Total item Price Lens+Frame" value={`Rs. ${subtotal.toLocaleString('en-IN')}`} />
            <BillRow label="Discount" value={`Rs. ${discountValue.toLocaleString('en-IN')}`} valueStyle={styles.discountValue} />

            <View style={styles.billDivider} />
            <BillRow label="Total payable" value={`Rs. ${totalPayable.toLocaleString('en-IN')}`} valueStyle={styles.payableValue} />
            <BillRow label="Paying now" value={`Rs. ${paidAmount.toLocaleString('en-IN')}`} valueStyle={styles.paidValue} />
            {partialPaymentEnabled ? (
              <BillRow label="Remaining amount" value={`Rs. ${remainingAmount.toLocaleString('en-IN')}`} valueStyle={styles.remainingValue} />
            ) : null}
          </View>

          <View style={[styles.infoCard, isCompact && styles.infoCardCompact]}>
            <View style={styles.cardHeader}>
              <FileText size={16} color="#0D6CF5" />
              <Text style={styles.cardHeaderText}>Select Payment Mode</Text>
            </View>

            <View style={styles.paymentRow}>
              {(['Online', 'Card', 'Cash'] as PaymentMode[]).map((mode) => {
                const selected = paymentMode === mode;
                return (
                  <TouchableOpacity
                    key={mode}
                    style={styles.paymentOption}
                    onPress={() => {
                      setPaymentMode(mode);
                      updateDraft({ paymentMode: mode });
                    }}
                    activeOpacity={0.86}
                  >
                    <View style={[styles.radioOuter, selected && styles.radioOuterSelected]}>
                      {selected ? <View style={styles.radioInner} /> : null}
                    </View>
                    <Text style={styles.paymentLabel}>{mode}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <View style={styles.partialSection}>
              <Text style={styles.partialSectionTitle}>Payment Collection</Text>
              <View style={styles.partialTypeRow}>
                <TouchableOpacity
                  style={[styles.partialTypePill, !partialPaymentEnabled && styles.partialTypePillActive]}
                  onPress={() => {
                    setPartialPaymentEnabled(false);
                    setPartialPaymentAmount('');
                    updateDraft({
                      partialPaymentEnabled: false,
                      partialPaymentAmount: '',
                    });
                  }}
                  activeOpacity={0.86}
                >
                  <Text style={[styles.partialTypeText, !partialPaymentEnabled && styles.partialTypeTextActive]}>Full Payment</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.partialTypePill, partialPaymentEnabled && styles.partialTypePillActive]}
                  onPress={() => {
                    const nextAmount = partialPaymentAmount || String(totalPayable);
                    setPartialPaymentEnabled(true);
                    setPartialPaymentAmount(nextAmount);
                    updateDraft({
                      partialPaymentEnabled: true,
                      partialPaymentAmount: nextAmount,
                    });
                  }}
                  activeOpacity={0.86}
                >
                  <Text style={[styles.partialTypeText, partialPaymentEnabled && styles.partialTypeTextActive]}>Partial Payment</Text>
                </TouchableOpacity>
              </View>

              {partialPaymentEnabled ? (
                <View style={styles.partialInputWrap}>
                  <Text style={styles.partialInputLabel}>Amount to collect now</Text>
                  <TextInput
                    value={partialPaymentAmount}
                    onChangeText={(value) => {
                      const sanitized = value.replace(/[^0-9]/g, '');
                      setPartialPaymentAmount(sanitized);
                      updateDraft({
                        partialPaymentEnabled: true,
                        partialPaymentAmount: sanitized,
                      });
                    }}
                    placeholder="Enter amount"
                    placeholderTextColor="#9095A0"
                    keyboardType="numeric"
                    style={[styles.partialInput, partialAmountExceedsTotal && styles.partialInputError]}
                  />
                  {partialAmountExceedsTotal ? (
                    <Text style={styles.partialErrorText}>
                      Amount cannot be more than Rs. {totalPayable.toLocaleString('en-IN')}.
                    </Text>
                  ) : null}
                  <Text style={styles.partialHint}>
                    Remaining after collection: Rs. {remainingAmount.toLocaleString('en-IN')}
                  </Text>
                </View>
              ) : (
                <Text style={styles.partialHint}>
                  Full payable amount of Rs. {totalPayable.toLocaleString('en-IN')} will be collected.
                </Text>
              )}
            </View>
          </View>
        </View>

        <TouchableOpacity
          style={styles.primaryButton}
          onPress={async () => {
            if (!validateCustomerDetails()) {
              setDetailsOpen(true);
              return;
            }

            const fallbackOrderId = createFallbackOrderNumber();
            const fallbackInvoiceDate = new Date().toLocaleDateString('en-GB', {
              day: '2-digit',
              month: 'short',
              year: 'numeric',
            });

            const nextDraftPatch = {
              customerName: formatPersonName(customerName) || draft.customerName,
              phone: customerPhone.trim() || draft.phone,
              billingAddress: customerAddress.trim() || address,
              billingDiscount: discount || '0',
              partialPaymentEnabled,
              partialPaymentAmount: partialPaymentEnabled ? String(paidAmount) : '',
              paymentMode,
            } as const;

            updateDraft(nextDraftPatch);
            setSubmitting(true);

            try {
              const placedOrder = await createOrderPlacement({
                customer: {
                  name: formatPersonName(customerName) || draft.customerName || '',
                  phone: customerPhone.trim() || draft.phone || '',
                  billingAddress: customerAddress.trim() || address || '',
                },
                frame: {
                  selectedShape: draft.selectedShape || '',
                  price: framePrice,
                  images: draft.frameImages,
                },
                lensSelection: {
                  lensType: draft.lensSelection.lensType,
                  lensCategory: draft.lensSelection.lensCategory,
                  lensCategoryId: draft.lensSelection.lensCategoryId,
                  lensPrice,
                  coating: draft.lensSelection.coating,
                  powerType: draft.lensSelection.powerType,
                  powerTypeId: draft.lensSelection.powerTypeId,
                  image: draft.lensSelection.image,
                },
                lensDetails: draft.lensDetails,
                billing: {
                  discount: discountValue,
                  paymentMode,
                  subtotal,
                  totalPayable,
                  partialPaymentEnabled,
                  paidAmount,
                  remainingAmount,
                },
                meta: {
                  source: 'mobile-app',
                  store: draft.store ?? undefined,
                  salesperson: draft.salesperson ?? undefined,
                },
              });

              router.push({
                pathname: '/order-success',
                params: {
                  orderId: placedOrder.orderNumber,
                  invoiceDate: placedOrder.invoiceDate,
                },
              });
            } catch (_error) {
              Alert.alert(
                'Order saved locally',
                'We could not reach the server right now, so the order flow will continue without cloud sync.'
              );

              router.push({
                pathname: '/order-success',
                params: {
                  orderId: fallbackOrderId,
                  invoiceDate: fallbackInvoiceDate,
                },
              });
            } finally {
              setSubmitting(false);
            }
          }}
          activeOpacity={0.88}
          disabled={submitting}
        >
          <Text style={styles.primaryButtonText}>{submitting ? 'Saving...' : 'Save & Proceed'}</Text>
        </TouchableOpacity>
      </ScrollView>

      <Modal
        visible={detailsOpen}
        transparent
        animationType="fade"
        statusBarTranslucent
        onRequestClose={() => setDetailsOpen(false)}
      >
        <View style={styles.modalOverlay}>
          <KeyboardAvoidingView
            style={styles.modalAvoidingView}
            behavior={Platform.OS === 'ios' ? 'padding' : 'position'}
            keyboardVerticalOffset={Platform.OS === 'ios' ? 28 : 12}
          >
            <ScrollView
              style={styles.modalScroll}
              contentInsetAdjustmentBehavior="always"
              contentContainerStyle={styles.modalScrollContent}
              keyboardShouldPersistTaps="handled"
              keyboardDismissMode={Platform.OS === 'ios' ? 'interactive' : 'on-drag'}
              showsVerticalScrollIndicator={false}
            >
              <View style={[styles.modalCard, { width: modalCardWidth, maxHeight: modalCardMaxHeight }]}>
                <View style={styles.modalHeader}>
                  <Image source={userIcon} style={styles.modalHeaderIcon} resizeMode="contain" />
                  <Text style={styles.modalTitle}>Customer Information</Text>
                </View>
                <ScrollView
                  style={styles.modalFormScroll}
                  contentContainerStyle={styles.modalFormContent}
                  keyboardShouldPersistTaps="handled"
                  showsVerticalScrollIndicator={false}
                >
                  <TextInput
                    value={customerName}
                    onChangeText={(value) => {
                      setCustomerName(formatPersonName(value));
                      if (detailsErrors.name) {
                        setDetailsErrors((current) => ({ ...current, name: undefined }));
                      }
                    }}
                    placeholder="Name"
                    placeholderTextColor="#9095A0"
                    style={[styles.modalInput, detailsErrors.name && styles.modalInputError]}
                  />
                  {detailsErrors.name ? <Text style={styles.modalErrorText}>{detailsErrors.name}</Text> : null}

                  <TextInput
                    value={customerPhone}
                    onChangeText={(value) => {
                      setCustomerPhone(value.replace(/[^0-9]/g, '').slice(0, 10));
                      if (detailsErrors.phone) {
                        setDetailsErrors((current) => ({ ...current, phone: undefined }));
                      }
                    }}
                    placeholder="Mobile Number"
                    placeholderTextColor="#9095A0"
                    keyboardType="phone-pad"
                    style={[styles.modalInput, detailsErrors.phone && styles.modalInputError]}
                  />
                  {detailsErrors.phone ? <Text style={styles.modalErrorText}>{detailsErrors.phone}</Text> : null}

                  <TextInput
                    value={customerAddress}
                    onChangeText={(value) => {
                      setCustomerAddress(value);
                      if (detailsErrors.address) {
                        setDetailsErrors((current) => ({ ...current, address: undefined }));
                      }
                    }}
                    placeholder="Address"
                    placeholderTextColor="#9095A0"
                    multiline
                    textAlignVertical="top"
                    style={[
                      styles.modalInput,
                      styles.modalTextarea,
                      isTablet && styles.modalTextareaTablet,
                      detailsErrors.address && styles.modalInputError,
                    ]}
                  />
                  {detailsErrors.address ? <Text style={styles.modalErrorText}>{detailsErrors.address}</Text> : null}

                  <TouchableOpacity
                    style={styles.modalSaveButton}
                    activeOpacity={0.88}
                    onPress={() => {
                      if (!validateCustomerFields()) {
                        return;
                      }

                      const savedAddress = customerAddress.trim();
                      setAddress(savedAddress);
                      setCustomerName(formatPersonName(customerName));
                      updateDraft({
                        customerName: formatPersonName(customerName),
                        phone: customerPhone.trim(),
                        billingAddress: savedAddress,
                      });
                      setDetailsOpen(false);
                    }}
                  >
                    <Text style={styles.modalSaveText}>Save</Text>
                  </TouchableOpacity>
                </ScrollView>
              </View>
            </ScrollView>
          </KeyboardAvoidingView>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
}

function BillRow({
  label,
  value,
  valueStyle,
}: {
  label: string;
  value: string;
  valueStyle?: object;
}) {
  return (
    <View style={styles.billRow}>
      <Text style={styles.billLabel}>{label}</Text>
      <Text style={[styles.billValue, valueStyle]}>{value}</Text>
    </View>
  );
}

function FrameOnlyArt() {
  return (
    <View style={styles.frameArtWrap}>
      <View style={[styles.frameLens, styles.frameLensLeft]} />
      <View style={[styles.frameLens, styles.frameLensRight]} />
      <View style={styles.frameBridge} />
      <View style={styles.frameTempleLeft} />
      <View style={styles.frameTempleRight} />
    </View>
  );
}

function getPreferredFrameImage(
  items: Array<{ id: string; image?: string; shape?: string }>
) {
  const uploadedImage = [...items].reverse().find((item) => (
    Boolean(item.image) && (item.id.startsWith('camera-') || item.id.startsWith('gallery-'))
  ));

  if (uploadedImage) {
    return uploadedImage;
  }

  return items.find((item) => item.image) ?? items[0];
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#F8F8FD',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#ECECF3',
    paddingTop: 44,
    paddingBottom: 14,
    paddingHorizontal: 14,
  },
  backButton: {
    width: 30,
    height: 30,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#202128',
    letterSpacing: 0.1,
  },
  content: {
    flexGrow: 1,
    paddingHorizontal: 14,
    paddingTop: 18,
    paddingBottom: 64,
  },
  productCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E7E8F0',
    flexDirection: 'row',
    overflow: 'hidden',
    ...Shadow.sm,
  },
  productImageShell: {
    width: 160,
    minHeight: 95,
    backgroundColor: '#F7F7FA',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
  },
  productImage: {
    width: '100%',
    height: 70,
  },
  productBody: {
    flex: 1,
    paddingHorizontal: 14,
    paddingTop: 14,
    paddingBottom: 12,
  },
  productTitle: {
    fontSize: 17,
    fontWeight: '500',
    color: '#111318',
    marginBottom: 12,
  },
  productDivider: {
    height: 1,
    backgroundColor: '#F0F0F2',
    marginBottom: 10,
  },
  productFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  productMeta: {
    flex: 1,
    fontSize: 13,
    color: '#7A7F88',
    marginRight: 12,
  },
  productPrice: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0D6CF5',
  },
  topInputRow: {
    flexDirection: 'row',
    marginTop: 14,
  },
  topInputRowCompact: {
    flexDirection: 'column',
  },
  inlineInputCard: {
    minHeight: 42,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E7E8F0',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
    ...Shadow.sm,
  },
  addressCard: {
    flex: 1.05,
    marginRight: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  discountCardCompact: {
    marginTop: 10,
  },
  inlineInputText: {
    fontSize: 12.5,
    color: '#1F2430',
  },
  inlineInputPlaceholder: {
    color: '#1F2430',
  },
  inlineInput: {
    flex: 1,
    fontSize: 12.5,
    color: '#1F2430',
    paddingTop: 0,
    paddingBottom: 0,
  },
  discountLabel: {
    fontSize: 11,
    color: '#7A7F88',
    marginTop: 6,
    marginBottom: 2,
  },
  bottomGrid: {
    flexDirection: 'row',
    marginTop: 16,
  },
  bottomGridCompact: {
    flexDirection: 'column',
  },
  infoCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E7E8F0',
    paddingHorizontal: 14,
    paddingTop: 14,
    paddingBottom: 12,
    ...Shadow.sm,
  },
  infoCardCompact: {
    marginBottom: 12,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingBottom: 12,
    marginBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F2',
  },
  cardHeaderText: {
    marginLeft: 8,
    fontSize: 14.5,
    fontWeight: '500',
    color: '#1C2027',
  },
  billRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  billLabel: {
    fontSize: 12.5,
    color: '#20242B',
  },
  billValue: {
    fontSize: 12.5,
    fontWeight: '600',
    color: '#20242B',
  },
  discountValue: {
    color: '#FF4136',
  },
  payableValue: {
    color: '#0D6CF5',
    fontWeight: '700',
  },
  paidValue: {
    color: '#17803D',
    fontWeight: '700',
  },
  remainingValue: {
    color: '#F28A22',
    fontWeight: '700',
  },
  billDivider: {
    height: 1,
    backgroundColor: '#F0F0F2',
    marginTop: 6,
    marginBottom: 12,
  },
  paymentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  paymentOption: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 26,
    marginBottom: 8,
  },
  radioOuter: {
    width: 12,
    height: 12,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#F1C6A3',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
    backgroundColor: '#FFFFFF',
  },
  radioOuterSelected: {
    borderColor: '#F28A22',
  },
  radioInner: {
    width: 6,
    height: 6,
    borderRadius: 999,
    backgroundColor: '#F28A22',
  },
  paymentLabel: {
    fontSize: 13.5,
    color: '#20242B',
  },
  partialSection: {
    marginTop: 14,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F2',
    paddingTop: 14,
  },
  partialSectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1F2430',
    marginBottom: 10,
  },
  partialTypeRow: {
    flexDirection: 'row',
    marginBottom: 10,
  },
  partialTypePill: {
    flex: 1,
    minHeight: 36,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#D8DEEA',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
    paddingHorizontal: 12,
  },
  partialTypePillActive: {
    backgroundColor: '#E9F1FF',
    borderColor: '#1C71D8',
  },
  partialTypeText: {
    fontSize: 12.5,
    fontWeight: '500',
    color: '#667085',
  },
  partialTypeTextActive: {
    color: '#1C71D8',
    fontWeight: '700',
  },
  partialInputWrap: {
    marginTop: 2,
  },
  partialInputLabel: {
    fontSize: 11.5,
    color: '#7A7F88',
    marginBottom: 6,
  },
  partialInput: {
    minHeight: 40,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E5E7EF',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
    fontSize: 13,
    color: '#1F2430',
  },
  partialInputError: {
    borderColor: '#E5484D',
  },
  partialErrorText: {
    fontSize: 11.5,
    color: '#E5484D',
    marginTop: 6,
    lineHeight: 16,
  },
  partialHint: {
    fontSize: 11.5,
    color: '#667085',
    marginTop: 8,
    lineHeight: 16,
  },
  primaryButton: {
    width: 248,
    maxWidth: '100%',
    minHeight: 40,
    borderRadius: 8,
    backgroundColor: '#1C71D8',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 18,
    ...Shadow.sm,
  },
  primaryButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.28)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingVertical: 20,
  },
  modalAvoidingView: {
    flex: 1,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalScroll: {
    width: '100%',
    flex: 1,
  },
  modalScrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 4,
  },
  modalCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    paddingTop: 18,
    paddingHorizontal: 16,
    paddingBottom: 16,
    alignSelf: 'center',
    ...Shadow.sm,
  },
  modalFormScroll: {
    flexGrow: 0,
  },
  modalFormContent: {
    paddingBottom: 4,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingBottom: 12,
    marginBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#D8E7FF',
  },
  modalTitle: {
    marginLeft: 8,
    fontSize: 14,
    fontWeight: '500',
    color: '#1C2027',
  },
  modalHeaderIcon: {
    width: 16,
    height: 16,
  },
  modalInput: {
    minHeight: 38,
    borderWidth: 1,
    borderColor: '#E5E7EF',
    borderRadius: 8,
    paddingHorizontal: 10,
    fontSize: 12.5,
    color: '#1F2430',
    backgroundColor: '#FFFFFF',
    marginBottom: 10,
  },
  modalTextarea: {
    minHeight: 120,
    paddingTop: 10,
    paddingBottom: 10,
  },
  modalTextareaTablet: {
    minHeight: 156,
  },
  modalInputError: {
    borderColor: '#E5484D',
  },
  modalErrorText: {
    fontSize: 11.5,
    color: '#E5484D',
    marginTop: -4,
    marginBottom: 8,
  },
  modalSaveButton: {
    minHeight: 44,
    borderRadius: 10,
    backgroundColor: '#1C71D8',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
    ...Shadow.sm,
  },
  modalSaveText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  frameArtWrap: {
    width: 118,
    height: 58,
    position: 'relative',
  },
  frameLens: {
    position: 'absolute',
    top: 15,
    width: 44,
    height: 30,
    borderWidth: 3,
    borderColor: '#1C1D21',
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
  },
  frameLensLeft: {
    left: 12,
    transform: [{ rotate: '-4deg' }],
  },
  frameLensRight: {
    right: 12,
    transform: [{ rotate: '4deg' }],
  },
  frameBridge: {
    position: 'absolute',
    top: 25,
    left: 48,
    width: 22,
    height: 7,
    borderTopWidth: 3,
    borderTopColor: '#1C1D21',
    borderTopLeftRadius: 10,
    borderTopRightRadius: 10,
  },
  frameTempleLeft: {
    position: 'absolute',
    top: 16,
    left: 0,
    width: 18,
    height: 3,
    backgroundColor: '#1C1D21',
    transform: [{ rotate: '-34deg' }],
    borderRadius: 999,
  },
  frameTempleRight: {
    position: 'absolute',
    top: 16,
    right: 0,
    width: 18,
    height: 3,
    backgroundColor: '#1C1D21',
    transform: [{ rotate: '34deg' }],
    borderRadius: 999,
  },
});
