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
  Users,
  MessageCircle,
  Pin,
} from 'lucide-react-native';
import { useTheme } from '@/hooks/use-theme';

// Sample conversation data
const CONVERSATIONS = [
  {
    id: '1',
    name: 'Sarah Johnson',
    initials: 'SJ',
    color: '#2563eb',
    lastMessage: 'Thank you for the prayer guide! I have a question about...',
    time: '2m ago',
    unread: 3,
    online: true,
    pinned: true,
    maturity: 'New Believer',
    type: 'seeker' as const,
  },
  {
    id: '2',
    name: 'Daniel Mekonnen',
    initials: 'DM',
    color: '#10b981',
    lastMessage: 'I finished reading the chapter you assigned',
    time: '15m ago',
    unread: 1,
    online: true,
    pinned: false,
    maturity: 'Seeker',
    type: 'seeker' as const,
  },
  {
    id: '3',
    name: 'Mentor Group — Ethiopia',
    initials: 'MG',
    color: '#8b5cf6',
    lastMessage: 'John: Has anyone tried the new content series?',
    time: '1h ago',
    unread: 5,
    online: false,
    pinned: false,
    maturity: '',
    type: 'group' as const,
  },
  {
    id: '4',
    name: 'Maria Garcia',
    initials: 'MG',
    color: '#f59e0b',
    lastMessage: 'Can we schedule a call this week?',
    time: '2h ago',
    unread: 0,
    online: false,
    pinned: false,
    maturity: 'Growing',
    type: 'seeker' as const,
  },
  {
    id: '5',
    name: 'James Wilson',
    initials: 'JW',
    color: '#ef4444',
    lastMessage: 'I accepted Christ today! 🙏',
    time: '3h ago',
    unread: 0,
    online: false,
    pinned: true,
    maturity: 'New Believer',
    type: 'seeker' as const,
  },
  {
    id: '6',
    name: 'Rachel Thompson',
    initials: 'RT',
    color: '#06b6d4',
    lastMessage: 'Please pray for my family situation',
    time: '5h ago',
    unread: 0,
    online: true,
    pinned: false,
    maturity: 'Interested',
    type: 'seeker' as const,
  },
  {
    id: '7',
    name: 'David Kim',
    initials: 'DK',
    color: '#ec4899',
    lastMessage: 'Completed the Bible Study series! What's next?',
    time: '1d ago',
    unread: 0,
    online: false,
    pinned: false,
    maturity: 'Growing',
    type: 'seeker' as const,
  },
  {
    id: '8',
    name: 'Mentor Group — Prayer',
    initials: 'MP',
    color: '#8b5cf6',
    lastMessage: 'Anna: Let's meet Friday for group prayer',
    time: '1d ago',
    unread: 0,
    online: false,
    pinned: false,
    maturity: '',
    type: 'group' as const,
  },
];

type FilterType = 'all' | 'seekers' | 'groups';

export default function ChatsScreen() {
  const colors = useTheme();
  const insets = useSafeAreaInsets();
  const [filter, setFilter] = useState<FilterType>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const router = useRouter();

  const filteredConversations = CONVERSATIONS.filter((c) => {
    const matchesFilter =
      filter === 'all' ||
      (filter === 'seekers' && c.type === 'seeker') ||
      (filter === 'groups' && c.type === 'group');
    const matchesSearch =
      !searchQuery || c.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  // Sort: pinned first, then by unread, then by time
  const sorted = [...filteredConversations].sort((a, b) => {
    if (a.pinned && !b.pinned) return -1;
    if (!a.pinned && b.pinned) return 1;
    if (a.unread > 0 && b.unread === 0) return -1;
    if (a.unread === 0 && b.unread > 0) return 1;
    return 0;
  });

  const renderConversation = ({ item }: { item: typeof CONVERSATIONS[0] }) => (
    <TouchableOpacity
      style={[styles.chatItem, { borderBottomColor: colors.border }]}
      activeOpacity={0.6}
      onPress={() => router.push(`/chat/${item.id}`)}
    >
      {/* Avatar */}
      <View style={styles.avatarContainer}>
        <View style={[styles.avatar, { backgroundColor: item.color }]}>
          {item.type === 'group' ? (
            <Users size={18} color="#fff" />
          ) : (
            <Text style={styles.avatarText}>{item.initials}</Text>
          )}
        </View>
        {item.online && <View style={styles.onlineDot} />}
      </View>

      {/* Content */}
      <View style={styles.chatContent}>
        <View style={styles.chatTopRow}>
          <View style={styles.chatNameRow}>
            {item.pinned && <Pin size={12} color={colors.mutedForeground} />}
            <Text
              style={[
                styles.chatName,
                { color: colors.foreground },
                item.unread > 0 && styles.chatNameBold,
              ]}
              numberOfLines={1}
            >
              {item.name}
            </Text>
          </View>
          <Text style={[styles.chatTime, { color: item.unread > 0 ? colors.primary : colors.mutedForeground }]}>
            {item.time}
          </Text>
        </View>
        <View style={styles.chatBottomRow}>
          <Text
            style={[
              styles.chatMessage,
              { color: item.unread > 0 ? colors.foreground : colors.mutedForeground },
              item.unread > 0 && { fontFamily: 'DMSans_600SemiBold' },
            ]}
            numberOfLines={1}
          >
            {item.lastMessage}
          </Text>
          {item.unread > 0 && (
            <View style={[styles.unreadBadge, { backgroundColor: colors.primary }]}>
              <Text style={styles.unreadText}>{item.unread}</Text>
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );

  const filters: { key: FilterType; label: string }[] = [
    { key: 'all', label: 'All' },
    { key: 'seekers', label: 'Seekers' },
    { key: 'groups', label: 'Groups' },
  ];

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>Chats</Text>
      </View>

      {/* Search */}
      <View style={styles.searchContainer}>
        <View style={[styles.searchBar, { backgroundColor: colors.secondary }]}>
          <Search size={18} color={colors.mutedForeground} />
          <TextInput
            style={[styles.searchInput, { color: colors.foreground }]}
            placeholder="Search conversations..."
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

      {/* Conversation List */}
      <FlatList
        data={sorted}
        renderItem={renderConversation}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingBottom: 100 + insets.bottom }}
        showsVerticalScrollIndicator={false}
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
    paddingBottom: 8,
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

  // Chat Item
  chatItem: {
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
    width: 52,
    height: 52,
    borderRadius: 26,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontFamily: 'DMSans_700Bold',
    fontSize: 18,
    color: '#fff',
  },
  onlineDot: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#10b981',
    borderWidth: 2.5,
    borderColor: '#fff',
  },

  // Content
  chatContent: {
    flex: 1,
  },
  chatTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  chatNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    flex: 1,
    marginRight: 8,
  },
  chatName: {
    fontFamily: 'DMSans_500Medium',
    fontSize: 16,
    flexShrink: 1,
  },
  chatNameBold: {
    fontFamily: 'DMSans_700Bold',
  },
  chatTime: {
    fontFamily: 'DMSans_500Medium',
    fontSize: 12,
  },
  chatBottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  chatMessage: {
    fontFamily: 'DMSans_500Medium',
    fontSize: 14,
    flex: 1,
  },
  unreadBadge: {
    minWidth: 22,
    height: 22,
    borderRadius: 11,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
  },
  unreadText: {
    fontFamily: 'DMSans_700Bold',
    fontSize: 11,
    color: '#fff',
  },
});
