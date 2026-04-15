import React, { useMemo, useState } from "react";
import {
  Users, Search, Filter, Plus, ChevronDown, MoreHorizontal, Send, Edit2,
  Sparkles, ShieldCheck, BarChart3, Activity, FileText, CheckCircle2, XCircle,
  Clock, AlertCircle, Heart, BookOpen, HandHeart, Star, Globe, MapPin,
  Calendar, Download, Share2, Bell, ArrowRight, Flame, Droplets, UsersRound,
  TrendingUp, ChevronUp, MessageCircle, Languages, Filter as FilterIcon,
  GitBranch
} from "lucide-react";
import { cn } from "./types";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Input } from "./ui/input";
import { Textarea } from "./ui/textarea";
import { Label } from "./ui/label";
import {
  DropdownMenu, DropdownMenuTrigger, DropdownMenuContent,
  DropdownMenuItem, DropdownMenuSeparator, DropdownMenuLabel,
  DropdownMenuRadioGroup, DropdownMenuRadioItem,
} from "./ui/dropdown-menu";
import { Modal } from "./shared-ui";
import { toast } from "sonner";
import { ArrowLeft, Eye, Trash2, MessageSquare as MessageSquareIcon, Archive, RefreshCw } from "lucide-react";

// ============================================================================
// Shared primitives
// ============================================================================

export function PageHeader({
  title, subtitle, actions
}: { title: string; subtitle?: string; actions?: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 mb-6 flex-wrap">
      <div>
        <h1 className="text-2xl font-bold text-foreground tracking-tight">{title}</h1>
        {subtitle && <p className="text-sm text-muted-foreground mt-1">{subtitle}</p>}
      </div>
      {actions && <div className="flex items-center gap-2 flex-wrap">{actions}</div>}
    </div>
  );
}

export function StatCard({
  label, value, change, icon: Icon, tone = "default", subtitle
}: {
  label: string; value: string | number; change?: string;
  icon?: any; tone?: "default" | "blue" | "green" | "amber" | "purple" | "pink"; subtitle?: string;
}) {
  const toneClasses = {
    default: "bg-muted text-muted-foreground",
    blue:    "bg-blue-50 text-blue-600",
    green:   "bg-emerald-50 text-emerald-600",
    amber:   "bg-amber-50 text-amber-600",
    purple:  "bg-violet-50 text-violet-600",
    pink:    "bg-pink-50 text-pink-600",
  }[tone];
  return (
    <div className="bg-card border border-border rounded-lg p-4 hover:border-foreground/10 transition-colors">
      <div className="flex items-start justify-between mb-3">
        <span className="text-xs font-medium text-muted-foreground">{label}</span>
        {Icon && (
          <div className={cn("w-8 h-8 rounded-md flex items-center justify-center", toneClasses)}>
            <Icon className="w-4 h-4" />
          </div>
        )}
      </div>
      <div className="text-3xl font-bold text-foreground tracking-tight">{value}</div>
      {subtitle && <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>}
      {change && <p className="text-xs font-medium text-emerald-600 mt-2">{change}</p>}
    </div>
  );
}

export function Chip({
  children, tone = "default", className
}: { children: React.ReactNode; tone?: "default" | "green" | "blue" | "amber" | "red" | "purple" | "pink" | "slate" | "orange"; className?: string }) {
  const tones = {
    default: "bg-muted text-muted-foreground",
    green:   "bg-emerald-50 text-emerald-700",
    blue:    "bg-blue-50 text-blue-700",
    amber:   "bg-amber-50 text-amber-700",
    red:     "bg-rose-50 text-rose-700",
    purple:  "bg-violet-50 text-violet-700",
    pink:    "bg-pink-50 text-pink-700",
    slate:   "bg-slate-100 text-slate-700",
    orange:  "bg-orange-50 text-orange-700",
  }[tone];
  // Thin wrapper around shadcn Badge so we keep the tone API but inherit the
  // shadcn sizing, radius, and focus ring system.
  return (
    <Badge variant="outline" className={cn("border-transparent font-semibold", tones, className)}>
      {children}
    </Badge>
  );
}

function Avatar({ name, tone = "blue" }: { name: string; tone?: "blue" | "green" | "amber" | "purple" | "pink" | "slate" | "rose" }) {
  const initials = name.split(" ").map(n => n[0]).slice(0, 2).join("").toUpperCase();
  const tones = {
    blue:    "bg-blue-100 text-blue-700",
    green:   "bg-emerald-100 text-emerald-700",
    amber:   "bg-amber-100 text-amber-700",
    purple:  "bg-violet-100 text-violet-700",
    pink:    "bg-pink-100 text-pink-700",
    slate:   "bg-slate-200 text-slate-700",
    rose:    "bg-rose-100 text-rose-700",
  }[tone];
  return (
    <div className={cn("w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold shrink-0", tones)}>
      {initials}
    </div>
  );
}

function ProgressBar({ value, tone = "blue" }: { value: number; tone?: "blue" | "green" | "amber" | "red" }) {
  const tones = {
    blue:   "bg-blue-500",
    green:  "bg-emerald-500",
    amber:  "bg-amber-500",
    red:    "bg-rose-500",
  }[tone];
  return (
    <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
      <div className={cn("h-full rounded-full transition-all", tones)} style={{ width: `${Math.min(100, Math.max(0, value))}%` }} />
    </div>
  );
}

function EmptyHint({ children }: { children: React.ReactNode }) {
  return (
    <div className="text-center py-12 text-sm text-muted-foreground">{children}</div>
  );
}

// ============================================================================
// DISCIPLESHIP DASHBOARD (tab inside the main Dashboard page)
// ============================================================================

export function DiscipleshipDashboardView({ onNavigate }: { onNavigate?: (view: string) => void }) {
  const activities = [
    { tone: "bg-emerald-500", text: "Sarah M. completed 'Foundations of Faith' campaign", when: "2m ago" },
    { tone: "bg-blue-500",    text: "New match proposed: David K. \u2192 Mentor James",     when: "15m ago" },
    { tone: "bg-rose-500",    text: "12 new seekers completed intake this week",            when: "1h ago" },
    { tone: "bg-violet-500",  text: "Content 'Finding Peace' assigned to 8 seekers",        when: "3h ago" },
  ];
  return (
    <div className="p-6 space-y-4">
      <PageHeader
        title="Dashboard"
        subtitle="Welcome back — here's your discipleship overview"
        actions={(
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
            <Input
              placeholder="Search..."
              className="pl-8 h-9 w-[220px]"
            />
          </div>
        )}
      />

      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
        <StatCard label="Active Seekers"    value={247}   change="+12% from last month" icon={Users}       tone="pink"   />
        <StatCard label="Active Matches"    value={89}    change="+8% from last month"  icon={GitBranch}   tone="blue"   />
        <StatCard label="Completion Rate"   value="73%"   change="+5% from last month"  icon={CheckCircle2} tone="green" />
        <StatCard label="Engagement Score"  value={82}    change="+3 pts this week"     icon={Activity}    tone="purple" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr,300px] gap-4">
        <div className="bg-card border border-border rounded-lg p-5">
          <h3 className="text-sm font-bold text-foreground mb-3">Recent Activity</h3>
          <div className="space-y-2">
            {activities.map((a, i) => (
              <div key={i} className="flex items-center justify-between py-1.5">
                <div className="flex items-center gap-3 min-w-0">
                  <span className={cn("w-2 h-2 rounded-full shrink-0", a.tone)} />
                  <span className="text-sm text-foreground truncate">{a.text}</span>
                </div>
                <span className="text-xs text-muted-foreground shrink-0 ml-2">{a.when}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-card border border-border rounded-lg p-5">
          <h3 className="text-sm font-bold text-foreground mb-3">Quick Actions</h3>
          <div className="space-y-2">
            <QuickAction label="New Seeker Intake" icon={Users}       primary onClick={() => onNavigate?.("seekers")} />
            <QuickAction label="Review Matches"    icon={GitBranch}            onClick={() => onNavigate?.("matches")} />
            <QuickAction label="Create Campaign"   icon={Plus}                 onClick={() => onNavigate?.("automations")} />
            <QuickAction label="Add Content"       icon={FileText}             onClick={() => onNavigate?.("content_library")} />
          </div>
        </div>
      </div>
    </div>
  );
}

function QuickAction({
  label, icon: Icon, primary, onClick
}: { label: string; icon: any; primary?: boolean; onClick?: () => void }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full flex items-center gap-2.5 px-3 py-2.5 text-sm font-medium rounded-md transition-all",
        primary
          ? "bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm"
          : "bg-card border border-border text-foreground hover:bg-muted/50"
      )}
    >
      <Icon className="w-4 h-4" />
      <span>{label}</span>
    </button>
  );
}

// ============================================================================
// SEEKERS
// ============================================================================

type SeekerRow = {
  id: string; name: string; email: string; maturity: string; maturityTone: any;
  campaign: string; engagement: number; engagementTone: any; status: string; statusTone: any;
  avatarTone: any;
};

const SEEKERS: SeekerRow[] = [
  { id: "s1", name: "Sarah Abebe",     email: "sarah@email.com",   maturity: "New Believer", maturityTone: "green",  campaign: "Foundations of Faith", engagement: 82, engagementTone: "green", status: "Active",  statusTone: "green",  avatarTone: "rose" },
  { id: "s2", name: "David Kebede",    email: "david.k@email.com", maturity: "Seeker",       maturityTone: "amber",  campaign: "Salvation Basics",     engagement: 58, engagementTone: "amber", status: "Active",  statusTone: "green",  avatarTone: "blue" },
  { id: "s3", name: "Abigail Johnson", email: "abigail.j@email.com", maturity: "Growing",    maturityTone: "blue",   campaign: "Prayer & Worship",     engagement: 91, engagementTone: "blue",  status: "Active",  statusTone: "green",  avatarTone: "purple" },
  { id: "s4", name: "Miriam Tadesse",  email: "miriam.t@email.com", maturity: "Interested",  maturityTone: "orange", campaign: "—",                    engagement: 30, engagementTone: "red",   status: "Pending", statusTone: "amber", avatarTone: "green" },
];

// Maturity progression per the spec (pre_seeker → leader). Plus "Interested"
// which appears in the seed data for demo.
const MATURITY_LEVELS = ["Interested", "Pre-Seeker", "Seeker", "New Believer", "Growing", "Mature", "Leader"] as const;
const STATUSES        = ["Active", "Pending", "Inactive", "Graduated", "Archived"] as const;
type SortKey = "newest" | "oldest" | "name" | "engagement_high" | "engagement_low";
const SORT_OPTIONS: { key: SortKey; label: string }[] = [
  { key: "newest",          label: "Newest first" },
  { key: "oldest",          label: "Oldest first" },
  { key: "name",            label: "Name (A–Z)" },
  { key: "engagement_high", label: "Engagement (high → low)" },
  { key: "engagement_low",  label: "Engagement (low → high)" },
];

export function SeekersView({ canCreate = true }: { canCreate?: boolean }) {
  const [query, setQuery]         = useState("");
  const [seekers, setSeekers]     = useState<SeekerRow[]>(SEEKERS);
  const [maturity, setMaturity]   = useState<string>("all");
  const [status, setStatus]       = useState<string>("all");
  const [sort, setSort]           = useState<SortKey>("newest");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isNewOpen, setIsNewOpen] = useState(false);

  const selected = seekers.find(s => s.id === selectedId) || null;

  // Filter + sort pipeline. Kept local to this component since we drive off
  // the seed SEEKERS array; swap for API-backed data later without changing
  // the UI.
  const filtered = useMemo(() => {
    let list = seekers.filter(s => {
      const matchesQ = !query || s.name.toLowerCase().includes(query.toLowerCase()) || s.email.toLowerCase().includes(query.toLowerCase());
      const matchesM = maturity === "all" || s.maturity === maturity;
      const matchesS = status === "all" || s.status === status;
      return matchesQ && matchesM && matchesS;
    });
    const byIndex = (a: SeekerRow, b: SeekerRow) => seekers.indexOf(a) - seekers.indexOf(b);
    if (sort === "newest")          list = [...list].sort(byIndex);
    else if (sort === "oldest")     list = [...list].sort((a, b) => -byIndex(a, b));
    else if (sort === "name")       list = [...list].sort((a, b) => a.name.localeCompare(b.name));
    else if (sort === "engagement_high") list = [...list].sort((a, b) => b.engagement - a.engagement);
    else if (sort === "engagement_low")  list = [...list].sort((a, b) => a.engagement - b.engagement);
    return list;
  }, [seekers, query, maturity, status, sort]);

  // Drill into a single seeker's profile — full-page replacement of the list.
  if (selected) {
    return <SeekerDetailView seeker={selected} onBack={() => setSelectedId(null)} />;
  }

  return (
    <div className="p-6 space-y-4">
      <PageHeader
        title="Seekers"
        subtitle="Manage and track seeker journeys"
        actions={canCreate && (
          <Button onClick={() => setIsNewOpen(true)}>
            <Plus className="w-4 h-4" /> New Seeker
          </Button>
        )}
      />

      <div className="flex items-center gap-2 flex-wrap">
        <div className="flex-1 min-w-[240px] relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
          <Input
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search seekers by name or email..."
            className="pl-9 h-10"
          />
        </div>

        <FilterDropdown
          label="Maturity"
          value={maturity}
          onChange={setMaturity}
          options={[{ value: "all", label: "All maturity levels" }, ...MATURITY_LEVELS.map(m => ({ value: m, label: m }))]}
        />
        <FilterDropdown
          label="Status"
          value={status}
          onChange={setStatus}
          options={[{ value: "all", label: "All statuses" }, ...STATUSES.map(s => ({ value: s, label: s }))]}
        />
        <FilterDropdown
          label="Sort"
          value={sort}
          onChange={(v) => setSort(v as SortKey)}
          options={SORT_OPTIONS.map(s => ({ value: s.key, label: s.label }))}
        />
      </div>

      <div className="bg-card border border-border rounded-lg overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="bg-muted/40 border-b border-border text-xs uppercase tracking-wider text-muted-foreground">
              <th className="px-4 py-3 text-left font-semibold w-10"><input type="checkbox" className="accent-primary" /></th>
              <th className="px-4 py-3 text-left font-semibold">Name</th>
              <th className="px-4 py-3 text-left font-semibold">Maturity</th>
              <th className="px-4 py-3 text-left font-semibold">Campaign</th>
              <th className="px-4 py-3 text-left font-semibold">Engagement</th>
              <th className="px-4 py-3 text-left font-semibold">Status</th>
              <th className="px-4 py-3 text-right font-semibold w-10">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-12 text-center text-sm text-muted-foreground">
                  No seekers match your filters.
                </td>
              </tr>
            ) : filtered.map(s => (
              <tr
                key={s.id}
                className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors cursor-pointer"
                onClick={() => setSelectedId(s.id)}
              >
                <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                  <input type="checkbox" className="accent-primary" />
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <Avatar name={s.name} tone={s.avatarTone} />
                    <div>
                      <div className="text-sm font-semibold text-foreground">{s.name}</div>
                      <div className="text-xs text-muted-foreground">{s.email}</div>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3"><Chip tone={s.maturityTone}>{s.maturity}</Chip></td>
                <td className="px-4 py-3 text-sm text-foreground">{s.campaign}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2 min-w-[140px]">
                    <div className="flex-1"><ProgressBar value={s.engagement} tone={s.engagementTone} /></div>
                    <span className="text-xs font-semibold text-foreground w-10 text-right">{s.engagement}%</span>
                  </div>
                </td>
                <td className="px-4 py-3"><Chip tone={s.statusTone}>{s.status}</Chip></td>
                <td className="px-4 py-3 text-right" onClick={(e) => e.stopPropagation()}>
                  <SeekerActionsMenu
                    seeker={s}
                    onView={() => setSelectedId(s.id)}
                    onMessage={() => toast.success(`Opening chat with ${s.name}`)}
                    onReclassify={() => toast.success(`Re-running AI classification for ${s.name}`)}
                    onArchive={() => {
                      setSeekers(list => list.map(x => x.id === s.id ? { ...x, status: "Archived", statusTone: "slate" } : x));
                      toast.success(`${s.name} archived`);
                    }}
                    onDelete={() => {
                      setSeekers(list => list.filter(x => x.id !== s.id));
                      toast.success(`${s.name} deleted`);
                    }}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <NewSeekerIntakeModal
        isOpen={isNewOpen}
        onClose={() => setIsNewOpen(false)}
        onSubmit={(draft) => {
          const newRow: SeekerRow = {
            id: `s-${Date.now()}`,
            name: draft.name,
            email: draft.email || "—",
            maturity: "Interested",
            maturityTone: "orange",
            campaign: "—",
            engagement: 0,
            engagementTone: "red",
            status: "Pending",
            statusTone: "amber",
            avatarTone: "blue",
          };
          setSeekers(list => [newRow, ...list]);
          toast.success(`${draft.name} added — AI classification pending`);
          setIsNewOpen(false);
        }}
      />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Seeker detail — AI Classification, AI Summary, Journey Timeline
// ---------------------------------------------------------------------------

function SeekerDetailView({
  seeker, onBack,
}: { seeker: SeekerRow; onBack: () => void }) {
  // Mock profile derived from the seed row. In production this would be fetched
  // from the intelligence + classification APIs keyed by seeker.id.
  const profile = {
    engagement: seeker.engagement,
    mentor: seeker.campaign === "—" ? "—" : "Pastor James K.",
    joined: "Mar 15, 2026",
    maturityLevel: seeker.maturity,
    confidence: 92,
    needs: ["Foundation Building"],
    interests: ["Prayer", "Bible Study", "Community"] as const,
    summary: `${seeker.name.split(" ")[0]} is a recently converted new believer who came to faith through a friend's invitation. She shows strong interest in prayer and building a foundational understanding of the Bible. She responds well to community-oriented content and benefits from structured guidance. Recommended focus areas: daily devotionals, prayer guides, and small group connection.`,
    timeline: [
      { tone: "bg-emerald-500", text: "Completed intake form",           date: "Mar 15, 2026" },
      { tone: "bg-emerald-500", text: `AI classified as ${seeker.maturity}`, date: "Mar 15, 2026" },
      { tone: "bg-blue-500",    text: "Matched with Pastor James K.",    date: "Mar 16, 2026" },
      { tone: "bg-rose-500",    text: "Enrolled in 'Foundations of Faith'", date: "Mar 17, 2026" },
      { tone: "bg-violet-500",  text: "Completed Step 3: Prayer Guide",  date: "Mar 22, 2026" },
    ],
  };

  const interestTones: Record<string, "pink" | "blue" | "purple" | "amber"> = {
    Prayer: "pink", "Bible Study": "blue", Community: "purple", Worship: "amber",
  };

  return (
    <div className="p-6 space-y-4">
      {/* Compact back bar so the page still feels like it belongs in the Seekers section */}
      <button
        onClick={onBack}
        className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="w-4 h-4" /> Back to Seekers
      </button>

      {/* Header — avatar, name + meta, actions */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-rose-100 text-rose-700 flex items-center justify-center text-xl font-bold shrink-0">
            {seeker.name.split(" ").map(n => n[0]).slice(0, 2).join("").toUpperCase()}
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-2xl font-bold text-foreground tracking-tight">{seeker.name}</h1>
              <Chip tone={seeker.maturityTone}>
                <Star className="w-3 h-3" /> {seeker.maturity}
              </Chip>
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              <span>Engagement: <span className="font-semibold text-foreground">{profile.engagement}/100</span></span>
              <span className="mx-2">·</span>
              <span>Mentor: <span className="font-semibold text-foreground">{profile.mentor}</span></span>
              <span className="mx-2">·</span>
              <span>Joined: {profile.joined}</span>
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={() => toast.success(`Opening chat with ${seeker.name}`)}>
            <Send className="w-3.5 h-3.5" /> Message
          </Button>
          <Button variant="outline" onClick={() => toast.info("Edit coming soon")}>
            <Edit2 className="w-3.5 h-3.5" /> Edit
          </Button>
        </div>
      </div>

      {/* Two-column layout: classification + summary on left, timeline on right */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr,360px] gap-4">
        <div className="space-y-4">
          {/* AI Classification */}
          <div className="bg-card border border-border rounded-xl p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-foreground">AI Classification</h3>
              <Chip tone="green">
                <CheckCircle2 className="w-3 h-3" /> {profile.confidence}% confidence
              </Chip>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">Maturity Level</p>
                <p className="text-sm font-bold text-foreground">{profile.maturityLevel}</p>
              </div>
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">Identified Needs</p>
                <div className="flex items-center gap-1.5 flex-wrap">
                  {profile.needs.map(n => <Chip key={n} tone="amber">{n}</Chip>)}
                </div>
              </div>
              <div className="sm:col-span-2">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">Key Interests</p>
                <div className="flex items-center gap-1.5 flex-wrap">
                  {profile.interests.map(i => <Chip key={i} tone={interestTones[i] ?? "slate"}>{i}</Chip>)}
                </div>
              </div>
            </div>
          </div>

          {/* AI Summary */}
          <div className="bg-card border border-border rounded-xl p-5">
            <div className="flex items-center gap-2 mb-3">
              <Sparkles className="w-4 h-4 text-violet-500" />
              <h3 className="text-base font-bold text-foreground">AI Summary</h3>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">{profile.summary}</p>
          </div>

          {/* Intelligence quick stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <StatCard label="Dropout Risk"   value="Low"        subtitle="Improving trend"         icon={Activity}  tone="green" />
            <StatCard label="Learning Pace"  value="Moderate"   subtitle="On schedule"              icon={Clock}     tone="blue" />
            <StatCard label="Sentiment"      value="Improving"  subtitle="Last 3 cycles"            icon={TrendingUp} tone="purple" />
            <StatCard label="Topic Affinity" value="Prayer"     subtitle="0.9 weight"               icon={Heart}     tone="pink" />
          </div>
        </div>

        {/* Journey Timeline */}
        <div className="bg-card border border-border rounded-xl p-5 h-fit">
          <h3 className="text-base font-bold text-foreground mb-4">Journey Timeline</h3>
          <ol className="space-y-4 relative">
            <div className="absolute left-[5px] top-1 bottom-1 w-px bg-border" aria-hidden />
            {profile.timeline.map((t, i) => (
              <li key={i} className="relative flex items-start gap-3 pl-0">
                <span className={cn("w-2.5 h-2.5 rounded-full mt-1.5 shrink-0 ring-2 ring-background relative z-10", t.tone)} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground">{t.text}</p>
                  <p className="text-xs text-muted-foreground">{t.date}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Row actions dropdown
// ---------------------------------------------------------------------------

function SeekerActionsMenu({
  seeker, onView, onMessage, onReclassify, onArchive, onDelete,
}: {
  seeker: SeekerRow;
  onView: () => void;
  onMessage: () => void;
  onReclassify: () => void;
  onArchive: () => void;
  onDelete: () => void;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className={cn(
          "inline-flex items-center justify-center h-8 w-8 rounded-md",
          "text-muted-foreground hover:text-foreground hover:bg-muted transition-colors outline-none",
          "focus-visible:ring-2 focus-visible:ring-ring"
        )}
        aria-label={`Actions for ${seeker.name}`}
      >
        <MoreHorizontal className="w-4 h-4" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuItem onSelect={onView}>
          <Eye className="w-3.5 h-3.5" /> View profile
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={onMessage}>
          <MessageSquareIcon className="w-3.5 h-3.5" /> Message
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={onReclassify}>
          <RefreshCw className="w-3.5 h-3.5" /> Re-classify
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={onArchive}>
          <Archive className="w-3.5 h-3.5" /> Archive
        </DropdownMenuItem>
        <DropdownMenuItem variant="destructive" onSelect={onDelete}>
          <Trash2 className="w-3.5 h-3.5" /> Delete
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

// ---------------------------------------------------------------------------
// Filter dropdown
// ---------------------------------------------------------------------------

function FilterDropdown({
  label, value, onChange, options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  const current = options.find(o => o.value === value)?.label ?? label;
  const isDefault = value === "all" || value === options[0]?.value;
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className={cn(
          "inline-flex items-center gap-1.5 h-10 px-3 rounded-md border text-sm font-medium transition-colors outline-none",
          "focus-visible:ring-2 focus-visible:ring-ring",
          isDefault
            ? "border-border bg-background text-foreground hover:bg-muted/50"
            : "border-primary/30 bg-primary/5 text-primary hover:bg-primary/10"
        )}
      >
        {isDefault ? label : <span className="font-semibold">{current}</span>}
        <ChevronDown className="w-3.5 h-3.5" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-56">
        <DropdownMenuLabel className="text-xs text-muted-foreground">{label}</DropdownMenuLabel>
        <DropdownMenuRadioGroup value={value} onValueChange={onChange}>
          {options.map(opt => (
            <DropdownMenuRadioItem key={opt.value} value={opt.value}>
              {opt.label}
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

// ---------------------------------------------------------------------------
// New Seeker — 4-step intake modal per the spec (Welcome · Background · Interests · Preferences)
// ---------------------------------------------------------------------------

interface IntakeDraft {
  // Step 1 — Welcome
  name: string;
  email: string;
  consent: boolean;
  language: "en" | "am" | "om";
  // Step 2 — Background
  spiritualBackground: string;
  location: string;
  timezone: string;
  // Step 3 — Interests
  interests: string[];
  questions: string;
  // Step 4 — Preferences
  preferredChannel: "telegram" | "whatsapp" | "sms" | "web";
  mentorGender: "any" | "female" | "male";
  availability: string;
}

const INTAKE_STEPS = [
  { id: 1, title: "Welcome",     description: "Let's start with the basics." },
  { id: 2, title: "Background",  description: "A little about you so we can match you well." },
  { id: 3, title: "Interests",   description: "What are you curious about?" },
  { id: 4, title: "Preferences", description: "How would you like to stay in touch?" },
];

const INTEREST_OPTIONS = ["Prayer", "Bible Study", "Community", "Worship", "Apologetics", "Serving"];

function NewSeekerIntakeModal({
  isOpen, onClose, onSubmit,
}: { isOpen: boolean; onClose: () => void; onSubmit: (draft: IntakeDraft) => void }) {
  const [step, setStep] = useState(1);
  const [draft, setDraft] = useState<IntakeDraft>({
    name: "", email: "", consent: false, language: "en",
    spiritualBackground: "", location: "", timezone: "Africa/Addis_Ababa",
    interests: [], questions: "",
    preferredChannel: "telegram", mentorGender: "any", availability: "",
  });
  const update = <K extends keyof IntakeDraft>(key: K, value: IntakeDraft[K]) =>
    setDraft(d => ({ ...d, [key]: value }));

  const toggleInterest = (v: string) => {
    setDraft(d => ({ ...d, interests: d.interests.includes(v) ? d.interests.filter(i => i !== v) : [...d.interests, v] }));
  };

  const canAdvance =
    step === 1 ? draft.name.trim().length > 0 && draft.consent :
    step === 2 ? draft.spiritualBackground.trim().length > 0 :
    step === 3 ? draft.interests.length > 0 :
    true;

  const handleClose = () => {
    setStep(1);
    onClose();
  };

  const handleSubmit = () => {
    onSubmit(draft);
    // Reset for next time
    setStep(1);
    setDraft({
      name: "", email: "", consent: false, language: "en",
      spiritualBackground: "", location: "", timezone: "Africa/Addis_Ababa",
      interests: [], questions: "",
      preferredChannel: "telegram", mentorGender: "any", availability: "",
    });
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="New Seeker Intake" size="lg">
      <div className="space-y-5">
        {/* Step indicator — horizontal segmented progress */}
        <div className="flex items-center gap-2">
          {INTAKE_STEPS.map((s, i) => {
            const isDone   = step > s.id;
            const isActive = step === s.id;
            return (
              <div key={s.id} className="flex items-center gap-2 flex-1">
                <div className="flex items-center gap-2 flex-1">
                  <div className={cn(
                    "w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 border",
                    isDone ? "bg-primary border-primary text-primary-foreground"
                      : isActive ? "bg-primary/10 border-primary text-primary"
                      : "bg-muted border-border text-muted-foreground"
                  )}>
                    {isDone ? <CheckCircle2 className="w-3.5 h-3.5" /> : s.id}
                  </div>
                  <div className="hidden sm:block min-w-0">
                    <p className={cn("text-xs font-semibold truncate", isActive || isDone ? "text-foreground" : "text-muted-foreground")}>{s.title}</p>
                  </div>
                </div>
                {i < INTAKE_STEPS.length - 1 && <div className={cn("h-px flex-1 min-w-[12px]", isDone ? "bg-primary" : "bg-border")} />}
              </div>
            );
          })}
        </div>

        <div>
          <h3 className="text-base font-bold text-foreground">{INTAKE_STEPS[step - 1].title}</h3>
          <p className="text-xs text-muted-foreground mt-0.5">{INTAKE_STEPS[step - 1].description}</p>
        </div>

        {/* Step bodies */}
        {step === 1 && (
          <div className="space-y-4">
            <div className="grid gap-1.5">
              <Label className="text-xs font-semibold">Full name <span className="text-destructive">*</span></Label>
              <Input value={draft.name} onChange={(e) => update("name", e.target.value)} placeholder="Abigail Johnson" />
            </div>
            <div className="grid gap-1.5">
              <Label className="text-xs font-semibold">Email <span className="text-muted-foreground font-normal">(optional)</span></Label>
              <Input value={draft.email} onChange={(e) => update("email", e.target.value)} placeholder="abigail@example.com" type="email" />
            </div>
            <div className="grid gap-1.5">
              <Label className="text-xs font-semibold">Preferred language</Label>
              <div className="flex items-center gap-1 bg-muted/60 rounded-md p-0.5 w-fit">
                {([["en", "English"], ["am", "Amharic"], ["om", "Afaan Oromoo"]] as const).map(([k, label]) => (
                  <button
                    key={k}
                    onClick={() => update("language", k)}
                    className={cn(
                      "px-3 py-1.5 text-xs font-semibold rounded transition-all",
                      draft.language === k ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                    )}
                  >{label}</button>
                ))}
              </div>
            </div>
            <label className="flex items-start gap-2 pt-1 cursor-pointer">
              <input
                type="checkbox"
                checked={draft.consent}
                onChange={(e) => update("consent", e.target.checked)}
                className="mt-0.5 accent-primary"
              />
              <span className="text-xs text-muted-foreground leading-relaxed">
                I give consent for this person to participate in the discipleship process and receive messages on their preferred channel.
              </span>
            </label>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <div className="grid gap-1.5">
              <Label className="text-xs font-semibold">Spiritual background <span className="text-destructive">*</span></Label>
              <Textarea
                value={draft.spiritualBackground}
                onChange={(e) => update("spiritualBackground", e.target.value)}
                placeholder="Church history, faith experience, current beliefs..."
                className="min-h-[90px] text-sm"
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="grid gap-1.5">
                <Label className="text-xs font-semibold">Location</Label>
                <Input value={draft.location} onChange={(e) => update("location", e.target.value)} placeholder="Addis Ababa, Ethiopia" />
              </div>
              <div className="grid gap-1.5">
                <Label className="text-xs font-semibold">Timezone</Label>
                <Input value={draft.timezone} onChange={(e) => update("timezone", e.target.value)} />
              </div>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4">
            <div className="grid gap-2">
              <Label className="text-xs font-semibold">Topics of interest <span className="text-destructive">*</span></Label>
              <div className="flex flex-wrap gap-1.5">
                {INTEREST_OPTIONS.map(o => {
                  const isOn = draft.interests.includes(o);
                  return (
                    <button
                      key={o}
                      type="button"
                      onClick={() => toggleInterest(o)}
                      className={cn(
                        "px-3 py-1.5 rounded-full text-xs font-semibold border transition-all",
                        isOn ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:bg-muted/50"
                      )}
                    >
                      {isOn && <CheckCircle2 className="inline w-3 h-3 mr-1" />}
                      {o}
                    </button>
                  );
                })}
              </div>
              <p className="text-xs text-muted-foreground">Pick one or more.</p>
            </div>
            <div className="grid gap-1.5">
              <Label className="text-xs font-semibold">Questions they want explored</Label>
              <Textarea
                value={draft.questions}
                onChange={(e) => update("questions", e.target.value)}
                placeholder="e.g. Who is Jesus? How do I pray? What is the Bible?"
                className="min-h-[80px] text-sm"
              />
            </div>
          </div>
        )}

        {step === 4 && (
          <div className="space-y-4">
            <div className="grid gap-2">
              <Label className="text-xs font-semibold">Preferred channel</Label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {([
                  ["telegram", "Telegram"], ["whatsapp", "WhatsApp"], ["sms", "SMS"], ["web", "Web"],
                ] as const).map(([k, label]) => (
                  <button
                    key={k}
                    type="button"
                    onClick={() => update("preferredChannel", k)}
                    className={cn(
                      "px-3 py-2 rounded-md text-xs font-semibold border transition-all",
                      draft.preferredChannel === k ? "border-primary bg-primary/10 text-primary" : "border-border text-foreground hover:bg-muted/50"
                    )}
                  >{label}</button>
                ))}
              </div>
            </div>
            <div className="grid gap-2">
              <Label className="text-xs font-semibold">Mentor gender preference</Label>
              <div className="flex items-center gap-1 bg-muted/60 rounded-md p-0.5 w-fit">
                {([["any", "No preference"], ["female", "Female"], ["male", "Male"]] as const).map(([k, label]) => (
                  <button
                    key={k}
                    onClick={() => update("mentorGender", k)}
                    className={cn(
                      "px-3 py-1.5 text-xs font-semibold rounded transition-all",
                      draft.mentorGender === k ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                    )}
                  >{label}</button>
                ))}
              </div>
            </div>
            <div className="grid gap-1.5">
              <Label className="text-xs font-semibold">Availability</Label>
              <Textarea
                value={draft.availability}
                onChange={(e) => update("availability", e.target.value)}
                placeholder="e.g. Monday evenings, Saturday mornings"
                className="min-h-[60px] text-sm"
              />
            </div>
          </div>
        )}

        {/* Footer nav */}
        <div className="flex items-center justify-between gap-2 pt-3 border-t border-border">
          <Button
            variant="outline"
            size="sm"
            onClick={() => (step === 1 ? handleClose() : setStep(step - 1))}
          >
            {step === 1 ? "Cancel" : <><ArrowLeft className="w-3.5 h-3.5" /> Back</>}
          </Button>
          {step < INTAKE_STEPS.length ? (
            <Button size="sm" disabled={!canAdvance} onClick={() => setStep(step + 1)}>
              Continue
            </Button>
          ) : (
            <Button size="sm" onClick={handleSubmit}>
              <Sparkles className="w-3.5 h-3.5" /> Submit & classify
            </Button>
          )}
        </div>
      </div>
    </Modal>
  );
}

function FilterButton({ label }: { label: string }) {
  return (
    <Button variant="outline" size="sm" className="font-medium">
      {label}
      <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />
    </Button>
  );
}

// ============================================================================
// MENTORS
// ============================================================================

type MentorRow = {
  id: string; name: string; email: string;
  specialty: string;        // comma-separated string shown in the table
  languages: string;        // comma-separated short codes: EN, AM, OM
  capacity: string;         // "4/5"
  load: number;             // 0-100 percentage
  status: "Active" | "Unavailable" | "On leave" | "Retired";
  statusTone: any;
  avatarTone: "blue" | "purple" | "rose" | "amber" | "green" | "slate";
  experience: "Beginner" | "Intermediate" | "Experienced" | "Senior";
  gender: "female" | "male";
  strengths: string[];      // eg ["Empathy", "Bible knowledge", "Prayer"]
  bio: string;
  joined: string;
};

const INITIAL_MENTORS_DATA: MentorRow[] = [
  { id: "m1", name: "Pastor James K.",   email: "james@email.com",   specialty: "New Believers, Grief", languages: "EN, AM", capacity: "4/5", load: 80,  status: "Active",       statusTone: "green", avatarTone: "blue",   experience: "Senior",       gender: "male",   strengths: ["Empathy", "Bible knowledge", "Prayer"],  bio: "20+ years walking alongside new believers and those in grief. Passionate about foundational discipleship and the quiet work of scripture.", joined: "Jan 10, 2024" },
  { id: "m2", name: "Mentor Daniel M.",  email: "daniel@email.com",  specialty: "Youth, Apologetics",   languages: "EN, AM", capacity: "3/5", load: 60,  status: "Active",       statusTone: "green", avatarTone: "purple", experience: "Experienced",  gender: "male",   strengths: ["Patience", "Apologetics", "Storytelling"], bio: "Loves wrestling through hard questions with curious young adults. Former youth pastor.", joined: "Mar 2, 2024" },
  { id: "m3", name: "Sister Ruth B.",    email: "ruth@email.com",    specialty: "Women, Prayer",        languages: "EN, OM", capacity: "5/5", load: 100, status: "Unavailable",  statusTone: "amber", avatarTone: "rose",   experience: "Experienced",  gender: "female", strengths: ["Prayer", "Counseling", "Pastoral care"], bio: "Women's ministry leader. Specialises in prayer accompaniment and seasons of transition.", joined: "May 18, 2024" },
  { id: "m4", name: "Elder Susan M.",    email: "susan@email.com",   specialty: "Bible Study",          languages: "EN",     capacity: "2/6", load: 33,  status: "Active",       statusTone: "green", avatarTone: "amber",  experience: "Senior",       gender: "female", strengths: ["Bible knowledge", "Teaching", "Study planning"], bio: "Retired teacher who now leads small groups. Equips seekers to read scripture themselves.", joined: "Feb 5, 2024" },
];

const MENTOR_STATUSES = ["Active", "Unavailable", "On leave", "Retired"] as const;
const EXPERIENCE_LEVELS = ["Beginner", "Intermediate", "Experienced", "Senior"] as const;
const ALL_LANGUAGES = [
  { code: "EN", label: "English" }, { code: "AM", label: "Amharic" }, { code: "OM", label: "Afaan Oromoo" },
];
const ALL_SPECIALTIES = ["New Believers", "Youth", "Women", "Men", "Grief", "Prayer", "Apologetics", "Bible Study", "Marriage", "Addiction recovery"];
const ALL_STRENGTHS  = ["Empathy", "Bible knowledge", "Prayer", "Patience", "Counseling", "Apologetics", "Teaching", "Storytelling", "Pastoral care", "Study planning"];

export function MentorsView({ canCreate = true }: { canCreate?: boolean }) {
  const [mentors, setMentors] = useState<MentorRow[]>(INITIAL_MENTORS_DATA);
  const [query, setQuery]     = useState("");
  const [status, setStatus]   = useState<string>("all");
  const [exp, setExp]         = useState<string>("all");
  const [sort, setSort]       = useState<"name" | "load_low" | "load_high" | "newest">("newest");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isNewOpen, setIsNewOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const selected = mentors.find(m => m.id === selectedId) || null;
  const editing  = mentors.find(m => m.id === editingId) || null;

  const filtered = useMemo(() => {
    let list = mentors.filter(m => {
      const q = query.toLowerCase();
      const matchesQ = !q || m.name.toLowerCase().includes(q) || m.email.toLowerCase().includes(q) || m.specialty.toLowerCase().includes(q);
      const matchesS = status === "all" || m.status === status;
      const matchesE = exp === "all" || m.experience === exp;
      return matchesQ && matchesS && matchesE;
    });
    if (sort === "name")       list = [...list].sort((a, b) => a.name.localeCompare(b.name));
    else if (sort === "load_low")  list = [...list].sort((a, b) => a.load - b.load);
    else if (sort === "load_high") list = [...list].sort((a, b) => b.load - a.load);
    return list;
  }, [mentors, query, status, exp, sort]);

  // Drill into a profile — full-page replacement.
  if (selected) {
    return (
      <MentorDetailView
        mentor={selected}
        onBack={() => setSelectedId(null)}
        onEdit={() => { setEditingId(selected.id); setSelectedId(null); }}
        onStatusChange={(s) => setMentors(list => list.map(x => x.id === selected.id ? { ...x, status: s, statusTone: s === "Active" ? "green" : s === "Retired" ? "slate" : "amber" } : x))}
      />
    );
  }

  const totalActive     = mentors.filter(m => m.status === "Active").length;
  const avgLoad         = mentors.length === 0 ? 0 : Math.round(mentors.reduce((s, m) => s + m.load, 0) / mentors.length);
  const availableSlots  = mentors.reduce((acc, m) => {
    const [cur, max] = m.capacity.split("/").map(Number);
    return acc + Math.max(0, (max || 0) - (cur || 0));
  }, 0);

  return (
    <div className="p-6 space-y-4">
      <PageHeader
        title="Mentors"
        subtitle="Manage mentor profiles, availability, and capacity"
        actions={canCreate && (
          <Button onClick={() => setIsNewOpen(true)}>
            <Plus className="w-4 h-4" /> New Mentor
          </Button>
        )}
      />

      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
        <StatCard label="Total Mentors"   value={mentors.length} icon={ShieldCheck}  tone="blue" />
        <StatCard label="Active"          value={totalActive}    icon={CheckCircle2} tone="green" />
        <StatCard label="Avg. Load"       value={`${avgLoad}%`}  icon={Activity}     tone="amber" />
        <StatCard label="Available Slots" value={availableSlots} icon={Users}        tone="purple" />
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        <div className="flex-1 min-w-[240px] relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by name, email, or specialty..."
            className="pl-9 h-10"
          />
        </div>
        <FilterDropdown
          label="Status"
          value={status}
          onChange={setStatus}
          options={[{ value: "all", label: "All statuses" }, ...MENTOR_STATUSES.map(s => ({ value: s, label: s }))]}
        />
        <FilterDropdown
          label="Experience"
          value={exp}
          onChange={setExp}
          options={[{ value: "all", label: "All experience" }, ...EXPERIENCE_LEVELS.map(s => ({ value: s, label: s }))]}
        />
        <FilterDropdown
          label="Sort"
          value={sort}
          onChange={(v) => setSort(v as typeof sort)}
          options={[
            { value: "newest",    label: "Newest first" },
            { value: "name",      label: "Name (A–Z)" },
            { value: "load_low",  label: "Load (low → high)" },
            { value: "load_high", label: "Load (high → low)" },
          ]}
        />
      </div>

      <div className="bg-card border border-border rounded-lg overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="bg-muted/40 border-b border-border text-xs uppercase tracking-wider text-muted-foreground">
              <th className="px-4 py-3 text-left font-semibold">Mentor</th>
              <th className="px-4 py-3 text-left font-semibold">Specialty Areas</th>
              <th className="px-4 py-3 text-left font-semibold">Languages</th>
              <th className="px-4 py-3 text-left font-semibold">Experience</th>
              <th className="px-4 py-3 text-left font-semibold">Capacity</th>
              <th className="px-4 py-3 text-left font-semibold">Status</th>
              <th className="px-4 py-3 text-right font-semibold w-10">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-12 text-center text-sm text-muted-foreground">
                  No mentors match your filters.
                </td>
              </tr>
            ) : filtered.map(m => (
              <tr
                key={m.id}
                className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors cursor-pointer"
                onClick={() => setSelectedId(m.id)}
              >
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <Avatar name={m.name} tone={m.avatarTone} />
                    <div>
                      <div className="text-sm font-semibold text-foreground">{m.name}</div>
                      <div className="text-xs text-muted-foreground">{m.email}</div>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3 text-sm text-foreground">{m.specialty}</td>
                <td className="px-4 py-3 text-sm text-muted-foreground">{m.languages}</td>
                <td className="px-4 py-3"><Chip tone="slate">{m.experience}</Chip></td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2 min-w-[120px]">
                    <div className="flex-1"><ProgressBar value={m.load} tone={m.load >= 90 ? "red" : m.load >= 70 ? "amber" : "green"} /></div>
                    <span className="text-xs font-semibold text-foreground">{m.capacity}</span>
                  </div>
                </td>
                <td className="px-4 py-3"><Chip tone={m.statusTone}>{m.status}</Chip></td>
                <td className="px-4 py-3 text-right" onClick={(e) => e.stopPropagation()}>
                  <MentorActionsMenu
                    mentor={m}
                    onView={() => setSelectedId(m.id)}
                    onEdit={() => setEditingId(m.id)}
                    onMessage={() => toast.success(`Messaging ${m.name}`)}
                    onToggleStatus={() => {
                      setMentors(list => list.map(x => x.id === m.id
                        ? { ...x, status: x.status === "Active" ? "Unavailable" : "Active", statusTone: x.status === "Active" ? "amber" : "green" }
                        : x
                      ));
                      toast.success(`${m.name} is now ${m.status === "Active" ? "Unavailable" : "Active"}`);
                    }}
                    onDelete={() => {
                      setMentors(list => list.filter(x => x.id !== m.id));
                      toast.success(`${m.name} removed`);
                    }}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Create + Edit share the same modal to keep the form logic in one place */}
      <MentorFormModal
        key={editing?.id ?? "new"}
        isOpen={isNewOpen || editing !== null}
        initial={editing ?? undefined}
        onClose={() => { setIsNewOpen(false); setEditingId(null); }}
        onSubmit={(draft) => {
          if (editing) {
            setMentors(list => list.map(x => x.id === editing.id ? { ...x, ...draft } : x));
            toast.success(`${draft.name} updated`);
          } else {
            setMentors(list => [{ ...draft, id: `m-${Date.now()}` }, ...list]);
            toast.success(`${draft.name} added`);
          }
          setIsNewOpen(false);
          setEditingId(null);
        }}
      />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Mentor actions menu
// ---------------------------------------------------------------------------

function MentorActionsMenu({
  mentor, onView, onEdit, onMessage, onToggleStatus, onDelete,
}: {
  mentor: MentorRow;
  onView: () => void;
  onEdit: () => void;
  onMessage: () => void;
  onToggleStatus: () => void;
  onDelete: () => void;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className={cn(
          "inline-flex items-center justify-center h-8 w-8 rounded-md",
          "text-muted-foreground hover:text-foreground hover:bg-muted transition-colors outline-none",
          "focus-visible:ring-2 focus-visible:ring-ring"
        )}
        aria-label={`Actions for ${mentor.name}`}
      >
        <MoreHorizontal className="w-4 h-4" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuItem onSelect={onView}>
          <Eye className="w-3.5 h-3.5" /> View profile
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={onEdit}>
          <Edit2 className="w-3.5 h-3.5" /> Edit
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={onMessage}>
          <MessageSquareIcon className="w-3.5 h-3.5" /> Message
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={onToggleStatus}>
          <Clock className="w-3.5 h-3.5" />
          {mentor.status === "Active" ? "Mark unavailable" : "Mark active"}
        </DropdownMenuItem>
        <DropdownMenuItem variant="destructive" onSelect={onDelete}>
          <Trash2 className="w-3.5 h-3.5" /> Remove mentor
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

// ---------------------------------------------------------------------------
// Mentor profile detail
// ---------------------------------------------------------------------------

function MentorDetailView({
  mentor, onBack, onEdit, onStatusChange,
}: {
  mentor: MentorRow;
  onBack: () => void;
  onEdit: () => void;
  onStatusChange: (s: MentorRow["status"]) => void;
}) {
  const [curLoad, maxCap] = mentor.capacity.split("/").map(Number);
  const availSlots = Math.max(0, (maxCap || 0) - (curLoad || 0));
  const aiSummary = `${mentor.name.split(" ").slice(-1)[0]} brings ${mentor.experience.toLowerCase()} experience with particular strength in ${mentor.strengths.slice(0, 2).join(" and ")}. Best suited for seekers seeking ${mentor.specialty.toLowerCase()}. Culturally fluent in ${mentor.languages}.`;
  const weeklySchedule = [
    { day: "Mon", slots: ["9:00 – 12:00"] },
    { day: "Tue", slots: [] },
    { day: "Wed", slots: ["14:00 – 17:00"] },
    { day: "Thu", slots: [] },
    { day: "Fri", slots: [] },
    { day: "Sat", slots: ["10:00 – 15:00"] },
    { day: "Sun", slots: [] },
  ];
  const activeMentees = [
    { name: "Abigail Johnson", maturity: "New Believer", maturityTone: "green" as const, engagement: 78, avatarTone: "purple" as const },
    { name: "David Kebede",    maturity: "Seeker",       maturityTone: "amber" as const, engagement: 58, avatarTone: "blue" as const },
    { name: "Miriam Tadesse",  maturity: "Interested",   maturityTone: "orange" as const, engagement: 30, avatarTone: "green" as const },
  ].slice(0, curLoad || 0);

  return (
    <div className="p-6 space-y-4">
      <button
        onClick={onBack}
        className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="w-4 h-4" /> Back to Mentors
      </button>

      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-xl font-bold shrink-0">
            {mentor.name.split(" ").map(n => n[0]).slice(0, 2).join("").toUpperCase()}
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-2xl font-bold text-foreground tracking-tight">{mentor.name}</h1>
              <Chip tone={mentor.statusTone}>{mentor.status}</Chip>
              <Chip tone="slate">{mentor.experience}</Chip>
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              <span>{mentor.email}</span>
              <span className="mx-2">·</span>
              <span>{mentor.gender === "female" ? "Female" : "Male"}</span>
              <span className="mx-2">·</span>
              <span>Joined {mentor.joined}</span>
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={() => toast.success(`Messaging ${mentor.name}`)}>
            <Send className="w-3.5 h-3.5" /> Message
          </Button>
          <Button variant="outline" onClick={onEdit}>
            <Edit2 className="w-3.5 h-3.5" /> Edit
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger className="inline-flex items-center justify-center h-9 w-9 rounded-md border border-border text-muted-foreground hover:bg-muted transition-colors">
              <MoreHorizontal className="w-4 h-4" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-44">
              <DropdownMenuLabel className="text-xs text-muted-foreground">Change status</DropdownMenuLabel>
              <DropdownMenuRadioGroup value={mentor.status} onValueChange={(v) => onStatusChange(v as MentorRow["status"])}>
                {MENTOR_STATUSES.map(s => (
                  <DropdownMenuRadioItem key={s} value={s}>{s}</DropdownMenuRadioItem>
                ))}
              </DropdownMenuRadioGroup>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard label="Active Mentees" value={curLoad || 0}          subtitle={`of ${maxCap || 0} capacity`} icon={Users}        tone="blue" />
        <StatCard label="Available Slots" value={availSlots}           subtitle={`${Math.round(mentor.load)}% load`}             icon={Activity}     tone="green" />
        <StatCard label="Completed"       value={12}                   subtitle="seekers graduated"                              icon={CheckCircle2} tone="purple" />
        <StatCard label="Avg. Response"   value="2.4h"                 subtitle="rolling 30 days"                                icon={Clock}        tone="amber" />
      </div>

      {/* Body: bio + expertise + availability on left, AI summary + mentees on right */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr,360px] gap-4">
        <div className="space-y-4">
          <div className="bg-card border border-border rounded-xl p-5">
            <h3 className="text-base font-bold text-foreground mb-2">Bio</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">{mentor.bio}</p>
          </div>

          <div className="bg-card border border-border rounded-xl p-5 space-y-4">
            <h3 className="text-base font-bold text-foreground">Expertise</h3>
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">Specialty areas</p>
              <div className="flex items-center gap-1.5 flex-wrap">
                {mentor.specialty.split(",").map(s => <Chip key={s} tone="blue">{s.trim()}</Chip>)}
              </div>
            </div>
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">Strengths</p>
              <div className="flex items-center gap-1.5 flex-wrap">
                {mentor.strengths.map(s => <Chip key={s} tone="purple">{s}</Chip>)}
              </div>
            </div>
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">Languages</p>
              <div className="flex items-center gap-1.5 flex-wrap">
                {mentor.languages.split(",").map(l => {
                  const code = l.trim();
                  const label = ALL_LANGUAGES.find(x => x.code === code)?.label ?? code;
                  return <Chip key={code} tone="green">{label}</Chip>;
                })}
              </div>
            </div>
          </div>

          <div className="bg-card border border-border rounded-xl p-5">
            <h3 className="text-base font-bold text-foreground mb-4">Weekly availability</h3>
            <div className="grid grid-cols-7 gap-2">
              {weeklySchedule.map(d => (
                <div key={d.day} className="text-center">
                  <p className="text-xs font-semibold text-muted-foreground uppercase mb-1.5">{d.day}</p>
                  <div className={cn(
                    "rounded-md py-2 px-1 text-xs font-medium min-h-[56px] flex flex-col items-center justify-center gap-0.5",
                    d.slots.length > 0 ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
                  )}>
                    {d.slots.length > 0 ? d.slots.map(s => <span key={s}>{s}</span>) : <span>—</span>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="bg-card border border-border rounded-xl p-5">
            <div className="flex items-center gap-2 mb-3">
              <Sparkles className="w-4 h-4 text-violet-500" />
              <h3 className="text-base font-bold text-foreground">AI Profile Summary</h3>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">{aiSummary}</p>
            <p className="text-xs text-muted-foreground mt-3 italic">Used by the matching algorithm to pair with the right seekers.</p>
          </div>

          <div className="bg-card border border-border rounded-xl p-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-base font-bold text-foreground">Active Mentees</h3>
              <span className="text-xs font-semibold text-muted-foreground">{activeMentees.length}/{maxCap || 0}</span>
            </div>
            {activeMentees.length === 0 ? (
              <p className="text-sm text-muted-foreground">No active mentees right now.</p>
            ) : (
              <ul className="space-y-2">
                {activeMentees.map((am, i) => (
                  <li key={i} className="flex items-center gap-3">
                    <Avatar name={am.name} tone={am.avatarTone} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-foreground truncate">{am.name}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <Chip tone={am.maturityTone}>{am.maturity}</Chip>
                        <span className="text-xs text-muted-foreground">{am.engagement}% engaged</span>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Mentor form modal — 3-step onboarding (reused for edit)
// ---------------------------------------------------------------------------

const MENTOR_STEPS = [
  { id: 1, title: "Identity",     description: "Who is this mentor?" },
  { id: 2, title: "Expertise",    description: "Strengths, specialties, and languages." },
  { id: 3, title: "Availability", description: "Capacity and weekly schedule." },
];

function MentorFormModal({
  isOpen, initial, onClose, onSubmit,
}: {
  isOpen: boolean;
  initial?: MentorRow;
  onClose: () => void;
  onSubmit: (draft: Omit<MentorRow, "id">) => void;
}) {
  const isEdit = !!initial;
  const [step, setStep] = useState(1);

  const [name, setName]             = useState(initial?.name ?? "");
  const [email, setEmail]           = useState(initial?.email ?? "");
  const [gender, setGender]         = useState<MentorRow["gender"]>(initial?.gender ?? "female");
  const [experience, setExperience] = useState<MentorRow["experience"]>(initial?.experience ?? "Intermediate");
  const [bio, setBio]               = useState(initial?.bio ?? "");
  const [specialties, setSpecialties] = useState<string[]>(initial?.specialty ? initial.specialty.split(",").map(s => s.trim()) : []);
  const [strengths, setStrengths]     = useState<string[]>(initial?.strengths ?? []);
  const [languages, setLanguages]     = useState<string[]>(initial?.languages ? initial.languages.split(",").map(s => s.trim()) : ["EN"]);
  const [maxCap, setMaxCap]           = useState<number>(initial ? parseInt(initial.capacity.split("/")[1], 10) : 5);

  const toggle = <T extends string>(list: T[], setList: (v: T[]) => void, v: T) =>
    setList(list.includes(v) ? list.filter(x => x !== v) : [...list, v]);

  const canAdvance =
    step === 1 ? name.trim().length > 0 && email.trim().length > 0 :
    step === 2 ? specialties.length > 0 && strengths.length > 0 && languages.length > 0 :
    maxCap > 0;

  const handleClose = () => { setStep(1); onClose(); };

  const handleSubmit = () => {
    const curLoad = initial ? parseInt(initial.capacity.split("/")[0], 10) : 0;
    const load = maxCap > 0 ? Math.round((curLoad / maxCap) * 100) : 0;
    const draft: Omit<MentorRow, "id"> = {
      name: name.trim(),
      email: email.trim(),
      specialty: specialties.join(", "),
      languages: languages.join(", "),
      capacity: `${curLoad}/${maxCap}`,
      load,
      status: initial?.status ?? "Active",
      statusTone: initial?.statusTone ?? "green",
      avatarTone: initial?.avatarTone ?? "blue",
      experience,
      gender,
      strengths,
      bio: bio.trim(),
      joined: initial?.joined ?? new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
    };
    onSubmit(draft);
    setStep(1);
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title={isEdit ? `Edit ${initial?.name}` : "New Mentor"} size="lg">
      <div className="space-y-5">
        {/* Progress */}
        <div className="flex items-center gap-2">
          {MENTOR_STEPS.map((s, i) => {
            const isDone   = step > s.id;
            const isActive = step === s.id;
            return (
              <div key={s.id} className="flex items-center gap-2 flex-1">
                <div className="flex items-center gap-2 flex-1">
                  <div className={cn(
                    "w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 border",
                    isDone ? "bg-primary border-primary text-primary-foreground"
                      : isActive ? "bg-primary/10 border-primary text-primary"
                      : "bg-muted border-border text-muted-foreground"
                  )}>
                    {isDone ? <CheckCircle2 className="w-3.5 h-3.5" /> : s.id}
                  </div>
                  <p className={cn("text-xs font-semibold hidden sm:block truncate", isActive || isDone ? "text-foreground" : "text-muted-foreground")}>{s.title}</p>
                </div>
                {i < MENTOR_STEPS.length - 1 && <div className={cn("h-px flex-1 min-w-[12px]", isDone ? "bg-primary" : "bg-border")} />}
              </div>
            );
          })}
        </div>

        <div>
          <h3 className="text-base font-bold text-foreground">{MENTOR_STEPS[step - 1].title}</h3>
          <p className="text-xs text-muted-foreground mt-0.5">{MENTOR_STEPS[step - 1].description}</p>
        </div>

        {step === 1 && (
          <div className="space-y-4">
            <div className="grid gap-1.5">
              <Label className="text-xs font-semibold">Full name <span className="text-destructive">*</span></Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Pastor James Kalu" />
            </div>
            <div className="grid gap-1.5">
              <Label className="text-xs font-semibold">Email <span className="text-destructive">*</span></Label>
              <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="james@example.com" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-1.5">
                <Label className="text-xs font-semibold">Gender</Label>
                <div className="flex items-center gap-1 bg-muted/60 rounded-md p-0.5 w-fit">
                  {(["female", "male"] as const).map(g => (
                    <button
                      key={g}
                      onClick={() => setGender(g)}
                      className={cn(
                        "px-3 py-1.5 text-xs font-semibold rounded transition-all capitalize",
                        gender === g ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                      )}
                    >{g}</button>
                  ))}
                </div>
              </div>
              <div className="grid gap-1.5">
                <Label className="text-xs font-semibold">Experience level</Label>
                <div className="grid grid-cols-2 gap-1.5">
                  {EXPERIENCE_LEVELS.map(lvl => (
                    <button
                      key={lvl}
                      onClick={() => setExperience(lvl)}
                      className={cn(
                        "px-2.5 py-1.5 text-xs font-semibold rounded-md border transition-all",
                        experience === lvl ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:bg-muted/50"
                      )}
                    >{lvl}</button>
                  ))}
                </div>
              </div>
            </div>
            <div className="grid gap-1.5">
              <Label className="text-xs font-semibold">Bio</Label>
              <Textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="A short description shown on the mentor's profile."
                className="min-h-[80px] text-sm"
              />
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <div className="grid gap-2">
              <Label className="text-xs font-semibold">Specialty areas <span className="text-destructive">*</span></Label>
              <div className="flex flex-wrap gap-1.5">
                {ALL_SPECIALTIES.map(s => {
                  const isOn = specialties.includes(s);
                  return (
                    <button
                      key={s}
                      type="button"
                      onClick={() => toggle(specialties, setSpecialties, s)}
                      className={cn(
                        "px-3 py-1.5 rounded-full text-xs font-semibold border transition-all",
                        isOn ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:bg-muted/50"
                      )}
                    >
                      {isOn && <CheckCircle2 className="inline w-3 h-3 mr-1" />}
                      {s}
                    </button>
                  );
                })}
              </div>
            </div>
            <div className="grid gap-2">
              <Label className="text-xs font-semibold">Strengths <span className="text-destructive">*</span></Label>
              <div className="flex flex-wrap gap-1.5">
                {ALL_STRENGTHS.map(s => {
                  const isOn = strengths.includes(s);
                  return (
                    <button
                      key={s}
                      type="button"
                      onClick={() => toggle(strengths, setStrengths, s)}
                      className={cn(
                        "px-3 py-1.5 rounded-full text-xs font-semibold border transition-all",
                        isOn ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:bg-muted/50"
                      )}
                    >
                      {isOn && <CheckCircle2 className="inline w-3 h-3 mr-1" />}
                      {s}
                    </button>
                  );
                })}
              </div>
            </div>
            <div className="grid gap-2">
              <Label className="text-xs font-semibold">Languages <span className="text-destructive">*</span></Label>
              <div className="flex flex-wrap gap-1.5">
                {ALL_LANGUAGES.map(l => {
                  const isOn = languages.includes(l.code);
                  return (
                    <button
                      key={l.code}
                      type="button"
                      onClick={() => toggle(languages, setLanguages, l.code)}
                      className={cn(
                        "px-3 py-1.5 rounded-full text-xs font-semibold border transition-all",
                        isOn ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:bg-muted/50"
                      )}
                    >
                      {isOn && <CheckCircle2 className="inline w-3 h-3 mr-1" />}
                      {l.label}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4">
            <div className="grid gap-1.5">
              <Label className="text-xs font-semibold">Maximum mentees (capacity) <span className="text-destructive">*</span></Label>
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  min={1}
                  max={20}
                  value={maxCap}
                  onChange={(e) => setMaxCap(Math.max(1, parseInt(e.target.value || "1", 10)))}
                  className="w-28 h-10"
                />
                <span className="text-xs text-muted-foreground">Mentors at capacity are excluded from new matches.</span>
              </div>
            </div>
            <div className="rounded-md bg-muted/40 border border-border p-4 text-sm text-muted-foreground">
              <p className="font-semibold text-foreground mb-1">Weekly schedule</p>
              <p>The mentor can edit their own weekly time slots from their profile. This form just creates the mentor; the schedule is filled in afterwards.</p>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between gap-2 pt-3 border-t border-border">
          <Button
            variant="outline"
            size="sm"
            onClick={() => (step === 1 ? handleClose() : setStep(step - 1))}
          >
            {step === 1 ? "Cancel" : <><ArrowLeft className="w-3.5 h-3.5" /> Back</>}
          </Button>
          {step < MENTOR_STEPS.length ? (
            <Button size="sm" disabled={!canAdvance} onClick={() => setStep(step + 1)}>Continue</Button>
          ) : (
            <Button size="sm" disabled={!canAdvance} onClick={handleSubmit}>
              {isEdit ? "Save changes" : <><Plus className="w-3.5 h-3.5" /> Add mentor</>}
            </Button>
          )}
        </div>
      </div>
    </Modal>
  );
}

// ============================================================================
// MATCHES
// ============================================================================

const MATCHES = [
  { id: "mt1", score: 94, scoreTone: "green" as const, seeker: "Abigail Johnson", mentor: "Pastor James K.",  factors: [["Lang", 95, "green"], ["Interests", 88, "blue"]], status: "Proposed", statusTone: "amber" as const },
  { id: "mt2", score: 87, scoreTone: "green" as const, seeker: "David Kebede",    mentor: "Mentor Daniel M.", factors: [["Age", 92, "green"], ["Location", 85, "blue"]],  status: "Proposed", statusTone: "amber" as const },
  { id: "mt3", score: 72, scoreTone: "amber" as const, seeker: "Miriam Tadesse",  mentor: "Sister Ruth B.",   factors: [["Gender", 100, "red"], ["Lang", 70, "amber"]], status: "Accepted", statusTone: "green" as const },
];

export function MatchesView() {
  return (
    <div className="p-6 space-y-4">
      <PageHeader
        title="AI Match Proposals"
        subtitle="Review and approve AI-suggested mentor-seeker matches"
        actions={(
          <>
            <button className="flex items-center gap-1.5 px-4 py-2 text-sm font-semibold bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-all shadow-sm">
              <Sparkles className="w-4 h-4" /> Run Auto-Match
            </button>
            <button className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium bg-card border border-border rounded-md hover:bg-muted/50 transition-all">
              <Filter className="w-3.5 h-3.5" /> Filter
            </button>
          </>
        )}
      />

      <div className="bg-card border border-border rounded-lg overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="bg-muted/40 border-b border-border text-xs uppercase tracking-wider text-muted-foreground">
              <th className="px-4 py-3 text-left font-semibold w-20">Score</th>
              <th className="px-4 py-3 text-left font-semibold">Seeker</th>
              <th className="px-4 py-3 text-left font-semibold">Suggested Mentor</th>
              <th className="px-4 py-3 text-left font-semibold">Match Factors</th>
              <th className="px-4 py-3 text-left font-semibold">Status</th>
              <th className="px-4 py-3 text-right font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody>
            {MATCHES.map(m => (
              <tr key={m.id} className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors">
                <td className="px-4 py-3">
                  <span className={cn(
                    "inline-flex items-center justify-center w-10 h-8 rounded-full text-sm font-bold",
                    m.scoreTone === "green" ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"
                  )}>{m.score}</span>
                </td>
                <td className="px-4 py-3 text-sm font-medium text-foreground">{m.seeker}</td>
                <td className="px-4 py-3 text-sm text-foreground">{m.mentor}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {m.factors.map(([k, v, tone]: any, i: number) => (
                      <Chip key={i} tone={tone}>{k} {v}%</Chip>
                    ))}
                  </div>
                </td>
                <td className="px-4 py-3"><Chip tone={m.statusTone}>{m.status}</Chip></td>
                <td className="px-4 py-3 text-right">
                  {m.status === "Proposed" ? (
                    <div className="flex items-center justify-end gap-2">
                      <button className="px-3 py-1.5 text-xs font-semibold bg-emerald-500 text-white rounded hover:bg-emerald-600 transition-all">Accept</button>
                      <button className="px-3 py-1.5 text-xs font-semibold bg-card border border-border rounded hover:bg-muted/50 transition-all">Reject</button>
                    </div>
                  ) : (
                    <span className="text-xs text-muted-foreground">Matched</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="bg-violet-50/50 border border-violet-200 rounded-lg p-4">
        <div className="flex items-center gap-2 mb-2">
          <Sparkles className="w-4 h-4 text-violet-600" />
          <span className="text-sm font-semibold text-violet-900">AI Match Reasoning</span>
        </div>
        <p className="text-sm text-slate-700 leading-relaxed">
          Abigail shares strong language alignment (English, 95%) and interest overlap (Prayer, Bible Study) with Pastor James.
          Both are in the same timezone and James has capacity for 2 more seekers. Confidence: High.
        </p>
      </div>
    </div>
  );
}

// ============================================================================
// FAITH JOURNEYS (Pipeline + Milestones combined)
// ============================================================================

const PIPELINE_COLS = [
  { key: "touchpoint", label: "Touchpoint",   dot: "bg-slate-400",   count: 86,
    cards: [
      { name: "Sara Ahmed",   source: "Telegram Bot",  stage: "Bot",         indicators: 1, total: 7, tone: "slate" as const,  avatarTone: "rose" as const },
      { name: "Tadesse M.",   source: "WhatsApp",      stage: "Conversation",indicators: 2, total: 7, tone: "green" as const,  avatarTone: "blue" as const },
    ]
  },
  { key: "engaged",    label: "Engaged",      dot: "bg-amber-500",   count: 124,
    cards: [
      { name: "Abigail Johnson", source: "Self-guided",  stage: "Self-guided",  indicators: 4, total: 7, tone: "amber" as const, avatarTone: "purple" as const },
      { name: "David Kebede",    source: "Conversation", stage: "Conversation", indicators: 3, total: 7, tone: "green" as const, avatarTone: "rose" as const },
    ]
  },
  { key: "active",     label: "Active Journey", dot: "bg-blue-500",  count: 67,
    cards: [
      { name: "Miriam Haile",   source: "Conversation", stage: "Conversation", indicators: 6, total: 7, tone: "green" as const, avatarTone: "amber" as const },
    ]
  },
  { key: "decision",   label: "Decision",     dot: "bg-emerald-500", count: 89,
    cards: [
      { name: "Samuel B.",      source: "Self-guided",  stage: "Confirmed Decision", indicators: 7, total: 7, tone: "green" as const, avatarTone: "green" as const },
    ]
  },
];

export function FaithJourneysView() {
  const [tab, setTab] = useState<"pipeline" | "milestones" | "list">("pipeline");
  return (
    <div className="p-6 space-y-4">
      <PageHeader
        title="Faith Journey Pipeline"
        subtitle="Track new faith journeys and their progression through indicators"
        actions={(
          <>
            <FilterButton label="Q1 2026" />
            <button className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium bg-card border border-border rounded-md hover:bg-muted/50 transition-all">
              <Download className="w-3.5 h-3.5" /> Export
            </button>
            <button className="flex items-center gap-1.5 px-4 py-2 text-sm font-semibold bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-all shadow-sm">
              <Plus className="w-4 h-4" /> New Journey
            </button>
          </>
        )}
      />

      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
        <StatCard label="New Faith Journeys" value={342}   change="+18% this quarter"   icon={TrendingUp} tone="blue"   />
        <StatCard label="Active Journeys"    value="1,247" subtitle="across 5 platforms" icon={Activity}   tone="purple" />
        <StatCard label="Milestone Reached"  value={89}    subtitle="decisions this month" icon={CheckCircle2} tone="green" />
        <StatCard label="Avg. Indicators Met" value="4.2 / 7" change="+0.6 from last quarter" icon={Star} tone="amber" />
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 border-b border-border">
        {([
          ["pipeline",   "Pipeline"],
          ["milestones", "Spiritual Milestones"],
          ["list",       "All Journeys"],
        ] as const).map(([k, label]) => (
          <button
            key={k}
            onClick={() => setTab(k)}
            className={cn(
              "px-4 py-2.5 text-sm font-semibold border-b-2 transition-all",
              tab === k ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"
            )}
          >{label}</button>
        ))}
      </div>

      {tab === "pipeline" && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {PIPELINE_COLS.map(col => (
            <div key={col.key} className="bg-card border border-border rounded-lg p-3 min-h-[340px]">
              <div className="flex items-center justify-between mb-3 px-1">
                <div className="flex items-center gap-2">
                  <span className={cn("w-2.5 h-2.5 rounded-full", col.dot)} />
                  <span className="text-sm font-semibold text-foreground">{col.label}</span>
                </div>
                <span className="text-xs font-semibold text-muted-foreground">{col.count}</span>
              </div>
              <div className="space-y-2">
                {col.cards.map((c, i) => (
                  <div key={i} className="bg-background border border-border rounded-md p-3 hover:border-foreground/10 transition-all cursor-pointer">
                    <div className="flex items-center gap-2.5 mb-2">
                      <Avatar name={c.name} tone={c.avatarTone} />
                      <div className="min-w-0">
                        <div className="text-sm font-semibold text-foreground truncate">{c.name}</div>
                        <div className="text-xs text-muted-foreground truncate">{c.source}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 mb-2">
                      {Array.from({ length: c.total }).map((_, idx) => (
                        <div key={idx} className={cn("h-1.5 flex-1 rounded-full", idx < c.indicators ? (c.tone === "green" ? "bg-emerald-500" : c.tone === "amber" ? "bg-amber-500" : "bg-blue-500") : "bg-muted")} />
                      ))}
                    </div>
                    <div className="flex items-center justify-between">
                      <Chip tone={c.tone}>{c.stage}</Chip>
                      <span className="text-xs text-muted-foreground">{c.indicators}/{c.total} indicators</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === "milestones" && <MilestonesInner />}
      {tab === "list" && <JourneyListInner />}
    </div>
  );
}

// Standalone Milestones page (also reachable as a tab inside Faith Journeys)
export function MilestonesView() {
  const handleExport = () => {
    // Build a CSV from the same data shown in the cards.
    const rows = [
      ["Person", "Journey Type", "Started", "Language", "State", "Indicators", "Milestone", "Status", "Date / Note"],
      ["Abigail Johnson", "Self-guided Journey", "Jan 12, 2026", "English", "Active Journey", "6/7", "Salvation Decision", "Confirmed",   "Feb 3, 2026 — Confirmed by Pastor James K."],
      ["Abigail Johnson", "Self-guided Journey", "Jan 12, 2026", "English", "Active Journey", "6/7", "Baptism",            "Confirmed",   "Mar 15, 2026 — Public statement of faith"],
      ["Abigail Johnson", "Self-guided Journey", "Jan 12, 2026", "English", "Active Journey", "6/7", "Community",          "In Progress", "Referred to local fellowship — awaiting confirmation"],
      ["Abigail Johnson", "Self-guided Journey", "Jan 12, 2026", "English", "Active Journey", "6/7", "Growth Evidence",    "Not Started", "Prayer 0/7; Bible 0/7; Contribution not started"],
      ["David Kebede",    "Conversation-based",  "Feb 28, 2026", "Amharic", "Engaged",        "3/7", "Salvation",          "In Progress", "Indicated only — awaiting confirmation"],
      ["David Kebede",    "Conversation-based",  "Feb 28, 2026", "Amharic", "Engaged",        "3/7", "Baptism",            "Not Started", "—"],
      ["David Kebede",    "Conversation-based",  "Feb 28, 2026", "Amharic", "Engaged",        "3/7", "Community",          "Not Started", "—"],
      ["David Kebede",    "Conversation-based",  "Feb 28, 2026", "Amharic", "Engaged",        "3/7", "Growth",             "Not Started", "—"],
    ];
    const csv = rows
      .map(r => r.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(","))
      .join("\n");
    try {
      const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      const today = new Date().toISOString().split("T")[0];
      a.href = url;
      a.download = `spiritual-milestones-${today}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch {
      // No-op: browsers in unusual environments may block the download.
    }
  };

  return (
    <div className="p-6 space-y-4">
      <PageHeader
        title="Spiritual Milestones"
        subtitle="Track salvation decisions, baptism, and community connection for each person"
        actions={(
          <>
            <button className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium bg-card border border-border rounded-md hover:bg-muted/50 transition-all">
              <Filter className="w-3.5 h-3.5" /> Filter
            </button>
            <button
              onClick={handleExport}
              className="flex items-center gap-1.5 px-4 py-2 text-sm font-semibold bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-all shadow-sm"
            >
              <Download className="w-4 h-4" /> Export Report
            </button>
          </>
        )}
      />
      <MilestonesInner />
    </div>
  );
}

function MilestonesInner() {
  const people = [
    {
      name: "Abigail Johnson", type: "Self-guided Journey", started: "Jan 12, 2026", lang: "English",
      state: "Active Journey", stateTone: "green" as const, indicators: "6/7 Indicators", avatarTone: "purple" as const,
      milestones: [
        { key: "salvation", label: "Salvation Decision", date: "Feb 3, 2026", state: "done", sub: ["Indicated decision (self-reported)", "Confirmed by Pastor James K."] },
        { key: "baptism",   label: "Baptism",            date: "Mar 15, 2026", state: "done", sub: ["Public statement of faith confirmed"] },
        { key: "community", label: "Community",          date: "In Progress",  state: "progress", sub: ["Referred to local fellowship", "Awaiting connection confirmation"] },
        { key: "growth",    label: "Growth Evidence",    date: "Not Started",  state: "pending", sub: ["Prayer (0/7 days)", "Bible engagement (0/7 days)", "Contribution / Serving"] },
      ]
    },
    {
      name: "David Kebede", type: "Conversation-based", started: "Feb 28, 2026", lang: "Amharic",
      state: "Engaged", stateTone: "amber" as const, indicators: "3/7 Indicators", avatarTone: "rose" as const,
      milestones: [
        { key: "salvation", label: "Salvation", date: "Indicated only — awaiting confirmation", state: "progress", sub: [] },
        { key: "baptism",   label: "Baptism",   date: "Not yet", state: "pending", sub: [] },
        { key: "community", label: "Community", date: "Not yet", state: "pending", sub: [] },
        { key: "growth",    label: "Growth",    date: "Not yet", state: "pending", sub: [] },
      ]
    },
  ];
  const stateClass = (s: string) => s === "done"
    ? "bg-emerald-50 border-emerald-200"
    : s === "progress" ? "bg-amber-50 border-amber-200" : "bg-muted/30 border-border";
  const stateIcon = (s: string) => s === "done"
    ? <CheckCircle2 className="w-4 h-4 text-emerald-600" />
    : s === "progress" ? <Clock className="w-4 h-4 text-amber-600" /> : <div className="w-4 h-4 rounded-full border-2 border-muted-foreground/30" />;

  return (
    <div className="space-y-4">
      {people.map((p, pi) => (
        <div key={pi} className="bg-card border border-border rounded-lg p-4">
          <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
            <div className="flex items-center gap-3">
              <Avatar name={p.name} tone={p.avatarTone} />
              <div>
                <div className="text-sm font-bold text-foreground">{p.name}</div>
                <div className="text-xs text-muted-foreground">{p.type} · Started: {p.started} · {p.lang}</div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Chip tone={p.stateTone}>{p.state}</Chip>
              <span className="text-xs text-muted-foreground font-medium">{p.indicators}</span>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            {p.milestones.map(m => (
              <div key={m.key} className={cn("border rounded-lg p-3", stateClass(m.state))}>
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2">
                    {stateIcon(m.state)}
                    <span className="text-sm font-semibold text-foreground">{m.label}</span>
                  </div>
                  {m.date.includes(",") ? (
                    <span className="text-xs text-muted-foreground">{m.date}</span>
                  ) : null}
                </div>
                {!m.date.includes(",") && <div className="text-xs text-muted-foreground mb-1">{m.date}</div>}
                <ul className="text-xs text-muted-foreground space-y-1 mt-1">
                  {m.sub.map((s, si) => <li key={si} className="flex items-start gap-1.5"><span className="w-1 h-1 rounded-full bg-muted-foreground/60 mt-1.5" />{s}</li>)}
                </ul>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function JourneyListInner() {
  const rows = [
    { name: "Fatima A.",  source: "Telegram",  type: "Salvation",  stage: "Decision", stageTone: "green" as const, indicators: 5, total: 7, milestone: "Salvation Decision",  validation: "Pending",   validationTone: "amber" as const, avatarTone: "rose" as const },
    { name: "Daniel M.",  source: "WhatsApp",  type: "Baptism",    stage: "Active",   stageTone: "amber" as const, indicators: 3, total: 7, milestone: "Baptism Request",     validation: "Pending",   validationTone: "amber" as const, avatarTone: "blue" as const },
    { name: "Sara K.",    source: "Self-guided", type: "Salvation", stage: "Engaged",  stageTone: "blue" as const,  indicators: 4, total: 7, milestone: "Bible Study Started", validation: "Confirmed", validationTone: "green" as const, avatarTone: "green" as const },
    { name: "Tesfaye W.", source: "Messenger", type: "Community",  stage: "Touchpoint", stageTone: "slate" as const, indicators: 1, total: 7, milestone: "First Contact",      validation: "N/A",      validationTone: "slate" as const, avatarTone: "purple" as const },
  ];
  return (
    <div className="bg-card border border-border rounded-lg overflow-hidden">
      <table className="w-full">
        <thead>
          <tr className="bg-muted/40 border-b border-border text-xs uppercase tracking-wider text-muted-foreground">
            <th className="px-4 py-3 text-left font-semibold">Person</th>
            <th className="px-4 py-3 text-left font-semibold">Journey Type</th>
            <th className="px-4 py-3 text-left font-semibold">Stage</th>
            <th className="px-4 py-3 text-left font-semibold">Indicators</th>
            <th className="px-4 py-3 text-left font-semibold">Last Milestone</th>
            <th className="px-4 py-3 text-left font-semibold">Validation</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i} className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors">
              <td className="px-4 py-3">
                <div className="flex items-center gap-3">
                  <Avatar name={r.name} tone={r.avatarTone} />
                  <div>
                    <div className="text-sm font-semibold text-foreground">{r.name}</div>
                    <div className="text-xs text-muted-foreground">{r.source}</div>
                  </div>
                </div>
              </td>
              <td className="px-4 py-3"><Chip tone={r.type === "Salvation" ? "green" : r.type === "Baptism" ? "blue" : "purple"}>{r.type}</Chip></td>
              <td className="px-4 py-3"><Chip tone={r.stageTone}>{r.stage}</Chip></td>
              <td className="px-4 py-3">
                <div className="flex items-center gap-1">
                  {Array.from({ length: r.total }).map((_, idx) => (
                    <div key={idx} className={cn("w-2 h-2 rounded-full", idx < r.indicators ? "bg-emerald-500" : "bg-muted")} />
                  ))}
                  <span className="ml-2 text-xs text-muted-foreground">{r.indicators}/{r.total}</span>
                </div>
              </td>
              <td className="px-4 py-3 text-sm text-foreground">{r.milestone}</td>
              <td className="px-4 py-3"><Chip tone={r.validationTone}>{r.validation}</Chip></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ============================================================================
// CONTENT LIBRARY
// ============================================================================

const CONTENT = [
  { title: "Welcome to Your Faith Journey",         type: "Devotional",   typeTone: "pink"   as const, category: "Salvation",    difficulty: "Beginner",     lang: "English", status: "Published", statusTone: "green" as const },
  { title: "Finding Peace in His Presence",         type: "Study",        typeTone: "blue"   as const, category: "Prayer",       difficulty: "Intermediate", lang: "English", status: "Published", statusTone: "green" as const },
  { title: "Understanding the Holy Spirit",         type: "Guide",        typeTone: "purple" as const, category: "Holy Spirit",  difficulty: "Advanced",     lang: "Amharic", status: "Draft",     statusTone: "amber" as const },
  { title: "Understanding the Bible: A Beginner's Guide", type: "Bible Study",  typeTone: "blue" as const, category: "Bible Basics", difficulty: "Beginner", lang: "English", status: "Published", statusTone: "green" as const },
  { title: "Daily Prayer Practice",                 type: "Prayer Guide", typeTone: "pink" as const,   category: "Prayer",       difficulty: "Beginner",     lang: "English", status: "Published", statusTone: "green" as const },
  { title: "7-Day Worship Challenge",               type: "Challenge",    typeTone: "amber" as const,  category: "Worship",      difficulty: "Beginner",     lang: "English", status: "Published", statusTone: "green" as const },
];

export function ContentLibraryView({ canEdit = true }: { canEdit?: boolean }) {
  return (
    <div className="p-6 space-y-4">
      <PageHeader
        title="Content Library"
        subtitle="Manage devotionals, studies, and resources for automations"
        actions={canEdit && (
          <>
            <button className="flex items-center gap-1.5 px-4 py-2 text-sm font-semibold bg-violet-50 text-violet-700 rounded-md hover:bg-violet-100 transition-all">
              <Sparkles className="w-4 h-4" /> AI Generate
            </button>
            <button className="flex items-center gap-1.5 px-4 py-2 text-sm font-semibold bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-all shadow-sm">
              <Plus className="w-4 h-4" /> Add Content
            </button>
          </>
        )}
      />

      <div className="flex items-center gap-2 flex-wrap">
        <FilterButton label="All Types" />
        <FilterButton label="Category" />
        <FilterButton label="Difficulty" />
        <FilterButton label="Language" />
      </div>

      <div className="bg-card border border-border rounded-lg overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="bg-muted/40 border-b border-border text-xs uppercase tracking-wider text-muted-foreground">
              <th className="px-4 py-3 text-left font-semibold">Title</th>
              <th className="px-4 py-3 text-left font-semibold">Type</th>
              <th className="px-4 py-3 text-left font-semibold">Category</th>
              <th className="px-4 py-3 text-left font-semibold">Difficulty</th>
              <th className="px-4 py-3 text-left font-semibold">Language</th>
              <th className="px-4 py-3 text-left font-semibold">Status</th>
            </tr>
          </thead>
          <tbody>
            {CONTENT.map((c, i) => (
              <tr key={i} className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors cursor-pointer">
                <td className="px-4 py-3 text-sm font-medium text-foreground">{c.title}</td>
                <td className="px-4 py-3"><Chip tone={c.typeTone}>{c.type}</Chip></td>
                <td className="px-4 py-3 text-sm text-muted-foreground">{c.category}</td>
                <td className="px-4 py-3 text-sm text-muted-foreground">{c.difficulty}</td>
                <td className="px-4 py-3 text-sm text-muted-foreground">{c.lang}</td>
                <td className="px-4 py-3"><Chip tone={c.statusTone}>{c.status}</Chip></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ============================================================================
// GROWTH METRICS
// ============================================================================

export function GrowthMetricsView() {
  const growers = [
    { name: "Abigail J.", prayer: "6/7", bible: "5/7", serve: "Weekly",  avatarTone: "purple" as const },
    { name: "Samuel B.",  prayer: "7/7", bible: "6/7", serve: "Daily",   avatarTone: "green" as const },
    { name: "David K.",   prayer: "3/7", bible: "2/7", serve: "Monthly", avatarTone: "rose" as const },
    { name: "Miriam H.",  prayer: "5/7", bible: "4/7", serve: "Weekly",  avatarTone: "amber" as const },
  ];
  return (
    <div className="p-6 space-y-4">
      <PageHeader
        title="Growth Metrics"
        subtitle="Track prayer, Bible engagement, contribution, and spiritual fruit across all journeys"
        actions={(
          <>
            <FilterButton label="Last 30 Days" />
            <button className="flex items-center gap-1.5 px-4 py-2 text-sm font-semibold bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-all shadow-sm">
              <Download className="w-4 h-4" /> Export
            </button>
          </>
        )}
      />

      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
        <StatCard label="Prayer"           value="4.3 days/week" change="+0.8 from last month"  icon={Heart}      tone="pink" />
        <StatCard label="Bible Engagement" value="3.7 days/week" change="+1.2 from last month"  icon={BookOpen}   tone="blue" />
        <StatCard label="Contribution"     value="Weekly"        subtitle="62% participate weekly" icon={HandHeart} tone="amber" />
        <StatCard label="Fruit of the Spirit" value="38 testimonies" change="+12 this month"    icon={Star}       tone="purple" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-card border border-border rounded-lg p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-foreground">Weekly Engagement Trend</h3>
            <div className="flex items-center gap-3 text-xs">
              <LegendDot color="bg-violet-500" label="Prayer" />
              <LegendDot color="bg-blue-500"   label="Bible" />
              <LegendDot color="bg-amber-500"  label="Contribution" />
            </div>
          </div>
          <div className="flex items-end justify-around gap-6 h-52 px-4">
            {[[85, 70, 55], [90, 75, 50], [78, 82, 60], [92, 80, 65]].map((vals, wi) => (
              <div key={wi} className="flex items-end gap-1.5 h-full">
                <div className="w-6 bg-violet-500 rounded-t-md" style={{ height: `${vals[0]}%` }} />
                <div className="w-6 bg-blue-500 rounded-t-md"   style={{ height: `${vals[1]}%` }} />
                <div className="w-6 bg-amber-500 rounded-t-md"  style={{ height: `${vals[2]}%` }} />
              </div>
            ))}
          </div>
          <div className="flex items-center justify-around mt-3">
            {["Week 1", "Week 2", "Week 3", "Week 4"].map(w => <span key={w} className="text-xs text-muted-foreground font-medium">{w}</span>)}
          </div>
        </div>

        <div className="bg-card border border-border rounded-lg p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-foreground">Individual Growth Tracking</h3>
            <span className="text-xs font-semibold text-muted-foreground">Top Growers</span>
          </div>
          <div className="border-b border-border pb-2 mb-2 grid grid-cols-4 gap-2 text-xs uppercase tracking-wider text-muted-foreground">
            <span>Person</span><span>Prayer</span><span>Bible</span><span>Serve</span>
          </div>
          <div className="space-y-2">
            {growers.map((g, i) => (
              <div key={i} className="grid grid-cols-4 gap-2 items-center py-1.5">
                <div className="flex items-center gap-2">
                  <Avatar name={g.name} tone={g.avatarTone} />
                  <span className="text-sm font-medium text-foreground truncate">{g.name}</span>
                </div>
                <span className="text-sm text-violet-600 font-semibold">{g.prayer}</span>
                <span className="text-sm text-blue-600 font-semibold">{g.bible}</span>
                <span className="text-sm text-amber-600 font-semibold">{g.serve}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function LegendDot({ color, label }: { color: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className={cn("w-2 h-2 rounded-full", color)} />
      <span className="text-muted-foreground">{label}</span>
    </span>
  );
}

// ============================================================================
// VITAL ANALYTICS
// ============================================================================

export function VitalAnalyticsView() {
  const funnel = [
    { key: "V", label: "V — Volume",      value: "12,450", hint: "Touchpoints",      color: "bg-blue-500"   },
    { key: "I", label: "I — Interaction", value: "3,820",  hint: "Engaged back",     color: "bg-violet-500" },
    { key: "T", label: "T — Transaction", value: "1,247",  hint: "Faith Journey started", color: "bg-pink-500"   },
    { key: "A", label: "A — Active",      value: "342",    hint: "Active journeys",  color: "bg-amber-500"  },
    { key: "L", label: "L — Loyal",       value: "89",     hint: "Decision + connected", color: "bg-emerald-500" },
  ];
  const conversions = [
    { from: "V", to: "I", pct: "30.7%" },
    { from: "I", to: "T", pct: "32.6%" },
    { from: "T", to: "A", pct: "27.4%" },
    { from: "A", to: "L", pct: "26.0%" },
  ];
  return (
    <div className="p-6 space-y-4">
      <PageHeader
        title="VITAL Framework Analytics"
        subtitle="Volume → Interaction → Transaction → Active → Loyal — track progression from touchpoints to committed journeys"
        actions={(
          <>
            <FilterButton label="2026" />
            <button className="flex items-center gap-1.5 px-4 py-2 text-sm font-semibold bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-all shadow-sm">
              <Share2 className="w-4 h-4" /> Share Report
            </button>
          </>
        )}
      />

      <div className="bg-card border border-border rounded-lg p-5">
        <h3 className="text-sm font-bold text-foreground mb-4">VITAL Funnel — People Progression</h3>
        <div className="grid grid-cols-5 gap-2">
          {funnel.map(f => (
            <div key={f.key} className={cn("relative text-white rounded-lg p-4 flex flex-col items-center justify-center min-h-[110px]", f.color)}>
              <div className="text-3xl font-bold tracking-tight">{f.value}</div>
              <div className="text-xs font-semibold mt-1 opacity-95">{f.label}</div>
              <div className="text-xs opacity-80">{f.hint}</div>
            </div>
          ))}
        </div>
        <div className="grid grid-cols-4 gap-2 mt-3 px-8">
          {conversions.map((c, i) => (
            <div key={i} className="text-center">
              <div className="text-lg font-bold text-blue-600">{c.pct}</div>
              <div className="text-xs text-muted-foreground">{c.from} → {c.to}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-card border border-border rounded-lg p-5">
          <h3 className="text-sm font-bold text-foreground mb-3">Platform Breakdown</h3>
          <div className="space-y-2.5">
            {[
              { label: "Telegram",  value: "4,230", dot: "bg-blue-500" },
              { label: "WhatsApp",  value: "3,810", dot: "bg-emerald-500" },
              { label: "SMS",       value: "2,150", dot: "bg-violet-500" },
              { label: "Web",       value: "1,420", dot: "bg-amber-500" },
              { label: "Messenger", value: "840",   dot: "bg-pink-500" },
            ].map((p, i) => (
              <div key={i} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className={cn("w-2 h-2 rounded-full", p.dot)} />
                  <span className="text-sm text-foreground">{p.label}</span>
                </div>
                <span className="text-sm font-semibold text-foreground">{p.value}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-card border border-border rounded-lg p-5">
          <h3 className="text-sm font-bold text-foreground mb-3">Journey Type Distribution</h3>
          <div className="space-y-2.5">
            {[
              { chip: "Bot",          chipTone: "blue"  as const, label: "Self-guided bots",   value: "58%" },
              { chip: "Conversation", chipTone: "green" as const, label: "Human-led",          value: "30%" },
              { chip: "Self-guided",  chipTone: "amber" as const, label: "Web-based",          value: "12%" },
            ].map((p, i) => (
              <div key={i} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Chip tone={p.chipTone}>{p.chip}</Chip>
                  <span className="text-sm text-muted-foreground">{p.label}</span>
                </div>
                <span className="text-sm font-semibold text-foreground">{p.value}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-card border border-border rounded-lg p-5">
          <h3 className="text-sm font-bold text-foreground mb-3">Demographics</h3>
          <div className="space-y-2.5">
            {[
              { label: "Top Language", value: "Amharic (42%)" },
              { label: "Top Country",  value: "Ethiopia (68%)" },
              { label: "Gender Split", value: "54% F / 46% M" },
              { label: "Avg. Age",     value: "24 years" },
            ].map((p, i) => (
              <div key={i} className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">{p.label}</span>
                <span className="text-sm font-semibold text-foreground">{p.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// REPORTING (153 Collective)
// ============================================================================

export function ReportingView() {
  const [dim, setDim] = useState<"language" | "country" | "platform" | "gender" | "journey">("language");
  const rows = {
    language: [
      { label: "Amharic",     cols: ["144", "38", "29", "14"], pct: 26.4 },
      { label: "English",     cols: ["118", "31", "24", "11"], pct: 26.3 },
      { label: "Afaan Oromo", cols: ["80",  "20", "14", "8"],  pct: 25.0 },
    ],
    country: [
      { label: "Ethiopia",    cols: ["232", "62", "48", "23"], pct: 26.7 },
      { label: "Kenya",       cols: ["75",  "19", "14", "7"],  pct: 25.3 },
      { label: "Other",       cols: ["35",  "8",  "5",  "3"],  pct: 22.8 },
    ],
    platform: [
      { label: "Telegram",    cols: ["142", "36", "28", "14"], pct: 25.3 },
      { label: "WhatsApp",    cols: ["128", "35", "25", "12"], pct: 27.3 },
      { label: "SMS",         cols: ["72",  "18", "12", "6"],  pct: 25.0 },
    ],
    gender: [
      { label: "Female",      cols: ["185", "50", "38", "18"], pct: 27.0 },
      { label: "Male",        cols: ["157", "39", "29", "15"], pct: 24.8 },
    ],
    journey: [
      { label: "Salvation",   cols: ["210", "60", "45", "22"], pct: 28.6 },
      { label: "Baptism",     cols: ["70",  "17", "13", "6"],  pct: 24.3 },
      { label: "Community",   cols: ["62",  "12", "9",  "5"],  pct: 19.4 },
    ],
  }[dim];

  return (
    <div className="p-6 space-y-4">
      <PageHeader
        title="153 Collective Reporting"
        subtitle="Generate standardized reports for cross-ministry comparison"
        actions={(
          <>
            <FilterButton label="Q1 2026" />
            <button className="flex items-center gap-1.5 px-4 py-2 text-sm font-semibold bg-violet-600 text-white rounded-md hover:bg-violet-700 transition-all shadow-sm">
              <Sparkles className="w-4 h-4" /> Generate Report
            </button>
            <button className="flex items-center gap-1.5 px-4 py-2 text-sm font-semibold bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-all shadow-sm">
              <Download className="w-4 h-4" /> Export PDF
            </button>
          </>
        )}
      />

      <div className="bg-slate-900 text-white rounded-lg p-6">
        <div className="flex items-center gap-4 mb-3 flex-wrap">
          <Chip tone="blue" className="uppercase tracking-widest bg-blue-500/20 text-blue-200">153 Collective Standard</Chip>
          <span className="text-xs text-slate-300 font-semibold uppercase tracking-wider">Q1 2026 Report</span>
        </div>
        <p className="text-lg font-semibold leading-snug">
          Turumba had 342 new faith journeys across its platforms in Q1 2026, with 89 confirmed decisions and 67 active journeys progressing through spiritual milestones.
        </p>
        <div className="flex items-center gap-5 mt-4 text-sm text-slate-300 flex-wrap">
          <span className="inline-flex items-center gap-1.5"><Globe className="w-4 h-4" /> 5 Platforms</span>
          <span className="inline-flex items-center gap-1.5"><Languages className="w-4 h-4" /> 3 Languages</span>
          <span className="inline-flex items-center gap-1.5"><MapPin className="w-4 h-4" /> 4 Countries</span>
        </div>
      </div>

      <div className="bg-card border border-border rounded-lg p-5">
        <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
          <h3 className="text-sm font-bold text-foreground">Breakdown by Dimension</h3>
          <div className="flex items-center gap-1 bg-muted/60 rounded-md p-0.5">
            {([
              ["language", "Language"],
              ["country",  "Country"],
              ["platform", "Platform"],
              ["gender",   "Gender"],
              ["journey",  "Journey Type"],
            ] as const).map(([k, label]) => (
              <button
                key={k}
                onClick={() => setDim(k)}
                className={cn(
                  "px-3 py-1.5 text-xs font-semibold rounded transition-all",
                  dim === k ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                )}
              >{label}</button>
            ))}
          </div>
        </div>
        <div className="overflow-hidden">
          <div className="grid grid-cols-6 gap-2 px-3 py-2 bg-muted/40 rounded text-xs uppercase tracking-wider text-muted-foreground font-semibold">
            <span>Dimension</span>
            <span>New Journeys</span>
            <span>Decisions</span>
            <span>Active</span>
            <span>Connected</span>
            <span>Conversion %</span>
          </div>
          {rows.map((r, i) => (
            <div key={i} className="grid grid-cols-6 gap-2 px-3 py-3 items-center border-b border-border last:border-0">
              <span className="text-sm font-medium text-foreground">{r.label}</span>
              {r.cols.map((c, ci) => <span key={ci} className="text-sm text-foreground">{c}</span>)}
              <div className="flex items-center gap-2">
                <div className="flex-1"><ProgressBar value={r.pct * 3} tone="green" /></div>
                <span className="text-sm font-semibold text-emerald-600">{r.pct}%</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// VALIDATIONS
// ============================================================================

export function ValidationsView() {
  const [tab, setTab] = useState<"pending" | "confirmed" | "all">("pending");
  const rows = [
    { name: "Sara Ahmed",     email: "sara@email.com",     milestone: "Salvation Decision", milestoneTone: "green" as const, date: "Mar 28, 2026", source: "via Telegram bot",  validator: "Pastor James K.", validatorStatus: "Notified 2 days ago", status: "pending",    avatarTone: "rose" as const },
    { name: "David Kebede",   email: "david@email.com",    milestone: "Baptism",            milestoneTone: "blue" as const,  date: "Apr 2, 2026",  source: "via WhatsApp",      validator: "Mentor Daniel M.", validatorStatus: "Notified today",       status: "pending",    avatarTone: "blue" as const },
    { name: "Abigail Johnson",email: "abigail@email.com",  milestone: "Salvation Decision", milestoneTone: "green" as const, date: "Feb 3, 2026",  source: "via Self-guided",   validator: "Pastor James K.", validatorStatus: "Confirmed Feb 5",     status: "confirmed",  avatarTone: "purple" as const },
    { name: "Miriam Haile",   email: "miriam@email.com",   milestone: "Community",          milestoneTone: "purple" as const, date: "Apr 5, 2026",  source: "Referred to fellowship", validator: "Sister Ruth B.", validatorStatus: "Not yet notified",   status: "pending",    avatarTone: "amber" as const },
  ];
  const filtered = tab === "all" ? rows : rows.filter(r => r.status === tab);

  return (
    <div className="p-6 space-y-4">
      <PageHeader
        title="Decision Validation"
        subtitle="Two-step confirmation: self-reported decisions validated by mentors or community leaders"
        actions={(
          <>
            <button className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium bg-card border border-border rounded-md hover:bg-muted/50 transition-all">
              <Filter className="w-3.5 h-3.5" /> Filter
            </button>
            <button className="flex items-center gap-1.5 px-4 py-2 text-sm font-semibold bg-amber-500 text-white rounded-md hover:bg-amber-600 transition-all shadow-sm">
              <Bell className="w-4 h-4" /> Send Reminders
            </button>
          </>
        )}
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="bg-amber-50/60 border border-amber-200 rounded-lg p-4">
          <div className="text-xs font-medium text-amber-700 uppercase tracking-wider">Pending Validation</div>
          <div className="text-3xl font-bold text-amber-900 mt-1">24</div>
          <div className="text-xs text-amber-700">awaiting confirmation</div>
        </div>
        <div className="bg-emerald-50/60 border border-emerald-200 rounded-lg p-4">
          <div className="text-xs font-medium text-emerald-700 uppercase tracking-wider">Confirmed This Month</div>
          <div className="text-3xl font-bold text-emerald-900 mt-1">18</div>
          <div className="text-xs text-emerald-700">+6 from last month</div>
        </div>
        <div className="bg-card border border-border rounded-lg p-4">
          <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Avg. Validation Time</div>
          <div className="text-3xl font-bold text-foreground mt-1">4.2 days</div>
          <div className="text-xs text-emerald-600">-1.3 days improvement</div>
        </div>
      </div>

      <div className="bg-card border border-border rounded-lg overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold text-foreground">Validation Queue</span>
            <Chip tone="amber">24 pending</Chip>
          </div>
          <div className="flex items-center gap-1 text-xs font-semibold">
            {([
              ["pending", "Pending"], ["confirmed", "Confirmed"], ["all", "All"]
            ] as const).map(([k, label]) => (
              <button
                key={k}
                onClick={() => setTab(k)}
                className={cn("px-3 py-1 rounded transition-colors", tab === k ? "text-primary" : "text-muted-foreground hover:text-foreground")}
              >{label}</button>
            ))}
          </div>
        </div>
        <table className="w-full">
          <thead>
            <tr className="bg-muted/40 border-b border-border text-xs uppercase tracking-wider text-muted-foreground">
              <th className="px-4 py-3 text-left font-semibold">Person</th>
              <th className="px-4 py-3 text-left font-semibold">Milestone</th>
              <th className="px-4 py-3 text-left font-semibold">Self-Reported</th>
              <th className="px-4 py-3 text-left font-semibold">Validator</th>
              <th className="px-4 py-3 text-left font-semibold">Status</th>
              <th className="px-4 py-3 text-right font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((r, i) => (
              <tr key={i} className={cn("border-b border-border last:border-0 transition-colors", r.status === "pending" ? "bg-amber-50/30 hover:bg-amber-50/60" : "hover:bg-muted/30")}>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <Avatar name={r.name} tone={r.avatarTone} />
                    <div>
                      <div className="text-sm font-semibold text-foreground">{r.name}</div>
                      <div className="text-xs text-muted-foreground">{r.email}</div>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3"><Chip tone={r.milestoneTone}><Heart className="w-3 h-3" />{r.milestone}</Chip></td>
                <td className="px-4 py-3">
                  <div className="text-sm font-medium text-foreground">{r.date}</div>
                  <div className="text-xs text-muted-foreground">{r.source}</div>
                </td>
                <td className="px-4 py-3">
                  <div className="text-sm font-medium text-foreground">{r.validator}</div>
                  <div className={cn("text-xs", r.status === "confirmed" ? "text-emerald-600" : "text-amber-700")}>{r.validatorStatus}</div>
                </td>
                <td className="px-4 py-3">
                  {r.status === "confirmed"
                    ? <Chip tone="green"><CheckCircle2 className="w-3 h-3" />Confirmed</Chip>
                    : <Chip tone="amber">Pending</Chip>}
                </td>
                <td className="px-4 py-3 text-right">
                  {r.status === "pending" ? (
                    <div className="flex items-center justify-end gap-2">
                      <button className="px-3 py-1.5 text-xs font-semibold bg-emerald-500 text-white rounded hover:bg-emerald-600 transition-all">Confirm</button>
                      <button className="px-3 py-1.5 text-xs font-semibold bg-card border border-border text-rose-600 rounded hover:bg-rose-50 transition-all">Reject</button>
                    </div>
                  ) : (
                    <button className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline">
                      <FileText className="w-3 h-3" /> View audit trail
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
