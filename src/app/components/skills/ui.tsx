'use client';

import React from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '../types';
import type { SkillStatus } from '../../lib/skills-data';

// Shared primitives for every Skill Sets authoring workflow, so the
// alternatives differ in flow rather than in incidental styling.

export const inputClass =
  'w-full border border-border bg-background px-[12px] py-[8px] text-[14px] leading-[20px] text-foreground outline-none placeholder:text-foreground/40 focus:border-primary';

export const monoClass = 'font-mono text-[13px] leading-[20px]';

export function Button({
  variant = 'default',
  className,
  children,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'default' | 'outline' | 'ghost' | 'danger';
}) {
  return (
    <button
      {...props}
      className={cn(
        'inline-flex shrink-0 items-center justify-center gap-[8px] border px-[14px] py-[8px] text-[14px] leading-[20px] font-medium transition-colors',
        'disabled:pointer-events-none disabled:opacity-50',
        variant === 'default' &&
          'border-primary bg-primary text-primary-foreground hover:bg-primary/90',
        variant === 'outline' && 'border-border bg-background text-foreground hover:bg-secondary/60',
        variant === 'ghost' &&
          'border-transparent bg-transparent text-foreground hover:bg-secondary/60',
        variant === 'danger' &&
          'border-transparent bg-transparent text-destructive hover:bg-destructive/10',
        className,
      )}
    >
      {children}
    </button>
  );
}

export function Label({ children }: { children: React.ReactNode }) {
  return (
    <span className="text-[11px] leading-[16px] font-medium tracking-wider uppercase text-foreground/50">
      {children}
    </span>
  );
}

export function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-[6px]">
      <Label>{label}</Label>
      {hint && <span className="text-[12px] leading-[16px] text-primary/80">{hint}</span>}
      {children}
    </div>
  );
}

export function Card({
  title,
  subtitle,
  action,
  children,
  className,
}: {
  title?: string;
  subtitle?: React.ReactNode;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={cn('flex flex-col gap-[16px] border border-border p-[20px]', className)}>
      {(title || action) && (
        <div className="flex items-start justify-between gap-[16px]">
          <div className="flex flex-col gap-[2px]">
            {title && (
              <h2 className="text-[14px] leading-[20px] font-semibold text-foreground">{title}</h2>
            )}
            {subtitle && (
              <span className="text-[12px] leading-[18px] text-primary/80">{subtitle}</span>
            )}
          </div>
          {action}
        </div>
      )}
      {children}
    </section>
  );
}

export function Select({
  value,
  onChange,
  options,
  disabled,
  placeholder,
  'aria-label': ariaLabel,
}: {
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
  disabled?: boolean;
  placeholder?: string;
  'aria-label'?: string;
}) {
  return (
    <div className="relative">
      <select
        value={value}
        disabled={disabled}
        aria-label={ariaLabel}
        onChange={(e) => onChange(e.target.value)}
        className={cn(inputClass, 'appearance-none pr-[32px] disabled:opacity-50')}
      >
        {placeholder && <option value="">{placeholder}</option>}
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      <ChevronDown className="pointer-events-none absolute right-[10px] top-1/2 h-[16px] w-[16px] -translate-y-1/2 text-foreground/40" />
    </div>
  );
}

export function StatusBadge({ status }: { status: SkillStatus }) {
  return (
    <span
      className={cn(
        'inline-flex items-center border px-[8px] py-[2px] text-[12px] leading-[16px] font-medium',
        status === 'active'
          ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
          : 'border-border bg-secondary/50 text-foreground/60',
      )}
    >
      {status === 'active' ? 'Active' : 'Paused'}
    </span>
  );
}

export function AccessBadge({ access }: { access: 'read' | 'write' }) {
  return (
    <span
      className={cn(
        'shrink-0 px-[6px] py-[1px] text-[11px] leading-[16px] font-medium',
        access === 'read' ? 'text-emerald-600' : 'text-amber-600',
      )}
    >
      {access === 'read' ? 'Read' : 'Write'}
    </span>
  );
}

export function CategoryChip({ category }: { category: string }) {
  return (
    <span className="shrink-0 border border-border bg-secondary/40 px-[8px] py-[1px] text-[11px] leading-[16px] text-foreground/60">
      {category}
    </span>
  );
}

/** Page header used by every workflow's list screen. */
export function PageHeader({
  title,
  blurb,
  actions,
}: {
  title: string;
  blurb: string;
  actions?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-[16px] sm:flex-row sm:items-start sm:justify-between">
      <div className="flex flex-col gap-[4px]">
        <h1 className="text-[20px] leading-[28px] font-bold text-foreground">{title}</h1>
        <p className="max-w-[720px] text-[14px] leading-[20px] text-foreground/60">{blurb}</p>
      </div>
      {actions && <div className="flex shrink-0 flex-wrap items-center gap-[8px]">{actions}</div>}
    </div>
  );
}

/** Empty state shared by the alternative workflows. */
export function EmptyState({
  message,
  children,
}: {
  message: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="flex min-h-[400px] items-center justify-center border border-dashed border-border">
      <div className="flex flex-col items-center gap-[16px] px-[24px] text-center">
        <p className="text-[14px] leading-[20px] text-foreground/60">{message}</p>
        {children}
      </div>
    </div>
  );
}
