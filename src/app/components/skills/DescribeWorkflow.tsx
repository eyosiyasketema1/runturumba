'use client';

import React, { useState } from 'react';
import { motion } from 'motion/react';
import { toast } from 'sonner';
import { ArrowLeft, Pencil, Plus, RefreshCw, Sparkles, Wand2 } from 'lucide-react';
import { cn } from '../types';
import {
  AccessBadge,
  Button,
  Card,
  EmptyState,
  Field,
  PageHeader,
  Select,
  StatusBadge,
  inputClass,
} from './ui';
import {
  EMPTY_VERSION,
  TOOL_CATALOG,
  composeInstructions,
  emptyRule,
  type GuidanceRule,
  type Skill,
  type SkillVersion,
} from '../../lib/skills-data';
import type { SkillStore } from './useSkillStore';
import {
  AdvancedSettings,
  TRIGGER_TYPE_OPTIONS,
  type AdvancedValues,
} from './AdvancedSettings';

// ============================================================
// Option B — Describe it, then refine
//
// One question up front; a complete draft comes back; the author edits
// a structured result rather than a blank page. Pattern follows OpenAI
// GPT Builder (Create → Configure), Zapier Agents, Sierra Journeys and
// Salesforce Agentforce Builder.
//
// NOTE: the generator below is deterministic and rule-based — it is a
// stand-in for a model call so the flow can be evaluated as a design.
// ============================================================

interface Draft {
  name: string;
  description: string;
  rules: GuidanceRule[];
  tools: string[];
  runsOn: string;
  note: string;
  advanced: AdvancedValues;
}

const DEFAULT_ADVANCED: AdvancedValues = {
  providerConnection: EMPTY_VERSION.providerConnection,
  model: '',
  triggerType: 'event',
  budgetPerRunUsd: EMPTY_VERSION.budgetPerRunUsd,
  dailyBudgetUsd: EMPTY_VERSION.dailyBudgetUsd,
  maxIterations: EMPTY_VERSION.maxIterations,
};

const EXAMPLES = [
  'Spot people asking about refunds and hand them to a person',
  'Work out what language someone writes in and save it on their contact',
  'Summarise a conversation once it closes so the next person can catch up',
  'Notice when someone sounds upset and flag them for follow-up',
];

function rule(category: GuidanceRule['category'], text: string, apply: string[] = []): GuidanceRule {
  return { ...emptyRule(category), text, applyWhen: apply };
}

/** Stand-in for the model. Deterministic, keyword driven, intentionally simple. */
function generateDraft(input: string): Draft {
  const text = input.toLowerCase();
  const has = (...words: string[]) => words.some((w) => text.includes(w));

  const rules: GuidanceRule[] = [];
  const tools = new Set<string>(['contacts.fetch', 'conversations.fetch_history']);
  let name = 'New skill';
  let runsOn = 'Every time a customer sends a message';

  if (has('refund', 'return', 'cancel', 'complaint', 'upset', 'angry', 'escalat')) {
    name = has('upset', 'angry') ? 'Upset customers' : 'Refunds and returns';
    tools.add('contacts.classify');
    rules.push(
      rule(
        'when-to-act',
        'Read the last few messages and decide whether the person is raising this issue.',
        ['They ask directly', 'They describe the problem without naming it'],
      ),
      rule('escalation', 'Hand the conversation to a person rather than answering it yourself.'),
      rule('when-to-stop', 'Do nothing if the conversation is only about delivery timing.'),
    );
  }

  if (has('language', 'translat', 'speak')) {
    name = 'Language detection';
    tools.add('contacts.suggest_enrichment');
    rules.push(
      rule('when-to-act', "Work out the language from the customer's own messages only.", [
        'They write two or more full sentences',
      ]),
      rule(
        'when-to-stop',
        'Do nothing if they have only sent a greeting — that looks the same in most languages.',
      ),
    );
  }

  if (has('summar', 'recap', 'catch up', 'handover', 'handoff')) {
    name = 'Conversation summary';
    tools.add('conversations.fetch_messages');
    runsOn = 'When a conversation is closed';
    rules.push(
      rule('other', 'Write under 120 words, in plain past tense.'),
      rule('when-to-stop', 'Say so plainly if there is too little in the conversation to summarise.'),
    );
  }

  if (has('classif', 'tag', 'label', 'categor')) {
    name = name === 'New skill' ? 'Classification' : name;
    tools.add('contacts.classify');
    rules.push(
      rule('when-to-act', 'Only apply a label when the conversation clearly shows it.', [
        'The customer states it themselves',
      ]),
      rule('when-to-stop', 'Leave it alone when you are unsure. A wrong label is worse than none.'),
    );
  }

  if (rules.length === 0) {
    rules.push(
      rule('when-to-act', 'Read the recent messages and decide whether this applies.', [
        'Add an example of a conversation where it should run',
      ]),
      rule('when-to-stop', 'Do nothing when the conversation is unclear.'),
    );
  }

  rules.push(rule('tone', 'Be warm and direct. Short sentences. No jargon.'));

  const first = input.trim().replace(/\s+/g, ' ');
  return {
    name,
    description: first.charAt(0).toUpperCase() + first.slice(1),
    rules,
    tools: [...tools],
    runsOn,
    note: 'Everything below is a starting point. Change anything that looks wrong.',
    advanced: {
      ...DEFAULT_ADVANCED,
      triggerType: runsOn.toLowerCase().includes('by hand') ? 'manual' : 'event',
    },
  };
}

// ------------------------------------------------------------
// Step 1 — the single question
// ------------------------------------------------------------

function AskStep({ onGenerate }: { onGenerate: (input: string) => void }) {
  const [input, setInput] = useState('');

  return (
    <div className="flex flex-col gap-[24px]">
      <PageHeader
        title="What should this skill do?"
        blurb="Describe it the way you would explain it to a new teammate. We'll turn it into a working skill you can check and change."
      />

      <Card>
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          rows={5}
          autoFocus
          aria-label="What should this skill do"
          placeholder="When someone asks about a refund, work out whether it's genuine and pass it to a person rather than answering it."
          className={cn(inputClass, 'resize-y text-[15px] leading-[24px]')}
        />
        <div className="flex flex-col gap-[10px]">
          <span className="text-[12px] leading-[16px] text-foreground/50">
            Or start from one of these:
          </span>
          <div className="flex flex-wrap gap-[8px]">
            {EXAMPLES.map((example) => (
              <button
                key={example}
                onClick={() => setInput(example)}
                className="border border-border bg-background px-[10px] py-[6px] text-left text-[12px] leading-[16px] text-foreground/70 transition-colors hover:border-primary/40 hover:text-foreground"
              >
                {example}
              </button>
            ))}
          </div>
        </div>
        <div className="flex justify-end">
          <Button
            disabled={input.trim().length < 10}
            onClick={() => onGenerate(input)}
            title={input.trim().length < 10 ? 'Write a sentence first' : undefined}
          >
            <Wand2 className="h-[16px] w-[16px]" />
            Build it for me
          </Button>
        </div>
      </Card>
    </div>
  );
}

// ------------------------------------------------------------
// Step 2 — review the generated draft
// ------------------------------------------------------------

function ReviewStep({
  draft,
  onChange,
  onBack,
  onRegenerate,
  onSave,
  onTurnOn,
  isEditing = false,
}: {
  draft: Draft;
  onChange: (next: Draft) => void;
  onBack: () => void;
  onRegenerate: () => void;
  onSave: () => void;
  onTurnOn: () => void;
  isEditing?: boolean;
}) {
  return (
    <div className="flex flex-col gap-[24px]">
      <div className="flex flex-col gap-[12px] lg:flex-row lg:items-center lg:justify-between">
        <div className="flex min-w-0 items-center gap-[12px]">
          <Button variant="ghost" onClick={onBack} className="-ml-[8px] shrink-0">
            <ArrowLeft className="h-[16px] w-[16px]" />
            Back
          </Button>
          <h1 className="truncate text-[18px] leading-[26px] font-bold text-foreground">
            {isEditing ? `Edit ${draft.name}` : "Here's what we built"}
          </h1>
        </div>
        <div className="flex shrink-0 flex-wrap items-center gap-[8px]">
          {!isEditing && (
            <Button variant="outline" onClick={onRegenerate}>
              <RefreshCw className="h-[16px] w-[16px]" />
              Try again
            </Button>
          )}
          <Button variant="outline" onClick={onSave}>
            Save for later
          </Button>
          <Button onClick={onTurnOn}>Turn it on</Button>
        </div>
      </div>

      <div className="flex items-start gap-[10px] border border-primary/30 bg-primary/5 p-[16px]">
        <Sparkles className="mt-[2px] h-[16px] w-[16px] shrink-0 text-primary" />
        <span className="text-[13px] leading-[19px] text-foreground/75">{draft.note}</span>
      </div>

      <Card title="The basics">
        <Field label="Name">
          <input
            value={draft.name}
            onChange={(e) => onChange({ ...draft, name: e.target.value })}
            aria-label="Skill name"
            className={inputClass}
          />
        </Field>
        <Field label="What it's for">
          <textarea
            value={draft.description}
            onChange={(e) => onChange({ ...draft, description: e.target.value })}
            rows={2}
            aria-label="What it is for"
            className={cn(inputClass, 'resize-y')}
          />
        </Field>
        <Field label="When it runs">
          <Select
            value={draft.advanced.triggerType}
            onChange={(next) =>
              onChange({
                ...draft,
                advanced: { ...draft.advanced, triggerType: next as AdvancedValues['triggerType'] },
              })
            }
            aria-label="When it runs"
            options={TRIGGER_TYPE_OPTIONS}
          />
        </Field>
      </Card>

      <Card
        title="The rules we wrote"
        subtitle="Edit any of these. Delete the ones you don't want."
        action={
          <Button
            variant="outline"
            className="px-[10px]"
            onClick={() => onChange({ ...draft, rules: [...draft.rules, emptyRule()] })}
          >
            <Plus className="h-[14px] w-[14px]" />
            Add
          </Button>
        }
      >
        <div className="flex flex-col gap-[10px]">
          {draft.rules.map((r, idx) => (
            <div key={r.id} className="flex items-start gap-[10px] border border-border p-[12px]">
              <Pencil className="mt-[10px] h-[13px] w-[13px] shrink-0 text-foreground/30" />
              <textarea
                value={r.text}
                rows={2}
                aria-label={`Rule ${idx + 1}`}
                onChange={(e) => {
                  const rules = [...draft.rules];
                  rules[idx] = { ...r, text: e.target.value };
                  onChange({ ...draft, rules });
                }}
                className={cn(inputClass, 'resize-y text-[13px]')}
              />
              <button
                onClick={() =>
                  onChange({ ...draft, rules: draft.rules.filter((x) => x.id !== r.id) })
                }
                aria-label="Remove rule"
                className="mt-[6px] shrink-0 text-[12px] font-medium text-foreground/40 transition-colors hover:text-destructive"
              >
                Remove
              </button>
            </div>
          ))}
        </div>
      </Card>

      <Card
        title="What it's allowed to do"
        subtitle="We suggested these. Untick anything you're not comfortable with."
      >
        <div className="flex flex-col gap-[8px]">
          {TOOL_CATALOG.map((tool) => {
            const checked = draft.tools.includes(tool.id);
            return (
              <button
                key={tool.id}
                onClick={() =>
                  onChange({
                    ...draft,
                    tools: checked
                      ? draft.tools.filter((t) => t !== tool.id)
                      : [...draft.tools, tool.id],
                  })
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
        values={draft.advanced}
        onChange={(patch) => onChange({ ...draft, advanced: { ...draft.advanced, ...patch } })}
      />
    </div>
  );
}

// ------------------------------------------------------------
// Workflow
// ------------------------------------------------------------

/** Existing skill → the shape this workflow edits. */
function toDraft(skill: Skill): Draft {
  const version = skill.draft ?? skill.active;
  return {
    name: version?.name ?? skill.name,
    description: version?.description ?? skill.description,
    rules: version?.guidance ?? [],
    tools: version?.tools ?? [],
    runsOn:
      version?.triggerType === 'manual'
        ? 'Only when someone runs it by hand'
        : 'Every time a customer sends a message',
    note: 'Change anything here, then turn it on again to make it live.',
    advanced: {
      providerConnection: version?.providerConnection ?? DEFAULT_ADVANCED.providerConnection,
      model: version?.model ?? '',
      triggerType: version?.triggerType ?? 'event',
      budgetPerRunUsd: version?.budgetPerRunUsd ?? DEFAULT_ADVANCED.budgetPerRunUsd,
      dailyBudgetUsd: version?.dailyBudgetUsd ?? DEFAULT_ADVANCED.dailyBudgetUsd,
      maxIterations: version?.maxIterations ?? DEFAULT_ADVANCED.maxIterations,
    },
  };
}

export function DescribeWorkflow({ store }: { store: SkillStore }) {
  const [step, setStep] = useState<'list' | 'ask' | 'review'>('list');
  const [draft, setDraft] = useState<Draft | null>(null);
  const [source, setSource] = useState('');
  /** Set when editing an existing skill; null when creating a new one. */
  const [editingId, setEditingId] = useState<string | null>(null);

  const toVersion = (d: Draft): SkillVersion => ({
    ...EMPTY_VERSION,
    name: d.name,
    description: d.description,
    guidance: d.rules,
    instructions: composeInstructions(d.name, d.description, d.rules),
    tools: d.tools,
    ...d.advanced,
  });

  const finish = (d: Draft, turnOn: boolean) => {
    const version = toVersion(d);
    if (editingId) {
      if (turnOn) store.activate(editingId, version);
      else store.saveDraft(editingId, version);
    } else {
      const skill = store.create(version);
      if (turnOn) store.activate(skill.id, version);
      else toast.success('Saved — not running yet');
    }
    setStep('list');
    setDraft(null);
    setEditingId(null);
  };

  const openForEdit = (skill: Skill) => {
    setEditingId(skill.id);
    setDraft(toDraft(skill));
    setSource(skill.description);
    setStep('review');
  };

  if (step === 'ask') {
    return (
      <AskStep
        onGenerate={(input) => {
          setEditingId(null);
          setSource(input);
          setDraft(generateDraft(input));
          setStep('review');
          toast.success('Draft ready — check it over');
        }}
      />
    );
  }

  if (step === 'review' && draft) {
    return (
      <ReviewStep
        draft={draft}
        onChange={setDraft}
        onBack={() => setStep(editingId ? 'list' : 'ask')}
        isEditing={Boolean(editingId)}
        onRegenerate={() => {
          setDraft(generateDraft(source));
          toast.success('Rebuilt from your description');
        }}
        onSave={() => finish(draft, false)}
        onTurnOn={() => finish(draft, true)}
      />
    );
  }

  return (
    <div className="flex flex-col gap-[24px]">
      <PageHeader
        title="Skills"
        blurb="Describe what you want in a sentence and we'll build it. You check it before anything goes live."
        actions={
          <Button
            onClick={() => {
              setEditingId(null);
              setStep('ask');
            }}
          >
            <Wand2 className="h-[16px] w-[16px]" />
            Describe a new skill
          </Button>
        }
      />

      {store.skills.length === 0 ? (
        <EmptyState message="No skills yet. Tell us what you need in your own words.">
          <Button onClick={() => setStep('ask')}>
            <Wand2 className="h-[16px] w-[16px]" />
            Describe a new skill
          </Button>
        </EmptyState>
      ) : (
        <div className="grid gap-[16px] sm:grid-cols-2 xl:grid-cols-3">
          {store.skills.map((skill, idx) => (
            <motion.button
              key={skill.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.18, delay: idx * 0.03 }}
              onClick={() => openForEdit(skill)}
              className="flex flex-col gap-[10px] border border-border bg-background p-[16px] text-left transition-colors hover:border-primary/40"
            >
              <div className="flex items-start justify-between gap-[8px]">
                <span className="min-w-0 flex-1 truncate text-[14px] leading-[20px] font-semibold text-foreground">
                  {skill.name}
                </span>
                <StatusBadge status={skill.status} />
              </div>
              <p className="line-clamp-3 text-[13px] leading-[18px] text-foreground/60">
                {skill.description || 'No description yet.'}
              </p>
              <span className="text-[12px] leading-[16px] text-foreground/45">
                {skill.draft && skill.active
                  ? 'Unsaved changes'
                  : skill.active
                    ? 'Live'
                    : 'Not running yet'}
              </span>
            </motion.button>
          ))}
        </div>
      )}
    </div>
  );
}
