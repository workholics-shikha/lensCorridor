import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from 'react-native';
import { router } from 'expo-router';
import { ArrowLeft, FileSearch, Phone, RefreshCcw, Search } from 'lucide-react-native';
import { useOrderFlow } from '@/context/OrderFlowContext';
import { useReturnExchange } from '@/context/ReturnExchangeContext';
import { fetchOrderPlacements, type OrderPlacementRecord } from '@/lib/api';
import { buildDraftFromOrder } from '@/lib/orderFlow';
import { Colors, Shadow } from '@/lib/theme';

export default function ReturnExchangeSearchScreen() {
  const { width } = useWindowDimensions();
  const { draft, updateDraft } = useOrderFlow();
  const {
    selectedOrder,
    setSelectedOrder,
    setTransactionType,
    reset,
  } = useReturnExchange();
  const isTablet = width >= 920;
  const [query, setQuery] = useState('');
  const [orders, setOrders] = useState<OrderPlacementRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    reset();
    setLoading(true);
    fetchOrderPlacements({ limit: 20 })
      .then(setOrders)
      .catch(() => setError('Unable to load orders right now.'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    const trimmedQuery = query.trim();

    if (!trimmedQuery) {
      setSearching(false);
      return;
    }

    let active = true;
    const timer = setTimeout(() => {
      setSearching(true);
      const phone = trimmedQuery.replace(/\D/g, '').slice(-10);

      fetchOrderPlacements({
        search: trimmedQuery,
        phone: phone.length >= 3 ? phone : undefined,
        orderNumber: trimmedQuery,
        limit: 20,
      })
        .then((items) => {
          if (active) {
            setOrders(items);
          }
        })
        .catch(() => {
          if (active) {
            setError('Unable to search orders right now.');
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
  }, [query]);

  const visibleOrders = useMemo(() => {
    const trimmedQuery = query.trim().toLowerCase();
    if (!trimmedQuery) {
      return orders;
    }

    const numeric = trimmedQuery.replace(/\D/g, '');

    return orders.filter((order) => (
      order.customer.name.toLowerCase().includes(trimmedQuery)
      || order.customer.phone.replace(/\D/g, '').includes(numeric)
      || order.orderNumber.toLowerCase().includes(trimmedQuery)
      || order.id.toLowerCase().includes(trimmedQuery)
    ));
  }, [orders, query]);

  const handleSelectOrder = (order: OrderPlacementRecord) => {
    setSelectedOrder(order);
    const nextDraft = buildDraftFromOrder(order, draft);
    updateDraft({
      ...nextDraft,
      store: draft.store,
      salesperson: draft.salesperson,
    });
  };

  const handleStart = (type: 'return' | 'exchange') => {
    if (!selectedOrder) {
      return;
    }

    setTransactionType(type);
    router.push(type === 'return' ? '/return-exchange-return' : '/return-exchange-exchange');
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()} activeOpacity={0.86}>
          <ArrowLeft size={20} color="#1C1D21" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Return & Exchange</Text>
      </View>

      <ScrollView
        contentContainerStyle={styles.bodyScrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode={Platform.OS === 'ios' ? 'interactive' : 'on-drag'}
      >
        <View style={[styles.body, isTablet && styles.bodyTablet]}>
          <View style={[styles.panel, styles.searchPanel, isTablet && styles.searchPanelTablet]}>
            <View style={styles.panelHeader}>
              <FileSearch size={16} color={Colors.primary} />
              <Text style={styles.panelTitle}>Search Existing Orders</Text>
            </View>
            <Text style={styles.helperText}>Find by mobile number, invoice number, or order ID.</Text>

            <View style={styles.searchBox}>
              <Search size={16} color="#9CA3AF" />
              <TextInput
                value={query}
                onChangeText={setQuery}
                placeholder="Enter mobile, invoice no, or order ID"
                placeholderTextColor="#A3A7B3"
                style={styles.searchInput}
              />
            </View>

            {searching ? <Text style={styles.searchingText}>Searching orders...</Text> : null}
            {error ? <Text style={styles.errorText}>{error}</Text> : null}

            <ScrollView
              style={styles.resultsScroll}
              showsVerticalScrollIndicator={false}
              nestedScrollEnabled
            >
              {visibleOrders.length ? visibleOrders.map((order) => {
                const frameImage = order.frame.images.find((item) => item.image)?.image;
                const active = selectedOrder?.id === order.id;

                return (
                  <TouchableOpacity
                    key={order.id}
                    style={[styles.orderCard, active && styles.orderCardActive]}
                    activeOpacity={0.9}
                    onPress={() => handleSelectOrder(order)}
                  >
                    <View style={styles.orderCardTop}>
                      <View style={styles.orderImageWrap}>
                        {frameImage ? (
                          <Image source={{ uri: frameImage }} resizeMode="contain" style={styles.orderImage} />
                        ) : (
                          <View style={styles.imageFallback} />
                        )}
                      </View>

                      <View style={styles.orderBody}>
                        <Text style={styles.orderCustomer}>{order.customer.name || 'Customer'}</Text>
                        <View style={styles.metaPhoneRow}>
                          <Phone size={11} color={Colors.primary} />
                          <Text style={styles.metaPhoneText}>{order.customer.phone}</Text>
                        </View>
                        <Text style={styles.metaLine}>Invoice: {order.orderNumber}</Text>
                        <Text style={styles.metaLine}>Order ID: {order.id}</Text>
                      </View>
                    </View>
                  </TouchableOpacity>
                );
              }) : (
                <View style={styles.emptyState}>
                  <Text style={styles.emptyTitle}>No matching orders found</Text>
                  <Text style={styles.emptyText}>Try a mobile number, invoice number, or order ID.</Text>
                </View>
              )}
            </ScrollView>
          </View>

          <View style={[styles.panel, styles.detailPanel, isTablet && styles.detailPanelTablet]}>
            <View style={styles.panelHeader}>
              <RefreshCcw size={16} color={Colors.primary} />
              <Text style={styles.panelTitle}>Selected Order</Text>
            </View>

            {selectedOrder ? (
              <>
                <View style={styles.selectedCard}>
                  <Text style={styles.selectedName}>{selectedOrder.customer.name || 'Customer'}</Text>
                  <Text style={styles.selectedMeta}>Mobile: {selectedOrder.customer.phone}</Text>
                  <Text style={styles.selectedMeta}>Invoice: {selectedOrder.orderNumber}</Text>
                  <Text style={styles.selectedMeta}>Order ID: {selectedOrder.id}</Text>
                  <Text style={styles.selectedMeta}>
                    Product: Frame + {selectedOrder.lensSelection.lensCategory || selectedOrder.lensSelection.powerType || 'Lens'}
                  </Text>
                  <Text style={styles.selectedAmount}>Order Value: Rs. {selectedOrder.billing.totalPayable}</Text>
                </View>

                <Text style={styles.choiceLabel}>Choose the next action</Text>
                <TouchableOpacity
                  style={[styles.actionButton, styles.returnButton]}
                  activeOpacity={0.88}
                  onPress={() => handleStart('return')}
                >
                  <Text style={styles.actionButtonText}>Start Return</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.actionButton, styles.exchangeButton]}
                  activeOpacity={0.88}
                  onPress={() => handleStart('exchange')}
                >
                  <Text style={[styles.actionButtonText, styles.exchangeButtonText]}>Start Exchange</Text>
                </TouchableOpacity>
              </>
            ) : (
              <View style={styles.placeholderCard}>
                <Text style={styles.placeholderTitle}>Select an order to continue</Text>
                <Text style={styles.placeholderText}>
                  Order details and Return / Exchange actions will appear here.
                </Text>
              </View>
            )}
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#F4F6FB',
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F4F6FB',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: '#E8EBF3',
    paddingTop: Platform.OS === 'ios' ? 52 : 36,
    paddingBottom: 14,
    paddingHorizontal: 16,
  },
  backButton: {
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2430',
  },
  body: {
    padding: 16,
    gap: 16,
  },
  bodyScrollContent: {
    flexGrow: 1,
    paddingBottom: 28,
  },
  bodyTablet: {
    flexDirection: 'row',
    alignItems: 'stretch',
  },
  panel: {
    backgroundColor: Colors.white,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#E8EBF3',
    padding: 16,
    ...Shadow.sm,
  },
  searchPanel: {
    flex: 1,
  },
  searchPanelTablet: {
    flex: 1.25,
  },
  detailPanel: {
    minHeight: 280,
  },
  detailPanelTablet: {
    flex: 0.85,
  },
  panelHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  panelTitle: {
    marginLeft: 8,
    fontSize: 15,
    fontWeight: '700',
    color: '#1F2430',
  },
  helperText: {
    fontSize: 12.5,
    color: '#6B7280',
    marginBottom: 14,
  },
  searchBox: {
    minHeight: 44,
    borderRadius: 12,
    backgroundColor: '#F7F8FC',
    borderWidth: 1,
    borderColor: '#E5E7EF',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
  },
  searchInput: {
    flex: 1,
    minHeight: 44,
    marginLeft: 8,
    fontSize: 13,
    color: '#1F2430',
  },
  searchingText: {
    marginTop: 10,
    fontSize: 12,
    color: '#6B7280',
  },
  errorText: {
    marginTop: 10,
    fontSize: 12,
    color: Colors.error,
  },
  resultsScroll: {
    marginTop: 14,
    maxHeight: 560,
  },
  orderCard: {
    borderWidth: 1,
    borderColor: '#E6EAF2',
    borderRadius: 14,
    padding: 12,
    marginBottom: 12,
    backgroundColor: '#FFFFFF',
  },
  orderCardActive: {
    borderColor: '#F2A14A',
    backgroundColor: '#FFFDF9',
  },
  orderCardTop: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  orderImageWrap: {
    width: 92,
    height: 60,
    borderRadius: 10,
    backgroundColor: '#F6F8FC',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    marginRight: 12,
  },
  orderImage: {
    width: '100%',
    height: '100%',
  },
  imageFallback: {
    width: 56,
    height: 28,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#1C1D21',
  },
  orderBody: {
    flex: 1,
  },
  orderCustomer: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1F2430',
  },
  metaPhoneRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    marginBottom: 4,
  },
  metaPhoneText: {
    marginLeft: 4,
    fontSize: 11.5,
    color: '#374151',
  },
  metaLine: {
    fontSize: 11.5,
    color: '#6B7280',
    marginTop: 2,
  },
  emptyState: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E6EAF2',
    backgroundColor: '#FAFBFF',
    padding: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1F2430',
  },
  emptyText: {
    marginTop: 6,
    fontSize: 12.5,
    color: '#6B7280',
    textAlign: 'center',
  },
  selectedCard: {
    marginTop: 10,
    borderRadius: 14,
    backgroundColor: '#F7FAFF',
    borderWidth: 1,
    borderColor: '#DCE9FF',
    padding: 14,
  },
  selectedName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1F2430',
    marginBottom: 6,
  },
  selectedMeta: {
    fontSize: 12.5,
    color: '#475569',
    marginTop: 4,
  },
  selectedAmount: {
    marginTop: 10,
    fontSize: 15,
    fontWeight: '700',
    color: Colors.primary,
  },
  choiceLabel: {
    marginTop: 18,
    marginBottom: 10,
    fontSize: 13,
    fontWeight: '600',
    color: '#1F2430',
  },
  actionButton: {
    minHeight: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  returnButton: {
    backgroundColor: Colors.primary,
  },
  exchangeButton: {
    backgroundColor: '#FFF7ED',
    borderWidth: 1,
    borderColor: '#F5C48B',
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  exchangeButtonText: {
    color: '#B45309',
  },
  placeholderCard: {
    flex: 1,
    minHeight: 240,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E6EAF2',
    backgroundColor: '#FAFBFF',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 22,
  },
  placeholderTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1F2430',
  },
  placeholderText: {
    marginTop: 8,
    fontSize: 12.5,
    lineHeight: 18,
    color: '#6B7280',
    textAlign: 'center',
  },
});
