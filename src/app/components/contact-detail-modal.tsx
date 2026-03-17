import React, { useState } from "react";
import {
  X, Phone, Mail, Send, Edit2, Trash2, Plus,
  MessageSquare, Database, Hash, StickyNote, Calendar, Info
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import {
  cn,
  type Contact, type Group, type Message, type ContactNote, type User
} from "./types";

export const ContactDetailModal = ({
  isOpen,
  onClose,
  contact,
  groups,
  messages,
  notes,
  users,
  onAddNote,
  onDeleteNote,
  onMessage,
  onEdit,
  onDelete
}: any) => {
  const [newNote, setNewNote] = useState("");
  const [showAllMessages, setShowAllMessages] = useState(false);

  if (!isOpen || !contact) return null;

  const contactGroups = groups.filter(g => contact.groupIds.includes(g.id));
  const contactMessages = messages
    .filter((m: any) => m.contactId === contact.id)
    .sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  const contactNotes = notes
    .filter((n: any) => n.contactId === contact.id)
    .sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  const displayMessages = showAllMessages ? contactMessages : contactMessages.slice(0, 5);

  const handleAddNote = () => {
    if (!newNote.trim()) return;
    onAddNote(newNote.trim());
    setNewNote("");
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="absolute inset-0 bg-black/60 backdrop-blur-[2px]" />
      <motion.div
        initial={{ opacity: 0, scale: 0.98, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.98, y: 10 }}
        className="relative bg-background rounded-lg shadow-xl border border-border w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]"
      >
        {/* Header Section */}
        <div className="p-8 border-b border-border bg-muted/20 relative">
          <button onClick={onClose} className="absolute top-4 right-4 p-2 text-muted-foreground hover:text-foreground rounded-md transition-colors">
            <X className="w-4 h-4" />
          </button>
          
          <div className="flex flex-col md:flex-row md:items-center gap-6">
            <div className="w-20 h-20 rounded-2xl bg-primary text-primary-foreground flex items-center justify-center text-3xl font-bold shadow-lg shadow-primary/20">
              {contact.name.charAt(0)}
            </div>
            <div className="space-y-3 flex-1">
              <div className="space-y-1">
                <h2 className="text-2xl font-bold tracking-tight text-foreground leading-none">{contact.name}</h2>
                <div className="flex flex-wrap gap-x-4 gap-y-1">
                  <span className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                    <Phone className="w-3.5 h-3.5" />
                    {contact.phone}
                  </span>
                  {contact.email && (
                    <span className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                      <Mail className="w-3.5 h-3.5" />
                      {contact.email}
                    </span>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => { onMessage(contact.id); onClose(); }} className="px-4 py-1.5 bg-primary text-primary-foreground rounded-md text-xs font-bold hover:bg-primary/90 transition-all shadow-sm flex items-center gap-2">
                  <Send className="w-3.5 h-3.5" /> Direct Message
                </button>
                <button onClick={() => { onEdit(contact); onClose(); }} className="px-4 py-1.5 bg-background border border-input rounded-md text-xs font-bold hover:bg-muted transition-all shadow-sm flex items-center gap-2">
                  <Edit2 className="w-3.5 h-3.5" /> Edit Profile
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar p-8 space-y-10">
          {/* Stats & Associations */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-4">
              <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest px-1">Audience Segments</label>
              <div className="flex flex-wrap gap-2">
                {contactGroups.map(g => (
                  <span key={g.id} className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-primary/5 text-primary text-[10px] font-bold rounded border border-primary/10 uppercase tracking-wider">
                    <Database className="w-3.5 h-3.5 opacity-60" />
                    {g.name}
                  </span>
                ))}
                {contact.tags.map(tag => (
                  <span key={tag} className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-muted text-muted-foreground text-[10px] font-bold rounded border border-border uppercase tracking-wider">
                    <Hash className="w-3.5 h-3.5 opacity-40" />
                    {tag}
                  </span>
                ))}
                {contactGroups.length === 0 && contact.tags.length === 0 && (
                  <span className="text-xs text-muted-foreground italic px-1">No segments assigned</span>
                )}
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-muted/30 rounded-lg border border-border">
                <p className="text-2xl font-bold tracking-tight text-foreground">{contactMessages.length}</p>
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Touchpoints</p>
              </div>
              <div className="p-4 bg-muted/30 rounded-lg border border-border">
                <p className="text-2xl font-bold tracking-tight text-foreground">{contactNotes.length}</p>
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Internal Notes</p>
              </div>
            </div>
          </div>

          {/* Notes Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between px-1">
              <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-2">
                <StickyNote className="w-3.5 h-3.5" /> Activity Log
              </h3>
            </div>
            <div className="flex gap-2">
              <input value={newNote} onChange={(e) => setNewNote(e.target.value)} placeholder="Type a note..." onKeyDown={(e) => e.key === "Enter" && handleAddNote()} className="flex-1 bg-background border border-input rounded-md px-3 py-2 text-sm focus:ring-1 focus:ring-ring outline-none" />
              <button onClick={handleAddNote} disabled={!newNote.trim()} className="bg-primary text-primary-foreground p-2 rounded-md hover:bg-primary/90 transition-all disabled:opacity-50"><Plus className="w-5 h-5" /></button>
            </div>
            <div className="space-y-2">
              {contactNotes.map(note => (
                <div key={note.id} className="p-4 bg-card border border-border rounded-lg shadow-sm group relative">
                  <p className="text-sm text-foreground leading-relaxed pr-8">{note.content}</p>
                  <div className="mt-3 flex items-center justify-between">
                    <span className="text-[10px] font-bold text-muted-foreground uppercase opacity-60">{new Date(note.createdAt).toLocaleDateString()}</span>
                    <button onClick={() => onDeleteNote(note.id)} className="p-1 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-all"><Trash2 className="w-3.5 h-3.5" /></button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Messages Preview */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-widest px-1 flex items-center gap-2">
              <MessageSquare className="w-3.5 h-3.5" /> Recent Messages
            </h3>
            <div className="space-y-1 border border-border rounded-lg overflow-hidden bg-muted/10">
              {displayMessages.map(msg => (
                <div key={msg.id} className="p-4 flex items-start gap-4 hover:bg-background transition-colors border-b border-border/50 last:border-0">
                  <div className={cn("w-2 h-2 rounded-full mt-1.5 shrink-0", msg.senderType === "user" ? "bg-primary" : "bg-emerald-500")} />
                  <div className="flex-1 space-y-1">
                    <p className="text-sm text-foreground leading-relaxed">{msg.content}</p>
                    <p className="text-[10px] font-bold text-muted-foreground uppercase opacity-60">{formatTimeAgo(msg.createdAt)} • {msg.senderType === "user" ? "Outgoing" : "Incoming"}</p>
                  </div>
                </div>
              ))}
              {contactMessages.length === 0 && (
                <p className="p-8 text-center text-xs text-muted-foreground italic">No message history available.</p>
              )}
            </div>
          </div>
        </div>

        <div className="p-4 border-t border-border bg-muted/10 flex justify-end gap-3">
          <button onClick={onClose} className="px-6 py-2 bg-background border border-input rounded-md text-xs font-bold uppercase tracking-widest hover:bg-muted transition-all">Close Details</button>
          <button onClick={() => { onDelete(contact.id); onClose(); }} className="px-6 py-2 text-destructive hover:bg-destructive/10 rounded-md text-xs font-bold uppercase tracking-widest transition-all">Delete Contact</button>
        </div>
      </motion.div>
    </div>
  );
};