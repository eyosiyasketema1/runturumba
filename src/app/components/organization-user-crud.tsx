import React, { useState, useMemo } from "react";
import {
  User, Mail, Shield, Save, Plus, Trash2, Edit2,
  Check, X, Search,
  ShieldCheck, UserCheck, Eye, AlertTriangle,
  Clock, FileText,
  Copy, Users as UsersIcon, Layers, Lock,
  ChevronDown, Globe, MessageSquare
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { toast } from "sonner";
import {
  cn,
  type User as UserType, type Role, type Status, type TeamGroup,
  type AuditLogEntry, type UserTypeId, type RBACRole,
  USER_TYPES, RBAC_ROLES, formatTimeAgo
} from "./types";
import { Card, CardContent } from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Badge } from "./ui/badge";
import { Modal } from "./shared-ui";

// ── Helpers ───────────────────────────────────────────────────

function getUserTypeLabel(id?: UserTypeId): string {
  return USER_TYPES.find(ut => ut.id === id)?.label ?? "—";
}
function getRoleName(roleId?: string): string {
  return RBAC_ROLES.find(r => r.id === roleId)?.name ?? "—";
}
function getRoleObj(roleId?: string): RBACRole | undefined {
  return RBAC_ROLES.find(r => r.id === roleId);
}

const USER_TYPE_COLORS: Record<UserTypeId, string> = {
  "ut-volunteer":        "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
  "ut-volunteer-mgr":    "bg-sky-500/10 text-sky-600 border-sky-500/20",
  "ut-language-mgr":     "bg-violet-500/10 text-violet-600 border-violet-500/20",
  "ut-social-media-mgr": "bg-pink-500/10 text-pink-600 border-pink-500/20",
  "ut-executive":        "bg-amber-500/10 text-amber-600 border-amber-500/20",
  "ut-global-ops":       "bg-indigo-500/10 text-indigo-600 border-indigo-500/20",
  "ut-trainer":          "bg-orange-500/10 text-orange-600 border-orange-500/20",
};

// ── Audit Log Action Config ───────────────────────────────────

const ACTION_CONFIG: Record<string, { label: string; color: string; bgColor: string; icon: any }> = {
  "broadcast.sent":      { label: "Broadcast Sent",     color: "text-primary",            bgColor: "bg-primary/10",    icon: FileText },
  "broadcast.scheduled": { label: "Broadcast Scheduled", color: "text-amber-600",         bgColor: "bg-amber-50",      icon: Clock },
  "channel.configured":  { label: "Channel Configured", color: "text-sky-600",            bgColor: "bg-sky-50",        icon: ShieldCheck },
  "channel.disabled":    { label: "Channel Disabled",   color: "text-muted-foreground",   bgColor: "bg-muted",         icon: X },
  "contact.imported":    { label: "Contacts Imported",  color: "text-emerald-600",        bgColor: "bg-emerald-50",    icon: UsersIcon },
  "user.invited":        { label: "User Invited",       color: "text-blue-600",           bgColor: "bg-blue-50",       icon: Plus },
  "automation.created":  { label: "Automation Created", color: "text-purple-600",         bgColor: "bg-purple-50",     icon: ShieldCheck },
  "message.sent":        { label: "Message Sent",       color: "text-emerald-600",        bgColor: "bg-emerald-50",    icon: Mail },
  "role.assigned":       { label: "Role Assigned",      color: "text-indigo-600",         bgColor: "bg-indigo-50",     icon: Shield },
  "role.created":        { label: "Role Created",       color: "text-violet-600",         bgColor: "bg-violet-50",     icon: Layers },
};

// ── Filter Dropdown ───────────────────────────────────────────

const FilterDropdown = <T extends string>({ value, onChange, options, label }: {
  value: T;
  onChange: (v: T) => void;
  options: { id: T; label: string }[];
  label: string;
}) => {
  return (
    <div className="relative">
      <select
        value={value}
        onChange={e => onChange(e.target.value as T)}
        aria-label={label}
        className={cn(
          "appearance-none bg-transparent px-3 pr-8 py-2.5",
          "text-xs font-semibold text-foreground cursor-pointer",
          "focus:outline-none",
          "transition-all"
        )}
      >
        {options.map(o => (
          <option key={o.id} value={o.id}>{o.label}</option>
        ))}
      </select>
      <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
    </div>
  );
};

// ── UserTypeBadge ─────────────────────────────────────────────

const UserTypeBadge = ({ userTypeId }: { userTypeId?: UserTypeId }) => {
  if (!userTypeId) return <span className="text-xs text-muted-foreground">—</span>;
  return (
    <span className={cn(
      "inline-flex items-center gap-1 px-2 py-0.5 rounded-sm text-xs font-bold border uppercase tracking-wider",
      USER_TYPE_COLORS[userTypeId] ?? "bg-muted text-muted-foreground border-border"
    )}>
      {getUserTypeLabel(userTypeId)}
    </span>
  );
};

// ── RoleBadgeNew ──────────────────────────────────────────────

const RoleBadgeNew = ({ roleId }: { roleId?: string }) => {
  const role = getRoleObj(roleId);
  if (!role) return <span className="text-xs text-muted-foreground">—</span>;
  return (
    <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-foreground">
      {role.isSystem ? <Lock className="w-3 h-3 text-muted-foreground" /> : <Shield className="w-3 h-3 text-primary" />}
      {role.name}
    </span>
  );
};

// ── ScopeBadges ───────────────────────────────────────────────

const ScopeBadges = ({ scope }: { scope?: { language?: string; region?: string } }) => {
  if (!scope) return <span className="text-xs text-muted-foreground">—</span>;
  return (
    <div className="flex items-center gap-1.5 flex-wrap">
      {scope.language && (
        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 text-[10px] font-semibold bg-muted text-muted-foreground border border-border rounded-sm">
          <MessageSquare className="w-2.5 h-2.5" />{scope.language}
        </span>
      )}
      {scope.region && (
        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 text-[10px] font-semibold bg-muted text-muted-foreground border border-border rounded-sm">
          <Globe className="w-2.5 h-2.5" />{scope.region}
        </span>
      )}
    </div>
  );
};

// ============================================================
// Team Management (main export)
// ============================================================

export const TeamManagement = ({
  users,
  teamGroups = [],
  onAddUser,
  onUpdateUser,
  onDeleteUser,
  onAddTeamGroup,
  onUpdateTeamGroup,
  onDeleteTeamGroup,
  currentUserRole,
  auditLog = [],
}: {
  users: UserType[];
  teamGroups?: TeamGroup[];
  onAddUser: (user: Partial<UserType>) => void;
  onUpdateUser: (id: string, data: Partial<UserType>) => void;
  onDeleteUser: (id: string) => void;
  onAddTeamGroup?: (group: Partial<TeamGroup>) => void;
  onUpdateTeamGroup?: (id: string, data: Partial<TeamGroup>) => void;
  onDeleteTeamGroup?: (id: string) => void;
  currentUserRole: Role;
  auditLog?: AuditLogEntry[];
}) => {
  const [activeTab, setActiveTab] = useState<"members" | "audit">("members");
  const [isManagingGroups, setIsManagingGroups] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserType | null>(null);
  const [deleteConfirmUser, setDeleteConfirmUser] = useState<UserType | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [userTypeFilter, setUserTypeFilter] = useState<UserTypeId | "all">("all");
  const [statusFilter, setStatusFilter] = useState<Status | "all">("all");

  const isAdmin = currentUserRole === "executive" || currentUserRole === "global_ops" || currentUserRole === "coordinator";

  const filteredUsers = useMemo(() => {
    return users.filter(user => {
      const q = searchQuery.toLowerCase();
      const matchesSearch = !q || user.name.toLowerCase().includes(q) || user.email.toLowerCase().includes(q);
      const matchesType = userTypeFilter === "all" || user.userTypeId === userTypeFilter;
      const matchesStatus = statusFilter === "all" || user.status === statusFilter;
      return matchesSearch && matchesType && matchesStatus;
    });
  }, [users, searchQuery, userTypeFilter, statusFilter]);

  // Stats by User Type
  const statsByType = useMemo(() => {
    const counts: Record<string, number> = {};
    users.forEach(u => {
      const key = u.userTypeId || "unknown";
      counts[key] = (counts[key] || 0) + 1;
    });
    return counts;
  }, [users]);

  const activeCount = users.filter(u => u.status === "active").length;

  if (isManagingGroups) {
    return (
      <ManageGroups
        groups={teamGroups}
        users={users}
        onAddGroup={onAddTeamGroup!}
        onUpdateGroup={onUpdateTeamGroup!}
        onDeleteGroup={onDeleteTeamGroup!}
        onBack={() => setIsManagingGroups(false)}
      />
    );
  }

  return (
    <div className="p-6 lg:p-10 space-y-6 animate-in fade-in duration-500">
      {/* Header */}
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Team Management</h1>
          <p className="text-muted-foreground text-sm">Manage users, roles, scopes, and review activity.</p>
        </div>
        {isAdmin && activeTab === "members" && (
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => setIsManagingGroups(true)}>
              <UsersIcon className="w-4 h-4 mr-2" />
              Manage Groups
            </Button>
            <Button onClick={() => setIsAddModalOpen(true)}>
              <Mail className="w-4 h-4 mr-2" />
              Invite User
            </Button>
          </div>
        )}
      </header>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Total Users</p>
            <p className="text-2xl font-bold text-foreground mt-1">{users.length}</p>
            <p className="text-xs text-muted-foreground">{activeCount} active</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">User Types</p>
            <p className="text-2xl font-bold text-foreground mt-1">{Object.keys(statsByType).length}</p>
            <p className="text-xs text-muted-foreground">across organization</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Volunteers</p>
            <p className="text-2xl font-bold text-foreground mt-1">{statsByType["ut-volunteer"] || 0}</p>
            <p className="text-xs text-muted-foreground">Front-line agents</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Audit Events</p>
            <p className="text-2xl font-bold text-foreground mt-1">{auditLog.length}</p>
            <p className="text-xs text-muted-foreground">Tracked actions</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-muted border border-border w-fit" role="tablist" aria-label="Team management">
        <button
          role="tab"
          id="tab-members"
          aria-selected={activeTab === "members"}
          onClick={() => setActiveTab("members")}
          className={cn(
            "px-4 py-2 text-xs font-semibold transition-all flex items-center gap-2",
            activeTab === "members" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
          )}
        >
          <UsersIcon className="w-3.5 h-3.5" />
          Users
        </button>
        <button
          role="tab"
          id="tab-audit"
          aria-selected={activeTab === "audit"}
          onClick={() => setActiveTab("audit")}
          className={cn(
            "px-4 py-2 text-xs font-semibold transition-all flex items-center gap-2",
            activeTab === "audit" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
          )}
        >
          <FileText className="w-3.5 h-3.5" />
          Audit Log
        </button>
      </div>

      <AnimatePresence mode="wait">
        {activeTab === "members" ? (
          <motion.div key="members" role="tabpanel" aria-labelledby="tab-members" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            {/* Search + Filters bar */}
            <div className="flex items-center border border-border bg-card mb-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  placeholder="Search users..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  aria-label="Search users"
                  className="w-full bg-transparent pl-9 pr-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
                />
              </div>
              <div className="flex items-center border-l border-border">
                <FilterDropdown
                  value={userTypeFilter}
                  onChange={setUserTypeFilter}
                  label="User Type"
                  options={[
                    { id: "all" as any, label: "All types" },
                    ...USER_TYPES.map(ut => ({ id: ut.id as any, label: ut.label })),
                  ]}
                />
              </div>
              <div className="flex items-center border-l border-border">
                <FilterDropdown
                  value={statusFilter}
                  onChange={setStatusFilter}
                  label="Status"
                  options={[
                    { id: "all" as any, label: "All statuses" },
                    { id: "active" as any, label: "Active" },
                    { id: "pending" as any, label: "Pending" },
                  ]}
                />
              </div>
            </div>

            {/* User Table */}
            <Card>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-muted/30 border-b border-border">
                      <th className="px-4 py-3 text-xs font-black text-muted-foreground uppercase tracking-widest">User</th>
                      <th className="px-4 py-3 text-xs font-black text-muted-foreground uppercase tracking-widest">User Type</th>
                      <th className="px-4 py-3 text-xs font-black text-muted-foreground uppercase tracking-widest">Role</th>
                      <th className="px-4 py-3 text-xs font-black text-muted-foreground uppercase tracking-widest">Scope</th>
                      <th className="px-4 py-3 text-xs font-black text-muted-foreground uppercase tracking-widest">Status</th>
                      <th className="px-4 py-3 text-xs font-black text-muted-foreground uppercase tracking-widest">Joined</th>
                      <th className="px-4 py-3 text-xs font-black text-muted-foreground uppercase tracking-widest text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {filteredUsers.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="px-6 py-12 text-center">
                          <UsersIcon className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                          <p className="text-sm text-muted-foreground">No users match your filters.</p>
                        </td>
                      </tr>
                    ) : (
                      filteredUsers.map((user) => (
                        <tr key={user.id} className="hover:bg-muted/30 transition-colors group">
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-3">
                              <div className="w-9 h-9 rounded-full bg-muted border border-border flex items-center justify-center overflow-hidden shrink-0">
                                {user.avatar ? (
                                  <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
                                ) : (
                                  <User className="w-4 h-4 text-muted-foreground opacity-60" />
                                )}
                              </div>
                              <div className="flex flex-col min-w-0">
                                <span className="text-sm font-bold text-foreground truncate">{user.name}</span>
                                <span className="text-xs text-muted-foreground truncate">{user.email}</span>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3"><UserTypeBadge userTypeId={user.userTypeId} /></td>
                          <td className="px-4 py-3"><RoleBadgeNew roleId={user.roleId} /></td>
                          <td className="px-4 py-3"><ScopeBadges scope={user.scope} /></td>
                          <td className="px-4 py-3">
                            <span className={cn(
                              "inline-flex items-center gap-1.5 px-2 py-0.5 rounded-sm text-xs font-bold border uppercase tracking-widest",
                              user.status === "active"
                                ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
                                : "bg-amber-500/10 text-amber-600 border-amber-500/20"
                            )}>
                              <div className={cn("w-1.5 h-1.5 rounded-full", user.status === "active" ? "bg-emerald-500" : "bg-amber-500")} />
                              {user.status}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <span className="text-xs text-muted-foreground">
                              {user.joinedAt ? new Date(user.joinedAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "—"}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-right">
                            <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity">
                              {isAdmin && (
                                <>
                                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => setSelectedUser(user)}>
                                    <Edit2 className="w-3.5 h-3.5 text-muted-foreground" />
                                  </Button>
                                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => setDeleteConfirmUser(user)}>
                                    <Trash2 className="w-3.5 h-3.5 text-muted-foreground" />
                                  </Button>
                                </>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </Card>
          </motion.div>
        ) : (
          <motion.div key="audit" role="tabpanel" aria-labelledby="tab-audit" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <AuditLogTab auditLog={auditLog} searchQuery={searchQuery} setSearchQuery={setSearchQuery} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modals */}
      <Modal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} title="Invite User" size="2xl">
        <AddUserForm
          onAdd={(data) => { onAddUser(data); setIsAddModalOpen(false); }}
          onCancel={() => setIsAddModalOpen(false)}
        />
      </Modal>

      {selectedUser && (
        <Modal isOpen={!!selectedUser} onClose={() => setSelectedUser(null)} title="Edit User">
          <EditUserForm
            user={selectedUser}
            onUpdate={(data) => { onUpdateUser(selectedUser.id, data); setSelectedUser(null); }}
            onCancel={() => setSelectedUser(null)}
          />
        </Modal>
      )}

      <DeleteMemberConfirm
        isOpen={!!deleteConfirmUser}
        userName={deleteConfirmUser?.name || ""}
        onClose={() => setDeleteConfirmUser(null)}
        onConfirm={() => {
          if (deleteConfirmUser) {
            onDeleteUser(deleteConfirmUser.id);
            toast.success(`${deleteConfirmUser.name} removed from organization`);
          }
          setDeleteConfirmUser(null);
        }}
      />
    </div>
  );
};

// ============================================================
// Manage Groups (unchanged structure)
// ============================================================

const ManageGroups = ({
  groups, users, onAddGroup, onUpdateGroup, onDeleteGroup, onBack
}: {
  groups: TeamGroup[]; users: UserType[];
  onAddGroup: (g: Partial<TeamGroup>) => void;
  onUpdateGroup: (id: string, data: Partial<TeamGroup>) => void;
  onDeleteGroup: (id: string) => void;
  onBack: () => void;
}) => {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingGroup, setEditingGroup] = useState<TeamGroup | null>(null);

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-3">
            <button onClick={onBack} className="text-muted-foreground hover:text-foreground transition-colors">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6"><path d="m15 18-6-6 6-6"/></svg>
            </button>
            Groups
          </h1>
          <p className="text-muted-foreground text-sm pl-9">Organize users into groups for routing conversations.</p>
        </div>
        <Button onClick={() => { setEditingGroup(null); setIsFormOpen(true); }}>
          <Plus className="w-4 h-4 mr-2" />
          Create Group
        </Button>
      </header>

      {groups.length === 0 ? (
        <Card className="p-12 text-center flex flex-col items-center">
          <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
            <UsersIcon className="w-8 h-8 text-primary" />
          </div>
          <h3 className="text-xl font-bold text-foreground mb-2">No groups yet</h3>
          <p className="text-muted-foreground text-sm max-w-sm mb-6">Create groups to organize agents and route conversations.</p>
          <Button onClick={() => { setEditingGroup(null); setIsFormOpen(true); }}>Create Group</Button>
        </Card>
      ) : (
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-muted/50 text-muted-foreground text-xs uppercase tracking-wider">
                <tr>
                  <th className="px-6 py-4 font-semibold">Group Name</th>
                  <th className="px-6 py-4 font-semibold">Label</th>
                  <th className="px-6 py-4 font-semibold">Members</th>
                  <th className="px-6 py-4 font-semibold">Created</th>
                  <th className="px-6 py-4 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {groups.map(group => {
                  const groupUsers = users.filter(u => group.userIds.includes(u.id));
                  return (
                    <tr key={group.id} className="hover:bg-muted/20 transition-colors">
                      <td className="px-6 py-4 font-medium text-foreground">{group.name}</td>
                      <td className="px-6 py-4">
                        <Badge variant="outline" className="text-xs font-semibold tracking-wide bg-background text-muted-foreground">{group.label}</Badge>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex -space-x-2">
                          {groupUsers.slice(0, 3).map(u => (
                            <div key={u.id} className="w-7 h-7 rounded-full bg-primary/20 border-2 border-background flex items-center justify-center text-xs font-bold text-primary overflow-hidden" title={u.name}>
                              {u.avatar ? <img src={u.avatar} alt={u.name} className="w-full h-full object-cover" /> : u.name.charAt(0)}
                            </div>
                          ))}
                          {groupUsers.length > 3 && (
                            <div className="w-7 h-7 rounded-full bg-muted border-2 border-background flex items-center justify-center text-xs font-bold text-muted-foreground">+{groupUsers.length - 3}</div>
                          )}
                          {groupUsers.length === 0 && <span className="text-muted-foreground text-xs italic ml-2">No members</span>}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-muted-foreground">{new Date(group.createdAt).toLocaleDateString()}</td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground" onClick={() => { setEditingGroup(group); setIsFormOpen(true); }}>
                            <Edit2 className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive" onClick={() => onDeleteGroup(group.id)}>
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {isFormOpen && (
        <GroupFormModal
          group={editingGroup}
          users={users}
          onClose={() => setIsFormOpen(false)}
          onSave={(data) => {
            if (editingGroup) onUpdateGroup(editingGroup.id, data);
            else onAddGroup(data);
            setIsFormOpen(false);
          }}
        />
      )}
    </div>
  );
};

// ── GroupFormModal ─────────────────────────────────────────────

const GroupFormModal = ({ group, users, onClose, onSave }: {
  group: TeamGroup | null; users: UserType[]; onClose: () => void; onSave: (data: Partial<TeamGroup>) => void;
}) => {
  const [name, setName] = useState(group?.name || "");
  const [label, setLabel] = useState(group?.label || "");
  const [description, setDescription] = useState(group?.description || "");
  const [userIds, setUserIds] = useState<string[]>(group?.userIds || []);

  const toggleUser = (id: string) => setUserIds(prev => prev.includes(id) ? prev.filter(uid => uid !== id) : [...prev, id]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <Card className="w-full max-w-md overflow-hidden border-border/50">
        <div className="p-5 border-b border-border flex items-center justify-between bg-muted/30">
          <h3 className="font-bold text-lg text-foreground">{group ? "Edit Group" : "Create Group"}</h3>
          <Button variant="ghost" size="icon" onClick={onClose} className="rounded-full"><X className="w-4 h-4 text-muted-foreground" /></Button>
        </div>
        <div className="p-6 space-y-5">
          <div className="space-y-2">
            <Label className="text-xs font-semibold">Group Name <span className="text-destructive">*</span></Label>
            <Input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. VIP Telegram Support" className="h-9" />
          </div>
          <div className="space-y-2">
            <Label className="text-xs font-semibold">Label / Tag <span className="text-destructive">*</span></Label>
            <Input value={label} onChange={e => setLabel(e.target.value)} placeholder="e.g. VIP, Sales" className="h-9" />
          </div>
          <div className="space-y-2">
            <Label className="text-xs font-semibold">Description (optional)</Label>
            <Input value={description} onChange={e => setDescription(e.target.value)} placeholder="Short description" className="h-9" />
          </div>
          <div className="space-y-3">
            <Label className="text-xs font-semibold flex items-center justify-between">
              <span>Add Users</span>
              <span className="text-muted-foreground font-normal">{userIds.length} selected</span>
            </Label>
            <div className="border border-border rounded-sm max-h-48 overflow-y-auto p-2 space-y-1 bg-muted/10">
              {users.map(u => (
                <div key={u.id} className="flex items-center gap-3 p-2 hover:bg-muted/50 rounded-sm cursor-pointer transition-colors" onClick={() => toggleUser(u.id)}>
                  <div className={cn("w-4 h-4 rounded border flex items-center justify-center", userIds.includes(u.id) ? "bg-primary border-primary text-primary-foreground" : "border-input bg-background")}>
                    {userIds.includes(u.id) && <Check className="w-3 h-3" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{u.name}</p>
                    <p className="text-xs text-muted-foreground truncate">{u.email}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className="p-4 border-t border-border flex justify-end gap-2 bg-muted/30">
          <Button variant="outline" onClick={onClose} className="h-9">Cancel</Button>
          <Button onClick={() => {
            if (!name || !label) { toast.error("Name and Label are required."); return; }
            onSave({ name, label, description, userIds });
          }} className="h-9">{group ? "Save Changes" : "Create Group"}</Button>
        </div>
      </Card>
    </div>
  );
};

// ============================================================
// Audit Log Tab
// ============================================================

const AuditLogTab = ({ auditLog, searchQuery, setSearchQuery }: { auditLog: AuditLogEntry[]; searchQuery: string; setSearchQuery: (q: string) => void }) => {
  const [actionFilter, setActionFilter] = useState<string>("all");

  const actionTypes = useMemo(() => {
    const types = new Set(auditLog.map(e => e.action));
    return Array.from(types).sort();
  }, [auditLog]);

  const filtered = useMemo(() => {
    return auditLog
      .filter(entry => {
        const q = searchQuery.toLowerCase();
        const matchesSearch = !q ||
          entry.userName.toLowerCase().includes(q) ||
          entry.action.toLowerCase().includes(q) ||
          entry.target.toLowerCase().includes(q) ||
          entry.details.toLowerCase().includes(q);
        const matchesAction = actionFilter === "all" || entry.action === actionFilter;
        return matchesSearch && matchesAction;
      })
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [auditLog, searchQuery, actionFilter]);

  return (
    <div className="space-y-4">
      {/* Search + Filters bar */}
      <div className="flex items-center border border-border bg-card">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            placeholder="Search audit log..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            aria-label="Search audit log"
            className="w-full bg-transparent pl-9 pr-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
          />
        </div>
        <div className="flex items-center border-l border-border">
          <FilterDropdown
            value={actionFilter}
            onChange={setActionFilter}
            label="Action Type"
            options={[
              { id: "all", label: "All actions" },
              ...actionTypes.map(at => ({ id: at, label: ACTION_CONFIG[at]?.label || at })),
            ]}
          />
        </div>
      </div>

      <Card>
        <div className="divide-y divide-border">
          {filtered.length === 0 ? (
            <div className="p-12 text-center">
              <FileText className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">No audit entries match your filters.</p>
            </div>
          ) : (
            filtered.map((entry) => {
              const cfg = ACTION_CONFIG[entry.action] || { label: entry.action, color: "text-muted-foreground", bgColor: "bg-muted", icon: FileText };
              const ActionIcon = cfg.icon;
              return (
                <div key={entry.id} className="flex items-start gap-4 px-5 py-4 hover:bg-muted/20 transition-colors">
                  <div className={cn("w-9 h-9 flex items-center justify-center shrink-0 mt-0.5 border", cfg.bgColor)}>
                    <ActionIcon className={cn("w-4 h-4", cfg.color)} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-semibold text-foreground">{entry.userName}</span>
                      <span className="text-xs text-muted-foreground">&middot;</span>
                      <Badge variant="outline" className={cn("text-xs", cfg.color)}>{cfg.label}</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      <span className="font-medium text-foreground">{entry.target}</span> &mdash; {entry.details}
                    </p>
                  </div>
                  <span className="text-xs text-muted-foreground shrink-0 mt-1">{formatTimeAgo(entry.createdAt)}</span>
                </div>
              );
            })
          )}
        </div>
      </Card>
    </div>
  );
};

// ============================================================
// Delete Member Confirmation
// ============================================================

const DeleteMemberConfirm = ({ isOpen, userName, onClose, onConfirm }: {
  isOpen: boolean; userName: string; onClose: () => void; onConfirm: () => void;
}) => (
  <Modal isOpen={isOpen} onClose={onClose} title="Remove User" size="sm">
    <div className="space-y-4">
      <div className="p-3 bg-destructive/5 border border-destructive/20">
        <p className="text-xs text-destructive font-medium">
          <AlertTriangle className="w-3.5 h-3.5 inline mr-1 -mt-0.5" />
          This action cannot be undone.
        </p>
      </div>
      <p className="text-sm text-muted-foreground">
        Are you sure you want to remove <strong className="text-foreground">{userName}</strong> from your organization? They will lose access immediately.
      </p>
      <div className="flex justify-end gap-2">
        <Button variant="outline" size="sm" onClick={onClose}>Cancel</Button>
        <Button variant="destructive" size="sm" onClick={onConfirm}>
          <Trash2 className="w-3.5 h-3.5 mr-1.5" />
          Remove User
        </Button>
      </div>
    </div>
  </Modal>
);

// ============================================================
// Add User Form — User Type → Role picker
// ============================================================

const AddUserForm = ({ onAdd, onCancel }: { onAdd: (data: Partial<UserType>) => void; onCancel: () => void }) => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [userTypeId, setUserTypeId] = useState<UserTypeId>("ut-volunteer");
  const [roleId, setRoleId] = useState("role-std-volunteer");
  const [language, setLanguage] = useState("");
  const [region, setRegion] = useState("");

  // Filter roles for chosen user type
  const availableRoles = useMemo(() => RBAC_ROLES.filter(r => r.userTypeId === userTypeId), [userTypeId]);

  // When user type changes, auto-select the system role for that type
  const handleUserTypeChange = (id: UserTypeId) => {
    setUserTypeId(id);
    const systemRole = RBAC_ROLES.find(r => r.userTypeId === id && r.isSystem);
    setRoleId(systemRole?.id ?? "");
  };

  // Map UserTypeId to the old Role type for backward compat
  const legacyRole = (utId: UserTypeId): Role => {
    const map: Record<UserTypeId, Role> = {
      "ut-volunteer": "volunteer", "ut-volunteer-mgr": "reviewer", "ut-language-mgr": "coordinator",
      "ut-social-media-mgr": "coordinator", "ut-executive": "executive", "ut-global-ops": "global_ops", "ut-trainer": "trainer",
    };
    return map[utId];
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) { toast.error("Email is required."); return; }
    onAdd({
      name: name || email.split("@")[0], email, role: legacyRole(userTypeId), status: "pending",
      userTypeId, roleId,
      scope: { language: language || undefined, region: region || undefined },
      joinedAt: new Date().toISOString().split("T")[0],
    });
    toast.success("Invitation sent to " + email);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="space-y-2">
        <Label className="text-xs font-semibold">Email <span className="text-destructive">*</span></Label>
        <Input autoFocus type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="abebe@gcm.org" className="h-9 text-sm" />
      </div>
      <div className="space-y-2">
        <Label className="text-xs font-semibold">Full Name <span className="text-muted-foreground font-normal">(optional)</span></Label>
        <Input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Abebe Kebede" className="h-9 text-sm" />
      </div>

      {/* User Type Picker */}
      <div className="space-y-2">
        <Label className="text-xs font-semibold flex items-center gap-1.5">
          <Layers className="w-3 h-3" />User Type
        </Label>
        <div className="grid grid-cols-3 gap-2">
          {USER_TYPES.map(ut => (
            <button
              key={ut.id}
              type="button"
              onClick={() => handleUserTypeChange(ut.id)}
              className={cn(
                "p-2.5 text-left border transition-all rounded-sm",
                userTypeId === ut.id
                  ? "border-primary bg-primary/5"
                  : "border-border hover:border-primary/30"
              )}
            >
              <span className="text-xs font-bold text-foreground block">{ut.label}</span>
              <span className="text-[10px] text-muted-foreground leading-tight block mt-0.5">{ut.description}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Role Picker (filtered by User Type) */}
      <div className="space-y-2">
        <Label className="text-xs font-semibold flex items-center gap-1.5">
          <Shield className="w-3 h-3" />Role
        </Label>
        <div className="space-y-1.5">
          {availableRoles.map(r => (
            <button
              key={r.id}
              type="button"
              onClick={() => setRoleId(r.id)}
              className={cn(
                "w-full flex items-center gap-2 p-2.5 border rounded-sm text-left transition-all",
                roleId === r.id
                  ? "border-primary bg-primary/5"
                  : "border-border hover:border-primary/30"
              )}
            >
              {r.isSystem ? <Lock className="w-3.5 h-3.5 text-muted-foreground shrink-0" /> : <Shield className="w-3.5 h-3.5 text-primary shrink-0" />}
              <span className="text-xs font-semibold text-foreground">{r.name}</span>
              {r.isSystem && <span className="text-[10px] text-muted-foreground ml-auto">System</span>}
            </button>
          ))}
        </div>
      </div>

      {/* Scope */}
      <div className="space-y-2">
        <Label className="text-xs font-semibold flex items-center gap-1.5">
          <Globe className="w-3 h-3" />Scope (optional)
        </Label>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <Label className="text-[10px] text-muted-foreground">Language</Label>
            <Input value={language} onChange={e => setLanguage(e.target.value)} placeholder="e.g. Amharic" className="h-8 text-xs" />
          </div>
          <div className="space-y-1">
            <Label className="text-[10px] text-muted-foreground">Region</Label>
            <Input value={region} onChange={e => setRegion(e.target.value)} placeholder="e.g. Addis Ababa" className="h-8 text-xs" />
          </div>
        </div>
      </div>

      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="outline" size="sm" onClick={onCancel}>Cancel</Button>
        <Button type="submit" size="sm">
          <Mail className="w-3.5 h-3.5 mr-1.5" />Invite User
        </Button>
      </div>
    </form>
  );
};

// ============================================================
// Edit User Form — User Type → Role + Scope
// ============================================================

const EditUserForm = ({ user, onUpdate, onCancel }: {
  user: UserType; onUpdate: (data: Partial<UserType>) => void; onCancel: () => void;
}) => {
  const [name, setName] = useState(user.name);
  const [userTypeId, setUserTypeId] = useState<UserTypeId>(user.userTypeId ?? "ut-volunteer");
  const [roleId, setRoleId] = useState(user.roleId ?? "");
  const [status, setStatus] = useState<Status>(user.status);
  const [language, setLanguage] = useState(user.scope?.language ?? "");
  const [region, setRegion] = useState(user.scope?.region ?? "");

  const availableRoles = useMemo(() => RBAC_ROLES.filter(r => r.userTypeId === userTypeId), [userTypeId]);

  const handleUserTypeChange = (id: UserTypeId) => {
    setUserTypeId(id);
    const systemRole = RBAC_ROLES.find(r => r.userTypeId === id && r.isSystem);
    setRoleId(systemRole?.id ?? "");
  };

  const legacyRole = (utId: UserTypeId): Role => {
    const map: Record<UserTypeId, Role> = {
      "ut-volunteer": "volunteer", "ut-volunteer-mgr": "reviewer", "ut-language-mgr": "coordinator",
      "ut-social-media-mgr": "coordinator", "ut-executive": "executive", "ut-global-ops": "global_ops", "ut-trainer": "trainer",
    };
    return map[utId];
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdate({
      name, status, role: legacyRole(userTypeId),
      userTypeId, roleId,
      scope: { language: language || undefined, region: region || undefined },
    });
    toast.success("User updated");
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* User info header */}
      <div className="flex items-center gap-4 p-4 bg-muted/30 border">
        <div className="w-12 h-12 rounded-full bg-muted border border-border flex items-center justify-center overflow-hidden shrink-0">
          {user.avatar ? <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" /> : <User className="w-6 h-6 text-muted-foreground opacity-60" />}
        </div>
        <div>
          <p className="text-sm font-bold text-foreground">{user.name}</p>
          <p className="text-xs text-muted-foreground">{user.email}</p>
        </div>
      </div>

      <div className="space-y-2">
        <Label className="text-xs font-semibold">Full Name</Label>
        <Input value={name} onChange={e => setName(e.target.value)} className="h-9 text-sm" />
      </div>

      {/* User Type */}
      <div className="space-y-2">
        <Label className="text-xs font-semibold flex items-center gap-1.5">
          <Layers className="w-3 h-3" />User Type
        </Label>
        <div className="grid grid-cols-2 gap-2">
          {USER_TYPES.map(ut => (
            <button
              key={ut.id}
              type="button"
              onClick={() => handleUserTypeChange(ut.id)}
              className={cn(
                "p-2 text-left border transition-all rounded-sm",
                userTypeId === ut.id ? "border-primary bg-primary/5" : "border-border hover:border-primary/30"
              )}
            >
              <span className="text-xs font-bold text-foreground block">{ut.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Role */}
      <div className="space-y-2">
        <Label className="text-xs font-semibold flex items-center gap-1.5"><Shield className="w-3 h-3" />Role</Label>
        <div className="space-y-1.5">
          {availableRoles.map(r => (
            <button
              key={r.id} type="button" onClick={() => setRoleId(r.id)}
              className={cn(
                "w-full flex items-center gap-2 p-2.5 border rounded-sm text-left transition-all",
                roleId === r.id ? "border-primary bg-primary/5" : "border-border hover:border-primary/30"
              )}
            >
              {r.isSystem ? <Lock className="w-3.5 h-3.5 text-muted-foreground shrink-0" /> : <Shield className="w-3.5 h-3.5 text-primary shrink-0" />}
              <span className="text-xs font-semibold text-foreground">{r.name}</span>
              {r.isSystem && <span className="text-[10px] text-muted-foreground ml-auto">System</span>}
            </button>
          ))}
        </div>
      </div>

      {/* Scope */}
      <div className="space-y-2">
        <Label className="text-xs font-semibold flex items-center gap-1.5"><Globe className="w-3 h-3" />Scope</Label>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <Label className="text-[10px] text-muted-foreground">Language</Label>
            <Input value={language} onChange={e => setLanguage(e.target.value)} placeholder="e.g. Amharic" className="h-8 text-xs" />
          </div>
          <div className="space-y-1">
            <Label className="text-[10px] text-muted-foreground">Region</Label>
            <Input value={region} onChange={e => setRegion(e.target.value)} placeholder="e.g. Addis Ababa" className="h-8 text-xs" />
          </div>
        </div>
      </div>

      {/* Status */}
      <div className="space-y-2">
        <Label className="text-xs font-semibold">Access Status</Label>
        <div className="flex gap-4">
          {(["active", "pending"] as Status[]).map(s => (
            <label key={s} className="flex items-center gap-2 cursor-pointer">
              <input type="radio" name="status" checked={status === s} onChange={() => setStatus(s)} className="accent-primary" />
              <span className="text-xs font-semibold text-muted-foreground capitalize">{s === "pending" ? "Deactivated" : s}</span>
            </label>
          ))}
        </div>
      </div>

      <div className="flex justify-end gap-2 pt-2 border-t">
        <Button type="button" variant="outline" size="sm" onClick={onCancel}>Cancel</Button>
        <Button type="submit" size="sm">
          <Save className="w-3.5 h-3.5 mr-1.5" />Update User
        </Button>
      </div>
    </form>
  );
};
