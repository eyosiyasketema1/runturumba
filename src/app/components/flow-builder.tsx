import React, { useCallback, useMemo, useState } from "react";
import {
  ReactFlow, ReactFlowProvider, Background, Controls, MiniMap,
  addEdge, applyNodeChanges, applyEdgeChanges, Handle, Position,
  type Node, type Edge, type NodeChange, type EdgeChange, type Connection,
  type NodeProps, MarkerType
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import {
  ArrowLeft, Zap, Send, Clock, GitBranch, List, Sparkles, Bell,
  Plus, Save, Flag, CheckCircle2, Webhook, Copy, Trash2, AlertCircle,
  ChevronDown, ChevronRight, Globe
} from "lucide-react";
import {
  cn, type Webhook as WebhookType, formatTimeAgo, copyToClipboard
} from "./types";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";
import { Switch } from "./ui/switch";
import { Modal } from "./shared-ui";
import { toast } from "sonner";

// ---------------------------------------------------------------------------
// Node type catalogue — palette, colors, and default content per type.
// ---------------------------------------------------------------------------

type NodeType = "trigger" | "send_message" | "wait" | "condition" | "menu" | "ai_personalize" | "action" | "key_milestone" | "milestone";

type NodeData = {
  type: NodeType;
  title: string;
  body?: string;
  meta?: { label: string; value: string }[]; // e.g. Sent: 892, Read: 847 (95%)
  choices?: { label: string; pct?: number; dot?: string }[]; // Menu choices
  branches?: { label: string; pct?: number; tone: "yes" | "no" | "neutral" }[]; // Condition branches
  // Allow extra fields to roam here without the linter complaining, the flow
  // model grows naturally as more node types are added.
  [key: string]: any;
};

const NODE_TYPES: { id: NodeType; label: string; icon: any; bg: string; headerBg: string; border: string }[] = [
  { id: "trigger",        label: "Trigger",         icon: Zap,       bg: "bg-white",  headerBg: "bg-indigo-500",   border: "border-indigo-200" },
  { id: "send_message",   label: "Send Message",    icon: Send,      bg: "bg-white",  headerBg: "bg-blue-500",     border: "border-blue-200" },
  { id: "wait",           label: "Wait / Delay",    icon: Clock,     bg: "bg-white",  headerBg: "bg-amber-400",    border: "border-amber-200" },
  { id: "condition",      label: "Condition",       icon: GitBranch, bg: "bg-white",  headerBg: "bg-orange-500",   border: "border-orange-200" },
  { id: "menu",           label: "Menu / Choices",  icon: List,      bg: "bg-white",  headerBg: "bg-violet-500",   border: "border-violet-200" },
  { id: "ai_personalize", label: "AI Personalize",  icon: Sparkles,  bg: "bg-white",  headerBg: "bg-pink-500",     border: "border-pink-200" },
  { id: "action",         label: "Action / Notify", icon: Bell,      bg: "bg-white",  headerBg: "bg-rose-500",     border: "border-rose-200" },
  { id: "key_milestone",  label: "Key Milestone",   icon: Flag,          bg: "bg-white",  headerBg: "bg-teal-500",     border: "border-teal-200" },
  { id: "milestone",      label: "Milestone",       icon: CheckCircle2,  bg: "bg-white",  headerBg: "bg-cyan-500",     border: "border-cyan-200" },
];

const getTypeConfig = (t: NodeType) => NODE_TYPES.find(n => n.id === t)!;

// ---------------------------------------------------------------------------
// Custom node renderer — one component that switches on data.type.
// ---------------------------------------------------------------------------

function FlowNode({ data, selected }: NodeProps) {
  // Narrow the generic Node data into our richer NodeData shape.
  const d = data as unknown as NodeData;
  const cfg = getTypeConfig(d.type);
  const Icon = cfg.icon;
  const isTrigger = d.type === "trigger";

  return (
    <div
      className={cn(
        "w-[320px] bg-white rounded-xl shadow-md overflow-hidden border-2 transition-all",
        selected ? "border-primary ring-2 ring-primary/20" : cfg.border
      )}
    >
      {/* Inbound handle — not rendered for the triggering node */}
      {!isTrigger && (
        <Handle type="target" position={Position.Top} className="!bg-slate-400 !w-3 !h-3 !border-2 !border-white" />
      )}

      {/* Header — colored strip with icon and title */}
      <div className={cn("flex items-center gap-2 px-4 py-2.5 text-white", cfg.headerBg)}>
        <Icon className="w-4 h-4" />
        <span className="text-sm font-semibold">{d.title}</span>
      </div>

      {/* Body */}
      <div className="p-4 space-y-2">
        {d.body && (
          <p className="text-sm text-foreground leading-relaxed whitespace-pre-line">{d.body}</p>
        )}

        {d.choices && (
          <div className="space-y-1.5 pt-1">
            {d.choices.map((c, i) => (
              <div key={i} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span className={cn("w-1.5 h-1.5 rounded-full", c.dot || "bg-violet-500")} />
                  <span className="text-foreground">{c.label}</span>
                </div>
                {c.pct !== undefined && <span className="text-muted-foreground font-semibold">{c.pct}%</span>}
              </div>
            ))}
          </div>
        )}

        {d.branches && (
          <div className="flex items-center gap-1.5 pt-1 flex-wrap">
            {d.branches.map((b, i) => (
              <Badge
                key={i}
                variant="outline"
                className={cn(
                  "text-[10px] font-semibold border-transparent",
                  b.tone === "yes" && "bg-emerald-50 text-emerald-700",
                  b.tone === "no" && "bg-rose-50 text-rose-700",
                  b.tone === "neutral" && "bg-muted text-muted-foreground"
                )}
              >
                {b.label}{b.pct !== undefined ? `: ${b.pct}%` : ""}
              </Badge>
            ))}
          </div>
        )}

        {d.meta && (
          <div className="flex items-center gap-3 pt-2 text-xs border-t border-border mt-2">
            {d.meta.map((m, i) => (
              <span key={i} className="text-muted-foreground">
                <span className="font-semibold text-primary">{m.label}:</span> {m.value}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Outbound handles — Condition has two labelled handles, others have one */}
      {d.type === "condition" ? (
        <>
          <Handle
            id="yes"
            type="source"
            position={Position.Bottom}
            style={{ left: "25%" }}
            className="!bg-emerald-500 !w-3 !h-3 !border-2 !border-white"
          />
          <Handle
            id="no"
            type="source"
            position={Position.Bottom}
            style={{ left: "75%" }}
            className="!bg-rose-500 !w-3 !h-3 !border-2 !border-white"
          />
        </>
      ) : (
        <Handle type="source" position={Position.Bottom} className="!bg-slate-400 !w-3 !h-3 !border-2 !border-white" />
      )}
    </div>
  );
}

// Register the single renderer under each node type key so ReactFlow routes
// all our nodes through it.
const nodeTypes = Object.fromEntries(NODE_TYPES.map(n => [n.id, FlowNode]));

// ---------------------------------------------------------------------------
// Starter template — matches the reference screenshot's "New Believer Onboarding"
// flow so new users see a fully-wired example they can edit.
// ---------------------------------------------------------------------------

const STARTER_NODES: Node[] = [
  { id: "trigger",     type: "trigger",        position: { x: 320, y: 20  }, data: { type: "trigger",        title: "Trigger: Intake Complete", body: "When a seeker completes the intake form.\nChannel: All channels" } },
  { id: "welcome",     type: "send_message",   position: { x: 320, y: 220 }, data: { type: "send_message",   title: "Send Message", body: "Welcome Devotional\n\"Welcome to your spiritual journey! Here is your first devotional on God's love for you.\"", meta: [{ label: "Sent", value: "892" }, { label: "Read", value: "847 (95%)" }] } },
  { id: "wait1",       type: "wait",           position: { x: 320, y: 480 }, data: { type: "wait",           title: "Wait", body: "Wait 1 day\nThen check if seeker read the welcome message" } },
  { id: "cond1",       type: "condition",      position: { x: 320, y: 680 }, data: { type: "condition",      title: "Condition", body: "Did seeker read welcome message?", branches: [{ label: "Yes", pct: 78, tone: "yes" }, { label: "No", pct: 22, tone: "no" }] } },
  { id: "menu",        type: "menu",           position: { x:  40, y: 900 }, data: { type: "menu",           title: "Menu: Topic Selection", body: "What would you like to explore?", choices: [{ label: "Prayer & Meditation", pct: 42, dot: "bg-violet-500" }, { label: "Bible Study", pct: 35, dot: "bg-blue-500" }, { label: "Community & Fellowship", pct: 23, dot: "bg-emerald-500" }] } },
  { id: "reminder",    type: "action",         position: { x: 640, y: 900 }, data: { type: "action",         title: "Send Reminder", body: "Gentle Nudge\n\"Hi! We sent you a devotional yesterday. Whenever you're ready, it's waiting for you.\"", meta: [{ label: "Sent", value: "196" }, { label: "Re-engaged", value: "128 (65%)" }] } },
  { id: "personalize", type: "ai_personalize", position: { x:  40, y: 1160 }, data: { type: "ai_personalize", title: "AI Personalize", body: "Personalized Content Delivery\nClaude selects the best content from the library based on seeker's topic choice, maturity level, and engagement.", meta: [{ label: "Processed", value: "696" }, { label: "Engagement", value: "91%" }] } },
  { id: "wait2",       type: "wait",           position: { x: 640, y: 1160 }, data: { type: "wait",           title: "Wait 2 days", body: "Check re-engagement status" } },
  { id: "cond2",       type: "condition",      position: { x: 640, y: 1360 }, data: { type: "condition",      title: "Condition", body: "Still no engagement after reminder?", branches: [{ label: "Yes (dropout)", pct: 35, tone: "no" }, { label: "No (re-engaged)", pct: 65, tone: "yes" }] } },
  { id: "notify",      type: "action",         position: { x: 440, y: 1600 }, data: { type: "action",         title: "Action: Notify Mentor", body: "Alert assigned mentor about dropout risk." } },
  { id: "rejoin",      type: "ai_personalize", position: { x: 820, y: 1600 }, data: { type: "ai_personalize", title: "Rejoin Main Flow", body: "Move seeker back to the Menu: Topic Selection step." } },
];

const STARTER_EDGES: Edge[] = [
  { id: "e1", source: "trigger",  target: "welcome",     type: "smoothstep", markerEnd: { type: MarkerType.ArrowClosed } },
  { id: "e2", source: "welcome",  target: "wait1",       type: "smoothstep", markerEnd: { type: MarkerType.ArrowClosed } },
  { id: "e3", source: "wait1",    target: "cond1",       type: "smoothstep", markerEnd: { type: MarkerType.ArrowClosed } },
  { id: "e4", source: "cond1",    sourceHandle: "yes", target: "menu",     type: "smoothstep", label: "YES", style: { stroke: "#10b981" }, labelStyle: { fill: "#10b981", fontWeight: 700 }, markerEnd: { type: MarkerType.ArrowClosed, color: "#10b981" } },
  { id: "e5", source: "cond1",    sourceHandle: "no",  target: "reminder", type: "smoothstep", label: "NO",  style: { stroke: "#f43f5e" }, labelStyle: { fill: "#f43f5e", fontWeight: 700 }, markerEnd: { type: MarkerType.ArrowClosed, color: "#f43f5e" } },
  { id: "e6", source: "menu",     target: "personalize", type: "smoothstep", markerEnd: { type: MarkerType.ArrowClosed } },
  { id: "e7", source: "reminder", target: "wait2",       type: "smoothstep", markerEnd: { type: MarkerType.ArrowClosed } },
  { id: "e8", source: "wait2",    target: "cond2",       type: "smoothstep", markerEnd: { type: MarkerType.ArrowClosed } },
  { id: "e9", source: "cond2",    sourceHandle: "yes", target: "notify",   type: "smoothstep", label: "DROPOUT",    style: { stroke: "#f43f5e" }, labelStyle: { fill: "#f43f5e", fontWeight: 700 }, markerEnd: { type: MarkerType.ArrowClosed, color: "#f43f5e" } },
  { id: "e10", source: "cond2",   sourceHandle: "no",  target: "rejoin",   type: "smoothstep", label: "RE-ENGAGED", style: { stroke: "#10b981" }, labelStyle: { fill: "#10b981", fontWeight: 700 }, markerEnd: { type: MarkerType.ArrowClosed, color: "#10b981" } },
];

const EMPTY_STARTER: { nodes: Node[]; edges: Edge[] } = {
  nodes: [
    { id: "start", type: "trigger", position: { x: 240, y: 40 }, data: { type: "trigger", title: "Trigger: Choose a trigger", body: "Configure what starts this journey." } },
  ],
  edges: [],
};

// ---------------------------------------------------------------------------
// Props & entry point
// ---------------------------------------------------------------------------

export interface FlowBuilderProps {
  flowName?: string;
  status?: "draft" | "active" | "stopped";
  stats?: { totalRuns: number; avgCtr: number; completionRate: number; dropoutRate: number; aiBoost: number };
  useStarterTemplate?: boolean;
  onBack: () => void;
  onSave?: (data: { nodes: Node[]; edges: Edge[]; name: string }) => void;
  onPublish?: (data: { nodes: Node[]; edges: Edge[]; name: string }) => void;
  // Webhook management — moved into the Journey Builder
  webhooks?: WebhookType[];
  onToggleWebhook?: (id: string) => void;
  onDeleteWebhook?: (id: string) => void;
  onAddWebhook?: (data: Partial<WebhookType>) => void;
}

export function FlowBuilder({
  flowName = "Untitled Journey",
  status = "draft",
  stats = { totalRuns: 0, avgCtr: 0, completionRate: 0, dropoutRate: 0, aiBoost: 0 },
  useStarterTemplate = true,
  onBack,
  onSave,
  onPublish,
  webhooks = [],
  onToggleWebhook,
  onDeleteWebhook,
  onAddWebhook,
}: FlowBuilderProps) {
  return (
    <ReactFlowProvider>
      <FlowBuilderInner
        flowName={flowName}
        status={status}
        stats={stats}
        useStarterTemplate={useStarterTemplate}
        onBack={onBack}
        onSave={onSave}
        onPublish={onPublish}
        webhooks={webhooks}
        onToggleWebhook={onToggleWebhook}
        onDeleteWebhook={onDeleteWebhook}
        onAddWebhook={onAddWebhook}
      />
    </ReactFlowProvider>
  );
}

function FlowBuilderInner({
  flowName, status, stats, useStarterTemplate, onBack, onSave, onPublish,
  webhooks, onToggleWebhook, onDeleteWebhook, onAddWebhook,
}: Required<Pick<FlowBuilderProps, "flowName" | "status" | "stats" | "useStarterTemplate" | "onBack" | "webhooks">> & Pick<FlowBuilderProps, "onSave" | "onPublish" | "onToggleWebhook" | "onDeleteWebhook" | "onAddWebhook">) {
  const initial = useMemo(() => useStarterTemplate ? { nodes: STARTER_NODES, edges: STARTER_EDGES } : EMPTY_STARTER, [useStarterTemplate]);
  const [nodes, setNodes] = useState<Node[]>(initial.nodes);
  const [edges, setEdges] = useState<Edge[]>(initial.edges);
  const [name, setName] = useState(flowName);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [webhooksOpen, setWebhooksOpen] = useState(false);
  const [isAddWebhookOpen, setIsAddWebhookOpen] = useState(false);

  const onNodesChange = useCallback((changes: NodeChange[]) => setNodes(ns => applyNodeChanges(changes, ns)), []);
  const onEdgesChange = useCallback((changes: EdgeChange[]) => setEdges(es => applyEdgeChanges(changes, es)), []);
  const onConnect = useCallback((c: Connection) => setEdges(es => addEdge({ ...c, type: "smoothstep", markerEnd: { type: MarkerType.ArrowClosed } }, es)), []);

  // Add a new node of the given type to the canvas with a reasonable position.
  const handleAddNode = useCallback((type: NodeType) => {
    const cfg = getTypeConfig(type);
    const id = `${type}-${Date.now()}`;
    const newNode: Node = {
      id,
      type,
      position: { x: 120 + Math.random() * 320, y: 60 + Math.random() * 240 + nodes.length * 20 },
      data: {
        type,
        title: cfg.label,
        body: type === "trigger" ? "Configure what starts this journey."
            : type === "send_message" ? "Edit to add your message content."
            : type === "wait" ? "Wait 1 day"
            : type === "condition" ? "Your condition here"
            : type === "menu" ? "What would you like to know?"
            : type === "ai_personalize" ? "Claude will pick the best content for each seeker."
            : type === "key_milestone" ? "Define a key milestone that marks a major faith journey stage (e.g. Baptism, First Bible Study)."
            : type === "milestone" ? "Track a milestone checkpoint in the seeker's journey (e.g. Completed Week 1, Attended Group)."
            : "Notify mentor or run an action.",
        ...(type === "condition" ? { branches: [{ label: "Yes", tone: "yes" }, { label: "No", tone: "no" }] } : {}),
        ...(type === "menu" ? { choices: [{ label: "Option 1", dot: "bg-violet-500" }, { label: "Option 2", dot: "bg-blue-500" }] } : {}),
      },
    };
    setNodes(ns => [...ns, newNode]);
    toast.success(`${cfg.label} node added`);
  }, [nodes]);

  const selectedNode = nodes.find(n => n.id === selectedNodeId) || null;

  const handleUpdateSelected = (patch: Partial<NodeData>) => {
    if (!selectedNodeId) return;
    setNodes(ns => ns.map(n => n.id === selectedNodeId ? { ...n, data: { ...(n.data as any), ...patch } } as Node : n));
  };

  const handleSave = (publish?: boolean) => {
    const payload = { nodes, edges, name };
    if (publish) {
      onPublish?.(payload);
      toast.success(`"${name}" published`);
    } else {
      onSave?.(payload);
      toast.success(`"${name}" saved as draft`);
    }
  };

  return (
    <div className="h-[calc(100vh-60px)] flex flex-col bg-muted/30">
      {/* Header — back, title, status, save/publish */}
      <header className="flex items-center justify-between gap-4 px-6 py-3 bg-background border-b border-border">
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <button
            onClick={onBack}
            className="p-1.5 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
            aria-label="Back to automations"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div className="min-w-0 flex-1">
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="h-8 text-base font-bold border-none px-2 shadow-none focus-visible:ring-1 focus-visible:ring-ring max-w-[360px]"
              aria-label="Flow name"
            />
            <div className="flex items-center gap-2 mt-0.5 px-2">
              <span className="text-xs text-muted-foreground">Journey</span>
              <span className="text-muted-foreground">·</span>
              <Badge
                variant="outline"
                className={cn(
                  "text-[10px] font-bold uppercase tracking-wider border-transparent",
                  status === "active" && "bg-emerald-50 text-emerald-700",
                  status === "draft" && "bg-amber-50 text-amber-700",
                  status === "stopped" && "bg-rose-50 text-rose-700"
                )}
              >
                <span className={cn(
                  "w-1.5 h-1.5 rounded-full mr-1",
                  status === "active" && "bg-emerald-500",
                  status === "draft" && "bg-amber-500",
                  status === "stopped" && "bg-rose-500"
                )} />
                {status}
              </Badge>
              {stats.totalRuns > 0 && (
                <>
                  <span className="text-muted-foreground">·</span>
                  <span className="text-xs text-muted-foreground">{stats.totalRuns.toLocaleString()} runs</span>
                </>
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Button variant="outline" size="sm" onClick={() => handleSave(false)}>
            <Save className="w-3.5 h-3.5" /> Save Draft
          </Button>
          <Button size="sm" onClick={() => handleSave(true)}>
            Publish
          </Button>
        </div>
      </header>

      {/* Body — left palette · canvas · right rail */}
      <div className="flex-1 flex overflow-hidden">
        {/* Palette */}
        <aside className="w-60 shrink-0 bg-background border-r border-border p-4 overflow-y-auto">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider pb-3">Node Types</p>
          <div className="space-y-1.5">
            {NODE_TYPES.map(n => {
              const Icon = n.icon;
              return (
                <button
                  key={n.id}
                  onClick={() => handleAddNode(n.id)}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-md text-sm font-medium text-foreground hover:bg-muted transition-colors text-left group"
                >
                  <span className={cn("w-6 h-6 rounded-md flex items-center justify-center text-white", n.headerBg)}>
                    <Icon className="w-3.5 h-3.5" />
                  </span>
                  <span className="flex-1">{n.label}</span>
                  <Plus className="w-3.5 h-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                </button>
              );
            })}
          </div>
          <p className="text-xs text-muted-foreground mt-5 leading-relaxed">
            Click a type to add it to the canvas, then drag nodes around or draw connections between handles.
          </p>

          {/* ── Webhooks section ── */}
          <div className="mt-6 border-t border-border pt-4">
            <button
              onClick={() => setWebhooksOpen(v => !v)}
              className="w-full flex items-center justify-between text-xs font-semibold text-muted-foreground uppercase tracking-wider pb-2 hover:text-foreground transition-colors"
            >
              <span className="flex items-center gap-1.5">
                <Webhook className="w-3.5 h-3.5" />
                Webhooks
                <Badge variant="secondary" className="text-[10px] ml-0.5">{webhooks.length}</Badge>
              </span>
              {webhooksOpen ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
            </button>

            {webhooksOpen && (
              <div className="space-y-2 mt-1">
                {webhooks.length === 0 ? (
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    No webhooks configured. Add one to integrate with external systems.
                  </p>
                ) : (
                  webhooks.map(wh => (
                    <div key={wh.id} className={cn(
                      "p-2.5 rounded-md border text-xs space-y-1",
                      wh.enabled ? "border-sky-200 bg-sky-50/50" : "border-border bg-muted/30 opacity-60"
                    )}>
                      <div className="flex items-center justify-between gap-1">
                        <span className="font-semibold text-foreground truncate">{wh.name}</span>
                        <div className="flex items-center gap-1 shrink-0">
                          <Switch
                            checked={wh.enabled}
                            onCheckedChange={() => onToggleWebhook?.(wh.id)}
                            className="scale-75"
                          />
                          <button onClick={() => onDeleteWebhook?.(wh.id)} className="text-muted-foreground hover:text-destructive transition-colors p-0.5">
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                      <code className="text-[10px] text-muted-foreground font-mono truncate block">{wh.url}</code>
                      <div className="flex items-center gap-1 flex-wrap">
                        {wh.events.slice(0, 2).map(ev => (
                          <span key={ev} className="px-1.5 py-0.5 text-[9px] bg-background border border-border rounded font-medium">{ev}</span>
                        ))}
                        {wh.events.length > 2 && (
                          <span className="text-[9px] text-muted-foreground">+{wh.events.length - 2}</span>
                        )}
                      </div>
                      {wh.failureCount > 5 && (
                        <div className="flex items-center gap-1 text-destructive">
                          <AlertCircle className="w-2.5 h-2.5" />
                          <span className="text-[10px] font-medium">{wh.failureCount} failures</span>
                        </div>
                      )}
                    </div>
                  ))
                )}
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full text-xs h-7"
                  onClick={() => setIsAddWebhookOpen(true)}
                >
                  <Plus className="w-3 h-3 mr-1" />
                  Add Webhook
                </Button>
              </div>
            )}
          </div>
        </aside>

        {/* Canvas */}
        <div className="flex-1 relative">
          <ReactFlow
            nodes={nodes}
            edges={edges}
            nodeTypes={nodeTypes}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onNodeClick={(_, node) => setSelectedNodeId(node.id)}
            onPaneClick={() => setSelectedNodeId(null)}
            fitView
            fitViewOptions={{ padding: 0.2, minZoom: 0.4, maxZoom: 1.2 }}
            proOptions={{ hideAttribution: true }}
            defaultEdgeOptions={{ type: "smoothstep", markerEnd: { type: MarkerType.ArrowClosed } }}
          >
            <Background gap={16} color="#e2e8f0" />
            <Controls position="bottom-left" showInteractive={false} />
            <MiniMap
              pannable
              zoomable
              maskColor="rgba(241, 245, 249, 0.6)"
              nodeColor={(n) => {
                const cfg = getTypeConfig((n.data as any).type as NodeType);
                // Rough hex equivalents of tailwind 500-range for the minimap
                const map: Record<NodeType, string> = {
                  trigger: "#6366f1", send_message: "#3b82f6", wait: "#f59e0b",
                  condition: "#f97316", menu: "#8b5cf6", ai_personalize: "#ec4899", action: "#f43f5e",
                  key_milestone: "#14b8a6", milestone: "#06b6d4",
                };
                return map[cfg.id];
              }}
            />
          </ReactFlow>
        </div>

        {/* Right rail — node inspector OR flow stats */}
        <aside className="w-72 shrink-0 bg-background border-l border-border overflow-y-auto">
          {selectedNode ? (
            <NodeInspector node={selectedNode as Node<NodeData>} onUpdate={handleUpdateSelected} onDelete={() => {
              setNodes(ns => ns.filter(n => n.id !== selectedNodeId));
              setEdges(es => es.filter(e => e.source !== selectedNodeId && e.target !== selectedNodeId));
              setSelectedNodeId(null);
              toast.success("Node deleted");
            }} />
          ) : (
            <FlowStatsPanel stats={stats} />
          )}
        </aside>
      </div>

      {/* Add Webhook Modal — embedded in the Journey Builder */}
      <JourneyWebhookModal
        isOpen={isAddWebhookOpen}
        onClose={() => setIsAddWebhookOpen(false)}
        onAdd={(data) => { onAddWebhook?.(data); setIsAddWebhookOpen(false); }}
      />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Inline webhook add modal for the Journey Builder
// ---------------------------------------------------------------------------

function JourneyWebhookModal({ isOpen, onClose, onAdd }: { isOpen: boolean; onClose: () => void; onAdd: (data: Partial<WebhookType>) => void }) {
  const [whName, setWhName] = useState("");
  const [url, setUrl] = useState("");
  const [events, setEvents] = useState<string[]>([]);

  const availableEvents = [
    "message.sent", "message.received", "message.delivered", "message.failed",
    "contact.created", "contact.updated", "contact.deleted",
    "broadcast.completed", "channel.connected", "channel.disconnected"
  ];

  const toggleEvent = (ev: string) => setEvents(prev => prev.includes(ev) ? prev.filter(e => e !== ev) : [...prev, ev]);

  const handleAdd = () => {
    if (!whName.trim() || !url.trim() || events.length === 0) return;
    onAdd({ tenantId: "tenant-1", name: whName.trim(), url: url.trim(), events, enabled: false, failureCount: 0 });
    toast.success(`Webhook "${whName}" added`);
    setWhName(""); setUrl(""); setEvents([]);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="New Webhook" size="lg">
      <div className="space-y-5">
        <div className="grid gap-2">
          <Label className="text-xs font-semibold">Webhook Name</Label>
          <Input placeholder="e.g. CRM Sync" value={whName} onChange={(e) => setWhName(e.target.value)} className="h-9 text-sm" />
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
          <Button size="sm" disabled={!whName.trim() || !url.trim() || events.length === 0} onClick={handleAdd}>Add Webhook</Button>
        </div>
      </div>
    </Modal>
  );
}

// ---------------------------------------------------------------------------
// Right rail panels
// ---------------------------------------------------------------------------

function FlowStatsPanel({ stats }: { stats: FlowBuilderProps["stats"] }) {
  const s = stats!;
  return (
    <div className="p-5 space-y-5">
      <div>
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider pb-3">Node Types</p>
        <div className="space-y-2">
          {NODE_TYPES.map(n => (
            <div key={n.id} className="flex items-center gap-2 text-sm">
              <span className={cn("w-2.5 h-2.5 rounded-sm", n.headerBg)} />
              <span className="text-foreground">{n.label}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="border border-border rounded-xl p-4 space-y-3">
        <p className="text-sm font-bold text-foreground">Journey Stats</p>
        <div className="space-y-2.5">
          <StatRow label="Total Runs"        value={s.totalRuns.toLocaleString()} />
          <StatRow label="Avg CTR"           value={`${s.avgCtr}%`}           tone="green" />
          <StatRow label="Completion Rate"   value={`${s.completionRate}%`}   tone="blue" />
          <StatRow label="Dropout Rate"      value={`${s.dropoutRate}%`}      tone="red" />
          <StatRow label="AI Engagement Boost" value={`+${s.aiBoost}%`}       tone="pink" />
        </div>
      </div>
    </div>
  );
}

function StatRow({ label, value, tone }: { label: string; value: string; tone?: "green" | "blue" | "red" | "pink" }) {
  const valueTone = tone === "green" ? "text-emerald-600"
    : tone === "blue" ? "text-blue-600"
    : tone === "red" ? "text-rose-600"
    : tone === "pink" ? "text-pink-600"
    : "text-foreground";
  return (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className={cn("text-lg font-bold", valueTone)}>{value}</p>
    </div>
  );
}

function NodeInspector({
  node, onUpdate, onDelete
}: { node: Node<NodeData>; onUpdate: (patch: Partial<NodeData>) => void; onDelete: () => void }) {
  const d = node.data as NodeData;
  const cfg = getTypeConfig(d.type);
  const Icon = cfg.icon;
  return (
    <div className="p-5 space-y-4">
      <div className="flex items-center gap-2">
        <span className={cn("w-7 h-7 rounded-md flex items-center justify-center text-white", cfg.headerBg)}>
          <Icon className="w-3.5 h-3.5" />
        </span>
        <p className="text-sm font-bold text-foreground">{cfg.label}</p>
      </div>

      <div className="space-y-2">
        <label className="text-xs font-semibold text-foreground">Title</label>
        <Input value={d.title} onChange={(e) => onUpdate({ title: e.target.value })} />
      </div>

      <div className="space-y-2">
        <label className="text-xs font-semibold text-foreground">Body</label>
        <Textarea
          value={d.body ?? ""}
          onChange={(e) => onUpdate({ body: e.target.value })}
          className="min-h-[120px] text-sm"
          placeholder="What should this node do or say?"
        />
      </div>

      <div className="pt-2">
        <Button variant="outline" size="sm" className="w-full text-destructive hover:text-destructive" onClick={onDelete}>
          Delete node
        </Button>
      </div>
    </div>
  );
}
