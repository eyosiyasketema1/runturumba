import React, { useState, useCallback, useRef, useEffect, useMemo } from "react";
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
  FolderInput, FolderClosed, Pencil
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

interface AutomationDraft {
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
// DEFAULT FOLDERS
// ============================================================================

const DEFAULT_FOLDERS: AutomationFolder[] = [
  { id: "onboarding", name: "Onboarding", color: "text-emerald-600" },
  { id: "follow-ups", name: "Follow-ups", color: "text-blue-600" },
  { id: "discipleship", name: "Discipleship", color: "text-purple-600" },
  { id: "re-engagement", name: "Re-engagement", color: "text-amber-600" },
  { id: "notifications", name: "Notifications", color: "text-rose-600" },
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
    mode: "sequence", enabled: true, createdAt: "2025-04-20T14:00:00Z", runs: 89, folderId: "discipleship",
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
    mode: "journey", enabled: true, createdAt: "2025-04-15T09:00:00Z", runs: 213, folderId: "discipleship",
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
    mode: "sequence", enabled: false, createdAt: "2025-05-01T09:00:00Z", runs: 0, folderId: "re-engagement",
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
// SVG CONNECTION LINES
// ============================================================================

const ConnectionLines = ({ nodes, connections }: { nodes: FlowNode[]; connections: FlowConnection[] }) => {
  const nodeMap = useMemo(() => {
    const map = new Map<string, { px: number; py: number }>();
    nodes.forEach(n => map.set(n.id, gridToPixel(n.position.x, n.position.y)));
    return map;
  }, [nodes]);

  return (
    <svg className="absolute inset-0 pointer-events-none" style={{ overflow: "visible" }}>
      <defs>
        <marker id="arrow-default" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto">
          <path d="M1,1 L7,4 L1,7" fill="none" stroke="#94a3b8" strokeWidth="1.5" />
        </marker>
        <marker id="arrow-true" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto">
          <path d="M1,1 L7,4 L1,7" fill="none" stroke="#22c55e" strokeWidth="1.5" />
        </marker>
        <marker id="arrow-false" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto">
          <path d="M1,1 L7,4 L1,7" fill="none" stroke="#ef4444" strokeWidth="1.5" />
        </marker>
      </defs>
      {connections.map(conn => {
        const fromPos = nodeMap.get(conn.from);
        const toPos = nodeMap.get(conn.to);
        if (!fromPos || !toPos) return null;
        const x1 = fromPos.px + NODE_WIDTH;
        const y1 = fromPos.py + NODE_HEIGHT / 2;
        const x2 = toPos.px;
        const y2 = toPos.py + NODE_HEIGHT / 2;
        const dx = Math.abs(x2 - x1) * 0.5;
        const strokeColor = conn.type === "true" ? "#22c55e" : conn.type === "false" ? "#ef4444" : "#94a3b8";
        const markerId = conn.type === "true" ? "arrow-true" : conn.type === "false" ? "arrow-false" : "arrow-default";
        return (
          <g key={conn.id}>
            <path
              d={`M${x1},${y1} C${x1 + dx},${y1} ${x2 - dx},${y2} ${x2},${y2}`}
              fill="none" stroke={strokeColor} strokeWidth="2"
              strokeDasharray={conn.type === "false" ? "6,4" : "none"}
              markerEnd={`url(#${markerId})`} opacity="0.7"
            />
            {conn.label && (
              <text x={(x1 + x2) / 2} y={(y1 + y2) / 2 - 10} textAnchor="middle"
                className="text-[10px] font-semibold fill-current" style={{ fill: strokeColor }}>
                {conn.label}
              </text>
            )}
          </g>
        );
      })}
    </svg>
  );
};

// ============================================================================
// CANVAS NODE
// ============================================================================

const CanvasNode = ({ node, isSelected, onClick, onDelete, onAddAfter }: {
  node: FlowNode; isSelected: boolean; onClick: () => void; onDelete: () => void; onAddAfter?: () => void;
}) => {
  const Icon = node.icon;
  const colors = getNodeTypeColor(node.type);
  const pos = gridToPixel(node.position.x, node.position.y);
  return (
    <div className="absolute group" style={{ left: pos.px, top: pos.py, width: NODE_WIDTH, height: NODE_HEIGHT }}>
      <div onClick={onClick} className={cn(
        "w-full h-full rounded-xl border-2 cursor-pointer transition-all duration-200 bg-card hover:shadow-lg hover:shadow-primary/5",
        isSelected ? `border-primary shadow-lg shadow-primary/10 ring-2 ${colors.ring}` : "border-border hover:border-primary/40"
      )}>
        <div className={cn("h-1 rounded-t-[10px]", colors.bar)} />
        <div className="px-3.5 py-2.5 flex items-start gap-3">
          <div className={cn("w-9 h-9 rounded-lg flex items-center justify-center shrink-0 mt-0.5", node.iconBg)}>
            <Icon className={cn("w-4.5 h-4.5", node.iconColor)} />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[13px] font-semibold text-foreground leading-tight truncate">{node.label}</p>
            <p className="text-[11px] text-muted-foreground mt-0.5 truncate">{node.description}</p>
          </div>
        </div>
        <div className="absolute -top-1.5 -right-1.5 w-3.5 h-3.5 rounded-full bg-emerald-500 border-2 border-background opacity-0 group-hover:opacity-100 transition-opacity" />
      </div>
      <button onClick={(e) => { e.stopPropagation(); onDelete(); }}
        className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-xs hover:scale-110 z-10">
        <X className="w-3 h-3" />
      </button>
      {onAddAfter && (
        <button onClick={(e) => { e.stopPropagation(); onAddAfter(); }}
          className="absolute -right-5 top-1/2 -translate-y-1/2 translate-x-full w-7 h-7 rounded-full border-2 border-dashed border-border bg-background flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all hover:border-primary hover:bg-primary/5 z-10">
          <Plus className="w-3.5 h-3.5 text-muted-foreground group-hover:text-primary" />
        </button>
      )}
      {node.type === "condition" && (
        <>
          <div className="absolute -bottom-7 left-1/3 flex items-center gap-1">
            <span className="text-[9px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">TRUE</span>
          </div>
          <div className="absolute -bottom-7 right-1/3 flex items-center gap-1">
            <span className="text-[9px] font-bold text-red-600 bg-red-50 px-1.5 py-0.5 rounded border border-red-200">FALSE</span>
          </div>
        </>
      )}
    </div>
  );
};

// ============================================================================
// NODE PICKER PANEL
// ============================================================================

const NodePickerPanel = ({ isOpen, onClose, onSelectNode, title, mode }: {
  isOpen: boolean; onClose: () => void; onSelectNode: (item: NodeCatalogItem) => void; title: string; mode: AutomationMode;
}) => {
  const [search, setSearch] = useState("");
  const [expandedSection, setExpandedSection] = useState<string | null>("Triggers");
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
          const isExpanded = expandedSection === section.section || search.trim().length > 0;
          return (
            <div key={section.section}>
              <button onClick={() => setExpandedSection(isExpanded && !search ? null : section.section)} className="w-full flex items-center gap-3 px-5 py-3 hover:bg-muted/50 transition-colors">
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

const NodeInspector = ({ node, onUpdate, onClose, onDelete, isJourney }: {
  node: FlowNode; onUpdate: (updates: Partial<FlowNode>) => void; onClose: () => void; onDelete: () => void; isJourney?: boolean;
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
        {isJourney && (
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-foreground">Grid Position</Label>
            <div className="flex items-center gap-2">
              <div className="flex-1"><p className="text-[10px] text-muted-foreground mb-1">Column (X)</p><Input type="number" value={node.position.x} onChange={(e) => onUpdate({ position: { ...node.position, x: parseFloat(e.target.value) || 0 } })} className="h-8 text-xs" min={0} /></div>
              <div className="flex-1"><p className="text-[10px] text-muted-foreground mb-1">Row (Y)</p><Input type="number" value={node.position.y} onChange={(e) => onUpdate({ position: { ...node.position, y: parseFloat(e.target.value) || 0 } })} className="h-8 text-xs" min={0} step={0.5} /></div>
            </div>
          </div>
        )}
        <div className="pt-4 border-t border-border">
          <Button variant="outline" size="sm" className="w-full text-destructive hover:text-destructive hover:bg-destructive/5" onClick={onDelete}><Trash2 className="w-3.5 h-3.5" /> Remove Node</Button>
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// AUTOMATION CANVAS
// ============================================================================

const AutomationCanvas = ({ automation, onBack, onSave, onUpdate }: {
  automation: AutomationDraft; onBack: () => void; onSave: (a: AutomationDraft) => void; onUpdate: (a: AutomationDraft) => void;
}) => {
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [isNodePickerOpen, setIsNodePickerOpen] = useState(false);
  const [insertAfterNodeId, setInsertAfterNodeId] = useState<string | null>(null);
  const [autoName, setAutoName] = useState(automation.name);
  const [isEditingName, setIsEditingName] = useState(false);
  const [zoom, setZoom] = useState(1);

  const selectedNode = automation.nodes.find(n => n.id === selectedNodeId) || null;
  const modeInfo = getModeInfo(automation.mode);

  const canvasBounds = useMemo(() => {
    if (automation.nodes.length === 0) return { width: 800, height: 400 };
    let maxX = 0, maxY = 0;
    automation.nodes.forEach(n => {
      const pos = gridToPixel(n.position.x, n.position.y);
      maxX = Math.max(maxX, pos.px + NODE_WIDTH);
      maxY = Math.max(maxY, pos.py + NODE_HEIGHT);
    });
    return { width: maxX + CANVAS_PADDING * 2 + 200, height: maxY + CANVAS_PADDING * 2 + 100 };
  }, [automation.nodes]);

  const addNode = useCallback((item: NodeCatalogItem) => {
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
        const newNode: FlowNode = { id: newId, type: item.type, category: item.category, label: item.label, description: item.description, icon: item.icon, iconColor: item.iconColor, iconBg: item.iconBg, config: {}, position: { x: posX, y: posY } };
        const existingConn = automation.connections.find(c => c.from === insertAfterNodeId);
        let finalConnections = automation.connections.filter(c => c.from !== insertAfterNodeId);
        finalConnections.push({ id: `c-${Date.now()}-a`, from: insertAfterNodeId, to: newId });
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
    const newNode: FlowNode = { id: newId, type: item.type, category: item.category, label: item.label, description: item.description, icon: item.icon, iconColor: item.iconColor, iconBg: item.iconBg, config: {}, position: { x: posX, y: posY } };
    const nodesAtMaxX = automation.nodes.filter(n => n.position.x === Math.max(...automation.nodes.map(n2 => n2.position.x)));
    const lastNode = nodesAtMaxX.length > 0 ? nodesAtMaxX[0] : null;
    const newConns = [...automation.connections];
    if (lastNode) newConns.push({ id: `c-${Date.now()}`, from: lastNode.id, to: newId });
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
          <Badge variant={automation.enabled ? "default" : "secondary"} className={cn("text-xs", automation.enabled && "bg-emerald-100 text-emerald-700 border-emerald-200")}>
            {automation.enabled ? "Active" : "Draft"}
          </Badge>
          <div className="w-px h-6 bg-border" />
          <Button variant="outline" size="sm" onClick={() => { onSave(automation); toast.success("Saved!"); }}><Save className="w-3.5 h-3.5" /> Save</Button>
          <Button size="sm" onClick={() => { onSave({ ...automation, enabled: true }); toast.success("Published!"); onBack(); }}><Play className="w-3.5 h-3.5" /> Publish</Button>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Canvas */}
        <div className="flex-1 overflow-auto relative bg-[radial-gradient(circle,_hsl(var(--muted-foreground)/0.08)_1px,_transparent_1px)] bg-[length:24px_24px]"
          onClick={() => { setSelectedNodeId(null); setIsNodePickerOpen(false); }}>
          <div className="absolute bottom-4 left-4 flex items-center gap-1 bg-card border border-border rounded-lg p-1 z-20 shadow-sm">
            <button onClick={() => setZoom(1)} className="p-1.5 rounded-md hover:bg-muted text-muted-foreground text-xs font-mono w-10 text-center">{Math.round(zoom * 100)}%</button>
            <div className="w-px h-5 bg-border" />
            <button onClick={() => setZoom(z => Math.min(z + 0.1, 1.5))} className="p-1.5 rounded-md hover:bg-muted text-muted-foreground"><ZoomIn className="w-3.5 h-3.5" /></button>
            <button onClick={() => setZoom(z => Math.max(z - 0.1, 0.5))} className="p-1.5 rounded-md hover:bg-muted text-muted-foreground"><ZoomOut className="w-3.5 h-3.5" /></button>
          </div>
          {automation.mode === "journey" && automation.nodes.length === 0 && (
            <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-card border border-border rounded-xl px-6 py-3 shadow-sm z-20 flex items-center gap-3">
              <Route className="w-5 h-5 text-purple-500" />
              <div>
                <p className="text-sm font-semibold text-foreground">Journey Builder</p>
                <p className="text-xs text-muted-foreground">Add a trigger to start, then build branching discipleship paths with conditions</p>
              </div>
            </div>
          )}
          <div className="relative" style={{ width: canvasBounds.width * zoom, height: canvasBounds.height * zoom, transform: `scale(${zoom})`, transformOrigin: "top left", minWidth: "100%", minHeight: "100%" }} onClick={(e) => e.stopPropagation()}>
            <ConnectionLines nodes={automation.nodes} connections={automation.connections} />
            {automation.nodes.length === 0 && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="flex items-center gap-8">
                  <button onClick={() => handleOpenPicker()} className="w-[160px] h-[160px] border-2 border-dashed border-border rounded-2xl flex flex-col items-center justify-center gap-3 hover:border-primary/50 hover:bg-primary/5 transition-all group">
                    <Plus className="w-8 h-8 text-muted-foreground group-hover:text-primary transition-colors" />
                    <span className="text-sm font-medium text-muted-foreground group-hover:text-foreground">Add first step</span>
                  </button>
                  <span className="text-sm text-muted-foreground">or</span>
                  <button onClick={() => { addNode(NODE_CATALOG[0].items[5]); }} className="w-[160px] h-[160px] border-2 border-dashed border-border rounded-2xl flex flex-col items-center justify-center gap-3 hover:border-primary/50 hover:bg-primary/5 transition-all group">
                    <Sparkles className="w-8 h-8 text-muted-foreground group-hover:text-primary transition-colors" />
                    <span className="text-sm font-medium text-muted-foreground group-hover:text-foreground">Quick start</span>
                  </button>
                </div>
              </div>
            )}
            {automation.nodes.map(node => (
              <CanvasNode key={node.id} node={node} isSelected={selectedNodeId === node.id}
                onClick={() => { setSelectedNodeId(node.id); setIsNodePickerOpen(false); }}
                onDelete={() => deleteNode(node.id)} onAddAfter={() => handleOpenPicker(node.id)} />
            ))}
            {automation.nodes.length > 0 && !isNodePickerOpen && !selectedNode && (
              <div className="absolute bottom-6 right-6 z-10">
                <button onClick={() => handleOpenPicker()} className="w-12 h-12 rounded-full bg-primary text-primary-foreground shadow-lg hover:shadow-xl hover:scale-105 transition-all flex items-center justify-center">
                  <Plus className="w-5 h-5" />
                </button>
              </div>
            )}
          </div>
        </div>
        {isNodePickerOpen && (
          <NodePickerPanel isOpen={isNodePickerOpen} onClose={() => { setIsNodePickerOpen(false); setInsertAfterNodeId(null); }}
            onSelectNode={addNode} title={insertAfterNodeId ? "Add next step" : "What happens first?"} mode={automation.mode} />
        )}
        {selectedNode && !isNodePickerOpen && (
          <NodeInspector node={selectedNode} onUpdate={(updates) => updateNode(selectedNode.id, updates)}
            onClose={() => setSelectedNodeId(null)} onDelete={() => deleteNode(selectedNode.id)} isJourney={automation.mode === "journey"} />
        )}
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
                    selectedMode === m.mode ? `${m.bg} ring-2 ring-offset-1 ring-current ${m.color}` : "border-border hover:border-muted-foreground/30 hover:bg-muted/30"
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
  const unfiledCount = automations.filter(a => !a.folderId).length;
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
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Folders</p>
          <button onClick={() => setIsCreating(true)} className="p-1 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors" title="New folder">
            <FolderPlus className="w-3.5 h-3.5" />
          </button>
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

        {/* Unfiled */}
        <button onClick={() => onSelectFolder("unfiled")} className={cn(
          "w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-left transition-colors mb-0.5",
          selectedFolderId === "unfiled" ? "bg-primary/10 text-primary font-semibold" : "hover:bg-muted/70 text-foreground"
        )}>
          <FileText className="w-4 h-4 shrink-0" />
          <span className="text-sm flex-1 truncate">Unfiled</span>
          <span className={cn("text-[11px] tabular-nums", selectedFolderId === "unfiled" ? "text-primary" : "text-muted-foreground")}>{unfiledCount}</span>
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
            <div key={folder.id} className="group relative mb-0.5">
              <button onClick={() => onSelectFolder(folder.id)} className={cn(
                "w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-left transition-colors",
                isSelected ? "bg-primary/10 text-primary font-semibold" : "hover:bg-muted/70 text-foreground"
              )}>
                {isSelected ? <FolderOpen className={cn("w-4 h-4 shrink-0", folder.color || "")} /> : <Folder className={cn("w-4 h-4 shrink-0", folder.color || "text-muted-foreground")} />}
                <span className="text-sm flex-1 truncate">{folder.name}</span>
                <span className={cn("text-[11px] tabular-nums", isSelected ? "text-primary" : "text-muted-foreground")}>{count}</span>
              </button>
              {/* Edit/Delete on hover */}
              <div className="absolute right-1 top-1/2 -translate-y-1/2 hidden group-hover:flex items-center gap-0.5">
                <button onClick={(e) => { e.stopPropagation(); setEditingId(folder.id); setEditName(folder.name); }}
                  className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground"><Pencil className="w-3 h-3" /></button>
                <button onClick={(e) => { e.stopPropagation(); onDeleteFolder(folder.id); }}
                  className="p-1 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive"><Trash2 className="w-3 h-3" /></button>
              </div>
            </div>
          );
        })}

        {/* Create new folder inline */}
        {isCreating && (
          <div className="flex items-center gap-1 px-2 py-1 mb-0.5">
            <FolderPlus className="w-4 h-4 shrink-0 text-primary" />
            <input ref={inputRef} value={newFolderName} onChange={(e) => setNewFolderName(e.target.value)}
              onBlur={handleCreateSubmit}
              onKeyDown={(e) => { if (e.key === "Enter") handleCreateSubmit(); if (e.key === "Escape") { setIsCreating(false); setNewFolderName(""); } }}
              placeholder="Folder name..."
              className="flex-1 text-sm bg-transparent border-b border-primary outline-none px-1 py-0.5 placeholder:text-muted-foreground/50" />
          </div>
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
      const matchesFolder = selectedFolderId === null
        || (selectedFolderId === "unfiled" && !a.folderId)
        || a.folderId === selectedFolderId;
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
    const folderName = folderId ? folders.find(f => f.id === folderId)?.name || "folder" : "Unfiled";
    toast.success(`Moved to ${folderName}`);
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
                {selectedFolderId && selectedFolderId !== "unfiled"
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
                      <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center shrink-0", a.enabled ? "bg-emerald-50 dark:bg-emerald-500/10" : "bg-muted")}>
                        <ModeIcon className={cn("w-5 h-5", a.enabled ? mInfo.color : "text-muted-foreground")} />
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
                          <DropdownMenuContent align="end" className="w-48">
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
                <FileText className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm font-medium">Unfiled</span>
              </button>
              {folders.map(f => (
                <button key={f.id} onClick={() => handleMoveToFolder(movingAutomationId, f.id)}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-muted/70 transition-colors text-left">
                  <Folder className={cn("w-4 h-4", f.color || "text-muted-foreground")} />
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
