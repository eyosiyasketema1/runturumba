import React, { useEffect, useMemo, useState, useCallback } from "react";
import {
  Plus, Lock, Check, Search, Copy, User,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "./types";

// ============================================================================
// Permission catalog — mirrors the HTML reference exactly
// 41 unscoped + conversations:read {own,group,all} = 44
// ============================================================================

interface PermGroup {
  id: string;
  title: string;
  scoped?: boolean;
  perms: [string, string][];
}

const GROUPS: PermGroup[] = [
  {
    id: "A",
    title: "A · People & Account",
    perms: [
      ["accounts:manage", "Manage account settings"],
      ["users:read", "View users"],
      ["users:manage", "Manage users"],
      ["roles:read", "View roles"],
      ["roles:manage", "Manage roles & permissions"],
      ["contacts:read", "View contacts"],
      ["contacts:manage", "Manage contacts"],
      ["groups:read", "View groups"],
      ["groups:manage", "Manage groups"],
      ["persons:read", "View people"],
      ["persons:manage", "Manage people"],
      ["teams:read", "View teams"],
      ["teams:manage", "Manage teams"],
      ["invitations:manage", "Manage invitations"],
    ],
  },
  {
    id: "B",
    title: "B · Mentoring",
    perms: [
      ["mentors:read", "View mentors"],
      ["mentors:manage", "Manage mentors"],
      ["mentors:review", "Review / approve mentors"],
      ["mentor_groups:read", "View mentor groups"],
      ["mentor_groups:manage", "Manage mentor groups"],
      ["mentor_groups:delete", "Delete mentor groups"],
      ["mentor_forms:manage", "Manage mentor forms"],
      ["seekers:designate", "Designate seekers"],
      ["provider_connections:manage", "Manage provider connections"],
    ],
  },
  {
    id: "C",
    title: "C · Messaging & Channels",
    perms: [
      ["channels:read", "View channels"],
      ["channels:manage", "Manage channels"],
      ["messages:read", "Read messages"],
      ["messages:send", "Send messages"],
      ["templates:read", "View templates"],
      ["templates:manage", "Manage templates"],
      ["group_messages:read", "View group messages"],
      ["group_messages:create", "Create group messages"],
      ["scheduled_messages:read", "View scheduled messages"],
      ["scheduled_messages:manage", "Manage scheduled messages"],
      ["automations:read", "View automations"],
      ["automations:manage", "Manage automations"],
      ["webhooks:manage", "Manage webhooks"],
    ],
  },
  {
    id: "D",
    title: "D · Conversations",
    scoped: true,
    perms: [
      ["conversations:reply", "Reply in conversations"],
      ["conversations:private_note", "Add private notes"],
      ["conversations:claim", "Claim conversations"],
      ["conversations:reassign", "Reassign conversations"],
      ["conversations:configure", "Configure conversations"],
    ],
  },
];

const ALL_PERM_KEYS = GROUPS.flatMap((g) => g.perms.map((p) => p[0]));

// Dashboard views
const VIEWS: [string, string, string][] = [
  ["responder", "Responder", "My Queue, active chats, today’s stats, notifications."],
  ["team", "Team Manager", "Team load, coverage, coaching queue, escalations."],
  ["language", "Language Manager", "Queue health, routing, review & policy, reporting."],
  ["social", "Social & Content", "Campaigns, channel performance, content calendar."],
  ["ops", "Operations & Governance", "Roles, members, compliance & audit, coverage map."],
  ["exec", "Executive Analytics", "Impact trends, cross-language comparison, export."],
];

// ============================================================================
// Role presets
// ============================================================================

const FULL = ALL_PERM_KEYS.slice();
const COACH = [
  "mentor_groups:read", "mentor_groups:manage", "mentors:read", "mentors:review",
  "seekers:designate", "contacts:read", "groups:read", "persons:read", "users:read", "roles:read",
  "conversations:reply", "conversations:private_note", "conversations:claim",
  "conversations:reassign", "messages:read", "templates:read",
];
const MENTOR = [
  "seekers:designate", "contacts:read", "persons:read", "conversations:reply",
  "conversations:private_note", "conversations:claim", "messages:read", "templates:read",
];

interface RoleRecord {
  name: string;
  system: boolean;
  desc: string;
  perms: string[];
  scope: string | null;
  view: string;
  members: number;
  persona?: string;
}

const ROLES: RoleRecord[] = [
  {
    name: "Owner", system: true,
    desc: "Owner of the account",
    perms: FULL, scope: "all", view: "ops", members: 2,
  },
  {
    name: "Admin", system: true,
    desc: "Administrator with invite and member-management privileges",
    perms: FULL, scope: "all", view: "ops", members: 3,
  },
  {
    name: "Mentor Coach", system: true,
    desc: "Reviews and approves mentor applications; manages mentor groups.",
    perms: COACH, scope: "group", view: "team", members: 6,
  },
  {
    name: "Mentor", system: true,
    desc: "Mentor — can view their own availability and mentees.",
    perms: MENTOR, scope: "group", view: "responder", members: 48,
  },
  {
    name: "Volunteer Responder", system: false, persona: "P6",
    desc: "Front-line responder across every channel.",
    perms: MENTOR.concat(["messages:send", "channels:read"]), scope: "own",
    view: "responder", members: 127,
  },
  {
    name: "Volunteer Manager", system: false, persona: "P9",
    desc: "Oversees and coaches volunteers.",
    perms: COACH.concat(["messages:send", "users:manage"]), scope: "group",
    view: "team", members: 9,
  },
  {
    name: "Language Ministry Manager", system: false, persona: "P3",
    desc: "Routing, review, policy and reporting for one language team.",
    perms: COACH.concat(["templates:manage", "automations:read", "channels:read"]),
    scope: "group", view: "language", members: 11,
  },
  {
    name: "Social Media Manager", system: false, persona: "P4",
    desc: "Creates and schedules content; monitors channel performance.",
    perms: [
      "channels:read", "channels:manage", "templates:read", "templates:manage",
      "group_messages:read", "group_messages:create", "scheduled_messages:read",
      "scheduled_messages:manage", "contacts:read", "messages:read",
    ],
    scope: "own", view: "social", members: 4,
  },
  {
    name: "Global Operations Manager", system: false, persona: "P7",
    desc: "Governance, compliance and coverage across all regions.",
    perms: FULL.filter((p) => p !== "accounts:manage"), scope: "all", view: "ops", members: 2,
  },
  {
    name: "Internet Evangelism Executive", system: false, persona: "P5",
    desc: "Evaluates ministry impact across channels and languages.",
    perms: [
      "users:read", "roles:read", "contacts:read", "persons:read", "groups:read",
      "teams:read", "mentors:read", "mentor_groups:read", "messages:read",
      "channels:read", "templates:read", "automations:read",
    ],
    scope: "all", view: "exec", members: 1,
  },
];

// ============================================================================
// SVG icon paths (inline to avoid extra lucide imports)
// ============================================================================

function LockIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} className={className}>
      <rect x="3" y="11" width="18" height="11" rx="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  );
}

function UserIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} className={className}>
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
    </svg>
  );
}

function CheckIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3} className={className}>
      <path d="m5 12 5 5L20 6" />
    </svg>
  );
}

// ============================================================================
// Main component
// ============================================================================

export const RolesPermissionsSection = () => {
  const [currentIndex, setCurrentIndex] = useState(4); // Volunteer Responder
  const [sel, setSel] = useState<Set<string>>(() => new Set(ROLES[4].perms));
  const [scope, setScope] = useState<string | null>(ROLES[4].scope);
  const [view, setView] = useState<string | null>(ROLES[4].view);
  const [locked, setLocked] = useState(false);

  const [roleName, setRoleName] = useState(ROLES[4].name);
  const [roleDesc, setRoleDesc] = useState(ROLES[4].desc);
  const [roleBase, setRoleBase] = useState(0);

  const [roleFilter, setRoleFilter] = useState("");
  const [permFilter, setPermFilter] = useState("");

  // Load a role by index
  const load = useCallback((i: number) => {
    const r = ROLES[i];
    if (!r) return;
    setCurrentIndex(i);
    setLocked(r.system);
    setSel(new Set(r.perms));
    setScope(r.scope);
    setView(r.view);
    setRoleName(r.name);
    setRoleDesc(r.desc);
    setRoleBase(0);
  }, []);

  // Computed counts
  const permCount = sel.size + (scope ? 1 : 0);
  const viewLabel = view ? VIEWS.find((v) => v[0] === view)?.[1] ?? "not selected" : "not selected";

  // Toggle a permission
  function togglePerm(key: string) {
    if (locked) return;
    setSel((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  // Select all / clear
  function selectAll() {
    if (locked) return;
    setSel(new Set(ALL_PERM_KEYS));
    setScope("all");
  }
  function clearAll() {
    if (locked) return;
    setSel(new Set());
    setScope(null);
  }

  // New role
  function handleNewRole() {
    setCurrentIndex(-1);
    setLocked(false);
    setSel(new Set());
    setScope(null);
    setView(null);
    setRoleName("");
    setRoleDesc("");
    setRoleBase(0);
  }

  // Duplicate
  function handleDuplicate() {
    const r = currentIndex >= 0 ? ROLES[currentIndex] : ROLES[0];
    setCurrentIndex(-1);
    setLocked(false);
    setSel(new Set(r.perms));
    setScope(r.scope);
    setView(r.view);
    setRoleName(r.name + " (copy)");
    setRoleDesc(r.desc);
    setRoleBase(0);
    toast.success("Duplicated", {
      description: `Editable copy of ${r.name} — not yet saved.`,
    });
  }

  // Save
  function handleSave() {
    if (!roleName.trim() || !view) {
      toast.error("Please fill in the role name and select a dashboard view.");
      return;
    }
    toast.success("Role saved", {
      description: "Changes apply on the member’s next page load.",
    });
  }

  // Cancel
  function handleCancel() {
    if (currentIndex >= 0) {
      load(currentIndex);
    }
  }

  // Filter roles
  const filteredRoles = useMemo(() => {
    const q = roleFilter.toLowerCase();
    return ROLES.map((r, i) => ({ r, i })).filter(({ r }) =>
      r.name.toLowerCase().includes(q)
    );
  }, [roleFilter]);

  const systemRoles = filteredRoles.filter(({ r }) => r.system);
  const customRoles = filteredRoles.filter(({ r }) => !r.system);

  // Disabled state for save button
  const saveDisabled = locked || !view || !roleName.trim();

  return (
    <div className="space-y-5">
      {/* Page header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-lg font-semibold">Roles & Permissions</h1>
          <p className="text-[13px] text-muted-foreground mt-0.5">
            Four built-in roles ship with every account. Build custom roles by
            ticking permissions and choosing the dashboard each role lands on.
          </p>
        </div>
        <div className="flex gap-2 shrink-0">
          <button
            className="inline-flex items-center justify-center gap-[7px] h-[34px] px-[13px] text-[13px] font-semibold border border-border bg-card hover:bg-accent hover:text-accent-foreground transition-colors"
            onClick={handleDuplicate}
          >
            <Copy className="w-[15px] h-[15px]" />
            Duplicate
          </button>
          <button
            className="inline-flex items-center justify-center gap-[7px] h-[34px] px-[13px] text-[13px] font-semibold bg-primary text-primary-foreground hover:brightness-107 transition-colors border border-transparent"
            onClick={handleNewRole}
          >
            <Plus className="w-[15px] h-[15px]" />
            New role
          </button>
        </div>
      </div>

      {/* Split layout */}
      <div className="grid grid-cols-[296px_1fr] gap-[18px] items-start">
        {/* ── Roles list sidebar ── */}
        <section className="bg-card border border-border">
          {/* Header */}
          <div className="px-4 pt-[14px]">
            <div className="text-sm font-semibold">Roles</div>
            <div className="text-[12.5px] text-muted-foreground mt-px">
              {ROLES.length} in this account
            </div>
          </div>

          {/* Search */}
          <div className="px-3 pt-3">
            <input
              className="h-[34px] w-full px-[10px] bg-card border border-input text-[13px] focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
              placeholder="Search roles…"
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
            />
          </div>

          {/* Role list */}
          <div className="p-2 flex flex-col gap-px max-h-[640px] overflow-auto">
            {systemRoles.length > 0 && (
              <>
                <div className="text-[11px] font-semibold text-muted-foreground px-2 pt-[11px] pb-[5px] tracking-[0.04em] uppercase">
                  System roles
                </div>
                {systemRoles.map(({ r, i }) => (
                  <RoleItem
                    key={i}
                    role={r}
                    active={i === currentIndex}
                    onClick={() => load(i)}
                  />
                ))}
              </>
            )}
            {customRoles.length > 0 && (
              <>
                <div className="text-[11px] font-semibold text-muted-foreground px-2 pt-[11px] pb-[5px] tracking-[0.04em] uppercase">
                  Custom roles
                </div>
                {customRoles.map(({ r, i }) => (
                  <RoleItem
                    key={i}
                    role={r}
                    active={i === currentIndex}
                    onClick={() => load(i)}
                  />
                ))}
              </>
            )}
            {filteredRoles.length === 0 && (
              <div className="py-[22px] px-[10px] text-center text-[12px] text-muted-foreground">
                No roles match.
              </div>
            )}
          </div>
        </section>

        {/* ── Role builder ── */}
        <section className="bg-card border border-border">
          {/* Builder header */}
          <div className="px-4 py-[14px] border-b border-border flex items-center justify-between gap-3">
            <div>
              <div className="text-sm font-semibold">
                {currentIndex < 0
                  ? "New custom role"
                  : locked
                  ? ROLES[currentIndex]?.name ?? "Role details"
                  : `Edit role — ${ROLES[currentIndex]?.name ?? ""}`}
              </div>
              <div className="text-[12.5px] text-muted-foreground mt-px">
                {currentIndex < 0
                  ? "Tick permissions, set the reach, then choose a dashboard view."
                  : locked
                  ? "Built-in role, kept in sync by the platform."
                  : "Define what this role can do and where it lands."}
              </div>
            </div>
            <div className="flex gap-[6px]">
              {locked && (
                <span className="inline-flex items-center gap-1 h-5 px-[7px] text-[11px] font-semibold border border-border bg-muted text-muted-foreground">
                  <Lock className="w-[11px] h-[11px]" />
                  LOCKED
                </span>
              )}
              {currentIndex >= 0 && ROLES[currentIndex]?.persona && (
                <span className="inline-flex items-center gap-1 h-5 px-[7px] text-[11px] font-semibold border border-border bg-secondary text-secondary-foreground">
                  {ROLES[currentIndex].persona}
                </span>
              )}
              {currentIndex < 0 && (
                <span className="inline-flex items-center gap-1 h-5 px-[7px] text-[11px] font-semibold border border-[color-mix(in_oklab,var(--primary)_30%,transparent)] bg-[color-mix(in_oklab,var(--primary)_12%,transparent)] text-primary">
                  DRAFT
                </span>
              )}
              {currentIndex >= 0 && (
                <span className="inline-flex items-center gap-1 h-5 px-[7px] text-[11px] font-semibold border border-border bg-secondary text-secondary-foreground">
                  {ROLES[currentIndex].members} members
                </span>
              )}
            </div>
          </div>

          <div className="p-4">
            {/* Lock banner */}
            {locked && currentIndex >= 0 && (
              <div className="flex gap-[10px] p-[11px_13px] border border-border bg-muted mb-4 items-start">
                <LockIcon className="w-4 h-4 shrink-0 mt-px text-muted-foreground" />
                <div>
                  <div className="font-semibold text-[13px]">
                    This is a built-in role and can&rsquo;t be changed.
                  </div>
                  <div className="text-[12.5px] text-muted-foreground mt-px">
                    Owner, Admin, Mentor Coach and Mentor are seeded into every
                    account and kept in sync by the platform. Duplicate it to make your own version.
                  </div>
                </div>
              </div>
            )}

            {/* Name + Start from */}
            <div className="grid grid-cols-2 gap-[14px] mb-5">
              <div className="flex flex-col gap-[6px]">
                <label className="text-[12.5px] font-semibold">Role name</label>
                <input
                  className="h-[34px] w-full px-[10px] bg-card border border-input text-[13px] disabled:bg-muted disabled:text-muted-foreground disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
                  placeholder="e.g. Volunteer Responder"
                  value={roleName}
                  onChange={(e) => setRoleName(e.target.value)}
                  disabled={locked}
                />
                <span className="text-[12px] text-muted-foreground">
                  {locked ? "Built-in role names are fixed." : "Must be unique within the account."}
                </span>
              </div>
              <div className="flex flex-col gap-[6px]">
                <label className="text-[12.5px] font-semibold">Start from</label>
                <select
                  className="h-[34px] w-full px-[10px] bg-card border border-input text-[13px] disabled:bg-muted disabled:text-muted-foreground disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
                  value={roleBase}
                  onChange={(e) => setRoleBase(Number(e.target.value))}
                  disabled={locked}
                >
                  <option value={0}>Empty &mdash; no permissions</option>
                  <option value={1}>Duplicate: Owner</option>
                  <option value={2}>Duplicate: Admin</option>
                  <option value={3}>Duplicate: Mentor Coach</option>
                  <option value={4}>Duplicate: Mentor</option>
                </select>
                <span className="text-[12px] text-muted-foreground">
                  Copies that role&rsquo;s permissions as a starting set.
                </span>
              </div>
            </div>

            {/* Description */}
            <div className="flex flex-col gap-[6px] mb-[22px]">
              <label className="text-[12.5px] font-semibold">Description</label>
              <textarea
                className="w-full px-[10px] py-2 bg-card border border-input text-[13px] resize-y min-h-[60px] disabled:bg-muted disabled:text-muted-foreground disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
                rows={2}
                placeholder="Shown wherever this role is assigned."
                value={roleDesc}
                onChange={(e) => setRoleDesc(e.target.value)}
                disabled={locked}
              />
            </div>

            {/* Dashboard view */}
            <div className="mb-2">
              <div className="text-[12.5px] font-semibold mb-[3px]">Dashboard view</div>
              <div className="text-[12px] text-muted-foreground mb-[11px]">
                Where a member holding this role lands after login. Widgets that
                need a permission the role lacks are hidden automatically.
              </div>
              <div className="grid grid-cols-3 gap-[9px]">
                {VIEWS.map(([id, name, desc]) => {
                  const selected = view === id;
                  return (
                    <button
                      key={id}
                      className={cn(
                        "border p-[11px] text-left flex gap-[9px] items-start bg-card transition-colors",
                        selected
                          ? "border-primary bg-[color-mix(in_oklab,var(--primary)_5%,transparent)]"
                          : "border-border hover:border-primary",
                        locked && "opacity-55 cursor-not-allowed"
                      )}
                      onClick={() => {
                        if (!locked) setView(id);
                      }}
                      disabled={locked}
                    >
                      <span
                        className={cn(
                          "w-[15px] h-[15px] rounded-full border shrink-0 mt-px grid place-items-center",
                          selected ? "border-primary" : "border-input"
                        )}
                      >
                        {selected && (
                          <span className="w-[7px] h-[7px] rounded-full bg-primary" />
                        )}
                      </span>
                      <span>
                        <span className="font-semibold text-[12.5px] block">{name}</span>
                        <span className="text-[11.5px] text-muted-foreground mt-[2px] leading-[1.35] block">
                          {desc}
                        </span>
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Permissions */}
            <div className="mt-[26px]">
              {/* Toolbar */}
              <div className="flex items-center gap-[9px] flex-wrap pb-3 mb-1 border-b border-border">
                <div className="text-[13px] font-semibold">Permissions</div>
                <span className="inline-flex items-center gap-1 h-5 px-[7px] text-[11px] font-semibold border border-[color-mix(in_oklab,var(--primary)_30%,transparent)] bg-[color-mix(in_oklab,var(--primary)_12%,transparent)] text-primary">
                  {permCount} selected
                </span>
                <span className="flex-1" />
                <input
                  className="h-[34px] w-[230px] px-[10px] bg-card border border-input text-[13px] focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
                  placeholder="Filter permissions…"
                  value={permFilter}
                  onChange={(e) => setPermFilter(e.target.value)}
                />
                <button
                  className="inline-flex items-center justify-center h-[29px] px-[10px] text-[12px] font-semibold border border-border bg-card hover:bg-accent hover:text-accent-foreground transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  onClick={selectAll}
                  disabled={locked}
                >
                  Select all
                </button>
                <button
                  className="inline-flex items-center justify-center h-[29px] px-[10px] text-[12px] font-semibold border border-border bg-card hover:bg-accent hover:text-accent-foreground transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  onClick={clearAll}
                  disabled={locked}
                >
                  Clear
                </button>
              </div>

              {/* Permission groups */}
              {GROUPS.map((group) => {
                const q = permFilter.toLowerCase();
                const hits = group.perms.filter(
                  ([k, l]) =>
                    k.toLowerCase().includes(q) || l.toLowerCase().includes(q)
                );
                const scopedHit =
                  group.scoped &&
                  ("conversations:read".includes(q) ||
                    "read conversations".includes(q) ||
                    q === "");
                if (!hits.length && !scopedHit) return null;

                const on =
                  group.perms.filter(([k]) => sel.has(k)).length +
                  (group.scoped && scope ? 1 : 0);
                const tot = group.perms.length + (group.scoped ? 1 : 0);

                return (
                  <div key={group.id} className="border-t border-border first:border-t-0">
                    <div className="flex items-center gap-[9px] py-3">
                      <span className="font-semibold text-[13px]">{group.title}</span>
                      <span className="text-[11.5px] text-muted-foreground">
                        {on}/{tot}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-x-[18px] gap-y-px pb-[10px]">
                      {/* Scoped permission block */}
                      {group.scoped && scopedHit && (
                        <div className="col-span-2 border border-border p-[11px] bg-muted my-1 mb-[10px]">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-[13px] font-medium">Read conversations</span>
                            <span className="inline-flex items-center gap-1 h-5 px-[7px] text-[11px] font-semibold border border-[color-mix(in_oklab,var(--info)_30%,transparent)] bg-[color-mix(in_oklab,var(--info)_12%,transparent)] text-info">
                              SCOPED
                            </span>
                            <span className="text-[11px] text-muted-foreground font-mono">
                              conversations:read:&lt;scope&gt;
                            </span>
                          </div>
                          <div className="text-[12px] text-muted-foreground mt-1">
                            The only scoped permission. A role may hold exactly one level &mdash;
                            widening circles: own &sub; group &sub; all.
                          </div>
                          <div className="flex gap-2 mt-[9px] flex-wrap">
                            {(
                              [
                                ["own", "Own", "their own chats"],
                                ["group", "Group", "their group’s chats"],
                                ["all", "All", "every conversation"],
                              ] as [string, string, string][]
                            ).map(([s, label, note]) => (
                              <button
                                key={s}
                                className={cn(
                                  "flex items-center gap-[7px] px-[11px] py-[7px] border text-[12.5px] font-medium bg-card transition-colors",
                                  scope === s
                                    ? "border-primary bg-[color-mix(in_oklab,var(--primary)_6%,transparent)]"
                                    : "border-input",
                                  locked && "cursor-not-allowed opacity-60"
                                )}
                                onClick={() => {
                                  if (locked) return;
                                  setScope((prev) => (prev === s ? null : s));
                                }}
                                disabled={locked}
                              >
                                <span
                                  className={cn(
                                    "w-[15px] h-[15px] rounded-full border grid place-items-center",
                                    scope === s ? "border-primary" : "border-input"
                                  )}
                                >
                                  {scope === s && (
                                    <span className="w-[7px] h-[7px] rounded-full bg-primary" />
                                  )}
                                </span>
                                <span>
                                  {label}{" "}
                                  <small className="text-muted-foreground font-normal">
                                    &middot; {note}
                                  </small>
                                </span>
                              </button>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Permission checkboxes */}
                      {hits.map(([k, l]) => {
                        const isOn = sel.has(k);
                        return (
                          <div
                            key={k}
                            className={cn(
                              "flex gap-[9px] p-[6px] items-start border border-transparent transition-colors",
                              locked
                                ? "cursor-not-allowed opacity-60"
                                : "cursor-pointer hover:bg-accent"
                            )}
                            onClick={() => togglePerm(k)}
                          >
                            <span
                              className={cn(
                                "w-[15px] h-[15px] border shrink-0 mt-[2px] grid place-items-center",
                                isOn
                                  ? "bg-primary border-primary"
                                  : "bg-card border-input"
                              )}
                            >
                              {isOn && (
                                <CheckIcon className="w-[11px] h-[11px] text-white" />
                              )}
                            </span>
                            <span>
                              <span className="text-[13px] font-medium block">{l}</span>
                              <span className="text-[11px] text-muted-foreground mt-px block font-mono">
                                {k}
                              </span>
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Footer */}
          <div className="px-4 py-3 border-t border-border flex items-center justify-between gap-3 bg-muted">
            <div className="text-[12.5px] text-muted-foreground">
              <b className="text-foreground">{permCount}</b> of 44 permissions &middot;
              reach <b className="text-foreground">{scope ?? "none"}</b> &middot;
              view <b className="text-foreground">{viewLabel}</b>
            </div>
            <div className="flex gap-2">
              <button
                className="inline-flex items-center justify-center h-[34px] px-[13px] text-[13px] font-semibold border border-border bg-card hover:bg-accent hover:text-accent-foreground transition-colors"
                onClick={handleCancel}
              >
                Cancel
              </button>
              <button
                className={cn(
                  "inline-flex items-center justify-center h-[34px] px-[13px] text-[13px] font-semibold bg-primary text-primary-foreground border border-transparent transition-colors",
                  saveDisabled
                    ? "opacity-50 cursor-not-allowed"
                    : "hover:brightness-107"
                )}
                onClick={handleSave}
                disabled={saveDisabled}
              >
                Save role
              </button>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

// ============================================================================
// Role list item
// ============================================================================

function RoleItem({
  role,
  active,
  onClick,
}: {
  role: RoleRecord;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      className={cn(
        "flex items-start gap-[9px] p-[9px] text-left w-full border-l-2 border-transparent transition-colors",
        active
          ? "bg-accent border-l-primary"
          : "hover:bg-accent"
      )}
      onClick={onClick}
    >
      <span
        className={cn(
          "w-7 h-7 grid place-items-center shrink-0 mt-px",
          active
            ? "bg-primary text-white"
            : "bg-secondary"
        )}
      >
        {role.system ? (
          <LockIcon className="w-[14px] h-[14px]" />
        ) : (
          <UserIcon className="w-[14px] h-[14px]" />
        )}
      </span>
      <span className="min-w-0 flex-1">
        <span className="font-semibold text-[13px] flex items-center gap-[6px] flex-wrap">
          {role.name}
          {role.system && (
            <span className="inline-flex items-center gap-1 h-5 px-[7px] text-[11px] font-semibold border border-border bg-muted text-muted-foreground">
              LOCKED
            </span>
          )}
          {role.persona && (
            <span className="inline-flex items-center h-5 px-[7px] text-[11px] font-semibold border border-border bg-secondary text-secondary-foreground">
              {role.persona}
            </span>
          )}
        </span>
        <span className="text-[11.5px] text-muted-foreground mt-px block whitespace-nowrap overflow-hidden text-ellipsis">
          {role.perms.length + 1} permissions &middot; {role.members} members
        </span>
      </span>
    </button>
  );
}
