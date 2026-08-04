import React, { useEffect, useMemo, useState } from "react";
import {
  Plus, Lock, MoreVertical, ChevronDown, ArrowLeft, Info, AlertTriangle,
  Trash2, Copy, Eye, Pencil, UserPlus, Users, X, Shield,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { toast } from "sonner";
import { cn } from "./types";
import { Card, CardContent } from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Separator } from "./ui/separator";
import { Switch } from "./ui/switch";
import { Badge } from "./ui/badge";
import { Textarea } from "./ui/textarea";
import { Avatar, AvatarFallback } from "./ui/avatar";

// ============================================================================
// Types
// ============================================================================

type Scope = "own" | "group" | "all";

interface ConversationPermValue {
  enabled: boolean;
  scope: Scope;
}

interface PermissionState {
  groupA: Record<string, boolean>;
  groupB: Record<string, boolean>;
  groupC: Record<string, boolean>;
  groupD: Record<string, ConversationPermValue>;
}

interface RoleRecord {
  id: string;
  name: string;
  description: string;
  isSystem: boolean;
  memberCount: number;
  permissions: PermissionState;
}

interface Member {
  id: string;
  name: string;
  email: string;
  roleId: string;
}

type Screen = "list" | "builder" | "view";
type BuilderMode = "create" | "edit";

// ============================================================================
// Permission catalog definitions
// ============================================================================

const GROUP_A_PERMS: { id: string; label: string }[] = [
  { id: "view_team_members", label: "View team members" },
  { id: "invite_members", label: "Invite new members" },
  { id: "remove_members", label: "Remove members" },
  { id: "assign_roles", label: "Assign roles to members" },
  { id: "view_org_settings", label: "View organization settings" },
  { id: "edit_org_settings", label: "Edit organization settings" },
  { id: "manage_billing", label: "Manage billing" },
  { id: "view_audit_log", label: "View audit log" },
  { id: "export_audit_log", label: "Export audit log" },
  { id: "manage_integrations", label: "Manage integrations" },
  { id: "manage_api_keys", label: "Manage API keys" },
  { id: "manage_child_orgs", label: "Manage child organizations" },
  { id: "view_analytics", label: "View analytics & reports" },
];

const GROUP_B_PERMS: { id: string; label: string }[] = [
  { id: "view_training_materials", label: "View training materials" },
  { id: "create_training_materials", label: "Create training materials" },
  { id: "edit_training_materials", label: "Edit training materials" },
  { id: "delete_training_materials", label: "Delete training materials" },
  { id: "view_practice_sessions", label: "View practice sessions" },
  { id: "create_practice_sessions", label: "Create practice sessions" },
  { id: "review_practice_sessions", label: "Review practice sessions" },
  { id: "manage_training_programs", label: "Manage training programs" },
  { id: "view_trainee_progress", label: "View trainee progress" },
];

const GROUP_C_PERMS: { id: string; label: string }[] = [
  { id: "view_channels", label: "View channels" },
  { id: "create_channels", label: "Create channels" },
  { id: "edit_channels", label: "Edit channels" },
  { id: "delete_channels", label: "Delete channels" },
  { id: "send_messages", label: "Send messages" },
  { id: "send_broadcasts", label: "Send broadcasts" },
  { id: "manage_message_templates", label: "Manage message templates" },
  { id: "view_broadcast_history", label: "View broadcast history" },
  { id: "manage_automations", label: "Manage automations" },
  { id: "view_automation_logs", label: "View automation logs" },
  { id: "manage_contact_lists", label: "Manage contact lists" },
];

const GROUP_D_PERMS: { id: string; label: string }[] = [
  { id: "read_conversations", label: "Read conversations" },
  { id: "reply_conversations", label: "Reply to conversations" },
  { id: "reassign_conversations", label: "Reassign conversations" },
  { id: "close_conversations", label: "Close/resolve conversations" },
  { id: "delete_conversation_messages", label: "Delete conversation messages" },
  { id: "export_conversations", label: "Export conversations" },
];

const PERMISSION_GROUP_META = [
  { key: "groupA" as const, title: "People & Account", perms: GROUP_A_PERMS },
  { key: "groupB" as const, title: "Mentoring", perms: GROUP_B_PERMS },
  { key: "groupC" as const, title: "Messaging & Channels", perms: GROUP_C_PERMS },
  { key: "groupD" as const, title: "Conversations", perms: GROUP_D_PERMS },
];

const SCOPE_OPTIONS: { value: Scope; label: string }[] = [
  { value: "own", label: "Own" },
  { value: "group", label: "Group" },
  { value: "all", label: "All" },
];

// ============================================================================
// Permission state builders
// ============================================================================

function emptyPermissions(): PermissionState {
  return {
    groupA: Object.fromEntries(GROUP_A_PERMS.map((p) => [p.id, false])),
    groupB: Object.fromEntries(GROUP_B_PERMS.map((p) => [p.id, false])),
    groupC: Object.fromEntries(GROUP_C_PERMS.map((p) => [p.id, false])),
    groupD: Object.fromEntries(
      GROUP_D_PERMS.map((p) => [p.id, { enabled: false, scope: "own" as Scope }])
    ),
  };
}

function setKeys(perms: PermissionState, changes: {
  groupA?: string[];
  groupB?: string[];
  groupC?: string[];
  groupD?: { ids: string[]; scope: Scope };
}): PermissionState {
  const next = clonePermissions(perms);
  changes.groupA?.forEach((id) => (next.groupA[id] = true));
  changes.groupB?.forEach((id) => (next.groupB[id] = true));
  changes.groupC?.forEach((id) => (next.groupC[id] = true));
  changes.groupD?.ids.forEach((id) => (next.groupD[id] = { enabled: true, scope: changes.groupD!.scope }));
  return next;
}

function clonePermissions(p: PermissionState): PermissionState {
  return {
    groupA: { ...p.groupA },
    groupB: { ...p.groupB },
    groupC: { ...p.groupC },
    groupD: Object.fromEntries(Object.entries(p.groupD).map(([k, v]) => [k, { ...v }])),
  };
}

function allOnPermissions(scope: Scope): PermissionState {
  const base = emptyPermissions();
  return setKeys(base, {
    groupA: GROUP_A_PERMS.map((p) => p.id),
    groupB: GROUP_B_PERMS.map((p) => p.id),
    groupC: GROUP_C_PERMS.map((p) => p.id),
    groupD: { ids: GROUP_D_PERMS.map((p) => p.id), scope },
  });
}

function countGroup(obj: Record<string, boolean>): number {
  return Object.values(obj).filter(Boolean).length;
}

function countGroupD(obj: Record<string, ConversationPermValue>): number {
  return Object.values(obj).filter((v) => v.enabled).length;
}

function totalEnabled(p: PermissionState): number {
  return countGroup(p.groupA) + countGroup(p.groupB) + countGroup(p.groupC) + countGroupD(p.groupD);
}

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  return ((parts[0]?.[0] ?? "") + (parts[1]?.[0] ?? "")).toUpperCase();
}

function generateId(prefix: string): string {
  return `${prefix}-${Date.now().toString(36)}-${Math.floor(Math.random() * 10000)}`;
}

// ============================================================================
// System role defaults
// ============================================================================

const OWNER_PERMISSIONS = allOnPermissions("all");

const ADMIN_PERMISSIONS = (() => {
  const p = allOnPermissions("all");
  p.groupA["manage_billing"] = false;
  p.groupA["manage_child_orgs"] = false;
  return p;
})();

const MENTOR_COACH_PERMISSIONS = setKeys(emptyPermissions(), {
  groupA: ["view_team_members", "view_org_settings", "view_audit_log", "view_analytics"],
  groupB: GROUP_B_PERMS.map((p) => p.id),
  groupC: ["view_channels", "send_messages", "view_broadcast_history", "manage_contact_lists"],
  groupD: { ids: GROUP_D_PERMS.map((p) => p.id), scope: "group" },
});

const MENTOR_PERMISSIONS = setKeys(emptyPermissions(), {
  groupA: ["view_team_members", "view_org_settings"],
  groupB: ["view_training_materials", "view_practice_sessions"],
  groupC: ["view_channels", "send_messages"],
  groupD: { ids: ["read_conversations", "reply_conversations", "close_conversations"], scope: "own" },
});

const SENIOR_MENTOR_PERMISSIONS = setKeys(emptyPermissions(), {
  groupA: ["view_team_members", "view_org_settings"],
  groupB: ["view_training_materials", "view_practice_sessions", "review_practice_sessions", "view_trainee_progress"],
  groupC: ["view_channels", "send_messages", "view_broadcast_history"],
  groupD: { ids: ["read_conversations", "reply_conversations", "reassign_conversations", "close_conversations"], scope: "group" },
});

const CONTENT_MANAGER_PERMISSIONS = setKeys(emptyPermissions(), {
  groupA: ["view_team_members", "view_org_settings"],
  groupB: ["view_training_materials", "create_training_materials", "edit_training_materials", "delete_training_materials", "manage_training_programs"],
  groupC: ["view_channels", "manage_message_templates", "view_broadcast_history"],
});

const INITIAL_ROLES: RoleRecord[] = [
  {
    id: "role-owner",
    name: "Owner",
    description: "Full platform access with billing and ownership controls",
    isSystem: true,
    memberCount: 1,
    permissions: OWNER_PERMISSIONS,
  },
  {
    id: "role-admin",
    name: "Admin",
    description: "Complete operational access without billing controls",
    isSystem: true,
    memberCount: 2,
    permissions: ADMIN_PERMISSIONS,
  },
  {
    id: "role-mentor-coach",
    name: "Mentor Coach",
    description: "Oversee mentors, review conversations, manage training",
    isSystem: true,
    memberCount: 5,
    permissions: MENTOR_COACH_PERMISSIONS,
  },
  {
    id: "role-mentor",
    name: "Mentor",
    description: "Handle conversations, follow guidelines, participate in training",
    isSystem: true,
    memberCount: 12,
    permissions: MENTOR_PERMISSIONS,
  },
  {
    id: "role-senior-mentor",
    name: "Senior Mentor",
    description: "Experienced mentors with expanded conversation access",
    isSystem: false,
    memberCount: 4,
    permissions: SENIOR_MENTOR_PERMISSIONS,
  },
  {
    id: "role-content-manager",
    name: "Content Manager",
    description: "Manage training materials and conversation templates",
    isSystem: false,
    memberCount: 3,
    permissions: CONTENT_MANAGER_PERMISSIONS,
  },
];

const INITIAL_MEMBERS: Member[] = [
  { id: "mem-1", name: "Eyosias Ketema", email: "eyosias@turumba.org", roleId: "role-owner" },
  { id: "mem-2", name: "Samson Usmael", email: "samson@turumba.org", roleId: "role-admin" },
  { id: "mem-3", name: "Abebe Bekele", email: "abebe@turumba.org", roleId: "role-admin" },
  { id: "mem-4", name: "Sara Tadesse", email: "sara@turumba.org", roleId: "role-mentor-coach" },
  { id: "mem-5", name: "Daniel Hailu", email: "daniel@turumba.org", roleId: "role-mentor-coach" },
  { id: "mem-6", name: "Hanna Girma", email: "hanna@turumba.org", roleId: "role-mentor" },
  { id: "mem-7", name: "Yonas Tesfaye", email: "yonas@turumba.org", roleId: "role-mentor" },
  { id: "mem-8", name: "Meron Alemu", email: "meron@turumba.org", roleId: "role-mentor" },
];

// ============================================================================
// Small shared UI bits
// ============================================================================

function ModalShell({
  onClose,
  children,
  labelledBy,
  maxWidth = "max-w-lg",
}: {
  onClose: () => void;
  children: React.ReactNode;
  labelledBy: string;
  maxWidth?: string;
}) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/40"
        onClick={onClose}
        aria-hidden="true"
      />
      <motion.div
        role="dialog"
        aria-modal="true"
        aria-labelledby={labelledBy}
        initial={{ opacity: 0, y: 12, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 12, scale: 0.98 }}
        transition={{ duration: 0.18 }}
        className={cn(
          "relative z-10 w-full bg-card border rounded-xl shadow-xl max-h-[85vh] overflow-y-auto",
          maxWidth
        )}
      >
        {children}
      </motion.div>
    </div>
  );
}

function ScopeSelector({
  value,
  onChange,
  disabled,
}: {
  value: Scope;
  onChange: (scope: Scope) => void;
  disabled?: boolean;
}) {
  return (
    <div
      role="radiogroup"
      aria-label="Permission scope"
      className={cn(
        "inline-flex items-center rounded-full border bg-muted p-0.5 gap-0.5",
        disabled && "opacity-50"
      )}
    >
      {SCOPE_OPTIONS.map((opt) => (
        <button
          key={opt.value}
          type="button"
          role="radio"
          aria-checked={value === opt.value}
          disabled={disabled}
          onClick={() => onChange(opt.value)}
          className={cn(
            "px-3 py-1 text-xs font-medium rounded-full transition-colors min-h-[28px]",
            value === opt.value
              ? "bg-primary text-primary-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground",
            disabled && "cursor-not-allowed"
          )}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}

function PermissionToggleRow({
  label,
  checked,
  onChange,
  disabled,
  id,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
  disabled?: boolean;
  id: string;
}) {
  return (
    <div className="flex items-center justify-between gap-4 py-2.5">
      <Label htmlFor={id} className="text-sm font-normal text-foreground cursor-pointer">
        {label}
      </Label>
      <Switch id={id} checked={checked} onCheckedChange={onChange} disabled={disabled} aria-label={label} />
    </div>
  );
}

function ConversationPermissionRow({
  label,
  value,
  onToggle,
  onScopeChange,
  disabled,
  id,
}: {
  label: string;
  value: ConversationPermValue;
  onToggle: (v: boolean) => void;
  onScopeChange: (scope: Scope) => void;
  disabled?: boolean;
  id: string;
}) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 py-2.5">
      <Label htmlFor={id} className="text-sm font-normal text-foreground cursor-pointer">
        {label}
      </Label>
      <div className="flex items-center gap-3">
        <ScopeSelector value={value.scope} onChange={onScopeChange} disabled={disabled || !value.enabled} />
        <Switch id={id} checked={value.enabled} onCheckedChange={onToggle} disabled={disabled} aria-label={label} />
      </div>
    </div>
  );
}

function RoleCard({
  role,
  onView,
  onEdit,
  onDuplicate,
  onDelete,
  onAssign,
  menuOpen,
  onToggleMenu,
}: {
  role: RoleRecord;
  onView: () => void;
  onEdit: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
  onAssign: () => void;
  menuOpen: boolean;
  onToggleMenu: () => void;
}) {
  return (
    <Card
      className={cn(
        "transition-colors",
        role.isSystem ? "hover:border-border" : "hover:border-primary/40 cursor-pointer"
      )}
      onClick={role.isSystem ? onView : undefined}
    >
      <CardContent className="p-4 flex items-center justify-between gap-4">
        <div className="flex items-start gap-3 min-w-0">
          <div
            className={cn(
              "mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-lg",
              role.isSystem ? "bg-muted text-muted-foreground" : "bg-primary/10 text-primary"
            )}
          >
            {role.isSystem ? <Lock className="w-4 h-4" /> : <Shield className="w-4 h-4" />}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <p className="font-bold text-foreground">{role.name}</p>
              <Badge variant={role.isSystem ? "outline" : "secondary"}>
                {role.isSystem ? "System" : "Custom"}
              </Badge>
              <Badge variant="outline" className="gap-1">
                <Users className="w-3 h-3" />
                {role.memberCount} {role.memberCount === 1 ? "member" : "members"}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground mt-1">{role.description}</p>
          </div>
        </div>

        <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
          <Button
            variant="ghost"
            size="icon"
            title="Assign members"
            aria-label={`Assign members to ${role.name}`}
            onClick={onAssign}
          >
            <UserPlus className="w-4 h-4" />
          </Button>

          {role.isSystem ? (
            <Button variant="ghost" size="icon" title="View role" aria-label={`View ${role.name}`} onClick={onView}>
              <Eye className="w-4 h-4" />
            </Button>
          ) : (
            <div className="relative">
              <Button
                variant="ghost"
                size="icon"
                title="Role actions"
                aria-label={`Actions for ${role.name}`}
                aria-haspopup="menu"
                aria-expanded={menuOpen}
                onClick={onToggleMenu}
              >
                <MoreVertical className="w-4 h-4" />
              </Button>
              {menuOpen && (
                <>
                  <div className="fixed inset-0 z-10" onClick={onToggleMenu} aria-hidden="true" />
                  <div
                    role="menu"
                    className="absolute right-0 top-full mt-1 w-44 bg-card border rounded-md shadow-lg z-20 py-1"
                  >
                    <button
                      role="menuitem"
                      onClick={onView}
                      className="w-full flex items-center gap-2 px-3 py-2 text-sm text-left hover:bg-accent"
                    >
                      <Eye className="w-4 h-4" /> View
                    </button>
                    <button
                      role="menuitem"
                      onClick={onEdit}
                      className="w-full flex items-center gap-2 px-3 py-2 text-sm text-left hover:bg-accent"
                    >
                      <Pencil className="w-4 h-4" /> Edit
                    </button>
                    <button
                      role="menuitem"
                      onClick={onDuplicate}
                      className="w-full flex items-center gap-2 px-3 py-2 text-sm text-left hover:bg-accent"
                    >
                      <Copy className="w-4 h-4" /> Duplicate
                    </button>
                    <Separator className="my-1" />
                    <button
                      role="menuitem"
                      onClick={onDelete}
                      className="w-full flex items-center gap-2 px-3 py-2 text-sm text-left text-destructive hover:bg-destructive/10"
                    >
                      <Trash2 className="w-4 h-4" /> Delete
                    </button>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// ============================================================================
// Main component
// ============================================================================

export const RolesPermissionsSection = () => {
  const [roles, setRoles] = useState<RoleRecord[]>(INITIAL_ROLES);
  const [members, setMembers] = useState<Member[]>(INITIAL_MEMBERS);

  const [screen, setScreen] = useState<Screen>("list");
  const [builderMode, setBuilderMode] = useState<BuilderMode>("create");
  const [activeRoleId, setActiveRoleId] = useState<string | null>(null);

  const [formName, setFormName] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [formPermissions, setFormPermissions] = useState<PermissionState>(emptyPermissions());
  const [formErrors, setFormErrors] = useState<{ name?: string; permissions?: string }>({});

  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({
    groupA: true,
    groupB: true,
    groupC: true,
    groupD: true,
  });

  const [openMenuRoleId, setOpenMenuRoleId] = useState<string | null>(null);

  const [isAssignOpen, setIsAssignOpen] = useState(false);
  const [assignContextRoleId, setAssignContextRoleId] = useState<string | null>(null);
  const [assignSelections, setAssignSelections] = useState<Record<string, string>>({});

  const [deleteRoleId, setDeleteRoleId] = useState<string | null>(null);

  const systemRoles = useMemo(() => roles.filter((r) => r.isSystem), [roles]);
  const customRoles = useMemo(() => roles.filter((r) => !r.isSystem), [roles]);
  const activeRole = useMemo(() => roles.find((r) => r.id === activeRoleId) ?? null, [roles, activeRoleId]);
  const deleteRole = useMemo(() => roles.find((r) => r.id === deleteRoleId) ?? null, [roles, deleteRoleId]);

  function isNameTaken(name: string, excludeId?: string | null): boolean {
    const normalized = name.trim().toLowerCase();
    return roles.some((r) => r.id !== excludeId && r.name.trim().toLowerCase() === normalized);
  }

  function toggleExpand(key: string) {
    setExpandedGroups((prev) => ({ ...prev, [key]: !prev[key] }));
  }

  function toggleSimplePermission(group: "groupA" | "groupB" | "groupC", id: string, value: boolean) {
    setFormPermissions((prev) => ({ ...prev, [group]: { ...prev[group], [id]: value } }));
  }

  function toggleConversationPermission(id: string, enabled: boolean) {
    setFormPermissions((prev) => ({
      ...prev,
      groupD: { ...prev.groupD, [id]: { ...prev.groupD[id], enabled } },
    }));
  }

  function setConversationScope(id: string, scope: Scope) {
    setFormPermissions((prev) => ({
      ...prev,
      groupD: { ...prev.groupD, [id]: { ...prev.groupD[id], scope } },
    }));
  }

  function resetBuilderState() {
    setFormName("");
    setFormDescription("");
    setFormPermissions(emptyPermissions());
    setFormErrors({});
  }

  function openCreate() {
    resetBuilderState();
    setBuilderMode("create");
    setActiveRoleId(null);
    setScreen("builder");
  }

  function openEdit(role: RoleRecord) {
    setFormName(role.name);
    setFormDescription(role.description);
    setFormPermissions(clonePermissions(role.permissions));
    setFormErrors({});
    setBuilderMode("edit");
    setActiveRoleId(role.id);
    setScreen("builder");
  }

  function openView(role: RoleRecord) {
    setFormName(role.name);
    setFormDescription(role.description);
    setFormPermissions(clonePermissions(role.permissions));
    setActiveRoleId(role.id);
    setScreen("view");
  }

  function handleDuplicate(role: RoleRecord) {
    const baseName = `Copy of ${role.name}`;
    let finalName = baseName;
    let i = 2;
    while (isNameTaken(finalName)) {
      finalName = `${baseName} ${i}`;
      i += 1;
    }
    const newRole: RoleRecord = {
      id: generateId("role"),
      name: finalName,
      description: role.description,
      isSystem: false,
      memberCount: 0,
      permissions: clonePermissions(role.permissions),
    };
    setRoles((prev) => [...prev, newRole]);
    toast.success(`Duplicated "${role.name}" as "${finalName}"`);
    openEdit(newRole);
  }

  function handleSave() {
    const errors: { name?: string; permissions?: string } = {};
    const trimmedName = formName.trim();

    if (!trimmedName) {
      errors.name = "Role name is required.";
    } else if (trimmedName.length > 50) {
      errors.name = "Role name must be 50 characters or fewer.";
    } else if (isNameTaken(trimmedName, builderMode === "edit" ? activeRoleId : null)) {
      errors.name = "A role with this name already exists.";
    }

    if (totalEnabled(formPermissions) === 0) {
      errors.permissions = "Select at least one permission before saving.";
    }

    setFormErrors(errors);
    if (Object.keys(errors).length > 0) {
      toast.error("Please fix the errors before saving.");
      return;
    }

    const trimmedDescription = formDescription.trim().slice(0, 200);

    if (builderMode === "create") {
      const newRole: RoleRecord = {
        id: generateId("role"),
        name: trimmedName,
        description: trimmedDescription,
        isSystem: false,
        memberCount: 0,
        permissions: formPermissions,
      };
      setRoles((prev) => [...prev, newRole]);
      toast.success(`Role "${trimmedName}" created`);
    } else if (activeRoleId) {
      setRoles((prev) =>
        prev.map((r) =>
          r.id === activeRoleId
            ? { ...r, name: trimmedName, description: trimmedDescription, permissions: formPermissions }
            : r
        )
      );
      toast.success(`Role "${trimmedName}" updated`);
    }

    setScreen("list");
  }

  function handleCancelBuilder() {
    setScreen("list");
  }

  function openAssign(role?: RoleRecord) {
    setAssignContextRoleId(role?.id ?? null);
    const selections: Record<string, string> = {};
    members.forEach((m) => (selections[m.id] = m.roleId));
    setAssignSelections(selections);
    setIsAssignOpen(true);
  }

  function handleAssignSave() {
    setMembers((prev) => prev.map((m) => ({ ...m, roleId: assignSelections[m.id] ?? m.roleId })));
    toast.success("Role assignments updated");
    setIsAssignOpen(false);
  }

  function handleDeleteConfirm() {
    if (!deleteRole) return;
    if (deleteRole.memberCount > 0) return;
    setRoles((prev) => prev.filter((r) => r.id !== deleteRole.id));
    toast.success(`Role "${deleteRole.name}" deleted`);
    setDeleteRoleId(null);
  }

  const isReadOnly = screen === "view";

  return (
    <div className="p-6 lg:p-10">
      <AnimatePresence mode="wait">
        {screen === "list" && (
          <motion.div
            key="list"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
            className="space-y-8"
          >
            <header className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
              <div>
                <h2 className="text-2xl font-bold tracking-tight text-foreground">Roles & Permissions</h2>
                <p className="text-muted-foreground text-sm mt-1">
                  Manage access levels and permissions for your organization
                </p>
              </div>
              <Button onClick={openCreate}>
                <Plus className="w-4 h-4 mr-2" />
                Create Custom Role
              </Button>
            </header>

            <div className="space-y-3">
              <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">System Roles</p>
              <div className="space-y-3">
                {systemRoles.map((role) => (
                  <RoleCard
                    key={role.id}
                    role={role}
                    onView={() => openView(role)}
                    onEdit={() => openEdit(role)}
                    onDuplicate={() => handleDuplicate(role)}
                    onDelete={() => setDeleteRoleId(role.id)}
                    onAssign={() => openAssign(role)}
                    menuOpen={openMenuRoleId === role.id}
                    onToggleMenu={() => setOpenMenuRoleId((prev) => (prev === role.id ? null : role.id))}
                  />
                ))}
              </div>
            </div>

            <div className="space-y-3">
              <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Custom Roles</p>
              {customRoles.length === 0 ? (
                <Card>
                  <CardContent className="p-8 text-center text-muted-foreground text-sm">
                    No custom roles yet. Create one to tailor permissions for your organization.
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-3">
                  {customRoles.map((role) => (
                    <RoleCard
                      key={role.id}
                      role={role}
                      onView={() => openView(role)}
                      onEdit={() => openEdit(role)}
                      onDuplicate={() => handleDuplicate(role)}
                      onDelete={() => setDeleteRoleId(role.id)}
                      onAssign={() => openAssign(role)}
                      menuOpen={openMenuRoleId === role.id}
                      onToggleMenu={() => setOpenMenuRoleId((prev) => (prev === role.id ? null : role.id))}
                    />
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        )}

        {(screen === "builder" || screen === "view") && (
          <motion.div
            key="builder"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
            className="space-y-6"
          >
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="icon" aria-label="Back to roles list" onClick={() => setScreen("list")}>
                <ArrowLeft className="w-4 h-4" />
              </Button>
              <h2 className="text-xl font-bold tracking-tight text-foreground">
                {screen === "view"
                  ? `View Role: ${activeRole?.name ?? ""}`
                  : builderMode === "create"
                  ? "Create Custom Role"
                  : `Edit Role: ${activeRole?.name ?? ""}`}
              </h2>
            </div>

            {screen === "view" && activeRole?.isSystem && (
              <div className="flex items-start gap-3 rounded-lg border border-blue-200 bg-blue-50 p-4 text-sm text-blue-900">
                <Info className="w-4 h-4 mt-0.5 shrink-0" />
                <p>System roles cannot be edited. You can duplicate this role to create a custom version.</p>
              </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Left column */}
              <div className="lg:col-span-4 space-y-6">
                <Card>
                  <CardContent className="p-4 space-y-4">
                    <div className="space-y-1.5">
                      <Label htmlFor="role-name">Role Name</Label>
                      <Input
                        id="role-name"
                        value={formName}
                        maxLength={50}
                        disabled={isReadOnly}
                        placeholder="e.g. Senior Mentor"
                        onChange={(e) => setFormName(e.target.value)}
                        aria-invalid={!!formErrors.name}
                      />
                      <div className="flex items-center justify-between">
                        {formErrors.name ? (
                          <p className="text-xs text-destructive">{formErrors.name}</p>
                        ) : (
                          <span />
                        )}
                        <p className="text-xs text-muted-foreground">{formName.length}/50</p>
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="role-description">Role Description</Label>
                      <Textarea
                        id="role-description"
                        value={formDescription}
                        maxLength={200}
                        disabled={isReadOnly}
                        placeholder="Briefly describe what this role can do"
                        onChange={(e) => setFormDescription(e.target.value)}
                        rows={3}
                      />
                      <p className="text-xs text-muted-foreground text-right">{formDescription.length}/200</p>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4 space-y-3">
                    <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                      Permission Summary
                    </p>
                    <div className="space-y-2">
                      {PERMISSION_GROUP_META.map((group) => {
                        const count =
                          group.key === "groupD"
                            ? countGroupD(formPermissions.groupD)
                            : countGroup(formPermissions[group.key]);
                        return (
                          <div key={group.key} className="flex items-center justify-between text-sm">
                            <span className="text-foreground">{group.title}</span>
                            <Badge variant="outline">
                              {count}/{group.perms.length}
                            </Badge>
                          </div>
                        );
                      })}
                    </div>
                    <Separator />
                    <div className="flex items-center justify-between text-sm font-semibold">
                      <span>Total enabled</span>
                      <span>{totalEnabled(formPermissions)}</span>
                    </div>
                    {formErrors.permissions && (
                      <p className="text-xs text-destructive">{formErrors.permissions}</p>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Right column */}
              <div className="lg:col-span-8 space-y-4">
                <h3 className="text-sm font-bold uppercase tracking-widest text-muted-foreground">
                  Permission Catalog
                </h3>

                {PERMISSION_GROUP_META.map((group) => {
                  const expanded = expandedGroups[group.key];
                  const count =
                    group.key === "groupD"
                      ? countGroupD(formPermissions.groupD)
                      : countGroup(formPermissions[group.key]);
                  return (
                    <Card key={group.key} className="overflow-hidden">
                      <button
                        type="button"
                        onClick={() => toggleExpand(group.key)}
                        aria-expanded={expanded}
                        className="w-full flex items-center justify-between gap-3 p-4 text-left hover:bg-accent/50 transition-colors"
                      >
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-foreground">{group.title}</span>
                          <Badge variant="outline">
                            {count}/{group.perms.length}
                          </Badge>
                        </div>
                        <ChevronDown
                          className={cn("w-4 h-4 text-muted-foreground transition-transform", expanded && "rotate-180")}
                        />
                      </button>
                      <AnimatePresence initial={false}>
                        {expanded && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            className="overflow-hidden"
                          >
                            <div className="px-4 pb-2 divide-y divide-border border-t">
                              {group.key === "groupD"
                                ? GROUP_D_PERMS.map((perm) => (
                                    <ConversationPermissionRow
                                      key={perm.id}
                                      id={`perm-${perm.id}`}
                                      label={perm.label}
                                      value={formPermissions.groupD[perm.id]}
                                      disabled={isReadOnly}
                                      onToggle={(v) => toggleConversationPermission(perm.id, v)}
                                      onScopeChange={(scope) => setConversationScope(perm.id, scope)}
                                    />
                                  ))
                                : group.perms.map((perm) => (
                                    <PermissionToggleRow
                                      key={perm.id}
                                      id={`perm-${perm.id}`}
                                      label={perm.label}
                                      checked={formPermissions[group.key][perm.id]}
                                      disabled={isReadOnly}
                                      onChange={(v) => toggleSimplePermission(group.key, perm.id, v)}
                                    />
                                  ))}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </Card>
                  );
                })}
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              {screen === "view" ? (
                activeRole?.isSystem ? (
                  <Button onClick={() => activeRole && handleDuplicate(activeRole)}>
                    <Copy className="w-4 h-4 mr-2" />
                    Duplicate to Customize
                  </Button>
                ) : (
                  <Button onClick={() => activeRole && openEdit(activeRole)}>
                    <Pencil className="w-4 h-4 mr-2" />
                    Edit Role
                  </Button>
                )
              ) : (
                <>
                  <Button variant="outline" onClick={handleCancelBuilder}>
                    Cancel
                  </Button>
                  <Button onClick={handleSave}>Save Role</Button>
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* S4 — Assign Role Modal */}
      <AnimatePresence>
        {isAssignOpen && (
          <ModalShell onClose={() => setIsAssignOpen(false)} labelledBy="assign-role-title" maxWidth="max-w-xl">
            <div className="flex items-center justify-between p-5 border-b">
              <h3 id="assign-role-title" className="text-lg font-bold text-foreground">
                Assign Role
              </h3>
              <Button variant="ghost" size="icon" aria-label="Close" onClick={() => setIsAssignOpen(false)}>
                <X className="w-4 h-4" />
              </Button>
            </div>

            <div className="p-5 space-y-4">
              {assignContextRoleId && (
                <p className="text-sm text-muted-foreground">
                  Assigning access for role{" "}
                  <span className="font-semibold text-foreground">
                    {roles.find((r) => r.id === assignContextRoleId)?.name}
                  </span>
                </p>
              )}
              <div className="space-y-4 max-h-[50vh] overflow-y-auto pr-1">
                {members.map((member) => (
                  <div key={member.id} className="flex flex-col sm:flex-row sm:items-center gap-3 pb-4 border-b last:border-b-0">
                    <div className="flex items-center gap-3 min-w-0 sm:w-56 shrink-0">
                      <Avatar className="size-9">
                        <AvatarFallback className="text-xs font-semibold">
                          {getInitials(member.name)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-foreground truncate">{member.name}</p>
                        <p className="text-xs text-muted-foreground truncate">{member.email}</p>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2" role="radiogroup" aria-label={`Role for ${member.name}`}>
                      {roles.map((role) => {
                        const checked = assignSelections[member.id] === role.id;
                        return (
                          <label
                            key={role.id}
                            className={cn(
                              "flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs cursor-pointer transition-colors",
                              checked
                                ? "bg-primary text-primary-foreground border-primary"
                                : "bg-background text-foreground hover:bg-accent"
                            )}
                          >
                            <input
                              type="radio"
                              className="sr-only"
                              name={`role-select-${member.id}`}
                              checked={checked}
                              onChange={() =>
                                setAssignSelections((prev) => ({ ...prev, [member.id]: role.id }))
                              }
                            />
                            {role.name}
                          </label>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 p-5 border-t">
              <Button variant="outline" onClick={() => setIsAssignOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleAssignSave}>Save</Button>
            </div>
          </ModalShell>
        )}
      </AnimatePresence>

      {/* S5 — Delete Role Modal */}
      <AnimatePresence>
        {deleteRole && (
          <ModalShell onClose={() => setDeleteRoleId(null)} labelledBy="delete-role-title" maxWidth="max-w-md">
            <div className="p-5 space-y-4">
              <div className="flex items-center gap-3">
                <div className="flex size-10 items-center justify-center rounded-full bg-destructive/10 text-destructive">
                  <Trash2 className="w-5 h-5" />
                </div>
                <h3 id="delete-role-title" className="text-lg font-bold text-foreground">
                  Delete Role
                </h3>
              </div>

              <p className="text-sm text-muted-foreground">
                Are you sure you want to delete the role &ldquo;{deleteRole.name}&rdquo;? This action cannot be
                undone.
              </p>

              {deleteRole.memberCount > 0 && (
                <div className="flex items-start gap-3 rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
                  <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
                  <p>
                    This role has {deleteRole.memberCount} members assigned. You must reassign them before
                    deleting.
                  </p>
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-3 p-5 border-t">
              <Button variant="outline" onClick={() => setDeleteRoleId(null)}>
                Cancel
              </Button>
              <Button
                variant="destructive"
                disabled={deleteRole.memberCount > 0}
                onClick={handleDeleteConfirm}
              >
                Delete Role
              </Button>
            </div>
          </ModalShell>
        )}
      </AnimatePresence>
    </div>
  );
};
