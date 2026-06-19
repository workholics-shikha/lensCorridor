import { useMemo, useState } from 'react';
import {
  KeyboardAvoidingView,
  Modal,
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
import { useLocalSearchParams } from 'expo-router';
import { ArrowLeft, CheckCircle, ChevronDown, FileText, X } from 'lucide-react-native';
import { useAuth } from '@/context/AuthContext';
import { useOrderFlow } from '@/context/OrderFlowContext';
import { savePrescription } from '@/lib/localStore';
import { Colors, FontSize, Radius, Shadow, Spacing } from '@/lib/theme';

const SPH_VALUES = buildPowerOptions();
const CYL_VALUES = ['0.00', '-0.25', '-0.50', '-0.75', '-1.00', '-1.25', '-1.50', '-1.75', '-2.00', '-2.25', '-2.50'];
const AXIS_VALUES = ['10', '20', '30', '40', '50', '60', '70', '80', '90', '100', '110', '120', '130', '140', '150', '160', '170', '180'];

type EyeField = 'sph' | 'cyl' | 'axis';
type EyeKey = 'right' | 'left';
type SelectorState = {
  open: boolean;
  eye: EyeKey;
  field: EyeField;
};

export default function PrescriptionScreen() {
  const { user } = useAuth();
  const { draft, updateLensDetail } = useOrderFlow();
  const { mode, nextPath } = useLocalSearchParams<{ mode?: string; nextPath?: string }>();
  const { width } = useWindowDimensions();
  const isCompact = width < 760;
  const isOrderFlow = mode === 'order-flow';
  const resolvedNextPath = (
    nextPath === '/billing'
    || nextPath === '/lens-details'
    || nextPath === '/return-exchange-exchange'
  ) ? nextPath : '/lens-details';
  const [samePower, setSamePower] = useState(false);
  const [hasCylindricalPower, setHasCylindricalPower] = useState(false);
  const [selector, setSelector] = useState<SelectorState>({ open: false, eye: 'right', field: 'sph' });
  const [rightEye, setRightEye] = useState({
    sph: draft.lensDetails.find((item) => item.eye === 'right')?.sph ?? '',
    cyl: draft.lensDetails.find((item) => item.eye === 'right')?.cyl ?? '',
    axis: draft.lensDetails.find((item) => item.eye === 'right')?.axis ?? '',
  });
  const [leftEye, setLeftEye] = useState({
    sph: draft.lensDetails.find((item) => item.eye === 'left')?.sph ?? '',
    cyl: draft.lensDetails.find((item) => item.eye === 'left')?.cyl ?? '',
    axis: draft.lensDetails.find((item) => item.eye === 'left')?.axis ?? '',
  });
  const [customerName, setCustomerName] = useState(draft.customerName);
  const [mobileNumber, setMobileNumber] = useState(draft.phone);
  const [email, setEmail] = useState(user?.email ?? '');
  const [address, setAddress] = useState(draft.billingAddress);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  const activeOptions = useMemo(() => {
    if (selector.field === 'axis') {
      return AXIS_VALUES;
    }

    if (selector.field === 'cyl') {
      return CYL_VALUES;
    }

    return SPH_VALUES;
  }, [selector.field]);

  const currentValue = selector.eye === 'right'
    ? rightEye[selector.field]
    : leftEye[selector.field];

  const updateEyeValue = (eye: EyeKey, field: EyeField, value: string) => {
    if (eye === 'right') {
      const nextRight = { ...rightEye, [field]: value };
      setRightEye(nextRight);

      if (samePower) {
        setLeftEye((current) => ({
          ...current,
          [field]: value,
        }));
      }

      return;
    }

    setLeftEye((current) => ({
      ...current,
      [field]: value,
    }));
  };

  const toggleSamePower = () => {
    const nextValue = !samePower;
    setSamePower(nextValue);

    if (nextValue) {
      setLeftEye((current) => ({
        ...current,
        sph: rightEye.sph,
        cyl: hasCylindricalPower ? rightEye.cyl : current.cyl,
        axis: hasCylindricalPower ? rightEye.axis : current.axis,
      }));
    }
  };

  const toggleCylindricalPower = () => {
    const nextValue = !hasCylindricalPower;
    setHasCylindricalPower(nextValue);

    if (!nextValue) {
      setRightEye((current) => ({ ...current, cyl: '', axis: '' }));
      setLeftEye((current) => ({ ...current, cyl: '', axis: '' }));
    } else if (samePower) {
      setLeftEye((current) => ({
        ...current,
        cyl: rightEye.cyl,
        axis: rightEye.axis,
      }));
    }
  };

  const handleSave = async () => {
    setError('');

    if (!rightEye.sph && !leftEye.sph) {
      setError('Please select at least one spherical power value.');
      return;
    }

    if (isOrderFlow) {
      updateLensDetail('lens-right', {
        label: draft.lensSelection.powerType || 'Distance Vision',
        sph: rightEye.sph,
        cyl: hasCylindricalPower ? rightEye.cyl : '',
        axis: hasCylindricalPower ? rightEye.axis : '',
        add: rightEye.sph,
      });
      updateLensDetail('lens-left', {
        label: draft.lensSelection.powerType || 'Distance Vision',
        sph: samePower ? rightEye.sph : leftEye.sph,
        cyl: hasCylindricalPower ? (samePower ? rightEye.cyl : leftEye.cyl) : '',
        axis: hasCylindricalPower ? (samePower ? rightEye.axis : leftEye.axis) : '',
        add: samePower ? rightEye.sph : leftEye.sph,
      });
      router.push(resolvedNextPath);
      return;
    }

    if (!customerName.trim()) {
      setError('Please enter customer name.');
      return;
    }

    if (!mobileNumber.trim() || mobileNumber.trim().length < 10) {
      setError('Please enter a valid mobile number.');
      return;
    }

    setSaving(true);

    try {
      await savePrescription(user?.id ?? 'guest-eye-test', {
        notes: [
          `Customer: ${customerName.trim()}`,
          `Mobile: ${mobileNumber.trim()}`,
          email.trim() ? `Email: ${email.trim()}` : '',
          address.trim() ? `Address: ${address.trim()}` : '',
        ].filter(Boolean).join(' | '),
        order_id: undefined,
        right_eye_sph: rightEye.sph ? parseFloat(rightEye.sph) : null,
        right_eye_cyl: hasCylindricalPower && rightEye.cyl ? parseFloat(rightEye.cyl) : null,
        right_eye_axis: hasCylindricalPower && rightEye.axis ? parseInt(rightEye.axis, 10) : null,
        left_eye_sph: leftEye.sph ? parseFloat(leftEye.sph) : null,
        left_eye_cyl: hasCylindricalPower && leftEye.cyl ? parseFloat(leftEye.cyl) : null,
        left_eye_axis: hasCylindricalPower && leftEye.axis ? parseInt(leftEye.axis, 10) : null,
      });

      setSaved(true);
    } catch (_error) {
      setError('Failed to save prescription.');
    } finally {
      setSaving(false);
    }
  };

  if (saved) {
    return (
      <View style={styles.successContainer}>
        <View style={styles.successCard}>
          <View style={styles.successIcon}>
            <CheckCircle size={58} color={Colors.primary} />
          </View>
          <Text style={styles.successTitle}>Eye Test Saved</Text>
          <Text style={styles.successText}>
            The prescription and customer details have been saved successfully.
          </Text>
          <TouchableOpacity style={styles.doneBtn} activeOpacity={0.88} onPress={() => router.back()}>
            <Text style={styles.doneBtnText}>Done</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 20 : 0}
    >
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} activeOpacity={0.86}>
          <ArrowLeft size={18} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{isOrderFlow ? 'Power Selection' : 'Eye Test'}</Text>
      </View>

      <ScrollView
        contentContainerStyle={styles.body}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode={Platform.OS === 'ios' ? 'interactive' : 'on-drag'}
      >
        <View style={styles.canvas}>
          <View style={styles.prescriptionCard}>
            <View style={styles.cardHeader}>
              <FileText size={16} color={Colors.primary} />
              <Text style={styles.cardTitle}>Select your prescription values</Text>
            </View>

            <CheckOption
              label="I have same power in both eyes"
              active={samePower}
              onPress={toggleSamePower}
            />
            <CheckOption
              label="I have cylindrical power"
              active={hasCylindricalPower}
              onPress={toggleCylindricalPower}
            />

            <View style={styles.rxHeaderRow}>
              <Text style={styles.rxHeaderLabel}>Rx</Text>
              <View style={styles.rxEyeHeadings}>
                <Text style={styles.eyeHeading}>RIGHT</Text>
                <Text style={styles.eyeHeading}>LEFT</Text>
              </View>
            </View>

            <SelectorRow
              label="Spherical"
              rightValue={rightEye.sph}
              leftValue={samePower ? rightEye.sph : leftEye.sph}
              onRightPress={() => setSelector({ open: true, eye: 'right', field: 'sph' })}
              onLeftPress={() => setSelector({ open: true, eye: 'left', field: 'sph' })}
              leftDisabled={samePower}
            />

            {hasCylindricalPower ? (
              <>
                <SelectorRow
                  label="Cylindrical"
                  rightValue={rightEye.cyl}
                  leftValue={samePower ? rightEye.cyl : leftEye.cyl}
                  onRightPress={() => setSelector({ open: true, eye: 'right', field: 'cyl' })}
                  onLeftPress={() => setSelector({ open: true, eye: 'left', field: 'cyl' })}
                  leftDisabled={samePower}
                />
                <SelectorRow
                  label="Axis"
                  rightValue={rightEye.axis}
                  leftValue={samePower ? rightEye.axis : leftEye.axis}
                  onRightPress={() => setSelector({ open: true, eye: 'right', field: 'axis' })}
                  onLeftPress={() => setSelector({ open: true, eye: 'left', field: 'axis' })}
                  leftDisabled={samePower}
                />
              </>
            ) : null}
          </View>

          {!isOrderFlow ? <Text style={styles.sectionTitle}>Customer Details</Text> : null}

          {error ? (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          {!isOrderFlow ? (
            <>
              <View style={[styles.formGrid, isCompact && styles.formGridCompact]}>
                <TextInput
                  value={customerName}
                  onChangeText={setCustomerName}
                  placeholder="Name"
                  placeholderTextColor={Colors.gray400}
                  style={[styles.input, styles.flexField]}
                />
                <TextInput
                  value={mobileNumber}
                  onChangeText={(value) => setMobileNumber(value.replace(/[^0-9]/g, '').slice(0, 10))}
                  placeholder="Mobile Number"
                  placeholderTextColor={Colors.gray400}
                  keyboardType="phone-pad"
                  style={[styles.input, styles.flexField]}
                />
                <TextInput
                  value={email}
                  onChangeText={setEmail}
                  placeholder="Email"
                  placeholderTextColor={Colors.gray400}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  style={[styles.input, styles.flexField]}
                />
              </View>

              <TextInput
                value={address}
                onChangeText={setAddress}
                placeholder="Address"
                placeholderTextColor={Colors.gray400}
                style={[styles.input, styles.addressInput]}
              />
            </>
          ) : null}

          <TouchableOpacity
            style={[styles.saveBtn, saving && styles.saveBtnDisabled]}
            activeOpacity={0.88}
            onPress={handleSave}
            disabled={saving}
          >
            <Text style={styles.saveBtnText}>
              {saving ? 'Saving...' : isOrderFlow ? 'Continue' : 'Save'}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      <Modal
        visible={selector.open}
        transparent
        animationType="fade"
        onRequestClose={() => setSelector((current) => ({ ...current, open: false }))}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.selectorModal}>
            <View style={styles.selectorHeader}>
              <Text style={styles.selectorTitle}>
                {getFieldLabel(selector.field)} | {selector.eye === 'right' ? 'Right Eye' : 'Left Eye'}
              </Text>
              <TouchableOpacity
                onPress={() => setSelector((current) => ({ ...current, open: false }))}
                activeOpacity={0.86}
              >
                <X size={16} color={Colors.gray500} />
              </TouchableOpacity>
            </View>

            <View style={styles.selectorLegend}>
              <Text style={styles.selectorLegendText}>
                {selector.field === 'axis' ? 'Axis Values' : '(+)Positive'}
              </Text>
              <Text style={styles.selectorLegendText}>
                {selector.field === 'axis' ? 'Select Value' : '(-)Negative'}
              </Text>
            </View>

            <ScrollView style={styles.selectorList} showsVerticalScrollIndicator={false}>
              {groupOptions(activeOptions, selector.field === 'axis' ? 2 : 2).map((row, index) => (
                <View key={`${row.join('-')}-${index}`} style={styles.optionRow}>
                  {row.map((option) => {
                    const selected = currentValue === option;

                    return (
                      <TouchableOpacity
                        key={option}
                      style={styles.optionCell}
                      activeOpacity={0.86}
                      onPress={() => {
                        updateEyeValue(selector.eye, selector.field, option);
                      }}
                    >
                      <View style={[styles.optionRadio, selected && styles.optionRadioActive]} />
                      <Text style={[styles.optionText, selected && styles.optionTextActive]}>{option}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            ))}
            </ScrollView>

            <View style={styles.selectorFooter}>
              <TouchableOpacity
                style={styles.selectorDoneButton}
                activeOpacity={0.88}
                onPress={() => setSelector((current) => ({ ...current, open: false }))}
              >
                <Text style={styles.selectorDoneText}>Done</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
}

function CheckOption({
  label,
  active,
  onPress,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity style={styles.checkOption} onPress={onPress} activeOpacity={0.86}>
      <View style={[styles.checkbox, active && styles.checkboxActive]}>
        {active ? <View style={styles.checkboxInner} /> : null}
      </View>
      <Text style={styles.checkLabel}>{label}</Text>
    </TouchableOpacity>
  );
}

function SelectorRow({
  label,
  rightValue,
  leftValue,
  onRightPress,
  onLeftPress,
  leftDisabled = false,
}: {
  label: string;
  rightValue: string;
  leftValue: string;
  onRightPress: () => void;
  onLeftPress: () => void;
  leftDisabled?: boolean;
}) {
  return (
    <View style={styles.selectorRow}>
      <Text style={styles.selectorRowLabel}>{label}</Text>
      <View style={styles.selectorButtons}>
        <SelectTrigger value={rightValue} onPress={onRightPress} />
        <SelectTrigger value={leftValue} onPress={onLeftPress} disabled={leftDisabled} />
      </View>
    </View>
  );
}

function SelectTrigger({
  value,
  onPress,
  disabled = false,
}: {
  value: string;
  onPress: () => void;
  disabled?: boolean;
}) {
  return (
    <TouchableOpacity
      style={[styles.selectTrigger, disabled && styles.selectTriggerDisabled]}
      activeOpacity={0.86}
      onPress={onPress}
      disabled={disabled}
    >
      <Text style={[styles.selectTriggerText, !value && styles.selectTriggerPlaceholder]}>
        {value || 'Select'}
      </Text>
      <ChevronDown size={14} color={Colors.gray500} />
    </TouchableOpacity>
  );
}

function getFieldLabel(field: EyeField) {
  if (field === 'cyl') {
    return 'Cylindrical';
  }

  if (field === 'axis') {
    return 'Axis';
  }

  return 'Spherical';
}

function buildPowerOptions() {
  const values = ['0.00'];

  for (let step = 0.25; step <= 6; step += 0.25) {
    values.push(`+${step.toFixed(2)}`);
    values.push(`-${step.toFixed(2)}`);
  }

  return values;
}

function groupOptions(options: string[], size: number) {
  const rows: string[][] = [];

  for (let index = 0; index < options.length; index += size) {
    rows.push(options.slice(index, index + size));
  }

  return rows;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F4F5FA',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    paddingTop: Platform.OS === 'ios' ? 50 : 34,
    paddingBottom: 12,
    paddingHorizontal: 18,
    borderBottomWidth: 1,
    borderBottomColor: '#E9EBF2',
  },
  backBtn: {
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '500',
    color: Colors.text,
  },
  body: {
    flexGrow: 1,
    padding: 22,
    paddingBottom: 56,
  },
  canvas: {
    backgroundColor: '#F8F8FD',
    borderRadius: 22,
    padding: 22,
    ...Shadow.sm,
  },
  prescriptionCard: {
    backgroundColor: Colors.white,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E7EAF2',
    overflow: 'hidden',
  },
  cardHeader: {
    minHeight: 38,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#EEF1F5',
  },
  cardTitle: {
    marginLeft: 8,
    fontSize: 14,
    fontWeight: '500',
    color: '#1F2430',
  },
  checkOption: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
    marginHorizontal: 12,
  },
  checkbox: {
    width: 14,
    height: 14,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#CFD5E2',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.white,
  },
  checkboxActive: {
    borderColor: Colors.primary,
    backgroundColor: '#EAF2FF',
  },
  checkboxInner: {
    width: 6,
    height: 6,
    borderRadius: 999,
    backgroundColor: Colors.primary,
  },
  checkLabel: {
    marginLeft: 8,
    fontSize: 13,
    color: '#313744',
  },
  rxHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 16,
    marginHorizontal: 16,
  },
  rxHeaderLabel: {
    fontSize: 13.5,
    color: '#8D94A3',
  },
  rxEyeHeadings: {
    width: 220,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  eyeHeading: {
    width: 102,
    textAlign: 'center',
    fontSize: 12.5,
    color: '#8D94A3',
  },
  selectorRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
    marginHorizontal: 16,
    marginBottom: 4,
  },
  selectorRowLabel: {
    fontSize: 14.5,
    fontWeight: '500',
    color: '#2D3441',
  },
  selectorButtons: {
    width: 220,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  selectTrigger: {
    width: 102,
    minHeight: 38,
    borderRadius: 10,
    backgroundColor: '#F5F6F8',
    borderWidth: 1,
    borderColor: '#E4E7EE',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
  },
  selectTriggerDisabled: {
    opacity: 0.55,
  },
  selectTriggerText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#2D3441',
  },
  selectTriggerPlaceholder: {
    color: '#6F7684',
  },
  sectionTitle: {
    marginTop: 18,
    marginBottom: 10,
    fontSize: 17,
    fontWeight: '500',
    color: '#1F2430',
  },
  errorBox: {
    backgroundColor: '#FFF1F2',
    borderWidth: 1,
    borderColor: '#FFD7DC',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 12,
  },
  errorText: {
    fontSize: 12.5,
    color: Colors.error,
  },
  formGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  formGridCompact: {
    flexDirection: 'column',
  },
  flexField: {
    flex: 1,
  },
  input: {
    minHeight: 36,
    backgroundColor: Colors.white,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E4E7EE',
    paddingHorizontal: 12,
    fontSize: 13,
    color: '#1F2430',
    ...Shadow.sm,
  },
  addressInput: {
    marginTop: 12,
  },
  saveBtn: {
    width: 228,
    maxWidth: '100%',
    minHeight: 36,
    borderRadius: 8,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
  },
  saveBtnDisabled: {
    opacity: 0.65,
  },
  saveBtnText: {
    color: Colors.white,
    fontSize: 14,
    fontWeight: '700',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(17, 24, 39, 0.18)',
    alignItems: 'flex-end',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  selectorModal: {
    width: 218,
    maxHeight: 420,
    backgroundColor: Colors.white,
    borderRadius: 14,
    overflow: 'hidden',
    ...Shadow.lg,
  },
  selectorHeader: {
    minHeight: 46,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#EEF1F5',
  },
  selectorTitle: {
    fontSize: 11.5,
    fontWeight: '600',
    color: '#263042',
  },
  selectorLegend: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#F7F8FD',
  },
  selectorLegendText: {
    fontSize: 10,
    color: '#8A91A1',
  },
  selectorList: {
    maxHeight: 320,
  },
  selectorFooter: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: '#EEF1F5',
    backgroundColor: Colors.white,
  },
  selectorDoneButton: {
    minHeight: 36,
    borderRadius: 10,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectorDoneText: {
    color: Colors.white,
    fontSize: 13,
    fontWeight: '700',
  },
  optionRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F3F7',
  },
  optionCell: {
    flex: 1,
    minHeight: 28,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRightWidth: 1,
    borderRightColor: '#F1F3F7',
  },
  optionRadio: {
    width: 8,
    height: 8,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#D3D8E3',
    marginRight: 8,
  },
  optionRadioActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  optionText: {
    fontSize: 12,
    color: '#455066',
    fontWeight: '600',
  },
  optionTextActive: {
    color: Colors.primary,
  },
  successContainer: {
    flex: 1,
    backgroundColor: Colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  successCard: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: Colors.white,
    borderRadius: 22,
    padding: 24,
    alignItems: 'center',
    ...Shadow.lg,
  },
  successIcon: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: '#E9F2FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  successTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: Colors.text,
    marginBottom: 8,
  },
  successText: {
    fontSize: 14,
    lineHeight: 21,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: 20,
  },
  doneBtn: {
    width: '100%',
    minHeight: 46,
    borderRadius: 10,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  doneBtnText: {
    color: Colors.white,
    fontSize: 15,
    fontWeight: '700',
  },
});
