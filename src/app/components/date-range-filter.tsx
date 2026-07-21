import React, { useState } from "react";
import { CalendarDays, ChevronDown, X } from "lucide-react";
import { Button } from "./ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import { Calendar } from "./ui/calendar";
import { cn } from "./types";
import type { DateRange } from "react-day-picker";

// ---------------------------------------------------------------------------
// Preset ranges
// ---------------------------------------------------------------------------

function getPresets() {
  return [
    { label: "Today", getValue: () => {
      const d = new Date(); d.setHours(0,0,0,0);
      return { from: d, to: new Date() } as DateRange;
    }},
    { label: "Last 7 days", getValue: () => {
      const to = new Date();
      const from = new Date(); from.setDate(from.getDate() - 7); from.setHours(0,0,0,0);
      return { from, to } as DateRange;
    }},
    { label: "Last 30 days", getValue: () => {
      const to = new Date();
      const from = new Date(); from.setDate(from.getDate() - 30); from.setHours(0,0,0,0);
      return { from, to } as DateRange;
    }},
    { label: "This month", getValue: () => {
      const now = new Date();
      const from = new Date(now.getFullYear(), now.getMonth(), 1);
      return { from, to: now } as DateRange;
    }},
    { label: "This quarter", getValue: () => {
      const now = new Date();
      const qMonth = Math.floor(now.getMonth() / 3) * 3;
      const from = new Date(now.getFullYear(), qMonth, 1);
      return { from, to: now } as DateRange;
    }},
  ];
}

// ---------------------------------------------------------------------------
// Format helpers
// ---------------------------------------------------------------------------

function formatShort(date: Date) {
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export interface DateRangeFilterProps {
  dateRange: DateRange | undefined;
  onDateRangeChange: (range: DateRange | undefined) => void;
  className?: string;
}

export function DateRangeFilter({ dateRange, onDateRangeChange, className }: DateRangeFilterProps) {
  const [open, setOpen] = useState(false);

  const hasRange = dateRange?.from != null;
  const label = hasRange
    ? dateRange.to
      ? `${formatShort(dateRange.from!)} – ${formatShort(dateRange.to)}`
      : formatShort(dateRange.from!)
    : "All time";

  const presets = getPresets();

  return (
    <div className={cn("relative z-10 flex items-center gap-1.5", className)}>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <button
            type="button"
            className={cn(
              "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md border text-xs font-medium transition-colors",
              "h-8 px-3 shadow-sm",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950",
              hasRange
                ? "border-blue-400/50 bg-blue-500/20 text-white hover:bg-blue-500/30"
                : "border-white/20 bg-white/10 text-white hover:bg-white/20 backdrop-blur-sm"
            )}
          >
            <CalendarDays className="w-3.5 h-3.5 text-white/70" />
            <span className="max-w-[200px] truncate">{label}</span>
            <ChevronDown className="w-3 h-3 text-white/70" />
          </button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="end" sideOffset={8}>
          <div className="flex">
            {/* Preset sidebar */}
            <div className="border-r border-border py-2 px-1 space-y-0.5 w-[130px] shrink-0">
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest px-2.5 pb-1.5">
                Quick Select
              </p>
              {presets.map(preset => (
                <button
                  key={preset.label}
                  type="button"
                  className="w-full text-left text-xs px-2.5 py-1.5 rounded-sm hover:bg-muted transition-colors text-foreground font-medium"
                  onClick={() => {
                    onDateRangeChange(preset.getValue());
                    setOpen(false);
                  }}
                >
                  {preset.label}
                </button>
              ))}
              <div className="border-t border-border my-1.5" />
              <button
                type="button"
                className="w-full text-left text-xs px-2.5 py-1.5 rounded-sm hover:bg-muted transition-colors text-muted-foreground font-medium"
                onClick={() => {
                  onDateRangeChange(undefined);
                  setOpen(false);
                }}
              >
                All time
              </button>
            </div>

            {/* Calendar */}
            <div className="p-3">
              <Calendar
                mode="range"
                defaultMonth={dateRange?.from || new Date()}
                selected={dateRange}
                onSelect={(range) => {
                  onDateRangeChange(range);
                  if (range?.from && range?.to) {
                    setOpen(false);
                  }
                }}
                numberOfMonths={2}
                disabled={{ after: new Date() }}
              />
            </div>
          </div>
        </PopoverContent>
      </Popover>

      {/* Clear button */}
      {hasRange && (
        <button
          type="button"
          className="inline-flex items-center justify-center h-8 w-8 rounded-md text-white/60 hover:text-white hover:bg-white/10 transition-colors"
          onClick={() => onDateRangeChange(undefined)}
        >
          <X className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  );
}
