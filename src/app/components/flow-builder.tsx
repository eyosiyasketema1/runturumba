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
  ChevronDown, ChevronRight, Globe, LayoutTemplate, BookOpen, Heart,
  Users, GraduationCap, Church, Search, X
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
// Journey templates — users start with an empty canvas but can load any of
// these pre-built templates from the Templates section in the palette.
// ---------------------------------------------------------------------------

type TemplateCategory = "Onboarding" | "Discipleship" | "Community" | "Outreach" | "Follow-up" | "Events";

type JourneyTemplate = {
  id: string;
  name: string;
  description: string;
  icon: any;
  tint: string;          // tailwind bg/text combo for the card
  category: TemplateCategory;
  nodeCount: number;
  nodes: Node[];
  edges: Edge[];
};

const EDGE = (id: string, src: string, tgt: string, srcHandle?: string, label?: string, color?: string): Edge => ({
  id, source: src, target: tgt, type: "smoothstep",
  ...(srcHandle ? { sourceHandle: srcHandle } : {}),
  ...(label ? { label, style: { stroke: color }, labelStyle: { fill: color, fontWeight: 700 } } : {}),
  markerEnd: { type: MarkerType.ArrowClosed, ...(color ? { color } : {}) },
});

const JOURNEY_TEMPLATES: JourneyTemplate[] = [
  // ── 1  New Believer Onboarding ─────────────────────────────────────────
  {
    id: "new-believer",
    name: "New Believer Onboarding",
    description: "Welcome journey with devotional, engagement check, and AI-personalized follow-up.",
    icon: BookOpen,
    tint: "bg-indigo-50 text-indigo-700 border-indigo-200",
    category: "Onboarding",
    nodeCount: 11,
    nodes: [
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
    ],
    edges: [
      EDGE("e1", "trigger", "welcome"),
      EDGE("e2", "welcome", "wait1"),
      EDGE("e3", "wait1",   "cond1"),
      EDGE("e4", "cond1",   "menu",     "yes", "YES",        "#10b981"),
      EDGE("e5", "cond1",   "reminder", "no",  "NO",         "#f43f5e"),
      EDGE("e6", "menu",    "personalize"),
      EDGE("e7", "reminder","wait2"),
      EDGE("e8", "wait2",   "cond2"),
      EDGE("e9", "cond2",   "notify",   "yes", "DROPOUT",    "#f43f5e"),
      EDGE("e10","cond2",   "rejoin",   "no",  "RE-ENGAGED", "#10b981"),
    ],
  },

  // ── 2  Baptism Preparation ─────────────────────────────────────────────
  {
    id: "baptism-prep",
    name: "Baptism Preparation",
    description: "4-week guided path to baptism with weekly lessons, mentor check-ins, and key milestone tracking.",
    icon: Church,
    tint: "bg-violet-50 text-violet-700 border-violet-200",
    category: "Discipleship",
    nodeCount: 10,
    nodes: [
      { id: "trigger",   type: "trigger",        position: { x: 300, y: 20  }, data: { type: "trigger",        title: "Trigger: Baptism Interest", body: "When a seeker indicates interest in baptism via form or mentor note." } },
      { id: "intro",     type: "send_message",   position: { x: 300, y: 200 }, data: { type: "send_message",   title: "Week 1: What is Baptism?", body: "Intro lesson on the meaning and significance of baptism.\nIncludes short video + reflection questions." } },
      { id: "ms1",       type: "milestone",      position: { x: 300, y: 400 }, data: { type: "milestone",      title: "Milestone: Week 1 Complete", body: "Seeker completed the intro lesson and reflection." } },
      { id: "wait1",     type: "wait",           position: { x: 300, y: 560 }, data: { type: "wait",           title: "Wait 7 days", body: "Proceed to Week 2 content" } },
      { id: "lesson2",   type: "send_message",   position: { x: 300, y: 720 }, data: { type: "send_message",   title: "Week 2: Faith & Repentance", body: "Deep dive into faith, repentance, and commitment to follow Christ." } },
      { id: "wait2",     type: "wait",           position: { x: 300, y: 900 }, data: { type: "wait",           title: "Wait 7 days", body: "Proceed to Week 3" } },
      { id: "lesson3",   type: "send_message",   position: { x: 300, y: 1060 }, data: { type: "send_message",  title: "Week 3: Living a New Life", body: "Practical guidance on living out faith daily after baptism." } },
      { id: "wait3",     type: "wait",           position: { x: 300, y: 1220 }, data: { type: "wait",           title: "Wait 7 days", body: "Final week — baptism day prep" } },
      { id: "lesson4",   type: "send_message",   position: { x: 300, y: 1380 }, data: { type: "send_message",  title: "Week 4: Baptism Day Prep", body: "Logistics, testimony preparation, and what to expect on baptism day." } },
      { id: "baptism",   type: "key_milestone",  position: { x: 300, y: 1560 }, data: { type: "key_milestone", title: "Key Milestone: Baptism", body: "Seeker is baptized! Mark this major faith milestone and notify the mentor coach." } },
    ],
    edges: [
      EDGE("b1","trigger","intro"),   EDGE("b2","intro","ms1"),     EDGE("b3","ms1","wait1"),
      EDGE("b4","wait1","lesson2"),   EDGE("b5","lesson2","wait2"), EDGE("b6","wait2","lesson3"),
      EDGE("b7","lesson3","wait3"),   EDGE("b8","wait3","lesson4"), EDGE("b9","lesson4","baptism"),
    ],
  },

  // ── 3  Prayer Partner Matching ─────────────────────────────────────────
  {
    id: "prayer-partner",
    name: "Prayer Partner Matching",
    description: "Pair seekers with prayer partners, check in weekly, and track engagement milestones.",
    icon: Heart,
    tint: "bg-rose-50 text-rose-700 border-rose-200",
    category: "Community",
    nodeCount: 8,
    nodes: [
      { id: "trigger",   type: "trigger",       position: { x: 300, y: 20  }, data: { type: "trigger",       title: "Trigger: Partner Request", body: "When a seeker requests a prayer partner through the app." } },
      { id: "match",     type: "ai_personalize", position: { x: 300, y: 200 }, data: { type: "ai_personalize", title: "AI Match Partners", body: "Claude matches the seeker with a suitable prayer partner based on language, timezone, and interests." } },
      { id: "intro_msg", type: "send_message",  position: { x: 300, y: 400 }, data: { type: "send_message",  title: "Send Introduction", body: "Introduce both partners to each other with a suggested first prayer topic." } },
      { id: "ms1",       type: "milestone",     position: { x: 300, y: 580 }, data: { type: "milestone",     title: "Milestone: First Prayer", body: "Partners completed their first prayer session together." } },
      { id: "wait1",     type: "wait",          position: { x: 300, y: 740 }, data: { type: "wait",          title: "Wait 7 days", body: "Weekly check-in" } },
      { id: "checkin",   type: "condition",     position: { x: 300, y: 920 }, data: { type: "condition",     title: "Weekly Check-in", body: "Did both partners pray together this week?", branches: [{ label: "Yes", tone: "yes" }, { label: "No", tone: "no" }] } },
      { id: "celebrate", type: "send_message",  position: { x: 60, y: 1120 }, data: { type: "send_message",  title: "Celebrate & Encourage", body: "Great work praying together! Here's your next prayer guide for the week." } },
      { id: "nudge",     type: "action",        position: { x: 540, y: 1120 }, data: { type: "action",       title: "Gentle Nudge", body: "Send a gentle reminder to reconnect with your prayer partner this week." } },
    ],
    edges: [
      EDGE("p1","trigger","match"),     EDGE("p2","match","intro_msg"),
      EDGE("p3","intro_msg","ms1"),     EDGE("p4","ms1","wait1"),
      EDGE("p5","wait1","checkin"),
      EDGE("p6","checkin","celebrate","yes","YES","#10b981"),
      EDGE("p7","checkin","nudge",    "no", "NO", "#f43f5e"),
    ],
  },

  // ── 4  Small Group Launch ──────────────────────────────────────────────
  {
    id: "small-group",
    name: "Small Group Launch",
    description: "Onboard seekers into a small group with welcome, intro session, weekly content, and graduation.",
    icon: Users,
    tint: "bg-emerald-50 text-emerald-700 border-emerald-200",
    category: "Community",
    nodeCount: 9,
    nodes: [
      { id: "trigger",   type: "trigger",       position: { x: 300, y: 20  }, data: { type: "trigger",       title: "Trigger: Group Signup", body: "When a seeker signs up for a small group via form or invite link." } },
      { id: "welcome",   type: "send_message",  position: { x: 300, y: 200 }, data: { type: "send_message",  title: "Welcome to the Group", body: "\"You've joined [Group Name]! Here's what to expect and how to prepare for your first session.\"" } },
      { id: "ms_join",   type: "milestone",     position: { x: 300, y: 380 }, data: { type: "milestone",     title: "Milestone: Joined Group", body: "Seeker officially enrolled in the small group." } },
      { id: "wait1",     type: "wait",          position: { x: 300, y: 540 }, data: { type: "wait",          title: "Wait until session day", body: "Dynamic wait until the first group session." } },
      { id: "session",   type: "send_message",  position: { x: 300, y: 700 }, data: { type: "send_message",  title: "Session Reminder & Content", body: "Reminder with session link, topic overview, and discussion questions for this week." } },
      { id: "cond",      type: "condition",     position: { x: 300, y: 880 }, data: { type: "condition",     title: "Did they attend?", body: "Check if the seeker attended the session.", branches: [{ label: "Yes", tone: "yes" }, { label: "No", tone: "no" }] } },
      { id: "recap",     type: "ai_personalize", position: { x: 60, y: 1080 }, data: { type: "ai_personalize", title: "AI Session Recap", body: "Send a personalized recap of discussion highlights and action items from the session." } },
      { id: "follow",    type: "action",        position: { x: 540, y: 1080 }, data: { type: "action",       title: "Follow Up", body: "Reach out to the seeker who missed the session with a summary and encouragement to attend next time." } },
      { id: "grad",      type: "key_milestone", position: { x: 300, y: 1280 }, data: { type: "key_milestone", title: "Key Milestone: Group Complete", body: "Seeker completed all sessions in the small group study!" } },
    ],
    edges: [
      EDGE("g1","trigger","welcome"),   EDGE("g2","welcome","ms_join"),
      EDGE("g3","ms_join","wait1"),     EDGE("g4","wait1","session"),
      EDGE("g5","session","cond"),
      EDGE("g6","cond","recap",  "yes","ATTENDED",   "#10b981"),
      EDGE("g7","cond","follow", "no", "MISSED",     "#f43f5e"),
      EDGE("g8","recap","grad"),        EDGE("g9","follow","grad"),
    ],
  },

  // ── 5  Bible Study Series ──────────────────────────────────────────────
  {
    id: "bible-study",
    name: "Bible Study Series",
    description: "6-week guided Bible study with daily readings, quizzes, and progressive milestones.",
    icon: GraduationCap,
    tint: "bg-amber-50 text-amber-700 border-amber-200",
    category: "Discipleship",
    nodeCount: 9,
    nodes: [
      { id: "trigger",  type: "trigger",       position: { x: 300, y: 20  }, data: { type: "trigger",       title: "Trigger: Study Enrollment", body: "When a seeker enrolls in a Bible study series." } },
      { id: "intro",    type: "send_message",  position: { x: 300, y: 200 }, data: { type: "send_message",  title: "Study Guide & Week 1", body: "Welcome! Here's your study guide and the first week's reading plan: Genesis 1–3 — The Beginning." } },
      { id: "ms1",      type: "milestone",     position: { x: 300, y: 380 }, data: { type: "milestone",     title: "Milestone: Week 1 Reading", body: "Completed Week 1 reading and reflection questions." } },
      { id: "menu",     type: "menu",          position: { x: 300, y: 560 }, data: { type: "menu",          title: "How are you feeling?", body: "Quick check-in after Week 1", choices: [{ label: "Inspired & want more", pct: 55, dot: "bg-emerald-500" }, { label: "Have questions", pct: 30, dot: "bg-amber-500" }, { label: "Struggling to keep up", pct: 15, dot: "bg-rose-500" }] } },
      { id: "ai_adapt", type: "ai_personalize", position: { x: 300, y: 780 }, data: { type: "ai_personalize", title: "AI Adapt Content", body: "Claude adjusts the next reading plan and pacing based on the seeker's response and engagement level." } },
      { id: "wait",     type: "wait",          position: { x: 300, y: 960 }, data: { type: "wait",          title: "Wait 7 days", body: "Next week's content" } },
      { id: "next",     type: "send_message",  position: { x: 300, y: 1120 }, data: { type: "send_message", title: "Next Week's Reading", body: "Your reading for this week is ready! Continue exploring God's Word at your own pace." } },
      { id: "ms_half",  type: "key_milestone", position: { x: 300, y: 1300 }, data: { type: "key_milestone", title: "Key Milestone: Halfway", body: "Seeker reached the halfway point of the Bible study series! Send a congratulations message." } },
      { id: "complete", type: "key_milestone", position: { x: 300, y: 1480 }, data: { type: "key_milestone", title: "Key Milestone: Study Complete", body: "Seeker completed the entire Bible study series. Certificate of completion!" } },
    ],
    edges: [
      EDGE("s1","trigger","intro"),  EDGE("s2","intro","ms1"),      EDGE("s3","ms1","menu"),
      EDGE("s4","menu","ai_adapt"),  EDGE("s5","ai_adapt","wait"),  EDGE("s6","wait","next"),
      EDGE("s7","next","ms_half"),   EDGE("s8","ms_half","complete"),
    ],
  },

  // ── 6  Re-engagement Campaign ──────────────────────────────────────────
  {
    id: "re-engage",
    name: "Re-engagement Campaign",
    description: "Win back inactive seekers with personalized outreach, escalating nudges, and mentor alerts.",
    icon: Bell,
    tint: "bg-sky-50 text-sky-700 border-sky-200",
    category: "Follow-up",
    nodeCount: 9,
    nodes: [
      { id: "trigger",   type: "trigger",       position: { x: 300, y: 20  }, data: { type: "trigger",       title: "Trigger: 14 Days Inactive", body: "When a seeker has had no engagement for 14 consecutive days." } },
      { id: "ai_msg",    type: "ai_personalize", position: { x: 300, y: 200 }, data: { type: "ai_personalize", title: "AI Personal Message", body: "Claude crafts a warm, personalized message referencing the seeker's last activity and interests." } },
      { id: "wait1",     type: "wait",          position: { x: 300, y: 380 }, data: { type: "wait",          title: "Wait 3 days", body: "Give them time to respond" } },
      { id: "cond1",     type: "condition",     position: { x: 300, y: 560 }, data: { type: "condition",     title: "Did they respond?", body: "Check if the seeker opened or replied to the message.", branches: [{ label: "Yes", tone: "yes" }, { label: "No", tone: "no" }] } },
      { id: "welcome_b", type: "send_message",  position: { x: 40, y: 760 },  data: { type: "send_message",  title: "Welcome Back!", body: "Great to see you! Here's some new content we picked just for you." } },
      { id: "nudge2",    type: "send_message",  position: { x: 560, y: 760 }, data: { type: "send_message",  title: "Second Nudge", body: "A short, caring message with a simple question to lower the barrier to re-engage." } },
      { id: "wait2",     type: "wait",          position: { x: 560, y: 940 }, data: { type: "wait",          title: "Wait 5 days", body: "Final check" } },
      { id: "cond2",     type: "condition",     position: { x: 560, y: 1100 }, data: { type: "condition",     title: "Still inactive?", body: "Check engagement after second nudge.", branches: [{ label: "Active", tone: "yes" }, { label: "Still inactive", tone: "no" }] } },
      { id: "mentor",    type: "action",        position: { x: 560, y: 1300 }, data: { type: "action",       title: "Alert Mentor", body: "Notify the assigned mentor about this at-risk seeker for personal outreach." } },
    ],
    edges: [
      EDGE("r1","trigger","ai_msg"),   EDGE("r2","ai_msg","wait1"),
      EDGE("r3","wait1","cond1"),
      EDGE("r4","cond1","welcome_b","yes","RESPONDED","#10b981"),
      EDGE("r5","cond1","nudge2",   "no", "SILENT",   "#f43f5e"),
      EDGE("r6","nudge2","wait2"),     EDGE("r7","wait2","cond2"),
      EDGE("r8","cond2","welcome_b","yes","RE-ENGAGED","#10b981"),
      EDGE("r9","cond2","mentor",   "no", "AT RISK",   "#f43f5e"),
    ],
  },

  // ── Quick-start templates (lightweight, 3–5 nodes) ─────────────────────
  // These provide a fast starting point for common scenarios.

  { id: "welcome-message",    name: "Welcome Message",           description: "Simple welcome flow — greet new contacts and assign a tag.",                            icon: Send,          tint: "bg-blue-50 text-blue-700 border-blue-200",       category: "Onboarding",    nodeCount: 3, nodes: [
    { id: "t", type: "trigger", position:{x:300,y:20}, data:{type:"trigger",title:"Trigger: New Contact",body:"When a new contact is added to the system."} },
    { id: "m", type: "send_message", position:{x:300,y:200}, data:{type:"send_message",title:"Welcome Message",body:"\"Hi! Welcome to our community. We're glad you're here.\""} },
    { id: "a", type: "action", position:{x:300,y:380}, data:{type:"action",title:"Tag: welcomed",body:"Apply 'welcomed' tag to the contact."} },
  ], edges: [EDGE("w1","t","m"), EDGE("w2","m","a")] },

  { id: "mentor-intro",       name: "Mentor Introduction",       description: "Introduce a newly matched mentor to their seeker with context.",                       icon: Users,         tint: "bg-teal-50 text-teal-700 border-teal-200",       category: "Onboarding",    nodeCount: 4, nodes: [
    { id: "t", type: "trigger", position:{x:300,y:20}, data:{type:"trigger",title:"Trigger: Mentor Matched",body:"When a mentor is assigned to a seeker."} },
    { id: "ai", type: "ai_personalize", position:{x:300,y:200}, data:{type:"ai_personalize",title:"AI Craft Introduction",body:"Claude writes a warm introduction using seeker interests, language, and background."} },
    { id: "m", type: "send_message", position:{x:300,y:400}, data:{type:"send_message",title:"Send to Both",body:"Send the personalized intro to both mentor and seeker."} },
    { id: "ms", type: "milestone", position:{x:300,y:580}, data:{type:"milestone",title:"Milestone: First Contact",body:"Mark that the mentor and seeker have been introduced."} },
  ], edges: [EDGE("mi1","t","ai"), EDGE("mi2","ai","m"), EDGE("mi3","m","ms")] },

  { id: "testimony-collection", name: "Testimony Collection",    description: "Invite seekers to share their testimony after a key milestone.",                       icon: BookOpen,      tint: "bg-amber-50 text-amber-700 border-amber-200",    category: "Discipleship",  nodeCount: 4, nodes: [
    { id: "t", type: "trigger", position:{x:300,y:20}, data:{type:"trigger",title:"Trigger: Milestone Reached",body:"When seeker completes baptism or salvation milestone."} },
    { id: "w", type: "wait", position:{x:300,y:200}, data:{type:"wait",title:"Wait 3 days",body:"Give them time to reflect."} },
    { id: "m", type: "send_message", position:{x:300,y:380}, data:{type:"send_message",title:"Share Your Story",body:"\"We'd love to hear your testimony! Would you like to share what God has done in your life?\""} },
    { id: "km", type: "key_milestone", position:{x:300,y:560}, data:{type:"key_milestone",title:"Key Milestone: Testimony Shared",body:"Seeker shared their testimony — celebrate and archive it."} },
  ], edges: [EDGE("tc1","t","w"), EDGE("tc2","w","m"), EDGE("tc3","m","km")] },

  { id: "daily-devotional",   name: "Daily Devotional Drip",     description: "7-day devotional series with daily messages and completion tracking.",                  icon: BookOpen,      tint: "bg-orange-50 text-orange-700 border-orange-200",  category: "Discipleship",  nodeCount: 5, nodes: [
    { id: "t", type: "trigger", position:{x:300,y:20}, data:{type:"trigger",title:"Trigger: Enrolled in Devotional",body:"When seeker opts into the 7-day devotional."} },
    { id: "m1", type: "send_message", position:{x:300,y:200}, data:{type:"send_message",title:"Day 1: God's Love",body:"Your first devotional: 'For God so loved the world…' (John 3:16)"} },
    { id: "w", type: "wait", position:{x:300,y:380}, data:{type:"wait",title:"Wait 1 day",body:"Send next devotional tomorrow."} },
    { id: "ai", type: "ai_personalize", position:{x:300,y:560}, data:{type:"ai_personalize",title:"AI Next Devotional",body:"Claude picks the next devotional based on seeker engagement and reading pace."} },
    { id: "ms", type: "key_milestone", position:{x:300,y:740}, data:{type:"key_milestone",title:"Key Milestone: Devotional Complete",body:"Seeker completed the 7-day devotional series!"} },
  ], edges: [EDGE("dd1","t","m1"), EDGE("dd2","m1","w"), EDGE("dd3","w","ai"), EDGE("dd4","ai","ms")] },

  { id: "event-invite",       name: "Event Invitation",          description: "Invite contacts to an event with RSVP tracking and reminders.",                        icon: Bell,          tint: "bg-pink-50 text-pink-700 border-pink-200",       category: "Events",        nodeCount: 5, nodes: [
    { id: "t", type: "trigger", position:{x:300,y:20}, data:{type:"trigger",title:"Trigger: Event Created",body:"When a new event is published."} },
    { id: "m", type: "send_message", position:{x:300,y:200}, data:{type:"send_message",title:"Event Invitation",body:"\"You're invited! Join us for [Event Name] on [Date]. Tap below to RSVP.\""} },
    { id: "c", type: "condition", position:{x:300,y:400}, data:{type:"condition",title:"Did they RSVP?",body:"Check if the contact responded to the invitation.", branches:[{label:"Yes",tone:"yes"},{label:"No",tone:"no"}]} },
    { id: "r", type: "send_message", position:{x:60,y:600}, data:{type:"send_message",title:"Confirmation",body:"\"Great, you're registered! We'll send a reminder the day before.\""} },
    { id: "n", type: "action", position:{x:540,y:600}, data:{type:"action",title:"Reminder Nudge",body:"Send a follow-up reminder about the event 2 days before."} },
  ], edges: [EDGE("ei1","t","m"), EDGE("ei2","m","c"), EDGE("ei3","c","r","yes","RSVP'D","#10b981"), EDGE("ei4","c","n","no","NO REPLY","#f43f5e")] },

  { id: "event-followup",     name: "Post-Event Follow-up",      description: "Follow up with attendees after an event with next steps.",                             icon: Heart,         tint: "bg-fuchsia-50 text-fuchsia-700 border-fuchsia-200", category: "Events",     nodeCount: 4, nodes: [
    { id: "t", type: "trigger", position:{x:300,y:20}, data:{type:"trigger",title:"Trigger: Event Ended",body:"When the event date has passed."} },
    { id: "m", type: "send_message", position:{x:300,y:200}, data:{type:"send_message",title:"Thank You",body:"\"Thank you for joining us! We hope it was a blessing. Here are some resources to continue your journey.\""} },
    { id: "menu", type: "menu", position:{x:300,y:400}, data:{type:"menu",title:"What's Next?",body:"What would you like to do?", choices:[{label:"Join a small group",dot:"bg-emerald-500"},{label:"Connect with a mentor",dot:"bg-blue-500"},{label:"Get more content",dot:"bg-violet-500"}]} },
    { id: "ai", type: "ai_personalize", position:{x:300,y:620}, data:{type:"ai_personalize",title:"AI Route Next Step",body:"Claude routes the seeker to the appropriate journey based on their choice."} },
  ], edges: [EDGE("ef1","t","m"), EDGE("ef2","m","menu"), EDGE("ef3","menu","ai")] },

  { id: "outreach-campaign",  name: "Outreach Campaign",         description: "Multi-channel outreach to new contacts with AI-crafted messaging.",                    icon: Globe,         tint: "bg-cyan-50 text-cyan-700 border-cyan-200",       category: "Outreach",      nodeCount: 5, nodes: [
    { id: "t", type: "trigger", position:{x:300,y:20}, data:{type:"trigger",title:"Trigger: Campaign Start",body:"When the outreach campaign is launched."} },
    { id: "ai", type: "ai_personalize", position:{x:300,y:200}, data:{type:"ai_personalize",title:"AI Craft Message",body:"Claude crafts a culturally appropriate message based on the contact's language and background."} },
    { id: "m", type: "send_message", position:{x:300,y:400}, data:{type:"send_message",title:"Initial Outreach",body:"Send the personalized outreach message."} },
    { id: "c", type: "condition", position:{x:300,y:600}, data:{type:"condition",title:"Response received?",body:"Did the contact respond?", branches:[{label:"Yes",tone:"yes"},{label:"No",tone:"no"}]} },
    { id: "a", type: "action", position:{x:300,y:800}, data:{type:"action",title:"Notify Team",body:"Alert the outreach team about respondents for follow-up."} },
  ], edges: [EDGE("oc1","t","ai"), EDGE("oc2","ai","m"), EDGE("oc3","m","c"), EDGE("oc4","c","a","yes","RESPONDED","#10b981")] },

  { id: "gospel-presentation", name: "Gospel Presentation",      description: "Step-by-step gospel sharing journey with response tracking.",                          icon: BookOpen,      tint: "bg-indigo-50 text-indigo-700 border-indigo-200",  category: "Outreach",      nodeCount: 5, nodes: [
    { id: "t", type: "trigger", position:{x:300,y:20}, data:{type:"trigger",title:"Trigger: Seeker Ready",body:"When mentor marks seeker as ready for gospel presentation."} },
    { id: "m1", type: "send_message", position:{x:300,y:200}, data:{type:"send_message",title:"The Gospel Message",body:"Share a clear, loving presentation of the gospel message."} },
    { id: "menu", type: "menu", position:{x:300,y:400}, data:{type:"menu",title:"How do you feel?",body:"After hearing the gospel…", choices:[{label:"I want to accept",dot:"bg-emerald-500"},{label:"I have questions",dot:"bg-amber-500"},{label:"Not ready yet",dot:"bg-slate-400"}]} },
    { id: "km", type: "key_milestone", position:{x:60,y:620}, data:{type:"key_milestone",title:"Key Milestone: Salvation",body:"The seeker made a decision to follow Christ!"} },
    { id: "ai", type: "ai_personalize", position:{x:540,y:620}, data:{type:"ai_personalize",title:"AI Address Questions",body:"Claude provides thoughtful answers to the seeker's questions about faith."} },
  ], edges: [EDGE("gp1","t","m1"), EDGE("gp2","m1","menu"), EDGE("gp3","menu","km"), EDGE("gp4","menu","ai")] },

  { id: "accountability",     name: "Accountability Check-in",   description: "Weekly accountability check-in loop between mentor and seeker.",                       icon: CheckCircle2,  tint: "bg-emerald-50 text-emerald-700 border-emerald-200", category: "Follow-up",  nodeCount: 5, nodes: [
    { id: "t", type: "trigger", position:{x:300,y:20}, data:{type:"trigger",title:"Trigger: Weekly (Monday)",body:"Every Monday morning, send check-in."} },
    { id: "m", type: "send_message", position:{x:300,y:200}, data:{type:"send_message",title:"Weekly Check-in",body:"\"How was your week? Share your highs and lows, and any prayer requests.\""} },
    { id: "c", type: "condition", position:{x:300,y:400}, data:{type:"condition",title:"Responded?",body:"Did the seeker reply within 48 hours?", branches:[{label:"Yes",tone:"yes"},{label:"No",tone:"no"}]} },
    { id: "ms", type: "milestone", position:{x:60,y:600}, data:{type:"milestone",title:"Milestone: Check-in Done",body:"Weekly check-in completed — track streak."} },
    { id: "a", type: "action", position:{x:540,y:600}, data:{type:"action",title:"Notify Mentor",body:"Alert mentor that seeker missed this week's check-in."} },
  ], edges: [EDGE("ac1","t","m"), EDGE("ac2","m","c"), EDGE("ac3","c","ms","yes","REPLIED","#10b981"), EDGE("ac4","c","a","no","MISSED","#f43f5e")] },

  { id: "graduation-path",    name: "Graduation Path",           description: "Track a seeker through final milestones before graduating from mentorship.",            icon: GraduationCap, tint: "bg-violet-50 text-violet-700 border-violet-200",  category: "Discipleship",  nodeCount: 5, nodes: [
    { id: "t", type: "trigger", position:{x:300,y:20}, data:{type:"trigger",title:"Trigger: All Milestones Done",body:"When seeker completes all core milestones."} },
    { id: "m", type: "send_message", position:{x:300,y:200}, data:{type:"send_message",title:"Graduation Notice",body:"\"Congratulations! You've completed all your discipleship milestones. Let's talk about what's next.\""} },
    { id: "menu", type: "menu", position:{x:300,y:400}, data:{type:"menu",title:"Next Step",body:"What would you like to do next?", choices:[{label:"Become a mentor",dot:"bg-emerald-500"},{label:"Join leadership",dot:"bg-violet-500"},{label:"Continue growing",dot:"bg-blue-500"}]} },
    { id: "km", type: "key_milestone", position:{x:300,y:620}, data:{type:"key_milestone",title:"Key Milestone: Graduated",body:"Seeker has officially graduated from the mentorship program!"} },
    { id: "a", type: "action", position:{x:300,y:800}, data:{type:"action",title:"Notify Leadership",body:"Alert mentor coach and leadership about the new graduate."} },
  ], edges: [EDGE("gr1","t","m"), EDGE("gr2","m","menu"), EDGE("gr3","menu","km"), EDGE("gr4","km","a")] },

  { id: "dropout-rescue",     name: "Dropout Prevention",        description: "3-stage intervention for seekers showing disengagement patterns.",                     icon: AlertCircle,   tint: "bg-red-50 text-red-700 border-red-200",           category: "Follow-up",     nodeCount: 5, nodes: [
    { id: "t", type: "trigger", position:{x:300,y:20}, data:{type:"trigger",title:"Trigger: Engagement Drop",body:"When engagement score drops below 30%."} },
    { id: "ai", type: "ai_personalize", position:{x:300,y:200}, data:{type:"ai_personalize",title:"AI Personal Outreach",body:"Claude crafts a caring message referencing the seeker's journey so far."} },
    { id: "w", type: "wait", position:{x:300,y:400}, data:{type:"wait",title:"Wait 5 days",body:"Allow time for response."} },
    { id: "c", type: "condition", position:{x:300,y:580}, data:{type:"condition",title:"Re-engaged?",body:"Did the seeker respond or show activity?", branches:[{label:"Yes",tone:"yes"},{label:"No",tone:"no"}]} },
    { id: "a", type: "action", position:{x:540,y:780}, data:{type:"action",title:"Escalate to Mentor Coach",body:"Flag this seeker for personal intervention by the mentor coach."} },
  ], edges: [EDGE("dp1","t","ai"), EDGE("dp2","ai","w"), EDGE("dp3","w","c"), EDGE("dp4","c","a","no","STILL INACTIVE","#f43f5e")] },

  { id: "new-volunteer",      name: "Volunteer Onboarding",      description: "Onboard new volunteers with training materials and check-ins.",                        icon: Users,         tint: "bg-lime-50 text-lime-700 border-lime-200",        category: "Onboarding",    nodeCount: 4, nodes: [
    { id: "t", type: "trigger", position:{x:300,y:20}, data:{type:"trigger",title:"Trigger: Volunteer Signup",body:"When someone signs up to volunteer."} },
    { id: "m", type: "send_message", position:{x:300,y:200}, data:{type:"send_message",title:"Welcome & Training",body:"\"Welcome to the team! Here's your training guide and what to expect in your first week.\""} },
    { id: "w", type: "wait", position:{x:300,y:380}, data:{type:"wait",title:"Wait 7 days",body:"Check in after first week."} },
    { id: "ms", type: "milestone", position:{x:300,y:560}, data:{type:"milestone",title:"Milestone: Training Complete",body:"Volunteer completed initial training."} },
  ], edges: [EDGE("nv1","t","m"), EDGE("nv2","m","w"), EDGE("nv3","w","ms")] },
];

const EMPTY_CANVAS: { nodes: Node[]; edges: Edge[] } = {
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
  /** @deprecated No longer used — Journey Builder always starts empty with a template picker. */
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
  flowName, status, stats, onBack, onSave, onPublish,
  webhooks, onToggleWebhook, onDeleteWebhook, onAddWebhook,
}: Required<Pick<FlowBuilderProps, "flowName" | "status" | "stats" | "onBack" | "webhooks">> & Pick<FlowBuilderProps, "onSave" | "onPublish" | "onToggleWebhook" | "onDeleteWebhook" | "onAddWebhook">) {
  // Always start empty — users pick a template from the palette if they want one.
  const [nodes, setNodes] = useState<Node[]>(EMPTY_CANVAS.nodes);
  const [edges, setEdges] = useState<Edge[]>(EMPTY_CANVAS.edges);
  const [name, setName] = useState(flowName);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [webhooksOpen, setWebhooksOpen] = useState(false);
  const [isAddWebhookOpen, setIsAddWebhookOpen] = useState(false);
  const [isTemplateGalleryOpen, setIsTemplateGalleryOpen] = useState(false);
  const [isSaveTemplateOpen, setIsSaveTemplateOpen] = useState(false);

  const handleLoadTemplate = useCallback((tpl: JourneyTemplate) => {
    setNodes(tpl.nodes);
    setEdges(tpl.edges);
    setName(tpl.name);
    setSelectedNodeId(null);
    toast.success(`Template "${tpl.name}" loaded`);
  }, []);

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
          <Button variant="outline" size="sm" onClick={() => setIsSaveTemplateOpen(true)}>
            <LayoutTemplate className="w-3.5 h-3.5" /> Save as Template
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

          {/* ── Webhooks section — below node types ── */}
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

          {/* ── Templates — browse button opens full gallery modal ── */}
          <div className="mt-6 border-t border-border pt-4">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider pb-3">Templates</p>
            <Button
              variant="outline"
              size="sm"
              className="w-full text-xs h-9 justify-start gap-2"
              onClick={() => setIsTemplateGalleryOpen(true)}
            >
              <LayoutTemplate className="w-4 h-4 text-primary" />
              Browse Templates
              <Badge variant="secondary" className="text-[10px] ml-auto">{JOURNEY_TEMPLATES.length}</Badge>
            </Button>
            <p className="text-[10px] text-muted-foreground mt-2 leading-relaxed">
              Choose from pre-built journey templates to get started quickly.
            </p>
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

      {/* Template Gallery Modal */}
      <TemplateGalleryModal
        isOpen={isTemplateGalleryOpen}
        onClose={() => setIsTemplateGalleryOpen(false)}
        onSelect={(tpl) => { handleLoadTemplate(tpl); setIsTemplateGalleryOpen(false); }}
      />

      {/* Save as Template Modal */}
      <SaveTemplateModal
        isOpen={isSaveTemplateOpen}
        onClose={() => setIsSaveTemplateOpen(false)}
        onSave={(tplName) => {
          toast.success(`Journey saved as template "${tplName}"`);
          setIsSaveTemplateOpen(false);
        }}
        defaultName={name}
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
// Template Gallery — full-screen modal with search, category tabs, and grid
// ---------------------------------------------------------------------------

const TEMPLATE_CATEGORIES: { id: TemplateCategory | "All"; label: string }[] = [
  { id: "All",          label: "All" },
  { id: "Onboarding",   label: "Onboarding" },
  { id: "Discipleship",  label: "Discipleship" },
  { id: "Community",    label: "Community" },
  { id: "Outreach",     label: "Outreach" },
  { id: "Follow-up",    label: "Follow-up" },
  { id: "Events",       label: "Events" },
];

function TemplateGalleryModal({
  isOpen, onClose, onSelect,
}: { isOpen: boolean; onClose: () => void; onSelect: (tpl: JourneyTemplate) => void }) {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<TemplateCategory | "All">("All");

  const filtered = useMemo(() => {
    return JOURNEY_TEMPLATES.filter(t => {
      const matchCat = category === "All" || t.category === category;
      const q = search.toLowerCase();
      const matchSearch = !q || t.name.toLowerCase().includes(q) || t.description.toLowerCase().includes(q);
      return matchCat && matchSearch;
    });
  }, [search, category]);

  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = { All: JOURNEY_TEMPLATES.length };
    for (const t of JOURNEY_TEMPLATES) counts[t.category] = (counts[t.category] || 0) + 1;
    return counts;
  }, []);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-background rounded-xl shadow-2xl border border-border w-[90vw] max-w-[960px] h-[80vh] max-h-[700px] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between gap-4 px-6 py-4 border-b border-border shrink-0">
          <div>
            <h2 className="text-lg font-bold text-foreground">Journey Templates</h2>
            <p className="text-xs text-muted-foreground mt-0.5">Choose a template to start building your journey</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
              <Input
                placeholder="Search templates..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="pl-9 h-8 text-xs w-[220px]"
              />
            </div>
            <button onClick={onClose} className="p-1.5 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Category tabs */}
        <div className="flex items-center gap-1 px-6 py-2.5 border-b border-border shrink-0 overflow-x-auto">
          {TEMPLATE_CATEGORIES.map(cat => (
            <button
              key={cat.id}
              onClick={() => setCategory(cat.id)}
              className={cn(
                "px-3 py-1.5 text-xs font-semibold rounded-md transition-all whitespace-nowrap flex items-center gap-1.5",
                category === cat.id
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              {cat.label}
              <span className={cn(
                "text-[10px] tabular-nums",
                category === cat.id ? "opacity-80" : "opacity-50"
              )}>
                {categoryCounts[cat.id] || 0}
              </span>
            </button>
          ))}
        </div>

        {/* Grid */}
        <div className="flex-1 overflow-y-auto p-6">
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <LayoutTemplate className="w-10 h-10 text-muted-foreground/30 mb-3" />
              <p className="text-sm font-semibold text-muted-foreground">No templates found</p>
              <p className="text-xs text-muted-foreground/70 mt-1">Try a different search term or category.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {filtered.map(tpl => {
                const TplIcon = tpl.icon;
                return (
                  <button
                    key={tpl.id}
                    onClick={() => onSelect(tpl)}
                    className={cn(
                      "text-left p-4 rounded-xl border-2 transition-all hover:shadow-md hover:scale-[1.01] group",
                      tpl.tint
                    )}
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-9 h-9 rounded-lg bg-white/60 flex items-center justify-center shrink-0 shadow-sm">
                        <TplIcon className="w-4.5 h-4.5 opacity-80" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-bold leading-snug">{tpl.name}</p>
                        <p className="text-[11px] opacity-70 leading-relaxed mt-1 line-clamp-2">{tpl.description}</p>
                        <div className="flex items-center gap-2 mt-2">
                          <span className="text-[10px] opacity-50 font-semibold">{tpl.nodeCount} nodes</span>
                          <span className="text-[10px] opacity-40">·</span>
                          <span className="text-[10px] opacity-50 font-medium">{tpl.category}</span>
                        </div>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Save as Template modal
// ---------------------------------------------------------------------------

function SaveTemplateModal({
  isOpen, onClose, onSave, defaultName,
}: { isOpen: boolean; onClose: () => void; onSave: (name: string) => void; defaultName: string }) {
  const [tplName, setTplName] = useState(defaultName);

  React.useEffect(() => { if (isOpen) setTplName(defaultName); }, [isOpen, defaultName]);

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Save as Template" size="sm">
      <div className="space-y-4">
        <div className="grid gap-2">
          <Label className="text-xs font-semibold">Template Name</Label>
          <Input
            placeholder="e.g. My Onboarding Flow"
            value={tplName}
            onChange={e => setTplName(e.target.value)}
            className="h-9 text-sm"
            autoFocus
          />
          <p className="text-xs text-muted-foreground">This template will be saved and available for future journeys.</p>
        </div>
        <div className="flex justify-end gap-2">
          <Button variant="outline" size="sm" onClick={onClose}>Cancel</Button>
          <Button size="sm" disabled={!tplName.trim()} onClick={() => onSave(tplName.trim())}>
            <LayoutTemplate className="w-3.5 h-3.5" />
            Save Template
          </Button>
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
