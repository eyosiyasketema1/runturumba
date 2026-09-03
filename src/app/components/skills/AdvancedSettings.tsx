'use client';

import React, { useState } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { cn } from '../types';
import { Card, Field, Select, inputClass } from './ui';
import { PROVIDER_CONNECTIONS, type TriggerType } from '../../lib/skills-data';

// ============================================================
// Model & provider · Trigger · Budget & limits
//
// The same three panels in every workflow. In the plain-language
// workflows they sit behind a disclosure (NN/g progressive disclosure)
// so they are reachable without being the first thing an author meets.
// ============================================================

export interface AdvancedValues {
  providerConnection: string;
  model: string;
  triggerType: TriggerType;
  budgetPerRunUsd: number;
  dailyBudgetUsd: number;
  maxIterations: number;
}

export const TRIGGER_TYPE_OPTIONS: { value: TriggerType; label: string }[] = [
  { value: 'manual', label: 'Manual' },
  { value: 'event', label: 'Event' },
  { value: 'schedule', label: 'Schedule' },
];

const TRIGGER_HELP: Record<TriggerType, string> = {
  manual: 'Nothing happens until someone runs it.',
  event: 'Runs when something happens in a conversation.',
  schedule: 'Runs on a repeating timetable.',
};

export function AdvancedPanels({
  values,
  onChange,
  showTrigger = true,
}: {
  values: AdvancedValues;
  onChange: (patch: Partial<AdvancedValues>) => void;
  /** Hidden where the workflow already asks when it runs in plain language. */
  showTrigger?: boolean;
}) {
  const provider = PROVIDER_CONNECTIONS.find((p) => p.id === values.providerConnection);
  const models = provider?.models ?? [];

  return (
    <>
      <Card title="Model & provider">
        <Field label="Provider connection">
          <Select
            value={values.providerConnection}
            onChange={(next) => onChange({ providerConnection: next, model: '' })}
            aria-label="Provider connection"
            options={PROVIDER_CONNECTIONS.map((p) => ({ value: p.id, label: p.label }))}
          />
        </Field>
        <Field label="Model">
          <Select
            value={values.model}
            onChange={(next) => onChange({ model: next })}
            disabled={models.length === 0}
            placeholder="None"
            aria-label="Model"
            options={models.map((m) => ({ value: m.id, label: m.label }))}
          />
          {models.length === 0 && (
            <span className="text-[12px] leading-[16px] text-foreground/50">
              No models listed for this provider.
            </span>
          )}
        </Field>
      </Card>

      {showTrigger && (
        <Card title="Trigger">
          <Field label="Trigger type" hint={TRIGGER_HELP[values.triggerType]}>
            <Select
              value={values.triggerType}
              onChange={(next) => onChange({ triggerType: next as TriggerType })}
              aria-label="Trigger type"
              options={TRIGGER_TYPE_OPTIONS}
            />
          </Field>
        </Card>
      )}

      <Card title="Budget & limits" subtitle="Hard limits. The skill stops when it hits one.">
        <Field label="Budget per run (USD)">
          <input
            type="number"
            step="0.0001"
            min={0}
            value={values.budgetPerRunUsd}
            onChange={(e) => onChange({ budgetPerRunUsd: Math.max(0, Number(e.target.value) || 0) })}
            aria-label="Budget per run (USD)"
            className={cn(inputClass, 'font-mono')}
          />
        </Field>
        <Field label="Daily budget (USD)">
          <input
            type="number"
            step="0.01"
            min={0}
            value={values.dailyBudgetUsd}
            onChange={(e) => onChange({ dailyBudgetUsd: Math.max(0, Number(e.target.value) || 0) })}
            aria-label="Daily budget (USD)"
            className={cn(inputClass, 'font-mono')}
          />
        </Field>
        <Field
          label="Max iterations (1–10)"
          hint="How many times it can think again before it gives up."
        >
          <input
            type="number"
            min={1}
            max={10}
            value={values.maxIterations}
            onChange={(e) =>
              onChange({ maxIterations: Math.min(10, Math.max(1, Number(e.target.value) || 1)) })
            }
            aria-label="Max iterations (1–10)"
            className={cn(inputClass, 'font-mono')}
          />
        </Field>
      </Card>
    </>
  );
}

/** Collapsed wrapper for the plain-language workflows. */
export function AdvancedSettings({
  values,
  onChange,
  showTrigger = true,
  summary,
}: {
  values: AdvancedValues;
  onChange: (patch: Partial<AdvancedValues>) => void;
  showTrigger?: boolean;
  /** Optional one-liner shown while collapsed. */
  summary?: string;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="flex flex-col gap-[16px]">
      <button
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-controls="skill-advanced-panels"
        className="flex items-center justify-between gap-[12px] border border-border bg-secondary/20 px-[20px] py-[14px] text-left transition-colors hover:bg-secondary/40"
      >
        <span className="flex min-w-0 flex-col gap-[2px]">
          <span className="text-[14px] leading-[20px] font-semibold text-foreground">
            Advanced settings
          </span>
          <span className="text-[12px] leading-[18px] text-foreground/55">
            {summary ??
              'Which AI service to use, when it runs, and how much it can spend. Sensible defaults are already set.'}
          </span>
        </span>
        {open ? (
          <ChevronDown className="h-[16px] w-[16px] shrink-0 text-foreground/50" />
        ) : (
          <ChevronRight className="h-[16px] w-[16px] shrink-0 text-foreground/50" />
        )}
      </button>

      {open && (
        <div id="skill-advanced-panels" className="flex flex-col gap-[16px]">
          <AdvancedPanels values={values} onChange={onChange} showTrigger={showTrigger} />
        </div>
      )}
    </div>
  );
}
