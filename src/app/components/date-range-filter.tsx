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

const PRESETS = [
  { label: "Today", getValue: () => {
    const d = new Date(); d.setHours(0,0,0,0);
    return { from: d, to: new Date() };
  }},
  { label: "Last 7 days", getValue: () => {
    const to = new Date();
    const from = new Date(); from.setDate(from.getDate() - 7); from.setHours(0,0,0,0);
    return { from, to };
  }},
  { label: "Last 30 days", getValue: () => {
    const to = new Date();
    const from = new Date(); from.setDate(from.getDate() - 30); from.setHours(0,0,0,0);
    return { from, to };
  }},
  { label: "This month", getValue: () => {
    const now = new Date();
    const from = new Date(now.getFullYear(), now.getMonth(), 1);
    return { from, to: now };
  }},
  { label: "This quarter", getValue: () => {
    const now = new Date();
    const qMonth = Math.floor(now.getMonth() / 3) * 3;
    const from = new Date(now.getFullYear(), qMonth, 1);
    return { from, to: now };
  }},
] as const;

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

  return (
    <div className={cn("flex items-center gap-1.5", className)}>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className={cn(
              "h-8 px-3 text-xs font-medium gap-2 border-border",
              hasRange && "border-primary/40 bg-primary/5"
            )}
          >
            <CalendarDays className="w-3.5 h-3.5 text-muted-foreground" />
            <span className="max-w-[200px] truncate">{label}</span>
            <ChevronDown className="w-3 h-3 text-muted-foreground" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="end" sideOffset={8}>
          <div className="flex">
            {/* Preset sidebar */}
            <div className="border-r border-border py-2 px-1 space-y-0.5 w-[130px] shrink-0">
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest px-2.5 pb-1.5">
                Quick Select
              </p>
              {PRESETS.map(preset => (
                <button
                  key={preset.label}
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
                selected={dateRange}
                onSelect={(range) => {
                  onDateRangeChange(range);
                  if (range?.from && range?.to) {
                    setOpen(false);
                  }
                }}
                numberOfMonths={2}
                disabled={{ after: new Date() }}
                initialFocus
              />
            </div>
          </div>
        </PopoverContent>
      </Popover>

      {/* Clear button */}
      {hasRange && (
        <Button
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground"
          onClick={() => onDateRangeChange(undefined)}
        >
          <X className="w-3.5 h-3.5" />
        </Button>
      )}
    </div>
  );
}
