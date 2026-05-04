import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import {
  ArrowLeft,
  Phone,
  MoreVertical,
  Send,
  Paperclip,
  Smile,
  Mic,
  Check,
  CheckCheck,
} from 'lucide-react-native';
import { useTheme } from '@/hooks/use-theme';

// Sample messages
const MESSAGES = [
  {
    id: '1',
    text: 'Hi Sarah! How are you doing today?',
    sender: 'me',
    time: '9:00 AM',
    status: 'read' as const,
  },
  {
    id: '2',
    text: 'I\'m doing great, thank you! I\'ve been reading the devotional you shared.',
    sender: 'them',
    time: '9:05 AM',
    status: 'read' as const,
  },
  {
    id: '3',
    text: 'That\'s wonderful to hear! What did you think about the section on prayer?',
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
    text: 'Yes, I tried last night before bed. It felt really different — peaceful. I actually cried a little.',
    sender: 'them',
    time: '9:15 AM',
    status: 'read' as const,
  },
  {
    id: '7',
    text: 'That\'s beautiful, Sarah. Those tears are often the Holy Spirit touching your heart. Keep going! 🙏',
    sender: 'me',
    time: '9:17 AM',
    status: 'delivered' as const,
  },
  {
    id: '8',
    text: 'Thank you for the prayer guide! I have a question about the section on fasting — is it required?',
    sender: 'them',
    time: '9:30 AM',
    status: 'read' as const,
  },
];

export default function ChatDetailScreen() {
  const colors = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const [message, setMessage] = useState('');
  const flatListRef = useRef<FlatList>(null);

  // For now, hardcode the seeker info based on the route
  const seekerName = 'Sarah Johnson';
  const seekerInitials = 'SJ';
  const seekerColor = '#2563eb';
  const seekerMaturity = 'New Believer';
  const isOnline = true;

  const renderMessage = ({ item }: { item: typeof MESSAGES[0] }) => {
    const isMe = item.sender === 'me';
    return (
      <View style={[styles.messageRow, isMe && styles.messageRowMe]}>
        <View
          style={[
            styles.messageBubble,
            isMe
              ? [styles.messageBubbleMe, { backgroundColor: colors.primary }]
              : [styles.messageBubbleThem, { backgroundColor: colors.secondary }],
          ]}
        >
          <Text
            style={[
              styles.messageText,
              { color: isMe ? '#fff' : colors.foreground },
            ]}
          >
            {item.text}
          </Text>
          <View style={styles.messageFooter}>
            <Text
              style={[
                styles.messageTime,
                { color: isMe ? 'rgba(255,255,255,0.7)' : colors.mutedForeground },
              ]}
            >
              {item.time}
            </Text>
            {isMe && (
              item.status === 'read' ? (
                <CheckCheck size={14} color="rgba(255,255,255,0.7)" />
              ) : (
                <Check size={14} color="rgba(255,255,255,0.7)" />
              )
            )}
          </View>
        </View>
      </View>
    );
  };

  const handleSend = () => {
    if (!message.trim()) return;
    setMessage('');
  };

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 8, backgroundColor: colors.background }]}>
        <TouchableOpacity onPress={() => router.back()} activeOpacity={0.7} style={styles.backBtn}>
          <ArrowLeft size={22} color={colors.foreground} />
        </TouchableOpacity>

        <View style={[styles.headerAvatar, { backgroundColor: seekerColor }]}>
          <Text style={styles.headerAvatarText}>{seekerInitials}</Text>
          {isOnline && <View style={styles.headerOnlineDot} />}
        </View>

        <View style={styles.headerInfo}>
          <Text style={[styles.headerName, { color: colors.foreground }]} numberOfLines={1}>
            {seekerName}
          </Text>
          <Text style={[styles.headerStatus, { color: colors.mutedForeground }]}>
            {isOnline ? 'Online' : 'Offline'} · {seekerMaturity}
          </Text>
        </View>

        <View style={styles.headerActions}>
          <TouchableOpacity style={[styles.headerActionBtn, { backgroundColor: colors.secondary }]} activeOpacity={0.7}>
            <Phone size={18} color={colors.foreground} />
          </TouchableOpacity>
          <TouchableOpacity style={[styles.headerActionBtn, { backgroundColor: colors.secondary }]} activeOpacity={0.7}>
            <MoreVertical size={18} color={colors.foreground} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Messages */}
      <FlatList
        ref={flatListRef}
        data={MESSAGES}
        renderItem={renderMessage}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.messagesList}
        showsVerticalScrollIndicator={false}
        onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: false })}
      />

      {/* Compose Bar */}
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={0}
      >
        <View style={[styles.composeBar, { paddingBottom: Math.max(insets.bottom, 12), backgroundColor: colors.background }]}>
          <TouchableOpacity activeOpacity={0.7}>
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
            <TouchableOpacity activeOpacity={0.7}>
              <Smile size={20} color={colors.mutedForeground} />
            </TouchableOpacity>
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
              activeOpacity={0.7}
            >
              <Mic size={20} color={colors.foreground} />
            </TouchableOpacity>
          )}
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

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
    marginTop: 1,
  },
  headerActions: {
    flexDirection: 'row',
    gap: 6,
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
    flexDirection: 'row',
    marginBottom: 4,
  },
  messageRowMe: {
    justifyContent: 'flex-end',
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

  // Compose
  composeBar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 14,
    paddingTop: 10,
    gap: 10,
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
});
