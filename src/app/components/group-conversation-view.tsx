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
  Check,
  CheckCheck,
  LogOut,
  Shield,
  Bell,
  BellOff,
  UserPlus,
  MoreVertical
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

interface Message {
  id: string;
  senderId: string;
  senderName: string;
  senderAvatar?: string;
  content: string;
  timestamp: Date;
  isAnnouncement?: boolean;
  readBy?: string[];
  isPinned?: boolean;
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
  avatar?: string;
  members: GroupMember[];
  messages: (Message | SystemMessage)[];
  pinnedMessageId?: string;
  lastMessageTime?: Date;
  unreadCount?: number;
  sharedFiles?: Array<{ id: string; name: string; size: string; uploadedAt: Date }>;
}

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
    content: 'Great to have this space for our prayer requests and updates!',
    timestamp: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000),
    readBy: ['m1'],
  },
  {
    id: 'msg-2',
    senderId: 'm1',
    senderName: 'You',
    content: 'Absolutely. Let\'s keep this intentional and focused on lifting each other up.',
    timestamp: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000),
    readBy: ['m2', 'm4', 'm6'],
  },
  {
    id: 'msg-3',
    senderId: 'm4',
    senderName: 'Maria Garcia',
    content: 'Can we pray for our mentees going through difficult seasons? Several of mine are facing challenges with family situations.',
    timestamp: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
    readBy: ['m1', 'm2'],
    isPinned: true,
  },
  {
    id: 'msg-4',
    senderId: 'm6',
    senderName: 'Priya Patel',
    content: 'Definitely. I\'ll add them to my prayer journal. [Image: prayer-journal.jpg]',
    timestamp: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
    readBy: ['m1', 'm4'],
  },
  {
    id: 'msg-5',
    senderId: 'm1',
    senderName: 'You',
    content: 'This is important work we\'re doing together. Keep encouraging one another.',
    timestamp: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000),
    isAnnouncement: true,
    readBy: ['m2', 'm4', 'm6', 'm8'],
  },
  {
    id: 'msg-6',
    senderId: 'm8',
    senderName: 'Rachel Thompson',
    content: 'One of my mentees just made a decision to follow Christ! Praise God!',
    timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
    readBy: ['m1', 'm2', 'm4', 'm6'],
  },
  {
    id: 'msg-7',
    senderId: 'm1',
    senderName: 'You',
    content: 'That\'s wonderful news! This is why we do this.',
    timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
    readBy: ['m8'],
  },
  {
    id: 'msg-8',
    senderId: 'm2',
    senderName: 'Sarah Johnson',
    content: 'Amazing! How can we support your mentee in their new faith journey?',
    timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    readBy: ['m1'],
  },
  {
    id: 'msg-9',
    senderId: 'm4',
    senderName: 'Maria Garcia',
    content: 'I have a resource on spiritual foundation building I can share.',
    timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    readBy: ['m1', 'm2', 'm8'],
  },
  {
    id: 'msg-10',
    senderId: 'm1',
    senderName: 'You',
    content: 'Please do! Documentation helps.',
    timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
    readBy: ['m4'],
  },
];

const generateGroupData = (): Group[] => [
  {
    id: 'g1',
    name: 'Mentors Prayer Circle',
    description: 'A dedicated space for mentors to share prayer requests, encourage each other, and coordinate prayer coverage for our mentees.',
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
      { id: 'f1', name: 'Prayer_Requests_April.pdf', size: '2.4 MB', uploadedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000) },
      { id: 'f2', name: 'Mentorship_Devotional.docx', size: '1.8 MB', uploadedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000) },
    ],
  },
  {
    id: 'g2',
    name: 'New Mentor Onboarding',
    description: 'Resources and support for newly trained mentors getting started on their journey.',
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
        content: 'Welcome to our onboarding cohort! This is where we\'ll share resources and answer questions.',
        timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
        readBy: ['m2', 'm4'],
      },
      {
        id: 'msg-12',
        senderId: 'm9',
        senderName: 'Daniel Mekonnen',
        content: 'Thanks for having us! Excited to start this journey.',
        timestamp: new Date(Date.now() - 1.5 * 24 * 60 * 60 * 1000),
        readBy: ['m1'],
      },
      {
        id: 'msg-13',
        senderId: 'm1',
        senderName: 'You',
        content: 'First week focus: Getting to know your mentee. [Image: onboarding-checklist.jpg]',
        timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
        readBy: ['m2', 'm9'],
        isPinned: true,
      },
    ],
    pinnedMessageId: 'msg-13',
    lastMessageTime: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
    unreadCount: 0,
    sharedFiles: [
      { id: 'f3', name: 'Mentor_Handbook.pdf', size: '3.2 MB', uploadedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000) },
    ],
  },
  {
    id: 'g3',
    name: 'Content Review Team',
    description: 'Collaborative space for reviewing and improving mentorship curriculum.',
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
        content: 'Module 3 is ready for review. Please give feedback by Friday.',
        timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
        readBy: ['m2', 'm4'],
        isPinned: true,
      },
      {
        id: 'msg-15',
        senderId: 'm2',
        senderName: 'Sarah Johnson',
        content: 'I\'ve reviewed sections 1-4. Good theological depth. Need to simplify the language in section 3.',
        timestamp: new Date(Date.now() - 2.5 * 24 * 60 * 60 * 1000),
        readBy: ['m1', 'm4'],
      },
      {
        id: 'msg-16',
        senderId: 'm4',
        senderName: 'Maria Garcia',
        content: 'Agree with Sarah. Also, can we add more practical examples?',
        timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
        readBy: ['m1'],
      },
    ],
    pinnedMessageId: 'msg-14',
    lastMessageTime: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    unreadCount: 0,
    sharedFiles: [
      { id: 'f4', name: 'Module_3_Draft.docx', size: '5.1 MB', uploadedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000) },
      { id: 'f5', name: 'Module_3_Feedback.xlsx', size: '0.8 MB', uploadedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000) },
    ],
  },
  {
    id: 'g4',
    name: 'Leadership Council',
    description: 'Strategic planning and leadership development discussions.',
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
        content: 'Q2 strategy session: expanding our mentorship program to 5 new regions.',
        timestamp: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
        readBy: ['m2', 'm8'],
        isAnnouncement: true,
      },
      {
        id: 'msg-18',
        senderId: 'm2',
        senderName: 'Sarah Johnson',
        content: 'We should prioritize training for local coordinators in those regions.',
        timestamp: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000),
        readBy: ['m1'],
      },
    ],
    pinnedMessageId: 'msg-17',
    lastMessageTime: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000),
    unreadCount: 0,
    sharedFiles: [],
  },
];

// Helper functions
const getAvatarUrl = (name: string) =>
  `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=6366f1&color=fff&size=32`;

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
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;

  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

const formatFullTime = (date: Date) =>
  date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

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
            className="w-full max-w-md rounded-lg bg-background p-6 shadow-lg"
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">Create New Group</h2>
              <Button
                variant="ghost"
                size="icon"
                onClick={onClose}
                className="h-8 w-8"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Group Name</label>
                <Input
                  placeholder="e.g., Prayer Circle"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="mt-1"
                />
              </div>

              <div>
                <label className="text-sm font-medium">Description</label>
                <textarea
                  placeholder="What is this group for?"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className={cn(
                    'w-full rounded-md border border-border bg-background px-3 py-2 text-sm',
                    'placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary'
                  )}
                  rows={3}
                />
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Add Mentors</label>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {availableMentors
                    .filter((m) => m.id !== 'm1')
                    .map((mentor) => (
                      <label
                        key={mentor.id}
                        className="flex items-center space-x-2 cursor-pointer hover:bg-muted/30 p-2 rounded"
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
                        <span className="text-sm">{mentor.name}</span>
                      </label>
                    ))}
                </div>
              </div>

              <div className="flex gap-2 pt-4">
                <Button variant="outline" onClick={onClose} className="flex-1">
                  Cancel
                </Button>
                <Button onClick={handleCreate} className="flex-1">
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
  const pinnedMessage = group.messages.find(
    (m) => 'id' in m && m.id === group.pinnedMessageId && 'content' in m
  ) as Message | undefined;

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
            className="fixed right-0 top-0 h-full w-[320px] bg-background border-l border-border shadow-lg overflow-y-auto z-50"
          >
            <div className="p-6 space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold">Group Info</h2>
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
                <div className="flex items-center gap-3 mb-4">
                  <div
                    className={cn(
                      'w-12 h-12 rounded-full flex items-center justify-center text-white font-semibold',
                      getGroupAvatarColor(group.id)
                    )}
                  >
                    {getGroupInitials(group.name)}
                  </div>
                  <div>
                    <h3 className="font-semibold">{group.name}</h3>
                    <p className="text-sm text-muted-foreground">
                      {group.members.length} member{group.members.length !== 1 ? 's' : ''}
                    </p>
                  </div>
                </div>
                {group.description && (
                  <p className="text-sm text-muted-foreground">{group.description}</p>
                )}
              </div>

              <Separator />

              {/* Members */}
              <div>
                <h4 className="font-semibold mb-3">Members</h4>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {group.members.map((member) => (
                    <div
                      key={member.id}
                      className="flex items-center gap-2 p-2 rounded hover:bg-muted/30 group"
                    >
                      <Avatar className="h-8 w-8">
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
                          <span className="text-sm font-medium truncate">
                            {member.name}
                          </span>
                          {member.role === 'admin' && (
                            <Shield className="h-3 w-3 text-primary" />
                          )}
                          {member.muted && (
                            <BellOff className="h-3 w-3 text-muted-foreground" />
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
                              className="h-6 w-6 p-0"
                            >
                              <Shield className="h-3 w-3" />
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onToggleMute(member.id)}
                            title={member.muted ? 'Unmute' : 'Mute'}
                            className="h-6 w-6 p-0"
                          >
                            {member.muted ? (
                              <BellOff className="h-3 w-3" />
                            ) : (
                              <Bell className="h-3 w-3" />
                            )}
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onRemoveMember(member.id)}
                            title="Remove member"
                            className="h-6 w-6 p-0 text-destructive"
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                {currentUserIsAdmin && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full mt-3 gap-2"
                  >
                    <UserPlus className="h-4 w-4" />
                    Add Member
                  </Button>
                )}
              </div>

              <Separator />

              {/* Pinned Messages */}
              {pinnedMessage && (
                <div>
                  <h4 className="font-semibold mb-3">Pinned Message</h4>
                  <div className="p-3 rounded-md bg-primary/5 border border-primary/20">
                    <div className="flex gap-2">
                      <Pin className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
                      <div className="min-w-0 flex-1">
                        <p className="text-sm text-foreground break-words">
                          {pinnedMessage.content.replace(/\[Image:.*?\]/g, '📷')}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {pinnedMessage.senderName} • {formatTime(pinnedMessage.timestamp)}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Shared Files */}
              {group.sharedFiles && group.sharedFiles.length > 0 && (
                <>
                  <Separator />
                  <div>
                    <h4 className="font-semibold mb-3">Shared Files</h4>
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                      {group.sharedFiles.map((file) => (
                        <div key={file.id} className="p-2 rounded hover:bg-muted/30">
                          <p className="text-sm font-medium truncate">{file.name}</p>
                          <div className="text-xs text-muted-foreground flex justify-between">
                            <span>{file.size}</span>
                            <span>{formatTime(file.uploadedAt)}</span>
                          </div>
                        </div>
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
                className="w-full gap-2"
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

// Main Component
export function GroupConversationView() {
  const [groups, setGroups] = useState<Group[]>(generateGroupData());
  const [selectedGroupId, setSelectedGroupId] = useState(groups[0].id);
  const [searchQuery, setSearchQuery] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showGroupInfo, setShowGroupInfo] = useState(false);
  const [messageText, setMessageText] = useState('');
  const [isAnnouncing, setIsAnnouncing] = useState(false);
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
      content: messageText,
      timestamp: new Date(),
      isAnnouncement: isAnnouncing,
      readBy: [],
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
    const isMuted = selectedGroup.members.find((m) => m.id === memberId)?.muted;
    toast.success(isMuted ? 'Member unmuted' : 'Member muted');
  };

  const handleLeaveGroup = () => {
    setGroups(groups.filter((g) => g.id !== selectedGroupId));
    setSelectedGroupId(groups.find((g) => g.id !== selectedGroupId)?.id || '');
    setShowGroupInfo(false);
    toast.success('You left the group');
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

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Header Bar */}
      <div className="border-b border-border px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <MessageCircle className="h-5 w-5" />
          <h1 className="text-lg font-semibold">Group Conversations</h1>
        </div>
        <div className="flex items-center gap-2">
          {selectedGroup && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowGroupInfo(true)}
              className="gap-2"
            >
              <Info className="h-4 w-4" />
              Group Info
            </Button>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex flex-row flex-1 overflow-hidden">
        {/* Left Sidebar - Group List */}
        <div className="w-[340px] border-r border-border bg-card flex flex-col">
          {/* Search and Create */}
          <div className="p-4 space-y-3 border-b border-border">
            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search groups..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <Button
              onClick={() => setShowCreateModal(true)}
              className="w-full gap-2"
            >
              <Plus className="h-4 w-4" />
              Create Group
            </Button>
          </div>

          {/* Groups List */}
          <div className="flex-1 overflow-y-auto">
            <div className="space-y-1 p-2">
              {filteredGroups.map((group) => {
                const lastMessage = [...group.messages]
                  .reverse()
                  .find((m) => 'content' in m) as Message | undefined;
                const isSelected = selectedGroupId === group.id;

                return (
                  <motion.button
                    key={group.id}
                    onClick={() => setSelectedGroupId(group.id)}
                    whileHover={{ x: 4 }}
                    className={cn(
                      'w-full p-3 rounded-lg text-left transition-colors border',
                      isSelected
                        ? 'bg-primary text-primary-foreground border-primary'
                        : 'bg-background hover:bg-muted border-transparent hover:border-border'
                    )}
                  >
                    <div className="flex gap-3">
                      <div
                        className={cn(
                          'w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold flex-shrink-0',
                          getGroupAvatarColor(group.id)
                        )}
                      >
                        {getGroupInitials(group.name)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <h3
                            className={cn(
                              'font-semibold truncate',
                              isSelected
                                ? 'text-primary-foreground'
                                : 'text-foreground'
                            )}
                          >
                            {group.name}
                          </h3>
                          {group.unreadCount ? (
                            <Badge className="flex-shrink-0 h-5 w-5 flex items-center justify-center p-0 text-xs">
                              {group.unreadCount}
                            </Badge>
                          ) : null}
                        </div>
                        <p
                          className={cn(
                            'text-xs truncate',
                            isSelected
                              ? 'text-primary-foreground/80'
                              : 'text-muted-foreground'
                          )}
                        >
                          {group.members.length} members
                        </p>
                        {lastMessage && (
                          <p
                            className={cn(
                              'text-xs truncate mt-1',
                              isSelected
                                ? 'text-primary-foreground/70'
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
          <div className="flex-1 flex flex-col bg-background">
            {/* Chat Header */}
            <div className="border-b border-border px-6 py-4 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold">{selectedGroup.name}</h2>
                <p className="text-sm text-muted-foreground">
                  {selectedGroup.members.length} members
                </p>
              </div>
            </div>

            {/* Pinned Message Banner */}
            {selectedGroup.pinnedMessageId && (
              <div className="px-6 py-2 bg-primary/5 border-b border-primary/20">
                <div className="flex items-center gap-2 text-sm">
                  <Pin className="h-4 w-4 text-primary" />
                  <span className="text-foreground truncate">
                    {(() => {
                      const msg = selectedGroup.messages.find(
                        (m) => 'id' in m && m.id === selectedGroup.pinnedMessageId
                      ) as Message | undefined;
                      return msg
                        ? msg.content.replace(/\[Image:.*?\]/g, '📷')
                        : '';
                    })()}
                  </span>
                  <button className="ml-auto text-primary hover:underline text-xs">
                    Jump to message
                  </button>
                </div>
              </div>
            )}

            {/* Messages Area */}
            <div
              ref={scrollContainerRef}
              className="flex-1 overflow-y-auto px-6 py-4 space-y-4"
            >
              {selectedGroup.messages.map((msg, idx) => {
                if ('type' in msg) {
                  // System message
                  return (
                    <motion.div
                      key={msg.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex justify-center"
                    >
                      <p className="text-xs text-muted-foreground italic bg-muted/30 px-3 py-1 rounded-full">
                        {msg.content}
                      </p>
                    </motion.div>
                  );
                }

                const isSender = msg.senderId === currentUserId;
                const isAnnouncement = msg.isAnnouncement;

                return (
                  <motion.div
                    key={msg.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    whileHover={{ x: isSender ? -4 : 4 }}
                    className={cn('flex gap-3 group', isSender && 'flex-row-reverse')}
                  >
                    {!isSender && (
                      <Avatar className="h-8 w-8 flex-shrink-0">
                        <AvatarImage
                          src={getAvatarUrl(msg.senderName)}
                          alt={msg.senderName}
                        />
                        <AvatarFallback>
                          {msg.senderName.slice(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                    )}

                    <div
                      className={cn(
                        'flex flex-col max-w-xs',
                        isSender && 'items-end'
                      )}
                    >
                      {!isSender && (
                        <p className="text-xs font-medium text-foreground mb-1">
                          {msg.senderName}
                        </p>
                      )}

                      <div
                        className={cn(
                          'px-4 py-2 rounded-lg break-words',
                          isAnnouncement
                            ? 'bg-amber-50 border border-amber-200 text-foreground'
                            : isSender
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-muted text-foreground'
                        )}
                      >
                        <div className="flex items-start gap-2">
                          {isAnnouncement && (
                            <Megaphone className="h-4 w-4 flex-shrink-0 mt-0.5" />
                          )}
                          <div className="flex-1">
                            {isAnnouncement && (
                              <p className="text-xs font-bold mb-1 opacity-75">
                                ANNOUNCEMENT
                              </p>
                            )}
                            <p className="text-sm">{msg.content}</p>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-1 mt-1">
                        <p className="text-xs text-muted-foreground">
                          {formatFullTime(msg.timestamp)}
                        </p>
                        {isSender && msg.readBy && msg.readBy.length > 0 && (
                          <div className="flex -space-x-1.5">
                            {msg.readBy.slice(0, 5).map((userId) => {
                              const reader = SAMPLE_MENTORS.find(
                                (m) => m.id === userId
                              );
                              return reader ? (
                                <Avatar
                                  key={userId}
                                  className="h-4 w-4 border border-background"
                                >
                                  <AvatarImage
                                    src={getAvatarUrl(reader.name)}
                                    alt={reader.name}
                                  />
                                  <AvatarFallback className="text-[10px]">
                                    {reader.name.slice(0, 1)}
                                  </AvatarFallback>
                                </Avatar>
                              ) : null;
                            })}
                            {msg.readBy.length > 5 && (
                              <span className="text-xs text-muted-foreground">
                                +{msg.readBy.length - 5}
                              </span>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Pin Action */}
                      {!isSender && currentUserIsAdmin && (
                        <button
                          className="opacity-0 group-hover:opacity-100 transition-opacity mt-1 p-1 hover:bg-muted rounded"
                          onClick={() => {
                            const updated = groups.map((g) =>
                              g.id === selectedGroupId
                                ? {
                                    ...g,
                                    pinnedMessageId: msg.id,
                                  }
                                : g
                            );
                            setGroups(updated);
                            toast.success('Message pinned!');
                          }}
                          title="Pin message"
                        >
                          <Pin className="h-3 w-3 text-muted-foreground" />
                        </button>
                      )}
                    </div>
                  </motion.div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            {/* Compose Area */}
            <div className="border-t border-border px-6 py-4 space-y-3">
              {isAnnouncing && (
                <div className="flex items-center gap-2 p-2 rounded bg-amber-50 border border-amber-200">
                  <Megaphone className="h-4 w-4 text-amber-600" />
                  <span className="text-sm text-amber-900">
                    Composing announcement
                  </span>
                  <button
                    onClick={() => setIsAnnouncing(false)}
                    className="ml-auto text-amber-600 hover:text-amber-700"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              )}

              <div className="flex gap-2">
                <Input
                  placeholder="Type a message..."
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                  onKeyDown={(e) => {
                    if (
                      e.key === 'Enter' &&
                      !e.shiftKey &&
                      !e.ctrlKey &&
                      !e.metaKey
                    ) {
                      e.preventDefault();
                      handleSendMessage();
                    }
                  }}
                  className="flex-1"
                />

                {currentUserIsAdmin && !isAnnouncing && (
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setIsAnnouncing(true)}
                    title="Send announcement"
                  >
                    <Megaphone className="h-4 w-4" />
                  </Button>
                )}

                <Button
                  variant="outline"
                  size="icon"
                  title="Attach file"
                >
                  <Paperclip className="h-4 w-4" />
                </Button>

                <Button
                  onClick={handleSendMessage}
                  disabled={!messageText.trim()}
                  size="icon"
                  className="gap-2"
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
