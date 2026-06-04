import { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, Platform, Dimensions, Image,
} from 'react-native';
import { router } from 'expo-router';
import { User, Phone, Mail, LogOut, ChevronRight, Shield, FileText, Bell, HelpCircle, Star } from 'lucide-react-native';
import { getProfile, updateProfile } from '@/lib/localStore';
import { Colors, Spacing, Radius, FontSize, Shadow } from '@/lib/theme';
import { useAuth } from '@/context/AuthContext';
import { Profile } from '@/lib/types';

const { width } = Dimensions.get('window');
const isTablet = width >= 768;

export default function ProfileScreen() {
  const { user, signOut } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [editing, setEditing] = useState(false);
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user) return;
    const data = getProfile(user.id);
    if (data) {
      setProfile(data);
      setFullName(data.full_name || '');
      setPhone(data.phone || '');
    }
  }, [user]);

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    const updated = await updateProfile(user.id, { full_name: fullName, phone });
    setProfile(updated);
    setSaving(false);
    setEditing(false);
  };

  const handleSignOut = async () => {
    await signOut();
    router.replace('/');
  };

  if (!user) {
    return (
      <View style={styles.center}>
        <User size={56} color={Colors.gray300} />
        <Text style={styles.guestTitle}>You're browsing as a guest</Text>
        <Text style={styles.guestSub}>Browse the catalog and continue shopping without signing in.</Text>
        <TouchableOpacity style={styles.signInBtn} onPress={() => router.replace('/(tabs)')}>
          <Text style={styles.signInBtnText}>Go to Home</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View style={styles.profileHeader}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {(profile?.full_name || user.email || 'U').charAt(0).toUpperCase()}
          </Text>
        </View>
        <View style={styles.profileInfo}>
          <Text style={styles.profileName}>{profile?.full_name || 'User'}</Text>
          <Text style={styles.profileEmail}>{user.email}</Text>
          {profile?.phone && <Text style={styles.profilePhone}>{profile.phone}</Text>}
        </View>
        <TouchableOpacity style={styles.editBtn} onPress={() => setEditing(!editing)}>
          <Text style={styles.editBtnText}>{editing ? 'Cancel' : 'Edit'}</Text>
        </TouchableOpacity>
      </View>

      {/* Edit Form */}
      {editing && (
        <View style={styles.editForm}>
          <Text style={styles.editTitle}>Edit Profile</Text>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Full Name</Text>
            <View style={styles.inputRow}>
              <User size={16} color={Colors.gray400} />
              <TextInput style={styles.input} value={fullName} onChangeText={setFullName} placeholder="Your full name" placeholderTextColor={Colors.gray400} />
            </View>
          </View>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Phone Number</Text>
            <View style={styles.inputRow}>
              <Phone size={16} color={Colors.gray400} />
              <TextInput style={styles.input} value={phone} onChangeText={setPhone} placeholder="+91 98765 43210" placeholderTextColor={Colors.gray400} keyboardType="phone-pad" />
            </View>
          </View>
          <TouchableOpacity style={[styles.saveBtn, saving && { opacity: 0.65 }]} onPress={handleSave} disabled={saving}>
            <Text style={styles.saveBtnText}>{saving ? 'Saving...' : 'Save Changes'}</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Quick Actions */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>My Account</Text>
        <MenuItem icon={<FileText size={18} color={Colors.primary} />} label="My Orders" onPress={() => router.push('/(tabs)/orders')} />
        <MenuItem icon={<Shield size={18} color={Colors.primary} />} label="Prescriptions" onPress={() => router.push('/prescription')} />
        <MenuItem icon={<Star size={18} color={Colors.primary} />} label="Wishlist" onPress={() => router.push('/(tabs)/wishlist')} />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Support</Text>
        <MenuItem icon={<Bell size={18} color={Colors.gray500} />} label="Notifications" onPress={() => {}} />
        <MenuItem icon={<HelpCircle size={18} color={Colors.gray500} />} label="Help & Support" onPress={() => {}} />
      </View>

      <View style={styles.section}>
        <TouchableOpacity style={styles.signOutBtn} onPress={handleSignOut}>
          <LogOut size={18} color={Colors.error} />
          <Text style={styles.signOutText}>Sign Out</Text>
        </TouchableOpacity>
      </View>

      <View style={{ height: Spacing.xxl }} />
    </ScrollView>
  );
}

function MenuItem({ icon, label, onPress }: { icon: React.ReactNode; label: string; onPress: () => void }) {
  return (
    <TouchableOpacity style={menuStyles.item} onPress={onPress} activeOpacity={0.7}>
      <View style={menuStyles.iconWrap}>{icon}</View>
      <Text style={menuStyles.label}>{label}</Text>
      <ChevronRight size={16} color={Colors.gray400} />
    </TouchableOpacity>
  );
}

const menuStyles = StyleSheet.create({
  item: { flexDirection: 'row', alignItems: 'center', paddingVertical: Spacing.sm + 2, borderBottomWidth: 1, borderBottomColor: Colors.gray100 },
  iconWrap: { width: 32, alignItems: 'center' },
  label: { flex: 1, fontSize: FontSize.md, fontWeight: '500', color: Colors.text, marginLeft: Spacing.sm },
});

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.background, padding: Spacing.xl },
  profileHeader: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: Colors.primary, paddingTop: Platform.OS === 'ios' ? 52 : 36,
    paddingBottom: Spacing.xl, paddingHorizontal: Spacing.md,
  },
  avatar: {
    width: 60, height: 60, borderRadius: 30,
    backgroundColor: 'rgba(255,255,255,0.25)',
    alignItems: 'center', justifyContent: 'center', marginRight: Spacing.md,
  },
  avatarText: { fontSize: FontSize.xxl, fontWeight: '800', color: Colors.white },
  profileInfo: { flex: 1 },
  profileName: { fontSize: FontSize.lg, fontWeight: '700', color: Colors.white },
  profileEmail: { fontSize: FontSize.sm, color: 'rgba(255,255,255,0.8)', marginTop: 2 },
  profilePhone: { fontSize: FontSize.sm, color: 'rgba(255,255,255,0.7)', marginTop: 1 },
  editBtn: { backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: Radius.md, paddingHorizontal: Spacing.md, paddingVertical: 6 },
  editBtnText: { color: Colors.white, fontWeight: '600', fontSize: FontSize.sm },
  editForm: { backgroundColor: Colors.white, padding: Spacing.md, marginBottom: Spacing.md, ...Shadow.sm },
  editTitle: { fontSize: FontSize.lg, fontWeight: '700', color: Colors.text, marginBottom: Spacing.md },
  inputGroup: { marginBottom: Spacing.sm },
  label: { fontSize: FontSize.xs, fontWeight: '600', color: Colors.gray700, marginBottom: 4 },
  inputRow: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.xs,
    backgroundColor: Colors.gray50, borderRadius: Radius.md,
    borderWidth: 1, borderColor: Colors.border, paddingHorizontal: Spacing.sm,
  },
  input: { flex: 1, paddingVertical: Spacing.sm, fontSize: FontSize.md, color: Colors.text },
  saveBtn: { backgroundColor: Colors.primary, borderRadius: Radius.md, paddingVertical: Spacing.sm + 4, alignItems: 'center', marginTop: Spacing.sm },
  saveBtnText: { color: Colors.white, fontWeight: '700', fontSize: FontSize.md },
  section: { backgroundColor: Colors.white, margin: Spacing.md, marginBottom: 0, borderRadius: Radius.lg, padding: Spacing.md, ...Shadow.sm },
  sectionTitle: { fontSize: FontSize.sm, fontWeight: '700', color: Colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: Spacing.sm },
  signOutBtn: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, paddingVertical: Spacing.sm + 2 },
  signOutText: { fontSize: FontSize.md, fontWeight: '600', color: Colors.error },
  guestTitle: { fontSize: FontSize.xl, fontWeight: '700', color: Colors.text, marginTop: Spacing.md, marginBottom: 6 },
  guestSub: { fontSize: FontSize.md, color: Colors.textSecondary, textAlign: 'center', marginBottom: Spacing.lg },
  signInBtn: { backgroundColor: Colors.primary, borderRadius: Radius.md, paddingHorizontal: Spacing.xl, paddingVertical: Spacing.sm + 4 },
  signInBtnText: { color: Colors.white, fontWeight: '700', fontSize: FontSize.md },
});
