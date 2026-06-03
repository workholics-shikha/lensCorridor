import { router } from 'expo-router';
import { ArrowLeft, ChevronRight, Glasses } from 'lucide-react-native';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useOrderFlow } from '@/context/OrderFlowContext';
import { Shadow } from '@/lib/theme';

export default function LensDetailsScreen() {
  const { draft } = useOrderFlow();

  return (
    <View style={styles.screen}>
      <Header title="Add Lens Details" />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <InfoCard />

        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <Glasses size={17} color="#1C71D8" />
            <Text style={styles.sectionTitle}>Select Lens Details</Text>
          </View>

          {draft.lensDetails.map((item) => (
            <TouchableOpacity
              key={item.id}
              style={styles.detailRow}
              onPress={() => router.push('/order-review')}
              activeOpacity={0.88}
            >
              <View>
                <Text style={styles.detailTitle}>{item.eye === 'right' ? 'Right eye' : 'Left eye'}</Text>
                <Text style={styles.detailSubtitle}>{item.label}</Text>
              </View>
              <ChevronRight size={18} color="#8A8E99" />
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity style={styles.primaryButton} onPress={() => router.push('/order-review')} activeOpacity={0.88}>
          <Text style={styles.primaryButtonText}>Save and Continue</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

function Header({ title }: { title: string }) {
  return (
    <View style={styles.header}>
      <TouchableOpacity style={styles.backButton} onPress={() => router.back()} activeOpacity={0.8}>
        <ArrowLeft size={20} color="#1C1D21" />
      </TouchableOpacity>
      <Text style={styles.headerTitle}>{title}</Text>
    </View>
  );
}

function InfoCard() {
  return (
    <View style={styles.infoCard}>
      <Text style={styles.infoTitle}>Lens type details</Text>
      <Text style={styles.infoBody}>Add left and right eye values for the selected lens before continuing.</Text>
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
    fontSize: 17,
    fontWeight: '500',
    color: '#202128',
  },
  content: {
    paddingHorizontal: 12,
    paddingTop: 14,
    paddingBottom: 40,
  },
  infoCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E7E8F0',
    padding: 14,
    marginBottom: 12,
    ...Shadow.sm,
  },
  infoTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#202128',
    marginBottom: 4,
  },
  infoBody: {
    fontSize: 12,
    lineHeight: 18,
    color: '#6F7380',
  },
  sectionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E7E8F0',
    padding: 14,
    ...Shadow.sm,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  sectionTitle: {
    marginLeft: 8,
    fontSize: 13,
    fontWeight: '600',
    color: '#202128',
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F8FAFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E6EDFC',
    paddingHorizontal: 12,
    paddingVertical: 12,
    marginTop: 10,
  },
  detailTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#202128',
  },
  detailSubtitle: {
    fontSize: 11,
    color: '#6F7380',
    marginTop: 2,
  },
  primaryButton: {
    marginTop: 18,
    minHeight: 44,
    borderRadius: 8,
    backgroundColor: '#1C71D8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
});
