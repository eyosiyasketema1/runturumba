import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Modal,
  Pressable,
  LayoutAnimation,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import {
  ArrowLeft,
  MessageCircle,
  MoreVertical,
  Calendar,
  BookOpen,
  Target,
  ChevronDown,
  Plus,
  Send,
  Edit3,
  Trash2,
  Users,
  Hash,
  RefreshCw,
  Globe,
  Mail,
  Phone,
  MapPin,
  CheckCircle2,
  Clock,
  Circle,
  UserCheck,
  Sparkles,
  Brain,
  TrendingDown,
  Gauge,
  Heart,
  Zap,
} from 'lucide-react-native';
import { useTheme } from '@/hooks/use-theme';
import { MaturityColors } from '@/constants/theme';

// ─── Constants ──────────────────────────────────────────────────────────────

const MATURITY_OPTIONS = ['Interested', 'Pre-Seeker', 'Seeker', 'New Believer', 'Growing', 'Mature', 'Leader'];
const STATUS_OPTIONS = ['Active', 'Pending', 'Inactive', 'Graduated', 'Archived'];
const STATUS_COLORS: Record<string, string> = { Active: '#10b981', Pending: '#f59e0b', Inactive: '#94a3b8', Graduated: '#8b5cf6', Archived: '#64748b' };
const PLATFORM_COLORS: Record<string, string> = { WhatsApp: '#25D366', Telegram: '#0088cc', SMS: '#f59e0b', Email: '#8b5cf6' };
const MILESTONE_COLORS: Record<string, string> = { done: '#10b981', progress: '#f59e0b', pending: '#94a3b8' };
const STAGE_COLORS: Record<string, string> = { Touchpoint: '#94a3b8', Engaged: '#3b82f6', 'Active Journey': '#10b981', Decision: '#8b5cf6' };

function engColor(s: number) { return s < 30 ? '#ef4444' : s < 60 ? '#f59e0b' : '#10b981'; }

// ─── Mock Data ──────────────────────────────────────────────────────────────

const SEEKERS_DATA: Record<string, any> = {
  '1': {
    name: 'Sarah Johnson', initials: 'SJ', color: '#2563eb',
    maturity: 'New Believer', status: 'Active', platform: 'WhatsApp',
    lastActive: '2m ago', online: true,
    email: 'sarah.j@email.com', phone: '+1 (555) 123-4567',
    language: 'English', location: 'Addis Ababa, Ethiopia', joinedDate: 'Jan 15, 2026',
    preferredChannel: 'WhatsApp',
    spiritualBackground: 'Attended church occasionally growing up, renewed interest after life event',
    engagementScore: 85, totalMessages: 156, groupCount: 2, notesCount: 3,
    campaign: 'Easter Outreach 2026',
    groups: ['Women of Faith', 'Sunday Study'],
    tags: ['responsive', 'prayer-warrior', 'new-convert'],
    mentor: { name: 'Pastor Michael', initials: 'PM', color: '#4f46e5', specialty: 'New Believer Care', experience: '5 years' },
    // AI Classification
    aiClassification: {
      confidence: 92,
      needs: ['Spiritual guidance', 'Community connection', 'Prayer support'],
      interests: [
        { label: 'Prayer', tone: 'positive' },
        { label: 'Bible Study', tone: 'positive' },
        { label: 'Fasting', tone: 'curious' },
        { label: 'Community', tone: 'positive' },
      ],
    },
    aiSummary: 'Sarah is a recently committed believer who found faith through a personal life experience. She shows strong engagement with prayer and Bible study content. Her primary needs are building consistent spiritual habits and finding community. Recommend focusing on prayer fundamentals and connecting her to a small group.',
    // Intelligence
    intelligence: {
      dropoutRisk: { value: 'Low', subtitle: '12% probability' },
      learningPace: { value: 'Steady', subtitle: '~2 lessons/week' },
      sentiment: { value: 'Positive', subtitle: 'Trending up' },
      topicAffinity: { value: 'Prayer', subtitle: 'Highest engagement' },
    },
    // Journey Timeline Events
    timelineEvents: [
      { id: 't1', label: 'Completed intake form', date: 'Jan 15', color: '#2563eb' },
      { id: 't2', label: 'AI classified as New Believer', date: 'Jan 16', color: '#8b5cf6' },
      { id: 't3', label: 'Matched with Pastor Michael', date: 'Jan 18', color: '#10b981' },
      { id: 't4', label: 'Enrolled in Easter Outreach', date: 'Feb 1', color: '#f59e0b' },
      { id: 't5', label: 'Completed Lesson 3: Prayer', date: 'Mar 10', color: '#10b981' },
      { id: 't6', label: 'Accepted Christ', date: 'Feb 10', color: '#ec4899' },
    ],
    currentJourney: {
      name: 'Foundations of Faith', stage: 'Active Journey', progress: 0.6,
      currentLesson: 4, totalLessons: 7, startedDate: 'Feb 1, 2026',
      source: 'WhatsApp', language: 'English', validation: 'Confirmed',
    },
    milestones: [
      { id: '1', label: 'First Contact', state: 'done', date: 'Jan 15' },
      { id: '2', label: 'Accepted Christ', state: 'done', date: 'Feb 10' },
      { id: '3', label: 'Started Journey', state: 'done', date: 'Feb 15' },
      { id: '4', label: 'First Prayer', state: 'done', date: 'Mar 1' },
      { id: '5', label: 'Bible Study', state: 'progress', date: '' },
      { id: '6', label: 'Community Group', state: 'pending', date: '' },
      { id: '7', label: 'Baptism', state: 'pending', date: '' },
    ],
    notes: [
      { id: '1', text: 'Sarah expressed interest after attending Sunday service. Very open to learning.', date: 'Jan 15, 2026', author: 'You' },
      { id: '2', text: 'Had a breakthrough moment during prayer — she felt God speaking to her for the first time.', date: 'Mar 1, 2026', author: 'You' },
      { id: '3', text: 'Asking good questions about fasting. Consider sending the fasting guide.', date: 'Apr 20, 2026', author: 'You' },
    ],
    prayerRequests: [
      { id: '1', text: 'Pray for her family to be open to her new faith', active: true },
      { id: '2', text: 'Guidance in understanding Scripture', active: true },
      { id: '3', text: 'Strength to build consistent prayer habits', active: false },
    ],
  },
  '2': {
    name: 'Daniel Mekonnen', initials: 'DM', color: '#10b981',
    maturity: 'Seeker', status: 'Active', platform: 'Telegram',
    lastActive: '15m ago', online: true,
    email: 'daniel.m@email.com', phone: '+251 91 234 5678',
    language: 'Amharic', location: 'Addis Ababa, Ethiopia', joinedDate: 'Mar 5, 2026',
    preferredChannel: 'Telegram',
    spiritualBackground: 'Muslim background, exploring Christianity through a friend',
    engagementScore: 72, totalMessages: 89, groupCount: 1, notesCount: 1,
    campaign: 'Youth Digital Outreach',
    groups: ['Youth Seekers'], tags: ['curious', 'needs-followup'],
    mentor: { name: 'Sister Abeba', initials: 'SA', color: '#10b981', specialty: 'Seeker Care', experience: '3 years' },
    aiClassification: {
      confidence: 78,
      needs: ['Understanding basics', 'Safe space to ask questions', 'Cultural sensitivity'],
      interests: [
        { label: 'Christianity basics', tone: 'curious' },
        { label: 'Comparative religion', tone: 'neutral' },
        { label: 'Prayer', tone: 'curious' },
      ],
    },
    aiSummary: 'Daniel is exploring Christianity from a Muslim background, introduced through a friend. He is curious but cautious. Approach should prioritize trust-building and answering questions without pressure. High potential for deeper engagement if given time.',
    intelligence: {
      dropoutRisk: { value: 'Medium', subtitle: '35% probability' },
      learningPace: { value: 'Slow', subtitle: '~1 lesson/week' },
      sentiment: { value: 'Neutral', subtitle: 'Stable' },
      topicAffinity: { value: 'Basics', subtitle: 'Foundation topics' },
    },
    timelineEvents: [
      { id: 't1', label: 'Completed intake form', date: 'Mar 5', color: '#2563eb' },
      { id: 't2', label: 'AI classified as Seeker', date: 'Mar 6', color: '#8b5cf6' },
      { id: 't3', label: 'Matched with Sister Abeba', date: 'Mar 8', color: '#10b981' },
      { id: 't4', label: 'Enrolled in Youth Outreach', date: 'Apr 1', color: '#f59e0b' },
    ],
    currentJourney: {
      name: 'Prayer Basics', stage: 'Engaged', progress: 0.3,
      currentLesson: 2, totalLessons: 5, startedDate: 'Apr 1, 2026',
      source: 'Telegram', language: 'Amharic', validation: 'Pending',
    },
    milestones: [
      { id: '1', label: 'First Contact', state: 'done', date: 'Mar 5' },
      { id: '2', label: 'Started Journey', state: 'done', date: 'Apr 1' },
      { id: '3', label: 'Regular Check-ins', state: 'progress', date: '' },
      { id: '4', label: 'Accepted Christ', state: 'pending', date: '' },
    ],
    notes: [{ id: '1', text: 'Daniel found us through a friend. Very curious about Christianity.', date: 'Mar 5, 2026', author: 'You' }],
    prayerRequests: [{ id: '1', text: 'Open heart to receive Christ', active: true }],
  },
};

function getSeekerData(id: string) { return SEEKERS_DATA[id] || SEEKERS_DATA['1']; }

// ─── Component ──────────────────────────────────────────────────────────────

export default function SeekerDetailScreen() {
  const colors = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { id, tab } = useLocalSearchParams();
  const seeker = getSeekerData(id as string);

  const tabMap: Record<string, 'profile' | 'journey' | 'milestones' | 'notes' | 'ai'> = {
    profile: 'profile',
    journey: 'journey',
    milestones: 'milestones',
    notes: 'notes',
    ai: 'ai',
  };
  const initialTab = (tab && typeof tab === 'string' && tabMap[tab]) ? tabMap[tab] : 'profile';

  const [activeTab, setActiveTab] = useState<'profile' | 'journey' | 'milestones' | 'notes' | 'ai'>(initialTab);
  const [newNote, setNewNote] = useState('');
  const [maturity, setMaturity] = useState(seeker.maturity);
  const [status, setStatus] = useState(seeker.status);
  const [showMaturityPicker, setShowMaturityPicker] = useState(false);
  const [showStatusPicker, setShowStatusPicker] = useState(false);
  const [showReassignForm, setShowReassignForm] = useState(false);
  const [reassignReason, setReassignReason] = useState('');

  const mColor = MaturityColors[maturity] || '#94a3b8';
  const sColor = STATUS_COLORS[status] || '#94a3b8';
  const pColor = PLATFORM_COLORS[seeker.platform] || colors.mutedForeground;
  const eColor = engColor(seeker.engagementScore);

  const tabs = [
    { key: 'profile' as const, label: 'Profile' },
    { key: 'ai' as const, label: 'AI Insights' },
    { key: 'notes' as const, label: 'Notes' },
    { key: 'journey' as const, label: 'Journey' },
    { key: 'milestones' as const, label: 'Milestones' },
  ];

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      {/* ─── Header ────────────────────────────────────────────── */}
      <View style={[styles.header, { paddingTop: insets.top + 8, borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()} activeOpacity={0.7} style={styles.backBtn}>
          <ArrowLeft size={22} color={colors.foreground} />
        </TouchableOpacity>
        <View style={{ flex: 1 }} />
        <TouchableOpacity style={[styles.headerActionBtn, { backgroundColor: colors.secondary }]} activeOpacity={0.7}>
          <MoreVertical size={18} color={colors.foreground} />
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={{ paddingBottom: insets.bottom + 100 }}
        showsVerticalScrollIndicator={false}
      >
        {/* ══════════════════════════════════════════════════════════
            IDENTITY BLOCK — name, avatar, badges
           ══════════════════════════════════════════════════════════ */}
        <View style={styles.identityBlock}>
          {/* Avatar */}
          <View style={[styles.avatar, { backgroundColor: seeker.color }]}>
            <Text style={styles.avatarText}>{seeker.initials}</Text>
            {seeker.online && <View style={styles.onlineDot} />}
          </View>

          {/* Name */}
          <Text style={[styles.name, { color: colors.foreground }]}>{seeker.name}</Text>

          {/* Platform + Last active */}
          <View style={styles.subMeta}>
            <MessageCircle size={12} color={pColor} />
            <Text style={[styles.subMetaText, { color: pColor }]}>{seeker.platform}</Text>
            <Text style={[styles.subMetaDot, { color: colors.border }]}>·</Text>
            <Text style={[styles.subMetaText, { color: colors.mutedForeground }]}>Active {seeker.lastActive}</Text>
          </View>

          {/* Maturity + Status pills — primary interactive element */}
          <View style={styles.pillRow}>
            <TouchableOpacity
              style={[styles.pill, { backgroundColor: mColor + '12', borderColor: mColor + '30' }]}
              onPress={() => setShowMaturityPicker(true)}
              activeOpacity={0.7}
            >
              <View style={[styles.pillDot, { backgroundColor: mColor }]} />
              <Text style={[styles.pillText, { color: mColor }]}>{maturity}</Text>
              <ChevronDown size={11} color={mColor} />
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.pill, { backgroundColor: sColor + '12', borderColor: sColor + '30' }]}
              onPress={() => setShowStatusPicker(true)}
              activeOpacity={0.7}
            >
              <View style={[styles.pillDot, { backgroundColor: sColor }]} />
              <Text style={[styles.pillText, { color: sColor }]}>{status}</Text>
              <ChevronDown size={11} color={sColor} />
            </TouchableOpacity>
          </View>
        </View>

        {/* ══════════════════════════════════════════════════════════
            STATS BAR — compact horizontal metrics
           ══════════════════════════════════════════════════════════ */}
        <View style={styles.statsSection}>
          <View style={[styles.statsBar, { backgroundColor: colors.secondary }]}>
            <View style={styles.stat}>
              <Text style={[styles.statNum, { color: colors.foreground }]}>{seeker.totalMessages}</Text>
              <Text style={[styles.statLbl, { color: colors.mutedForeground }]}>Msgs</Text>
            </View>
            <View style={[styles.statDiv, { backgroundColor: colors.border }]} />
            <View style={styles.stat}>
              <Text style={[styles.statNum, { color: colors.foreground }]}>{seeker.groupCount}</Text>
              <Text style={[styles.statLbl, { color: colors.mutedForeground }]}>Groups</Text>
            </View>
            <View style={[styles.statDiv, { backgroundColor: colors.border }]} />
            <View style={styles.stat}>
              <Text style={[styles.statNum, { color: colors.foreground }]}>{seeker.notesCount}</Text>
              <Text style={[styles.statLbl, { color: colors.mutedForeground }]}>Notes</Text>
            </View>
            <View style={[styles.statDiv, { backgroundColor: colors.border }]} />
            <View style={styles.stat}>
              <Text style={[styles.statNum, { color: eColor }]}>{seeker.engagementScore}%</Text>
              <Text style={[styles.statLbl, { color: colors.mutedForeground }]}>Engage</Text>
            </View>
          </View>
          {/* Thin engagement bar directly under stats for context */}
          <View style={[styles.engBar, { backgroundColor: colors.secondary }]}>
            <View style={[styles.engFill, { backgroundColor: eColor, width: `${seeker.engagementScore}%` }]} />
          </View>
        </View>

        {/* ══════════════════════════════════════════════════════════
            ACTION BUTTONS
           ══════════════════════════════════════════════════════════ */}
        <View style={styles.actionsSection}>
          <TouchableOpacity
            style={[styles.msgBtn, { backgroundColor: colors.primary }]}
            activeOpacity={0.7}
            onPress={() => router.push(`/chat/${id}`)}
          >
            <MessageCircle size={16} color="#fff" />
            <Text style={styles.msgBtnText}>Message</Text>
          </TouchableOpacity>
        </View>

        {/* ══════════════════════════════════════════════════════════
            DIVIDER — visual break before tabs
           ══════════════════════════════════════════════════════════ */}
        <View style={[styles.divider, { backgroundColor: colors.border }]} />

        {/* ══════════════════════════════════════════════════════════
            TABS
           ══════════════════════════════════════════════════════════ */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabScroll} contentContainerStyle={styles.tabRow}>
          {tabs.map((t) => (
            <TouchableOpacity
              key={t.key}
              style={[styles.tab, activeTab === t.key ? styles.tabActive : { backgroundColor: 'transparent' }]}
              onPress={() => setActiveTab(t.key)}
              activeOpacity={0.7}
            >
              <Text style={[
                styles.tabLabel,
                { color: activeTab === t.key ? '#fff' : colors.mutedForeground },
                activeTab === t.key && styles.tabLabelActive,
              ]}>
                {t.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* ──────────────────────────────────────────────────────────
            PROFILE TAB
           ────────────────────────────────────────────────────────── */}
        {activeTab === 'profile' && (
          <View style={styles.content}>

            {/* Contact Details — clean key-value list */}
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <Phone size={14} color={colors.primary} />
                <Text style={[styles.cardTitle, { color: colors.foreground }]}>Contact Details</Text>
              </View>
              {[
                { key: 'Phone', val: seeker.phone },
                { key: 'Email', val: seeker.email },
                { key: 'Language', val: seeker.language },
                { key: 'Location', val: seeker.location },
                { key: 'Channel', val: seeker.preferredChannel },
                { key: 'Campaign', val: seeker.campaign },
                { key: 'Joined', val: seeker.joinedDate },
              ].map((row, i) => (
                <View key={row.key} style={[styles.kvRow, i > 0 && { borderTopWidth: 0.5, borderTopColor: colors.border }]}>
                  <Text style={[styles.kvKey, { color: colors.mutedForeground }]}>{row.key}</Text>
                  <Text style={[styles.kvVal, { color: colors.foreground }]} numberOfLines={1}>{row.val}</Text>
                </View>
              ))}
            </View>

            {/* Spiritual Background */}
            {seeker.spiritualBackground && (
              <View style={styles.card}>
                <View style={styles.cardHeader}>
                  <Heart size={14} color="#ec4899" />
                  <Text style={[styles.cardTitle, { color: colors.foreground }]}>Spiritual Background</Text>
                </View>
                <Text style={[styles.bgText, { color: colors.foreground }]}>{seeker.spiritualBackground}</Text>
              </View>
            )}

            {/* Mentor Assignment — highlighted card */}
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <UserCheck size={14} color="#8b5cf6" />
                <Text style={[styles.cardTitle, { color: colors.foreground }]}>Mentor</Text>
              </View>
              {seeker.mentor ? (
                <View style={styles.mentorRow}>
                  <View style={[styles.mentorAv, { backgroundColor: seeker.mentor.color }]}>
                    <Text style={styles.mentorAvText}>{seeker.mentor.initials}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.mentorName, { color: colors.foreground }]}>{seeker.mentor.name}</Text>
                    <Text style={[styles.mentorSub, { color: colors.mutedForeground }]}>
                      {seeker.mentor.specialty} · {seeker.mentor.experience}
                    </Text>
                  </View>
                </View>
              ) : (
                <Text style={[styles.emptyLine, { color: colors.mutedForeground }]}>No mentor assigned</Text>
              )}

              {!showReassignForm ? (
                <TouchableOpacity
                  style={[styles.dashedBtn, { borderColor: colors.border }]}
                  onPress={() => { LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut); setShowReassignForm(true); }}
                  activeOpacity={0.7}
                >
                  <RefreshCw size={13} color={colors.mutedForeground} />
                  <Text style={[styles.dashedBtnText, { color: colors.mutedForeground }]}>Request Reassignment</Text>
                </TouchableOpacity>
              ) : (
                <View style={[styles.inlineForm, { backgroundColor: colors.secondary }]}>
                  <TextInput
                    style={[styles.inlineInput, { color: colors.foreground, backgroundColor: colors.background }]}
                    placeholder="e.g. Language barrier, scheduling conflict..."
                    placeholderTextColor={colors.mutedForeground}
                    value={reassignReason}
                    onChangeText={setReassignReason}
                    multiline
                  />
                  <View style={styles.inlineActions}>
                    <TouchableOpacity onPress={() => { LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut); setShowReassignForm(false); setReassignReason(''); }} activeOpacity={0.7}>
                      <Text style={[styles.inlineCancel, { color: colors.mutedForeground }]}>Cancel</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.inlineSubmit, { backgroundColor: reassignReason.trim() ? colors.primary : colors.border }]}
                      disabled={!reassignReason.trim()}
                      activeOpacity={0.7}
                    >
                      <Text style={{ fontFamily: 'DMSans_700Bold', fontSize: 12, color: reassignReason.trim() ? '#fff' : colors.mutedForeground }}>Submit</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}
            </View>

            {/* Groups & Tags — visual chips */}
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <Users size={14} color="#2563eb" />
                <Text style={[styles.cardTitle, { color: colors.foreground }]}>Groups</Text>
              </View>
              {seeker.groups.length > 0 ? (
                <View style={styles.chips}>
                  {seeker.groups.map((g: string) => (
                    <View key={g} style={[styles.groupChip, { backgroundColor: '#eff6ff' }]}>
                      <View style={{ width: 5, height: 5, borderRadius: 3, backgroundColor: '#2563eb' }} />
                      <Text style={styles.groupChipText}>{g}</Text>
                    </View>
                  ))}
                </View>
              ) : (
                <Text style={[styles.emptyLine, { color: colors.mutedForeground }]}>No groups</Text>
              )}

              {seeker.tags.length > 0 && (
                <>
                  <View style={styles.cardSubHeader}>
                    <Hash size={12} color={colors.mutedForeground} />
                    <Text style={[styles.cardSubTitle, { color: colors.mutedForeground }]}>Tags</Text>
                  </View>
                  <View style={styles.chips}>
                    {seeker.tags.map((t: string) => (
                      <View key={t} style={[styles.tagChip, { backgroundColor: colors.secondary }]}>
                        <Text style={[styles.tagChipText, { color: colors.foreground }]}>#{t}</Text>
                      </View>
                    ))}
                  </View>
                </>
              )}
            </View>
          </View>
        )}

        {/* ──────────────────────────────────────────────────────────
            JOURNEY TAB
           ────────────────────────────────────────────────────────── */}
        {activeTab === 'journey' && (
          <View style={styles.content}>
            {seeker.currentJourney ? (
              <>
                {/* Main journey card */}
                <View style={styles.card}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                    <Text style={[styles.journeyTitle, { color: colors.foreground }]}>{seeker.currentJourney.name}</Text>
                    <View style={[styles.stagePill, { backgroundColor: (STAGE_COLORS[seeker.currentJourney.stage] || '#94a3b8') + '15' }]}>
                      <Text style={[styles.stagePillText, { color: STAGE_COLORS[seeker.currentJourney.stage] || '#94a3b8' }]}>
                        {seeker.currentJourney.stage}
                      </Text>
                    </View>
                  </View>

                  {/* Big progress indicator */}
                  <View style={styles.progressBlock}>
                    <View style={styles.progressTop}>
                      <Text style={[styles.progressLbl, { color: colors.mutedForeground }]}>Lesson Progress</Text>
                      <Text style={[styles.progressNum, { color: colors.foreground }]}>
                        {seeker.currentJourney.currentLesson}
                        <Text style={{ color: colors.mutedForeground, fontFamily: 'DMSans_500Medium' }}> / {seeker.currentJourney.totalLessons}</Text>
                      </Text>
                    </View>
                    <View style={[styles.progressTrack, { backgroundColor: colors.secondary }]}>
                      <View style={[styles.progressFill, { backgroundColor: colors.primary, width: `${Math.round(seeker.currentJourney.progress * 100)}%` }]} />
                    </View>
                    <Text style={[styles.progressPct, { color: colors.primary }]}>
                      {Math.round(seeker.currentJourney.progress * 100)}% complete
                    </Text>
                  </View>
                </View>

                {/* Details — clean grid */}
                <View style={styles.card}>
                  <Text style={[styles.cardTitle, { color: colors.foreground, marginBottom: 12 }]}>Details</Text>
                  {[
                    { key: 'Source', val: seeker.currentJourney.source },
                    { key: 'Language', val: seeker.currentJourney.language },
                    { key: 'Started', val: seeker.currentJourney.startedDate },
                  ].map((row, i) => (
                    <View key={row.key} style={[styles.kvRow, i > 0 && { borderTopWidth: 0.5, borderTopColor: colors.border }]}>
                      <Text style={[styles.kvKey, { color: colors.mutedForeground }]}>{row.key}</Text>
                      <Text style={[styles.kvVal, { color: colors.foreground }]}>{row.val}</Text>
                    </View>
                  ))}
                  <View style={[styles.kvRow, { borderTopWidth: 0.5, borderTopColor: colors.border }]}>
                    <Text style={[styles.kvKey, { color: colors.mutedForeground }]}>Validation</Text>
                    <View style={[styles.validBadge, { backgroundColor: seeker.currentJourney.validation === 'Confirmed' ? '#ecfdf5' : '#fffbeb' }]}>
                      <Text style={{ fontFamily: 'DMSans_600SemiBold', fontSize: 11, color: seeker.currentJourney.validation === 'Confirmed' ? '#10b981' : '#f59e0b' }}>
                        {seeker.currentJourney.validation}
                      </Text>
                    </View>
                  </View>
                </View>

                {/* Stage Pipeline — visual progression */}
                <View style={styles.card}>
                  <Text style={[styles.cardTitle, { color: colors.foreground, marginBottom: 16 }]}>Stage Pipeline</Text>
                  <View style={styles.pipeline}>
                    {['Touchpoint', 'Engaged', 'Active Journey', 'Decision'].map((stage, idx) => {
                      const stages = ['Touchpoint', 'Engaged', 'Active Journey', 'Decision'];
                      const curIdx = stages.indexOf(seeker.currentJourney.stage);
                      const past = idx < curIdx;
                      const current = idx === curIdx;
                      const isLast = idx === stages.length - 1;
                      return (
                        <View key={stage} style={styles.pipeStep}>
                          <View style={styles.pipeRow}>
                            <View style={[
                              styles.pipeCircle,
                              {
                                backgroundColor: past ? colors.primary + '20' : current ? colors.primary : colors.secondary,
                                borderColor: past || current ? colors.primary : colors.border,
                              },
                            ]}>
                              {past ? <CheckCircle2 size={11} color={colors.primary} /> :
                                <Text style={[styles.pipeNum, { color: current ? '#fff' : colors.mutedForeground }]}>{idx + 1}</Text>
                              }
                            </View>
                            {!isLast && <View style={[styles.pipeLine, { backgroundColor: past ? colors.primary : colors.border }]} />}
                          </View>
                          <Text style={[styles.pipeLbl, { color: current ? colors.primary : past ? colors.foreground : colors.mutedForeground }, current && { fontFamily: 'DMSans_700Bold' }]} numberOfLines={2}>
                            {stage}
                          </Text>
                        </View>
                      );
                    })}
                  </View>
                </View>

                {/* Journey Timeline Events */}
                {seeker.timelineEvents && seeker.timelineEvents.length > 0 && (
                  <View style={styles.card}>
                    <View style={styles.cardHeader}>
                      <Clock size={14} color={colors.mutedForeground} />
                      <Text style={[styles.cardTitle, { color: colors.foreground }]}>Activity Timeline</Text>
                    </View>
                    {seeker.timelineEvents.map((evt: any, idx: number) => {
                      const isLast = idx === seeker.timelineEvents.length - 1;
                      return (
                        <View key={evt.id} style={styles.tlRow}>
                          <View style={styles.tlDotCol}>
                            <View style={[styles.tlDot, { backgroundColor: evt.color }]} />
                            {!isLast && <View style={[styles.tlLine, { backgroundColor: colors.border }]} />}
                          </View>
                          <View style={styles.tlContent}>
                            <Text style={[styles.tlLabel, { color: colors.foreground }]}>{evt.label}</Text>
                            <Text style={[styles.tlDate, { color: colors.mutedForeground }]}>{evt.date}</Text>
                          </View>
                        </View>
                      );
                    })}
                  </View>
                )}
              </>
            ) : (
              <View style={styles.emptyBlock}>
                <BookOpen size={32} color={colors.mutedForeground} />
                <Text style={[styles.emptyTitle, { color: colors.foreground }]}>No Journey</Text>
                <Text style={[styles.emptyDesc, { color: colors.mutedForeground }]}>Assign a content journey to begin</Text>
              </View>
            )}
          </View>
        )}

        {/* ──────────────────────────────────────────────────────────
            MILESTONES TAB
           ────────────────────────────────────────────────────────── */}
        {activeTab === 'milestones' && (
          <View style={styles.content}>
            {/* Visual timeline */}
            {seeker.milestones.map((m: any, idx: number) => {
              const sc = MILESTONE_COLORS[m.state];
              const Icon = m.state === 'done' ? CheckCircle2 : m.state === 'progress' ? Clock : Circle;
              const label = m.state === 'done' ? 'Complete' : m.state === 'progress' ? 'In Progress' : 'Pending';
              const isLast = idx === seeker.milestones.length - 1;

              return (
                <View key={m.id} style={styles.msRow}>
                  {/* Timeline connector */}
                  <View style={styles.msTimeline}>
                    <View style={[styles.msDot, { backgroundColor: m.state === 'done' ? sc : 'transparent', borderColor: sc }]} />
                    {!isLast && <View style={[styles.msLine, { backgroundColor: m.state === 'done' ? sc + '40' : colors.border }]} />}
                  </View>
                  {/* Content */}
                  <View style={[
                    styles.msCard,
                    {
                      backgroundColor: m.state === 'done' ? '#f0fdf4' : m.state === 'progress' ? '#fffbeb' : colors.secondary,
                      borderColor: sc + '25',
                    },
                  ]}>
                    <View style={styles.msCardTop}>
                      <Icon size={14} color={sc} />
                      <Text style={[styles.msLabel, { color: m.state === 'pending' ? colors.mutedForeground : colors.foreground }]}>{m.label}</Text>
                      <View style={[styles.msBadge, { backgroundColor: sc + '15' }]}>
                        <Text style={[styles.msBadgeText, { color: sc }]}>{label}</Text>
                      </View>
                    </View>
                    {m.date ? <Text style={[styles.msDate, { color: colors.mutedForeground }]}>{m.date}</Text> : null}
                  </View>
                </View>
              );
            })}
          </View>
        )}

        {/* ──────────────────────────────────────────────────────────
            NOTES TAB
           ────────────────────────────────────────────────────────── */}
        {activeTab === 'notes' && (
          <View style={styles.content}>
            {/* Compose */}
            <View style={[styles.card, { gap: 10 }]}>
              <TextInput
                style={[styles.noteInput, { color: colors.foreground, backgroundColor: colors.secondary }]}
                placeholder="Add a note..."
                placeholderTextColor={colors.mutedForeground}
                value={newNote}
                onChangeText={setNewNote}
                multiline
              />
              <TouchableOpacity
                style={[styles.addBtn, { backgroundColor: newNote.trim() ? colors.primary : colors.secondary }]}
                disabled={!newNote.trim()}
                activeOpacity={0.7}
              >
                <Plus size={14} color={newNote.trim() ? '#fff' : colors.mutedForeground} />
                <Text style={{ fontFamily: 'DMSans_600SemiBold', fontSize: 13, color: newNote.trim() ? '#fff' : colors.mutedForeground }}>
                  Add Note
                </Text>
              </TouchableOpacity>
            </View>

            {/* Prayer Requests */}
            {seeker.prayerRequests.length > 0 && (
              <View style={styles.card}>
                <View style={styles.cardHeader}>
                  <Target size={14} color="#f59e0b" />
                  <Text style={[styles.cardTitle, { color: colors.foreground }]}>Prayer Requests</Text>
                </View>
                {seeker.prayerRequests.map((p: any, i: number) => (
                  <View key={p.id} style={[styles.prayerRow, i > 0 && { borderTopWidth: 0.5, borderTopColor: colors.border }]}>
                    <View style={[styles.prayerDot, { backgroundColor: p.active ? '#f59e0b' : '#10b981' }]} />
                    <Text style={[styles.prayerText, { color: p.active ? colors.foreground : colors.mutedForeground }, !p.active && { textDecorationLine: 'line-through' }]}>
                      {p.text}
                    </Text>
                  </View>
                ))}
              </View>
            )}

            {/* Notes list */}
            <View style={styles.notesHeader}>
              <Text style={[styles.notesHeaderText, { color: colors.mutedForeground }]}>NOTES ({seeker.notes.length})</Text>
            </View>
            {seeker.notes.map((note: any) => (
              <View key={note.id} style={[styles.noteItem, { backgroundColor: colors.secondary }]}>
                <Text style={[styles.noteBody, { color: colors.foreground }]}>{note.text}</Text>
                <View style={styles.noteFoot}>
                  <Text style={[styles.noteAuthor, { color: colors.primary }]}>{note.author}</Text>
                  <Text style={[styles.noteTime, { color: colors.mutedForeground }]}>{note.date}</Text>
                  <View style={{ flex: 1 }} />
                  <TouchableOpacity activeOpacity={0.7} style={{ padding: 4 }}>
                    <Edit3 size={13} color={colors.mutedForeground} />
                  </TouchableOpacity>
                  <TouchableOpacity activeOpacity={0.7} style={{ padding: 4 }}>
                    <Trash2 size={13} color={colors.mutedForeground} />
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* ──────────────────────────────────────────────────────────
            AI INSIGHTS TAB
           ────────────────────────────────────────────────────────── */}
        {activeTab === 'ai' && (
          <View style={styles.content}>
            {/* AI Classification */}
            {seeker.aiClassification && (
              <View style={styles.card}>
                <View style={styles.cardHeader}>
                  <Brain size={14} color={colors.mutedForeground} />
                  <Text style={[styles.cardTitle, { color: colors.foreground }]}>AI Classification</Text>
                  <View style={[styles.confBadge, { backgroundColor: colors.secondary }]}>
                    <Text style={[styles.confText, { color: colors.foreground }]}>{seeker.aiClassification.confidence}% confidence</Text>
                  </View>
                </View>

                {/* Maturity */}
                <View style={[styles.kvRow, { paddingTop: 0 }]}>
                  <Text style={[styles.kvKey, { color: colors.mutedForeground }]}>Maturity</Text>
                  <View style={[styles.pill, { backgroundColor: mColor + '12', borderColor: mColor + '30' }]}>
                    <View style={[styles.pillDot, { backgroundColor: mColor }]} />
                    <Text style={[styles.pillText, { color: mColor }]}>{maturity}</Text>
                  </View>
                </View>

                {/* Identified Needs */}
                <Text style={[styles.aiSubLabel, { color: colors.mutedForeground }]}>Identified Needs</Text>
                <View style={styles.chips}>
                  {seeker.aiClassification.needs.map((need: string) => (
                    <View key={need} style={[styles.needChip, { backgroundColor: colors.secondary }]}>
                      <Text style={[styles.needChipText, { color: colors.foreground }]}>{need}</Text>
                    </View>
                  ))}
                </View>

                {/* Key Interests */}
                <Text style={[styles.aiSubLabel, { color: colors.mutedForeground, marginTop: 14 }]}>Key Interests</Text>
                <View style={styles.chips}>
                  {seeker.aiClassification.interests.map((int: any) => (
                    <View key={int.label} style={[styles.interestChip, { backgroundColor: colors.secondary, borderColor: colors.border }]}>
                      <Text style={[styles.interestChipText, { color: colors.foreground }]}>{int.label}</Text>
                    </View>
                  ))}
                </View>
              </View>
            )}

            {/* AI Summary */}
            {seeker.aiSummary && (
              <View style={styles.card}>
                <View style={styles.cardHeader}>
                  <Sparkles size={14} color={colors.mutedForeground} />
                  <Text style={[styles.cardTitle, { color: colors.foreground }]}>AI Summary</Text>
                </View>
                <Text style={[styles.aiSummaryText, { color: colors.foreground }]}>{seeker.aiSummary}</Text>
              </View>
            )}

            {/* Intelligence Quick Stats */}
            {seeker.intelligence && (
              <View style={styles.card}>
                <View style={styles.cardHeader}>
                  <Zap size={14} color={colors.mutedForeground} />
                  <Text style={[styles.cardTitle, { color: colors.foreground }]}>Intelligence</Text>
                </View>
                <View style={styles.intelGrid}>
                  {[
                    { icon: TrendingDown, label: 'Dropout Risk', ...seeker.intelligence.dropoutRisk },
                    { icon: Gauge, label: 'Learning Pace', ...seeker.intelligence.learningPace },
                    { icon: Heart, label: 'Sentiment', ...seeker.intelligence.sentiment },
                    { icon: Target, label: 'Topic Affinity', ...seeker.intelligence.topicAffinity },
                  ].map((item) => {
                    const Icon = item.icon;
                    return (
                      <View key={item.label} style={[styles.intelCard, { backgroundColor: colors.secondary }]}>
                        <View style={styles.intelIconRow}>
                          <Icon size={14} color={colors.mutedForeground} />
                          <Text style={[styles.intelLabel, { color: colors.mutedForeground }]}>{item.label}</Text>
                        </View>
                        <Text style={[styles.intelValue, { color: colors.foreground }]}>{item.value}</Text>
                        <Text style={[styles.intelSub, { color: colors.mutedForeground }]}>{item.subtitle}</Text>
                      </View>
                    );
                  })}
                </View>
              </View>
            )}
          </View>
        )}
      </ScrollView>

      {/* ─── Maturity Picker ──────────────────────────────────────── */}
      <Modal visible={showMaturityPicker} transparent animationType="fade" onRequestClose={() => setShowMaturityPicker(false)}>
        <Pressable style={styles.overlay} onPress={() => setShowMaturityPicker(false)}>
          <View style={[styles.picker, { backgroundColor: colors.card }]}>
            <Text style={[styles.pickerHead, { color: colors.foreground }]}>Maturity Level</Text>
            {MATURITY_OPTIONS.map((level) => {
              const c = MaturityColors[level] || '#94a3b8';
              const sel = maturity === level;
              return (
                <TouchableOpacity key={level} style={[styles.pickItem, sel && { backgroundColor: colors.secondary }]}
                  onPress={() => { LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut); setMaturity(level); setShowMaturityPicker(false); }}
                  activeOpacity={0.7}
                >
                  <View style={[styles.pickDot, { backgroundColor: c }]} />
                  <Text style={[styles.pickText, { color: colors.foreground }]}>{level}</Text>
                  {sel && <CheckCircle2 size={16} color={colors.primary} />}
                </TouchableOpacity>
              );
            })}
          </View>
        </Pressable>
      </Modal>

      {/* ─── Status Picker ────────────────────────────────────────── */}
      <Modal visible={showStatusPicker} transparent animationType="fade" onRequestClose={() => setShowStatusPicker(false)}>
        <Pressable style={styles.overlay} onPress={() => setShowStatusPicker(false)}>
          <View style={[styles.picker, { backgroundColor: colors.card }]}>
            <Text style={[styles.pickerHead, { color: colors.foreground }]}>Status</Text>
            {STATUS_OPTIONS.map((s) => {
              const c = STATUS_COLORS[s] || '#94a3b8';
              const sel = status === s;
              return (
                <TouchableOpacity key={s} style={[styles.pickItem, sel && { backgroundColor: colors.secondary }]}
                  onPress={() => { LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut); setStatus(s); setShowStatusPicker(false); }}
                  activeOpacity={0.7}
                >
                  <View style={[styles.pickDot, { backgroundColor: c }]} />
                  <Text style={[styles.pickText, { color: colors.foreground }]}>{s}</Text>
                  {sel && <CheckCircle2 size={16} color={colors.primary} />}
                </TouchableOpacity>
              );
            })}
          </View>
        </Pressable>
      </Modal>
    </View>
  );
}

// ─── Styles ─────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  screen: { flex: 1 },

  // Header — minimal, back + menu only
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingBottom: 10, borderBottomWidth: 0.5 },
  backBtn: { padding: 4 },
  headerActionBtn: { width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center' },

  // Identity — centered, high visual weight
  identityBlock: { alignItems: 'center', paddingTop: 24, paddingBottom: 4, paddingHorizontal: 20 },
  avatar: { width: 64, height: 64, borderRadius: 32, justifyContent: 'center', alignItems: 'center', position: 'relative', marginBottom: 12 },
  avatarText: { fontFamily: 'DMSans_700Bold', fontSize: 22, color: '#fff' },
  onlineDot: { position: 'absolute', bottom: 2, right: 2, width: 15, height: 15, borderRadius: 8, backgroundColor: '#10b981', borderWidth: 2.5, borderColor: '#fff' },
  name: { fontFamily: 'DMSans_700Bold', fontSize: 22, letterSpacing: -0.3, marginBottom: 4 },
  subMeta: { flexDirection: 'row', alignItems: 'center', gap: 5, marginBottom: 14 },
  subMetaText: { fontFamily: 'DMSans_500Medium', fontSize: 13 },
  subMetaDot: { fontSize: 13 },

  // Pills — maturity + status selectors
  pillRow: { flexDirection: 'row', gap: 10 },
  pill: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 9999, borderWidth: 1 },
  pillDot: { width: 7, height: 7, borderRadius: 4 },
  pillText: { fontFamily: 'DMSans_600SemiBold', fontSize: 12 },

  // Stats — compact bar
  statsSection: { paddingHorizontal: 20, paddingTop: 18 },
  statsBar: { flexDirection: 'row', borderRadius: 14, padding: 14 },
  stat: { flex: 1, alignItems: 'center', gap: 2 },
  statNum: { fontFamily: 'DMSans_700Bold', fontSize: 16 },
  statLbl: { fontFamily: 'DMSans_500Medium', fontSize: 10, letterSpacing: 0.5, textTransform: 'uppercase' },
  statDiv: { width: 1, height: '60%', alignSelf: 'center' },
  engBar: { height: 3, borderRadius: 2, overflow: 'hidden', marginTop: 6, marginHorizontal: 4 },
  engFill: { height: '100%', borderRadius: 2 },

  // Actions
  actionsSection: { flexDirection: 'row', paddingHorizontal: 20, gap: 12, paddingTop: 16, paddingBottom: 4 },
  msgBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, height: 44, borderRadius: 9999 },
  msgBtnText: { fontFamily: 'DMSans_700Bold', fontSize: 14, color: '#fff' },
  schedBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, height: 44, borderRadius: 9999 },
  schedBtnText: { fontFamily: 'DMSans_600SemiBold', fontSize: 14 },

  // Divider
  divider: { height: 0.5, marginHorizontal: 20, marginVertical: 16 },

  // Tabs — underline style for less visual noise
  tabScroll: { marginBottom: 16 },
  tabRow: { flexDirection: 'row', paddingHorizontal: 20, gap: 6 },
  tab: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 9999 },
  tabActive: { backgroundColor: '#000022' },
  tabLabel: { fontFamily: 'DMSans_500Medium', fontSize: 13 },
  tabLabelActive: { fontFamily: 'DMSans_700Bold', color: '#fff' },

  // Content area
  content: { paddingHorizontal: 20 },

  // Card — the primary grouping container
  card: { borderRadius: 14, backgroundColor: '#fff', borderWidth: 0.5, borderColor: '#e2e8f0', padding: 16, marginBottom: 14 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 14 },
  cardTitle: { fontFamily: 'DMSans_700Bold', fontSize: 14 },
  cardSubHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 14, marginBottom: 8 },
  cardSubTitle: { fontFamily: 'DMSans_600SemiBold', fontSize: 11, letterSpacing: 0.5, textTransform: 'uppercase' },

  // Key-value rows
  kvRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 10 },
  kvKey: { fontFamily: 'DMSans_500Medium', fontSize: 13 },
  kvVal: { fontFamily: 'DMSans_600SemiBold', fontSize: 13, textAlign: 'right', flex: 1, marginLeft: 16 },

  // Mentor
  mentorRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 14 },
  mentorAv: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
  mentorAvText: { fontFamily: 'DMSans_700Bold', fontSize: 14, color: '#fff' },
  mentorName: { fontFamily: 'DMSans_700Bold', fontSize: 14 },
  mentorSub: { fontFamily: 'DMSans_500Medium', fontSize: 12, marginTop: 1 },
  dashedBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 10, borderRadius: 10, borderWidth: 1, borderStyle: 'dashed' },
  dashedBtnText: { fontFamily: 'DMSans_600SemiBold', fontSize: 12 },
  inlineForm: { borderRadius: 12, padding: 12, gap: 10 },
  inlineInput: { fontFamily: 'DMSans_500Medium', fontSize: 13, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8, minHeight: 44, textAlignVertical: 'top' },
  inlineActions: { flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'center', gap: 12 },
  inlineCancel: { fontFamily: 'DMSans_600SemiBold', fontSize: 13 },
  inlineSubmit: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 9999 },

  // Chips
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  groupChip: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 9999 },
  groupChipText: { fontFamily: 'DMSans_600SemiBold', fontSize: 11, color: '#2563eb' },
  tagChip: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 9999 },
  tagChipText: { fontFamily: 'DMSans_500Medium', fontSize: 11 },

  // Journey
  journeyTitle: { fontFamily: 'DMSans_700Bold', fontSize: 17, flex: 1, marginRight: 8 },
  stagePill: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 9999 },
  stagePillText: { fontFamily: 'DMSans_700Bold', fontSize: 11 },
  progressBlock: { marginTop: 4 },
  progressTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 8 },
  progressLbl: { fontFamily: 'DMSans_500Medium', fontSize: 12 },
  progressNum: { fontFamily: 'DMSans_700Bold', fontSize: 15 },
  progressTrack: { height: 8, borderRadius: 4, overflow: 'hidden', marginBottom: 6 },
  progressFill: { height: '100%', borderRadius: 4 },
  progressPct: { fontFamily: 'DMSans_600SemiBold', fontSize: 11, textAlign: 'right' },
  validBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 9999 },

  // Pipeline
  pipeline: { flexDirection: 'row' },
  pipeStep: { flex: 1, alignItems: 'center' },
  pipeRow: { flexDirection: 'row', alignItems: 'center', width: '100%', justifyContent: 'center', marginBottom: 8 },
  pipeCircle: { width: 26, height: 26, borderRadius: 13, justifyContent: 'center', alignItems: 'center', borderWidth: 2 },
  pipeNum: { fontFamily: 'DMSans_700Bold', fontSize: 11 },
  pipeLine: { flex: 1, height: 2 },
  pipeLbl: { fontFamily: 'DMSans_500Medium', fontSize: 10, textAlign: 'center' },

  // Milestones — timeline
  msRow: { flexDirection: 'row', gap: 12, paddingHorizontal: 0 },
  msTimeline: { alignItems: 'center', width: 20 },
  msDot: { width: 14, height: 14, borderRadius: 7, borderWidth: 2 },
  msLine: { width: 2, flex: 1, minHeight: 20 },
  msCard: { flex: 1, borderRadius: 12, borderWidth: 1, padding: 12, marginBottom: 8 },
  msCardTop: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  msLabel: { fontFamily: 'DMSans_600SemiBold', fontSize: 13, flex: 1 },
  msBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 9999 },
  msBadgeText: { fontFamily: 'DMSans_600SemiBold', fontSize: 10 },
  msDate: { fontFamily: 'DMSans_500Medium', fontSize: 11, marginTop: 4, paddingLeft: 22 },

  // Notes
  noteInput: { fontFamily: 'DMSans_500Medium', fontSize: 14, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 10, minHeight: 50, textAlignVertical: 'top' },
  addBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 10, borderRadius: 9999 },
  notesHeader: { marginBottom: 10, marginTop: 4 },
  notesHeaderText: { fontFamily: 'DMSans_700Bold', fontSize: 10, letterSpacing: 1 },
  noteItem: { borderRadius: 12, padding: 14, marginBottom: 8 },
  noteBody: { fontFamily: 'DMSans_500Medium', fontSize: 13, lineHeight: 19, marginBottom: 8 },
  noteFoot: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  noteAuthor: { fontFamily: 'DMSans_600SemiBold', fontSize: 11 },
  noteTime: { fontFamily: 'DMSans_500Medium', fontSize: 11 },

  // Prayer
  prayerRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, paddingVertical: 10 },
  prayerDot: { width: 7, height: 7, borderRadius: 4, marginTop: 5 },
  prayerText: { fontFamily: 'DMSans_500Medium', fontSize: 13, lineHeight: 19, flex: 1 },

  // Empty
  emptyBlock: { alignItems: 'center', paddingTop: 40, gap: 8 },
  emptyTitle: { fontFamily: 'DMSans_700Bold', fontSize: 16 },
  emptyDesc: { fontFamily: 'DMSans_500Medium', fontSize: 13 },
  emptyLine: { fontFamily: 'DMSans_500Medium', fontSize: 13 },

  // Picker Modal
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', alignItems: 'center', padding: 40 },
  picker: { width: '100%', maxWidth: 300, borderRadius: 16, padding: 8 },
  pickerHead: { fontFamily: 'DMSans_700Bold', fontSize: 15, paddingHorizontal: 14, paddingVertical: 12 },
  pickItem: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 14, paddingVertical: 12, borderRadius: 10 },
  pickDot: { width: 10, height: 10, borderRadius: 5 },
  pickText: { fontFamily: 'DMSans_600SemiBold', fontSize: 14, flex: 1 },

  // Spiritual Background
  bgText: { fontFamily: 'DMSans_500Medium', fontSize: 13, lineHeight: 20 },

  // Timeline Events
  tlRow: { flexDirection: 'row', gap: 12 },
  tlDotCol: { alignItems: 'center', width: 12 },
  tlDot: { width: 10, height: 10, borderRadius: 5, marginTop: 4 },
  tlLine: { width: 1.5, flex: 1, minHeight: 22 },
  tlContent: { flex: 1, paddingBottom: 16 },
  tlLabel: { fontFamily: 'DMSans_500Medium', fontSize: 13 },
  tlDate: { fontFamily: 'DMSans_500Medium', fontSize: 11, marginTop: 2 },

  // AI Classification
  confBadge: { marginLeft: 'auto', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 9999 },
  confText: { fontFamily: 'DMSans_700Bold', fontSize: 11 },
  aiSubLabel: { fontFamily: 'DMSans_600SemiBold', fontSize: 11, letterSpacing: 0.5, textTransform: 'uppercase', marginBottom: 8, marginTop: 10 },
  needChip: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 9999 },
  needChipText: { fontFamily: 'DMSans_500Medium', fontSize: 11, color: '#2563eb' },
  interestChip: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 9999, borderWidth: 1 },
  interestChipText: { fontFamily: 'DMSans_600SemiBold', fontSize: 11 },

  // AI Summary
  aiSummaryText: { fontFamily: 'DMSans_500Medium', fontSize: 13, lineHeight: 20 },

  // Intelligence Grid
  intelGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  intelCard: { width: '47%', borderRadius: 12, padding: 14, gap: 4 },
  intelIconRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 },
  intelLabel: { fontFamily: 'DMSans_500Medium', fontSize: 11 },
  intelValue: { fontFamily: 'DMSans_700Bold', fontSize: 16 },
  intelSub: { fontFamily: 'DMSans_500Medium', fontSize: 11 },
});
