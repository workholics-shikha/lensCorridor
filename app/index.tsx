import { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ActivityIndicator,
  Dimensions, Platform,
} from 'react-native';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { ChevronDown } from 'lucide-react-native';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { Salesperson } from '@/lib/types';
import { Colors, Spacing, Radius, FontSize, Shadow } from '@/lib/theme';

const { width, height } = Dimensions.get('window');
const isTablet = width >= 768;

export default function SplashScreen() {
  const { session, loading } = useAuth();
  const [salespeople, setSalespeople] = useState<Salesperson[]>([]);
  const [selectedSalesperson, setSelectedSalesperson] = useState<Salesperson | null>(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  useEffect(() => {
    supabase.from('salespeople').select('*').eq('active', true).order('name').then(({ data }) => {
      setSalespeople(data || []);
    });
  }, []);

  useEffect(() => {
    if (!loading && session) {
      router.replace('/(tabs)');
    }
  }, [session, loading]);

  const handleNewOrder = () => {
    router.push('/(auth)/login');
  };

  const handleReturnExchange = () => {
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
    <LinearGradient colors={['#1A6FD4', '#1456A8']} style={styles.container}>
      {/* Logo */}
      <View style={styles.logoSection}>
        <View style={styles.logoContainer}>
          <Text style={[styles.infinitySymbol, isTablet && { fontSize: 80 }]}>∞</Text>
        </View>
        <Text style={[styles.brandName, isTablet && styles.brandNameTablet]}>Lens Corridor</Text>
      </View>

      {/* Salesman Dropdown */}
      <View style={[styles.controlsSection, isTablet && styles.controlsSectionTablet]}>
        <TouchableOpacity
          style={styles.dropdown}
          onPress={() => setDropdownOpen(!dropdownOpen)}
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
            style={{ transform: [{ rotate: dropdownOpen ? '180deg' : '0deg' }] }}
          />
        </TouchableOpacity>

        {dropdownOpen && (
          <View style={styles.dropdownList}>
            {salespeople.map((sp) => (
              <TouchableOpacity
                key={sp.id}
                style={styles.dropdownItem}
                onPress={() => { setSelectedSalesperson(sp); setDropdownOpen(false); }}
              >
                <Text style={styles.dropdownItemText}>{sp.name}</Text>
                <Text style={styles.dropdownItemSub}>{sp.employee_id}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* CTA Buttons */}
        <View style={styles.buttonsRow}>
          <TouchableOpacity style={styles.btnPrimary} onPress={handleNewOrder} activeOpacity={0.85}>
            <Text style={styles.btnPrimaryText}>New Order</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.btnSecondary} onPress={handleReturnExchange} activeOpacity={0.85}>
            <Text style={styles.btnSecondaryText}>Return / Exchange</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Bottom indicator */}
      <View style={styles.bottomIndicator}>
        <View style={styles.indicatorBar} />
      </View>
    </LinearGradient>
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
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.xl,
  },
  logoSection: {
    alignItems: 'center',
    marginBottom: Spacing.xxl,
  },
  logoContainer: {
    marginBottom: Spacing.md,
  },
  infinitySymbol: {
    fontSize: 60,
    fontWeight: '800',
    color: Colors.white,
  },
  brandName: {
    fontSize: FontSize.xxl,
    fontWeight: '700',
    color: Colors.white,
    letterSpacing: 0.5,
  },
  brandNameTablet: {
    fontSize: 32,
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
