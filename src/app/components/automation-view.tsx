import React, { useState, useMemo } from "react";
import {
  Zap, Plus, Search, Play, Pause, Trash2, Edit2,
  Webhook, ArrowRight, MoreVertical, Activity, Clock,
  AlertCircle, Check, X, Globe, Link2, Copy, Eye,
  Settings2, Filter, Tag, Users, MessageSquare, Send,
  RefreshCw, ExternalLink, ChevronRight, Shield,
  Inbox, ListOrdered, GitBranch, FolderPlus
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { toast } from "sonner";
import {
  cn, type AutomationRule, type AutomationTrigger, type AutomationAction,
  type Webhook as WebhookType, formatTimeAgo, copyToClipboard
} from "./types";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Badge } from "./ui/badge";
import { Separator } from "./ui/separator";
import { Switch } from "./ui/switch";
import { Textarea } from "./ui/textarea";
import { Modal } from "./shared-ui";

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
const typeLabel = (t: AutoType) => t === "basic" ? "Basic" : t === "sequence" ? "Sequence" : "Flow";

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
  const [activeTab, setActiveTab] = useState<"rules" | "webhooks">("rules");
  const [searchQuery, setSearchQuery] = useState("");
  const [isAddRuleOpen, setIsAddRuleOpen] = useState(false);
  const [isAddWebhookOpen, setIsAddWebhookOpen] = useState(false);
  const [activeFolder, setActiveFolder] = useState<"all" | AutoType>("all");

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
          <Button onClick={() => activeTab === "rules" ? setIsAddRuleOpen(true) : setIsAddWebhookOpen(true)}>
            <Plus className="w-4 h-4 mr-1.5" />
            {activeTab === "rules" ? "New Automation" : "New Webhook"}
          </Button>
        </div>
      </header>

      {/* Secondary tab: keep Webhooks accessible without dominating the view */}
      <div className="flex items-center gap-1 bg-muted/50 border border-border rounded-md p-0.5 w-fit">
        <button
          onClick={() => setActiveTab("rules")}
          className={cn(
            "px-3 py-1.5 text-xs font-semibold rounded transition-all flex items-center gap-1.5",
            activeTab === "rules" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
          )}
        >
          <Zap className="w-3.5 h-3.5" />
          Automations
          <Badge variant="secondary" className="text-xs ml-0.5">{automations.length}</Badge>
        </button>
        <button
          onClick={() => setActiveTab("webhooks")}
          className={cn(
            "px-3 py-1.5 text-xs font-semibold rounded transition-all flex items-center gap-1.5",
            activeTab === "webhooks" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
          )}
        >
          <Webhook className="w-3.5 h-3.5" />
          Webhooks
          <Badge variant="secondary" className="text-xs ml-0.5">{webhooks.length}</Badge>
        </button>
      </div>

      {/* Content */}
      <AnimatePresence mode="wait">
        {activeTab === "rules" ? (
          <motion.div
            key="rules"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="space-y-3"
          >
            {/* Folder tabs */}
            <div className="flex items-center justify-between gap-2 border-b border-border">
              <div role="tablist" aria-label="Automation folders" className="flex items-center gap-1 overflow-x-auto no-scrollbar">
                {([
                  ["all",      "All Automations", folderCounts.all,      Inbox],
                  ["basic",    "Basic",           folderCounts.basic,    Zap],
                  ["sequence", "Sequences",       folderCounts.sequence, ListOrdered],
                  ["flow",     "Flows",           folderCounts.flow,     GitBranch],
                ] as const).map(([k, label, count, Icon]) => {
                  const isActive = activeFolder === k;
                  return (
                    <button
                      key={k}
                      role="tab"
                      aria-selected={isActive}
                      onClick={() => setActiveFolder(k as any)}
                      className={cn(
                        "flex items-center gap-2 px-3 py-2 text-sm font-medium border-b-2 -mb-px transition-all",
                        isActive
                          ? "border-primary text-primary"
                          : "border-transparent text-muted-foreground hover:text-foreground"
                      )}
                    >
                      <Icon className="w-3.5 h-3.5" />
                      <span>{label}</span>
                      <Badge
                        variant="secondary"
                        className={cn("text-xs font-semibold", isActive && "bg-primary/10 text-primary")}
                      >{count}</Badge>
                    </button>
                  );
                })}
              </div>
              <button
                disabled
                title="Coming soon"
                className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-muted-foreground/70 hover:text-foreground transition-all cursor-not-allowed mb-1"
              >
                <FolderPlus className="w-3.5 h-3.5" />
                <span>New Folder</span>
              </button>
            </div>

            {/* Main list */}
            <div className="bg-card border border-border rounded-lg overflow-hidden">
              {filteredRules.length === 0 ? (
                <div className="p-12 text-center">
                  <Zap className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
                  <p className="text-sm font-medium text-muted-foreground">
                    {searchQuery ? "No automations match your search" : "No automations yet"}
                  </p>
                  <p className="text-xs text-muted-foreground/70 mt-1">
                    {searchQuery ? "Try a different keyword." : "Create your first automation to get started."}
                  </p>
                  {!searchQuery && (
                    <Button size="sm" className="mt-4" onClick={() => setIsAddRuleOpen(true)}>
                      <Plus className="w-3.5 h-3.5 mr-1.5" />
                      New Automation
                    </Button>
                  )}
                </div>
              ) : (
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border text-xs uppercase tracking-wider text-muted-foreground bg-muted/30">
                      <th className="px-4 py-3 text-left font-semibold">Name</th>
                      <th className="px-4 py-3 text-left font-semibold">Status</th>
                      <th className="px-4 py-3 text-left font-semibold">Type</th>
                      <th className="px-4 py-3 text-left font-semibold">Runs</th>
                      <th className="px-4 py-3 text-left font-semibold">CTR</th>
                      <th className="px-4 py-3 text-left font-semibold">Modified</th>
                      <th className="px-4 py-3 text-right font-semibold w-10"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredRules.map((rule) => {
                      const status = getAutoStatus(rule);
                      const ctr = getAutoCtr(rule);
                      const modified = rule.lastTriggeredAt || rule.createdAt;
                      return (
                        <tr key={rule.id} className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors group">
                          <td className="px-4 py-3">
                            <div className="flex flex-col">
                              <span className="text-sm font-semibold text-foreground">{rule.name}</span>
                              {rule.description && (
                                <span className="text-xs text-muted-foreground truncate max-w-[420px]">{rule.description}</span>
                              )}
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <span className={cn(
                              "inline-flex items-center px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider border rounded-full",
                              statusBadge(status)
                            )}>
                              {status}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-sm text-foreground">{typeLabel(rule._type)}</td>
                          <td className="px-4 py-3 text-sm font-medium text-foreground">{rule.triggerCount.toLocaleString()}</td>
                          <td className="px-4 py-3 text-sm text-foreground">{ctr !== null ? `${ctr}%` : <span className="text-muted-foreground">—</span>}</td>
                          <td className="px-4 py-3 text-sm text-muted-foreground">{formatTimeAgo(modified)}</td>
                          <td className="px-4 py-3 text-right">
                            <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-7 w-7 p-0"
                                title={rule.enabled ? "Stop" : "Activate"}
                                onClick={() => onToggleAutomation(rule.id)}
                              >
                                {rule.enabled ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-7 w-7 p-0"
                                title="Delete"
                                onClick={() => onDeleteAutomation(rule.id)}
                              >
                                <Trash2 className="w-3.5 h-3.5 text-muted-foreground" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
          </motion.div>
        ) : (
          <motion.div key="webhooks" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-3">
            {filteredWebhooks.length === 0 ? (
              <Card>
                <CardContent className="p-12 text-center">
                  <Webhook className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
                  <p className="text-sm font-medium text-muted-foreground">No webhooks configured</p>
                  <p className="text-xs text-muted-foreground/70 mt-1">Set up webhooks to integrate with external systems.</p>
                  <Button size="sm" className="mt-4" onClick={() => setIsAddWebhookOpen(true)}>
                    <Plus className="w-3.5 h-3.5 mr-1.5" />
                    Add Webhook
                  </Button>
                </CardContent>
              </Card>
            ) : (
              filteredWebhooks.map((wh) => (
                <Card key={wh.id} className={cn("transition-all", !wh.enabled && "opacity-50")}>
                  <CardContent className="p-5">
                    <div className="flex items-center gap-4">
                      <div className={cn(
                        "w-10 h-10 flex items-center justify-center shrink-0 border",
                        wh.enabled ? "bg-sky-50 border-sky-200" : "bg-muted border-border"
                      )}>
                        <Webhook className={cn("w-5 h-5", wh.enabled ? "text-sky-600" : "text-muted-foreground")} />
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-semibold text-foreground truncate">{wh.name}</p>
                          {wh.failureCount > 5 && (
                            <Badge variant="outline" className="text-xs text-destructive border-destructive/20 bg-destructive/5">
                              <AlertCircle className="w-2.5 h-2.5 mr-0.5" />
                              {wh.failureCount} failures
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-2 mt-0.5">
                          <code className="text-xs text-muted-foreground font-mono truncate max-w-[300px]">{wh.url}</code>
                          <button
                            onClick={() => { copyToClipboard(wh.url); toast.success("URL copied"); }}
                            className="text-muted-foreground hover:text-foreground"
                          >
                            <Copy className="w-3 h-3" />
                          </button>
                        </div>
                        <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                          {wh.events.map(ev => (
                            <Badge key={ev} variant="secondary" className="text-xs">{ev}</Badge>
                          ))}
                        </div>
                      </div>

                      <div className="flex items-center gap-3 shrink-0">
                        {wh.lastCalledAt && (
                          <div className="text-right hidden md:block">
                            <p className="text-xs text-muted-foreground">Last called</p>
                            <p className="text-xs font-medium text-foreground">{formatTimeAgo(wh.lastCalledAt)}</p>
                          </div>
                        )}
                        <Switch
                          checked={wh.enabled}
                          onCheckedChange={() => onToggleWebhook(wh.id)}
                        />
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => onDeleteWebhook(wh.id)}>
                          <Trash2 className="w-3.5 h-3.5 text-muted-foreground" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Add Rule Modal */}
      <AddRuleModal isOpen={isAddRuleOpen} onClose={() => setIsAddRuleOpen(false)} onAdd={onAddAutomation} />

      {/* Add Webhook Modal */}
      <AddWebhookModal isOpen={isAddWebhookOpen} onClose={() => setIsAddWebhookOpen(false)} onAdd={onAddWebhook} />
    </div>
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

// --- Add Webhook Modal ---
const AddWebhookModal = ({ isOpen, onClose, onAdd }: { isOpen: boolean; onClose: () => void; onAdd: (data: Partial<WebhookType>) => void }) => {
  const [name, setName] = useState("");
  const [url, setUrl] = useState("");
  const [events, setEvents] = useState<string[]>([]);

  const availableEvents = [
    "message.sent", "message.received", "message.delivered", "message.failed",
    "contact.created", "contact.updated", "contact.deleted",
    "broadcast.completed", "channel.connected", "channel.disconnected"
  ];

  const toggleEvent = (ev: string) => {
    setEvents(prev => prev.includes(ev) ? prev.filter(e => e !== ev) : [...prev, ev]);
  };

  const handleAdd = () => {
    if (!name.trim() || !url.trim() || events.length === 0) return;
    onAdd({
      tenantId: "tenant-1",
      name: name.trim(),
      url: url.trim(),
      events,
      enabled: false,
      failureCount: 0,
    });
    toast.success(`Webhook "${name}" added`);
    setName(""); setUrl(""); setEvents([]);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="New Webhook" size="lg">
      <div className="space-y-5">
        <div className="grid gap-2">
          <Label className="text-xs font-semibold">Webhook Name</Label>
          <Input placeholder="e.g. CRM Sync" value={name} onChange={(e) => setName(e.target.value)} className="h-9 text-sm" />
        </div>
        <div className="grid gap-2">
          <Label className="text-xs font-semibold">Endpoint URL</Label>
          <Input placeholder="https://your-api.com/webhooks" value={url} onChange={(e) => setUrl(e.target.value)} className="h-9 text-sm font-mono" />
          <p className="text-xs text-muted-foreground">Turumba will POST JSON payloads to this URL.</p>
        </div>
        <div className="grid gap-2">
          <Label className="text-xs font-semibold">Subscribe to Events</Label>
          <div className="flex flex-wrap gap-2">
            {availableEvents.map(ev => (
              <button
                key={ev}
                onClick={() => toggleEvent(ev)}
                className={cn(
                  "px-2.5 py-1 text-xs font-medium border transition-all",
                  events.includes(ev) ? "bg-primary text-primary-foreground border-primary" : "bg-background text-muted-foreground border-border hover:bg-muted"
                )}
              >
                {ev}
              </button>
            ))}
          </div>
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <Button variant="outline" size="sm" onClick={onClose}>Cancel</Button>
          <Button size="sm" disabled={!name.trim() || !url.trim() || events.length === 0} onClick={handleAdd}>Add Webhook</Button>
        </div>
      </div>
    </Modal>
  );
};