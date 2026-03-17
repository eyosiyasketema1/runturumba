import React, { useState, useMemo } from "react";
import {
  User, Mail, Shield, Save, Plus, Trash2, Edit2,
  Check, X, Phone, Search,
  ShieldCheck, UserCheck, Eye, AlertTriangle,
  Clock, FileText, Filter, ArrowUp, ArrowDown,
  Copy, Users as UsersIcon
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { toast } from "sonner";
import {
  cn,
  type User as UserType, type Role, type Status, type TeamGroup,
  type AuditLogEntry, formatTimeAgo, copyToClipboard
} from "./types";
import { Card, CardContent } from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Badge } from "./ui/badge";
import { Separator } from "./ui/separator";
import { Switch } from "./ui/switch";
import { Modal, RoleBadge } from "./shared-ui";

// --- Audit Log Action Config ---
const ACTION_CONFIG: Record<string, { label: string; color: string; bgColor: string; icon: any }> = {
  "broadcast.sent": { label: "Broadcast Sent", color: "text-primary", bgColor: "bg-primary/10", icon: FileText },
  "broadcast.scheduled": { label: "Broadcast Scheduled", color: "text-amber-600", bgColor: "bg-amber-50", icon: Clock },
  "channel.configured": { label: "Channel Configured", color: "text-sky-600", bgColor: "bg-sky-50", icon: ShieldCheck },
  "channel.disabled": { label: "Channel Disabled", color: "text-muted-foreground", bgColor: "bg-muted", icon: X },
  "contact.imported": { label: "Contacts Imported", color: "text-emerald-600", bgColor: "bg-emerald-50", icon: UsersIcon },
  "user.invited": { label: "User Invited", color: "text-blue-600", bgColor: "bg-blue-50", icon: Plus },
  "automation.created": { label: "Automation Created", color: "text-purple-600", bgColor: "bg-purple-50", icon: ShieldCheck },
  "message.sent": { label: "Message Sent", color: "text-emerald-600", bgColor: "bg-emerald-50", icon: Mail },
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
  const [roleFilter, setRoleFilter] = useState<Role | "all">("all");
  const [statusFilter, setStatusFilter] = useState<Status | "all">("all");

  const isAdmin = currentUserRole === "admin";

  const filteredUsers = useMemo(() => {
    return users.filter(user => {
      const q = searchQuery.toLowerCase();
      const matchesSearch = !q || user.name.toLowerCase().includes(q) || user.email.toLowerCase().includes(q);
      const matchesRole = roleFilter === "all" || user.role === roleFilter;
      const matchesStatus = statusFilter === "all" || user.status === statusFilter;
      return matchesSearch && matchesRole && matchesStatus;
    });
  }, [users, searchQuery, roleFilter, statusFilter]);

  const adminCount = users.filter(u => u.role === "admin").length;
  const agentCount = users.filter(u => u.role === "agent").length;
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
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Team Management</h1>
          <p className="text-muted-foreground text-sm">Manage access, roles, and review activity for your organization.</p>
        </div>
        {isAdmin && activeTab === "members" && (
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => setIsManagingGroups(true)}>
              <UsersIcon className="w-4 h-4 mr-2" />
              Manage Groups
            </Button>
            <Button onClick={() => setIsAddModalOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Invite Member
            </Button>
          </div>
        )}
      </header>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Total Members", value: users.length, sub: `${activeCount} active` },
          { label: "Admins", value: adminCount, sub: "Full access" },
          { label: "Agents", value: agentCount, sub: "Messaging access" },
          { label: "Audit Events", value: auditLog.length, sub: "Tracked actions" },
        ].map(stat => (
          <Card key={stat.label}>
            <CardContent className="p-4">
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">{stat.label}</p>
              <p className="text-2xl font-bold text-foreground mt-1">{stat.value}</p>
              <p className="text-xs text-muted-foreground">{stat.sub}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex gap-1 p-1 bg-muted border border-border">
          <button
            onClick={() => setActiveTab("members")}
            className={cn(
              "px-4 py-2 text-xs font-semibold transition-all flex items-center gap-2",
              activeTab === "members" ? "bg-background text-foreground shadow-sm border border-border" : "text-muted-foreground hover:text-foreground"
            )}
          >
            <UsersIcon className="w-3.5 h-3.5" />
            Members
            <Badge variant="secondary" className="text-xs ml-1">{users.length}</Badge>
          </button>
          <button
            onClick={() => setActiveTab("audit")}
            className={cn(
              "px-4 py-2 text-xs font-semibold transition-all flex items-center gap-2",
              activeTab === "audit" ? "bg-background text-foreground shadow-sm border border-border" : "text-muted-foreground hover:text-foreground"
            )}
          >
            <FileText className="w-3.5 h-3.5" />
            Audit Log
            <Badge variant="secondary" className="text-xs ml-1">{auditLog.length}</Badge>
          </button>
        </div>
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder={activeTab === "members" ? "Search members..." : "Search audit log..."}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 h-9 text-sm"
          />
        </div>
      </div>

      <AnimatePresence mode="wait">
        {activeTab === "members" ? (
          <motion.div key="members" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            {/* Filters */}
            <div className="flex gap-3 mb-4 flex-wrap">
              <div className="flex gap-1 p-1 bg-muted border border-border">
                <FilterBtn active={roleFilter === "all"} onClick={() => setRoleFilter("all")}>All Roles</FilterBtn>
                <FilterBtn active={roleFilter === "admin"} onClick={() => setRoleFilter("admin")}>Admin</FilterBtn>
                <FilterBtn active={roleFilter === "agent"} onClick={() => setRoleFilter("agent")}>Agent</FilterBtn>
                <FilterBtn active={roleFilter === "viewer"} onClick={() => setRoleFilter("viewer")}>Viewer</FilterBtn>
              </div>
              <div className="flex gap-1 p-1 bg-muted border border-border">
                <FilterBtn active={statusFilter === "all"} onClick={() => setStatusFilter("all")}>All Status</FilterBtn>
                <FilterBtn active={statusFilter === "active"} onClick={() => setStatusFilter("active")}>Active</FilterBtn>
                <FilterBtn active={statusFilter === "pending"} onClick={() => setStatusFilter("pending")}>Pending</FilterBtn>
              </div>
            </div>

            {/* User Table */}
            <Card>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-muted/30 border-b border-border">
                      <th className="px-6 py-3 text-xs font-black text-muted-foreground uppercase tracking-widest">Member</th>
                      <th className="px-6 py-3 text-xs font-black text-muted-foreground uppercase tracking-widest">Role</th>
                      <th className="px-6 py-3 text-xs font-black text-muted-foreground uppercase tracking-widest">Status</th>
                      <th className="px-6 py-3 text-xs font-black text-muted-foreground uppercase tracking-widest">Joined</th>
                      <th className="px-6 py-3 text-xs font-black text-muted-foreground uppercase tracking-widest text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {filteredUsers.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="px-6 py-12 text-center">
                          <UsersIcon className="w-8 h-8 text-muted-foreground/30 mx-auto mb-2" />
                          <p className="text-sm text-muted-foreground">No members match your filters.</p>
                        </td>
                      </tr>
                    ) : (
                      filteredUsers.map((user) => (
                        <tr key={user.id} className="hover:bg-muted/30 transition-colors group">
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-full bg-muted border border-border flex items-center justify-center overflow-hidden shrink-0 shadow-sm">
                                {user.avatar ? (
                                  <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
                                ) : (
                                  <User className="w-5 h-5 text-muted-foreground opacity-60" />
                                )}
                              </div>
                              <div className="flex flex-col min-w-0">
                                <span className="text-sm font-bold text-foreground truncate">{user.name}</span>
                                <span className="text-xs text-muted-foreground truncate">{user.email}</span>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4"><RoleBadge role={user.role} /></td>
                          <td className="px-6 py-4">
                            <span className={cn(
                              "inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-bold border uppercase tracking-widest",
                              user.status === "active"
                                ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
                                : "bg-amber-500/10 text-amber-600 border-amber-500/20"
                            )}>
                              <div className={cn("w-1.5 h-1.5 rounded-full", user.status === "active" ? "bg-emerald-500" : "bg-amber-500")} />
                              {user.status}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <span className="text-xs text-muted-foreground">
                              {user.id === "user-1" ? "Jan 15, 2025" : user.id === "user-2" ? "Jan 20, 2025" : "Feb 1, 2025"}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
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
          <motion.div key="audit" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <AuditLogTab auditLog={auditLog} searchQuery={searchQuery} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modals */}
      <Modal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} title="Invite Team Member">
        <AddUserForm
          onAdd={(data) => { onAddUser(data); setIsAddModalOpen(false); }}
          onCancel={() => setIsAddModalOpen(false)}
        />
      </Modal>

      {selectedUser && (
        <Modal isOpen={!!selectedUser} onClose={() => setSelectedUser(null)} title="Update Member Settings">
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
// Filter Button
// ============================================================

const FilterBtn = ({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) => (
  <button
    onClick={onClick}
    className={cn(
      "px-2.5 py-1.5 text-xs font-semibold transition-all whitespace-nowrap",
      active ? "bg-background text-foreground shadow-sm border border-border" : "text-muted-foreground hover:text-foreground"
    )}
  >
    {children}
  </button>
);

// ============================================================
// Manage Groups Component
// ============================================================

const ManageGroups = ({
  groups,
  users,
  onAddGroup,
  onUpdateGroup,
  onDeleteGroup,
  onBack
}: {
  groups: TeamGroup[];
  users: UserType[];
  onAddGroup: (g: Partial<TeamGroup>) => void;
  onUpdateGroup: (id: string, data: Partial<TeamGroup>) => void;
  onDeleteGroup: (id: string) => void;
  onBack: () => void;
}) => {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingGroup, setEditingGroup] = useState<TeamGroup | null>(null);

  const handleOpenAdd = () => {
    setEditingGroup(null);
    setIsFormOpen(true);
  };

  const handleOpenEdit = (group: TeamGroup) => {
    setEditingGroup(group);
    setIsFormOpen(true);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-3">
            <button onClick={onBack} className="text-muted-foreground hover:text-foreground transition-colors">
              <Check className="w-5 h-5 hidden" /> {/* spacer */}
              <X className="w-5 h-5 hidden" />
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6"><path d="m15 18-6-6 6-6"/></svg>
            </button>
            Groups
          </h1>
          <p className="text-muted-foreground text-sm pl-9">Organize users into groups for routing conversations and managing responsibilities.</p>
        </div>
        <Button onClick={handleOpenAdd}>
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
          <p className="text-muted-foreground text-sm max-w-sm mb-6">
            Create groups to organize agents and route conversations more efficiently. Groups can be used for things like VIP support, sales teams, or channel-specific handling.
          </p>
          <Button onClick={handleOpenAdd}>Create Group</Button>
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
                  <th className="px-6 py-4 font-semibold">Created Date</th>
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
                            <div className="w-7 h-7 rounded-full bg-muted border-2 border-background flex items-center justify-center text-xs font-bold text-muted-foreground">
                              +{groupUsers.length - 3}
                            </div>
                          )}
                          {groupUsers.length === 0 && <span className="text-muted-foreground text-xs italic ml-2">No members</span>}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-muted-foreground">
                        {new Date(group.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground" onClick={() => handleOpenEdit(group)}>
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
            if (editingGroup) {
              onUpdateGroup(editingGroup.id, data);
            } else {
              onAddGroup(data);
            }
            setIsFormOpen(false);
          }}
        />
      )}
    </div>
  );
};

const GroupFormModal = ({
  group,
  users,
  onClose,
  onSave
}: {
  group: TeamGroup | null;
  users: UserType[];
  onClose: () => void;
  onSave: (data: Partial<TeamGroup>) => void;
}) => {
  const [name, setName] = useState(group?.name || "");
  const [label, setLabel] = useState(group?.label || "");
  const [description, setDescription] = useState(group?.description || "");
  const [userIds, setUserIds] = useState<string[]>(group?.userIds || []);

  const toggleUser = (id: string) => {
    setUserIds(prev => prev.includes(id) ? prev.filter(uid => uid !== id) : [...prev, id]);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <Card className="w-full max-w-md shadow-2xl overflow-hidden border-border/50">
        <div className="p-5 border-b border-border flex items-center justify-between bg-muted/30">
          <h3 className="font-bold text-lg text-foreground">{group ? "Edit Group" : "Create Group"}</h3>
          <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8 rounded-full">
            <X className="w-4 h-4 text-muted-foreground" />
          </Button>
        </div>
        <div className="p-6 space-y-5">
          <div className="space-y-2">
            <Label className="text-xs font-semibold">Group Name <span className="text-destructive">*</span></Label>
            <Input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. VIP Telegram Support" className="h-9" />
          </div>
          
          <div className="space-y-2">
            <Label className="text-xs font-semibold">Label / Tag <span className="text-destructive">*</span></Label>
            <Input value={label} onChange={e => setLabel(e.target.value)} placeholder="e.g. VIP, Sales, Support" className="h-9" />
            <p className="text-xs text-muted-foreground">Used to categorize the group internally.</p>
          </div>

          <div className="space-y-2">
            <Label className="text-xs font-semibold">Description (optional)</Label>
            <Input value={description} onChange={e => setDescription(e.target.value)} placeholder="e.g. Handles VIP customers" className="h-9" />
          </div>

          <div className="space-y-3">
            <Label className="text-xs font-semibold flex items-center justify-between">
              <span>Add Users / Agents</span>
              <span className="text-muted-foreground font-normal">{userIds.length} selected</span>
            </Label>
            <div className="border border-border rounded-md max-h-48 overflow-y-auto p-2 space-y-1 bg-muted/10">
              {users.map(u => (
                <div key={u.id} className="flex items-center gap-3 p-2 hover:bg-muted/50 rounded-md cursor-pointer transition-colors" onClick={() => toggleUser(u.id)}>
                  <div className={cn("w-4 h-4 rounded border flex items-center justify-center", userIds.includes(u.id) ? "bg-primary border-primary text-primary-foreground" : "border-input bg-background")}>
                    {userIds.includes(u.id) && <Check className="w-3 h-3" />}
                  </div>
                  <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center text-xs font-bold text-primary shrink-0 overflow-hidden">
                    {u.avatar ? <img src={u.avatar} alt={u.name} className="w-full h-full object-cover" /> : u.name.charAt(0)}
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
            if (!name || !label) {
              toast.error("Name and Label are required.");
              return;
            }
            onSave({ name, label, description, userIds });
          }} className="h-9">
            {group ? "Save Changes" : "Create Group"}
          </Button>
        </div>
      </Card>
    </div>
  );
};

// ============================================================
// Audit Log Tab
// ============================================================

const AuditLogTab = ({ auditLog, searchQuery }: { auditLog: AuditLogEntry[]; searchQuery: string }) => {
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
      {/* Action type filter */}
      <div className="flex gap-1 p-1 bg-muted border border-border overflow-x-auto">
        <FilterBtn active={actionFilter === "all"} onClick={() => setActionFilter("all")}>All Actions</FilterBtn>
        {actionTypes.map(at => {
          const cfg = ACTION_CONFIG[at];
          return (
            <FilterBtn key={at} active={actionFilter === at} onClick={() => setActionFilter(at)}>
              {cfg?.label || at}
            </FilterBtn>
          );
        })}
      </div>

      {/* Log entries */}
      <Card>
        <div className="divide-y divide-border">
          {filtered.length === 0 ? (
            <div className="p-12 text-center">
              <FileText className="w-8 h-8 text-muted-foreground/30 mx-auto mb-2" />
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
  <Modal isOpen={isOpen} onClose={onClose} title="Remove Team Member" size="sm">
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
          Remove Member
        </Button>
      </div>
    </div>
  </Modal>
);

// ============================================================
// Add User Form
// ============================================================

const AddUserForm = ({ onAdd, onCancel }: { onAdd: (data: Partial<UserType>) => void; onCancel: () => void }) => {
  const [formData, setFormData] = useState({ name: "", email: "", role: "agent" as Role });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.email) {
      toast.error("Please fill in all required fields");
      return;
    }
    onAdd({ ...formData, status: "pending" });
    toast.success("Invitation sent to " + formData.email);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="grid gap-2">
        <Label className="text-xs font-semibold">Full Name</Label>
        <Input autoFocus value={formData.name} onChange={e => setFormData(p => ({ ...p, name: e.target.value }))} placeholder="e.g. John Doe" className="h-9 text-sm" />
      </div>
      <div className="grid gap-2">
        <Label className="text-xs font-semibold">Email Address</Label>
        <Input type="email" value={formData.email} onChange={e => setFormData(p => ({ ...p, email: e.target.value }))} placeholder="john@example.com" className="h-9 text-sm" />
      </div>
      <div className="grid gap-2">
        <Label className="text-xs font-semibold">Organization Role</Label>
        <div className="grid grid-cols-3 gap-2 p-1 bg-muted border border-border">
          {(["admin", "agent", "viewer"] as Role[]).map(role => (
            <button
              key={role}
              type="button"
              onClick={() => setFormData(p => ({ ...p, role }))}
              className={cn(
                "py-2 text-xs font-bold uppercase tracking-widest transition-all",
                formData.role === role
                  ? "bg-background text-primary shadow-sm border border-border"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {role}
            </button>
          ))}
        </div>
        <p className="text-xs text-muted-foreground">
          {formData.role === "admin" && "Full access to all settings, billing, and data."}
          {formData.role === "agent" && "Can manage contacts, messages, and broadcasts."}
          {formData.role === "viewer" && "Read-only access to analytics and logs."}
        </p>
      </div>
      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="outline" size="sm" onClick={onCancel}>Cancel</Button>
        <Button type="submit" size="sm">Send Invite</Button>
      </div>
    </form>
  );
};

// ============================================================
// Edit User Form
// ============================================================

const EditUserForm = ({ user, onUpdate, onCancel }: {
  user: UserType; onUpdate: (data: Partial<UserType>) => void; onCancel: () => void;
}) => {
  const [formData, setFormData] = useState({ name: user.name, role: user.role, status: user.status });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdate(formData);
    toast.success("User settings updated");
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="flex items-center gap-4 p-4 bg-muted/30 border mb-2">
        <div className="w-12 h-12 rounded-full bg-muted border border-border flex items-center justify-center overflow-hidden shrink-0">
          {user.avatar ? (
            <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
          ) : (
            <User className="w-6 h-6 text-muted-foreground opacity-60" />
          )}
        </div>
        <div>
          <p className="text-sm font-bold text-foreground">{user.name}</p>
          <p className="text-xs text-muted-foreground">{user.email}</p>
        </div>
      </div>

      <div className="grid gap-2">
        <Label className="text-xs font-semibold">Full Name</Label>
        <Input value={formData.name} onChange={e => setFormData(p => ({ ...p, name: e.target.value }))} className="h-9 text-sm" />
      </div>

      <div className="grid gap-2">
        <Label className="text-xs font-semibold">Organization Role</Label>
        <div className="grid grid-cols-3 gap-2 p-1 bg-muted border border-border">
          {(["admin", "agent", "viewer"] as Role[]).map(role => (
            <button
              key={role}
              type="button"
              onClick={() => setFormData(p => ({ ...p, role }))}
              className={cn(
                "py-2 text-xs font-bold uppercase tracking-widest transition-all",
                formData.role === role
                  ? "bg-background text-primary shadow-sm border border-border"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {role}
            </button>
          ))}
        </div>
      </div>

      <div className="grid gap-2">
        <Label className="text-xs font-semibold">Access Status</Label>
        <div className="flex gap-4">
          {(["active", "pending"] as Status[]).map(s => (
            <label key={s} className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="status"
                checked={formData.status === s}
                onChange={() => setFormData(p => ({ ...p, status: s }))}
                className="accent-primary"
              />
              <span className="text-xs font-semibold text-muted-foreground capitalize">{s === "pending" ? "Deactivated" : s}</span>
            </label>
          ))}
        </div>
      </div>

      <div className="flex justify-end gap-2 pt-2 border-t">
        <Button type="button" variant="outline" size="sm" onClick={onCancel}>Cancel</Button>
        <Button type="submit" size="sm">
          <Save className="w-3.5 h-3.5 mr-1.5" />
          Update Member
        </Button>
      </div>
    </form>
  );
};