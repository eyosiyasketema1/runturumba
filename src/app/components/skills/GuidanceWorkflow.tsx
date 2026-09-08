'use client';

import React, { useMemo, useState } from 'react';
import { motion } from 'motion/react';
import { toast } from 'sonner';
import { AlertTriangle, ArrowLeft, Code2, Eye, Plus, Trash2, X } from 'lucide-react';
import { cn } from '../types';
import {
  AccessBadge,
  Button,
  Card,
  EmptyState,
  ExampleList,
  Field,
  PageHeader,
  StatusBadge,
  inputClass,
  monoClass,
} from './ui';
import {
  EMPTY_VERSION,
  GUIDANCE_CATEGORIES,
  TOOL_CATALOG,
  composeInstructions,
  emptyRule,
  type GuidanceCategory,
  type GuidanceRule,
  type Skill,
  type SkillVersion,
} from '../../lib/skills-data';
import type { SkillStore } from './useSkillStore';
import { AdvancedSettings, type AdvancedValues } from './AdvancedSettings';

// ============================================================
// Option A — Guidance rules
//
// The system prompt is never shown. The author writes short rules in
// plain English, each scoped by examples, and the prompt is composed
// from them. Pattern follows Intercom Fin "Guidance", Gorgias
// "Guidance", Decagon "AOPs" and Salesforce topic scope.
// ============================================================

/** Cheap review of the rule set — ambiguity and contradiction, not syntax. */
function reviewRules(rules: GuidanceRule[]): string[] {
  const notes: string[] = [];
  const live = rules.filter((r) => r.enabled && r.text.trim());

  if (live.length === 0) notes.push('There are no rules yet, so this skill will not do anything.');

  const vague = live.filter((r) => /\b(appropriate|properly|as needed|reasonable|etc)\b/i.test(r.text));
  for (const r of vague) {
    notes.push(`"${truncate(r.text)}" uses a vague word. Say exactly what you mean.`);
  }

  const long = live.filter((r) => r.text.trim().length > 240);
  for (const r of long) {
    notes.push(`"${truncate(r.text)}" is long enough to be two rules. Consider splitting it.`);
  }

  const unscoped = live.filter(
    (r) => r.category === 'when-to-act' && r.applyWhen.filter((e) => e.trim()).length === 0,
  );
  for (const r of unscoped) {
    notes.push(`"${truncate(r.text)}" has no example of when it applies.`);
  }

  const seen = new Map<string, GuidanceRule>();
  for (const r of live) {
    const key = r.text.trim().toLowerCase().replace(/[^a-z ]/g, '').slice(0, 40);
    const prior = seen.get(key);
    if (prior) notes.push(`"${truncate(r.text)}" looks like a repeat of an earlier rule.`);
    else seen.set(key, r);
  }

  return notes;
}

function truncate(text: string, max = 42) {
  const clean = text.trim();
  return clean.length <= max ? clean : `${clean.slice(0, max)}…`;
}

// ------------------------------------------------------------
// Rule editor
// ------------------------------------------------------------

function RuleRow({
  rule,
  index,
  onChange,
  onDelete,
}: {
  rule: GuidanceRule;
  index: number;
  onChange: (next: GuidanceRule) => void;
  onDelete: () => void;
}) {
  const [open, setOpen] = useState(!rule.text);

  return (
    <div
      className={cn(
        'flex flex-col gap-[12px] border p-[16px] transition-colors',
        rule.enabled ? 'border-border bg-background' : 'border-border bg-secondary/30 opacity-60',
      )}
    >
      <div className="flex items-start gap-[12px]">
        <textarea
          value={rule.text}
          rows={2}
          placeholder="Write one rule in plain English, e.g. “If someone mentions a refund, hand the conversation to a person.”"
          aria-label={`Rule ${index + 1}`}
          onChange={(e) => onChange({ ...rule, text: e.target.value })}
          className={cn(inputClass, 'resize-y text-[14px]')}
        />
        <button
          onClick={onDelete}
          aria-label="Delete rule"
          className="shrink-0 p-[8px] text-foreground/40 transition-colors hover:text-destructive"
        >
          <Trash2 className="h-[15px] w-[15px]" />
        </button>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-[12px]">
        <div className="flex items-center gap-[8px]">
          <button
            onClick={() => onChange({ ...rule, enabled: !rule.enabled })}
            className="text-[12px] leading-[16px] font-medium text-primary hover:underline"
          >
            {rule.enabled ? 'Turn this rule off' : 'Turn this rule on'}
          </button>
          <span className="h-[12px] w-px bg-border" />
          <button
            onClick={() => setOpen((o) => !o)}
            className="text-[12px] leading-[16px] font-medium text-primary hover:underline"
          >
            {open ? 'Hide examples' : `Examples (${rule.applyWhen.length + rule.dontApplyWhen.length})`}
          </button>
        </div>
      </div>

      {open && (
        <div className="grid gap-[16px] border-t border-border pt-[12px] sm:grid-cols-2">
          <ExampleList
            label="Use it when…"
            placeholder="A customer asks to return an item"
            tone="positive"
            values={rule.applyWhen}
            onChange={(applyWhen) => onChange({ ...rule, applyWhen })}
          />
          <ExampleList
            label="Don't use it when…"
            placeholder="They are only asking about delivery time"
            tone="negative"
            values={rule.dontApplyWhen}
            onChange={(dontApplyWhen) => onChange({ ...rule, dontApplyWhen })}
          />
        </div>
      )}
    </div>
  );
}

// ------------------------------------------------------------
// Editor screen
// ------------------------------------------------------------

function GuidanceEditor({
  skill,
  onBack,
  onSave,
  onTurnOn,
}: {
  skill: Skill;
  onBack: () => void;
  onSave: (version: SkillVersion) => void;
  onTurnOn: (version: SkillVersion) => void;
}) {
  const base = skill.draft ?? skill.active;
  const [name, setName] = useState(base?.name ?? skill.name);
  const [description, setDescription] = useState(base?.description ?? '');
  const [rules, setRules] = useState<GuidanceRule[]>(base?.guidance ?? []);
  const [tools, setTools] = useState<string[]>(base?.tools ?? []);
  const [advanced, setAdvanced] = useState<AdvancedValues>({
    providerConnection: base?.providerConnection ?? EMPTY_VERSION.providerConnection,
    model: base?.model ?? '',
    triggerType: base?.triggerType ?? 'event',
    budgetPerRunUsd: base?.budgetPerRunUsd ?? EMPTY_VERSION.budgetPerRunUsd,
    dailyBudgetUsd: base?.dailyBudgetUsd ?? EMPTY_VERSION.dailyBudgetUsd,
    maxIterations: base?.maxIterations ?? EMPTY_VERSION.maxIterations,
  });
  const [showPrompt, setShowPrompt] = useState(false);
  const [showReview, setShowReview] = useState(false);

  const notes = useMemo(() => reviewRules(rules), [rules]);
  const composed = useMemo(
    () => composeInstructions(name, description, rules),
    [name, description, rules],
  );

  const build = (): SkillVersion => ({
    ...(base ?? ({} as SkillVersion)),
    name,
    description,
    guidance: rules,
    instructions: composed,
    tools,
    ...advanced,
  });

  const addRule = (category: GuidanceCategory) => setRules((prev) => [...prev, emptyRule(category)]);

  const attempt = () => {
    if (!name.trim()) {
      toast.error('Give the skill a name first');
      return;
    }
    if (rules.filter((r) => r.enabled && r.text.trim()).length === 0) {
      setShowReview(true);
      toast.error('Add at least one rule before turning this on');
      return;
    }
    onTurnOn(build());
  };

  return (
    <div className="flex flex-col gap-[24px]">
      <div className="flex flex-col gap-[12px] lg:flex-row lg:items-center lg:justify-between">
        <div className="flex min-w-0 items-center gap-[12px]">
          <Button variant="ghost" onClick={onBack} className="-ml-[8px] shrink-0">
            <ArrowLeft className="h-[16px] w-[16px]" />
            Back
          </Button>
          <h1 className="truncate text-[18px] leading-[26px] font-bold text-foreground">
            {skill.active ? `Edit ${skill.name}` : 'New skill'}
          </h1>
        </div>
        <div className="flex shrink-0 flex-wrap items-center gap-[8px]">
          <Button variant="outline" onClick={() => setShowReview((s) => !s)}>
            Check my rules {notes.length > 0 && `(${notes.length})`}
          </Button>
          <Button variant="outline" onClick={() => onSave(build())}>
            Save for later
          </Button>
          <Button onClick={attempt}>Turn it on</Button>
        </div>
      </div>

      {showReview && (
        <Card
          title="A quick check"
          subtitle="Nothing here stops you — these are suggestions."
          action={
            <button
              onClick={() => setShowReview(false)}
              aria-label="Dismiss"
              className="shrink-0 p-[4px] text-foreground/50 hover:text-foreground"
            >
              <X className="h-[16px] w-[16px]" />
            </button>
          }
        >
          {notes.length === 0 ? (
            <p className="text-[14px] leading-[20px] text-foreground/70">
              Nothing looks unclear. Good to go.
            </p>
          ) : (
            <div className="flex flex-col gap-[8px]">
              {notes.map((note, idx) => (
                <div
                  key={idx}
                  className="flex items-start gap-[10px] border border-amber-200 bg-amber-50 p-[12px]"
                >
                  <AlertTriangle className="mt-[2px] h-[15px] w-[15px] shrink-0 text-amber-600" />
                  <span className="text-[13px] leading-[18px] text-amber-800">{note}</span>
                </div>
              ))}
            </div>
          )}
        </Card>
      )}

      <Card title="The basics">
        <Field label="What do you want to call it?">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Refund requests"
            aria-label="Skill name"
            className={inputClass}
          />
        </Field>
        <Field label="What is it for?" hint="One sentence, for your teammates.">
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={2}
            placeholder="Spots refund requests and hands them to a person."
            aria-label="What it is for"
            className={cn(inputClass, 'resize-y')}
          />
        </Field>
      </Card>

      {GUIDANCE_CATEGORIES.map((group) => {
        const groupRules = rules.filter((r) => r.category === group.id);
        return (
          <Card
            key={group.id}
            title={group.label}
            subtitle={group.help}
            action={
              <Button variant="outline" onClick={() => addRule(group.id)} className="px-[10px]">
                <Plus className="h-[14px] w-[14px]" />
                Add a rule
              </Button>
            }
          >
            {groupRules.length === 0 ? (
              <p className="text-[13px] leading-[18px] text-foreground/45">
                No rules here yet.
              </p>
            ) : (
              <div className="flex flex-col gap-[12px]">
                {groupRules.map((rule, ruleIdx) => (
                  <RuleRow
                    key={rule.id}
                    rule={rule}
                    index={ruleIdx}
                    onChange={(next) =>
                      setRules((prev) => prev.map((r) => (r.id === next.id ? next : r)))
                    }
                    onDelete={() => setRules((prev) => prev.filter((r) => r.id !== rule.id))}
                  />
                ))}
              </div>
            )}
          </Card>
        );
      })}

      <Card
        title="What it's allowed to do"
        subtitle="Nothing is switched on until you switch it on."
      >
        <div className="flex flex-col gap-[8px]">
          {TOOL_CATALOG.map((tool) => {
            const checked = tools.includes(tool.id);
            return (
              <button
                key={tool.id}
                onClick={() =>
                  setTools((prev) =>
                    prev.includes(tool.id) ? prev.filter((t) => t !== tool.id) : [...prev, tool.id],
                  )
                }
                aria-pressed={checked}
                className={cn(
                  'flex items-start gap-[12px] border p-[12px] text-left transition-colors',
                  checked
                    ? 'border-primary bg-primary/5'
                    : 'border-border bg-background hover:bg-secondary/40',
                )}
              >
                <span
                  className={cn(
                    'mt-[2px] flex h-[16px] w-[16px] shrink-0 items-center justify-center border',
                    checked ? 'border-primary bg-primary' : 'border-border bg-background',
                  )}
                >
                  {checked && (
                    <svg viewBox="0 0 12 12" className="h-[10px] w-[10px]" aria-hidden="true">
                      <path
                        d="M2 6.2L4.6 8.8L10 3.4"
                        fill="none"
                        stroke="white"
                        strokeWidth="2"
                        strokeLinecap="square"
                      />
                    </svg>
                  )}
                </span>
                <span className="flex min-w-0 flex-1 flex-col gap-[2px]">
                  <span className="text-[13px] leading-[18px] font-semibold text-foreground">
                    {tool.label}
                  </span>
                  <span className="text-[12px] leading-[18px] text-foreground/55">
                    {tool.description}
                  </span>
                  {checked && tool.access === 'write' && (
                    <span className="mt-[2px] text-[12px] leading-[16px] text-amber-700">
                      This one changes your data.
                    </span>
                  )}
                </span>
                <AccessBadge access={tool.access} />
              </button>
            );
          })}
        </div>
      </Card>

      <AdvancedSettings
        values={advanced}
        onChange={(patch) => setAdvanced((prev) => ({ ...prev, ...patch }))}
      />

      <Card
        title="What the AI actually reads"
        subtitle="Written for you from the rules above. You never have to edit this."
        action={
          <Button variant="outline" onClick={() => setShowPrompt((s) => !s)} className="px-[10px]">
            {showPrompt ? <Eye className="h-[14px] w-[14px]" /> : <Code2 className="h-[14px] w-[14px]" />}
            {showPrompt ? 'Hide' : 'Show'}
          </Button>
        }
      >
        {showPrompt && (
          <pre
            className={cn(
              'max-h-[420px] overflow-auto border border-border bg-secondary/20 p-[16px] whitespace-pre-wrap text-foreground/80',
              monoClass,
            )}
          >
            {composed}
          </pre>
        )}
      </Card>
    </div>
  );
}

// ------------------------------------------------------------
// Workflow
// ------------------------------------------------------------

export function GuidanceWorkflow({ store }: { store: SkillStore }) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const editing = store.skills.find((s) => s.id === editingId) ?? null;

  const startNew = () => {
    const skill = store.create({ name: '', guidance: [] });
    setEditingId(skill.id);
  };

  if (editing) {
    return (
      <GuidanceEditor
        key={editing.id}
        skill={editing}
        onBack={() => setEditingId(null)}
        onSave={(version) => {
          store.saveDraft(editing.id, version);
          setEditingId(null);
        }}
        onTurnOn={(version) => {
          store.activate(editing.id, version);
          setEditingId(null);
        }}
      />
    );
  }

  return (
    <div className="flex flex-col gap-[24px]">
      <PageHeader
        title="Skills"
        blurb="Each skill is a short list of rules, written in plain English. No prompts, no code."
        actions={
          <Button onClick={startNew}>
            <Plus className="h-[16px] w-[16px]" />
            New skill
          </Button>
        }
      />

      {store.skills.length === 0 ? (
        <EmptyState message="No skills yet. Start with one rule and add more as you go.">
          <Button onClick={startNew}>
            <Plus className="h-[16px] w-[16px]" />
            New skill
          </Button>
        </EmptyState>
      ) : (
        <div className="grid gap-[16px] sm:grid-cols-2 xl:grid-cols-3">
          {store.skills.map((skill, idx) => {
            const version = skill.active ?? skill.draft;
            const ruleCount = (version?.guidance ?? []).filter((r) => r.enabled && r.text.trim())
              .length;
            return (
              <motion.button
                key={skill.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.18, delay: idx * 0.03 }}
                onClick={() => setEditingId(skill.id)}
                className="flex flex-col gap-[10px] border border-border bg-background p-[16px] text-left transition-colors hover:border-primary/40"
              >
                <div className="flex items-start justify-between gap-[8px]">
                  <span className="min-w-0 flex-1 truncate text-[14px] leading-[20px] font-semibold text-foreground">
                    {skill.name}
                  </span>
                  <StatusBadge status={skill.status} />
                </div>
                <p className="line-clamp-2 text-[13px] leading-[18px] text-foreground/60">
                  {skill.description || 'No description yet.'}
                </p>
                <span className="text-[12px] leading-[16px] text-foreground/50">
                  {ruleCount} {ruleCount === 1 ? 'rule' : 'rules'}
                  {skill.draft && skill.active ? ' · unsaved changes' : ''}
                </span>
              </motion.button>
            );
          })}
        </div>
      )}
    </div>
  );
}
