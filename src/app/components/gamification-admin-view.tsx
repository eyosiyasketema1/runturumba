import React, { useState, useEffect, useMemo } from "react";
import {
  Zap, Award, Trophy, BarChart3, Plus, Edit2, Trash2, Search,
  ChevronDown, ToggleLeft, ToggleRight, Shield, Flame, Star,
  TrendingUp, Users, Activity, Check, X, Eye,
} from "lucide-react";
import {
  cn,
} from "./types";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Input } from "./ui/input";
import { Modal } from "./shared-ui";
import { toast } from "sonner";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, AreaChart, Area,
} from "recharts";

import {
  RulesService, BadgesService, LeaderboardService, AnalyticsService,
  AdminRulesService, AdminBadgesService,
  type BehaviorRule, type BadgeDefinition, type LeaderboardEntry,
  type GamificationAnalytics,
  rarityColor,
} from "../lib/gamification-service";

// ─── Tab type ───────────────────────────────────────────────────────────────

type AdminTab = "rules" | "badges" | "leaderboard" | "analytics";

const TABS: { id: AdminTab; label: string; icon: any }[] = [
  { id: "rules", label: "Behavior Rules", icon: Zap },
  { id: "badges", label: "Badges", icon: Award },
  { id: "leaderboard", label: "Leaderboard", icon: Trophy },
  { id: "analytics", label: "Analytics", icon: BarChart3 },
];

const RARITY_OPTIONS = ["common", "rare", "epic", "legendary"];
const CATEGORY_OPTIONS = ["achievement", "milestone", "streak", "special"];
const TIER_COLORS: Record<string, string> = { bronze: "#d97706", silver: "#94a3b8", gold: "#f59e0b", platinum: "#a855f7" };

// ─── Main View ──────────────────────────────────────────────────────────────

export function GamificationAdminView({ accountId }: { accountId: string }) {
  const [tab, setTab] = useState<AdminTab>("rules");

  return (
    <div className="p-6 space-y-5 min-h-full">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-foreground tracking-tight">Gamification</h1>
          <p className="text-sm text-muted-foreground mt-1">Manage rules, badges, leaderboards, and analytics</p>
        </div>
      </div>

      {/* Tab Switcher */}
      <div className="inline-flex items-center gap-1 bg-muted/60 border border-border rounded-full p-1">
        {TABS.map(({ id, label, icon: Icon }) => {
          const active = tab === id;
          return (
            <button
              key={id}
              onClick={() => setTab(id)}
              className={cn(
                "flex items-center gap-2 px-4 py-1.5 text-sm font-semibold rounded-full transition-all",
                active ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      {tab === "rules" && <RulesTab accountId={accountId} />}
      {tab === "badges" && <BadgesTab accountId={accountId} />}
      {tab === "leaderboard" && <LeaderboardTab accountId={accountId} />}
      {tab === "analytics" && <AnalyticsTab accountId={accountId} />}
    </div>
  );
}

// ─── Rules Tab ──────────────────────────────────────────────────────────────

function RulesTab({ accountId }: { accountId: string }) {
  const [rules, setRules] = useState<BehaviorRule[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    RulesService.list(accountId).then(({ data }) => {
      if (data) setRules(data);
      setLoading(false);
    });
  }, [accountId]);

  const filtered = useMemo(() =>
    rules.filter(r => r.name.toLowerCase().includes(search.toLowerCase()) || r.trigger_event.toLowerCase().includes(search.toLowerCase())),
    [rules, search]
  );

  const handleToggle = async (rule: BehaviorRule) => {
    const { data } = await AdminRulesService.update(rule.id, { is_active: !rule.is_active });
    if (data) {
      setRules(prev => prev.map(r => r.id === rule.id ? { ...r, is_active: !r.is_active } : r));
      toast.success(`Rule ${rule.is_active ? "disabled" : "enabled"}`);
    }
  };

  const handleDelete = async (id: string) => {
    await AdminRulesService.delete(id);
    setRules(prev => prev.filter(r => r.id !== id));
    toast.success("Rule deleted");
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Search rules..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Badge variant="secondary">{rules.length} rules</Badge>
      </div>

      <div className="bg-card border border-border rounded-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/30">
              <th className="text-left px-4 py-3 font-semibold text-muted-foreground">Rule</th>
              <th className="text-left px-4 py-3 font-semibold text-muted-foreground">Trigger</th>
              <th className="text-left px-4 py-3 font-semibold text-muted-foreground">Actor</th>
              <th className="text-left px-4 py-3 font-semibold text-muted-foreground">Actions</th>
              <th className="text-center px-4 py-3 font-semibold text-muted-foreground">Priority</th>
              <th className="text-center px-4 py-3 font-semibold text-muted-foreground">Status</th>
              <th className="text-right px-4 py-3 font-semibold text-muted-foreground"></th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(rule => (
              <tr key={rule.id} className="border-b border-border last:border-0 hover:bg-muted/20 transition-colors">
                <td className="px-4 py-3">
                  <div className="font-semibold text-foreground">{rule.name}</div>
                  {rule.description && <div className="text-xs text-muted-foreground mt-0.5 max-w-[280px] truncate">{rule.description}</div>}
                </td>
                <td className="px-4 py-3">
                  <code className="text-xs bg-muted px-1.5 py-0.5 rounded">{rule.trigger_event}</code>
                </td>
                <td className="px-4 py-3">
                  <Badge variant="outline" className="text-xs">{rule.actor_type}</Badge>
                </td>
                <td className="px-4 py-3">
                  <div className="flex gap-1 flex-wrap">
                    {(rule.actions || []).map((a: any, i: number) => (
                      <Badge key={i} variant="secondary" className="text-xs">
                        {a.type === "award_xp" ? `+${a.points} XP` : a.type}
                      </Badge>
                    ))}
                  </div>
                </td>
                <td className="px-4 py-3 text-center">
                  <span className="text-xs font-mono text-muted-foreground">{rule.priority}</span>
                </td>
                <td className="px-4 py-3 text-center">
                  <button onClick={() => handleToggle(rule)} className="inline-flex">
                    {rule.is_active
                      ? <ToggleRight className="w-5 h-5 text-emerald-500" />
                      : <ToggleLeft className="w-5 h-5 text-muted-foreground" />
                    }
                  </button>
                </td>
                <td className="px-4 py-3 text-right">
                  <button onClick={() => handleDelete(rule.id)} className="p-1.5 text-muted-foreground hover:text-destructive transition-colors">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && !loading && (
              <tr><td colSpan={7} className="px-4 py-8 text-center text-muted-foreground text-sm">No rules found</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── Badges Tab ─────────────────────────────────────────────────────────────

function BadgesTab({ accountId }: { accountId: string }) {
  const [badges, setBadges] = useState<BadgeDefinition[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    BadgesService.listDefinitions(accountId).then(({ data }) => {
      if (data) setBadges(data);
      setLoading(false);
    });
  }, [accountId]);

  const handleToggle = async (badge: BadgeDefinition) => {
    const { data } = await AdminBadgesService.update(badge.id, { is_active: !badge.is_active });
    if (data) {
      setBadges(prev => prev.map(b => b.id === badge.id ? { ...b, is_active: !b.is_active } : b));
      toast.success(`Badge ${badge.is_active ? "disabled" : "enabled"}`);
    }
  };

  const groupedByCategory = useMemo(() => {
    const groups: Record<string, BadgeDefinition[]> = {};
    badges.forEach(b => {
      (groups[b.category] = groups[b.category] || []).push(b);
    });
    return groups;
  }, [badges]);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Badge variant="secondary">{badges.length} badges</Badge>
      </div>

      {Object.entries(groupedByCategory).map(([category, categoryBadges]) => (
        <div key={category}>
          <h3 className="text-sm font-bold text-foreground uppercase tracking-wider mb-3 flex items-center gap-2">
            {category === "achievement" && <Star className="w-3.5 h-3.5 text-blue-500" />}
            {category === "milestone" && <Shield className="w-3.5 h-3.5 text-purple-500" />}
            {category === "streak" && <Flame className="w-3.5 h-3.5 text-orange-500" />}
            {category === "special" && <Award className="w-3.5 h-3.5 text-amber-500" />}
            {category}
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
            {categoryBadges.map(badge => {
              const color = rarityColor(badge.rarity);
              return (
                <div
                  key={badge.id}
                  className={cn(
                    "rounded-sm border p-4 transition-all",
                    badge.is_active ? "bg-card border-border" : "bg-muted/30 border-border opacity-60"
                  )}
                >
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: color + "15" }}>
                      <Award className="w-5 h-5" style={{ color }} />
                    </div>
                    <button onClick={() => handleToggle(badge)} className="mt-0.5">
                      {badge.is_active
                        ? <ToggleRight className="w-5 h-5 text-emerald-500" />
                        : <ToggleLeft className="w-5 h-5 text-muted-foreground" />
                      }
                    </button>
                  </div>
                  <h4 className="font-semibold text-foreground text-sm">{badge.name}</h4>
                  <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{badge.description}</p>
                  <div className="flex items-center gap-2 mt-3">
                    <span className="px-2 py-0.5 text-xs font-semibold rounded-full" style={{ backgroundColor: color + "15", color }}>
                      {badge.rarity}
                    </span>
                    {badge.xp_reward > 0 && (
                      <span className="text-xs font-medium text-muted-foreground">+{badge.xp_reward} XP</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Leaderboard Tab ────────────────────────────────────────────────────────

function LeaderboardTab({ accountId }: { accountId: string }) {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [boardType, setBoardType] = useState<"weekly" | "monthly" | "all_time">("weekly");
  const [actorType, setActorType] = useState<"seeker" | "mentor">("seeker");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    LeaderboardService.get(accountId, boardType, actorType, 50).then(({ data }) => {
      if (data) setEntries(Array.isArray(data) ? data : []);
      setLoading(false);
    });
  }, [accountId, boardType, actorType]);

  const MEDAL = ["", "🥇", "🥈", "🥉"];

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 flex-wrap">
        <div className="inline-flex items-center gap-1 bg-muted/60 border border-border rounded-full p-1">
          {(["weekly", "monthly", "all_time"] as const).map(bt => (
            <button
              key={bt}
              onClick={() => setBoardType(bt)}
              className={cn(
                "px-3 py-1 text-xs font-semibold rounded-full transition-all",
                boardType === bt ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
              )}
            >
              {bt === "all_time" ? "All Time" : bt.charAt(0).toUpperCase() + bt.slice(1)}
            </button>
          ))}
        </div>
        <div className="inline-flex items-center gap-1 bg-muted/60 border border-border rounded-full p-1">
          {(["seeker", "mentor"] as const).map(at => (
            <button
              key={at}
              onClick={() => setActorType(at)}
              className={cn(
                "px-3 py-1 text-xs font-semibold rounded-full transition-all",
                actorType === at ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
              )}
            >
              {at.charAt(0).toUpperCase() + at.slice(1)}s
            </button>
          ))}
        </div>
        <Badge variant="secondary">{entries.length} ranked</Badge>
      </div>

      <div className="bg-card border border-border rounded-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/30">
              <th className="text-center px-4 py-3 font-semibold text-muted-foreground w-16">Rank</th>
              <th className="text-left px-4 py-3 font-semibold text-muted-foreground">Actor</th>
              <th className="text-left px-4 py-3 font-semibold text-muted-foreground">Type</th>
              <th className="text-right px-4 py-3 font-semibold text-muted-foreground">XP Earned</th>
            </tr>
          </thead>
          <tbody>
            {entries.map((entry) => (
              <tr key={entry.id} className={cn(
                "border-b border-border last:border-0 transition-colors",
                entry.rank <= 3 ? "bg-amber-50/30" : "hover:bg-muted/20"
              )}>
                <td className="px-4 py-3 text-center">
                  {entry.rank <= 3 ? (
                    <span className="text-lg">{MEDAL[entry.rank]}</span>
                  ) : (
                    <span className="font-mono text-muted-foreground">{entry.rank}</span>
                  )}
                </td>
                <td className="px-4 py-3 font-semibold text-foreground">{entry.actor_id}</td>
                <td className="px-4 py-3">
                  <Badge variant="outline" className="text-xs">{entry.actor_type}</Badge>
                </td>
                <td className="px-4 py-3 text-right">
                  <span className="font-bold text-foreground">{entry.xp_earned.toLocaleString()}</span>
                  <span className="text-muted-foreground ml-1 text-xs">XP</span>
                </td>
              </tr>
            ))}
            {entries.length === 0 && !loading && (
              <tr><td colSpan={4} className="px-4 py-8 text-center text-muted-foreground text-sm">No leaderboard entries yet</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── Analytics Tab ──────────────────────────────────────────────────────────

function AnalyticsTab({ accountId }: { accountId: string }) {
  const [data, setData] = useState<GamificationAnalytics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    AnalyticsService.get(accountId).then(({ data: d }) => {
      if (d) setData(d);
      setLoading(false);
    });
  }, [accountId]);

  if (loading || !data) {
    return <div className="py-12 text-center text-muted-foreground">Loading analytics...</div>;
  }

  const PIE_COLORS = [TIER_COLORS.bronze, TIER_COLORS.silver, TIER_COLORS.gold, TIER_COLORS.platinum];
  const tierData = Object.entries(data.tier_distribution).map(([tier, count]) => ({ name: tier, value: count }));

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {[
          { label: "Profiles", value: data.totals.profiles, icon: Users },
          { label: "Seekers", value: data.totals.seekers, icon: Users },
          { label: "Mentors", value: data.totals.mentors, icon: Shield },
          { label: "Badges Defined", value: data.totals.badges_defined, icon: Award },
          { label: "Badges Awarded", value: data.totals.badges_awarded, icon: Star },
          { label: "Total XP", value: data.totals.total_xp.toLocaleString(), icon: TrendingUp },
        ].map(({ label, value, icon: Icon }) => (
          <div key={label} className="rounded-sm bg-card border border-border p-3">
            <div className="flex items-center gap-1.5 mb-1">
              <Icon className="w-3.5 h-3.5 text-muted-foreground" />
              <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">{label}</span>
            </div>
            <p className="text-xl font-bold text-foreground">{value}</p>
          </div>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* XP Distribution */}
        <div className="rounded-sm bg-card border border-border p-5">
          <h3 className="text-sm font-bold text-foreground mb-4">XP Distribution</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={data.xp_distribution}>
              <XAxis dataKey="label" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Bar dataKey="count" fill="#3b82f6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Tier Distribution */}
        <div className="rounded-sm bg-card border border-border p-5">
          <h3 className="text-sm font-bold text-foreground mb-4">Tier Distribution</h3>
          <div className="flex items-center justify-center gap-8">
            <ResponsiveContainer width={160} height={160}>
              <PieChart>
                <Pie data={tierData} cx="50%" cy="50%" innerRadius={40} outerRadius={70} dataKey="value" stroke="none">
                  {tierData.map((_, i) => (
                    <Cell key={i} fill={PIE_COLORS[i]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div className="space-y-2">
              {tierData.map((t, i) => (
                <div key={t.name} className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: PIE_COLORS[i] }} />
                  <span className="text-xs font-medium text-foreground capitalize">{t.name}</span>
                  <span className="text-xs text-muted-foreground">({t.value})</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Streak Distribution */}
        <div className="rounded-sm bg-card border border-border p-5">
          <h3 className="text-sm font-bold text-foreground mb-4">Streak Distribution</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={data.streak_distribution}>
              <XAxis dataKey="label" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Bar dataKey="count" fill="#f59e0b" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* XP Timeline */}
        <div className="rounded-sm bg-card border border-border p-5">
          <h3 className="text-sm font-bold text-foreground mb-4">XP Awarded (Last 7 Days)</h3>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={data.xp_timeline}>
              <XAxis dataKey="date" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Area type="monotone" dataKey="xp" fill="#a855f7" fillOpacity={0.15} stroke="#a855f7" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Badge Earning Rates */}
      <div className="rounded-sm bg-card border border-border p-5">
        <h3 className="text-sm font-bold text-foreground mb-4">Badge Earning Rates</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
          {data.badge_rates.map(b => {
            const color = rarityColor(b.rarity);
            return (
              <div key={b.slug} className="flex items-center gap-3 p-3 rounded-md border border-border bg-muted/10">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: color + "15" }}>
                  <Award className="w-4 h-4" style={{ color }} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-semibold text-foreground truncate">{b.name}</div>
                  <div className="flex items-center gap-2 mt-0.5">
                    <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                      <div className="h-full rounded-full" style={{ width: `${b.rate}%`, backgroundColor: color }} />
                    </div>
                    <span className="text-[10px] font-semibold text-muted-foreground">{b.rate}%</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
