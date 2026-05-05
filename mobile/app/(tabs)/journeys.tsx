import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  TextInput,
  LayoutAnimation,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import {
  Search,
  BookOpen,
  Users,
  ChevronRight,
  Clock,
  CheckCircle2,
  Circle,
  MessageCircle,
} from 'lucide-react-native';
import { useTheme } from '@/hooks/use-theme';
import { MaturityColors } from '@/constants/theme';

// ─── Journey Data ──────────────────────────────────────────────────────────

const JOURNEYS = [
  {
    id: '1',
    name: 'Foundations of Faith',
    description: 'Core beliefs, prayer, and Scripture basics for new believers',
    totalLessons: 7,
    category: 'Discipleship',
    enrolledSeekers: [
      { id: '1', name: 'Sarah Johnson', initials: 'SJ', color: '#2563eb', currentLesson: 4, maturity: 'New Believer', lastActive: '2m ago' },
      { id: '4', name: 'James Wilson', initials: 'JW', color: '#ef4444', currentLesson: 1, maturity: 'New Believer', lastActive: '3h ago' },
    ],
  },
  {
    id: '2',
    name: 'Prayer Basics',
    description: 'Learning to communicate with God through different forms of prayer',
    totalLessons: 5,
    category: 'Spiritual Growth',
    enrolledSeekers: [
      { id: '2', name: 'Daniel Mekonnen', initials: 'DM', color: '#10b981', currentLesson: 2, maturity: 'Seeker', lastActive: '15m ago' },
    ],
  },
  {
    id: '3',
    name: 'Bible 101',
    description: 'Overview of the Bible — Old and New Testament, how to read and study',
    totalLessons: 10,
    category: 'Discipleship',
    enrolledSeekers: [
      { id: '3', name: 'Maria Garcia', initials: 'MG', color: '#f59e0b', currentLesson: 8, maturity: 'Growing', lastActive: '2h ago' },
      { id: '7', name: 'Abebe Tadesse', initials: 'AT', color: '#8b5cf6', currentLesson: 10, maturity: 'Mature', lastActive: '2d ago' },
    ],
  },
  {
    id: '4',
    name: 'Finding Community',
    description: 'The importance of fellowship and connecting with other believers',
    totalLessons: 6,
    category: 'Community',
    enrolledSeekers: [
      { id: '6', name: 'David Kim', initials: 'DK', color: '#ec4899', currentLesson: 3, maturity: 'Growing', lastActive: '1d ago' },
    ],
  },
  {
    id: '5',
    name: 'Who Is Jesus?',
    description: 'An introductory journey exploring the life and teachings of Jesus',
    totalLessons: 8,
    category: 'Evangelism',
    enrolledSeekers: [],
  },
  {
    id: '6',
    name: 'Understanding the Gospel',
    description: 'What the Gospel means, why it matters, and how to share it',
    totalLessons: 6,
    category: 'Evangelism',
    enrolledSeekers: [],
  },
];

type FilterType = 'all' | 'Discipleship' | 'Spiritual Growth' | 'Community' | 'Evangelism';

export default function JourneysScreen() {
  const colors = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState<FilterType>('all');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const filteredJourneys = JOURNEYS.filter((j) => {
    const matchesFilter = filter === 'all' || j.category === filter;
    const matchesSearch =
      !searchQuery || j.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  // Sort: journeys with enrolled seekers first, then by enrollment count
  const sorted = [...filteredJourneys].sort((a, b) => {
    if (a.enrolledSeekers.length > 0 && b.enrolledSeekers.length === 0) return -1;
    if (a.enrolledSeekers.length === 0 && b.enrolledSeekers.length > 0) return 1;
    return b.enrolledSeekers.length - a.enrolledSeekers.length;
  });

  const filters: { key: FilterType; label: string }[] = [
    { key: 'all', label: 'All' },
    { key: 'Discipleship', label: 'Discipleship' },
    { key: 'Evangelism', label: 'Evangelism' },
    { key: 'Spiritual Growth', label: 'Growth' },
    { key: 'Community', label: 'Community' },
  ];

  const renderSeeker = (seeker: typeof JOURNEYS[0]['enrolledSeekers'][0], totalLessons: number) => {
    const progress = seeker.currentLesson / totalLessons;
    const completed = seeker.currentLesson >= totalLessons;
    const maturityColor = MaturityColors[seeker.maturity] || '#94a3b8';

    return (
      <TouchableOpacity
        key={seeker.id}
        style={[styles.seekerRow, { borderTopColor: colors.border }]}
        activeOpacity={0.6}
        onPress={() => router.push(`/seeker/${seeker.id}`)}
      >
        <View style={[styles.seekerAvatar, { backgroundColor: seeker.color }]}>
          <Text style={styles.seekerAvatarText}>{seeker.initials}</Text>
        </View>
        <View style={styles.seekerInfo}>
          <Text style={[styles.seekerName, { color: colors.foreground }]} numberOfLines={1}>
            {seeker.name}
          </Text>
          <View style={styles.seekerMeta}>
            <View style={[styles.maturityDot, { backgroundColor: maturityColor }]} />
            <Text style={[styles.seekerMetaText, { color: colors.mutedForeground }]}>
              Lesson {seeker.currentLesson}/{totalLessons}
            </Text>
            <Text style={[styles.seekerMetaDot, { color: colors.border }]}>·</Text>
            <Text style={[styles.seekerMetaText, { color: colors.mutedForeground }]}>{seeker.lastActive}</Text>
          </View>
        </View>
        <View style={styles.seekerProgress}>
          {completed ? (
            <CheckCircle2 size={18} color="#10b981" />
          ) : (
            <View style={[styles.miniProgressBg, { backgroundColor: colors.secondary }]}>
              <View style={[styles.miniProgressFill, { backgroundColor: colors.primary, width: `${Math.round(progress * 100)}%` }]} />
            </View>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  const renderJourney = ({ item }: { item: typeof JOURNEYS[0] }) => {
    const isExpanded = expandedId === item.id;
    const enrolled = item.enrolledSeekers.length;
    const completedCount = item.enrolledSeekers.filter((s) => s.currentLesson >= item.totalLessons).length;

    return (
      <View style={[styles.journeyCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <TouchableOpacity
          style={styles.journeyHeader}
          activeOpacity={0.7}
          onPress={() => {
            LayoutAnimation.configureNext(LayoutAnimation.create(300, LayoutAnimation.Types.easeInEaseOut, LayoutAnimation.Properties.opacity));
            setExpandedId(isExpanded ? null : item.id);
          }}
        >
          {/* Icon */}
          <View style={[styles.journeyIcon, { backgroundColor: colors.secondary }]}>
            <BookOpen size={18} color={colors.primary} />
          </View>

          {/* Title + meta */}
          <View style={styles.journeyContent}>
            <Text style={[styles.journeyName, { color: colors.foreground }]} numberOfLines={1}>
              {item.name}
            </Text>
            <View style={styles.journeyMeta}>
              <Text style={[styles.journeyMetaText, { color: colors.mutedForeground }]}>
                {item.totalLessons} lessons
              </Text>
              <Text style={[styles.journeyMetaDot, { color: colors.border }]}>·</Text>
              <Text style={[styles.journeyMetaText, { color: colors.mutedForeground }]}>
                {item.category}
              </Text>
            </View>
          </View>

          {/* Enrolled count */}
          <View style={styles.journeyRight}>
            {enrolled > 0 ? (
              <View style={styles.enrolledWrap}>
                <Users size={13} color={colors.mutedForeground} />
                <Text style={[styles.enrolledText, { color: colors.foreground }]}>{enrolled}</Text>
              </View>
            ) : (
              <Text style={[styles.noEnrolledText, { color: colors.mutedForeground }]}>—</Text>
            )}
            <ChevronRight
              size={16}
              color={colors.mutedForeground}
              style={{ transform: [{ rotate: isExpanded ? '90deg' : '0deg' }] }}
            />
          </View>
        </TouchableOpacity>

        {/* Description */}
        <Text style={[styles.journeyDesc, { color: colors.mutedForeground }]} numberOfLines={2}>
          {item.description}
        </Text>

        {/* Progress summary when has enrollees */}
        {enrolled > 0 && (
          <View style={styles.progressSummary}>
            <View style={[styles.summaryChip, { backgroundColor: colors.secondary }]}>
              <Users size={11} color={colors.mutedForeground} />
              <Text style={[styles.summaryText, { color: colors.foreground }]}>{enrolled} enrolled</Text>
            </View>
            {completedCount > 0 && (
              <View style={[styles.summaryChip, { backgroundColor: colors.secondary }]}>
                <CheckCircle2 size={11} color="#10b981" />
                <Text style={[styles.summaryText, { color: colors.foreground }]}>{completedCount} completed</Text>
              </View>
            )}
          </View>
        )}

        {/* Expanded: seeker list */}
        {isExpanded && enrolled > 0 && (
          <View style={styles.seekerList}>
            {item.enrolledSeekers.map((s) => renderSeeker(s, item.totalLessons))}
          </View>
        )}

        {/* Expanded: empty state */}
        {isExpanded && enrolled === 0 && (
          <View style={[styles.emptyEnrolled, { borderTopColor: colors.border }]}>
            <Circle size={14} color={colors.mutedForeground} />
            <Text style={[styles.emptyEnrolledText, { color: colors.mutedForeground }]}>
              No seekers enrolled yet
            </Text>
          </View>
        )}
      </View>
    );
  };

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>Journeys</Text>
      </View>

      {/* Search */}
      <View style={styles.searchContainer}>
        <View style={[styles.searchBar, { backgroundColor: colors.secondary }]}>
          <Search size={18} color={colors.mutedForeground} />
          <TextInput
            style={[styles.searchInput, { color: colors.foreground }]}
            placeholder="Search journeys..."
            placeholderTextColor={colors.mutedForeground}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
      </View>

      {/* Filter Tabs */}
      <View style={styles.filterRow}>
        <FlatList
          horizontal
          data={filters}
          showsHorizontalScrollIndicator={false}
          keyExtractor={(item) => item.key}
          contentContainerStyle={{ gap: 8 }}
          renderItem={({ item: f }) => (
            <TouchableOpacity
              style={[
                styles.filterTab,
                { backgroundColor: filter === f.key ? '#000022' : colors.secondary },
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
          )}
        />
      </View>

      {/* Journey List */}
      <FlatList
        data={sorted}
        renderItem={renderJourney}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 100 + insets.bottom, gap: 12 }}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <BookOpen size={32} color={colors.mutedForeground} />
            <Text style={[styles.emptyTitle, { color: colors.foreground }]}>No journeys found</Text>
            <Text style={[styles.emptySubtitle, { color: colors.mutedForeground }]}>
              Try adjusting your search or filters
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
    paddingHorizontal: 20,
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

  // Journey Card
  journeyCard: {
    borderRadius: 14,
    borderWidth: 0.5,
    padding: 16,
  },
  journeyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  journeyIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  journeyContent: {
    flex: 1,
    gap: 2,
  },
  journeyName: {
    fontFamily: 'DMSans_700Bold',
    fontSize: 15,
  },
  journeyMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  journeyMetaText: {
    fontFamily: 'DMSans_500Medium',
    fontSize: 12,
  },
  journeyMetaDot: {
    fontSize: 12,
  },
  journeyRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  enrolledWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  enrolledText: {
    fontFamily: 'DMSans_700Bold',
    fontSize: 14,
  },
  noEnrolledText: {
    fontFamily: 'DMSans_500Medium',
    fontSize: 14,
  },

  // Description
  journeyDesc: {
    fontFamily: 'DMSans_500Medium',
    fontSize: 13,
    lineHeight: 19,
    marginTop: 10,
    paddingLeft: 52,
  },

  // Progress summary chips
  progressSummary: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 10,
    paddingLeft: 52,
  },
  summaryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 9999,
  },
  summaryText: {
    fontFamily: 'DMSans_600SemiBold',
    fontSize: 11,
  },

  // Seeker list (expanded)
  seekerList: {
    marginTop: 12,
  },
  seekerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 10,
    borderTopWidth: 0.5,
  },
  seekerAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  seekerAvatarText: {
    fontFamily: 'DMSans_700Bold',
    fontSize: 11,
    color: '#fff',
  },
  seekerInfo: {
    flex: 1,
    gap: 1,
  },
  seekerName: {
    fontFamily: 'DMSans_600SemiBold',
    fontSize: 13,
  },
  seekerMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  maturityDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
  },
  seekerMetaText: {
    fontFamily: 'DMSans_500Medium',
    fontSize: 11,
  },
  seekerMetaDot: {
    fontSize: 11,
  },
  seekerProgress: {
    width: 60,
    alignItems: 'flex-end',
  },
  miniProgressBg: {
    width: 48,
    height: 4,
    borderRadius: 2,
    overflow: 'hidden',
  },
  miniProgressFill: {
    height: '100%',
    borderRadius: 2,
  },

  // Empty enrolled
  emptyEnrolled: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 0.5,
    justifyContent: 'center',
  },
  emptyEnrolledText: {
    fontFamily: 'DMSans_500Medium',
    fontSize: 13,
  },

  // Empty state
  emptyState: {
    alignItems: 'center',
    paddingTop: 60,
    gap: 8,
  },
  emptyTitle: {
    fontFamily: 'DMSans_700Bold',
    fontSize: 16,
  },
  emptySubtitle: {
    fontFamily: 'DMSans_500Medium',
    fontSize: 13,
  },
});
