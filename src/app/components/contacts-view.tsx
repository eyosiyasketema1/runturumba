import React, { useState } from "react";
import { 
  Users, Search, Plus, Download, ArrowRight, Settings2, 
  Trash2, Edit2, MessageSquare, Tag, ChevronRight, MoreVertical,
  Filter, Database, AlertTriangle, UserPlus, X
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { toast } from "sonner";
import { cn, type Contact, type Group, type Role } from "./types";
import { SubscriptionUsageBanner, Modal } from "./shared-ui";
import { Button } from "./ui/button";

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

export const ContactsView = ({
  contacts,
  groups,
  usage,
  limit,
  currentUserRole,
  onAddContact,
  onImportContacts,
  onExportContacts,
  onDeleteContact,
  onEditContact,
  onMessage,
  onViewContact,
  onUpgradePlan
}: ContactsViewProps) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [deleteConfirm, setDeleteConfirm] = useState<Contact | null>(null);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const isAdminOrAgent = ["admin", "agent"].includes(currentUserRole);

  const filteredContacts = contacts.filter(c => 
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.phone.includes(searchQuery) ||
    (c.email && c.email.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const handleDeleteConfirmed = () => {
    if (deleteConfirm) {
      onDeleteContact(deleteConfirm.id);
      toast.success(`"${deleteConfirm.name}" has been deleted.`);
      setDeleteConfirm(null);
    }
  };

  return (
    <div className="p-6 lg:p-10 space-y-8 animate-in fade-in duration-500">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Contacts</h1>
          <p className="text-muted-foreground text-sm">Manage your contacts and their distribution groups.</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" onClick={onExportContacts} className="hidden sm:flex">
            <Download className="w-4 h-4 mr-1.5" />
            Export
          </Button>
          <Button variant="outline" size="sm" onClick={onImportContacts} className="hidden sm:flex">
            <ArrowRight className="w-4 h-4 mr-1.5 rotate-[-90deg]" />
            Import
          </Button>
          <Button size="sm" onClick={onAddContact}>
            <Plus className="w-4 h-4 mr-1.5" />
            Add Contact
          </Button>
        </div>
      </header>

      <SubscriptionUsageBanner usage={usage} limit={limit} onUpgrade={onUpgradePlan} />

      <div className="flex flex-col md:flex-row items-center gap-4">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by name, phone or email..."
            className="w-full pl-10 pr-4 py-2.5 bg-muted/30 border border-input rounded-md text-sm focus:ring-1 focus:ring-ring outline-none transition-all shadow-sm"
          />
        </div>
      </div>

      <div className="bg-card rounded-lg border border-border shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-muted/50 border-b border-border">
                <th className="px-6 py-3 text-[11px] font-bold text-muted-foreground uppercase tracking-widest">Contact</th>
                <th className="px-6 py-3 text-[11px] font-bold text-muted-foreground uppercase tracking-widest">Phone Number</th>
                <th className="px-6 py-3 text-[11px] font-bold text-muted-foreground uppercase tracking-widest hidden lg:table-cell">Groups & Tags</th>
                <th className="px-6 py-3 text-[11px] font-bold text-muted-foreground uppercase tracking-widest hidden md:table-cell">Created</th>
                <th className="px-6 py-3 text-[11px] font-bold text-muted-foreground uppercase tracking-widest w-14 text-right">
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50">
              {filteredContacts.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-16 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-14 h-14 bg-muted rounded-xl flex items-center justify-center border border-border">
                        {searchQuery ? <Search className="w-6 h-6 text-muted-foreground/40" /> : <UserPlus className="w-6 h-6 text-muted-foreground/40" />}
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm font-semibold text-foreground">
                          {searchQuery ? "No contacts found" : "No contacts yet"}
                        </p>
                        <p className="text-xs text-muted-foreground max-w-xs mx-auto">
                          {searchQuery 
                            ? `No results for "${searchQuery}". Try a different search term.`
                            : "Get started by adding your first contact or importing from a CSV file."
                          }
                        </p>
                      </div>
                      {searchQuery ? (
                        <Button variant="outline" size="sm" onClick={() => setSearchQuery("")}>
                          Clear Search
                        </Button>
                      ) : (
                        <div className="flex items-center gap-2">
                          <Button size="sm" onClick={onAddContact}>
                            <Plus className="w-3.5 h-3.5 mr-1" />
                            Add Contact
                          </Button>
                          <Button variant="outline" size="sm" onClick={onImportContacts}>
                            Import CSV
                          </Button>
                        </div>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                filteredContacts.map((contact) => (
                  <tr key={contact.id} className="hover:bg-muted/30 transition-colors group">
                    <td className="px-6 py-4">
                      <button onClick={() => onViewContact(contact)} className="flex items-center gap-3 text-left">
                        <div className="w-9 h-9 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-xs font-bold text-primary shrink-0">
                          {contact.name.charAt(0)}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-bold text-foreground leading-tight group-hover:text-primary transition-all truncate">{contact.name}</p>
                          <p className="text-[11px] text-muted-foreground mt-0.5 truncate">{contact.email || "No email"}</p>
                        </div>
                      </button>
                    </td>
                    <td className="px-6 py-4 text-xs font-bold text-muted-foreground font-mono">
                      {contact.phone}
                    </td>
                    <td className="px-6 py-4 hidden lg:table-cell">
                      <div className="flex flex-wrap gap-1.5">
                        {contact.groupIds?.slice(0, 2).map(gid => (
                          <span key={gid} className="px-1.5 py-0.5 bg-blue-500/10 text-blue-700 text-[10px] font-bold rounded uppercase border border-blue-500/20">
                            {groups.find(g => g.id === gid)?.name || "Group"}
                          </span>
                        ))}
                        {contact.tags.slice(0, 2).map(tag => (
                          <span key={tag} className="px-1.5 py-0.5 bg-primary/5 text-primary text-[10px] font-bold rounded uppercase border border-primary/10">
                            {tag}
                          </span>
                        ))}
                        {(contact.tags.length > 2 || (contact.groupIds?.length || 0) > 2) && (
                          <span className="text-[10px] font-bold text-muted-foreground">+more</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-[11px] font-bold text-muted-foreground uppercase hidden md:table-cell">
                      {new Date(contact.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="relative">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setOpenMenuId(openMenuId === contact.id ? null : contact.id);
                          }}
                          className="p-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-md transition-all"
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
                                className="absolute right-0 top-full mt-1 bg-popover border border-border rounded-md shadow-lg z-50 py-1 w-44"
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
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {filteredContacts.length > 0 && (
          <div className="px-6 py-3 border-t border-border bg-muted/30 flex items-center justify-between">
            <p className="text-xs text-muted-foreground">
              Showing <span className="font-bold text-foreground">{filteredContacts.length}</span> of <span className="font-bold text-foreground">{contacts.length}</span> contacts
            </p>
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      <Modal isOpen={!!deleteConfirm} onClose={() => setDeleteConfirm(null)} title="Delete Contact" size="sm">
        <div className="space-y-4">
          <div className="flex items-start gap-3 p-3 bg-destructive/5 border border-destructive/20 rounded-md">
            <AlertTriangle className="w-5 h-5 text-destructive shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-foreground">This action cannot be undone.</p>
              <p className="text-xs text-muted-foreground mt-1">
                Are you sure you want to permanently delete <span className="font-bold text-foreground">{deleteConfirm?.name}</span>? All associated messages and notes will be preserved but unlinked.
              </p>
            </div>
          </div>
          <div className="flex items-center justify-end gap-2">
            <Button variant="outline" size="sm" onClick={() => setDeleteConfirm(null)}>
              Cancel
            </Button>
            <Button variant="destructive" size="sm" onClick={handleDeleteConfirmed}>
              <Trash2 className="w-3.5 h-3.5 mr-1.5" />
              Delete
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
