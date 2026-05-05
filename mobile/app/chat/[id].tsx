import React, { useState, useRef, useMemo, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  LayoutAnimation,
  Modal,
  Pressable,
  Dimensions,
  Keyboard,
  Animated,
  Image as RNImage,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import {
  ArrowLeft,
  MoreVertical,
  MessageCircle,
  Send,
  Paperclip,
  Mic,
  Check,
  CheckCheck,
  ChevronDown,
  FileText,
  List,
  Sparkles,
  BookOpen,
  ChevronRight,
  X,
  Zap,
  Reply,
  Copy,
  Pin,
  Trash2,
  Share2,
  CornerUpRight,
  Image,
  File,
  Camera,
  Square,
  Play,
  Pause,
} from 'lucide-react-native';
import { useTheme } from '@/hooks/use-theme';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import { Audio } from 'expo-av';

const SCREEN_WIDTH = Dimensions.get('window').width;
const PHOTO_WIDTH = Math.floor(SCREEN_WIDTH * 0.65);

// ─── Waveform Component ─────────────────────────────────────────────────────

const NUM_BARS = 28;

function RecordingWaveform({ isActive, color }: { isActive: boolean; color: string }) {
  const animatedValues = useRef(
    Array.from({ length: NUM_BARS }, () => new Animated.Value(0.3))
  ).current;

  useEffect(() => {
    if (!isActive) {
      animatedValues.forEach((v) => v.setValue(0.3));
      return;
    }
    const animations = animatedValues.map((val, i) =>
      Animated.loop(
        Animated.sequence([
          Animated.timing(val, {
            toValue: Math.random() * 0.7 + 0.3,
            duration: 200 + Math.random() * 300,
            useNativeDriver: false,
          }),
          Animated.timing(val, {
            toValue: 0.2 + Math.random() * 0.2,
            duration: 200 + Math.random() * 300,
            useNativeDriver: false,
          }),
        ])
      )
    );
    animations.forEach((a) => a.start());
    return () => animations.forEach((a) => a.stop());
  }, [isActive]);

  return (
    <View style={waveStyles.container}>
      {animatedValues.map((val, i) => (
        <Animated.View
          key={i}
          style={[
            waveStyles.bar,
            {
              backgroundColor: color,
              height: val.interpolate({
                inputRange: [0, 1],
                outputRange: [4, 24],
              }),
            },
          ]}
        />
      ))}
    </View>
  );
}

function VoiceMessageWaveform({
  isPlaying,
  color,
  durationMs,
  onPlaybackEnd,
}: {
  isPlaying: boolean;
  color: string;
  durationMs: number;
  onPlaybackEnd?: () => void;
}) {
  const heights = useMemo(
    () => Array.from({ length: 24 }, (_, i) => 6 + Math.sin(i * 1.2) * 8 + Math.cos(i * 0.7) * 4),
    []
  );
  const progressAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (isPlaying) {
      progressAnim.setValue(0);
      Animated.timing(progressAnim, {
        toValue: 1,
        duration: durationMs || 3000,
        useNativeDriver: false,
      }).start(({ finished }) => {
        if (finished && onPlaybackEnd) onPlaybackEnd();
      });
    } else {
      progressAnim.stopAnimation();
      progressAnim.setValue(0);
    }
  }, [isPlaying]);

  return (
    <View style={waveStyles.voiceContainer}>
      {heights.map((h, i) => {
        const barProgress = progressAnim.interpolate({
          inputRange: [i / heights.length, (i + 1) / heights.length],
          outputRange: [0, 1],
          extrapolate: 'clamp',
        });
        return (
          <Animated.View
            key={i}
            style={[
              waveStyles.voiceBar,
              {
                height: h,
                backgroundColor: barProgress.interpolate({
                  inputRange: [0, 1],
                  outputRange: [color + '50', color],
                }),
              },
            ]}
          />
        );
      })}
    </View>
  );
}

const waveStyles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    flex: 1,
    height: 28,
  },
  bar: {
    width: 3,
    borderRadius: 2,
  },
  voiceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    height: 24,
  },
  voiceBar: {
    width: 3,
    borderRadius: 2,
  },
});

// ─── Data ────────────────────────────────────────────────────────────────────

type MessageType = {
  id: string;
  text: string;
  sender: 'me' | 'them';
  time: string;
  status: 'sent' | 'delivered' | 'read';
  type?: 'text' | 'voice' | 'photo' | 'document';
  duration?: string;
  durationSeconds?: number;
  fileName?: string;
  imageUri?: string;
  audioUri?: string;
};

const MESSAGES: MessageType[] = [
  {
    id: '1',
    text: 'Hi Sarah! How are you doing today?',
    sender: 'me',
    time: '9:00 AM',
    status: 'read' as const,
  },
  {
    id: '2',
    text: "I'm doing great, thank you! I've been reading the devotional you shared.",
    sender: 'them',
    time: '9:05 AM',
    status: 'read' as const,
  },
  {
    id: '3',
    text: "That's wonderful to hear! What did you think about the section on prayer?",
    sender: 'me',
    time: '9:07 AM',
    status: 'read' as const,
  },
  {
    id: '4',
    text: 'It really opened my eyes. I never realized prayer could be so personal and conversational. I always thought it had to be formal.',
    sender: 'them',
    time: '9:10 AM',
    status: 'read' as const,
  },
  {
    id: '5',
    text: 'Exactly! God wants a relationship with us, not just rituals. Have you tried talking to Him in your own words?',
    sender: 'me',
    time: '9:12 AM',
    status: 'read' as const,
  },
  {
    id: '6',
    text: "Yes, I tried last night before bed. It felt really different — peaceful. I actually cried a little.",
    sender: 'them',
    time: '9:15 AM',
    status: 'read' as const,
  },
  {
    id: '7',
    text: "That's beautiful, Sarah. Those tears are often the Holy Spirit touching your heart. Keep going! 🙏",
    sender: 'me',
    time: '9:17 AM',
    status: 'delivered' as const,
  },
  {
    id: '8',
    text: "Thank you for the prayer guide! I have a question about the section on fasting — is it required?",
    sender: 'them',
    time: '9:30 AM',
    status: 'read' as const,
  },
];

// ─── Form Templates ──────────────────────────────────────────────────────────

const FORM_TEMPLATES = [
  { id: 'intake', label: 'Intake Form', desc: 'Collect basic info, spiritual background, and contact preferences', color: '#2563eb', bgColor: '#eff6ff' },
  { id: 'assessment', label: 'Faith Assessment', desc: '5-question check-in to gauge current spiritual engagement', color: '#10b981', bgColor: '#ecfdf5' },
  { id: 'prayer', label: 'Prayer Request Form', desc: 'Structured form for submitting prayer requests with follow-up option', color: '#8b5cf6', bgColor: '#f5f3ff' },
  { id: 'feedback', label: 'Mentor Feedback', desc: 'Short survey about their experience with their assigned mentor', color: '#f59e0b', bgColor: '#fffbeb' },
];

// ─── Content Series ──────────────────────────────────────────────────────────

const CONTENT_SERIES = [
  { id: 'foundations', label: 'Foundations of Faith', lessons: 7, desc: 'Core beliefs and first steps for new believers', color: '#8b5cf6', bgColor: '#f5f3ff' },
  { id: 'prayer_basics', label: 'Prayer Basics', lessons: 5, desc: 'Learning to build a consistent prayer life', color: '#2563eb', bgColor: '#eff6ff' },
  { id: 'bible_101', label: 'Bible 101', lessons: 10, desc: 'How to read, understand, and apply Scripture', color: '#10b981', bgColor: '#ecfdf5' },
  { id: 'community', label: 'Finding Community', lessons: 4, desc: 'Connecting with a faith community and small groups', color: '#f59e0b', bgColor: '#fffbeb' },
];

// ─── AI Suggestion Bank ──────────────────────────────────────────────────────

type AISuggestion = { id: string; text: string };

const AI_SUGGESTION_BANK: Record<string, AISuggestion[]> = {
  greeting: [
    { id: 'sg1', text: 'Hi! Thank you for reaching out. How can I help you today?' },
    { id: 'sg2', text: "Welcome! I'm glad you're here. What's on your mind?" },
    { id: 'sg3', text: 'Peace be with you! How are you doing today?' },
  ],
  question: [
    { id: 'sq1', text: "That's a great question! Let me share some thoughts..." },
    { id: 'sq2', text: "I appreciate you asking. Here's what I've found helpful..." },
    { id: 'sq3', text: 'Let me point you to a resource that covers this well.' },
  ],
  struggle: [
    { id: 'ss1', text: "Thank you for sharing that. I'm here for you and we can work through this together." },
    { id: 'ss2', text: 'I understand this is difficult. Would you like to talk more about it?' },
    { id: 'ss3', text: "You're not alone in this. Let's set up a time to discuss further." },
  ],
  encouragement: [
    { id: 'se1', text: "That's wonderful progress! I'm really encouraged by your growth." },
    { id: 'se2', text: "Keep going — you're doing amazing! God is faithful." },
    { id: 'se3', text: 'I love hearing this. Would you like to share your testimony with the group?' },
  ],
  followup: [
    { id: 'sf1', text: 'Just checking in — how are things going since we last spoke?' },
    { id: 'sf2', text: "I've been thinking about our conversation. How are you feeling?" },
    { id: 'sf3', text: 'Have you had a chance to try what we discussed?' },
  ],
  prayer: [
    { id: 'sp1', text: "I'll be praying for you. Is there anything specific you'd like me to focus on?" },
    { id: 'sp2', text: "Let's pray together. When works best for you?" },
    { id: 'sp3', text: 'Thank you for sharing that prayer request. God hears you.' },
  ],
  general: [
    { id: 'gg1', text: 'Thank you for sharing! Would you like to discuss this further?' },
    { id: 'gg2', text: 'I appreciate you reaching out. How can I support you?' },
    { id: 'gg3', text: "That's really insightful. Let me share a related resource." },
    { id: 'gg4', text: 'Would you like to schedule a time to meet and talk?' },
  ],
};

function classifyLastMessage(lastMsg: string): string {
  const lower = lastMsg.toLowerCase();
  if (/^(hi|hello|hey|good morning|good evening|salam|selam)/.test(lower)) return 'greeting';
  if (/\?$|how do|what is|can you|why do|where can|tell me/.test(lower)) return 'question';
  if (/struggl|difficult|hard|lost|confus|doubt|afraid|scared|anxious|depress|lonely/.test(lower)) return 'struggle';
  if (/thank|blessed|amazing|wonderful|great|happy|joy|excited|growth|progress/.test(lower)) return 'encouragement';
  if (/pray|prayer|lord|god.*help|intercede/.test(lower)) return 'prayer';
  if (/check.?in|follow.?up|how.*going|update/.test(lower)) return 'followup';
  return 'general';
}

// ─── Main Screen ─────────────────────────────────────────────────────────────

export default function ChatDetailScreen() {
  const colors = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState(MESSAGES);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const recordingInterval = useRef<NodeJS.Timeout | null>(null);
  const recordingRef = useRef<any>(null);
  const [showAttachMenu, setShowAttachMenu] = useState(false);
  const flatListRef = useRef<FlatList>(null);

  // Audio playback refs for voice messages
  const soundRef = useRef<any>(null);

  // Quick Actions state
  const [quickActionsVisible, setQuickActionsVisible] = useState(true);
  const [activePanel, setActivePanel] = useState<'form' | 'series' | 'suggest' | null>(null);

  // AI Suggestion Pills state
  const [suggestionsVisible, setSuggestionsVisible] = useState(true);
  const [usedSuggestionIds, setUsedSuggestionIds] = useState<Set<string>>(new Set());

  // Message context menu state
  const [selectedMessage, setSelectedMessage] = useState<(typeof MESSAGES)[0] | null>(null);
  const [menuVisible, setMenuVisible] = useState(false);
  const [reactions, setReactions] = useState<Record<string, string>>({});
  const [keyboardVisible, setKeyboardVisible] = useState(false);

  useEffect(() => {
    const showSub = Keyboard.addListener(Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow', () => setKeyboardVisible(true));
    const hideSub = Keyboard.addListener(Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide', () => setKeyboardVisible(false));
    return () => { showSub.remove(); hideSub.remove(); };
  }, []);

  const QUICK_REACTIONS = ['❤️', '👍', '🙏', '😂', '😮', '🔥'];

  const MENU_ACTIONS = [
    { id: 'reply', label: 'Reply', icon: Reply },
    { id: 'forward', label: 'Forward', icon: CornerUpRight },
    { id: 'copy', label: 'Copy', icon: Copy },
    { id: 'pin', label: 'Pin', icon: Pin },
    { id: 'select', label: 'Select', icon: Share2 },
    { id: 'delete', label: 'Delete', icon: Trash2, destructive: true },
  ];

  const handleLongPress = useCallback((msg: (typeof MESSAGES)[0]) => {
    setSelectedMessage(msg);
    setMenuVisible(true);
  }, []);

  const handleReaction = useCallback((emoji: string) => {
    if (!selectedMessage) return;
    setReactions((prev) => {
      const current = prev[selectedMessage.id];
      if (current === emoji) {
        const next = { ...prev };
        delete next[selectedMessage.id];
        return next;
      }
      return { ...prev, [selectedMessage.id]: emoji };
    });
    setMenuVisible(false);
    setSelectedMessage(null);
  }, [selectedMessage]);

  const handleMenuAction = useCallback((actionId: string) => {
    if (!selectedMessage) return;
    switch (actionId) {
      case 'copy':
        // In a real app: Clipboard.setStringAsync(selectedMessage.text)
        break;
      case 'reply':
        setMessage(`> ${selectedMessage.text.substring(0, 50)}...\n\n`);
        break;
      case 'delete':
        // In a real app: delete from messages
        break;
    }
    setMenuVisible(false);
    setSelectedMessage(null);
  }, [selectedMessage]);

  const closeMenu = useCallback(() => {
    setMenuVisible(false);
    setSelectedMessage(null);
  }, []);

  // Hardcoded seeker info
  const seekerName = 'Sarah Johnson';
  const seekerInitials = 'SJ';
  const seekerColor = '#2563eb';
  const seekerMaturity = 'New Believer';
  const isOnline = true;
  const seekerPlatform = 'WhatsApp'; // 'WhatsApp' | 'Telegram' | 'SMS' | 'Email'

  const PLATFORM_CONFIG: Record<string, { color: string }> = {
    WhatsApp: { color: '#25D366' },
    Telegram: { color: '#0088cc' },
    SMS: { color: '#f59e0b' },
    Email: { color: '#8b5cf6' },
  };
  const platformInfo = PLATFORM_CONFIG[seekerPlatform] || { color: colors.mutedForeground };

  // Classify last inbound message for AI suggestions
  const lastInboundMessage = useMemo(() => {
    const inbound = MESSAGES.filter((m) => m.sender === 'them');
    return inbound[inbound.length - 1];
  }, []);

  const aiSuggestions = useMemo(() => {
    if (!lastInboundMessage) return AI_SUGGESTION_BANK.followup;
    const category = classifyLastMessage(lastInboundMessage.text);
    return AI_SUGGESTION_BANK[category] || AI_SUGGESTION_BANK.general;
  }, [lastInboundMessage]);

  const visibleSuggestions = aiSuggestions.filter((s) => !usedSuggestionIds.has(s.id));

  const handleSelectSuggestion = (suggestion: AISuggestion) => {
    setMessage(suggestion.text);
    setUsedSuggestionIds((prev) => new Set([...prev, suggestion.id]));
  };

  const togglePanel = (panel: typeof activePanel) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setActivePanel((prev) => (prev === panel ? null : panel));
  };

  const handleSendForm = (formId: string) => {
    const form = FORM_TEMPLATES.find((f) => f.id === formId);
    if (!form) return;
    setMessage(`📋 ${form.label}\n\n${form.desc}\n\n👉 Please fill out this form.`);
    setActivePanel(null);
  };

  const handleStartSeries = (seriesId: string) => {
    const series = CONTENT_SERIES.find((s) => s.id === seriesId);
    if (!series) return;
    setMessage(`📚 ${series.label} — ${series.lessons}-part series\n\n${series.desc}\n\nLesson 1 is on its way!`);
    setActivePanel(null);
  };

  const TOOLBAR_ACTIONS = [
    { id: 'form' as const, icon: FileText, label: 'Send Form', color: '#2563eb', bgColor: '#eff6ff' },
    { id: 'series' as const, icon: List, label: 'Content Series', color: '#8b5cf6', bgColor: '#f5f3ff' },
    { id: 'suggest' as const, icon: Sparkles, label: 'AI Suggest', color: '#f59e0b', bgColor: '#fffbeb' },
  ];

  // ─── Render Message ──────────────────────────────────────────────────────

  // Voice message playback state
  const [playingVoiceId, setPlayingVoiceId] = useState<string | null>(null);

  const renderMessage = ({ item }: { item: MessageType }) => {
    const isMe = item.sender === 'me';
    const reaction = reactions[item.id];
    const isVoice = item.type === 'voice';
    const isPhoto = item.type === 'photo';
    const isDocument = item.type === 'document';
    const isPlayingThis = playingVoiceId === item.id;

    const renderContent = () => {
      if (isVoice) {
        const totalSec = item.durationSeconds || 1;
        return (
          <View style={styles.voiceMsgContent}>
            <TouchableOpacity
              style={[styles.voicePlayBtn, { backgroundColor: isMe ? 'rgba(255,255,255,0.2)' : colors.primary + '20' }]}
              onPress={() => playVoiceMessage(item)}
              activeOpacity={0.7}
            >
              {isPlayingThis ? (
                <Pause size={14} color={isMe ? '#fff' : colors.primary} />
              ) : (
                <Play size={14} color={isMe ? '#fff' : colors.primary} />
              )}
            </TouchableOpacity>
            <VoiceMessageWaveform
              isPlaying={isPlayingThis}
              color={isMe ? 'rgba(255,255,255,0.8)' : colors.primary}
              durationMs={totalSec * 1000}
              onPlaybackEnd={() => setPlayingVoiceId(null)}
            />
            <Text style={[styles.voiceDuration, { color: isMe ? 'rgba(255,255,255,0.7)' : colors.mutedForeground }]}>
              {item.duration || '0:00'}
            </Text>
          </View>
        );
      }
      if (isPhoto && item.imageUri) {
        return (
          <RNImage
            source={{ uri: item.imageUri }}
            style={{ width: PHOTO_WIDTH, height: PHOTO_WIDTH * 0.75, borderRadius: 0 }}
            resizeMode="cover"
          />
        );
      }
      if (isPhoto) {
        return (
          <View style={styles.attachMsgContent}>
            <Image size={16} color={isMe ? 'rgba(255,255,255,0.8)' : colors.primary} />
            <Text style={[styles.messageText, { color: isMe ? '#fff' : colors.foreground }]}>
              {item.fileName || 'Photo'}
            </Text>
          </View>
        );
      }
      if (isDocument) {
        return (
          <View style={styles.attachMsgContent}>
            <File size={16} color={isMe ? 'rgba(255,255,255,0.8)' : colors.primary} />
            <Text style={[styles.messageText, { color: isMe ? '#fff' : colors.foreground }]} numberOfLines={1}>
              {item.fileName || 'Document'}
            </Text>
          </View>
        );
      }
      return (
        <Text style={[styles.messageText, { color: isMe ? '#fff' : colors.foreground }]}>
          {item.text}
        </Text>
      );
    };

    const hasImage = isPhoto && item.imageUri;

    return (
      <View style={[styles.messageRow, isMe && styles.messageRowMe]}>
        <Pressable
          onLongPress={() => handleLongPress(item)}
          delayLongPress={300}
          style={[
            hasImage
              ? styles.photoBubble
              : [
                  styles.messageBubble,
                  isMe
                    ? [styles.messageBubbleMe, { backgroundColor: colors.primary }]
                    : [styles.messageBubbleThem, { backgroundColor: colors.secondary }],
                ],
          ]}
        >
          {renderContent()}
          <View style={[styles.messageFooter, hasImage && styles.photoFooter]}>
            <Text
              style={[
                styles.messageTime,
                { color: hasImage ? '#fff' : isMe ? 'rgba(255,255,255,0.7)' : colors.mutedForeground },
              ]}
            >
              {item.time}
            </Text>
            {isMe &&
              (item.status === 'read' ? (
                <CheckCheck size={14} color={hasImage ? '#fff' : 'rgba(255,255,255,0.7)'} />
              ) : (
                <Check size={14} color={hasImage ? '#fff' : 'rgba(255,255,255,0.7)'} />
              ))}
          </View>
        </Pressable>
        {reaction && (
          <View style={[styles.reactionBubble, isMe ? styles.reactionBubbleMe : styles.reactionBubbleThem]}>
            <Text style={styles.reactionEmoji}>{reaction}</Text>
          </View>
        )}
      </View>
    );
  };

  const handleSend = () => {
    if (!message.trim()) return;
    const now = new Date();
    const timeStr = now.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
    const newMsg = {
      id: `msg-${Date.now()}`,
      text: message.trim(),
      sender: 'me' as const,
      time: timeStr,
      status: 'sent' as const,
    };
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setMessages((prev) => [...prev, newMsg]);
    setMessage('');
    setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);

    // Simulate delivery after 1s
    setTimeout(() => {
      setMessages((prev) =>
        prev.map((m) => m.id === newMsg.id ? { ...m, status: 'delivered' as const } : m)
      );
    }, 1000);

    // Simulate read after 2s
    setTimeout(() => {
      setMessages((prev) =>
        prev.map((m) => m.id === newMsg.id ? { ...m, status: 'read' as const } : m)
      );
    }, 2500);
  };

  const sendAttachmentMessage = (msgType: 'photo' | 'document', fileName: string, imageUri?: string) => {
    const now = new Date();
    const timeStr = now.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
    const newMsg: MessageType = {
      id: `msg-${Date.now()}`,
      text: fileName,
      sender: 'me',
      time: timeStr,
      status: 'sent',
      type: msgType,
      fileName,
      imageUri,
    };
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setMessages((prev) => [...prev, newMsg]);
    setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
    setTimeout(() => {
      setMessages((prev) => prev.map((m) => m.id === newMsg.id ? { ...m, status: 'read' } : m));
    }, 2000);
  };

  const handleSendAttachment = async (type: string) => {
    setShowAttachMenu(false);

    if (type === 'photo') {
      try {
        const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (!permission.granted) return;
        const result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ['images', 'videos'],
          quality: 0.8,
        });
        if (result.canceled) return;
        const asset = result.assets[0];
        sendAttachmentMessage('photo', asset.fileName || 'Photo', asset.uri);
      } catch (e) {
        console.log('Image picker error:', e);
      }
    } else if (type === 'document') {
      try {
        const result = await DocumentPicker.getDocumentAsync({ type: '*/*', copyToCacheDirectory: true });
        if (result.canceled) return;
        const file = result.assets[0];
        sendAttachmentMessage('document', file.name || 'Document');
      } catch (e) {
        console.log('Document picker error:', e);
      }
    }
  };

  const startRecording = async () => {
    try {
      const permission = await Audio.requestPermissionsAsync();
      if (!permission.granted) return;
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });
      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets?.HIGH_QUALITY ?? {
          android: { extension: '.m4a', outputFormat: 2, audioEncoder: 3, sampleRate: 44100, numberOfChannels: 2, bitRate: 128000 },
          ios: { extension: '.m4a', outputFormat: 'aac', audioQuality: 127, sampleRate: 44100, numberOfChannels: 2, bitRate: 128000, linearPCMBitDepth: 16, linearPCMIsBigEndian: false, linearPCMIsFloat: false },
          web: { mimeType: 'audio/webm', bitsPerSecond: 128000 },
        }
      );
      recordingRef.current = recording;
    } catch (e) {
      console.log('Recording start error:', e);
    }

    // Start timer
    setIsRecording(true);
    setRecordingDuration(0);
    recordingInterval.current = setInterval(() => {
      setRecordingDuration((d) => d + 1);
    }, 1000);
  };

  const stopAndSendRecording = async () => {
    if (recordingInterval.current) clearInterval(recordingInterval.current);
    const duration = recordingDuration;
    setIsRecording(false);
    setRecordingDuration(0);

    let audioUri: string | undefined;
    if (recordingRef.current) {
      try {
        await recordingRef.current.stopAndUnloadAsync();
        await Audio.setAudioModeAsync({ allowsRecordingIOS: false });
        audioUri = recordingRef.current.getURI() || undefined;
        recordingRef.current = null;
      } catch (e) {
        console.log('Recording stop error:', e);
      }
    }

    const mins = Math.floor(duration / 60);
    const secs = duration % 60;
    const durationStr = `${mins}:${secs.toString().padStart(2, '0')}`;

    const now = new Date();
    const timeStr = now.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
    const newMsg: MessageType = {
      id: `msg-${Date.now()}`,
      text: 'Voice message',
      sender: 'me',
      time: timeStr,
      status: 'sent',
      type: 'voice',
      duration: durationStr,
      durationSeconds: duration || 1,
      audioUri,
    };
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setMessages((prev) => [...prev, newMsg]);
    setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);

    setTimeout(() => {
      setMessages((prev) =>
        prev.map((m) => m.id === newMsg.id ? { ...m, status: 'read' } : m)
      );
    }, 2000);
  };

  const cancelRecording = async () => {
    if (recordingInterval.current) clearInterval(recordingInterval.current);
    setIsRecording(false);
    setRecordingDuration(0);
    if (recordingRef.current) {
      try {
        await recordingRef.current.stopAndUnloadAsync();
        recordingRef.current = null;
      } catch {}
    }
  };

  const playVoiceMessage = async (item: MessageType) => {
    const isPlaying = playingVoiceId === item.id;
    if (isPlaying) {
      // Stop playback
      if (soundRef.current) {
        try { await soundRef.current.stopAsync(); await soundRef.current.unloadAsync(); } catch {}
        soundRef.current = null;
      }
      setPlayingVoiceId(null);
      return;
    }

    // Stop any existing playback first
    if (soundRef.current) {
      try { await soundRef.current.stopAsync(); await soundRef.current.unloadAsync(); } catch {}
      soundRef.current = null;
    }

    if (item.audioUri) {
      try {
        const { sound } = await Audio.Sound.createAsync(
          { uri: item.audioUri },
          { shouldPlay: true }
        );
        soundRef.current = sound;
        setPlayingVoiceId(item.id);

        sound.setOnPlaybackStatusUpdate((status: any) => {
          if (status.didJustFinish) {
            setPlayingVoiceId(null);
            sound.unloadAsync();
            soundRef.current = null;
          }
        });
      } catch (e) {
        console.log('Playback error:', e);
        setPlayingVoiceId(item.id);
        setTimeout(() => setPlayingVoiceId(null), (item.durationSeconds || 3) * 1000);
      }
    } else {
      // No audio file — just animate the waveform for the duration
      setPlayingVoiceId(item.id);
      setTimeout(() => setPlayingVoiceId(null), (item.durationSeconds || 3) * 1000);
    }
  };

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 8, backgroundColor: colors.background }]}>
        <TouchableOpacity onPress={() => router.back()} activeOpacity={0.7} style={styles.backBtn}>
          <ArrowLeft size={22} color={colors.foreground} />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.headerProfile}
          activeOpacity={0.6}
          onPress={() => router.push(`/seeker/${id}`)}
        >
          <View style={[styles.headerAvatar, { backgroundColor: seekerColor }]}>
            <Text style={styles.headerAvatarText}>{seekerInitials}</Text>
            {isOnline && <View style={styles.headerOnlineDot} />}
          </View>

          <View style={styles.headerInfo}>
            <Text style={[styles.headerName, { color: colors.foreground }]} numberOfLines={1}>
              {seekerName}
            </Text>
            <View style={styles.headerMetaRow}>
              <Text style={[styles.headerStatus, { color: colors.mutedForeground }]}>
                {isOnline ? 'Online' : 'Offline'} · {seekerMaturity}
              </Text>
            </View>
            <View style={styles.headerPlatformRow}>
              <MessageCircle size={12} color={platformInfo.color} />
              <Text style={[styles.headerPlatformText, { color: platformInfo.color }]}>
                {seekerPlatform}
              </Text>
            </View>
          </View>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.headerActionBtn, { backgroundColor: colors.secondary }]} activeOpacity={0.7}>
          <MoreVertical size={18} color={colors.foreground} />
        </TouchableOpacity>
      </View>

      {/* Messages + Bottom Area wrapped in KeyboardAvoidingView */}
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior="padding"
      >
        <FlatList
          ref={flatListRef}
          data={messages}
          renderItem={renderMessage}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.messagesList}
          showsVerticalScrollIndicator={false}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
          onLayout={() => flatListRef.current?.scrollToEnd({ animated: false })}
          keyboardShouldPersistTaps="handled"
        />
        {/* ─── Quick Actions ─────────────────────────────────────── */}
        <View style={[styles.toolbarContainer, { backgroundColor: colors.background, borderTopColor: colors.border }]}>
          {/* Tappable label header — toggles chips visibility */}
          <TouchableOpacity
            style={styles.toolbarHeader}
            onPress={() => {
              LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
              setQuickActionsVisible((v) => !v);
              if (quickActionsVisible) setActivePanel(null);
            }}
            activeOpacity={0.7}
          >
            <Zap size={12} color="#f59e0b" />
            <Text style={[styles.toolbarHeaderText, { color: colors.mutedForeground }]}>QUICK ACTIONS</Text>
            <ChevronDown
              size={12}
              color={colors.mutedForeground}
              style={{ transform: [{ rotate: quickActionsVisible ? '0deg' : '-90deg' }] }}
            />
          </TouchableOpacity>

          {/* Chip labels */}
          {quickActionsVisible && (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.toolbarChipsScroll}
              contentContainerStyle={styles.toolbarChipsContent}
            >
              {TOOLBAR_ACTIONS.map((action) => {
                const Icon = action.icon;
                const isActive = activePanel === action.id;
                return (
                  <TouchableOpacity
                    key={action.id}
                    style={[
                      styles.toolbarChip,
                      {
                        backgroundColor: isActive ? '#000022' : colors.secondary,
                      },
                    ]}
                    onPress={() => togglePanel(action.id)}
                    activeOpacity={0.7}
                  >
                    <Icon size={13} color={isActive ? '#fff' : action.color} />
                    <Text style={[styles.toolbarChipText, { color: isActive ? '#fff' : colors.foreground }]}>
                      {action.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          )}

          {/* Panel Content */}
          {activePanel === 'form' && (
            <View style={[styles.panelContainer, { borderTopColor: colors.border }]}>
              <View style={styles.panelHeader}>
                <Text style={[styles.panelTitle, { color: colors.foreground }]}>
                  Send a form to {seekerName.split(' ')[0]}
                </Text>
                <TouchableOpacity onPress={() => setActivePanel(null)} style={styles.panelClose} activeOpacity={0.7}>
                  <X size={16} color={colors.mutedForeground} />
                </TouchableOpacity>
              </View>
              {FORM_TEMPLATES.map((form) => (
                <TouchableOpacity
                  key={form.id}
                  style={[styles.panelItem, { backgroundColor: colors.secondary }]}
                  onPress={() => handleSendForm(form.id)}
                  activeOpacity={0.7}
                >
                  <View style={[styles.panelItemIcon, { backgroundColor: form.bgColor }]}>
                    <FileText size={16} color={form.color} />
                  </View>
                  <View style={styles.panelItemContent}>
                    <Text style={[styles.panelItemLabel, { color: colors.foreground }]}>{form.label}</Text>
                    <Text style={[styles.panelItemDesc, { color: colors.mutedForeground }]} numberOfLines={2}>
                      {form.desc}
                    </Text>
                  </View>
                  <Send size={14} color={colors.mutedForeground} />
                </TouchableOpacity>
              ))}
            </View>
          )}

          {activePanel === 'series' && (
            <View style={[styles.panelContainer, { borderTopColor: colors.border }]}>
              <View style={styles.panelHeader}>
                <Text style={[styles.panelTitle, { color: colors.foreground }]}>Start a content series</Text>
                <TouchableOpacity onPress={() => setActivePanel(null)} style={styles.panelClose} activeOpacity={0.7}>
                  <X size={16} color={colors.mutedForeground} />
                </TouchableOpacity>
              </View>
              {CONTENT_SERIES.map((series) => (
                <TouchableOpacity
                  key={series.id}
                  style={[styles.panelItem, { backgroundColor: colors.secondary }]}
                  onPress={() => handleStartSeries(series.id)}
                  activeOpacity={0.7}
                >
                  <View style={[styles.panelItemIcon, { backgroundColor: series.bgColor }]}>
                    <BookOpen size={16} color={series.color} />
                  </View>
                  <View style={styles.panelItemContent}>
                    <Text style={[styles.panelItemLabel, { color: colors.foreground }]}>
                      {series.label}{' '}
                      <Text style={[styles.panelItemLessonCount, { color: colors.mutedForeground }]}>
                        · {series.lessons} lessons
                      </Text>
                    </Text>
                    <Text style={[styles.panelItemDesc, { color: colors.mutedForeground }]} numberOfLines={2}>
                      {series.desc}
                    </Text>
                  </View>
                  <ChevronRight size={14} color={colors.mutedForeground} />
                </TouchableOpacity>
              ))}
            </View>
          )}

          {activePanel === 'suggest' && (
            <View style={[styles.panelContainer, { borderTopColor: colors.border }]}>
              <View style={styles.panelHeader}>
                <View style={styles.panelSuggestHeader}>
                  <Sparkles size={14} color="#f59e0b" />
                  <Text style={[styles.panelTitle, { color: colors.foreground }]}>
                    AI picks for {seekerName.split(' ')[0]}
                  </Text>
                  <View style={[styles.maturityBadge, { backgroundColor: colors.secondary }]}>
                    <Text style={[styles.maturityBadgeText, { color: colors.mutedForeground }]}>{seekerMaturity}</Text>
                  </View>
                </View>
                <TouchableOpacity onPress={() => setActivePanel(null)} style={styles.panelClose} activeOpacity={0.7}>
                  <X size={16} color={colors.mutedForeground} />
                </TouchableOpacity>
              </View>
              <View style={styles.suggestPanelItems}>
                <TouchableOpacity
                  style={[styles.panelItem, { backgroundColor: colors.secondary }]}
                  onPress={() => {
                    setMessage("📖 Foundations of Faith — Lesson 1: What is Faith?\n\nFaith is trusting God even when you can't see the full picture...");
                    setActivePanel(null);
                  }}
                  activeOpacity={0.7}
                >
                  <View style={[styles.panelItemIcon, { backgroundColor: '#fffbeb' }]}>
                    <BookOpen size={16} color="#f59e0b" />
                  </View>
                  <View style={styles.panelItemContent}>
                    <Text style={[styles.panelItemLabel, { color: colors.foreground }]}>Understanding Prayer</Text>
                    <Text style={[styles.panelItemDesc, { color: colors.mutedForeground }]} numberOfLines={2}>
                      A guide to building a personal prayer life
                    </Text>
                    <View style={styles.panelItemMeta}>
                      <View style={[styles.panelItemTag, { backgroundColor: colors.background }]}>
                        <Text style={[styles.panelItemTagText, { color: colors.mutedForeground }]}>Article</Text>
                      </View>
                      <Text style={[styles.panelItemMetaText, { color: colors.mutedForeground }]}>5 min read</Text>
                    </View>
                  </View>
                  <Send size={14} color={colors.mutedForeground} />
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.panelItem, { backgroundColor: colors.secondary }]}
                  onPress={() => {
                    setMessage("📖 What Does the Bible Say About Fasting?\n\nFasting is a spiritual discipline, not a requirement...");
                    setActivePanel(null);
                  }}
                  activeOpacity={0.7}
                >
                  <View style={[styles.panelItemIcon, { backgroundColor: '#fffbeb' }]}>
                    <BookOpen size={16} color="#f59e0b" />
                  </View>
                  <View style={styles.panelItemContent}>
                    <Text style={[styles.panelItemLabel, { color: colors.foreground }]}>Biblical Fasting Guide</Text>
                    <Text style={[styles.panelItemDesc, { color: colors.mutedForeground }]} numberOfLines={2}>
                      Overview of fasting in Scripture and practical tips
                    </Text>
                    <View style={styles.panelItemMeta}>
                      <View style={[styles.panelItemTag, { backgroundColor: colors.background }]}>
                        <Text style={[styles.panelItemTagText, { color: colors.mutedForeground }]}>Guide</Text>
                      </View>
                      <Text style={[styles.panelItemMetaText, { color: colors.mutedForeground }]}>8 min read</Text>
                    </View>
                  </View>
                  <Send size={14} color={colors.mutedForeground} />
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>

        {/* ─── AI Reply Suggestion Pills ─────────────────────────── */}
        {visibleSuggestions.length > 0 && (
          <View style={[styles.suggestionsContainer, { backgroundColor: colors.background }]}>
            <TouchableOpacity
              style={styles.suggestionsHeader}
              onPress={() => setSuggestionsVisible((v) => !v)}
              activeOpacity={0.7}
            >
              <Sparkles size={12} color="#f59e0b" />
              <Text style={[styles.suggestionsLabel, { color: colors.mutedForeground }]}>AI SUGGESTIONS</Text>
              <ChevronDown
                size={12}
                color={colors.mutedForeground}
                style={{ transform: [{ rotate: suggestionsVisible ? '0deg' : '-90deg' }] }}
              />
            </TouchableOpacity>
            {suggestionsVisible && (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.suggestionsPills}
              >
                {visibleSuggestions.map((suggestion) => (
                  <TouchableOpacity
                    key={suggestion.id}
                    style={[styles.suggestionPill, { backgroundColor: colors.secondary, borderColor: colors.border }]}
                    onPress={() => handleSelectSuggestion(suggestion)}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.suggestionPillText, { color: colors.foreground }]} numberOfLines={1}>
                      {suggestion.text}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            )}
          </View>
        )}

        {/* ─── Compose Bar ───────────────────────────────────────── */}
        <View style={[styles.composeBar, { paddingBottom: keyboardVisible ? 8 : 24, backgroundColor: colors.background }]}>
          {isRecording ? (
            /* Recording state with waveform */
            <View style={styles.recordingBar}>
              <View style={[styles.recordingDot, { backgroundColor: '#ef4444' }]} />
              <Text style={[styles.recordingTime, { color: colors.foreground }]}>
                {Math.floor(recordingDuration / 60)}:{(recordingDuration % 60).toString().padStart(2, '0')}
              </Text>
              <RecordingWaveform isActive={isRecording} color="#ef4444" />
              <TouchableOpacity
                style={[styles.recordCancelBtn, { backgroundColor: colors.secondary }]}
                onPress={cancelRecording}
                activeOpacity={0.7}
              >
                <X size={16} color={colors.mutedForeground} />
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.sendBtn, { backgroundColor: '#ef4444' }]}
                onPress={stopAndSendRecording}
                activeOpacity={0.7}
              >
                <Send size={18} color="#fff" />
              </TouchableOpacity>
            </View>
          ) : (
            /* Normal compose state */
            <>
              <TouchableOpacity activeOpacity={0.7} style={styles.attachBtn} onPress={() => setShowAttachMenu(true)}>
                <Paperclip size={22} color={colors.mutedForeground} />
              </TouchableOpacity>
              <View style={[styles.composeInput, { backgroundColor: colors.secondary }]}>
                <TextInput
                  style={[styles.composeTextInput, { color: colors.foreground }]}
                  placeholder="Type a message..."
                  placeholderTextColor={colors.mutedForeground}
                  value={message}
                  onChangeText={setMessage}
                  multiline
                  maxLength={2000}
                />
              </View>
              {message.trim() ? (
                <TouchableOpacity
                  style={[styles.sendBtn, { backgroundColor: colors.primary }]}
                  onPress={handleSend}
                  activeOpacity={0.7}
                >
                  <Send size={18} color="#fff" />
                </TouchableOpacity>
              ) : (
                <TouchableOpacity
                  style={[styles.sendBtn, { backgroundColor: colors.secondary }]}
                  onPress={startRecording}
                  activeOpacity={0.7}
                >
                  <Mic size={20} color={colors.foreground} />
                </TouchableOpacity>
              )}
            </>
          )}
        </View>
      </KeyboardAvoidingView>

      {/* ─── Message Context Menu Modal ──────────────────────────── */}
      <Modal
        visible={menuVisible}
        transparent
        animationType="fade"
        onRequestClose={closeMenu}
      >
        <Pressable style={styles.menuOverlay} onPress={closeMenu}>
          <View style={styles.menuContainer}>
            {/* Selected message preview */}
            {selectedMessage && (
              <View
                style={[
                  styles.menuPreview,
                  {
                    backgroundColor: selectedMessage.sender === 'me' ? colors.primary : colors.secondary,
                    alignSelf: selectedMessage.sender === 'me' ? 'flex-end' : 'flex-start',
                  },
                ]}
              >
                <Text
                  style={[
                    styles.menuPreviewText,
                    { color: selectedMessage.sender === 'me' ? '#fff' : colors.foreground },
                  ]}
                  numberOfLines={2}
                >
                  {selectedMessage.text}
                </Text>
              </View>
            )}

            {/* Quick Reactions Row */}
            <View style={[styles.reactionsRow, { backgroundColor: colors.card }]}>
              {QUICK_REACTIONS.map((emoji) => {
                const isSelected = selectedMessage && reactions[selectedMessage.id] === emoji;
                return (
                  <TouchableOpacity
                    key={emoji}
                    style={[
                      styles.reactionBtn,
                      isSelected && { backgroundColor: colors.secondary },
                    ]}
                    onPress={() => handleReaction(emoji)}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.reactionBtnEmoji}>{emoji}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Action Menu */}
            <View style={[styles.menuActions, { backgroundColor: colors.card }]}>
              {MENU_ACTIONS.map((action, idx) => {
                const Icon = action.icon;
                const isDestructive = (action as any).destructive;
                return (
                  <TouchableOpacity
                    key={action.id}
                    style={[
                      styles.menuActionItem,
                      idx < MENU_ACTIONS.length - 1 && { borderBottomWidth: 0.5, borderBottomColor: colors.border },
                    ]}
                    onPress={() => handleMenuAction(action.id)}
                    activeOpacity={0.7}
                  >
                    <Icon size={18} color={isDestructive ? '#ef4444' : colors.foreground} />
                    <Text
                      style={[
                        styles.menuActionLabel,
                        { color: isDestructive ? '#ef4444' : colors.foreground },
                      ]}
                    >
                      {action.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        </Pressable>
      </Modal>

      {/* ─── Attachment Menu Modal ──────────────────────────────── */}
      <Modal visible={showAttachMenu} transparent animationType="fade" onRequestClose={() => setShowAttachMenu(false)}>
        <Pressable style={styles.attachOverlay} onPress={() => setShowAttachMenu(false)}>
          <View style={[styles.attachMenu, { backgroundColor: colors.card }]} onStartShouldSetResponder={() => true}>
            <TouchableOpacity
              style={[styles.attachMenuItem, { borderBottomColor: colors.border }]}
              activeOpacity={0.6}
              onPress={() => handleSendAttachment('photo')}
            >
              <View style={[styles.attachMenuIconWrap, { backgroundColor: '#eff6ff' }]}>
                <Image size={18} color="#2563eb" />
              </View>
              <Text style={[styles.attachMenuLabel, { color: colors.foreground }]}>Photo & Video</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.attachMenuItem, { borderBottomColor: colors.border }]}
              activeOpacity={0.6}
              onPress={() => handleSendAttachment('document')}
            >
              <View style={[styles.attachMenuIconWrap, { backgroundColor: '#f5f3ff' }]}>
                <File size={18} color="#8b5cf6" />
              </View>
              <Text style={[styles.attachMenuLabel, { color: colors.foreground }]}>Document</Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Modal>
    </View>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingBottom: 12,
    gap: 10,
    borderBottomWidth: 0.5,
    borderBottomColor: '#e2e8f0',
  },
  backBtn: {
    padding: 4,
  },
  headerAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  headerAvatarText: {
    fontFamily: 'DMSans_700Bold',
    fontSize: 14,
    color: '#fff',
  },
  headerOnlineDot: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#10b981',
    borderWidth: 2,
    borderColor: '#fff',
  },
  headerProfile: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
  },
  headerInfo: {
    flex: 1,
  },
  headerName: {
    fontFamily: 'DMSans_700Bold',
    fontSize: 16,
  },
  headerStatus: {
    fontFamily: 'DMSans_500Medium',
    fontSize: 12,
  },
  headerMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 1,
  },
  headerPlatformRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  headerPlatformText: {
    fontFamily: 'DMSans_600SemiBold',
    fontSize: 11,
  },
  headerActionBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Messages
  messagesList: {
    padding: 16,
    gap: 8,
  },
  messageRow: {
    marginBottom: 4,
  },
  messageRowMe: {
    alignItems: 'flex-end',
  },
  messageBubble: {
    maxWidth: '78%',
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  messageBubbleMe: {
    borderRadius: 20,
    borderBottomRightRadius: 6,
  },
  messageBubbleThem: {
    borderRadius: 20,
    borderBottomLeftRadius: 6,
  },
  messageText: {
    fontFamily: 'DMSans_500Medium',
    fontSize: 15,
    lineHeight: 21,
  },
  messageFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 4,
    marginTop: 4,
  },
  messageTime: {
    fontFamily: 'DMSans_500Medium',
    fontSize: 11,
  },

  // Reaction bubble on message
  reactionBubble: {
    marginTop: -6,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 12,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#f0f0f0',
    alignSelf: 'flex-start',
  },
  reactionBubbleMe: {
    alignSelf: 'flex-end',
    marginRight: 8,
  },
  reactionBubbleThem: {
    alignSelf: 'flex-start',
    marginLeft: 8,
  },
  reactionEmoji: {
    fontSize: 16,
  },

  // ─── Context Menu Modal ─────────────────────────────────────────────────

  menuOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  menuContainer: {
    width: '100%',
    maxWidth: 300,
    gap: 10,
  },
  menuPreview: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 16,
    maxWidth: '85%',
  },
  menuPreviewText: {
    fontFamily: 'DMSans_500Medium',
    fontSize: 14,
    lineHeight: 20,
  },
  reactionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 16,
  },
  reactionBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    justifyContent: 'center',
    alignItems: 'center',
  },
  reactionBtnEmoji: {
    fontSize: 22,
  },
  menuActions: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  menuActionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingHorizontal: 18,
    paddingVertical: 14,
  },
  menuActionLabel: {
    fontFamily: 'DMSans_600SemiBold',
    fontSize: 15,
  },

  // ─── Quick Actions Toolbar ──────────────────────────────────────────────

  toolbarContainer: {
    borderTopWidth: 0.5,
  },
  toolbarHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 2,
  },
  toolbarHeaderText: {
    fontFamily: 'DMSans_700Bold',
    fontSize: 10,
    letterSpacing: 1,
    flex: 1,
  },
  toolbarChipsScroll: {
    paddingTop: 8,
    paddingBottom: 10,
  },
  toolbarChipsContent: {
    paddingHorizontal: 16,
    gap: 10,
    flexDirection: 'row',
  },
  toolbarChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 9999,
  },
  toolbarChipText: {
    fontFamily: 'DMSans_600SemiBold',
    fontSize: 12,
  },

  // Panel
  panelContainer: {
    borderTopWidth: 0.5,
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 10,
    maxHeight: 230,
  },
  panelHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  panelTitle: {
    fontFamily: 'DMSans_700Bold',
    fontSize: 13,
  },
  panelClose: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  panelSuggestHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  maturityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 9999,
  },
  maturityBadgeText: {
    fontFamily: 'DMSans_600SemiBold',
    fontSize: 10,
  },
  suggestPanelItems: {
    gap: 6,
  },
  panelItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    borderRadius: 14,
    marginBottom: 6,
  },
  panelItemIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  panelItemContent: {
    flex: 1,
  },
  panelItemLabel: {
    fontFamily: 'DMSans_700Bold',
    fontSize: 13,
  },
  panelItemLessonCount: {
    fontFamily: 'DMSans_500Medium',
    fontSize: 12,
  },
  panelItemDesc: {
    fontFamily: 'DMSans_500Medium',
    fontSize: 11,
    lineHeight: 15,
    marginTop: 2,
  },
  panelItemMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 4,
  },
  panelItemTag: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 9999,
  },
  panelItemTagText: {
    fontFamily: 'DMSans_600SemiBold',
    fontSize: 10,
  },
  panelItemMetaText: {
    fontFamily: 'DMSans_500Medium',
    fontSize: 10,
  },

  // ─── AI Suggestion Pills ────────────────────────────────────────────────

  suggestionsContainer: {
    paddingTop: 10,
    paddingBottom: 8,
  },
  suggestionsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  suggestionsLabel: {
    fontFamily: 'DMSans_700Bold',
    fontSize: 10,
    letterSpacing: 1,
    flex: 1,
  },
  suggestionsPills: {
    paddingHorizontal: 16,
    gap: 10,
    flexDirection: 'row',
  },
  suggestionPill: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 9999,
    borderWidth: 1,
    maxWidth: 260,
  },
  suggestionPillText: {
    fontFamily: 'DMSans_500Medium',
    fontSize: 12,
  },

  // ─── Compose ────────────────────────────────────────────────────────────

  composeBar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 14,
    paddingTop: 8,
    gap: 10,
  },
  attachBtn: {
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  composeInput: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-end',
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 8,
    minHeight: 44,
  },
  composeTextInput: {
    flex: 1,
    fontFamily: 'DMSans_500Medium',
    fontSize: 15,
    maxHeight: 100,
    padding: 0,
  },
  sendBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Recording bar
  recordingBar: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 10,
    paddingHorizontal: 16,
  },
  recordingDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  recordingTime: {
    fontFamily: 'DMSans_700Bold',
    fontSize: 16,
  },
  recordingLabel: {
    fontFamily: 'DMSans_500Medium',
    fontSize: 13,
  },
  recordCancelBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },

  // Photo bubble
  photoBubble: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  photoFooter: {
    position: 'absolute',
    bottom: 6,
    right: 10,
    backgroundColor: 'rgba(0,0,0,0.35)',
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },

  // Voice message
  voiceMsgContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    minWidth: 180,
  },
  voicePlayBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  voiceDuration: {
    fontFamily: 'DMSans_500Medium',
    fontSize: 11,
    marginLeft: 4,
  },

  // Attachment message content
  attachMsgContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },

  // Attachment menu
  attachOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
    padding: 20,
    paddingBottom: 40,
  },
  attachMenu: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  attachMenuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 0.5,
  },
  attachMenuIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  attachMenuLabel: {
    fontFamily: 'DMSans_600SemiBold',
    fontSize: 15,
  },
});
