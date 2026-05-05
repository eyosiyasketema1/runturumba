import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Switch,
  Modal,
  Pressable,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import {
  ArrowLeft,
  Mail,
  Phone,
  Building2,
  Globe,
  Bell,
  LogOut,
  ChevronRight,
  Shield,
  HelpCircle,
} from 'lucide-react-native';
import { useTheme } from '@/hooks/use-theme';

// ─── Mentor Profile Data ──────────────────────────────────────────────────

const MENTOR_PROFILE = {
  name: 'Samson Usmael',
  initials: 'SU',
  color: '#2563eb',
  role: 'Digital Mentor',
  email: 'samson.usmael@gcmethiopia.org',
  phone: '+251 91 456 7890',
  organization: 'GCM Ethiopia',
  language: 'English',
  location: 'Addis Ababa, Ethiopia',
  joinedDate: 'Sep 2024',
  stats: {
    totalSeekers: 12,
    activeSeekers: 8,
    avgEngagement: 78,
    completionRate: 67,
  },
};

export default function ProfileScreen() {
  const colors = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [pushNotifications, setPushNotifications] = useState(true);
  const [messageAlerts, setMessageAlerts] = useState(true);
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  const profile = MENTOR_PROFILE;

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 8, borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()} activeOpacity={0.7} style={styles.backBtn}>
          <ArrowLeft size={22} color={colors.foreground} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>Profile</Text>
        <View style={{ width: 30 }} />
      </View>

      <ScrollView
        contentContainerStyle={{ paddingBottom: insets.bottom + 40 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Identity Block */}
        <View style={styles.identityBlock}>
          <View style={[styles.avatar, { backgroundColor: profile.color }]}>
            <Text style={styles.avatarText}>{profile.initials}</Text>
          </View>
          <Text style={[styles.name, { color: colors.foreground }]}>{profile.name}</Text>
          <Text style={[styles.role, { color: colors.mutedForeground }]}>{profile.role}</Text>
          <View style={[styles.orgBadge, { backgroundColor: colors.secondary }]}>
            <Building2 size={12} color={colors.mutedForeground} />
            <Text style={[styles.orgText, { color: colors.foreground }]}>{profile.organization}</Text>
          </View>
        </View>


        {/* Contact Details */}
        <View style={styles.section}>
          <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>CONTACT</Text>
          <View style={[styles.card, { borderColor: colors.border }]}>
            {[
              { icon: Mail, label: 'Email', value: profile.email },
              { icon: Phone, label: 'Phone', value: profile.phone },
              { icon: Globe, label: 'Language', value: profile.language },
            ].map((item, i) => {
              const Icon = item.icon;
              return (
                <View
                  key={item.label}
                  style={[styles.contactRow, i > 0 && { borderTopWidth: 0.5, borderTopColor: colors.border }]}
                >
                  <Icon size={16} color={colors.mutedForeground} />
                  <View style={styles.contactContent}>
                    <Text style={[styles.contactLabel, { color: colors.mutedForeground }]}>{item.label}</Text>
                    <Text style={[styles.contactValue, { color: colors.foreground }]}>{item.value}</Text>
                  </View>
                </View>
              );
            })}
          </View>
        </View>

        {/* Settings */}
        <View style={styles.section}>
          <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>SETTINGS</Text>
          <View style={[styles.card, { borderColor: colors.border }]}>
            <View style={styles.settingRow}>
              <Bell size={16} color={colors.mutedForeground} />
              <Text style={[styles.settingLabel, { color: colors.foreground }]}>Push Notifications</Text>
              <Switch
                value={pushNotifications}
                onValueChange={setPushNotifications}
                trackColor={{ false: colors.border, true: colors.primary + '60' }}
                thumbColor={pushNotifications ? colors.primary : '#f4f3f4'}
              />
            </View>
            <View style={[styles.settingRow, { borderTopWidth: 0.5, borderTopColor: colors.border }]}>
              <Mail size={16} color={colors.mutedForeground} />
              <Text style={[styles.settingLabel, { color: colors.foreground }]}>Message Alerts</Text>
              <Switch
                value={messageAlerts}
                onValueChange={setMessageAlerts}
                trackColor={{ false: colors.border, true: colors.primary + '60' }}
                thumbColor={messageAlerts ? colors.primary : '#f4f3f4'}
              />
            </View>
          </View>
        </View>

        {/* More */}
        <View style={styles.section}>
          <View style={[styles.card, { borderColor: colors.border }]}>
            <TouchableOpacity style={styles.menuRow} activeOpacity={0.6} onPress={() => router.push('/privacy' as any)}>
              <Shield size={16} color={colors.mutedForeground} />
              <Text style={[styles.menuLabel, { color: colors.foreground }]}>Privacy & Security</Text>
              <ChevronRight size={16} color={colors.mutedForeground} />
            </TouchableOpacity>
            <TouchableOpacity style={[styles.menuRow, { borderTopWidth: 0.5, borderTopColor: colors.border }]} activeOpacity={0.6} onPress={() => router.push('/help' as any)}>
              <HelpCircle size={16} color={colors.mutedForeground} />
              <Text style={[styles.menuLabel, { color: colors.foreground }]}>Help & Support</Text>
              <ChevronRight size={16} color={colors.mutedForeground} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Logout */}
        <View style={styles.section}>
          <TouchableOpacity
            style={[styles.logoutBtn, { borderColor: '#ef4444' + '30' }]}
            activeOpacity={0.7}
            onPress={() => setShowLogoutModal(true)}
          >
            <LogOut size={16} color="#ef4444" />
            <Text style={styles.logoutText}>Log Out</Text>
          </TouchableOpacity>
        </View>

        {/* Version */}
        <Text style={[styles.version, { color: colors.mutedForeground }]}>
          Turumba v2.3.1 · Joined {profile.joinedDate}
        </Text>
      </ScrollView>

      {/* Logout Confirmation Modal */}
      <Modal visible={showLogoutModal} transparent animationType="fade" onRequestClose={() => setShowLogoutModal(false)}>
        <Pressable style={styles.modalOverlay} onPress={() => setShowLogoutModal(false)}>
          <View style={[styles.modalCard, { backgroundColor: colors.card }]} onStartShouldSetResponder={() => true}>
            <View style={styles.modalIconWrap}>
              <LogOut size={22} color="#ef4444" />
            </View>
            <Text style={[styles.modalTitle, { color: colors.foreground }]}>Log Out</Text>
            <Text style={[styles.modalDesc, { color: colors.mutedForeground }]}>
              Are you sure you want to log out of your account?
            </Text>
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalBtn, { backgroundColor: colors.secondary }]}
                activeOpacity={0.7}
                onPress={() => setShowLogoutModal(false)}
              >
                <Text style={[styles.modalBtnText, { color: colors.foreground }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalBtn, { backgroundColor: '#ef4444' }]}
                activeOpacity={0.7}
                onPress={() => {
                  setShowLogoutModal(false);
                  router.replace('/login');
                }}
              >
                <Text style={[styles.modalBtnText, { color: '#fff' }]}>Log Out</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },

  // Header
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

  // Identity
  identityBlock: {
    alignItems: 'center',
    paddingTop: 28,
    paddingBottom: 8,
    paddingHorizontal: 20,
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 14,
  },
  avatarText: {
    fontFamily: 'DMSans_700Bold',
    fontSize: 24,
    color: '#fff',
  },
  name: {
    fontFamily: 'DMSans_700Bold',
    fontSize: 22,
    letterSpacing: -0.3,
    marginBottom: 4,
  },
  role: {
    fontFamily: 'DMSans_500Medium',
    fontSize: 14,
    marginBottom: 10,
  },
  orgBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 9999,
  },
  orgText: {
    fontFamily: 'DMSans_600SemiBold',
    fontSize: 12,
  },


  // Sections
  section: { paddingHorizontal: 20, marginTop: 24 },
  sectionLabel: {
    fontFamily: 'DMSans_700Bold',
    fontSize: 11,
    letterSpacing: 1,
    marginBottom: 10,
  },

  // Card
  card: {
    borderRadius: 14,
    borderWidth: 0.5,
    overflow: 'hidden',
  },

  // Contact rows
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  contactContent: { flex: 1, gap: 1 },
  contactLabel: { fontFamily: 'DMSans_500Medium', fontSize: 11 },
  contactValue: { fontFamily: 'DMSans_600SemiBold', fontSize: 14 },

  // Settings
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  settingLabel: {
    fontFamily: 'DMSans_600SemiBold',
    fontSize: 14,
    flex: 1,
  },

  // Menu rows
  menuRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  menuLabel: {
    fontFamily: 'DMSans_600SemiBold',
    fontSize: 14,
    flex: 1,
  },

  // Logout
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 1,
  },
  logoutText: {
    fontFamily: 'DMSans_700Bold',
    fontSize: 14,
    color: '#ef4444',
  },

  // Version
  version: {
    fontFamily: 'DMSans_500Medium',
    fontSize: 11,
    textAlign: 'center',
    marginTop: 20,
  },

  // Logout Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  modalCard: {
    width: '100%',
    maxWidth: 300,
    borderRadius: 20,
    padding: 28,
    alignItems: 'center',
  },
  modalIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#fef2f2',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontFamily: 'DMSans_700Bold',
    fontSize: 18,
    marginBottom: 8,
  },
  modalDesc: {
    fontFamily: 'DMSans_500Medium',
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  modalBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 9999,
    alignItems: 'center',
  },
  modalBtnText: {
    fontFamily: 'DMSans_700Bold',
    fontSize: 14,
  },
});
