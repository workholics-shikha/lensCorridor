import { useEffect, useMemo, useState } from 'react';
import { router } from 'expo-router';
import {
  Alert,
  Image,
  Keyboard,
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
import { ArrowLeft, ChevronRight, FileText, X } from 'lucide-react-native';
import { type LensDetail, useOrderFlow } from '@/context/OrderFlowContext';
import { createEyeTestRecord, createOrderPlacement } from '@/lib/api';
import { getOrderAmounts } from '@/lib/orderPricing';
import { formatPersonName } from '@/lib/textFormat';
import { Shadow } from '@/lib/theme';
import { useResponsiveMetrics } from '@/lib/responsive';

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

const findLensDetailByEye = (lensDetails: LensDetail[], eye: 'left' | 'right') => (
  lensDetails.find((item) => item.eye === eye)
);

const parseDecimalValue = (value?: string) => {
  if (!value?.trim()) {
    return null;
  }

  const parsed = Number.parseFloat(value);
  return Number.isNaN(parsed) ? null : parsed;
};

const parseAxisValue = (value?: string) => {
  if (!value?.trim()) {
    return null;
  }

  const parsed = Number.parseInt(value, 10);
  return Number.isNaN(parsed) ? null : parsed;
};

const buildEyeTestPayloadFromOrder = ({
  lensDetails,
  customerName,
  customerPhone,
  customerAddress,
}: {
  lensDetails: LensDetail[];
  customerName: string;
  customerPhone: string;
  customerAddress: string;
}) => {
  const rightEye = findLensDetailByEye(lensDetails, 'right');
  const leftEye = findLensDetailByEye(lensDetails, 'left');
  const normalizedMobileNumber = customerPhone.replace(/\D/g, '').slice(-10);
  const sphericalRight = parseDecimalValue(rightEye?.sph);
  const sphericalLeft = parseDecimalValue(leftEye?.sph);
  const cylindricalRight = parseDecimalValue(rightEye?.cyl);
  const cylindricalLeft = parseDecimalValue(leftEye?.cyl);
  const axisRight = parseAxisValue(rightEye?.axis);
  const axisLeft = parseAxisValue(leftEye?.axis);
  const hasAnyPower = [
    sphericalRight,
    sphericalLeft,
    cylindricalRight,
    cylindricalLeft,
    axisRight,
    axisLeft,
  ].some((value) => value !== null);

  if (!customerName.trim() || normalizedMobileNumber.length < 10 || !hasAnyPower) {
    return null;
  }

  const samePowerBothEyes = (
    (rightEye?.sph || '') === (leftEye?.sph || '')
    && (rightEye?.cyl || '') === (leftEye?.cyl || '')
    && (rightEye?.axis || '') === (leftEye?.axis || '')
  );
  const hasCylindricalPower = cylindricalRight !== null
    || cylindricalLeft !== null
    || axisRight !== null
    || axisLeft !== null;

  return {
    samePowerBothEyes,
    hasCylindricalPower,
    spherical: {
      right: sphericalRight,
      left: sphericalLeft,
    },
    cylindrical: {
      right: cylindricalRight,
      left: cylindricalLeft,
    },
    axis: {
      right: axisRight,
      left: axisLeft,
    },
    name: customerName.trim(),
    mobileNumber: normalizedMobileNumber,
    address: customerAddress.trim(),
  };
};

export default function BillingScreen() {
  const { draft, updateDraft, resetDraft } = useOrderFlow();
  const { width, height } = useWindowDimensions();
  const viewport = useResponsiveMetrics();
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
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const [keyboardVisible, setKeyboardVisible] = useState(false);

  const isCompact = viewport.compact;
  const isTablet = viewport.isTablet;
  const isShortScreen = height < 760;
  const modalHorizontalInset = isTablet ? viewport.horizontalPadding : 16;
  const modalVerticalInset = isShortScreen ? 12 : isTablet ? 28 : 18;
  const modalCardWidth = Math.min(
    width - (modalHorizontalInset * 2),
    isTablet ? Math.min(viewport.contentMaxWidth * 0.62, 640) : 420
  );
  const modalCardMaxHeight = Math.max(
    320,
    Math.min(height - (modalVerticalInset * 2), isTablet ? Math.min(height * 0.82, 760) : 560)
  );
  const {
    framePrice,
    lensPrice,
    subtotal,
    discount: discountValue,
    rawDiscount,
    totalPayable,
    rawPartialAmount,
    paidAmount,
    remainingAmount,
  } = getOrderAmounts({
    ...draft,
    billingDiscount: discount,
    partialPaymentEnabled,
    partialPaymentAmount,
  });
  const partialAmountExceedsTotal = partialPaymentEnabled && rawPartialAmount > totalPayable;
  const primaryFrame = getPreferredFrameImage(draft.frameImages);

  const productSubtitle = useMemo(() => {
    if (draft.lensSelection.powerType.toLowerCase() === 'frame only') {
      return 'Frame Only';
    }

    return `Frame + ${draft.lensSelection.lensCategory || draft.lensSelection.powerType}`;
  }, [draft.lensSelection.lensCategory, draft.lensSelection.powerType]);

  useEffect(() => {
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

    const showSubscription = Keyboard.addListener(showEvent, (event) => {
      setKeyboardVisible(true);
      setKeyboardHeight(event.endCoordinates?.height ?? 0);
    });
    const hideSubscription = Keyboard.addListener(hideEvent, () => {
      setKeyboardVisible(false);
      setKeyboardHeight(0);
    });

    return () => {
      showSubscription.remove();
      hideSubscription.remove();
    };
  }, []);

  useEffect(() => {
    const normalizedDiscount = String(discountValue);
    const shouldClearDiscount = discount === '' && totalPayable > 0 && rawDiscount === 0;

    if (!shouldClearDiscount && discount !== normalizedDiscount) {
      setDiscount(normalizedDiscount);
      updateDraft({ billingDiscount: normalizedDiscount });
    }
  }, [discount, discountValue, rawDiscount, totalPayable, updateDraft]);

  useEffect(() => {
    if (!partialPaymentEnabled) {
      return;
    }

    const normalizedPartialAmount = String(paidAmount);

    if ((partialPaymentAmount || '0') !== normalizedPartialAmount) {
      setPartialPaymentAmount(normalizedPartialAmount === '0' && totalPayable === 0 ? '' : normalizedPartialAmount);
      updateDraft({
        partialPaymentEnabled: true,
        partialPaymentAmount: normalizedPartialAmount === '0' && totalPayable === 0 ? '' : normalizedPartialAmount,
      });
    }
  }, [partialPaymentAmount, partialPaymentEnabled, rawPartialAmount, totalPayable, updateDraft]);

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
        contentContainerStyle={[
          styles.content,
          isTablet && {
            alignSelf: 'center',
            width: '100%',
            maxWidth: viewport.contentMaxWidth,
            paddingHorizontal: viewport.horizontalPadding,
          },
        ]}
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

        <View style={[styles.topInputRow, !isTablet && isCompact && styles.topInputRowCompact]}>
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

          <View
            style={[
              styles.inlineInputCard,
              styles.discountCard,
              !isTablet && isCompact && styles.discountCardCompact,
            ]}
          >
            <Text style={styles.discountLabel}>Discount</Text>
            <View style={styles.discountInputShell}>
              <View style={styles.discountPrefixChip}>
                <Text style={styles.discountPrefixText}>Rs.</Text>
              </View>
              <TextInput
                value={discount}
                onChangeText={(value) => {
                  const sanitized = value.replace(/[^0-9]/g, '');
                  setDiscount(sanitized);
                  updateDraft({ billingDiscount: sanitized });
                }}
                placeholder="Enter discount"
                placeholderTextColor="#9095A0"
                keyboardType="numeric"
                style={styles.discountInput}
              />
            </View>
            <Text style={styles.discountHelperText}>
              Final payable: Rs. {totalPayable.toLocaleString('en-IN')}
            </Text>
          </View>
        </View>

        <View style={[styles.bottomGrid, isCompact && styles.bottomGridCompact]}>
          <View style={[styles.infoCard, styles.infoCardPrimary, isTablet && styles.infoCardTablet, isCompact && styles.infoCardCompact]}>
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

          <View style={[styles.infoCard, styles.infoCardSecondary, isTablet && styles.infoCardTablet, isCompact && styles.infoCardCompact]}>
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
            const invoiceSnapshot = JSON.stringify({
              customerName: formatPersonName(customerName) || draft.customerName || 'Customer Name',
              phone: customerPhone.trim() || draft.phone || 'Phone not added',
              address: customerAddress.trim() || address || 'Address not added',
              framePrice,
              lensPrice,
              discount: discountValue,
              totalPayable,
              paidAmount,
              remainingAmount,
              lensType: draft.lensSelection.lensCategory || draft.lensSelection.powerType || 'Frame Only',
              paymentMode,
              frameImages: draft.frameImages,
              selectedShape: draft.selectedShape || 'Frame',
            });
            const finalCustomerName = formatPersonName(customerName) || draft.customerName || '';
            const finalCustomerPhone = customerPhone.trim() || draft.phone || '';
            const finalCustomerAddress = customerAddress.trim() || address || '';
            const eyeTestPayload = buildEyeTestPayloadFromOrder({
              lensDetails: draft.lensDetails,
              customerName: finalCustomerName,
              customerPhone: finalCustomerPhone,
              customerAddress: finalCustomerAddress,
            });

            updateDraft(nextDraftPatch);
            setSubmitting(true);

            try {
              const placedOrder = await createOrderPlacement({
                customer: {
                  name: finalCustomerName,
                  phone: finalCustomerPhone,
                  billingAddress: finalCustomerAddress,
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

              if (eyeTestPayload) {
                createEyeTestRecord(eyeTestPayload).catch(() => null);
              }

              router.replace({
                pathname: '/order-success',
                params: {
                  orderId: placedOrder.orderNumber,
                  invoiceDate: placedOrder.invoiceDate,
                  recordId: placedOrder.id,
                  invoiceSnapshot,
                },
              });
              resetDraft();
            } catch (_error) {
              Alert.alert(
                'Order saved locally',
                'We could not reach the server right now, so the order flow will continue without cloud sync.'
              );

              router.replace({
                pathname: '/order-success',
                params: {
                  orderId: fallbackOrderId,
                  invoiceDate: fallbackInvoiceDate,
                  invoiceSnapshot,
                },
              });
              resetDraft();
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
            style={[
              styles.modalAvoidingView,
              Platform.OS === 'android' && keyboardVisible && {
                paddingBottom: Math.max(12, keyboardHeight - 12),
              },
            ]}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            keyboardVerticalOffset={Platform.OS === 'ios' ? (isTablet ? 28 : 16) : 0}
          >
            <ScrollView
              style={styles.modalScroll}
              contentInsetAdjustmentBehavior="always"
              contentContainerStyle={[
                styles.modalScrollContent,
                isShortScreen && styles.modalScrollContentCompact,
                Platform.OS === 'android' && keyboardVisible && styles.modalScrollContentKeyboardOpen,
              ]}
              keyboardShouldPersistTaps="handled"
              keyboardDismissMode={Platform.OS === 'ios' ? 'interactive' : 'on-drag'}
              showsVerticalScrollIndicator={false}
            >
              <View
                style={[
                  styles.modalCard,
                  {
                    width: modalCardWidth,
                    maxHeight: keyboardVisible && Platform.OS === 'android'
                      ? Math.max(280, height - keyboardHeight - (modalVerticalInset + 24))
                      : modalCardMaxHeight,
                  },
                ]}
              >
                <View style={styles.modalHeader}>
                  <View style={styles.modalHeaderInfo}>
                    <Image source={userIcon} style={styles.modalHeaderIcon} resizeMode="contain" />
                    <Text style={styles.modalTitle}>Customer Information</Text>
                  </View>
                  <TouchableOpacity
                    style={styles.modalCloseButton}
                    activeOpacity={0.86}
                    onPress={() => setDetailsOpen(false)}
                  >
                    <X size={16} color="#667085" />
                  </TouchableOpacity>
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
    alignItems: 'stretch',
  },
  topInputRowCompact: {
    flexDirection: 'column',
  },
  inlineInputCard: {
    minHeight: 48,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E7E8F0',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 14,
    ...Shadow.sm,
  },
  addressCard: {
    flex: 1,
    minWidth: 0,
    marginRight: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  discountCard: {
    flex: 0.52,
    minWidth: 178,
    maxWidth: 280,
    justifyContent: 'flex-start',
    paddingTop: 10,
    paddingBottom: 10,
  },
  discountCardCompact: {
    marginTop: 10,
    maxWidth: '100%',
  },
  inlineInputText: {
    flex: 1,
    fontSize: 13.5,
    color: '#1F2430',
    paddingRight: 10,
  },
  inlineInputPlaceholder: {
    color: '#1F2430',
  },
  inlineInput: {
    flex: 1,
    fontSize: 13.5,
    color: '#1F2430',
    paddingTop: 0,
    paddingBottom: 0,
  },
  discountLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#555D6D',
    marginBottom: 8,
  },
  discountInputShell: {
    minHeight: 44,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#DCE2EC',
    backgroundColor: '#F8FAFD',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
  },
  discountPrefixChip: {
    minWidth: 42,
    height: 30,
    borderRadius: 8,
    backgroundColor: '#E9F1FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  discountPrefixText: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#0D6CF5',
  },
  discountInput: {
    flex: 1,
    minHeight: 40,
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2430',
    paddingTop: 0,
    paddingBottom: 0,
  },
  discountHelperText: {
    marginTop: 8,
    fontSize: 11.5,
    fontWeight: '600',
    color: '#1C71D8',
  },
  bottomGrid: {
    flexDirection: 'row',
    marginTop: 20,
    alignItems: 'stretch',
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
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 14,
    ...Shadow.sm,
  },
  infoCardPrimary: {
    marginRight: 12,
  },
  infoCardSecondary: {
    marginLeft: 0,
  },
  infoCardTablet: {
    paddingHorizontal: 18,
    paddingTop: 18,
    paddingBottom: 16,
  },
  infoCardCompact: {
    marginBottom: 12,
    marginRight: 0,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingBottom: 14,
    marginBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F2',
  },
  cardHeaderText: {
    marginLeft: 8,
    fontSize: 16,
    fontWeight: '600',
    color: '#1C2027',
  },
  billRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  billLabel: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
    color: '#20242B',
    paddingRight: 12,
  },
  billValue: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '600',
    color: '#20242B',
    textAlign: 'right',
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
    marginTop: 8,
    marginBottom: 14,
  },
  paymentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    marginHorizontal: -4,
  },
  paymentOption: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 18,
    marginBottom: 12,
    paddingHorizontal: 8,
    minHeight: 38,
  },
  radioOuter: {
    width: 16,
    height: 16,
    borderRadius: 999,
    borderWidth: 1.4,
    borderColor: '#F1C6A3',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
    backgroundColor: '#FFFFFF',
  },
  radioOuterSelected: {
    borderColor: '#F28A22',
  },
  radioInner: {
    width: 8,
    height: 8,
    borderRadius: 999,
    backgroundColor: '#F28A22',
  },
  paymentLabel: {
    fontSize: 15.5,
    fontWeight: '600',
    color: '#20242B',
  },
  partialSection: {
    marginTop: 18,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F2',
    paddingTop: 16,
  },
  partialSectionTitle: {
    fontSize: 14.5,
    fontWeight: '700',
    color: '#1F2430',
    marginBottom: 12,
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
    fontSize: 13.5,
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
    fontSize: 12.5,
    color: '#7A7F88',
    marginBottom: 8,
  },
  partialInput: {
    minHeight: 40,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E5E7EF',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
    fontSize: 14,
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
    fontSize: 12.5,
    color: '#667085',
    marginTop: 10,
    lineHeight: 18,
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
    justifyContent: 'flex-end',
    paddingHorizontal: 16,
    paddingVertical: 20,
  },
  modalAvoidingView: {
    flex: 1,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  modalScroll: {
    width: '100%',
    flex: 1,
  },
  modalScrollContent: {
    flexGrow: 1,
    justifyContent: 'flex-end',
    paddingVertical: 12,
    paddingHorizontal: 4,
  },
  modalScrollContentCompact: {
    justifyContent: 'flex-start',
  },
  modalScrollContentKeyboardOpen: {
    justifyContent: 'flex-start',
    paddingTop: 12,
  },
  modalCard: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    paddingTop: 18,
    paddingHorizontal: 16,
    paddingBottom: 16,
    alignSelf: 'center',
    ...Shadow.sm,
  },
  modalFormScroll: {
    width: '100%',
    flexGrow: 0,
  },
  modalFormContent: {
    paddingBottom: 4,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 12,
    marginBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#D8E7FF',
  },
  modalHeaderInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    minWidth: 0,
    paddingRight: 12,
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
  modalCloseButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F3F6FB',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
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
