'use client';

import React, { useState } from 'react';
import { motion } from 'motion/react';
import { toast } from 'sonner';
import { ArrowLeft, ArrowRight, Check, Plus } from 'lucide-react';
import { cn } from '../types';
import { AccessBadge, Button, EmptyState, PageHeader, StatusBadge, inputClass } from './ui';
import {
  EMPTY_VERSION,
  TOOL_CATALOG,
  composeInstructions,
  emptyRule,
  type Skill,
  type SkillVersion,
} from '../../lib/skills-data';
import type { SkillStore } from './useSkillStore';
import { AdvancedSettings, type AdvancedValues } from './AdvancedSettings';

// ============================================================
// Option C — Guided setup
//
// One question per screen, ending in a review before anything runs.
// Follows GOV.UK "one thing per page" and "check your answers", and
// NN/g's guidance that wizards suit infrequent, novice tasks.
// ============================================================

interface Answers {
  name: string;
  purpose: string;
  runsOn: 'message' | 'closed' | 'manual';
  canRead: string[];
  canChange: string[];
  handoff: string;
  /** Daily budget lives on `advanced` only — one source of truth. */
  advanced: AdvancedValues;
}

const EMPTY_ANSWERS: Answers = {
  name: '',
  purpose: '',
  runsOn: 'message',
  canRead: [],
  canChange: [],
  handoff: '',
  advanced: {
    providerConnection: EMPTY_VERSION.providerConnection,
    model: '',
    triggerType: 'event',
    budgetPerRunUsd: EMPTY_VERSION.budgetPerRunUsd,
    dailyBudgetUsd: 10,
    maxIterations: EMPTY_VERSION.maxIterations,
  },
};

const READ_TOOLS = TOOL_CATALOG.filter((t) => t.access === 'read');
const WRITE_TOOLS = TOOL_CATALOG.filter((t) => t.access === 'write');

const RUNS_ON_LABEL: Record<Answers['runsOn'], string> = {
  message: 'Every time a customer sends a message',
  closed: 'When a conversation is closed',
  manual: 'Only when someone runs it by hand',
};

interface Step {
  id: string;
  question: string;
  help: string;
  /** Empty when the step is answered; otherwise the reason it isn't. */
  problem: (a: Answers) => string | null;
}

const STEPS: Step[] = [
  {
    id: 'name',
    question: 'What do you want to call it?',
    help: 'Something your teammates will recognise in a list.',
    problem: (a) => (a.name.trim() ? null : 'Enter a name'),
  },
  {
    id: 'purpose',
    question: 'What should it do?',
    help: 'One or two sentences in your own words. This is what the AI follows.',
    problem: (a) =>
      a.purpose.trim().length >= 15 ? null : 'Describe what it should do, in a sentence',
  },
  {
    id: 'when',
    question: 'When should it run?',
    help: 'You can change this later.',
    problem: () => null,
  },
  {
    id: 'read',
    question: 'What should it be able to look at?',
    help: 'It can only read what you pick here. Reading never changes anything.',
    problem: (a) => (a.canRead.length > 0 ? null : 'Pick at least one thing it can look at'),
  },
  {
    id: 'change',
    question: 'What should it be allowed to change?',
    help: "Leave everything unticked and it will only ever suggest, never act.",
    problem: () => null,
  },
  {
    id: 'handoff',
    question: 'When should a person take over?',
    help: 'Describe the situations you never want handled automatically.',
    problem: () => null,
  },
  {
    id: 'budget',
    question: 'How much can it spend a day?',
    help: 'It stops when it reaches this. You can raise it later.',
    problem: (a) => (a.advanced.dailyBudgetUsd > 0 ? null : 'Enter an amount above zero'),
  },
];

// ------------------------------------------------------------
// Individual question screens
// ------------------------------------------------------------

function ChoiceRow({
  checked,
  title,
  body,
  warn,
  badge,
  onClick,
}: {
  checked: boolean;
  title: string;
  body: string;
  warn?: string;
  badge?: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      aria-pressed={checked}
      className={cn(
        'flex items-start gap-[12px] border p-[14px] text-left transition-colors',
        checked ? 'border-primary bg-primary/5' : 'border-border bg-background hover:bg-secondary/40',
      )}
    >
      <span
        className={cn(
          'mt-[2px] flex h-[18px] w-[18px] shrink-0 items-center justify-center border',
          checked ? 'border-primary bg-primary' : 'border-border bg-background',
        )}
      >
        {checked && <Check aria-hidden="true" className="h-[12px] w-[12px] text-primary-foreground" />}
      </span>
      <span className="flex min-w-0 flex-1 flex-col gap-[2px]">
        <span className="text-[14px] leading-[20px] font-medium text-foreground">{title}</span>
        <span className="text-[13px] leading-[18px] text-foreground/55">{body}</span>
        {checked && warn && (
          <span className="mt-[2px] text-[12px] leading-[16px] text-amber-700">{warn}</span>
        )}
      </span>
      {badge}
    </button>
  );
}

function QuestionBody({
  step,
  answers,
  set,
}: {
  step: Step;
  answers: Answers;
  set: (patch: Partial<Answers>) => void;
}) {
  switch (step.id) {
    case 'name':
      return (
        <input
          value={answers.name}
          onChange={(e) => set({ name: e.target.value })}
          autoFocus
          placeholder="e.g. Refund requests"
          aria-label={step.question}
          className={cn(inputClass, 'text-[16px]')}
        />
      );

    case 'purpose':
      return (
        <textarea
          value={answers.purpose}
          onChange={(e) => set({ purpose: e.target.value })}
          rows={5}
          autoFocus
          placeholder="Read the recent messages, work out whether the customer is asking for a refund, and pass it to a person instead of answering."
          aria-label={step.question}
          className={cn(inputClass, 'resize-y text-[15px] leading-[24px]')}
        />
      );

    case 'when':
      return (
        <div className="flex flex-col gap-[8px]">
          {(Object.keys(RUNS_ON_LABEL) as Answers['runsOn'][]).map((key) => (
            <ChoiceRow
              key={key}
              checked={answers.runsOn === key}
              title={RUNS_ON_LABEL[key]}
              body={
                key === 'message'
                  ? 'Most skills use this.'
                  : key === 'closed'
                    ? 'Good for summaries and wrap-up notes.'
                    : 'Nothing happens automatically.'
              }
              onClick={() => set({ runsOn: key })}
            />
          ))}
        </div>
      );

    case 'read':
      return (
        <div className="flex flex-col gap-[8px]">
          {READ_TOOLS.map((tool) => (
            <ChoiceRow
              key={tool.id}
              checked={answers.canRead.includes(tool.id)}
              title={tool.label}
              body={tool.description}
              badge={<AccessBadge access={tool.access} />}
              onClick={() =>
                set({
                  canRead: answers.canRead.includes(tool.id)
                    ? answers.canRead.filter((t) => t !== tool.id)
                    : [...answers.canRead, tool.id],
                })
              }
            />
          ))}
        </div>
      );

    case 'change':
      return (
        <div className="flex flex-col gap-[8px]">
          {WRITE_TOOLS.map((tool) => (
            <ChoiceRow
              key={tool.id}
              checked={answers.canChange.includes(tool.id)}
              title={tool.label}
              body={tool.description}
              warn="Once this is on, the skill can change your data without asking."
              badge={<AccessBadge access={tool.access} />}
              onClick={() =>
                set({
                  canChange: answers.canChange.includes(tool.id)
                    ? answers.canChange.filter((t) => t !== tool.id)
                    : [...answers.canChange, tool.id],
                })
              }
            />
          ))}
          {answers.canChange.length === 0 && (
            <p className="text-[13px] leading-[18px] text-emerald-700">
              Nothing selected — this skill will only ever read and report.
            </p>
          )}
        </div>
      );

    case 'handoff':
      return (
        <textarea
          value={answers.handoff}
          onChange={(e) => set({ handoff: e.target.value })}
          rows={4}
          autoFocus
          placeholder="Anyone who sounds distressed, mentions a complaint, or asks for a manager."
          aria-label={step.question}
          className={cn(inputClass, 'resize-y text-[15px] leading-[24px]')}
        />
      );

    case 'budget':
      return (
        <div className="flex items-center gap-[10px]">
          <span className="text-[18px] leading-[26px] text-foreground/60">$</span>
          <input
            type="number"
            min={1}
            step="1"
            value={answers.advanced.dailyBudgetUsd}
            onChange={(e) =>
              set({
                advanced: {
                  ...answers.advanced,
                  dailyBudgetUsd: Math.max(0, Number(e.target.value) || 0),
                },
              })
            }
            aria-label={step.question}
            className={cn(inputClass, 'max-w-[160px] font-mono text-[16px]')}
          />
          <span className="text-[14px] leading-[20px] text-foreground/60">a day</span>
        </div>
      );

    default:
      return null;
  }
}

// ------------------------------------------------------------
// Review — "check your answers"
// ------------------------------------------------------------

function toolNames(ids: string[]) {
  if (ids.length === 0) return 'Nothing';
  return ids.map((id) => TOOL_CATALOG.find((t) => t.id === id)?.label ?? id).join(', ');
}

function Review({
  answers,
  onEdit,
  onBack,
  onTurnOn,
  onSave,
  onAdvancedChange,
}: {
  answers: Answers;
  onEdit: (stepIndex: number) => void;
  onBack: () => void;
  onTurnOn: () => void;
  onSave: () => void;
  onAdvancedChange: (patch: Partial<AdvancedValues>) => void;
}) {
  const rows: { label: string; value: string; step: number }[] = [
    { label: 'Name', value: answers.name, step: 0 },
    { label: 'What it does', value: answers.purpose, step: 1 },
    { label: 'When it runs', value: RUNS_ON_LABEL[answers.runsOn], step: 2 },
    { label: 'Can look at', value: toolNames(answers.canRead), step: 3 },
    { label: 'Can change', value: toolNames(answers.canChange), step: 4 },
    { label: 'Hands over when', value: answers.handoff || 'Not set', step: 5 },
    { label: 'Daily limit', value: `$${answers.advanced.dailyBudgetUsd.toFixed(2)}`, step: 6 },
  ];

  return (
    <div className="flex flex-col gap-[24px]">
      <div className="flex items-center gap-[12px]">
        <Button variant="ghost" onClick={onBack} className="-ml-[8px] shrink-0">
          <ArrowLeft className="h-[16px] w-[16px]" />
          Back
        </Button>
        <h1 className="text-[18px] leading-[26px] font-bold text-foreground">Check your answers</h1>
      </div>

      <div className="border border-border">
        {rows.map((row, idx) => (
          <div
            key={row.label}
            className={cn(
              'grid gap-[8px] p-[16px] sm:grid-cols-[200px_1fr_80px] sm:items-start',
              idx > 0 && 'border-t border-border',
            )}
          >
            <span className="text-[13px] leading-[20px] font-medium text-foreground/60">
              {row.label}
            </span>
            <span className="text-[14px] leading-[20px] break-words text-foreground">
              {row.value}
            </span>
            <button
              onClick={() => onEdit(row.step)}
              aria-label={`Change ${row.label.toLowerCase()}`}
              className="text-left text-[13px] leading-[20px] font-medium text-primary hover:underline sm:text-right"
            >
              Change
            </button>
          </div>
        ))}
      </div>

      {answers.canChange.length > 0 && (
        <div className="border border-amber-200 bg-amber-50 p-[16px]">
          <p className="text-[13px] leading-[19px] text-amber-800">
            Once you turn this on, it can change {toolNames(answers.canChange).toLowerCase()} on its
            own, up to ${answers.advanced.dailyBudgetUsd.toFixed(2)} of work a day. You can pause it at any
            time.
          </p>
        </div>
      )}

      <AdvancedSettings
        values={answers.advanced}
        showTrigger={false}
        summary="Which AI service to use and how much it can spend. You already chose when it runs."
        onChange={onAdvancedChange}
      />

      <div className="flex flex-wrap items-center justify-end gap-[8px]">
        <Button variant="outline" onClick={onSave}>
          Save without turning on
        </Button>
        <Button onClick={onTurnOn}>Turn it on</Button>
      </div>
    </div>
  );
}

// ------------------------------------------------------------
// Wizard
// ------------------------------------------------------------

function Wizard({
  onCancel,
  onFinish,
  initial,
  startOnReview = false,
}: {
  onCancel: () => void;
  onFinish: (answers: Answers, turnOn: boolean) => void;
  initial?: Answers;
  /** Editing an existing skill opens on the review, not question one. */
  startOnReview?: boolean;
}) {
  const [answers, setAnswers] = useState<Answers>(initial ?? EMPTY_ANSWERS);
  const [index, setIndex] = useState(startOnReview ? STEPS.length : 0);
  const [showProblem, setShowProblem] = useState(false);
  const reviewing = index >= STEPS.length;

  const set = (patch: Partial<Answers>) => {
    setAnswers((prev) => ({ ...prev, ...patch }));
    setShowProblem(false);
  };

  if (reviewing) {
    return (
      <Review
        answers={answers}
        onAdvancedChange={(patch) =>
          setAnswers((prev) => ({ ...prev, advanced: { ...prev.advanced, ...patch } }))
        }
        onEdit={setIndex}
        onBack={() => (startOnReview ? onCancel() : setIndex(STEPS.length - 1))}
        onSave={() => onFinish(answers, false)}
        onTurnOn={() => onFinish(answers, true)}
      />
    );
  }

  const step = STEPS[index];
  const problem = step.problem(answers);

  const next = () => {
    if (problem) {
      setShowProblem(true);
      return;
    }
    setShowProblem(false);
    setIndex(startOnReview ? STEPS.length : index + 1);
  };

  return (
    <div className="flex flex-col gap-[24px]">
      <div className="flex items-center gap-[12px]">
        <Button
          variant="ghost"
          onClick={() => (index === 0 ? onCancel() : setIndex((i) => i - 1))}
          className="-ml-[8px] shrink-0"
        >
          <ArrowLeft className="h-[16px] w-[16px]" />
          Back
        </Button>
        <span className="text-[13px] leading-[20px] text-foreground/50">
          Step {index + 1} of {STEPS.length}
        </span>
      </div>

      <div className="h-[3px] w-full bg-secondary">
        <motion.div
          className="h-full bg-primary"
          initial={false}
          animate={{ width: `${((index + 1) / STEPS.length) * 100}%` }}
          transition={{ duration: 0.25 }}
        />
      </div>

      <motion.div
        key={step.id}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.18 }}
        className="flex max-w-[680px] flex-col gap-[20px]"
      >
        <div className="flex flex-col gap-[6px]">
          <h1 className="text-[22px] leading-[30px] font-bold text-foreground">{step.question}</h1>
          <p className="text-[14px] leading-[20px] text-foreground/60">{step.help}</p>
        </div>

        {showProblem && problem && (
          <div className="border-l-2 border-destructive bg-destructive/5 py-[8px] pl-[12px]">
            <span className="text-[14px] leading-[20px] font-medium text-destructive">
              {problem}
            </span>
          </div>
        )}

        <QuestionBody step={step} answers={answers} set={set} />

        <div>
          <Button onClick={next}>
            Continue
            <ArrowRight className="h-[16px] w-[16px]" />
          </Button>
        </div>
      </motion.div>
    </div>
  );
}

// ------------------------------------------------------------
// Workflow
// ------------------------------------------------------------

/** Existing skill → wizard answers, so the review screen can edit it. */
function toAnswers(skill: Skill): Answers {
  const version = skill.draft ?? skill.active;
  const tools = version?.tools ?? [];
  const handoffRule = (version?.guidance ?? []).find((r) => r.category === 'escalation');
  return {
    name: version?.name ?? skill.name,
    purpose: version?.description ?? skill.description,
    runsOn:
      version?.triggerType === 'manual'
        ? 'manual'
        : version?.triggerParams.includes('conversation.closed')
          ? 'closed'
          : 'message',
    canRead: tools.filter((t) => READ_TOOLS.some((r) => r.id === t)),
    canChange: tools.filter((t) => WRITE_TOOLS.some((w) => w.id === t)),
    handoff: handoffRule?.text.replace(/^Hand over to a person when:\s*/i, '') ?? '',
    advanced: {
      providerConnection: version?.providerConnection ?? EMPTY_VERSION.providerConnection,
      model: version?.model ?? '',
      triggerType: version?.triggerType ?? 'event',
      budgetPerRunUsd: version?.budgetPerRunUsd ?? EMPTY_VERSION.budgetPerRunUsd,
      dailyBudgetUsd: version?.dailyBudgetUsd ?? 10,
      maxIterations: version?.maxIterations ?? EMPTY_VERSION.maxIterations,
    },
  };
}

export function GuidedWorkflow({ store }: { store: SkillStore }) {
  const [creating, setCreating] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const toVersion = (a: Answers): SkillVersion => {
    const rules = [
      { ...emptyRule('when-to-act'), text: a.purpose },
      ...(a.handoff.trim()
        ? [{ ...emptyRule('escalation'), text: `Hand over to a person when: ${a.handoff.trim()}` }]
        : []),
    ];
    return {
      ...EMPTY_VERSION,
      name: a.name,
      description: a.purpose,
      guidance: rules,
      instructions: composeInstructions(a.name, a.purpose, rules),
      tools: [...a.canRead, ...a.canChange],
      providerConnection: a.advanced.providerConnection,
      model: a.advanced.model,
      triggerType: a.runsOn === 'manual' ? 'manual' : 'event',
      budgetPerRunUsd: a.advanced.budgetPerRunUsd,
      dailyBudgetUsd: a.advanced.dailyBudgetUsd,
      maxIterations: a.advanced.maxIterations,
    };
  };

  const finish = (a: Answers, turnOn: boolean) => {
    const version = toVersion(a);
    if (editingId) {
      if (turnOn) store.activate(editingId, version);
      else store.saveDraft(editingId, version);
    } else {
      const skill = store.create(version);
      if (turnOn) store.activate(skill.id, version);
      else toast.success('Saved — not running yet');
    }
    setCreating(false);
    setEditingId(null);
  };

  const editing = store.skills.find((s) => s.id === editingId) ?? null;

  if (editing) {
    return (
      <Wizard
        key={editing.id}
        initial={toAnswers(editing)}
        startOnReview
        onCancel={() => setEditingId(null)}
        onFinish={finish}
      />
    );
  }

  if (creating) {
    return <Wizard onCancel={() => setCreating(false)} onFinish={finish} />;
  }

  return (
    <div className="flex flex-col gap-[24px]">
      <PageHeader
        title="Skills"
        blurb="We'll ask you a few questions, one at a time, then show you everything before anything goes live."
        actions={
          <Button onClick={() => setCreating(true)}>
            <Plus className="h-[16px] w-[16px]" />
            Set up a skill
          </Button>
        }
      />

      {store.skills.length === 0 ? (
        <EmptyState message="No skills yet. It takes about two minutes to set one up.">
          <Button onClick={() => setCreating(true)}>
            <Plus className="h-[16px] w-[16px]" />
            Set up a skill
          </Button>
        </EmptyState>
      ) : (
        <div className="grid gap-[16px] sm:grid-cols-2 xl:grid-cols-3">
          {store.skills.map((skill, idx) => (
            <motion.div
              key={skill.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.18, delay: idx * 0.03 }}
              className="flex flex-col gap-[10px] border border-border bg-background p-[16px]"
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
              <div className="flex items-center gap-[4px]">
                <Button
                  variant="ghost"
                  className="px-[8px]"
                  onClick={() => setEditingId(skill.id)}
                >
                  Review answers
                </Button>
                <span className="h-[14px] w-px bg-border" />
                <Button
                  variant="ghost"
                  className="px-[8px]"
                  onClick={() =>
                    store.setStatus(skill.id, skill.status === 'active' ? 'paused' : 'active')
                  }
                >
                  {skill.status === 'active' ? 'Pause' : 'Turn on'}
                </Button>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
