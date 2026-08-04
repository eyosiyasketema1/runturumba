# Turumba Design System Reference

> Single source of truth for every UI decision. Import from `@/components/design-system.tsx`.

---

## Quick Import

```tsx
import {
  // Tokens
  SPACING, TEXT, STATUS_COLORS, MUTED_SCALE, BACKDROP,
  ICON, AVATAR, MOTION, LAYOUT, BADGE_VARIANTS, getBadgeClasses,
  AVATAR_COLORS, getAvatarColor, getInitials,
  // Components
  PageHeader, SectionHeader, StatCard, EmptyState,
  ModalShell, DataTable, HeroBanner, TabBar, StatusBadge, UserAvatar,
} from "./design-system";
```

---

## 1. Colors

### Theme Tokens (use these, never hardcode hex)

| Token              | Light         | Use for                              |
|--------------------|---------------|--------------------------------------|
| `primary`          | `#2563eb`     | CTAs, links, active states, focus    |
| `primary-foreground`| `#ffffff`    | Text on primary backgrounds          |
| `destructive`      | `#ef4444`     | Delete, errors, danger states        |
| `muted`            | `#f8fafc`     | Subtle backgrounds, surfaces         |
| `muted-foreground` | `#64748b`     | Secondary text, placeholders, icons  |
| `border`           | `#cbd5e1`     | All borders                          |
| `foreground`       | `#0f172a`     | Primary text                         |
| `background`       | `#ffffff`     | Page background                      |
| `card`             | `#ffffff`     | Card surfaces                        |

### Status Colors

Always use `STATUS_COLORS` from design-system. Never use raw `green-500`, `red-500`, etc.

| Status    | Background            | Text               | Use for                     |
|-----------|-----------------------|---------------------|-----------------------------|
| `success` | `bg-emerald-500/10`   | `text-emerald-600`  | Active, completed, online   |
| `warning` | `bg-amber-500/10`     | `text-amber-600`    | Pending, review, attention  |
| `error`   | `bg-destructive/10`   | `text-destructive`  | Failed, critical, suspended |
| `info`    | `bg-primary/10`       | `text-primary`      | New, informational          |
| `neutral` | `bg-muted`            | `text-muted-foreground` | Draft, inactive, default |

### Muted Background Scale

Only use these 4 values for `bg-muted` opacity. Never use `/5`, `/10`, `/20`, `/40`.

| Token              | Class           | Use for                          |
|--------------------|-----------------|----------------------------------|
| `MUTED_SCALE.hover`   | `bg-muted/30` | Hover states, subtle highlights  |
| `MUTED_SCALE.surface` | `bg-muted/50` | Table headers, panel backgrounds |
| `MUTED_SCALE.track`   | `bg-muted/60` | Tab tracks, toggle backgrounds   |
| `MUTED_SCALE.solid`   | `bg-muted`    | Full muted background            |

### Modal Backdrop

Always use `BACKDROP` (`bg-black/50`). Never use `/40` or `/60`.

### Rules

- **Never** use `blue-500`/`blue-600` — use `primary` token
- **Never** use `red-*`/`rose-*` for errors — use `destructive` token
- **Never** use `green-500` — use `emerald-*` for success
- **Never** use `orange-*` for warnings — use `amber-*`
- Badge formula is always: `bg-{hue}-500/10 text-{hue}-600 border-{hue}-500/20`
- Use `getBadgeClasses(variant)` for dynamic badge styling

---

## 2. Typography

### Scale

| Token             | Classes                                                  | Use for                   |
|-------------------|----------------------------------------------------------|---------------------------|
| `TEXT.heroTitle`   | `text-4xl lg:text-5xl font-black tracking-tight text-white` | Hero banners           |
| `TEXT.heroSubtitle`| `text-base text-white/80`                               | Hero banner subtitles     |
| `TEXT.pageTitle`   | `text-2xl font-bold tracking-tight text-foreground`     | Page headings             |
| `TEXT.pageSubtitle`| `text-sm text-muted-foreground mt-1`                    | Below page headings       |
| `TEXT.sectionTitle`| `text-sm font-bold text-foreground uppercase tracking-wider` | Section labels       |
| `TEXT.cardTitle`   | `text-sm font-semibold text-foreground`                 | Card headings             |
| `TEXT.cardDescription` | `text-xs text-muted-foreground`                    | Card subtitles            |
| `TEXT.body`        | `text-sm text-foreground`                               | Body copy                 |
| `TEXT.bodyMuted`   | `text-sm text-muted-foreground`                         | Secondary body text       |
| `TEXT.meta`        | `text-xs text-muted-foreground`                         | Timestamps, metadata      |
| `TEXT.label`       | `text-sm font-medium text-foreground`                   | Form labels               |
| `TEXT.eyebrow`     | `text-xs font-semibold text-muted-foreground uppercase tracking-wider` | Category labels |
| `TEXT.stat`        | `text-2xl font-bold text-foreground`                    | KPI numbers               |
| `TEXT.statLarge`   | `text-3xl font-black text-foreground`                   | Hero-level stats          |
| `TEXT.statLabel`   | `text-xs font-medium text-muted-foreground uppercase tracking-wider` | Stat labels     |

### Rules

- **Never** use `text-[13px]`, `text-[11px]`, `text-[10px]`, `text-[9px]` — use `text-xs` or `text-sm`
- **Always** use `tracking-wider` (not `tracking-widest`) for uppercase text
- **Always** use `font-semibold` for eyebrow/section labels (not `font-bold`)
- Page titles are always `text-2xl` (not `text-3xl` or `text-lg`)
- Stat numbers are always `text-2xl font-bold` (standard) or `text-3xl font-black` (hero)
- Card titles are always `text-sm font-semibold`

---

## 3. Spacing

### Page Layout

| Token                | Classes          | Use for                    |
|----------------------|------------------|----------------------------|
| `SPACING.page`       | `p-6 lg:p-8`    | All page container padding |
| `SPACING.headerGap`  | `mb-6`           | Below page headers         |
| `SPACING.section`    | `space-y-6`      | Between major sections     |

### Cards & Panels

| Token                | Classes  | Use for                         |
|----------------------|----------|---------------------------------|
| `SPACING.card`       | `p-5`    | Standard card padding           |
| `SPACING.cardCompact`| `p-4`    | Small cards, badges, compact items |
| `SPACING.modal`      | `p-6`    | Modal body padding              |

### Tables

| Token                    | Classes       | Use for        |
|--------------------------|---------------|----------------|
| `SPACING.table.header`   | `px-4 py-3`  | Table headers  |
| `SPACING.table.cell`     | `px-4 py-3`  | Table cells    |

### Gaps

| Token                  | Classes      | Use for              |
|------------------------|--------------|----------------------|
| `SPACING.listGap`      | `gap-4`      | Standard list/grid   |
| `SPACING.listGapCompact`| `gap-3`     | Compact list/grid    |
| `SPACING.sectionGap`   | `mb-4`       | Below section headers|

### Rules

- **Never** use `p-3` or `p-8` for card padding — use `p-5` (standard) or `p-4` (compact)
- **Never** mix `p-6 lg:p-10` — page padding is always `p-6 lg:p-8`
- **Never** use `space-y-8` — section gaps are `space-y-6`
- Table padding is always `px-4 py-3` for both headers and cells

---

## 4. Icons

### Size Scale

| Token      | Classes        | Use for                              |
|------------|----------------|--------------------------------------|
| `ICON.xs`  | `w-3 h-3`     | Inside badges, tiny contexts         |
| `ICON.sm`  | `w-3.5 h-3.5` | Inline with text, small buttons      |
| `ICON.md`  | `w-4 h-4`     | **Default** — headers, nav, cards    |
| `ICON.lg`  | `w-5 h-5`     | Standalone actions, larger buttons   |
| `ICON.xl`  | `w-6 h-6`     | Feature icons, emphasis              |
| `ICON.hero`| `w-10 h-10`   | Empty states, hero areas             |

### Avatar Scale

| Token       | Classes               | Use for                      |
|-------------|----------------------|------------------------------|
| `AVATAR.xs` | `w-6 h-6 text-[10px]` | Stacked avatars, compact lists |
| `AVATAR.sm` | `w-8 h-8 text-xs`    | Table rows, mentions         |
| `AVATAR.md` | `w-10 h-10 text-sm`  | Cards, profile references    |
| `AVATAR.lg` | `w-16 h-16 text-lg`  | Profile headers, hero areas  |

### Rules

- Default icon size is `ICON.md` (`w-4 h-4`) — use for most contexts
- Icon color: `text-muted-foreground` (inactive), `text-primary` (active)
- Use `getAvatarColor(name)` for avatar background — never duplicate the color array
- Use `getInitials(name)` for avatar text — never hand-roll initial extraction

---

## 5. Layout

### Stat/KPI Grids

| Token                 | Classes                              | Use for             |
|-----------------------|--------------------------------------|---------------------|
| `LAYOUT.statsGrid`    | `grid grid-cols-2 lg:grid-cols-4 gap-4` | 4-column KPI row |
| `LAYOUT.statsGridWide`| `grid grid-cols-2 lg:grid-cols-5 gap-4` | 5-column KPI row |

### Content Grids

| Token              | Classes                                       | Use for       |
|--------------------|-----------------------------------------------|---------------|
| `LAYOUT.cardGrid2` | `grid grid-cols-1 sm:grid-cols-2 gap-4`       | 2-column grid |
| `LAYOUT.cardGrid3` | `grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4` | 3-column |
| `LAYOUT.cardGrid4` | `grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4` | 4-column |

### Split Panels

| Token                   | Classes                                  | Use for          |
|-------------------------|------------------------------------------|------------------|
| `LAYOUT.splitPanel`     | `grid grid-cols-1 lg:grid-cols-3 gap-6`  | 1/3 + 2/3 split  |
| `LAYOUT.splitPanelWide` | `grid grid-cols-1 lg:grid-cols-5 gap-6`  | 2/5 + 3/5 split  |

### Cards

| Token              | Classes                                                    | Use for        |
|--------------------|------------------------------------------------------------|----------------|
| `LAYOUT.card`      | `bg-card rounded-lg border border-border shadow-sm`        | Standard card  |
| `LAYOUT.cardHover` | Same + `hover:shadow-md hover:border-primary/30 transition-all cursor-pointer` | Clickable card |

### Tables

| Token                  | Classes                                         | Use for        |
|------------------------|-------------------------------------------------|----------------|
| `LAYOUT.tableWrapper`  | `overflow-x-auto`                               | Table container|
| `LAYOUT.tableBase`     | `w-full text-sm`                                | Table element  |
| `LAYOUT.tableHeader`   | `bg-muted/50 border-b border-border`            | thead/th row   |
| `LAYOUT.tableRow`      | `border-b border-border hover:bg-muted/30 transition-colors` | tbody tr |

### Rules

- **Always** use responsive breakpoints: `grid-cols-1` → `sm:grid-cols-2` → `lg:grid-cols-N`
- **Never** use fixed column counts without responsive fallback
- **Never** hand-write `bg-card rounded-lg border border-border` — use `LAYOUT.card`
- Tables always use `bg-muted/50` for headers and `hover:bg-muted/30` for rows

---

## 6. Animation

### Presets

| Token                 | Effect                    | Use for                         |
|-----------------------|---------------------------|---------------------------------|
| `MOTION.fadeInUp`     | fade + slide up 8px       | Page/section entrance           |
| `MOTION.fadeIn`       | fade only                 | Subtle reveals                  |
| `MOTION.slideInRight` | spring slide from right   | Drawers, side panels            |
| `MOTION.modalOverlay` | fade in/out               | Modal backdrop                  |
| `MOTION.modalPanel`   | spring scale + slide      | Modal content panel             |
| `MOTION.stagger(i)`   | staggered fade + slide    | Card grids, list items          |
| `MOTION.listItem(i)`  | compact stagger           | Table rows, compact lists       |

### Usage

```tsx
// Page entrance
<motion.div {...MOTION.fadeInUp}>

// Staggered card grid
{items.map((item, i) => (
  <motion.div key={item.id} {...MOTION.stagger(i)}>

// Modal
<AnimatePresence>
  {open && (
    <>
      <motion.div className={BACKDROP} {...MOTION.modalOverlay} />
      <motion.div {...MOTION.modalPanel}>
    </>
  )}
</AnimatePresence>
```

### Rules

- **Never** hand-write `initial={{ opacity: 0, y: 10 }}` — use `MOTION.fadeInUp`
- Stagger delay is `i * 0.05` (standard) or `i * 0.04` (compact) — never other values
- Modal panels always use spring physics — never tween
- Page transitions use `duration: 0.2` — never faster or slower
- Entrance `y` offset is `8px` — never `4`, `10`, `12`, or `20`

---

## 7. Components

### PageHeader

```tsx
<PageHeader title="Dashboard" subtitle="Overview of your workspace" />
<PageHeader title="Settings" subtitle="Manage preferences">
  <Button size="sm"><Plus className={ICON.sm} /> Add Item</Button>
</PageHeader>
```

### SectionHeader

```tsx
<SectionHeader title="Recent Activity" />
<SectionHeader title="Team Members" action={<Button size="sm">View All</Button>} />
```

### StatCard

```tsx
<div className={LAYOUT.statsGrid}>
  <StatCard
    label="Total Contacts"
    value="8,420"
    change="+312"
    changeLabel="vs last month"
    icon={Users}
    color="primary"
  />
</div>
```

### EmptyState

```tsx
<EmptyState
  icon={Inbox}
  title="No messages yet"
  description="Messages will appear here when contacts reach out."
  action={<Button size="sm">Send First Message</Button>}
/>
```

### ModalShell

```tsx
<ModalShell
  open={isOpen}
  onClose={() => setIsOpen(false)}
  title="Create Role"
  description="Define permissions for this role"
  size="lg"
  footer={
    <>
      <Button variant="outline" onClick={() => setIsOpen(false)}>Cancel</Button>
      <Button onClick={handleSave}>Save</Button>
    </>
  }
>
  {/* Modal content */}
</ModalShell>
```

### DataTable

```tsx
<DataTable columns={["Name", "Email", "Role", "Status"]}>
  {users.map(user => (
    <tr key={user.id} className={LAYOUT.tableRow}>
      <td className={SPACING.table.cell}>{user.name}</td>
      <td className={SPACING.table.cell}>{user.email}</td>
      <td className={SPACING.table.cell}>{user.role}</td>
      <td className={SPACING.table.cell}>
        <StatusBadge status="active" />
      </td>
    </tr>
  ))}
</DataTable>
```

### HeroBanner

```tsx
<HeroBanner greeting="Good morning" name="Samson">
  <div className="flex gap-6 text-sm text-white/70">
    <span><strong className="text-white">8,420</strong> contacts</span>
    <span><strong className="text-white">247</strong> active seekers</span>
  </div>
</HeroBanner>
```

### TabBar

```tsx
<TabBar
  tabs={[
    { id: "overview", label: "Overview", icon: LayoutDashboard },
    { id: "reports", label: "Reports", icon: FileText },
    { id: "settings", label: "Settings", icon: Settings },
  ]}
  active={activeTab}
  onChange={setActiveTab}
/>
```

### StatusBadge

```tsx
<StatusBadge status="active" />
<StatusBadge status="pending" label="In Review" />
```

### UserAvatar

```tsx
<UserAvatar name="Samson Usmael" size="sm" />
<UserAvatar name="Eyosias Ketema" size="md" />
```

---

## 8. Badges

Use `getBadgeClasses()` or `StatusBadge` for all badge coloring.

### Available Variants

**Status:** `active`, `completed`, `online`, `pending`, `review`, `in_progress`, `error`, `failed`, `critical`, `suspended`, `info`, `new`, `default`, `inactive`, `draft`

**Roles:** `owner`, `admin`, `mentor_coach`, `mentor`, `coordinator`, `reviewer`, `trainer`, `volunteer`

**Platforms:** `whatsapp`, `telegram`, `sms`, `messenger`, `email`, `instagram`, `tiktok`, `webchat`

**Priority:** `high`, `medium`, `low`

### Usage

```tsx
// Direct class application
<Badge className={getBadgeClasses("active")}>Active</Badge>
<Badge className={getBadgeClasses("owner")}>Owner</Badge>
<Badge className={getBadgeClasses("whatsapp")}>WhatsApp</Badge>

// Or use StatusBadge component
<StatusBadge status="active" />
<StatusBadge status="high" label="High Priority" />
```

---

## 9. Do's and Don'ts

### Colors

| Do | Don't |
|----|-------|
| `bg-primary` | `bg-blue-600` |
| `text-destructive` | `text-red-500` or `text-rose-500` |
| `bg-emerald-500/10` | `bg-green-50` |
| `STATUS_COLORS.success.badge` | Hand-written badge colors |
| `MUTED_SCALE.surface` | `bg-muted/37` or any non-standard opacity |

### Typography

| Do | Don't |
|----|-------|
| `className={TEXT.pageTitle}` | `text-3xl font-bold` |
| `className={TEXT.meta}` | `text-[11px] text-gray-400` |
| `className={TEXT.eyebrow}` | `text-xs font-bold uppercase tracking-widest` |
| `text-xs` or `text-sm` | `text-[13px]` or `text-[10px]` |

### Spacing

| Do | Don't |
|----|-------|
| `className={SPACING.page}` | `p-6 lg:p-10` |
| `className={SPACING.card}` | `p-3` or `p-8` on cards |
| `className={SPACING.table.cell}` | `px-6 py-4` in tables |

### Components

| Do | Don't |
|----|-------|
| `<ModalShell>` | Hand-rolled `fixed inset-0 bg-black/40` |
| `<StatCard>` | Custom KPI card with different padding/sizes |
| `<EmptyState>` | Custom empty state with different icon sizes |
| `<DataTable columns={...}>` | Raw `<table>` with inconsistent headers |
| `<TabBar tabs={...}>` | Custom pill tabs with different styles |
| `className={LAYOUT.card}` | `bg-card rounded-lg border border-border shadow-sm` |

### Animation

| Do | Don't |
|----|-------|
| `{...MOTION.fadeInUp}` | `initial={{ opacity: 0, y: 12 }}` |
| `{...MOTION.stagger(i)}` | `delay: i * 0.08` |
| `{...MOTION.modalPanel}` | Custom spring with different damping |

---

## 10. Migration Checklist

When updating existing components to use the design system:

1. Replace all `bg-blue-500/600` with `bg-primary` / `text-primary`
2. Replace all `text-red-*` / `text-rose-*` with `text-destructive`
3. Replace all `bg-green-*` with `bg-emerald-*`
4. Replace all `text-[Npx]` arbitrary sizes with `text-xs` or `text-sm`
5. Replace hand-rolled cards with `LAYOUT.card` or `<Card>`
6. Replace hand-rolled modals with `<ModalShell>`
7. Replace hand-rolled empty states with `<EmptyState>`
8. Replace hand-rolled stat cards with `<StatCard>`
9. Replace hand-rolled tabs with `<TabBar>`
10. Replace hand-rolled badge colors with `getBadgeClasses()`
11. Replace duplicated `AVATAR_COLORS` arrays with import from design-system
12. Replace all motion props with `MOTION.*` presets
13. Standardize page padding to `SPACING.page`
14. Standardize card padding to `SPACING.card`
15. Standardize table padding to `SPACING.table.*`

---

*Last updated: July 2026*
*File: `src/app/components/design-system.tsx`*
