import React, { useState, useMemo } from "react";
import {
  ClipboardCheck, Clock, MessageSquare, Send,
  CheckCircle2, ChevronLeft, ChevronRight, Eye,
  AlertTriangle, RotateCcw, ArrowUpRight, FileText,
  Users, Timer, MessageCircle, Inbox, TrendingUp,
  Award, BarChart3,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { toast } from "sonner";
import {
  cn, type Contact, type Message, type User, type MessagePort,
  formatTimeAgo, CHANNEL_TYPES,
} from "./types";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Textarea } from "./ui/textarea";
import { DateRangeFilter } from "./date-range-filter";
import type { DateRange } from "react-day-picker";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ReviewerDashboardProps {
  contacts: Contact[];
  messages: Message[];
  users: User[];
  currentUser: User;
  onOpenConversation: (contactId: string) => void;
}

type ReviewPriority = "High" | "Medium" | "Low";
type ReviewReason = "Trigger word" | "Manual flag" | "Timeout" | "Random sample";
type ReviewStatus = "pending" | "in_review" | "completed";
type ReviewResult = "Approved" | "Returned" | "Escalated";

interface ReviewItem {
  id: string;
  contactId: string;
  contactName: string;
  volunteerId: string;
  volunteerName: string;
  priority: ReviewPriority;
  reason: ReviewReason;
  status: ReviewStatus;
  channel: MessagePort;
  flaggedAt: string;
  result?: ReviewResult;
  completedAt?: string;
}

interface VolunteerCoachingSummary {
  userId: string;
  name: string;
  conversationsReviewed: number;
  approved: number;
  returned: number;
  escalated: number;
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

const PRIORITIES: ReviewPriority[] = ["High", "Medium", "Low"];
const REASONS: ReviewReason[] = ["Trigger word", "Manual flag", "Timeout", "Random sample"];
const RESULTS: ReviewResult[] = ["Approved", "Returned", "Escalated"];

const PRIORITY_STYLES: Record<ReviewPriority, string> = {
  High: "bg-rose-500/10 text-rose-600 border-rose-500/20",
  Medium: "bg-amber-500/10 text-amber-600 border-amber-500/20",
  Low: "bg-blue-500/10 text-blue-600 border-blue-500/20",
};

const REASON_STYLES: Record<ReviewReason, string> = {
  "Trigger word": "bg-rose-500/10 text-rose-600 border-rose-500/20",
  "Manual flag": "bg-amber-500/10 text-amber-600 border-amber-500/20",
  "Timeout": "bg-violet-500/10 text-violet-600 border-violet-500/20",
  "Random sample": "bg-blue-500/10 text-blue-600 border-blue-500/20",
};

const RESULT_STYLES: Record<ReviewResult, string> = {
  Approved: "text-emerald-600",
  Returned: "text-amber-600",
  Escalated: "text-rose-600",
};

const VOLUNTEER_NAMES = [
  { id: "vol-kidus", name: "Kidus Alemayehu" },
  { id: "vol-tigist", name: "Tigist Worku" },
  { id: "vol-dawit", name: "Dawit Mengistu" },
  { id: "vol-hiwot", name: "Hiwot Bekele" },
  { id: "vol-alex", name: "Alex Rivera" },
  { id: "vol-mike", name: "Mike Ross" },
  { id: "vol-priya", name: "Priya Sharma" },
];

const REVIEW_TABS = ["Pending", "In Review", "Completed"] as const;
type ReviewTab = (typeof REVIEW_TABS)[number];

const TAB_TO_STATUS: Record<ReviewTab, ReviewStatus> = {
  "Pending": "pending",
  "In Review": "in_review",
  "Completed": "completed",
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export const ReviewerDashboard = ({
  contacts,
  messages,
  users,
  currentUser,
  onOpenConversation,
}: ReviewerDashboardProps) => {
  const [pageTab, setPageTab] = useState<"overview" | "volunteer_load">("overview");
  const [activeTab, setActiveTab] = useState<ReviewTab>("Pending");
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);
  const [selectedReviewId, setSelectedReviewId] = useState<string | null>(null);
  const [coachingNotes, setCoachingNotes] = useState("");
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 8;

  // Generate review queue items from contacts
  const reviewItems = useMemo<ReviewItem[]>(() => {
    const items: ReviewItem[] = [];

    contacts.forEach((contact, idx) => {
      const rand = seededRandom(contact.id + "-review-queue");
      // Select ~50% of contacts for review items to get 12-15
      if (rand() < 0.5 && items.length < 15) {
        const priorityIdx = rand() < 0.25 ? 0 : rand() < 0.55 ? 1 : 2;
        const reasonIdx = Math.floor(rand() * REASONS.length);
        const volIdx = Math.floor(rand() * VOLUNTEER_NAMES.length);
        const statusRoll = rand();
        let status: ReviewStatus = "pending";
        let result: ReviewResult | undefined;
        let completedAt: string | undefined;

        if (statusRoll < 0.55) {
          status = "pending";
        } else if (statusRoll < 0.7) {
          status = "in_review";
        } else {
          status = "completed";
          const resultIdx = Math.floor(rand() * RESULTS.length);
          result = RESULTS[resultIdx];
          completedAt = new Date(Date.now() - Math.floor(rand() * 7200000)).toISOString();
        }

        const contactMsgs = messages.filter(m => m.contactId === contact.id);
        const latestMsg = contactMsgs.length > 0
          ? [...contactMsgs].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0]
          : null;

        items.push({
          id: `review-${contact.id}`,
          contactId: contact.id,
          contactName: contact.name,
          volunteerId: VOLUNTEER_NAMES[volIdx].id,
          volunteerName: VOLUNTEER_NAMES[volIdx].name,
          priority: PRIORITIES[priorityIdx],
          reason: REASONS[reasonIdx],
          status,
          channel: latestMsg?.port || "whatsapp",
          flaggedAt: new Date(Date.now() - Math.floor(rand() * 14400000)).toISOString(),
          result,
          completedAt,
        });
      }
    });

    // Sort: High priority first, then oldest first
    const priorityOrder: Record<ReviewPriority, number> = { High: 0, Medium: 1, Low: 2 };
    return items.sort((a, b) => {
      if (a.status !== b.status) {
        const statusOrder: Record<ReviewStatus, number> = { pending: 0, in_review: 1, completed: 2 };
        return statusOrder[a.status] - statusOrder[b.status];
      }
      if (a.priority !== b.priority) return priorityOrder[a.priority] - priorityOrder[b.priority];
      return new Date(a.flaggedAt).getTime() - new Date(b.flaggedAt).getTime();
    });
  }, [contacts, messages]);

  // Filtered items by tab
  const filteredItems = useMemo(() => {
    const targetStatus = TAB_TO_STATUS[activeTab];
    return reviewItems.filter(item => item.status === targetStatus);
  }, [reviewItems, activeTab]);

  // Pagination
  const totalPages = Math.max(1, Math.ceil(filteredItems.length / PAGE_SIZE));
  const pageItems = filteredItems.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  // Reset page when tab changes
  React.useEffect(() => { setPage(1); }, [activeTab]);

  // Tab counts
  const tabCounts: Record<ReviewTab, number> = {
    "Pending": reviewItems.filter(i => i.status === "pending").length,
    "In Review": reviewItems.filter(i => i.status === "in_review").length,
    "Completed": reviewItems.filter(i => i.status === "completed").length,
  };

  // Selected review
  const selectedReview = selectedReviewId
    ? reviewItems.find(r => r.id === selectedReviewId) || null
    : null;

  // Messages for selected review (chat preview)
  const selectedMessages = useMemo(() => {
    if (!selectedReview) return [];
    const contactMsgs = messages.filter(m => m.contactId === selectedReview.contactId);
    return [...contactMsgs]
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
      .slice(-6);
  }, [selectedReview, messages]);

  // KPI computations
  const pendingCount = tabCounts["Pending"];
  const reviewedToday = tabCounts["Completed"];
  const coachingNotesSent = useMemo(() => {
    const rand = seededRandom(currentUser.id + "-coaching-sent");
    return Math.floor(rand() * 8) + 2;
  }, [currentUser.id]);
  const avgReviewTime = useMemo(() => {
    const rand = seededRandom(currentUser.id + "-avg-review");
    const mins = Math.floor(rand() * 6) + 2;
    const secs = Math.floor(rand() * 60);
    return `${mins}m ${secs.toString().padStart(2, "0")}s`;
  }, [currentUser.id]);

  // Recent review history (last 3 completed)
  const recentReviews = useMemo(() => {
    return reviewItems
      .filter(r => r.status === "completed" && r.result)
      .sort((a, b) => new Date(b.completedAt!).getTime() - new Date(a.completedAt!).getTime())
      .slice(0, 3);
  }, [reviewItems]);

  // Volunteer coaching summary
  const coachingSummary = useMemo<VolunteerCoachingSummary[]>(() => {
    return VOLUNTEER_NAMES.map(vol => {
      const rand = seededRandom(vol.id + "-coaching-stats");
      const total = Math.floor(rand() * 18) + 4;
      const approved = Math.floor(total * (0.5 + rand() * 0.4));
      const returned = Math.floor((total - approved) * (0.3 + rand() * 0.4));
      const escalated = total - approved - returned;
      return {
        userId: vol.id,
        name: vol.name,
        conversationsReviewed: total,
        approved,
        returned,
        escalated,
      };
    }).sort((a, b) => b.conversationsReviewed - a.conversationsReviewed);
  }, []);

  // US15: Per-volunteer current load (open threads, un-responded, capacity)
  const volunteerLoad = useMemo(() => {
    return VOLUNTEER_NAMES.map(vol => {
      const rand = seededRandom(vol.id + "-load-stats");
      const maxCapacity = 5;
      const openThreads = Math.floor(rand() * maxCapacity) + 1;
      const unresponded = Math.floor(rand() * Math.min(openThreads, 3));
      const online = rand() > 0.3;
      const avgResponseMin = Math.floor(rand() * 12) + 1;
      return {
        userId: vol.id,
        name: vol.name,
        openThreads,
        unresponded,
        maxCapacity,
        online,
        avgResponseMin,
      };
    });
  }, []);

  // US17: Aggregate coaching stats
  const aggregateStats = useMemo(() => {
    const totalReviewed = coachingSummary.reduce((s, v) => s + v.conversationsReviewed, 0);
    const totalApproved = coachingSummary.reduce((s, v) => s + v.approved, 0);
    const totalReturned = coachingSummary.reduce((s, v) => s + v.returned, 0);
    const totalEscalated = coachingSummary.reduce((s, v) => s + v.escalated, 0);
    const overallApprovalRate = totalReviewed > 0 ? Math.round((totalApproved / totalReviewed) * 100) : 0;
    const topPerformer = coachingSummary.length > 0
      ? coachingSummary.reduce((best, v) => {
          const rate = v.conversationsReviewed > 0 ? v.approved / v.conversationsReviewed : 0;
          const bestRate = best.conversationsReviewed > 0 ? best.approved / best.conversationsReviewed : 0;
          return rate > bestRate ? v : best;
        })
      : null;
    return { totalReviewed, totalApproved, totalReturned, totalEscalated, overallApprovalRate, topPerformer };
  }, [coachingSummary]);

  // Handlers
  const handleSelectReview = (item: ReviewItem) => {
    setSelectedReviewId(item.id);
    setCoachingNotes("");
  };

  const handleApprove = () => {
    if (!selectedReview) return;
    toast.success(`Conversation with ${selectedReview.contactName} approved.`, {
      description: "Marked as reviewed and acceptable.",
    });
    setSelectedReviewId(null);
    setCoachingNotes("");
  };

  const handleReturn = () => {
    if (!selectedReview) return;
    if (!coachingNotes.trim()) {
      toast.error("Please add coaching notes before returning for revision.");
      return;
    }
    toast.success(`Returned to ${selectedReview.volunteerName} for revision.`, {
      description: "Coaching notes sent along with the conversation.",
    });
    setSelectedReviewId(null);
    setCoachingNotes("");
  };

  const handleEscalate = () => {
    if (!selectedReview) return;
    toast.success(`Escalated to Coordinator.`, {
      description: `Conversation with ${selectedReview.contactName} has been escalated.`,
    });
    setSelectedReviewId(null);
    setCoachingNotes("");
  };

  const getSenderName = (msg: Message) => {
    if (msg.senderType === "contact") {
      return contacts.find(c => c.id === msg.contactId)?.name || "Contact";
    }
    return users.find(u => u.id === msg.senderId)?.name || "Volunteer";
  };

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
                Reviewer &middot; Quality Assurance
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
                {pendingCount} pending review
              </span>
              <span className="mx-2 text-slate-500">&middot;</span>
              <span className="font-semibold text-emerald-300">
                {reviewedToday} reviewed today
              </span>
              <span className="mx-2 text-slate-500">&middot;</span>
              <span className="font-semibold text-pink-300">
                {coachingNotesSent} coaching notes sent
              </span>
            </p>
          </div>
          <div className="flex items-center gap-3">
            <DateRangeFilter dateRange={dateRange} onDateRangeChange={setDateRange} />
          </div>
        </div>
      </header>

      {/* Page-level tabs */}
      <div className="flex gap-1.5 p-1 bg-muted rounded-md border border-border w-fit">
        {([
          { id: "overview" as const, label: "Overview" },
          { id: "volunteer_load" as const, label: "Volunteer Load" },
        ]).map(tab => (
          <button
            key={tab.id}
            onClick={() => setPageTab(tab.id)}
            className={cn(
              "px-4 py-2 rounded-sm text-xs font-semibold transition-all",
              pageTab === tab.id
                ? "bg-background text-foreground shadow-sm border border-border"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* ============ OVERVIEW TAB ============ */}
      {pageTab === "overview" && (<>

      {/* KPI Stats Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          {
            label: "Pending Review",
            value: pendingCount,
            icon: ClipboardCheck,
            color: "text-rose-600",
            bg: "bg-rose-500/10",
          },
          {
            label: "Reviewed Today",
            value: reviewedToday,
            icon: CheckCircle2,
            color: "text-emerald-600",
            bg: "bg-emerald-500/10",
          },
          {
            label: "Coaching Notes Sent",
            value: coachingNotesSent,
            icon: FileText,
            color: "text-violet-600",
            bg: "bg-violet-500/10",
          },
          {
            label: "Avg Review Time",
            value: avgReviewTime,
            icon: Timer,
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

      {/* Two-panel layout (60/40) */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Left Panel (60%) — Review Queue */}
        <div className="lg:col-span-3">
          <div className="bg-card rounded-lg border border-border shadow-sm overflow-hidden">
            {/* Header + Tabs */}
            <div className="px-6 pt-5 pb-4 border-b border-border">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-sm font-bold text-foreground">Review Queue</h2>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {reviewItems.length} total items &middot; sorted by priority
                  </p>
                </div>
              </div>

              {/* Tab Pills */}
              <div className="flex gap-1.5 p-1 bg-muted rounded-md border border-border">
                {REVIEW_TABS.map(tab => (
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
                      {tabCounts[tab]}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Review List */}
            <div className="divide-y divide-border">
              <AnimatePresence mode="wait">
                {filteredItems.length === 0 ? (
                  <motion.div
                    key="empty"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="py-16 text-center"
                  >
                    <CheckCircle2 className="w-10 h-10 text-emerald-500/40 mx-auto mb-3" />
                    <p className="text-sm font-medium text-muted-foreground">
                      {activeTab === "Pending"
                        ? "No pending reviews"
                        : activeTab === "In Review"
                          ? "No conversations currently in review"
                          : "No completed reviews yet"}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {activeTab === "Pending"
                        ? "All conversations have been reviewed. Great work!"
                        : "Items will appear here as you work through the queue."}
                    </p>
                  </motion.div>
                ) : (
                  <motion.div
                    key={`${activeTab}-${page}`}
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                    transition={{ duration: 0.15 }}
                  >
                    {pageItems.map((item, i) => {
                      const channelInfo = getChannelInfo(item.channel);
                      const isSelected = selectedReviewId === item.id;

                      return (
                        <div
                          key={item.id}
                          className={cn(
                            "px-5 py-3.5 hover:bg-muted/30 transition-colors border-b border-border last:border-0 cursor-pointer",
                            isSelected && "bg-primary/5 border-l-2 border-l-primary"
                          )}
                          onClick={() => handleSelectReview(item)}
                        >
                          <div className="flex items-center gap-3">
                            {/* Avatar */}
                            <div
                              className={cn(
                                "w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0",
                                avatarColor(item.contactId)
                              )}
                            >
                              {getInitial(item.contactName)}
                            </div>

                            {/* Contact info */}
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="text-sm font-semibold text-foreground truncate">
                                  {item.contactName}
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
                                  className={cn("text-[10px] px-1.5 py-0", PRIORITY_STYLES[item.priority])}
                                >
                                  {item.priority}
                                </Badge>
                                <Badge
                                  variant="outline"
                                  className={cn("text-[10px] px-1.5 py-0", REASON_STYLES[item.reason])}
                                >
                                  {item.reason}
                                </Badge>
                              </div>
                              <p className="text-xs text-muted-foreground mt-0.5">
                                Handled by {item.volunteerName}
                                <span className="mx-1.5 text-border">&middot;</span>
                                {formatTimeAgo(item.flaggedAt)}
                              </p>
                            </div>

                            {/* Action */}
                            <div className="shrink-0">
                              {item.status === "completed" && item.result ? (
                                <Badge
                                  variant="outline"
                                  className={cn("text-[10px] px-2 py-0.5", RESULT_STYLES[item.result])}
                                >
                                  {item.result}
                                </Badge>
                              ) : (
                                <Button
                                  size="sm"
                                  className="text-xs h-7 px-2.5"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleSelectReview(item);
                                  }}
                                >
                                  <Eye className="w-3 h-3 mr-1" />
                                  Open Review
                                </Button>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Pagination footer */}
            {filteredItems.length > PAGE_SIZE && (
              <div className="px-5 py-3 border-t border-border flex items-center justify-between">
                <p className="text-xs text-muted-foreground">
                  {(page - 1) * PAGE_SIZE + 1}&ndash;{Math.min(page * PAGE_SIZE, filteredItems.length)} of {filteredItems.length}
                </p>
                <div className="flex items-center gap-1">
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 w-7 p-0"
                    disabled={page <= 1}
                    onClick={() => setPage(p => p - 1)}
                  >
                    <ChevronLeft className="w-3.5 h-3.5" />
                  </Button>
                  <span className="text-xs font-semibold text-foreground px-2">
                    {page} / {totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 w-7 p-0"
                    disabled={page >= totalPages}
                    onClick={() => setPage(p => p + 1)}
                  >
                    <ChevronRight className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Panel (40%) — Review Detail */}
        <div className="lg:col-span-2">
          <div className="bg-card rounded-lg border border-border shadow-sm overflow-hidden sticky top-6">
            {!selectedReview ? (
              /* Empty state */
              <div className="py-20 text-center px-6">
                <ClipboardCheck className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
                <p className="text-sm font-medium text-muted-foreground">
                  Select a conversation from the queue to begin review
                </p>
                <p className="text-xs text-muted-foreground mt-1.5">
                  Click any item in the review queue to see details and provide feedback.
                </p>
              </div>
            ) : (
              <>
                {/* Review Detail Header */}
                <div className="px-6 pt-5 pb-4 border-b border-border">
                  <div className="flex items-center gap-3 mb-2">
                    <div
                      className={cn(
                        "w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0",
                        avatarColor(selectedReview.contactId)
                      )}
                    >
                      {getInitial(selectedReview.contactName)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-semibold text-foreground truncate">
                          {selectedReview.contactName}
                        </span>
                        {(() => {
                          const ch = getChannelInfo(selectedReview.channel);
                          return ch.logoUrl ? (
                            <img src={ch.logoUrl} alt={ch.label} className="w-3.5 h-3.5 shrink-0" />
                          ) : (
                            <ch.icon className={cn("w-3.5 h-3.5 shrink-0", ch.color)} />
                          );
                        })()}
                        <Badge
                          variant="outline"
                          className={cn("text-[10px] px-1.5 py-0", PRIORITY_STYLES[selectedReview.priority])}
                        >
                          {selectedReview.priority}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Handled by {selectedReview.volunteerName}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Chat Preview */}
                <div className="px-6 pt-4 pb-3 border-b border-border">
                  <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-3 flex items-center gap-2">
                    <MessageSquare className="w-3.5 h-3.5" />
                    Chat Preview
                  </h3>

                  {selectedMessages.length === 0 ? (
                    <p className="text-xs text-muted-foreground py-4 text-center">
                      No messages found for this conversation.
                    </p>
                  ) : (
                    <div className="space-y-3 max-h-[320px] overflow-y-auto pr-1">
                      {selectedMessages.map((msg, i) => {
                        const isContact = msg.senderType === "contact";
                        const senderName = getSenderName(msg);

                        return (
                          <motion.div
                            key={msg.id}
                            initial={{ opacity: 0, y: 4 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.15, delay: i * 0.03 }}
                            className={cn(
                              "flex flex-col max-w-[85%]",
                              isContact ? "items-start" : "items-end ml-auto"
                            )}
                          >
                            <span className="text-[10px] font-semibold text-muted-foreground mb-0.5 px-1">
                              {senderName}
                            </span>
                            <div
                              className={cn(
                                "rounded-lg px-3 py-2 text-xs leading-relaxed",
                                isContact
                                  ? "bg-muted text-foreground rounded-bl-none"
                                  : "bg-primary text-primary-foreground rounded-br-none"
                              )}
                            >
                              {msg.content}
                            </div>
                            <span className="text-[10px] text-muted-foreground mt-0.5 px-1">
                              {formatTimeAgo(msg.createdAt)}
                            </span>
                          </motion.div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Coaching Notes */}
                <div className="px-6 pt-4 pb-3 border-b border-border">
                  <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-2 flex items-center gap-2">
                    <FileText className="w-3.5 h-3.5" />
                    Coaching Notes
                  </h3>
                  <Textarea
                    placeholder="Type feedback or coaching notes for the volunteer..."
                    value={coachingNotes}
                    onChange={e => setCoachingNotes(e.target.value)}
                    className="text-xs min-h-[80px] resize-none"
                  />
                </div>

                {/* Action Buttons */}
                <div className="px-6 py-4 border-b border-border">
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      className="text-xs h-8 px-3 bg-emerald-600 hover:bg-emerald-700 text-white flex-1"
                      onClick={handleApprove}
                    >
                      <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                      Approve
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-xs h-8 px-3 border-amber-500/30 text-amber-600 hover:bg-amber-500/10 flex-1"
                      onClick={handleReturn}
                    >
                      <RotateCcw className="w-3.5 h-3.5 mr-1" />
                      Return for Revision
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-xs h-8 px-3 border-rose-500/30 text-rose-600 hover:bg-rose-500/10 flex-1"
                      onClick={handleEscalate}
                    >
                      <ArrowUpRight className="w-3.5 h-3.5 mr-1" />
                      Escalate
                    </Button>
                  </div>
                </div>

                {/* Review History */}
                <div className="px-6 pt-4 pb-4">
                  <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-3 flex items-center gap-2">
                    <Clock className="w-3.5 h-3.5" />
                    Recent Reviews
                  </h3>
                  {recentReviews.length === 0 ? (
                    <p className="text-xs text-muted-foreground py-2 text-center">
                      No recent reviews
                    </p>
                  ) : (
                    <div className="space-y-2.5">
                      {recentReviews.map((rev, i) => (
                        <motion.div
                          key={rev.id}
                          initial={{ opacity: 0, y: 4 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.15, delay: i * 0.03 }}
                          className="flex items-center justify-between gap-2"
                        >
                          <div className="min-w-0 flex-1">
                            <p className="text-xs font-medium text-foreground truncate">
                              {rev.contactName}
                            </p>
                            <p className={cn("text-[11px] font-semibold", RESULT_STYLES[rev.result!])}>
                              {rev.result}
                            </p>
                          </div>
                          <span className="text-[11px] text-muted-foreground shrink-0">
                            {formatTimeAgo(rev.completedAt!)}
                          </span>
                        </motion.div>
                      ))}
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* US17: Aggregate Coaching Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        {[
          {
            label: "Total Reviewed",
            value: aggregateStats.totalReviewed,
            icon: BarChart3,
            color: "text-blue-600",
            bg: "bg-blue-500/10",
          },
          {
            label: "Approved",
            value: aggregateStats.totalApproved,
            icon: CheckCircle2,
            color: "text-emerald-600",
            bg: "bg-emerald-500/10",
          },
          {
            label: "Returned",
            value: aggregateStats.totalReturned,
            icon: RotateCcw,
            color: "text-amber-600",
            bg: "bg-amber-500/10",
          },
          {
            label: "Escalated",
            value: aggregateStats.totalEscalated,
            icon: ArrowUpRight,
            color: "text-rose-600",
            bg: "bg-rose-500/10",
          },
          {
            label: "Approval Rate",
            value: `${aggregateStats.overallApprovalRate}%`,
            icon: TrendingUp,
            color: aggregateStats.overallApprovalRate >= 80 ? "text-emerald-600" : "text-amber-600",
            bg: aggregateStats.overallApprovalRate >= 80 ? "bg-emerald-500/10" : "bg-amber-500/10",
            extra: aggregateStats.topPerformer ? `Top: ${aggregateStats.topPerformer.name.split(" ")[0]}` : undefined,
          },
        ].map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: i * 0.05 }}
            className="bg-card p-4 rounded-lg border border-border shadow-sm"
          >
            <div className="flex items-center gap-2 mb-2">
              <div className={cn("p-1.5 rounded-md", stat.bg)}>
                <stat.icon className={cn("w-3.5 h-3.5", stat.color)} />
              </div>
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{stat.label}</span>
            </div>
            <p className="text-xl font-bold tracking-tight text-foreground">
              {typeof stat.value === "number" ? stat.value.toLocaleString() : stat.value}
            </p>
            {"extra" in stat && stat.extra && (
              <p className="text-[10px] text-muted-foreground mt-0.5 flex items-center gap-1">
                <Award className="w-3 h-3 text-amber-500" />
                {stat.extra}
              </p>
            )}
          </motion.div>
        ))}
      </div>

      {/* Bottom Section — Volunteer Coaching Summary */}
      <div className="bg-card rounded-lg border border-border shadow-sm overflow-hidden">
        <div className="px-6 pt-5 pb-4 border-b border-border">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-foreground">Volunteer Coaching Summary</h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                Review stats per volunteer &middot; sorted by total reviewed
              </p>
            </div>
            <Badge variant="outline" className="text-[10px] px-2 py-0.5">
              <Users className="w-2.5 h-2.5 mr-1" />
              {VOLUNTEER_NAMES.length} volunteers
            </Badge>
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
                  Reviewed
                </th>
                <th className="px-6 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-widest text-right">
                  Approved
                </th>
                <th className="px-6 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-widest text-right">
                  Returned
                </th>
                <th className="px-6 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-widest text-right">
                  Escalated
                </th>
                <th className="px-6 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-widest text-right">
                  Approval Rate
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {coachingSummary.map((vol, i) => {
                const approvalRate = vol.conversationsReviewed > 0
                  ? Math.round((vol.approved / vol.conversationsReviewed) * 100)
                  : 0;

                return (
                  <motion.tr
                    key={vol.userId}
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2, delay: i * 0.04 }}
                    className="hover:bg-muted/30 transition-colors"
                  >
                    <td className="px-6 py-3.5">
                      <div className="flex items-center gap-3">
                        <div
                          className={cn(
                            "w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0",
                            avatarColor(vol.userId)
                          )}
                        >
                          {getInitial(vol.name)}
                        </div>
                        <span className="text-sm font-semibold text-foreground">
                          {vol.name}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-3.5 text-right">
                      <span className="text-sm font-semibold text-foreground">
                        {vol.conversationsReviewed}
                      </span>
                    </td>
                    <td className="px-6 py-3.5 text-right">
                      <span className="text-sm font-semibold text-emerald-600">
                        {vol.approved}
                      </span>
                    </td>
                    <td className="px-6 py-3.5 text-right">
                      <span className="text-sm font-semibold text-amber-600">
                        {vol.returned}
                      </span>
                    </td>
                    <td className="px-6 py-3.5 text-right">
                      <span className="text-sm font-semibold text-rose-600">
                        {vol.escalated}
                      </span>
                    </td>
                    <td className="px-6 py-3.5 text-right">
                      <span
                        className={cn(
                          "text-sm font-semibold",
                          approvalRate >= 85
                            ? "text-emerald-600"
                            : approvalRate >= 65
                              ? "text-foreground"
                              : "text-amber-600"
                        )}
                      >
                        {approvalRate}%
                      </span>
                    </td>
                  </motion.tr>
                );
              })}
              {coachingSummary.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center">
                    <Users className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
                    <p className="text-sm font-medium text-muted-foreground">
                      No coaching data available
                    </p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      </>)}

      {/* ============ VOLUNTEER LOAD TAB ============ */}
      {pageTab === "volunteer_load" && (
        <div className="bg-card rounded-lg border border-border shadow-sm overflow-hidden">
          <div className="px-6 pt-5 pb-4 border-b border-border">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-sm font-bold text-foreground">Volunteer Load</h2>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Open threads, un-responded messages &amp; capacity per volunteer
                </p>
              </div>
              <Badge variant="outline" className="text-[10px] px-2 py-0.5">
                <Users className="w-2.5 h-2.5 mr-1" />
                {volunteerLoad.filter(v => v.online).length}/{volunteerLoad.length} online
              </Badge>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-border">
                  <th className="px-6 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-widest">Volunteer</th>
                  <th className="px-6 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-widest text-center">Status</th>
                  <th className="px-6 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-widest text-right">Open Threads</th>
                  <th className="px-6 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-widest text-right">Un-responded</th>
                  <th className="px-6 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-widest text-right">Avg Response</th>
                  <th className="px-6 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-widest text-center">Capacity</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {volunteerLoad.map((vol, i) => {
                  const capacityPct = Math.round((vol.openThreads / vol.maxCapacity) * 100);
                  const capacityColor = capacityPct >= 80 ? "bg-rose-500" : capacityPct >= 60 ? "bg-amber-500" : "bg-emerald-500";
                  const capacityTextColor = capacityPct >= 80 ? "text-rose-600" : capacityPct >= 60 ? "text-amber-600" : "text-emerald-600";

                  return (
                    <motion.tr
                      key={vol.userId}
                      initial={{ opacity: 0, y: 4 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.2, delay: i * 0.04 }}
                      className="hover:bg-muted/30 transition-colors"
                    >
                      {/* Name */}
                      <td className="px-6 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="relative">
                            <div className={cn("w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0", avatarColor(vol.userId))}>
                              {getInitial(vol.name)}
                            </div>
                            <span className={cn("absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-card", vol.online ? "bg-emerald-500" : "bg-gray-400")} />
                          </div>
                          <span className="text-sm font-semibold text-foreground">{vol.name}</span>
                        </div>
                      </td>
                      {/* Status */}
                      <td className="px-6 py-3.5 text-center">
                        <Badge variant="outline" className={cn("text-[10px] px-2 py-0.5", vol.online ? "text-emerald-600 border-emerald-500/30 bg-emerald-500/10" : "text-muted-foreground border-border bg-muted/50")}>
                          {vol.online ? "Online" : "Offline"}
                        </Badge>
                      </td>
                      {/* Open Threads */}
                      <td className="px-6 py-3.5 text-right">
                        <span className="text-sm font-semibold text-foreground">{vol.openThreads}</span>
                      </td>
                      {/* Un-responded */}
                      <td className="px-6 py-3.5 text-right">
                        <span className={cn("text-sm font-semibold", vol.unresponded > 0 ? "text-rose-600" : "text-emerald-600")}>
                          {vol.unresponded}
                        </span>
                      </td>
                      {/* Avg Response */}
                      <td className="px-6 py-3.5 text-right">
                        <span className="text-sm font-semibold text-foreground">{vol.avgResponseMin}m</span>
                      </td>
                      {/* Capacity */}
                      <td className="px-6 py-3.5">
                        <div className="flex items-center gap-3 justify-center">
                          <div className="w-24 h-2 bg-muted rounded-full overflow-hidden">
                            <div className={cn("h-full rounded-full transition-all", capacityColor)} style={{ width: `${Math.min(capacityPct, 100)}%` }} />
                          </div>
                          <span className={cn("text-xs font-bold min-w-[32px] text-right", capacityTextColor)}>
                            {vol.openThreads}/{vol.maxCapacity}
                          </span>
                        </div>
                      </td>
                    </motion.tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
