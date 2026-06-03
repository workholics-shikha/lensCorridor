import { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, Platform, Dimensions,
} from 'react-native';
import { router } from 'expo-router';
import { ArrowLeft, Upload, Eye, CheckCircle } from 'lucide-react-native';
import { savePrescription } from '@/lib/localStore';
import { Colors, Spacing, Radius, FontSize, Shadow } from '@/lib/theme';
import { useAuth } from '@/context/AuthContext';

const { width } = Dimensions.get('window');
const isTablet = width >= 768;

export default function PrescriptionScreen() {
  const { user } = useAuth();
  const [rightSph, setRightSph] = useState('');
  const [rightCyl, setRightCyl] = useState('');
  const [rightAxis, setRightAxis] = useState('');
  const [leftSph, setLeftSph] = useState('');
  const [leftCyl, setLeftCyl] = useState('');
  const [leftAxis, setLeftAxis] = useState('');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  const handleSave = async () => {
    if (!user) { router.push('/(auth)/login'); return; }
    setSaving(true);
    setError('');
    try {
      await savePrescription(user.id, {
        notes,
        order_id: undefined,
        right_eye_sph: rightSph ? parseFloat(rightSph) : null,
        right_eye_cyl: rightCyl ? parseFloat(rightCyl) : null,
        right_eye_axis: rightAxis ? parseInt(rightAxis) : null,
        left_eye_sph: leftSph ? parseFloat(leftSph) : null,
        left_eye_cyl: leftCyl ? parseFloat(leftCyl) : null,
        left_eye_axis: leftAxis ? parseInt(leftAxis) : null,
      });
    } catch (_error) {
      setSaving(false);
      setError('Failed to save prescription');
      return;
    }
    setSaving(false);
    setSaved(true);
  };

  if (saved) {
    return (
      <View style={styles.successContainer}>
        <View style={styles.successCard}>
          <View style={styles.successIcon}>
            <CheckCircle size={56} color={Colors.success} />
          </View>
          <Text style={styles.successTitle}>Prescription Saved!</Text>
          <Text style={styles.successText}>Your prescription has been saved. Our optometrist will review it and apply it to your lens order.</Text>
          <TouchableOpacity style={styles.doneBtn} onPress={() => router.back()}>
            <Text style={styles.doneBtnText}>Done</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <ArrowLeft size={20} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Prescription</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
        <View style={[styles.maxWidth, isTablet && styles.maxWidthTablet]}>
          {/* Info Banner */}
          <View style={styles.infoBanner}>
            <Eye size={20} color={Colors.primary} />
            <Text style={styles.infoText}>Enter your eye power as given by your optometrist or ophthalmologist. All values are optional.</Text>
          </View>

          {error ? <View style={styles.errorBox}><Text style={styles.errorText}>{error}</Text></View> : null}

          {/* Right Eye */}
          <View style={styles.eyeSection}>
            <View style={styles.eyeHeader}>
              <View style={styles.eyeTag}>
                <Text style={styles.eyeTagText}>R</Text>
              </View>
              <Text style={styles.eyeTitle}>Right Eye (OD)</Text>
            </View>
            <View style={styles.powerRow}>
              <PowerField label="SPH" value={rightSph} onChangeText={setRightSph} placeholder="-2.50" />
              <PowerField label="CYL" value={rightCyl} onChangeText={setRightCyl} placeholder="-0.75" />
              <PowerField label="AXIS" value={rightAxis} onChangeText={setRightAxis} placeholder="180" keyboardType="numeric" />
            </View>
          </View>

          {/* Left Eye */}
          <View style={styles.eyeSection}>
            <View style={styles.eyeHeader}>
              <View style={[styles.eyeTag, { backgroundColor: Colors.accent }]}>
                <Text style={styles.eyeTagText}>L</Text>
              </View>
              <Text style={styles.eyeTitle}>Left Eye (OS)</Text>
            </View>
            <View style={styles.powerRow}>
              <PowerField label="SPH" value={leftSph} onChangeText={setLeftSph} placeholder="-2.00" />
              <PowerField label="CYL" value={leftCyl} onChangeText={setLeftCyl} placeholder="-0.50" />
              <PowerField label="AXIS" value={leftAxis} onChangeText={setLeftAxis} placeholder="175" keyboardType="numeric" />
            </View>
          </View>

          {/* Notes */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Additional Notes (Optional)</Text>
            <TextInput
              style={styles.notesInput}
              value={notes}
              onChangeText={setNotes}
              placeholder="e.g. Progressive lenses, reading glasses, etc."
              placeholderTextColor={Colors.gray400}
              multiline
              numberOfLines={3}
              textAlignVertical="top"
            />
          </View>

          {/* Upload Option */}
          <TouchableOpacity style={styles.uploadBox}>
            <Upload size={24} color={Colors.primary} />
            <Text style={styles.uploadTitle}>Upload Prescription Image</Text>
            <Text style={styles.uploadSub}>JPG, PNG or PDF up to 5MB</Text>
          </TouchableOpacity>

          {/* Power Guide */}
          <View style={styles.guideCard}>
            <Text style={styles.guideTitle}>Understanding Your Prescription</Text>
            {[
              { term: 'SPH (Sphere)', desc: 'Overall lens power. Negative (-) for nearsighted, positive (+) for farsighted.' },
              { term: 'CYL (Cylinder)', desc: 'Amount of astigmatism correction needed.' },
              { term: 'AXIS', desc: 'Direction of astigmatism, measured in degrees (1–180).' },
            ].map(g => (
              <View key={g.term} style={styles.guideItem}>
                <Text style={styles.guideTerm}>{g.term}</Text>
                <Text style={styles.guideDesc}>{g.desc}</Text>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>

      <View style={styles.bottom}>
        <TouchableOpacity
          style={[styles.saveBtn, saving && { opacity: 0.65 }]}
          onPress={handleSave}
          disabled={saving}
          activeOpacity={0.85}
        >
          <Text style={styles.saveBtnText}>{saving ? 'Saving...' : 'Save Prescription'}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

function PowerField({ label, value, onChangeText, placeholder, keyboardType }: any) {
  return (
    <View style={powerStyles.wrap}>
      <Text style={powerStyles.label}>{label}</Text>
      <TextInput
        style={powerStyles.input}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={Colors.gray400}
        keyboardType={keyboardType ?? 'numbers-and-punctuation'}
        textAlign="center"
      />
    </View>
  );
}

const powerStyles = StyleSheet.create({
  wrap: { flex: 1, alignItems: 'center' },
  label: { fontSize: FontSize.xs, fontWeight: '700', color: Colors.textMuted, marginBottom: 4, letterSpacing: 0.5 },
  input: {
    width: '100%', backgroundColor: Colors.gray50, borderRadius: Radius.md,
    borderWidth: 1, borderColor: Colors.border,
    paddingVertical: Spacing.sm, fontSize: FontSize.md, color: Colors.text,
    textAlign: 'center',
  },
});

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: Colors.white, paddingTop: Platform.OS === 'ios' ? 52 : 36,
    paddingBottom: Spacing.md, paddingHorizontal: Spacing.md, ...Shadow.sm,
  },
  backBtn: { padding: 4 },
  headerTitle: { fontSize: FontSize.lg, fontWeight: '700', color: Colors.text },
  body: { padding: Spacing.md, paddingBottom: 100, alignItems: isTablet ? 'center' : undefined },
  maxWidth: { width: '100%' },
  maxWidthTablet: { maxWidth: 600 },
  infoBanner: {
    flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.sm,
    backgroundColor: Colors.primaryLight, borderRadius: Radius.lg,
    padding: Spacing.md, marginBottom: Spacing.md,
    borderWidth: 1, borderColor: Colors.primary + '30',
  },
  infoText: { flex: 1, fontSize: FontSize.sm, color: Colors.primary, lineHeight: 20 },
  errorBox: { backgroundColor: '#FEE2E2', borderRadius: Radius.md, padding: Spacing.sm, marginBottom: Spacing.sm },
  errorText: { color: Colors.error, fontSize: FontSize.sm },
  eyeSection: { backgroundColor: Colors.white, borderRadius: Radius.lg, padding: Spacing.md, marginBottom: Spacing.sm, ...Shadow.sm },
  eyeHeader: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginBottom: Spacing.sm },
  eyeTag: { width: 28, height: 28, borderRadius: 14, backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center' },
  eyeTagText: { color: Colors.white, fontWeight: '800', fontSize: FontSize.md },
  eyeTitle: { fontSize: FontSize.lg, fontWeight: '700', color: Colors.text },
  powerRow: { flexDirection: 'row', gap: Spacing.sm },
  section: { backgroundColor: Colors.white, borderRadius: Radius.lg, padding: Spacing.md, marginBottom: Spacing.sm, ...Shadow.sm },
  sectionLabel: { fontSize: FontSize.sm, fontWeight: '600', color: Colors.gray700, marginBottom: Spacing.sm },
  notesInput: {
    backgroundColor: Colors.gray50, borderRadius: Radius.md,
    borderWidth: 1, borderColor: Colors.border,
    padding: Spacing.sm, fontSize: FontSize.md, color: Colors.text, minHeight: 80,
  },
  uploadBox: {
    backgroundColor: Colors.white, borderRadius: Radius.lg,
    borderWidth: 2, borderColor: Colors.primary, borderStyle: 'dashed',
    padding: Spacing.xl, alignItems: 'center', marginBottom: Spacing.md, ...Shadow.sm,
  },
  uploadTitle: { fontSize: FontSize.md, fontWeight: '600', color: Colors.primary, marginTop: Spacing.sm },
  uploadSub: { fontSize: FontSize.xs, color: Colors.textMuted, marginTop: 4 },
  guideCard: { backgroundColor: Colors.white, borderRadius: Radius.lg, padding: Spacing.md, ...Shadow.sm },
  guideTitle: { fontSize: FontSize.md, fontWeight: '700', color: Colors.text, marginBottom: Spacing.sm },
  guideItem: { marginBottom: Spacing.sm },
  guideTerm: { fontSize: FontSize.sm, fontWeight: '700', color: Colors.primary, marginBottom: 2 },
  guideDesc: { fontSize: FontSize.xs, color: Colors.textSecondary, lineHeight: 18 },
  bottom: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    backgroundColor: Colors.white, padding: Spacing.md,
    paddingBottom: Platform.OS === 'ios' ? 28 : Spacing.md,
    borderTopWidth: 1, borderTopColor: Colors.border, ...Shadow.lg,
  },
  saveBtn: { backgroundColor: Colors.primary, borderRadius: Radius.md, paddingVertical: Spacing.sm + 6, alignItems: 'center' },
  saveBtnText: { color: Colors.white, fontWeight: '700', fontSize: FontSize.md },
  successContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.background, padding: Spacing.xl },
  successCard: { backgroundColor: Colors.white, borderRadius: Radius.xl, padding: Spacing.xl, alignItems: 'center', width: '100%', maxWidth: 420, ...Shadow.lg },
  successIcon: { width: 96, height: 96, borderRadius: 48, backgroundColor: '#DCFCE7', alignItems: 'center', justifyContent: 'center', marginBottom: Spacing.lg },
  successTitle: { fontSize: FontSize.xxl, fontWeight: '800', color: Colors.text, marginBottom: 8 },
  successText: { fontSize: FontSize.md, color: Colors.textSecondary, textAlign: 'center', lineHeight: 22, marginBottom: Spacing.xl },
  doneBtn: { backgroundColor: Colors.primary, borderRadius: Radius.md, paddingHorizontal: Spacing.xl, paddingVertical: Spacing.sm + 4, width: '100%', alignItems: 'center' },
  doneBtnText: { color: Colors.white, fontWeight: '700', fontSize: FontSize.md },
});
