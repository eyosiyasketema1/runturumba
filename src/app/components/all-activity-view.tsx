// All Activity — full-page overlay opened from the notification dropdown's
// "See all activity" link. Aggregates events from across the platform
// (messaging, broadcasts, discipleship, content, automation) into a single
// filterable timeline. Close X returns the user to wherever they were.

import React, { useMemo, useState } from "react";
import {
  X, Search, MessageSquare, Send, AlertCircle, CheckCircle2, Sparkles,
  Users, GitBranch, Bell, Zap, FileText, Heart, BookOpen, Filter as FilterIcon,
  Download, Clock
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { cn, formatTimeAgo, type Message, type Broadcast, type Contact } from "./types";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Badge } from "./ui/badge";
import {
  DropdownMenu, DropdownMenuTrigger, DropdownMenuContent,
  DropdownMenuLabel, DropdownMenuRadioGroup, DropdownMenuRadioItem
} from "./ui/dropdown-menu";

type ActivityCategory = "messaging" | "broadcast" | "discipleship" | "content" | "automation" | "system";

interface ActivityEvent {
  id: string;
  category: ActivityCategory;
  icon: any;
  iconBg: string;
  title: string;
  description: string;
  time: string;        // pretty time
  rawTime: number;     // ms timestamp for sorting
  read: boolean;
  ctaView?: string;
  ctaLabel?: string;
}

const CATEGORY_META: Record<ActivityCategory, { label: string; tone: string; chipBg: string }> = {
  messaging:    { label: "Messaging",    tone: "blue",    chipBg: "bg-blue-50 text-blue-700" },
  broadcast:    { label: "Broadcast",    tone: "emerald", chipBg: "bg-emerald-50 text-emerald-700" },
  discipleship: { label: "Discipleship", tone: "violet",  chipBg: "bg-violet-50 text-violet-700" },
  content:      { label: "Content",      tone: "pink",    chipBg: "bg-pink-50 text-pink-700" },
  automation:   { label: "Automation",   tone: "amber",   chipBg: "bg-amber-50 text-amber-700" },
  system:       { label: "System",       tone: "slate",   chipBg: "bg-slate-100 text-slate-700" },
};

interface AllActivityViewProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (view: string) => void;
  messages: Message[];
  broadcasts: Broadcast[];
  contacts: Contact[];
}

export function AllActivityView({
  isOpen, onClose, onNavigate, messages, broadcasts, contacts,
}: AllActivityViewProps) {
  const [query, setQuery]       = useState("");
  const [category, setCategory] = useState<string>("all");

  // Combine real data (messages, broadcasts) with platform-wide mocks for
  // discipleship/content/automation/system so the page reflects the whole app.
  const allEvents: ActivityEvent[] = useMemo(() => {
    const events: ActivityEvent[] = [];
    const now = Date.now();

    // Messaging — recent received messages
    messages
      .filter(m => m.senderType === "contact")
      .slice(0, 25)
      .forEach(m => {
        const c = contacts.find(x => x.id === m.contactId);
        events.push({
          id: `msg-${m.id}`,
          category: "messaging",
          icon: MessageSquare,
          iconBg: "bg-blue-500",
          title: `Message from ${c?.name || "Unknown"}`,
          description: m.content.length > 90 ? m.content.slice(0, 90) + "…" : m.content,
          time: formatTimeAgo(m.createdAt),
          rawTime: new Date(m.createdAt).getTime(),
          read: m.status === "read",
          ctaView: "messages",
          ctaLabel: "Open chat",
        });
      });

    // Failed messages — surface as alerts
    messages.filter(m => m.status === "failed").slice(0, 8).forEach(m => {
      const c = contacts.find(x => x.id === m.contactId);
      events.push({
        id: `fail-${m.id}`,
        category: "system",
        icon: AlertCircle,
        iconBg: "bg-rose-500",
        title: `Message failed`,
        description: `Could not deliver to ${c?.name || "Unknown"} on ${m.port}`,
        time: formatTimeAgo(m.createdAt),
        rawTime: new Date(m.createdAt).getTime(),
        read: false,
        ctaView: "channels",
        ctaLabel: "Check channel",
      });
    });

    // Broadcasts
    broadcasts.filter(b => b.status === "delivered").slice(0, 10).forEach(b => {
      events.push({
        id: `bc-${b.id}`,
        category: "broadcast",
        icon: Send,
        iconBg: "bg-emerald-500",
        title: `Broadcast "${b.name}" delivered`,
        description: `Reached ${b.stats.delivered.toLocaleString()} contacts on ${b.port}`,
        time: formatTimeAgo(b.createdAt),
        rawTime: new Date(b.createdAt).getTime(),
        read: true,
        ctaView: "messages",
        ctaLabel: "View broadcast",
      });
    });

    // Mocked platform-wide events so the timeline feels alive
    const minutes = (n: number) => now - n * 60_000;
    const hours   = (n: number) => now - n * 3_600_000;
    const days    = (n: number) => now - n * 86_400_000;

    const seeded: ActivityEvent[] = [
      { id: "e1",  category: "discipleship", icon: CheckCircle2, iconBg: "bg-emerald-500", title: "Validation confirmed",       description: "Sara Ahmed — Salvation Decision confirmed by Pastor James K.", time: formatTimeAgo(new Date(minutes(8)).toISOString()),  rawTime: minutes(8),  read: false, ctaView: "validations",     ctaLabel: "View validation" },
      { id: "e2",  category: "discipleship", icon: GitBranch,    iconBg: "bg-blue-500",    title: "New match proposed",         description: "David K. → Mentor James (94 score)",                          time: formatTimeAgo(new Date(minutes(15)).toISOString()), rawTime: minutes(15), read: false, ctaView: "matches",         ctaLabel: "Review match" },
      { id: "e3",  category: "discipleship", icon: Users,        iconBg: "bg-violet-500",  title: "12 new seekers completed intake", description: "This week — language: Amharic 5, English 4, Afaan Oromoo 3",  time: formatTimeAgo(new Date(hours(1)).toISOString()),    rawTime: hours(1),    read: false, ctaView: "seekers",         ctaLabel: "View seekers" },
      { id: "e4",  category: "content",      icon: Sparkles,     iconBg: "bg-pink-500",    title: "AI generated draft",         description: "'Trusting God in Uncertainty' — devotional, beginner",         time: formatTimeAgo(new Date(hours(1)).toISOString()),    rawTime: hours(1),    read: true,  ctaView: "content_library", ctaLabel: "Open draft" },
      { id: "e5",  category: "automation",   icon: Zap,          iconBg: "bg-amber-500",   title: "Automation activated",       description: "New Believer Onboarding flow is now live",                     time: formatTimeAgo(new Date(hours(3)).toISOString()),    rawTime: hours(3),    read: true,  ctaView: "automations",     ctaLabel: "View flow" },
      { id: "e6",  category: "discipleship", icon: Heart,        iconBg: "bg-rose-500",    title: "Milestone reached",          description: "Samuel B. — Baptism confirmed by Elder Susan M.",              time: formatTimeAgo(new Date(hours(5)).toISOString()),    rawTime: hours(5),    read: true,  ctaView: "milestones",      ctaLabel: "Open milestone" },
      { id: "e7",  category: "content",      icon: BookOpen,     iconBg: "bg-pink-500",    title: "Content published",          description: "'Daily Prayer Practice' is now live in Amharic",                time: formatTimeAgo(new Date(hours(8)).toISOString()),    rawTime: hours(8),    read: true,  ctaView: "content_library", ctaLabel: "View content" },
      { id: "e8",  category: "automation",   icon: Sparkles,     iconBg: "bg-violet-500",  title: "AI personalize ran",         description: "892 seekers received personalized devotionals today",          time: formatTimeAgo(new Date(hours(12)).toISOString()),   rawTime: hours(12),   read: true,  ctaView: "automations",     ctaLabel: "Open run" },
      { id: "e9",  category: "system",       icon: AlertCircle,  iconBg: "bg-amber-500",   title: "SMS channel degraded",       description: "Delivery rate dropped to 97.1% — investigating",                time: formatTimeAgo(new Date(hours(18)).toISOString()),   rawTime: hours(18),   read: true,  ctaView: "channels",        ctaLabel: "Check channel" },
      { id: "e10", category: "discipleship", icon: GitBranch,    iconBg: "bg-blue-500",    title: "Match accepted",             description: "Abigail Johnson + Pastor James K. — match active",              time: formatTimeAgo(new Date(days(1)).toISOString()),     rawTime: days(1),     read: true,  ctaView: "matches",         ctaLabel: "View match" },
      { id: "e11", category: "discipleship", icon: Bell,         iconBg: "bg-amber-500",   title: "Reminder sent",              description: "Validator reminded: Sister Ruth B. (Miriam Haile · Community)", time: formatTimeAgo(new Date(days(1)).toISOString()),     rawTime: days(1),     read: true,  ctaView: "validations",     ctaLabel: "View queue" },
      { id: "e12", category: "content",      icon: FileText,     iconBg: "bg-slate-500",   title: "Content archived",           description: "'Old welcome message' archived by content creator",             time: formatTimeAgo(new Date(days(2)).toISOString()),     rawTime: days(2),     read: true,  ctaView: "content_library", ctaLabel: "Open library" },
      { id: "e13", category: "messaging",    icon: MessageSquare,iconBg: "bg-blue-500",    title: "Conversation routed",        description: "New WhatsApp inbound auto-assigned to Mentor Daniel M.",        time: formatTimeAgo(new Date(days(2)).toISOString()),     rawTime: days(2),     read: true,  ctaView: "conversations",   ctaLabel: "Open conversation" },
    ];

    return [...events, ...seeded].sort((a, b) => b.rawTime - a.rawTime);
  }, [messages, broadcasts, contacts]);

  // Apply filters
  const filtered = useMemo(() => {
    return allEvents.filter(e => {
      const q = query.toLowerCase();
      const matchesQ = !q || e.title.toLowerCase().includes(q) || e.description.toLowerCase().includes(q);
      const matchesC = category === "all" || e.category === category;
      return matchesQ && matchesC;
    });
  }, [allEvents, query, category]);

  const unreadCount = allEvents.filter(e => !e.read).length;

  // Group by relative day for visual rhythm
  const grouped = useMemo(() => {
    const buckets: Record<string, ActivityEvent[]> = { Today: [], Yesterday: [], "This week": [], Older: [] };
    const now = Date.now();
    filtered.forEach(e => {
      const ageHours = (now - e.rawTime) / 3_600_000;
      if (ageHours < 24) buckets.Today.push(e);
      else if (ageHours < 48) buckets.Yesterday.push(e);
      else if (ageHours < 24 * 7) buckets["This week"].push(e);
      else buckets.Older.push(e);
    });
    return buckets;
  }, [filtered]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
          className="fixed inset-0 z-[60] bg-slate-900/30 backdrop-blur-sm flex items-stretch justify-end"
          onClick={onClose}
        >
          <motion.div
            initial={{ x: 40 }}
            animate={{ x: 0 }}
            exit={{ x: 40 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="w-full max-w-3xl bg-background border-l border-border shadow-2xl flex flex-col h-full"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-label="All activity"
          >
            {/* Header */}
            <div className="px-6 py-5 border-b border-border bg-gradient-to-br from-slate-50 to-blue-50/30">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <Bell className="w-3.5 h-3.5 text-primary" />
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-[0.14em]">Activity feed</p>
                  </div>
                  <h2 className="text-2xl font-bold text-foreground tracking-tight">All activity</h2>
                  <p className="text-sm text-muted-foreground mt-1">
                    Everything happening across Turumba — messaging, discipleship, content, automation.
                    {unreadCount > 0 && <> <span className="font-semibold text-foreground">{unreadCount} unread</span>.</>}
                  </p>
                </div>
                <button
                  onClick={onClose}
                  className="p-2 rounded-sm text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                  aria-label="Close all activity"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Filter toolbar */}
              <div className="flex items-center gap-2 mt-4 flex-wrap">
                <div className="flex-1 min-w-[200px] relative">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                  <Input
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search activity..."
                    className="pl-9 h-9 bg-background"
                  />
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger
                    className={cn(
                      "inline-flex items-center gap-1.5 h-9 px-3 rounded-sm border text-sm font-medium transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring",
                      category === "all"
                        ? "border-border bg-background text-foreground hover:bg-muted/50"
                        : "border-primary/30 bg-primary/5 text-primary hover:bg-primary/10"
                    )}
                  >
                    <FilterIcon className="w-3.5 h-3.5" />
                    {category === "all" ? "All categories" : CATEGORY_META[category as ActivityCategory].label}
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <DropdownMenuLabel className="text-xs text-muted-foreground">Category</DropdownMenuLabel>
                    <DropdownMenuRadioGroup value={category} onValueChange={setCategory}>
                      <DropdownMenuRadioItem value="all">All categories</DropdownMenuRadioItem>
                      {(Object.keys(CATEGORY_META) as ActivityCategory[]).map(c => (
                        <DropdownMenuRadioItem key={c} value={c}>{CATEGORY_META[c].label}</DropdownMenuRadioItem>
                      ))}
                    </DropdownMenuRadioGroup>
                  </DropdownMenuContent>
                </DropdownMenu>
                <Button variant="outline" size="sm" onClick={() => exportActivity(filtered)} title="Export visible activity as CSV">
                  <Download className="w-3.5 h-3.5" /> Export
                </Button>
                {(query || category !== "all") && (
                  <Button variant="ghost" size="sm" onClick={() => { setQuery(""); setCategory("all"); }}>
                    Clear
                  </Button>
                )}
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                Showing {filtered.length} of {allEvents.length} events
              </p>
            </div>

            {/* Body — grouped timeline */}
            <div className="flex-1 overflow-y-auto custom-scrollbar bg-background">
              {filtered.length === 0 ? (
                <div className="p-16 text-center">
                  <Bell className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
                  <p className="text-sm font-medium text-muted-foreground">No activity matches your filters.</p>
                </div>
              ) : (
                <div className="px-6 py-5 space-y-6">
                  {(["Today", "Yesterday", "This week", "Older"] as const).map(bucket => {
                    const items = grouped[bucket];
                    if (items.length === 0) return null;
                    return (
                      <div key={bucket}>
                        <div className="flex items-center gap-3 mb-3">
                          <Clock className="w-3 h-3 text-muted-foreground" />
                          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-[0.14em]">{bucket}</h3>
                          <div className="flex-1 h-px bg-border" />
                          <span className="text-xs text-muted-foreground">{items.length}</span>
                        </div>
                        <ol className="relative space-y-2">
                          <div className="absolute left-[19px] top-3 bottom-3 w-px bg-border" aria-hidden />
                          {items.map(e => (
                            <li key={e.id} className="relative">
                              <div className={cn(
                                "flex items-start gap-3 p-3 rounded-sm border border-border hover:border-primary/40 hover:bg-primary/[0.03] transition-all",
                                !e.read && "bg-blue-50/40"
                              )}>
                                <span className={cn("w-9 h-9 rounded-sm flex items-center justify-center text-white shrink-0 ring-4 ring-background relative z-10", e.iconBg)}>
                                  <e.icon className="w-4 h-4" />
                                </span>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <span className={cn("text-sm leading-tight", !e.read ? "font-bold text-foreground" : "font-semibold text-foreground")}>
                                      {e.title}
                                    </span>
                                    <Badge variant="outline" className={cn("text-[10px] font-semibold border-transparent", CATEGORY_META[e.category].chipBg)}>
                                      {CATEGORY_META[e.category].label}
                                    </Badge>
                                    {!e.read && <span className="w-1.5 h-1.5 rounded-full bg-primary" />}
                                  </div>
                                  <p className="text-sm text-muted-foreground mt-0.5 leading-relaxed">{e.description}</p>
                                  <div className="flex items-center justify-between gap-3 mt-1.5">
                                    <span className="text-xs text-muted-foreground">{e.time}</span>
                                    {e.ctaView && e.ctaLabel && (
                                      <button
                                        onClick={() => { onNavigate(e.ctaView!); onClose(); }}
                                        className="text-xs font-semibold text-primary hover:underline"
                                      >{e.ctaLabel} →</button>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </li>
                          ))}
                        </ol>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="px-6 py-3 border-t border-border bg-muted/30 flex items-center justify-between">
              <p className="text-xs text-muted-foreground">Press <kbd className="px-1.5 py-0.5 bg-background border border-border rounded text-[10px] font-mono">Esc</kbd> to close</p>
              <Button size="sm" variant="outline" onClick={onClose}>Close</Button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function exportActivity(events: ActivityEvent[]) {
  const header = ["When", "Category", "Title", "Description", "Read"];
  const rows = events.map(e => [e.time, CATEGORY_META[e.category].label, e.title, e.description, e.read ? "yes" : "no"]);
  const csv = [header, ...rows]
    .map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(","))
    .join("\n");
  try {
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `activity-${new Date().toISOString().split("T")[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  } catch {
    // best-effort export
  }
}
