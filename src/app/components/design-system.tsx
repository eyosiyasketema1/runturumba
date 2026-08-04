// ============================================================================
// DESIGN SYSTEM — Turumba
// ----------------------------------------------------------------------------
// Single source of truth for spacing, typography, color, motion, and shared
// components used across every dashboard/view in this project. ALL dashboard
// files should import from here instead of hand-rolling tokens or duplicating
// components like StatCard, EmptyState, ModalShell, HeroBanner, etc.
//
// CSS theme variables this file assumes (see theme.css):
//   --primary: #2563eb        --muted: #f8fafc          --border: #cbd5e1
//   --destructive: #ef4444    --muted-foreground: #64748b --foreground: #0f172a
//   --background: #ffffff     --card: #ffffff            --radius: 0.5rem
// ============================================================================

import React from "react";
import type { LucideIcon } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { cn } from "./types";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Card, CardContent } from "./ui/card";
import { Separator } from "./ui/separator";
import { Avatar, AvatarFallback } from "./ui/avatar";

// ============================================================================
// 1. SPACING TOKENS
// ============================================================================

export const SPACING = {
  page: "p-6 lg:p-8",           // All page containers
  section: "space-y-6",          // Between sections
  card: "p-5",                   // Inside all cards
  cardCompact: "p-4",            // Compact cards (badges, small items)
  modal: "p-6",                  // Modal body padding
  table: {
    header: "px-4 py-3",
    cell: "px-4 py-3",
  },
  headerGap: "mb-6",             // Below page headers
  sectionGap: "mb-4",            // Below section headers
  listGap: "gap-4",              // Between list/grid items
  listGapCompact: "gap-3",       // Compact list gap
} as const;

// ============================================================================
// 2. TYPOGRAPHY TOKENS
// ============================================================================

export const TEXT = {
  pageTitle: "text-2xl font-bold tracking-tight text-foreground",
  pageSubtitle: "text-sm text-muted-foreground mt-1",
  heroTitle: "text-4xl lg:text-5xl font-black tracking-tight text-white",
  heroSubtitle: "text-base text-white/80",
  sectionTitle: "text-sm font-bold text-foreground uppercase tracking-wider",
  cardTitle: "text-sm font-semibold text-foreground",
  cardDescription: "text-xs text-muted-foreground",
  body: "text-sm text-foreground",
  bodyMuted: "text-sm text-muted-foreground",
  meta: "text-xs text-muted-foreground",
  label: "text-sm font-medium text-foreground",
  eyebrow: "text-xs font-semibold text-muted-foreground uppercase tracking-wider",
  stat: "text-2xl font-bold text-foreground",
  statLarge: "text-3xl font-black text-foreground",
  statLabel: "text-xs font-medium text-muted-foreground uppercase tracking-wider",
} as const;

// ============================================================================
// 3. COLOR TOKENS (semantic status colors)
// ============================================================================

// Use these instead of hardcoded blue-500, red-500, etc.
export const STATUS_COLORS = {
  success: {
    bg: "bg-emerald-500/10",
    text: "text-emerald-600",
    border: "border-emerald-500/20",
    dot: "bg-emerald-500",
    badge: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
  },
  warning: {
    bg: "bg-amber-500/10",
    text: "text-amber-600",
    border: "border-amber-500/20",
    dot: "bg-amber-500",
    badge: "bg-amber-500/10 text-amber-600 border-amber-500/20",
  },
  error: {
    bg: "bg-destructive/10",
    text: "text-destructive",
    border: "border-destructive/20",
    dot: "bg-destructive",
    badge: "bg-destructive/10 text-destructive border-destructive/20",
  },
  info: {
    bg: "bg-primary/10",
    text: "text-primary",
    border: "border-primary/20",
    dot: "bg-primary",
    badge: "bg-primary/10 text-primary border-primary/20",
  },
  neutral: {
    bg: "bg-muted",
    text: "text-muted-foreground",
    border: "border-border",
    dot: "bg-muted-foreground",
    badge: "bg-muted text-muted-foreground border-border",
  },
} as const;

export type StatusColorKey = keyof typeof STATUS_COLORS;

// Muted background opacity scale — USE ONLY THESE
export const MUTED_SCALE = {
  hover: "bg-muted/30",      // Hover states, subtle backgrounds
  surface: "bg-muted/50",    // Table headers, panel backgrounds
  track: "bg-muted/60",      // Tab tracks, input backgrounds
  solid: "bg-muted",         // Full muted background
} as const;

// Backdrop opacity for modals
export const BACKDROP = "bg-black/50" as const;

// ============================================================================
// 4. ICON SIZE TOKENS
// ============================================================================

export const ICON = {
  xs: "w-3 h-3",        // Inside badges, very small contexts
  sm: "w-3.5 h-3.5",    // Inline with text, button icons
  md: "w-4 h-4",        // Default icon size — section headers, nav items, cards
  lg: "w-5 h-5",        // Standalone action icons, larger buttons
  xl: "w-6 h-6",        // Feature icons, emphasis
  hero: "w-10 h-10",    // Empty states, hero sections
} as const;

export const AVATAR = {
  xs: "w-6 h-6 text-[10px]",    // Compact lists, stacked avatars
  sm: "w-8 h-8 text-xs",        // Table rows, mentions
  md: "w-10 h-10 text-sm",      // Cards, profile references
  lg: "w-16 h-16 text-lg",      // Profile headers, hero areas
} as const;

// ============================================================================
// 5. ANIMATION PRESETS
// ============================================================================

export const MOTION = {
  fadeInUp: {
    initial: { opacity: 0, y: 8 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.2 },
  },
  fadeIn: {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    transition: { duration: 0.15 },
  },
  slideInRight: {
    initial: { opacity: 0, x: 24 },
    animate: { opacity: 1, x: 0 },
    transition: { type: "spring", damping: 28, stiffness: 300 },
  },
  modalOverlay: {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0 },
    transition: { duration: 0.15 },
  },
  modalPanel: {
    initial: { opacity: 0, scale: 0.95, y: 8 },
    animate: { opacity: 1, scale: 1, y: 0 },
    exit: { opacity: 0, scale: 0.95, y: 8 },
    transition: { type: "spring", damping: 25, stiffness: 350 },
  },
  stagger: (index: number) => ({
    initial: { opacity: 0, y: 8 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.2, delay: index * 0.05 },
  }),
  listItem: (index: number) => ({
    initial: { opacity: 0, y: 6 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.15, delay: index * 0.04 },
  }),
} as const;

// ============================================================================
// 6. LAYOUT TOKENS
// ============================================================================

export const LAYOUT = {
  // Grid patterns for KPI/stat cards
  statsGrid: "grid grid-cols-2 lg:grid-cols-4 gap-4",
  statsGridWide: "grid grid-cols-2 lg:grid-cols-5 gap-4",

  // Content grids
  cardGrid2: "grid grid-cols-1 sm:grid-cols-2 gap-4",
  cardGrid3: "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4",
  cardGrid4: "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4",

  // Two-panel layouts
  splitPanel: "grid grid-cols-1 lg:grid-cols-3 gap-6",  // 1/3 + 2/3
  splitPanelWide: "grid grid-cols-1 lg:grid-cols-5 gap-6",  // 2/5 + 3/5

  // Table
  tableWrapper: "overflow-x-auto",
  tableBase: "w-full text-sm",
  tableHeader: "bg-muted/50 border-b border-border",
  tableRow: "border-b border-border hover:bg-muted/30 transition-colors",

  // Card base
  card: "bg-card rounded-sm border border-border",
  cardHover: "bg-card rounded-sm border border-border hover:border-primary/30 transition-all cursor-pointer",
} as const;

// ============================================================================
// 7. SHARED BADGE COMPONENT
// ============================================================================

// Badge variant map — use instead of hand-rolling badge colors
export const BADGE_VARIANTS: Record<string, string> = {
  // Status
  active: STATUS_COLORS.success.badge,
  completed: STATUS_COLORS.success.badge,
  online: STATUS_COLORS.success.badge,
  pending: STATUS_COLORS.warning.badge,
  review: STATUS_COLORS.warning.badge,
  in_progress: STATUS_COLORS.warning.badge,
  error: STATUS_COLORS.error.badge,
  failed: STATUS_COLORS.error.badge,
  critical: STATUS_COLORS.error.badge,
  suspended: STATUS_COLORS.error.badge,
  info: STATUS_COLORS.info.badge,
  new: STATUS_COLORS.info.badge,
  default: STATUS_COLORS.neutral.badge,
  inactive: STATUS_COLORS.neutral.badge,
  draft: STATUS_COLORS.neutral.badge,

  // Legacy Roles
  owner: "bg-violet-500/10 text-violet-600 border-violet-500/20",
  admin: "bg-indigo-500/10 text-indigo-600 border-indigo-500/20",
  mentor_coach: "bg-cyan-500/10 text-cyan-600 border-cyan-500/20",
  mentor: "bg-sky-500/10 text-sky-600 border-sky-500/20",
  coordinator: "bg-teal-500/10 text-teal-600 border-teal-500/20",
  reviewer: "bg-purple-500/10 text-purple-600 border-purple-500/20",
  trainer: "bg-orange-500/10 text-orange-600 border-orange-500/20",
  volunteer: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",

  // RBAC User Types
  executive: "bg-amber-500/10 text-amber-600 border-amber-500/20",
  global_ops: "bg-indigo-500/10 text-indigo-600 border-indigo-500/20",
  volunteer_manager: "bg-sky-500/10 text-sky-600 border-sky-500/20",
  language_ministry_manager: "bg-violet-500/10 text-violet-600 border-violet-500/20",
  social_media_manager: "bg-pink-500/10 text-pink-600 border-pink-500/20",

  // Platforms
  whatsapp: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
  telegram: "bg-sky-500/10 text-sky-600 border-sky-500/20",
  sms: "bg-violet-500/10 text-violet-600 border-violet-500/20",
  messenger: "bg-blue-500/10 text-blue-600 border-blue-500/20",
  email: "bg-amber-500/10 text-amber-600 border-amber-500/20",
  instagram: "bg-pink-500/10 text-pink-600 border-pink-500/20",
  tiktok: "bg-slate-500/10 text-slate-600 border-slate-500/20",
  webchat: "bg-primary/10 text-primary border-primary/20",

  // Priority
  high: "bg-destructive/10 text-destructive border-destructive/20",
  medium: "bg-amber-500/10 text-amber-600 border-amber-500/20",
  low: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
};

// Helper to get badge classes
export function getBadgeClasses(variant: string): string {
  return BADGE_VARIANTS[variant.toLowerCase().replace(/\s+/g, "_")] || BADGE_VARIANTS.default;
}

/** Drop-in status/role/platform badge built on top of ui/badge. */
export const StatusBadge = ({
  value,
  label,
  className,
}: {
  value: string;
  label?: string;
  className?: string;
}) => (
  <Badge
    variant="outline"
    className={cn("capitalize font-medium", getBadgeClasses(value), className)}
  >
    {(label ?? value).replace(/_/g, " ")}
  </Badge>
);

// ============================================================================
// 8. AVATAR COLORS (shared, not duplicated)
// ============================================================================

export const AVATAR_COLORS = [
  "bg-blue-600", "bg-emerald-600", "bg-violet-600", "bg-amber-600",
  "bg-rose-600", "bg-cyan-600", "bg-indigo-600", "bg-teal-600",
] as const;

export function getAvatarColor(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

/** Small helper to derive initials from a display name for AvatarFallback. */
export function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

/** Shared user avatar — consistent color hashing + sizing across the app. */
export const UserAvatar = ({
  name,
  size = "md",
  className,
}: {
  name: string;
  size?: keyof typeof AVATAR;
  className?: string;
}) => (
  <Avatar className={cn(AVATAR[size], className)}>
    <AvatarFallback className={cn(getAvatarColor(name), "text-white font-semibold")}>
      {getInitials(name)}
    </AvatarFallback>
  </Avatar>
);

// ============================================================================
// 9. REUSABLE COMPONENTS
// ============================================================================

// --- PageHeader ---------------------------------------------------------
// Standard page title + subtitle, with optional trailing actions.
export const PageHeader = ({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children?: React.ReactNode;
}) => (
  <div className={cn("flex items-start justify-between gap-4 flex-wrap", SPACING.headerGap)}>
    <div>
      <h1 className={TEXT.pageTitle}>{title}</h1>
      {subtitle && <p className={TEXT.pageSubtitle}>{subtitle}</p>}
    </div>
    {children && <div className="flex items-center gap-2 shrink-0">{children}</div>}
  </div>
);

// --- SectionHeader -------------------------------------------------------
// Section title with optional action button/element.
export const SectionHeader = ({
  title,
  action,
}: {
  title: string;
  action?: React.ReactNode;
}) => (
  <div className={cn("flex items-center justify-between", SPACING.sectionGap)}>
    <h2 className={TEXT.sectionTitle}>{title}</h2>
    {action && <div className="shrink-0">{action}</div>}
  </div>
);

// --- StatCard --------------------------------------------------------------
// KPI card with icon, label, value, and an optional change indicator.
export const StatCard = ({
  label,
  value,
  change,
  changeLabel,
  icon: Icon,
  color = "info",
}: {
  label: string;
  value: string | number;
  change?: number;
  changeLabel?: string;
  icon?: LucideIcon;
  color?: StatusColorKey;
}) => {
  const palette = STATUS_COLORS[color];
  const isPositive = typeof change === "number" && change >= 0;

  return (
    <div className={cn(LAYOUT.card, SPACING.card)}>
      <div className="flex items-center justify-between mb-3">
        <span className={TEXT.statLabel}>{label}</span>
        {Icon && (
          <div className={cn("p-2 rounded-md", palette.bg)}>
            <Icon className={cn(ICON.md, palette.text)} />
          </div>
        )}
      </div>
      <div className={TEXT.stat}>{value}</div>
      {typeof change === "number" && (
        <div className="flex items-center gap-1 mt-2">
          <span
            className={cn(
              "text-xs font-semibold",
              isPositive ? STATUS_COLORS.success.text : STATUS_COLORS.error.text
            )}
          >
            {isPositive ? "+" : ""}
            {change}%
          </span>
          {changeLabel && <span className={TEXT.meta}>{changeLabel}</span>}
        </div>
      )}
    </div>
  );
};

// --- EmptyState --------------------------------------------------------------
// Icon + title + description + optional action, for empty lists/tables.
export const EmptyState = ({
  icon: Icon,
  title,
  description,
  action,
}: {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: React.ReactNode;
}) => (
  <div className="flex flex-col items-center justify-center text-center py-12 px-6">
    {Icon && (
      <div className={cn("p-3 rounded-full mb-4", MUTED_SCALE.surface)}>
        <Icon className={cn(ICON.hero, "text-muted-foreground")} />
      </div>
    )}
    <h3 className={cn(TEXT.cardTitle, "mb-1")}>{title}</h3>
    {description && <p className={cn(TEXT.cardDescription, "max-w-sm mb-4")}>{description}</p>}
    {action && <div>{action}</div>}
  </div>
);

// --- ModalShell --------------------------------------------------------------
// Consistent modal overlay + panel with motion, header, body, and footer.
export const MODAL_SIZES = {
  sm: "max-w-md",
  md: "max-w-lg",
  lg: "max-w-2xl",
  xl: "max-w-4xl",
} as const;

export const ModalShell = ({
  open,
  onClose,
  title,
  description,
  size = "md",
  children,
  footer,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  size?: keyof typeof MODAL_SIZES;
  children: React.ReactNode;
  footer?: React.ReactNode;
}) => (
  <AnimatePresence>
    {open && (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <motion.div
          {...MOTION.modalOverlay}
          onClick={onClose}
          aria-hidden="true"
          className={cn("absolute inset-0", BACKDROP)}
        />
        <motion.div
          {...MOTION.modalPanel}
          role="dialog"
          aria-modal="true"
          className={cn(
            "relative w-full bg-card rounded-sm border border-border overflow-hidden flex flex-col max-h-[90vh]",
            MODAL_SIZES[size]
          )}
        >
          <div className="flex items-start justify-between gap-4 px-6 py-4 border-b border-border shrink-0">
            <div>
              <h2 className={TEXT.cardTitle}>{title}</h2>
              {description && <p className={cn(TEXT.cardDescription, "mt-1")}>{description}</p>}
            </div>
            <Button variant="ghost" size="icon" onClick={onClose} aria-label="Close dialog">
              <XIcon />
            </Button>
          </div>
          <div className={cn(SPACING.modal, "overflow-y-auto")}>{children}</div>
          {footer && (
            <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-border shrink-0">
              {footer}
            </div>
          )}
        </motion.div>
      </div>
    )}
  </AnimatePresence>
);

// Tiny inline close icon so ModalShell doesn't need an extra lucide-react
// import beyond what's already allowed at the top of this file.
const XIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className={ICON.md}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
  </svg>
);

// --- DataTable --------------------------------------------------------------
// Consistent table shell with header row + body (rows passed as children).
export const DataTable = ({
  columns,
  children,
}: {
  columns: string[];
  children: React.ReactNode;
}) => (
  <div className={LAYOUT.tableWrapper}>
    <table className={LAYOUT.tableBase}>
      <thead className={LAYOUT.tableHeader}>
        <tr>
          {columns.map((col) => (
            <th
              key={col}
              className={cn(SPACING.table.header, "text-left font-semibold text-muted-foreground text-xs uppercase tracking-wider")}
            >
              {col}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>{children}</tbody>
    </table>
  </div>
);

// --- HeroBanner --------------------------------------------------------------
// The dark gradient hero used at the top of dashboards.
export const HeroBanner = ({
  greeting,
  name,
  stats,
  children,
}: {
  greeting: string;
  name: string;
  stats?: { label: string; value: string | number }[];
  children?: React.ReactNode;
}) => (
  <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-slate-900 via-slate-900 to-primary/40 p-6 lg:p-8">
    <div className="absolute -top-24 -right-20 w-80 h-80 rounded-full bg-gradient-to-br from-blue-500/40 to-violet-500/10 blur-3xl pointer-events-none" />
    <div className="absolute -bottom-32 -left-20 w-96 h-96 rounded-full bg-gradient-to-tr from-emerald-500/20 to-blue-500/10 blur-3xl pointer-events-none" />
    <div className="relative">
      <p className={TEXT.heroSubtitle}>{greeting}</p>
      <h1 className={cn(TEXT.heroTitle, "mt-1")}>{name}</h1>
      {stats && stats.length > 0 && (
        <div className="flex flex-wrap items-center gap-6 mt-6">
          {stats.map((s) => (
            <div key={s.label}>
              <div className="text-2xl font-bold text-white">{s.value}</div>
              <div className="text-xs text-white/70 uppercase tracking-wider font-medium">{s.label}</div>
            </div>
          ))}
        </div>
      )}
      {children && <div className="mt-6">{children}</div>}
    </div>
  </div>
);

// --- TabBar --------------------------------------------------------------
// Consistent pill-style tab switcher.
export const TabBar = ({
  tabs,
  active,
  onChange,
  ariaLabel,
}: {
  tabs: { id: string; label: string; icon?: LucideIcon }[];
  active: string;
  onChange: (id: string) => void;
  ariaLabel?: string;
}) => (
  <div
    role="tablist"
    aria-label={ariaLabel}
    className="bg-muted/30 p-1 rounded-xl flex items-center gap-1"
  >
    {tabs.map((tab) => {
      const isActive = tab.id === active;
      const Icon = tab.icon;
      return (
        <button
          key={tab.id}
          type="button"
          role="tab"
          aria-selected={isActive}
          aria-controls={`tabpanel-${tab.id}`}
          onClick={() => onChange(tab.id)}
          className={cn(
            "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all",
            isActive
              ? "bg-primary text-primary-foreground"
              : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
          )}
        >
          {Icon && <Icon className={ICON.md} />}
          {tab.label}
        </button>
      );
    })}
  </div>
);

// Re-export commonly paired primitives so dashboard files can pull
// everything design-related from a single module if desired.
export { cn };
export { Badge, Button, Card, CardContent, Separator, Avatar, AvatarFallback };
