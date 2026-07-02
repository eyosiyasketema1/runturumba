import React, { useState, useCallback, useRef, useEffect, useMemo } from "react";
import {
  ReactFlow, Background, Controls, MiniMap, Panel,
  useNodesState, useEdgesState, addEdge,
  Handle, Position, MarkerType, BackgroundVariant,
  type Node as RFNode, type Edge as RFEdge, type Connection as RFConnection,
  type NodeTypes, type EdgeTypes, type NodeProps,
  ReactFlowProvider,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import {
  Plus, Search, Play, Pause, Trash2, Edit2, MoreVertical, Clock,
  AlertCircle, X, Globe, Copy, Zap, ChevronRight, ChevronLeft,
  Inbox, FolderPlus, Folder, FolderOpen, Tag, Users, MessageSquare,
  Send, ArrowRight, Settings2, Sparkles, CornerDownRight, FileText,
  GitBranch, ListOrdered, Webhook, Mail, Phone, Bot, MousePointer,
  Timer, Filter, Split, Repeat, CheckCircle2, Circle, GripVertical,
  ChevronDown, Save, Eye, LayoutGrid, ArrowLeft, PlusCircle,
  Maximize2, ZoomIn, ZoomOut, Hand, Flag, Milestone, Route,
  LayoutTemplate, Layers, ArrowDownRight, ArrowUpRight, Hash,
  FolderInput, FolderClosed, Pencil,
  Activity, Bug, ChevronUp, Terminal, RotateCcw, StopCircle,
  TrendingDown, MousePointerClick, BarChart3, Loader2, XCircle,
  CheckCircle, SkipForward
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "./types";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Badge } from "./ui/badge";
import { Textarea } from "./ui/textarea";
import { Switch } from "./ui/switch";
import {
  DropdownMenu, DropdownMenuTrigger, DropdownMenuContent,
  DropdownMenuItem, DropdownMenuSeparator
} from "./ui/dropdown-menu";

// ============================================================================
// TYPES
// ============================================================================

type NodeType = "trigger" | "action" | "condition" | "delay" | "loop" | "end";
type AutomationMode = "basic" | "sequence" | "journey";

interface FlowNode {
  id: string;
  type: NodeType;
  category: string;
  label: string;
  description: string;
  icon: any;
  iconColor: string;
  iconBg: string;
  config: Record<string, any>;
  position: { x: number; y: number };
}

interface FlowConnection {
  id: string;
  from: string;
  to: string;
  label?: string;
  type?: "default" | "true" | "false";
}

interface AutomationFolder {
  id: string;
  name: string;
  icon?: string;
  color?: string;
}

export interface AutomationDraft {
  id: string;
  name: string;
  description: string;
  nodes: FlowNode[];
  connections: FlowConnection[];
  enabled: boolean;
  createdAt: string;
  runs: number;
  mode: AutomationMode;
  folderId: string | null; // null = unfiled / "All"
}

// ============================================================================
// NODE CATALOG
// ============================================================================

interface NodeCatalogItem {
  type: NodeType;
  category: string;
  label: string;
  description: string;
  icon: any;
  iconColor: string;
  iconBg: string;
}

const NODE_CATALOG: { section: string; description: string; icon: any; items: NodeCatalogItem[] }[] = [
  {
    section: "Triggers",
    description: "Start your automation when something happens",
    icon: Zap,
    items: [
      { type: "trigger", category: "message_received", label: "Message Received", description: "When an inbound message arrives", icon: MessageSquare, iconColor: "text-blue-400", iconBg: "bg-blue-500/20" },
      { type: "trigger", category: "contact_added", label: "Contact Created", description: "When a new contact is added", icon: Users, iconColor: "text-emerald-400", iconBg: "bg-emerald-500/20" },
      { type: "trigger", category: "tag_added", label: "Tag Applied", description: "When a tag is added to a contact", icon: Tag, iconColor: "text-amber-400", iconBg: "bg-amber-500/20" },
      { type: "trigger", category: "webhook", label: "Webhook", description: "Receive data from external services", icon: Webhook, iconColor: "text-purple-400", iconBg: "bg-purple-500/20" },
      { type: "trigger", category: "schedule", label: "Schedule", description: "Run at specific times or intervals", icon: Clock, iconColor: "text-cyan-400", iconBg: "bg-cyan-500/20" },
      { type: "trigger", category: "manual", label: "Manual Trigger", description: "Start with a button click", icon: MousePointer, iconColor: "text-gray-400", iconBg: "bg-gray-500/20" },
      { type: "trigger", category: "milestone_reached", label: "Milestone Reached", description: "When a seeker completes a milestone", icon: Milestone, iconColor: "text-violet-400", iconBg: "bg-violet-500/20" },
    ]
  },
  {
    section: "Actions",
    description: "Do something in your automation",
    icon: Play,
    items: [
      { type: "action", category: "send_message", label: "Send Message", description: "Send a message to a contact", icon: Send, iconColor: "text-blue-400", iconBg: "bg-blue-500/20" },
      { type: "action", category: "send_email", label: "Send Email", description: "Send an email notification", icon: Mail, iconColor: "text-rose-400", iconBg: "bg-rose-500/20" },
      { type: "action", category: "add_tag", label: "Add Tag", description: "Apply a tag to the contact", icon: Tag, iconColor: "text-amber-400", iconBg: "bg-amber-500/20" },
      { type: "action", category: "remove_tag", label: "Remove Tag", description: "Remove a tag from a contact", icon: X, iconColor: "text-red-400", iconBg: "bg-red-500/20" },
      { type: "action", category: "add_to_group", label: "Add to Group", description: "Add contact to a group", icon: Users, iconColor: "text-emerald-400", iconBg: "bg-emerald-500/20" },
      { type: "action", category: "webhook_call", label: "HTTP Request", description: "Call an external API", icon: Globe, iconColor: "text-violet-400", iconBg: "bg-violet-500/20" },
      { type: "action", category: "ai_respond", label: "AI Response", description: "Generate a response with AI", icon: Bot, iconColor: "text-pink-400", iconBg: "bg-pink-500/20" },
      { type: "action", category: "assign_mentor", label: "Assign Mentor", description: "Match with an available mentor", icon: Users, iconColor: "text-indigo-400", iconBg: "bg-indigo-500/20" },
      { type: "action", category: "update_stage", label: "Update Stage", description: "Move contact to a new stage", icon: ArrowRight, iconColor: "text-sky-400", iconBg: "bg-sky-500/20" },
    ]
  },
  {
    section: "Flow Control",
    description: "Branch, filter, delay, or loop your automation",
    icon: GitBranch,
    items: [
      { type: "condition", category: "if_else", label: "IF / ELSE", description: "Branch into two paths based on a condition", icon: Split, iconColor: "text-orange-400", iconBg: "bg-orange-500/20" },
      { type: "condition", category: "filter", label: "Filter", description: "Only continue if criteria match", icon: Filter, iconColor: "text-sky-400", iconBg: "bg-sky-500/20" },
      { type: "delay", category: "wait", label: "Wait / Delay", description: "Pause for a set duration", icon: Timer, iconColor: "text-teal-400", iconBg: "bg-teal-500/20" },
      { type: "loop", category: "loop", label: "Loop", description: "Repeat for each item in a list", icon: Repeat, iconColor: "text-indigo-400", iconBg: "bg-indigo-500/20" },
      { type: "end", category: "end", label: "End", description: "End this branch", icon: Flag, iconColor: "text-red-400", iconBg: "bg-red-500/20" },
    ]
  },
];

// ============================================================================
// CONSTANTS
// ============================================================================

const NODE_WIDTH = 220;
const NODE_HEIGHT = 80;
const HORIZONTAL_GAP = 100;
const VERTICAL_GAP = 140;
const CANVAS_PADDING = 80;

// ============================================================================
// EXECUTION / DEBUG TYPES
// ============================================================================

type NodeExecStatus = "idle" | "running" | "success" | "error" | "skipped" | "waiting";
type TestRunStatus = "idle" | "running" | "completed" | "failed";

interface NodeExecData {
  status: NodeExecStatus;
  startedAt?: string;
  completedAt?: string;
  durationMs?: number;
  inputData?: Record<string, any>;
  outputData?: Record<string, any>;
  error?: string;
  stats?: { reached: number; sent: number; delivered: number; seen: number; clicked: number; droppedOff: number };
}

interface ExecutionLog {
  id: string;
  timestamp: string;
  nodeId: string;
  nodeLabel: string;
  status: "info" | "success" | "error" | "warning";
  message: string;
}

interface TestRun {
  id: string;
  status: TestRunStatus;
  startedAt: string;
  completedAt?: string;
  seekerName: string;
  nodeStates: Record<string, NodeExecData>;
  logs: ExecutionLog[];
  currentNodeId?: string;
}

const MOCK_SEEKERS = ["Abebe Kebede", "Sara Mohammed", "Daniel Tadesse", "Hana Girma", "Yonas Alemu"];

function generateMockNodeStats(nodeIndex: number): NodeExecData["stats"] {
  const base = Math.max(30, 480 - nodeIndex * 75 + Math.floor(Math.random() * 40));
  const sent = Math.floor(base * (0.9 + Math.random() * 0.08));
  const delivered = Math.floor(sent * (0.85 + Math.random() * 0.1));
  const seen = Math.floor(delivered * (0.5 + Math.random() * 0.3));
  const clicked = Math.floor(seen * (0.1 + Math.random() * 0.25));
  const droppedOff = base - Math.floor(base * (0.7 + Math.random() * 0.2));
  return { reached: base, sent, delivered, seen, clicked, droppedOff };
}

function createMockTestRun(nodes: FlowNode[], connections: FlowConnection[]): TestRun {
  const seeker = MOCK_SEEKERS[Math.floor(Math.random() * MOCK_SEEKERS.length)];
  const runId = `run-${Date.now()}`;
  const nodeStates: Record<string, NodeExecData> = {};
  nodes.forEach(n => { nodeStates[n.id] = { status: "idle" }; });
  return { id: runId, status: "idle", startedAt: new Date().toISOString(), seekerName: seeker, nodeStates, logs: [] };
}

// ============================================================================
// DEFAULT FOLDERS
// ============================================================================

const DEFAULT_FOLDERS: AutomationFolder[] = [
  { id: "onboarding", name: "Onboarding" },
  { id: "follow-ups", name: "Follow-ups" },
];

// ============================================================================
// SAMPLE AUTOMATIONS
// ============================================================================

const SAMPLE_AUTOMATIONS: AutomationDraft[] = [
  {
    id: "wf-1", name: "Welcome New Contacts", description: "Send a welcome message when a contact is created",
    mode: "basic", enabled: true, createdAt: "2025-05-10T08:00:00Z", runs: 342, folderId: "onboarding",
    nodes: [
      { id: "n1", type: "trigger", category: "contact_added", label: "Contact Created", description: "When a new contact is added", icon: Users, iconColor: "text-emerald-400", iconBg: "bg-emerald-500/20", config: {}, position: { x: 0, y: 0 } },
      { id: "n2", type: "action", category: "send_message", label: "Send Welcome", description: "Welcome message", icon: Send, iconColor: "text-blue-400", iconBg: "bg-blue-500/20", config: { message: "Welcome to our community!" }, position: { x: 1, y: 0 } },
    ],
    connections: [{ id: "c1", from: "n1", to: "n2" }]
  },
  {
    id: "wf-2", name: "Keyword Auto-Reply", description: "Reply when a specific keyword is received",
    mode: "basic", enabled: true, createdAt: "2025-05-08T10:30:00Z", runs: 1205, folderId: null,
    nodes: [
      { id: "n1", type: "trigger", category: "message_received", label: "Message Received", description: "Keyword: 'help'", icon: MessageSquare, iconColor: "text-blue-400", iconBg: "bg-blue-500/20", config: { keyword: "help" }, position: { x: 0, y: 0 } },
      { id: "n2", type: "condition", category: "filter", label: "Contains 'help'", description: "Check keyword", icon: Filter, iconColor: "text-sky-400", iconBg: "bg-sky-500/20", config: {}, position: { x: 1, y: 0 } },
      { id: "n3", type: "action", category: "ai_respond", label: "AI Response", description: "Smart reply", icon: Bot, iconColor: "text-pink-400", iconBg: "bg-pink-500/20", config: {}, position: { x: 2, y: 0 } },
    ],
    connections: [{ id: "c1", from: "n1", to: "n2" }, { id: "c2", from: "n2", to: "n3" }]
  },
  {
    id: "wf-3", name: "Foundations of Faith Drip", description: "7-day drip sequence for new believers",
    mode: "sequence", enabled: true, createdAt: "2025-04-20T14:00:00Z", runs: 89, folderId: null,
    nodes: [
      { id: "n1", type: "trigger", category: "tag_added", label: "Tag: new-believer", description: "When tag applied", icon: Tag, iconColor: "text-amber-400", iconBg: "bg-amber-500/20", config: { tag: "new-believer" }, position: { x: 0, y: 0 } },
      { id: "n2", type: "action", category: "send_message", label: "Day 1 — Welcome", description: "Introduction to faith", icon: Send, iconColor: "text-blue-400", iconBg: "bg-blue-500/20", config: { message: "Day 1: What it means to believe..." }, position: { x: 1, y: 0 } },
      { id: "n3", type: "delay", category: "wait", label: "Wait 1 day", description: "24 hours", icon: Timer, iconColor: "text-teal-400", iconBg: "bg-teal-500/20", config: { hours: 24 }, position: { x: 2, y: 0 } },
      { id: "n4", type: "action", category: "send_message", label: "Day 2 — Prayer", description: "Understanding prayer", icon: Send, iconColor: "text-blue-400", iconBg: "bg-blue-500/20", config: { message: "Day 2: The power of prayer..." }, position: { x: 3, y: 0 } },
      { id: "n5", type: "delay", category: "wait", label: "Wait 1 day", description: "24 hours", icon: Timer, iconColor: "text-teal-400", iconBg: "bg-teal-500/20", config: { hours: 24 }, position: { x: 4, y: 0 } },
      { id: "n6", type: "action", category: "send_message", label: "Day 3 — Bible", description: "Reading the Bible", icon: Send, iconColor: "text-blue-400", iconBg: "bg-blue-500/20", config: { message: "Day 3: How to read the Bible..." }, position: { x: 5, y: 0 } },
      { id: "n7", type: "action", category: "add_tag", label: "Complete Tag", description: "Tag: foundations-complete", icon: Tag, iconColor: "text-amber-400", iconBg: "bg-amber-500/20", config: { tag: "foundations-complete" }, position: { x: 6, y: 0 } },
    ],
    connections: [
      { id: "c1", from: "n1", to: "n2" }, { id: "c2", from: "n2", to: "n3" },
      { id: "c3", from: "n3", to: "n4" }, { id: "c4", from: "n4", to: "n5" },
      { id: "c5", from: "n5", to: "n6" }, { id: "c6", from: "n6", to: "n7" },
    ]
  },
  {
    id: "wf-4", name: "Seeker Discipleship Journey", description: "Multi-path journey based on seeker engagement",
    mode: "journey", enabled: true, createdAt: "2025-04-15T09:00:00Z", runs: 213, folderId: null,
    nodes: [
      { id: "j1", type: "trigger", category: "contact_added", label: "New Seeker", description: "Contact created", icon: Users, iconColor: "text-emerald-400", iconBg: "bg-emerald-500/20", config: {}, position: { x: 0, y: 1 } },
      { id: "j2", type: "action", category: "send_message", label: "Welcome Message", description: "Send intro", icon: Send, iconColor: "text-blue-400", iconBg: "bg-blue-500/20", config: { message: "Welcome! Tell us about yourself." }, position: { x: 1, y: 1 } },
      { id: "j3", type: "delay", category: "wait", label: "Wait 2 days", description: "48 hours", icon: Timer, iconColor: "text-teal-400", iconBg: "bg-teal-500/20", config: { hours: 48 }, position: { x: 2, y: 1 } },
      { id: "j4", type: "condition", category: "if_else", label: "Replied?", description: "Check if they responded", icon: Split, iconColor: "text-orange-400", iconBg: "bg-orange-500/20", config: { condition: "has_replied" }, position: { x: 3, y: 1 } },
      { id: "j5", type: "action", category: "add_tag", label: "Tag: Engaged", description: "Mark as engaged", icon: Tag, iconColor: "text-amber-400", iconBg: "bg-amber-500/20", config: { tag: "engaged" }, position: { x: 4, y: 0 } },
      { id: "j6", type: "action", category: "assign_mentor", label: "Assign Mentor", description: "Auto-match mentor", icon: Users, iconColor: "text-indigo-400", iconBg: "bg-indigo-500/20", config: {}, position: { x: 5, y: 0 } },
      { id: "j7", type: "action", category: "send_message", label: "Start Lesson 1", description: "Send first study", icon: Send, iconColor: "text-blue-400", iconBg: "bg-blue-500/20", config: {}, position: { x: 6, y: 0 } },
      { id: "j8", type: "action", category: "send_message", label: "Follow-up Nudge", description: "Gentle reminder", icon: Send, iconColor: "text-blue-400", iconBg: "bg-blue-500/20", config: { message: "Hey, just checking in!" }, position: { x: 4, y: 2 } },
      { id: "j9", type: "delay", category: "wait", label: "Wait 3 days", description: "72 hours", icon: Timer, iconColor: "text-teal-400", iconBg: "bg-teal-500/20", config: { hours: 72 }, position: { x: 5, y: 2 } },
      { id: "j10", type: "condition", category: "if_else", label: "Replied now?", description: "Second check", icon: Split, iconColor: "text-orange-400", iconBg: "bg-orange-500/20", config: { condition: "has_replied" }, position: { x: 6, y: 2 } },
      { id: "j11", type: "action", category: "add_tag", label: "Tag: Re-engaged", description: "Came back", icon: Tag, iconColor: "text-amber-400", iconBg: "bg-amber-500/20", config: { tag: "re-engaged" }, position: { x: 7, y: 1.5 } },
      { id: "j12", type: "action", category: "add_tag", label: "Tag: Dormant", description: "No response", icon: Tag, iconColor: "text-red-400", iconBg: "bg-red-500/20", config: { tag: "dormant" }, position: { x: 7, y: 2.5 } },
    ],
    connections: [
      { id: "c1", from: "j1", to: "j2" },
      { id: "c2", from: "j2", to: "j3" },
      { id: "c3", from: "j3", to: "j4" },
      { id: "c4", from: "j4", to: "j5", label: "Yes", type: "true" },
      { id: "c5", from: "j4", to: "j8", label: "No", type: "false" },
      { id: "c6", from: "j5", to: "j6" },
      { id: "c7", from: "j6", to: "j7" },
      { id: "c8", from: "j8", to: "j9" },
      { id: "c9", from: "j9", to: "j10" },
      { id: "c10", from: "j10", to: "j11", label: "Yes", type: "true" },
      { id: "c11", from: "j10", to: "j12", label: "No", type: "false" },
    ]
  },
  {
    id: "wf-5", name: "VIP Auto-Tag", description: "Auto-tag contacts who complete 5+ milestones",
    mode: "basic", enabled: true, createdAt: "2025-05-15T11:00:00Z", runs: 56, folderId: null,
    nodes: [
      { id: "n1", type: "trigger", category: "milestone_reached", label: "Milestone Completed", description: "Event received", icon: Milestone, iconColor: "text-violet-400", iconBg: "bg-violet-500/20", config: {}, position: { x: 0, y: 0 } },
      { id: "n2", type: "condition", category: "if_else", label: "Milestones >= 5", description: "Check count", icon: Split, iconColor: "text-orange-400", iconBg: "bg-orange-500/20", config: {}, position: { x: 1, y: 0 } },
      { id: "n3", type: "action", category: "add_tag", label: "Tag: VIP", description: "Apply VIP tag", icon: Tag, iconColor: "text-amber-400", iconBg: "bg-amber-500/20", config: { tag: "vip" }, position: { x: 2, y: 0 } },
    ],
    connections: [{ id: "c1", from: "n1", to: "n2" }, { id: "c2", from: "n2", to: "n3" }]
  },
  {
    id: "wf-6", name: "Re-engagement Nudge", description: "Nudge contacts who haven't responded in 7 days",
    mode: "sequence", enabled: false, createdAt: "2025-05-01T09:00:00Z", runs: 0, folderId: "follow-ups",
    nodes: [
      { id: "n1", type: "trigger", category: "schedule", label: "Daily at 9am", description: "Every day at 9am", icon: Clock, iconColor: "text-cyan-400", iconBg: "bg-cyan-500/20", config: { cron: "0 9 * * *" }, position: { x: 0, y: 0 } },
      { id: "n2", type: "condition", category: "filter", label: "Last msg > 7 days", description: "Filter inactive", icon: Filter, iconColor: "text-sky-400", iconBg: "bg-sky-500/20", config: {}, position: { x: 1, y: 0 } },
      { id: "n3", type: "action", category: "send_message", label: "Send Nudge", description: "Friendly check-in", icon: Send, iconColor: "text-blue-400", iconBg: "bg-blue-500/20", config: {}, position: { x: 2, y: 0 } },
      { id: "n4", type: "delay", category: "wait", label: "Wait 3 days", description: "72 hours", icon: Timer, iconColor: "text-teal-400", iconBg: "bg-teal-500/20", config: { hours: 72 }, position: { x: 3, y: 0 } },
      { id: "n5", type: "action", category: "send_message", label: "Final Nudge", description: "One last try", icon: Send, iconColor: "text-blue-400", iconBg: "bg-blue-500/20", config: {}, position: { x: 4, y: 0 } },
    ],
    connections: [
      { id: "c1", from: "n1", to: "n2" }, { id: "c2", from: "n2", to: "n3" },
      { id: "c3", from: "n3", to: "n4" }, { id: "c4", from: "n4", to: "n5" },
    ]
  },
];

// ============================================================================
// HELPERS
// ============================================================================

const formatTimeAgo = (iso: string) => {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
};

const getNodeTypeColor = (type: NodeType) => {
  switch (type) {
    case "trigger": return { bar: "bg-amber-500", ring: "ring-amber-500/30", badge: "bg-amber-100 text-amber-700 border-amber-200" };
    case "action": return { bar: "bg-blue-500", ring: "ring-blue-500/30", badge: "bg-blue-100 text-blue-700 border-blue-200" };
    case "condition": return { bar: "bg-orange-500", ring: "ring-orange-500/30", badge: "bg-orange-100 text-orange-700 border-orange-200" };
    case "delay": return { bar: "bg-teal-500", ring: "ring-teal-500/30", badge: "bg-teal-100 text-teal-700 border-teal-200" };
    case "loop": return { bar: "bg-indigo-500", ring: "ring-indigo-500/30", badge: "bg-indigo-100 text-indigo-700 border-indigo-200" };
    case "end": return { bar: "bg-red-500", ring: "ring-red-500/30", badge: "bg-red-100 text-red-700 border-red-200" };
    default: return { bar: "bg-gray-500", ring: "ring-gray-500/30", badge: "bg-gray-100 text-gray-700 border-gray-200" };
  }
};

const getModeInfo = (mode: AutomationMode) => {
  switch (mode) {
    case "basic": return { label: "Basic", icon: Zap, color: "text-blue-600", bg: "bg-blue-50", border: "border-blue-200", desc: "Simple trigger → action chains" };
    case "sequence": return { label: "Sequence", icon: ListOrdered, color: "text-teal-600", bg: "bg-teal-50", border: "border-teal-200", desc: "Multi-step discipleship drips with delays" };
    case "journey": return { label: "Journey", icon: Route, color: "text-purple-600", bg: "bg-purple-50", border: "border-purple-200", desc: "Branching paths based on seeker engagement" };
  }
};

const gridToPixel = (gx: number, gy: number): { px: number; py: number } => ({
  px: CANVAS_PADDING + gx * (NODE_WIDTH + HORIZONTAL_GAP),
  py: CANVAS_PADDING + gy * (NODE_HEIGHT + VERTICAL_GAP),
});

// ============================================================================
// REACT FLOW CUSTOM NODE
// ============================================================================

const ExecStatusIcon = ({ status }: { status: NodeExecStatus }) => {
  switch (status) {
    case "running": return <Loader2 className="w-3.5 h-3.5 text-blue-500 animate-spin" />;
    case "success": return <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />;
    case "error": return <XCircle className="w-3.5 h-3.5 text-red-500" />;
    case "skipped": return <SkipForward className="w-3.5 h-3.5 text-gray-400" />;
    case "waiting": return <Clock className="w-3.5 h-3.5 text-amber-500" />;
    default: return null;
  }
};

const execBorderColor = (status: NodeExecStatus) => {
  switch (status) {
    case "running": return "border-blue-400 shadow-blue-500/20 shadow-lg ring-2 ring-blue-400/30";
    case "success": return "border-emerald-400 shadow-emerald-500/10";
    case "error": return "border-red-400 shadow-red-500/20 shadow-lg ring-2 ring-red-400/30";
    case "skipped": return "border-gray-300 opacity-60";
    case "waiting": return "border-amber-400";
    default: return "";
  }
};

const AutomationNodeComponent = ({ data, selected }: NodeProps) => {
  const node = data.flowNode as FlowNode;
  const Icon = node.icon;
  const colors = getNodeTypeColor(node.type);
  const onDelete = data.onDelete as () => void;
  const onAddAfter = data.onAddAfter as (() => void) | undefined;
  const onDoubleClick = data.onDoubleClick as (() => void) | undefined;
  const execData = data.execData as NodeExecData | undefined;
  const execStatus = execData?.status ?? "idle";
  const isExecMode = data.isExecMode as boolean | undefined;

  return (
    <div className="group" style={{ width: NODE_WIDTH }} onDoubleClick={onDoubleClick}>
      {/* Input handle */}
      <Handle type="target" position={Position.Left} className="!w-2.5 !h-2.5 !bg-muted-foreground/40 !border-2 !border-background !-left-1.5" />

      <div className={cn(
        "rounded-xl border-2 transition-all duration-300 bg-card hover:shadow-lg hover:shadow-primary/5",
        isExecMode && execStatus !== "idle" ? execBorderColor(execStatus)
          : selected ? `border-primary shadow-lg shadow-primary/10 ring-2 ${colors.ring}` : "border-border hover:border-primary/40",
        execStatus === "running" && "animate-pulse"
      )}>
        <div className={cn("h-1 rounded-t-[10px]", colors.bar)} />
        <div className="px-3.5 py-2.5 flex items-start gap-3">
          <div className={cn("w-9 h-9 rounded-lg flex items-center justify-center shrink-0 mt-0.5", node.iconBg)}>
            <Icon className={cn("w-4.5 h-4.5", node.iconColor)} />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              <p className="text-[13px] font-semibold text-foreground leading-tight truncate flex-1">{node.label}</p>
              {isExecMode && execStatus !== "idle" && <ExecStatusIcon status={execStatus} />}
            </div>
            <p className="text-[11px] text-muted-foreground mt-0.5 truncate">{node.description}</p>
            {/* Exec duration */}
            {isExecMode && execData?.durationMs != null && (
              <p className="text-[10px] text-muted-foreground mt-1 flex items-center gap-1">
                <Clock className="w-2.5 h-2.5" /> {execData.durationMs < 1000 ? `${execData.durationMs}ms` : `${(execData.durationMs / 1000).toFixed(1)}s`}
              </p>
            )}
          </div>
        </div>
        {/* Stats row shown in exec mode */}
        {isExecMode && execData?.stats && (
          <div className="px-3.5 pb-2 flex items-center gap-2.5 text-[10px] text-muted-foreground border-t border-border/50 pt-1.5 mt-0.5">
            <span className="flex items-center gap-0.5"><Users className="w-2.5 h-2.5 text-blue-500" />{execData.stats.reached}</span>
            <span className="flex items-center gap-0.5"><Send className="w-2.5 h-2.5 text-emerald-500" />{execData.stats.sent}</span>
            <span className="flex items-center gap-0.5"><Eye className="w-2.5 h-2.5 text-violet-500" />{execData.stats.delivered > 0 ? Math.round((execData.stats.seen / execData.stats.delivered) * 100) : 0}%</span>
            {execData.error && <span className="flex items-center gap-0.5 text-red-500"><AlertCircle className="w-2.5 h-2.5" />err</span>}
          </div>
        )}
      </div>

      {/* Output handle */}
      <Handle type="source" position={Position.Right} className="!w-2.5 !h-2.5 !bg-muted-foreground/40 !border-2 !border-background !-right-1.5" />

      {/* Condition TRUE/FALSE handles */}
      {node.type === "condition" && (
        <>
          <Handle type="source" position={Position.Right} id="true" className="!w-2.5 !h-2.5 !bg-emerald-500 !border-2 !border-background !-right-1.5 !top-[30%]" />
          <Handle type="source" position={Position.Right} id="false" className="!w-2.5 !h-2.5 !bg-red-500 !border-2 !border-background !-right-1.5 !top-[70%]" />
          <div className="absolute -bottom-6 left-1/3">
            <span className="text-[9px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">TRUE</span>
          </div>
          <div className="absolute -bottom-6 right-1/3">
            <span className="text-[9px] font-bold text-red-600 bg-red-50 px-1.5 py-0.5 rounded border border-red-200">FALSE</span>
          </div>
        </>
      )}

      {/* Exec error badge */}
      {isExecMode && execStatus === "error" && (
        <div className="absolute -bottom-5 left-1/2 -translate-x-1/2 whitespace-nowrap">
          <span className="text-[9px] font-bold text-red-600 bg-red-50 px-2 py-0.5 rounded-full border border-red-200 flex items-center gap-1">
            <XCircle className="w-2.5 h-2.5" /> Error
          </span>
        </div>
      )}

      {/* Delete button */}
      {!isExecMode && (
        <button onClick={(e) => { e.stopPropagation(); onDelete(); }}
          className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-xs hover:scale-110 z-10">
          <X className="w-3 h-3" />
        </button>
      )}

      {/* Add after button */}
      {onAddAfter && !isExecMode && (
        <button onClick={(e) => { e.stopPropagation(); onAddAfter(); }}
          className="absolute -right-5 top-1/2 -translate-y-1/2 translate-x-full w-7 h-7 rounded-full border-2 border-dashed border-border bg-background flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all hover:border-primary hover:bg-primary/5 z-10">
          <Plus className="w-3.5 h-3.5 text-muted-foreground group-hover:text-primary" />
        </button>
      )}
    </div>
  );
};

const rfNodeTypes: NodeTypes = { automationNode: AutomationNodeComponent } as any;

// ============================================================================
// NODE PICKER PANEL
// ============================================================================

const NodePickerPanel = ({ isOpen, onClose, onSelectNode, title, mode }: {
  isOpen: boolean; onClose: () => void; onSelectNode: (item: NodeCatalogItem) => void; title: string; mode: AutomationMode;
}) => {
  const [search, setSearch] = useState("");
  const [collapsedSections, setCollapsedSections] = useState<Set<string>>(new Set(["Actions", "Flow Control"]));
  const filteredCatalog = useMemo(() => {
    let catalog = NODE_CATALOG;
    if (mode === "basic") {
      catalog = catalog.map(s => s.section === "Flow Control" ? { ...s, items: s.items.filter(i => i.category === "filter") } : s).filter(s => s.items.length > 0);
    }
    if (!search.trim()) return catalog;
    const q = search.toLowerCase();
    return catalog.map(section => ({ ...section, items: section.items.filter(i => i.label.toLowerCase().includes(q) || i.description.toLowerCase().includes(q)) })).filter(s => s.items.length > 0);
  }, [search, mode]);
  if (!isOpen) return null;
  return (
    <div className="w-[320px] shrink-0 border-l border-border bg-card h-full overflow-y-auto animate-in slide-in-from-right-5 duration-300">
      <div className="sticky top-0 bg-card z-10 border-b border-border">
        <div className="flex items-center justify-between px-5 py-4">
          <h3 className="text-base font-bold text-foreground">{title}</h3>
          <button onClick={onClose} className="p-1.5 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"><X className="w-4 h-4" /></button>
        </div>
        <div className="px-5 pb-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input placeholder="Search nodes..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9 h-9 text-sm bg-muted/50 border-border" autoFocus />
          </div>
        </div>
      </div>
      <div className="py-2">
        {filteredCatalog.map(section => {
          const SectionIcon = section.icon;
          const isExpanded = !collapsedSections.has(section.section) || search.trim().length > 0;
          return (
            <div key={section.section}>
              <button onClick={() => {
                if (search) return;
                setCollapsedSections(prev => {
                  const next = new Set(prev);
                  if (next.has(section.section)) next.delete(section.section);
                  else next.add(section.section);
                  return next;
                });
              }} className="w-full flex items-center gap-3 px-5 py-3 hover:bg-muted/50 transition-colors">
                <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center shrink-0"><SectionIcon className="w-4 h-4 text-muted-foreground" /></div>
                <div className="flex-1 text-left">
                  <p className="text-sm font-semibold text-foreground">{section.section}</p>
                  <p className="text-xs text-muted-foreground">{section.description}</p>
                </div>
                <ChevronRight className={cn("w-4 h-4 text-muted-foreground transition-transform", isExpanded && "rotate-90")} />
              </button>
              {isExpanded && (
                <div className="pb-2 animate-in fade-in duration-200">
                  {section.items.map(item => {
                    const ItemIcon = item.icon;
                    return (
                      <button key={item.category} onClick={() => onSelectNode(item)} className="w-full flex items-center gap-3 px-5 pl-8 py-2.5 hover:bg-primary/5 transition-colors group">
                        <div className={cn("w-7 h-7 rounded-md flex items-center justify-center shrink-0", item.iconBg)}><ItemIcon className={cn("w-3.5 h-3.5", item.iconColor)} /></div>
                        <div className="flex-1 text-left">
                          <p className="text-sm font-medium text-foreground group-hover:text-primary transition-colors">{item.label}</p>
                          <p className="text-xs text-muted-foreground">{item.description}</p>
                        </div>
                        <Plus className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

// ============================================================================
// NODE INSPECTOR
// ============================================================================

const NodeInspector = ({ node, onUpdate, onClose, onDelete, isJourney, execData, isExecMode }: {
  node: FlowNode; onUpdate: (updates: Partial<FlowNode>) => void; onClose: () => void; onDelete: () => void; isJourney?: boolean;
  execData?: NodeExecData; isExecMode?: boolean;
}) => {
  const Icon = node.icon;
  const colors = getNodeTypeColor(node.type);
  return (
    <div className="w-[340px] shrink-0 border-l border-border bg-card h-full overflow-y-auto animate-in slide-in-from-right-5 duration-200">
      <div className="sticky top-0 bg-card z-10 border-b border-border">
        <div className="flex items-center justify-between px-5 py-4">
          <div className="flex items-center gap-2.5">
            <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center", node.iconBg)}><Icon className={cn("w-4 h-4", node.iconColor)} /></div>
            <div>
              <p className="text-sm font-bold text-foreground">{node.label}</p>
              <Badge variant="outline" className={cn("text-[10px] mt-0.5", colors.badge)}>{node.type}</Badge>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground"><X className="w-4 h-4" /></button>
        </div>
      </div>
      <div className="p-5 space-y-5">
        <div className="space-y-1.5">
          <Label className="text-xs font-semibold text-foreground">Node Label</Label>
          <Input value={node.label} onChange={(e) => onUpdate({ label: e.target.value })} className="h-9 text-sm" />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs font-semibold text-foreground">Description</Label>
          <Input value={node.description} onChange={(e) => onUpdate({ description: e.target.value })} className="h-9 text-sm" placeholder="What does this step do?" />
        </div>
        {(node.category === "send_message" || node.category === "ai_respond") && (
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-foreground">Message Content</Label>
            <Textarea value={node.config.message || ""} onChange={(e) => onUpdate({ config: { ...node.config, message: e.target.value } })} className="min-h-[100px] text-sm" placeholder="Type the message content..." />
            {node.category === "ai_respond" && (
              <div className="flex items-center gap-2 pt-1 bg-muted/50 rounded-lg px-3 py-2">
                <Switch id="ai-personalize" defaultChecked />
                <Label htmlFor="ai-personalize" className="text-xs text-muted-foreground flex items-center gap-1.5 cursor-pointer"><Sparkles className="w-3 h-3 text-pink-500" /> AI Personalize responses</Label>
              </div>
            )}
          </div>
        )}
        {node.category === "wait" && (
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-foreground">Wait Duration</Label>
            <div className="flex items-center gap-2">
              <Input type="number" value={node.config.hours || 24} onChange={(e) => onUpdate({ config: { ...node.config, hours: parseInt(e.target.value) || 0 } })} className="h-9 text-sm w-24" min={1} />
              <select value={node.config.unit || "hours"} onChange={(e) => onUpdate({ config: { ...node.config, unit: e.target.value } })} className="h-9 px-3 rounded-md border border-input bg-background text-sm flex-1">
                <option value="minutes">Minutes</option><option value="hours">Hours</option><option value="days">Days</option>
              </select>
            </div>
          </div>
        )}
        {(node.category === "add_tag" || node.category === "remove_tag" || node.category === "tag_added") && (
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-foreground">Tag Name</Label>
            <Input value={node.config.tag || ""} onChange={(e) => onUpdate({ config: { ...node.config, tag: e.target.value } })} className="h-9 text-sm" placeholder="e.g. new-believer, vip" />
          </div>
        )}
        {node.category === "if_else" && (
          <div className="space-y-3">
            <Label className="text-xs font-semibold text-foreground">Condition</Label>
            <select value={node.config.condition || "has_replied"} onChange={(e) => onUpdate({ config: { ...node.config, condition: e.target.value } })} className="h-9 px-3 rounded-md border border-input bg-background text-sm w-full">
              <option value="has_replied">Contact has replied</option><option value="has_tag">Contact has tag</option>
              <option value="message_contains">Message contains keyword</option><option value="milestone_count">Milestone count is</option>
              <option value="days_since_last">Days since last message</option><option value="in_group">Contact is in group</option>
            </select>
            {isJourney && (
              <div className="bg-orange-50 dark:bg-orange-500/10 rounded-lg p-3 border border-orange-200 dark:border-orange-500/20">
                <div className="flex items-start gap-2">
                  <Split className="w-4 h-4 text-orange-500 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-xs font-semibold text-orange-700 dark:text-orange-400">Branching Node</p>
                    <p className="text-[11px] text-orange-600 dark:text-orange-400/80 mt-0.5">TRUE path goes up, FALSE path goes down. Add nodes after each branch.</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
        {node.category === "webhook_call" && (
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-foreground">URL</Label>
              <Input value={node.config.url || ""} onChange={(e) => onUpdate({ config: { ...node.config, url: e.target.value } })} className="h-9 text-sm" placeholder="https://api.example.com/webhook" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-foreground">Method</Label>
              <select value={node.config.method || "POST"} onChange={(e) => onUpdate({ config: { ...node.config, method: e.target.value } })} className="h-9 px-3 rounded-md border border-input bg-background text-sm w-full">
                <option>POST</option><option>GET</option><option>PUT</option><option>DELETE</option>
              </select>
            </div>
          </div>
        )}
        {node.category === "message_received" && (
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-foreground">Keyword Filter</Label>
            <Input value={node.config.keyword || ""} onChange={(e) => onUpdate({ config: { ...node.config, keyword: e.target.value } })} className="h-9 text-sm" placeholder="e.g. help, info, start" />
            <p className="text-[11px] text-muted-foreground">Leave empty to trigger on any message.</p>
          </div>
        )}
        {node.category === "schedule" && (
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-foreground">Frequency</Label>
            <select value={node.config.interval || "daily"} onChange={(e) => onUpdate({ config: { ...node.config, interval: e.target.value } })} className="h-9 px-3 rounded-md border border-input bg-background text-sm w-full">
              <option value="hourly">Every hour</option><option value="daily">Every day</option><option value="weekly">Every week</option><option value="monthly">Every month</option>
            </select>
          </div>
        )}
        {/* Execution details when in test mode */}
        {isExecMode && execData && execData.status !== "idle" && (
          <NodeExecDetail node={node} execData={execData} />
        )}

        <div className="pt-4 border-t border-border">
          <Button variant="outline" size="sm" className="w-full text-destructive hover:text-destructive hover:bg-destructive/5" onClick={onDelete}><Trash2 className="w-3.5 h-3.5" /> Remove Node</Button>
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// NODE CONFIG MODAL — shown BEFORE adding a node to the canvas
// ============================================================================

const getNodeConfigFields = (category: string): { key: string; label: string; type: "text" | "select" | "textarea" | "number"; placeholder?: string; options?: { value: string; label: string }[]; required?: boolean; hint?: string }[] => {
  switch (category) {
    case "message_received":
      return [
        { key: "keyword", label: "Keyword Filter", type: "text", placeholder: "e.g. help, info, start", hint: "Leave empty to trigger on any message" },
      ];
    case "contact_added":
      return [
        { key: "source", label: "Source Filter", type: "select", options: [{ value: "any", label: "Any source" }, { value: "whatsapp", label: "WhatsApp" }, { value: "telegram", label: "Telegram" }, { value: "web", label: "Web form" }, { value: "manual", label: "Manual entry" }] },
      ];
    case "tag_added":
      return [
        { key: "tag", label: "Tag Name", type: "text", placeholder: "e.g. new-believer, vip", required: true },
      ];
    case "webhook":
      return [
        { key: "url", label: "Webhook URL", type: "text", placeholder: "Auto-generated on save", hint: "A unique URL will be generated for this trigger" },
      ];
    case "schedule":
      return [
        { key: "interval", label: "Frequency", type: "select", options: [{ value: "hourly", label: "Every hour" }, { value: "daily", label: "Every day" }, { value: "weekly", label: "Every week" }, { value: "monthly", label: "Every month" }] },
        { key: "time", label: "Time", type: "text", placeholder: "e.g. 09:00" },
      ];
    case "milestone_reached":
      return [
        { key: "milestone", label: "Milestone", type: "select", options: [{ value: "any", label: "Any milestone" }, { value: "lesson_complete", label: "Lesson completed" }, { value: "module_complete", label: "Module completed" }, { value: "course_complete", label: "Course completed" }] },
      ];
    case "send_message":
      return [
        { key: "message", label: "Message Content", type: "textarea", placeholder: "Type your message...", required: true },
        { key: "channel", label: "Channel", type: "select", options: [{ value: "whatsapp", label: "WhatsApp" }, { value: "telegram", label: "Telegram" }, { value: "sms", label: "SMS" }] },
      ];
    case "send_email":
      return [
        { key: "subject", label: "Subject", type: "text", placeholder: "Email subject line", required: true },
        { key: "body", label: "Email Body", type: "textarea", placeholder: "Write your email content...", required: true },
      ];
    case "add_tag":
    case "remove_tag":
      return [
        { key: "tag", label: "Tag Name", type: "text", placeholder: "e.g. engaged, vip, dormant", required: true },
      ];
    case "add_to_group":
      return [
        { key: "group", label: "Group Name", type: "text", placeholder: "e.g. Prayer Warriors, New Believers", required: true },
      ];
    case "webhook_call":
      return [
        { key: "url", label: "Request URL", type: "text", placeholder: "https://api.example.com/endpoint", required: true },
        { key: "method", label: "Method", type: "select", options: [{ value: "POST", label: "POST" }, { value: "GET", label: "GET" }, { value: "PUT", label: "PUT" }, { value: "DELETE", label: "DELETE" }] },
      ];
    case "ai_respond":
      return [
        { key: "message", label: "AI Prompt / Instructions", type: "textarea", placeholder: "Describe how the AI should respond...", required: true },
        { key: "tone", label: "Tone", type: "select", options: [{ value: "friendly", label: "Friendly" }, { value: "formal", label: "Formal" }, { value: "pastoral", label: "Pastoral" }, { value: "encouraging", label: "Encouraging" }] },
      ];
    case "assign_mentor":
      return [
        { key: "criteria", label: "Matching Criteria", type: "select", options: [{ value: "auto", label: "Auto-match (availability)" }, { value: "language", label: "Match by language" }, { value: "location", label: "Match by location" }, { value: "gender", label: "Match by gender" }] },
      ];
    case "update_stage":
      return [
        { key: "stage", label: "New Stage", type: "select", options: [{ value: "new_seeker", label: "New Seeker" }, { value: "engaged", label: "Engaged" }, { value: "growing", label: "Growing" }, { value: "committed", label: "Committed" }, { value: "multiplying", label: "Multiplying" }], required: true },
      ];
    case "if_else":
      return [
        { key: "condition", label: "Condition", type: "select", options: [{ value: "has_replied", label: "Contact has replied" }, { value: "has_tag", label: "Contact has tag" }, { value: "message_contains", label: "Message contains keyword" }, { value: "milestone_count", label: "Milestone count is" }, { value: "days_since_last", label: "Days since last message" }, { value: "in_group", label: "Contact is in group" }], required: true },
        { key: "value", label: "Value", type: "text", placeholder: "e.g. tag name, keyword, or number" },
      ];
    case "filter":
      return [
        { key: "condition", label: "Filter Condition", type: "select", options: [{ value: "has_tag", label: "Has tag" }, { value: "in_group", label: "In group" }, { value: "message_contains", label: "Message contains" }, { value: "days_inactive", label: "Days inactive >" }], required: true },
        { key: "value", label: "Value", type: "text", placeholder: "Condition value" },
      ];
    case "wait":
      return [
        { key: "hours", label: "Duration", type: "number", placeholder: "24", required: true },
        { key: "unit", label: "Unit", type: "select", options: [{ value: "minutes", label: "Minutes" }, { value: "hours", label: "Hours" }, { value: "days", label: "Days" }] },
      ];
    case "loop":
      return [
        { key: "list", label: "Loop Over", type: "select", options: [{ value: "contacts", label: "Contact list" }, { value: "tags", label: "Tags" }, { value: "messages", label: "Messages" }] },
      ];
    default:
      return [];
  }
};

const NodeConfigModal = ({ node, onSave, onCancel, onDelete, isJourney }: {
  node: FlowNode;
  onSave: (updates: Partial<FlowNode>) => void;
  onCancel: () => void;
  onDelete: () => void;
  isJourney?: boolean;
}) => {
  const fields = getNodeConfigFields(node.category);
  const [config, setConfig] = useState<Record<string, any>>(() => {
    const defaults: Record<string, any> = {};
    fields.forEach(f => {
      defaults[f.key] = node.config[f.key] ?? (f.type === "select" && f.options?.length ? f.options[0].value : f.type === "number" ? 24 : "");
    });
    return defaults;
  });
  const [label, setLabel] = useState(node.label);
  const [description, setDescription] = useState(node.description);

  const Icon = node.icon;
  const colors = getNodeTypeColor(node.type);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none animate-in fade-in duration-200">
      <div className="bg-card border border-border rounded-2xl shadow-2xl w-full max-w-md mx-4 animate-in zoom-in-95 duration-300 pointer-events-auto">
        <div className="p-5 border-b border-border">
          <div className="flex items-center gap-3">
            <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center", node.iconBg)}>
              <Icon className={cn("w-5 h-5", node.iconColor)} />
            </div>
            <div className="flex-1">
              <h3 className="text-base font-bold text-foreground">{node.label}</h3>
              <div className="flex items-center gap-2 mt-0.5">
                <Badge variant="outline" className={cn("text-[10px]", colors.badge)}>{node.type}</Badge>
                <span className="text-xs text-muted-foreground">{node.description}</span>
              </div>
            </div>
            <button onClick={onCancel} className="p-1.5 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground"><X className="w-4 h-4" /></button>
          </div>
        </div>

        <div className="p-5 space-y-4 max-h-[420px] overflow-y-auto">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-foreground">Label</Label>
              <Input value={label} onChange={(e) => setLabel(e.target.value)} className="h-9 text-sm" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-foreground">Description</Label>
              <Input value={description} onChange={(e) => setDescription(e.target.value)} className="h-9 text-sm" placeholder="What does this step do?" />
            </div>
          </div>

          {fields.length > 0 && <div className="h-px bg-border" />}

          {fields.map(field => (
            <div key={field.key} className="space-y-1.5">
              <Label className="text-xs font-semibold text-foreground">
                {field.label}
                {field.required && <span className="text-destructive ml-0.5">*</span>}
              </Label>
              {field.type === "text" && (
                <Input value={config[field.key] || ""} onChange={(e) => setConfig(prev => ({ ...prev, [field.key]: e.target.value }))}
                  className="h-9 text-sm" placeholder={field.placeholder} />
              )}
              {field.type === "number" && (
                <Input type="number" value={config[field.key] || ""} onChange={(e) => setConfig(prev => ({ ...prev, [field.key]: parseInt(e.target.value) || 0 }))}
                  className="h-9 text-sm" placeholder={field.placeholder} min={1} />
              )}
              {field.type === "textarea" && (
                <Textarea value={config[field.key] || ""} onChange={(e) => setConfig(prev => ({ ...prev, [field.key]: e.target.value }))}
                  className="min-h-[80px] text-sm" placeholder={field.placeholder} />
              )}
              {field.type === "select" && field.options && (
                <select value={config[field.key] || field.options[0]?.value} onChange={(e) => setConfig(prev => ({ ...prev, [field.key]: e.target.value }))}
                  className="h-9 px-3 rounded-md border border-input bg-background text-sm w-full">
                  {field.options.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                </select>
              )}
              {field.hint && <p className="text-[11px] text-muted-foreground">{field.hint}</p>}
            </div>
          ))}

          {node.category === "if_else" && isJourney && (
            <div className="bg-orange-50 dark:bg-orange-500/10 rounded-lg p-3 border border-orange-200 dark:border-orange-500/20">
              <div className="flex items-start gap-2">
                <Split className="w-4 h-4 text-orange-500 mt-0.5 shrink-0" />
                <div>
                  <p className="text-xs font-semibold text-orange-700 dark:text-orange-400">Branching Node</p>
                  <p className="text-[11px] text-orange-600 dark:text-orange-400/80 mt-0.5">TRUE path goes up, FALSE path goes down.</p>
                </div>
              </div>
            </div>
          )}

        </div>

        <div className="p-5 border-t border-border flex items-center justify-between">
          <Button variant="outline" size="sm" className="text-destructive hover:text-destructive hover:bg-destructive/5" onClick={onDelete}>
            <Trash2 className="w-3.5 h-3.5" /> Remove
          </Button>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={onCancel}>Cancel</Button>
            <Button size="sm" onClick={() => onSave({ label, description, config: { ...node.config, ...config } })}>
              <Save className="w-3.5 h-3.5" /> Save
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// AUTOMATION CANVAS
// ============================================================================

// Convert our FlowNode[] to React Flow nodes
const toRFNodes = (nodes: FlowNode[], callbacks: { onDelete: (id: string) => void; onAddAfter: (id: string) => void; onDoubleClick: (id: string) => void }, execStates?: Record<string, NodeExecData>, isExecMode?: boolean): RFNode[] => {
  return nodes.map(node => {
    const pos = gridToPixel(node.position.x, node.position.y);
    return {
      id: node.id,
      type: "automationNode",
      position: { x: pos.px, y: pos.py },
      data: {
        flowNode: node,
        onDelete: () => callbacks.onDelete(node.id),
        onAddAfter: () => callbacks.onAddAfter(node.id),
        onDoubleClick: () => callbacks.onDoubleClick(node.id),
        execData: execStates?.[node.id],
        isExecMode: isExecMode,
      },
    };
  });
};

// Convert our FlowConnection[] to React Flow edges
const toRFEdges = (connections: FlowConnection[], execStates?: Record<string, NodeExecData>, isExecMode?: boolean): RFEdge[] => {
  return connections.map(conn => {
    const targetExec = execStates?.[conn.to];
    const sourceExec = execStates?.[conn.from];
    const isActiveEdge = isExecMode && sourceExec?.status === "success" && (targetExec?.status === "success" || targetExec?.status === "running");
    const isErrorEdge = isExecMode && targetExec?.status === "error";
    const edgeColor = isErrorEdge ? "#ef4444" : isActiveEdge ? "#22c55e" : conn.type === "true" ? "#22c55e" : conn.type === "false" ? "#ef4444" : "#94a3b8";
    return {
      id: conn.id,
      source: conn.from,
      target: conn.to,
      sourceHandle: conn.type === "true" ? "true" : conn.type === "false" ? "false" : undefined,
      type: "smoothstep",
      animated: isExecMode ? (isActiveEdge || targetExec?.status === "running") : conn.type === "false",
      style: { stroke: edgeColor, strokeWidth: isActiveEdge ? 3 : 2 },
      label: conn.label,
      labelStyle: { fill: edgeColor, fontWeight: 600, fontSize: 11 },
      labelBgStyle: { fill: "hsl(var(--card))", fillOpacity: 0.9 },
      labelBgPadding: [6, 3] as [number, number],
      markerEnd: { type: MarkerType.ArrowClosed, color: edgeColor, width: 16, height: 16 },
    };
  });
};

// Convert React Flow pixel position back to grid position
const pixelToGrid = (px: number, py: number): { x: number; y: number } => ({
  x: (px - CANVAS_PADDING) / (NODE_WIDTH + HORIZONTAL_GAP),
  y: (py - CANVAS_PADDING) / (NODE_HEIGHT + VERTICAL_GAP),
});

// ============================================================================
// EXECUTION LOG DRAWER
// ============================================================================

const LogDrawer = ({ logs, isOpen, onToggle, onClear, onClickLog }: {
  logs: ExecutionLog[]; isOpen: boolean; onToggle: () => void; onClear: () => void; onClickLog: (nodeId: string) => void;
}) => {
  const [filter, setFilter] = useState<"all" | "error" | "success" | "warning">("all");
  const [search, setSearch] = useState("");
  const filtered = logs.filter(l => {
    if (filter !== "all" && l.status !== filter) return false;
    if (search && !l.message.toLowerCase().includes(search.toLowerCase()) && !l.nodeLabel.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });
  const errorCount = logs.filter(l => l.status === "error").length;

  if (!isOpen) {
    return (
      <button onClick={onToggle}
        className="w-full shrink-0 h-9 bg-card border-t border-border flex items-center justify-center gap-2 text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
        <Terminal className="w-3.5 h-3.5" />
        Execution Logs ({logs.length})
        {errorCount > 0 && <span className="px-1.5 py-0.5 rounded-full bg-red-100 text-red-600 text-[10px] font-bold">{errorCount} error{errorCount > 1 ? "s" : ""}</span>}
        <ChevronUp className="w-3.5 h-3.5" />
      </button>
    );
  }

  return (
    <div className="shrink-0 h-[260px] bg-card border-t border-border flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-border shrink-0">
        <div className="flex items-center gap-3">
          <Terminal className="w-4 h-4 text-muted-foreground" />
          <span className="text-sm font-bold text-foreground">Execution Logs</span>
          <Badge variant="secondary" className="text-[10px]">{filtered.length}</Badge>
          {errorCount > 0 && <Badge variant="destructive" className="text-[10px]">{errorCount} error{errorCount > 1 ? "s" : ""}</Badge>}
        </div>
        <div className="flex items-center gap-2">
          {/* Filter tabs */}
          {(["all", "success", "error", "warning"] as const).map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className={cn("px-2.5 py-1 rounded-md text-[10px] font-medium transition-colors",
                filter === f ? "bg-foreground/10 text-foreground" : "text-muted-foreground hover:text-foreground")}>
              {f === "all" ? "All" : f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
          <div className="w-px h-4 bg-border" />
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search logs..." className="h-7 text-xs w-[160px]" />
          <button onClick={onClear} className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground" title="Clear logs"><Trash2 className="w-3.5 h-3.5" /></button>
          <button onClick={onToggle} className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground"><ChevronDown className="w-3.5 h-3.5" /></button>
        </div>
      </div>
      {/* Log entries */}
      <div className="flex-1 overflow-y-auto font-mono text-xs">
        {filtered.length === 0 ? (
          <div className="flex items-center justify-center h-full text-muted-foreground">No logs to show</div>
        ) : (
          filtered.map(log => (
            <button key={log.id} onClick={() => onClickLog(log.nodeId)}
              className="w-full flex items-center gap-3 px-4 py-1.5 hover:bg-muted/50 transition-colors text-left border-b border-border/30">
              <span className="text-[10px] text-muted-foreground w-[70px] shrink-0">{new Date(log.timestamp).toLocaleTimeString()}</span>
              <span className={cn("w-1.5 h-1.5 rounded-full shrink-0",
                log.status === "success" ? "bg-emerald-500" : log.status === "error" ? "bg-red-500" : log.status === "warning" ? "bg-amber-500" : "bg-blue-500"
              )} />
              <span className="text-foreground font-semibold w-[130px] shrink-0 truncate">{log.nodeLabel}</span>
              <span className={cn("flex-1 truncate",
                log.status === "error" ? "text-red-500" : log.status === "warning" ? "text-amber-600" : "text-muted-foreground"
              )}>{log.message}</span>
            </button>
          ))
        )}
      </div>
    </div>
  );
};

// ============================================================================
// NODE EXECUTION DETAIL — shown in inspector during exec mode
// ============================================================================

const NodeExecDetail = ({ node, execData }: { node: FlowNode; execData?: NodeExecData }) => {
  if (!execData || execData.status === "idle") return null;

  return (
    <div className="border-t border-border">
      <div className="p-5 space-y-4">
        <div className="flex items-center gap-2">
          <BarChart3 className="w-4 h-4 text-muted-foreground" />
          <p className="text-sm font-bold text-foreground">Execution Details</p>
        </div>

        {/* Status + Duration */}
        <div className="flex items-center gap-3">
          <div className={cn("flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold",
            execData.status === "success" ? "bg-emerald-50 text-emerald-700" :
            execData.status === "error" ? "bg-red-50 text-red-700" :
            execData.status === "running" ? "bg-blue-50 text-blue-700" :
            execData.status === "skipped" ? "bg-gray-50 text-gray-600" :
            "bg-amber-50 text-amber-700"
          )}>
            <ExecStatusIcon status={execData.status} />
            {execData.status.charAt(0).toUpperCase() + execData.status.slice(1)}
          </div>
          {execData.durationMs != null && (
            <span className="text-xs text-muted-foreground flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {execData.durationMs < 1000 ? `${execData.durationMs}ms` : `${(execData.durationMs / 1000).toFixed(1)}s`}
            </span>
          )}
        </div>

        {/* Error message */}
        {execData.error && (
          <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-xs text-red-700">
            <div className="flex items-start gap-2">
              <XCircle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
              <div>
                <p className="font-semibold">Error</p>
                <p className="mt-0.5 font-mono text-[11px]">{execData.error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Input / Output data — primary focus for debugging */}
        {execData.inputData && (
          <div>
            <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">Input Data</p>
            <pre className="text-[11px] bg-muted/50 rounded-lg p-3 border border-border overflow-x-auto max-h-[140px] overflow-y-auto font-mono text-foreground">
              {JSON.stringify(execData.inputData, null, 2)}
            </pre>
          </div>
        )}
        {execData.outputData && (
          <div>
            <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">Output Data</p>
            <pre className="text-[11px] bg-muted/50 rounded-lg p-3 border border-border overflow-x-auto max-h-[140px] overflow-y-auto font-mono text-foreground">
              {JSON.stringify(execData.outputData, null, 2)}
            </pre>
          </div>
        )}

        {/* Stats — compact summary row */}
        {execData.stats && (
          <div>
            <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">Throughput</p>
            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              <span className="flex items-center gap-1"><Users className="w-3 h-3 text-blue-500" /> {execData.stats.reached}</span>
              <span className="flex items-center gap-1"><Send className="w-3 h-3 text-emerald-500" /> {execData.stats.sent}</span>
              <span className="flex items-center gap-1"><Eye className="w-3 h-3 text-violet-500" /> {execData.stats.delivered > 0 ? Math.round((execData.stats.seen / execData.stats.delivered) * 100) : 0}%</span>
              <span className="flex items-center gap-1"><TrendingDown className="w-3 h-3 text-rose-500" /> {execData.stats.droppedOff}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// ============================================================================
// CANVAS — main Journey builder
// ============================================================================

export const AutomationCanvas = ({ automation, onBack, onSave, onUpdate }: {
  automation: AutomationDraft; onBack: () => void; onSave: (a: AutomationDraft) => void; onUpdate: (a: AutomationDraft) => void;
}) => {
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [isNodePickerOpen, setIsNodePickerOpen] = useState(false);
  const [insertAfterNodeId, setInsertAfterNodeId] = useState<string | null>(null);
  const [autoName, setAutoName] = useState(automation.name);
  const [isEditingName, setIsEditingName] = useState(false);
  const [configNodeId, setConfigNodeId] = useState<string | null>(null);

  // Execution / Debug state
  const [testRun, setTestRun] = useState<TestRun | null>(null);
  const [isExecMode, setIsExecMode] = useState(false);
  const [isLogDrawerOpen, setIsLogDrawerOpen] = useState(false);
  const execTimerRef = useRef<number | null>(null);
  const runCountRef = useRef(0); // first run = errors, re-runs = clean

  const selectedNode = automation.nodes.find(n => n.id === selectedNodeId) || null;
  const modeInfo = getModeInfo(automation.mode);

  // === Test Runner — simulates data flowing through nodes ===
  const runTest = useCallback(() => {
    if (automation.nodes.length === 0) { toast.error("Add nodes before testing"); return; }
    runCountRef.current += 1;
    const currentRunCount = runCountRef.current;
    const run = createMockTestRun(automation.nodes, automation.connections);
    run.status = "running";
    setTestRun(run);
    setIsExecMode(true);
    setIsLogDrawerOpen(true);
    toast.success(currentRunCount === 1
      ? `Test started for "${run.seekerName}"`
      : `Re-running test for "${run.seekerName}" (attempt ${currentRunCount})`);

    // Build execution order from connections (BFS from triggers)
    const triggers = automation.nodes.filter(n => n.type === "trigger");
    const ordered: FlowNode[] = [];
    const visited = new Set<string>();
    const queue = triggers.length > 0 ? [...triggers] : [automation.nodes[0]];
    while (queue.length > 0) {
      const node = queue.shift()!;
      if (visited.has(node.id)) continue;
      visited.add(node.id);
      ordered.push(node);
      const outgoing = automation.connections.filter(c => c.from === node.id);
      for (const conn of outgoing) {
        const target = automation.nodes.find(n => n.id === conn.to);
        if (target && !visited.has(target.id)) queue.push(target);
      }
    }
    // Add any unvisited nodes
    automation.nodes.forEach(n => { if (!visited.has(n.id)) ordered.push(n); });

    // Simulate sequential execution with delays
    let stepIdx = 0;
    const runStep = () => {
      if (stepIdx >= ordered.length) {
        setTestRun(prev => {
          if (!prev) return prev;
          return { ...prev, status: "completed", completedAt: new Date().toISOString() };
        });
        toast.success("Test run completed!");
        return;
      }
      const node = ordered[stepIdx];
      // Set node to running
      setTestRun(prev => {
        if (!prev) return prev;
        const newStates = { ...prev.nodeStates };
        newStates[node.id] = { ...newStates[node.id], status: "running", startedAt: new Date().toISOString() };
        const newLogs = [...prev.logs, {
          id: `log-${Date.now()}-${stepIdx}`,
          timestamp: new Date().toISOString(),
          nodeId: node.id,
          nodeLabel: node.label,
          status: "info" as const,
          message: `Processing "${node.label}"...`,
        }];
        return { ...prev, nodeStates: newStates, logs: newLogs, currentNodeId: node.id };
      });

      // After a random delay, complete the node
      const delay = 600 + Math.random() * 1200;
      execTimerRef.current = window.setTimeout(() => {
        // First run: guaranteed error on 3rd node (index 2). Re-runs: all succeed.
        const isFirstRun = currentRunCount === 1;
        const isError = isFirstRun && stepIdx >= 2;
        const duration = Math.floor(delay + Math.random() * 300);
        const stats = generateMockNodeStats(stepIdx);

        const mockInput = node.type === "trigger"
          ? { seeker: run.seekerName, channel: "telegram", timestamp: new Date().toISOString() }
          : { seeker: run.seekerName, fromNode: stepIdx > 0 ? ordered[stepIdx - 1].label : "start" };

        const mockOutput = isError ? undefined : (
          node.type === "action" ? { messageId: `msg-${Date.now()}`, status: "sent", channel: "telegram" } :
          node.type === "condition" ? { result: Math.random() > 0.4, condition: node.config.condition || "has_replied" } :
          { status: "ok" }
        );

        setTestRun(prev => {
          if (!prev) return prev;
          const newStates = { ...prev.nodeStates };
          newStates[node.id] = {
            status: isError ? "error" : "success",
            startedAt: newStates[node.id]?.startedAt,
            completedAt: new Date().toISOString(),
            durationMs: duration,
            stats,
            inputData: mockInput,
            outputData: mockOutput,
            error: isError ? `${["Timeout: upstream API took too long", "Invalid response from webhook", "Rate limit exceeded (429)", "Connection refused to messaging service", "Seeker phone number not found"][Math.floor(Math.random() * 5)]}` : undefined,
          };
          const newLogs = [...prev.logs, {
            id: `log-${Date.now()}-${stepIdx}-done`,
            timestamp: new Date().toISOString(),
            nodeId: node.id,
            nodeLabel: node.label,
            status: isError ? "error" as const : "success" as const,
            message: isError
              ? `Failed: ${newStates[node.id].error}`
              : `Completed in ${duration}ms — ${stats.reached} reached, ${stats.sent} sent`,
          }];
          return { ...prev, nodeStates: newStates, logs: newLogs };
        });

        if (isError) {
          // Stop run on error
          setTestRun(prev => prev ? { ...prev, status: "failed", completedAt: new Date().toISOString() } : prev);
          toast.error(`Test failed at "${node.label}"`);
          return;
        }
        stepIdx++;
        runStep();
      }, delay);
    };

    runStep();
  }, [automation]);

  const stopTest = useCallback(() => {
    if (execTimerRef.current) { clearTimeout(execTimerRef.current); execTimerRef.current = null; }
    setTestRun(prev => prev ? { ...prev, status: "failed", completedAt: new Date().toISOString() } : prev);
    toast("Test stopped");
  }, []);

  const resetTest = useCallback(() => {
    if (execTimerRef.current) { clearTimeout(execTimerRef.current); execTimerRef.current = null; }
    setTestRun(null);
    setIsExecMode(false);
    setIsLogDrawerOpen(false);
    runCountRef.current = 0;
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => { if (execTimerRef.current) clearTimeout(execTimerRef.current); };
  }, []);

  const addNode = useCallback((item: NodeCatalogItem, preConfig?: Record<string, any>, customLabel?: string) => {
    const isJourney = automation.mode === "journey";
    let posX = 0, posY = isJourney ? 1 : 0;

    if (insertAfterNodeId) {
      const afterNode = automation.nodes.find(n => n.id === insertAfterNodeId);
      if (afterNode) {
        posX = afterNode.position.x + 1;
        posY = afterNode.position.y;
        const updatedNodes = automation.nodes.map(n => {
          if (n.position.x >= posX && Math.abs(n.position.y - posY) < 0.5) return { ...n, position: { ...n.position, x: n.position.x + 1 } };
          return n;
        });
        const newId = `n-${Date.now()}`;
        const newNode: FlowNode = { id: newId, type: item.type, category: item.category, label: customLabel || item.label, description: item.description, icon: item.icon, iconColor: item.iconColor, iconBg: item.iconBg, config: preConfig || (item.category === "if_else" ? { condition: "has_replied" } : {}), position: { x: posX, y: posY } };
        const existingConn = automation.connections.find(c => c.from === insertAfterNodeId);
        let finalConnections = automation.connections.filter(c => c.from !== insertAfterNodeId);
        finalConnections.push({ id: `c-${Date.now()}-a`, from: insertAfterNodeId, to: newId });

        // IF/ELSE branching when inserting after a node
        if (item.category === "if_else") {
          const trueId = `n-${Date.now()}-true`;
          const falseId = `n-${Date.now()}-false`;
          const trueCatalog = NODE_CATALOG[1].items[0];
          const trueNode: FlowNode = { id: trueId, type: "action", category: trueCatalog.category, label: "True Path", description: "Add action for TRUE branch", icon: trueCatalog.icon, iconColor: trueCatalog.iconColor, iconBg: trueCatalog.iconBg, config: {}, position: { x: posX + 1, y: posY - 1 } };
          const falseNode: FlowNode = { id: falseId, type: "action", category: trueCatalog.category, label: "False Path", description: "Add action for FALSE branch", icon: trueCatalog.icon, iconColor: trueCatalog.iconColor, iconBg: trueCatalog.iconBg, config: {}, position: { x: posX + 1, y: posY + 1 } };
          finalConnections.push({ id: `c-${Date.now()}-t`, from: newId, to: trueId, label: "Yes", type: "true" });
          finalConnections.push({ id: `c-${Date.now()}-f`, from: newId, to: falseId, label: "No", type: "false" });
          if (existingConn) finalConnections.push({ id: `c-${Date.now()}-b`, from: trueId, to: existingConn.to });
          onUpdate({ ...automation, nodes: [...updatedNodes, newNode, trueNode, falseNode], connections: finalConnections });
          setIsNodePickerOpen(false); setInsertAfterNodeId(null); setSelectedNodeId(newId);
          toast.success(`Added "${item.label}" with TRUE/FALSE branches`);
          return;
        }

        if (existingConn) finalConnections.push({ id: `c-${Date.now()}-b`, from: newId, to: existingConn.to });
        onUpdate({ ...automation, nodes: [...updatedNodes, newNode], connections: finalConnections });
        setIsNodePickerOpen(false); setInsertAfterNodeId(null); setSelectedNodeId(newId);
        toast.success(`Added "${item.label}"`);
        return;
      }
    }

    if (automation.nodes.length > 0) {
      const maxX = Math.max(...automation.nodes.map(n => n.position.x));
      posX = maxX + 1;
      posY = automation.nodes[0]?.position.y ?? (isJourney ? 1 : 0);
    }
    const newId = `n-${Date.now()}`;
    const newNode: FlowNode = { id: newId, type: item.type, category: item.category, label: customLabel || item.label, description: item.description, icon: item.icon, iconColor: item.iconColor, iconBg: item.iconBg, config: preConfig || (item.category === "if_else" ? { condition: "has_replied" } : {}), position: { x: posX, y: posY } };
    const nodesAtMaxX = automation.nodes.filter(n => n.position.x === Math.max(...automation.nodes.map(n2 => n2.position.x)));
    const lastNode = nodesAtMaxX.length > 0 ? nodesAtMaxX[0] : null;
    const newConns = [...automation.connections];
    if (lastNode) newConns.push({ id: `c-${Date.now()}`, from: lastNode.id, to: newId });

    // IF/ELSE branching: auto-create true/false placeholder nodes
    if (item.category === "if_else") {
      const trueId = `n-${Date.now()}-true`;
      const falseId = `n-${Date.now()}-false`;
      const trueCatalog = NODE_CATALOG[1].items[0]; // Send Message as placeholder
      const trueNode: FlowNode = { id: trueId, type: "action", category: trueCatalog.category, label: "True Path", description: "Add action for TRUE branch", icon: trueCatalog.icon, iconColor: trueCatalog.iconColor, iconBg: trueCatalog.iconBg, config: {}, position: { x: posX + 1, y: posY - 1 } };
      const falseNode: FlowNode = { id: falseId, type: "action", category: trueCatalog.category, label: "False Path", description: "Add action for FALSE branch", icon: trueCatalog.icon, iconColor: trueCatalog.iconColor, iconBg: trueCatalog.iconBg, config: {}, position: { x: posX + 1, y: posY + 1 } };
      newConns.push({ id: `c-${Date.now()}-t`, from: newId, to: trueId, label: "Yes", type: "true" });
      newConns.push({ id: `c-${Date.now()}-f`, from: newId, to: falseId, label: "No", type: "false" });
      onUpdate({ ...automation, nodes: [...automation.nodes, newNode, trueNode, falseNode], connections: newConns });
      setIsNodePickerOpen(false); setInsertAfterNodeId(null); setSelectedNodeId(newId);
      toast.success(`Added "${item.label}" with TRUE/FALSE branches`);
      return;
    }

    onUpdate({ ...automation, nodes: [...automation.nodes, newNode], connections: newConns });
    setIsNodePickerOpen(false); setInsertAfterNodeId(null); setSelectedNodeId(newId);
    toast.success(`Added "${item.label}"`);
  }, [automation, insertAfterNodeId, onUpdate]);

  const deleteNode = (nodeId: string) => {
    const newNodes = automation.nodes.filter(n => n.id !== nodeId);
    const newConns = automation.connections.filter(c => c.from !== nodeId && c.to !== nodeId);
    const incoming = automation.connections.filter(c => c.to === nodeId);
    const outgoing = automation.connections.filter(c => c.from === nodeId);
    if (incoming.length === 1 && outgoing.length === 1) {
      newConns.push({ id: `c-${Date.now()}`, from: incoming[0].from, to: outgoing[0].to, label: incoming[0].label, type: incoming[0].type });
    }
    onUpdate({ ...automation, nodes: newNodes, connections: newConns });
    if (selectedNodeId === nodeId) setSelectedNodeId(null);
    toast.success("Node removed");
  };

  const updateNode = (nodeId: string, updates: Partial<FlowNode>) => {
    onUpdate({ ...automation, nodes: automation.nodes.map(n => n.id === nodeId ? { ...n, ...updates } : n) });
  };

  const handleOpenPicker = (afterNodeId?: string) => {
    setInsertAfterNodeId(afterNodeId || null); setIsNodePickerOpen(true); setSelectedNodeId(null);
  };

  // React Flow nodes/edges derived from our data model
  const rfNodes = useMemo(() => toRFNodes(automation.nodes, {
    onDelete: (id) => deleteNode(id),
    onAddAfter: (id) => handleOpenPicker(id),
    onDoubleClick: (id) => setConfigNodeId(id),
  }, testRun?.nodeStates, isExecMode), [automation.nodes, deleteNode, handleOpenPicker, testRun?.nodeStates, isExecMode]);

  const rfEdges = useMemo(() => toRFEdges(automation.connections, testRun?.nodeStates, isExecMode), [automation.connections, testRun?.nodeStates, isExecMode]);

  // Sync React Flow node drag positions back to our data model
  const onNodesChange = useCallback((changes: any[]) => {
    const posChanges = changes.filter((c: any) => c.type === "position" && c.position);
    if (posChanges.length > 0) {
      const updatedNodes = automation.nodes.map(n => {
        const change = posChanges.find((c: any) => c.id === n.id);
        if (change) {
          const grid = pixelToGrid(change.position.x, change.position.y);
          return { ...n, position: { x: grid.x, y: grid.y } };
        }
        return n;
      });
      onUpdate({ ...automation, nodes: updatedNodes });
    }
  }, [automation, onUpdate]);

  const onNodeClick = useCallback((_: any, node: RFNode) => {
    setSelectedNodeId(node.id);
    setIsNodePickerOpen(false);
  }, []);

  const onNodeDoubleClick = useCallback((_: any, node: RFNode) => {
    setConfigNodeId(node.id);
  }, []);

  const onPaneClick = useCallback(() => {
    setSelectedNodeId(null);
    setIsNodePickerOpen(false);
  }, []);

  return (
    <div className="h-[calc(100vh-64px)] flex flex-col bg-background">
      {/* Toolbar */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-border bg-card shrink-0">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="p-2 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"><ArrowLeft className="w-4 h-4" /></button>
          <div className="w-px h-6 bg-border" />
          {isEditingName ? (
            <Input value={autoName} onChange={(e) => setAutoName(e.target.value)}
              onBlur={() => { setIsEditingName(false); onUpdate({ ...automation, name: autoName }); }}
              onKeyDown={(e) => { if (e.key === "Enter") { setIsEditingName(false); onUpdate({ ...automation, name: autoName }); } }}
              className="h-8 text-sm font-semibold w-[260px]" autoFocus />
          ) : (
            <button onClick={() => setIsEditingName(true)} className="flex items-center gap-2 group">
              <h2 className="text-sm font-bold text-foreground group-hover:text-primary transition-colors">{automation.name}</h2>
              <Edit2 className="w-3 h-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
            </button>
          )}
          <Badge variant="outline" className={cn("text-[10px]", modeInfo.bg, modeInfo.color, modeInfo.border)}>
            <modeInfo.icon className="w-3 h-3 mr-1" /> {modeInfo.label}
          </Badge>
          <Badge variant="secondary" className="text-[10px]">{automation.nodes.length} node{automation.nodes.length !== 1 ? "s" : ""}</Badge>
        </div>
        <div className="flex items-center gap-2">
          {/* Test controls */}
          {isExecMode ? (
            <>
              <Badge variant="outline" className={cn("text-[10px] font-semibold",
                testRun?.status === "running" ? "bg-blue-50 text-blue-700 border-blue-200" :
                testRun?.status === "completed" ? "bg-emerald-50 text-emerald-700 border-emerald-200" :
                testRun?.status === "failed" ? "bg-red-50 text-red-700 border-red-200" :
                "bg-muted text-muted-foreground"
              )}>
                {testRun?.status === "running" && <Loader2 className="w-3 h-3 animate-spin mr-1" />}
                {testRun?.status === "running" ? "Running..." : testRun?.status === "completed" ? "Completed" : testRun?.status === "failed" ? "Failed" : "Idle"}
                {testRun?.seekerName && ` · ${testRun.seekerName}`}
              </Badge>
              {testRun?.status === "running" && (
                <Button variant="outline" size="sm" onClick={stopTest} className="text-red-600 border-red-200 hover:bg-red-50">
                  <StopCircle className="w-3.5 h-3.5" /> Stop
                </Button>
              )}
              {testRun?.status !== "running" && (
                <Button variant="outline" size="sm" onClick={runTest}>
                  <RotateCcw className="w-3.5 h-3.5" /> Re-run
                </Button>
              )}
              <Button variant="ghost" size="sm" onClick={resetTest}>
                <X className="w-3.5 h-3.5" /> Exit Test
              </Button>
            </>
          ) : (
            <Button variant="outline" size="sm" onClick={runTest} className="border-blue-200 text-blue-700 hover:bg-blue-50">
              <Bug className="w-3.5 h-3.5" /> Test Run
            </Button>
          )}
          <div className="w-px h-6 bg-border" />
          <Badge variant={automation.enabled ? "default" : "secondary"} className={cn("text-xs", automation.enabled && "bg-emerald-100 text-emerald-700 border-emerald-200")}>
            {automation.enabled ? "Active" : "Draft"}
          </Badge>
          <Button variant="outline" size="sm" onClick={() => { onSave(automation); toast.success("Saved!"); }}><Save className="w-3.5 h-3.5" /> Save</Button>
          <Button size="sm" onClick={() => { onSave({ ...automation, enabled: true }); toast.success("Published!"); onBack(); }}><Play className="w-3.5 h-3.5" /> Publish</Button>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Canvas column: canvas + log drawer stacked vertically */}
        <div className="flex-1 flex flex-col min-w-0">
          <div className="flex-1 relative">
            <ReactFlowProvider>
              <ReactFlow
                nodes={rfNodes}
                edges={rfEdges}
                onNodesChange={onNodesChange}
                onNodeClick={onNodeClick}
                onNodeDoubleClick={onNodeDoubleClick}
                onPaneClick={onPaneClick}
                nodeTypes={rfNodeTypes}
                fitView
                fitViewOptions={{ padding: 0.3 }}
                minZoom={0.2}
                maxZoom={2}
                defaultEdgeOptions={{ type: "smoothstep", animated: false }}
                proOptions={{ hideAttribution: true }}
                className="bg-background"
              >
                <Background variant={BackgroundVariant.Dots} gap={24} size={1} color="hsl(var(--muted-foreground) / 0.15)" />
                <Controls showInteractive={false} className="!bg-card !border-border !shadow-sm !rounded-lg [&>button]:!bg-card [&>button]:!border-border [&>button]:!text-muted-foreground [&>button:hover]:!bg-muted" />
                <MiniMap
                  nodeColor={(n) => {
                    const flowNode = n.data?.flowNode as FlowNode | undefined;
                    if (!flowNode) return "#94a3b8";
                    switch (flowNode.type) {
                      case "trigger": return "#3b82f6";
                      case "action": return "#8b5cf6";
                      case "condition": return "#f59e0b";
                      case "delay": return "#06b6d4";
                      case "loop": return "#10b981";
                      case "end": return "#6b7280";
                      default: return "#94a3b8";
                    }
                  }}
                  maskColor="hsl(var(--background) / 0.7)"
                  className="!bg-card !border-border !shadow-sm !rounded-lg"
                />
                {/* Journey empty state overlay */}
                {automation.mode === "journey" && automation.nodes.length === 0 && (
                  <Panel position="top-center">
                    <div className="bg-card border border-border rounded-xl px-6 py-3 shadow-sm flex items-center gap-3">
                      <Route className="w-5 h-5 text-purple-500" />
                      <div>
                        <p className="text-sm font-semibold text-foreground">Journey Builder</p>
                        <p className="text-xs text-muted-foreground">Add a trigger to start, then build branching discipleship paths with conditions</p>
                      </div>
                    </div>
                  </Panel>
                )}
                {/* Empty canvas placeholder */}
                {automation.nodes.length === 0 && (
                  <Panel position="top-center" className="!top-1/2 !-translate-y-1/2">
                    <button onClick={() => handleOpenPicker()} className="w-[180px] h-[180px] border-2 border-dashed border-border rounded-2xl flex flex-col items-center justify-center gap-3 hover:border-primary/50 hover:bg-primary/5 transition-all group bg-card/50">
                      <Plus className="w-8 h-8 text-muted-foreground group-hover:text-primary transition-colors" />
                      <span className="text-sm font-medium text-muted-foreground group-hover:text-foreground">Add first step</span>
                    </button>
                  </Panel>
                )}
              </ReactFlow>
            </ReactFlowProvider>
            {/* FAB for adding nodes */}
            {automation.nodes.length > 0 && !isNodePickerOpen && !selectedNode && (
              <div className="absolute bottom-6 right-6 z-10">
                <button onClick={() => handleOpenPicker()} className="w-12 h-12 rounded-full bg-primary text-primary-foreground shadow-lg hover:shadow-xl hover:scale-105 transition-all flex items-center justify-center">
                  <Plus className="w-5 h-5" />
                </button>
              </div>
            )}
          </div>
          {/* Execution Log Drawer — sits below canvas, spans canvas width only */}
          {isExecMode && (
            <LogDrawer
              logs={testRun?.logs || []}
              isOpen={isLogDrawerOpen}
              onToggle={() => setIsLogDrawerOpen(prev => !prev)}
              onClear={() => setTestRun(prev => prev ? { ...prev, logs: [] } : prev)}
              onClickLog={(nodeId) => { setSelectedNodeId(nodeId); }}
            />
          )}
        </div>
        {/* Right sidebars */}
        {isNodePickerOpen && (
          <NodePickerPanel isOpen={isNodePickerOpen} onClose={() => { setIsNodePickerOpen(false); setInsertAfterNodeId(null); }}
            onSelectNode={addNode} title={insertAfterNodeId ? "Add next step" : "What happens first?"} mode={automation.mode} />
        )}
        {selectedNode && !isNodePickerOpen && (
          <NodeInspector node={selectedNode} onUpdate={(updates) => updateNode(selectedNode.id, updates)}
            onClose={() => setSelectedNodeId(null)} onDelete={() => deleteNode(selectedNode.id)} isJourney={automation.mode === "journey"}
            execData={isExecMode ? testRun?.nodeStates[selectedNode.id] : undefined} isExecMode={isExecMode} />
        )}
        {configNodeId && (() => {
          const configNode = automation.nodes.find(n => n.id === configNodeId);
          if (!configNode) return null;
          return (
            <NodeConfigModal
              node={configNode}
              onSave={(updates) => { updateNode(configNodeId, updates); setConfigNodeId(null); }}
              onCancel={() => setConfigNodeId(null)}
              onDelete={() => { deleteNode(configNodeId); setConfigNodeId(null); }}
              isJourney={automation.mode === "journey"}
            />
          );
        })()}
      </div>
    </div>
  );
};

// ============================================================================
// NEW AUTOMATION MODAL
// ============================================================================

const NewAutomationModal = ({ isOpen, onClose, onCreate, folders }: {
  isOpen: boolean; onClose: () => void;
  onCreate: (mode: AutomationMode, name: string, folderId: string | null) => void;
  folders: AutomationFolder[];
}) => {
  const [selectedMode, setSelectedMode] = useState<AutomationMode>("basic");
  const [name, setName] = useState("");
  const [folderId, setFolderId] = useState<string | null>(null);

  if (!isOpen) return null;

  const modes: { mode: AutomationMode; icon: any; title: string; desc: string; example: string; color: string; bg: string }[] = [
    { mode: "basic", icon: Zap, title: "Basic", desc: "Simple trigger → action chains. Great for auto-replies, tagging, and seeker notifications.", example: "e.g. Welcome new seekers, keyword auto-reply", color: "text-blue-600", bg: "bg-blue-500/10 border-blue-200" },
    { mode: "sequence", icon: ListOrdered, title: "Sequence", desc: "Multi-step drip campaigns with timed delays between messages.", example: "e.g. Foundations of Faith 7-day devotional", color: "text-teal-600", bg: "bg-teal-500/10 border-teal-200" },
    { mode: "journey", icon: Route, title: "Journey", desc: "Branching discipleship paths based on seeker responses and engagement.", example: "e.g. Seeker follow-up with mentor assignment", color: "text-purple-600", bg: "bg-purple-500/10 border-purple-200" },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-200" onClick={onClose}>
      <div className="bg-card border border-border rounded-2xl shadow-2xl w-full max-w-lg mx-4 animate-in zoom-in-95 duration-300" onClick={e => e.stopPropagation()}>
        <div className="p-6 border-b border-border">
          <h2 className="text-lg font-bold text-foreground">Create New Automation</h2>
          <p className="text-sm text-muted-foreground mt-1">Choose a type and folder to get started</p>
        </div>
        <div className="p-6 space-y-4">
          <div className="flex items-center gap-3">
            <div className="flex-1 space-y-1.5">
              <Label className="text-xs font-semibold">Automation Name</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="My automation" className="h-10" autoFocus />
            </div>
            <div className="w-[180px] space-y-1.5">
              <Label className="text-xs font-semibold">Folder</Label>
              <select value={folderId || ""} onChange={(e) => setFolderId(e.target.value || null)}
                className="h-10 w-full px-3 rounded-lg border border-border bg-background text-sm text-foreground">
                <option value="">No folder</option>
                {folders.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
              </select>
            </div>
          </div>
          <div className="space-y-2">
            <Label className="text-xs font-semibold">Type</Label>
            <div className="grid gap-2">
              {modes.map(m => {
                const MIcon = m.icon;
                return (
                  <button key={m.mode} onClick={() => setSelectedMode(m.mode)} className={cn(
                    "flex items-start gap-3.5 p-4 rounded-xl border-2 text-left transition-all",
                    selectedMode === m.mode ? `${m.bg} ring-2 ring-offset-1 ring-current ${m.color}` : "border-border hover:border-muted-foreground hover:bg-muted/30"
                  )}>
                    <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center shrink-0", m.bg)}><MIcon className={cn("w-5 h-5", m.color)} /></div>
                    <div className="flex-1 min-w-0">
                      <p className={cn("text-sm font-bold", selectedMode === m.mode ? m.color : "text-foreground")}>{m.title}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{m.desc}</p>
                      <p className="text-[11px] text-muted-foreground/70 mt-1 italic">{m.example}</p>
                    </div>
                    {selectedMode === m.mode && <CheckCircle2 className={cn("w-5 h-5 shrink-0 mt-0.5", m.color)} />}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
        <div className="p-6 border-t border-border flex items-center justify-end gap-3">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={() => { onCreate(selectedMode, name || "My automation", folderId); setName(""); setFolderId(null); onClose(); }}>
            <Plus className="w-4 h-4" /> Create Automation
          </Button>
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// FOLDER SIDEBAR
// ============================================================================

const FolderSidebar = ({ folders, selectedFolderId, automations, onSelectFolder, onCreateFolder, onRenameFolder, onDeleteFolder }: {
  folders: AutomationFolder[];
  selectedFolderId: string | null; // null = "All", "unfiled" = unfiled
  automations: AutomationDraft[];
  onSelectFolder: (id: string | null) => void;
  onCreateFolder: (name: string) => void;
  onRenameFolder: (id: string, name: string) => void;
  onDeleteFolder: (id: string) => void;
}) => {
  const [isCreating, setIsCreating] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { if (isCreating && inputRef.current) inputRef.current.focus(); }, [isCreating]);

  const totalCount = automations.length;
  const getFolderCount = (fid: string) => automations.filter(a => a.folderId === fid).length;

  const handleCreateSubmit = () => {
    const name = newFolderName.trim();
    if (name) { onCreateFolder(name); toast.success(`Folder "${name}" created`); }
    setNewFolderName(""); setIsCreating(false);
  };

  const handleRenameSubmit = (id: string) => {
    const name = editName.trim();
    if (name) { onRenameFolder(id, name); toast.success("Folder renamed"); }
    setEditingId(null); setEditName("");
  };

  return (
    <div className="w-[220px] shrink-0 border-r border-border bg-card/50 h-full overflow-y-auto">
      <div className="p-4 pb-2">
        <div className="mb-3">
          <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Folders</p>
        </div>

        {/* All */}
        <button onClick={() => onSelectFolder(null)} className={cn(
          "w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-left transition-colors mb-0.5",
          selectedFolderId === null ? "bg-primary/10 text-primary font-semibold" : "hover:bg-muted/70 text-foreground"
        )}>
          <Inbox className="w-4 h-4 shrink-0" />
          <span className="text-sm flex-1 truncate">All Automations</span>
          <span className={cn("text-[11px] tabular-nums", selectedFolderId === null ? "text-primary" : "text-muted-foreground")}>{totalCount}</span>
        </button>

        <div className="h-px bg-border my-2" />

        {/* Folders */}
        {folders.map(folder => {
          const count = getFolderCount(folder.id);
          const isEditing = editingId === folder.id;
          const isSelected = selectedFolderId === folder.id;

          if (isEditing) {
            return (
              <div key={folder.id} className="flex items-center gap-1 px-2 py-1 mb-0.5">
                <Folder className="w-4 h-4 shrink-0 text-muted-foreground" />
                <input value={editName} onChange={(e) => setEditName(e.target.value)}
                  onBlur={() => handleRenameSubmit(folder.id)}
                  onKeyDown={(e) => { if (e.key === "Enter") handleRenameSubmit(folder.id); if (e.key === "Escape") { setEditingId(null); setEditName(""); } }}
                  className="flex-1 text-sm bg-transparent border-b border-primary outline-none px-1 py-0.5" autoFocus />
              </div>
            );
          }

          return (
            <div key={folder.id} className="group mb-0.5">
              <button onClick={() => onSelectFolder(folder.id)} className={cn(
                "w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-left transition-colors",
                isSelected ? "bg-primary/10 text-primary font-semibold" : "hover:bg-muted/70 text-foreground"
              )}>
                {isSelected ? <FolderOpen className="w-4 h-4 shrink-0" /> : <Folder className="w-4 h-4 shrink-0 text-muted-foreground" />}
                <span className="text-sm flex-1 truncate">{folder.name}</span>
                {/* Count hides on hover, edit/delete show instead */}
                <span className={cn("text-[11px] tabular-nums group-hover:hidden", isSelected ? "text-primary" : "text-muted-foreground")}>{count}</span>
                <span className="hidden group-hover:flex items-center gap-0.5">
                  <span role="button" onClick={(e) => { e.stopPropagation(); setEditingId(folder.id); setEditName(folder.name); }}
                    className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground"><Pencil className="w-3 h-3" /></span>
                  <span role="button" onClick={(e) => { e.stopPropagation(); onDeleteFolder(folder.id); }}
                    className="p-1 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive"><Trash2 className="w-3 h-3" /></span>
                </span>
              </button>
            </div>
          );
        })}

        {/* Create new folder inline input */}
        {isCreating && (
          <div className="flex items-center gap-1 px-2 py-1 mb-0.5">
            <FolderPlus className="w-4 h-4 shrink-0 text-muted-foreground" />
            <input ref={inputRef} value={newFolderName} onChange={(e) => setNewFolderName(e.target.value)}
              onBlur={handleCreateSubmit}
              onKeyDown={(e) => { if (e.key === "Enter") handleCreateSubmit(); if (e.key === "Escape") { setIsCreating(false); setNewFolderName(""); } }}
              placeholder="Folder name..."
              className="flex-1 text-sm bg-transparent border-b border-primary outline-none px-1 py-0.5 placeholder:text-muted-foreground/80" />
          </div>
        )}

        {/* New Folder button */}
        {!isCreating && (
          <button onClick={() => setIsCreating(true)} className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-left text-muted-foreground hover:text-foreground hover:bg-muted/70 transition-colors mt-1">
            <Plus className="w-4 h-4 shrink-0" />
            <span className="text-sm">New Folder</span>
          </button>
        )}
      </div>
    </div>
  );
};

// ============================================================================
// MAIN VIEW
// ============================================================================

export const AutomationV2View = () => {
  const [automations, setAutomations] = useState<AutomationDraft[]>(SAMPLE_AUTOMATIONS);
  const [folders, setFolders] = useState<AutomationFolder[]>(DEFAULT_FOLDERS);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterMode, setFilterMode] = useState<"all" | AutomationMode>("all");
  const [filterStatus, setFilterStatus] = useState<"all" | "active" | "draft">("all");
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null); // null = All
  const [editingAutomation, setEditingAutomation] = useState<AutomationDraft | null>(null);
  const [showNewModal, setShowNewModal] = useState(false);
  const [movingAutomationId, setMovingAutomationId] = useState<string | null>(null);

  const totalActive = automations.filter(w => w.enabled).length;
  const totalRuns = automations.reduce((s, w) => s + w.runs, 0);
  const totalJourneys = automations.filter(w => w.mode === "journey").length;

  const filtered = useMemo(() => {
    return automations.filter(a => {
      const q = searchQuery.toLowerCase();
      const matchesSearch = !q || a.name.toLowerCase().includes(q) || a.description.toLowerCase().includes(q);
      const matchesMode = filterMode === "all" || a.mode === filterMode;
      const matchesStatus = filterStatus === "all" || (filterStatus === "active" && a.enabled) || (filterStatus === "draft" && !a.enabled);
      const matchesFolder = selectedFolderId === null || a.folderId === selectedFolderId;
      return matchesSearch && matchesMode && matchesStatus && matchesFolder;
    });
  }, [automations, searchQuery, filterMode, filterStatus, selectedFolderId]);

  // Folder CRUD
  const handleCreateFolder = (name: string) => {
    setFolders(prev => [...prev, { id: `folder-${Date.now()}`, name }]);
  };
  const handleRenameFolder = (id: string, name: string) => {
    setFolders(prev => prev.map(f => f.id === id ? { ...f, name } : f));
  };
  const handleDeleteFolder = (id: string) => {
    // Move automations in this folder to unfiled
    setAutomations(prev => prev.map(a => a.folderId === id ? { ...a, folderId: null } : a));
    setFolders(prev => prev.filter(f => f.id !== id));
    if (selectedFolderId === id) setSelectedFolderId(null);
    toast.success("Folder deleted — automations moved to Unfiled");
  };
  const handleMoveToFolder = (automationId: string, folderId: string | null) => {
    setAutomations(prev => prev.map(a => a.id === automationId ? { ...a, folderId } : a));
    setMovingAutomationId(null);
    if (folderId) {
      const folderName = folders.find(f => f.id === folderId)?.name || "folder";
      toast.success(`Moved to ${folderName}`);
    } else {
      toast.success("Removed from folder");
    }
  };

  // Automation CRUD
  const handleCreate = (mode: AutomationMode, name: string, folderId: string | null) => {
    const a: AutomationDraft = { id: `wf-${Date.now()}`, name, description: "", nodes: [], connections: [], enabled: false, createdAt: new Date().toISOString(), runs: 0, mode, folderId };
    setAutomations(prev => [...prev, a]);
    setEditingAutomation(a);
  };
  const handleSave = (a: AutomationDraft) => { setAutomations(prev => prev.map(w => w.id === a.id ? a : w)); };
  const handleDelete = (id: string) => { setAutomations(prev => prev.filter(w => w.id !== id)); toast.success("Automation deleted"); };
  const handleDuplicate = (a: AutomationDraft) => {
    const copy: AutomationDraft = { ...a, id: `wf-${Date.now()}`, name: `${a.name} (Copy)`, enabled: false, runs: 0, connections: [...a.connections] };
    setAutomations(prev => [...prev, copy]); toast.success("Duplicated!");
  };
  const handleToggle = (id: string) => { setAutomations(prev => prev.map(w => w.id === id ? { ...w, enabled: !w.enabled } : w)); };

  // Canvas view
  if (editingAutomation) {
    const current = automations.find(w => w.id === editingAutomation.id) || editingAutomation;
    return <AutomationCanvas automation={current} onBack={() => setEditingAutomation(null)} onSave={handleSave}
      onUpdate={(a) => { handleSave(a); setEditingAutomation(a); }} />;
  }

  return (
    <div className="h-[calc(100vh-64px)] flex flex-col">
      {/* Header */}
      <div className="px-6 pt-6 pb-4 shrink-0">
        <header className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">Automations v2</h1>
            <p className="text-muted-foreground text-sm mt-1">Build discipleship automations — Basic, Sequence, and Journey modes</p>
          </div>
          <Button onClick={() => setShowNewModal(true)}><Plus className="w-4 h-4 mr-1.5" /> New Automation</Button>
        </header>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mt-5">
          {[
            { label: "Total", value: automations.length, icon: Zap, color: "text-primary" },
            { label: "Active", value: totalActive, icon: Play, color: "text-emerald-600" },
            { label: "Journeys", value: totalJourneys, icon: Route, color: "text-purple-600" },
            { label: "Total Runs", value: totalRuns.toLocaleString(), icon: ListOrdered, color: "text-blue-600" },
            { label: "Drafts", value: automations.filter(w => !w.enabled).length, icon: Clock, color: "text-amber-600" },
          ].map(stat => (
            <div key={stat.label} className="bg-card border border-border rounded-lg px-4 py-3 flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-muted flex items-center justify-center shrink-0"><stat.icon className={cn("w-4 h-4", stat.color)} /></div>
              <div><p className="text-lg font-bold text-foreground leading-none">{stat.value}</p><p className="text-xs text-muted-foreground mt-0.5">{stat.label}</p></div>
            </div>
          ))}
        </div>
      </div>

      {/* Content with sidebar */}
      <div className="flex-1 flex overflow-hidden">
        {/* Folder sidebar */}
        <FolderSidebar folders={folders} selectedFolderId={selectedFolderId} automations={automations}
          onSelectFolder={setSelectedFolderId} onCreateFolder={handleCreateFolder}
          onRenameFolder={handleRenameFolder} onDeleteFolder={handleDeleteFolder} />

        {/* Main list */}
        <div className="flex-1 overflow-y-auto px-6 pb-6">
          {/* Search + filters */}
          <div className="flex items-center gap-3 bg-card border border-border rounded-xl px-4 py-3 mb-4 sticky top-0 z-10">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input placeholder="Search automations..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-9 h-10 text-sm border-border bg-background w-full" />
            </div>
            <select value={filterMode} onChange={(e) => setFilterMode(e.target.value as any)}
              className="h-10 px-3 pr-8 rounded-lg border border-border bg-background text-sm text-foreground appearance-none cursor-pointer"
              style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%239ca3af' stroke-width='2'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E")`, backgroundRepeat: "no-repeat", backgroundPosition: "right 10px center" }}>
              <option value="all">All types</option><option value="basic">Basic</option><option value="sequence">Sequence</option><option value="journey">Journey</option>
            </select>
            <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value as any)}
              className="h-10 px-3 pr-8 rounded-lg border border-border bg-background text-sm text-foreground appearance-none cursor-pointer"
              style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%239ca3af' stroke-width='2'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E")`, backgroundRepeat: "no-repeat", backgroundPosition: "right 10px center" }}>
              <option value="all">All statuses</option><option value="active">Active</option><option value="draft">Draft</option>
            </select>
          </div>

          {/* List */}
          {filtered.length === 0 ? (
            <div className="text-center py-20">
              <div className="w-14 h-14 rounded-full bg-muted flex items-center justify-center mx-auto mb-4"><Zap className="w-6 h-6 text-muted-foreground" /></div>
              <h3 className="text-base font-semibold text-foreground">No automations found</h3>
              <p className="text-sm text-muted-foreground mt-1">
                {selectedFolderId
                  ? "This folder is empty. Create a new automation or move one here."
                  : "Create your first automation to get started."}
              </p>
              <Button className="mt-5" onClick={() => setShowNewModal(true)}><Plus className="w-4 h-4 mr-1.5" /> New Automation</Button>
            </div>
          ) : (
            <div className="grid gap-3">
              {filtered.map(a => {
                const mInfo = getModeInfo(a.mode);
                const ModeIcon = mInfo.icon;
                const folderObj = a.folderId ? folders.find(f => f.id === a.folderId) : null;
                return (
                  <div key={a.id} className="bg-card border border-border rounded-xl px-5 py-4 hover:border-primary/30 hover:shadow-sm transition-all group cursor-pointer"
                    onClick={() => setEditingAutomation(a)}>
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 bg-muted">
                        <ModeIcon className="w-5 h-5 text-muted-foreground" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h3 className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors truncate">{a.name}</h3>
                          <Badge variant="outline" className={cn("text-[10px] shrink-0", mInfo.bg, mInfo.color, mInfo.border)}>{mInfo.label}</Badge>
                          {folderObj && (
                            <Badge variant="secondary" className="text-[10px] shrink-0 gap-1">
                              <Folder className="w-2.5 h-2.5" /> {folderObj.name}
                            </Badge>
                          )}
                        </div>
                        {a.description && <p className="text-xs text-muted-foreground mt-0.5 truncate">{a.description}</p>}
                      </div>
                      {/* Node preview */}
                      <div className="hidden sm:flex items-center gap-1 shrink-0">
                        {a.nodes.slice(0, 5).map((node, i) => {
                          const NIcon = node.icon;
                          return (
                            <React.Fragment key={node.id}>
                              {i > 0 && <div className="w-2.5 h-[1.5px] bg-border" />}
                              <div className={cn("w-7 h-7 rounded-md flex items-center justify-center", node.iconBg)} title={node.label}><NIcon className={cn("w-3.5 h-3.5", node.iconColor)} /></div>
                            </React.Fragment>
                          );
                        })}
                        {a.nodes.length > 5 && <span className="text-[10px] text-muted-foreground ml-1">+{a.nodes.length - 5}</span>}
                      </div>
                      {/* Meta */}
                      <div className="flex items-center gap-4 shrink-0">
                        <div className="text-right hidden md:block">
                          <p className="text-xs font-medium text-foreground tabular-nums">{a.runs.toLocaleString()} runs</p>
                          <p className="text-xs text-muted-foreground">{formatTimeAgo(a.createdAt)}</p>
                        </div>
                        <button onClick={(e) => { e.stopPropagation(); handleToggle(a.id); }} className="cursor-pointer">
                          <span className={cn("inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-full border transition-all hover:ring-2 hover:ring-offset-1",
                            a.enabled ? "bg-emerald-50 text-emerald-700 border-emerald-200 hover:ring-emerald-300" : "bg-amber-50 text-amber-700 border-amber-200 hover:ring-amber-300")}>
                            <span className={cn("w-1.5 h-1.5 rounded-full", a.enabled ? "bg-emerald-500" : "bg-amber-500")} />
                            {a.enabled ? "Active" : "Draft"}
                          </span>
                        </button>
                        <DropdownMenu>
                          <DropdownMenuTrigger onClick={(e) => e.stopPropagation()} className="p-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors outline-none">
                            <MoreVertical className="w-4 h-4" />
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-48" onClick={(e) => e.stopPropagation()} onPointerDown={(e) => e.stopPropagation()}>
                            <DropdownMenuItem onSelect={() => setEditingAutomation(a)}><Edit2 className="w-3.5 h-3.5" /> Edit</DropdownMenuItem>
                            <DropdownMenuItem onSelect={() => handleDuplicate(a)}><Copy className="w-3.5 h-3.5" /> Duplicate</DropdownMenuItem>
                            <DropdownMenuItem onSelect={() => handleToggle(a.id)}>
                              {a.enabled ? <><Pause className="w-3.5 h-3.5" /> Stop</> : <><Play className="w-3.5 h-3.5" /> Activate</>}
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            {/* Move to folder submenu */}
                            <DropdownMenuItem onSelect={() => setMovingAutomationId(a.id)}>
                              <FolderInput className="w-3.5 h-3.5" /> Move to Folder
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem variant="destructive" onSelect={() => handleDelete(a.id)}><Trash2 className="w-3.5 h-3.5" /> Delete</DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Move to folder modal */}
      {movingAutomationId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-200"
          onClick={() => setMovingAutomationId(null)}>
          <div className="bg-card border border-border rounded-2xl shadow-2xl w-full max-w-sm mx-4 animate-in zoom-in-95 duration-300" onClick={e => e.stopPropagation()}>
            <div className="p-5 border-b border-border">
              <h3 className="text-base font-bold text-foreground">Move to Folder</h3>
              <p className="text-xs text-muted-foreground mt-1">Select a destination folder</p>
            </div>
            <div className="p-3 max-h-[300px] overflow-y-auto">
              <button onClick={() => handleMoveToFolder(movingAutomationId, null)}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-muted/70 transition-colors text-left">
                <X className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm font-medium">Remove from folder</span>
              </button>
              {folders.map(f => (
                <button key={f.id} onClick={() => handleMoveToFolder(movingAutomationId, f.id)}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-muted/70 transition-colors text-left">
                  <Folder className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm font-medium">{f.name}</span>
                  <span className="text-[11px] text-muted-foreground ml-auto">{automations.filter(a => a.folderId === f.id).length}</span>
                </button>
              ))}
            </div>
            <div className="p-4 border-t border-border">
              <Button variant="outline" size="sm" className="w-full" onClick={() => setMovingAutomationId(null)}>Cancel</Button>
            </div>
          </div>
        </div>
      )}

      {/* New Automation Modal */}
      <NewAutomationModal isOpen={showNewModal} onClose={() => setShowNewModal(false)} onCreate={handleCreate} folders={folders} />
    </div>
  );
};
