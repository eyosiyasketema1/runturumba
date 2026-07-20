import React, { useState, useMemo, useRef, useEffect } from "react";
import {
  Users, MessageSquare, AlertTriangle, Clock, TrendingUp,
  CheckCircle2, Plus, X, Shield,
  UserPlus, Globe, ArrowRightLeft, Bell, Trophy,
  ChevronLeft, ChevronRight, Search, Settings, Timer, Hash, Volume2, RotateCcw,
  BookOpen, Newspaper, MessageCircle, Pencil, Trash2, Eye, EyeOff,
  Pin, Sparkles, Upload, Video, Mic, Send, FileText, ExternalLink,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { toast } from "sonner";
import {
  cn, type Contact, type Message, type User, type MessagePort,
  formatTimeAgo, CHANNEL_TYPES,
} from "./types";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Input } from "./ui/input";
import { Switch } from "./ui/switch";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface CoordinatorDashboardProps {
  contacts: Contact[];
  messages: Message[];
  users: User[];
  currentUser: User;
  onOpenConversation: (contactId: string) => void;
}

interface TeamMember {
  user: User;
  role: "Volunteer" | "Reviewer" | "Trainer";
  online: boolean;
  activeChatCount: number;
  lastActive: string;
}

interface EscalationItem {
  contactId: string;
  contactName: string;
  volunteerId: string;
  volunteerName: string;
  reason: "Trigger word" | "Manual flag" | "Timeout";
  flaggedAt: string;
  channel: MessagePort;
}

interface KeywordAlert {
  contactName: string;
  wordMatched: string;
  time: string;
}

interface MemberPerformance {
  userId: string;
  name: string;
  conversationsHandled: number;
  avgResponseTime: string;
  resolutionRate: number;
  flaggedCount: number;
}

type DashboardTab = "overview" | "knowledge-base" | "newsfeed" | "social-comments";

type ArticleCategory = "FAQ" | "Guide" | "Policy" | "Training" | "Best Practice";

interface Article {
  id: string;
  title: string;
  category: ArticleCategory;
  author: string;
  updatedAt: string;
  excerpt: string;
  body: string;
}

interface NewsfeedPost {
  id: string;
  author: string;
  avatarId: string;
  timestamp: string;
  content: string;
  pinned: boolean;
}

type SocialPlatform = "instagram" | "tiktok" | "facebook";

interface SocialComment {
  id: string;
  platform: SocialPlatform;
  username: string;
  timestamp: string;
  comment: string;
  postRef: string;
  hidden: boolean;
  replied: boolean;
}

interface VolunteerPerm {
  blockSeekers: boolean;
  transferConversations: boolean;
  audioMessages: boolean;
  videoCalls: boolean;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getChannelInfo(port: MessagePort) {
  return CHANNEL_TYPES.find(c => c.id === port) || CHANNEL_TYPES[0];
}

function getInitial(name: string) {
  return name
    .split(" ")
    .map(w => w[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

const AVATAR_COLORS = [
  "bg-blue-600", "bg-emerald-600", "bg-violet-600", "bg-amber-600",
  "bg-rose-600", "bg-cyan-600", "bg-indigo-600", "bg-teal-600",
];

function avatarColor(id: string) {
  let hash = 0;
  for (let i = 0; i < id.length; i++) hash = id.charCodeAt(i) + ((hash << 5) - hash);
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

function seededRandom(seed: string) {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = Math.imul(31, h) + seed.charCodeAt(i) | 0;
  return () => {
    h = Math.imul(h ^ (h >>> 16), 0x45d9f3b);
    h = Math.imul(h ^ (h >>> 13), 0x45d9f3b);
    h = (h ^ (h >>> 16)) >>> 0;
    return h / 4294967296;
  };
}

const ROLE_BADGE_STYLES: Record<string, string> = {
  Volunteer: "bg-blue-500/10 text-blue-600 border-blue-500/20",
  Reviewer: "bg-violet-500/10 text-violet-600 border-violet-500/20",
  Trainer: "bg-amber-500/10 text-amber-600 border-amber-500/20",
};

const ESCALATION_REASONS: EscalationItem["reason"][] = ["Trigger word", "Manual flag", "Timeout"];

const DEFAULT_TRIGGER_WORDS = ["suicide", "self-harm", "urgent", "pastor", "baptism"];

const ARTICLE_CATEGORIES: ArticleCategory[] = ["FAQ", "Guide", "Policy", "Training", "Best Practice"];

const CATEGORY_BADGE_STYLES: Record<ArticleCategory, string> = {
  FAQ: "bg-blue-500/10 text-blue-600 border-blue-500/20",
  Guide: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
  Policy: "bg-rose-500/10 text-rose-600 border-rose-500/20",
  Training: "bg-violet-500/10 text-violet-600 border-violet-500/20",
  "Best Practice": "bg-amber-500/10 text-amber-600 border-amber-500/20",
};

const PLATFORM_STYLES: Record<SocialPlatform, { label: string; color: string; bg: string; border: string }> = {
  instagram: { label: "Instagram", color: "text-pink-600", bg: "bg-pink-500/10", border: "border-pink-500/20" },
  tiktok: { label: "TikTok", color: "text-teal-600", bg: "bg-teal-500/10", border: "border-teal-500/20" },
  facebook: { label: "Facebook", color: "text-blue-600", bg: "bg-blue-500/10", border: "border-blue-500/20" },
};

const LLM_SUGGESTED_WORDS = ["suicide", "self-harm", "abuse", "violence", "emergency", "crisis"];

// ---------------------------------------------------------------------------
// Seed data
// ---------------------------------------------------------------------------

const SEED_ARTICLES: Article[] = [
  {
    id: "kb-1",
    title: "How to Welcome New Seekers",
    category: "Guide",
    author: "Rahel Tadesse",
    updatedAt: "2026-07-18T10:00:00Z",
    excerpt: "A step-by-step guide for volunteers on how to greet and engage with seekers reaching out for the first time through any channel.",
    body: "When a new seeker reaches out, begin with a warm greeting in their preferred language. Introduce yourself by first name only. Ask open-ended questions to understand their spiritual background and what prompted them to reach out. Avoid pushing doctrinal points in the first conversation.",
  },
  {
    id: "kb-2",
    title: "Frequently Asked Questions about Faith",
    category: "FAQ",
    author: "Yonas Gebre",
    updatedAt: "2026-07-15T14:30:00Z",
    excerpt: "Common questions seekers ask about Christianity, salvation, and the Bible with suggested response templates.",
    body: "Q: What does it mean to be saved?\nA: Salvation is God's gift of forgiveness and new life through faith in Jesus Christ.\n\nQ: How do I pray?\nA: Prayer is simply talking to God. You can pray anytime, anywhere, in your own words.",
  },
  {
    id: "kb-3",
    title: "Escalation Policy",
    category: "Policy",
    author: "Samson Usmael",
    updatedAt: "2026-07-12T09:00:00Z",
    excerpt: "When and how to escalate conversations to coordinators or reviewers, including trigger word protocols.",
    body: "Escalate immediately when: 1) A seeker mentions self-harm or suicide. 2) A seeker reports abuse. 3) A seeker requests in-person meeting. 4) You are unsure how to respond to a theological question. Use the flag button in the chat interface.",
  },
  {
    id: "kb-4",
    title: "Baptism Preparation Curriculum",
    category: "Training",
    author: "Dawit Mengistu",
    updatedAt: "2026-07-10T16:45:00Z",
    excerpt: "Training materials for guiding seekers through baptism preparation, including key scriptures and discussion points.",
    body: "The baptism preparation journey consists of 6 sessions covering: 1) Understanding salvation. 2) The meaning of baptism. 3) Living as a new believer. 4) Finding community. 5) Personal testimony preparation. 6) Baptism day logistics.",
  },
  {
    id: "kb-5",
    title: "Handling Sensitive Conversations",
    category: "Best Practice",
    author: "Tigist Worku",
    updatedAt: "2026-07-08T11:20:00Z",
    excerpt: "Best practices for responding to seekers in crisis or distress, with emphasis on compassion and appropriate referrals.",
    body: "Always lead with empathy. Use active listening techniques. Avoid minimizing their pain with cliches. If a seeker is in immediate danger, escalate to the coordinator immediately. Provide local emergency resources when appropriate.",
  },
];

const SEED_POSTS: NewsfeedPost[] = [
  {
    id: "nf-1",
    author: "Samson Usmael",
    avatarId: "coord-1",
    timestamp: "2026-07-20T08:00:00Z",
    content: "Great work this week, team! We had 23 new seekers reach out through Telegram alone. Remember to follow up with anyone who expressed interest in baptism preparation. Keep up the faithful work.",
    pinned: true,
  },
  {
    id: "nf-2",
    author: "Rahel Tadesse",
    avatarId: "syn-rev-1",
    timestamp: "2026-07-19T14:30:00Z",
    content: "Reminder: Our weekly team prayer meeting is tomorrow at 9 AM. Please come prepared with any prayer requests from your conversations this week. We will also discuss the new training materials.",
    pinned: false,
  },
  {
    id: "nf-3",
    author: "Yonas Gebre",
    avatarId: "syn-trn-1",
    timestamp: "2026-07-18T11:00:00Z",
    content: "I have uploaded new training materials on handling questions about the Trinity. Please review before your next shift. The resources are available in the Knowledge Base under the Training category.",
    pinned: false,
  },
  {
    id: "nf-4",
    author: "Kidus Alemayehu",
    avatarId: "syn-vol-1",
    timestamp: "2026-07-17T16:45:00Z",
    content: "Praise report: A seeker I have been chatting with for three weeks made a decision to follow Christ today! Please keep them in your prayers as they begin their journey of faith.",
    pinned: false,
  },
];

const SEED_COMMENTS: SocialComment[] = [
  {
    id: "sc-1",
    platform: "instagram",
    username: "@miriam_eth",
    timestamp: "2026-07-20T09:15:00Z",
    comment: "This verse really spoke to me today. How can I learn more about this?",
    postRef: "Daily Devotional - July 20",
    hidden: false,
    replied: false,
  },
  {
    id: "sc-2",
    platform: "tiktok",
    username: "@dawit_journey",
    timestamp: "2026-07-19T22:30:00Z",
    comment: "I have been watching your videos for months. Is there someone I can talk to about what it means to be a Christian?",
    postRef: "Testimony Series #14",
    hidden: false,
    replied: false,
  },
  {
    id: "sc-3",
    platform: "facebook",
    username: "Abebe Tesfaye",
    timestamp: "2026-07-19T18:00:00Z",
    comment: "Beautiful message. God bless your ministry!",
    postRef: "Sunday Service Highlights",
    hidden: false,
    replied: true,
  },
  {
    id: "sc-4",
    platform: "instagram",
    username: "@tigist_w",
    timestamp: "2026-07-18T14:20:00Z",
    comment: "Can you send me a Bible in Amharic? I do not have access to one.",
    postRef: "Bible Study Tips",
    hidden: false,
    replied: false,
  },
  {
    id: "sc-5",
    platform: "tiktok",
    username: "@anon_user_42",
    timestamp: "2026-07-18T10:00:00Z",
    comment: "Stop spreading this nonsense. Nobody wants to hear this.",
    postRef: "Testimony Series #13",
    hidden: true,
    replied: false,
  },
];

const CONNECTED_PLATFORMS_INIT: { id: string; name: string; connected: boolean }[] = [
  { id: "telegram", name: "Telegram", connected: true },
  { id: "whatsapp", name: "WhatsApp", connected: true },
  { id: "sms", name: "SMS", connected: true },
  { id: "webchat", name: "Web Chat", connected: true },
  { id: "instagram", name: "Instagram", connected: false },
  { id: "tiktok", name: "TikTok", connected: false },
];

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export const CoordinatorDashboard = ({
  contacts,
  messages,
  users,
  currentUser,
  onOpenConversation,
}: CoordinatorDashboardProps) => {
  // -- Dashboard tab --
  const [activeTab, setActiveTab] = useState<DashboardTab>("overview");

  // -- Trigger words --
  const [triggerWords, setTriggerWords] = useState<string[]>(DEFAULT_TRIGGER_WORDS);
  const [newTriggerWord, setNewTriggerWord] = useState("");

  // -- Escalation queue UX --
  const [escPage, setEscPage] = useState(1);
  const [escFilter, setEscFilter] = useState<"all" | EscalationItem["reason"]>("all");
  const [escSearch, setEscSearch] = useState("");
  const ESC_PAGE_SIZE = 8;

  // -- Reassign popover --
  const [reassignOpen, setReassignOpen] = useState<string | null>(null);
  const reassignRef = useRef<HTMLDivElement>(null);

  // -- Settings panel --
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  type SettingsTab = "general" | "keywords" | "permissions" | "platforms";
  const [settingsTab, setSettingsTab] = useState<SettingsTab>("general");
  const [settings, setSettings] = useState({
    teamName: "Amharic Team",
    language: "Amharic",
    assignmentMode: "round_robin" as "round_robin" | "least_busy" | "manual",
    maxConcurrentChats: 5,
    escalationTimeout: 15,
    autoEscalateOnTrigger: true,
    notifyOnNewConversation: true,
    notifyOnEscalation: true,
    notifyOnIdleVolunteer: false,
    workingHoursStart: "08:00",
    workingHoursEnd: "22:00",
    autoReturnAfterHours: true,
  });

  // -- Settings: Keywords extras --
  const [showLlmSuggestions, setShowLlmSuggestions] = useState(false);
  const [bulkImportText, setBulkImportText] = useState("");

  // -- Settings: Volunteer permissions --
  const [volunteerPermissions, setVolunteerPermissions] = useState<Record<string, VolunteerPerm>>({});

  // -- Settings: Connected platforms --
  const [connectedPlatforms, setConnectedPlatforms] = useState(CONNECTED_PLATFORMS_INIT);

  // -- Knowledge Base --
  const [articles, setArticles] = useState<Article[]>(SEED_ARTICLES);
  const [kbSearch, setKbSearch] = useState("");
  const [articleModal, setArticleModal] = useState<{ mode: "create" | "edit"; article?: Article } | null>(null);
  const [articleForm, setArticleForm] = useState({ title: "", category: "FAQ" as ArticleCategory, body: "" });

  // -- Newsfeed --
  const [newsfeedPosts, setNewsfeedPosts] = useState<NewsfeedPost[]>(SEED_POSTS);
  const [postModal, setPostModal] = useState<{ mode: "create" | "edit"; post?: NewsfeedPost } | null>(null);
  const [postForm, setPostForm] = useState({ content: "", pinned: false });

  // -- Social Comments --
  const [socialComments, setSocialComments] = useState<SocialComment[]>(SEED_COMMENTS);
  const [socialFilter, setSocialFilter] = useState<"all" | SocialPlatform>("all");
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyText, setReplyText] = useState("");

  // -----------------------------------------------------------------------
  // Computed data (unchanged from original)
  // -----------------------------------------------------------------------

  const teamContacts = useMemo(
    () => contacts.filter(c => c.preferredLanguage === "Amharic"),
    [contacts]
  );

  const teamMembers = useMemo<TeamMember[]>(() => {
    const amharicUsers = users.filter(u => {
      if (u.id === currentUser.id) return false;
      const langs = u.mentorProfile?.languages || "";
      return langs.toUpperCase().includes("AM");
    });
    const amharicMentorIds = new Set(teamContacts.map(c => c.assignedMentorId).filter(Boolean));
    const additionalUsers = users.filter(u => {
      if (u.id === currentUser.id) return false;
      if (amharicUsers.find(au => au.id === u.id)) return false;
      return amharicMentorIds.has(u.id);
    });
    const realUsers = [...amharicUsers, ...additionalUsers];

    const SYNTHETIC_MEMBERS: { id: string; name: string; email: string; role: TeamMember["role"] }[] = [
      { id: "syn-vol-1", name: "Kidus Alemayehu", email: "kidus@team.org",   role: "Volunteer" },
      { id: "syn-vol-2", name: "Tigist Worku",    email: "tigist@team.org",  role: "Volunteer" },
      { id: "syn-vol-3", name: "Dawit Mengistu",  email: "dawit@team.org",   role: "Volunteer" },
      { id: "syn-rev-1", name: "Rahel Tadesse",   email: "rahel@team.org",   role: "Reviewer" },
      { id: "syn-trn-1", name: "Yonas Gebre",     email: "yonas@team.org",   role: "Trainer" },
      { id: "syn-vol-4", name: "Hiwot Bekele",    email: "hiwot@team.org",   role: "Volunteer" },
    ];

    const roleMap: Record<string, TeamMember["role"]> = {
      volunteer: "Volunteer", reviewer: "Reviewer", trainer: "Trainer",
      executive: "Volunteer", global_ops: "Volunteer", coordinator: "Volunteer",
    };

    const fromReal: TeamMember[] = realUsers.map(u => {
      const rand = seededRandom(u.id + "-status");
      return {
        user: u,
        role: roleMap[u.role] || "Volunteer",
        online: rand() > 0.4,
        activeChatCount: Math.floor(rand() * 6),
        lastActive: new Date(Date.now() - Math.floor(rand() * 7200000)).toISOString(),
      };
    });

    const needed = Math.max(0, 7 - fromReal.length);
    const fromSynthetic: TeamMember[] = SYNTHETIC_MEMBERS.slice(0, needed).map(s => {
      const rand = seededRandom(s.id + "-status");
      return {
        user: {
          id: s.id, name: s.name, email: s.email,
          role: s.role.toLowerCase() as any,
          status: "active" as const, tenantId: "tenant-1",
        },
        role: s.role,
        online: rand() > 0.35,
        activeChatCount: Math.floor(rand() * 6),
        lastActive: new Date(Date.now() - Math.floor(rand() * 7200000)).toISOString(),
      };
    });

    return [...fromReal, ...fromSynthetic];
  }, [users, currentUser.id, teamContacts]);

  const sortedTeamMembers = useMemo(
    () =>
      [...teamMembers].sort((a, b) => {
        if (a.online !== b.online) return a.online ? -1 : 1;
        return a.user.name.localeCompare(b.user.name);
      }),
    [teamMembers]
  );

  const teamConversations = useMemo(() => {
    const contactIds = new Set(teamContacts.map(c => c.id));
    const byContact: Record<string, Message[]> = {};
    messages.forEach(m => {
      if (contactIds.has(m.contactId)) {
        if (!byContact[m.contactId]) byContact[m.contactId] = [];
        byContact[m.contactId].push(m);
      }
    });
    return Object.entries(byContact).map(([contactId, msgs]) => {
      const sorted = [...msgs].sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
      const latest = sorted[0];
      const rand = seededRandom(contactId);
      const r = rand();
      const status: "active" | "resolved" = r < 0.65 ? "active" : "resolved";
      return {
        contactId,
        status,
        lastMessageAt: latest.createdAt,
        channel: latest.port,
        lastMessagePreview: latest.content.length > 60
          ? latest.content.slice(0, 57) + "..."
          : latest.content,
      };
    });
  }, [messages, teamContacts]);

  const activeConversations = teamConversations.filter(c => c.status === "active");
  const resolvedToday = teamConversations.filter(c => c.status === "resolved");

  const escalations = useMemo<EscalationItem[]>(() => {
    const items: EscalationItem[] = [];
    teamContacts.forEach((contact) => {
      const rand = seededRandom(contact.id + "-escalation");
      if (rand() < 0.35) {
        const volunteerIdx = Math.floor(rand() * Math.max(teamMembers.length, 1));
        const volunteer = teamMembers[volunteerIdx] || teamMembers[0];
        const reasonIdx = Math.floor(rand() * ESCALATION_REASONS.length);
        const contactMsgs = messages.filter(m => m.contactId === contact.id);
        const latestMsg = contactMsgs.length > 0
          ? [...contactMsgs].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0]
          : null;
        items.push({
          contactId: contact.id,
          contactName: contact.name,
          volunteerId: volunteer?.user.id || "",
          volunteerName: volunteer?.user.name || "Unassigned",
          reason: ESCALATION_REASONS[reasonIdx],
          flaggedAt: new Date(Date.now() - Math.floor(rand() * 3600000 * 4)).toISOString(),
          channel: latestMsg?.port || "whatsapp",
        });
      }
    });
    return items.sort(
      (a, b) => new Date(b.flaggedAt).getTime() - new Date(a.flaggedAt).getTime()
    );
  }, [teamContacts, teamMembers, messages]);

  const keywordAlerts = useMemo<KeywordAlert[]>(() => {
    const alerts: KeywordAlert[] = [];
    teamContacts.forEach((contact) => {
      const rand = seededRandom(contact.id + "-alert");
      if (rand() < 0.4 && triggerWords.length > 0) {
        const wordIdx = Math.floor(rand() * triggerWords.length);
        alerts.push({
          contactName: contact.name,
          wordMatched: triggerWords[wordIdx],
          time: new Date(Date.now() - Math.floor(rand() * 7200000)).toISOString(),
        });
      }
    });
    return alerts
      .sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime())
      .slice(0, 5);
  }, [teamContacts, triggerWords]);

  const performance = useMemo<MemberPerformance[]>(() => {
    return teamMembers.map(member => {
      const rand = seededRandom(member.user.id + "-perf");
      const handled = Math.floor(rand() * 20) + 3;
      const mins = Math.floor(rand() * 8) + 1;
      const secs = Math.floor(rand() * 60);
      return {
        userId: member.user.id,
        name: member.user.name,
        conversationsHandled: handled,
        avgResponseTime: `${mins}m ${secs}s`,
        resolutionRate: Math.floor(rand() * 30) + 70,
        flaggedCount: Math.floor(rand() * 5),
      };
    }).sort((a, b) => b.conversationsHandled - a.conversationsHandled);
  }, [teamMembers]);

  // KPIs
  const teamMemberCount = teamMembers.length;
  const activeConvoCount = activeConversations.length;
  const flaggedCount = escalations.length;
  const avgResponseTime = "3m 42s";
  const resolutionRate = teamConversations.length > 0
    ? Math.round((resolvedToday.length / teamConversations.length) * 100)
    : 0;

  // -----------------------------------------------------------------------
  // Handlers
  // -----------------------------------------------------------------------

  const handleAddTriggerWord = () => {
    const word = newTriggerWord.trim().toLowerCase();
    if (!word) return;
    if (triggerWords.includes(word)) {
      toast.error("This trigger word already exists.");
      return;
    }
    setTriggerWords(prev => [...prev, word]);
    setNewTriggerWord("");
    toast.success(`Trigger word "${word}" added.`);
  };

  const handleRemoveTriggerWord = (word: string) => {
    setTriggerWords(prev => prev.filter(w => w !== word));
    toast.success(`Trigger word "${word}" removed.`);
  };

  const handleReassign = (contactId: string, member: TeamMember) => {
    setReassignOpen(null);
    toast.success(
      `Reassigned to ${member.user.name} (${member.role})`,
      { description: `${member.online ? "Online" : "Offline"} · ${member.activeChatCount} active chats` }
    );
  };

  const handleBulkImport = () => {
    const words = bulkImportText
      .split(",")
      .map(w => w.trim().toLowerCase())
      .filter(w => w.length > 0 && !triggerWords.includes(w));
    if (words.length === 0) {
      toast.error("No new words to import.");
      return;
    }
    setTriggerWords(prev => [...prev, ...words]);
    setBulkImportText("");
    toast.success(`Imported ${words.length} trigger word${words.length > 1 ? "s" : ""}.`);
  };

  const getVolunteerPerm = (userId: string): VolunteerPerm =>
    volunteerPermissions[userId] || { blockSeekers: true, transferConversations: true, audioMessages: true, videoCalls: false };

  const toggleVolunteerPerm = (userId: string, key: keyof VolunteerPerm) => {
    setVolunteerPermissions(prev => {
      const current = prev[userId] || { blockSeekers: true, transferConversations: true, audioMessages: true, videoCalls: false };
      return { ...prev, [userId]: { ...current, [key]: !current[key] } };
    });
  };

  const handleConnectPlatform = (platformId: string, platformName: string) => {
    setConnectedPlatforms(prev =>
      prev.map(p => p.id === platformId ? { ...p, connected: !p.connected } : p)
    );
    const platform = connectedPlatforms.find(p => p.id === platformId);
    if (platform?.connected) {
      toast.success(`${platformName} disconnected.`);
    } else {
      toast.info(`Opening ${platformName} integration wizard...`);
    }
  };

  // -- Article handlers --
  const openCreateArticle = () => {
    setArticleForm({ title: "", category: "FAQ", body: "" });
    setArticleModal({ mode: "create" });
  };
  const openEditArticle = (article: Article) => {
    setArticleForm({ title: article.title, category: article.category, body: article.body });
    setArticleModal({ mode: "edit", article });
  };
  const handleSaveArticle = () => {
    if (!articleForm.title.trim()) {
      toast.error("Please enter a title.");
      return;
    }
    if (articleModal?.mode === "create") {
      const newArticle: Article = {
        id: `kb-${Date.now()}`,
        title: articleForm.title.trim(),
        category: articleForm.category,
        author: currentUser.name,
        updatedAt: new Date().toISOString(),
        excerpt: articleForm.body.slice(0, 120) + (articleForm.body.length > 120 ? "..." : ""),
        body: articleForm.body,
      };
      setArticles(prev => [newArticle, ...prev]);
      toast.success("Article created.");
    } else if (articleModal?.mode === "edit" && articleModal.article) {
      setArticles(prev =>
        prev.map(a =>
          a.id === articleModal.article!.id
            ? {
                ...a,
                title: articleForm.title.trim(),
                category: articleForm.category,
                body: articleForm.body,
                excerpt: articleForm.body.slice(0, 120) + (articleForm.body.length > 120 ? "..." : ""),
                updatedAt: new Date().toISOString(),
              }
            : a
        )
      );
      toast.success("Article updated.");
    }
    setArticleModal(null);
  };
  const handleDeleteArticle = (id: string) => {
    setArticles(prev => prev.filter(a => a.id !== id));
    toast.success("Article deleted.");
  };

  // -- Newsfeed handlers --
  const openCreatePost = () => {
    setPostForm({ content: "", pinned: false });
    setPostModal({ mode: "create" });
  };
  const openEditPost = (post: NewsfeedPost) => {
    setPostForm({ content: post.content, pinned: post.pinned });
    setPostModal({ mode: "edit", post });
  };
  const handleSavePost = () => {
    if (!postForm.content.trim()) {
      toast.error("Please enter content.");
      return;
    }
    if (postModal?.mode === "create") {
      const newPost: NewsfeedPost = {
        id: `nf-${Date.now()}`,
        author: currentUser.name,
        avatarId: currentUser.id,
        timestamp: new Date().toISOString(),
        content: postForm.content.trim(),
        pinned: postForm.pinned,
      };
      setNewsfeedPosts(prev => [newPost, ...prev]);
      toast.success("Post published.");
    } else if (postModal?.mode === "edit" && postModal.post) {
      setNewsfeedPosts(prev =>
        prev.map(p =>
          p.id === postModal.post!.id
            ? { ...p, content: postForm.content.trim(), pinned: postForm.pinned }
            : p
        )
      );
      toast.success("Post updated.");
    }
    setPostModal(null);
  };
  const handleDeletePost = (id: string) => {
    setNewsfeedPosts(prev => prev.filter(p => p.id !== id));
    toast.success("Post deleted.");
  };
  const handleTogglePin = (id: string) => {
    setNewsfeedPosts(prev =>
      prev.map(p => (p.id === id ? { ...p, pinned: !p.pinned } : p))
    );
  };

  // -- Social comment handlers --
  const handleToggleHide = (id: string) => {
    setSocialComments(prev =>
      prev.map(c => (c.id === id ? { ...c, hidden: !c.hidden } : c))
    );
  };
  const handleDeleteComment = (id: string) => {
    setSocialComments(prev => prev.filter(c => c.id !== id));
    toast.success("Comment deleted.");
  };
  const handleSendReply = (id: string) => {
    if (!replyText.trim()) return;
    setSocialComments(prev =>
      prev.map(c => (c.id === id ? { ...c, replied: true } : c))
    );
    setReplyingTo(null);
    setReplyText("");
    toast.success("Reply sent.");
  };

  // Close reassign popover on outside click
  useEffect(() => {
    if (!reassignOpen) return;
    const onClick = (e: MouseEvent) => {
      if (reassignRef.current && !reassignRef.current.contains(e.target as Node)) {
        setReassignOpen(null);
      }
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [reassignOpen]);

  // Filtered + paginated escalations
  const filteredEscalations = useMemo(() => {
    let list = escalations;
    if (escFilter !== "all") list = list.filter(e => e.reason === escFilter);
    if (escSearch.trim()) {
      const q = escSearch.toLowerCase();
      list = list.filter(e =>
        e.contactName.toLowerCase().includes(q) ||
        e.volunteerName.toLowerCase().includes(q)
      );
    }
    return list;
  }, [escalations, escFilter, escSearch]);

  const escTotalPages = Math.max(1, Math.ceil(filteredEscalations.length / ESC_PAGE_SIZE));
  const escPageItems = filteredEscalations.slice((escPage - 1) * ESC_PAGE_SIZE, escPage * ESC_PAGE_SIZE);

  useEffect(() => { setEscPage(1); }, [escFilter, escSearch]);

  // Filtered KB articles
  const filteredArticles = useMemo(() => {
    if (!kbSearch.trim()) return articles;
    const q = kbSearch.toLowerCase();
    return articles.filter(a =>
      a.title.toLowerCase().includes(q) ||
      a.category.toLowerCase().includes(q) ||
      a.excerpt.toLowerCase().includes(q)
    );
  }, [articles, kbSearch]);

  // Sorted newsfeed posts (pinned first, then by date)
  const sortedPosts = useMemo(
    () => [...newsfeedPosts].sort((a, b) => {
      if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
      return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
    }),
    [newsfeedPosts]
  );

  // Filtered social comments
  const filteredComments = useMemo(() => {
    if (socialFilter === "all") return socialComments;
    return socialComments.filter(c => c.platform === socialFilter);
  }, [socialComments, socialFilter]);

  // Greeting
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";
  const topPerformerId = performance.length > 0 ? performance[0].userId : null;

  // Tab definitions
  const TABS: { id: DashboardTab; label: string; icon: React.ElementType }[] = [
    { id: "overview", label: "Overview", icon: TrendingUp },
    { id: "knowledge-base", label: "Knowledge Base", icon: BookOpen },
    { id: "newsfeed", label: "Newsfeed", icon: Newspaper },
    { id: "social-comments", label: "Social Comments", icon: MessageCircle },
  ];

  return (
    <div className="space-y-6 p-6 lg:p-8 animate-in fade-in duration-500 bg-gradient-to-br from-slate-50 via-background to-blue-50/30 min-h-full">
      {/* Hero Header */}
      <header className="relative overflow-hidden rounded-sm bg-slate-950 text-white p-8 shadow-[0_24px_60px_-28px_rgba(15,23,42,0.55)]">
        <div className="absolute -top-24 -right-20 w-80 h-80 rounded-full bg-gradient-to-br from-blue-500/40 to-violet-500/10 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-32 -left-20 w-96 h-96 rounded-full bg-gradient-to-tr from-emerald-500/20 to-blue-500/10 blur-3xl pointer-events-none" />
        <div
          className="absolute inset-0 opacity-[0.06] pointer-events-none"
          style={{
            backgroundImage:
              "linear-gradient(to right, #fff 1px, transparent 1px), linear-gradient(to bottom, #fff 1px, transparent 1px)",
            backgroundSize: "64px 64px",
          }}
        />
        <div className="relative flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-xs font-semibold text-emerald-300 uppercase tracking-[0.18em]">
                Coordinator &middot; Amharic Team
              </span>
            </div>
            <h1 className="text-4xl lg:text-5xl font-bold tracking-tight leading-[1.05]">
              {greeting},{" "}
              <span className="text-blue-300">
                {currentUser.name.split(" ")[0]}
              </span>
              .
            </h1>
            <p className="text-base text-slate-300 mt-3 max-w-2xl leading-relaxed">
              <span className="font-semibold text-white">
                {teamMemberCount} team members
              </span>
              <span className="mx-2 text-slate-500">&middot;</span>
              <span className="font-semibold text-emerald-300">
                {activeConvoCount} active conversations
              </span>
              <span className="mx-2 text-slate-500">&middot;</span>
              <span className="font-semibold text-pink-300">
                {flaggedCount} flagged
              </span>
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              className="border-white/20 bg-white/10 text-white hover:bg-white/20 hover:text-white backdrop-blur-sm"
              onClick={() => setIsSettingsOpen(true)}
            >
              <Settings className="w-3.5 h-3.5 mr-1.5" />
              Team Settings
            </Button>
          </div>
        </div>
      </header>

      {/* Tab Bar */}
      <div className="flex gap-1 p-1 bg-muted rounded-lg border border-border">
        {TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-md text-sm font-semibold transition-all",
              activeTab === tab.id
                ? "bg-background text-foreground shadow-sm border border-border"
                : "text-muted-foreground hover:text-foreground hover:bg-background/50"
            )}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* ================================================================= */}
      {/* OVERVIEW TAB                                                      */}
      {/* ================================================================= */}
      {activeTab === "overview" && (
        <>
          {/* KPI Stats Row */}
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
            {[
              { label: "Team Members", value: teamMemberCount, icon: Users, color: "text-blue-600", bg: "bg-blue-500/10" },
              { label: "Active Conversations", value: activeConvoCount, icon: MessageSquare, color: "text-emerald-600", bg: "bg-emerald-500/10" },
              { label: "Flagged for Review", value: flaggedCount, icon: AlertTriangle, color: "text-rose-600", bg: "bg-rose-500/10" },
              { label: "Avg Response Time", value: avgResponseTime, icon: Clock, color: "text-violet-600", bg: "bg-violet-500/10" },
              { label: "Resolution Rate", value: `${resolutionRate}%`, icon: TrendingUp, color: "text-amber-600", bg: "bg-amber-500/10" },
            ].map((kpi, i) => (
              <motion.div
                key={kpi.label}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: i * 0.06, ease: "easeOut" }}
                className="bg-card p-5 rounded-lg border border-border shadow-sm group hover:border-primary/30 transition-all"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className={cn("p-2 rounded-md border border-border group-hover:border-primary/20 transition-all", kpi.bg)}>
                    <kpi.icon className={cn("w-4 h-4 transition-all", kpi.color)} />
                  </div>
                </div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">{kpi.label}</p>
                <p className="text-2xl font-bold tracking-tight text-foreground mt-0.5">
                  {typeof kpi.value === "number" ? kpi.value.toLocaleString() : kpi.value}
                </p>
              </motion.div>
            ))}
          </div>

          {/* Two-panel layout: Team Roster + Escalation Queue */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Team Roster (col-span-5) */}
            <div className="lg:col-span-5">
              <div className="bg-card rounded-lg border border-border shadow-sm overflow-hidden">
                <div className="px-6 pt-5 pb-4 border-b border-border">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-sm font-bold text-foreground">Team Roster</h2>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {teamMemberCount} members &middot; {sortedTeamMembers.filter(m => m.online).length} online
                      </p>
                    </div>
                    <Badge variant="outline" className="text-[10px] px-2 py-0.5">
                      <Globe className="w-2.5 h-2.5 mr-1" />
                      Amharic
                    </Badge>
                  </div>
                </div>
                <div className="divide-y divide-border max-h-[520px] overflow-y-auto">
                  {sortedTeamMembers.length === 0 ? (
                    <div className="py-16 text-center">
                      <Users className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
                      <p className="text-sm font-medium text-muted-foreground">No team members found</p>
                      <p className="text-xs text-muted-foreground mt-1">Add volunteers to your Amharic team.</p>
                    </div>
                  ) : (
                    sortedTeamMembers.map((member, i) => (
                      <motion.div
                        key={member.user.id}
                        initial={{ opacity: 0, x: -8 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.2, delay: i * 0.04, ease: "easeOut" }}
                        className="px-5 py-3.5 hover:bg-muted/30 transition-colors flex items-center gap-3"
                      >
                        <div className="relative shrink-0">
                          {member.user.avatar ? (
                            <img src={member.user.avatar} alt={member.user.name} className="w-9 h-9 rounded-full object-cover" />
                          ) : (
                            <div className={cn("w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-bold", avatarColor(member.user.id))}>
                              {getInitial(member.user.name)}
                            </div>
                          )}
                          <span className={cn("absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-card", member.online ? "bg-emerald-500" : "bg-gray-400")} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-semibold text-foreground truncate">{member.user.name}</span>
                            <Badge variant="outline" className={cn("text-[10px] px-1.5 py-0", ROLE_BADGE_STYLES[member.role])}>{member.role}</Badge>
                          </div>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {member.activeChatCount} active chats &middot; Last active {formatTimeAgo(member.lastActive)}
                          </p>
                        </div>
                        <div className="shrink-0 flex items-center gap-1.5">
                          <MessageSquare className="w-3.5 h-3.5 text-muted-foreground" />
                          <span className="text-xs font-semibold text-foreground">{member.activeChatCount}</span>
                        </div>
                      </motion.div>
                    ))
                  )}
                </div>
                <div className="px-5 py-3.5 border-t border-border">
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full text-xs gap-2 justify-center"
                    onClick={() => toast.info("Opening team member directory...")}
                  >
                    <UserPlus className="w-3.5 h-3.5" />
                    Add Team Member
                  </Button>
                </div>
              </div>
            </div>

            {/* Escalation Queue (col-span-7) */}
            <div className="lg:col-span-7">
              <div className="bg-card rounded-lg border border-border shadow-sm overflow-visible">
                <div className="px-6 pt-5 pb-4 border-b border-border">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <h2 className="text-sm font-bold text-foreground">Escalation Queue</h2>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-600 border border-rose-500/20">
                        {escalations.length}
                      </span>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">Flagged conversations needing review</p>
                  {escalations.length > 3 && (
                    <div className="relative mt-3">
                      <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                      <Input
                        type="text"
                        placeholder="Search by contact or volunteer..."
                        value={escSearch}
                        onChange={e => setEscSearch(e.target.value)}
                        className="text-xs h-8 pl-8"
                      />
                    </div>
                  )}
                  {escalations.length > 3 && (
                    <div className="flex gap-1 mt-3 p-1 bg-muted rounded-md border border-border">
                      {(["all", ...ESCALATION_REASONS] as const).map(f => {
                        const count = f === "all"
                          ? escalations.length
                          : escalations.filter(e => e.reason === f).length;
                        return (
                          <button
                            key={f}
                            onClick={() => setEscFilter(f)}
                            className={cn(
                              "flex items-center gap-1 px-2.5 py-1 rounded-sm text-xs font-semibold transition-all",
                              escFilter === f
                                ? "bg-background text-foreground shadow-sm border border-border"
                                : "text-muted-foreground hover:text-foreground"
                            )}
                          >
                            {f === "all" ? "All" : f}
                            <span className={cn(
                              "text-[10px] font-bold px-1 py-0 rounded-full min-w-[16px] text-center",
                              escFilter === f ? "bg-primary/10 text-primary" : "bg-muted-foreground/10 text-muted-foreground"
                            )}>
                              {count}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
                <div className="divide-y divide-border">
                  {filteredEscalations.length === 0 ? (
                    <div className="py-16 text-center">
                      <CheckCircle2 className="w-10 h-10 text-emerald-500/40 mx-auto mb-3" />
                      <p className="text-sm font-medium text-muted-foreground">
                        {escalations.length === 0 ? "No escalations" : "No matching results"}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {escalations.length === 0 ? "Your team is on top of things!" : "Try adjusting your search or filter."}
                      </p>
                    </div>
                  ) : (
                    <AnimatePresence mode="wait">
                      <motion.div
                        key={`${escFilter}-${escSearch}-${escPage}`}
                        initial={{ opacity: 0, y: 4 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -4 }}
                        transition={{ duration: 0.15 }}
                      >
                        {escPageItems.map((esc) => {
                          const channelInfo = getChannelInfo(esc.channel);
                          const reasonStyles: Record<string, string> = {
                            "Trigger word": "bg-rose-500/10 text-rose-600 border-rose-500/20",
                            "Manual flag": "bg-amber-500/10 text-amber-600 border-amber-500/20",
                            "Timeout": "bg-violet-500/10 text-violet-600 border-violet-500/20",
                          };
                          return (
                            <div
                              key={esc.contactId + "-esc"}
                              className="px-5 py-3.5 hover:bg-muted/30 transition-colors border-b border-border last:border-0"
                            >
                              <div className="flex items-center gap-3">
                                <div className={cn("w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0", avatarColor(esc.contactId))}>
                                  {getInitial(esc.contactName)}
                                </div>
                                <div className="min-w-0 flex-1">
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <span className="text-sm font-semibold text-foreground truncate">{esc.contactName}</span>
                                    {channelInfo.logoUrl ? (
                                      <img src={channelInfo.logoUrl} alt={channelInfo.label} className="w-3.5 h-3.5 shrink-0" />
                                    ) : (
                                      <channelInfo.icon className={cn("w-3.5 h-3.5 shrink-0", channelInfo.color)} />
                                    )}
                                    <Badge variant="outline" className={cn("text-[10px] px-1.5 py-0", reasonStyles[esc.reason])}>{esc.reason}</Badge>
                                  </div>
                                  <p className="text-xs text-muted-foreground mt-0.5">
                                    Flagged by {esc.volunteerName}
                                    <span className="mx-1.5 text-border">&middot;</span>
                                    {formatTimeAgo(esc.flaggedAt)}
                                  </p>
                                </div>
                                <div className="flex items-center gap-1.5 shrink-0 relative">
                                  <Button size="sm" className="text-xs h-7 px-2.5" onClick={() => onOpenConversation(esc.contactId)}>
                                    Review
                                  </Button>
                                  <div className="relative" ref={reassignOpen === esc.contactId ? reassignRef : undefined}>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      className={cn("text-xs h-7 px-2.5 gap-1", reassignOpen === esc.contactId && "bg-muted border-primary/40")}
                                      onClick={() => setReassignOpen(reassignOpen === esc.contactId ? null : esc.contactId)}
                                    >
                                      <ArrowRightLeft className="w-3 h-3" />
                                      Reassign
                                    </Button>
                                    <AnimatePresence>
                                      {reassignOpen === esc.contactId && (
                                        <motion.div
                                          initial={{ opacity: 0, y: -4, scale: 0.95 }}
                                          animate={{ opacity: 1, y: 0, scale: 1 }}
                                          exit={{ opacity: 0, y: -4, scale: 0.95 }}
                                          transition={{ duration: 0.12 }}
                                          className="absolute right-0 top-full mt-2 w-64 bg-popover border border-border rounded-lg shadow-xl z-50 overflow-hidden"
                                        >
                                          <div className="px-3 py-2 border-b border-border bg-muted/30">
                                            <p className="text-xs font-bold text-foreground">Reassign to</p>
                                            <p className="text-[11px] text-muted-foreground">Select a team member</p>
                                          </div>
                                          <div className="max-h-[240px] overflow-y-auto py-1">
                                            {sortedTeamMembers.map(member => (
                                              <button
                                                key={member.user.id}
                                                onClick={() => handleReassign(esc.contactId, member)}
                                                className="w-full flex items-center gap-2.5 px-3 py-2 text-left hover:bg-muted/50 transition-colors"
                                              >
                                                <div className="relative shrink-0">
                                                  {member.user.avatar ? (
                                                    <img src={member.user.avatar} alt={member.user.name} className="w-7 h-7 rounded-full object-cover" />
                                                  ) : (
                                                    <div className={cn("w-7 h-7 rounded-full flex items-center justify-center text-white text-[10px] font-bold", avatarColor(member.user.id))}>
                                                      {getInitial(member.user.name)}
                                                    </div>
                                                  )}
                                                  <span className={cn("absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-popover", member.online ? "bg-emerald-500" : "bg-gray-400")} />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                  <p className="text-xs font-semibold text-foreground truncate">{member.user.name}</p>
                                                  <p className="text-[11px] text-muted-foreground">
                                                    {member.role} &middot; {member.activeChatCount} chats
                                                    {!member.online && " · Offline"}
                                                  </p>
                                                </div>
                                              </button>
                                            ))}
                                          </div>
                                        </motion.div>
                                      )}
                                    </AnimatePresence>
                                  </div>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </motion.div>
                    </AnimatePresence>
                  )}
                </div>
                {filteredEscalations.length > ESC_PAGE_SIZE && (
                  <div className="px-5 py-3 border-t border-border flex items-center justify-between">
                    <p className="text-xs text-muted-foreground">
                      {(escPage - 1) * ESC_PAGE_SIZE + 1}–{Math.min(escPage * ESC_PAGE_SIZE, filteredEscalations.length)} of {filteredEscalations.length}
                    </p>
                    <div className="flex items-center gap-1">
                      <Button variant="outline" size="sm" className="h-7 w-7 p-0" disabled={escPage <= 1} onClick={() => setEscPage(p => p - 1)}>
                        <ChevronLeft className="w-3.5 h-3.5" />
                      </Button>
                      <span className="text-xs font-semibold text-foreground px-2">{escPage} / {escTotalPages}</span>
                      <Button variant="outline" size="sm" className="h-7 w-7 p-0" disabled={escPage >= escTotalPages} onClick={() => setEscPage(p => p + 1)}>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Team Performance */}
          <div className="bg-card rounded-lg border border-border shadow-sm overflow-hidden">
            <div className="px-6 pt-5 pb-4 border-b border-border">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-sm font-bold text-foreground">Team Performance</h2>
                  <p className="text-xs text-muted-foreground mt-0.5">This week&apos;s stats &middot; sorted by conversations handled</p>
                </div>
                {topPerformerId && (
                  <Badge variant="outline" className="text-[10px] px-2 py-0.5 bg-amber-500/10 text-amber-600 border-amber-500/20">
                    <Trophy className="w-3 h-3 mr-1" />
                    Top Performer
                  </Badge>
                )}
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-border">
                    <th className="px-6 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-widest">Name</th>
                    <th className="px-6 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-widest text-right">Conversations</th>
                    <th className="px-6 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-widest text-right">Avg Response</th>
                    <th className="px-6 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-widest text-right">Resolution Rate</th>
                    <th className="px-6 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-widest text-right">Flagged</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {performance.map((perf, i) => {
                    const isTopPerformer = i === 0;
                    const member = teamMembers.find(m => m.user.id === perf.userId);
                    return (
                      <motion.tr
                        key={perf.userId}
                        initial={{ opacity: 0, y: 4 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.2, delay: i * 0.04 }}
                        className={cn("hover:bg-muted/30 transition-colors", isTopPerformer && "bg-amber-500/5")}
                      >
                        <td className="px-6 py-3.5">
                          <div className="flex items-center gap-3">
                            {member?.user.avatar ? (
                              <img src={member.user.avatar} alt={perf.name} className="w-8 h-8 rounded-full object-cover shrink-0" />
                            ) : (
                              <div className={cn("w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0", avatarColor(perf.userId))}>
                                {getInitial(perf.name)}
                              </div>
                            )}
                            <div>
                              <span className="text-sm font-semibold text-foreground flex items-center gap-2">
                                {perf.name}
                                {isTopPerformer && <Trophy className="w-3.5 h-3.5 text-amber-500" />}
                              </span>
                              {member && (
                                <Badge variant="outline" className={cn("text-[10px] px-1.5 py-0 mt-0.5", ROLE_BADGE_STYLES[member.role])}>{member.role}</Badge>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-3.5 text-right">
                          <span className="text-sm font-semibold text-foreground">{perf.conversationsHandled}</span>
                        </td>
                        <td className="px-6 py-3.5 text-right">
                          <span className="text-sm text-muted-foreground">{perf.avgResponseTime}</span>
                        </td>
                        <td className="px-6 py-3.5 text-right">
                          <span className={cn("text-sm font-semibold", perf.resolutionRate >= 90 ? "text-emerald-600" : perf.resolutionRate >= 75 ? "text-foreground" : "text-amber-600")}>
                            {perf.resolutionRate}%
                          </span>
                        </td>
                        <td className="px-6 py-3.5 text-right">
                          <span className={cn("text-sm", perf.flaggedCount > 3 ? "text-rose-600 font-semibold" : "text-muted-foreground")}>
                            {perf.flaggedCount}
                          </span>
                        </td>
                      </motion.tr>
                    );
                  })}
                  {performance.length === 0 && (
                    <tr>
                      <td colSpan={5} className="px-6 py-12 text-center">
                        <Users className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
                        <p className="text-sm font-medium text-muted-foreground">No performance data available</p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* ================================================================= */}
      {/* KNOWLEDGE BASE TAB                                                */}
      {/* ================================================================= */}
      {activeTab === "knowledge-base" && (
        <div className="space-y-4">
          {/* Header row */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search articles..."
                value={kbSearch}
                onChange={e => setKbSearch(e.target.value)}
                className="pl-9 h-9 text-sm"
              />
            </div>
            <Button size="sm" className="gap-2" onClick={openCreateArticle}>
              <Plus className="w-3.5 h-3.5" />
              Create Article
            </Button>
          </div>

          {/* Articles list */}
          {filteredArticles.length === 0 ? (
            <div className="bg-card rounded-lg border border-border shadow-sm py-16 text-center">
              <FileText className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
              <p className="text-sm font-medium text-muted-foreground">
                {articles.length === 0 ? "No articles yet" : "No articles match your search"}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {articles.length === 0 ? "Create your first knowledge base article." : "Try a different search term."}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredArticles.map((article, i) => (
                <motion.div
                  key={article.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2, delay: i * 0.04 }}
                  className="bg-card rounded-lg border border-border shadow-sm p-5 hover:border-primary/30 transition-all"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1.5">
                        <h3 className="text-sm font-bold text-foreground">{article.title}</h3>
                        <Badge variant="outline" className={cn("text-[10px] px-1.5 py-0", CATEGORY_BADGE_STYLES[article.category])}>
                          {article.category}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground line-clamp-2">{article.excerpt}</p>
                      <p className="text-[11px] text-muted-foreground mt-2">
                        By {article.author} &middot; Updated {formatTimeAgo(article.updatedAt)}
                      </p>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <Button variant="outline" size="sm" className="h-7 px-2.5 text-xs gap-1" onClick={() => openEditArticle(article)}>
                        <Pencil className="w-3 h-3" />
                        Edit
                      </Button>
                      <Button variant="outline" size="sm" className="h-7 px-2.5 text-xs gap-1 text-rose-600 hover:text-rose-700 hover:bg-rose-50" onClick={() => handleDeleteArticle(article.id)}>
                        <Trash2 className="w-3 h-3" />
                        Delete
                      </Button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ================================================================= */}
      {/* NEWSFEED TAB                                                      */}
      {/* ================================================================= */}
      {activeTab === "newsfeed" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-foreground">Team Newsfeed</h2>
              <p className="text-xs text-muted-foreground mt-0.5">Internal updates and announcements for volunteers</p>
            </div>
            <Button size="sm" className="gap-2" onClick={openCreatePost}>
              <Plus className="w-3.5 h-3.5" />
              Create Post
            </Button>
          </div>

          {sortedPosts.length === 0 ? (
            <div className="bg-card rounded-lg border border-border shadow-sm py-16 text-center">
              <Newspaper className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
              <p className="text-sm font-medium text-muted-foreground">No posts yet</p>
              <p className="text-xs text-muted-foreground mt-1">Create your first newsfeed post.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {sortedPosts.map((post, i) => (
                <motion.div
                  key={post.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2, delay: i * 0.04 }}
                  className={cn(
                    "bg-card rounded-lg border shadow-sm p-5 transition-all",
                    post.pinned ? "border-amber-500/30 bg-amber-500/5" : "border-border"
                  )}
                >
                  <div className="flex items-start gap-3">
                    <div className={cn("w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0", avatarColor(post.avatarId))}>
                      {getInitial(post.author)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-semibold text-foreground">{post.author}</span>
                        <span className="text-[11px] text-muted-foreground">{formatTimeAgo(post.timestamp)}</span>
                        {post.pinned && (
                          <Badge variant="outline" className="text-[10px] px-1.5 py-0 bg-amber-500/10 text-amber-600 border-amber-500/20">
                            <Pin className="w-2.5 h-2.5 mr-0.5" />
                            Pinned
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-foreground mt-2 leading-relaxed whitespace-pre-wrap">{post.content}</p>
                      <div className="flex items-center gap-2 mt-3">
                        <Button
                          variant="outline"
                          size="sm"
                          className={cn("h-7 px-2.5 text-xs gap-1", post.pinned && "text-amber-600")}
                          onClick={() => handleTogglePin(post.id)}
                        >
                          <Pin className="w-3 h-3" />
                          {post.pinned ? "Unpin" : "Pin"}
                        </Button>
                        <Button variant="outline" size="sm" className="h-7 px-2.5 text-xs gap-1" onClick={() => openEditPost(post)}>
                          <Pencil className="w-3 h-3" />
                          Edit
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-7 px-2.5 text-xs gap-1 text-rose-600 hover:text-rose-700 hover:bg-rose-50"
                          onClick={() => handleDeletePost(post.id)}
                        >
                          <Trash2 className="w-3 h-3" />
                          Delete
                        </Button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ================================================================= */}
      {/* SOCIAL COMMENTS TAB                                               */}
      {/* ================================================================= */}
      {activeTab === "social-comments" && (
        <div className="space-y-4">
          <div>
            <h2 className="text-sm font-bold text-foreground">Social Media Comments</h2>
            <p className="text-xs text-muted-foreground mt-0.5">Manage and respond to comments across platforms</p>
          </div>

          {/* Platform filter */}
          <div className="flex gap-1 p-1 bg-muted rounded-md border border-border w-fit">
            {(["all", "instagram", "tiktok", "facebook"] as const).map(f => {
              const count = f === "all"
                ? socialComments.length
                : socialComments.filter(c => c.platform === f).length;
              return (
                <button
                  key={f}
                  onClick={() => setSocialFilter(f)}
                  className={cn(
                    "flex items-center gap-1 px-3 py-1.5 rounded-sm text-xs font-semibold transition-all",
                    socialFilter === f
                      ? "bg-background text-foreground shadow-sm border border-border"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  {f === "all" ? "All" : PLATFORM_STYLES[f].label}
                  <span className={cn(
                    "text-[10px] font-bold px-1 py-0 rounded-full min-w-[16px] text-center",
                    socialFilter === f ? "bg-primary/10 text-primary" : "bg-muted-foreground/10 text-muted-foreground"
                  )}>
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Comments list */}
          {filteredComments.length === 0 ? (
            <div className="bg-card rounded-lg border border-border shadow-sm py-16 text-center">
              <MessageCircle className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
              <p className="text-sm font-medium text-muted-foreground">No comments found</p>
              <p className="text-xs text-muted-foreground mt-1">No social media comments match your filter.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredComments.map((comment, i) => {
                const pStyle = PLATFORM_STYLES[comment.platform];
                return (
                  <motion.div
                    key={comment.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2, delay: i * 0.04 }}
                    className={cn(
                      "bg-card rounded-lg border shadow-sm p-5 transition-all",
                      comment.hidden ? "border-border opacity-60" : "border-border hover:border-primary/30"
                    )}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-1.5">
                          <Badge variant="outline" className={cn("text-[10px] px-1.5 py-0", pStyle.bg, pStyle.color, pStyle.border)}>
                            {pStyle.label}
                          </Badge>
                          <span className="text-sm font-semibold text-foreground">{comment.username}</span>
                          <span className="text-[11px] text-muted-foreground">{formatTimeAgo(comment.timestamp)}</span>
                          {comment.hidden && (
                            <Badge variant="outline" className="text-[10px] px-1.5 py-0 bg-gray-500/10 text-gray-600 border-gray-500/20">
                              <EyeOff className="w-2.5 h-2.5 mr-0.5" />
                              Hidden
                            </Badge>
                          )}
                          {comment.replied && (
                            <Badge variant="outline" className="text-[10px] px-1.5 py-0 bg-emerald-500/10 text-emerald-600 border-emerald-500/20">
                              <CheckCircle2 className="w-2.5 h-2.5 mr-0.5" />
                              Replied
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-foreground">{comment.comment}</p>
                        <p className="text-[11px] text-muted-foreground mt-1.5">
                          On: <span className="font-medium">{comment.postRef}</span>
                        </p>

                        {/* Action buttons */}
                        <div className="flex items-center gap-2 mt-3">
                          {!comment.hidden && (
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-7 px-2.5 text-xs gap-1"
                              onClick={() => {
                                if (replyingTo === comment.id) {
                                  setReplyingTo(null);
                                  setReplyText("");
                                } else {
                                  setReplyingTo(comment.id);
                                  setReplyText("");
                                }
                              }}
                            >
                              <Send className="w-3 h-3" />
                              Reply
                            </Button>
                          )}
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-7 px-2.5 text-xs gap-1"
                            onClick={() => handleToggleHide(comment.id)}
                          >
                            {comment.hidden ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                            {comment.hidden ? "Unhide" : "Hide"}
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-7 px-2.5 text-xs gap-1 text-rose-600 hover:text-rose-700 hover:bg-rose-50"
                            onClick={() => handleDeleteComment(comment.id)}
                          >
                            <Trash2 className="w-3 h-3" />
                            Delete
                          </Button>
                        </div>

                        {/* Inline reply */}
                        {replyingTo === comment.id && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            exit={{ opacity: 0, height: 0 }}
                            className="mt-3 flex items-center gap-2"
                          >
                            <Input
                              type="text"
                              placeholder="Write a reply..."
                              value={replyText}
                              onChange={e => setReplyText(e.target.value)}
                              onKeyDown={e => { if (e.key === "Enter") handleSendReply(comment.id); }}
                              className="text-xs h-8 flex-1"
                              autoFocus
                            />
                            <Button size="sm" className="h-8 px-3 text-xs" onClick={() => handleSendReply(comment.id)}>
                              Send
                            </Button>
                          </motion.div>
                        )}
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ================================================================= */}
      {/* TEAM SETTINGS SLIDE-OVER PANEL                                    */}
      {/* ================================================================= */}
      <AnimatePresence>
        {isSettingsOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/40 z-40"
              onClick={() => setIsSettingsOpen(false)}
            />
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 28, stiffness: 300 }}
              className="fixed top-0 right-0 h-full w-full max-w-4xl bg-background border-l border-border shadow-2xl z-50 flex flex-col"
            >
              {/* Header */}
              <div className="flex items-center justify-between px-6 py-5 border-b border-border bg-card">
                <div>
                  <h2 className="text-lg font-bold text-foreground">Team Settings</h2>
                  <p className="text-xs text-muted-foreground mt-0.5">Configure your {settings.language} team</p>
                </div>
                <Button variant="outline" size="sm" className="h-8 w-8 p-0" onClick={() => setIsSettingsOpen(false)}>
                  <X className="w-4 h-4" />
                </Button>
              </div>

              {/* Tabbed layout: sidebar nav + content */}
              <div className="flex-1 flex min-h-0">
                {/* Sidebar tabs */}
                <div className="w-48 shrink-0 border-r border-border bg-muted/30 py-2 overflow-y-auto">
                  {([
                    { id: "general" as SettingsTab, label: "General", icon: Settings },
                    { id: "keywords" as SettingsTab, label: "Keywords", icon: Hash },
                    { id: "permissions" as SettingsTab, label: "Permissions", icon: Shield },
                    { id: "platforms" as SettingsTab, label: "Platforms", icon: Globe },
                  ]).map(tab => (
                    <button
                      key={tab.id}
                      onClick={() => setSettingsTab(tab.id)}
                      className={cn(
                        "w-full flex items-center gap-2.5 px-4 py-2.5 text-left text-xs font-medium transition-colors",
                        settingsTab === tab.id
                          ? "bg-background text-foreground border-r-2 border-primary shadow-sm"
                          : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                      )}
                    >
                      <tab.icon className="w-3.5 h-3.5 shrink-0" />
                      {tab.label}
                    </button>
                  ))}
                </div>

                {/* Tab content */}
                <div className="flex-1 overflow-y-auto">
                  {/* General — all core settings in one scrollable tab */}
                  {settingsTab === "general" && (
                    <div className="divide-y divide-border">
                      {/* Team Info */}
                      <div className="px-6 py-5">
                        <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-4 flex items-center gap-2">
                          <Shield className="w-3.5 h-3.5" />
                          Team Info
                        </h3>
                        <div className="space-y-4">
                          <div>
                            <Label className="text-xs font-semibold text-foreground">Team Name</Label>
                            <Input
                              value={settings.teamName}
                              onChange={e => setSettings(s => ({ ...s, teamName: e.target.value }))}
                              className="mt-1.5 text-sm h-9"
                            />
                          </div>
                          <div>
                            <Label className="text-xs font-semibold text-foreground">Language</Label>
                            <Input
                              value={settings.language}
                              onChange={e => setSettings(s => ({ ...s, language: e.target.value }))}
                              className="mt-1.5 text-sm h-9"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Assignment Rules */}
                      <div className="px-6 py-5">
                        <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-4 flex items-center gap-2">
                          <ArrowRightLeft className="w-3.5 h-3.5" />
                          Assignment Rules
                        </h3>
                        <div className="space-y-4">
                          <div>
                            <Label className="text-xs font-semibold text-foreground">Auto-Assignment Mode</Label>
                            <div className="grid grid-cols-3 gap-2 mt-2">
                              {([
                                { id: "round_robin", label: "Round Robin", desc: "Even distribution" },
                                { id: "least_busy", label: "Least Busy", desc: "Fewest active chats" },
                                { id: "manual", label: "Manual", desc: "Coordinator assigns" },
                              ] as const).map(mode => (
                                <button
                                  key={mode.id}
                                  onClick={() => setSettings(s => ({ ...s, assignmentMode: mode.id }))}
                                  className={cn(
                                    "p-3 rounded-lg border text-left transition-all",
                                    settings.assignmentMode === mode.id
                                      ? "border-primary bg-primary/5 shadow-sm"
                                      : "border-border hover:border-primary/30"
                                  )}
                                >
                                  <p className="text-xs font-semibold text-foreground">{mode.label}</p>
                                  <p className="text-[11px] text-muted-foreground mt-0.5">{mode.desc}</p>
                                </button>
                              ))}
                            </div>
                          </div>
                          <div>
                            <Label className="text-xs font-semibold text-foreground flex items-center gap-2">
                              <Hash className="w-3 h-3 text-muted-foreground" />
                              Max Concurrent Chats per Volunteer
                            </Label>
                            <div className="flex items-center gap-3 mt-2">
                              <Input
                                type="number"
                                min={1}
                                max={20}
                                value={settings.maxConcurrentChats}
                                onChange={e => setSettings(s => ({ ...s, maxConcurrentChats: Number(e.target.value) }))}
                                className="w-20 text-sm h-9 text-center"
                              />
                              <span className="text-xs text-muted-foreground">conversations at a time</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Escalation */}
                      <div className="px-6 py-5">
                        <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-4 flex items-center gap-2">
                          <AlertTriangle className="w-3.5 h-3.5" />
                          Escalation
                        </h3>
                        <div className="space-y-4">
                          <div>
                            <Label className="text-xs font-semibold text-foreground flex items-center gap-2">
                              <Timer className="w-3 h-3 text-muted-foreground" />
                              Escalation Timeout
                            </Label>
                            <div className="flex items-center gap-3 mt-2">
                              <Input
                                type="number"
                                min={1}
                                max={120}
                                value={settings.escalationTimeout}
                                onChange={e => setSettings(s => ({ ...s, escalationTimeout: Number(e.target.value) }))}
                                className="w-20 text-sm h-9 text-center"
                              />
                              <span className="text-xs text-muted-foreground">minutes of no response before auto-escalation</span>
                            </div>
                          </div>
                          <div className="flex items-center justify-between">
                            <div>
                              <Label className="text-xs font-semibold text-foreground">Auto-Escalate on Trigger Word</Label>
                              <p className="text-[11px] text-muted-foreground mt-0.5">Immediately flag when a trigger word is detected</p>
                            </div>
                            <Switch
                              checked={settings.autoEscalateOnTrigger}
                              onCheckedChange={v => setSettings(s => ({ ...s, autoEscalateOnTrigger: v }))}
                            />
                          </div>
                        </div>
                      </div>

                      {/* Working Hours */}
                      <div className="px-6 py-5">
                        <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-4 flex items-center gap-2">
                          <Clock className="w-3.5 h-3.5" />
                          Working Hours
                        </h3>
                        <div className="space-y-4">
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <Label className="text-xs font-semibold text-foreground">Start Time</Label>
                              <Input
                                type="time"
                                value={settings.workingHoursStart}
                                onChange={e => setSettings(s => ({ ...s, workingHoursStart: e.target.value }))}
                                className="mt-1.5 text-sm h-9"
                              />
                            </div>
                            <div>
                              <Label className="text-xs font-semibold text-foreground">End Time</Label>
                              <Input
                                type="time"
                                value={settings.workingHoursEnd}
                                onChange={e => setSettings(s => ({ ...s, workingHoursEnd: e.target.value }))}
                                className="mt-1.5 text-sm h-9"
                              />
                            </div>
                          </div>
                          <div className="flex items-center justify-between">
                            <div>
                              <Label className="text-xs font-semibold text-foreground flex items-center gap-2">
                                <RotateCcw className="w-3 h-3 text-muted-foreground" />
                                Return to Queue After Hours
                              </Label>
                              <p className="text-[11px] text-muted-foreground mt-0.5">Unclaimed chats return to queue outside working hours</p>
                            </div>
                            <Switch
                              checked={settings.autoReturnAfterHours}
                              onCheckedChange={v => setSettings(s => ({ ...s, autoReturnAfterHours: v }))}
                            />
                          </div>
                        </div>
                      </div>

                      {/* Notifications */}
                      <div className="px-6 py-5">
                        <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-4 flex items-center gap-2">
                          <Volume2 className="w-3.5 h-3.5" />
                          Notifications
                        </h3>
                        <div className="space-y-4">
                          {([
                            { key: "notifyOnNewConversation", label: "New Conversation", desc: "When a new seeker starts a chat in your language" },
                            { key: "notifyOnEscalation", label: "Escalation Alert", desc: "When a volunteer escalates or a trigger word fires" },
                            { key: "notifyOnIdleVolunteer", label: "Idle Volunteer", desc: "When a volunteer hasn't responded in 10+ minutes" },
                          ] as const).map(n => (
                            <div key={n.key} className="flex items-center justify-between">
                              <div>
                                <Label className="text-xs font-semibold text-foreground">{n.label}</Label>
                                <p className="text-[11px] text-muted-foreground mt-0.5">{n.desc}</p>
                              </div>
                              <Switch
                                checked={settings[n.key]}
                                onCheckedChange={v => setSettings(s => ({ ...s, [n.key]: v }))}
                              />
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Keywords & Trigger Words */}
                  {settingsTab === "keywords" && (
                    <div className="px-6 py-5">
                      <h3 className="text-sm font-bold text-foreground mb-1">Keywords &amp; Trigger Words</h3>
                      <p className="text-xs text-muted-foreground mb-5">
                        {triggerWords.length} active keywords that trigger escalation alerts
                      </p>

                      {/* Trigger word chips */}
                      <div className="flex flex-wrap gap-2 mb-3">
                        {triggerWords.map(word => (
                          <span
                            key={word}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-500/10 text-rose-600 border border-rose-500/20"
                          >
                            {word}
                            <button
                              onClick={() => handleRemoveTriggerWord(word)}
                              className="ml-0.5 p-0.5 rounded-full hover:bg-rose-500/20 transition-colors"
                              aria-label={`Remove trigger word ${word}`}
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </span>
                        ))}
                      </div>

                      {/* Add trigger word */}
                      <div className="flex items-center gap-2 mb-4">
                        <Input
                          type="text"
                          placeholder="Add keyword..."
                          value={newTriggerWord}
                          onChange={e => setNewTriggerWord(e.target.value)}
                          onKeyDown={e => { if (e.key === "Enter") handleAddTriggerWord(); }}
                          className="text-xs h-8"
                        />
                        <Button size="sm" className="h-8 px-3 shrink-0" onClick={handleAddTriggerWord}>
                          <Plus className="w-3.5 h-3.5" />
                        </Button>
                      </div>

                      {/* LLM Suggestions */}
                      <div className="space-y-3">
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full text-xs gap-2 justify-center"
                          onClick={() => setShowLlmSuggestions(!showLlmSuggestions)}
                        >
                          <Sparkles className="w-3.5 h-3.5" />
                          {showLlmSuggestions ? "Hide LLM Suggestions" : "LLM Suggestions"}
                        </Button>

                        <AnimatePresence>
                          {showLlmSuggestions && (
                            <motion.div
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: "auto" }}
                              exit={{ opacity: 0, height: 0 }}
                              className="overflow-hidden"
                            >
                              <div className="p-3 bg-violet-500/5 border border-violet-500/20 rounded-lg space-y-2">
                                <p className="text-[11px] font-semibold text-violet-600 flex items-center gap-1">
                                  <Sparkles className="w-3 h-3" />
                                  Suggested keywords based on crisis detection patterns
                                </p>
                                {LLM_SUGGESTED_WORDS.map(word => {
                                  const alreadyAdded = triggerWords.includes(word);
                                  return (
                                    <div key={word} className="flex items-center justify-between">
                                      <span className={cn("text-xs font-medium", alreadyAdded ? "text-muted-foreground line-through" : "text-foreground")}>
                                        {word}
                                      </span>
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        className="h-6 px-2 text-[10px]"
                                        disabled={alreadyAdded}
                                        onClick={() => {
                                          if (!alreadyAdded) {
                                            setTriggerWords(prev => [...prev, word]);
                                            toast.success(`Trigger word "${word}" added.`);
                                          }
                                        }}
                                      >
                                        {alreadyAdded ? "Added" : "Add"}
                                      </Button>
                                    </div>
                                  );
                                })}
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>

                        {/* Bulk Import */}
                        <div>
                          <Label className="text-xs font-semibold text-foreground flex items-center gap-2 mb-1.5">
                            <Upload className="w-3 h-3 text-muted-foreground" />
                            Bulk Import
                          </Label>
                          <Textarea
                            placeholder="Paste comma-separated words (e.g. danger, help, scared, alone)"
                            value={bulkImportText}
                            onChange={e => setBulkImportText(e.target.value)}
                            className="text-xs min-h-[60px]"
                          />
                          <Button
                            variant="outline"
                            size="sm"
                            className="mt-2 w-full text-xs gap-2 justify-center"
                            onClick={handleBulkImport}
                            disabled={!bulkImportText.trim()}
                          >
                            <Upload className="w-3.5 h-3.5" />
                            Import Keywords
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Volunteer Permissions */}
                  {settingsTab === "permissions" && (
                    <div className="px-6 py-5">
                      <h3 className="text-sm font-bold text-foreground mb-1">Volunteer Permissions</h3>
                      <p className="text-xs text-muted-foreground mb-5">
                        Configure feature access for each team member
                      </p>

                      <div className="border border-border rounded-lg overflow-hidden">
                        {/* Table header */}
                        <div className="grid grid-cols-[1fr_auto_auto_auto_auto] gap-0 px-3 py-2 bg-muted/50 border-b border-border">
                          <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Name</span>
                          <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest w-14 text-center">Block</span>
                          <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest w-14 text-center">Transfer</span>
                          <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest w-14 text-center">Audio</span>
                          <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest w-14 text-center">Video</span>
                        </div>

                        {/* Table rows */}
                        <div className="divide-y divide-border max-h-[400px] overflow-y-auto">
                          {sortedTeamMembers.filter(m => m.role === "Volunteer").map(member => {
                            const perms = getVolunteerPerm(member.user.id);
                            return (
                              <div key={member.user.id} className="grid grid-cols-[1fr_auto_auto_auto_auto] gap-0 px-3 py-2 items-center hover:bg-muted/20 transition-colors">
                                <div className="flex items-center gap-2 min-w-0">
                                  <div className={cn("w-6 h-6 rounded-full flex items-center justify-center text-white text-[9px] font-bold shrink-0", avatarColor(member.user.id))}>
                                    {getInitial(member.user.name)}
                                  </div>
                                  <span className="text-xs font-medium text-foreground truncate">{member.user.name}</span>
                                </div>
                                <div className="w-14 flex justify-center">
                                  <Switch
                                    checked={perms.blockSeekers}
                                    onCheckedChange={() => toggleVolunteerPerm(member.user.id, "blockSeekers")}
                                  />
                                </div>
                                <div className="w-14 flex justify-center">
                                  <Switch
                                    checked={perms.transferConversations}
                                    onCheckedChange={() => toggleVolunteerPerm(member.user.id, "transferConversations")}
                                  />
                                </div>
                                <div className="w-14 flex justify-center">
                                  <Switch
                                    checked={perms.audioMessages}
                                    onCheckedChange={() => toggleVolunteerPerm(member.user.id, "audioMessages")}
                                  />
                                </div>
                                <div className="w-14 flex justify-center">
                                  <Switch
                                    checked={perms.videoCalls}
                                    onCheckedChange={() => toggleVolunteerPerm(member.user.id, "videoCalls")}
                                  />
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Connected Platforms */}
                  {settingsTab === "platforms" && (
                    <div className="px-6 py-5">
                      <h3 className="text-sm font-bold text-foreground mb-1">Connected Platforms</h3>
                      <p className="text-xs text-muted-foreground mb-5">
                        Manage chat platform integrations
                      </p>
                      <div className="space-y-2">
                        {connectedPlatforms.map(platform => (
                          <div
                            key={platform.id}
                            className="flex items-center justify-between p-3 rounded-lg border border-border hover:bg-muted/20 transition-colors"
                          >
                            <div className="flex items-center gap-3">
                              <div className={cn(
                                "w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold",
                                platform.connected
                                  ? "bg-emerald-500/10 text-emerald-600 border border-emerald-500/20"
                                  : "bg-gray-500/10 text-gray-500 border border-gray-500/20"
                              )}>
                                <Globe className="w-4 h-4" />
                              </div>
                              <div>
                                <p className="text-xs font-semibold text-foreground">{platform.name}</p>
                                <div className="flex items-center gap-1 mt-0.5">
                                  <span className={cn(
                                    "w-1.5 h-1.5 rounded-full",
                                    platform.connected ? "bg-emerald-500" : "bg-gray-400"
                                  )} />
                                  <span className={cn(
                                    "text-[10px] font-medium",
                                    platform.connected ? "text-emerald-600" : "text-muted-foreground"
                                  )}>
                                    {platform.connected ? "Connected" : "Not connected"}
                                  </span>
                                </div>
                              </div>
                            </div>
                            <Button
                              variant="outline"
                              size="sm"
                              className={cn(
                                "h-7 px-3 text-xs gap-1",
                                platform.connected
                                  ? "text-rose-600 hover:text-rose-700 hover:bg-rose-50"
                                  : "text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50"
                              )}
                              onClick={() => handleConnectPlatform(platform.id, platform.name)}
                            >
                              {platform.connected ? (
                                <>
                                  <X className="w-3 h-3" />
                                  Disconnect
                                </>
                              ) : (
                                <>
                                  <ExternalLink className="w-3 h-3" />
                                  Connect
                                </>
                              )}
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Footer */}
              <div className="px-6 py-4 border-t border-border bg-card flex items-center justify-between">
                <Button variant="outline" size="sm" onClick={() => setIsSettingsOpen(false)}>
                  Cancel
                </Button>
                <Button
                  size="sm"
                  onClick={() => {
                    setIsSettingsOpen(false);
                    toast.success("Team settings saved!");
                  }}
                >
                  Save Changes
                </Button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ================================================================= */}
      {/* ARTICLE CREATE/EDIT MODAL                                         */}
      {/* ================================================================= */}
      <AnimatePresence>
        {articleModal && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/40 z-40"
              onClick={() => setArticleModal(null)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4"
              onClick={() => setArticleModal(null)}
            >
              <div
                className="bg-background rounded-lg border border-border shadow-2xl w-full max-w-lg"
                onClick={e => e.stopPropagation()}
              >
                <div className="px-6 py-4 border-b border-border flex items-center justify-between">
                  <h3 className="text-sm font-bold text-foreground">
                    {articleModal.mode === "create" ? "Create Article" : "Edit Article"}
                  </h3>
                  <Button variant="outline" size="sm" className="h-7 w-7 p-0" onClick={() => setArticleModal(null)}>
                    <X className="w-3.5 h-3.5" />
                  </Button>
                </div>
                <div className="px-6 py-4 space-y-4">
                  <div>
                    <Label className="text-xs font-semibold text-foreground">Title</Label>
                    <Input
                      value={articleForm.title}
                      onChange={e => setArticleForm(f => ({ ...f, title: e.target.value }))}
                      placeholder="Article title..."
                      className="mt-1.5 text-sm h-9"
                    />
                  </div>
                  <div>
                    <Label className="text-xs font-semibold text-foreground">Category</Label>
                    <select
                      value={articleForm.category}
                      onChange={e => setArticleForm(f => ({ ...f, category: e.target.value as ArticleCategory }))}
                      className="mt-1.5 w-full h-9 rounded-md border border-input bg-background px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                    >
                      {ARTICLE_CATEGORIES.map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <Label className="text-xs font-semibold text-foreground">Body (markdown)</Label>
                    <Textarea
                      value={articleForm.body}
                      onChange={e => setArticleForm(f => ({ ...f, body: e.target.value }))}
                      placeholder="Write the article content..."
                      className="mt-1.5 text-sm min-h-[140px]"
                    />
                  </div>
                </div>
                <div className="px-6 py-4 border-t border-border flex items-center justify-end gap-2">
                  <Button variant="outline" size="sm" onClick={() => setArticleModal(null)}>
                    Cancel
                  </Button>
                  <Button size="sm" onClick={handleSaveArticle}>
                    {articleModal.mode === "create" ? "Save Article" : "Update Article"}
                  </Button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ================================================================= */}
      {/* POST CREATE/EDIT MODAL                                            */}
      {/* ================================================================= */}
      <AnimatePresence>
        {postModal && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/40 z-40"
              onClick={() => setPostModal(null)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4"
              onClick={() => setPostModal(null)}
            >
              <div
                className="bg-background rounded-lg border border-border shadow-2xl w-full max-w-lg"
                onClick={e => e.stopPropagation()}
              >
                <div className="px-6 py-4 border-b border-border flex items-center justify-between">
                  <h3 className="text-sm font-bold text-foreground">
                    {postModal.mode === "create" ? "Create Post" : "Edit Post"}
                  </h3>
                  <Button variant="outline" size="sm" className="h-7 w-7 p-0" onClick={() => setPostModal(null)}>
                    <X className="w-3.5 h-3.5" />
                  </Button>
                </div>
                <div className="px-6 py-4 space-y-4">
                  <div>
                    <Label className="text-xs font-semibold text-foreground">Content</Label>
                    <Textarea
                      value={postForm.content}
                      onChange={e => setPostForm(f => ({ ...f, content: e.target.value }))}
                      placeholder="What would you like to share with the team?"
                      className="mt-1.5 text-sm min-h-[120px]"
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-xs font-semibold text-foreground flex items-center gap-2">
                        <Pin className="w-3 h-3 text-muted-foreground" />
                        Pin this post
                      </Label>
                      <p className="text-[11px] text-muted-foreground mt-0.5">Pinned posts appear at the top of the feed</p>
                    </div>
                    <Switch
                      checked={postForm.pinned}
                      onCheckedChange={v => setPostForm(f => ({ ...f, pinned: v }))}
                    />
                  </div>
                </div>
                <div className="px-6 py-4 border-t border-border flex items-center justify-end gap-2">
                  <Button variant="outline" size="sm" onClick={() => setPostModal(null)}>
                    Cancel
                  </Button>
                  <Button size="sm" onClick={handleSavePost}>
                    {postModal.mode === "create" ? "Post" : "Update Post"}
                  </Button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};
