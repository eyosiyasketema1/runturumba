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
  Send, Smartphone, Globe, MessageCircle, GripVertical
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

export interface BasicAutomationDraft {
  id?: string;
  name: string;
  triggerKind: BasicTriggerKind;
  keyword?: string;          // for keyword triggers
  eventName?: string;        // for event triggers
  channel: "all" | "telegram" | "whatsapp" | "sms" | "web";
  message: string;
  quickReplies: string[];
}

export interface SequenceStep {
  id: string;
  delay: { amount: number; unit: "minutes" | "hours" | "days" };
  message: string;
  channel: "all" | "telegram" | "whatsapp" | "sms" | "web";
  aiPersonalize: boolean;
  quickReplies: string[];
}

export interface SequenceDraft {
  id?: string;
  name: string;
  trigger: "intake_complete" | "match_accepted" | "tag_added" | "manual";
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

type Channel = "telegram" | "whatsapp" | "sms" | "web";

const CHANNELS: { id: Channel; label: string; icon: any }[] = [
  { id: "telegram", label: "Telegram", icon: Send },
  { id: "whatsapp", label: "WhatsApp", icon: MessageCircle },
  { id: "sms",      label: "SMS",      icon: Smartphone },
  { id: "web",      label: "Web",      icon: Globe },
];

function ChannelPreview({
  channel: forcedChannel, message, quickReplies = [],
}: { channel?: Channel; message: string; quickReplies?: string[] }) {
  const [channel, setChannel] = useState<Channel>(forcedChannel ?? "telegram");
  const active = forcedChannel ?? channel;
  return (
    <div className="space-y-3">
      {!forcedChannel && (
        <div className="flex items-center gap-1 bg-muted/60 rounded-md p-0.5 w-fit">
          {CHANNELS.map(c => {
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
      )}

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
  const [channel, setChannel]         = useState<BasicAutomationDraft["channel"]>(initial?.channel ?? "all");
  const [message, setMessage]         = useState(initial?.message ?? "Welcome! I'm so glad you're here. Let me know what you're curious about and I'll share some resources with you.");
  const [quickReplies, setQuickReplies] = useState<string[]>(initial?.quickReplies ?? ["Prayer", "Bible Study", "Community"]);

  const draft: BasicAutomationDraft = { id: initial?.id, name, triggerKind, keyword, eventName, channel, message, quickReplies };

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

            {/* Channel */}
            <Section
              title={`${triggerKind === "welcome" || triggerKind === "default_reply" ? "2" : "3"}. Channel`}
              description="Which channel should this automation listen to?"
            >
              <div className="flex items-center gap-1 bg-muted/60 rounded-md p-0.5 w-fit">
                {([
                  ["all",      "All channels"],
                  ["telegram", "Telegram"],
                  ["whatsapp", "WhatsApp"],
                  ["sms",      "SMS"],
                  ["web",      "Web"],
                ] as const).map(([k, label]) => {
                  const isActive = channel === k;
                  return (
                    <button
                      key={k}
                      onClick={() => setChannel(k)}
                      className={cn(
                        "px-3 py-1.5 text-xs font-semibold rounded transition-all",
                        isActive ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                      )}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>
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
              channel={channel === "all" ? undefined : channel}
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
  channel: "all",
  aiPersonalize: false,
  quickReplies: [],
});

const DEFAULT_SEQUENCE_STEPS: SequenceStep[] = [
  { id: "s1", delay: { amount: 0, unit: "days" }, message: "Welcome to the Foundations of Faith journey. Over the next week we'll walk through a few foundational ideas together.", channel: "all", aiPersonalize: false, quickReplies: ["Let's start", "Tell me more"] },
  { id: "s2", delay: { amount: 1, unit: "days" }, message: "Day 2: Prayer is simply talking with God. Try a 2-minute prayer today — there's no wrong way to do it.", channel: "all", aiPersonalize: false, quickReplies: ["Done", "Need help"] },
  { id: "s3", delay: { amount: 3, unit: "days" }, message: "Day 3: Scripture reading. Try John 3 today — it's a great starting point.", channel: "all", aiPersonalize: true, quickReplies: ["I read it", "Remind me later"] },
];

export function SequenceBuilder({
  initial, status = "draft", runs, onBack, onSave, onPublish,
}: SequenceBuilderProps) {
  const [name, setName]       = useState(initial?.name ?? "New Sequence");
  const [trigger, setTrigger] = useState<SequenceDraft["trigger"]>(initial?.trigger ?? "intake_complete");
  const [steps, setSteps]     = useState<SequenceStep[]>(initial?.steps ?? DEFAULT_SEQUENCE_STEPS);
  const [selectedId, setSelectedId] = useState<string | null>(steps[0]?.id ?? null);

  const selected = useMemo(() => steps.find(s => s.id === selectedId) ?? null, [steps, selectedId]);

  const draft: SequenceDraft = { id: initial?.id, name, trigger, steps };
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
            </Section>

            {/* Steps timeline */}
            <Section title="Timeline" description="Drip messages in order. Each step waits for its delay before sending.">
              <div className="space-y-3">
                {steps.map((step, i) => {
                  const isSelected = selectedId === step.id;
                  return (
                    <div
                      key={step.id}
                      className={cn(
                        "relative bg-card border rounded-xl transition-all",
                        isSelected ? "border-primary ring-1 ring-primary shadow-sm" : "border-border hover:border-foreground/20"
                      )}
                    >
                      {/* Connector line from previous step */}
                      {i > 0 && (
                        <div className="absolute -top-3 left-7 w-px h-3 bg-border" aria-hidden />
                      )}
                      <button
                        onClick={() => setSelectedId(step.id)}
                        className="w-full flex items-start gap-3 p-4 text-left"
                      >
                        <div className="w-9 h-9 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0 font-bold">
                          {i + 1}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200 font-semibold">
                              <Clock className="w-3 h-3" />
                              {step.delay.amount === 0
                                ? "Immediately"
                                : `After ${step.delay.amount} ${step.delay.unit}`}
                            </Badge>
                            <Badge variant="outline" className="bg-muted border-transparent text-foreground font-semibold">
                              {step.channel === "all" ? "All channels" : step.channel}
                            </Badge>
                            {step.aiPersonalize && (
                              <Badge variant="outline" className="bg-pink-50 text-pink-700 border-pink-200 font-semibold">
                                <Sparkles className="w-3 h-3" />
                                AI Personalize
                              </Badge>
                            )}
                          </div>
                          <p className={cn(
                            "text-sm mt-2 leading-relaxed line-clamp-2",
                            step.message.trim() ? "text-foreground" : "text-muted-foreground italic"
                          )}>
                            {step.message.trim() || "Empty message — click to add content."}
                          </p>
                        </div>
                        <div className="flex flex-col gap-0.5 opacity-70 group-hover:opacity-100">
                          <button
                            onClick={(e) => { e.stopPropagation(); moveStep(step.id, -1); }}
                            disabled={i === 0}
                            className="w-6 h-6 rounded hover:bg-muted disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center"
                            aria-label="Move step up"
                          >
                            <ChevronUp className="w-3.5 h-3.5 text-muted-foreground" />
                          </button>
                          <button
                            onClick={(e) => { e.stopPropagation(); moveStep(step.id, 1); }}
                            disabled={i === steps.length - 1}
                            className="w-6 h-6 rounded hover:bg-muted disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center"
                            aria-label="Move step down"
                          >
                            <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />
                          </button>
                        </div>
                      </button>
                    </div>
                  );
                })}
                <button
                  onClick={addStep}
                  className="w-full flex items-center justify-center gap-2 py-4 rounded-xl border-2 border-dashed border-border text-sm font-semibold text-muted-foreground hover:border-primary hover:text-primary hover:bg-primary/5 transition-all"
                >
                  <Plus className="w-4 h-4" /> Add step
                </button>
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

function StepInspector({
  step, index, onUpdate, onDelete,
}: {
  step: SequenceStep;
  index: number;
  onUpdate: (patch: Partial<SequenceStep>) => void;
  onDelete: () => void;
}) {
  return (
    <div className="divide-y divide-border">
      <div className="p-5">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Step {index + 1}</p>
        <p className="text-sm font-bold text-foreground mt-0.5">Delay & Channel</p>

        <div className="grid grid-cols-[1fr,auto] gap-2 mt-3">
          <Input
            type="number"
            min={0}
            value={step.delay.amount}
            onChange={(e) => onUpdate({ delay: { ...step.delay, amount: Math.max(0, parseInt(e.target.value || "0", 10)) } })}
            className="h-9"
          />
          <select
            value={step.delay.unit}
            onChange={(e) => onUpdate({ delay: { ...step.delay, unit: e.target.value as SequenceStep["delay"]["unit"] } })}
            className="h-9 px-3 rounded-md border border-input bg-background text-sm"
          >
            <option value="minutes">Minutes</option>
            <option value="hours">Hours</option>
            <option value="days">Days</option>
          </select>
        </div>
        <p className="text-xs text-muted-foreground mt-2">
          {step.delay.amount === 0 ? "Sends immediately" : `Waits ${step.delay.amount} ${step.delay.unit} before sending.`}
        </p>

        <div className="mt-4 flex items-center gap-1 bg-muted/60 rounded-md p-0.5 w-fit">
          {([
            ["all",      "All"],
            ["telegram", "Telegram"],
            ["whatsapp", "WhatsApp"],
            ["sms",      "SMS"],
            ["web",      "Web"],
          ] as const).map(([k, label]) => {
            const isActive = step.channel === k;
            return (
              <button
                key={k}
                onClick={() => onUpdate({ channel: k })}
                className={cn(
                  "px-2.5 py-1 text-xs font-semibold rounded transition-all",
                  isActive ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                )}
              >
                {label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="p-5 space-y-3">
        <p className="text-sm font-bold text-foreground">Message</p>
        <Textarea
          value={step.message}
          onChange={(e) => onUpdate({ message: e.target.value })}
          className="min-h-[140px] text-sm"
          placeholder="Type the message for this step..."
        />
        <div className="flex items-center gap-2 py-1">
          <Switch
            id={`ai-${step.id}`}
            checked={step.aiPersonalize}
            onCheckedChange={(v) => onUpdate({ aiPersonalize: v })}
          />
          <Label htmlFor={`ai-${step.id}`} className="flex items-center gap-1.5 text-sm cursor-pointer">
            <Sparkles className="w-3.5 h-3.5 text-pink-500" />
            AI Personalize for each seeker
          </Label>
        </div>
        <div>
          <Label className="text-xs font-semibold text-foreground mb-2 block">Quick replies</Label>
          <QuickRepliesEditor values={step.quickReplies} onChange={(next) => onUpdate({ quickReplies: next })} />
        </div>
      </div>

      <div className="p-5">
        <p className="text-sm font-bold text-foreground mb-3">Preview</p>
        <ChannelPreview
          channel={step.channel === "all" ? undefined : step.channel}
          message={step.message}
          quickReplies={step.quickReplies}
        />
      </div>

      <div className="p-5">
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
}: { onPick: (type: "basic" | "sequence" | "flow") => void }) {
  const types = [
    { id: "basic" as const,    label: "Basic automation", description: "A single trigger paired with a single reply — welcomes, keyword replies, default messages.",    icon: Zap,          tint: "bg-blue-50 text-blue-700" },
    { id: "sequence" as const, label: "Sequence",         description: "A drip series of messages sent at scheduled intervals.",                                         icon: ListClockIcon, tint: "bg-emerald-50 text-emerald-700" },
    { id: "flow" as const,     label: "Journey",          description: "A branching, multi-step visual journey with milestones, webhooks, conditions, and AI personalization.", icon: GripVertical, tint: "bg-violet-50 text-violet-700" },
  ];
  return (
    <div className="space-y-2">
      {types.map(t => {
        const Icon = t.icon;
        return (
          <button
            key={t.id}
            onClick={() => onPick(t.id)}
            className="w-full flex items-start gap-3 p-4 rounded-lg border border-border hover:border-primary hover:bg-primary/5 transition-all text-left"
          >
            <div className={cn("w-10 h-10 rounded-md flex items-center justify-center shrink-0", t.tint)}>
              <Icon className="w-5 h-5" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-foreground">{t.label}</p>
              <p className="text-xs text-muted-foreground mt-0.5 leading-snug">{t.description}</p>
            </div>
          </button>
        );
      })}
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
