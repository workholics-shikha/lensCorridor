import { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ActivityIndicator,
  Dimensions, Platform, Image, ImageBackground,
} from 'react-native';
import { router } from 'expo-router';
import { ChevronDown } from 'lucide-react-native';
import { useAuth } from '@/context/AuthContext';
import { fetchSalespeople, fetchStores, StoreOption } from '@/lib/api';
import { Salesperson } from '@/lib/types';
import { Colors, Spacing, Radius, FontSize, Shadow } from '@/lib/theme';

const { width } = Dimensions.get('window');
const isTablet = width >= 768;
const logoImage = require('@/assets/images/lens-corridor-logo.png');
const splashBackground = require('@/assets/images/splash-background.png');
const logoWidth = Math.min(width * 0.58, isTablet ? 320 : 220);
const logoHeight = logoWidth * 0.53;

export default function SplashScreen() {
  const { user, loading } = useAuth();
  const [stores, setStores] = useState<StoreOption[]>([]);
  const [selectedStore, setSelectedStore] = useState<StoreOption | null>(null);
  const [salespeople, setSalespeople] = useState<Salesperson[]>([]);
  const [selectedSalesperson, setSelectedSalesperson] = useState<Salesperson | null>(null);
  const [storeDropdownOpen, setStoreDropdownOpen] = useState(false);
  const [salespersonDropdownOpen, setSalespersonDropdownOpen] = useState(false);
  const [selectionError, setSelectionError] = useState('');

  useEffect(() => {
    fetchStores().then(setStores);
    fetchSalespeople().then(setSalespeople);
  }, []);

  useEffect(() => {
    fetchSalespeople(selectedStore?.id).then((items) => {
      setSalespeople(items);
      setSelectedSalesperson(null);
    });
  }, [selectedStore]);

  useEffect(() => {
    if (!loading && user) {
      router.replace('/(tabs)');
    }
  }, [user, loading]);

  const handleNewOrder = () => {
    if (!selectedStore || !selectedSalesperson) {
      setSelectionError('Please select both a store and a salesman before continuing.');
      return;
    }
    router.push('/(auth)/login');
  };

  const handleReturnExchange = () => {
    if (!selectedStore || !selectedSalesperson) {
      setSelectionError('Please select both a store and a salesman before continuing.');
      return;
    }
    router.push('/(auth)/login');
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

      <View style={[styles.controlsSection, isTablet && styles.controlsSectionTablet]}>
        <TouchableOpacity
          style={styles.dropdown}
          onPress={() => {
            setStoreDropdownOpen(!storeDropdownOpen);
            setSalespersonDropdownOpen(false);
          }}
          activeOpacity={0.8}
        >
          <Text style={[styles.dropdownText, selectedStore && styles.dropdownTextSelected]}>
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
                <Text style={styles.dropdownItemText}>{store.name}</Text>
                <Text style={styles.dropdownItemSub}>{store.code}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        <TouchableOpacity
          style={[styles.dropdown, styles.secondaryDropdown]}
          onPress={() => {
            setSalespersonDropdownOpen(!salespersonDropdownOpen);
            setStoreDropdownOpen(false);
          }}
          activeOpacity={0.8}
        >
          <Text style={[styles.dropdownText, selectedSalesperson && styles.dropdownTextSelected]}>
            {selectedSalesperson
              ? `${selectedSalesperson.name} (${selectedSalesperson.employee_id})`
              : 'Select Salesman Id or Name'}
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
                  setSalespersonDropdownOpen(false);
                  setSelectionError('');
                }}
              >
                <Text style={styles.dropdownItemText}>{sp.name}</Text>
                <Text style={styles.dropdownItemSub}>{sp.employee_id}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {selectionError ? (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>{selectionError}</Text>
          </View>
        ) : null}

        <View style={styles.buttonsRow}>
          <TouchableOpacity style={styles.btnPrimary} onPress={handleNewOrder} activeOpacity={0.85}>
            <Text style={styles.btnPrimaryText}>New Order</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.btnSecondary} onPress={handleReturnExchange} activeOpacity={0.85}>
            <Text style={styles.btnSecondaryText}>Return / Exchange</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.bottomIndicator}>
        <View style={styles.indicatorBar} />
      </View>
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
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.xl,
  },
  backgroundImage: {
    width: '100%',
    height: '100%',
  },
  logoSection: {
    alignItems: 'center',
    marginBottom: Spacing.xxl,
  },
  logoContainer: {
    alignItems: 'center',
  },
  logoImage: {
    maxWidth: '100%',
  },
  logoImageTablet: {
    maxWidth: 320,
  },
  controlsSection: {
    width: '100%',
    maxWidth: 400,
    alignItems: 'center',
  },
  controlsSectionTablet: {
    maxWidth: 480,
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
  },
  dropdownTextSelected: {
    color: Colors.text,
    fontWeight: '500',
  },
  dropdownList: {
    width: '100%',
    backgroundColor: Colors.white,
    borderRadius: Radius.md,
    marginTop: Spacing.xs,
    ...Shadow.md,
    maxHeight: 220,
    overflow: 'hidden',
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
    flexDirection: 'row',
    marginTop: Spacing.lg,
    gap: Spacing.md,
    width: '100%',
    justifyContent: 'center',
  },
  btnPrimary: {
    backgroundColor: Colors.accent,
    borderRadius: Radius.full,
    paddingVertical: Spacing.sm + 4,
    paddingHorizontal: Spacing.xl,
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
