import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { ArrowLeft, FileClock, Phone, Search, UserRound } from 'lucide-react-native';
import { useAuth } from '@/context/AuthContext';
import { fetchEyeTests, type EyeTestRecord } from '@/lib/api';
import { getProfile } from '@/lib/localStore';
import { Colors, FontSize, Radius, Shadow, Spacing } from '@/lib/theme';
import { useResponsiveMetrics } from '@/lib/responsive';

type HistoryItem = {
  id: string;
  customerName: string;
  mobileNumber: string;
  email: string;
  address: string;
  samePowerBothEyes: boolean;
  hasCylindricalPower: boolean;
  spherical: {
    right: string;
    left: string;
  };
  cylindrical: {
    right: string;
    left: string;
  };
  axis: {
    right: string;
    left: string;
  };
  createdAt: string;
  normalizedName: string;
  normalizedPhone: string;
};

export default function EyeTestHistoryScreen() {
  const { user } = useAuth();
  const viewport = useResponsiveMetrics();
  const isTablet = viewport.isTablet;
  const { mobileNumber: routeMobileNumber } = useLocalSearchParams<{ mobileNumber?: string }>();
  const profilePhone = user ? getProfile(user.id)?.phone || '' : '';
  const initialMobileNumber = String(routeMobileNumber || profilePhone || '').replace(/\D/g, '').slice(-10);
  const [searchValue, setSearchValue] = useState(initialMobileNumber);
  const [records, setRecords] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError('');

    fetchEyeTests()
      .then((items) => {
        if (!active) {
          return;
        }

        setRecords(items.map(mapEyeTestRecord).filter(isValidHistoryItem));
      })
      .catch(() => {
        if (!active) {
          return;
        }

        setRecords([]);
        setError('Unable to load eye test history right now.');
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

  const filteredRecords = useMemo(() => {
    const normalizedQuery = searchValue.trim().toLowerCase();
    const normalizedPhoneQuery = searchValue.replace(/\D/g, '').slice(-10);

    if (!normalizedQuery) {
      return records;
    }

    return records.filter((item) => (
      item.normalizedName.includes(normalizedQuery)
      || item.normalizedPhone.includes(normalizedPhoneQuery)
    ));
  }, [records, searchValue]);

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 16 : 0}
    >
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} activeOpacity={0.86}>
          <ArrowLeft size={18} color={Colors.text} />
        </TouchableOpacity>
        <View style={styles.headerTextWrap}>
          <Text style={styles.headerTitle}>Eye Test History</Text>
          <Text style={styles.headerSubtitle}>View saved eye powers by customer name or mobile.</Text>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.body,
          {
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
        <View style={styles.searchCard}>
          <View style={styles.searchLabelRow}>
            <Search size={16} color={Colors.primary} />
            <Text style={styles.searchLabel}>Search Customer</Text>
          </View>
          <View style={styles.searchInputWrap}>
            <TextInput
              value={searchValue}
              onChangeText={setSearchValue}
              placeholder="Search by name or mobile number"
              placeholderTextColor={Colors.gray400}
              style={styles.searchInput}
              keyboardType="default"
            />
          </View>
        </View>

        {loading ? (
          <View style={styles.stateCard}>
            <ActivityIndicator color={Colors.primary} />
            <Text style={styles.stateText}>Loading eye test history...</Text>
          </View>
        ) : null}

        {!loading && error ? (
          <View style={styles.stateCard}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}

        {!loading && !error && filteredRecords.length === 0 ? (
          <View style={styles.stateCard}>
            <FileClock size={28} color={Colors.gray400} />
            <Text style={styles.stateTitle}>No eye test history found</Text>
            <Text style={styles.stateText}>Try another name or mobile number, or save a new eye test first.</Text>
          </View>
        ) : null}

        {!loading && !error && filteredRecords.length > 0 ? (
          <View style={[styles.listWrap, isTablet && styles.listWrapTablet]}>
            {filteredRecords.map((item) => (
              <View key={item.id} style={styles.historyCard}>
                <View style={styles.historyTopRow}>
                  <View style={styles.historyIdentity}>
                    <View style={styles.historyIconBubble}>
                      <UserRound size={16} color={Colors.primary} />
                    </View>
                    <View style={styles.historyIdentityText}>
                      <Text style={styles.historyName}>{item.customerName || 'Customer'}</Text>
                      <View style={styles.historyMetaRow}>
                        <Phone size={12} color={Colors.gray500} />
                        <Text style={styles.historyMetaText}>{item.mobileNumber}</Text>
                      </View>
                    </View>
                  </View>
                  <Text style={styles.historyDate}>{item.createdAt}</Text>
                </View>

                <View style={styles.powerGrid}>
                  <PowerLine label="SPH" rightValue={item.spherical.right} leftValue={item.samePowerBothEyes ? item.spherical.right : item.spherical.left} />
                  <PowerLine label="CYL" rightValue={item.cylindrical.right} leftValue={item.samePowerBothEyes ? item.cylindrical.right : item.cylindrical.left} />
                  <PowerLine label="AXIS" rightValue={item.axis.right} leftValue={item.samePowerBothEyes ? item.axis.right : item.axis.left} />
                </View>

                {item.address ? (
                  <Text style={styles.historyFooter}>Address: {item.address}</Text>
                ) : null}
                {item.email ? (
                  <Text style={styles.historyFooter}>Email: {item.email}</Text>
                ) : null}
              </View>
            ))}
          </View>
        ) : null}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function PowerLine({
  label,
  rightValue,
  leftValue,
}: {
  label: string;
  rightValue: string;
  leftValue: string;
}) {
  return (
    <View style={styles.powerLine}>
      <Text style={styles.powerLabel}>{label}</Text>
      <Text style={styles.powerValue}>R {rightValue || '-'}</Text>
      <Text style={styles.powerValue}>L {leftValue || '-'}</Text>
    </View>
  );
}

function mapEyeTestRecord(item: EyeTestRecord): HistoryItem {
  return {
    id: item._id,
    customerName: item.name || 'Customer',
    mobileNumber: item.mobileNumber || '',
    email: item.email || '',
    address: item.address || '',
    samePowerBothEyes: Boolean(item.samePowerBothEyes),
    hasCylindricalPower: Boolean(item.hasCylindricalPower),
    spherical: {
      right: formatEyePowerValue(item.spherical?.right),
      left: formatEyePowerValue(item.spherical?.left),
    },
    cylindrical: {
      right: formatEyePowerValue(item.cylindrical?.right),
      left: formatEyePowerValue(item.cylindrical?.left),
    },
    axis: {
      right: formatAxisValue(item.axis?.right),
      left: formatAxisValue(item.axis?.left),
    },
    createdAt: new Date(item.createdAt).toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    }),
    normalizedName: String(item.name || '').trim().toLowerCase(),
    normalizedPhone: String(item.mobileNumber || '').replace(/\D/g, '').slice(-10),
  };
}

function isValidHistoryItem(item: HistoryItem) {
  return Boolean(
    item.normalizedPhone
    && (
      item.spherical.right
      || item.spherical.left
      || item.cylindrical.right
      || item.cylindrical.left
      || item.axis.right
      || item.axis.left
    )
  );
}

function formatEyePowerValue(value: number | null | undefined) {
  if (typeof value !== 'number' || Number.isNaN(value)) {
    return '';
  }

  if (value > 0) {
    return `+${value.toFixed(2)}`;
  }

  return value.toFixed(2);
}

function formatAxisValue(value: number | null | undefined) {
  if (typeof value !== 'number' || Number.isNaN(value)) {
    return '';
  }

  return String(Math.trunc(value));
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    paddingTop: Platform.OS === 'ios' ? 50 : 34,
    paddingBottom: 12,
    paddingHorizontal: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.gray100,
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: Radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.gray100,
    marginRight: Spacing.sm,
  },
  headerTextWrap: {
    flex: 1,
  },
  headerTitle: {
    fontSize: FontSize.lg,
    fontWeight: '700',
    color: Colors.text,
  },
  headerSubtitle: {
    marginTop: 2,
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
  },
  body: {
    paddingVertical: Spacing.md,
    paddingBottom: Spacing.xl,
  },
  searchCard: {
    backgroundColor: Colors.white,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    ...Shadow.sm,
  },
  searchLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    marginBottom: Spacing.sm,
  },
  searchLabel: {
    fontSize: FontSize.sm,
    fontWeight: '700',
    color: Colors.text,
  },
  searchInputWrap: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.md,
    backgroundColor: Colors.gray50,
    paddingHorizontal: Spacing.sm,
  },
  searchInput: {
    minHeight: 46,
    fontSize: FontSize.md,
    color: Colors.text,
  },
  stateCard: {
    marginTop: Spacing.md,
    backgroundColor: Colors.white,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadow.sm,
  },
  stateTitle: {
    marginTop: Spacing.sm,
    fontSize: FontSize.md,
    fontWeight: '700',
    color: Colors.text,
  },
  stateText: {
    marginTop: Spacing.xs,
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  errorText: {
    fontSize: FontSize.sm,
    color: Colors.error,
    textAlign: 'center',
  },
  listWrap: {
    marginTop: Spacing.md,
    gap: Spacing.md,
  },
  listWrapTablet: {
    gap: Spacing.lg,
  },
  historyCard: {
    backgroundColor: Colors.white,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    ...Shadow.sm,
  },
  historyTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: Spacing.sm,
  },
  historyIdentity: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  historyIconBubble: {
    width: 34,
    height: 34,
    borderRadius: Radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primaryLight,
    marginRight: Spacing.sm,
  },
  historyIdentityText: {
    flex: 1,
  },
  historyName: {
    fontSize: FontSize.md,
    fontWeight: '700',
    color: Colors.text,
  },
  historyMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 3,
  },
  historyMetaText: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
  },
  historyDate: {
    fontSize: FontSize.xs,
    fontWeight: '600',
    color: Colors.gray500,
  },
  powerGrid: {
    marginTop: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.gray100,
    borderRadius: Radius.md,
    overflow: 'hidden',
  },
  powerLine: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: Colors.gray100,
    backgroundColor: Colors.gray50,
  },
  powerLabel: {
    width: 48,
    fontSize: FontSize.sm,
    fontWeight: '700',
    color: Colors.text,
  },
  powerValue: {
    flex: 1,
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    fontWeight: '600',
  },
  historyFooter: {
    marginTop: Spacing.sm,
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
  },
});
