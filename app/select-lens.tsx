import { useEffect, useState } from 'react';
import { router } from 'expo-router';
import { ArrowLeft, ChevronRight } from 'lucide-react-native';
import {
  ActivityIndicator,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useOrderFlow } from '@/context/OrderFlowContext';
import { fetchPowerTypes, type PowerTypeOption } from '@/lib/api';
import { Shadow } from '@/lib/theme';

const POWER_TYPE_IMAGE_MAP: Record<string, number> = {
  'with-power.png': require('@/assets/images/with-power.png'),
  'zero-power.png': require('@/assets/images/zero-power.png'),
  'reading-power.png': require('@/assets/images/reading-power.png'),
  'progressive-bifocals.png': require('@/assets/images/progressive-bifocals.png'),
  'frame-only.png': require('@/assets/images/frame-only.png'),
  'power-type-with-power': require('@/assets/images/with-power.png'),
  'power-type-zero-power': require('@/assets/images/zero-power.png'),
  'power-type-reading-power': require('@/assets/images/reading-power.png'),
  'power-type-progressive-bifocals': require('@/assets/images/progressive-bifocals.png'),
  'power-type-frame-only': require('@/assets/images/frame-only.png'),
};

export default function SelectLensScreen() {
  const { draft, updateLensSelection } = useOrderFlow();
  const [powerTypes, setPowerTypes] = useState<PowerTypeOption[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    fetchPowerTypes()
      .then((items) => {
        if (!active) {
          return;
        }

        setPowerTypes(items);
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

  const handleSelect = (item: PowerTypeOption) => {
    const normalizedName = item.name.toLowerCase();

    updateLensSelection({
      powerTypeId: item.id,
      powerType: item.name,
      lensType: item.name,
      lensCategory: '',
      lensCategoryId: '',
      lensPrice: 0,
      image: item.image,
    });

    if (normalizedName === 'frame only') {
      router.push('/billing');
      return;
    }

    if (normalizedName === 'with power') {
      router.push('/lens-details');
      return;
    }

    if (normalizedName === 'reading power') {
      router.push({
        pathname: '/prescription',
        params: { mode: 'order-flow', nextPath: '/billing' },
      });
      return;
    }

    if (normalizedName === 'progressive bifocals') {
      router.push({
        pathname: '/prescription',
        params: { mode: 'order-flow', nextPath: '/lens-details' },
      });
      return;
    }

    router.push('/lens-details');
  };

  return (
    <View style={styles.screen}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()} activeOpacity={0.8}>
          <ArrowLeft size={20} color="#1C1D21" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Select Lens</Text>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#1C71D8" />
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          {powerTypes.map((item) => {
            const selected = draft.lensSelection.powerType === item.name;

            return (
              <TouchableOpacity
                key={item.id}
                style={[styles.lensCard, selected && styles.lensCardSelected]}
                onPress={() => handleSelect(item)}
                activeOpacity={0.88}
              >
                <View style={styles.cardLeft}>
                  <LensGraphic item={item} selected={selected} />
                  <View style={styles.textWrap}>
                    <Text style={styles.cardTitle}>{item.name}</Text>
                    <Text style={styles.cardSubtitle}>{item.description}</Text>
                  </View>
                </View>

                <ChevronRight size={18} color="#8D9098" strokeWidth={1.9} />
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      )}
    </View>
  );
}

function LensGraphic({ item, selected }: { item: PowerTypeOption; selected: boolean }) {
  const localImage = item.image ? POWER_TYPE_IMAGE_MAP[item.image] : undefined;
  if (localImage) {
    return (
      <View style={[styles.iconImageWrap, selected && styles.iconImageWrapSelected]}>
        <Image
          source={localImage}
          resizeMode="contain"
          style={styles.iconImage}
        />
      </View>
    );
  }

  if (item.image) {
    return (
      <View style={[styles.iconImageWrap, selected && styles.iconImageWrapSelected]}>
        <Image
          source={{ uri: item.image }}
          resizeMode="contain"
          style={styles.iconImageRemote}
        />
      </View>
    );
  }

  return <LensIcon name={item.name} selected={selected} />;
}

function LensIcon({ name, selected }: { name: string; selected: boolean }) {
  const stroke = selected ? '#0D67E9' : '#6B78B8';
  const accent = '#34A4FF';

  return (
    <View style={styles.iconWrap}>
      <View style={[styles.iconLens, styles.iconLensLeft, { borderColor: stroke }]} />
      <View style={[styles.iconLens, styles.iconLensRight, { borderColor: stroke }]} />
      <View style={[styles.iconBridge, { backgroundColor: stroke }]} />
      {name === 'With Power' || name === 'Reading Power' ? (
        <View style={name === 'With Power' ? styles.plusWrap : styles.plusWrapRight}>
          <View style={[styles.plusLineH, { backgroundColor: accent }]} />
          <View style={[styles.plusLineV, { backgroundColor: accent }]} />
        </View>
      ) : null}
      {name === 'Zero Power' ? (
        <View style={styles.sparkWrap}>
          <View style={[styles.sparkWingOne, { borderColor: accent }]} />
          <View style={[styles.sparkWingTwo, { borderColor: accent }]} />
          <View style={[styles.sparkWingThree, { borderColor: accent }]} />
        </View>
      ) : null}
    </View>
  );
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
    marginRight: 8,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '500',
    color: '#202128',
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    paddingHorizontal: 12,
    paddingTop: 22,
    paddingBottom: 42,
  },
  lensCard: {
    minHeight: 44,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E7E8F0',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    ...Shadow.sm,
  },
  lensCardSelected: {
    borderColor: '#F4A34E',
  },
  cardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    minWidth: 0,
  },
  textWrap: {
    flex: 1,
    minWidth: 0,
  },
  iconImageWrap: {
    width: 38,
    height: 22,
    marginRight: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 6,
  },
  iconImageWrapSelected: {
    backgroundColor: '#EEF5FF',
  },
  iconImage: {
    width: 38,
    height: 22,
  },
  iconImageRemote: {
    width: 38,
    height: 22,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#202128',
  },
  cardSubtitle: {
    marginTop: 4,
    fontSize: 13.5,
    color: '#9A9DA9',
  },
  iconWrap: {
    width: 38,
    height: 22,
    marginRight: 10,
    position: 'relative',
    justifyContent: 'center',
  },
  iconLens: {
    position: 'absolute',
    top: 4,
    width: 15,
    height: 13,
    borderWidth: 1.5,
    borderRadius: 7,
    backgroundColor: 'transparent',
  },
  iconLensLeft: {
    left: 0,
  },
  iconLensRight: {
    right: 0,
  },
  iconBridge: {
    position: 'absolute',
    left: 14,
    top: 10,
    width: 10,
    height: 1.5,
    borderRadius: 999,
  },
  plusWrap: {
    position: 'absolute',
    left: 8,
    top: 6,
    width: 10,
    height: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  plusWrapRight: {
    position: 'absolute',
    right: 2,
    top: 6,
    width: 10,
    height: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  plusLineH: {
    position: 'absolute',
    width: 8,
    height: 1.5,
    borderRadius: 999,
  },
  plusLineV: {
    position: 'absolute',
    width: 1.5,
    height: 8,
    borderRadius: 999,
  },
  sparkWrap: {
    position: 'absolute',
    right: -1,
    top: 4,
    width: 14,
    height: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sparkWingOne: {
    position: 'absolute',
    width: 6,
    height: 6,
    borderTopWidth: 1.4,
    borderLeftWidth: 1.4,
    transform: [{ rotate: '-35deg' }],
  },
  sparkWingTwo: {
    position: 'absolute',
    width: 6,
    height: 6,
    borderTopWidth: 1.4,
    borderRightWidth: 1.4,
    transform: [{ rotate: '35deg' }],
  },
  sparkWingThree: {
    position: 'absolute',
    width: 1.4,
    height: 8,
    backgroundColor: '#34A4FF',
    borderRadius: 999,
  },
});
