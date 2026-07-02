import React, { useState, useEffect, useMemo } from "react";
import {
  Zap, Award, Trophy, BarChart3, Plus, Edit2, Trash2, Search,
  ChevronDown, Shield, Flame, Star,
  TrendingUp, Users, Activity, Check, X, Eye, RefreshCw,
  Mail, Clock, AlertTriangle, Play, Pause, XCircle, CheckCircle,
  MessageSquare, Send,
} from "lucide-react";
import {
  cn,
} from "./types";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Input } from "./ui/input";
import { Modal } from "./shared-ui";
import { Switch } from "./ui/switch";
import { toast } from "sonner";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, AreaChart, Area,
  ScatterChart, Scatter, ZAxis, CartesianGrid,
} from "recharts";

import {
  RulesService, BadgesService, LeaderboardService, AnalyticsService,
  AdminRulesService, AdminBadgesService,
  ReengagementService, AdminReengagementService,
  type BehaviorRule, type BadgeDefinition, type LeaderboardEntry,
  type GamificationAnalytics,
  type ReengagementTemplate, type AutomationEnrollment, type DripMessage,
  rarityColor,
} from "../lib/gamification-service";

// ─── Tab type ───────────────────────────────────────────────────────────────

type AdminTab = "rules" | "badges" | "leaderboard" | "analytics" | "reengagement";

const TABS: { id: AdminTab; label: string; icon: any }[] = [
  { id: "rules", label: "Behavior Rules", icon: Zap },
  { id: "badges", label: "Badges", icon: Award },
  { id: "leaderboard", label: "Leaderboard", icon: Trophy },
  { id: "analytics", label: "Analytics", icon: BarChart3 },
  { id: "reengagement", label: "Re-engagement", icon: RefreshCw },
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
          <p className="text-sm text-muted-foreground mt-1">Manage rules, badges, leaderboards, analytics, and re-engagement</p>
        </div>
      </div>

      {/* Tab Switcher */}
      <div className="inline-flex items-center gap-1 bg-muted/60 border border-border rounded-full p-1" role="tablist" aria-label="Gamification">
        {TABS.map(({ id, label, icon: Icon }) => {
          const active = tab === id;
          return (
            <button
              key={id}
              role="tab"
              id={`tab-gamify-${id}`}
              aria-selected={active}
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
      {tab === "rules" && <div role="tabpanel" aria-labelledby="tab-gamify-rules"><RulesTab accountId={accountId} /></div>}
      {tab === "badges" && <div role="tabpanel" aria-labelledby="tab-gamify-badges"><BadgesTab accountId={accountId} /></div>}
      {tab === "leaderboard" && <div role="tabpanel" aria-labelledby="tab-gamify-leaderboard"><LeaderboardTab accountId={accountId} /></div>}
      {tab === "analytics" && <div role="tabpanel" aria-labelledby="tab-gamify-analytics"><AnalyticsTab accountId={accountId} /></div>}
      {tab === "reengagement" && <div role="tabpanel" aria-labelledby="tab-gamify-reengagement"><ReengagementTab accountId={accountId} /></div>}
    </div>
  );
}

// ─── Shared constants ───────────────────────────────────────────────────────

const TRIGGER_EVENTS = [
  "engagement.event_recorded",
  "milestone.completed",
  "gamification.streak_updated",
  "gamification.streak_broken",
  "journey.started",
  "journey.stage_advanced",
  "journey.completed",
  "milestone.progressed",
];

const CONDITION_OPS = ["eq", "ne", "gt", "gte", "lt", "lte", "in", "contains", "exists"];

const ACTION_TYPES = [
  { value: "award_xp", label: "Award XP" },
  { value: "check_badge", label: "Check Badge" },
  { value: "update_streak", label: "Update Streak" },
  { value: "send_notification", label: "Send Notification" },
  { value: "enroll_automation", label: "Enroll in Automation" },
  { value: "advance_journey", label: "Advance Journey" },
  { value: "update_milestone", label: "Update Milestone" },
];

// ─── Rule Builder Modal ────────────────────────────────────────────────────

interface RuleFormData {
  name: string;
  description: string;
  actor_type: string;
  trigger_event: string;
  conditions: Array<{ field: string; op: string; value: string }>;
  actions: Array<{ type: string; [key: string]: any }>;
  cooldown_seconds: number | null;
  daily_cap: number | null;
  priority: number;
  is_active: boolean;
}

const EMPTY_RULE: RuleFormData = {
  name: "", description: "", actor_type: "seeker", trigger_event: TRIGGER_EVENTS[0],
  conditions: [], actions: [{ type: "award_xp", points: 10 }],
  cooldown_seconds: null, daily_cap: null, priority: 100, is_active: true,
};

function RuleBuilderModal({ isOpen, onClose, onSaved, editRule, accountId }: {
  isOpen: boolean; onClose: () => void; onSaved: (rule: BehaviorRule) => void;
  editRule: BehaviorRule | null; accountId: string;
}) {
  const [form, setForm] = useState<RuleFormData>(EMPTY_RULE);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (editRule) {
      setForm({
        name: editRule.name,
        description: editRule.description || "",
        actor_type: editRule.actor_type,
        trigger_event: editRule.trigger_event,
        conditions: (editRule.conditions || []).map((c: any) => ({ field: c.field || "", op: c.op || "eq", value: String(c.value ?? "") })),
        actions: editRule.actions || [{ type: "award_xp", points: 10 }],
        cooldown_seconds: editRule.cooldown_seconds,
        daily_cap: editRule.daily_cap,
        priority: editRule.priority,
        is_active: editRule.is_active,
      });
    } else {
      setForm(EMPTY_RULE);
    }
  }, [editRule, isOpen]);

  const setField = (key: keyof RuleFormData, val: any) => setForm(prev => ({ ...prev, [key]: val }));

  const addCondition = () => setField("conditions", [...form.conditions, { field: "", op: "eq", value: "" }]);
  const removeCondition = (i: number) => setField("conditions", form.conditions.filter((_, idx) => idx !== i));
  const updateCondition = (i: number, key: string, val: string) => {
    const next = [...form.conditions];
    (next[i] as any)[key] = val;
    setField("conditions", next);
  };

  const addAction = () => setField("actions", [...form.actions, { type: "award_xp", points: 10 }]);
  const removeAction = (i: number) => setField("actions", form.actions.filter((_, idx) => idx !== i));
  const updateAction = (i: number, key: string, val: any) => {
    const next = [...form.actions];
    (next[i] as any)[key] = val;
    setField("actions", next);
  };

  const handleSave = async () => {
    if (!form.name.trim() || !form.trigger_event) {
      toast.error("Name and trigger event are required");
      return;
    }
    setSaving(true);
    try {
      const payload = {
        account_id: accountId,
        name: form.name,
        description: form.description,
        actor_type: form.actor_type,
        trigger_event: form.trigger_event,
        conditions: form.conditions.filter(c => c.field.trim()),
        actions: form.actions,
        cooldown_seconds: form.cooldown_seconds,
        daily_cap: form.daily_cap,
        priority: form.priority,
        is_active: form.is_active,
      };

      if (editRule) {
        const { data } = await AdminRulesService.update(editRule.id, payload);
        if (data) { onSaved(data); toast.success("Rule updated"); }
      } else {
        const { data } = await AdminRulesService.create(payload);
        if (data) { onSaved(data); toast.success("Rule created"); }
      }
      onClose();
    } catch (e) {
      toast.error("Failed to save rule");
    } finally {
      setSaving(false);
    }
  };

  // Human-readable preview
  const preview = useMemo(() => {
    const parts: string[] = [];
    parts.push(`When "${form.trigger_event}" fires`);
    if (form.conditions.length > 0) {
      const conds = form.conditions.filter(c => c.field).map(c => `${c.field} ${c.op} ${c.value}`);
      if (conds.length) parts.push(`and ${conds.join(" and ")}`);
    }
    const acts = form.actions.map(a => {
      if (a.type === "award_xp") return `award ${a.points || 0} XP`;
      if (a.type === "check_badge") return `check badge "${a.badge_slug || "?"}"`;
      return a.type.replace(/_/g, " ");
    });
    parts.push(`→ ${acts.join(", ")}`);
    if (form.cooldown_seconds) parts.push(`(cooldown: ${form.cooldown_seconds}s)`);
    if (form.daily_cap) parts.push(`(max ${form.daily_cap}/day)`);
    return parts.join(" ");
  }, [form]);

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={editRule ? "Edit Rule" : "Create Rule"} size="3xl">
      <div className="space-y-5 max-h-[70vh] overflow-y-auto pr-1">
        {/* Preview */}
        <div className="bg-muted/40 border border-border rounded-md p-3">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Preview</p>
          <p className="text-sm text-foreground">{preview}</p>
        </div>

        {/* Name + Description */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-semibold text-muted-foreground">Name *</label>
            <Input aria-label="Rule name" value={form.name} onChange={e => setField("name", e.target.value)} placeholder="e.g. Content Viewed" className="mt-1" />
          </div>
          <div>
            <label className="text-xs font-semibold text-muted-foreground">Description</label>
            <Input aria-label="Rule description" value={form.description} onChange={e => setField("description", e.target.value)} placeholder="What this rule does" className="mt-1" />
          </div>
        </div>

        {/* Trigger + Actor + Priority */}
        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className="text-xs font-semibold text-muted-foreground">Trigger Event *</label>
            <select aria-label="Trigger event" value={form.trigger_event} onChange={e => setField("trigger_event", e.target.value)}
              className="mt-1 w-full h-9 rounded-md border border-input bg-background px-3 text-sm">
              {TRIGGER_EVENTS.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs font-semibold text-muted-foreground">Actor Type</label>
            <select aria-label="Actor type" value={form.actor_type} onChange={e => setField("actor_type", e.target.value)}
              className="mt-1 w-full h-9 rounded-md border border-input bg-background px-3 text-sm">
              <option value="seeker">Seeker</option>
              <option value="mentor">Mentor</option>
              <option value="both">Both</option>
            </select>
          </div>
          <div>
            <label className="text-xs font-semibold text-muted-foreground">Priority</label>
            <Input aria-label="Priority" type="number" value={form.priority} onChange={e => setField("priority", Number(e.target.value))} className="mt-1" />
          </div>
        </div>

        {/* Conditions */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Conditions</label>
            <button onClick={addCondition} className="text-xs text-primary font-semibold flex items-center gap-1 hover:underline">
              <Plus className="w-3 h-3" /> Add condition
            </button>
          </div>
          {form.conditions.length === 0 && (
            <p className="text-xs text-muted-foreground italic">No conditions — rule fires on every matching event</p>
          )}
          <div className="space-y-2">
            {form.conditions.map((c, i) => (
              <div key={i} className="flex items-center gap-2">
                <Input aria-label="Condition field" value={c.field} onChange={e => updateCondition(i, "field", e.target.value)} placeholder="field (e.g. event_type)" className="flex-1" />
                <select aria-label="Condition operator" value={c.op} onChange={e => updateCondition(i, "op", e.target.value)}
                  className="h-9 rounded-md border border-input bg-background px-2 text-sm w-20">
                  {CONDITION_OPS.map(op => <option key={op} value={op}>{op}</option>)}
                </select>
                <Input aria-label="Condition value" value={c.value} onChange={e => updateCondition(i, "value", e.target.value)} placeholder="value" className="flex-1" />
                <button onClick={() => removeCondition(i)} className="p-1 text-muted-foreground hover:text-destructive"><X className="w-3.5 h-3.5" /></button>
              </div>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Actions</label>
            <button onClick={addAction} className="text-xs text-primary font-semibold flex items-center gap-1 hover:underline">
              <Plus className="w-3 h-3" /> Add action
            </button>
          </div>
          <div className="space-y-2">
            {form.actions.map((a, i) => (
              <div key={i} className="flex items-center gap-2 bg-muted/20 border border-border rounded-md p-2">
                <select aria-label="Action type" value={a.type} onChange={e => updateAction(i, "type", e.target.value)}
                  className="h-9 rounded-md border border-input bg-background px-2 text-sm">
                  {ACTION_TYPES.map(at => <option key={at.value} value={at.value}>{at.label}</option>)}
                </select>
                {a.type === "award_xp" && (
                  <Input aria-label="XP points" type="number" value={a.points || ""} onChange={e => updateAction(i, "points", Number(e.target.value))} placeholder="XP points" className="w-24" />
                )}
                {a.type === "check_badge" && (
                  <Input aria-label="Badge slug" value={a.badge_slug || ""} onChange={e => updateAction(i, "badge_slug", e.target.value)} placeholder="badge slug" className="flex-1" />
                )}
                {a.type === "send_notification" && (
                  <Input aria-label="Notification template" value={a.template || ""} onChange={e => updateAction(i, "template", e.target.value)} placeholder="template name" className="flex-1" />
                )}
                {a.type === "enroll_automation" && (
                  <Input aria-label="Automation ID" value={a.automation_id || ""} onChange={e => updateAction(i, "automation_id", e.target.value)} placeholder="automation ID" className="flex-1" />
                )}
                {a.type === "advance_journey" && (
                  <Input aria-label="Journey type" value={a.journey_type || ""} onChange={e => updateAction(i, "journey_type", e.target.value)} placeholder="journey type" className="flex-1" />
                )}
                {a.type === "update_milestone" && (
                  <>
                    <Input aria-label="Milestone type" value={a.milestone_type || ""} onChange={e => updateAction(i, "milestone_type", e.target.value)} placeholder="milestone type" className="flex-1" />
                    <Input aria-label="Milestone state" value={a.state || ""} onChange={e => updateAction(i, "state", e.target.value)} placeholder="state" className="w-24" />
                  </>
                )}
                <button onClick={() => removeAction(i)} className="p-1 text-muted-foreground hover:text-destructive"><X className="w-3.5 h-3.5" /></button>
              </div>
            ))}
          </div>
        </div>

        {/* Guards */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-semibold text-muted-foreground">Cooldown (seconds)</label>
            <Input aria-label="Cooldown seconds" type="number" value={form.cooldown_seconds ?? ""} onChange={e => setField("cooldown_seconds", e.target.value ? Number(e.target.value) : null)} placeholder="No cooldown" className="mt-1" />
          </div>
          <div>
            <label className="text-xs font-semibold text-muted-foreground">Daily Cap</label>
            <Input aria-label="Daily cap" type="number" value={form.daily_cap ?? ""} onChange={e => setField("daily_cap", e.target.value ? Number(e.target.value) : null)} placeholder="Unlimited" className="mt-1" />
          </div>
        </div>

        {/* Active toggle */}
        <div className="flex items-center gap-2">
          <Switch aria-label="Toggle rule active state" checked={form.is_active} onCheckedChange={(v) => setField("is_active", v)} />
          <span className="text-sm text-foreground">{form.is_active ? "Active" : "Inactive"}</span>
        </div>
      </div>

      {/* Footer */}
      <div className="flex justify-end gap-2 mt-5 pt-4 border-t border-border">
        <Button variant="outline" onClick={onClose}>Cancel</Button>
        <Button onClick={handleSave} disabled={saving}>
          {saving ? "Saving..." : editRule ? "Update Rule" : "Create Rule"}
        </Button>
      </div>
    </Modal>
  );
}

// ─── Rules Tab ──────────────────────────────────────────────────────────────

function RulesTab({ accountId }: { accountId: string }) {
  const [rules, setRules] = useState<BehaviorRule[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingRule, setEditingRule] = useState<BehaviorRule | null>(null);

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

  const handleSaved = (rule: BehaviorRule) => {
    setRules(prev => {
      const idx = prev.findIndex(r => r.id === rule.id);
      if (idx >= 0) { const next = [...prev]; next[idx] = rule; return next; }
      return [rule, ...prev];
    });
    setEditingRule(null);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input aria-label="Search rules" placeholder="Search rules..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Badge variant="secondary">{rules.length} rules</Badge>
        <Button size="sm" onClick={() => { setEditingRule(null); setShowForm(true); }} className="ml-auto">
          <Plus className="w-3.5 h-3.5 mr-1" /> New Rule
        </Button>
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
                  <Switch aria-label={`Toggle ${rule.name} active state`} checked={rule.is_active} onCheckedChange={() => handleToggle(rule)} />
                </td>
                <td className="px-4 py-3 text-right">
                  <div className="flex items-center justify-end gap-1">
                    <button onClick={() => { setEditingRule(rule); setShowForm(true); }} className="p-1.5 text-muted-foreground hover:text-primary transition-colors">
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button onClick={() => handleDelete(rule.id)} className="p-1.5 text-muted-foreground hover:text-destructive transition-colors">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && !loading && (
              <tr><td colSpan={7} className="px-4 py-8 text-center text-muted-foreground text-sm">No rules found</td></tr>
            )}
          </tbody>
        </table>
      </div>

      <RuleBuilderModal
        isOpen={showForm}
        onClose={() => { setShowForm(false); setEditingRule(null); }}
        onSaved={handleSaved}
        editRule={editingRule}
        accountId={accountId}
      />
    </div>
  );
}

// ─── Badge Form Modal ──────────────────────────────────────────────────────

const CRITERIA_TYPES = [
  { value: "threshold", label: "Threshold (profile field)" },
  { value: "event_count", label: "Event Count" },
  { value: "milestone", label: "Milestone Completed" },
  { value: "streak", label: "Streak Days" },
  { value: "journey", label: "Journey Completed" },
];

interface BadgeFormData {
  slug: string; name: string; description: string;
  category: string; rarity: string; xp_reward: number;
  criteria: Record<string, any>; is_active: boolean;
}

const EMPTY_BADGE: BadgeFormData = {
  slug: "", name: "", description: "",
  category: "achievement", rarity: "common", xp_reward: 10,
  criteria: { type: "threshold", field: "total_xp", value: 100 },
  is_active: true,
};

function BadgeFormModal({ isOpen, onClose, onSaved, editBadge, accountId }: {
  isOpen: boolean; onClose: () => void; onSaved: (badge: BadgeDefinition) => void;
  editBadge: BadgeDefinition | null; accountId: string;
}) {
  const [form, setForm] = useState<BadgeFormData>(EMPTY_BADGE);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (editBadge) {
      setForm({
        slug: editBadge.slug, name: editBadge.name, description: editBadge.description,
        category: editBadge.category, rarity: editBadge.rarity, xp_reward: editBadge.xp_reward,
        criteria: editBadge.criteria || { type: "threshold", field: "total_xp", value: 100 },
        is_active: editBadge.is_active,
      });
    } else {
      setForm(EMPTY_BADGE);
    }
  }, [editBadge, isOpen]);

  const setField = (key: keyof BadgeFormData, val: any) => setForm(prev => ({ ...prev, [key]: val }));
  const setCriteria = (key: string, val: any) => setForm(prev => ({ ...prev, criteria: { ...prev.criteria, [key]: val } }));

  const handleSave = async () => {
    if (!form.name.trim() || !form.slug.trim()) {
      toast.error("Name and slug are required");
      return;
    }
    setSaving(true);
    try {
      const payload = { account_id: accountId, ...form };
      if (editBadge) {
        const { data } = await AdminBadgesService.update(editBadge.id, payload);
        if (data) { onSaved(data); toast.success("Badge updated"); }
      } else {
        const { data } = await AdminBadgesService.create(payload);
        if (data) { onSaved(data); toast.success("Badge created"); }
      }
      onClose();
    } catch (e) {
      toast.error("Failed to save badge");
    } finally {
      setSaving(false);
    }
  };

  const autoSlug = (name: string) => name.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "");

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={editBadge ? "Edit Badge" : "Create Badge"} size="2xl">
      <div className="space-y-5 max-h-[70vh] overflow-y-auto pr-1">
        {/* Name + Slug */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-semibold text-muted-foreground">Name *</label>
            <Input aria-label="Badge name" value={form.name} onChange={e => { setField("name", e.target.value); if (!editBadge) setField("slug", autoSlug(e.target.value)); }} placeholder="e.g. Week Warrior" className="mt-1" />
          </div>
          <div>
            <label className="text-xs font-semibold text-muted-foreground">Slug *</label>
            <Input aria-label="Badge slug" value={form.slug} onChange={e => setField("slug", e.target.value)} placeholder="week_warrior" className="mt-1" />
          </div>
        </div>

        {/* Description */}
        <div>
          <label className="text-xs font-semibold text-muted-foreground">Description</label>
          <Input aria-label="Badge description" value={form.description} onChange={e => setField("description", e.target.value)} placeholder="Complete a 7-day streak" className="mt-1" />
        </div>

        {/* Category + Rarity + XP */}
        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className="text-xs font-semibold text-muted-foreground">Category</label>
            <select aria-label="Badge category" value={form.category} onChange={e => setField("category", e.target.value)}
              className="mt-1 w-full h-9 rounded-md border border-input bg-background px-3 text-sm">
              {CATEGORY_OPTIONS.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs font-semibold text-muted-foreground">Rarity</label>
            <select aria-label="Badge rarity" value={form.rarity} onChange={e => setField("rarity", e.target.value)}
              className="mt-1 w-full h-9 rounded-md border border-input bg-background px-3 text-sm">
              {RARITY_OPTIONS.map(r => <option key={r} value={r}>{r}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs font-semibold text-muted-foreground">XP Reward</label>
            <Input aria-label="XP reward" type="number" value={form.xp_reward} onChange={e => setField("xp_reward", Number(e.target.value))} className="mt-1" />
          </div>
        </div>

        {/* Rarity preview */}
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-lg flex items-center justify-center" style={{ backgroundColor: rarityColor(form.rarity) + "15" }}>
            <Award className="w-6 h-6" style={{ color: rarityColor(form.rarity) }} />
          </div>
          <div>
            <span className="px-2 py-0.5 text-xs font-semibold rounded-full" style={{ backgroundColor: rarityColor(form.rarity) + "15", color: rarityColor(form.rarity) }}>
              {form.rarity}
            </span>
            <span className="text-xs text-muted-foreground ml-2">+{form.xp_reward} XP</span>
          </div>
        </div>

        {/* Criteria builder */}
        <div>
          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 block">Criteria</label>
          <div className="bg-muted/20 border border-border rounded-md p-3 space-y-3">
            <div>
              <label className="text-xs text-muted-foreground">Type</label>
              <select aria-label="Criteria type" value={form.criteria.type || "threshold"} onChange={e => setField("criteria", { type: e.target.value })}
                className="mt-1 w-full h-9 rounded-md border border-input bg-background px-3 text-sm">
                {CRITERIA_TYPES.map(ct => <option key={ct.value} value={ct.value}>{ct.label}</option>)}
              </select>
            </div>
            {form.criteria.type === "threshold" && (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-muted-foreground">Profile field</label>
                  <Input aria-label="Profile field" value={form.criteria.field || ""} onChange={e => setCriteria("field", e.target.value)} placeholder="total_xp" className="mt-1" />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">Value</label>
                  <Input aria-label="Threshold value" type="number" value={form.criteria.value || ""} onChange={e => setCriteria("value", Number(e.target.value))} placeholder="500" className="mt-1" />
                </div>
              </div>
            )}
            {form.criteria.type === "event_count" && (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-muted-foreground">Event type</label>
                  <Input aria-label="Event type" value={form.criteria.event_type || ""} onChange={e => setCriteria("event_type", e.target.value)} placeholder="content_viewed" className="mt-1" />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">Count</label>
                  <Input aria-label="Event count" type="number" value={form.criteria.count || ""} onChange={e => setCriteria("count", Number(e.target.value))} placeholder="10" className="mt-1" />
                </div>
              </div>
            )}
            {form.criteria.type === "milestone" && (
              <div>
                <label className="text-xs text-muted-foreground">Milestone type</label>
                <Input aria-label="Milestone type" value={form.criteria.milestone_type || ""} onChange={e => setCriteria("milestone_type", e.target.value)} placeholder="salvation" className="mt-1" />
              </div>
            )}
            {form.criteria.type === "streak" && (
              <div>
                <label className="text-xs text-muted-foreground">Minimum days</label>
                <Input aria-label="Minimum days" type="number" value={form.criteria.min_days || ""} onChange={e => setCriteria("min_days", Number(e.target.value))} placeholder="7" className="mt-1" />
              </div>
            )}
            {form.criteria.type === "journey" && (
              <div>
                <label className="text-xs text-muted-foreground">Journey type</label>
                <Input aria-label="Journey type" value={form.criteria.journey_type || ""} onChange={e => setCriteria("journey_type", e.target.value)} placeholder="growth" className="mt-1" />
              </div>
            )}
          </div>
        </div>

        {/* Active toggle */}
        <div className="flex items-center gap-2">
          <Switch aria-label="Toggle badge active state" checked={form.is_active} onCheckedChange={(v) => setField("is_active", v)} />
          <span className="text-sm text-foreground">{form.is_active ? "Active" : "Inactive"}</span>
        </div>
      </div>

      <div className="flex justify-end gap-2 mt-5 pt-4 border-t border-border">
        <Button variant="outline" onClick={onClose}>Cancel</Button>
        <Button onClick={handleSave} disabled={saving}>
          {saving ? "Saving..." : editBadge ? "Update Badge" : "Create Badge"}
        </Button>
      </div>
    </Modal>
  );
}

// ─── Badges Tab ─────────────────────────────────────────────────────────────

function BadgesTab({ accountId }: { accountId: string }) {
  const [badges, setBadges] = useState<BadgeDefinition[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingBadge, setEditingBadge] = useState<BadgeDefinition | null>(null);

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

  const handleSaved = (badge: BadgeDefinition) => {
    setBadges(prev => {
      const idx = prev.findIndex(b => b.id === badge.id);
      if (idx >= 0) { const next = [...prev]; next[idx] = badge; return next; }
      return [badge, ...prev];
    });
    setEditingBadge(null);
  };

  const handleDelete = async (id: string) => {
    await AdminBadgesService.delete(id);
    setBadges(prev => prev.filter(b => b.id !== id));
    toast.success("Badge deleted");
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
        <Button size="sm" onClick={() => { setEditingBadge(null); setShowForm(true); }} className="ml-auto">
          <Plus className="w-3.5 h-3.5 mr-1" /> New Badge
        </Button>
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
                    "rounded-sm border p-4 transition-all group",
                    badge.is_active ? "bg-card border-border" : "bg-muted/30 border-border opacity-60"
                  )}
                >
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: color + "15" }}>
                      <Award className="w-5 h-5" style={{ color }} />
                    </div>
                    <div className="flex items-center gap-1">
                      <button onClick={() => { setEditingBadge(badge); setShowForm(true); }}
                        className="p-1 text-muted-foreground hover:text-primary transition-colors opacity-0 group-hover:opacity-100">
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={() => handleDelete(badge.id)}
                        className="p-1 text-muted-foreground hover:text-destructive transition-colors opacity-0 group-hover:opacity-100">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                      <Switch aria-label={`Toggle ${badge.name} active state`} checked={badge.is_active} onCheckedChange={() => handleToggle(badge)} />
                    </div>
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

      <BadgeFormModal
        isOpen={showForm}
        onClose={() => { setShowForm(false); setEditingBadge(null); }}
        onSaved={handleSaved}
        editBadge={editingBadge}
        accountId={accountId}
      />
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
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{label}</span>
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

      {/* Milestone Funnel */}
      <div className="rounded-sm bg-card border border-border p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-bold text-foreground">Milestone Funnel</h3>
          <span className="text-xs text-muted-foreground uppercase tracking-wider">
            Touchpoint → Decision
          </span>
        </div>
        {(() => {
          const funnel = data.milestone_funnel || [];
          if (funnel.length === 0) {
            return <div className="text-xs text-muted-foreground py-4 text-center">No journey data yet.</div>;
          }
          const max = Math.max(1, ...funnel.map(f => f.count));
          const top = funnel[0]?.count || 0;
          // Stage-specific colors that read as a progression
          const STAGE_COLORS: Record<string, string> = {
            "Touchpoint": "#94a3b8",
            "Engaged":    "#3b82f6",
            "Active Journey": "#10b981",
            "Decision":   "#a855f7",
          };
          return (
            <div className="space-y-2">
              {funnel.map((f, i) => {
                const widthPct = (f.count / max) * 100;
                const prev = i > 0 ? funnel[i - 1].count : 0;
                const stepConversion = prev > 0 ? Math.round((f.count / prev) * 100) : null;
                const overallConversion = top > 0 ? Math.round((f.count / top) * 100) : 0;
                const color = STAGE_COLORS[f.stage] || "#3b82f6";
                return (
                  <div key={f.stage}>
                    {i > 0 && stepConversion !== null && (
                      <div className="flex items-center gap-2 pl-3 py-1">
                        <div className="w-px h-3 bg-border" />
                        <span className="text-xs text-muted-foreground font-medium">
                          {stepConversion}% continued
                        </span>
                      </div>
                    )}
                    <div className="flex items-center gap-3">
                      <div className="w-32 shrink-0 text-xs font-semibold text-foreground">{f.stage}</div>
                      <div className="flex-1 h-8 bg-muted/30 rounded-md overflow-hidden">
                        <div
                          className="h-full flex items-center justify-end pr-3 transition-all"
                          style={{ width: `${Math.max(widthPct, 4)}%`, backgroundColor: color }}
                        >
                          <span className="text-xs font-bold text-white">{f.count}</span>
                        </div>
                      </div>
                      <div className="w-12 shrink-0 text-right text-xs font-semibold text-muted-foreground">
                        {overallConversion}%
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          );
        })()}
      </div>

      {/* Engagement Correlation */}
      <div className="rounded-sm bg-card border border-border p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-bold text-foreground">Engagement Correlation</h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              Each dot is one seeker. X = engagement events (last 30 days), Y = total XP.
            </p>
          </div>
          <div className="flex items-center gap-3 text-xs">
            {(["bronze", "silver", "gold", "platinum"] as const).map((t) => (
              <div key={t} className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: TIER_COLORS[t] }} />
                <span className="capitalize text-muted-foreground">{t}</span>
              </div>
            ))}
          </div>
        </div>
        {(() => {
          const points = data.engagement_correlation || [];
          if (points.length === 0) {
            return <div className="text-xs text-muted-foreground py-4 text-center">No seeker data yet.</div>;
          }
          // Group by tier so each tier gets its own colored Scatter series.
          const tiers: Array<"bronze" | "silver" | "gold" | "platinum"> = ["bronze", "silver", "gold", "platinum"];
          const byTier = tiers.map((tier) => ({
            tier,
            data: points
              .filter((p) => p.tier === tier)
              .map((p) => ({
                x: p.engagement_events,
                y: p.total_xp,
                actor: p.actor_id,
                streak: p.current_streak,
              })),
          }));
          return (
            <ResponsiveContainer width="100%" height={300}>
              <ScatterChart margin={{ top: 10, right: 16, bottom: 24, left: 8 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis
                  type="number"
                  dataKey="x"
                  name="Engagement events"
                  tick={{ fontSize: 11 }}
                  label={{ value: "Engagement events (30d)", position: "insideBottom", offset: -10, fontSize: 11, fill: "#94a3b8" }}
                />
                <YAxis
                  type="number"
                  dataKey="y"
                  name="Total XP"
                  tick={{ fontSize: 11 }}
                  label={{ value: "Total XP", angle: -90, position: "insideLeft", fontSize: 11, fill: "#94a3b8" }}
                />
                <ZAxis range={[60, 220]} />
                <Tooltip
                  cursor={{ strokeDasharray: "3 3" }}
                  content={({ active, payload }) => {
                    if (!active || !payload || payload.length === 0) return null;
                    const p: any = payload[0].payload;
                    return (
                      <div className="rounded-md border border-border bg-card px-3 py-2 shadow-sm text-xs">
                        <div className="font-bold text-foreground">{p.actor}</div>
                        <div className="text-muted-foreground mt-1 space-y-0.5">
                          <div>Engagement: <span className="text-foreground font-semibold">{p.x}</span></div>
                          <div>Total XP: <span className="text-foreground font-semibold">{p.y}</span></div>
                          <div>Streak: <span className="text-foreground font-semibold">{p.streak}</span></div>
                        </div>
                      </div>
                    );
                  }}
                />
                {byTier.map(({ tier, data: tdata }) => (
                  tdata.length > 0 && (
                    <Scatter key={tier} name={tier} data={tdata} fill={TIER_COLORS[tier]} />
                  )
                ))}
              </ScatterChart>
            </ResponsiveContainer>
          );
        })()}
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
                    <span className="text-xs font-semibold text-muted-foreground">{b.rate}%</span>
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

// ─── Re-engagement Tab ─────────────────────────────────────────────────────

const TRIGGER_TYPE_CONFIG: Record<string, { color: string; bg: string; label: string }> = {
  manual: { color: "#64748b", bg: "#f1f5f9", label: "Manual" },
  streak_broken: { color: "#f59e0b", bg: "#fffbeb", label: "Streak Broken" },
  silence: { color: "#ef4444", bg: "#fef2f2", label: "Silence" },
  dropout_risk: { color: "#dc2626", bg: "#fef2f2", label: "Dropout Risk" },
};

const DRIP_STATUS_CONFIG: Record<string, { color: string; icon: any }> = {
  pending: { color: "#f59e0b", icon: Clock },
  sent: { color: "#3b82f6", icon: Send },
  delivered: { color: "#10b981", icon: CheckCircle },
  failed: { color: "#ef4444", icon: XCircle },
};

function ReengagementTab({ accountId }: { accountId: string }) {
  const [templates, setTemplates] = useState<ReengagementTemplate[]>([]);
  const [enrollments, setEnrollments] = useState<AutomationEnrollment[]>([]);
  const [enrollmentsLoading, setEnrollmentsLoading] = useState(false);
  const [enrollmentStatusFilter, setEnrollmentStatusFilter] = useState<"all" | "active" | "completed" | "cancelled">("active");
  const [enrollmentTemplateFilter, setEnrollmentTemplateFilter] = useState<string>("all");
  const [loading, setLoading] = useState(true);
  const [subView, setSubView] = useState<"templates" | "enrollments">("templates");
  const [showForm, setShowForm] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<ReengagementTemplate | null>(null);

  // Template form state
  const [tForm, setTForm] = useState({
    slug: "", name: "", description: "", trigger_type: "silence" as string,
    steps: [{ delay_hours: 0, channel: "in_app", message: "" }] as Array<{ delay_hours: number; channel: string; message: string }>,
    is_active: true,
  });

  useEffect(() => {
    Promise.all([
      ReengagementService.listTemplates(accountId),
    ]).then(([tRes]) => {
      if (tRes.data) setTemplates(Array.isArray(tRes.data) ? tRes.data : []);
      setLoading(false);
    });
  }, [accountId]);

  // Load enrollments tenant-wide whenever the sub-view or filters change.
  useEffect(() => {
    if (subView !== "enrollments") return;
    let cancelled = false;
    setEnrollmentsLoading(true);
    AdminReengagementService.listAllEnrollments(accountId, {
      status: enrollmentStatusFilter,
      templateId: enrollmentTemplateFilter !== "all" ? enrollmentTemplateFilter : undefined,
      limit: 200,
    })
      .then((res) => {
        if (cancelled) return;
        const list = Array.isArray(res.data) ? res.data : [];
        setEnrollments(list);
      })
      .catch(() => { if (!cancelled) setEnrollments([]); })
      .finally(() => { if (!cancelled) setEnrollmentsLoading(false); });
    return () => { cancelled = true; };
  }, [subView, accountId, enrollmentStatusFilter, enrollmentTemplateFilter]);

  const cancelEnrollment = async (id: string) => {
    try {
      await ReengagementService.cancelEnrollment(id);
      setEnrollments(prev => prev.map(e => e.id === id ? { ...e, status: "cancelled" } : e));
      toast.success("Enrollment cancelled");
    } catch {
      toast.error("Failed to cancel enrollment");
    }
  };

  const openCreateTemplate = () => {
    setEditingTemplate(null);
    setTForm({ slug: "", name: "", description: "", trigger_type: "silence", steps: [{ delay_hours: 0, channel: "in_app", message: "" }], is_active: true });
    setShowForm(true);
  };

  const openEditTemplate = (t: ReengagementTemplate) => {
    setEditingTemplate(t);
    setTForm({
      slug: t.slug, name: t.name, description: t.description || "",
      trigger_type: t.trigger_type, steps: t.steps || [{ delay_hours: 0, channel: "in_app", message: "" }],
      is_active: t.is_active,
    });
    setShowForm(true);
  };

  const autoSlug = (name: string) => name.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "");

  const addStep = () => setTForm(prev => ({ ...prev, steps: [...prev.steps, { delay_hours: 24, channel: "in_app", message: "" }] }));
  const removeStep = (i: number) => setTForm(prev => ({ ...prev, steps: prev.steps.filter((_, idx) => idx !== i) }));
  const updateStep = (i: number, key: string, val: any) => {
    setTForm(prev => {
      const next = [...prev.steps];
      (next[i] as any)[key] = val;
      return { ...prev, steps: next };
    });
  };

  const handleSaveTemplate = async () => {
    if (!tForm.name.trim() || !tForm.slug.trim()) {
      toast.error("Name and slug are required");
      return;
    }
    try {
      const payload = { account_id: accountId, ...tForm };
      if (editingTemplate) {
        const { data } = await AdminReengagementService.updateTemplate(editingTemplate.id, payload);
        if (data) {
          setTemplates(prev => prev.map(t => t.id === data.id ? data : t));
          toast.success("Template updated");
        }
      } else {
        const { data } = await AdminReengagementService.createTemplate(payload);
        if (data) {
          setTemplates(prev => [data, ...prev]);
          toast.success("Template created");
        }
      }
      setShowForm(false);
    } catch (e) {
      toast.error("Failed to save template");
    }
  };

  const handleDeleteTemplate = async (id: string) => {
    await AdminReengagementService.deleteTemplate(id);
    setTemplates(prev => prev.filter(t => t.id !== id));
    toast.success("Template deleted");
  };

  const handleToggleTemplate = async (t: ReengagementTemplate) => {
    const { data } = await AdminReengagementService.updateTemplate(t.id, { is_active: !t.is_active });
    if (data) {
      setTemplates(prev => prev.map(x => x.id === t.id ? { ...x, is_active: !x.is_active } : x));
      toast.success(`Template ${t.is_active ? "disabled" : "enabled"}`);
    }
  };

  if (loading) return <div className="py-12 text-center text-muted-foreground">Loading re-engagement data...</div>;

  return (
    <div className="space-y-4">
      {/* Sub-tab switcher */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="inline-flex items-center gap-1 bg-muted/60 border border-border rounded-full p-1">
          {([
            { key: "templates" as const, label: "Templates", icon: Mail },
            { key: "enrollments" as const, label: "Enrollments", icon: Users },
          ]).map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setSubView(key)}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-full transition-all",
                subView === key ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Icon className="w-3 h-3" />
              {label}
            </button>
          ))}
        </div>
        <Badge variant="secondary">{templates.length} templates</Badge>
        {subView === "templates" && (
          <Button size="sm" onClick={openCreateTemplate} className="ml-auto">
            <Plus className="w-3.5 h-3.5 mr-1" /> New Template
          </Button>
        )}
      </div>

      {/* Templates view */}
      {subView === "templates" && (
        <div className="space-y-3">
          {templates.length === 0 && (
            <div className="py-12 text-center text-muted-foreground">
              <Mail className="w-10 h-10 mx-auto mb-3 opacity-40" />
              <p className="text-sm">No re-engagement templates yet</p>
            </div>
          )}
          {templates.map(t => {
            const trigConf = TRIGGER_TYPE_CONFIG[t.trigger_type] || TRIGGER_TYPE_CONFIG.manual;
            return (
              <div key={t.id} className={cn(
                "bg-card border border-border rounded-sm p-4 group transition-all",
                !t.is_active && "opacity-60"
              )}>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-semibold text-foreground text-sm">{t.name}</h4>
                      <span className="px-2 py-0.5 text-xs font-semibold rounded-full uppercase" style={{ backgroundColor: trigConf.bg, color: trigConf.color }}>
                        {trigConf.label}
                      </span>
                      <code className="text-xs bg-muted px-1.5 py-0.5 rounded text-muted-foreground">{t.slug}</code>
                    </div>
                    {t.description && <p className="text-xs text-muted-foreground mb-2">{t.description}</p>}
                    {/* Steps preview */}
                    <div className="flex items-center gap-2 flex-wrap">
                      {(t.steps || []).map((s, i) => (
                        <div key={i} className="flex items-center gap-1 text-xs text-muted-foreground bg-muted/30 px-2 py-1 rounded">
                          <Clock className="w-3 h-3" />
                          <span>{s.delay_hours}h</span>
                          <span className="text-muted-foreground">·</span>
                          <span>{s.channel}</span>
                        </div>
                      ))}
                      <span className="text-xs text-muted-foreground">{(t.steps || []).length} step{(t.steps || []).length !== 1 ? "s" : ""}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <button onClick={() => openEditTemplate(t)} className="p-1.5 text-muted-foreground hover:text-primary transition-colors opacity-0 group-hover:opacity-100">
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button onClick={() => handleDeleteTemplate(t.id)} className="p-1.5 text-muted-foreground hover:text-destructive transition-colors opacity-0 group-hover:opacity-100">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                    <Switch aria-label={`Toggle ${t.name} active state`} checked={t.is_active} onCheckedChange={() => handleToggleTemplate(t)} />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Enrollments view */}
      {subView === "enrollments" && (
        <div className="space-y-3">
          {/* Filter bar */}
          <div className="flex items-center gap-3 flex-wrap">
            <div className="inline-flex items-center gap-1 bg-muted/60 border border-border rounded-full p-1">
              {(["active", "completed", "cancelled", "all"] as const).map((s) => (
                <button
                  key={s}
                  onClick={() => setEnrollmentStatusFilter(s)}
                  className={cn(
                    "px-3 py-1 text-xs font-semibold rounded-full transition-all capitalize",
                    enrollmentStatusFilter === s ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  {s}
                </button>
              ))}
            </div>
            {templates.length > 0 && (
              <select
                aria-label="Filter by template"
                value={enrollmentTemplateFilter}
                onChange={e => setEnrollmentTemplateFilter(e.target.value)}
                className="h-8 text-xs rounded-md border border-input bg-background px-2"
              >
                <option value="all">All templates</option>
                {templates.map(t => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select>
            )}
            <span className="text-xs text-muted-foreground ml-auto">
              {enrollmentsLoading ? "Loading…" : `${enrollments.length} ${enrollments.length === 1 ? "enrollment" : "enrollments"}`}
            </span>
          </div>

          {/* Table */}
          {enrollmentsLoading ? (
            <div className="py-12 text-center text-muted-foreground text-sm">Loading enrollments…</div>
          ) : enrollments.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground">
              <Users className="w-10 h-10 mx-auto mb-3 opacity-40" />
              <p className="text-sm font-medium">No enrollments match these filters</p>
              <p className="text-xs mt-1">Enrollments are created automatically when behavior rules fire — e.g. when the Streak Worker breaks a seeker's streak.</p>
            </div>
          ) : (
            <div className="border border-border rounded-lg overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-muted/40">
                  <tr className="text-left text-xs uppercase tracking-wider text-muted-foreground">
                    <th className="px-3 py-2 font-semibold">Template</th>
                    <th className="px-3 py-2 font-semibold">Actor</th>
                    <th className="px-3 py-2 font-semibold">Status</th>
                    <th className="px-3 py-2 font-semibold">Step</th>
                    <th className="px-3 py-2 font-semibold">Enrolled</th>
                    <th className="px-3 py-2 font-semibold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {enrollments.map((e) => {
                    const tmpl = e.reengagement_templates;
                    const stepsCount = Array.isArray(tmpl?.steps) ? tmpl!.steps.length : 0;
                    const statusColor = e.status === "active"
                      ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                      : e.status === "completed"
                      ? "bg-blue-50 text-blue-700 border-blue-200"
                      : "bg-slate-100 text-slate-600 border-slate-200";
                    const triggerLabel = tmpl?.trigger_type?.replace(/_/g, " ") || "manual";
                    return (
                      <tr key={e.id} className="border-t border-border hover:bg-muted/20">
                        <td className="px-3 py-2">
                          <div className="font-semibold">{tmpl?.name || "—"}</div>
                          <div className="text-xs text-muted-foreground capitalize">{triggerLabel}</div>
                        </td>
                        <td className="px-3 py-2">
                          <div className="font-mono text-xs">{e.actor_id}</div>
                          <div className="text-xs text-muted-foreground capitalize">{e.actor_type}</div>
                        </td>
                        <td className="px-3 py-2">
                          <span className={cn("inline-block px-2 py-0.5 text-xs font-semibold border rounded-full capitalize", statusColor)}>
                            {e.status}
                          </span>
                        </td>
                        <td className="px-3 py-2 text-xs">
                          {e.current_step + 1}{stepsCount > 0 ? ` / ${stepsCount}` : ""}
                        </td>
                        <td className="px-3 py-2 text-xs text-muted-foreground">
                          {new Date(e.enrolled_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                        </td>
                        <td className="px-3 py-2 text-right">
                          {e.status === "active" && (
                            <button
                              onClick={() => cancelEnrollment(e.id)}
                              className="text-xs font-semibold text-red-600 hover:underline"
                            >
                              Cancel
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Template Form Modal */}
      <Modal isOpen={showForm} onClose={() => setShowForm(false)} title={editingTemplate ? "Edit Template" : "Create Template"} size="3xl">
        <div className="space-y-5 max-h-[70vh] overflow-y-auto pr-1">
          {/* Name + Slug */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-muted-foreground">Name *</label>
              <Input aria-label="Template name" value={tForm.name} onChange={e => { setTForm(p => ({ ...p, name: e.target.value })); if (!editingTemplate) setTForm(p => ({ ...p, slug: autoSlug(e.target.value) })); }} placeholder="e.g. We Miss You" className="mt-1" />
            </div>
            <div>
              <label className="text-xs font-semibold text-muted-foreground">Slug *</label>
              <Input aria-label="Template slug" value={tForm.slug} onChange={e => setTForm(p => ({ ...p, slug: e.target.value }))} placeholder="we_miss_you" className="mt-1" />
            </div>
          </div>

          {/* Description + Trigger */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-muted-foreground">Description</label>
              <Input aria-label="Template description" value={tForm.description} onChange={e => setTForm(p => ({ ...p, description: e.target.value }))} placeholder="Re-engage silent seekers" className="mt-1" />
            </div>
            <div>
              <label className="text-xs font-semibold text-muted-foreground">Trigger Type</label>
              <select aria-label="Trigger type" value={tForm.trigger_type} onChange={e => setTForm(p => ({ ...p, trigger_type: e.target.value }))}
                className="mt-1 w-full h-9 rounded-md border border-input bg-background px-3 text-sm">
                <option value="manual">Manual</option>
                <option value="streak_broken">Streak Broken</option>
                <option value="silence">Silence</option>
                <option value="dropout_risk">Dropout Risk</option>
              </select>
            </div>
          </div>

          {/* Steps builder */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Drip Steps</label>
              <button onClick={addStep} className="text-xs text-primary font-semibold flex items-center gap-1 hover:underline">
                <Plus className="w-3 h-3" /> Add step
              </button>
            </div>
            <div className="space-y-2">
              {tForm.steps.map((s, i) => (
                <div key={i} className="bg-muted/20 border border-border rounded-md p-3 space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-muted-foreground w-16">Step {i + 1}</span>
                    <div className="flex-1 grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-xs text-muted-foreground">Delay (hours)</label>
                        <Input aria-label="Step delay hours" type="number" value={s.delay_hours} onChange={e => updateStep(i, "delay_hours", Number(e.target.value))} className="mt-0.5" />
                      </div>
                      <div>
                        <label className="text-xs text-muted-foreground">Channel</label>
                        <select aria-label="Step channel" value={s.channel} onChange={e => updateStep(i, "channel", e.target.value)}
                          className="mt-0.5 w-full h-9 rounded-md border border-input bg-background px-2 text-sm">
                          <option value="in_app">In-App</option>
                          <option value="push">Push</option>
                          <option value="sms">SMS</option>
                          <option value="whatsapp">WhatsApp</option>
                        </select>
                      </div>
                    </div>
                    <button onClick={() => removeStep(i)} className="p-1 text-muted-foreground hover:text-destructive self-start mt-4">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground">Message</label>
                    <Input aria-label="Step message" value={s.message} onChange={e => updateStep(i, "message", e.target.value)} placeholder="Hey {FIRST_NAME}, we noticed..." className="mt-0.5" />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Active toggle */}
          <div className="flex items-center gap-2">
            <Switch aria-label="Toggle template active state" checked={tForm.is_active} onCheckedChange={(v) => setTForm(p => ({ ...p, is_active: v }))} />
            <span className="text-sm text-foreground">{tForm.is_active ? "Active" : "Inactive"}</span>
          </div>
        </div>

        <div className="flex justify-end gap-2 mt-5 pt-4 border-t border-border">
          <Button variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
          <Button onClick={handleSaveTemplate}>
            {editingTemplate ? "Update Template" : "Create Template"}
          </Button>
        </div>
      </Modal>
    </div>
  );
}
