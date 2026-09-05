'use client';

import React, { useMemo, useRef, useState } from 'react';
import { motion } from 'motion/react';
import { toast } from 'sonner';
import {
  AlertTriangle,
  ArrowLeft,
  Bold,
  CheckCircle2,
  ChevronDown,
  Code2,
  FlaskConical,
  Heading2,
  History,
  Italic,
  Link2,
  List,
  ListOrdered,
  Pencil,
  Plus,
  Quote,
  Rocket,
  Search,
  Sparkles,
  Strikethrough,
  Trash2,
  X,
  XCircle,
} from 'lucide-react';
import { cn } from './types';
import { WorkflowBar, WorkflowChooser } from './skills/WorkflowChooser';
import { WORKFLOW_OPTIONS, type WorkflowId } from './skills/workflow-options';
import { GuidanceWorkflow } from './skills/GuidanceWorkflow';
import { DescribeWorkflow } from './skills/DescribeWorkflow';
import { GuidedWorkflow } from './skills/GuidedWorkflow';
import { useSkillStore, type SkillStore } from './skills/useSkillStore';
import { GuideModal } from './skills/GuideModal';
import type { GuideKind } from './skills/guide-questions';
import {
  AccessBadge,
  Button,
  Card,
  CategoryChip,
  Field,
  Label,
  Select,
  StatusBadge,
  inputClass,
  monoClass,
} from './skills/ui';
import {
  EMPTY_VERSION,
  PROVIDER_CONNECTIONS,
  STARTER_TEMPLATES,
  TOOL_CATALOG,
  TOOL_CATEGORIES,
  validateVersion,
  type OutputMode,
  type Skill,
  type SkillStatus,
  type SkillVersion,
  type StarterTemplate,
  type TriggerType,
  type ValidationIssue,
} from '../lib/skills-data';


// ============================================================
// MARKDOWN (preview for the instructions editor)
// ============================================================

function renderInline(text: string, keyBase: string): React.ReactNode[] {
  const out: React.ReactNode[] = [];
  const pattern = /(\*\*[^*]+\*\*|\*[^*]+\*|~~[^~]+~~|`[^`]+`|\[[^\]]+\]\([^)]+\))/g;
  let last = 0;
  let match: RegExpExecArray | null;
  let i = 0;

  while ((match = pattern.exec(text)) !== null) {
    if (match.index > last) out.push(text.slice(last, match.index));
    const token = match[0];
    const key = `${keyBase}-${i++}`;
    if (token.startsWith('**')) out.push(<strong key={key}>{token.slice(2, -2)}</strong>);
    else if (token.startsWith('~~')) out.push(<s key={key}>{token.slice(2, -2)}</s>);
    else if (token.startsWith('`'))
      out.push(
        <code key={key} className="bg-secondary/60 px-[4px] py-[1px] font-mono text-[12px]">
          {token.slice(1, -1)}
        </code>,
      );
    else if (token.startsWith('[')) {
      const m = /\[([^\]]+)\]\(([^)]+)\)/.exec(token);
      out.push(
        <span key={key} className="text-primary underline">
          {m?.[1] ?? token}
        </span>,
      );
    } else out.push(<em key={key}>{token.slice(1, -1)}</em>);
    last = match.index + token.length;
  }
  if (last < text.length) out.push(text.slice(last));
  return out;
}

function Markdown({ source }: { source: string }) {
  const lines = source.split('\n');
  const blocks: React.ReactNode[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    const heading = /^(#{1,3})\s+(.*)$/.exec(line);
    if (heading) {
      const level = heading[1].length;
      blocks.push(
        <p
          key={i}
          className={cn(
            'mt-[16px] font-semibold text-foreground first:mt-0',
            level === 1 ? 'text-[16px] leading-[24px]' : 'text-[14px] leading-[20px]',
          )}
        >
          {renderInline(heading[2], `h${i}`)}
        </p>,
      );
      i++;
      continue;
    }

    if (/^>\s?/.test(line)) {
      const quote: string[] = [];
      while (i < lines.length && /^>\s?/.test(lines[i])) {
        quote.push(lines[i].replace(/^>\s?/, ''));
        i++;
      }
      blocks.push(
        <blockquote
          key={`q${i}`}
          className="my-[8px] border-l-2 border-border pl-[12px] text-[14px] leading-[22px] text-foreground/70"
        >
          {quote.join(' ')}
        </blockquote>,
      );
      continue;
    }

    if (/^\s*[-*]\s+/.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^\s*[-*]\s+/.test(lines[i])) {
        items.push(lines[i].replace(/^\s*[-*]\s+/, ''));
        i++;
      }
      blocks.push(
        <ul key={`u${i}`} className="my-[8px] list-disc pl-[20px]">
          {items.map((it, idx) => (
            <li key={idx} className="text-[14px] leading-[22px] text-foreground/80">
              {renderInline(it, `u${i}-${idx}`)}
            </li>
          ))}
        </ul>,
      );
      continue;
    }

    if (/^\s*\d+\.\s+/.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^\s*\d+\.\s+/.test(lines[i])) {
        items.push(lines[i].replace(/^\s*\d+\.\s+/, ''));
        i++;
      }
      blocks.push(
        <ol key={`o${i}`} className="my-[8px] list-decimal pl-[20px]">
          {items.map((it, idx) => (
            <li key={idx} className="text-[14px] leading-[22px] text-foreground/80">
              {renderInline(it, `o${i}-${idx}`)}
            </li>
          ))}
        </ol>,
      );
      continue;
    }

    if (/^(-{3,}|_{3,})$/.test(line.trim())) {
      blocks.push(<hr key={i} className="my-[16px] border-border" />);
      i++;
      continue;
    }

    if (line.trim() === '') {
      i++;
      continue;
    }

    blocks.push(
      <p key={i} className="my-[8px] text-[14px] leading-[22px] text-foreground/80">
        {renderInline(line, `p${i}`)}
      </p>,
    );
    i++;
  }

  return <div>{blocks}</div>;
}

function MarkdownToolbar({
  textareaRef,
  value,
  onChange,
}: {
  textareaRef: React.RefObject<HTMLTextAreaElement | null>;
  value: string;
  onChange: (next: string) => void;
}) {
  const wrap = (before: string, after = '', placeholder = '') => {
    const el = textareaRef.current;
    if (!el) return;
    const { selectionStart: start, selectionEnd: end } = el;
    const selected = value.slice(start, end) || placeholder;
    onChange(value.slice(0, start) + before + selected + after + value.slice(end));
    requestAnimationFrame(() => {
      el.focus();
      el.setSelectionRange(start + before.length, start + before.length + selected.length);
    });
  };

  const items: ({ icon: typeof Bold; label: string; run: () => void } | 'sep')[] = [
    { icon: Bold, label: 'Bold', run: () => wrap('**', '**', 'bold text') },
    { icon: Italic, label: 'Italic', run: () => wrap('*', '*', 'italic text') },
    { icon: Strikethrough, label: 'Strikethrough', run: () => wrap('~~', '~~', 'text') },
    'sep',
    { icon: Heading2, label: 'Heading', run: () => wrap('## ', '', 'Heading') },
    { icon: Quote, label: 'Quote', run: () => wrap('> ', '', 'Quote') },
    { icon: Code2, label: 'Code', run: () => wrap('`', '`', 'code') },
    { icon: Link2, label: 'Link', run: () => wrap('[', '](url)', 'link text') },
    'sep',
    { icon: List, label: 'Bullet list', run: () => wrap('- ', '', 'List item') },
    { icon: ListOrdered, label: 'Numbered list', run: () => wrap('1. ', '', 'List item') },
  ];

  return (
    <div className="flex flex-wrap items-center gap-[2px] border-b border-border bg-secondary/30 px-[8px] py-[6px]">
      {items.map((item, idx) =>
        item === 'sep' ? (
          <span key={idx} className="mx-[4px] h-[16px] w-px bg-border" />
        ) : (
          <button
            key={idx}
            type="button"
            title={item.label}
            aria-label={item.label}
            onClick={item.run}
            className="p-[6px] text-foreground/60 transition-colors hover:bg-secondary hover:text-foreground"
          >
            <item.icon className="h-[14px] w-[14px]" />
          </button>
        ),
      )}
    </div>
  );
}

// ============================================================
// LIST
// ============================================================

function SkillsList({
  skills,
  onCreate,
  onClone,
  onOpen,
}: {
  skills: Skill[];
  onCreate: () => void;
  onClone: () => void;
  onOpen: (skill: Skill) => void;
}) {
  const [search, setSearch] = useState('');
  const [tab, setTab] = useState<'all' | SkillStatus>('all');

  const counts = useMemo(
    () => ({
      all: skills.length,
      active: skills.filter((s) => s.status === 'active').length,
      paused: skills.filter((s) => s.status === 'paused').length,
    }),
    [skills],
  );

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return skills.filter(
      (s) =>
        (tab === 'all' || s.status === tab) &&
        (!q || s.name.toLowerCase().includes(q) || s.description.toLowerCase().includes(q)),
    );
  }, [skills, search, tab]);

  const tabs: { id: 'all' | SkillStatus; label: string; count: number }[] = [
    { id: 'all', label: 'All', count: counts.all },
    { id: 'active', label: 'Active', count: counts.active },
    { id: 'paused', label: 'Paused', count: counts.paused },
  ];

  return (
    <div className="flex flex-col gap-[24px]">
      <div className="flex flex-col gap-[16px] sm:flex-row sm:items-start sm:justify-between">
        <div className="flex flex-col gap-[4px]">
          <h1 className="text-[20px] leading-[28px] font-bold text-foreground">Skill Sets</h1>
          <p className="max-w-[720px] text-[14px] leading-[20px] text-foreground/60">
            Create and manage AI skills — each one is an agent definition (prompt, model, tools and
            budgets) that powers your automations.
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-[8px]">
          <Button variant="outline" onClick={onClone}>
            <Sparkles className="h-[16px] w-[16px]" />
            Clone a template
          </Button>
          <Button onClick={onCreate}>
            <Plus className="h-[16px] w-[16px]" />
            Create Skill Set
          </Button>
        </div>
      </div>

      <div className="flex flex-col gap-[12px] sm:flex-row sm:items-center">
        <div className="relative w-full sm:max-w-[336px]">
          <Search className="pointer-events-none absolute left-[12px] top-1/2 h-[16px] w-[16px] -translate-y-1/2 text-foreground/40" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search skill sets..."
            aria-label="Search skill sets"
            className={cn(inputClass, 'pl-[36px]')}
          />
        </div>
        <div className="flex items-center gap-[4px] border border-border bg-secondary/40 p-[4px]">
          {tabs.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={cn(
                'px-[12px] py-[6px] text-[14px] leading-[20px] font-medium transition-colors',
                tab === t.id
                  ? 'bg-background text-foreground'
                  : 'bg-transparent text-foreground/60 hover:text-foreground',
              )}
            >
              {t.label} ({t.count})
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="flex min-h-[560px] items-center justify-center border border-dashed border-border">
          <div className="flex flex-col items-center gap-[16px] px-[24px] text-center">
            <p className="text-[14px] leading-[20px] text-foreground/60">
              {skills.length === 0
                ? 'No skills yet. Create your first one to get started.'
                : 'No skill sets match your search.'}
            </p>
            {skills.length === 0 && (
              <div className="flex items-center gap-[8px]">
                <Button variant="outline" onClick={onClone}>
                  <Sparkles className="h-[16px] w-[16px]" />
                  Clone a template
                </Button>
                <Button onClick={onCreate}>
                  <Plus className="h-[16px] w-[16px]" />
                  Create Skill Set
                </Button>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="grid gap-[16px] sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map((skill, idx) => (
            <motion.button
              key={skill.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.18, delay: idx * 0.03 }}
              onClick={() => onOpen(skill)}
              className="flex flex-col gap-[10px] border border-border bg-background p-[16px] text-left transition-colors hover:border-primary/40"
            >
              <div className="flex items-start justify-between gap-[8px]">
                <span className="min-w-0 flex-1 truncate text-[14px] leading-[20px] font-semibold text-foreground">
                  {skill.name}
                </span>
                <StatusBadge status={skill.status} />
              </div>
              <p className="line-clamp-2 text-[13px] leading-[18px] text-foreground/60">
                {skill.description}
              </p>
              <div className="flex flex-wrap items-center gap-x-[16px] gap-y-[4px] text-[12px] leading-[16px] text-foreground/50">
                <span>
                  {skill.active ? `v${skill.active.version} live` : 'No active version'}
                </span>
                {skill.draft && <span className="text-amber-600">Draft pending</span>}
              </div>
            </motion.button>
          ))}
        </div>
      )}
    </div>
  );
}

// ============================================================
// CLONE MODAL
// ============================================================

function CloneModal({
  onClose,
  onClone,
}: {
  onClose: () => void;
  onClone: (template: StarterTemplate, overrides: CloneOverrides) => void;
}) {
  const [selected, setSelected] = useState<StarterTemplate | null>(null);
  const [name, setName] = useState('');
  const [provider, setProvider] = useState('');
  const [model, setModel] = useState('');
  const [dailyBudget, setDailyBudget] = useState('100.00');

  const pick = (template: StarterTemplate) => {
    setSelected(template);
    setName(template.name);
    setProvider('');
    setModel('');
    setDailyBudget('100.00');
  };

  const providerModels =
    PROVIDER_CONNECTIONS.find((p) => p.id === provider)?.models.map((m) => ({
      value: m.id,
      label: m.label,
    })) ?? [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-[24px]">
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.18 }}
        role="dialog"
        aria-label="Clone a starter skill"
        className="flex max-h-[85vh] w-full max-w-[640px] flex-col overflow-y-auto border border-border bg-background p-[24px]"
      >
        <div className="flex items-start justify-between gap-[16px]">
          <div className="flex flex-col gap-[4px]">
            <h2 className="flex items-center gap-[8px] text-[16px] leading-[24px] font-semibold text-foreground">
              <Sparkles className="h-[16px] w-[16px] text-primary" />
              Clone a starter skill
            </h2>
            <p className="text-[13px] leading-[18px] text-foreground/60">
              Start from a template. The clone is created as a draft — review and activate it to go
              live.
            </p>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="p-[4px] text-foreground/50 transition-colors hover:text-foreground"
          >
            <X className="h-[16px] w-[16px]" />
          </button>
        </div>

        <div className="mt-[20px] grid gap-[12px] sm:grid-cols-2">
          {STARTER_TEMPLATES.map((template) => (
            <button
              key={template.id}
              onClick={() => pick(template)}
              aria-pressed={selected?.id === template.id}
              className={cn(
                'flex flex-col gap-[6px] border p-[16px] text-left transition-colors',
                selected?.id === template.id
                  ? 'border-primary bg-primary/5'
                  : 'border-border bg-background hover:bg-secondary/40',
              )}
            >
              <span className="text-[14px] leading-[20px] font-semibold text-foreground">
                {template.name}
              </span>
              <span className="flex-1 text-[13px] leading-[18px] text-foreground/60">
                {template.description}
              </span>
              <span className="flex flex-wrap items-center gap-x-[12px] gap-y-[2px] text-[12px] leading-[16px] text-foreground/45">
                <span>{template.version.tools.length} tools</span>
                <span>{template.version.triggerType}</span>
                <span className="font-mono">${template.version.dailyBudgetUsd.toFixed(2)}/day</span>
              </span>
            </button>
          ))}
        </div>

        {selected && (
          <>
            <div className="mt-[20px] border-t border-border pt-[20px]">
              <Label>Overrides (optional)</Label>
            </div>

            <div className="mt-[12px] flex flex-col gap-[16px]">
              <Field label="Name">
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  aria-label="Clone name"
                  className={inputClass}
                />
              </Field>

              <div className="grid gap-[16px] sm:grid-cols-2">
                <Field label="Provider connection">
                  <Select
                    value={provider}
                    onChange={(v) => {
                      setProvider(v);
                      setModel('');
                    }}
                    placeholder="Use template default"
                    aria-label="Provider connection"
                    options={PROVIDER_CONNECTIONS.map((p) => ({ value: p.id, label: p.label }))}
                  />
                </Field>
                <Field label="Model">
                  <Select
                    value={model}
                    onChange={setModel}
                    disabled={!provider || providerModels.length === 0}
                    placeholder="Use template default"
                    aria-label="Model"
                    options={providerModels}
                  />
                </Field>
              </div>

              <Field label="Daily budget (USD)">
                <input
                  value={dailyBudget}
                  onChange={(e) => setDailyBudget(e.target.value)}
                  inputMode="decimal"
                  aria-label="Daily budget in USD"
                  className={cn(inputClass, 'font-mono')}
                />
              </Field>
            </div>
          </>
        )}

        <div className="mt-[24px] flex items-center justify-end gap-[8px]">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            disabled={!selected}
            onClick={() =>
              selected &&
              onClone(selected, {
                name: name.trim() || selected.name,
                providerConnection: provider,
                model,
                dailyBudgetUsd: Number(dailyBudget) || selected.version.dailyBudgetUsd,
              })
            }
          >
            Clone as draft
          </Button>
        </div>
      </motion.div>
    </div>
  );
}

interface CloneOverrides {
  name: string;
  providerConnection: string;
  model: string;
  dailyBudgetUsd: number;
}

// ============================================================
// DETAIL
// ============================================================

function SkillDetail({
  skill,
  onBack,
  onEdit,
  onDelete,
  onRunTest,
}: {
  skill: Skill;
  onBack: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onRunTest: () => void;
}) {
  const active = skill.active;

  return (
    <div className="flex flex-col gap-[24px]">
      <div className="flex flex-col gap-[12px] lg:flex-row lg:items-start lg:justify-between">
        <div className="flex min-w-0 items-start gap-[12px]">
          <Button variant="ghost" onClick={onBack} className="-ml-[8px] shrink-0">
            <ArrowLeft className="h-[16px] w-[16px]" />
            Back
          </Button>
          <div className="flex min-w-0 flex-col gap-[4px]">
            <div className="flex items-center gap-[10px]">
              <h1 className="truncate text-[18px] leading-[26px] font-bold text-foreground">
                {skill.name}
              </h1>
              <StatusBadge status={skill.status} />
            </div>
            <p className="max-w-[560px] text-[13px] leading-[18px] text-foreground/60">
              {skill.description}
            </p>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-[8px]">
          <Button variant="outline" onClick={onRunTest}>
            <FlaskConical className="h-[16px] w-[16px]" />
            Run a test
          </Button>
          <Button variant="outline" onClick={onEdit}>
            <Pencil className="h-[16px] w-[16px]" />
            Edit
          </Button>
          <Button variant="outline" onClick={onDelete} aria-label="Delete skill" className="px-[10px]">
            <Trash2 className="h-[16px] w-[16px]" />
          </Button>
        </div>
      </div>

      {skill.draft && (
        <div className="flex flex-col gap-[12px] border border-amber-200 bg-amber-50 p-[16px] sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-[10px]">
            <Rocket className="mt-[2px] h-[16px] w-[16px] shrink-0 text-amber-600" />
            <div className="flex flex-col">
              <span className="text-[14px] leading-[20px] font-semibold text-amber-800">
                A draft is pending activation
              </span>
              <span className="text-[13px] leading-[18px] text-amber-700">
                Review and activate it to make these changes live.
              </span>
            </div>
          </div>
          <Button variant="outline" onClick={onEdit} className="shrink-0 bg-background">
            Review draft
          </Button>
        </div>
      )}

      {!active ? (
        <div className="border border-border p-[20px]">
          <p className="text-[14px] leading-[20px] text-foreground/70">
            This skill has no active version yet. Edit it to create and activate one.
          </p>
        </div>
      ) : (
        <>
          <Card title="System prompt">
            <div className="border border-border bg-secondary/20 p-[20px]">
              <Markdown source={active.instructions} />
            </div>
          </Card>

          <div className="grid gap-x-[24px] gap-y-[16px] border border-border p-[20px] sm:grid-cols-2 lg:grid-cols-3">
            {[
              { label: 'Model', value: active.model || '—' },
              { label: 'Output mode', value: active.outputMode },
              { label: 'Trigger', value: active.triggerType },
              { label: 'Per-run budget', value: `$${active.budgetPerRunUsd.toFixed(4)}` },
              { label: 'Daily budget', value: `$${active.dailyBudgetUsd.toFixed(2)}` },
              { label: 'Max iterations', value: String(active.maxIterations) },
            ].map((item) => (
              <div key={item.label} className="flex flex-col gap-[4px]">
                <Label>{item.label}</Label>
                <span className="text-[14px] leading-[20px] text-foreground">{item.value}</span>
              </div>
            ))}
          </div>

          <Card title={`Enabled tools (${active.tools.length})`}>
            <div className="flex flex-col gap-[8px]">
              {active.tools.length === 0 && (
                <p className="text-[13px] leading-[18px] text-foreground/50">No tools enabled.</p>
              )}
              {active.tools.map((toolId) => {
                const tool = TOOL_CATALOG.find((t) => t.id === toolId);
                return (
                  <div
                    key={toolId}
                    className="flex items-center justify-between gap-[12px] border border-border p-[12px]"
                  >
                    <div className="flex min-w-0 flex-col gap-[2px]">
                      <span className="text-[13px] leading-[18px] font-medium text-foreground">
                        {tool?.label ?? toolId}
                      </span>
                      <span className="font-mono text-[12px] leading-[16px] text-primary/80">
                        {toolId}
                      </span>
                    </div>
                    {tool && (
                      <div className="flex shrink-0 items-center gap-[8px]">
                        <CategoryChip category={tool.category} />
                        <AccessBadge access={tool.access} />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </Card>

          {skill.history.length > 0 && (
            <Card title={`Version history (${skill.history.length})`}>
              <div className="flex flex-col gap-[8px]">
                {skill.history.map((v) => (
                  <div
                    key={v.version}
                    className="flex items-center justify-between gap-[12px] border border-border p-[12px]"
                  >
                    <span className="text-[13px] leading-[18px] font-medium text-foreground">
                      v{v.version} — {v.name}
                    </span>
                    <span className="font-mono text-[12px] leading-[16px] text-foreground/50">
                      {new Date(v.activatedAt).toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </>
      )}
    </div>
  );
}

// ============================================================
// EDITOR
// ============================================================

function ValidationPanel({
  issues,
  onDismiss,
}: {
  issues: ValidationIssue[];
  onDismiss: () => void;
}) {
  const errors = issues.filter((i) => i.level === 'error');
  const warnings = issues.filter((i) => i.level === 'warning');

  return (
    <Card
      title="Validation"
      subtitle="Warnings are non-blocking. Activation is allowed once there are no errors."
      action={
        <button
          onClick={onDismiss}
          aria-label="Dismiss validation"
          className="shrink-0 p-[4px] text-foreground/50 transition-colors hover:text-foreground"
        >
          <X className="h-[16px] w-[16px]" />
        </button>
      }
    >
      {issues.length === 0 ? (
        <div className="flex items-center gap-[10px] border border-dashed border-border p-[16px]">
          <CheckCircle2 className="h-[16px] w-[16px] shrink-0 text-emerald-600" />
          <span className="text-[14px] leading-[20px] text-foreground/80">
            No issues found — press Activate again to go live.
          </span>
        </div>
      ) : (
        <div className="flex flex-col gap-[8px]">
          {[...errors, ...warnings].map((issue, idx) => (
            <div
              key={idx}
              className={cn(
                'flex items-start gap-[10px] border p-[12px]',
                issue.level === 'error'
                  ? 'border-destructive/30 bg-destructive/5'
                  : 'border-amber-200 bg-amber-50',
              )}
            >
              {issue.level === 'error' ? (
                <XCircle className="mt-[2px] h-[15px] w-[15px] shrink-0 text-destructive" />
              ) : (
                <AlertTriangle className="mt-[2px] h-[15px] w-[15px] shrink-0 text-amber-600" />
              )}
              <span
                className={cn(
                  'text-[13px] leading-[18px]',
                  issue.level === 'error' ? 'text-destructive' : 'text-amber-800',
                )}
              >
                {issue.message}
              </span>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}

function ToolsPicker({
  selected,
  onToggle,
}: {
  selected: string[];
  onToggle: (id: string) => void;
}) {
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return TOOL_CATALOG.filter(
      (t) =>
        (!category || t.category === category) &&
        (!q ||
          t.label.toLowerCase().includes(q) ||
          t.id.toLowerCase().includes(q) ||
          t.description.toLowerCase().includes(q)),
    );
  }, [search, category]);

  return (
    <Card
      title="Tools"
      subtitle="Platform functions this skill may call."
      action={
        <span className="shrink-0 border border-border bg-secondary/40 px-[8px] py-[2px] text-[12px] leading-[16px] text-foreground/60">
          {selected.length} selected
        </span>
      }
    >
      <div className="flex flex-col gap-[12px] sm:flex-row">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-[12px] top-1/2 h-[16px] w-[16px] -translate-y-1/2 text-foreground/40" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search tools..."
            aria-label="Search tools"
            className={cn(inputClass, 'pl-[36px]')}
          />
        </div>
        <div className="sm:w-[200px]">
          <Select
            value={category}
            onChange={setCategory}
            placeholder="All categories"
            aria-label="Filter by category"
            options={TOOL_CATEGORIES.map((c) => ({ value: c, label: c }))}
          />
        </div>
      </div>

      <div className="flex flex-col gap-[8px]">
        {filtered.length === 0 && (
          <p className="py-[12px] text-[13px] leading-[18px] text-foreground/50">
            No tools match your search.
          </p>
        )}
        {filtered.map((tool) => {
          const checked = selected.includes(tool.id);
          return (
            <button
              key={tool.id}
              onClick={() => onToggle(tool.id)}
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
              <span className="flex min-w-0 flex-1 flex-col gap-[3px]">
                <span className="flex flex-wrap items-center gap-[8px]">
                  <span className="text-[13px] leading-[18px] font-semibold text-foreground">
                    {tool.label}
                  </span>
                  <span className="border border-border bg-secondary/40 px-[6px] py-[1px] font-mono text-[12px] leading-[16px] text-foreground/70">
                    {tool.id}
                  </span>
                </span>
                <span className="text-[12px] leading-[18px] text-foreground/55">
                  {tool.description}
                </span>
              </span>
              <span className="flex shrink-0 items-center gap-[6px]">
                <CategoryChip category={tool.category} />
                <AccessBadge access={tool.access} />
              </span>
            </button>
          );
        })}
      </div>
    </Card>
  );
}

function SkillEditor({
  skill,
  onBack,
  onSaveDraft,
  onActivate,
}: {
  skill: Skill;
  onBack: () => void;
  onSaveDraft: (version: SkillVersion) => void;
  onActivate: (version: SkillVersion) => void;
}) {
  const base = skill.draft ?? skill.active ?? { ...EMPTY_VERSION, name: skill.name };
  const [v, setV] = useState<SkillVersion>({ ...base });
  const [tab, setTab] = useState<'edit' | 'preview'>('edit');
  const [showHistory, setShowHistory] = useState(false);
  /** Validation stays hidden until an activation attempt fails. */
  const [showValidation, setShowValidation] = useState(false);
  /** Which guided-composition modal is open, if any. */
  const [guide, setGuide] = useState<GuideKind | null>(null);
  const instructionsRef = useRef<HTMLTextAreaElement>(null);
  const validationRef = useRef<HTMLDivElement>(null);

  const set = <K extends keyof SkillVersion>(key: K, value: SkillVersion[K]) =>
    setV((prev) => ({ ...prev, [key]: value }));

  const issues = useMemo(() => validateVersion(v), [v]);
  const errorCount = issues.filter((i) => i.level === 'error').length;
  const hasErrors = errorCount > 0;

  const handleActivateClick = () => {
    if (!hasErrors) {
      onActivate(v);
      return;
    }
    setShowValidation(true);
    toast.error(
      `Resolve ${errorCount} ${errorCount === 1 ? 'error' : 'errors'} before activating`,
    );
    requestAnimationFrame(() =>
      validationRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }),
    );
  };

  const providerModels =
    PROVIDER_CONNECTIONS.find((p) => p.id === v.providerConnection)?.models ?? [];

  return (
    <div className="flex flex-col gap-[24px]">
      {/* Header */}
      <div className="flex flex-col gap-[12px] lg:flex-row lg:items-center lg:justify-between">
        <div className="flex min-w-0 items-center gap-[12px]">
          <Button variant="ghost" onClick={onBack} className="-ml-[8px] shrink-0">
            <ArrowLeft className="h-[16px] w-[16px]" />
            Back
          </Button>
          <h1 className="truncate text-[18px] leading-[26px] font-bold text-foreground">
            Edit: {skill.name}
          </h1>
        </div>
        <div className="flex shrink-0 flex-wrap items-center gap-[8px]">
          <Button variant="outline" onClick={() => setShowHistory((s) => !s)}>
            <History className="h-[16px] w-[16px]" />
            Version history
          </Button>
          <Button variant="outline" onClick={onBack}>
            Cancel
          </Button>
          <Button variant="outline" onClick={() => onSaveDraft(v)}>
            Save draft
          </Button>
          <Button onClick={handleActivateClick}>
            <Rocket className="h-[16px] w-[16px]" />
            Activate
          </Button>
        </div>
      </div>

      {showHistory && (
        <Card title={`Version history (${skill.history.length})`}>
          {skill.history.length === 0 ? (
            <p className="text-[13px] leading-[18px] text-foreground/50">
              No versions have been activated yet.
            </p>
          ) : (
            <div className="flex flex-col gap-[8px]">
              {skill.history.map((h) => (
                <div
                  key={h.version}
                  className="flex items-center justify-between gap-[12px] border border-border p-[12px]"
                >
                  <span className="text-[13px] leading-[18px] font-medium text-foreground">
                    v{h.version} — {h.name}
                  </span>
                  <div className="flex items-center gap-[12px]">
                    <span className="font-mono text-[12px] leading-[16px] text-foreground/50">
                      {new Date(h.activatedAt).toLocaleString()}
                    </span>
                    <Button
                      variant="ghost"
                      aria-label={`Restore version ${h.version}`}
                      onClick={() => {
                        const { version: _v, activatedAt: _a, ...rest } = h;
                        setV(rest);
                        toast.success(`Restored v${h.version} into the draft`);
                      }}
                    >
                      Restore
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      )}

      {showValidation && (
        <div ref={validationRef}>
          <ValidationPanel issues={issues} onDismiss={() => setShowValidation(false)} />
        </div>
      )}

      <div className="grid gap-[24px] lg:grid-cols-[1fr_360px]">
        {/* LEFT */}
        <div className="flex min-w-0 flex-col gap-[24px]">
          <Card title="Details">
            <Field label="Name">
              <input
                value={v.name}
                onChange={(e) => set('name', e.target.value)}
                aria-label="Skill name"
                className={inputClass}
              />
            </Field>
            <Field label="Description">
              <textarea
                value={v.description}
                onChange={(e) => set('description', e.target.value)}
                rows={3}
                aria-label="Skill description"
                className={cn(inputClass, 'resize-y')}
              />
            </Field>
          </Card>

          <Card
            title="Instructions"
            subtitle="Write instructions in Markdown to guide AI behavior"
            action={
              <div className="flex shrink-0 items-center gap-[8px]">
                <Button variant="outline" onClick={() => setGuide('instructions')}>
                  <Sparkles className="h-[14px] w-[14px]" />
                  Instruction guide
                </Button>
                <div className="flex shrink-0 items-center gap-[2px] border border-border p-[2px]">
                  {(['edit', 'preview'] as const).map((t) => (
                    <button
                      key={t}
                      onClick={() => setTab(t)}
                      className={cn(
                        'px-[12px] py-[4px] text-[13px] leading-[18px] font-medium capitalize transition-colors',
                        tab === t
                          ? 'bg-secondary text-foreground'
                          : 'bg-transparent text-foreground/60 hover:text-foreground',
                      )}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>
            }
          >
            {tab === 'edit' ? (
              <div className="border border-border focus-within:border-primary">
                <MarkdownToolbar
                  textareaRef={instructionsRef}
                  value={v.instructions}
                  onChange={(next) => set('instructions', next)}
                />
                <textarea
                  ref={instructionsRef}
                  value={v.instructions}
                  onChange={(e) => set('instructions', e.target.value)}
                  aria-label="Instructions"
                  placeholder={'You are a ...\n\nRules:\n1. ...'}
                  className={cn(
                    'w-full min-h-[420px] resize-y bg-background px-[16px] py-[12px] text-foreground outline-none placeholder:text-foreground/40',
                    monoClass,
                  )}
                />
              </div>
            ) : (
              <div className="min-h-[420px] border border-border bg-secondary/20 p-[20px]">
                {v.instructions.trim() ? (
                  <Markdown source={v.instructions} />
                ) : (
                  <p className="text-[13px] leading-[18px] text-foreground/50 italic">
                    Nothing to preview yet.
                  </p>
                )}
              </div>
            )}
          </Card>

          <Card
            title="User prompt template"
            subtitle={
              <>
                Rendered per run. Use <code className="font-mono">{'{{variable}}'}</code>{' '}
                placeholders for runtime values.
              </>
            }
            action={
              <Button variant="outline" onClick={() => setGuide('userPrompt')}>
                <Sparkles className="h-[14px] w-[14px]" />
                Prompt guide
              </Button>
            }
          >
            <textarea
              value={v.userPromptTemplate}
              onChange={(e) => set('userPromptTemplate', e.target.value)}
              aria-label="User prompt template"
              className={cn(inputClass, monoClass, 'min-h-[300px] resize-y')}
            />
          </Card>

          <Card title="Output">
            <Field label="Output mode">
              <Select
                value={v.outputMode}
                onChange={(next) => set('outputMode', next as OutputMode)}
                aria-label="Output mode"
                options={[
                  { value: 'text', label: 'Text' },
                  { value: 'structured', label: 'Structured (JSON)' },
                ]}
              />
            </Field>
            {v.outputMode === 'structured' && (
              <Field
                label="Output schema"
                hint="JSON Schema describing the structured output. Required for structured mode."
              >
                <textarea
                  value={v.outputSchema}
                  onChange={(e) => set('outputSchema', e.target.value)}
                  aria-label="Output schema"
                  className={cn(inputClass, monoClass, 'min-h-[380px] resize-y')}
                />
              </Field>
            )}
          </Card>

          <ToolsPicker
            selected={v.tools}
            onToggle={(id) =>
              set('tools', v.tools.includes(id) ? v.tools.filter((t) => t !== id) : [...v.tools, id])
            }
          />
        </div>

        {/* RIGHT */}
        <div className="flex min-w-0 flex-col gap-[24px]">
          <Card title="Model & provider">
            <Field label="Provider connection">
              <Select
                value={v.providerConnection}
                onChange={(next) => {
                  set('providerConnection', next);
                  set('model', '');
                }}
                aria-label="Provider connection"
                options={PROVIDER_CONNECTIONS.map((p) => ({ value: p.id, label: p.label }))}
              />
            </Field>
            <Field label="Model">
              <Select
                value={v.model}
                onChange={(next) => set('model', next)}
                disabled={providerModels.length === 0}
                placeholder="None"
                aria-label="Model"
                options={providerModels.map((m) => ({ value: m.id, label: m.label }))}
              />
              {providerModels.length === 0 && (
                <span className="text-[12px] leading-[16px] text-foreground/50">
                  No models listed for this provider.
                </span>
              )}
            </Field>
          </Card>

          <Card title="Trigger">
            <Field label="Trigger type">
              <Select
                value={v.triggerType}
                onChange={(next) => set('triggerType', next as TriggerType)}
                aria-label="Trigger type"
                options={[
                  { value: 'event', label: 'Event' },
                  { value: 'manual', label: 'Manual' },
                  { value: 'schedule', label: 'Schedule' },
                ]}
              />
            </Field>
            <Field label="Trigger params" hint="JSON object passed to the trigger.">
              <textarea
                value={v.triggerParams}
                onChange={(e) => set('triggerParams', e.target.value)}
                aria-label="Trigger params"
                className={cn(inputClass, monoClass, 'min-h-[280px] resize-y')}
              />
            </Field>
          </Card>

          <Card title="Budget & limits">
            <Field label="Budget per run (USD)">
              <input
                type="number"
                step="0.0001"
                min={0}
                value={v.budgetPerRunUsd}
                onChange={(e) => set('budgetPerRunUsd', Math.max(0, Number(e.target.value) || 0))}
                aria-label="Budget per run in USD"
                className={cn(inputClass, 'font-mono')}
              />
            </Field>
            <Field label="Daily budget (USD)">
              <input
                type="number"
                step="0.01"
                min={0}
                value={v.dailyBudgetUsd}
                onChange={(e) => set('dailyBudgetUsd', Math.max(0, Number(e.target.value) || 0))}
                aria-label="Daily budget in USD"
                className={cn(inputClass, 'font-mono')}
              />
            </Field>
            <Field label="Max iterations (1–10)">
              <input
                type="number"
                min={1}
                max={10}
                value={v.maxIterations}
                onChange={(e) => set('maxIterations', Number(e.target.value) || 1)}
                aria-label="Max iterations"
                className={cn(inputClass, 'font-mono')}
              />
            </Field>
          </Card>
        </div>
      </div>

      {guide && (
        <GuideModal
          kind={guide}
          existing={guide === 'instructions' ? v.instructions : v.userPromptTemplate}
          onClose={() => setGuide(null)}
          onInsert={(composed) => {
            set(guide === 'instructions' ? 'instructions' : 'userPromptTemplate', composed);
            setGuide(null);
            setTab('edit');
            toast.success(
              guide === 'instructions' ? 'Instructions written in' : 'Prompt written in',
            );
          }}
        />
      )}
    </div>
  );
}

// ============================================================
// MAIN VIEW
// ============================================================

function ConfigFormWorkflow({ store }: { store: SkillStore }) {
  const [view, setView] = useState<'list' | 'detail' | 'editor'>('list');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [cloneOpen, setCloneOpen] = useState(false);

  const selected = store.skills.find((s) => s.id === selectedId) ?? null;

  const handleCreate = () => {
    const skill = store.create({ name: 'Untitled skill' });
    setSelectedId(skill.id);
    setView('editor');
  };

  const handleClone = (template: StarterTemplate, overrides: CloneOverrides) => {
    const draft: SkillVersion = {
      ...template.version,
      name: overrides.name,
      providerConnection: overrides.providerConnection || template.version.providerConnection,
      model: overrides.model || template.version.model,
      dailyBudgetUsd: overrides.dailyBudgetUsd,
    };
    const skill = store.create(draft);
    setSelectedId(skill.id);
    setCloneOpen(false);
    setView('detail');
    toast.success('Cloned as draft — review and activate it to go live');
  };

  const handleSaveDraft = (version: SkillVersion) => {
    if (!selected) return;
    store.saveDraft(selected.id, version);
    setView('detail');
  };

  const handleActivate = (version: SkillVersion) => {
    if (!selected) return;
    store.activate(selected.id, version);
    setView('detail');
  };

  const handleDelete = () => {
    if (!selected) return;
    store.remove(selected.id);
    setSelectedId(null);
    setView('list');
  };

  return (
    <>
      {view === 'list' && (
        <SkillsList
          skills={store.skills}
          onCreate={handleCreate}
          onClone={() => setCloneOpen(true)}
          onOpen={(skill) => {
            setSelectedId(skill.id);
            setView('detail');
          }}
        />
      )}

      {view === 'detail' && selected && (
        <SkillDetail
          skill={selected}
          onBack={() => setView('list')}
          onEdit={() => setView('editor')}
          onDelete={handleDelete}
          onRunTest={() => toast.info('Test runs are not wired up yet')}
        />
      )}

      {view === 'editor' && selected && (
        <SkillEditor
          key={selected.id}
          skill={selected}
          onBack={() => setView('detail')}
          onSaveDraft={handleSaveDraft}
          onActivate={handleActivate}
        />
      )}

      {cloneOpen && <CloneModal onClose={() => setCloneOpen(false)} onClone={handleClone} />}
    </>
  );
}

// ============================================================
// ENTRY — workflow chooser
// ============================================================

export function SkillSetsView() {
  const [workflow, setWorkflow] = useState<WorkflowId | null>(null);
  const option = WORKFLOW_OPTIONS.find((o) => o.id === workflow);
  // One store behind every workflow, so the same skills show up in all of them.
  const store = useSkillStore();

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="p-[24px] lg:p-[32px]"
    >
      {!workflow || !option ? (
        <WorkflowChooser onPick={setWorkflow} />
      ) : (
        <>
          <WorkflowBar title={option.title} onChange={() => setWorkflow(null)} />
          {option.id === 'form' && <ConfigFormWorkflow store={store} />}
          {option.id === 'guidance' && <GuidanceWorkflow store={store} />}
          {option.id === 'describe' && <DescribeWorkflow store={store} />}
          {option.id === 'guided' && <GuidedWorkflow store={store} />}
        </>
      )}
    </motion.div>
  );
}
