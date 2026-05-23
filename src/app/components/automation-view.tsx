import React, { useState, useMemo } from "react";
import {
  Zap, Plus, Search, Play, Pause, Trash2, Edit2,
  Webhook, ArrowRight, MoreVertical, Activity, Clock,
  AlertCircle, Check, X, Globe, Link2, Copy, Eye,
  Settings2, Filter, Tag, Users, MessageSquare, Send,
  RefreshCw, ExternalLink, ChevronRight, ChevronLeft, Shield,
  Inbox, ListOrdered, GitBranch, FolderPlus, Folder, FolderOpen,
  ArrowUpDown, SlidersHorizontal, ChevronDown,
  CornerDownRight, FileText
} from "lucide-react";
// motion/AnimatePresence removed — webhooks tab eliminated.
import { toast } from "sonner";
import {
  cn, type AutomationRule, type AutomationTrigger, type AutomationAction,
  type Webhook as WebhookType, formatTimeAgo
} from "./types";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Badge } from "./ui/badge";
import { Separator } from "./ui/separator";
// Switch removed — webhooks tab eliminated.
import { Textarea } from "./ui/textarea";
import { Modal } from "./shared-ui";
import {
  DropdownMenu, DropdownMenuTrigger, DropdownMenuContent,
  DropdownMenuItem, DropdownMenuSeparator
} from "./ui/dropdown-menu";
import { AutomationCanvas, type AutomationDraft } from "./automation-v2";
import {
  BasicAutomationBuilder, SequenceBuilder, AutomationTypePicker,
  type BasicAutomationDraft, type SequenceDraft,
} from "./automation-builders";

const TRIGGER_OPTIONS: { id: AutomationTrigger; label: string; icon: any; description: string }[] = [
  { id: "contact_added", label: "Contact Added", icon: Users, description: "When a new contact is created" },
  { id: "message_received", label: "Message Received", icon: MessageSquare, description: "When an inbound message arrives" },
  { id: "tag_added", label: "Tag Added", icon: Tag, description: "When a tag is applied to a contact" },
  { id: "broadcast_completed", label: "Broadcast Completed", icon: Send, description: "When a broadcast finishes sending" },
  { id: "webhook_received", label: "Webhook Received", icon: Webhook, description: "When an external webhook fires" },
  { id: "scheduled", label: "Scheduled", icon: Clock, description: "At a specified time interval" },
];

const ACTION_OPTIONS: { id: AutomationAction; label: string; icon: any; description: string }[] = [
  { id: "send_message", label: "Send Message", icon: MessageSquare, description: "Send a message to the contact" },
  { id: "add_tag", label: "Add Tag", icon: Tag, description: "Apply a tag to the contact" },
  { id: "remove_tag", label: "Remove Tag", icon: X, description: "Remove a tag from the contact" },
  { id: "add_to_group", label: "Add to Group", icon: Users, description: "Add the contact to a group" },
  { id: "send_broadcast", label: "Send Broadcast", icon: Send, description: "Trigger a broadcast message" },
  { id: "webhook_call", label: "Call Webhook", icon: Globe, description: "POST data to an external URL" },
];

interface AutomationViewProps {
  automations: AutomationRule[];
  webhooks: WebhookType[];
  onToggleAutomation: (id: string) => void;
  onDeleteAutomation: (id: string) => void;
  onAddAutomation: (data: Partial<AutomationRule>) => void;
  onUpdateAutomation: (id: string, data: Partial<AutomationRule>) => void;
  onToggleWebhook: (id: string) => void;
  onDeleteWebhook: (id: string) => void;
  onAddWebhook: (data: Partial<WebhookType>) => void;
  onUpdateWebhook: (id: string, data: Partial<WebhookType>) => void;
}

// Derive a Basic / Sequence / Flow bucket for each automation so the list can
// be organised into folders matching the spec. Deterministic per-automation.
type AutoType = "basic" | "sequence" | "flow";
const getAutoType = (a: AutomationRule): AutoType => {
  if (a.trigger === "scheduled" || a.action === "send_broadcast") return "sequence";
  if (a.trigger === "webhook_received" || a.action === "webhook_call") return "flow";
  return "basic";
};
const getAutoStatus = (a: AutomationRule): "active" | "draft" | "stopped" => {
  if (a.enabled) return "active";
  if (a.triggerCount === 0) return "draft";
  return "stopped";
};
// Deterministic pseudo-CTR per automation id so numbers stay stable between renders.
const getAutoCtr = (a: AutomationRule): number | null => {
  if (a.triggerCount === 0) return null;
  let h = 0; for (let i = 0; i < a.id.length; i++) h = (h * 31 + a.id.charCodeAt(i)) | 0;
  return 40 + (Math.abs(h) % 55); // 40–94%
};
const statusBadge = (s: "active" | "draft" | "stopped") => {
  const map = {
    active:  "bg-emerald-50 text-emerald-700 border-emerald-200",
    draft:   "bg-amber-50 text-amber-700 border-amber-200",
    stopped: "bg-rose-50 text-rose-700 border-rose-200",
  } as const;
  return map[s];
};
const typeLabel = (t: AutoType) => t === "basic" ? "Basic" : t === "sequence" ? "Sequence" : "Journey";

// Colorful type badge derived from trigger+action
type TypeBadgeInfo = { label: string; icon: any; color: string; bg: string; border: string };
const getTypeBadge = (a: AutomationRule): TypeBadgeInfo => {
  if (a.trigger === "message_received" && a.action === "send_message")
    return { label: "Auto-Reply", icon: CornerDownRight, color: "text-blue-700", bg: "bg-blue-50", border: "border-blue-200" };
  if (a.action === "add_tag" || a.action === "remove_tag")
    return { label: "Tag Rule", icon: Tag, color: "text-rose-600", bg: "bg-rose-50", border: "border-rose-200" };
  if (a.action === "add_to_group")
    return { label: "Survey", icon: FileText, color: "text-amber-700", bg: "bg-amber-50", border: "border-amber-200" };
  if (a.action === "send_broadcast" || a.trigger === "broadcast_completed")
    return { label: "Broadcast", icon: Send, color: "text-purple-700", bg: "bg-purple-50", border: "border-purple-200" };
  if (a.trigger === "scheduled")
    return { label: "Drip", icon: Clock, color: "text-teal-700", bg: "bg-teal-50", border: "border-teal-200" };
  if (a.trigger === "webhook_received" || a.action === "webhook_call")
    return { label: "Flow", icon: GitBranch, color: "text-indigo-700", bg: "bg-indigo-50", border: "border-indigo-200" };
  if (a.trigger === "contact_added")
    return { label: "Auto-Reply", icon: CornerDownRight, color: "text-blue-700", bg: "bg-blue-50", border: "border-blue-200" };
  return { label: "Auto-Reply", icon: CornerDownRight, color: "text-blue-700", bg: "bg-blue-50", border: "border-blue-200" };
};

export const AutomationView = ({
  automations,
  webhooks,
  onToggleAutomation,
  onDeleteAutomation,
  onAddAutomation,
  onUpdateAutomation,
  onToggleWebhook,
  onDeleteWebhook,
  onAddWebhook,
  onUpdateWebhook,
}: AutomationViewProps) => {
  // Webhooks tab removed — webhooks now live inside the Journey Builder.
  const activeTab = "rules" as const;
  const [searchQuery, setSearchQuery] = useState("");
  const [isAddRuleOpen, setIsAddRuleOpen] = useState(false);
  // isAddWebhookOpen removed — webhooks are managed inside the Journey Builder.
  const [activeFolder, setActiveFolder] = useState<"all" | AutoType>("all");
  const [editingRule, setEditingRule] = useState<AutomationRule | null>(null);
  const [ruleToDelete, setRuleToDelete] = useState<AutomationRule | null>(null);
  // Builders are full-page overlays. `builderState` carries the kind + mode;
  // null means the list view is showing.
  const [builderState, setBuilderState] = useState<
    | { kind: "basic";    mode: "new" | "edit"; rule?: AutomationRule }
    | { kind: "sequence"; mode: "new" | "edit"; rule?: AutomationRule }
    | { kind: "flow";     mode: "new" | "edit"; rule?: AutomationRule }
    | null
  >(null);
  const [isTypePickerOpen, setIsTypePickerOpen] = useState(false);
  const [isNewFolderOpen, setIsNewFolderOpen] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const [customFolders, setCustomFolders] = useState<{ id: string; name: string; automationIds: string[] }[]>([
    { id: "folder-onboarding",   name: "Onboarding",    automationIds: ["auto-1", "auto-6", "auto-11"] },
    { id: "folder-followups",    name: "Follow-ups",    automationIds: ["auto-10", "auto-15"] },
    { id: "folder-discipleship", name: "Discipleship",  automationIds: ["auto-8", "auto-12", "auto-14"] },
  ]);
  const [movingRule, setMovingRule] = useState<AutomationRule | null>(null);
  // Filters
  const [filterStatus, setFilterStatus] = useState<"all" | "active" | "draft" | "stopped">("all");
  const [filterType, setFilterType] = useState<"all" | AutoType>("all");
  const [sortBy, setSortBy] = useState<"name" | "modified" | "runs" | "status">("modified");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [showFilters, setShowFilters] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);

  const handleCreateFolder = () => {
    if (!newFolderName.trim()) return;
    const id = `folder-${Date.now()}`;
    setCustomFolders(prev => [...prev, { id, name: newFolderName.trim(), automationIds: [] }]);
    setActiveFolder(id as any);
    toast.success(`Folder "${newFolderName.trim()}" created`);
    setNewFolderName("");
    setIsNewFolderOpen(false);
  };

  const handleDeleteFolder = (folderId: string) => {
    setCustomFolders(prev => prev.filter(f => f.id !== folderId));
    if (activeFolder === folderId) setActiveFolder("all");
    toast.success("Folder deleted");
  };

  const handleRenameFolder = (folderId: string, newName: string) => {
    setCustomFolders(prev => prev.map(f => f.id === folderId ? { ...f, name: newName } : f));
    toast.success("Folder renamed");
  };

  const handleMoveToFolder = (ruleId: string, folderId: string) => {
    setCustomFolders(prev => prev.map(f => ({
      ...f,
      automationIds: f.id === folderId
        ? [...new Set([...f.automationIds, ruleId])]
        : f.automationIds.filter(id => id !== ruleId),
    })));
    setMovingRule(null);
    const folderName = customFolders.find(f => f.id === folderId)?.name || "folder";
    toast.success(`Moved to "${folderName}"`);
  };

  const handleRemoveFromFolder = (ruleId: string, folderId: string) => {
    setCustomFolders(prev => prev.map(f =>
      f.id === folderId ? { ...f, automationIds: f.automationIds.filter(id => id !== ruleId) } : f
    ));
    toast.success("Removed from folder");
  };

  const handleDuplicateRule = (rule: AutomationRule) => {
    onAddAutomation({
      tenantId: rule.tenantId,
      name: `${rule.name} (Copy)`,
      description: rule.description,
      trigger: rule.trigger,
      triggerConfig: rule.triggerConfig,
      action: rule.action,
      actionConfig: rule.actionConfig,
      enabled: false,
      triggerCount: 0,
    });
    toast.success(`"${rule.name}" duplicated`);
  };

  const handleConfirmDelete = () => {
    if (!ruleToDelete) return;
    onDeleteAutomation(ruleToDelete.id);
    toast.success(`"${ruleToDelete.name}" deleted`);
    setRuleToDelete(null);
  };

  // Contextual copy per folder so the create button, modal, and empty state
  // feel native to whichever category the user is in.
  const customFolderMatch = customFolders.find(f => f.id === activeFolder);
  const folderCopy = customFolderMatch
    ? { createLabel: "New Automation", singular: "Automation", emptyTitle: `No automations in "${customFolderMatch.name}"`, emptyBody: "Move automations into this folder using the menu on each automation row." }
    : {
      all:      { createLabel: "New Automation", singular: "Automation", emptyTitle: "Create your first Automation", emptyBody: "Automate interactions with your contacts by creating rules, sequences, and flows so you have more time to handle meaningful conversations." },
      basic:    { createLabel: "New Basic",      singular: "Basic rule", emptyTitle: "Create your first Basic rule", emptyBody: "Basic rules pair a single trigger with a single action — perfect for welcome messages, keyword replies, and quick automations." },
      sequence: { createLabel: "New Sequence",   singular: "Sequence",   emptyTitle: "Create your first Sequence", emptyBody: "Automate interactions with your contacts by creating a series of automatic messages so you have more time to handle meaningful conversations." },
      flow:     { createLabel: "New Journey",     singular: "Journey",    emptyTitle: "Create your first Journey",  emptyBody: "Journeys let you build branching, multi-step automations with milestones and webhooks — ideal for discipleship paths." },
    }[activeTab === "rules" ? (activeFolder as "all" | AutoType) : "all"];

  const activeAutomations = automations.filter(a => a.enabled).length;
  const totalTriggers = automations.reduce((sum, a) => sum + a.triggerCount, 0);
  const activeWebhooks = webhooks.filter(w => w.enabled).length;

  // Tag each automation with its derived type once, then filter.
  const typedAutos = useMemo(() => automations.map(a => ({ ...a, _type: getAutoType(a) })), [automations]);
  const folderCounts = useMemo(() => ({
    all:      typedAutos.length,
    basic:    typedAutos.filter(a => a._type === "basic").length,
    sequence: typedAutos.filter(a => a._type === "sequence").length,
    flow:     typedAutos.filter(a => a._type === "flow").length,
  }), [typedAutos]);

  const filteredRules = useMemo(() => {
    const filtered = typedAutos.filter(a => {
      const customFolder = customFolders.find(f => f.id === activeFolder);
      const matchesFolder = activeFolder === "all"
        || a._type === activeFolder
        || (customFolder && customFolder.automationIds.includes(a.id));
      const q = searchQuery.toLowerCase();
      const matchesSearch = !q || a.name.toLowerCase().includes(q) || a.description.toLowerCase().includes(q);
      const matchesStatus = filterStatus === "all" || getAutoStatus(a) === filterStatus;
      const matchesType = filterType === "all" || a._type === filterType;
      return matchesFolder && matchesSearch && matchesStatus && matchesType;
    });
    // Sort
    const dir = sortDir === "asc" ? 1 : -1;
    filtered.sort((a, b) => {
      switch (sortBy) {
        case "name":     return dir * a.name.localeCompare(b.name);
        case "runs":     return dir * (a.triggerCount - b.triggerCount);
        case "status": {
          const order = { active: 0, draft: 1, stopped: 2 };
          return dir * (order[getAutoStatus(a)] - order[getAutoStatus(b)]);
        }
        case "modified":
        default: {
          const ta = new Date(a.lastTriggeredAt || a.createdAt).getTime();
          const tb = new Date(b.lastTriggeredAt || b.createdAt).getTime();
          return dir * (ta - tb);
        }
      }
    });
    return filtered;
  }, [typedAutos, activeFolder, customFolders, searchQuery, filterStatus, filterType, sortBy, sortDir]);

  const filteredWebhooks = webhooks.filter(w =>
    w.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    w.url.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Full-page builders take over when active, short-circuiting the list view.
  if (builderState) {
    const { kind, mode, rule } = builderState;
    const isEdit = mode === "edit";
    const close = () => setBuilderState(null);

    // Common persistence helper: route creates / updates through existing handlers.
    const persist = (opts: { name: string; description?: string; trigger: AutomationTrigger; action: AutomationAction; enabled: boolean }) => {
      if (isEdit && rule) {
        onUpdateAutomation(rule.id, { name: opts.name, description: opts.description, trigger: opts.trigger, action: opts.action, enabled: opts.enabled });
      } else {
        onAddAutomation({
          tenantId: "tenant-1",
          name: opts.name,
          description: opts.description ?? "",
          trigger: opts.trigger,
          triggerConfig: {},
          action: opts.action,
          actionConfig: {},
          enabled: opts.enabled,
          triggerCount: 0,
        });
      }
    };
    const statusFor = (r?: AutomationRule) => r ? (r.enabled ? "active" : r.triggerCount === 0 ? "draft" : "stopped") : "draft";

    if (kind === "basic") {
      return (
        <BasicAutomationBuilder
          status={statusFor(rule)}
          runs={rule?.triggerCount}
          initial={rule ? { id: rule.id, name: rule.name } : undefined}
          onBack={close}
          onSave={(draft) => persist({ name: draft.name, description: `Basic · ${draft.triggerKind}`, trigger: draft.triggerKind === "keyword" ? "message_received" : draft.triggerKind === "event" ? "webhook_received" : "message_received", action: "send_message", enabled: false })}
          onPublish={(draft) => { persist({ name: draft.name, description: `Basic · ${draft.triggerKind}`, trigger: draft.triggerKind === "keyword" ? "message_received" : draft.triggerKind === "event" ? "webhook_received" : "message_received", action: "send_message", enabled: true }); close(); }}
        />
      );
    }
    if (kind === "sequence") {
      return (
        <SequenceBuilder
          status={statusFor(rule)}
          runs={rule?.triggerCount}
          initial={rule ? { id: rule.id, name: rule.name } : undefined}
          onBack={close}
          onSave={(draft) => persist({ name: draft.name, description: `Sequence · ${draft.steps.length} step${draft.steps.length === 1 ? "" : "s"}`, trigger: "scheduled", action: "send_message", enabled: false })}
          onPublish={(draft) => { persist({ name: draft.name, description: `Sequence · ${draft.steps.length} step${draft.steps.length === 1 ? "" : "s"}`, trigger: "scheduled", action: "send_message", enabled: true }); close(); }}
        />
      );
    }
    // kind === "flow" → Journey Builder (v2 React Flow canvas)
    const journeyDraft: AutomationDraft = {
      id: rule?.id ?? `auto-${Date.now()}`,
      name: rule?.name ?? "New Journey",
      description: rule?.description ?? "Journey",
      nodes: [],
      connections: [],
      enabled: rule?.enabled ?? false,
      createdAt: rule?.createdAt ?? new Date().toISOString(),
      runs: rule?.triggerCount ?? 0,
      mode: "journey",
      folderId: null,
    };
    return (
      <AutomationCanvas
        automation={journeyDraft}
        onBack={close}
        onSave={(a) => persist({ name: a.name, description: "Journey", trigger: "webhook_received", action: "webhook_call", enabled: false })}
        onUpdate={(a) => persist({ name: a.name, description: "Journey", trigger: "webhook_received", action: "webhook_call", enabled: a.enabled })}
      />
    );
  }

  return (
    <div className="space-y-5 p-6 animate-in fade-in duration-500">
      <header className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Automations</h1>
          <p className="text-muted-foreground text-sm mt-1">Manage your automation workflows</p>
        </div>
        <Button onClick={() => {
          if (activeFolder === "basic")    { setBuilderState({ kind: "basic",    mode: "new" }); return; }
          if (activeFolder === "sequence") { setBuilderState({ kind: "sequence", mode: "new" }); return; }
          if (activeFolder === "flow")     { setBuilderState({ kind: "flow",     mode: "new" }); return; }
          setIsTypePickerOpen(true);
        }}>
          <Plus className="w-4 h-4 mr-1.5" />
          {folderCopy.createLabel}
        </Button>
      </header>

      {/* Summary stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Total", value: automations.length, icon: Zap, color: "text-primary" },
          { label: "Active", value: activeAutomations, icon: Play, color: "text-emerald-600" },
          { label: "Total Runs", value: totalTriggers.toLocaleString(), icon: Activity, color: "text-blue-600" },
          { label: "Webhooks", value: webhooks.filter(w => w.enabled).length, icon: Globe, color: "text-violet-600" },
        ].map(stat => (
          <div key={stat.label} className="bg-card border border-border rounded-lg px-4 py-3 flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-muted flex items-center justify-center shrink-0">
              <stat.icon className={cn("w-4 h-4", stat.color)} />
            </div>
            <div>
              <p className="text-lg font-bold text-foreground leading-none">{stat.value}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{stat.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Search + filter bar */}
      <div className="flex items-center gap-3 bg-card border border-border rounded-xl px-4 py-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search automations..."
            value={searchQuery}
            onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
            className="pl-9 h-10 text-sm border-border bg-background w-full"
          />
        </div>
        <select
          value={filterType}
          onChange={(e) => { setFilterType(e.target.value as any); setCurrentPage(1); }}
          className="h-10 px-3 pr-8 rounded-lg border border-border bg-background text-sm text-foreground appearance-none cursor-pointer hover:border-muted-foreground/40 transition-colors"
          style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%239ca3af' stroke-width='2'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E")`, backgroundRepeat: "no-repeat", backgroundPosition: "right 10px center" }}
        >
          <option value="all">All types</option>
          <option value="basic">Basic</option>
          <option value="sequence">Sequence</option>
          <option value="flow">Journey</option>
        </select>
        <select
          value={filterStatus}
          onChange={(e) => { setFilterStatus(e.target.value as any); setCurrentPage(1); }}
          className="h-10 px-3 pr-8 rounded-lg border border-border bg-background text-sm text-foreground appearance-none cursor-pointer hover:border-muted-foreground/40 transition-colors"
          style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%239ca3af' stroke-width='2'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E")`, backgroundRepeat: "no-repeat", backgroundPosition: "right 10px center" }}
        >
          <option value="all">All statuses</option>
          <option value="active">Active</option>
          <option value="draft">Draft</option>
          <option value="stopped">Stopped</option>
        </select>
      </div>

      {/* Content */}
      <div className="flex flex-col md:flex-row gap-5 items-start animate-in fade-in duration-300">
            {/* Folders sidebar — sticky, soft-tint active state */}
            <aside className="bg-card border border-border rounded-xl p-4 md:sticky md:top-6 self-start w-full md:w-[260px] md:shrink-0">
              <p className="text-sm font-semibold text-foreground px-2 pb-3">Folders</p>
              <div className="space-y-1" role="tablist" aria-label="Automation folders">
                {([
                  ["all",      "All Automations", folderCounts.all,      Inbox],
                  ["basic",    "Basic",           folderCounts.basic,    Zap],
                  ["sequence", "Sequences",       folderCounts.sequence, ListOrdered],
                  ["flow",     "Journey Builder", folderCounts.flow,     GitBranch],
                ] as const).map(([k, label, count, Icon]) => {
                  const isActive = activeFolder === k;
                  return (
                    <button
                      key={k}
                      role="tab"
                      aria-selected={isActive}
                      onClick={() => setActiveFolder(k as any)}
                      className={cn(
                        "w-full flex items-center gap-3 px-3 py-2 text-sm rounded-md transition-colors",
                        isActive
                          ? "bg-primary/10 text-primary font-semibold"
                          : "text-muted-foreground font-medium hover:bg-muted hover:text-foreground"
                      )}
                    >
                      <Icon className="w-4 h-4" />
                      <span className="flex-1 text-left">{label}</span>
                      <span className={cn(
                        "text-xs tabular-nums",
                        isActive ? "text-primary" : "text-muted-foreground"
                      )}>{count}</span>
                    </button>
                  );
                })}
                {/* Custom folders */}
                {customFolders.length > 0 && (
                  <div className="border-t border-border mt-2 pt-2">
                    {customFolders.map(folder => {
                      const isActive = activeFolder === folder.id;
                      const count = folder.automationIds.length;
                      return (
                        <div key={folder.id} className="group/folder relative">
                          <button
                            role="tab"
                            aria-selected={isActive}
                            onClick={() => setActiveFolder(folder.id as any)}
                            className={cn(
                              "w-full flex items-center gap-3 px-3 py-2 text-sm rounded-md transition-colors",
                              isActive
                                ? "bg-primary/10 text-primary font-semibold"
                                : "text-muted-foreground font-medium hover:bg-muted hover:text-foreground"
                            )}
                          >
                            {isActive ? <FolderOpen className="w-4 h-4" /> : <Folder className="w-4 h-4" />}
                            <span className="flex-1 text-left truncate">{folder.name}</span>
                            <span className={cn(
                              "text-xs tabular-nums",
                              isActive ? "text-primary" : "text-muted-foreground"
                            )}>{count}</span>
                          </button>
                          {/* Delete on hover */}
                          <button
                            onClick={(e) => { e.stopPropagation(); handleDeleteFolder(folder.id); }}
                            className="absolute right-1 top-1/2 -translate-y-1/2 opacity-0 group-hover/folder:opacity-100 p-1 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-all"
                            title="Delete folder"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}

                <button
                  onClick={() => setIsNewFolderOpen(true)}
                  className="w-full flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                >
                  <FolderPlus className="w-4 h-4" />
                  <span className="flex-1 text-left">New Folder</span>
                </button>
              </div>
            </aside>

            {/* Right panel — content of the selected folder */}
            <div className="bg-card border border-border rounded-xl overflow-hidden flex-1 min-w-0 w-full">
              {/* Folder header — makes it clear which folder's content is shown */}
              <div className="flex items-center justify-between gap-3 px-5 py-3 border-b border-border">
                <div className="flex items-center gap-2.5">
                  {(() => {
                    const customFolder = customFolders.find(f => f.id === activeFolder);
                    const Icon = customFolder ? FolderOpen
                      : activeFolder === "all" ? Inbox
                      : activeFolder === "basic" ? Zap
                      : activeFolder === "sequence" ? ListOrdered : GitBranch;
                    const label = customFolder ? customFolder.name
                      : activeFolder === "all" ? "All Automations"
                      : activeFolder === "basic" ? "Basic"
                      : activeFolder === "sequence" ? "Sequences" : "Journey Builder";
                    return (
                      <>
                        <Icon className="w-4 h-4 text-primary" />
                        <h3 className="text-sm font-semibold text-foreground">{label}</h3>
                        <Badge variant="secondary" className="text-xs">{filteredRules.length}</Badge>
                      </>
                    );
                  })()}
                </div>
              </div>
              {filteredRules.length === 0 ? (
                <div className="px-6 py-16 text-center max-w-md mx-auto">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                    {(() => {
                      const EmptyIcon = customFolderMatch ? FolderOpen
                        : activeFolder === "sequence" ? ListOrdered
                        : activeFolder === "flow" ? GitBranch
                        : activeFolder === "basic" ? Zap : Inbox;
                      return <EmptyIcon className="w-5 h-5 text-primary" />;
                    })()}
                  </div>
                  <h3 className="text-base font-semibold text-foreground">
                    {searchQuery ? "No automations match your search" : folderCopy.emptyTitle}
                  </h3>
                  <p className="text-sm text-muted-foreground mt-1.5 leading-relaxed">
                    {searchQuery ? "Try a different keyword or clear your search." : folderCopy.emptyBody}
                  </p>
                  {!searchQuery && (
                    customFolderMatch ? (
                      <Button variant="outline" className="mt-5" onClick={() => setActiveFolder("all")}>
                        <Inbox className="w-4 h-4 mr-1.5" />
                        Browse All Automations
                      </Button>
                    ) : (
                      <Button className="mt-5" onClick={() => {
                        if (activeFolder === "basic")    setBuilderState({ kind: "basic",    mode: "new" });
                        else if (activeFolder === "sequence") setBuilderState({ kind: "sequence", mode: "new" });
                        else if (activeFolder === "flow")     setBuilderState({ kind: "flow",     mode: "new" });
                        else setIsTypePickerOpen(true);
                      }}>
                        <Plus className="w-4 h-4 mr-1.5" />
                        {folderCopy.createLabel}
                      </Button>
                    )
                  )}
                </div>
              ) : (
                <>
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground tracking-wide">Name</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground tracking-wide">Type</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground tracking-wide">Status</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground tracking-wide">Version</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground tracking-wide">Modified</th>
                      <th className="px-4 py-3 w-10"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {(() => {
                      const totalPages = Math.max(1, Math.ceil(filteredRules.length / pageSize));
                      const safePage = Math.min(currentPage, totalPages);
                      const paged = filteredRules.slice((safePage - 1) * pageSize, safePage * pageSize);
                      return paged.map((rule) => {
                        const status = getAutoStatus(rule);
                        const badge = getTypeBadge(rule);
                        const BadgeIcon = badge.icon;
                        const modified = rule.lastTriggeredAt || rule.createdAt;
                        return (
                          <tr key={rule.id} className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors group">
                            <td className="px-6 py-4">
                              <button
                                onClick={() => setBuilderState({ kind: rule._type, mode: "edit", rule })}
                                className="flex flex-col gap-0.5 text-left group/name"
                              >
                                <div className="flex items-center gap-2">
                                  <span className="text-sm font-semibold text-foreground group-hover/name:text-primary transition-colors">{rule.name}</span>
                                  {(() => {
                                    const f = customFolders.find(f => f.automationIds.includes(rule.id));
                                    if (!f) return null;
                                    return (
                                      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 text-[10px] font-medium bg-muted text-muted-foreground rounded">
                                        <Folder className="w-2.5 h-2.5" />{f.name}
                                      </span>
                                    );
                                  })()}
                                </div>
                                {rule.description && (
                                  <span className="text-xs text-muted-foreground truncate max-w-[420px]">{rule.description}</span>
                                )}
                              </button>
                            </td>
                            <td className="px-4 py-4">
                              <span className={cn(
                                "inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-full border",
                                badge.bg, badge.color, badge.border
                              )}>
                                <BadgeIcon className="w-3 h-3" />
                                {badge.label}
                              </span>
                            </td>
                            <td className="px-4 py-4">
                              <button
                                onClick={() => onToggleAutomation(rule.id)}
                                title={rule.enabled ? "Click to stop" : "Click to activate"}
                                className="cursor-pointer"
                              >
                                <span className={cn(
                                  "inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-full border transition-all hover:ring-2 hover:ring-offset-1",
                                  statusBadge(status),
                                  status === "active" ? "hover:ring-emerald-300" : status === "draft" ? "hover:ring-amber-300" : "hover:ring-rose-300"
                                )}>
                                  <span className={cn(
                                    "w-1.5 h-1.5 rounded-full",
                                    status === "active" ? "bg-emerald-500" : status === "draft" ? "bg-amber-500" : "bg-rose-500"
                                  )} />
                                  {status === "active" ? "Active" : status === "draft" ? "Draft" : "Stopped"}
                                </span>
                              </button>
                            </td>
                            <td className="px-4 py-4 text-sm text-muted-foreground">v1</td>
                            <td className="px-4 py-4 text-sm text-muted-foreground">{formatTimeAgo(modified)}</td>
                            <td className="px-4 py-4 text-right">
                              <DropdownMenu>
                                <DropdownMenuTrigger
                                  className="inline-flex items-center justify-center h-8 w-8 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring"
                                  aria-label={`Actions for ${rule.name}`}
                                >
                                  <MoreVertical className="w-4 h-4" />
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-44">
                                  <DropdownMenuItem onSelect={() => setBuilderState({ kind: rule._type, mode: "edit", rule })}>
                                    <Edit2 className="w-3.5 h-3.5" /> Edit
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onSelect={() => handleDuplicateRule(rule)}>
                                    <Copy className="w-3.5 h-3.5" /> Duplicate
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onSelect={() => onToggleAutomation(rule.id)}>
                                    {rule.enabled ? <><Pause className="w-3.5 h-3.5" />Stop</> : <><Play className="w-3.5 h-3.5" />Activate</>}
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onSelect={() => setMovingRule(rule)}>
                                    <FolderPlus className="w-3.5 h-3.5" /> Move to Folder
                                  </DropdownMenuItem>
                                  {(() => {
                                    const parentFolder = customFolders.find(f => f.automationIds.includes(rule.id));
                                    if (!parentFolder) return null;
                                    return (
                                      <DropdownMenuItem onSelect={() => handleRemoveFromFolder(rule.id, parentFolder.id)}>
                                        <X className="w-3.5 h-3.5" /> Remove from "{parentFolder.name}"
                                      </DropdownMenuItem>
                                    );
                                  })()}
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem variant="destructive" onSelect={() => setRuleToDelete(rule)}>
                                    <Trash2 className="w-3.5 h-3.5" /> Delete
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </td>
                          </tr>
                        );
                      });
                    })()}
                  </tbody>
                </table>
                {/* Pagination footer */}
                {(() => {
                  const totalPages = Math.max(1, Math.ceil(filteredRules.length / pageSize));
                  const safePage = Math.min(currentPage, totalPages);
                  const from = filteredRules.length === 0 ? 0 : (safePage - 1) * pageSize + 1;
                  const to = Math.min(safePage * pageSize, filteredRules.length);
                  return (
                    <div className="flex items-center justify-between px-6 py-3 border-t border-border text-sm">
                      <span className="text-muted-foreground">
                        Showing {from}–{to} of {filteredRules.length}
                      </span>
                      <div className="flex items-center gap-3">
                        <select
                          value={pageSize}
                          onChange={(e) => { setPageSize(Number(e.target.value)); setCurrentPage(1); }}
                          className="h-8 px-2 pr-7 rounded-md border border-border bg-background text-sm text-foreground appearance-none cursor-pointer"
                          style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='10' viewBox='0 0 24 24' fill='none' stroke='%239ca3af' stroke-width='2'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E")`, backgroundRepeat: "no-repeat", backgroundPosition: "right 6px center" }}
                        >
                          <option value={10}>10 / page</option>
                          <option value={25}>25 / page</option>
                          <option value={50}>50 / page</option>
                        </select>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                            disabled={safePage <= 1}
                            className="h-8 w-8 rounded-md border border-border flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted disabled:opacity-30 disabled:pointer-events-none transition-colors"
                          >
                            <ChevronLeft className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                            disabled={safePage >= totalPages}
                            className="h-8 w-8 rounded-md border border-border flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted disabled:opacity-30 disabled:pointer-events-none transition-colors"
                          >
                            <ChevronRight className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })()}
                </>
              )}
            </div>
      </div>

      {/* Type picker — shown when the user clicks New from the All folder */}
      <Modal
        isOpen={isTypePickerOpen}
        onClose={() => setIsTypePickerOpen(false)}
        title="What do you want to create?"
        size="lg"
      >
        <AutomationTypePicker onPick={(t) => {
          setIsTypePickerOpen(false);
          setBuilderState({ kind: t, mode: "new" });
        }} />
      </Modal>

      {/* Legacy Add Rule Modal — retained for edit-by-modal compatibility, not
          reachable from the primary "New" CTAs anymore */}
      <AddRuleModal isOpen={isAddRuleOpen} onClose={() => setIsAddRuleOpen(false)} onAdd={onAddAutomation} />

      {/* Edit Rule Modal */}
      <EditRuleModal
        rule={editingRule}
        onClose={() => setEditingRule(null)}
        onUpdate={(id, data) => { onUpdateAutomation(id, data); toast.success("Automation updated"); }}
      />

      {/* Delete confirmation */}
      <Modal
        isOpen={ruleToDelete !== null}
        onClose={() => setRuleToDelete(null)}
        title="Delete Automation"
        size="sm"
      >
        <div className="space-y-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 bg-destructive/10 rounded-lg flex items-center justify-center shrink-0">
              <AlertCircle className="w-5 h-5 text-destructive" />
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">Delete "{ruleToDelete?.name}"?</p>
              <p className="text-xs text-muted-foreground mt-1">
                This automation will be permanently removed. Any active enrollments will stop. This action cannot be undone.
              </p>
            </div>
          </div>
          <div className="flex items-center justify-end gap-2">
            <Button variant="outline" size="sm" onClick={() => setRuleToDelete(null)}>Cancel</Button>
            <Button variant="destructive" size="sm" onClick={handleConfirmDelete}>
              <Trash2 className="w-3.5 h-3.5" />
              Delete
            </Button>
          </div>
        </div>
      </Modal>

      {/* New Folder modal */}
      <Modal
        isOpen={isNewFolderOpen}
        onClose={() => { setIsNewFolderOpen(false); setNewFolderName(""); }}
        title="Create Folder"
        size="sm"
      >
        <div className="space-y-4">
          <div className="grid gap-2">
            <Label className="text-xs font-semibold">Folder Name</Label>
            <Input
              placeholder="e.g. Onboarding, Follow-ups"
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleCreateFolder()}
              className="h-9 text-sm"
              autoFocus
            />
          </div>
          <div className="flex items-center justify-end gap-2">
            <Button variant="outline" size="sm" onClick={() => { setIsNewFolderOpen(false); setNewFolderName(""); }}>Cancel</Button>
            <Button size="sm" disabled={!newFolderName.trim()} onClick={handleCreateFolder}>
              <FolderPlus className="w-3.5 h-3.5" />
              Create Folder
            </Button>
          </div>
        </div>
      </Modal>

      {/* Move to Folder modal */}
      <MoveToFolderModal
        rule={movingRule}
        customFolders={customFolders}
        onClose={() => setMovingRule(null)}
        onMove={handleMoveToFolder}
        onCreateAndMove={(folderName, ruleId) => {
          const id = `folder-${Date.now()}`;
          setCustomFolders(prev => [...prev, { id, name: folderName, automationIds: [ruleId] }]);
          setMovingRule(null);
          toast.success(`Created "${folderName}" and moved automation`);
        }}
      />

      {/* Webhooks are now managed inside the Journey Builder */}
    </div>
  );
};

// --- Move to Folder Modal ---
const MoveToFolderModal = ({
  rule, customFolders, onClose, onMove, onCreateAndMove,
}: {
  rule: AutomationRule | null;
  customFolders: { id: string; name: string; automationIds: string[] }[];
  onClose: () => void;
  onMove: (ruleId: string, folderId: string) => void;
  onCreateAndMove: (folderName: string, ruleId: string) => void;
}) => {
  const [showNewFolder, setShowNewFolder] = useState(false);
  const [newName, setNewName] = useState("");

  const handleCreateAndMove = () => {
    if (!newName.trim() || !rule) return;
    onCreateAndMove(newName.trim(), rule.id);
    setNewName("");
    setShowNewFolder(false);
  };

  // Reset when modal opens/closes
  React.useEffect(() => {
    if (!rule) { setShowNewFolder(false); setNewName(""); }
  }, [rule]);

  return (
    <Modal
      isOpen={rule !== null}
      onClose={onClose}
      title={`Move "${rule?.name}" to Folder`}
      size="sm"
    >
      <div className="space-y-3">
        {/* Existing folders */}
        {customFolders.map(folder => {
          const alreadyIn = rule ? folder.automationIds.includes(rule.id) : false;
          return (
            <button
              key={folder.id}
              disabled={alreadyIn}
              onClick={() => rule && onMove(rule.id, folder.id)}
              className={cn(
                "w-full flex items-center gap-3 px-4 py-3 text-sm rounded-lg border transition-colors text-left",
                alreadyIn
                  ? "bg-muted/50 text-muted-foreground border-border cursor-not-allowed"
                  : "hover:bg-primary/5 hover:border-primary/30 border-border"
              )}
            >
              <Folder className="w-4 h-4 shrink-0" />
              <span className="flex-1 font-medium">{folder.name}</span>
              {alreadyIn && (
                <Badge variant="secondary" className="text-[10px]">Current</Badge>
              )}
              <span className="text-xs text-muted-foreground">{folder.automationIds.length} item{folder.automationIds.length !== 1 ? "s" : ""}</span>
            </button>
          );
        })}

        {/* Create new folder inline */}
        {showNewFolder ? (
          <div className="flex items-center gap-2 px-1">
            <Input
              placeholder="Folder name..."
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleCreateAndMove()}
              className="h-9 text-sm flex-1"
              autoFocus
            />
            <Button size="sm" disabled={!newName.trim()} onClick={handleCreateAndMove}>
              Create & Move
            </Button>
            <Button variant="ghost" size="sm" onClick={() => { setShowNewFolder(false); setNewName(""); }}>
              <X className="w-3.5 h-3.5" />
            </Button>
          </div>
        ) : (
          <button
            onClick={() => setShowNewFolder(true)}
            className="w-full flex items-center gap-3 px-4 py-3 text-sm rounded-lg border border-dashed border-border hover:border-primary/40 hover:bg-primary/5 transition-colors text-left text-muted-foreground hover:text-foreground"
          >
            <FolderPlus className="w-4 h-4 shrink-0" />
            <span className="font-medium">Create New Folder</span>
          </button>
        )}
      </div>
    </Modal>
  );
};

// --- Edit Rule Modal ---
const EditRuleModal = ({
  rule, onClose, onUpdate
}: { rule: AutomationRule | null; onClose: () => void; onUpdate: (id: string, data: Partial<AutomationRule>) => void }) => {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [trigger, setTrigger] = useState<AutomationTrigger | "">("");
  const [action, setAction] = useState<AutomationAction | "">("");

  // Rehydrate form whenever a new rule is passed in for editing.
  React.useEffect(() => {
    if (rule) {
      setName(rule.name);
      setDescription(rule.description);
      setTrigger(rule.trigger);
      setAction(rule.action);
    }
  }, [rule]);

  const handleUpdate = () => {
    if (!rule || !name.trim() || !trigger || !action) return;
    onUpdate(rule.id, {
      name: name.trim(),
      description: description.trim(),
      trigger: trigger as AutomationTrigger,
      action: action as AutomationAction,
    });
    onClose();
  };

  return (
    <Modal isOpen={rule !== null} onClose={onClose} title="Edit Automation" size="lg">
      <div className="space-y-5">
        <div className="grid gap-2">
          <Label className="text-xs font-semibold">Name</Label>
          <Input value={name} onChange={(e) => setName(e.target.value)} className="h-9 text-sm" />
        </div>
        <div className="grid gap-2">
          <Label className="text-xs font-semibold">Description</Label>
          <Textarea value={description} onChange={(e) => setDescription(e.target.value)} className="text-sm min-h-[60px]" />
        </div>

        <div className="grid gap-2">
          <Label className="text-xs font-semibold">Trigger</Label>
          <div className="grid grid-cols-2 gap-2">
            {TRIGGER_OPTIONS.map((t) => (
              <button
                key={t.id}
                onClick={() => setTrigger(t.id)}
                className={cn(
                  "flex items-center gap-2 p-3 border rounded-md text-left transition-all text-xs",
                  trigger === t.id ? "border-primary bg-primary/5" : "hover:bg-muted/30"
                )}
              >
                <t.icon className={cn("w-4 h-4 shrink-0", trigger === t.id ? "text-primary" : "text-muted-foreground")} />
                <div>
                  <p className="font-semibold">{t.label}</p>
                  <p className="text-xs text-muted-foreground">{t.description}</p>
                </div>
              </button>
            ))}
          </div>
        </div>

        <div className="grid gap-2">
          <Label className="text-xs font-semibold">Action</Label>
          <div className="grid grid-cols-2 gap-2">
            {ACTION_OPTIONS.map((a) => (
              <button
                key={a.id}
                onClick={() => setAction(a.id)}
                className={cn(
                  "flex items-center gap-2 p-3 border rounded-md text-left transition-all text-xs",
                  action === a.id ? "border-emerald-500 bg-emerald-50" : "hover:bg-muted/30"
                )}
              >
                <a.icon className={cn("w-4 h-4 shrink-0", action === a.id ? "text-emerald-600" : "text-muted-foreground")} />
                <div>
                  <p className="font-semibold">{a.label}</p>
                  <p className="text-xs text-muted-foreground">{a.description}</p>
                </div>
              </button>
            ))}
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <Button variant="outline" size="sm" onClick={onClose}>Cancel</Button>
          <Button size="sm" disabled={!name.trim() || !trigger || !action} onClick={handleUpdate}>Save Changes</Button>
        </div>
      </div>
    </Modal>
  );
};

// --- Add Rule Modal ---
const AddRuleModal = ({ isOpen, onClose, onAdd }: { isOpen: boolean; onClose: () => void; onAdd: (data: Partial<AutomationRule>) => void }) => {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [trigger, setTrigger] = useState<AutomationTrigger | "">("");
  const [action, setAction] = useState<AutomationAction | "">("");

  const handleAdd = () => {
    if (!name.trim() || !trigger || !action) return;
    onAdd({
      tenantId: "tenant-1",
      name: name.trim(),
      description: description.trim(),
      trigger: trigger as AutomationTrigger,
      triggerConfig: {},
      action: action as AutomationAction,
      actionConfig: {},
      enabled: false,
      triggerCount: 0,
    });
    toast.success(`Rule "${name}" created`);
    setName(""); setDescription(""); setTrigger(""); setAction("");
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="New Automation Rule" size="lg">
      <div className="space-y-5">
        <div className="grid gap-2">
          <Label className="text-xs font-semibold">Rule Name</Label>
          <Input placeholder="e.g. Welcome Message" value={name} onChange={(e) => setName(e.target.value)} className="h-9 text-sm" />
        </div>
        <div className="grid gap-2">
          <Label className="text-xs font-semibold">Description</Label>
          <Textarea placeholder="What does this rule do?" value={description} onChange={(e) => setDescription(e.target.value)} className="text-sm min-h-[60px]" />
        </div>

        <div className="grid gap-2">
          <Label className="text-xs font-semibold">When this happens (Trigger)</Label>
          <div className="grid grid-cols-2 gap-2">
            {TRIGGER_OPTIONS.map((t) => (
              <button
                key={t.id}
                onClick={() => setTrigger(t.id)}
                className={cn(
                  "flex items-center gap-2 p-3 border text-left transition-all text-xs",
                  trigger === t.id ? "border-primary bg-primary/5" : "hover:bg-muted/30"
                )}
              >
                <t.icon className={cn("w-4 h-4 shrink-0", trigger === t.id ? "text-primary" : "text-muted-foreground")} />
                <div>
                  <p className="font-semibold">{t.label}</p>
                  <p className="text-xs text-muted-foreground">{t.description}</p>
                </div>
              </button>
            ))}
          </div>
        </div>

        <div className="grid gap-2">
          <Label className="text-xs font-semibold">Do this (Action)</Label>
          <div className="grid grid-cols-2 gap-2">
            {ACTION_OPTIONS.map((a) => (
              <button
                key={a.id}
                onClick={() => setAction(a.id)}
                className={cn(
                  "flex items-center gap-2 p-3 border text-left transition-all text-xs",
                  action === a.id ? "border-emerald-500 bg-emerald-50" : "hover:bg-muted/30"
                )}
              >
                <a.icon className={cn("w-4 h-4 shrink-0", action === a.id ? "text-emerald-600" : "text-muted-foreground")} />
                <div>
                  <p className="font-semibold">{a.label}</p>
                  <p className="text-xs text-muted-foreground">{a.description}</p>
                </div>
              </button>
            ))}
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <Button variant="outline" size="sm" onClick={onClose}>Cancel</Button>
          <Button size="sm" disabled={!name.trim() || !trigger || !action} onClick={handleAdd}>Create Rule</Button>
        </div>
      </div>
    </Modal>
  );
};

// AddWebhookModal removed — webhooks are now managed inside the Journey Builder (flow-builder.tsx).