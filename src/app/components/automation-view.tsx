import React, { useState } from "react";
import {
  Zap, Plus, Search, Play, Pause, Trash2, Edit2,
  Webhook, ArrowRight, MoreVertical, Activity, Clock,
  AlertCircle, Check, X, Globe, Link2, Copy, Eye,
  Settings2, Filter, Tag, Users, MessageSquare, Send,
  RefreshCw, ExternalLink, ChevronRight, Shield
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

  const activeAutomations = automations.filter(a => a.enabled).length;
  const totalTriggers = automations.reduce((sum, a) => sum + a.triggerCount, 0);
  const activeWebhooks = webhooks.filter(w => w.enabled).length;

  const filteredRules = automations.filter(a =>
    a.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    a.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredWebhooks = webhooks.filter(w =>
    w.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    w.url.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-8 p-6 lg:p-10 animate-in fade-in duration-500">
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Automation</h1>
          <p className="text-muted-foreground text-sm mt-1">Create rules that trigger actions automatically, and manage webhook integrations.</p>
        </div>
        <Button onClick={() => activeTab === "rules" ? setIsAddRuleOpen(true) : setIsAddWebhookOpen(true)}>
          <Plus className="w-4 h-4 mr-2" />
          {activeTab === "rules" ? "New Rule" : "New Webhook"}
        </Button>
      </header>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Active Rules", value: activeAutomations, sub: `of ${automations.length} total` },
          { label: "Total Triggers", value: totalTriggers.toLocaleString(), sub: "All time executions" },
          { label: "Webhooks", value: activeWebhooks, sub: `of ${webhooks.length} configured` },
          { label: "Failure Rate", value: `${webhooks.reduce((s, w) => s + w.failureCount, 0)}`, sub: "Total webhook failures" },
        ].map(stat => (
          <Card key={stat.label}>
            <CardContent className="p-4">
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{stat.label}</p>
              <p className="text-2xl font-bold text-foreground mt-1">{stat.value}</p>
              <p className="text-[11px] text-muted-foreground">{stat.sub}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Tabs + Search */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex gap-1 p-1 bg-muted border border-border">
          <button
            onClick={() => setActiveTab("rules")}
            className={cn(
              "px-4 py-2 text-xs font-semibold transition-all flex items-center gap-2",
              activeTab === "rules" ? "bg-background text-foreground shadow-sm border border-border" : "text-muted-foreground hover:text-foreground"
            )}
          >
            <Zap className="w-3.5 h-3.5" />
            Automation Rules
            <Badge variant="secondary" className="text-[9px] ml-1">{automations.length}</Badge>
          </button>
          <button
            onClick={() => setActiveTab("webhooks")}
            className={cn(
              "px-4 py-2 text-xs font-semibold transition-all flex items-center gap-2",
              activeTab === "webhooks" ? "bg-background text-foreground shadow-sm border border-border" : "text-muted-foreground hover:text-foreground"
            )}
          >
            <Webhook className="w-3.5 h-3.5" />
            Webhooks
            <Badge variant="secondary" className="text-[9px] ml-1">{webhooks.length}</Badge>
          </button>
        </div>
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder={activeTab === "rules" ? "Search rules..." : "Search webhooks..."}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 h-9 text-sm"
          />
        </div>
      </div>

      {/* Content */}
      <AnimatePresence mode="wait">
        {activeTab === "rules" ? (
          <motion.div key="rules" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-3">
            {filteredRules.length === 0 ? (
              <Card>
                <CardContent className="p-12 text-center">
                  <Zap className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
                  <p className="text-sm font-medium text-muted-foreground">No automation rules yet</p>
                  <p className="text-xs text-muted-foreground/70 mt-1">Create your first rule to automate repetitive tasks.</p>
                  <Button size="sm" className="mt-4" onClick={() => setIsAddRuleOpen(true)}>
                    <Plus className="w-3.5 h-3.5 mr-1.5" />
                    Create Rule
                  </Button>
                </CardContent>
              </Card>
            ) : (
              filteredRules.map((rule) => {
                const triggerInfo = TRIGGER_OPTIONS.find(t => t.id === rule.trigger);
                const actionInfo = ACTION_OPTIONS.find(a => a.id === rule.action);
                const TriggerIcon = triggerInfo?.icon || Zap;
                const ActionIcon = actionInfo?.icon || ArrowRight;

                return (
                  <Card key={rule.id} className={cn("transition-all", !rule.enabled && "opacity-50")}>
                    <CardContent className="p-5">
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2 shrink-0">
                          <div className="w-9 h-9 flex items-center justify-center bg-primary/10 border border-primary/20">
                            <TriggerIcon className="w-4 h-4 text-primary" />
                          </div>
                          <ArrowRight className="w-3.5 h-3.5 text-muted-foreground" />
                          <div className="w-9 h-9 flex items-center justify-center bg-emerald-50 border border-emerald-200">
                            <ActionIcon className="w-4 h-4 text-emerald-600" />
                          </div>
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-semibold text-foreground truncate">{rule.name}</p>
                            {rule.enabled && (
                              <Badge className="text-[9px] bg-emerald-50 text-emerald-600 border-emerald-200" variant="outline">Active</Badge>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground mt-0.5 truncate">{rule.description}</p>
                          <div className="flex items-center gap-3 mt-1.5">
                            <span className="text-[10px] text-muted-foreground">
                              <span className="font-semibold text-foreground">{rule.triggerCount}</span> executions
                            </span>
                            {rule.lastTriggeredAt && (
                              <span className="text-[10px] text-muted-foreground">
                                Last: {formatTimeAgo(rule.lastTriggeredAt)}
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <Switch
                            checked={rule.enabled}
                            onCheckedChange={() => onToggleAutomation(rule.id)}
                          />
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => onDeleteAutomation(rule.id)}>
                            <Trash2 className="w-3.5 h-3.5 text-muted-foreground" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })
            )}
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
                            <Badge variant="outline" className="text-[9px] text-destructive border-destructive/20 bg-destructive/5">
                              <AlertCircle className="w-2.5 h-2.5 mr-0.5" />
                              {wh.failureCount} failures
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-2 mt-0.5">
                          <code className="text-[11px] text-muted-foreground font-mono truncate max-w-[300px]">{wh.url}</code>
                          <button
                            onClick={() => { copyToClipboard(wh.url); toast.success("URL copied"); }}
                            className="text-muted-foreground hover:text-foreground"
                          >
                            <Copy className="w-3 h-3" />
                          </button>
                        </div>
                        <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                          {wh.events.map(ev => (
                            <Badge key={ev} variant="secondary" className="text-[9px]">{ev}</Badge>
                          ))}
                        </div>
                      </div>

                      <div className="flex items-center gap-3 shrink-0">
                        {wh.lastCalledAt && (
                          <div className="text-right hidden md:block">
                            <p className="text-[10px] text-muted-foreground">Last called</p>
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
                  <p className="text-[10px] text-muted-foreground">{t.description}</p>
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
                  <p className="text-[10px] text-muted-foreground">{a.description}</p>
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
          <p className="text-[11px] text-muted-foreground">Turumba will POST JSON payloads to this URL.</p>
        </div>
        <div className="grid gap-2">
          <Label className="text-xs font-semibold">Subscribe to Events</Label>
          <div className="flex flex-wrap gap-2">
            {availableEvents.map(ev => (
              <button
                key={ev}
                onClick={() => toggleEvent(ev)}
                className={cn(
                  "px-2.5 py-1 text-[11px] font-medium border transition-all",
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