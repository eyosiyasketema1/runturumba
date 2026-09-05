'use client';

import React, { useMemo, useRef, useState } from 'react';
import { motion } from 'motion/react';
import { AlertTriangle, Plus, Sparkles, X } from 'lucide-react';
import { cn } from '../types';
import { Button, Label, inputClass, monoClass } from './ui';
import {
  TEMPLATE_VARIABLES,
  composeFromGuide,
  guideProblems,
  questionsFor,
  type GuideAnswers,
  type GuideKind,
} from './guide-questions';

// ============================================================
// Guided composition modal
//
// Asks plain-language questions and writes the composed markdown into
// the field the author was looking at. Opened from the Instructions and
// User prompt template cards in the configuration form.
// ============================================================

const TITLES: Record<GuideKind, { title: string; blurb: string; button: string }> = {
  instructions: {
    title: 'Instruction guide',
    blurb:
      'Answer what you can and we will write the instructions for you. You can edit the result afterwards.',
    button: 'Insert instructions',
  },
  userPrompt: {
    title: 'Prompt guide',
    blurb:
      'This is the briefing the skill gets on every run. Answer the questions and we will assemble it.',
    button: 'Insert prompt',
  },
};

export function GuideModal({
  kind,
  /** Current field content — drives the overwrite warning. */
  existing,
  onClose,
  onInsert,
}: {
  kind: GuideKind;
  existing: string;
  onClose: () => void;
  onInsert: (composed: string) => void;
}) {
  const questions = questionsFor(kind);
  const [answers, setAnswers] = useState<GuideAnswers>({});
  const [showProblems, setShowProblems] = useState(false);
  const [confirming, setConfirming] = useState(false);
  /** Which answer box last had focus, so the variable picker knows where to insert. */
  const [activeField, setActiveField] = useState<string | null>(null);
  const fieldRefs = useRef<Record<string, HTMLTextAreaElement | HTMLInputElement | null>>({});

  const meta = TITLES[kind];
  const problems = useMemo(() => guideProblems(kind, answers), [kind, answers]);
  const composed = useMemo(() => composeFromGuide(kind, answers), [kind, answers]);
  const hasProblems = Object.keys(problems).length > 0;
  const willOverwrite = existing.trim().length > 0;

  const set = (id: string, value: string) => {
    setAnswers((prev) => ({ ...prev, [id]: value }));
    setShowProblems(false);
  };

  /** Drop a variable token at the cursor of whichever answer box was last active. */
  const insertVariable = (token: string) => {
    const id = activeField ?? questions[0].id;
    const el = fieldRefs.current[id];
    const current = answers[id] ?? '';

    if (!el) {
      set(id, current ? `${current} ${token}` : token);
      return;
    }

    const start = el.selectionStart ?? current.length;
    const end = el.selectionEnd ?? current.length;
    const next = current.slice(0, start) + token + current.slice(end);
    set(id, next);

    requestAnimationFrame(() => {
      el.focus();
      const pos = start + token.length;
      el.setSelectionRange(pos, pos);
    });
  };

  const attemptInsert = () => {
    if (hasProblems) {
      setShowProblems(true);
      return;
    }
    if (willOverwrite && !confirming) {
      setConfirming(true);
      return;
    }
    onInsert(composed);
  };

  const grouped = useMemo(() => {
    const groups = new Map<string, typeof TEMPLATE_VARIABLES>();
    for (const v of TEMPLATE_VARIABLES) {
      const list = groups.get(v.group) ?? [];
      list.push(v);
      groups.set(v.group, list);
    }
    return [...groups.entries()];
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-[24px]">
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.18 }}
        role="dialog"
        aria-label={meta.title}
        className="flex max-h-[88vh] w-full max-w-[1040px] flex-col border border-border bg-background"
      >
        {/* Header */}
        <div className="flex shrink-0 items-start justify-between gap-[16px] border-b border-border p-[20px]">
          <div className="flex flex-col gap-[4px]">
            <h2 className="flex items-center gap-[8px] text-[16px] leading-[24px] font-semibold text-foreground">
              <Sparkles className="h-[16px] w-[16px] text-primary" />
              {meta.title}
            </h2>
            <p className="max-w-[640px] text-[13px] leading-[18px] text-foreground/60">
              {meta.blurb}
            </p>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="shrink-0 p-[4px] text-foreground/50 transition-colors hover:text-foreground"
          >
            <X className="h-[16px] w-[16px]" />
          </button>
        </div>

        {/* Body */}
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden lg:flex-row">
          {/* Questions */}
          <div className="flex min-h-0 flex-1 flex-col gap-[20px] overflow-y-auto p-[20px]">
            {questions.map((q, idx) => {
              const problem = showProblems ? problems[q.id] : undefined;
              return (
                <div key={q.id} className="flex flex-col gap-[6px]">
                  <label
                    htmlFor={`guide-${q.id}`}
                    className="text-[14px] leading-[20px] font-semibold text-foreground"
                  >
                    {idx + 1}. {q.question}
                    {!q.required && (
                      <span className="ml-[6px] text-[12px] font-normal text-foreground/45">
                        optional
                      </span>
                    )}
                  </label>
                  <span className="text-[12px] leading-[17px] text-foreground/55">{q.help}</span>

                  {problem && (
                    <span className="text-[12px] leading-[17px] font-medium text-destructive">
                      {problem}
                    </span>
                  )}

                  {q.multiline ? (
                    <textarea
                      id={`guide-${q.id}`}
                      ref={(el) => {
                        fieldRefs.current[q.id] = el;
                      }}
                      value={answers[q.id] ?? ''}
                      onChange={(e) => set(q.id, e.target.value)}
                      onFocus={() => setActiveField(q.id)}
                      rows={q.list ? 4 : 3}
                      placeholder={q.placeholder}
                      className={cn(
                        inputClass,
                        'resize-y text-[13px]',
                        problem && 'border-destructive',
                      )}
                    />
                  ) : (
                    <input
                      id={`guide-${q.id}`}
                      ref={(el) => {
                        fieldRefs.current[q.id] = el;
                      }}
                      value={answers[q.id] ?? ''}
                      onChange={(e) => set(q.id, e.target.value)}
                      onFocus={() => setActiveField(q.id)}
                      placeholder={q.placeholder}
                      className={cn(inputClass, 'text-[13px]', problem && 'border-destructive')}
                    />
                  )}

                  {q.list && (
                    <span className="text-[12px] leading-[16px] text-foreground/40">
                      One per line.
                    </span>
                  )}
                </div>
              );
            })}
          </div>

          {/* Right rail: variables (prompt guide only) + live preview */}
          <div className="flex min-h-0 w-full shrink-0 flex-col border-t border-border lg:w-[400px] lg:border-t-0 lg:border-l">
            {kind === 'userPrompt' && (
              <div className="flex max-h-[300px] shrink-0 flex-col gap-[10px] overflow-y-auto border-b border-border p-[16px]">
                <div className="flex flex-col gap-[2px]">
                  <Label>Available values</Label>
                  <span className="text-[12px] leading-[17px] text-foreground/55">
                    Click one to drop it into the answer you are writing.
                  </span>
                </div>
                {grouped.map(([group, items]) => (
                  <div key={group} className="flex flex-col gap-[6px]">
                    <span className="text-[12px] leading-[16px] font-medium text-foreground/70">
                      {group}
                    </span>
                    {items.map((v) => (
                      <button
                        key={v.token}
                        onClick={() => insertVariable(v.token)}
                        title={v.token}
                        className="flex items-start gap-[8px] border border-border bg-background p-[8px] text-left transition-colors hover:border-primary/40 hover:bg-secondary/40"
                      >
                        <Plus className="mt-[2px] h-[12px] w-[12px] shrink-0 text-primary" />
                        <span className="flex min-w-0 flex-col gap-[1px]">
                          <span className="text-[12px] leading-[16px] font-medium text-foreground">
                            {v.label}
                          </span>
                          <span className="text-[11px] leading-[15px] text-foreground/50">
                            {v.description}
                          </span>
                        </span>
                      </button>
                    ))}
                  </div>
                ))}
              </div>
            )}

            <div className="flex min-h-0 flex-1 flex-col gap-[8px] p-[16px]">
              <Label>Preview</Label>
              <pre
                className={cn(
                  'min-h-[160px] flex-1 overflow-auto border border-border bg-secondary/20 p-[12px] whitespace-pre-wrap text-foreground/80',
                  monoClass,
                )}
              >
                {composed || 'Your answers will appear here as you type.'}
              </pre>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex shrink-0 flex-col gap-[12px] border-t border-border p-[20px]">
          {confirming && (
            <div className="flex items-start gap-[10px] border border-amber-200 bg-amber-50 p-[12px]">
              <AlertTriangle className="mt-[2px] h-[15px] w-[15px] shrink-0 text-amber-600" />
              <span className="text-[13px] leading-[18px] text-amber-800">
                There is already something in this box. Inserting will replace it. Press{' '}
                <span className="font-semibold">{meta.button}</span> again to go ahead, or cancel and
                copy what you want to keep.
              </span>
            </div>
          )}

          <div className="flex flex-wrap items-center justify-between gap-[12px]">
            <span className="text-[12px] leading-[16px] text-foreground/45">
              {willOverwrite
                ? 'This will replace what is currently in the box.'
                : 'The box is empty, so nothing will be lost.'}
            </span>
            <div className="flex items-center gap-[8px]">
              <Button variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button onClick={attemptInsert}>
                {confirming ? `${meta.button} anyway` : meta.button}
              </Button>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
