// Automation builders — Basic and Sequence full-page editors.
//
// UX pattern (ManyChat-inspired):
//   Header: back · editable name · status · Save Draft · Publish
//   Body:   left config column · right live channel preview column
//
// Shared primitives (ChannelPreview, BuilderHeader) keep both builders visually
// consistent with the Flow builder while matching each type's mental model.

import React, { useMemo, useState } from "react";
import {
  ArrowLeft, Save, MessageSquare, Check, Plus, Trash2, ChevronUp,
  ChevronDown, Hash, Zap, Bell, AlertCircle, Clock, Sparkles,
  Send, Smartphone, Globe, MessageCircle, GripVertical,
  Eye, MousePointerClick, Users, TrendingDown, BarChart3, Activity,
  Reply, Droplet, Workflow, Megaphone
} from "lucide-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Textarea } from "./ui/textarea";
import { Label } from "./ui/label";
import { Badge } from "./ui/badge";
import { Switch } from "./ui/switch";
import { toast } from "sonner";
import { cn } from "./types";

// ============================================================================
// Shared types
// ============================================================================

export type BasicTriggerKind = "welcome" | "default_reply" | "keyword" | "event";

export type ChannelId = "telegram" | "whatsapp" | "sms" | "web";

export interface BasicAutomationDraft {
  id?: string;
  name: string;
  triggerKind: BasicTriggerKind;
  keyword?: string;          // for keyword triggers
  eventName?: string;        // for event triggers
  channels: ChannelId[];     // multiple channels selected
  message: string;
  quickReplies: string[];
}

export interface SequenceStep {
  id: string;
  delay: { amount: number; unit: "minutes" | "hours" | "days" };
  message: string;
  aiPersonalize: boolean;
  quickReplies: string[];
}

export interface SequenceDraft {
  id?: string;
  name: string;
  trigger: "intake_complete" | "match_accepted" | "tag_added" | "manual";
  channels: ChannelId[];     // channel selected at sequence level via start trigger
  steps: SequenceStep[];
}

// ============================================================================
// Shared: header
// ============================================================================

function BuilderHeader({
  name, onNameChange, status, onBack, onSave, onPublish, typeLabel, runs,
}: {
  name: string;
  onNameChange: (v: string) => void;
  status: "draft" | "active" | "stopped";
  onBack: () => void;
  onSave: () => void;
  onPublish: () => void;
  typeLabel: string;
  runs?: number;
}) {
  return (
    <header className="flex items-center justify-between gap-4 px-6 py-3 bg-background border-b border-border">
      <div className="flex items-center gap-3 min-w-0 flex-1">
        <button
          onClick={onBack}
          className="p-1.5 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
          aria-label="Back"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div className="min-w-0 flex-1">
          <Input
            value={name}
            onChange={(e) => onNameChange(e.target.value)}
            className="h-8 text-base font-bold border-none px-2 shadow-none focus-visible:ring-1 focus-visible:ring-ring max-w-[360px]"
            aria-label="Automation name"
          />
          <div className="flex items-center gap-2 mt-0.5 px-2">
            <span className="text-xs text-muted-foreground">{typeLabel}</span>
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
            {runs !== undefined && runs > 0 && (
              <>
                <span className="text-muted-foreground">·</span>
                <span className="text-xs text-muted-foreground">{runs.toLocaleString()} runs</span>
              </>
            )}
          </div>
        </div>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <Button variant="outline" size="sm" onClick={onSave}>
          <Save className="w-3.5 h-3.5" /> Save Draft
        </Button>
        <Button size="sm" onClick={onPublish}>Publish</Button>
      </div>
    </header>
  );
}

// ============================================================================
// Shared: channel preview
// ============================================================================

const ALL_CHANNELS: ChannelId[] = ["telegram", "whatsapp", "sms", "web"];

const CHANNELS: { id: ChannelId; label: string; icon: any }[] = [
  { id: "telegram", label: "Telegram", icon: Send },
  { id: "whatsapp", label: "WhatsApp", icon: MessageCircle },
  { id: "sms",      label: "SMS",      icon: Smartphone },
  { id: "web",      label: "Web",      icon: Globe },
];

/** Multi-select channel picker with "All" toggle */
function MultiChannelSelector({
  selected, onChange,
}: { selected: ChannelId[]; onChange: (next: ChannelId[]) => void }) {
  const allSelected = selected.length === ALL_CHANNELS.length;

  const toggle = (id: ChannelId) => {
    if (selected.includes(id)) {
      const next = selected.filter(c => c !== id);
      onChange(next.length === 0 ? ALL_CHANNELS : next);
    } else {
      onChange([...selected, id]);
    }
  };

  return (
    <div className="flex items-center gap-1.5 flex-wrap">
      <button
        onClick={() => onChange(ALL_CHANNELS)}
        className={cn(
          "flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-full border transition-all",
          allSelected
            ? "bg-primary text-primary-foreground border-primary"
            : "bg-background text-muted-foreground border-border hover:border-foreground/30"
        )}
      >
        All Channels
      </button>
      {CHANNELS.map(c => {
        const isOn = selected.includes(c.id);
        const Icon = c.icon;
        return (
          <button
            key={c.id}
            onClick={() => toggle(c.id)}
            className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-full border transition-all",
              isOn
                ? "bg-primary/10 text-primary border-primary/40"
                : "bg-background text-muted-foreground border-border hover:border-foreground/30"
            )}
          >
            <Icon className="w-3 h-3" />
            {c.label}
            {isOn && <Check className="w-3 h-3" />}
          </button>
        );
      })}
    </div>
  );
}

function ChannelPreview({
  channels: selectedChannels, message, quickReplies = [],
}: { channels?: ChannelId[]; message: string; quickReplies?: string[] }) {
  // Show all channels if none specified, or only the selected ones
  const previewChannels = (!selectedChannels || selectedChannels.length === ALL_CHANNELS.length)
    ? ALL_CHANNELS
    : selectedChannels;
  const [channel, setChannel] = useState<ChannelId>(previewChannels[0] ?? "telegram");
  const active = previewChannels.includes(channel) ? channel : previewChannels[0] ?? "telegram";
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-1 bg-muted/60 rounded-md p-0.5 w-fit">
        {CHANNELS.filter(c => previewChannels.includes(c.id)).map(c => {
          const isActive = active === c.id;
          const Icon = c.icon;
          return (
            <button
              key={c.id}
              onClick={() => setChannel(c.id)}
              className={cn(
                "flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold rounded transition-all",
                isActive ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Icon className="w-3 h-3" />
              <span>{c.label}</span>
            </button>
          );
        })}
      </div>

      <div className="bg-muted rounded-2xl p-4 min-h-[280px]">
        <div className="text-xs text-muted-foreground text-center mb-3 font-medium">
          {CHANNELS.find(c => c.id === active)?.label} preview
        </div>
        <div className="space-y-2">
          {active === "sms" ? (
            <SmsBubble text={message || "Your message will appear here..."} />
          ) : active === "web" ? (
            <WebCard text={message || "Your message will appear here..."} replies={quickReplies} />
          ) : (
            <ChatBubble
              text={message || "Your message will appear here..."}
              replies={quickReplies}
              channel={active}
            />
          )}
        </div>
      </div>
    </div>
  );
}

function ChatBubble({
  text, replies, channel,
}: { text: string; replies: string[]; channel: Channel }) {
  const bubbleColor = channel === "whatsapp" ? "bg-emerald-50 border-emerald-100" : "bg-background border-border";
  return (
    <div className="space-y-2">
      <div className={cn("rounded-2xl rounded-tl-sm border p-3 max-w-[85%] shadow-sm", bubbleColor)}>
        <p className="text-sm text-foreground whitespace-pre-wrap leading-relaxed">{text}</p>
      </div>
      {replies.length > 0 && (
        <div className="flex flex-wrap gap-2 pt-1">
          {replies.map((r, i) => (
            <button
              key={i}
              type="button"
              className="px-3 py-1.5 rounded-full bg-background border border-primary/30 text-xs font-semibold text-primary hover:bg-primary/5 transition-colors"
            >
              {r}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function SmsBubble({ text }: { text: string }) {
  // SMS has no formatting, shows segment count. Each segment is ~160 chars.
  const segments = Math.max(1, Math.ceil(text.length / 160));
  return (
    <div className="space-y-2">
      <div className="rounded-2xl rounded-tl-sm bg-background border border-border p-3 max-w-[85%] shadow-sm">
        <p className="text-sm text-foreground whitespace-pre-wrap leading-relaxed">{text}</p>
      </div>
      <p className="text-xs text-muted-foreground pl-1">
        {text.length} chars · {segments} SMS segment{segments === 1 ? "" : "s"}
      </p>
    </div>
  );
}

function WebCard({ text, replies }: { text: string; replies: string[] }) {
  return (
    <div className="bg-background rounded-xl border border-border p-4 shadow-sm">
      <p className="text-sm text-foreground whitespace-pre-wrap leading-relaxed">{text}</p>
      {replies.length > 0 && (
        <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t border-border">
          {replies.map((r, i) => (
            <button
              key={i}
              type="button"
              className="px-3 py-1.5 rounded-md bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90 transition-colors"
            >
              {r}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ============================================================================
// Helper: quick replies editor
// ============================================================================

function QuickRepliesEditor({
  values, onChange,
}: { values: string[]; onChange: (next: string[]) => void }) {
  const [draft, setDraft] = useState("");
  const add = () => {
    const v = draft.trim();
    if (!v || values.includes(v)) return;
    onChange([...values, v]);
    setDraft("");
  };
  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-1.5">
        {values.map((v, i) => (
          <span
            key={i}
            className="inline-flex items-center gap-1 pl-2.5 pr-1 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold"
          >
            {v}
            <button
              onClick={() => onChange(values.filter((_, idx) => idx !== i))}
              className="w-4 h-4 rounded-full hover:bg-primary/20 flex items-center justify-center"
              aria-label={`Remove ${v}`}
            >
              ×
            </button>
          </span>
        ))}
      </div>
      <div className="flex items-center gap-2">
        <Input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); add(); } }}
          placeholder="Add a quick reply (press Enter)"
          className="h-9 text-sm"
        />
        <Button variant="outline" size="sm" onClick={add} disabled={!draft.trim()}>
          <Plus className="w-3.5 h-3.5" /> Add
        </Button>
      </div>
    </div>
  );
}

// ============================================================================
// BASIC AUTOMATION BUILDER
// ============================================================================

const BASIC_TRIGGERS: {
  id: BasicTriggerKind; label: string; description: string; icon: any; tint: string;
}[] = [
  { id: "welcome",       label: "Welcome Message",  description: "Auto-sent on the seeker's first message on any channel",          icon: MessageSquare, tint: "bg-blue-50 text-blue-700 border-blue-200" },
  { id: "default_reply", label: "Default Reply",    description: "Fallback when no keyword or flow matches an incoming message",     icon: AlertCircle,   tint: "bg-amber-50 text-amber-700 border-amber-200" },
  { id: "keyword",       label: "Keyword Trigger",  description: "Reply when a seeker's message contains specific words",            icon: Hash,          tint: "bg-violet-50 text-violet-700 border-violet-200" },
  { id: "event",         label: "Event Trigger",    description: "React to system events: intake_complete, match_accepted, etc.",    icon: Zap,           tint: "bg-pink-50 text-pink-700 border-pink-200" },
];

export interface BasicAutomationBuilderProps {
  initial?: Partial<BasicAutomationDraft>;
  status?: "draft" | "active" | "stopped";
  runs?: number;
  onBack: () => void;
  onSave: (draft: BasicAutomationDraft) => void;
  onPublish: (draft: BasicAutomationDraft) => void;
}

export function BasicAutomationBuilder({
  initial, status = "draft", runs, onBack, onSave, onPublish,
}: BasicAutomationBuilderProps) {
  const [name, setName]               = useState(initial?.name ?? "New Basic Automation");
  const [triggerKind, setTriggerKind] = useState<BasicTriggerKind>(initial?.triggerKind ?? "welcome");
  const [keyword, setKeyword]         = useState(initial?.keyword ?? "");
  const [eventName, setEventName]     = useState(initial?.eventName ?? "intake_complete");
  const [channels, setChannels]       = useState<ChannelId[]>(initial?.channels ?? ALL_CHANNELS);
  const [message, setMessage]         = useState(initial?.message ?? "Welcome! I'm so glad you're here. Let me know what you're curious about and I'll share some resources with you.");
  const [quickReplies, setQuickReplies] = useState<string[]>(initial?.quickReplies ?? ["Prayer", "Bible Study", "Community"]);

  const draft: BasicAutomationDraft = { id: initial?.id, name, triggerKind, keyword, eventName, channels, message, quickReplies };

  const isValid = name.trim().length > 0 && message.trim().length > 0 && (triggerKind !== "keyword" || keyword.trim().length > 0);

  return (
    <div className="h-[calc(100vh-60px)] flex flex-col bg-muted/30">
      <BuilderHeader
        name={name}
        onNameChange={setName}
        status={status}
        runs={runs}
        typeLabel="Basic automation"
        onBack={onBack}
        onSave={() => { if (!isValid) return toast.error("Fill in the required fields before saving"); onSave(draft); toast.success(`"${name}" saved as draft`); }}
        onPublish={() => { if (!isValid) return toast.error("Fill in the required fields before publishing"); onPublish(draft); toast.success(`"${name}" published`); }}
      />

      <div className="flex-1 flex overflow-hidden">
        {/* Config column */}
        <div className="flex-1 min-w-0 overflow-y-auto">
          <div className="max-w-[720px] mx-auto p-6 space-y-6">
            {/* Trigger type */}
            <Section title="1. Choose a trigger" description="What event should start this automation?">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {BASIC_TRIGGERS.map(t => {
                  const isActive = triggerKind === t.id;
                  const Icon = t.icon;
                  return (
                    <button
                      key={t.id}
                      onClick={() => setTriggerKind(t.id)}
                      className={cn(
                        "flex items-start gap-3 p-3 rounded-lg border text-left transition-all",
                        isActive ? "border-primary bg-primary/5 ring-1 ring-primary" : "border-border hover:bg-muted/50"
                      )}
                    >
                      <div className={cn("w-8 h-8 rounded-md flex items-center justify-center shrink-0", t.tint)}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-semibold text-foreground">{t.label}</p>
                          {isActive && <Check className="w-3.5 h-3.5 text-primary" />}
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5 leading-snug">{t.description}</p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </Section>

            {/* Trigger config */}
            {triggerKind === "keyword" && (
              <Section title="2. Keyword(s)" description='Seekers whose message contains one of these words will receive the reply.'>
                <Input
                  value={keyword}
                  onChange={(e) => setKeyword(e.target.value)}
                  placeholder="e.g. prayer, pray, praying"
                  className="h-10"
                />
                <p className="text-xs text-muted-foreground">Separate multiple keywords with commas. Case-insensitive.</p>
              </Section>
            )}

            {triggerKind === "event" && (
              <Section title="2. Event" description="Pick the system event that should trigger this reply.">
                <div className="grid grid-cols-2 gap-2">
                  {["intake_complete", "match_accepted", "milestone_reached", "content_delivered"].map(ev => {
                    const isActive = eventName === ev;
                    return (
                      <button
                        key={ev}
                        onClick={() => setEventName(ev)}
                        className={cn(
                          "px-3 py-2 rounded-md text-xs font-medium text-left border transition-all",
                          isActive ? "border-primary bg-primary/5 text-primary" : "border-border text-foreground hover:bg-muted/50"
                        )}
                      >
                        {ev}
                      </button>
                    );
                  })}
                </div>
              </Section>
            )}

            {/* Channels — multi-select */}
            <Section
              title={`${triggerKind === "welcome" || triggerKind === "default_reply" ? "2" : "3"}. Channels`}
              description="Select one or more channels this automation should listen to."
            >
              <MultiChannelSelector selected={channels} onChange={setChannels} />
              <p className="text-xs text-muted-foreground mt-1">
                {channels.length === ALL_CHANNELS.length
                  ? "Listening on all channels"
                  : `Listening on ${channels.map(c => CHANNELS.find(ch => ch.id === c)?.label).join(", ")}`}
              </p>
            </Section>

            {/* Message */}
            <Section
              title={`${triggerKind === "welcome" || triggerKind === "default_reply" ? "3" : "4"}. Message`}
              description="The reply sent to the seeker. Use {{name}} to personalize."
            >
              <Textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="min-h-[140px] text-sm"
                placeholder="Hi {{name}}! Thanks for reaching out."
              />
              <p className="text-xs text-muted-foreground">{message.length} characters</p>
            </Section>

            {/* Quick replies */}
            <Section
              title={`${triggerKind === "welcome" || triggerKind === "default_reply" ? "4" : "5"}. Quick replies`}
              description="Buttons the seeker can tap to respond. Degrade gracefully on SMS."
            >
              <QuickRepliesEditor values={quickReplies} onChange={setQuickReplies} />
            </Section>
          </div>
        </div>

        {/* Preview column */}
        <aside className="w-[380px] shrink-0 bg-background border-l border-border overflow-y-auto">
          <div className="p-5 space-y-4">
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Live Preview</p>
              <p className="text-sm text-muted-foreground mt-0.5">See how the message will appear on each channel.</p>
            </div>
            <ChannelPreview
              channels={channels}
              message={message}
              quickReplies={quickReplies}
            />
          </div>
        </aside>
      </div>
    </div>
  );
}

// ============================================================================
// SEQUENCE BUILDER
// ============================================================================

const SEQUENCE_TRIGGERS: {
  id: SequenceDraft["trigger"]; label: string; description: string;
}[] = [
  { id: "intake_complete", label: "Intake Complete",  description: "Start this sequence when a seeker finishes intake." },
  { id: "match_accepted",  label: "Match Accepted",   description: "Start when both parties accept a mentor match." },
  { id: "tag_added",       label: "Tag Added",        description: "Start when a specific tag is applied to a seeker." },
  { id: "manual",          label: "Manual",           description: "Only enroll seekers manually — no automatic trigger." },
];

export interface SequenceBuilderProps {
  initial?: Partial<SequenceDraft>;
  status?: "draft" | "active" | "stopped";
  runs?: number;
  onBack: () => void;
  onSave: (draft: SequenceDraft) => void;
  onPublish: (draft: SequenceDraft) => void;
}

const emptyStep = (index: number): SequenceStep => ({
  id: `step-${Date.now()}-${index}`,
  delay: { amount: index === 0 ? 0 : 1, unit: "days" },
  message: "",
  aiPersonalize: false,
  quickReplies: [],
});

const DEFAULT_SEQUENCE_STEPS: SequenceStep[] = [
  { id: "s1", delay: { amount: 0, unit: "days" }, message: "Welcome to the Foundations of Faith journey. Over the next week we'll walk through a few foundational ideas together.", aiPersonalize: false, quickReplies: ["Let's start", "Tell me more"] },
  { id: "s2", delay: { amount: 1, unit: "days" }, message: "Day 2: Prayer is simply talking with God. Try a 2-minute prayer today — there's no wrong way to do it.", aiPersonalize: false, quickReplies: ["Done", "Need help"] },
  { id: "s3", delay: { amount: 3, unit: "days" }, message: "Day 3: Scripture reading. Try John 3 today — it's a great starting point.", aiPersonalize: true, quickReplies: ["I read it", "Remind me later"] },
];

export function SequenceBuilder({
  initial, status = "draft", runs, onBack, onSave, onPublish,
}: SequenceBuilderProps) {
  const [name, setName]       = useState(initial?.name ?? "New Sequence");
  const [trigger, setTrigger] = useState<SequenceDraft["trigger"]>(initial?.trigger ?? "intake_complete");
  const [channels, setChannels] = useState<ChannelId[]>(initial?.channels ?? ALL_CHANNELS);
  const [steps, setSteps]     = useState<SequenceStep[]>(initial?.steps ?? DEFAULT_SEQUENCE_STEPS);
  const [selectedId, setSelectedId] = useState<string | null>(steps[0]?.id ?? null);

  const selected = useMemo(() => steps.find(s => s.id === selectedId) ?? null, [steps, selectedId]);

  const draft: SequenceDraft = { id: initial?.id, name, trigger, channels, steps };
  const isValid = name.trim().length > 0 && steps.length > 0 && steps.every(s => s.message.trim().length > 0);

  const updateStep = (id: string, patch: Partial<SequenceStep>) => {
    setSteps(list => list.map(s => s.id === id ? { ...s, ...patch } : s));
  };
  const removeStep = (id: string) => {
    setSteps(list => list.filter(s => s.id !== id));
    if (selectedId === id) setSelectedId(null);
  };
  const moveStep = (id: string, dir: -1 | 1) => {
    setSteps(list => {
      const i = list.findIndex(s => s.id === id);
      if (i < 0) return list;
      const j = i + dir;
      if (j < 0 || j >= list.length) return list;
      const copy = [...list];
      [copy[i], copy[j]] = [copy[j], copy[i]];
      return copy;
    });
  };
  const addStep = () => {
    const newStep = emptyStep(steps.length);
    setSteps(list => [...list, newStep]);
    setSelectedId(newStep.id);
  };

  return (
    <div className="h-[calc(100vh-60px)] flex flex-col bg-muted/30">
      <BuilderHeader
        name={name}
        onNameChange={setName}
        status={status}
        runs={runs}
        typeLabel={`Sequence · ${steps.length} step${steps.length === 1 ? "" : "s"}`}
        onBack={onBack}
        onSave={() => { if (!isValid) return toast.error("Add at least one step with a message"); onSave(draft); toast.success(`"${name}" saved as draft`); }}
        onPublish={() => { if (!isValid) return toast.error("Add at least one step with a message"); onPublish(draft); toast.success(`"${name}" published`); }}
      />

      <div className="flex-1 flex overflow-hidden">
        {/* Timeline column */}
        <div className="flex-1 min-w-0 overflow-y-auto">
          <div className="max-w-[820px] mx-auto p-6 space-y-6">
            {/* Trigger */}
            <Section title="Start trigger" description="How should seekers enter this sequence?">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {SEQUENCE_TRIGGERS.map(t => {
                  const isActive = trigger === t.id;
                  return (
                    <button
                      key={t.id}
                      onClick={() => setTrigger(t.id)}
                      className={cn(
                        "p-3 rounded-lg border text-left transition-all",
                        isActive ? "border-primary bg-primary/5 ring-1 ring-primary" : "border-border hover:bg-muted/50"
                      )}
                    >
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-semibold text-foreground">{t.label}</p>
                        {isActive && <Check className="w-3.5 h-3.5 text-primary" />}
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5 leading-snug">{t.description}</p>
                    </button>
                  );
                })}
              </div>

              <div className="mt-4 pt-4 border-t border-border">
                <p className="text-sm font-bold text-foreground mb-1">Channel</p>
                <p className="text-xs text-muted-foreground mb-3">Select the channels this sequence will send messages on. Applies to all steps.</p>
                <MultiChannelSelector selected={channels} onChange={setChannels} />
                <p className="text-xs text-muted-foreground mt-2">
                  {channels.length === ALL_CHANNELS.length
                    ? "Sending on all channels"
                    : `Sending on ${channels.map(c => CHANNELS.find(ch => ch.id === c)?.label).join(", ")}`}
                </p>
              </div>
            </Section>

            {/* Steps timeline */}
            <Section title="Timeline" description="Each message sends in order. Adjust the wait time between steps.">
              <div className="space-y-0">
                {steps.map((step, i) => {
                  const isSelected = selectedId === step.id;
                  const unitSingular = step.delay.unit.replace(/s$/, "");
                  const unitLabel = step.delay.amount === 1 ? unitSingular : step.delay.unit;
                  return (
                    <div key={step.id}>
                      {/* Delay connector between steps */}
                      {i > 0 && (
                        <div className="py-5 pl-7">
                          <div className="w-px h-3 bg-border ml-0.5 mb-3" />
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Clock className="w-4 h-4 shrink-0" />
                            <span className="font-medium">Then wait</span>
                            <span className="inline-flex items-center gap-2">
                              <input
                                type="number"
                                min={0}
                                value={step.delay.amount}
                                onClick={(e) => e.stopPropagation()}
                                onChange={(e) => { e.stopPropagation(); updateStep(step.id, { delay: { ...step.delay, amount: Math.max(0, parseInt(e.target.value || "0", 10)) } }); }}
                                className="w-16 h-9 text-center text-sm font-medium text-foreground bg-background border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
                              />
                              <select
                                value={step.delay.unit}
                                onClick={(e) => e.stopPropagation()}
                                onChange={(e) => { e.stopPropagation(); updateStep(step.id, { delay: { ...step.delay, unit: e.target.value as SequenceStep["delay"]["unit"] } }); }}
                                className="h-9 text-sm font-medium text-foreground bg-background border border-input rounded-lg px-3 focus:outline-none focus:ring-2 focus:ring-ring"
                              >
                                <option value="minutes">minutes</option>
                                <option value="hours">hours</option>
                                <option value="days">days</option>
                              </select>
                            </span>
                            {step.delay.amount === 0 && <span className="text-xs text-muted-foreground/70 italic">sends right away</span>}
                          </div>
                          <div className="w-px h-3 bg-border ml-0.5 mt-3" />
                        </div>
                      )}

                      {/* Step card */}
                      <div
                        className={cn(
                          "relative bg-card border rounded-xl transition-all group",
                          isSelected ? "border-primary ring-1 ring-primary shadow-sm" : "border-border hover:border-foreground/20"
                        )}
                      >
                        {/* Delete button — top right */}
                        <button
                          onClick={(e) => { e.stopPropagation(); removeStep(step.id); toast.success("Step removed"); }}
                          className="absolute top-3 right-3 w-7 h-7 rounded-md flex items-center justify-center text-muted-foreground hover:text-destructive hover:bg-destructive/10 opacity-0 group-hover:opacity-100 transition-all z-10"
                          aria-label="Delete step"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>

                        <button
                          onClick={() => setSelectedId(step.id)}
                          className="w-full flex items-start gap-4 p-5 text-left"
                        >
                          {/* Drag handle on left */}
                          <div className="flex flex-col items-center gap-1 shrink-0 pt-0.5">
                            <div className="cursor-grab text-muted-foreground/40 hover:text-muted-foreground transition-colors">
                              <GripVertical className="w-4 h-4" />
                            </div>
                            <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-sm">
                              {i + 1}
                            </div>
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <Badge variant="outline" className="bg-muted/50 text-muted-foreground border-border font-medium">
                                <Clock className="w-3 h-3" />
                                {i === 0
                                  ? (step.delay.amount === 0 ? "Sends right away" : `Waits ${step.delay.amount} ${unitLabel}`)
                                  : (step.delay.amount === 0 ? "No wait" : `Waits ${step.delay.amount} ${unitLabel}`)}
                              </Badge>
                              <Badge variant="outline" className="bg-muted border-transparent text-foreground font-medium">
                                {channels.length === ALL_CHANNELS.length ? "All channels" : channels.map(c => CHANNELS.find(ch => ch.id === c)?.label ?? c).join(", ")}
                              </Badge>
                              {step.aiPersonalize && (
                                <Badge variant="outline" className="bg-muted/50 text-muted-foreground border-border font-medium">
                                  <Sparkles className="w-3 h-3" />
                                  AI Personalize
                                </Badge>
                              )}
                            </div>
                            <p className={cn(
                              "text-sm mt-3 leading-relaxed line-clamp-2",
                              step.message.trim() ? "text-foreground" : "text-muted-foreground italic"
                            )}>
                              {step.message.trim() || "Empty message — click to add content."}
                            </p>
                            {/* Compact step stats */}
                            <StepStatsBar stepIndex={i} />
                          </div>
                        </button>
                      </div>
                    </div>
                  );
                })}
                <div className="pt-4">
                  <button
                    onClick={addStep}
                    className="w-full flex items-center justify-center gap-2 py-5 rounded-xl border-2 border-dashed border-border text-sm font-medium text-muted-foreground hover:border-primary hover:text-primary hover:bg-primary/5 transition-all"
                  >
                    <Plus className="w-4 h-4" /> Add step
                  </button>
                </div>
              </div>
            </Section>
          </div>
        </div>

        {/* Inspector + Preview column */}
        <aside className="w-[420px] shrink-0 bg-background border-l border-border overflow-y-auto">
          {selected ? (
            <StepInspector
              step={selected}
              index={steps.findIndex(s => s.id === selected.id)}
              channels={channels}
              onUpdate={(patch) => updateStep(selected.id, patch)}
              onDelete={() => { removeStep(selected.id); toast.success("Step removed"); }}
            />
          ) : (
            <div className="p-6 text-center text-sm text-muted-foreground">
              Select a step to edit its message and preview.
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}

// ============================================================================
// Step Analytics — per-step engagement stats
// ============================================================================

function generateMockStats(stepIndex: number) {
  // Simulate realistic funnel drop-off: earlier steps have more reach
  const baseReached = Math.max(40, 520 - stepIndex * 95 + Math.floor(Math.random() * 30));
  const sent = Math.floor(baseReached * (0.92 + Math.random() * 0.06));
  const delivered = Math.floor(sent * (0.88 + Math.random() * 0.08));
  const seen = Math.floor(delivered * (0.55 + Math.random() * 0.25));
  const clicked = Math.floor(seen * (0.15 + Math.random() * 0.2));
  const droppedOff = baseReached - Math.floor(baseReached * (0.75 + Math.random() * 0.15));
  const avgTimeMinutes = stepIndex === 0 ? 0 : Math.floor(10 + Math.random() * 300);
  const activeNow = Math.floor(Math.random() * 15);
  return { reached: baseReached, sent, delivered, seen, clicked, droppedOff, avgTimeMinutes, activeNow };
}

function formatDuration(mins: number): string {
  if (mins === 0) return "Instant";
  if (mins < 60) return `${mins}m`;
  if (mins < 1440) { const h = Math.floor(mins / 60); const m = mins % 60; return m > 0 ? `${h}h ${m}m` : `${h}h`; }
  const d = Math.floor(mins / 1440); const h = Math.floor((mins % 1440) / 60); return h > 0 ? `${d}d ${h}h` : `${d}d`;
}

function StepAnalytics({ stepIndex }: { stepIndex: number }) {
  const stats = useMemo(() => generateMockStats(stepIndex), [stepIndex]);
  const seenRate = stats.delivered > 0 ? Math.round((stats.seen / stats.delivered) * 100) : 0;
  const clickRate = stats.seen > 0 ? Math.round((stats.clicked / stats.seen) * 100) : 0;

  const metrics = [
    { label: "Reached", value: stats.reached, icon: Users, color: "text-blue-600", bg: "bg-blue-50" },
    { label: "Sent", value: stats.sent, icon: Send, color: "text-emerald-600", bg: "bg-emerald-50" },
    { label: "Delivered", value: stats.delivered, icon: Check, color: "text-emerald-600", bg: "bg-emerald-50" },
    { label: "Seen", value: stats.seen, icon: Eye, color: "text-violet-600", bg: "bg-violet-50", sub: `${seenRate}%` },
    { label: "Clicked", value: stats.clicked, icon: MousePointerClick, color: "text-orange-600", bg: "bg-orange-50", sub: `${clickRate}%` },
    { label: "Dropped off", value: stats.droppedOff, icon: TrendingDown, color: "text-rose-500", bg: "bg-rose-50" },
  ];

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm font-bold text-foreground flex items-center gap-1.5">
          <BarChart3 className="w-4 h-4 text-muted-foreground" />
          Step Analytics
        </p>
        {stats.activeNow > 0 && (
          <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
            <Activity className="w-3 h-3" />
            {stats.activeNow} active now
          </span>
        )}
      </div>

      {/* Metric grid */}
      <div className="grid grid-cols-3 gap-2.5">
        {metrics.map(m => (
          <div key={m.label} className="flex flex-col items-center gap-1 p-3 rounded-lg bg-muted/30 border border-border">
            <div className={cn("w-7 h-7 rounded-full flex items-center justify-center", m.bg)}>
              <m.icon className={cn("w-3.5 h-3.5", m.color)} />
            </div>
            <span className="text-lg font-bold text-foreground leading-none">{m.value.toLocaleString()}</span>
            <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">{m.label}</span>
            {m.sub && <span className={cn("text-xs font-semibold", m.color)}>{m.sub}</span>}
          </div>
        ))}
      </div>

      {/* Funnel bar */}
      <div className="mt-4 space-y-1.5">
        <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">Delivery funnel</p>
        <div className="h-2.5 rounded-full bg-muted overflow-hidden flex">
          <div className="bg-emerald-400 h-full transition-all" style={{ width: `${stats.delivered > 0 ? Math.round((stats.delivered / stats.reached) * 100) : 0}%` }} />
          <div className="bg-violet-400 h-full transition-all" style={{ width: `${stats.reached > 0 ? Math.round((stats.seen / stats.reached) * 100) : 0}%` }} />
          <div className="bg-orange-400 h-full transition-all" style={{ width: `${stats.reached > 0 ? Math.round((stats.clicked / stats.reached) * 100) : 0}%` }} />
        </div>
        <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-400" /> Delivered</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-violet-400" /> Seen</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-orange-400" /> Clicked</span>
        </div>
      </div>

      {/* Avg time at step */}
      <div className="mt-4 flex items-center gap-2 text-xs text-muted-foreground">
        <Clock className="w-3.5 h-3.5" />
        <span>Avg. time at step: <span className="font-semibold text-foreground">{formatDuration(stats.avgTimeMinutes)}</span></span>
      </div>
    </div>
  );
}

function StepStatsBar({ stepIndex }: { stepIndex: number }) {
  const stats = useMemo(() => generateMockStats(stepIndex), [stepIndex]);
  const seenRate = stats.delivered > 0 ? Math.round((stats.seen / stats.delivered) * 100) : 0;
  return (
    <div className="flex items-center gap-3 mt-3 text-[11px] text-muted-foreground">
      <span className="flex items-center gap-1"><Users className="w-3 h-3 text-blue-500" />{stats.reached}</span>
      <span className="flex items-center gap-1"><Send className="w-3 h-3 text-emerald-500" />{stats.sent}</span>
      <span className="flex items-center gap-1"><Eye className="w-3 h-3 text-violet-500" />{seenRate}%</span>
      <span className="flex items-center gap-1"><MousePointerClick className="w-3 h-3 text-orange-500" />{stats.clicked}</span>
    </div>
  );
}

function StepInspector({
  step, index, channels, onUpdate, onDelete,
}: {
  step: SequenceStep;
  index: number;
  channels: ChannelId[];
  onUpdate: (patch: Partial<SequenceStep>) => void;
  onDelete: () => void;
}) {
  return (
    <div className="divide-y divide-border">
      <div className="p-6">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Step {index + 1}</p>
      </div>

      <div className="p-6 space-y-4">
        <p className="text-sm font-bold text-foreground">Message</p>
        <Textarea
          value={step.message}
          onChange={(e) => onUpdate({ message: e.target.value })}
          className="min-h-[140px] text-sm"
          placeholder="Type the message for this step..."
        />
        <div className="flex items-center gap-3 py-2">
          <Switch
            id={`ai-${step.id}`}
            checked={step.aiPersonalize}
            onCheckedChange={(v) => onUpdate({ aiPersonalize: v })}
          />
          <Label htmlFor={`ai-${step.id}`} className="flex items-center gap-1.5 text-sm cursor-pointer">
            <Sparkles className="w-3.5 h-3.5 text-muted-foreground" />
            AI Personalize for each seeker
          </Label>
        </div>
        <div>
          <Label className="text-xs font-semibold text-foreground mb-2 block">Quick replies</Label>
          <QuickRepliesEditor values={step.quickReplies} onChange={(next) => onUpdate({ quickReplies: next })} />
        </div>
      </div>

      {/* Step Analytics */}
      <StepAnalytics stepIndex={index} />

      <div className="p-6">
        <p className="text-sm font-bold text-foreground mb-4">Preview</p>
        <ChannelPreview
          channels={channels}
          message={step.message}
          quickReplies={step.quickReplies}
        />
      </div>

      <div className="p-6">
        <Button variant="outline" size="sm" className="w-full text-destructive hover:text-destructive" onClick={onDelete}>
          <Trash2 className="w-3.5 h-3.5" /> Remove step
        </Button>
      </div>
    </div>
  );
}

// ============================================================================
// Shared: Section wrapper
// ============================================================================

function Section({
  title, description, children,
}: { title: string; description?: string; children: React.ReactNode }) {
  return (
    <section className="space-y-3">
      <div>
        <h2 className="text-sm font-bold text-foreground">{title}</h2>
        {description && <p className="text-xs text-muted-foreground mt-0.5">{description}</p>}
      </div>
      {children}
    </section>
  );
}

// ============================================================================
// Type picker modal body (used from the "All" folder's New button)
// ============================================================================

export function AutomationTypePicker({
  onPick,
}: { onPick: (type: "basic" | "sequence" | "flow" | "broadcast") => void }) {
  const types = [
    { id: "basic" as const,     label: "Auto-Reply",  description: "Reply to keywords, welcome messages, or custom events.",                    icon: Reply,     tint: "bg-blue-50 text-blue-600" },
    { id: "sequence" as const,  label: "Drip",         description: "Send a timed sequence of messages.",                                        icon: Droplet,   tint: "bg-blue-50 text-blue-500" },
    { id: "flow" as const,      label: "Flow",         description: "Build a full DAG workflow with branching.",                                 icon: Workflow,  tint: "bg-blue-50 text-blue-600" },
    { id: "broadcast" as const, label: "Broadcast",    description: "One message to many on a schedule.",                                        icon: Megaphone, tint: "bg-amber-50 text-amber-600" },
  ];
  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">Choose the type of automation you want to build.</p>
      <div className="grid grid-cols-2 gap-3">
        {types.map(t => {
          const Icon = t.icon;
          return (
            <button
              key={t.id}
              onClick={() => onPick(t.id)}
              className="flex items-start gap-3 p-5 border border-border hover:border-primary/40 hover:bg-muted/30 transition-all text-left"
            >
              <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center shrink-0", t.tint)}>
                <Icon className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-foreground">{t.label}</p>
                <p className="text-xs text-muted-foreground mt-1 leading-snug">{t.description}</p>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// Simple inline icon — avoids adding another lucide import just for a clock+list glyph.
function ListClockIcon(props: { className?: string }) {
  return (
    <svg className={props.className} width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 4h6M2 8h6M2 12h4" />
      <circle cx="12" cy="11" r="2.5" />
      <path d="M12 10v1l0.6 0.5" />
    </svg>
  );
}
