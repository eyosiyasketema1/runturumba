import React, { useState, useRef, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Platform,
  Modal,
  Pressable,
  LayoutAnimation,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Users,
  UserCheck,
  TrendingUp,
  CheckCircle,
  MessageCircle,
  Bell,
  ChevronRight,
  Flame,
  Star,
  Heart,
  User,
  X,
  RefreshCw,
  BookOpen,
  AlertCircle,
} from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '@/hooks/use-theme';
import { Radius, Spacing } from '@/constants/theme';
import { TurumbaLogo } from '@/components/turumba-logo';

// Sample data
const METRICS = [
  { label: 'Active Seekers', value: '12', icon: Users, color: '#2563eb', trend: '+2', trendUp: true },
  { label: 'Completion Rate', value: '67%', icon: CheckCircle, color: '#10b981', trend: '+5%', trendUp: true },
  { label: 'Engagement', value: '78', icon: TrendingUp, color: '#8b5cf6', trend: '+3', trendUp: true },
  { label: 'Pending Actions', value: '4', icon: UserCheck, color: '#f59e0b', trend: '-1', trendUp: false },
];

const ACTIVITY = [
  { id: '1', icon: TrendingUp, color: '#2563eb', bgColor: '#eff6ff', title: 'Sarah progressed to Lesson 4 of Foundations of Faith', time: '2 min ago', route: '/seeker/1?tab=journey' },
  { id: '2', icon: Flame, color: '#f59e0b', bgColor: '#fffbeb', title: "Daniel's engagement score rose to 72%", time: '30 min ago', route: '/seeker/2?tab=ai' },
  { id: '3', icon: CheckCircle, color: '#10b981', bgColor: '#ecfdf5', title: 'Maria completed Lesson 8 of Bible 101', time: '1 hour ago', route: '/seeker/3?tab=journey' },
  { id: '4', icon: BookOpen, color: '#8b5cf6', bgColor: '#f5f3ff', title: 'James enrolled in Foundations of Faith journey', time: '2 hours ago', route: '/seeker/4?tab=journey' },
  { id: '5', icon: Users, color: '#06b6d4', bgColor: '#ecfeff', title: 'David joined the Youth Seekers group', time: '5 hours ago', route: '/seeker/6?tab=profile' },
  { id: '6', icon: Star, color: '#10b981', bgColor: '#ecfdf5', title: 'Abebe finished all 10 lessons in Bible 101', time: '1 day ago', route: '/seeker/7?tab=milestones' },
  { id: '7', icon: TrendingUp, color: '#10b981', bgColor: '#ecfdf5', title: "Rachel's sentiment shifted from Neutral to Positive", time: '1 day ago', route: '/seeker/5?tab=ai' },
  { id: '8', icon: CheckCircle, color: '#2563eb', bgColor: '#eff6ff', title: 'Sarah completed First Prayer milestone', time: '1 day ago', route: '/seeker/1?tab=milestones' },
  { id: '9', icon: Flame, color: '#f59e0b', bgColor: '#fffbeb', title: "Fatima's dropout risk decreased to Low", time: '2 days ago', route: '/seeker/8?tab=ai' },
  { id: '10', icon: BookOpen, color: '#8b5cf6', bgColor: '#f5f3ff', title: 'Daniel started Lesson 2 of Prayer Basics', time: '2 days ago', route: '/seeker/2?tab=journey' },
  { id: '11', icon: Users, color: '#06b6d4', bgColor: '#ecfeff', title: 'Sarah added to Women of Faith group', time: '3 days ago', route: '/seeker/1?tab=profile' },
  { id: '12', icon: TrendingUp, color: '#10b981', bgColor: '#ecfdf5', title: "Maria's engagement score hit 91% — highest this month", time: '3 days ago', route: '/seeker/3?tab=ai' },
];

// ─── Notification Data ─────────────────────────────────────────────────────

type NotifType = 'message' | 'milestone' | 'assignment' | 'journey' | 'system' | 'prayer';

interface Notification {
  id: string;
  type: NotifType;
  title: string;
  body: string;
  time: string;
  read: boolean;
  route: string | null;
}

const NOTIFICATIONS: Notification[] = [
  { id: '1', type: 'message', title: 'New message from Sarah Johnson', body: 'Thank you for the prayer guide! I have a question about...', time: '2m ago', read: false, route: '/chat/1' },
  { id: '2', type: 'milestone', title: 'Milestone reached', body: 'James Wilson accepted Christ — congratulations!', time: '30m ago', read: false, route: '/seeker/4?tab=milestones' },
  { id: '3', type: 'assignment', title: 'New seeker assigned', body: 'Daniel Mekonnen has been matched to you as a mentor', time: '1h ago', read: false, route: '/seeker/2?tab=profile' },
  { id: '4', type: 'message', title: 'New message from Daniel Mekonnen', body: 'I finished reading the chapter you assigned', time: '1h ago', read: false, route: '/chat/2' },
  { id: '5', type: 'journey', title: 'Journey completed', body: 'Abebe Tadesse finished Bible 101 — all 10 lessons done', time: '2h ago', read: true, route: '/seeker/7?tab=journey' },
  { id: '6', type: 'prayer', title: 'Prayer request', body: 'Rachel Thompson asked for prayer for her family situation', time: '3h ago', read: true, route: '/seeker/6?tab=notes' },
  { id: '7', type: 'system', title: 'Weekly report ready', body: 'Your seeker engagement summary for this week is available', time: '5h ago', read: true, route: null },
  { id: '8', type: 'milestone', title: 'Milestone reached', body: 'Sarah Johnson completed First Prayer milestone', time: '6h ago', read: true, route: '/seeker/1?tab=milestones' },
  { id: '9', type: 'assignment', title: 'Mentor reassignment', body: 'Fatima Ali has been reassigned to your care', time: '1d ago', read: true, route: '/seeker/8?tab=profile' },
  { id: '10', type: 'prayer', title: 'Prayer request', body: 'Sarah Johnson — guidance in understanding Scripture', time: '1d ago', read: true, route: '/seeker/1?tab=notes' },
  { id: '11', type: 'journey', title: 'Journey started', body: 'James Wilson began Foundations of Faith', time: '2d ago', read: true, route: '/seeker/4?tab=journey' },
  { id: '12', type: 'system', title: 'App update available', body: 'Turumba v2.4 is ready with new journey templates', time: '3d ago', read: true, route: null },
];

const NOTIF_ICONS: Record<NotifType, { icon: any; color: string; bg: string }> = {
  message: { icon: MessageCircle, color: '#2563eb', bg: '#eff6ff' },
  milestone: { icon: Star, color: '#10b981', bg: '#ecfdf5' },
  assignment: { icon: UserCheck, color: '#8b5cf6', bg: '#f5f3ff' },
  journey: { icon: BookOpen, color: '#f59e0b', bg: '#fffbeb' },
  system: { icon: AlertCircle, color: '#64748b', bg: '#f1f5f9' },
  prayer: { icon: Heart, color: '#ef4444', bg: '#fef2f2' },
};

export default function HomeScreen() {
  const colors = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [activeMetric, setActiveMetric] = useState(0);
  const [showAllActivity, setShowAllActivity] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState(NOTIFICATIONS);
  const bellRef = useRef<View>(null);
  const [bellBottom, setBellBottom] = useState(0);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const markAllRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const markRead = (id: string) => {
    setNotifications((prev) => prev.map((n) => n.id === id ? { ...n, read: true } : n));
  };

  const greeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 12, backgroundColor: colors.background }]}>
        <View style={styles.headerLeft}>
          <TurumbaLogo height={48} />
          <Text style={[styles.greeting, { color: colors.mutedForeground }]}>
            {greeting()}, Samson
          </Text>
        </View>
        <View style={styles.headerRight}>
          <View ref={bellRef} collapsable={false}>
            <TouchableOpacity
              style={[styles.headerIconBtn, { backgroundColor: colors.secondary }]}
              activeOpacity={0.7}
              onPress={() => {
                bellRef.current?.measureInWindow((_x, y, _w, h) => {
                  setBellBottom(y + h + 8);
                  setShowNotifications(true);
                });
              }}
            >
              <Bell size={20} color={colors.foreground} />
              {unreadCount > 0 && (
                <View style={[styles.notifBadge, { backgroundColor: colors.destructive }]}>
                  <Text style={styles.notifBadgeText}>{unreadCount > 9 ? '9+' : unreadCount}</Text>
                </View>
              )}
            </TouchableOpacity>
          </View>
          <TouchableOpacity
            style={[styles.headerIconBtn, { backgroundColor: colors.secondary }]}
            activeOpacity={0.7}
            onPress={() => router.push('/(tabs)/profile')}
          >
            <User size={20} color={colors.foreground} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Metrics Grid */}
        <View style={[styles.metricsContainer, { backgroundColor: colors.secondary }]}>
          <Text style={[styles.overviewTitle, { color: colors.foreground }]}>Overview</Text>
          <View style={styles.metricsGrid}>
            {METRICS.map((metric, idx) => {
              const Icon = metric.icon;
              const isActive = idx === activeMetric;
              return (
                <TouchableOpacity
                  key={idx}
                  style={[styles.metricCard, { backgroundColor: isActive ? '#000022' : colors.card }]}
                  activeOpacity={0.7}
                  onPress={() => {
                    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
                    setActiveMetric(idx);
                  }}
                >
                  <View style={[styles.metricIconWrap, { backgroundColor: isActive ? 'rgba(255,255,255,0.2)' : colors.secondary }]}>
                    <Icon size={18} color={isActive ? '#fff' : colors.primary} />
                  </View>
                  <Text style={[styles.metricValue, { color: isActive ? '#fff' : colors.foreground }]}>
                    {metric.value}
                  </Text>
                  <View style={styles.metricLabelRow}>
                    <Text style={[styles.metricTrend, { color: isActive ? '#fff' : colors.foreground }]}>
                      {metric.trendUp ? '↑' : '↓'}
                    </Text>
                    <Text style={[styles.metricLabel, { color: isActive ? 'rgba(255,255,255,0.75)' : colors.mutedForeground }]}>
                      {metric.label}
                    </Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>
            QUICK ACTIONS
          </Text>
          <View style={styles.quickActions}>
            <TouchableOpacity
              style={[styles.quickAction, { backgroundColor: colors.primary }]}
              activeOpacity={0.8}
              onPress={() => router.push('/(tabs)/chats')}
            >
              <MessageCircle size={18} color="#fff" />
              <Text style={styles.quickActionText}>Message</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.quickAction, { backgroundColor: colors.card, borderColor: colors.border, borderWidth: 1 }]}
              activeOpacity={0.8}
              onPress={() => router.push('/(tabs)/seekers')}
            >
              <Users size={18} color={colors.foreground} />
              <Text style={[styles.quickActionText, { color: colors.foreground }]}>View Seekers</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Activity Feed */}
        <View style={styles.section}>
          <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>
            SEEKER ACTIVITY
          </Text>

          <View style={[styles.activityCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            {(showAllActivity ? ACTIVITY : ACTIVITY.slice(0, 7)).map((item, idx, arr) => {
              const Icon = item.icon;
              return (
                <TouchableOpacity
                  key={item.id}
                  style={[
                    styles.activityItem,
                    idx < arr.length - 1 && {
                      borderBottomWidth: 1,
                      borderBottomColor: colors.border,
                    },
                  ]}
                  activeOpacity={0.6}
                  onPress={() => router.push(item.route as any)}
                >
                  <View style={[styles.activityIcon, { backgroundColor: item.bgColor }]}>
                    <Icon size={14} color={item.color} />
                  </View>
                  <View style={styles.activityContent}>
                    <Text
                      style={[styles.activityTitle, { color: colors.foreground }]}
                      numberOfLines={2}
                    >
                      {item.title}
                    </Text>
                    <Text style={[styles.activityTime, { color: colors.mutedForeground }]}>
                      {item.time}
                    </Text>
                  </View>
                  <ChevronRight size={14} color={colors.mutedForeground} />
                </TouchableOpacity>
              );
            })}
          </View>

          {/* View All / Show Less */}
          {ACTIVITY.length > 7 && (
            <TouchableOpacity style={styles.viewAllBtn} activeOpacity={0.7} onPress={() => {
              LayoutAnimation.configureNext(LayoutAnimation.create(300, LayoutAnimation.Types.easeInEaseOut, LayoutAnimation.Properties.opacity));
              setShowAllActivity(!showAllActivity);
            }}>
              <Text style={[styles.viewAllText, { color: colors.primary }]}>
                {showAllActivity ? 'Show Less' : 'View All Activity'}
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Bottom padding to clear the blur tab bar */}
        <View style={{ height: 100 + insets.bottom }} />
      </ScrollView>

      {/* ─── Notification Dropdown ──────────────────────────── */}
      <Modal
        visible={showNotifications}
        transparent
        animationType="fade"
        onRequestClose={() => setShowNotifications(false)}
      >
        <Pressable style={styles.notifOverlay} onPress={() => setShowNotifications(false)}>
          <View
            style={[
              styles.notifDropdown,
              {
                backgroundColor: colors.card,
                borderColor: colors.border,
                top: bellBottom,
              },
            ]}
            onStartShouldSetResponder={() => true}
          >
            {/* Dropdown header */}
            <View style={[styles.notifHeader, { borderBottomColor: colors.border }]}>
              <Text style={[styles.notifHeaderTitle, { color: colors.foreground }]}>Notifications</Text>
              {unreadCount > 0 && (
                <TouchableOpacity onPress={markAllRead} activeOpacity={0.7}>
                  <Text style={[styles.markAllText, { color: colors.primary }]}>Mark all read</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity
                onPress={() => setShowNotifications(false)}
                activeOpacity={0.7}
                style={styles.notifCloseBtn}
              >
                <X size={18} color={colors.mutedForeground} />
              </TouchableOpacity>
            </View>

            {/* Notification list */}
            <ScrollView
              style={styles.notifList}
              showsVerticalScrollIndicator={false}
              bounces={false}
            >
              {notifications.map((notif, idx) => {
                const iconData = NOTIF_ICONS[notif.type];
                const Icon = iconData.icon;
                return (
                  <TouchableOpacity
                    key={notif.id}
                    style={[
                      styles.notifItem,
                      !notif.read && { backgroundColor: colors.accent },
                      idx < notifications.length - 1 && { borderBottomWidth: 0.5, borderBottomColor: colors.border },
                    ]}
                    activeOpacity={0.6}
                    onPress={() => {
                      markRead(notif.id);
                      setShowNotifications(false);
                      if (notif.route) {
                        router.push(notif.route as any);
                      }
                    }}
                  >
                    {/* Icon */}
                    <View style={[styles.notifIcon, { backgroundColor: iconData.bg }]}>
                      <Icon size={14} color={iconData.color} />
                    </View>

                    {/* Content */}
                    <View style={styles.notifContent}>
                      <Text
                        style={[
                          styles.notifTitle,
                          { color: colors.foreground },
                          !notif.read && { fontFamily: 'DMSans_700Bold' },
                        ]}
                        numberOfLines={1}
                      >
                        {notif.title}
                      </Text>
                      <Text
                        style={[styles.notifBody, { color: colors.mutedForeground }]}
                        numberOfLines={1}
                      >
                        {notif.body}
                      </Text>
                      <Text style={[styles.notifTime, { color: colors.mutedForeground }]}>
                        {notif.time}
                      </Text>
                    </View>

                    {/* Unread dot */}
                    {!notif.read && (
                      <View style={[styles.unreadDot, { backgroundColor: colors.primary }]} />
                    )}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 12,
  },
  headerLeft: {
    flex: 1,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerIconBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  greeting: {
    fontFamily: 'DMSans_500Medium',
    fontSize: 14,
    marginTop: 4,
  },
  notifBadge: {
    position: 'absolute',
    top: 6,
    right: 6,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
    borderWidth: 2,
    borderColor: '#fff',
  },
  notifBadgeText: {
    fontFamily: 'DMSans_700Bold',
    fontSize: 9,
    color: '#fff',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
  },

  // Metrics
  metricsContainer: {
    borderRadius: 24,
    padding: 12,
    marginTop: 8,
  },
  overviewTitle: {
    fontFamily: 'DMSans_500Medium',
    fontSize: 16,
    marginBottom: 12,
    paddingLeft: 6,
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    justifyContent: 'space-between',
  },
  metricCard: {
    width: '48%' as any,
    padding: 18,
    borderRadius: 18,
  },
  metricIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  metricValue: {
    fontFamily: 'DMSans_700Bold',
    fontSize: 32,
    letterSpacing: -0.5,
  },
  metricLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  metricLabel: {
    fontFamily: 'DMSans_700Bold',
    fontSize: 13,
  },
  metricTrend: {
    fontFamily: 'DMSans_700Bold',
    fontSize: 13,
  },

  // Section
  section: {
    marginTop: 24,
  },
  sectionLabel: {
    fontFamily: 'DMSans_700Bold',
    fontSize: 12,
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: 10,
  },
  viewAllBtn: {
    alignItems: 'center',
    paddingVertical: 14,
    marginTop: 4,
  },
  viewAllText: {
    fontFamily: 'DMSans_700Bold',
    fontSize: 13,
  },

  // Quick Actions
  quickActions: {
    flexDirection: 'row',
    gap: 10,
  },
  quickAction: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 9999,
  },
  quickActionText: {
    fontFamily: 'DMSans_700Bold',
    fontSize: 14,
    color: '#fff',
  },

  // Activity
  activityCard: {
    borderRadius: Radius.lg,
    borderWidth: 1,
    overflow: 'hidden',
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    gap: 12,
  },
  activityIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  activityContent: {
    flex: 1,
  },
  activityTitle: {
    fontFamily: 'DMSans_600SemiBold',
    fontSize: 14,
    lineHeight: 20,
  },
  activityTime: {
    fontFamily: 'DMSans_500Medium',
    fontSize: 12,
    marginTop: 2,
  },

  // Notification Dropdown
  notifOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  notifDropdown: {
    position: 'absolute',
    left: 12,
    right: 12,
    borderRadius: 16,
    borderWidth: 0.5,
    maxHeight: 460,
    overflow: 'hidden',
  },
  notifHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 0.5,
    gap: 8,
  },
  notifHeaderTitle: {
    fontFamily: 'DMSans_700Bold',
    fontSize: 16,
    flex: 1,
  },
  markAllText: {
    fontFamily: 'DMSans_600SemiBold',
    fontSize: 12,
  },
  notifCloseBtn: {
    padding: 4,
    marginLeft: 4,
  },
  notifList: {
    maxHeight: 400,
  },
  notifItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },
  notifIcon: {
    width: 34,
    height: 34,
    borderRadius: 17,
    justifyContent: 'center',
    alignItems: 'center',
  },
  notifContent: {
    flex: 1,
    gap: 1,
  },
  notifTitle: {
    fontFamily: 'DMSans_600SemiBold',
    fontSize: 13,
  },
  notifBody: {
    fontFamily: 'DMSans_500Medium',
    fontSize: 12,
  },
  notifTime: {
    fontFamily: 'DMSans_500Medium',
    fontSize: 11,
    marginTop: 2,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
});
