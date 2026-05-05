import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Linking,
  LayoutAnimation,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import {
  ArrowLeft,
  MessageCircle,
  BookOpen,
  Mail,
  ExternalLink,
  ChevronRight,
  FileText,
  Video,
  HelpCircle,
} from 'lucide-react-native';
import { useTheme } from '@/hooks/use-theme';

const FAQ_ITEMS = [
  {
    question: 'How do I assign a journey to a seeker?',
    answer: 'Go to the seeker\'s profile, tap the Journey tab, and select "Assign Journey" to choose from available content paths.',
  },
  {
    question: 'How are seekers matched with mentors?',
    answer: 'Turumba uses AI classification based on language, location, and spiritual background to suggest optimal mentor-seeker pairings.',
  },
  {
    question: 'What do the engagement scores mean?',
    answer: 'Engagement scores (0–100%) reflect how actively a seeker responds to messages, completes lessons, and participates in conversations.',
  },
  {
    question: 'How can I request a seeker reassignment?',
    answer: 'Open the seeker\'s profile, scroll to the Mentor section, and tap "Request Reassignment" with a brief reason.',
  },
  {
    question: 'How do notifications work?',
    answer: 'You receive push notifications for new messages, seeker milestones, assignments, and prayer requests. Configure these in Profile → Settings.',
  },
];

export default function HelpScreen() {
  const colors = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [expanded, setExpanded] = React.useState<string | null>(null);

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 8, borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()} activeOpacity={0.7} style={styles.backBtn}>
          <ArrowLeft size={22} color={colors.foreground} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>Help & Support</Text>
        <View style={{ width: 30 }} />
      </View>

      <ScrollView
        contentContainerStyle={{ paddingBottom: insets.bottom + 40 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>GET HELP</Text>
          <View style={[styles.card, { borderColor: colors.border }]}>
            <TouchableOpacity style={styles.menuRow} activeOpacity={0.6}>
              <View style={[styles.menuIcon, { backgroundColor: colors.secondary }]}>
                <MessageCircle size={16} color={colors.mutedForeground} />
              </View>
              <View style={styles.menuContent}>
                <Text style={[styles.menuLabel, { color: colors.foreground }]}>Chat with Support</Text>
                <Text style={[styles.menuDesc, { color: colors.mutedForeground }]}>Get help from the Turumba team</Text>
              </View>
              <ChevronRight size={16} color={colors.mutedForeground} />
            </TouchableOpacity>
            <TouchableOpacity style={[styles.menuRow, { borderTopWidth: 0.5, borderTopColor: colors.border }]} activeOpacity={0.6}>
              <View style={[styles.menuIcon, { backgroundColor: colors.secondary }]}>
                <Mail size={16} color={colors.mutedForeground} />
              </View>
              <View style={styles.menuContent}>
                <Text style={[styles.menuLabel, { color: colors.foreground }]}>Email Support</Text>
                <Text style={[styles.menuDesc, { color: colors.mutedForeground }]}>support@turumba.app</Text>
              </View>
              <ChevronRight size={16} color={colors.mutedForeground} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Resources */}
        <View style={styles.section}>
          <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>RESOURCES</Text>
          <View style={[styles.card, { borderColor: colors.border }]}>
            <TouchableOpacity style={styles.menuRow} activeOpacity={0.6}>
              <View style={[styles.menuIcon, { backgroundColor: colors.secondary }]}>
                <BookOpen size={16} color={colors.mutedForeground} />
              </View>
              <View style={styles.menuContent}>
                <Text style={[styles.menuLabel, { color: colors.foreground }]}>Mentor Guide</Text>
                <Text style={[styles.menuDesc, { color: colors.mutedForeground }]}>Best practices for digital mentoring</Text>
              </View>
              <ExternalLink size={14} color={colors.mutedForeground} />
            </TouchableOpacity>
            <TouchableOpacity style={[styles.menuRow, { borderTopWidth: 0.5, borderTopColor: colors.border }]} activeOpacity={0.6}>
              <View style={[styles.menuIcon, { backgroundColor: colors.secondary }]}>
                <Video size={16} color={colors.mutedForeground} />
              </View>
              <View style={styles.menuContent}>
                <Text style={[styles.menuLabel, { color: colors.foreground }]}>Video Tutorials</Text>
                <Text style={[styles.menuDesc, { color: colors.mutedForeground }]}>Step-by-step walkthroughs</Text>
              </View>
              <ExternalLink size={14} color={colors.mutedForeground} />
            </TouchableOpacity>
            <TouchableOpacity style={[styles.menuRow, { borderTopWidth: 0.5, borderTopColor: colors.border }]} activeOpacity={0.6}>
              <View style={[styles.menuIcon, { backgroundColor: colors.secondary }]}>
                <FileText size={16} color={colors.mutedForeground} />
              </View>
              <View style={styles.menuContent}>
                <Text style={[styles.menuLabel, { color: colors.foreground }]}>Terms & Conditions</Text>
                <Text style={[styles.menuDesc, { color: colors.mutedForeground }]}>Legal information</Text>
              </View>
              <ExternalLink size={14} color={colors.mutedForeground} />
            </TouchableOpacity>
          </View>
        </View>

        {/* FAQ */}
        <View style={styles.section}>
          <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>FAQ</Text>
          <View style={[styles.card, { borderColor: colors.border }]}>
            {FAQ_ITEMS.map((item, idx) => (
              <TouchableOpacity
                key={idx}
                style={[styles.faqRow, idx > 0 && { borderTopWidth: 0.5, borderTopColor: colors.border }]}
                activeOpacity={0.6}
                onPress={() => {
                  LayoutAnimation.configureNext(LayoutAnimation.create(300, LayoutAnimation.Types.easeInEaseOut, LayoutAnimation.Properties.opacity));
                  setExpanded(expanded === item.question ? null : item.question);
                }}
              >
                <View style={styles.faqHeader}>
                  <HelpCircle size={14} color={colors.primary} />
                  <Text style={[styles.faqQuestion, { color: colors.foreground }]}>{item.question}</Text>
                </View>
                {expanded === item.question && (
                  <Text style={[styles.faqAnswer, { color: colors.mutedForeground }]}>{item.answer}</Text>
                )}
              </TouchableOpacity>
            ))}
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
  menuRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  menuIcon: {
    width: 34,
    height: 34,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  menuContent: { flex: 1, gap: 2 },
  menuLabel: {
    fontFamily: 'DMSans_600SemiBold',
    fontSize: 14,
  },
  menuDesc: {
    fontFamily: 'DMSans_500Medium',
    fontSize: 12,
  },
  faqRow: {
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  faqHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  faqQuestion: {
    fontFamily: 'DMSans_600SemiBold',
    fontSize: 14,
    flex: 1,
    lineHeight: 20,
  },
  faqAnswer: {
    fontFamily: 'DMSans_500Medium',
    fontSize: 13,
    lineHeight: 19,
    marginTop: 8,
    paddingLeft: 24,
  },
});
