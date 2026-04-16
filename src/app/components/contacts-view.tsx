import React, { useMemo, useState } from "react";
import {
  Search, Plus, Download, Upload, SlidersHorizontal,
  Trash2, Edit2, MessageSquare, ChevronRight, MoreVertical,
  UserPlus, AlertTriangle, Eye, IdCard,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { toast } from "sonner";
import { cn, type Contact, type Group, type Role } from "./types";
import { SubscriptionUsageBanner, Modal } from "./shared-ui";
import { Button } from "./ui/button";
import { FilterDropdown } from "./discipleship-views";

interface ContactsViewProps {
  contacts: Contact[];
  groups: Group[];
  usage: number;
  limit: number;
  currentUserRole: Role;
  onAddContact: () => void;
  onImportContacts: () => void;
  onExportContacts: () => void;
  onDeleteContact: (id: string) => void;
  onEditContact: (contact: Contact) => void;
  onMessage: (id: string) => void;
  onViewContact: (contact: Contact) => void;
  onUpgradePlan: () => void;
}

// Collect all unique tags across the contacts list for the Tag filter
const getAllTags = (contacts: Contact[]): string[] => {
  const set = new Set<string>();
  contacts.forEach(c => (c.tags || []).forEach(t => set.add(t)));
  return Array.from(set).sort();
};

// Soft pastel palette for tag badges — each tag keeps a stable color.
const TAG_PALETTE = [
  "bg-violet-50 text-violet-700 ring-1 ring-inset ring-violet-200",
  "bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-200",
  "bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-200",
  "bg-pink-50 text-pink-700 ring-1 ring-inset ring-pink-200",
  "bg-teal-50 text-teal-700 ring-1 ring-inset ring-teal-200",
  "bg-sky-50 text-sky-700 ring-1 ring-inset ring-sky-200",
  "bg-rose-50 text-rose-700 ring-1 ring-inset ring-rose-200",
  "bg-orange-50 text-orange-700 ring-1 ring-inset ring-orange-200",
] as const;

function tagColor(tag: string): string {
  let h = 0;
  for (let i = 0; i < tag.length; i++) h = (h * 31 + tag.charCodeAt(i)) >>> 0;
  return TAG_PALETTE[h % TAG_PALETTE.length];
}

const GROUP_BADGE_CLASS =
  "bg-blue-50 text-blue-700 ring-1 ring-inset ring-blue-200";

export const ContactsView = ({
  contacts,
  groups,
  usage,
  limit,
  currentUserRole: _role,
  onAddContact,
  onImportContacts,
  onExportContacts,
  onDeleteContact,
  onEditContact,
  onMessage,
  onViewContact,
  onUpgradePlan,
}: ContactsViewProps) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [groupFilter, setGroupFilter] = useState("all");
  const [tagFilter, setTagFilter] = useState("all");
  const [sort, setSort] = useState("newest");
  const [pageSize, setPageSize] = useState(10);
  const [page, setPage] = useState(1);
  const [deleteConfirm, setDeleteConfirm] = useState<Contact | null>(null);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());

  // Filtered + sorted list
  const filteredContacts = useMemo(() => {
    const q = searchQuery.toLowerCase();
    let list = contacts.filter(c => {
      const matchesQuery =
        !q ||
        c.name.toLowerCase().includes(q) ||
        c.phone.includes(searchQuery) ||
        (c.email && c.email.toLowerCase().includes(q));
      const matchesGroup = groupFilter === "all" || (c.groupIds || []).includes(groupFilter);
      const matchesTag = tagFilter === "all" || (c.tags || []).includes(tagFilter);
      return matchesQuery && matchesGroup && matchesTag;
    });

    list = [...list].sort((a, b) => {
      const ta = new Date(a.createdAt).getTime();
      const tb = new Date(b.createdAt).getTime();
      if (sort === "oldest") return ta - tb;
      if (sort === "name_asc") return a.name.localeCompare(b.name);
      if (sort === "name_desc") return b.name.localeCompare(a.name);
      return tb - ta; // newest default
    });
    return list;
  }, [contacts, searchQuery, groupFilter, tagFilter, sort]);

  const allTags = useMemo(() => getAllTags(contacts), [contacts]);

  // Pagination
  const totalPages = Math.max(1, Math.ceil(filteredContacts.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const start = (currentPage - 1) * pageSize;
  const pageContacts = filteredContacts.slice(start, start + pageSize);
  const rangeStart = filteredContacts.length === 0 ? 0 : start + 1;
  const rangeEnd = Math.min(start + pageSize, filteredContacts.length);

  const handleDeleteConfirmed = () => {
    if (deleteConfirm) {
      onDeleteContact(deleteConfirm.id);
      toast.success(`"${deleteConfirm.name}" has been deleted.`);
      setDeleteConfirm(null);
    }
  };

  const getInitials = (name: string) =>
    name
      .split(" ")
      .map(p => p.charAt(0))
      .join("")
      .slice(0, 2)
      .toUpperCase();

  const toggleRowSelection = (id: string) => {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleAllOnPage = () => {
    const pageIds = pageContacts.map(c => c.id);
    const allOnPageSelected = pageIds.every(id => selected.has(id));
    setSelected(prev => {
      const next = new Set(prev);
      if (allOnPageSelected) {
        pageIds.forEach(id => next.delete(id));
      } else {
        pageIds.forEach(id => next.add(id));
      }
      return next;
    });
  };

  const allOnPageSelected = pageContacts.length > 0 && pageContacts.every(c => selected.has(c.id));

  return (
    <div className="p-6 lg:p-10 space-y-6 animate-in fade-in duration-500">
      {/* ---------- HEADER ---------- */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Contacts</h1>
          <p className="text-muted-foreground text-sm mt-0.5">View and manage your contacts</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Button variant="outline" size="sm" onClick={() => toast.info("Opening group manager...")}>
            <SlidersHorizontal className="w-3.5 h-3.5" />
            Manage Groups
          </Button>
          <Button variant="outline" size="sm" onClick={onExportContacts}>
            <Download className="w-3.5 h-3.5" />
            Export
          </Button>
          <Button variant="outline" size="sm" onClick={onImportContacts}>
            <Upload className="w-3.5 h-3.5" />
            Import
          </Button>
          <Button size="sm" onClick={onAddContact}>
            <Plus className="w-3.5 h-3.5" />
            Add Contact
          </Button>
        </div>
      </header>

      <SubscriptionUsageBanner usage={usage} limit={limit} onUpgrade={onUpgradePlan} />

      {/* ---------- TOOLBAR ---------- */}
      <div className="bg-card border border-border rounded-sm p-3 flex flex-col lg:flex-row lg:items-center gap-2.5">
        <div className="relative flex-1 min-w-0">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setPage(1);
            }}
            placeholder="Search Contact by name, phone or email..."
            className="w-full h-10 pl-10 pr-3 bg-background border border-input rounded-sm text-sm focus:outline-none focus:ring-2 focus:ring-ring transition-all"
          />
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <FilterDropdown
            label="All Groups"
            value={groupFilter}
            onChange={(v) => { setGroupFilter(v); setPage(1); }}
            options={[
              { value: "all", label: "All Groups" },
              ...groups.map(g => ({ value: g.id, label: g.name })),
            ]}
          />
          <FilterDropdown
            label="All Tags"
            value={tagFilter}
            onChange={(v) => { setTagFilter(v); setPage(1); }}
            options={[
              { value: "all", label: "All Tags" },
              ...allTags.map(t => ({ value: t, label: t })),
            ]}
          />
          <FilterDropdown
            label="Newest first"
            value={sort}
            onChange={(v) => { setSort(v); setPage(1); }}
            options={[
              { value: "newest",    label: "Newest first" },
              { value: "oldest",    label: "Oldest first" },
              { value: "name_asc",  label: "Name A → Z" },
              { value: "name_desc", label: "Name Z → A" },
            ]}
          />
        </div>
      </div>

      {/* ---------- EMPTY STATE / TABLE ---------- */}
      {filteredContacts.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24">
          {/* Dark gradient card */}
          <div className="relative w-[260px] h-[170px] rounded-sm overflow-hidden shadow-[0_24px_60px_-28px_rgba(15,23,42,0.45)]">
            <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-800 to-teal-800" />
            <div
              className="absolute inset-0 opacity-[0.18] pointer-events-none"
              style={{
                backgroundImage:
                  "radial-gradient(circle at 20% 30%, rgba(255,255,255,0.25) 0, transparent 45%), radial-gradient(circle at 80% 70%, rgba(45,212,191,0.35) 0, transparent 50%)",
              }}
            />
            <div
              className="absolute inset-0 opacity-[0.35] mix-blend-overlay pointer-events-none"
              style={{
                backgroundImage:
                  "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='140' height='140'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 0.35 0'/></filter><rect width='100%' height='100%' filter='url(%23n)'/></svg>\")",
              }}
            />
            <div className="relative z-10 flex flex-col items-center justify-center h-full gap-3">
              <div className="w-10 h-10 bg-white rounded-sm flex items-center justify-center shadow-md">
                <IdCard className="w-4 h-4 text-blue-600" />
              </div>
              <p className="text-sm font-semibold text-white">No contacts yet</p>
            </div>
          </div>

          <p className="text-sm text-muted-foreground mt-5 text-center max-w-sm">
            {searchQuery || groupFilter !== "all" || tagFilter !== "all"
              ? `No contacts match the current filters. Try clearing them to see everyone.`
              : `Add your first contact manually or import them from a CSV/Excel file to start messaging.`}
          </p>

          <div className="flex items-center gap-2 mt-5">
            {searchQuery || groupFilter !== "all" || tagFilter !== "all" ? (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setSearchQuery("");
                  setGroupFilter("all");
                  setTagFilter("all");
                }}
              >
                Clear filters
              </Button>
            ) : (
              <>
                <Button size="sm" onClick={onAddContact}>
                  <Plus className="w-3.5 h-3.5" />
                  Add Contact
                </Button>
                <Button variant="outline" size="sm" onClick={onImportContacts}>
                  <Upload className="w-3.5 h-3.5" />
                  Import Contact
                </Button>
              </>
            )}
          </div>
        </div>
      ) : (
        <div className="bg-card border border-border rounded-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-border">
                  <th className="pl-4 pr-2 py-3 w-10">
                    <input
                      type="checkbox"
                      checked={allOnPageSelected}
                      onChange={toggleAllOnPage}
                      className="w-3.5 h-3.5 rounded-sm border-input cursor-pointer"
                      aria-label="Select all contacts on this page"
                    />
                  </th>
                  <th className="px-4 py-3 text-sm font-semibold text-muted-foreground">Name</th>
                  <th className="px-4 py-3 text-sm font-semibold text-muted-foreground">Phone Number</th>
                  <th className="px-4 py-3 text-sm font-semibold text-muted-foreground">Groups &amp; Tags</th>
                  <th className="px-4 py-3 text-sm font-semibold text-muted-foreground text-right w-24">Actions</th>
                </tr>
              </thead>
              <tbody>
                {pageContacts.map((contact) => (
                  <tr key={contact.id} className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors">
                    <td className="pl-4 pr-2 py-3">
                      <input
                        type="checkbox"
                        checked={selected.has(contact.id)}
                        onChange={() => toggleRowSelection(contact.id)}
                        className="w-3.5 h-3.5 rounded-sm border-input cursor-pointer"
                        aria-label={`Select ${contact.name}`}
                      />
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => onViewContact(contact)}
                        className="flex items-center gap-3 text-left group/row"
                      >
                        <div className="w-9 h-9 rounded-full bg-muted border border-border flex items-center justify-center text-xs font-semibold text-muted-foreground shrink-0">
                          {getInitials(contact.name)}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-foreground leading-tight group-hover/row:text-primary transition-colors">{contact.name}</p>
                          <p className="text-xs text-muted-foreground mt-0.5 truncate">{contact.email || "—"}</p>
                        </div>
                      </button>
                    </td>
                    <td className="px-4 py-3 text-sm text-muted-foreground tabular-nums">
                      {contact.phone}
                    </td>
                    <td className="px-4 py-3">
                      {(() => {
                        const groupItems = (contact.groupIds || [])
                          .map(gid => groups.find(x => x.id === gid))
                          .filter((g): g is Group => Boolean(g));
                        const tagItems = contact.tags || [];
                        const total = groupItems.length + tagItems.length;
                        if (total === 0) {
                          return <span className="text-sm text-muted-foreground">—</span>;
                        }
                        const visibleGroups = groupItems.slice(0, 2);
                        const visibleTags = tagItems.slice(0, 3);
                        const hidden = total - visibleGroups.length - visibleTags.length;
                        return (
                          <div className="flex flex-wrap items-center gap-1.5">
                            {visibleGroups.map(g => (
                              <span
                                key={g.id}
                                className={cn(
                                  "inline-flex items-center gap-1 px-2 py-0.5 rounded-sm text-[11px] font-semibold",
                                  GROUP_BADGE_CLASS,
                                )}
                              >
                                <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                                {g.name}
                              </span>
                            ))}
                            {visibleTags.map(tag => (
                              <span
                                key={tag}
                                className={cn(
                                  "inline-flex items-center px-2 py-0.5 rounded-sm text-[11px] font-medium",
                                  tagColor(tag),
                                )}
                              >
                                #{tag}
                              </span>
                            ))}
                            {hidden > 0 && (
                              <span className="text-[11px] font-semibold text-muted-foreground">+{hidden}</span>
                            )}
                          </div>
                        );
                      })()}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="inline-flex items-center gap-0.5">
                        <button
                          onClick={() => onViewContact(contact)}
                          className="p-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-sm transition-all"
                          aria-label={`View ${contact.name}`}
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <div className="relative">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setOpenMenuId(openMenuId === contact.id ? null : contact.id);
                            }}
                            className="p-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-sm transition-all"
                            aria-label={`Actions for ${contact.name}`}
                          >
                            <MoreVertical className="w-4 h-4" />
                          </button>
                          <AnimatePresence>
                            {openMenuId === contact.id && (
                              <>
                                <div className="fixed inset-0 z-40" onClick={() => setOpenMenuId(null)} />
                                <motion.div
                                  initial={{ opacity: 0, scale: 0.95, y: -4 }}
                                  animate={{ opacity: 1, scale: 1, y: 0 }}
                                  exit={{ opacity: 0, scale: 0.95, y: -4 }}
                                  transition={{ duration: 0.12 }}
                                  className="absolute right-0 top-full mt-1 bg-popover border border-border rounded-sm shadow-lg z-50 py-1 w-44"
                                >
                                  <button
                                    onClick={() => { onMessage(contact.id); setOpenMenuId(null); }}
                                    className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-foreground hover:bg-muted transition-colors text-left"
                                  >
                                    <MessageSquare className="w-3.5 h-3.5 text-muted-foreground" />
                                    Send Message
                                  </button>
                                  <button
                                    onClick={() => { onViewContact(contact); setOpenMenuId(null); }}
                                    className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-foreground hover:bg-muted transition-colors text-left"
                                  >
                                    <ChevronRight className="w-3.5 h-3.5 text-muted-foreground" />
                                    View Details
                                  </button>
                                  <button
                                    onClick={() => { onEditContact(contact); setOpenMenuId(null); }}
                                    className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-foreground hover:bg-muted transition-colors text-left"
                                  >
                                    <Edit2 className="w-3.5 h-3.5 text-muted-foreground" />
                                    Edit Contact
                                  </button>
                                  <div className="h-px bg-border mx-2 my-1" />
                                  <button
                                    onClick={() => { setDeleteConfirm(contact); setOpenMenuId(null); }}
                                    className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-destructive hover:bg-destructive/5 transition-colors text-left"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                    Delete Contact
                                  </button>
                                </motion.div>
                              </>
                            )}
                          </AnimatePresence>
                        </div>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* ---------- PAGINATION ---------- */}
          <div className="px-4 py-3 border-t border-border flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span>Show</span>
              <select
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value));
                  setPage(1);
                }}
                className="h-8 px-2 bg-background border border-input rounded-sm text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              >
                {[10, 25, 50, 100].map(n => (
                  <option key={n} value={n}>{n}</option>
                ))}
              </select>
            </div>

            <p className="text-sm text-muted-foreground">
              Showing {rangeStart} to {rangeEnd} entries
            </p>

            <div className="flex items-center gap-1">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="h-8 px-3 text-sm rounded-sm transition-colors disabled:opacity-40 disabled:cursor-not-allowed text-muted-foreground hover:bg-muted"
              >
                Previous
              </button>
              {Array.from({ length: totalPages }).map((_, i) => {
                const p = i + 1;
                const active = p === currentPage;
                return (
                  <button
                    key={p}
                    onClick={() => setPage(p)}
                    className={cn(
                      "h-8 min-w-8 px-2 text-sm font-semibold rounded-sm transition-colors",
                      active
                        ? "bg-primary text-primary-foreground"
                        : "text-muted-foreground hover:bg-muted"
                    )}
                  >
                    {p}
                  </button>
                );
              })}
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="h-8 px-3 text-sm rounded-sm transition-colors disabled:opacity-40 disabled:cursor-not-allowed text-muted-foreground hover:bg-muted"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ---------- DELETE CONFIRM ---------- */}
      <Modal isOpen={!!deleteConfirm} onClose={() => setDeleteConfirm(null)} title="Delete Contact" size="sm">
        <div className="space-y-4">
          <div className="flex items-start gap-3 p-3 bg-destructive/5 border border-destructive/20 rounded-sm">
            <AlertTriangle className="w-5 h-5 text-destructive shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-foreground">This action cannot be undone.</p>
              <p className="text-xs text-muted-foreground mt-1">
                Are you sure you want to permanently delete <span className="font-bold text-foreground">{deleteConfirm?.name}</span>?
                All associated messages and notes will be preserved but unlinked.
              </p>
            </div>
          </div>
          <div className="flex items-center justify-end gap-2">
            <Button variant="outline" size="sm" onClick={() => setDeleteConfirm(null)}>
              Cancel
            </Button>
            <Button variant="destructive" size="sm" onClick={handleDeleteConfirmed}>
              <Trash2 className="w-3.5 h-3.5" />
              Delete
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
