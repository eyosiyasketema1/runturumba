import React, { useState, useMemo } from "react";
import {
  MessageSquare, Clock, CheckCircle2, Timer, ChevronRight,
  BookOpen, Zap, Bug, AlertTriangle, Hand, Globe,
  ArrowRightLeft, ShieldAlert, Ban, Undo2, Church
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { toast } from "sonner";
import {
  cn, type Contact, type Message, type User, type MessagePort,
  formatTimeAgo, CHANNEL_TYPES
} from "./types";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ConversationMeta {
  contactId: string;
  assigneeId: string | null;
  status: "active" | "pending_response" | "resolved";
  lastMessageAt: string;
  firstMessageAt: string;
  lastMessagePreview: string;
  channel: MessagePort;
  unreadCount: number;
  language: string;
}

interface VolunteerDashboardProps {
  contacts: Contact[];
  messages: Message[];
  users: User[];
  currentUser: User;
  onOpenConversation: (contactId: string) => void;
  onClaimConversation: (contactId: string) => void;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const TAB_OPTIONS = ["Active", "Pending Response", "Resolved Today"] as const;
type TabOption = (typeof TAB_OPTIONS)[number];

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

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export const VolunteerDashboard = ({
  contacts,
  messages,
  users,
  currentUser,
  onOpenConversation,
  onClaimConversation,
}: VolunteerDashboardProps) => {
  const [activeTab, setActiveTab] = useState<TabOption>("Active");
  const [readConversations, setReadConversations] = useState<Set<string>>(new Set());

  // Build conversation metadata from messages
  const conversations = useMemo<ConversationMeta[]>(() => {
    const byContact: Record<string, Message[]> = {};
    messages.forEach(m => {
      if (!byContact[m.contactId]) byContact[m.contactId] = [];
      byContact[m.contactId].push(m);
    });

    return Object.entries(byContact).map(([contactId, msgs]) => {
      const sorted = [...msgs].sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
      const latest = sorted[0];
      const oldest = sorted[sorted.length - 1];
      const contact = contacts.find(c => c.id === contactId);

      // Deterministic assignment: use seeded random based on contactId
      const rand = seededRandom(contactId);
      const r = rand();
      let assigneeId: string | null = null;
      let status: ConversationMeta["status"] = "active";

      if (r < 0.35) {
        // Claimed by current user
        assigneeId = currentUser.id;
        status = rand() < 0.5 ? "active" : "pending_response";
      } else if (r < 0.55) {
        // Resolved today by current user
        assigneeId = currentUser.id;
        status = "resolved";
      } else {
        // Unclaimed
        assigneeId = null;
        status = "active";
      }

      const unreadFromContact = sorted.filter(
        m => m.senderType === "contact" && (m.status === "delivered" || m.status === "received")
      ).length;

      return {
        contactId,
        assigneeId,
        status,
        lastMessageAt: latest.createdAt,
        firstMessageAt: oldest.createdAt,
        lastMessagePreview: latest.content.length > 80
          ? latest.content.slice(0, 77) + "..."
          : latest.content,
        channel: latest.port,
        unreadCount: assigneeId === currentUser.id && status !== "resolved"
          ? Math.min(unreadFromContact, 5)
          : 0,
        language: contact?.preferredLanguage || "English",
      };
    });
  }, [messages, contacts, currentUser.id]);

  // Partition conversations
  const myConversations = useMemo(
    () => conversations.filter(c => c.assigneeId === currentUser.id),
    [conversations, currentUser.id]
  );

  const unclaimed = useMemo(
    () =>
      [...conversations.filter(c => c.assigneeId === null)].sort(
        (a, b) => new Date(a.firstMessageAt).getTime() - new Date(b.firstMessageAt).getTime()
      ),
    [conversations]
  );

  const activeConvos = myConversations.filter(c => c.status === "active");
  const pendingConvos = myConversations.filter(c => c.status === "pending_response");
  const resolvedConvos = myConversations.filter(c => c.status === "resolved");

  const filteredConvos = activeTab === "Active"
    ? activeConvos
    : activeTab === "Pending Response"
      ? pendingConvos
      : resolvedConvos;

  // Stats
  const avgResponseSeconds = 135; // 2m 15s mock
  const avgResponseFormatted = `${Math.floor(avgResponseSeconds / 60)}m ${avgResponseSeconds % 60}s`;

  // Handlers
  const handleOpenConversation = (contactId: string) => {
    setReadConversations(prev => new Set(prev).add(contactId));
    onOpenConversation(contactId);
  };

  const handleClaim = (contactId: string) => {
    onClaimConversation(contactId);
    toast.success("Conversation claimed. Opening chat...");
  };

  const getContactName = (contactId: string) =>
    contacts.find(c => c.id === contactId)?.name || "Anonymous";

  // Greeting
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";

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
                Online · Volunteer Hub
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
                {activeConvos.length + pendingConvos.length} active chats
              </span>
              <span className="mx-2 text-slate-500">&middot;</span>
              <span className="font-semibold text-emerald-300">
                {unclaimed.length} waiting in queue
              </span>
              <span className="mx-2 text-slate-500">&middot;</span>
              <span className="font-semibold text-pink-300">
                {resolvedConvos.length} resolved today
              </span>
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              className="border-white/20 bg-white/10 text-white hover:bg-white/20 hover:text-white backdrop-blur-sm"
              onClick={() => toast.info("Opening scripture library...")}
            >
              <BookOpen className="w-3.5 h-3.5 mr-1.5" />
              Scriptures
            </Button>
          </div>
        </div>
      </header>

      {/* KPI Stats Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          {
            label: "My Active Chats",
            value: activeConvos.length + pendingConvos.length,
            icon: MessageSquare,
            color: "text-blue-600",
            bg: "bg-blue-500/10",
          },
          {
            label: "Unclaimed Queue",
            value: unclaimed.length,
            icon: Clock,
            color: "text-amber-600",
            bg: "bg-amber-500/10",
          },
          {
            label: "Resolved Today",
            value: resolvedConvos.length,
            icon: CheckCircle2,
            color: "text-emerald-600",
            bg: "bg-emerald-500/10",
          },
          {
            label: "Avg Response Time",
            value: avgResponseFormatted,
            icon: Timer,
            color: "text-violet-600",
            bg: "bg-violet-500/10",
          },
        ].map((kpi, i) => (
          <motion.div
            key={kpi.label}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: i * 0.06, ease: "easeOut" }}
            className="bg-card p-5 rounded-lg border border-border shadow-sm group hover:border-primary/30 transition-all"
          >
            <div className="flex items-center justify-between mb-3">
              <div
                className={cn(
                  "p-2 rounded-md border border-border group-hover:border-primary/20 transition-all",
                  kpi.bg
                )}
              >
                <kpi.icon
                  className={cn("w-4 h-4 transition-all", kpi.color)}
                />
              </div>
            </div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">
              {kpi.label}
            </p>
            <p className="text-2xl font-bold tracking-tight text-foreground mt-0.5">
              {typeof kpi.value === "number" ? kpi.value.toLocaleString() : kpi.value}
            </p>
          </motion.div>
        ))}
      </div>

      {/* Main Content: Two-column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Left Column — My Conversations (60%) */}
        <div className="lg:col-span-3 space-y-4">
          <div className="bg-card rounded-lg border border-border shadow-sm overflow-hidden">
            {/* Section Header */}
            <div className="px-6 pt-5 pb-4 border-b border-border">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-sm font-bold text-foreground">My Conversations</h2>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {myConversations.length} total &middot; {activeConvos.length} active
                  </p>
                </div>
              </div>

              {/* Tab Pills */}
              <div className="flex gap-1.5 p-1 bg-muted rounded-md border border-border">
                {TAB_OPTIONS.map(tab => {
                  const count =
                    tab === "Active"
                      ? activeConvos.length
                      : tab === "Pending Response"
                        ? pendingConvos.length
                        : resolvedConvos.length;
                  return (
                    <button
                      key={tab}
                      onClick={() => setActiveTab(tab)}
                      className={cn(
                        "flex items-center gap-1.5 px-3 py-1.5 rounded-sm text-xs font-semibold transition-all",
                        activeTab === tab
                          ? "bg-background text-foreground shadow-sm border border-border"
                          : "text-muted-foreground hover:text-foreground"
                      )}
                    >
                      {tab}
                      <span
                        className={cn(
                          "text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[20px] text-center",
                          activeTab === tab
                            ? "bg-primary/10 text-primary"
                            : "bg-muted-foreground/10 text-muted-foreground"
                        )}
                      >
                        {count}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Conversation List */}
            <div className="divide-y divide-border">
              <AnimatePresence mode="wait">
                {filteredConvos.length === 0 ? (
                  <motion.div
                    key="empty"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="py-16 text-center"
                  >
                    <CheckCircle2 className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
                    <p className="text-sm font-medium text-muted-foreground">
                      {activeTab === "Active"
                        ? "No active conversations"
                        : activeTab === "Pending Response"
                          ? "No conversations pending response"
                          : "No resolved conversations today"}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Claim a conversation from the queue to get started.
                    </p>
                  </motion.div>
                ) : (
                  <motion.div
                    key={activeTab}
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                    transition={{ duration: 0.15 }}
                  >
                    {filteredConvos.map(convo => {
                      const name = getContactName(convo.contactId);
                      const channelInfo = getChannelInfo(convo.channel);
                      const isRead = readConversations.has(convo.contactId);
                      const showUnread = convo.unreadCount > 0 && !isRead;

                      return (
                        <button
                          key={convo.contactId}
                          onClick={() => handleOpenConversation(convo.contactId)}
                          className="w-full text-left px-6 py-4 hover:bg-muted/50 transition-colors group flex items-center gap-4"
                        >
                          {/* Avatar */}
                          <div
                            className={cn(
                              "w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-bold shrink-0",
                              avatarColor(convo.contactId)
                            )}
                          >
                            {getInitial(name)}
                          </div>

                          {/* Content */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-semibold text-foreground truncate">
                                {name}
                              </span>
                              {/* Channel icon */}
                              {channelInfo.logoUrl ? (
                                <img
                                  src={channelInfo.logoUrl}
                                  alt={channelInfo.label}
                                  className="w-3.5 h-3.5 shrink-0"
                                />
                              ) : (
                                <channelInfo.icon
                                  className={cn("w-3.5 h-3.5 shrink-0", channelInfo.color)}
                                />
                              )}
                              {convo.status === "pending_response" && (
                                <Badge
                                  variant="outline"
                                  className="text-[10px] px-1.5 py-0 bg-amber-500/10 text-amber-600 border-amber-500/20"
                                >
                                  Awaiting
                                </Badge>
                              )}
                            </div>
                            <p className="text-xs text-muted-foreground truncate mt-0.5">
                              {convo.lastMessagePreview}
                            </p>
                          </div>

                          {/* Right Side: time + unread */}
                          <div className="flex flex-col items-end gap-1 shrink-0">
                            <span className="text-[11px] text-muted-foreground">
                              {formatTimeAgo(convo.lastMessageAt)}
                            </span>
                            {showUnread && (
                              <span className="w-5 h-5 rounded-full bg-destructive text-destructive-foreground text-[10px] font-bold flex items-center justify-center">
                                {convo.unreadCount}
                              </span>
                            )}
                          </div>

                          <ChevronRight className="w-4 h-4 text-muted-foreground/40 group-hover:text-muted-foreground transition-colors shrink-0" />
                        </button>
                      );
                    })}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Quick Actions Bar */}
          <div className="bg-card rounded-lg border border-border shadow-sm p-5">
            <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-4">
              Quick Actions
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
              {[
                {
                  label: "Transfer",
                  icon: ArrowRightLeft,
                  action: () => toast.info("Transfer: Select a conversation first."),
                  variant: "outline" as const,
                },
                {
                  label: "Alert Admins",
                  icon: ShieldAlert,
                  action: () => toast.info("Admin alert sent."),
                  variant: "outline" as const,
                },
                {
                  label: "Mark Spam",
                  icon: Ban,
                  action: () => toast.info("Marked as spam."),
                  variant: "outline" as const,
                },
                {
                  label: "Return to Queue",
                  icon: Undo2,
                  action: () => toast.info("Returned to queue."),
                  variant: "outline" as const,
                },
                {
                  label: "Church Connect",
                  icon: Church,
                  action: () => toast.info("Opening church connections..."),
                  variant: "outline" as const,
                },
                {
                  label: "Quick Replies",
                  icon: Zap,
                  action: () => toast.info("Opening quick replies library..."),
                  variant: "outline" as const,
                },
              ].map(act => (
                <Button
                  key={act.label}
                  variant={act.variant}
                  size="sm"
                  className="text-xs justify-start gap-2 h-9"
                  onClick={act.action}
                >
                  <act.icon className="w-3.5 h-3.5" />
                  {act.label}
                </Button>
              ))}
            </div>
            <div className="flex items-center gap-2 mt-3 pt-3 border-t border-border">
              <Button
                variant="outline"
                size="sm"
                className="text-xs gap-2"
                onClick={() => toast.info("Opening scripture library...")}
              >
                <BookOpen className="w-3.5 h-3.5" />
                Scripture Library
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="text-xs gap-2"
                onClick={() => toast.info("Bug report submitted.")}
              >
                <Bug className="w-3.5 h-3.5" />
                Report Bug
              </Button>
              <Button
                variant="destructive"
                size="sm"
                className="text-xs gap-2 ml-auto"
                onClick={() => toast.error("Emergency alert sent to all admins!")}
              >
                <AlertTriangle className="w-3.5 h-3.5" />
                Emergency Alert
              </Button>
            </div>
          </div>
        </div>

        {/* Right Column — Unclaimed Queue (40%) */}
        <div className="lg:col-span-2">
          <div className="bg-card rounded-lg border border-border shadow-sm overflow-hidden sticky top-6">
            {/* Queue Header */}
            <div className="px-6 pt-5 pb-4 border-b border-border">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <h2 className="text-sm font-bold text-foreground">
                    Unclaimed Queue
                  </h2>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-600 border border-amber-500/20">
                    {unclaimed.length}
                  </span>
                </div>
                <span className="text-xs text-muted-foreground">
                  Oldest first
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Conversations waiting to be picked up
              </p>
            </div>

            {/* Queue List */}
            <div className="divide-y divide-border max-h-[600px] overflow-y-auto">
              {unclaimed.length === 0 ? (
                <div className="py-16 text-center">
                  <Hand className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
                  <p className="text-sm font-medium text-muted-foreground">
                    Queue is empty
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    All conversations have been claimed. Great work!
                  </p>
                </div>
              ) : (
                unclaimed.map((convo, i) => {
                  const name = getContactName(convo.contactId);
                  const channelInfo = getChannelInfo(convo.channel);

                  return (
                    <motion.div
                      key={convo.contactId}
                      initial={{ opacity: 0, x: 8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.2, delay: i * 0.04, ease: "easeOut" }}
                      className="px-5 py-4 hover:bg-muted/30 transition-colors"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start gap-3 min-w-0 flex-1">
                          {/* Avatar */}
                          <div
                            className={cn(
                              "w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0 mt-0.5",
                              avatarColor(convo.contactId)
                            )}
                          >
                            {getInitial(name)}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-sm font-semibold text-foreground truncate">
                                {name}
                              </span>
                              {channelInfo.logoUrl ? (
                                <img
                                  src={channelInfo.logoUrl}
                                  alt={channelInfo.label}
                                  className="w-3.5 h-3.5 shrink-0"
                                />
                              ) : (
                                <channelInfo.icon
                                  className={cn("w-3.5 h-3.5 shrink-0", channelInfo.color)}
                                />
                              )}
                              <Badge
                                variant="outline"
                                className="text-[10px] px-1.5 py-0 shrink-0"
                              >
                                <Globe className="w-2.5 h-2.5 mr-0.5" />
                                {convo.language}
                              </Badge>
                            </div>
                            <p className="text-xs text-muted-foreground truncate mt-1">
                              {convo.lastMessagePreview}
                            </p>
                            <div className="flex items-center gap-2 mt-2">
                              <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                Waiting {formatTimeAgo(convo.firstMessageAt)}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Claim button */}
                        <Button
                          size="sm"
                          className="text-xs h-8 px-3 shrink-0 mt-0.5"
                          onClick={() => handleClaim(convo.contactId)}
                        >
                          <Hand className="w-3 h-3 mr-1" />
                          Claim
                        </Button>
                      </div>
                    </motion.div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
