import { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, TextInput,
  KeyboardAvoidingView, Platform, ScrollView, Dimensions,
} from 'react-native';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Eye, EyeOff, Mail, Lock, User, Phone } from 'lucide-react-native';
import { supabase } from '@/lib/supabase';
import { Colors, Spacing, Radius, FontSize, Shadow } from '@/lib/theme';

const { width } = Dimensions.get('window');
const isTablet = width >= 768;

export default function SignupScreen() {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSignup = async () => {
    if (!fullName || !email || !password) { setError('Please fill in all required fields'); return; }
    if (password.length < 6) { setError('Password must be at least 6 characters'); return; }
    setLoading(true);
    setError('');
    const { data, error: err } = await supabase.auth.signUp({ email, password });
    if (err) { setLoading(false); setError(err.message); return; }
    if (data.user) {
      await supabase.from('profiles').insert({
        id: data.user.id,
        full_name: fullName,
        phone,
      });
    }
    setLoading(false);
    router.replace('/(tabs)');
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <LinearGradient colors={['#1A6FD4', '#1456A8']} style={styles.header}>
        <View style={styles.headerContent}>
          <Text style={styles.appName}>Lens Corridor</Text>
          <Text style={styles.tagline}>Create your account</Text>
        </View>
      </LinearGradient>

      <ScrollView style={styles.body} contentContainerStyle={styles.bodyContent} keyboardShouldPersistTaps="handled">
        <View style={[styles.card, isTablet && styles.cardTablet]}>
          <Text style={styles.title}>Create Account</Text>
          <Text style={styles.subtitle}>Join millions of happy customers</Text>

          {error ? <View style={styles.errorBox}><Text style={styles.errorText}>{error}</Text></View> : null}

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Full Name *</Text>
            <View style={styles.inputRow}>
              <User size={18} color={Colors.gray400} style={styles.inputIcon} />
              <TextInput style={styles.input} placeholder="Your full name" placeholderTextColor={Colors.gray400} value={fullName} onChangeText={setFullName} />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Email Address *</Text>
            <View style={styles.inputRow}>
              <Mail size={18} color={Colors.gray400} style={styles.inputIcon} />
              <TextInput style={styles.input} placeholder="you@example.com" placeholderTextColor={Colors.gray400} value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Phone Number</Text>
            <View style={styles.inputRow}>
              <Phone size={18} color={Colors.gray400} style={styles.inputIcon} />
              <TextInput style={styles.input} placeholder="+91 98765 43210" placeholderTextColor={Colors.gray400} value={phone} onChangeText={setPhone} keyboardType="phone-pad" />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Password *</Text>
            <View style={styles.inputRow}>
              <Lock size={18} color={Colors.gray400} style={styles.inputIcon} />
              <TextInput style={[styles.input, { flex: 1 }]} placeholder="Min. 6 characters" placeholderTextColor={Colors.gray400} value={password} onChangeText={setPassword} secureTextEntry={!showPassword} />
              <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={{ padding: 4 }}>
                {showPassword ? <EyeOff size={18} color={Colors.gray400} /> : <Eye size={18} color={Colors.gray400} />}
              </TouchableOpacity>
            </View>
          </View>

          <TouchableOpacity style={[styles.btnSignup, loading && styles.btnDisabled]} onPress={handleSignup} disabled={loading} activeOpacity={0.85}>
            <Text style={styles.btnSignupText}>{loading ? 'Creating Account...' : 'Create Account'}</Text>
          </TouchableOpacity>

          <View style={styles.loginRow}>
            <Text style={styles.loginText}>Already have an account? </Text>
            <TouchableOpacity onPress={() => router.back()}>
              <Text style={styles.loginLink}>Sign In</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingTop: Platform.OS === 'ios' ? 60 : 48,
    paddingBottom: Spacing.xxl,
    paddingHorizontal: Spacing.xl,
  },
  headerContent: { alignItems: 'center' },
  appName: { fontSize: FontSize.xxl, fontWeight: '800', color: Colors.white, letterSpacing: 0.5 },
  tagline: { fontSize: FontSize.md, color: 'rgba(255,255,255,0.75)', marginTop: 4 },
  body: { flex: 1, backgroundColor: Colors.background, marginTop: -Spacing.lg, borderTopLeftRadius: Radius.xl, borderTopRightRadius: Radius.xl },
  bodyContent: { padding: Spacing.lg, alignItems: 'center', paddingTop: Spacing.xl },
  card: { backgroundColor: Colors.white, borderRadius: Radius.xl, padding: Spacing.xl, width: '100%', ...Shadow.md },
  cardTablet: { maxWidth: 480 },
  title: { fontSize: FontSize.xxl, fontWeight: '700', color: Colors.text, marginBottom: 4 },
  subtitle: { fontSize: FontSize.md, color: Colors.textSecondary, marginBottom: Spacing.lg },
  errorBox: { backgroundColor: '#FEE2E2', borderRadius: Radius.md, padding: Spacing.sm, marginBottom: Spacing.md },
  errorText: { color: Colors.error, fontSize: FontSize.sm },
  inputGroup: { marginBottom: Spacing.md },
  label: { fontSize: FontSize.sm, fontWeight: '600', color: Colors.gray700, marginBottom: 6 },
  inputRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.gray50, borderRadius: Radius.md, borderWidth: 1, borderColor: Colors.border, paddingHorizontal: Spacing.sm },
  inputIcon: { marginRight: Spacing.xs },
  input: { flex: 1, paddingVertical: Spacing.sm + 2, fontSize: FontSize.md, color: Colors.text },
  btnSignup: { backgroundColor: Colors.primary, borderRadius: Radius.md, paddingVertical: Spacing.sm + 6, alignItems: 'center', marginTop: Spacing.sm, ...Shadow.sm },
  btnDisabled: { opacity: 0.65 },
  btnSignupText: { color: Colors.white, fontWeight: '700', fontSize: FontSize.md },
  loginRow: { flexDirection: 'row', justifyContent: 'center', marginTop: Spacing.lg },
  loginText: { color: Colors.textSecondary, fontSize: FontSize.md },
  loginLink: { color: Colors.primary, fontWeight: '700', fontSize: FontSize.md },
});
