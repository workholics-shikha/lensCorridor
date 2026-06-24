import { useEffect, useMemo, useRef, useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ActivityIndicator,
  KeyboardAvoidingView, Platform, Image, ImageBackground, ScrollView, TextInput, useWindowDimensions,
} from 'react-native';
import { router } from 'expo-router';
import { ChevronDown } from 'lucide-react-native';
import { useAuth } from '@/context/AuthContext';
import { useOrderFlow } from '@/context/OrderFlowContext';
import { fetchSalespeople, fetchStores, StoreOption, verifySalespersonPin } from '@/lib/api';
import { Salesperson } from '@/lib/types';
import { Colors, Spacing, Radius, FontSize, Shadow } from '@/lib/theme';
import { useResponsiveMetrics } from '@/lib/responsive';

const logoImage = require('@/assets/images/lens-corridor-logo.png');
const splashBackground = require('@/assets/images/splash-background.png');

export default function SplashScreen() {
  const { user, loading } = useAuth();
  const { updateDraft } = useOrderFlow();
  const viewport = useResponsiveMetrics();
  const { width } = viewport;
  const isTablet = viewport.isTablet;
  const logoWidth = useMemo(() => Math.min(width * 0.58, isTablet ? 320 : 220), [width, isTablet]);
  const logoHeight = logoWidth * 0.53;
  const [stores, setStores] = useState<StoreOption[]>([]);
  const [selectedStore, setSelectedStore] = useState<StoreOption | null>(null);
  const [salespeople, setSalespeople] = useState<Salesperson[]>([]);
  const [selectedSalesperson, setSelectedSalesperson] = useState<Salesperson | null>(null);
  const [staffPin, setStaffPin] = useState('');
  const [storeDropdownOpen, setStoreDropdownOpen] = useState(false);
  const [salespersonDropdownOpen, setSalespersonDropdownOpen] = useState(false);
  const [selectionError, setSelectionError] = useState('');
  const [verifyingPin, setVerifyingPin] = useState(false);
  const scrollRef = useRef<ScrollView | null>(null);
  const capitalizeWords = (text: string) => {
    return text
      ?.toLowerCase()
      .replace(/\b\w/g, (char) => char.toUpperCase());
  };

  const controlsWidth = isTablet
    ? Math.min(viewport.contentMaxWidth, viewport.isTabletLandscape ? width * 0.52 : width * 0.68)
    : Math.min(width * 0.9, 420);

  useEffect(() => {
    fetchStores().then(setStores);
  }, []);

  useEffect(() => {
    if (!selectedStore?.id) {
      setSalespeople([]);
      setSelectedSalesperson(null);
      setSalespersonDropdownOpen(false);
      return;
    }

    fetchSalespeople(selectedStore.id).then((items) => {
      setSalespeople(items);
      setSelectedSalesperson(null);
      setStaffPin('');
    });
  }, [selectedStore]);

  useEffect(() => {
    if (!loading && user) {
      router.replace('/(tabs)');
    }
  }, [user, loading]);

  const validateSelection = async () => {
    if (!selectedStore || !selectedSalesperson) {
      setSelectionError('Please select both a store and a salesman before continuing.');
      return false;
    }

    if (staffPin.trim().length < 4) {
      setSelectionError('Please enter staff PIN.');
      return false;
    }

    try {
      setVerifyingPin(true);
      await verifySalespersonPin({
        salesmanId: selectedSalesperson.employee_id,
        pin: staffPin.trim(),
      });
      setSelectionError('');
      return true;
    } catch (error) {
      setSelectionError(error instanceof Error ? error.message : 'Invalid PIN.');
      return false;
    } finally {
      setVerifyingPin(false);
    }
  };

  const handleNewOrder = async () => {
    const valid = await validateSelection();

    if (!valid || !selectedStore || !selectedSalesperson) {
      return;
    }

    updateDraft({
      store: {
        id: selectedStore.id,
        name: selectedStore.name,
        code: selectedStore.code,
      },
      salesperson: {
        id: selectedSalesperson.id,
        name: selectedSalesperson.name,
        employeeId: selectedSalesperson.employee_id,
      },
    });

    router.push('/(tabs)');
  };

  const handleReturnExchange = async () => {
    const valid = await validateSelection();

    if (!valid || !selectedStore || !selectedSalesperson) {
      return;
    }

    updateDraft({
      store: {
        id: selectedStore.id,
        name: selectedStore.name,
        code: selectedStore.code,
      },
      salesperson: {
        id: selectedSalesperson.id,
        name: selectedSalesperson.name,
        employeeId: selectedSalesperson.employee_id,
      },
    });

    router.push('/return-exchange-search');
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator color={Colors.white} size="large" />
      </View>
    );
  }

  return (
    <ImageBackground
      source={splashBackground}
      style={styles.container}
      imageStyle={styles.backgroundImage}
      resizeMode="cover"
    >
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 24 : 0}
      >
        <ScrollView
          ref={scrollRef}
          bounces={false}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode={Platform.OS === 'ios' ? 'interactive' : 'on-drag'}
          showsVerticalScrollIndicator={false}
          style={styles.scroll}
        >
          <View style={styles.contentWrap}>
          <View style={styles.logoSection}>
            <View style={styles.logoContainer}>
              <Image
                source={logoImage}
                style={[
                  styles.logoImage,
                  { width: logoWidth, height: logoHeight },
                  isTablet && styles.logoImageTablet,
                ]}
                resizeMode="contain"
              />
            </View>
          </View>

          <View style={[
            styles.controlsSection,
            { width: controlsWidth, maxWidth: '100%' },
            isTablet && styles.controlsSectionTablet,
          ]}>
            <View style={[styles.dropdownShell, storeDropdownOpen && styles.dropdownShellRaised]}>
              <TouchableOpacity
                style={styles.dropdown}
                onPress={() => {
                  setStoreDropdownOpen(!storeDropdownOpen);
                  setSalespersonDropdownOpen(false);
                }}
                activeOpacity={0.8}
              >
                <Text style={[styles.dropdownText, selectedStore && styles.dropdownTextSelected]} numberOfLines={1}>
                  {selectedStore
                    ? `${selectedStore.name} (${selectedStore.code})`
                    : 'Select Store'}
                </Text>
                <ChevronDown
                  size={18}
                  color={selectedStore ? Colors.text : Colors.gray500}
                  style={{ transform: [{ rotate: storeDropdownOpen ? '180deg' : '0deg' }] }}
                />
              </TouchableOpacity>

              {storeDropdownOpen && (
                <View style={styles.dropdownList}>
                  {stores.map((store) => (
                    <TouchableOpacity
                      key={store.id}
                      style={styles.dropdownItem}
                      onPress={() => {
                        setSelectedStore(store);
                        setStoreDropdownOpen(false);
                        setSelectionError('');
                      }}
                    >
                      <Text style={styles.dropdownItemText}>
                        {store.name?.charAt(0).toUpperCase() + store.name?.slice(1).toLowerCase()}
                      </Text>
                      <Text style={styles.dropdownItemSub}>{store.code}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>

            <View style={[styles.dropdownShell, salespersonDropdownOpen && styles.dropdownShellRaised, styles.secondaryDropdown]}>
              <TouchableOpacity
                style={styles.dropdown}
                onPress={() => {
                  if (!selectedStore) {
                    setSelectionError('Please select a store first.');
                    setSalespersonDropdownOpen(false);
                    return;
                  }
                  setSalespersonDropdownOpen(!salespersonDropdownOpen);
                  setStoreDropdownOpen(false);
                }}
                activeOpacity={0.8}
              >
                <Text
                  style={[
                    styles.dropdownText,
                    selectedSalesperson && styles.dropdownTextSelected
                  ]}
                  numberOfLines={1}
                >
                  {selectedSalesperson
                    ? `${capitalizeWords(selectedSalesperson.name)} (${selectedSalesperson.employee_id})`
                    : (selectedStore ? 'Select Salesman Id or Name' : 'Select Store First')}
                </Text>

                <ChevronDown
                  size={18}
                  color={selectedSalesperson ? Colors.text : Colors.gray500}
                  style={{ transform: [{ rotate: salespersonDropdownOpen ? '180deg' : '0deg' }] }}
                />
              </TouchableOpacity>

              {salespersonDropdownOpen && (
                <View style={styles.dropdownList}>
                  {salespeople.map((sp) => (
                    <TouchableOpacity
                      key={sp.id}
                      style={styles.dropdownItem}
                      onPress={() => {
                        setSelectedSalesperson(sp);
                        setStaffPin('');
                        setSalespersonDropdownOpen(false);
                        setSelectionError('');
                      }}
                    >
                      <Text style={styles.dropdownItemText}>{capitalizeWords(sp.name)}</Text>
                      <Text style={styles.dropdownItemSub}>{sp.employee_id}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>

            <View style={[styles.pinShell, styles.secondaryDropdown]}>
              <TextInput
                value={staffPin}
                onChangeText={(value) => {
                  setStaffPin(value.replace(/[^0-9]/g, '').slice(0, 6));
                  setSelectionError('');
                }}
                onFocus={() => {
                  globalThis.setTimeout(() => {
                    scrollRef.current?.scrollToEnd({ animated: true });
                  }, 140);
                }}
                placeholder="Enter PIN"
                placeholderTextColor={Colors.gray400}
                keyboardType="number-pad"
                secureTextEntry
                style={styles.pinInput}
              />
            </View>

            {selectionError ? (
              <View style={styles.errorBox}>
                <Text style={styles.errorText}>{selectionError}</Text>
              </View>
            ) : null}

            <View style={[styles.buttonsRow, isTablet && styles.buttonsRowTablet]}>
              <TouchableOpacity style={[styles.btnPrimary, styles.actionButton, verifyingPin && styles.actionButtonDisabled]} onPress={handleNewOrder} activeOpacity={0.85} disabled={verifyingPin}>
                <Text style={styles.btnPrimaryText}>{verifyingPin ? 'Verifying...' : 'New Order'}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.btnSecondary, styles.actionButton, verifyingPin && styles.actionButtonDisabled]} onPress={handleReturnExchange} activeOpacity={0.85} disabled={verifyingPin}>
                <Text style={styles.btnSecondaryText}>{verifyingPin ? 'Verifying...' : 'Return / Exchange'}</Text>
              </TouchableOpacity>
            </View>
          </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  container: {
    flex: 1,
    backgroundColor: Colors.primary,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  contentWrap: {
    flex: 1,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xl,
  },
  backgroundImage: {
    width: '100%',
    height: '100%',
  },
  logoSection: {
    alignItems: 'center',
    marginBottom: Spacing.xl,
    width: '100%',
  },
  logoContainer: {
    alignItems: 'center',
    width: '100%',
  },
  logoImage: {
    maxWidth: '100%',
  },
  logoImageTablet: {
    maxWidth: 320,
  },
  controlsSection: {
    alignSelf: 'center',
    alignItems: 'center',
    overflow: 'visible',
    zIndex: 2,
  },
  controlsSectionTablet: {
    alignItems: 'stretch',
  },
  dropdownShell: {
    width: '100%',
    position: 'relative',
    zIndex: 1,
  },
  dropdownShellRaised: {
    zIndex: 30,
  },
  dropdown: {
    width: '100%',
    backgroundColor: Colors.white,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm + 4,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    ...Shadow.sm,
  },
  secondaryDropdown: {
    marginTop: Spacing.sm,
  },
  dropdownList: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    backgroundColor: Colors.white,
    borderRadius: Radius.md,
    marginTop: Spacing.xs,
    ...Shadow.md,
    maxHeight: 220,
    overflow: 'hidden',
    zIndex: 40,
    elevation: 8,
  },
  pinShell: {
    width: '100%',
    backgroundColor: Colors.white,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.md,
    paddingTop: 10,
    paddingBottom: 8,
    ...Shadow.sm,
  },
  pinLabel: {
    fontSize: FontSize.sm,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 6,
  },
  pinInput: {
    minHeight: 42,
    borderWidth: 1,
    borderColor: Colors.gray200,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.md,
    fontSize: FontSize.md,
    color: Colors.text,
    backgroundColor: Colors.gray50,
  },
  errorBox: {
    width: '100%',
    backgroundColor: '#FEE2E2',
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    marginTop: Spacing.sm,
  },
  errorText: {
    color: Colors.error,
    fontSize: FontSize.sm,
    fontWeight: '500',
  },
  dropdownText: {
    fontSize: FontSize.md,
    color: Colors.gray400,
    flex: 1,
    marginRight: Spacing.sm,
  },
  dropdownTextSelected: {
    color: Colors.text,
    fontWeight: '500',
  },
  dropdownItem: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm + 2,
    borderBottomWidth: 1,
    borderBottomColor: Colors.gray100,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dropdownItemText: {
    fontSize: FontSize.md,
    color: Colors.text,
    fontWeight: '500',
  },
  dropdownItemSub: {
    fontSize: FontSize.sm,
    color: Colors.gray400,
  },
  buttonsRow: {
    flexDirection: 'column',
    marginTop: Spacing.lg,
    gap: Spacing.md,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'stretch',
  },
  buttonsRowTablet: {
    flexDirection: 'row',
  },
  actionButton: {
    width: '100%',
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  actionButtonDisabled: {
    opacity: 0.7,
  },
  btnPrimary: {
    backgroundColor: Colors.accent,
    borderRadius: Radius.full,
    paddingVertical: Spacing.sm + 4,
    paddingHorizontal: Spacing.lg,
    ...Shadow.sm,
  },
  btnPrimaryText: {
    color: Colors.white,
    fontWeight: '700',
    fontSize: FontSize.md,
  },
  btnSecondary: {
    borderWidth: 1.5,
    borderColor: Colors.white,
    borderRadius: Radius.full,
    paddingVertical: Spacing.sm + 4,
    paddingHorizontal: Spacing.lg,
  },
  btnSecondaryText: {
    color: Colors.white,
    fontWeight: '600',
    fontSize: FontSize.md,
  },
  bottomIndicator: {
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 32 : 20,
    alignItems: 'center',
  },
  indicatorBar: {
    width: 120,
    height: 4,
    backgroundColor: 'rgba(255,255,255,0.5)',
    borderRadius: Radius.full,
  },
});
