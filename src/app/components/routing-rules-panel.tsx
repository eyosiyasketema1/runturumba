import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import {
  Plus, Trash2, Edit2, GripVertical,
  Globe, ChevronDown, X, Bot, Search,
  MessageSquare, Smartphone, Mail, Send, Facebook, Server,
  Info, GitBranch, Filter, SlidersHorizontal, ArrowLeft,
  CheckCircle2, Circle, Zap, Users, ListFilter,
} from "lucide-react";
import { useDrag, useDrop, DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import { motion, AnimatePresence } from "motion/react";
import { toast } from "sonner";
import {
  cn,
  type ConversationRule, type ChatEndpoint,
  type AudienceMode, type CreationMode, type ReopenPolicy,
  type User, type TeamGroup, type Group,
} from "./types";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Switch } from "./ui/switch";
import { Badge } from "./ui/badge";
import { Modal } from "./shared-ui";

// ─── Constants ────────────────────────────────────────────────────────────────

const RULE_DRAG_TYPE = "CONV_RULE_PANEL";

const CHANNEL_SOURCE_OPTIONS = [
  { id: "whatsapp",  label: "WhatsApp",  icon: MessageSquare, color: "text-emerald-600" },
  { id: "sms",       label: "SMS",       icon: Smartphone,    color: "text-blue-600" },
  { id: "email",     label: "Email",     icon: Mail,          color: "text-purple-600" },
  { id: "telegram",  label: "Telegram",  icon: Send,          color: "text-sky-600" },
  { id: "messenger", label: "Messenger", icon: Facebook,      color: "text-blue-500" },
  { id: "smpp",      label: "SMPP",      icon: Server,        color: "text-gray-600" },
];

const AUDIENCE_MODE_OPTIONS: { id: AudienceMode; label: string; description: string }[] = [
  { id: "all",       label: "All Users",           description: "Any inbound contact" },
  { id: "known",     label: "Known Contacts Only",  description: "Contacts already in your CRM" },
  { id: "groups",    label: "Specific Groups",      description: "Select allowed contact groups" },
  { id: "allowlist", label: "Allowlist",            description: "Specific contacts only" },
];

const REOPEN_POLICY_OPTIONS: { id: ReopenPolicy; label: string; description: string }[] = [
  { id: "always_reopen", label: "Always Reopen Existing Conversation", description: "Continue any prior conversation" },
  { id: "always_new",    label: "Always Create New Conversation",      description: "Fresh thread for every contact" },
  { id: "threshold",     label: "Reopen Within Time Threshold",        description: "Reopen if within configured hours" },
];

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getSourceLabel(sourceId: string, endpoints: ChatEndpoint[]) {
  const ch = CHANNEL_SOURCE_OPTIONS.find(c => c.id === sourceId);
  if (ch) return ch;
  const ep = endpoints.find(e => e.id === sourceId);
  if (ep) return { label: ep.name, icon: Bot, color: "text-primary" };
  return { label: sourceId, icon: Globe, color: "text-muted-foreground" };
}

// ─── Draggable Rule Row ───────────────────────────────────────────────────────

interface DragItem { id: string; index: number }

function DraggableRuleRow({
  rule, index, moveRule, endpoints, teamGroups,
  onEdit, onToggle, onDelete,
}: {
  rule: ConversationRule;
  index: number;
  moveRule: (di: number, hi: number) => void;
  endpoints: ChatEndpoint[];
  teamGroups: TeamGroup[];
  onEdit: (r: ConversationRule) => void;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  const rowRef  = useRef<HTMLDivElement>(null);
  const gripRef = useRef<HTMLDivElement>(null);

  const [{ isDragging }, drag, dragPreview] = useDrag<DragItem, unknown, { isDragging: boolean }>(
    () => ({
      type: RULE_DRAG_TYPE,
      item: () => ({ id: rule.id, index }),
      collect: m => ({ isDragging: m.isDragging() }),
    }),
    [rule.id, index],
  );

  const [, drop] = useDrop<DragItem>({
    accept: RULE_DRAG_TYPE,
    hover(item, monitor) {
      if (!rowRef.current) return;
      const di = item.index, hi = index;
      if (di === hi) return;
      const rect = rowRef.current.getBoundingClientRect();
      const mid  = (rect.bottom - rect.top) / 2;
      const off  = monitor.getClientOffset();
      if (!off) return;
      const cy = off.y - rect.top;
      if (di < hi && cy < mid) return;
      if (di > hi && cy > mid) return;
      moveRule(di, hi);
      item.index = hi;
    },
  });

  dragPreview(drop(rowRef));
  drag(gripRef);

  const audienceCfg: Record<AudienceMode, { label: string; color: string }> = {
    all:       { label: "All Users",       color: "bg-blue-50 text-blue-600 border-blue-200" },
    known:     { label: "Known Contacts",  color: "bg-amber-50 text-amber-600 border-amber-200" },
    groups:    { label: "Specific Groups", color: "bg-purple-50 text-purple-700 border-purple-200" },
    allowlist: { label: "Allowlist",       color: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  };

  const creationCfg: Record<CreationMode, { label: string; color: string }> = {
    auto:   { label: "Auto",   color: "bg-emerald-50 text-emerald-700 border-emerald-200" },
    manual: { label: "Manual", color: "bg-orange-50 text-orange-600 border-orange-200" },
  };

  return (
    <div
      ref={rowRef}
      style={{ opacity: isDragging ? 0.4 : 1 }}
      className={cn(
        "group bg-background hover:bg-muted/20 transition-all duration-200",
        isDragging && "shadow-lg ring-1 ring-primary/20"
      )}
    >
      {/* Match header: grip(w-4) · #(w-6) · name/sources(flex-1) · audience(w-32) · mode(w-24) · status(w-20) · actions(w-16) */}
      <div className="flex items-center gap-4 px-6 py-4">

        {/* Grip — w-4 */}
        <div
          ref={gripRef}
          className="w-4 shrink-0 cursor-grab active:cursor-grabbing text-muted-foreground/30 hover:text-muted-foreground transition-colors"
          title="Drag to reorder"
        >
          <GripVertical className="w-4 h-4" />
        </div>

        {/* Priority — w-6 */}
        <div className="w-6 shrink-0 flex items-center justify-center">
          <span className="text-xs font-bold text-primary">{rule.priority}</span>
        </div>

        {/* Name + Sources — flex-1 */}
        <div className="flex-1 min-w-0 space-y-1">
          <p className="font-semibold text-sm text-foreground truncate">{rule.name}</p>
          <div className="flex flex-wrap gap-1">
            {rule.sources.map(src => {
              const s = getSourceLabel(src, endpoints);
              return (
                <span key={src} className="inline-flex items-center gap-1 text-xs font-semibold px-1.5 py-0.5 bg-muted border border-border text-muted-foreground">
                  <s.icon className={cn("w-2.5 h-2.5", s.color)} />
                  {s.label}
                </span>
              );
            })}
          </div>
        </div>

        {/* Audience — w-32 */}
        <div className="w-32 shrink-0">
          <span className={cn("inline-block text-xs font-semibold px-1.5 py-0.5 border", audienceCfg[rule.audienceMode].color)}>
            {audienceCfg[rule.audienceMode].label}
          </span>
        </div>

        {/* Mode — w-24 */}
        <div className="w-24 shrink-0">
          <span className={cn("inline-block text-xs font-semibold px-1.5 py-0.5 border", creationCfg[rule.creationMode].color)}>
            {creationCfg[rule.creationMode].label}
          </span>
        </div>

        {/* Status — w-20 (switch) */}
        <div className="w-20 shrink-0 flex items-center gap-2">
          <Switch
            checked={rule.active}
            onCheckedChange={() => onToggle(rule.id)}
            title={rule.active ? "Deactivate rule" : "Activate rule"}
          />
          <span className={cn(
            "text-xs font-semibold",
            rule.active ? "text-emerald-600" : "text-muted-foreground"
          )}>
            {rule.active ? "On" : "Off"}
          </span>
        </div>

        {/* Actions — w-16 */}
        <div className="w-16 shrink-0 flex items-center justify-end gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={() => onEdit(rule)}
            className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            title="Edit"
          >
            <Edit2 className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => onDelete(rule.id)}
            className="p-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/5 transition-colors"
            title="Delete"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>

      </div>
    </div>
  );
}

// ─── Rule Form Modal ──────────────────────────────────────────────────────────

const BLANK_RULE_FORM = {
  name:              "",
  priority:          1,
  sources:           [] as string[],
  audienceMode:      "all"           as AudienceMode,
  allowedGroups:     [] as string[],
  allowedContacts:   [] as string[],
  creationMode:      "auto"          as CreationMode,
  reopenPolicy:      "always_reopen" as ReopenPolicy,
  reopenWindowHours: 24,
  defaultTeam:       "",
  defaultAssignee:   "",
  active:            true,
};
type RuleForm = typeof BLANK_RULE_FORM;

function RuleFormModal({
  isOpen, onClose, rule, onSave, chatEndpoints, groups, teamGroups, users,
}: {
  isOpen: boolean;
  onClose: () => void;
  rule?: ConversationRule | null;
  onSave: (data: RuleForm) => void;
  chatEndpoints: ChatEndpoint[];
  groups: Group[];
  teamGroups: TeamGroup[];
  users: User[];
}) {
  const [form, setForm] = useState<RuleForm>(BLANK_RULE_FORM);
  const [sourceOpen, setSourceOpen]       = useState(false);
  const [contactSearch, setContactSearch] = useState("");
  const dropRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    setSourceOpen(false);
    setContactSearch("");
    if (rule) {
      setForm({
        name:              rule.name,
        priority:          rule.priority,
        sources:           [...rule.sources],
        audienceMode:      rule.audienceMode,
        allowedGroups:     rule.allowedGroups   ? [...rule.allowedGroups]   : [],
        allowedContacts:   rule.allowedContacts ? [...rule.allowedContacts] : [],
        creationMode:      rule.creationMode,
        reopenPolicy:      rule.reopenPolicy,
        reopenWindowHours: rule.reopenWindowHours ?? 24,
        defaultTeam:       rule.defaultTeam     ?? "",
        defaultAssignee:   rule.defaultAssignee ?? "",
        active:            rule.active,
      });
    } else {
      setForm({ ...BLANK_RULE_FORM });
    }
  }, [isOpen, rule?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!sourceOpen) return;
    const handler = (e: MouseEvent) => {
      if (dropRef.current && !dropRef.current.contains(e.target as Node)) setSourceOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [sourceOpen]);

  const set = (key: keyof RuleForm, value: any) => setForm(prev => ({ ...prev, [key]: value }));

  const toggleSource  = (id: string) => setForm(prev => ({ ...prev, sources:        prev.sources.includes(id)        ? prev.sources.filter(s => s !== id)        : [...prev.sources, id] }));
  const toggleGroup   = (id: string) => setForm(prev => ({ ...prev, allowedGroups:  prev.allowedGroups.includes(id)  ? prev.allowedGroups.filter(g => g !== id)  : [...prev.allowedGroups, id] }));
  const toggleContact = (id: string) => setForm(prev => ({ ...prev, allowedContacts: prev.allowedContacts.includes(id) ? prev.allowedContacts.filter(c => c !== id) : [...prev.allowedContacts, id] }));

  const handleSubmit = () => {
    if (!form.name.trim())         { toast.error("Rule name is required");      return; }
    if (form.sources.length === 0) { toast.error("Select at least one source"); return; }
    onSave(form);
    onClose();
    toast.success(rule ? "Routing updated" : "Routing created");
  };

  const allSourceOptions = [
    ...CHANNEL_SOURCE_OPTIONS,
    ...chatEndpoints.map(ep => ({ id: ep.id, label: ep.name, icon: Bot, color: "text-primary" })),
  ];

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={rule ? "Edit Conversation Rule" : "New Conversation Rule"} size="2xl">
      <div className="space-y-5">
        {/* Name + Priority */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="sm:col-span-2 space-y-1.5">
            <Label>Rule Name <span className="text-destructive">*</span></Label>
            <Input placeholder="VIP Telegram Support" value={form.name} onChange={e => set("name", e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Priority</Label>
            <Input type="number" min={1} value={form.priority} onChange={e => set("priority", Number(e.target.value))} />
            <p className="text-xs text-muted-foreground">Lower = evaluated first</p>
          </div>
        </div>

        {/* Source Targeting */}
        <div className="space-y-1.5">
          <Label>Source Targeting <span className="text-destructive">*</span></Label>
          <div className="relative" ref={dropRef}>
            <button
              type="button"
              onClick={() => setSourceOpen(v => !v)}
              className="w-full flex items-center justify-between border border-border px-3 py-2 text-sm text-left bg-background hover:bg-muted/20 transition-colors"
            >
              <span className={form.sources.length === 0 ? "text-muted-foreground" : "text-foreground"}>
                {form.sources.length === 0
                  ? "Select channels or endpoints..."
                  : `${form.sources.length} source${form.sources.length > 1 ? "s" : ""} selected`}
              </span>
              <ChevronDown className="w-4 h-4 text-muted-foreground" />
            </button>
            {sourceOpen && (
              <div className="absolute top-full left-0 right-0 z-[70] bg-background border border-border shadow-lg mt-1 max-h-52 overflow-y-auto">
                <div className="p-1">
                  <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest px-2 py-1">Channels</p>
                  {CHANNEL_SOURCE_OPTIONS.map(opt => (
                    <label key={opt.id} className="flex items-center gap-2 px-2 py-1.5 hover:bg-muted/40 cursor-pointer text-sm">
                      <input type="checkbox" checked={form.sources.includes(opt.id)} onChange={() => toggleSource(opt.id)} className="w-3.5 h-3.5 accent-primary" />
                      <opt.icon className={cn("w-3.5 h-3.5", opt.color)} />
                      <span>{opt.label}</span>
                    </label>
                  ))}
                  {chatEndpoints.length > 0 && (
                    <>
                      <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest px-2 py-1 mt-1 border-t border-border pt-2">Chat Endpoints</p>
                      {chatEndpoints.map(ep => (
                        <label key={ep.id} className="flex items-center gap-2 px-2 py-1.5 hover:bg-muted/40 cursor-pointer text-sm">
                          <input type="checkbox" checked={form.sources.includes(ep.id)} onChange={() => toggleSource(ep.id)} className="w-3.5 h-3.5 accent-primary" />
                          <Bot className="w-3.5 h-3.5 text-primary" />
                          <span>{ep.name}</span>
                        </label>
                      ))}
                    </>
                  )}
                </div>
                <div className="border-t border-border p-2 flex justify-end">
                  <Button size="sm" variant="ghost" onClick={() => setSourceOpen(false)}>Done</Button>
                </div>
              </div>
            )}
          </div>
          {form.sources.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-1">
              {form.sources.map(src => {
                const s = allSourceOptions.find(o => o.id === src);
                return s ? (
                  <span key={src} className="inline-flex items-center gap-1 text-xs font-semibold px-1.5 py-0.5 bg-muted border border-border">
                    <s.icon className={cn("w-3 h-3", s.color)} />
                    {s.label}
                    <button onClick={() => toggleSource(src)} className="ml-0.5 hover:text-destructive transition-colors"><X className="w-2.5 h-2.5" /></button>
                  </span>
                ) : null;
              })}
            </div>
          )}
        </div>

        {/* Audience Mode */}
        <div className="space-y-1.5">
          <Label>Audience Mode</Label>
          <select value={form.audienceMode} onChange={e => set("audienceMode", e.target.value as AudienceMode)}
            className="w-full h-10 border border-border bg-background px-3 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring">
            {AUDIENCE_MODE_OPTIONS.map(o => <option key={o.id} value={o.id}>{o.label} — {o.description}</option>)}
          </select>
        </div>

        {/* Groups */}
        {form.audienceMode === "groups" && (
          <div className="space-y-1.5 border border-border p-3 bg-purple-50/30">
            <Label>Allowed Groups</Label>
            <div className="grid grid-cols-2 gap-1">
              {groups.map(g => (
                <label key={g.id} className="flex items-center gap-2 p-2 hover:bg-white/60 cursor-pointer text-sm">
                  <input type="checkbox" checked={form.allowedGroups.includes(g.id)} onChange={() => toggleGroup(g.id)} className="w-3.5 h-3.5 accent-primary" />
                  <span>{g.name}</span>
                  <span className="text-muted-foreground text-xs">({g.contactCount})</span>
                </label>
              ))}
            </div>
          </div>
        )}

        {/* Allowlist */}
        {form.audienceMode === "allowlist" && (
          <div className="space-y-1.5 border border-border p-3 bg-emerald-50/30">
            <Label>Allowed Contacts</Label>
            <div className="relative mb-2">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
              <Input placeholder="Search contacts..." value={contactSearch} onChange={e => setContactSearch(e.target.value)} className="pl-8 text-sm h-9" />
            </div>
            <div className="max-h-36 overflow-y-auto space-y-0.5">
              {users
                .filter(u => !contactSearch || u.name.toLowerCase().includes(contactSearch.toLowerCase()) || u.email.toLowerCase().includes(contactSearch.toLowerCase()))
                .map(u => (
                  <label key={u.id} className="flex items-center gap-2 p-1.5 hover:bg-white/60 cursor-pointer text-sm">
                    <input type="checkbox" checked={form.allowedContacts.includes(u.id)} onChange={() => toggleContact(u.id)} className="w-3.5 h-3.5 accent-primary" />
                    <span>{u.name}</span>
                    <span className="text-muted-foreground text-xs">{u.email}</span>
                  </label>
                ))}
            </div>
          </div>
        )}

        {/* Creation Mode */}
        <div className="space-y-2">
          <Label>Creation Mode</Label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {(["auto", "manual"] as CreationMode[]).map(mode => (
              <label key={mode} className={cn("flex items-start gap-3 border p-3 cursor-pointer transition-colors",
                form.creationMode === mode ? "border-primary bg-primary/5" : "border-border hover:bg-muted/30")}>
                <input type="radio" name="creationMode" value={mode} checked={form.creationMode === mode} onChange={() => set("creationMode", mode)} className="mt-0.5 accent-primary" />
                <div>
                  <p className="text-sm font-semibold capitalize">{mode}</p>
                  <p className="text-xs text-muted-foreground">
                    {mode === "auto" ? "Conversation created immediately when a message arrives." : "Inbound messages go to a Pending Messages queue."}
                  </p>
                </div>
              </label>
            ))}
          </div>
        </div>

        {/* Reopen Policy */}
        <div className="space-y-2">
          <Label>Reopen Policy</Label>
          <div className="space-y-1.5">
            {REOPEN_POLICY_OPTIONS.map(opt => (
              <label key={opt.id} className={cn("flex items-center gap-3 border p-3 cursor-pointer transition-colors",
                form.reopenPolicy === opt.id ? "border-primary bg-primary/5" : "border-border hover:bg-muted/30")}>
                <input type="radio" name="reopenPolicy" value={opt.id} checked={form.reopenPolicy === opt.id} onChange={() => set("reopenPolicy", opt.id)} className="accent-primary" />
                <div className="min-w-0">
                  <p className="text-sm font-semibold">{opt.label}</p>
                  <p className="text-xs text-muted-foreground">{opt.description}</p>
                </div>
              </label>
            ))}
          </div>
          {form.reopenPolicy === "threshold" && (
            <div className="space-y-1.5 mt-2">
              <Label>Reopen Window (hours)</Label>
              <Input type="number" min={1} value={form.reopenWindowHours} onChange={e => set("reopenWindowHours", Number(e.target.value))} className="w-32" />
            </div>
          )}
        </div>

        {/* Team + Assignee */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label>Default Team</Label>
            <select value={form.defaultTeam} onChange={e => set("defaultTeam", e.target.value)}
              className="w-full h-10 border border-border bg-background px-3 text-sm focus:outline-none focus:ring-1 focus:ring-ring">
              <option value="">No default team</option>
              {teamGroups.map(tg => <option key={tg.id} value={tg.id}>{tg.name}</option>)}
            </select>
          </div>
          <div className="space-y-1.5">
            <Label>Default Assignee</Label>
            <select value={form.defaultAssignee} onChange={e => set("defaultAssignee", e.target.value)}
              className="w-full h-10 border border-border bg-background px-3 text-sm focus:outline-none focus:ring-1 focus:ring-ring">
              <option value="">No default assignee</option>
              {users.filter(u => u.role !== "viewer").map(u => (
                <option key={u.id} value={u.id}>{u.name} ({u.role})</option>
              ))}
            </select>
          </div>
        </div>

        {/* Active */}
        <div className="flex items-center justify-between py-3 border-t border-border">
          <div>
            <p className="text-sm font-semibold">Rule Active</p>
            <p className="text-xs text-muted-foreground">Enable or disable this routing rule</p>
          </div>
          <div className="flex items-center gap-2">
            <span className={cn("text-xs font-semibold", form.active ? "text-emerald-600" : "text-muted-foreground")}>
              {form.active ? "Active" : "Inactive"}
            </span>
            <Switch checked={form.active} onCheckedChange={v => set("active", v)} />
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-2 border-t border-border">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSubmit}>{rule ? "Save Changes" : "New Conversation Rule"}</Button>
        </div>
      </div>
    </Modal>
  );
}

// ─── Filter types ─────────────────────────────────────────────────────────────

type StatusFilter   = "all" | "active" | "inactive";
type ModeFilter     = "all" | "auto" | "manual";
type AudienceFilter = "all" | AudienceMode;
type SourceFilter   = "all" | string;

// ─── Routing Rules Full-Page Panel ────────────────────────────────────────────

export interface RoutingRulesPanelProps {
  isOpen: boolean;
  onClose: () => void;
  conversationRules: ConversationRule[];
  chatEndpoints: ChatEndpoint[];
  groups: Group[];
  teamGroups: TeamGroup[];
  users: User[];
  onAddRule: (data: Partial<ConversationRule>) => void;
  onUpdateRule: (id: string, data: Partial<ConversationRule>) => void;
  onDeleteRule: (id: string) => void;
  onReorderRules: (rules: ConversationRule[]) => void;
}

export function RoutingRulesPanel({
  isOpen, onClose,
  conversationRules, chatEndpoints, groups, teamGroups, users,
  onAddRule, onUpdateRule, onDeleteRule, onReorderRules,
}: RoutingRulesPanelProps) {
  const [searchQuery, setSearchQuery]   = useState("");
  const [isRuleModalOpen, setIsRuleModalOpen] = useState(false);
  const [editingRule, setEditingRule]   = useState<ConversationRule | null>(null);

  // Filters
  const [statusFilter,   setStatusFilter]   = useState<StatusFilter>("all");
  const [modeFilter,     setModeFilter]     = useState<ModeFilter>("all");
  const [audienceFilter, setAudienceFilter] = useState<AudienceFilter>("all");
  const [sourceFilter,   setSourceFilter]   = useState<SourceFilter>("all");

  const [localRules, setLocalRules] = useState<ConversationRule[]>(() =>
    [...conversationRules].sort((a, b) => a.priority - b.priority)
  );

  useEffect(() => {
    setLocalRules([...conversationRules].sort((a, b) => a.priority - b.priority));
  }, [conversationRules]);

  // Reset state when closing
  useEffect(() => {
    if (!isOpen) {
      setSearchQuery("");
      setStatusFilter("all");
      setModeFilter("all");
      setAudienceFilter("all");
      setSourceFilter("all");
    }
  }, [isOpen]);

  const moveRule = useCallback((dragIndex: number, hoverIndex: number) => {
    setLocalRules(prev => {
      const updated = [...prev];
      const [dragged] = updated.splice(dragIndex, 1);
      updated.splice(hoverIndex, 0, dragged);
      const reindexed = updated.map((r, i) => ({ ...r, priority: i + 1 }));
      onReorderRules(reindexed);
      return reindexed;
    });
  }, [onReorderRules]);

  const filteredRules = useMemo(() => {
    return localRules.filter(r => {
      if (searchQuery && !r.name.toLowerCase().includes(searchQuery.toLowerCase())) return false;
      if (statusFilter === "active"   && !r.active) return false;
      if (statusFilter === "inactive" &&  r.active) return false;
      if (modeFilter !== "all" && r.creationMode !== modeFilter) return false;
      if (audienceFilter !== "all" && r.audienceMode !== audienceFilter) return false;
      if (sourceFilter !== "all" && !r.sources.includes(sourceFilter)) return false;
      return true;
    });
  }, [localRules, searchQuery, statusFilter, modeFilter, audienceFilter, sourceFilter]);

  const activeFilterCount = [
    statusFilter !== "all",
    modeFilter !== "all",
    audienceFilter !== "all",
    sourceFilter !== "all",
  ].filter(Boolean).length;

  const clearFilters = () => {
    setStatusFilter("all");
    setModeFilter("all");
    setAudienceFilter("all");
    setSourceFilter("all");
    setSearchQuery("");
  };

  const activeCount = conversationRules.filter(r => r.active).length;
  const autoCount   = conversationRules.filter(r => r.creationMode === "auto").length;

  const openCreate = () => { setEditingRule(null); setIsRuleModalOpen(true); };

  // Stat cards
  const stats = [
    { label: "Total Rules",   value: conversationRules.length,                         sub: "configured",        icon: ListFilter,    color: "text-foreground" },
    { label: "Active",        value: activeCount,                                       sub: "currently running", icon: CheckCircle2,  color: "text-emerald-600" },
    { label: "Inactive",      value: conversationRules.length - activeCount,            sub: "paused",            icon: Circle,        color: "text-muted-foreground" },
    { label: "Auto-Create",   value: autoCount,                                         sub: "instant routing",   icon: Zap,           color: "text-amber-600" },
  ];

  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            key="routing-fullpage"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 16 }}
            transition={{ duration: 0.18, ease: "easeOut" }}
            className="fixed inset-0 z-50 bg-background flex flex-col overflow-hidden"
          >
            {/* ── Scrollable body ─────────────────────────────────────── */}
            <div className="flex-1 overflow-y-auto custom-scrollbar">
              <div className="p-6 lg:p-10 space-y-6 animate-in fade-in duration-500">

                {/* Page heading — matches Contacts / Channels pattern */}
                <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <button
                      onClick={onClose}
                      className="flex items-center justify-center w-9 h-9 border border-border text-muted-foreground hover:text-foreground hover:bg-muted transition-colors shrink-0"
                      title="Back to Conversations"
                    >
                      <ArrowLeft className="w-4 h-4" />
                    </button>
                    <div>
                      <h1 className="text-2xl font-bold tracking-tight text-foreground">Conversation Rules</h1>
                      <p className="text-muted-foreground text-sm mt-0.5">
                        Control how inbound conversations are created and assigned. Rules run in priority order — first match wins.
                      </p>
                    </div>
                  </div>
                  <Button size="sm" onClick={openCreate} className="shrink-0">
                    <Plus className="w-3.5 h-3.5 mr-1.5" />
                    New Conversation Rule
                  </Button>
                </header>

                {/* Stats row */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  {stats.map(s => (
                    <div key={s.label} className="bg-card border border-border rounded-sm px-5 py-4 flex items-center gap-4">
                      <div className="w-10 h-10 rounded-sm bg-muted/50 flex items-center justify-center shrink-0">
                        <s.icon className={cn("w-5 h-5", s.color)} />
                      </div>
                      <div>
                        <p className="text-2xl font-bold text-foreground leading-none">{s.value}</p>
                        <p className="text-xs text-muted-foreground mt-1 uppercase tracking-wide font-medium">{s.label}</p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* ── Toolbar (search + filters grouped) ───────────────── */}
                <div className="bg-card border border-border rounded-sm p-4 space-y-3">
                  {/* Search row */}
                  <div className="flex gap-3">
                    <div className="relative flex-1">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <input
                        type="text"
                        placeholder="Search conversation rules…"
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-8 h-10 bg-background border border-input rounded-sm text-sm focus:outline-none focus:ring-2 focus:ring-ring transition-all"
                      />
                      {searchQuery && (
                        <button
                          onClick={() => setSearchQuery("")}
                          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                    {(activeFilterCount > 0 || searchQuery) && (
                      <button
                        onClick={clearFilters}
                        className="flex items-center gap-1.5 px-3 h-9 border border-border text-xs font-semibold text-muted-foreground hover:text-foreground hover:bg-muted/40 transition-colors shrink-0"
                      >
                        <X className="w-3 h-3" />
                        Clear
                        {activeFilterCount > 0 && (
                          <span className="w-4 h-4 bg-primary text-primary-foreground rounded-full text-xs flex items-center justify-center font-bold">
                            {activeFilterCount}
                          </span>
                        )}
                      </button>
                    )}
                  </div>

                  <div className="border-t border-border" />

                  {/* Filter controls */}
                  <div className="flex flex-wrap gap-x-4 gap-y-2 items-center">
                    <span className="flex items-center gap-1.5 text-xs font-bold text-muted-foreground uppercase tracking-widest shrink-0">
                      <SlidersHorizontal className="w-3 h-3" />
                      Filters
                    </span>

                    {/* Status pills */}
                    <div className="flex gap-1">
                      {([
                        { id: "all",      label: "All" },
                        { id: "active",   label: "Active" },
                        { id: "inactive", label: "Inactive" },
                      ] as { id: StatusFilter; label: string }[]).map(f => (
                        <button
                          key={f.id}
                          onClick={() => setStatusFilter(f.id)}
                          className={cn(
                            "px-2.5 py-1 text-xs font-bold border transition-colors",
                            statusFilter === f.id
                              ? "bg-primary text-primary-foreground border-primary"
                              : "bg-background border-border text-muted-foreground hover:bg-muted/40 hover:text-foreground"
                          )}
                        >
                          {f.label}
                        </button>
                      ))}
                    </div>

                    <div className="w-px h-4 bg-border shrink-0" />

                    {/* Mode pills */}
                    <div className="flex gap-1">
                      {([
                        { id: "all",    label: "All Modes" },
                        { id: "auto",   label: "Auto" },
                        { id: "manual", label: "Manual" },
                      ] as { id: ModeFilter; label: string }[]).map(f => (
                        <button
                          key={f.id}
                          onClick={() => setModeFilter(f.id)}
                          className={cn(
                            "px-2.5 py-1 text-xs font-bold border transition-colors",
                            modeFilter === f.id
                              ? "bg-primary text-primary-foreground border-primary"
                              : "bg-background border-border text-muted-foreground hover:bg-muted/40 hover:text-foreground"
                          )}
                        >
                          {f.label}
                        </button>
                      ))}
                    </div>

                    <div className="w-px h-4 bg-border shrink-0" />

                    {/* Audience dropdown */}
                    <select
                      value={audienceFilter}
                      onChange={e => setAudienceFilter(e.target.value as AudienceFilter)}
                      className={cn(
                        "h-7 border px-2 text-xs font-bold bg-background focus:outline-none focus:ring-1 focus:ring-ring transition-colors cursor-pointer",
                        audienceFilter !== "all"
                          ? "border-primary text-primary bg-primary/5"
                          : "border-border text-muted-foreground hover:text-foreground"
                      )}
                    >
                      <option value="all">All Audiences</option>
                      <option value="known">Known Contacts</option>
                      <option value="groups">Specific Groups</option>
                      <option value="allowlist">Allowlist</option>
                    </select>

                    {/* Source dropdown */}
                    <select
                      value={sourceFilter}
                      onChange={e => setSourceFilter(e.target.value)}
                      className={cn(
                        "h-7 border px-2 text-xs font-bold bg-background focus:outline-none focus:ring-1 focus:ring-ring transition-colors cursor-pointer",
                        sourceFilter !== "all"
                          ? "border-primary text-primary bg-primary/5"
                          : "border-border text-muted-foreground hover:text-foreground"
                      )}
                    >
                      <option value="all">All Sources</option>
                      {CHANNEL_SOURCE_OPTIONS.map(c => (
                        <option key={c.id} value={c.id}>{c.label}</option>
                      ))}
                      {chatEndpoints.map(ep => (
                        <option key={ep.id} value={ep.id}>{ep.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* ── Rules table ───────────────────────────────────── */}
                {filteredRules.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-20 gap-4 text-center border border-dashed border-border rounded-sm bg-muted/10">
                    <div className="w-12 h-12 border border-border bg-muted flex items-center justify-center">
                      <GitBranch className="w-5 h-5 text-muted-foreground/30" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-muted-foreground">
                        {searchQuery || activeFilterCount > 0 ? "No rules match your filters" : "No conversation rules yet"}
                      </p>
                      <p className="text-xs text-muted-foreground/60 mt-1">
                        {searchQuery || activeFilterCount > 0
                          ? "Try adjusting your search or filters."
                          : "Create your first conversation rule to control how inbound conversations are handled."}
                      </p>
                    </div>
                    {!(searchQuery || activeFilterCount > 0) ? (
                      <Button size="sm" onClick={openCreate}>
                        <Plus className="w-4 h-4 mr-1.5" />
                        New Conversation Rule
                      </Button>
                    ) : (
                      <button onClick={clearFilters} className="text-sm font-semibold text-primary hover:underline">
                        Clear filters
                      </button>
                    )}
                  </div>
                ) : (
                  <div>
                    {/* Table meta row */}
                    <div className="flex items-center justify-between mb-3">
                      <p className="text-xs text-muted-foreground">
                        <span className="font-semibold text-foreground">{filteredRules.length}</span>
                        {filteredRules.length !== conversationRules.length && (
                          <> of <span className="font-semibold text-foreground">{conversationRules.length}</span></>
                        )} rule{conversationRules.length !== 1 ? "s" : ""}
                      </p>
                      {activeFilterCount === 0 && !searchQuery && (
                        <p className="text-xs text-muted-foreground/50 flex items-center gap-1">
                          <GripVertical className="w-3 h-3" />
                          Drag rows to reorder priority
                        </p>
                      )}
                    </div>

                    {/* Column header */}
                    <div className="hidden md:flex items-center gap-4 px-6 py-3 bg-muted/60 border border-border border-b-0 rounded-t-sm text-xs font-bold text-muted-foreground uppercase tracking-widest">
                      <span className="w-4 shrink-0" />
                      <span className="w-6 shrink-0 text-center">#</span>
                      <span className="flex-1">Name / Sources</span>
                      <span className="w-32 shrink-0">Audience</span>
                      <span className="w-24 shrink-0">Mode</span>
                      <span className="w-20 shrink-0">Status</span>
                      <span className="w-16 shrink-0 text-right">Actions</span>
                    </div>

                    <DndProvider backend={HTML5Backend}>
                      <div className="border border-border divide-y divide-border rounded-b-sm">
                        {filteredRules.map((rule, index) => (
                          <DraggableRuleRow
                            key={rule.id}
                            rule={rule}
                            index={index}
                            moveRule={activeFilterCount > 0 || !!searchQuery ? () => {} : moveRule}
                            endpoints={chatEndpoints}
                            teamGroups={teamGroups}
                            onEdit={r => { setEditingRule(r); setIsRuleModalOpen(true); }}
                            onToggle={id => {
                              const r = conversationRules.find(x => x.id === id);
                              if (r) {
                                onUpdateRule(id, { active: !r.active });
                                toast.success(r.active ? "Rule deactivated" : "Rule activated");
                              }
                            }}
                            onDelete={id => { onDeleteRule(id); toast.success("Routing rule deleted"); }}
                          />
                        ))}
                      </div>
                    </DndProvider>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <RuleFormModal
        isOpen={isRuleModalOpen}
        onClose={() => { setIsRuleModalOpen(false); setEditingRule(null); }}
        rule={editingRule}
        onSave={data => {
          if (editingRule) onUpdateRule(editingRule.id, data);
          else onAddRule(data);
        }}
        chatEndpoints={chatEndpoints}
        groups={groups}
        teamGroups={teamGroups}
        users={users}
      />
    </>
  );
}