import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Switch,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import {
  ArrowLeft,
  Shield,
  Lock,
  Eye,
  Fingerprint,
  Smartphone,
  Trash2,
} from 'lucide-react-native';
import { useTheme } from '@/hooks/use-theme';

export default function PrivacyScreen() {
  const colors = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const [biometricLock, setBiometricLock] = useState(false);
  const [readReceipts, setReadReceipts] = useState(true);
  const [onlineStatus, setOnlineStatus] = useState(true);
  const [dataSharing, setDataSharing] = useState(false);

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 8, borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()} activeOpacity={0.7} style={styles.backBtn}>
          <ArrowLeft size={22} color={colors.foreground} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>Privacy & Security</Text>
        <View style={{ width: 30 }} />
      </View>

      <ScrollView
        contentContainerStyle={{ paddingBottom: insets.bottom + 40 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Security Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>SECURITY</Text>
          <View style={[styles.card, { borderColor: colors.border }]}>
            <View style={styles.settingRow}>
              <Fingerprint size={16} color={colors.mutedForeground} />
              <View style={styles.settingContent}>
                <Text style={[styles.settingLabel, { color: colors.foreground }]}>Biometric Lock</Text>
                <Text style={[styles.settingDesc, { color: colors.mutedForeground }]}>Require Face ID or fingerprint to open app</Text>
              </View>
              <Switch
                value={biometricLock}
                onValueChange={setBiometricLock}
                trackColor={{ false: colors.border, true: colors.primary + '60' }}
                thumbColor={biometricLock ? colors.primary : '#f4f3f4'}
              />
            </View>
            <TouchableOpacity style={[styles.settingRow, { borderTopWidth: 0.5, borderTopColor: colors.border }]} activeOpacity={0.6}>
              <Lock size={16} color={colors.mutedForeground} />
              <View style={styles.settingContent}>
                <Text style={[styles.settingLabel, { color: colors.foreground }]}>Change Password</Text>
                <Text style={[styles.settingDesc, { color: colors.mutedForeground }]}>Update your account password</Text>
              </View>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.settingRow, { borderTopWidth: 0.5, borderTopColor: colors.border }]} activeOpacity={0.6}>
              <Smartphone size={16} color={colors.mutedForeground} />
              <View style={styles.settingContent}>
                <Text style={[styles.settingLabel, { color: colors.foreground }]}>Active Sessions</Text>
                <Text style={[styles.settingDesc, { color: colors.mutedForeground }]}>Manage devices logged into your account</Text>
              </View>
            </TouchableOpacity>
          </View>
        </View>

        {/* Privacy Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>PRIVACY</Text>
          <View style={[styles.card, { borderColor: colors.border }]}>
            <View style={styles.settingRow}>
              <Eye size={16} color={colors.mutedForeground} />
              <View style={styles.settingContent}>
                <Text style={[styles.settingLabel, { color: colors.foreground }]}>Read Receipts</Text>
                <Text style={[styles.settingDesc, { color: colors.mutedForeground }]}>Let seekers know when you've read their messages</Text>
              </View>
              <Switch
                value={readReceipts}
                onValueChange={setReadReceipts}
                trackColor={{ false: colors.border, true: colors.primary + '60' }}
                thumbColor={readReceipts ? colors.primary : '#f4f3f4'}
              />
            </View>
            <View style={[styles.settingRow, { borderTopWidth: 0.5, borderTopColor: colors.border }]}>
              <Shield size={16} color={colors.mutedForeground} />
              <View style={styles.settingContent}>
                <Text style={[styles.settingLabel, { color: colors.foreground }]}>Online Status</Text>
                <Text style={[styles.settingDesc, { color: colors.mutedForeground }]}>Show when you're active to seekers</Text>
              </View>
              <Switch
                value={onlineStatus}
                onValueChange={setOnlineStatus}
                trackColor={{ false: colors.border, true: colors.primary + '60' }}
                thumbColor={onlineStatus ? colors.primary : '#f4f3f4'}
              />
            </View>
          </View>
        </View>

        {/* Data Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>DATA</Text>
          <View style={[styles.card, { borderColor: colors.border }]}>
            <View style={styles.settingRow}>
              <Shield size={16} color={colors.mutedForeground} />
              <View style={styles.settingContent}>
                <Text style={[styles.settingLabel, { color: colors.foreground }]}>Analytics Sharing</Text>
                <Text style={[styles.settingDesc, { color: colors.mutedForeground }]}>Share anonymous usage data to improve Turumba</Text>
              </View>
              <Switch
                value={dataSharing}
                onValueChange={setDataSharing}
                trackColor={{ false: colors.border, true: colors.primary + '60' }}
                thumbColor={dataSharing ? colors.primary : '#f4f3f4'}
              />
            </View>
            <TouchableOpacity style={[styles.settingRow, { borderTopWidth: 0.5, borderTopColor: colors.border }]} activeOpacity={0.6}>
              <Trash2 size={16} color="#ef4444" />
              <View style={styles.settingContent}>
                <Text style={[styles.settingLabel, { color: '#ef4444' }]}>Delete Account</Text>
                <Text style={[styles.settingDesc, { color: colors.mutedForeground }]}>Permanently delete your account and all data</Text>
              </View>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 10,
    borderBottomWidth: 0.5,
  },
  backBtn: { padding: 4 },
  headerTitle: {
    fontFamily: 'DMSans_700Bold',
    fontSize: 17,
    flex: 1,
    textAlign: 'center',
  },
  section: { paddingHorizontal: 20, marginTop: 24 },
  sectionLabel: {
    fontFamily: 'DMSans_700Bold',
    fontSize: 11,
    letterSpacing: 1,
    marginBottom: 10,
  },
  card: {
    borderRadius: 14,
    borderWidth: 0.5,
    overflow: 'hidden',
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  settingContent: { flex: 1, gap: 2 },
  settingLabel: {
    fontFamily: 'DMSans_600SemiBold',
    fontSize: 14,
  },
  settingDesc: {
    fontFamily: 'DMSans_500Medium',
    fontSize: 12,
  },
});
