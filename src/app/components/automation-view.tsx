import React, { useState, useMemo } from "react";
import {
  Zap, Plus, Search, Play, Pause, Trash2, Edit2,
  Webhook, ArrowRight, MoreVertical, Activity, Clock,
  AlertCircle, Check, X, Globe, Link2, Copy, Eye,
  Settings2, Filter, Tag, Users, MessageSquare, Send,
  RefreshCw, ExternalLink, ChevronRight, Shield,
  Inbox, ListOrdered, GitBranch, FolderPlus
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
import { FlowBuilder } from "./flow-builder";
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
  const folderCopy = {
    all:      { createLabel: "New Automation", singular: "Automation", emptyTitle: "Create your first Automation", emptyBody: "Automate interactions with your contacts by creating rules, sequences, and flows so you have more time to handle meaningful conversations." },
    basic:    { createLabel: "New Basic",      singular: "Basic rule", emptyTitle: "Create your first Basic rule", emptyBody: "Basic rules pair a single trigger with a single action — perfect for welcome messages, keyword replies, and quick automations." },
    sequence: { createLabel: "New Sequence",   singular: "Sequence",   emptyTitle: "Create your first Sequence", emptyBody: "Automate interactions with your contacts by creating a series of automatic messages so you have more time to handle meaningful conversations." },
    flow:     { createLabel: "New Journey",     singular: "Journey",    emptyTitle: "Create your first Journey",  emptyBody: "Journeys let you build branching, multi-step automations with milestones and webhooks — ideal for discipleship paths." },
  }[activeTab === "rules" ? activeFolder : "all"];

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

  const filteredRules = typedAutos.filter(a => {
    const matchesFolder = activeFolder === "all" || a._type === activeFolder;
    const q = searchQuery.toLowerCase();
    const matchesSearch = !q || a.name.toLowerCase().includes(q) || a.description.toLowerCase().includes(q);
    return matchesFolder && matchesSearch;
  });

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
    // kind === "flow" → Journey Builder
    return (
      <FlowBuilder
        flowName={rule?.name ?? "New Journey"}
        status={statusFor(rule)}
        stats={{
          totalRuns: rule?.triggerCount ?? 0,
          avgCtr: rule ? (getAutoCtr(rule) ?? 0) : 0,
          completionRate: 68, dropoutRate: 7, aiBoost: 18,
        }}
        useStarterTemplate={!isEdit}
        onBack={close}
        onSave={({ name }) => persist({ name, description: "Journey", trigger: "webhook_received", action: "webhook_call", enabled: false })}
        onPublish={({ name }) => { persist({ name, description: "Journey", trigger: "webhook_received", action: "webhook_call", enabled: true }); close(); }}
        webhooks={webhooks}
        onToggleWebhook={onToggleWebhook}
        onDeleteWebhook={onDeleteWebhook}
        onAddWebhook={onAddWebhook}
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
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search automations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 h-9 text-sm w-[240px]"
            />
          </div>
          <Button onClick={() => {
            // Route the New button to the right full-page builder per folder.
            if (activeFolder === "basic")    { setBuilderState({ kind: "basic",    mode: "new" }); return; }
            if (activeFolder === "sequence") { setBuilderState({ kind: "sequence", mode: "new" }); return; }
            if (activeFolder === "flow")     { setBuilderState({ kind: "flow",     mode: "new" }); return; }
            // On "all", ask the user which type first.
            setIsTypePickerOpen(true);
          }}>
            <Plus className="w-4 h-4 mr-1.5" />
            {folderCopy.createLabel}
          </Button>
        </div>
      </header>

      {/* Summary badges */}
      <div className="flex items-center gap-3">
        <Badge variant="secondary" className="text-xs">
          <Zap className="w-3 h-3 mr-1" />
          {automations.length} Automations
        </Badge>
        <Badge variant="secondary" className="text-xs">
          <Activity className="w-3 h-3 mr-1" />
          {activeAutomations} Active
        </Badge>
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
                <button
                  disabled
                  title="Coming soon"
                  className="w-full flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md text-muted-foreground/60 hover:bg-muted/30 transition-colors cursor-not-allowed"
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
                    const Icon = activeFolder === "all" ? Inbox
                      : activeFolder === "basic" ? Zap
                      : activeFolder === "sequence" ? ListOrdered : GitBranch;
                    const label = activeFolder === "all" ? "All Automations"
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
                {searchQuery && (
                  <span className="text-xs text-muted-foreground">Filtered by "{searchQuery}"</span>
                )}
              </div>
              {filteredRules.length === 0 ? (
                <div className="px-6 py-16 text-center max-w-md mx-auto">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                    {(() => {
                      const EmptyIcon = activeFolder === "sequence" ? ListOrdered
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
                    <Button className="mt-5" onClick={() => {
                      if (activeFolder === "basic")    setBuilderState({ kind: "basic",    mode: "new" });
                      else if (activeFolder === "sequence") setBuilderState({ kind: "sequence", mode: "new" });
                      else if (activeFolder === "flow")     setBuilderState({ kind: "flow",     mode: "new" });
                      else setIsTypePickerOpen(true);
                    }}>
                      <Plus className="w-4 h-4 mr-1.5" />
                      {folderCopy.createLabel}
                    </Button>
                  )}
                </div>
              ) : (
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border text-xs font-medium text-muted-foreground bg-muted/30">
                      <th className="px-5 py-3 text-left">Name</th>
                      <th className="px-5 py-3 text-left">Status</th>
                      <th className="px-5 py-3 text-left">Type</th>
                      <th className="px-5 py-3 text-left">Runs</th>
                      <th className="px-5 py-3 text-left">CTR</th>
                      <th className="px-5 py-3 text-left">Modified</th>
                      <th className="px-5 py-3 text-right w-10"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredRules.map((rule) => {
                      const status = getAutoStatus(rule);
                      const ctr = getAutoCtr(rule);
                      const modified = rule.lastTriggeredAt || rule.createdAt;
                      return (
                        <tr key={rule.id} className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors group">
                          <td className="px-5 py-4">
                            <div className="flex flex-col gap-0.5">
                              <span className="text-sm font-semibold text-foreground">{rule.name}</span>
                              {rule.description && (
                                <span className="text-xs text-muted-foreground truncate max-w-[420px]">{rule.description}</span>
                              )}
                            </div>
                          </td>
                          <td className="px-5 py-4">
                            <span className={cn(
                              "inline-flex items-center px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider border rounded-full",
                              statusBadge(status)
                            )}>
                              {status}
                            </span>
                          </td>
                          <td className="px-5 py-4 text-sm text-foreground">{typeLabel(rule._type)}</td>
                          <td className="px-5 py-4 text-sm font-medium text-foreground tabular-nums">{rule.triggerCount.toLocaleString()}</td>
                          <td className="px-5 py-4 text-sm text-foreground tabular-nums">{ctr !== null ? `${ctr}%` : <span className="text-muted-foreground">—</span>}</td>
                          <td className="px-5 py-4 text-sm text-muted-foreground">{formatTimeAgo(modified)}</td>
                          <td className="px-5 py-4 text-right">
                            <DropdownMenu>
                              <DropdownMenuTrigger
                                className={cn(
                                  "inline-flex items-center justify-center h-8 w-8 rounded-md",
                                  "text-muted-foreground hover:text-foreground hover:bg-muted",
                                  "transition-colors outline-none",
                                  "focus-visible:ring-2 focus-visible:ring-ring"
                                )}
                                aria-label={`Actions for ${rule.name}`}
                              >
                                <MoreVertical className="w-4 h-4" />
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="w-44">
                                <DropdownMenuItem onSelect={() => {
                                  setBuilderState({ kind: rule._type, mode: "edit", rule });
                                }}>
                                  <Edit2 className="w-3.5 h-3.5" />
                                  Edit
                                </DropdownMenuItem>
                                <DropdownMenuItem onSelect={() => handleDuplicateRule(rule)}>
                                  <Copy className="w-3.5 h-3.5" />
                                  Duplicate
                                </DropdownMenuItem>
                                <DropdownMenuItem onSelect={() => onToggleAutomation(rule.id)}>
                                  {rule.enabled
                                    ? <><Pause className="w-3.5 h-3.5" />Stop</>
                                    : <><Play className="w-3.5 h-3.5" />Activate</>}
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  variant="destructive"
                                  onSelect={() => setRuleToDelete(rule)}
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                  Delete
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
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

      {/* Webhooks are now managed inside the Journey Builder */}
    </div>
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