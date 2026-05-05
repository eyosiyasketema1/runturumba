import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  TextInput,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import {
  Search,
  MessageCircle,
  ChevronRight,
  Filter,
} from 'lucide-react-native';
import { useTheme } from '@/hooks/use-theme';
import { MaturityColors } from '@/constants/theme';

// ─── Seeker Data ────────────────────────────────────────────────────────────

const SEEKERS = [
  {
    id: '1',
    name: 'Sarah Johnson',
    initials: 'SJ',
    color: '#2563eb',
    maturity: 'New Believer',
    status: 'Active',
    platform: 'WhatsApp',
    lastActive: '2m ago',
    online: true,
    journey: 'Foundations of Faith',
    journeyProgress: 0.6,
    engagementScore: 85,
    unreadMessages: 3,
  },
  {
    id: '2',
    name: 'Daniel Mekonnen',
    initials: 'DM',
    color: '#10b981',
    maturity: 'Seeker',
    status: 'Active',
    platform: 'Telegram',
    lastActive: '15m ago',
    online: true,
    journey: 'Prayer Basics',
    journeyProgress: 0.3,
    engagementScore: 72,
    unreadMessages: 1,
  },
  {
    id: '3',
    name: 'Maria Garcia',
    initials: 'MG',
    color: '#f59e0b',
    maturity: 'Growing',
    status: 'Active',
    platform: 'WhatsApp',
    lastActive: '2h ago',
    online: false,
    journey: 'Bible 101',
    journeyProgress: 0.8,
    engagementScore: 91,
    unreadMessages: 0,
  },
  {
    id: '4',
    name: 'James Wilson',
    initials: 'JW',
    color: '#ef4444',
    maturity: 'New Believer',
    status: 'Active',
    platform: 'WhatsApp',
    lastActive: '3h ago',
    online: false,
    journey: 'Foundations of Faith',
    journeyProgress: 0.15,
    engagementScore: 65,
    unreadMessages: 0,
  },
  {
    id: '5',
    name: 'Rachel Thompson',
    initials: 'RT',
    color: '#06b6d4',
    maturity: 'Interested',
    status: 'Pending',
    platform: 'Telegram',
    lastActive: '5h ago',
    online: true,
    journey: '',
    journeyProgress: 0,
    engagementScore: 40,
    unreadMessages: 0,
  },
  {
    id: '6',
    name: 'David Kim',
    initials: 'DK',
    color: '#ec4899',
    maturity: 'Growing',
    status: 'Active',
    platform: 'WhatsApp',
    lastActive: '1d ago',
    online: false,
    journey: 'Finding Community',
    journeyProgress: 0.5,
    engagementScore: 78,
    unreadMessages: 0,
  },
  {
    id: '7',
    name: 'Abebe Tadesse',
    initials: 'AT',
    color: '#8b5cf6',
    maturity: 'Mature',
    status: 'Active',
    platform: 'Telegram',
    lastActive: '2d ago',
    online: false,
    journey: 'Bible 101',
    journeyProgress: 1.0,
    engagementScore: 95,
    unreadMessages: 0,
  },
  {
    id: '8',
    name: 'Fatima Ali',
    initials: 'FA',
    color: '#d97706',
    maturity: 'Pre-Seeker',
    status: 'Active',
    platform: 'WhatsApp',
    lastActive: '3d ago',
    online: false,
    journey: '',
    journeyProgress: 0,
    engagementScore: 28,
    unreadMessages: 0,
  },
];

type FilterType = 'all' | 'Active' | 'Pending' | 'Inactive';

const PLATFORM_COLORS: Record<string, string> = {
  WhatsApp: '#25D366',
  Telegram: '#0088cc',
  SMS: '#f59e0b',
  Email: '#8b5cf6',
};

function engagementColor(score: number): string {
  if (score < 30) return '#ef4444';
  if (score < 60) return '#f59e0b';
  return '#10b981';
}

export default function SeekersScreen() {
  const colors = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState<FilterType>('all');

  const filteredSeekers = SEEKERS.filter((s) => {
    const matchesFilter = filter === 'all' || s.status === filter;
    const matchesSearch =
      !searchQuery || s.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const sorted = [...filteredSeekers].sort((a, b) => {
    // Online first, then by engagement score
    if (a.online && !b.online) return -1;
    if (!a.online && b.online) return 1;
    if (a.unreadMessages > 0 && b.unreadMessages === 0) return -1;
    if (a.unreadMessages === 0 && b.unreadMessages > 0) return 1;
    return b.engagementScore - a.engagementScore;
  });

  const filters: { key: FilterType; label: string }[] = [
    { key: 'all', label: 'All' },
    { key: 'Active', label: 'Active' },
    { key: 'Pending', label: 'Pending' },
    { key: 'Inactive', label: 'Inactive' },
  ];

  const renderSeeker = ({ item }: { item: typeof SEEKERS[0] }) => {
    const maturityColor = MaturityColors[item.maturity] || '#94a3b8';
    const platformColor = PLATFORM_COLORS[item.platform] || colors.mutedForeground;
    const engColor = engagementColor(item.engagementScore);

    return (
      <TouchableOpacity
        style={[styles.seekerItem, { borderBottomColor: colors.border }]}
        activeOpacity={0.6}
        onPress={() => router.push(`/seeker/${item.id}`)}
      >
        {/* Avatar */}
        <View style={styles.avatarContainer}>
          <View style={[styles.avatar, { backgroundColor: item.color }]}>
            <Text style={styles.avatarText}>{item.initials}</Text>
          </View>
          {item.online && <View style={styles.onlineDot} />}
        </View>

        {/* Content */}
        <View style={styles.seekerContent}>
          <View style={styles.topRow}>
            <Text style={[styles.seekerName, { color: colors.foreground }]} numberOfLines={1}>
              {item.name}
            </Text>
            {item.unreadMessages > 0 && (
              <View style={[styles.unreadBadge, { backgroundColor: colors.primary }]}>
                <Text style={styles.unreadText}>{item.unreadMessages}</Text>
              </View>
            )}
          </View>

          {/* Maturity + Platform row */}
          <View style={styles.metaRow}>
            <View style={[styles.maturityBadge, { backgroundColor: maturityColor + '18' }]}>
              <View style={[styles.maturityDot, { backgroundColor: maturityColor }]} />
              <Text style={[styles.maturityText, { color: maturityColor }]}>{item.maturity}</Text>
            </View>
            <View style={styles.platformBadge}>
              <MessageCircle size={10} color={platformColor} />
              <Text style={[styles.platformText, { color: platformColor }]}>{item.platform}</Text>
            </View>
          </View>

          {/* Journey progress */}
          {item.journey ? (
            <View style={styles.journeyRow}>
              <Text style={[styles.journeyText, { color: colors.mutedForeground }]} numberOfLines={1}>
                {item.journey}
              </Text>
              <View style={[styles.progressBarBg, { backgroundColor: colors.secondary }]}>
                <View
                  style={[
                    styles.progressBarFill,
                    {
                      backgroundColor: colors.primary,
                      width: `${Math.round(item.journeyProgress * 100)}%`,
                    },
                  ]}
                />
              </View>
            </View>
          ) : (
            <Text style={[styles.journeyText, { color: colors.mutedForeground }]}>No journey started</Text>
          )}

          {/* Bottom row: engagement + last active */}
          <View style={styles.bottomRow}>
            <View style={styles.engagementWrap}>
              <View style={[styles.engagementDot, { backgroundColor: engColor }]} />
              <Text style={[styles.engagementText, { color: colors.mutedForeground }]}>
                {item.engagementScore}% engaged
              </Text>
            </View>
            <Text style={[styles.lastActiveText, { color: colors.mutedForeground }]}>
              {item.lastActive}
            </Text>
          </View>
        </View>

        <ChevronRight size={16} color={colors.mutedForeground} />
      </TouchableOpacity>
    );
  };

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>Seekers</Text>
      </View>

      {/* Search */}
      <View style={styles.searchContainer}>
        <View style={[styles.searchBar, { backgroundColor: colors.secondary }]}>
          <Search size={18} color={colors.mutedForeground} />
          <TextInput
            style={[styles.searchInput, { color: colors.foreground }]}
            placeholder="Search seekers..."
            placeholderTextColor={colors.mutedForeground}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
      </View>

      {/* Filter Tabs */}
      <View style={styles.filterRow}>
        {filters.map((f) => (
          <TouchableOpacity
            key={f.key}
            style={[
              styles.filterTab,
              {
                backgroundColor: filter === f.key ? '#000022' : colors.secondary,
              },
            ]}
            onPress={() => setFilter(f.key)}
            activeOpacity={0.7}
          >
            <Text
              style={[
                styles.filterText,
                { color: filter === f.key ? '#fff' : colors.foreground },
              ]}
            >
              {f.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Seeker List */}
      <FlatList
        data={sorted}
        renderItem={renderSeeker}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingBottom: 100 + insets.bottom }}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
              No seekers found
            </Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 4,
  },
  headerTitle: {
    fontFamily: 'DMSans_700Bold',
    fontSize: 28,
    letterSpacing: -0.5,
  },

  // Search
  searchContainer: {
    paddingHorizontal: 20,
    paddingVertical: 8,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 9999,
  },
  searchInput: {
    flex: 1,
    fontFamily: 'DMSans_500Medium',
    fontSize: 15,
    padding: 0,
  },

  // Filter Tabs
  filterRow: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    gap: 8,
    paddingBottom: 12,
  },
  filterTab: {
    paddingHorizontal: 18,
    paddingVertical: 8,
    borderRadius: 9999,
  },
  filterText: {
    fontFamily: 'DMSans_600SemiBold',
    fontSize: 13,
  },

  // Seeker Item
  seekerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
    gap: 14,
    borderBottomWidth: 0.5,
  },

  // Avatar
  avatarContainer: {
    position: 'relative',
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontFamily: 'DMSans_700Bold',
    fontSize: 16,
    color: '#fff',
  },
  onlineDot: {
    position: 'absolute',
    bottom: 1,
    right: 1,
    width: 13,
    height: 13,
    borderRadius: 7,
    backgroundColor: '#10b981',
    borderWidth: 2.5,
    borderColor: '#fff',
  },

  // Content
  seekerContent: {
    flex: 1,
    gap: 4,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  seekerName: {
    fontFamily: 'DMSans_700Bold',
    fontSize: 15,
    flex: 1,
    marginRight: 8,
  },
  unreadBadge: {
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 5,
  },
  unreadText: {
    fontFamily: 'DMSans_700Bold',
    fontSize: 10,
    color: '#fff',
  },

  // Meta row
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  maturityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 9999,
  },
  maturityDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  maturityText: {
    fontFamily: 'DMSans_600SemiBold',
    fontSize: 11,
  },
  platformBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  platformText: {
    fontFamily: 'DMSans_600SemiBold',
    fontSize: 11,
  },

  // Journey
  journeyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  journeyText: {
    fontFamily: 'DMSans_500Medium',
    fontSize: 12,
    flex: 1,
  },
  progressBarBg: {
    width: 48,
    height: 4,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 2,
  },

  // Bottom row
  bottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  engagementWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  engagementDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  engagementText: {
    fontFamily: 'DMSans_500Medium',
    fontSize: 11,
  },
  lastActiveText: {
    fontFamily: 'DMSans_500Medium',
    fontSize: 11,
  },

  // Empty
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 60,
  },
  emptyText: {
    fontFamily: 'DMSans_500Medium',
    fontSize: 15,
  },
});
