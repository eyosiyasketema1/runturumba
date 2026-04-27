'use client';

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  MessageCircle,
  Search,
  Plus,
  Send,
  Paperclip,
  Info,
  X,
  Pin,
  Megaphone,
  Shield,
  Bell,
  BellOff,
  UserPlus,
  MoreVertical,
  Phone,
  Heart,
  ThumbsUp,
  Laugh,
  Flame,
  Smile,
  Zap,
  MessageSquare,
  LogOut,
  Copy,
  Download,
  Trash2,
  Edit2,
  Check,
  CheckCheck,
  Reply,
  Share2,
  CircleCheck,
  Flag,
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from './types';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Separator } from './ui/separator';
import { Switch } from './ui/switch';
import { Avatar, AvatarImage, AvatarFallback } from './ui/avatar';

// Types
interface Mentor {
  id: string;
  name: string;
  avatar: string | null;
  role: 'admin' | 'member';
  online: boolean;
  muted?: boolean;
}

interface Reaction {
  emoji: string;
  count: number;
  reactedBy: string[];
}

interface Poll {
  id: string;
  question: string;
  options: Array<{
    text: string;
    votes: number;
    votedBy: string[];
  }>;
  totalVotes: number;
}

interface Message {
  id: string;
  senderId: string;
  senderName: string;
  senderColor?: string;
  content: string;
  timestamp: Date;
  isAnnouncement?: boolean;
  readBy?: string[];
  isPinned?: boolean;
  reactions?: Reaction[];
  replyTo?: string;
  isVoiceMessage?: boolean;
  isImage?: boolean;
  isPoll?: boolean;
  poll?: Poll;
  isForwarded?: boolean;
  forwardedFrom?: string;
}

interface SystemMessage {
  id: string;
  type: 'join' | 'remove' | 'create' | 'promote';
  content: string;
  timestamp: Date;
}

interface GroupMember extends Mentor {
  joinedAt?: Date;
}

interface Group {
  id: string;
  name: string;
  description?: string;
  createdAt?: Date;
  members: GroupMember[];
  messages: (Message | SystemMessage)[];
  pinnedMessageId?: string;
  lastMessageTime?: Date;
  unreadCount?: number;
  sharedFiles?: Array<{
    id: string;
    name: string;
    size: string;
    uploadedBy: string;
    uploadedAt: Date;
  }>;
}

// Sender colors
const SENDER_COLORS: Record<string, string> = {
  'm1': 'text-indigo-600',
  'm2': 'text-emerald-600',
  'm3': 'text-orange-600',
  'm4': 'text-rose-600',
  'm5': 'text-cyan-600',
  'm6': 'text-violet-600',
  'm7': 'text-amber-600',
  'm8': 'text-teal-600',
  'm9': 'text-pink-600',
  'm10': 'text-blue-600',
};

// Sample data
const SAMPLE_MENTORS: Mentor[] = [
  { id: 'm1', name: 'You', avatar: null, role: 'admin', online: true },
  { id: 'm2', name: 'Sarah Johnson', avatar: null, role: 'admin', online: true },
  { id: 'm3', name: 'David Kim', avatar: null, role: 'member', online: false },
  { id: 'm4', name: 'Maria Garcia', avatar: null, role: 'member', online: true },
  { id: 'm5', name: 'James Okonkwo', avatar: null, role: 'member', online: false },
  { id: 'm6', name: 'Priya Patel', avatar: null, role: 'member', online: true },
  { id: 'm7', name: 'Emmanuel Adeyemi', avatar: null, role: 'member', online: false },
  { id: 'm8', name: 'Rachel Thompson', avatar: null, role: 'member', online: true },
  { id: 'm9', name: 'Daniel Mekonnen', avatar: null, role: 'member', online: false },
  { id: 'm10', name: 'Grace Okafor', avatar: null, role: 'member', online: true },
];

const generateSampleMessages = (): (Message | SystemMessage)[] => [
  {
    id: 'sys-1',
    type: 'create',
    content: 'Group created by You',
    timestamp: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
  },
  {
    id: 'msg-1',
    senderId: 'm2',
    senderName: 'Sarah Johnson',
    senderColor: SENDER_COLORS['m2'],
    content: 'Great to have this space for our prayer requests and updates!',
    timestamp: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000),
    readBy: ['m1'],
    reactions: [{ emoji: '🙏', count: 2, reactedBy: ['m1', 'm4'] }],
  },
  {
    id: 'msg-2',
    senderId: 'm1',
    senderName: 'You',
    senderColor: SENDER_COLORS['m1'],
    content: 'Absolutely. Let\'s keep this intentional and focused on lifting each other up.',
    timestamp: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000),
    readBy: ['m2', 'm4', 'm6'],
    reactions: [
      { emoji: '❤️', count: 3, reactedBy: ['m2', 'm4', 'm6'] },
      { emoji: '✝️', count: 2, reactedBy: ['m8', 'm10'] },
    ],
  },
  {
    id: 'msg-3',
    senderId: 'm4',
    senderName: 'Maria Garcia',
    senderColor: SENDER_COLORS['m4'],
    content: 'Can we pray for our mentees going through difficult seasons? Several of mine are facing challenges with family situations.',
    timestamp: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
    readBy: ['m1', 'm2'],
    isPinned: true,
    reactions: [
      { emoji: '🙏', count: 4, reactedBy: ['m1', 'm2', 'm6', 'm8'] },
      { emoji: '❤️', count: 2, reactedBy: ['m2', 'm10'] },
    ],
  },
  {
    id: 'msg-4',
    senderId: 'm6',
    senderName: 'Priya Patel',
    senderColor: SENDER_COLORS['m6'],
    content: 'I\'ll add them to my prayer journal and lift them up daily.',
    timestamp: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
    isImage: true,
    readBy: ['m1', 'm4'],
    reactions: [{ emoji: '😂', count: 1, reactedBy: ['m4'] }],
  },
  {
    id: 'msg-5',
    senderId: 'm1',
    senderName: 'You',
    senderColor: SENDER_COLORS['m1'],
    content: 'This is important work we\'re doing together. Keep encouraging one another.',
    timestamp: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000),
    isAnnouncement: true,
    readBy: ['m2', 'm4', 'm6', 'm8'],
  },
  {
    id: 'msg-6',
    senderId: 'm8',
    senderName: 'Rachel Thompson',
    senderColor: SENDER_COLORS['m8'],
    content: 'One of my mentees just made a decision to follow Christ! Praise God!',
    timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
    readBy: ['m1', 'm2', 'm4', 'm6'],
    reactions: [
      { emoji: '🎉', count: 5, reactedBy: ['m1', 'm2', 'm4', 'm6', 'm10'] },
      { emoji: '❤️', count: 3, reactedBy: ['m1', 'm4', 'm6'] },
    ],
  },
  {
    id: 'msg-7',
    senderId: 'm1',
    senderName: 'You',
    senderColor: SENDER_COLORS['m1'],
    content: 'That\'s wonderful news! This is why we do this.',
    timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
    readBy: ['m8'],
  },
  {
    id: 'msg-8',
    senderId: 'm2',
    senderName: 'Sarah Johnson',
    senderColor: SENDER_COLORS['m2'],
    content: 'Replying to Rachel: Amazing! How can we support this new believer in their faith journey?',
    timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    readBy: ['m1'],
    replyTo: 'msg-6',
  },
  {
    id: 'msg-9',
    senderId: 'm4',
    senderName: 'Maria Garcia',
    senderColor: SENDER_COLORS['m4'],
    content: 'I have excellent resources on spiritual foundation building I can share.',
    timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    readBy: ['m1', 'm2', 'm8'],
    isForwarded: true,
    forwardedFrom: 'Resource Library',
    reactions: [{ emoji: '👍', count: 3, reactedBy: ['m1', 'm2', 'm8'] }],
  },
  {
    id: 'msg-10',
    senderId: 'm1',
    senderName: 'You',
    senderColor: SENDER_COLORS['m1'],
    content: 'Should we do weekly or biweekly prayer meetings going forward?',
    timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
    readBy: ['m4'],
    isPoll: true,
    poll: {
      id: 'poll-1',
      question: 'Prayer meeting frequency?',
      options: [
        { text: 'Weekly', votes: 4, votedBy: ['m2', 'm4', 'm6', 'm8'] },
        { text: 'Biweekly', votes: 2, votedBy: ['m3', 'm5'] },
      ],
      totalVotes: 6,
    },
  },
];

const generateGroupData = (): Group[] => [
  {
    id: 'g1',
    name: 'Mentors Prayer Circle',
    description: 'A dedicated space for mentors to share prayer requests, encourage each other, and coordinate prayer coverage for our mentees.',
    createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
    members: [
      SAMPLE_MENTORS[0],
      SAMPLE_MENTORS[1],
      SAMPLE_MENTORS[3],
      SAMPLE_MENTORS[5],
      SAMPLE_MENTORS[7],
      SAMPLE_MENTORS[9],
    ] as GroupMember[],
    messages: generateSampleMessages(),
    pinnedMessageId: 'msg-3',
    lastMessageTime: new Date(),
    unreadCount: 0,
    sharedFiles: [
      { id: 'f1', name: 'Prayer_Requests_April.pdf', size: '2.4 MB', uploadedBy: 'You', uploadedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000) },
      { id: 'f2', name: 'Spiritual_Foundations.docx', size: '1.8 MB', uploadedBy: 'Maria Garcia', uploadedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000) },
    ],
  },
  {
    id: 'g2',
    name: 'New Mentor Onboarding',
    description: 'Resources and support for newly trained mentors getting started on their journey.',
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    members: [
      SAMPLE_MENTORS[0],
      SAMPLE_MENTORS[2],
      SAMPLE_MENTORS[4],
      SAMPLE_MENTORS[8],
      SAMPLE_MENTORS[9],
    ] as GroupMember[],
    messages: [
      {
        id: 'sys-2',
        type: 'create',
        content: 'New Mentor Onboarding group created',
        timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      },
      {
        id: 'msg-11',
        senderId: 'm1',
        senderName: 'You',
        senderColor: SENDER_COLORS['m1'],
        content: 'Welcome to our onboarding cohort! This is where we\'ll share resources and answer questions. Looking forward to your impact!',
        timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
        readBy: ['m3', 'm5'],
        isAnnouncement: true,
      },
      {
        id: 'msg-12',
        senderId: 'm9',
        senderName: 'Daniel Mekonnen',
        senderColor: SENDER_COLORS['m9'],
        content: 'Thanks for having us! Excited to start this mentorship journey.',
        timestamp: new Date(Date.now() - 1.5 * 24 * 60 * 60 * 1000),
        readBy: ['m1'],
        reactions: [{ emoji: '🙏', count: 2, reactedBy: ['m1', 'm4'] }],
      },
      {
        id: 'msg-13',
        senderId: 'm1',
        senderName: 'You',
        senderColor: SENDER_COLORS['m1'],
        content: 'First week focus: Getting to know your mentee personally. Schedule your first meeting!',
        timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
        readBy: ['m3', 'm9'],
        isPinned: true,
        isImage: true,
      },
    ],
    pinnedMessageId: 'msg-13',
    lastMessageTime: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
    unreadCount: 0,
    sharedFiles: [
      { id: 'f3', name: 'Mentor_Handbook.pdf', size: '3.2 MB', uploadedBy: 'You', uploadedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000) },
    ],
  },
  {
    id: 'g3',
    name: 'Content Review Team',
    description: 'Collaborative space for reviewing and improving mentorship curriculum.',
    createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
    members: [
      SAMPLE_MENTORS[0],
      SAMPLE_MENTORS[1],
      SAMPLE_MENTORS[3],
      SAMPLE_MENTORS[5],
    ] as GroupMember[],
    messages: [
      {
        id: 'sys-3',
        type: 'create',
        content: 'Content Review Team created',
        timestamp: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
      },
      {
        id: 'msg-14',
        senderId: 'm1',
        senderName: 'You',
        senderColor: SENDER_COLORS['m1'],
        content: 'Module 3 is ready for review. Please provide feedback by end of Friday.',
        timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
        readBy: ['m2', 'm4'],
        isPinned: true,
        reactions: [{ emoji: '👍', count: 2, reactedBy: ['m2', 'm6'] }],
      },
      {
        id: 'msg-15',
        senderId: 'm2',
        senderName: 'Sarah Johnson',
        senderColor: SENDER_COLORS['m2'],
        content: 'Reviewed sections 1-4. Good theological depth. Need to simplify the language in section 3 though.',
        timestamp: new Date(Date.now() - 2.5 * 24 * 60 * 60 * 1000),
        readBy: ['m1', 'm4'],
      },
      {
        id: 'msg-16',
        senderId: 'm4',
        senderName: 'Maria Garcia',
        senderColor: SENDER_COLORS['m4'],
        content: 'Agree with Sarah completely. Also, let\'s add more practical ministry examples?',
        timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
        readBy: ['m1'],
        reactions: [{ emoji: '💯', count: 1, reactedBy: ['m2'] }],
      },
    ],
    pinnedMessageId: 'msg-14',
    lastMessageTime: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    unreadCount: 0,
    sharedFiles: [
      { id: 'f4', name: 'Module_3_Draft.docx', size: '5.1 MB', uploadedBy: 'You', uploadedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000) },
      { id: 'f5', name: 'Module_3_Feedback.xlsx', size: '0.8 MB', uploadedBy: 'Sarah Johnson', uploadedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000) },
    ],
  },
  {
    id: 'g4',
    name: 'Leadership Council',
    description: 'Strategic planning and leadership development discussions.',
    createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
    members: [
      SAMPLE_MENTORS[0],
      SAMPLE_MENTORS[1],
      SAMPLE_MENTORS[7],
    ] as GroupMember[],
    messages: [
      {
        id: 'sys-4',
        type: 'create',
        content: 'Leadership Council created',
        timestamp: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
      },
      {
        id: 'msg-17',
        senderId: 'm1',
        senderName: 'You',
        senderColor: SENDER_COLORS['m1'],
        content: 'Q2 strategy: Expanding our mentorship program to 5 new regions. We need to discuss training and resourcing.',
        timestamp: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
        readBy: ['m2', 'm8'],
        isAnnouncement: true,
      },
      {
        id: 'msg-18',
        senderId: 'm2',
        senderName: 'Sarah Johnson',
        senderColor: SENDER_COLORS['m2'],
        content: 'We should prioritize training for local coordinators in those regions first.',
        timestamp: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000),
        readBy: ['m1'],
        reactions: [{ emoji: '💡', count: 2, reactedBy: ['m1', 'm8'] }],
      },
    ],
    pinnedMessageId: 'msg-17',
    lastMessageTime: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000),
    unreadCount: 0,
    sharedFiles: [],
  },
];

// Helper functions
const getAvatarUrl = (name: string, seed?: string) =>
  `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=6366f1&color=fff&size=40`;

const getGroupAvatarColor = (groupId: string): string => {
  const colors = [
    'bg-blue-500',
    'bg-purple-500',
    'bg-pink-500',
    'bg-green-500',
    'bg-amber-500',
    'bg-rose-500',
  ];
  const index = groupId.charCodeAt(groupId.length - 1) % colors.length;
  return colors[index];
};

const getGroupInitials = (name: string) =>
  name
    .split(' ')
    .slice(0, 2)
    .map(w => w[0])
    .join('')
    .toUpperCase();

const formatTime = (date: Date) => {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return 'now';
  if (diffMins < 60) return `${diffMins}m`;
  if (diffHours < 24) return `${diffHours}h`;
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays}d`;

  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

const formatFullTime = (date: Date) =>
  date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });

const formatFullDate = (date: Date) =>
  date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });

// Message group by date
const groupMessagesByDate = (messages: (Message | SystemMessage)[]): Array<{ date: Date; messages: (Message | SystemMessage)[] }> => {
  const groups: { [key: string]: (Message | SystemMessage)[] } = {};

  messages.forEach(msg => {
    const dateKey = new Date(msg.timestamp).toLocaleDateString('en-US');
    if (!groups[dateKey]) {
      groups[dateKey] = [];
    }
    groups[dateKey].push(msg);
  });

  return Object.entries(groups).map(([dateStr, msgs]) => ({
    date: new Date(dateStr),
    messages: msgs,
  }));
};

// Create Group Modal
interface CreateGroupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateGroup: (name: string, description: string, memberIds: string[]) => void;
  availableMentors: Mentor[];
}

function CreateGroupModal({ isOpen, onClose, onCreateGroup, availableMentors }: CreateGroupModalProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [selectedMentors, setSelectedMentors] = useState<string[]>([]);

  const handleCreate = () => {
    if (!name.trim()) {
      toast.error('Group name is required');
      return;
    }
    onCreateGroup(name, description, ['m1', ...selectedMentors]);
    setName('');
    setDescription('');
    setSelectedMentors([]);
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md rounded-2xl bg-background p-6 shadow-2xl border border-border"
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold">Create New Group</h2>
              <Button
                variant="ghost"
                size="icon"
                onClick={onClose}
                className="h-8 w-8"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            <div className="space-y-5">
              <div>
                <label className="text-sm font-semibold block mb-2">Group Name</label>
                <Input
                  placeholder="e.g., Prayer Circle"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="rounded-lg border-border"
                />
              </div>

              <div>
                <label className="text-sm font-semibold block mb-2">Description</label>
                <textarea
                  placeholder="What is this group for?"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className={cn(
                    'w-full rounded-lg border border-border bg-background px-3.5 py-2.5 text-sm',
                    'placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30'
                  )}
                  rows={3}
                />
              </div>

              <div>
                <label className="text-sm font-semibold mb-3 block">Add Mentors</label>
                <div className="space-y-2 max-h-48 overflow-y-auto bg-muted/30 rounded-lg p-3">
                  {availableMentors
                    .filter((m) => m.id !== 'm1')
                    .map((mentor) => (
                      <label
                        key={mentor.id}
                        className="flex items-center space-x-3 cursor-pointer hover:bg-muted/50 p-2.5 rounded-md transition-colors"
                      >
                        <input
                          type="checkbox"
                          checked={selectedMentors.includes(mentor.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedMentors([...selectedMentors, mentor.id]);
                            } else {
                              setSelectedMentors(
                                selectedMentors.filter((id) => id !== mentor.id)
                              );
                            }
                          }}
                          className="rounded"
                        />
                        <span className="text-sm font-medium">{mentor.name}</span>
                      </label>
                    ))}
                </div>
              </div>

              <div className="flex gap-3 pt-3">
                <Button variant="outline" onClick={onClose} className="flex-1 rounded-lg">
                  Cancel
                </Button>
                <Button onClick={handleCreate} className="flex-1 rounded-lg">
                  Create Group
                </Button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// Group Info Panel
interface GroupInfoPanelProps {
  group: Group;
  isOpen: boolean;
  onClose: () => void;
  currentUserId: string;
  onRemoveMember: (memberId: string) => void;
  onPromoteToAdmin: (memberId: string) => void;
  onToggleMute: (memberId: string) => void;
  onLeaveGroup: () => void;
}

function GroupInfoPanel({
  group,
  isOpen,
  onClose,
  currentUserId,
  onRemoveMember,
  onPromoteToAdmin,
  onToggleMute,
  onLeaveGroup,
}: GroupInfoPanelProps) {
  const currentUserIsAdmin = group.members.some(
    (m) => m.id === currentUserId && m.role === 'admin'
  );
  const onlineCount = group.members.filter(m => m.online).length;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-40 bg-black/20"
          />
          <motion.div
            initial={{ x: 400, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 400, opacity: 0 }}
            transition={{ type: 'spring', damping: 20 }}
            className="fixed right-0 top-0 h-full w-[340px] bg-background border-l border-border shadow-lg overflow-y-auto z-50"
          >
            <div className="p-6 space-y-6">
              {/* Header */}
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold">Group Info</h2>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={onClose}
                  className="h-8 w-8"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>

              {/* Group Details */}
              <div>
                <div className="flex items-center gap-4 mb-4">
                  <div
                    className={cn(
                      'w-16 h-16 rounded-full flex items-center justify-center text-white font-bold text-lg',
                      getGroupAvatarColor(group.id)
                    )}
                  >
                    {getGroupInitials(group.name)}
                  </div>
                  <div>
                    <h3 className="font-bold text-base">{group.name}</h3>
                    <p className="text-sm text-muted-foreground">
                      {onlineCount} of {group.members.length} online
                    </p>
                  </div>
                </div>
                {group.description && (
                  <p className="text-sm text-muted-foreground leading-relaxed">{group.description}</p>
                )}
                {group.createdAt && (
                  <p className="text-xs text-muted-foreground mt-3">
                    Created {formatFullDate(group.createdAt)}
                  </p>
                )}
              </div>

              <Separator />

              {/* Stats */}
              <div className="grid grid-cols-3 gap-3">
                <div className="text-center p-3 bg-muted/30 rounded-lg">
                  <p className="text-sm font-bold">{group.members.length}</p>
                  <p className="text-xs text-muted-foreground">Members</p>
                </div>
                <div className="text-center p-3 bg-muted/30 rounded-lg">
                  <p className="text-sm font-bold">{group.sharedFiles?.length || 0}</p>
                  <p className="text-xs text-muted-foreground">Files</p>
                </div>
                <div className="text-center p-3 bg-muted/30 rounded-lg">
                  <p className="text-sm font-bold">{group.messages.filter(m => 'senderId' in m).length}</p>
                  <p className="text-xs text-muted-foreground">Messages</p>
                </div>
              </div>

              <Separator />

              {/* Members */}
              <div>
                <h4 className="font-semibold text-sm mb-4">Members ({group.members.length})</h4>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {group.members.map((member) => (
                    <motion.div
                      key={member.id}
                      whileHover={{ x: 2 }}
                      className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted/30 group transition-colors"
                    >
                      <Avatar className="h-10 w-10">
                        <AvatarImage
                          src={getAvatarUrl(member.name)}
                          alt={member.name}
                        />
                        <AvatarFallback>
                          {member.name.slice(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold truncate">
                            {member.name}
                          </span>
                          {member.role === 'admin' && (
                            <Badge variant="secondary" className="h-5 text-xs flex-shrink-0">
                              <Shield className="h-3 w-3 mr-1" />
                              Admin
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-1">
                          <div
                            className={cn(
                              'w-2 h-2 rounded-full',
                              member.online ? 'bg-green-500' : 'bg-gray-400'
                            )}
                          />
                          <span className="text-xs text-muted-foreground">
                            {member.online ? 'Online' : 'Offline'}
                          </span>
                        </div>
                      </div>

                      {/* Admin Actions */}
                      {currentUserIsAdmin && member.id !== currentUserId && (
                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          {member.role !== 'admin' && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => onPromoteToAdmin(member.id)}
                              title="Promote to admin"
                              className="h-7 w-7 p-0"
                            >
                              <Shield className="h-3.5 w-3.5" />
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onToggleMute(member.id)}
                            title={member.muted ? 'Unmute' : 'Mute'}
                            className="h-7 w-7 p-0"
                          >
                            {member.muted ? (
                              <BellOff className="h-3.5 w-3.5" />
                            ) : (
                              <Bell className="h-3.5 w-3.5" />
                            )}
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onRemoveMember(member.id)}
                            title="Remove member"
                            className="h-7 w-7 p-0 text-destructive"
                          >
                            <X className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      )}
                    </motion.div>
                  ))}
                </div>

                {currentUserIsAdmin && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full mt-4 gap-2 rounded-lg"
                  >
                    <UserPlus className="h-4 w-4" />
                    Add Member
                  </Button>
                )}
              </div>

              <Separator />

              {/* Pinned Messages */}
              {group.pinnedMessageId && (
                <div>
                  <h4 className="font-semibold text-sm mb-3">Pinned Message</h4>
                  <motion.div
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-4 rounded-lg bg-primary/5 border border-primary/20"
                  >
                    <div className="flex gap-2">
                      <Pin className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
                      <div className="min-w-0 flex-1">
                        <p className="text-sm text-foreground break-words">
                          {(() => {
                            const msg = group.messages.find(
                              m => 'id' in m && m.id === group.pinnedMessageId
                            ) as Message | undefined;
                            return msg ? msg.content.replace(/\[Image:.*?\]/g, '📷') : '';
                          })()}
                        </p>
                        <p className="text-xs text-muted-foreground mt-2">
                          {(() => {
                            const msg = group.messages.find(
                              m => 'id' in m && m.id === group.pinnedMessageId
                            ) as Message | undefined;
                            return msg ? `${msg.senderName} • ${formatTime(msg.timestamp)}` : '';
                          })()}
                        </p>
                      </div>
                    </div>
                  </motion.div>
                </div>
              )}

              {/* Shared Files */}
              {group.sharedFiles && group.sharedFiles.length > 0 && (
                <>
                  <Separator />
                  <div>
                    <h4 className="font-semibold text-sm mb-3">Shared Files</h4>
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                      {group.sharedFiles.map((file) => (
                        <motion.div
                          key={file.id}
                          whileHover={{ x: 2 }}
                          className="p-3 rounded-lg hover:bg-muted/30 transition-colors"
                        >
                          <p className="text-sm font-semibold truncate">{file.name}</p>
                          <div className="text-xs text-muted-foreground flex justify-between mt-1">
                            <span>{file.size}</span>
                            <span>{formatTime(file.uploadedAt)}</span>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                </>
              )}

              <Separator />

              {/* Leave Group */}
              <Button
                variant="destructive"
                onClick={onLeaveGroup}
                className="w-full gap-2 rounded-lg"
              >
                <LogOut className="h-4 w-4" />
                Leave Group
              </Button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

// Inline Emoji Reaction Picker (shown when smiley icon clicked)
function EmojiReactionPicker({
  isSender,
  onReact,
  onClose,
}: {
  isSender: boolean;
  onReact: (emoji: string) => void;
  onClose: () => void;
}) {
  const reactions = ['❤️', '🙏', '😂', '👍', '🔥', '🎉', '😢', '😮'];
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [onClose]);

  return (
    <div
      ref={ref}
      className={cn(
        'absolute bottom-full mb-2 bg-background border border-border rounded-xl shadow-xl p-2 z-[70] whitespace-nowrap',
        isSender ? 'right-0' : 'left-0'
      )}
    >
      <div className="flex gap-1">
        {reactions.map((emoji) => (
          <button
            key={emoji}
            onClick={() => { onReact(emoji); onClose(); }}
            className="p-1.5 hover:bg-muted rounded-lg text-base transition-all hover:scale-125 cursor-pointer"
          >
            {emoji}
          </button>
        ))}
      </div>
    </div>
  );
}

// Context Menu Dropdown (shown when ⋮ icon clicked)
function MessageContextMenu({
  message,
  isSender,
  onReply,
  onCopy,
  onPin,
  onForward,
  onSelect,
  onReport,
  onDelete,
  onClose,
}: {
  message: Message;
  isSender: boolean;
  onReply: () => void;
  onCopy: () => void;
  onPin: () => void;
  onForward: () => void;
  onSelect: () => void;
  onReport: () => void;
  onDelete: () => void;
  onClose: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [onClose]);

  const menuItems = [
    { icon: Reply, label: 'Reply', action: onReply, destructive: false },
    { icon: Copy, label: 'Copy Text', action: onCopy, destructive: false },
    { icon: Pin, label: message.isPinned ? 'Unpin' : 'Pin', action: onPin, destructive: false },
    { icon: Share2, label: 'Forward', action: onForward, destructive: false },
    { icon: CircleCheck, label: 'Select', action: onSelect, destructive: false },
    { icon: Flag, label: 'Report', action: onReport, destructive: false },
    { icon: Trash2, label: 'Delete', action: onDelete, destructive: true },
  ];

  return (
    <div
      ref={ref}
      className={cn(
        'absolute top-full mt-1 w-48 bg-background border border-border rounded-xl shadow-xl z-[70]',
        isSender ? 'right-0' : 'left-0'
      )}
    >
      <div className="py-1.5">
        {menuItems.map((item) => {
          const Icon = item.icon;
          return (
            <React.Fragment key={item.label}>
              {item.destructive && (
                <div className="mx-2 my-1 border-t border-border" />
              )}
              <button
                onClick={() => { item.action(); onClose(); }}
                className={cn(
                  'w-full flex items-center gap-3 px-4 py-2.5 text-sm transition-colors',
                  item.destructive
                    ? 'text-destructive hover:bg-destructive/10'
                    : 'text-foreground hover:bg-muted/60'
                )}
              >
                <Icon className="h-4 w-4 flex-shrink-0" />
                <span>{item.label}</span>
              </button>
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
}

// Emoji Reactions Component
interface ReactionsListProps {
  reactions?: Reaction[];
  onAddReaction: (emoji: string) => void;
}

function ReactionsList({ reactions, onAddReaction }: ReactionsListProps) {
  if (!reactions || reactions.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-1 mt-2">
      {reactions.map((reaction) => (
        <button
          key={reaction.emoji}
          onClick={() => onAddReaction(reaction.emoji)}
          className="px-2 py-1 rounded-full bg-muted/60 hover:bg-muted text-xs font-medium border border-border/50 transition-colors hover:scale-105"
        >
          {reaction.emoji} {reaction.count}
        </button>
      ))}
    </div>
  );
}

// Poll Component
interface PollComponentProps {
  poll: Poll;
  onVote: (optionIndex: number) => void;
}

function PollComponent({ poll, onVote }: PollComponentProps) {
  const maxVotes = Math.max(...poll.options.map(o => o.votes), 1);

  return (
    <div className="mt-3 space-y-2 p-4 rounded-lg bg-muted/20 border border-border/50">
      <p className="font-semibold text-sm mb-3">{poll.question}</p>
      {poll.options.map((option, idx) => (
        <motion.button
          key={idx}
          whileHover={{ x: 2 }}
          onClick={() => onVote(idx)}
          className="w-full text-left"
        >
          <div className="flex items-center justify-between p-3 rounded-lg hover:bg-muted/30 transition-colors border border-border/30">
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <div
                  className="h-2 rounded-full transition-all"
                  style={{
                    width: `${(option.votes / maxVotes) * 80}px`,
                    backgroundColor: 'hsl(var(--primary))',
                  }}
                />
                <span className="text-xs text-muted-foreground ml-2">{option.votes} votes</span>
              </div>
              <p className="text-sm font-medium mt-2">{option.text}</p>
            </div>
            <span className="text-xs text-muted-foreground">
              {maxVotes > 0 ? Math.round((option.votes / maxVotes) * 100) : 0}%
            </span>
          </div>
        </motion.button>
      ))}
      <p className="text-xs text-muted-foreground mt-2">{poll.totalVotes} votes</p>
    </div>
  );
}

// Main Component
export function GroupConversationView() {
  const [groups, setGroups] = useState<Group[]>(generateGroupData());
  const [selectedGroupId, setSelectedGroupId] = useState(groups[0].id);
  const [searchQuery, setSearchQuery] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showGroupInfo, setShowGroupInfo] = useState(false);
  const [messageText, setMessageText] = useState('');
  const [isAnnouncing, setIsAnnouncing] = useState(false);
  const [activeReactionMsgId, setActiveReactionMsgId] = useState<string | null>(null);
  const [activeMenuMsgId, setActiveMenuMsgId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const selectedGroup = groups.find((g) => g.id === selectedGroupId);
  const currentUserId = 'm1';

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [selectedGroupId, selectedGroup?.messages]);

  const handleCreateGroup = (name: string, description: string, memberIds: string[]) => {
    const newGroup: Group = {
      id: `g${Date.now()}`,
      name,
      description,
      createdAt: new Date(),
      members: SAMPLE_MENTORS.filter((m) => memberIds.includes(m.id)) as GroupMember[],
      messages: [
        {
          id: `sys-${Date.now()}`,
          type: 'create',
          content: `${name} group created`,
          timestamp: new Date(),
        },
      ],
      lastMessageTime: new Date(),
      unreadCount: 0,
      sharedFiles: [],
    };
    setGroups([newGroup, ...groups]);
    setSelectedGroupId(newGroup.id);
    toast.success('Group created successfully!');
  };

  const handleSendMessage = () => {
    if (!messageText.trim() || !selectedGroup) return;

    const newMessage: Message = {
      id: `msg-${Date.now()}`,
      senderId: currentUserId,
      senderName: 'You',
      senderColor: SENDER_COLORS[currentUserId],
      content: messageText,
      timestamp: new Date(),
      isAnnouncement: isAnnouncing,
      readBy: [],
      reactions: [],
    };

    const updatedGroups = groups.map((g) =>
      g.id === selectedGroupId
        ? {
            ...g,
            messages: [...g.messages, newMessage],
            lastMessageTime: new Date(),
          }
        : g
    );

    setGroups(updatedGroups);
    setMessageText('');
    setIsAnnouncing(false);
    toast.success(isAnnouncing ? 'Announcement sent!' : 'Message sent!');
  };

  const handleAddReaction = (messageId: string, emoji: string) => {
    const updatedGroups = groups.map((g) => {
      if (g.id !== selectedGroupId) return g;

      return {
        ...g,
        messages: g.messages.map((msg) => {
          if (!('id' in msg) || msg.id !== messageId) return msg;

          const reactions = msg.reactions || [];
          const existingReaction = reactions.find(r => r.emoji === emoji);

          if (existingReaction) {
            if (!existingReaction.reactedBy.includes(currentUserId)) {
              existingReaction.count++;
              existingReaction.reactedBy.push(currentUserId);
            }
          } else {
            reactions.push({
              emoji,
              count: 1,
              reactedBy: [currentUserId],
            });
          }

          return { ...msg, reactions };
        }),
      };
    });

    setGroups(updatedGroups);
    setShowEmojiPicker(null);
  };

  const handleRemoveMember = (memberId: string) => {
    if (!selectedGroup) return;

    const updatedGroups = groups.map((g) =>
      g.id === selectedGroupId
        ? {
            ...g,
            members: g.members.filter((m) => m.id !== memberId),
            messages: [
              ...g.messages,
              {
                id: `sys-${Date.now()}`,
                type: 'remove' as const,
                content: `${g.members.find((m) => m.id === memberId)?.name} was removed`,
                timestamp: new Date(),
              },
            ],
          }
        : g
    );

    setGroups(updatedGroups);
    toast.success('Member removed');
  };

  const handlePromoteToAdmin = (memberId: string) => {
    if (!selectedGroup) return;

    const updatedGroups = groups.map((g) =>
      g.id === selectedGroupId
        ? {
            ...g,
            members: g.members.map((m) =>
              m.id === memberId ? { ...m, role: 'admin' as const } : m
            ),
          }
        : g
    );

    setGroups(updatedGroups);
    toast.success('Member promoted to admin');
  };

  const handleToggleMute = (memberId: string) => {
    if (!selectedGroup) return;

    const updatedGroups = groups.map((g) =>
      g.id === selectedGroupId
        ? {
            ...g,
            members: g.members.map((m) =>
              m.id === memberId ? { ...m, muted: !m.muted } : m
            ),
          }
        : g
    );

    setGroups(updatedGroups);
    toast.success('Member muted');
  };

  const handleLeaveGroup = () => {
    setGroups(groups.filter((g) => g.id !== selectedGroupId));
    setSelectedGroupId(groups.find((g) => g.id !== selectedGroupId)?.id || '');
    setShowGroupInfo(false);
    toast.success('You left the group');
  };

  const handlePinMessage = (messageId: string) => {
    const updatedGroups = groups.map((g) =>
      g.id === selectedGroupId
        ? { ...g, pinnedMessageId: messageId }
        : g
    );
    setGroups(updatedGroups);
    toast.success('Message pinned!');
  };

  const handleDeleteMessage = (messageId: string) => {
    const updatedGroups = groups.map((g) =>
      g.id === selectedGroupId
        ? {
            ...g,
            messages: g.messages.filter((m) => !('id' in m) || m.id !== messageId),
          }
        : g
    );
    setGroups(updatedGroups);
    toast.success('Message deleted');
  };

  const filteredGroups = groups
    .sort(
      (a, b) =>
        (b.lastMessageTime?.getTime() || 0) - (a.lastMessageTime?.getTime() || 0)
    )
    .filter((g) =>
      g.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      g.members.some((m) =>
        m.name.toLowerCase().includes(searchQuery.toLowerCase())
      )
    );

  const currentUserIsAdmin = selectedGroup?.members.some(
    (m) => m.id === currentUserId && m.role === 'admin'
  );

  const messageGroups = selectedGroup ? groupMessagesByDate(selectedGroup.messages) : [];

  return (
    <div className="flex flex-col h-full bg-background overflow-hidden">
      {/* Main Content */}
      <div className="flex flex-row flex-1 overflow-hidden">
        {/* Left Sidebar - Group List */}
        <div className="w-[340px] border-r border-border bg-card flex flex-col">
          {/* Search and Create */}
          <div className="p-5 space-y-4 border-b border-border">
            <div className="relative">
              <Search className="absolute left-3.5 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search groups..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 rounded-lg border-border"
              />
            </div>
            <Button
              onClick={() => setShowCreateModal(true)}
              className="w-full gap-2 rounded-lg"
            >
              <Plus className="h-4 w-4" />
              Create Group
            </Button>
          </div>

          {/* Groups List */}
          <div className="flex-1 overflow-y-auto">
            <div className="space-y-2 p-3">
              {filteredGroups.map((group) => {
                const lastMessage = [...group.messages]
                  .reverse()
                  .find((m) => 'senderId' in m) as Message | undefined;
                const isSelected = selectedGroupId === group.id;
                const onlineCount = group.members.filter(m => m.online).length;

                return (
                  <motion.button
                    key={group.id}
                    onClick={() => setSelectedGroupId(group.id)}
                    whileHover={{ x: 4 }}
                    className={cn(
                      'w-full p-4 rounded-xl text-left transition-all border',
                      isSelected
                        ? 'bg-primary text-primary-foreground border-primary shadow-md'
                        : 'bg-background hover:bg-muted/50 border-transparent'
                    )}
                  >
                    <div className="flex gap-3">
                      {/* Group Avatar with Members */}
                      <div className="relative flex-shrink-0">
                        <div
                          className={cn(
                            'w-12 h-12 rounded-full flex items-center justify-center text-white font-bold',
                            getGroupAvatarColor(group.id)
                          )}
                        >
                          {getGroupInitials(group.name)}
                        </div>
                        {group.unreadCount ? (
                          <Badge className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs rounded-full">
                            {group.unreadCount}
                          </Badge>
                        ) : null}
                      </div>

                      {/* Group Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <h3
                            className={cn(
                              'font-semibold truncate text-sm',
                              isSelected
                                ? 'text-primary-foreground'
                                : 'text-foreground'
                            )}
                          >
                            {group.name}
                          </h3>
                          {group.lastMessageTime && (
                            <span
                              className={cn(
                                'text-xs flex-shrink-0',
                                isSelected
                                  ? 'text-primary-foreground/70'
                                  : 'text-muted-foreground'
                              )}
                            >
                              {formatTime(group.lastMessageTime)}
                            </span>
                          )}
                        </div>
                        <p
                          className={cn(
                            'text-xs truncate mt-1',
                            isSelected
                              ? 'text-primary-foreground/80'
                              : 'text-muted-foreground'
                          )}
                        >
                          {onlineCount} of {group.members.length} online
                        </p>
                        {lastMessage && (
                          <p
                            className={cn(
                              'text-xs truncate mt-1.5 line-clamp-1',
                              isSelected
                                ? 'text-primary-foreground/75'
                                : 'text-muted-foreground'
                            )}
                          >
                            <span className="font-medium">
                              {lastMessage.senderId === currentUserId
                                ? 'You'
                                : lastMessage.senderName}
                              :
                            </span>{' '}
                            {lastMessage.content.replace(/\[Image:.*?\]/g, '📷')}
                          </p>
                        )}
                      </div>
                    </div>
                  </motion.button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Center - Chat Area */}
        {selectedGroup ? (
          <div className="flex-1 flex flex-col bg-background/50 border-l border-border">
            {/* Chat Header */}
            <div className="border-b border-border px-6 py-5 flex items-center justify-between bg-background">
              <div>
                <h2 className="text-lg font-bold">{selectedGroup.name}</h2>
                <p className="text-sm text-muted-foreground">
                  {selectedGroup.members.filter(m => m.online).length} of {selectedGroup.members.length} online
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  title="Search"
                  className="rounded-lg"
                >
                  <Search className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  title="Voice call"
                  className="rounded-lg"
                >
                  <Phone className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setShowGroupInfo(true)}
                  className="rounded-lg"
                >
                  <Info className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Pinned Message Banner */}
            {selectedGroup.pinnedMessageId && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="px-6 py-3 bg-primary/5 border-b border-primary/20 flex items-center justify-between"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <Pin className="h-4 w-4 text-primary flex-shrink-0" />
                  <span className="text-sm text-foreground truncate">
                    {(() => {
                      const msg = selectedGroup.messages.find(
                        (m) => 'id' in m && m.id === selectedGroup.pinnedMessageId
                      ) as Message | undefined;
                      return msg
                        ? msg.content.replace(/\[Image:.*?\]/g, '📷')
                        : '';
                    })()}
                  </span>
                </div>
                <button className="text-primary hover:underline text-xs font-medium flex-shrink-0 ml-2">
                  View
                </button>
              </motion.div>
            )}

            {/* Messages Area */}
            <div
              ref={scrollContainerRef}
              className="flex-1 overflow-y-auto px-6 py-5 space-y-6"
            >
              {messageGroups.map((group, groupIdx) => (
                <div key={`group-${groupIdx}`}>
                  {/* Date Divider */}
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-center gap-3 my-6"
                  >
                    <div className="flex-1 h-px bg-border" />
                    <p className="text-xs text-muted-foreground font-medium whitespace-nowrap">
                      {(() => {
                        const today = new Date();
                        const yesterday = new Date(today);
                        yesterday.setDate(yesterday.getDate() - 1);

                        const msgDate = new Date(group.date);
                        msgDate.setHours(0, 0, 0, 0);
                        today.setHours(0, 0, 0, 0);
                        yesterday.setHours(0, 0, 0, 0);

                        if (msgDate.getTime() === today.getTime()) return 'Today';
                        if (msgDate.getTime() === yesterday.getTime()) return 'Yesterday';
                        return msgDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                      })()}
                    </p>
                    <div className="flex-1 h-px bg-border" />
                  </motion.div>

                  {/* Messages */}
                  <div className="space-y-4">
                    {group.messages.map((msg) => {
                      if ('type' in msg) {
                        // System message
                        return (
                          <motion.div
                            key={msg.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="flex justify-center"
                          >
                            <p className="text-xs text-muted-foreground italic bg-muted/40 px-3 py-1.5 rounded-full">
                              {msg.content}
                            </p>
                          </motion.div>
                        );
                      }

                      const isSender = msg.senderId === currentUserId;
                      const isAnnouncement = msg.isAnnouncement;

                      return (
                        <div
                          key={msg.id}
                          className={cn(
                            'group/msg flex gap-3 relative',
                            isSender && 'flex-row-reverse'
                          )}
                        >
                          {/* Avatar */}
                          {!isSender && (
                            <Avatar className="h-9 w-9 flex-shrink-0 mt-1">
                              <AvatarImage
                                src={getAvatarUrl(msg.senderName)}
                                alt={msg.senderName}
                              />
                              <AvatarFallback>
                                {msg.senderName.slice(0, 2).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                          )}

                          {/* Message Bubble Container */}
                          <div
                            className={cn(
                              'flex flex-col max-w-[65%]',
                              isSender && 'items-end'
                            )}
                          >
                            {/* Sender Name */}
                            {!isSender && (
                              <p className={cn('text-xs font-semibold mb-1', msg.senderColor || 'text-foreground')}>
                                {msg.senderName}
                              </p>
                            )}

                            {/* Reply Preview */}
                            {msg.replyTo && (
                              <div className={cn(
                                'mb-2 p-2 rounded-lg border-l-3 border-primary/50 text-xs max-w-xs',
                                isSender ? 'bg-primary/20' : 'bg-muted/50'
                              )}>
                                <p className="font-semibold text-muted-foreground">Replying to...</p>
                                <p className="text-foreground/80 truncate mt-0.5">Sample message</p>
                              </div>
                            )}

                            {/* Bubble row: action icons + bubble */}
                            <div className={cn(
                              'flex items-start gap-1',
                              isSender && 'flex-row-reverse'
                            )}>
                              {/* Message Bubble */}
                              <div
                                className={cn(
                                  'px-4 py-3 rounded-2xl break-words shadow-sm',
                                  isAnnouncement
                                    ? 'bg-amber-50 border border-amber-200 text-foreground'
                                    : isSender
                                    ? 'bg-primary text-primary-foreground rounded-tr-sm'
                                    : 'bg-card border border-border rounded-tl-sm'
                                )}
                              >
                                <div className="flex items-start gap-2">
                                  {isAnnouncement && (
                                    <Megaphone className="h-4 w-4 flex-shrink-0 mt-0.5 text-amber-600" />
                                  )}
                                  <div className="flex-1">
                                    {isAnnouncement && (
                                      <p className="text-xs font-bold mb-1 opacity-75">
                                        📢 ANNOUNCEMENT
                                      </p>
                                    )}
                                    <p className="text-sm leading-relaxed">{msg.content}</p>
                                    {msg.isImage && (
                                      <div className="mt-2 h-40 w-40 rounded-lg bg-muted/30 border border-border/50 flex items-center justify-center">
                                        <MessageSquare className="h-8 w-8 text-muted-foreground" />
                                      </div>
                                    )}
                                    {msg.isPoll && msg.poll && (
                                      <PollComponent
                                        poll={msg.poll}
                                        onVote={(optionIdx) => {
                                          toast.info('Vote recorded!');
                                        }}
                                      />
                                    )}
                                  </div>
                                </div>
                              </div>

                              {/* Action Icons — visible on hover */}
                              <div className={cn(
                                'flex items-center gap-0.5 pt-2 opacity-0 group-hover/msg:opacity-100 transition-opacity',
                                (activeReactionMsgId === msg.id || activeMenuMsgId === msg.id) && 'opacity-100'
                              )}>
                                {/* Reaction smiley */}
                                <div className="relative">
                                  <button
                                    onClick={() => {
                                      setActiveReactionMsgId(activeReactionMsgId === msg.id ? null : msg.id);
                                      setActiveMenuMsgId(null);
                                    }}
                                    className="p-1.5 rounded-full hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                                    title="React"
                                  >
                                    <Smile className="h-4 w-4" />
                                  </button>
                                  {activeReactionMsgId === msg.id && (
                                    <EmojiReactionPicker
                                      isSender={isSender}
                                      onReact={(emoji) => handleAddReaction(msg.id, emoji)}
                                      onClose={() => setActiveReactionMsgId(null)}
                                    />
                                  )}
                                </div>

                                {/* Context menu ⋮ */}
                                <div className="relative">
                                  <button
                                    onClick={() => {
                                      setActiveMenuMsgId(activeMenuMsgId === msg.id ? null : msg.id);
                                      setActiveReactionMsgId(null);
                                    }}
                                    className="p-1.5 rounded-full hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                                    title="More options"
                                  >
                                    <MoreVertical className="h-4 w-4" />
                                  </button>
                                  {activeMenuMsgId === msg.id && (
                                    <MessageContextMenu
                                      message={msg}
                                      isSender={isSender}
                                      onReply={() => toast.info(`Replying to ${msg.senderName}`)}
                                      onCopy={() => {
                                        navigator.clipboard.writeText(msg.content);
                                        toast.success('Copied to clipboard');
                                      }}
                                      onPin={() => handlePinMessage(msg.id)}
                                      onForward={() => toast.info('Forward — coming soon')}
                                      onSelect={() => toast.info('Select mode — coming soon')}
                                      onReport={() => toast.info('Message reported')}
                                      onDelete={() => handleDeleteMessage(msg.id)}
                                      onClose={() => setActiveMenuMsgId(null)}
                                    />
                                  )}
                                </div>
                              </div>
                            </div>

                            {/* Forwarded Label */}
                            {msg.isForwarded && msg.forwardedFrom && (
                              <p className="text-xs text-muted-foreground italic mt-1">
                                Forwarded from {msg.forwardedFrom}
                              </p>
                            )}

                            {/* Timestamp & Read Status */}
                            <div className="flex items-center gap-2 mt-1">
                              <p className="text-xs text-muted-foreground">
                                {formatFullTime(msg.timestamp)}
                              </p>
                              {isSender && (
                                <div className="flex items-center gap-0.5">
                                  <Check className="h-3 w-3 text-muted-foreground" />
                                  {msg.readBy && msg.readBy.length > 0 && (
                                    <CheckCheck className="h-3 w-3 text-primary" />
                                  )}
                                </div>
                              )}
                            </div>

                            {/* Reactions */}
                            <ReactionsList
                              reactions={msg.reactions}
                              onAddReaction={(emoji) => handleAddReaction(msg.id, emoji)}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            {/* Compose Area */}
            <div className="border-t border-border px-6 py-5 bg-background space-y-3">
              {/* Announce Mode Banner */}
              {isAnnouncing && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-center gap-3 p-3 rounded-lg bg-amber-50 border border-amber-200"
                >
                  <Megaphone className="h-4 w-4 text-amber-600 flex-shrink-0" />
                  <span className="text-sm font-medium text-amber-900">
                    📢 Composing announcement
                  </span>
                  <button
                    onClick={() => setIsAnnouncing(false)}
                    className="ml-auto text-amber-600 hover:text-amber-700 transition-colors"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </motion.div>
              )}

              {/* Compose Input */}
              <div className="flex gap-3 items-end">
                <Button
                  variant="ghost"
                  size="icon"
                  title="Attach file"
                  className="rounded-lg flex-shrink-0"
                >
                  <Paperclip className="h-5 w-5" />
                </Button>

                <div className="flex-1 relative">
                  <textarea
                    placeholder="Type a message..."
                    value={messageText}
                    onChange={(e) => setMessageText(e.target.value)}
                    onKeyDown={(e) => {
                      if (
                        e.key === 'Enter' &&
                        !e.shiftKey
                      ) {
                        e.preventDefault();
                        handleSendMessage();
                      }
                    }}
                    className={cn(
                      'w-full rounded-xl border border-border bg-background px-4 py-3 text-sm resize-none',
                      'placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30',
                      'max-h-24'
                    )}
                    rows={1}
                  />
                </div>

                {currentUserIsAdmin && !isAnnouncing && (
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setIsAnnouncing(true)}
                    title="Send as announcement"
                    className="rounded-lg flex-shrink-0"
                  >
                    <Megaphone className="h-4 w-4" />
                  </Button>
                )}

                <Button
                  onClick={handleSendMessage}
                  disabled={!messageText.trim()}
                  className="rounded-lg flex-shrink-0"
                  size="icon"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <p className="text-muted-foreground">Select a group to start chatting</p>
          </div>
        )}
      </div>

      {/* Modals */}
      <CreateGroupModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onCreateGroup={handleCreateGroup}
        availableMentors={SAMPLE_MENTORS}
      />

      {selectedGroup && (
        <GroupInfoPanel
          group={selectedGroup}
          isOpen={showGroupInfo}
          onClose={() => setShowGroupInfo(false)}
          currentUserId={currentUserId}
          onRemoveMember={handleRemoveMember}
          onPromoteToAdmin={handlePromoteToAdmin}
          onToggleMute={handleToggleMute}
          onLeaveGroup={handleLeaveGroup}
        />
      )}
    </div>
  );
}
