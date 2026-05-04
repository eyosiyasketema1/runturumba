import React from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Platform,
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
  ArrowDownRight,
  Flame,
  Star,
  Heart,
  User,
} from 'lucide-react-native';
import { useTheme } from '@/hooks/use-theme';
import { Radius, Spacing } from '@/constants/theme';
import { TurumbaLogo } from '@/components/turumba-logo';

// Sample data
const METRICS = [
  { label: 'Active Seekers', value: '12', trend: '+2', trendUp: true, icon: Users, color: '#2563eb' },
  { label: 'Completion Rate', value: '67%', trend: '+5%', trendUp: true, icon: CheckCircle, color: '#10b981' },
  { label: 'Engagement', value: '78', trend: '+3', trendUp: true, icon: TrendingUp, color: '#8b5cf6' },
  { label: 'Pending Actions', value: '4', trend: '', trendUp: false, icon: UserCheck, color: '#f59e0b' },
];

const ACTIVITY = [
  { id: '1', icon: Star, color: '#10b981', bgColor: '#ecfdf5', title: 'Sarah completed Salvation milestone', time: '2 min ago' },
  { id: '2', icon: UserCheck, color: '#2563eb', bgColor: '#eff6ff', title: 'New match proposed: Daniel Mekonnen', time: '15 min ago' },
  { id: '3', icon: MessageCircle, color: '#8b5cf6', bgColor: '#f5f3ff', title: 'Maria Garcia sent you a message', time: '1 hour ago' },
  { id: '4', icon: Flame, color: '#f59e0b', bgColor: '#fffbeb', title: 'James started Growth journey', time: '2 hours ago' },
  { id: '5', icon: Heart, color: '#ef4444', bgColor: '#fef2f2', title: 'Prayer request from Rachel Thompson', time: '3 hours ago' },
  { id: '6', icon: CheckCircle, color: '#10b981', bgColor: '#ecfdf5', title: 'David Kim completed Bible Study series', time: '5 hours ago' },
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
        {/* Metrics Grid */}
        <View style={styles.metricsGrid}>
          {METRICS.map((metric, idx) => {
            const Icon = metric.icon;
            return (
              <TouchableOpacity
                key={idx}
                style={[
                  styles.metricCard,
                  {
                    backgroundColor: colors.card,
                    borderColor: colors.border,
                  },
                ]}
                activeOpacity={0.7}
              >
                <View style={styles.metricTop}>
                  <View style={[styles.metricIconWrap, { backgroundColor: metric.color + '14' }]}>
                    <Icon size={16} color={metric.color} />
                  </View>
                  {metric.trend ? (
                    <View style={[
                      styles.trendBadge,
                      { backgroundColor: metric.trendUp ? '#ecfdf5' : '#fef2f2' },
                    ]}>
                      {metric.trendUp ? (
                        <ArrowUpRight size={10} color="#10b981" />
                      ) : (
                        <ArrowDownRight size={10} color="#ef4444" />
                      )}
                      <Text style={[
                        styles.trendText,
                        { color: metric.trendUp ? '#10b981' : '#ef4444' },
                      ]}>
                        {metric.trend}
                      </Text>
                    </View>
                  ) : null}
                </View>
                <Text style={[styles.metricValue, { color: colors.foreground }]}>
                  {metric.value}
                </Text>
                <Text style={[styles.metricLabel, { color: colors.mutedForeground }]}>
                  {metric.label}
                </Text>
              </TouchableOpacity>
            );
          })}
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
            >
              <MessageCircle size={18} color="#fff" />
              <Text style={styles.quickActionText}>New Message</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.quickAction, { backgroundColor: colors.card, borderColor: colors.border, borderWidth: 1 }]}
              activeOpacity={0.8}
            >
              <Users size={18} color={colors.foreground} />
              <Text style={[styles.quickActionText, { color: colors.foreground }]}>View Seekers</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Activity Feed */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>
              RECENT ACTIVITY
            </Text>
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
        </View>

        {/* Bottom padding to clear the blur tab bar */}
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
    paddingHorizontal: 20,
  },

  // Metrics
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginTop: 8,
  },
  metricCard: {
    width: '48%' as any,
    flexGrow: 1,
    flexBasis: '46%',
    padding: 16,
    borderRadius: Radius.lg,
    borderWidth: 1,
  },
  metricTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  metricIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  trendBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 9999,
  },
  trendText: {
    fontFamily: 'DMSans_700Bold',
    fontSize: 11,
  },
  metricValue: {
    fontFamily: 'DMSans_700Bold',
    fontSize: 30,
    letterSpacing: -0.5,
  },
  metricLabel: {
    fontFamily: 'DMSans_600SemiBold',
    fontSize: 13,
    marginTop: 2,
  },

  // Section
  section: {
    marginTop: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  sectionLabel: {
    fontFamily: 'DMSans_700Bold',
    fontSize: 12,
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: 10,
  },
  viewAll: {
    fontFamily: 'DMSans_700Bold',
    fontSize: 13,
    marginBottom: 10,
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
});
