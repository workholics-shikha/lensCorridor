import { useEffect, useMemo, useState } from 'react';
import { router, useLocalSearchParams } from 'expo-router';
import { ActivityIndicator, Alert, Image, Linking, Platform, ScrollView, Share, StyleSheet, Text, TouchableOpacity, View, useWindowDimensions } from 'react-native';
import { CreditCard, MapPin, ShoppingBag, UserRound, Wallet, MessageCircleMore } from 'lucide-react-native';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system/legacy';
import { useOrderFlow } from '@/context/OrderFlowContext';
import { fetchOrderPlacementById, fetchOrderPlacements, type OrderPlacementRecord } from '@/lib/api';
import { buildInvoicePdf } from '@/lib/invoicePdf';
import { getOrderAmounts } from '@/lib/orderPricing';
import { formatPersonName } from '@/lib/textFormat';
import { Shadow } from '@/lib/theme';

const brandLogo = require('@/assets/images/blueLogo.png');

type InvoiceFrameImage = {
  id: string;
  image?: string;
  shape?: string;
};

type InvoiceSnapshot = {
  customerName?: string;
  phone?: string;
  address?: string;
  framePrice?: number;
  lensPrice?: number;
  discount?: number;
  totalPayable?: number;
  paidAmount?: number;
  remainingAmount?: number;
  lensType?: string;
  paymentMode?: 'Online' | 'Card' | 'Cash';
  frameImages?: InvoiceFrameImage[];
  selectedShape?: string;
};

function isInvoiceFrameImage(value: unknown): value is InvoiceFrameImage {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const item = value as Record<string, unknown>;
  return typeof item.id === 'string';
}

export default function InvoiceScreen() {
  const { draft, resetDraft } = useOrderFlow();
  const { width, height } = useWindowDimensions();
  const { orderId, invoiceDate, recordId, invoiceSnapshot } = useLocalSearchParams<{
    orderId?: string;
    invoiceDate?: string;
    recordId?: string;
    invoiceSnapshot?: string;
  }>();
  const [orderRecord, setOrderRecord] = useState<OrderPlacementRecord | null>(null);
  const [orderError, setOrderError] = useState('');
  const isCompact = width < 760;
  const isShortScreen = height < 820;
  const stackActionButtons = width < 980 || isShortScreen;
  const parsedInvoiceSnapshot = useMemo<InvoiceSnapshot | null>(() => {
    if (!invoiceSnapshot) {
      return null;
    }

    try {
      const parsed = JSON.parse(invoiceSnapshot) as InvoiceSnapshot;
      return typeof parsed === 'object' && parsed ? parsed : null;
    } catch {
      return null;
    }
  }, [invoiceSnapshot]);
  const [loadingOrder, setLoadingOrder] = useState(Boolean((recordId || orderId) && !parsedInvoiceSnapshot));

  useEffect(() => {
    let active = true;

    if (!recordId && !orderId) {
      setLoadingOrder(false);
      return () => {
        active = false;
      };
    }

    const loadOrder = async () => {
      try {
        let matchedOrder: OrderPlacementRecord | null = null;

        if (recordId) {
          matchedOrder = await fetchOrderPlacementById(recordId);
        } else if (orderId) {
          const matches = await fetchOrderPlacements({ orderNumber: orderId, limit: 1 });
          matchedOrder = matches[0] ?? null;
        }

        if (!active) {
          return;
        }

        setOrderRecord(matchedOrder);
        setOrderError(matchedOrder ? '' : 'Invoice details are not available right now.');
      } catch {
        if (!active) {
          return;
        }

        setOrderRecord(null);
        setOrderError('Invoice details are not available right now.');
      } finally {
        if (active) {
          setLoadingOrder(false);
        }
      }
    };

    loadOrder();

    return () => {
      active = false;
    };
  }, [orderId, recordId]);

  const invoiceSource = useMemo(() => {
    if (orderRecord) {
      return {
        orderId: orderRecord.orderNumber || orderId || '-',
        invoiceDate: orderRecord.invoiceDate || invoiceDate || new Date().toLocaleDateString('en-GB'),
        customerName: formatPersonName(orderRecord.customer.name || 'Customer Name'),
        phone: orderRecord.customer.phone || 'Phone not added',
        address: orderRecord.customer.billingAddress || 'Address not added',
        framePrice: orderRecord.frame.price || 0,
        lensPrice: orderRecord.lensSelection.powerType.toLowerCase() === 'frame only' ? 0 : orderRecord.lensSelection.lensPrice,
        discount: orderRecord.billing.discount || 0,
        totalPayable: orderRecord.billing.totalPayable || 0,
        paidAmount: orderRecord.billing.paidAmount ?? orderRecord.billing.totalPayable ?? 0,
        remainingAmount: orderRecord.billing.remainingAmount ?? 0,
        lensType: orderRecord.lensSelection.lensCategory || orderRecord.lensSelection.powerType || 'Frame Only',
        paymentMode: orderRecord.billing.paymentMode,
        frameImages: orderRecord.frame.images,
        selectedShape: orderRecord.frame.selectedShape || 'Frame',
      };
    }

    if (parsedInvoiceSnapshot) {
      return {
        orderId: orderId || '-',
        invoiceDate: invoiceDate || new Date().toLocaleDateString('en-GB'),
        customerName: parsedInvoiceSnapshot.customerName || 'Customer Name',
        phone: parsedInvoiceSnapshot.phone || 'Phone not added',
        address: parsedInvoiceSnapshot.address || 'Address not added',
        framePrice: Number(parsedInvoiceSnapshot.framePrice || 0),
        lensPrice: Number(parsedInvoiceSnapshot.lensPrice || 0),
        discount: Number(parsedInvoiceSnapshot.discount || 0),
        totalPayable: Number(parsedInvoiceSnapshot.totalPayable || 0),
        paidAmount: Number(parsedInvoiceSnapshot.paidAmount || 0),
        remainingAmount: Number(parsedInvoiceSnapshot.remainingAmount || 0),
        lensType: parsedInvoiceSnapshot.lensType || 'Frame Only',
        paymentMode: parsedInvoiceSnapshot.paymentMode || 'Online',
        frameImages: Array.isArray(parsedInvoiceSnapshot.frameImages)
          ? parsedInvoiceSnapshot.frameImages.filter(isInvoiceFrameImage)
          : [],
        selectedShape: parsedInvoiceSnapshot.selectedShape || 'Frame',
      };
    }

    const { framePrice, lensPrice, discount, totalPayable, paidAmount, remainingAmount } = getOrderAmounts(draft);

    return {
      orderId: orderId || '-',
      invoiceDate: invoiceDate || new Date().toLocaleDateString('en-GB'),
      customerName: formatPersonName(draft.customerName || 'Customer Name'),
      phone: draft.phone || 'Phone not added',
      address: draft.billingAddress || 'Address not added',
      framePrice,
      lensPrice,
      discount,
      totalPayable,
      paidAmount,
      remainingAmount,
      lensType: draft.lensSelection.lensCategory || draft.lensSelection.powerType || 'Frame Only',
      paymentMode: draft.paymentMode,
      frameImages: draft.frameImages,
      selectedShape: draft.selectedShape || 'Frame',
    };
  }, [draft, invoiceDate, orderId, orderRecord, parsedInvoiceSnapshot]);

  const primaryFrame = getPreferredFrameImage(invoiceSource.frameImages);
  const resolvedOrderId = invoiceSource.orderId;
  const resolvedInvoiceDate = invoiceSource.invoiceDate;
  const customerName = invoiceSource.customerName;
  const phone = invoiceSource.phone;
  const address = invoiceSource.address;
  const lensType = invoiceSource.lensType;
  const framePrice = invoiceSource.framePrice;
  const lensPrice = invoiceSource.lensPrice;
  const discount = invoiceSource.discount;
  const totalPayable = invoiceSource.totalPayable;
  const paidAmount = invoiceSource.paidAmount;
  const remainingAmount = invoiceSource.remainingAmount;
  const paymentMode = invoiceSource.paymentMode;

  const invoiceText = buildInvoiceText({
    orderId: resolvedOrderId,
    invoiceDate: resolvedInvoiceDate,
    customerName,
    phone,
    address,
    framePrice,
    lensPrice,
    discount,
    totalPayable,
    paidAmount,
    remainingAmount,
    lensType,
    paymentMode,
  });
  const whatsappMessage = buildWhatsappMessage({
    orderId: resolvedOrderId,
    invoiceDate: resolvedInvoiceDate,
    customerName,
    phone,
    address,
    totalPayable,
    paidAmount,
    remainingAmount,
    lensType,
    paymentMode,
  });
  const customerWhatsappNumber = normalizeWhatsappNumber(phone);

  const buildPdfBytes = () => buildInvoicePdf({
    orderId: resolvedOrderId,
    invoiceDate: resolvedInvoiceDate,
    customerName,
    phone,
    address,
    framePrice,
    lensPrice,
    discount,
    totalPayable,
    paidAmount,
    remainingAmount,
    lensType,
    paymentMode,
    logoUri: Platform.OS === 'web' ? getAssetUri(brandLogo) : undefined,
  });

  const shareInvoicePdfFile = async () => {
    const pdfBytes = await buildPdfBytes();
    const fileName = `${resolvedOrderId || 'invoice'}.pdf`;
    const fileUri = `${FileSystem.cacheDirectory || FileSystem.documentDirectory}${fileName}`;

    if (!fileUri) {
      throw new Error('No writable directory available for invoice sharing.');
    }

    await FileSystem.writeAsStringAsync(fileUri, bytesToBase64(pdfBytes), {
      encoding: FileSystem.EncodingType.Base64,
    });

    const canShare = await Sharing.isAvailableAsync();
    if (!canShare) {
      throw new Error('Sharing is not available on this device.');
    }

    await Sharing.shareAsync(fileUri, {
      mimeType: 'application/pdf',
      UTI: 'com.adobe.pdf',
      dialogTitle: 'Share Invoice PDF',
    });

    return fileUri;
  };

  const handleShare = async () => {
    const encodedMessage = encodeURIComponent(whatsappMessage);
    const whatsappAppUrl = customerWhatsappNumber
      ? `whatsapp://send?phone=${customerWhatsappNumber}&text=${encodedMessage}`
      : `whatsapp://send?text=${encodedMessage}`;
    const whatsappWebUrl = customerWhatsappNumber
      ? `https://wa.me/${customerWhatsappNumber}?text=${encodedMessage}`
      : `https://wa.me/?text=${encodedMessage}`;

    if (Platform.OS === 'web') {
      try {
        if (globalThis.open) {
          globalThis.open(whatsappWebUrl, '_blank', 'noopener,noreferrer');
          return;
        }
      } catch {}

      try {
        await Share.share({
          message: invoiceText,
        });
      } catch {}
      return;
    }

    try {
      const canOpenWhatsapp = await Linking.canOpenURL(whatsappAppUrl);
      if (!canOpenWhatsapp) {
        Alert.alert('WhatsApp not installed', 'Please install WhatsApp to share this invoice.');
        return;
      }

      await Linking.openURL(whatsappAppUrl);
    } catch {
      Alert.alert('WhatsApp unavailable', 'We could not open WhatsApp on this device.');
    }
  };

  const handleDownload = async () => {
    const pdfBytes = await buildPdfBytes();

    if (Platform.OS === 'web' && globalThis.document) {
      const blob = new Blob([pdfBytes], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const anchor = globalThis.document.createElement('a');
      anchor.href = url;
      anchor.download = `${resolvedOrderId || 'invoice'}.pdf`;
      anchor.click();
      URL.revokeObjectURL(url);
      return;
    }

    try {
      await shareInvoicePdfFile();
    } catch {
      Alert.alert('Download unavailable', 'We could not share the PDF invoice on this device.');
    }
  };

  if (loadingOrder) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#0D6CF5" />
      </View>
    );
  }

  if (orderError && !orderRecord && !draft.customerName && !draft.frameImages.length) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>{orderError}</Text>
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[
          styles.scrollContent,
          stackActionButtons && styles.scrollContentWithFooterSpace,
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.sheet, isCompact && styles.sheetCompact]}>
          <View style={[styles.topRow, isCompact && styles.topRowCompact]}>
          <View style={styles.brandBlock}>
            <Image source={brandLogo} resizeMode="contain" style={styles.brandLogo} />
            <Text style={styles.brandSub}>Retail Optical Invoice</Text>
          </View>

          <View style={[styles.invoiceMeta, isCompact && styles.invoiceMetaCompact]}>
            <Text style={styles.invoiceTitle}>INVOICE</Text>
            <Text style={styles.invoiceText}>Order ID: {resolvedOrderId}</Text>
            <Text style={styles.invoiceText}>Date: {resolvedInvoiceDate}</Text>
          </View>
        </View>

        <Section title="Customer Details" icon={<UserRound size={15} color="#0D6CF5" strokeWidth={2.2} />}>
          <View style={styles.customerIdentityCard}>
            <View style={styles.customerAvatarBox}>
              <UserRound size={18} color="#0D6CF5" strokeWidth={2.2} />
            </View>
            <View style={styles.customerIdentityBody}>
              <InfoRow label={customerName} strong />
              <InfoRow label={phone} />
            </View>
          </View>
          <InfoBlock title="Address" value={address} />
        </Section>

        <Section title="Order Details" icon={<ShoppingBag size={15} color="#0D6CF5" strokeWidth={2.2} />}>
          <View style={[styles.orderHeader, isCompact && styles.orderHeaderCompact]}>
            <View style={[styles.orderTextWrap, isCompact && styles.orderTextWrapCompact]}>
              <MetaPair label="Frame Shape" value={invoiceSource.selectedShape} />
              <MetaPair label="Lens Type" value={lensType} />
              <MetaPair label="Quantity" value="1" />
            </View>

            <View style={[styles.itemImageShell, isCompact && styles.itemImageShellCompact]}>
              {primaryFrame?.image ? (
                <Image source={{ uri: primaryFrame.image }} resizeMode="contain" style={styles.itemImage} />
              ) : (
                <FrameOnlyArt />
              )}
            </View>
          </View>

          <View style={styles.table}>
            <InvoiceRow label="Description" value="Price" header />
            <InvoiceRow label="Frame" value={`Rs. ${framePrice.toLocaleString('en-IN')}`} />
            <InvoiceRow label="Lens" value={`Rs. ${lensPrice.toLocaleString('en-IN')}`} />
            <InvoiceRow label="Subtotal" value={`Rs. ${(framePrice + lensPrice).toLocaleString('en-IN')}`} bold />
            <InvoiceRow label="Discount" value={`- Rs. ${discount.toLocaleString('en-IN')}`} negative />
            <InvoiceRow label="Total Amount" value={`Rs. ${totalPayable.toLocaleString('en-IN')}`} bold accent />
            <InvoiceRow label="Paid Now" value={`Rs. ${paidAmount.toLocaleString('en-IN')}`} />
            <InvoiceRow label="Remaining Amount" value={`Rs. ${remainingAmount.toLocaleString('en-IN')}`} negative />
          </View>
        </Section>

        <Section title="Payment Info" icon={<CreditCard size={15} color="#0D6CF5" strokeWidth={2.2} />}>
          <View style={styles.paymentInfoRow}>
            <Text style={styles.paymentModeLabel}>Payment Mode</Text>
            <View style={styles.paymentBadge}>
              <Wallet size={13} color="#0D6CF5" strokeWidth={2.2} />
              <Text style={styles.paymentBadgeText}>{paymentMode}</Text>
            </View>
          </View>
        </Section>

        <Text style={styles.supportText}>
          Thank you for choosing Lens Corridor{'\n'}
          Support: support@lenscorridor.com
        </Text>

        <View style={[styles.actionRow, stackActionButtons && styles.actionRowStacked]}>
          <TouchableOpacity
            style={[
              styles.downloadButton,
              isCompact && styles.actionButtonCompact,
              stackActionButtons && styles.actionButtonStacked,
            ]}
            onPress={handleDownload}
            activeOpacity={0.88}
          >
            <Text style={styles.downloadButtonText}>Download</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.shareButton,
              isCompact && styles.actionButtonCompact,
              stackActionButtons && styles.actionButtonStacked,
            ]}
            onPress={handleShare}
            activeOpacity={0.88}
          >
            <MessageCircleMore size={16} color="#21A366" strokeWidth={2.1} />
            <Text style={styles.shareButtonText}>Share Whatsapp</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.homeButton,
              isCompact && styles.actionButtonCompact,
              stackActionButtons && styles.actionButtonStacked,
            ]}
            onPress={() => {
              resetDraft();
              router.replace('/(tabs)');
            }}
            activeOpacity={0.88}
          >
            <Text style={styles.homeButtonText}>Go to Home</Text>
          </TouchableOpacity>
        </View>
      </View>
      </ScrollView>
    </View>
  );
}

function Section({
  title,
  icon,
  children,
}: {
  title: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        {icon ? <View style={styles.sectionIcon}>{icon}</View> : null}
        <Text style={styles.sectionTitle}>{title}</Text>
      </View>
      <View style={styles.sectionBody}>{children}</View>
    </View>
  );
}

function MetaPair({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.metaPair}>
      <Text style={styles.metaLabel}>{label}</Text>
      <Text style={styles.metaValue}>{value}</Text>
    </View>
  );
}

function buildInvoiceText({
  orderId,
  invoiceDate,
  customerName,
  phone,
  address,
  framePrice,
  lensPrice,
  discount,
  totalPayable,
  paidAmount,
  remainingAmount,
  lensType,
  paymentMode,
}: {
  orderId: string;
  invoiceDate: string;
  customerName: string;
  phone: string;
  address: string;
  framePrice: number;
  lensPrice: number;
  discount: number;
  totalPayable: number;
  paidAmount: number;
  remainingAmount: number;
  lensType: string;
  paymentMode: string;
}) {
  return [
    'Lens Corridor Invoice',
    `Order ID: ${orderId}`,
    `Date: ${invoiceDate}`,
    '',
    'Customer Details',
    `Name: ${customerName}`,
    `Phone: ${phone}`,
    `Address: ${address}`,
    '',
    'Order Details',
    `Lens Type: ${lensType}`,
    'Quantity: 1',
    `Frame: Rs. ${framePrice}`,
    `Lens: Rs. ${lensPrice}`,
    `Subtotal: Rs. ${framePrice + lensPrice}`,
    `Discount: Rs. ${discount}`,
    `Total Amount: Rs. ${totalPayable}`,
    `Paid Now: Rs. ${paidAmount}`,
    `Remaining Amount: Rs. ${remainingAmount}`,
    '',
    `Payment Mode: ${paymentMode}`,
    '',
    'Support: support@lenscorridor.com',
  ].join('\n');
}

function buildWhatsappMessage({
  orderId,
  invoiceDate,
  customerName,
  phone,
  address,
  totalPayable,
  paidAmount,
  remainingAmount,
  lensType,
  paymentMode,
}: {
  orderId: string;
  invoiceDate: string;
  customerName: string;
  phone: string;
  address: string;
  totalPayable: number;
  paidAmount: number;
  remainingAmount: number;
  lensType: string;
  paymentMode: string;
}) {
  return [
    'Hello from Lens Corridor,',
    '',
    'Please find your invoice summary below:',
    `Order ID: ${orderId}`,
    `Invoice Date: ${invoiceDate}`,
    '',
    'Customer Details',
    `Name: ${customerName}`,
    `Mobile: ${phone}`,
    `Address: ${address}`,
    '',
    'Order Summary',
    `Lens Type: ${lensType}`,
    `Total Amount: Rs. ${totalPayable.toLocaleString('en-IN')}`,
    `Paid Amount: Rs. ${paidAmount.toLocaleString('en-IN')}`,
    `Balance Amount: Rs. ${remainingAmount.toLocaleString('en-IN')}`,
    `Payment Mode: ${paymentMode}`,
    '',
    'For any support, contact support@lenscorridor.com',
    '',
    'Thank you for choosing Lens Corridor.',
  ].join('\n');
}

function normalizeWhatsappNumber(phone: string) {
  const digits = phone.replace(/\D/g, '');

  if (!digits) {
    return '';
  }

  if (digits.length === 10) {
    return `91${digits}`;
  }

  if (digits.length === 12 && digits.startsWith('91')) {
    return digits;
  }

  if (digits.length > 10) {
    return `91${digits.slice(-10)}`;
  }

  return '';
}

function InfoRow({ label, strong = false }: { label: string; strong?: boolean }) {
  return <Text style={[styles.infoText, strong && styles.infoTextStrong]}>{label}</Text>;
}

function InfoBlock({ title, value }: { title: string; value: string }) {
  return (
    <View style={styles.infoBlock}>
      <View style={styles.infoBlockHeading}>
        <MapPin size={14} color="#0D6CF5" strokeWidth={2.2} />
        <Text style={styles.infoBlockTitle}>{title}</Text>
      </View>
      <Text style={styles.infoBlockValue}>{value}</Text>
    </View>
  );
}

function InvoiceRow({
  label,
  value,
  header,
  bold,
  accent,
  negative,
}: {
  label: string;
  value: string;
  header?: boolean;
  bold?: boolean;
  accent?: boolean;
  negative?: boolean;
}) {
  return (
    <View style={[styles.tableRow, header && styles.tableHeaderRow]}>
      <Text style={[styles.tableLabel, header && styles.tableHeaderText, bold && styles.tableBold]}>
        {label}
      </Text>
      <Text
        style={[
          styles.tableValue,
          header && styles.tableHeaderText,
          bold && styles.tableBold,
          accent && styles.tableAccent,
          negative && styles.tableNegative,
        ]}
      >
        {value}
      </Text>
    </View>
  );
}

function getPreferredFrameImage(items: Array<{ id: string; image?: string; shape?: string }>) {
  const uploadedImage = [...items].reverse().find((item) => (
    Boolean(item.image) && (item.id.startsWith('camera-') || item.id.startsWith('gallery-'))
  ));

  if (uploadedImage) {
    return uploadedImage;
  }

  return items.find((item) => item.image) ?? items[0];
}

function getAssetUri(asset: unknown): string | undefined {
  if (!asset) {
    return undefined;
  }

  if (typeof asset === 'string') {
    return asset;
  }

  if (typeof asset !== 'object') {
    return undefined;
  }

  const directUri = 'uri' in asset && typeof asset.uri === 'string' ? asset.uri : undefined;
  if (directUri) {
    return directUri;
  }

  const defaultExport = 'default' in asset ? asset.default : undefined;
  if (typeof defaultExport === 'string') {
    return defaultExport;
  }

  if (defaultExport && typeof defaultExport === 'object' && 'uri' in defaultExport && typeof defaultExport.uri === 'string') {
    return defaultExport.uri;
  }

  return undefined;
}

function bytesToBase64(bytes: Uint8Array) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
  let result = '';

  for (let index = 0; index < bytes.length; index += 3) {
    const first = bytes[index] ?? 0;
    const second = bytes[index + 1] ?? 0;
    const third = bytes[index + 2] ?? 0;
    const chunk = (first << 16) | (second << 8) | third;

    result += chars[(chunk >> 18) & 63];
    result += chars[(chunk >> 12) & 63];
    result += index + 1 < bytes.length ? chars[(chunk >> 6) & 63] : '=';
    result += index + 2 < bytes.length ? chars[chunk & 63] : '=';
  }

  return result;
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

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#EEF2F8',
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EEF2F8',
    padding: 24,
  },
  errorText: {
    fontSize: 14,
    color: '#B42318',
    textAlign: 'center',
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    alignItems: 'center',
    padding: 16,
  },
  scrollContentWithFooterSpace: {
    paddingBottom: 28,
  },
  sheet: {
    width: '100%',
    maxWidth: 780,
    borderRadius: 24,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 20,
    marginTop: 24,
    ...Shadow.sm,
  },
  sheetCompact: {
    maxWidth: '100%',
    paddingHorizontal: 16,
    paddingTop: 18,
    borderRadius: 18,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginBottom: 18,
    paddingBottom: 18,
    borderBottomWidth: 2,
    borderBottomColor: '#E3E8F0',
  },
  topRowCompact: {
    flexDirection: 'column',
    alignItems: 'flex-start',
  },
  brandBlock: {
    flex: 1,
    marginRight: 18,
  },
  brandLogo: {
    width: 198,
    height: 48,
  },
  brandSub: {
    marginTop: 4,
    fontSize: 12.5,
    color: '#64748B',
  },
  invoiceMeta: {
    alignItems: 'flex-end',
  },
  invoiceMetaCompact: {
    alignItems: 'flex-start',
    marginTop: 12,
  },
  invoiceTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 8,
  },
  invoiceText: {
    fontSize: 13,
    color: '#475569',
    marginTop: 2,
  },
  section: {
    borderWidth: 1,
    borderColor: '#DDE4EE',
    borderRadius: 14,
    overflow: 'hidden',
    marginBottom: 16,
  },
  sectionHeader: {
    minHeight: 42,
    backgroundColor: '#F8FBFF',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#DDE4EE',
  },
  sectionIcon: {
    marginRight: 8,
  },
  sectionTitle: {
    fontSize: 19,
    fontWeight: '700',
    color: '#0F172A',
  },
  sectionBody: {
    padding: 16,
  },
  infoText: {
    fontSize: 15,
    color: '#334155',
    marginBottom: 4,
  },
  infoTextStrong: {
    fontWeight: '700',
    color: '#0F172A',
  },
  customerIdentityCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5EAF3',
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
  },
  customerAvatarBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#F1F6FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  customerIdentityBody: {
    flex: 1,
  },
  infoBlock: {
    marginTop: 8,
  },
  infoBlockHeading: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  infoBlockTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
    marginLeft: 6,
  },
  infoBlockValue: {
    fontSize: 14.5,
    lineHeight: 22,
    color: '#334155',
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  orderHeaderCompact: {
    flexDirection: 'column',
  },
  orderTextWrap: {
    flex: 1,
    marginRight: 16,
  },
  orderTextWrapCompact: {
    marginRight: 0,
    marginBottom: 14,
  },
  metaPair: {
    marginBottom: 10,
  },
  metaLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
    marginBottom: 2,
  },
  metaValue: {
    fontSize: 15,
    color: '#0F172A',
  },
  itemImageShell: {
    width: 138,
    height: 92,
    borderRadius: 12,
    backgroundColor: '#F8FAFD',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
  },
  itemImageShellCompact: {
    width: '100%',
    height: 110,
  },
  itemImage: {
    width: '100%',
    height: '100%',
  },
  table: {
    borderWidth: 1,
    borderColor: '#DDE4EE',
    borderRadius: 12,
    overflow: 'hidden',
  },
  tableRow: {
    minHeight: 46,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#E7EBF3',
  },
  tableHeaderRow: {
    backgroundColor: '#F8FBFF',
  },
  tableLabel: {
    flex: 1,
    fontSize: 14.5,
    color: '#1E293B',
  },
  tableValue: {
    fontSize: 14.5,
    color: '#1E293B',
    textAlign: 'right',
  },
  tableHeaderText: {
    fontWeight: '700',
  },
  tableBold: {
    fontWeight: '700',
  },
  tableAccent: {
    color: '#0D6CF5',
  },
  tableNegative: {
    color: '#FF4136',
  },
  paymentInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  paymentModeLabel: {
    fontSize: 14.5,
    color: '#334155',
  },
  paymentBadge: {
    borderRadius: 999,
    backgroundColor: '#E9F1FF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    flexDirection: 'row',
    alignItems: 'center',
  },
  paymentBadgeText: {
    fontSize: 12,
    color: '#0D6CF5',
    fontWeight: '700',
    marginLeft: 4,
  },
  supportText: {
    fontSize: 12.5,
    lineHeight: 19,
    color: '#64748B',
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 16,
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
  },
  actionRowStacked: {
    flexDirection: 'column',
    alignItems: 'stretch',
    flexWrap: 'nowrap',
  },
  actionButtonCompact: {
    minWidth: '48%',
    marginRight: 0,
  },
  actionButtonStacked: {
    width: '100%',
    minWidth: 0,
    marginRight: 0,
  },
  backButton: {
    flex: 1,
    minWidth: 120,
    minHeight: 42,
    borderRadius: 10,
    backgroundColor: '#EEF1F6',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
    marginBottom: 8,
  },
  backButtonText: {
    fontSize: 13.5,
    fontWeight: '600',
    color: '#1F2430',
  },
  downloadButton: {
    flex: 1,
    minWidth: 120,
    minHeight: 42,
    borderRadius: 10,
    backgroundColor: '#EEF1F6',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
    marginBottom: 8,
  },
  downloadButtonText: {
    fontSize: 13.5,
    fontWeight: '600',
    color: '#1F2430',
  },
  shareButton: {
    flex: 1,
    minWidth: 140,
    minHeight: 42,
    borderRadius: 10,
    backgroundColor: '#F4F6FA',
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    marginRight: 8,
    marginBottom: 8,
  },
  shareButtonText: {
    fontSize: 13.5,
    fontWeight: '600',
    color: '#1F2430',
    marginLeft: 8,
  },
  homeButton: {
    flex: 1,
    minWidth: 130,
    minHeight: 42,
    borderRadius: 10,
    backgroundColor: '#156FE5',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  homeButtonText: {
    fontSize: 13.5,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  frameArtWrap: {
    width: 74,
    height: 34,
    position: 'relative',
  },
  frameLens: {
    position: 'absolute',
    top: 8,
    width: 28,
    height: 18,
    borderWidth: 2,
    borderColor: '#1C1D21',
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
  },
  frameLensLeft: {
    left: 8,
  },
  frameLensRight: {
    right: 8,
  },
  frameBridge: {
    position: 'absolute',
    top: 13,
    left: 27,
    width: 20,
    height: 5,
    borderTopWidth: 2,
    borderTopColor: '#1C1D21',
    borderTopLeftRadius: 6,
    borderTopRightRadius: 6,
  },
  frameTempleLeft: {
    position: 'absolute',
    top: 10,
    left: 1,
    width: 10,
    height: 2,
    backgroundColor: '#1C1D21',
    transform: [{ rotate: '-28deg' }],
    borderRadius: 999,
  },
  frameTempleRight: {
    position: 'absolute',
    top: 10,
    right: 1,
    width: 10,
    height: 2,
    backgroundColor: '#1C1D21',
    transform: [{ rotate: '28deg' }],
    borderRadius: 999,
  },
});
