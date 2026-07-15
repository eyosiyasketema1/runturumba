import React, { useState, useMemo, useRef, useEffect } from "react";
import {
  Users, MessageSquare, AlertTriangle, Clock, TrendingUp,
  CheckCircle2, Plus, X, Shield,
  UserPlus, Globe, ArrowRightLeft, Bell, Trophy,
  ChevronLeft, ChevronRight, Search, Settings, Timer, Hash, Volume2, RotateCcw,
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
  const [triggerWords, setTriggerWords] = useState<string[]>(DEFAULT_TRIGGER_WORDS);
  const [newTriggerWord, setNewTriggerWord] = useState("");
  // Escalation queue UX state
  const [escPage, setEscPage] = useState(1);
  const [escFilter, setEscFilter] = useState<"all" | EscalationItem["reason"]>("all");
  const [escSearch, setEscSearch] = useState("");
  const ESC_PAGE_SIZE = 8;
  // Reassign popover state
  const [reassignOpen, setReassignOpen] = useState<string | null>(null);
  const reassignRef = useRef<HTMLDivElement>(null);
  // Team Settings panel state
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [settings, setSettings] = useState({
    teamName: "Amharic Team",
    language: "Amharic",
    assignmentMode: "round_robin" as "round_robin" | "least_busy" | "manual",
    maxConcurrentChats: 5,
    escalationTimeout: 15, // minutes
    autoEscalateOnTrigger: true,
    notifyOnNewConversation: true,
    notifyOnEscalation: true,
    notifyOnIdleVolunteer: false,
    workingHoursStart: "08:00",
    workingHoursEnd: "22:00",
    autoReturnAfterHours: true,
  });

  // Filter contacts for the Amharic team
  const teamContacts = useMemo(
    () => contacts.filter(c => c.preferredLanguage === "Amharic"),
    [contacts]
  );

  // Build team members: real users + synthetic volunteers for a realistic roster
  const teamMembers = useMemo<TeamMember[]>(() => {
    // Start with real users whose mentorProfile.languages includes "AM"
    const amharicUsers = users.filter(u => {
      if (u.id === currentUser.id) return false;
      const langs = u.mentorProfile?.languages || "";
      return langs.toUpperCase().includes("AM");
    });

    // Also include users assigned to Amharic contacts
    const amharicMentorIds = new Set(teamContacts.map(c => c.assignedMentorId).filter(Boolean));
    const additionalUsers = users.filter(u => {
      if (u.id === currentUser.id) return false;
      if (amharicUsers.find(au => au.id === u.id)) return false;
      return amharicMentorIds.has(u.id);
    });

    const realUsers = [...amharicUsers, ...additionalUsers];

    // Generate synthetic team members so the roster is realistic (6-8 members)
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

    // Add enough synthetic members so total is at least 7
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

  // Sort team members: online first, then alphabetical
  const sortedTeamMembers = useMemo(
    () =>
      [...teamMembers].sort((a, b) => {
        if (a.online !== b.online) return a.online ? -1 : 1;
        return a.user.name.localeCompare(b.user.name);
      }),
    [teamMembers]
  );

  // Build conversations metadata for this language
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
      let status: "active" | "resolved" = r < 0.65 ? "active" : "resolved";

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

  // Build escalation queue
  const escalations = useMemo<EscalationItem[]>(() => {
    const items: EscalationItem[] = [];
    teamContacts.forEach((contact, i) => {
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

  // Build keyword alerts
  const keywordAlerts = useMemo<KeywordAlert[]>(() => {
    const alerts: KeywordAlert[] = [];
    teamContacts.forEach((contact, i) => {
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

  // Build performance data
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

  // KPI computations
  const teamMemberCount = teamMembers.length;
  const activeConvoCount = activeConversations.length;
  const flaggedCount = escalations.length;
  const avgResponseTime = "3m 42s";
  const resolutionRate = teamConversations.length > 0
    ? Math.round((resolvedToday.length / teamConversations.length) * 100)
    : 0;

  // Handlers
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

  // Reset to page 1 when filter/search changes
  useEffect(() => { setEscPage(1); }, [escFilter, escSearch]);

  // Greeting
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";
  const topPerformerId = performance.length > 0 ? performance[0].userId : null;

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

      {/* KPI Stats Row */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        {[
          {
            label: "Team Members",
            value: teamMemberCount,
            icon: Users,
            color: "text-blue-600",
            bg: "bg-blue-500/10",
          },
          {
            label: "Active Conversations",
            value: activeConvoCount,
            icon: MessageSquare,
            color: "text-emerald-600",
            bg: "bg-emerald-500/10",
          },
          {
            label: "Flagged for Review",
            value: flaggedCount,
            icon: AlertTriangle,
            color: "text-rose-600",
            bg: "bg-rose-500/10",
          },
          {
            label: "Avg Response Time",
            value: avgResponseTime,
            icon: Clock,
            color: "text-violet-600",
            bg: "bg-violet-500/10",
          },
          {
            label: "Resolution Rate",
            value: `${resolutionRate}%`,
            icon: TrendingUp,
            color: "text-amber-600",
            bg: "bg-amber-500/10",
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

      {/* Three-panel layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Panel (~42%) — Team Roster */}
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
                  <p className="text-sm font-medium text-muted-foreground">
                    No team members found
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Add volunteers to your Amharic team.
                  </p>
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
                    {/* Avatar */}
                    <div className="relative shrink-0">
                      {member.user.avatar ? (
                        <img
                          src={member.user.avatar}
                          alt={member.user.name}
                          className="w-9 h-9 rounded-full object-cover"
                        />
                      ) : (
                        <div
                          className={cn(
                            "w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-bold",
                            avatarColor(member.user.id)
                          )}
                        >
                          {getInitial(member.user.name)}
                        </div>
                      )}
                      <span
                        className={cn(
                          "absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-card",
                          member.online ? "bg-emerald-500" : "bg-gray-400"
                        )}
                      />
                    </div>

                    {/* Name + role */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-foreground truncate">
                          {member.user.name}
                        </span>
                        <Badge
                          variant="outline"
                          className={cn("text-[10px] px-1.5 py-0", ROLE_BADGE_STYLES[member.role])}
                        >
                          {member.role}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {member.activeChatCount} active chats &middot; Last active {formatTimeAgo(member.lastActive)}
                      </p>
                    </div>

                    {/* Chat count */}
                    <div className="shrink-0 flex items-center gap-1.5">
                      <MessageSquare className="w-3.5 h-3.5 text-muted-foreground" />
                      <span className="text-xs font-semibold text-foreground">
                        {member.activeChatCount}
                      </span>
                    </div>
                  </motion.div>
                ))
              )}
            </div>

            {/* Add team member button */}
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

        {/* Center Panel (~33%) — Escalation Queue */}
        <div className="lg:col-span-4">
          <div className="bg-card rounded-lg border border-border shadow-sm overflow-hidden">
            {/* Header */}
            <div className="px-6 pt-5 pb-4 border-b border-border">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <h2 className="text-sm font-bold text-foreground">
                    Escalation Queue
                  </h2>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-600 border border-rose-500/20">
                    {escalations.length}
                  </span>
                </div>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Flagged conversations needing review
              </p>

              {/* Search bar */}
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

              {/* Filter tabs */}
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

            {/* Escalation list */}
            <div className="divide-y divide-border">
              {filteredEscalations.length === 0 ? (
                <div className="py-16 text-center">
                  <CheckCircle2 className="w-10 h-10 text-emerald-500/40 mx-auto mb-3" />
                  <p className="text-sm font-medium text-muted-foreground">
                    {escalations.length === 0 ? "No escalations" : "No matching results"}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {escalations.length === 0
                      ? "Your team is on top of things!"
                      : "Try adjusting your search or filter."}
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
                    {escPageItems.map((esc, i) => {
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
                            {/* Avatar */}
                            <div
                              className={cn(
                                "w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0",
                                avatarColor(esc.contactId)
                              )}
                            >
                              {getInitial(esc.contactName)}
                            </div>

                            {/* Contact info */}
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="text-sm font-semibold text-foreground truncate">
                                  {esc.contactName}
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
                                  className={cn("text-[10px] px-1.5 py-0", reasonStyles[esc.reason])}
                                >
                                  {esc.reason}
                                </Badge>
                              </div>
                              <p className="text-xs text-muted-foreground mt-0.5">
                                Flagged by {esc.volunteerName}
                                <span className="mx-1.5 text-border">&middot;</span>
                                {formatTimeAgo(esc.flaggedAt)}
                              </p>
                            </div>

                            {/* Actions — far right */}
                            <div className="flex items-center gap-1.5 shrink-0 relative">
                              <Button
                                size="sm"
                                className="text-xs h-7 px-2.5"
                                onClick={() => onOpenConversation(esc.contactId)}
                              >
                                Review
                              </Button>
                              <div className="relative" ref={reassignOpen === esc.contactId ? reassignRef : undefined}>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className={cn(
                                    "text-xs h-7 px-2.5 gap-1",
                                    reassignOpen === esc.contactId && "bg-muted border-primary/40"
                                  )}
                                  onClick={() => setReassignOpen(
                                    reassignOpen === esc.contactId ? null : esc.contactId
                                  )}
                                >
                                  <ArrowRightLeft className="w-3 h-3" />
                                  Reassign
                                </Button>

                                {/* Reassign popover — team member picker */}
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
                                              <img
                                                src={member.user.avatar}
                                                alt={member.user.name}
                                                className="w-7 h-7 rounded-full object-cover"
                                              />
                                            ) : (
                                              <div
                                                className={cn(
                                                  "w-7 h-7 rounded-full flex items-center justify-center text-white text-[10px] font-bold",
                                                  avatarColor(member.user.id)
                                                )}
                                              >
                                                {getInitial(member.user.name)}
                                              </div>
                                            )}
                                            <span
                                              className={cn(
                                                "absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-popover",
                                                member.online ? "bg-emerald-500" : "bg-gray-400"
                                              )}
                                            />
                                          </div>
                                          <div className="flex-1 min-w-0">
                                            <p className="text-xs font-semibold text-foreground truncate">
                                              {member.user.name}
                                            </p>
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

            {/* Pagination footer */}
            {filteredEscalations.length > ESC_PAGE_SIZE && (
              <div className="px-5 py-3 border-t border-border flex items-center justify-between">
                <p className="text-xs text-muted-foreground">
                  {(escPage - 1) * ESC_PAGE_SIZE + 1}–{Math.min(escPage * ESC_PAGE_SIZE, filteredEscalations.length)} of {filteredEscalations.length}
                </p>
                <div className="flex items-center gap-1">
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 w-7 p-0"
                    disabled={escPage <= 1}
                    onClick={() => setEscPage(p => p - 1)}
                  >
                    <ChevronLeft className="w-3.5 h-3.5" />
                  </Button>
                  <span className="text-xs font-semibold text-foreground px-2">
                    {escPage} / {escTotalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 w-7 p-0"
                    disabled={escPage >= escTotalPages}
                    onClick={() => setEscPage(p => p + 1)}
                  >
                    <ChevronRight className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Panel (25%) — Trigger Words */}
        <div className="lg:col-span-3">
          <div className="bg-card rounded-lg border border-border shadow-sm overflow-hidden sticky top-6">
            <div className="px-6 pt-5 pb-4 border-b border-border">
              <h2 className="text-sm font-bold text-foreground">Trigger Words</h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                {triggerWords.length} active keywords
              </p>
            </div>

            {/* Trigger word chips */}
            <div className="px-5 pt-4 pb-3">
              <div className="flex flex-wrap gap-2">
                {triggerWords.map(word => (
                  <motion.span
                    key={word}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
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
                  </motion.span>
                ))}
              </div>

              {/* Add trigger word input */}
              <div className="flex items-center gap-2 mt-3">
                <Input
                  type="text"
                  placeholder="Add keyword..."
                  value={newTriggerWord}
                  onChange={e => setNewTriggerWord(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === "Enter") handleAddTriggerWord();
                  }}
                  className="text-xs h-8"
                />
                <Button
                  size="sm"
                  className="h-8 px-3 shrink-0"
                  onClick={handleAddTriggerWord}
                >
                  <Plus className="w-3.5 h-3.5" />
                </Button>
              </div>
            </div>

            {/* Recent Keyword Alerts */}
            <div className="border-t border-border">
              <div className="px-5 pt-4 pb-2">
                <div className="flex items-center gap-2 mb-3">
                  <Bell className="w-3.5 h-3.5 text-muted-foreground" />
                  <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-widest">
                    Recent Keyword Alerts
                  </h3>
                </div>

                {keywordAlerts.length === 0 ? (
                  <p className="text-xs text-muted-foreground py-4 text-center">
                    No recent alerts
                  </p>
                ) : (
                  <div className="space-y-2.5 pb-2">
                    {keywordAlerts.map((alert, i) => (
                      <motion.div
                        key={`${alert.contactName}-${alert.wordMatched}-${i}`}
                        initial={{ opacity: 0, y: 4 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.15, delay: i * 0.03 }}
                        className="flex items-center justify-between gap-2"
                      >
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-medium text-foreground truncate">
                            {alert.contactName}
                          </p>
                          <p className="text-[11px] text-muted-foreground">
                            Matched &ldquo;<span className="font-semibold text-rose-500">{alert.wordMatched}</span>&rdquo;
                          </p>
                        </div>
                        <span className="text-[11px] text-muted-foreground shrink-0">
                          {formatTimeAgo(alert.time)}
                        </span>
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Section — Team Performance */}
      <div className="bg-card rounded-lg border border-border shadow-sm overflow-hidden">
        <div className="px-6 pt-5 pb-4 border-b border-border">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-foreground">Team Performance</h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                This week&apos;s stats &middot; sorted by conversations handled
              </p>
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
                <th className="px-6 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-widest">
                  Name
                </th>
                <th className="px-6 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-widest text-right">
                  Conversations
                </th>
                <th className="px-6 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-widest text-right">
                  Avg Response
                </th>
                <th className="px-6 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-widest text-right">
                  Resolution Rate
                </th>
                <th className="px-6 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-widest text-right">
                  Flagged
                </th>
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
                    className={cn(
                      "hover:bg-muted/30 transition-colors",
                      isTopPerformer && "bg-amber-500/5"
                    )}
                  >
                    <td className="px-6 py-3.5">
                      <div className="flex items-center gap-3">
                        {member?.user.avatar ? (
                          <img
                            src={member.user.avatar}
                            alt={perf.name}
                            className="w-8 h-8 rounded-full object-cover shrink-0"
                          />
                        ) : (
                          <div
                            className={cn(
                              "w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0",
                              avatarColor(perf.userId)
                            )}
                          >
                            {getInitial(perf.name)}
                          </div>
                        )}
                        <div>
                          <span className="text-sm font-semibold text-foreground flex items-center gap-2">
                            {perf.name}
                            {isTopPerformer && (
                              <Trophy className="w-3.5 h-3.5 text-amber-500" />
                            )}
                          </span>
                          {member && (
                            <Badge
                              variant="outline"
                              className={cn("text-[10px] px-1.5 py-0 mt-0.5", ROLE_BADGE_STYLES[member.role])}
                            >
                              {member.role}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-3.5 text-right">
                      <span className="text-sm font-semibold text-foreground">
                        {perf.conversationsHandled}
                      </span>
                    </td>
                    <td className="px-6 py-3.5 text-right">
                      <span className="text-sm text-muted-foreground">
                        {perf.avgResponseTime}
                      </span>
                    </td>
                    <td className="px-6 py-3.5 text-right">
                      <span
                        className={cn(
                          "text-sm font-semibold",
                          perf.resolutionRate >= 90
                            ? "text-emerald-600"
                            : perf.resolutionRate >= 75
                              ? "text-foreground"
                              : "text-amber-600"
                        )}
                      >
                        {perf.resolutionRate}%
                      </span>
                    </td>
                    <td className="px-6 py-3.5 text-right">
                      <span
                        className={cn(
                          "text-sm",
                          perf.flaggedCount > 3 ? "text-rose-600 font-semibold" : "text-muted-foreground"
                        )}
                      >
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
                    <p className="text-sm font-medium text-muted-foreground">
                      No performance data available
                    </p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ─── Team Settings Slide-Over Panel ─── */}
      <AnimatePresence>
        {isSettingsOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/40 z-40"
              onClick={() => setIsSettingsOpen(false)}
            />
            {/* Panel */}
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 28, stiffness: 300 }}
              className="fixed top-0 right-0 h-full w-full max-w-md bg-background border-l border-border shadow-2xl z-50 flex flex-col"
            >
              {/* Header */}
              <div className="flex items-center justify-between px-6 py-5 border-b border-border bg-card">
                <div>
                  <h2 className="text-lg font-bold text-foreground">Team Settings</h2>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Configure your {settings.language} team
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 w-8 p-0"
                  onClick={() => setIsSettingsOpen(false)}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>

              {/* Scrollable content */}
              <div className="flex-1 overflow-y-auto">
                {/* General */}
                <div className="px-6 py-5 border-b border-border">
                  <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-4 flex items-center gap-2">
                    <Shield className="w-3.5 h-3.5" />
                    General
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
                <div className="px-6 py-5 border-b border-border">
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
                <div className="px-6 py-5 border-b border-border">
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
                <div className="px-6 py-5 border-b border-border">
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

              {/* Footer */}
              <div className="px-6 py-4 border-t border-border bg-card flex items-center justify-between">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsSettingsOpen(false)}
                >
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
    </div>
  );
};
