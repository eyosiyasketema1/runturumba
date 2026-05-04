import React from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  FlatList,
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
  ArrowUpRight,
  Flame,
  Star,
  Heart,
  User,
  BookOpen,
  Send,
  PlusCircle,
  ClipboardList,
} from 'lucide-react-native';
import { useTheme } from '@/hooks/use-theme';
import { Radius } from '@/constants/theme';
import { TurumbaLogo } from '@/components/turumba-logo';

// Horizontal metric cards
const METRICS = [
  { label: 'Active Seekers', value: '127+', trend: '+9.1% increase', icon: Users, color: '#2563eb' },
  { label: 'Completions', value: '44+', trend: '+12.1% increase', icon: CheckCircle, color: '#10b981' },
  { label: 'Engagement', value: '78+', trend: '+5.3% increase', icon: TrendingUp, color: '#8b5cf6' },
  { label: 'Pending', value: '16', trend: '3 urgent', icon: UserCheck, color: '#f59e0b' },
];

// Overview stats
const OVERVIEW_STATS = {
  seekers: { label: 'Seekers', value: '4,532+', trend: '4.6%', trendUp: true, trendLabel: 'vs last month' },
  milestones: { label: 'Milestones', value: '368+', trend: '4.6%', trendUp: true, trendLabel: 'vs last month' },
};

// New seekers today
const NEW_SEEKERS = [
  { id: '1', name: 'Alex', color: '#2563eb' },
  { id: '2', name: 'John', color: '#10b981' },
  { id: '3', name: 'Wisely', color: '#8b5cf6' },
  { id: '4', name: 'Kenner', color: '#f59e0b' },
  { id: '5', name: 'Maria', color: '#ef4444' },
];

// Quick actions grid
const QUICK_ACTIONS = [
  { label: 'New Seeker', icon: PlusCircle, color: '#2563eb', bgColor: '#eff6ff' },
  { label: 'Add Note', icon: ClipboardList, color: '#10b981', bgColor: '#ecfdf5' },
  { label: 'Send Message', icon: Send, color: '#8b5cf6', bgColor: '#f5f3ff' },
  { label: 'Log Activity', icon: BookOpen, color: '#f59e0b', bgColor: '#fffbeb' },
];

// Activity feed
const ACTIVITY = [
  { id: '1', icon: Star, color: '#10b981', bgColor: '#ecfdf5', title: 'Sarah completed Salvation milestone', time: '2 min ago' },
  { id: '2', icon: UserCheck, color: '#2563eb', bgColor: '#eff6ff', title: 'New match proposed: Daniel Mekonnen', time: '15 min ago' },
  { id: '3', icon: MessageCircle, color: '#8b5cf6', bgColor: '#f5f3ff', title: 'Maria Garcia sent you a message', time: '1 hour ago' },
  { id: '4', icon: Flame, color: '#f59e0b', bgColor: '#fffbeb', title: 'James started Growth journey', time: '2 hours ago' },
  { id: '5', icon: Heart, color: '#ef4444', bgColor: '#fef2f2', title: 'Prayer request from Rachel Thompson', time: '3 hours ago' },
];

export default function HomeScreen() {
  const colors = useTheme();
  const insets = useSafeAreaInsets();

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
          <TouchableOpacity
            style={[styles.headerIconBtn, { backgroundColor: colors.secondary }]}
            activeOpacity={0.7}
          >
            <Bell size={20} color={colors.foreground} />
            <View style={[styles.notifDot, { backgroundColor: colors.destructive }]} />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.headerIconBtn, { backgroundColor: colors.secondary }]}
            activeOpacity={0.7}
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
        {/* Horizontal Metric Cards */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.metricsRow}
          style={styles.metricsScroll}
        >
          {METRICS.map((metric, idx) => {
            const Icon = metric.icon;
            return (
              <TouchableOpacity
                key={idx}
                style={[styles.metricCard, { backgroundColor: colors.card, borderColor: colors.border }]}
                activeOpacity={0.7}
              >
                <View style={styles.metricCardHeader}>
                  <Text style={[styles.metricLabel, { color: colors.mutedForeground }]}>{metric.label}</Text>
                  <Text style={[styles.metricDots, { color: colors.mutedForeground }]}>•••</Text>
                </View>
                <View style={styles.metricCardBody}>
                  <View style={[styles.metricIconWrap, { backgroundColor: metric.color + '18' }]}>
                    <Icon size={18} color={metric.color} />
                  </View>
                  <Text style={[styles.metricValue, { color: colors.foreground }]}>{metric.value}</Text>
                </View>
                <Text style={[styles.metricTrend, { color: '#10b981' }]}>{metric.trend}</Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Overview Section */}
        <View style={styles.section}>
          <View style={styles.overviewHeader}>
            <Text style={[styles.overviewTitle, { color: colors.foreground }]}>Overview</Text>
            <TouchableOpacity style={[styles.overviewFilter, { backgroundColor: colors.secondary }]} activeOpacity={0.7}>
              <Text style={[styles.overviewFilterText, { color: colors.mutedForeground }]}>Last 30 days</Text>
              <ChevronRight size={14} color={colors.mutedForeground} style={{ transform: [{ rotate: '90deg' }] }} />
            </TouchableOpacity>
          </View>

          <View style={styles.overviewCard}>
            {/* Seekers stat */}
            <View style={styles.overviewStat}>
              <View style={styles.overviewStatHeader}>
                <Users size={16} color="#93c5fd" />
                <Text style={styles.overviewStatLabel}>Seekers</Text>
              </View>
              <Text style={styles.overviewStatValue}>{OVERVIEW_STATS.seekers.value}</Text>
              <View style={styles.overviewTrendRow}>
                <View style={styles.overviewTrendBadge}>
                  <ArrowUpRight size={10} color="#4ade80" />
                  <Text style={styles.overviewTrendText}>{OVERVIEW_STATS.seekers.trend}</Text>
                </View>
                <Text style={styles.overviewTrendLabel}>{OVERVIEW_STATS.seekers.trendLabel}</Text>
              </View>
            </View>

            {/* Divider */}
            <View style={styles.overviewDivider} />

            {/* Milestones stat */}
            <View style={styles.overviewStat}>
              <View style={styles.overviewStatHeader}>
                <CheckCircle size={16} color="#93c5fd" />
                <Text style={styles.overviewStatLabel}>Milestones</Text>
              </View>
              <Text style={styles.overviewStatValue}>{OVERVIEW_STATS.milestones.value}</Text>
              <View style={styles.overviewTrendRow}>
                <View style={styles.overviewTrendBadge}>
                  <ArrowUpRight size={10} color="#4ade80" />
                  <Text style={styles.overviewTrendText}>{OVERVIEW_STATS.milestones.trend}</Text>
                </View>
                <Text style={styles.overviewTrendLabel}>{OVERVIEW_STATS.milestones.trendLabel}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* New Seekers Today */}
        <View style={styles.section}>
          <Text style={[styles.newSeekersTitle, { color: colors.foreground }]}>
            157 new seekers today!
          </Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.seekersRow}>
            {NEW_SEEKERS.map((seeker) => (
              <View key={seeker.id} style={styles.seekerItem}>
                <View style={[styles.seekerAvatar, { backgroundColor: seeker.color }]}>
                  <Text style={styles.seekerAvatarText}>{seeker.name[0]}</Text>
                </View>
                <Text style={[styles.seekerName, { color: colors.foreground }]}>{seeker.name}</Text>
              </View>
            ))}
          </ScrollView>
        </View>

        {/* Quick Actions Grid */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Quick Actions</Text>
          <View style={styles.quickActionsGrid}>
            {QUICK_ACTIONS.map((action, idx) => {
              const Icon = action.icon;
              return (
                <TouchableOpacity key={idx} style={styles.quickActionItem} activeOpacity={0.7}>
                  <View style={[styles.quickActionIcon, { backgroundColor: action.bgColor }]}>
                    <Icon size={22} color={action.color} />
                  </View>
                  <Text style={[styles.quickActionLabel, { color: colors.foreground }]}>{action.label}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Activity Feed */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Recent Activity</Text>
            <TouchableOpacity activeOpacity={0.7}>
              <Text style={[styles.viewAll, { color: colors.primary }]}>View All</Text>
            </TouchableOpacity>
          </View>

          <View style={[styles.activityCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            {ACTIVITY.map((item, idx) => {
              const Icon = item.icon;
              return (
                <TouchableOpacity
                  key={item.id}
                  style={[
                    styles.activityItem,
                    idx < ACTIVITY.length - 1 && {
                      borderBottomWidth: 1,
                      borderBottomColor: colors.border,
                    },
                  ]}
                  activeOpacity={0.6}
                >
                  <View style={[styles.activityIcon, { backgroundColor: item.bgColor }]}>
                    <Icon size={16} color={item.color} />
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
        </View>

        {/* Bottom padding to clear tab bar */}
        <View style={{ height: 100 + insets.bottom }} />
      </ScrollView>
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
  notifDot: {
    position: 'absolute',
    top: 9,
    right: 9,
    width: 8,
    height: 8,
    borderRadius: 4,
    borderWidth: 1.5,
    borderColor: '#fff',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 20,
  },

  // Horizontal Metrics
  metricsScroll: {
    marginTop: 8,
  },
  metricsRow: {
    paddingHorizontal: 20,
    gap: 12,
  },
  metricCard: {
    width: 160,
    padding: 16,
    borderRadius: 20,
    borderWidth: 1,
  },
  metricCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  metricLabel: {
    fontFamily: 'DMSans_600SemiBold',
    fontSize: 12,
  },
  metricDots: {
    fontFamily: 'DMSans_700Bold',
    fontSize: 14,
    letterSpacing: 1,
  },
  metricCardBody: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 8,
  },
  metricIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  metricValue: {
    fontFamily: 'DMSans_700Bold',
    fontSize: 24,
    letterSpacing: -0.5,
  },
  metricTrend: {
    fontFamily: 'DMSans_500Medium',
    fontSize: 11,
  },

  // Sections
  section: {
    marginTop: 28,
    paddingHorizontal: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  sectionTitle: {
    fontFamily: 'DMSans_700Bold',
    fontSize: 20,
    marginBottom: 14,
  },
  viewAll: {
    fontFamily: 'DMSans_600SemiBold',
    fontSize: 14,
    marginBottom: 14,
  },

  // Overview
  overviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  overviewTitle: {
    fontFamily: 'DMSans_700Bold',
    fontSize: 20,
  },
  overviewFilter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 9999,
  },
  overviewFilterText: {
    fontFamily: 'DMSans_500Medium',
    fontSize: 13,
  },
  overviewCard: {
    flexDirection: 'row',
    backgroundColor: '#1e3a8a',
    borderRadius: 24,
    padding: 24,
    gap: 0,
  },
  overviewStat: {
    flex: 1,
  },
  overviewStatHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  overviewStatLabel: {
    fontFamily: 'DMSans_600SemiBold',
    fontSize: 14,
    color: '#93c5fd',
  },
  overviewStatValue: {
    fontFamily: 'DMSans_700Bold',
    fontSize: 28,
    color: '#ffffff',
    letterSpacing: -0.5,
    marginBottom: 8,
  },
  overviewTrendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  overviewTrendBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    backgroundColor: 'rgba(74, 222, 128, 0.15)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 9999,
  },
  overviewTrendText: {
    fontFamily: 'DMSans_700Bold',
    fontSize: 11,
    color: '#4ade80',
  },
  overviewTrendLabel: {
    fontFamily: 'DMSans_500Medium',
    fontSize: 11,
    color: '#93c5fd',
  },
  overviewDivider: {
    width: 1,
    backgroundColor: 'rgba(147, 197, 253, 0.2)',
    marginHorizontal: 16,
  },

  // New Seekers
  newSeekersTitle: {
    fontFamily: 'DMSans_700Bold',
    fontSize: 16,
    marginBottom: 14,
  },
  seekersRow: {
    gap: 20,
  },
  seekerItem: {
    alignItems: 'center',
    gap: 6,
  },
  seekerAvatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    justifyContent: 'center',
    alignItems: 'center',
  },
  seekerAvatarText: {
    fontFamily: 'DMSans_700Bold',
    fontSize: 20,
    color: '#fff',
  },
  seekerName: {
    fontFamily: 'DMSans_500Medium',
    fontSize: 12,
  },

  // Quick Actions Grid
  quickActionsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  quickActionItem: {
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  quickActionIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  quickActionLabel: {
    fontFamily: 'DMSans_600SemiBold',
    fontSize: 11,
    textAlign: 'center',
  },

  // Activity
  activityCard: {
    borderRadius: 20,
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
});
