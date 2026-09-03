'use client';

import React from 'react';
import { motion } from 'motion/react';
import { ArrowRight, Check } from 'lucide-react';
import { cn } from '../types';
import { WORKFLOW_OPTIONS, type WorkflowId } from './workflow-options';

/**
 * Design-exploration chooser. Presents the candidate authoring workflows
 * as cards so they can be opened and compared as real screens.
 */
export function WorkflowChooser({ onPick }: { onPick: (id: WorkflowId) => void }) {
  return (
    <div className="flex flex-col gap-[24px]">
      <div className="flex flex-col gap-[4px]">
        <h1 className="text-[20px] leading-[28px] font-bold text-foreground">Skill Sets</h1>
        <p className="max-w-[760px] text-[14px] leading-[20px] text-foreground/60">
          Four candidate authoring workflows over the same data. Open any one and use it end to end
          — skills you create in one appear in the others.
        </p>
      </div>

      <div className="grid gap-[16px] md:grid-cols-2 xl:grid-cols-4">
        {WORKFLOW_OPTIONS.map((option, idx) => (
          <motion.button
            key={option.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2, delay: idx * 0.05 }}
            onClick={() => onPick(option.id)}
            className={cn(
              'group flex flex-col gap-[16px] border p-[20px] text-left transition-colors',
              option.isDefault
                ? 'border-primary bg-primary/5 hover:bg-primary/10'
                : 'border-border bg-background hover:bg-secondary/40',
            )}
          >
            <div className="flex flex-col gap-[8px]">
              <div className="flex flex-wrap items-center gap-[8px]">
                <h2 className="text-[15px] leading-[22px] font-semibold text-foreground">
                  {option.title}
                </h2>
                {option.isDefault && (
                  <span className="inline-flex items-center gap-[4px] border border-primary/30 bg-primary/10 px-[8px] py-[1px] text-[11px] leading-[16px] font-medium text-primary">
                    <Check className="h-[11px] w-[11px]" />
                    Current
                  </span>
                )}
                {option.status === 'planned' && (
                  <span className="border border-border bg-secondary/60 px-[8px] py-[1px] text-[11px] leading-[16px] font-medium text-foreground/55">
                    Not built yet
                  </span>
                )}
              </div>
              <p className="text-[13px] leading-[19px] text-foreground/70">{option.summary}</p>
            </div>

            <div className="flex flex-1 flex-col gap-[12px] border-t border-border pt-[16px]">
              <Detail label="Why" body={option.reason} />
              <Detail label="Trade-off" body={option.tradeoff} />
              <Detail label="Best for" body={option.bestFor} />
              <Detail label="Used by" body={option.evidence} />
            </div>

            <span className="inline-flex items-center gap-[6px] text-[13px] leading-[18px] font-medium text-primary">
              {option.status === 'built' ? 'Open this workflow' : 'Preview'}
              <ArrowRight className="h-[14px] w-[14px] transition-transform group-hover:translate-x-[2px]" />
            </span>
          </motion.button>
        ))}
      </div>
    </div>
  );
}

function Detail({ label, body }: { label: string; body: string }) {
  return (
    <div className="flex flex-col gap-[3px]">
      <span className="text-[11px] leading-[16px] font-medium tracking-wider uppercase text-foreground/45">
        {label}
      </span>
      <span className="text-[12px] leading-[18px] text-foreground/65">{body}</span>
    </div>
  );
}

/** Slim bar shown above a chosen workflow so it can be swapped without a reload. */
export function WorkflowBar({
  title,
  onChange,
}: {
  title: string;
  onChange: () => void;
}) {
  return (
    <div className="mb-[24px] flex items-center justify-between gap-[16px] border border-border bg-secondary/30 px-[16px] py-[8px]">
      <span className="min-w-0 truncate text-[13px] leading-[18px] text-foreground/60">
        Workflow: <span className="font-medium text-foreground">{title}</span>
      </span>
      <button
        onClick={onChange}
        className="shrink-0 text-[13px] leading-[18px] font-medium text-primary hover:underline"
      >
        Change
      </button>
    </div>
  );
}

/** Placeholder for a workflow that has been chosen but not designed yet. */
export function WorkflowPlaceholder({ id }: { id: WorkflowId }) {
  const option = WORKFLOW_OPTIONS.find((o) => o.id === id);
  if (!option) return null;

  return (
    <div className="flex min-h-[420px] items-center justify-center border border-dashed border-border">
      <div className="flex max-w-[520px] flex-col items-center gap-[12px] px-[24px] py-[40px] text-center">
        <h2 className="text-[16px] leading-[24px] font-semibold text-foreground">
          {option.title}
        </h2>
        <p className="text-[13px] leading-[19px] text-foreground/60">{option.summary}</p>
        <p className="text-[13px] leading-[19px] text-foreground/45">
          Not built yet — we&rsquo;re still deciding what this should look like.
        </p>
      </div>
    </div>
  );
}
