import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { History, Phone, Search } from 'lucide-react-native';
import { fetchOrderPlacements, type OrderPlacementRecord } from '@/lib/api';
import { Colors, FontSize, Radius, Shadow, Spacing } from '@/lib/theme';
import { useTabScreenBottomSpace } from '@/lib/tabBar';
import { scaleForTablet } from '@/lib/tabletTypography';
import { useResponsiveMetrics } from '@/lib/responsive';

export default function OrdersScreen() {
  const { width, height } = useWindowDimensions();
  const viewport = useResponsiveMetrics();
  const isTablet = viewport.isTablet;
  const isLandscape = viewport.isLandscape;
  const bottomSafeSpace = useTabScreenBottomSpace(isTablet ? (isLandscape ? 28 : 32) : 20);
  const pageSize = viewport.isTabletLandscape ? 6 : isTablet ? 4 : 6;
  const headerIconSize = isTablet ? scaleForTablet(14, 18, 20) : 14;
  const searchIconSize = isTablet ? scaleForTablet(14, 18, 20) : 14;
  const [orders, setOrders] = useState<OrderPlacementRecord[]>([]);
  const [suggestions, setSuggestions] = useState<OrderPlacementRecord[]>([]);
  const [searchValue, setSearchValue] = useState('');
  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  const loadOrders = useCallback((showLoader: boolean) => {
    let active = true;

    if (showLoader) {
      setLoading(true);
    }
    setError('');

    fetchOrderPlacements()
      .then((items) => {
        if (!active) {
          return;
        }

        setOrders(items);
      })
      .catch(() => {
        if (active) {
          setError('Unable to load order history right now.');
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
  }, []);

  useFocusEffect(
    useCallback(() => {
      const cleanup = loadOrders(orders.length === 0);
      return cleanup;
    }, [loadOrders, orders.length])
  );

  useEffect(() => {
    const trimmedQuery = searchValue.trim();
    const normalizedPhone = trimmedQuery.replace(/\D/g, '').slice(-10);
    const isPhoneQuery = /^\d+$/.test(trimmedQuery.replace(/\s+/g, '')) && normalizedPhone.length > 0;

    if ((!isPhoneQuery && trimmedQuery.length < 2) || (isPhoneQuery && normalizedPhone.length < 3)) {
      setSuggestions([]);
      setSearching(false);
      return;
    }

    let active = true;
    const timer = setTimeout(() => {
      setSearching(true);
      fetchOrderPlacements({
        search: trimmedQuery,
        phone: isPhoneQuery ? normalizedPhone : undefined,
        limit: 6,
      })
        .then((items) => {
          if (active) {
            setSuggestions(items);
          }
        })
        .catch(() => {
          if (active) {
            setSuggestions([]);
          }
        })
        .finally(() => {
          if (active) {
            setSearching(false);
          }
        });
    }, 250);

    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [searchValue]);

  const visibleOrders = useMemo(() => {
    const trimmedQuery = searchValue.trim().toLowerCase();
    const normalizedPhone = searchValue.replace(/\D/g, '').slice(-10);
    const isPhoneQuery = /^\d+$/.test(searchValue.trim().replace(/\s+/g, '')) && normalizedPhone.length > 0;

    if ((!isPhoneQuery && trimmedQuery.length < 2) || (isPhoneQuery && normalizedPhone.length < 3)) {
      return orders;
    }

    const suggestionIds = new Set(suggestions.map((item) => item.id));
    return orders.filter((item) => (
      suggestionIds.has(item.id)
      || (isPhoneQuery
        ? item.customer.phone.replace(/\D/g, '').includes(normalizedPhone)
        : (
          item.customer.name.toLowerCase().includes(trimmedQuery)
          || item.orderNumber.toLowerCase().includes(trimmedQuery)
        ))
    ));
  }, [orders, searchValue, suggestions]);

  const totalPages = Math.max(1, Math.ceil(visibleOrders.length / pageSize));
  const paginatedOrders = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    return visibleOrders.slice(startIndex, startIndex + pageSize);
  }, [currentPage, pageSize, visibleOrders]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchValue, pageSize]);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  const paginationItems = useMemo(() => {
    if (totalPages <= 5) {
      return Array.from({ length: totalPages }, (_, index) => index + 1);
    }

    if (currentPage <= 3) {
      return [1, 2, 3, '...', totalPages] as const;
    }

    if (currentPage >= totalPages - 2) {
      return [1, '...', totalPages - 2, totalPages - 1, totalPages] as const;
    }

    return [1, '...', currentPage, '...', totalPages] as const;
  }, [currentPage, totalPages]);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 12 : 0}
    >
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Order</Text>
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.body,
          {
            paddingBottom: bottomSafeSpace,
            maxWidth: viewport.contentMaxWidth,
            alignSelf: 'center',
            width: '100%',
            paddingHorizontal: viewport.horizontalPadding,
          },
        ]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode={Platform.OS === 'ios' ? 'interactive' : 'on-drag'}
      >
        <View style={styles.sectionHeader}>
          <View style={styles.sectionLabelRow}>
            <History size={headerIconSize} color={Colors.primary} />
            <Text style={[styles.sectionLabel, isTablet && styles.sectionLabelTablet]}>Order History</Text>
          </View>

          <View style={[styles.searchWrap, isTablet && styles.searchWrapTablet]}>
            <Search size={searchIconSize} color="#BABFCB" />
            <TextInput
              value={searchValue}
              onChangeText={setSearchValue}
              placeholder="Search by customer name or mobile number"
              placeholderTextColor="#A0A5B1"
              keyboardType="default"
              style={[styles.searchInput, isTablet && styles.searchInputTablet]}
            />
          </View>

          {(suggestions.length > 0 || searching) && searchValue.trim().length >= 2 ? (
            <View style={styles.dropdown}>
              {searching ? (
                <Text style={styles.dropdownHint}>Searching...</Text>
              ) : (
                suggestions.map((item) => (
                  <TouchableOpacity
                    key={item.id}
                    style={styles.dropdownItem}
                    activeOpacity={0.86}
                    onPress={() => {
                      setSearchValue(item.customer.name || item.customer.phone);
                      setSuggestions([]);
                    }}
                  >
                    <Text style={styles.dropdownName}>{item.customer.name || 'Customer'}</Text>
                    <Text style={styles.dropdownPhone}>{item.customer.phone}</Text>
                  </TouchableOpacity>
                ))
              )}
            </View>
          ) : null}
        </View>

        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        <FlatList
          data={paginatedOrders}
          key={isTablet ? 'grid' : 'list'}
          numColumns={isTablet ? 2 : 1}
          scrollEnabled={false}
          columnWrapperStyle={isTablet ? styles.gridRow : undefined}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={<Text style={styles.emptyText}>No matching orders found.</Text>}
          renderItem={({ item, index }) => (
            <OrderHistoryCard
              order={item}
              highlighted={index === 1}
              isTablet={isTablet}
            />
          )}
        />

        {visibleOrders.length > pageSize ? (
          <View style={styles.paginationRow}>
            <TouchableOpacity
              style={[styles.paginationNav, currentPage === 1 && styles.paginationNavDisabled]}
              activeOpacity={0.86}
              onPress={() => setCurrentPage((page) => Math.max(1, page - 1))}
              disabled={currentPage === 1}
            >
              <Text style={styles.paginationNavText}>{'<'}</Text>
            </TouchableOpacity>

            {paginationItems.map((item, index) => (
              typeof item === 'number' ? (
                <TouchableOpacity
                  key={`${item}-${index}`}
                  style={[styles.paginationPage, currentPage === item && styles.paginationPageActive]}
                  activeOpacity={0.86}
                  onPress={() => setCurrentPage(item)}
                >
                  <Text style={[styles.paginationPageText, currentPage === item && styles.paginationPageTextActive]}>
                    {item}
                  </Text>
                </TouchableOpacity>
              ) : (
                <View key={`${item}-${index}`} style={styles.paginationEllipsisWrap}>
                  <Text style={styles.paginationEllipsis}>{item}</Text>
                </View>
              )
            ))}

            <TouchableOpacity
              style={[styles.paginationNav, currentPage === totalPages && styles.paginationNavDisabled]}
              activeOpacity={0.86}
              onPress={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}
              disabled={currentPage === totalPages}
            >
              <Text style={styles.paginationNavText}>{'>'}</Text>
            </TouchableOpacity>
          </View>
        ) : null}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function OrderHistoryCard({
  order,
  highlighted,
  isTablet,
}: {
  order: OrderPlacementRecord;
  highlighted?: boolean;
  isTablet: boolean;
}) {
  const frameImage = order.frame.images.find((item) => item.image)?.image;
  const orderDate = new Date(order.createdAt).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
  });
  const cardWidth = isTablet ? '49%' : '100%';

  return (
    <TouchableOpacity
      style={[
        styles.orderCard,
        highlighted && styles.orderCardHighlighted,
        isTablet && styles.orderCardTablet,
        { width: cardWidth },
      ]}
      activeOpacity={0.9}
      onPress={() => router.push({ pathname: '/order-details', params: { orderId: order.id } })}
    >
      <View style={styles.customerRow}>
        <Text style={[styles.customerMeta, isTablet && styles.customerMetaTablet]}>
          Customer Name - <Text style={styles.customerMetaStrong}>{order.customer.name || 'Customer'}</Text>
        </Text>
        <View style={styles.customerPhoneWrap}>
          <Phone size={isTablet ? scaleForTablet(11, 15, 17) : 11} color={Colors.primary} />
          <Text style={[styles.customerPhone, isTablet && styles.customerPhoneTablet]}>{order.customer.phone}</Text>
        </View>
      </View>

      <View style={styles.productRow}>
        <View style={[styles.productImageShell, isTablet && styles.productImageShellTablet]}>
          {frameImage ? (
            <Image source={{ uri: frameImage }} resizeMode="contain" style={styles.productImage} />
          ) : (
            <View style={[styles.imageFallback, isTablet && styles.imageFallbackTablet]} />
          )}
        </View>

        <View style={styles.productBody}>
          <Text style={[styles.productTitle, isTablet && styles.productTitleTablet]}>Lenscorridor frame</Text>
          <Text style={[styles.productSub, isTablet && styles.productSubTablet]}>
            Frame + {order.lensSelection.lensCategory || order.lensSelection.powerType || 'Lens'}
          </Text>
          <Text style={[styles.productPrice, isTablet && styles.productPriceTablet]}>Rs. {order.billing.totalPayable}</Text>
        </View>
      </View>

      <View style={[styles.footerRow, isTablet && styles.footerRowTablet]}>
        <FooterMeta label="Order ID:" value={order.orderNumber} isTablet={isTablet} />
        <FooterMeta label="Order Date:" value={orderDate} centered isTablet={isTablet} />
        <FooterMeta label="Total Price:" value={`Rs. ${order.billing.totalPayable}`} right isTablet={isTablet} />
      </View>

      {Number(order.billing.remainingAmount ?? 0) > 0 ? (
        <View style={styles.pendingPaymentRow}>
          <Text style={styles.pendingPaymentText}>
            Pending payment: Rs. {Number(order.billing.remainingAmount ?? 0).toLocaleString('en-IN')}
          </Text>
        </View>
      ) : null}
    </TouchableOpacity>
  );
}

function FooterMeta({
  label,
  value,
  centered,
  right,
  isTablet,
}: {
  label: string;
  value: string;
  centered?: boolean;
  right?: boolean;
  isTablet?: boolean;
}) {
  return (
    <View style={[styles.footerMeta, centered && styles.footerMetaCenter, right && styles.footerMetaRight]}>
      <Text style={[styles.footerLabel, isTablet && styles.footerLabelTablet]}>{label}</Text>
      <Text style={[styles.footerValue, isTablet && styles.footerValueTablet]}>{value}</Text>
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
  },
  header: {
    backgroundColor: Colors.white,
    paddingTop: Platform.OS === 'ios' ? 52 : 36,
    paddingBottom: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#EAEDF3',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '500',
    color: '#20242B',
  },
  body: { flexGrow: 1, paddingTop: 14 },
  sectionHeader: {
    position: 'relative',
    zIndex: 2,
  },
  sectionLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionLabel: {
    marginLeft: 6,
    fontSize: 14,
    fontWeight: '500',
    color: '#252A33',
  },
  sectionLabelTablet: {
    marginLeft: 8,
  },
  searchWrap: {
    minHeight: 42,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E1E5EE',
    backgroundColor: Colors.white,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    marginBottom: 12,
    width: '100%',
  },
  searchWrapTablet: {
    minHeight: 54,
    borderRadius: 12,
    paddingHorizontal: 14,
    marginBottom: 16,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 13,
    color: '#1F2430',
    minWidth: 0,
    paddingVertical: 10,
  },
  searchInputTablet: {
    marginLeft: 10,
    paddingVertical: 14,
  },
  dropdown: {
    position: 'absolute',
    top: 68,
    right: 0,
    left: 0,
    backgroundColor: Colors.white,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E6EAF1',
    ...Shadow.md,
  },
  dropdownItem: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F3F7',
  },
  dropdownHint: {
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 12,
    color: '#6E7584',
  },
  dropdownName: {
    fontSize: 12.5,
    fontWeight: '600',
    color: '#20242B',
  },
  dropdownPhone: {
    marginTop: 2,
    fontSize: 11.5,
    color: '#6E7584',
  },
  errorText: {
    marginBottom: 10,
    fontSize: 12,
    color: Colors.error,
  },
  listContent: {
    paddingTop: 4,
  },
  gridRow: {
    justifyContent: 'space-between',
  },
  orderCard: {
    backgroundColor: Colors.white,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E9EDF4',
    padding: 10,
    marginBottom: 12,
    ...Shadow.sm,
  },
  orderCardTablet: {
    borderRadius: 18,
    padding: 16,
    marginBottom: 16,
  },
  orderCardHighlighted: {
    borderColor: '#F0A252',
  },
  customerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  customerMeta: {
    flex: 1,
    fontSize: 10.5,
    color: '#8B92A1',
    marginRight: 8,
  },
  customerMetaTablet: {
    marginRight: 12,
  },
  customerMetaStrong: {
    color: '#20242B',
    fontWeight: '600',
  },
  customerPhoneWrap: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  customerPhone: {
    marginLeft: 4,
    fontSize: 10.5,
    color: '#20242B',
  },
  customerPhoneTablet: {
    marginLeft: 6,
  },
  productRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  productImageShell: {
    width: 104,
    height: 64,
    borderRadius: 10,
    backgroundColor: '#F6F8FC',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  productImageShellTablet: {
    width: 132,
    height: 84,
    borderRadius: 14,
  },
  productImage: {
    width: '100%',
    height: '100%',
  },
  imageFallback: {
    width: 64,
    height: 34,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#1C1D21',
  },
  imageFallbackTablet: {
    width: 82,
    height: 42,
    borderRadius: 14,
  },
  productBody: {
    flex: 1,
    marginLeft: 12,
  },
  productTitle: {
    fontSize: 13,
    fontWeight: '500',
    color: '#20242B',
  },
  productTitleTablet: {
    fontWeight: '600',
  },
  productSub: {
    marginTop: 4,
    fontSize: 10.5,
    color: '#878E9D',
  },
  productSubTablet: {
    marginTop: 6,
  },
  productPrice: {
    marginTop: 6,
    fontSize: 16,
    fontWeight: '700',
    color: Colors.primary,
  },
  productPriceTablet: {
    marginTop: 8,
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#EFF2F6',
  },
  footerRowTablet: {
    marginTop: 14,
    paddingTop: 12,
  },
  footerMeta: {
    flex: 1,
  },
  footerMetaCenter: {
    alignItems: 'center',
  },
  footerMetaRight: {
    alignItems: 'flex-end',
  },
  footerLabel: {
    fontSize: 9.5,
    color: '#8A91A1',
  },
  footerLabelTablet: {
    lineHeight: 18,
  },
  footerValue: {
    marginTop: 2,
    fontSize: 10.5,
    color: '#20242B',
    fontWeight: '500',
  },
  footerValueTablet: {
    marginTop: 4,
    fontWeight: '600',
  },
  pendingPaymentRow: {
    marginTop: 10,
    borderRadius: 12,
    backgroundColor: '#FFF7ED',
    borderWidth: 1,
    borderColor: '#F5D2A7',
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  pendingPaymentText: {
    fontSize: 12,
    color: '#B45309',
    fontWeight: '700',
  },
  emptyText: {
    paddingVertical: 28,
    textAlign: 'center',
    color: '#6E7584',
    fontSize: 13,
  },
  paginationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
    marginBottom: 8,
    flexWrap: 'wrap',
    gap: 4,
  },
  paginationNav: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#F1F4F8',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 4,
  },
  paginationNavDisabled: {
    opacity: 0.45,
  },
  paginationNavText: {
    fontSize: 13,
    color: '#8A91A1',
    fontWeight: '700',
  },
  paginationPage: {
    minWidth: 36,
    height: 36,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E3E8F1',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 10,
    marginHorizontal: 4,
  },
  paginationPageActive: {
    borderColor: '#AFCBFF',
    backgroundColor: '#EAF2FF',
  },
  paginationPageText: {
    fontSize: 13,
    color: '#5F6778',
    fontWeight: '500',
  },
  paginationPageTextActive: {
    color: Colors.primary,
    fontWeight: '700',
  },
  paginationEllipsisWrap: {
    minWidth: 28,
    minHeight: 36,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 2,
  },
  paginationEllipsis: {
    fontSize: 13,
    color: '#8A91A1',
    fontWeight: '600',
  },
});
