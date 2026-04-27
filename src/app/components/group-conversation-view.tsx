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
  Mic,
  Square,
  BarChart3,
  Eye,
  EyeOff,
  Lock,
  Users,
  ChevronDown,
  ChevronUp,
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
  isAnonymous?: boolean;
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
      isAnonymous: false,
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
  isSender?: boolean;
}

// Helper to get a display name from mentor ID
function getMentorDisplayName(id: string): string {
  const names: Record<string, string> = {
    m1: 'You', m2: 'Rachel Kim', m3: 'James Okafor', m4: 'Sarah Chen',
    m5: 'David Martinez', m6: 'Grace Afolabi', m7: 'Daniel Park',
    m8: 'Maria Santos', m9: 'Peter Njoroge', m10: 'Anna Müller',
  };
  return names[id] || id;
}

// Poll Results Modal
function PollResultsModal({ poll, onClose }: { poll: Poll; onClose: () => void }) {
  const totalVotes = poll.totalVotes || poll.options.reduce((s, o) => s + o.votes, 0);
  const sortedOptions = [...poll.options].sort((a, b) => b.votes - a.votes);

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          onClick={(e) => e.stopPropagation()}
          className="w-full max-w-md bg-background border border-border shadow-2xl overflow-hidden"
        >
          {/* Header */}
          <div className="px-6 py-4 border-b border-border bg-muted/30">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-primary" />
                <h3 className="font-bold text-base">Poll Results</h3>
              </div>
              <button onClick={onClose} className="p-1 text-muted-foreground hover:text-foreground transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="text-sm font-semibold text-foreground mt-2">{poll.question}</p>
            <div className="flex items-center gap-3 mt-2">
              <span className="flex items-center gap-1 text-xs text-muted-foreground">
                <Users className="w-3 h-3" /> {totalVotes} vote{totalVotes !== 1 ? 's' : ''}
              </span>
              <span className="flex items-center gap-1 text-xs text-muted-foreground">
                {poll.isAnonymous ? <><Lock className="w-3 h-3" /> Anonymous</> : <><Eye className="w-3 h-3" /> Public</>}
              </span>
            </div>
          </div>

          {/* Results */}
          <div className="px-6 py-4 space-y-4 max-h-[60vh] overflow-y-auto">
            {sortedOptions.map((option, idx) => {
              const pct = totalVotes > 0 ? Math.round((option.votes / totalVotes) * 100) : 0;
              const isTop = idx === 0 && option.votes > 0;

              return (
                <div key={idx} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className={cn('text-sm font-semibold', isTop && 'text-primary')}>
                      {isTop && <span className="mr-1">🏆</span>}
                      {option.text}
                    </span>
                    <span className="text-sm font-bold">{pct}%</span>
                  </div>
                  <div className="w-full h-3 bg-muted rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${pct}%` }}
                      transition={{ duration: 0.6, ease: 'easeOut' }}
                      className={cn('h-full rounded-full', isTop ? 'bg-primary' : 'bg-primary/40')}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">{option.votes} vote{option.votes !== 1 ? 's' : ''}</span>
                  </div>

                  {/* Voter list (public only) */}
                  {!poll.isAnonymous && option.votedBy.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {option.votedBy.map(id => (
                        <span key={id} className="inline-flex items-center gap-1 px-2 py-0.5 bg-muted text-xs font-medium text-foreground rounded-full">
                          <div className="w-4 h-4 rounded-full bg-primary/20 flex items-center justify-center text-[8px] font-bold text-primary">
                            {getMentorDisplayName(id).charAt(0)}
                          </div>
                          {getMentorDisplayName(id)}
                        </span>
                      ))}
                    </div>
                  )}

                  {poll.isAnonymous && option.votes > 0 && (
                    <p className="text-xs text-muted-foreground italic flex items-center gap-1">
                      <Lock className="w-3 h-3" /> Voters hidden
                    </p>
                  )}
                </div>
              );
            })}
          </div>

          {/* Footer */}
          <div className="px-6 py-3 border-t border-border bg-muted/10">
            <button onClick={onClose} className="w-full py-2 text-sm font-semibold text-center text-muted-foreground hover:text-foreground transition-colors">
              Close
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

function PollComponent({ poll, onVote, isSender }: PollComponentProps) {
  const [showResults, setShowResults] = useState(false);
  const totalVotes = poll.totalVotes || poll.options.reduce((s, o) => s + o.votes, 0);
  const maxVotes = Math.max(...poll.options.map(o => o.votes), 1);

  return (
    <>
      <div className={cn(
        'mt-3 rounded-lg overflow-hidden',
        isSender ? 'bg-background/95 text-foreground' : 'bg-card border border-border'
      )}>
        {/* Poll header */}
        <div className="px-4 pt-4 pb-2">
          <div className="flex items-start gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
              <BarChart3 className="w-4 h-4 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-bold text-sm text-foreground leading-snug">{poll.question}</p>
              <div className="flex items-center gap-2 mt-1">
                {poll.isAnonymous
                  ? <span className="flex items-center gap-1 text-xs text-muted-foreground"><Lock className="w-3 h-3" /> Anonymous</span>
                  : <span className="flex items-center gap-1 text-xs text-muted-foreground"><Eye className="w-3 h-3" /> Public</span>
                }
                <span className="text-xs text-muted-foreground">·</span>
                <span className="text-xs text-muted-foreground">{totalVotes} vote{totalVotes !== 1 ? 's' : ''}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Options */}
        <div className="px-4 pb-2 space-y-1.5">
          {poll.options.map((option, idx) => {
            const pct = totalVotes > 0 ? Math.round((option.votes / totalVotes) * 100) : 0;
            const isWinning = option.votes === maxVotes && option.votes > 0;

            return (
              <button
                key={idx}
                onClick={() => onVote(idx)}
                className="w-full text-left rounded-md overflow-hidden relative transition-all hover:ring-1 hover:ring-primary/30 group"
              >
                <div className={cn('absolute inset-0 rounded-md', isWinning ? 'bg-primary/12' : 'bg-muted/40')} style={{ width: `${pct}%` }} />
                <div className="relative flex items-center justify-between px-3 py-2.5">
                  <span className={cn('text-sm font-medium', isWinning && 'text-primary font-semibold')}>
                    {option.text}
                  </span>
                  <span className={cn('text-xs font-bold shrink-0 ml-2', isWinning ? 'text-primary' : 'text-muted-foreground')}>
                    {pct}%
                  </span>
                </div>
              </button>
            );
          })}
        </div>

        {/* Footer — View Results button */}
        <div className="px-4 pb-3 pt-1">
          <button
            onClick={(e) => { e.stopPropagation(); setShowResults(true); }}
            className="w-full flex items-center justify-center gap-2 py-2 text-xs font-semibold text-primary hover:bg-primary/5 rounded-md border border-primary/20 transition-colors"
          >
            <Eye className="w-3.5 h-3.5" />
            View Results
          </button>
        </div>
      </div>

      {/* Results Modal */}
      {showResults && (
        <PollResultsModal poll={poll} onClose={() => setShowResults(false)} />
      )}
    </>
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
  // Voice recording
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [voiceBlob, setVoiceBlob] = useState<Blob | null>(null);
  const [voiceUrl, setVoiceUrl] = useState<string | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  // Poll creator
  const [showPollCreator, setShowPollCreator] = useState(false);
  const [pollQuestion, setPollQuestion] = useState('');
  const [pollOptions, setPollOptions] = useState(['', '']);
  const [pollIsAnonymous, setPollIsAnonymous] = useState(false);

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

  // ── Voice recording helpers ──
  const formatDuration = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      chunksRef.current = [];
      recorder.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data); };
      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        setVoiceBlob(blob);
        setVoiceUrl(URL.createObjectURL(blob));
        stream.getTracks().forEach(t => t.stop());
      };
      recorder.start();
      mediaRecorderRef.current = recorder;
      setIsRecording(true);
      setRecordingDuration(0);
      timerRef.current = setInterval(() => setRecordingDuration(d => d + 1), 1000);
    } catch {
      toast.error('Microphone access denied');
    }
  };

  const stopRecording = () => {
    mediaRecorderRef.current?.stop();
    setIsRecording(false);
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
  };

  const discardVoice = () => {
    if (voiceUrl) URL.revokeObjectURL(voiceUrl);
    setVoiceBlob(null);
    setVoiceUrl(null);
    setRecordingDuration(0);
  };

  // ── Poll helpers ──
  const handleSendPoll = () => {
    if (!pollQuestion.trim() || pollOptions.filter(o => o.trim()).length < 2) {
      toast.error('Provide a question and at least 2 options');
      return;
    }
    if (!selectedGroup) return;
    const newPoll: Poll = {
      id: `poll-${Date.now()}`,
      question: pollQuestion.trim(),
      options: pollOptions.filter(o => o.trim()).map(text => ({ text: text.trim(), votes: 0, votedBy: [] })),
      totalVotes: 0,
      isAnonymous: pollIsAnonymous,
    };
    const pollMsg: Message = {
      id: `msg-${Date.now()}`,
      senderId: currentUserId,
      senderName: 'You',
      senderColor: SENDER_COLORS[currentUserId],
      content: `📊 Poll: ${pollQuestion.trim()}`,
      timestamp: new Date(),
      isPoll: true,
      poll: newPoll,
    };
    setGroups(prev => prev.map(g =>
      g.id === selectedGroup.id
        ? { ...g, messages: [...g.messages, pollMsg], lastMessageTime: new Date() }
        : g
    ));
    setPollQuestion('');
    setPollOptions(['', '']);
    setPollIsAnonymous(false);
    setShowPollCreator(false);
    toast.success('Poll sent!');
  };

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
    if (!selectedGroup) return;

    const parts: string[] = [];
    if (voiceBlob) {
      parts.push(`🎤 Voice message (${formatDuration(recordingDuration)})`);
    }
    if (messageText.trim()) {
      parts.push(messageText.trim());
    }
    if (parts.length === 0) return;

    const newMessage: Message = {
      id: `msg-${Date.now()}`,
      senderId: currentUserId,
      senderName: 'You',
      senderColor: SENDER_COLORS[currentUserId],
      content: parts.join('\n\n'),
      timestamp: new Date(),
      isAnnouncement: isAnnouncing,
      isVoiceMessage: !!voiceBlob,
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
    discardVoice();
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
    <div className="flex flex-col h-full bg-background overflow-hidden animate-in fade-in duration-300">

      {/* Main Content */}
      <div className="flex flex-1 overflow-hidden">

        {/* ── Sidebar - Group List ── */}
        <aside className="w-[340px] xl:w-[400px] border-r border-border bg-card flex flex-col shrink-0">

          {/* Search */}
          <div className="px-4 py-3 border-b border-border bg-muted/10">
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search groups…"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-background border border-input text-sm focus:ring-1 focus:ring-ring outline-none transition-all"
              />
            </div>
          </div>

          {/* Create Group Button */}
          <div className="px-4 py-2.5 border-b border-border bg-muted/5">
            <button
              onClick={() => setShowCreateModal(true)}
              className="flex items-center gap-2 px-4 py-1.5 bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-colors w-full justify-center"
            >
              <Plus className="h-3.5 w-3.5" />
              Create Group
            </button>
          </div>

          {/* Groups List */}
          <div className="flex-1 overflow-y-auto custom-scrollbar">
            {filteredGroups.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-center px-8 gap-3">
                <div className="w-14 h-14 bg-muted flex items-center justify-center opacity-20">
                  <MessageCircle className="w-7 h-7" />
                </div>
                <p className="text-sm text-muted-foreground">No groups found.</p>
              </div>
            ) : (
              filteredGroups.map((group) => {
                const lastMessage = [...group.messages]
                  .reverse()
                  .find((m) => 'senderId' in m) as Message | undefined;
                const isSelected = selectedGroupId === group.id;
                const onlineCount = group.members.filter(m => m.online).length;

                return (
                  <button
                    key={group.id}
                    onClick={() => setSelectedGroupId(group.id)}
                    className={cn(
                      'w-full flex items-start gap-3.5 px-4 py-4 text-left border-b border-border/50 transition-all border-l-[3px]',
                      isSelected
                        ? 'bg-primary/5 border-l-primary'
                        : 'hover:bg-muted/40 border-l-transparent'
                    )}
                  >
                    {/* Group Avatar */}
                    <div className="relative shrink-0">
                      <div
                        className={cn(
                          'w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold shadow-sm border',
                          isSelected
                            ? 'bg-primary text-primary-foreground border-primary'
                            : 'bg-muted text-muted-foreground border-border'
                        )}
                      >
                        {getGroupInitials(group.name)}
                      </div>
                      {group.unreadCount > 0 && (
                        <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-primary text-primary-foreground text-xs font-bold flex items-center justify-center">
                          {group.unreadCount}
                        </span>
                      )}
                    </div>

                    {/* Group Info */}
                    <div className="flex-1 min-w-0">
                      {/* Row 1: name + time */}
                      <div className="flex items-center justify-between gap-2 mb-1.5">
                        <span className={cn('text-sm font-bold truncate', isSelected ? 'text-primary' : 'text-foreground')}>
                          {group.name}
                        </span>
                        <div className="flex items-center gap-1.5 shrink-0">
                          {group.lastMessageTime && (
                            <span className="text-xs font-semibold text-muted-foreground">
                              {formatTime(group.lastMessageTime)}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Row 2: online count */}
                      <p className="text-xs text-muted-foreground mb-1">
                        {onlineCount} of {group.members.length} online
                      </p>

                      {/* Row 3: last message preview */}
                      <p className="text-xs text-muted-foreground truncate leading-relaxed">
                        {lastMessage ? (
                          <>
                            <span className="font-medium">
                              {lastMessage.senderId === currentUserId
                                ? 'You'
                                : lastMessage.senderName}
                              :
                            </span>{' '}
                            {lastMessage.content.replace(/\[Image:.*?\]/g, '📷')}
                          </>
                        ) : (
                          'No messages yet'
                        )}
                      </p>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </aside>

        {/* ── Chat Pane ── */}
        <div className="flex-1 flex overflow-hidden">
        {selectedGroup ? (
          <div className="flex-1 flex flex-col bg-background overflow-hidden">
            {/* Chat Header */}
            <div className="border-b border-border px-6 py-4 flex items-center justify-between bg-background shrink-0">
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
              className="flex-1 overflow-y-auto py-4 px-6 space-y-6 custom-scrollbar bg-muted/5"
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
                                        isSender={isSender}
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
                                msg.readBy && msg.readBy.length > 0
                                  ? <CheckCheck className="h-3 w-3 text-primary" />
                                  : <Check className="h-3 w-3 text-muted-foreground" />
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
            <div className="shrink-0 border-t border-border bg-background">
              {/* Announce Mode Banner */}
              {isAnnouncing && (
                <div className="flex items-center gap-3 px-4 pt-3 pb-2">
                  <div className="flex items-center gap-2 px-3 py-1.5 bg-amber-50 border border-amber-200 text-xs font-bold text-amber-900">
                    <Megaphone className="h-3 w-3 text-amber-600" />
                    📢 Announcement mode
                  </div>
                  <button
                    onClick={() => setIsAnnouncing(false)}
                    className="text-xs font-bold text-amber-600 hover:text-amber-700 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              )}

              {/* Voice recording strip */}
              {(isRecording || voiceUrl) && (
                <div className="px-4 pt-3 pb-2">
                  <div className={cn('flex items-center gap-3 px-3 py-2.5 border', isRecording ? 'bg-red-50 border-red-200' : 'bg-muted/30 border-border')}>
                    {isRecording ? (
                      <>
                        <div className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse shrink-0" />
                        <span className="text-xs font-semibold text-red-600 shrink-0">Recording</span>
                        <div className="flex items-center gap-[3px] flex-1 h-6">
                          {Array.from({ length: 24 }).map((_, i) => (
                            <motion.div
                              key={i}
                              className="w-[3px] rounded-full bg-red-400"
                              animate={{ height: [4, 8 + Math.random() * 14, 4, 6 + Math.random() * 16, 4] }}
                              transition={{ duration: 0.8 + Math.random() * 0.6, repeat: Infinity, delay: i * 0.04, ease: 'easeInOut' }}
                            />
                          ))}
                        </div>
                        <span className="text-xs font-semibold text-red-600 shrink-0">{formatDuration(recordingDuration)}</span>
                        <button type="button" onClick={stopRecording} className="flex items-center gap-1 px-2.5 py-1 bg-red-500 text-white text-xs font-bold hover:bg-red-600 transition-colors shrink-0">
                          <Square className="w-3 h-3" /> Stop
                        </button>
                      </>
                    ) : voiceUrl && (
                      <>
                        <Mic className="w-4 h-4 text-primary shrink-0" />
                        <audio src={voiceUrl} controls className="h-8 flex-1" style={{ maxHeight: '32px' }} />
                        <span className="text-xs text-muted-foreground font-medium shrink-0">{formatDuration(recordingDuration)}</span>
                        <button type="button" onClick={discardVoice} className="p-1 text-muted-foreground hover:text-red-500 transition-colors shrink-0" title="Discard recording">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              )}

              {/* Poll Creator */}
              {showPollCreator && (
                <div className="px-4 pt-3 pb-2">
                  <div className="border border-border bg-muted/10 p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <BarChart3 className="w-4 h-4 text-primary" />
                        <span className="text-sm font-bold">Create Poll</span>
                      </div>
                      <button onClick={() => setShowPollCreator(false)} className="text-muted-foreground hover:text-foreground transition-colors">
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                    <input
                      type="text"
                      placeholder="Ask a question…"
                      value={pollQuestion}
                      onChange={(e) => setPollQuestion(e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-input bg-background outline-none focus:ring-1 focus:ring-ring"
                    />
                    <div className="space-y-2">
                      {pollOptions.map((opt, idx) => (
                        <div key={idx} className="flex items-center gap-2">
                          <span className="text-xs font-bold text-muted-foreground w-5 text-center">{idx + 1}</span>
                          <input
                            type="text"
                            placeholder={`Option ${idx + 1}`}
                            value={opt}
                            onChange={(e) => {
                              const updated = [...pollOptions];
                              updated[idx] = e.target.value;
                              setPollOptions(updated);
                            }}
                            className="flex-1 px-3 py-1.5 text-sm border border-input bg-background outline-none focus:ring-1 focus:ring-ring"
                          />
                          {pollOptions.length > 2 && (
                            <button
                              onClick={() => setPollOptions(pollOptions.filter((_, i) => i !== idx))}
                              className="p-1 text-muted-foreground hover:text-red-500 transition-colors"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                    {/* Anonymous / Public toggle */}
                    <div className="flex items-center gap-3 pt-1 pb-1">
                      <button
                        type="button"
                        onClick={() => setPollIsAnonymous(false)}
                        className={cn(
                          'flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold border transition-colors',
                          !pollIsAnonymous
                            ? 'border-primary text-primary bg-primary/5'
                            : 'border-border text-muted-foreground hover:border-primary hover:text-primary'
                        )}
                      >
                        <Eye className="w-3 h-3" /> Public
                      </button>
                      <button
                        type="button"
                        onClick={() => setPollIsAnonymous(true)}
                        className={cn(
                          'flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold border transition-colors',
                          pollIsAnonymous
                            ? 'border-primary text-primary bg-primary/5'
                            : 'border-border text-muted-foreground hover:border-primary hover:text-primary'
                        )}
                      >
                        <Lock className="w-3 h-3" /> Anonymous
                      </button>
                      <p className="text-xs text-muted-foreground flex-1">
                        {pollIsAnonymous ? 'Voters are hidden' : 'Voters are visible'}
                      </p>
                    </div>

                    <div className="flex items-center justify-between">
                      {pollOptions.length < 6 && (
                        <button
                          onClick={() => setPollOptions([...pollOptions, ''])}
                          className="text-xs font-bold text-primary hover:text-primary/70 transition-colors"
                        >
                          + Add option
                        </button>
                      )}
                      <button
                        onClick={handleSendPoll}
                        disabled={!pollQuestion.trim() || pollOptions.filter(o => o.trim()).length < 2}
                        className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-bold bg-primary text-primary-foreground hover:bg-primary/90 transition-all disabled:opacity-40 disabled:cursor-not-allowed ml-auto"
                      >
                        <Send className="w-3 h-3" />
                        Send Poll
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Textarea */}
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSendMessage();
                }}
                className="px-4 pb-3 pt-3"
              >
                <div className="border border-input bg-background transition-colors">
                  <textarea
                    placeholder={`Message ${selectedGroup.name}…`}
                    value={messageText}
                    onChange={(e) => setMessageText(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSendMessage();
                      }
                    }}
                    rows={3}
                    className="w-full px-4 pt-3 pb-2 text-sm outline-none resize-none bg-transparent text-foreground"
                  />

                  {/* Toolbar */}
                  <div className="flex items-center justify-between px-3 pb-2 border-t border-inherit">
                    <div className="flex items-center gap-0.5">
                      {/* Attach */}
                      <button
                        type="button"
                        className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                        title="Attach file"
                      >
                        <Paperclip className="w-4 h-4" />
                      </button>

                      {/* Voice recording */}
                      <button
                        type="button"
                        onClick={isRecording ? stopRecording : (voiceBlob ? undefined : startRecording)}
                        className={cn(
                          'p-1.5 transition-colors',
                          isRecording
                            ? 'text-red-500 hover:text-red-600 hover:bg-red-50'
                            : voiceBlob
                            ? 'text-primary opacity-50 cursor-default'
                            : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                        )}
                        title={isRecording ? 'Stop recording' : voiceBlob ? 'Recording attached' : 'Record voice message'}
                      >
                        <Mic className="w-4 h-4" />
                      </button>

                      {/* Emoji */}
                      <button
                        type="button"
                        className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                        title="Emoji"
                      >
                        <Smile className="w-4 h-4" />
                      </button>

                      {/* Poll */}
                      <button
                        type="button"
                        onClick={() => setShowPollCreator(!showPollCreator)}
                        className={cn(
                          'p-1.5 transition-colors',
                          showPollCreator
                            ? 'text-primary bg-primary/10'
                            : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                        )}
                        title="Create poll"
                      >
                        <BarChart3 className="w-4 h-4" />
                      </button>

                      {/* Announce (admin only) */}
                      {currentUserIsAdmin && !isAnnouncing && (
                        <button
                          type="button"
                          onClick={() => setIsAnnouncing(true)}
                          className="p-1.5 text-muted-foreground hover:text-amber-600 hover:bg-amber-50 transition-colors"
                          title="Send as announcement"
                        >
                          <Megaphone className="w-4 h-4" />
                        </button>
                      )}
                    </div>

                    {/* Send */}
                    <button
                      type="submit"
                      disabled={!messageText.trim() && !voiceBlob}
                      className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-bold transition-all disabled:opacity-40 disabled:cursor-not-allowed bg-primary text-primary-foreground hover:bg-primary/90"
                    >
                      <Send className="w-3 h-3" />
                      Send
                    </button>
                  </div>
                </div>
                <div className="flex items-center justify-between mt-1.5">
                  <p className="text-xs text-muted-foreground/50">Enter to send · Shift+Enter for new line</p>
                  {isAnnouncing && (
                    <p className="text-xs font-medium text-amber-600/70">
                      📢 Sending as <span className="font-bold">Announcement</span>
                    </p>
                  )}
                </div>
              </form>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <p className="text-muted-foreground">Select a group to start chatting</p>
          </div>
        )}
        </div>
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
