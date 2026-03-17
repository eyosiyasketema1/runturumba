import React, { useState } from "react";
import {
  FileText, Plus, Edit2, Copy, Trash2, Send, Check, Eye, X, Tag, ChevronRight, Search
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { toast } from "sonner";
import { cn } from "./types";
import {
  type MessageTemplate,
  TEMPLATE_PLACEHOLDERS,
  TEMPLATE_CATEGORIES,
} from "./message-data";

interface Contact {
  id: string;
  name: string;
  phone: string;
  email: string | null;
  tags: string[];
  groupIds: string[];
  tenantId: string;
  createdAt: string;
}

function resolveTemplate(content: string, contact?: Contact | null) {
  if (!contact) {
    return TEMPLATE_PLACEHOLDERS.reduce((str, p) => str.replaceAll(p.key, p.sample), content);
  }
  const nameParts = contact.name.split(" ");
  return content
    .replaceAll("{FIRST_NAME}", nameParts[0] || "")
    .replaceAll("{LAST_NAME}", nameParts.slice(1).join(" ") || "")
    .replaceAll("{FULL_NAME}", contact.name)
    .replaceAll("{PHONE}", contact.phone)
    .replaceAll("{EMAIL}", contact.email || "")
    .replaceAll("{COMPANY}", "Acme Corp")
    .replaceAll("{VERIFICATION_CODE}", "123456")
    .replaceAll("{ORDER_NUMBER}", "ORD-9999")
    .replaceAll("{DATE}", new Date().toLocaleDateString())
    .replaceAll("{AMOUNT}", "$99.99");
}

export function TemplatesTab({
  templates,
  filteredTemplates,
  templateCategory,
  setTemplateCategory,
  onCreateTemplate,
  onEditTemplate,
  onDeleteTemplate,
  onUseTemplate,
}: {
  templates: MessageTemplate[];
  filteredTemplates: MessageTemplate[];
  templateCategory: string;
  setTemplateCategory: (cat: string) => void;
  onCreateTemplate: (data: Omit<MessageTemplate, "id" | "createdAt" | "updatedAt" | "tenantId">) => void;
  onEditTemplate: (id: string, data: Partial<MessageTemplate>) => void;
  onDeleteTemplate: (id: string) => void;
  onUseTemplate: (content: string, name: string) => void;
}) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTmpl, setEditingTmpl] = useState<MessageTemplate | null>(null);
  const [form, setForm] = useState({ name: "", content: "", category: "Onboarding" });

  const openCreate = () => {
    setEditingTmpl(null);
    setForm({ name: "", content: "", category: "Onboarding" });
    setIsModalOpen(true);
  };

  const openEdit = (tmpl: MessageTemplate) => {
    setEditingTmpl(tmpl);
    setForm({ name: tmpl.name, content: tmpl.content, category: tmpl.category });
    setIsModalOpen(true);
  };

  const handleSave = () => {
    if (!form.name.trim() || !form.content.trim()) return;
    if (editingTmpl) onEditTemplate(editingTmpl.id, { ...form });
    else onCreateTemplate(form);
    setIsModalOpen(false);
    toast.success(editingTmpl ? "Template updated" : "Template created");
  };

  return (
    <div className="flex-1 bg-background overflow-y-auto custom-scrollbar animate-in fade-in duration-500">
      <div className="p-6 lg:p-10 max-w-7xl mx-auto space-y-10">
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <h2 className="text-2xl font-bold tracking-tight text-foreground">Message Library</h2>
            <p className="text-muted-foreground text-sm">Standardize and personalize your communication with reusable templates.</p>
          </div>
          <button
            onClick={openCreate}
            className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm font-bold shadow-sm hover:bg-primary/90 transition-all uppercase tracking-widest"
          >
            <Plus className="w-4 h-4" />
            New Template
          </button>
        </header>

        {/* Category Filter */}
        <div className="flex items-center gap-2 flex-wrap border-b border-border pb-6">
          <button
            onClick={() => setTemplateCategory("all")}
            className={cn(
              "px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider transition-all border",
              templateCategory === "all" ? "bg-primary text-primary-foreground border-primary shadow-md" : "bg-muted text-muted-foreground border-border hover:border-primary/30"
            )}
          >
            All Categories ({templates.length})
          </button>
          {TEMPLATE_CATEGORIES.map(cat => {
            const count = templates.filter(t => t.category === cat).length;
            if (count === 0) return null;
            return (
              <button
                key={cat}
                onClick={() => setTemplateCategory(cat)}
                className={cn(
                  "px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider transition-all border",
                  templateCategory === cat ? "bg-primary text-primary-foreground border-primary shadow-md" : "bg-muted text-muted-foreground border-border hover:border-primary/30"
                )}
              >
                {cat} ({count})
              </button>
            );
          })}
        </div>

        {/* Template Grid */}
        {filteredTemplates.length === 0 ? (
          <div className="py-24 text-center border-2 border-dashed border-border rounded-lg bg-muted/20 space-y-6">
            <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto border border-border">
              <FileText className="w-8 h-8 text-muted-foreground opacity-40" />
            </div>
            <div className="space-y-2">
              <p className="text-foreground font-bold">No templates found</p>
              <p className="text-muted-foreground text-sm max-w-[280px] mx-auto">Try selecting a different category or create a new template to get started.</p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredTemplates.map(tmpl => {
              const preview = resolveTemplate(tmpl.content);
              const placeholders = tmpl.content.match(/\{[A-Z_]+\}/g) || [];
              return (
                <div key={tmpl.id} className="flex flex-col bg-card border border-border rounded-lg shadow-sm group hover:border-primary/30 transition-all overflow-hidden">
                  <div className="p-5 flex-1 space-y-4">
                    <div className="flex items-start justify-between gap-2">
                      <div className="space-y-1">
                        <h4 className="font-bold text-foreground leading-tight">{tmpl.name}</h4>
                        <div className="flex items-center gap-2">
                          <span className="text-[9px] font-black uppercase tracking-widest px-1.5 py-0.5 bg-primary/5 text-primary rounded-sm border border-primary/10">
                            {tmpl.category}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => openEdit(tmpl)} className="p-1.5 text-muted-foreground hover:text-primary transition-colors"><Edit2 className="w-3.5 h-3.5" /></button>
                        <button onClick={() => onDeleteTemplate(tmpl.id)} className="p-1.5 text-muted-foreground hover:text-destructive transition-colors"><Trash2 className="w-3.5 h-3.5" /></button>
                      </div>
                    </div>

                    <div className="bg-muted/30 rounded-md p-3 border border-border/50">
                      <p className="text-xs text-muted-foreground leading-relaxed line-clamp-4 italic">
                        "{tmpl.content}"
                      </p>
                    </div>

                    <div className="flex flex-wrap gap-1.5">
                      {placeholders.slice(0, 3).map((ph, i) => (
                        <span key={i} className="text-[9px] font-bold text-muted-foreground uppercase border border-border px-1.5 py-0.5 rounded-sm bg-background">{ph}</span>
                      ))}
                      {placeholders.length > 3 && <span className="text-[9px] font-bold text-muted-foreground uppercase">+ {placeholders.length - 3}</span>}
                    </div>
                  </div>

                  <div className="px-5 py-3 border-t border-border bg-muted/10">
                    <button
                      onClick={() => onUseTemplate(tmpl.content, tmpl.name)}
                      className="w-full py-2 bg-primary/5 text-primary text-[10px] font-bold uppercase tracking-widest rounded-md hover:bg-primary hover:text-primary-foreground transition-all flex items-center justify-center gap-2 border border-primary/10 group-hover:border-primary/30"
                    >
                      <Send className="w-3 h-3" />
                      Select Template
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Template Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsModalOpen(false)} className="absolute inset-0 bg-black/60 backdrop-blur-[2px]" />
            <motion.div initial={{ opacity: 0, scale: 0.98, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.98, y: 10 }} className="relative bg-background rounded-lg shadow-xl border border-border w-full max-w-xl overflow-hidden flex flex-col max-h-[90vh]">
              <div className="px-6 py-4 border-b border-border flex items-center justify-between">
                <h2 className="text-lg font-bold tracking-tight text-foreground">{editingTmpl ? "Edit Template" : "New Template"}</h2>
                <button onClick={() => setIsModalOpen(false)} className="p-2 text-muted-foreground hover:text-foreground rounded-md transition-colors"><X className="w-4 h-4" /></button>
              </div>
              <div className="p-6 space-y-6 overflow-y-auto custom-scrollbar">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest px-1">Template Title</label>
                    <input type="text" placeholder="e.g. Welcome Series Step 1" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="w-full px-3 py-2 bg-background border border-input rounded-md text-sm focus:ring-1 focus:ring-ring outline-none" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest px-1">Category</label>
                    <select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} className="w-full px-3 py-2 bg-background border border-input rounded-md text-sm outline-none">
                      {TEMPLATE_CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between px-1">
                      <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Drafting Area</label>
                      <span className="text-[9px] font-bold text-muted-foreground opacity-60 uppercase">{form.content.length} characters</span>
                    </div>
                    <textarea rows={6} placeholder="Type your message with {PLACEHOLDERS}..." value={form.content} onChange={e => setForm({ ...form, content: e.target.value })} className="w-full p-4 bg-muted/20 border border-input rounded-md text-sm font-mono focus:ring-1 focus:ring-ring outline-none resize-none" />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest px-1">Insert Personalization</label>
                  <div className="flex flex-wrap gap-1.5 p-1">
                    {TEMPLATE_PLACEHOLDERS.map(ph => (
                      <button key={ph.key} type="button" onClick={() => setForm({ ...form, content: form.content + ph.key })} className="px-2 py-1 bg-background border border-border rounded-md text-[9px] font-bold uppercase tracking-wider hover:bg-muted transition-all">{ph.key}</button>
                    ))}
                  </div>
                </div>

                <div className="flex gap-3 pt-4">
                  <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 px-4 py-2 bg-background border border-input text-foreground text-xs font-bold uppercase tracking-widest rounded-md hover:bg-muted transition-all">Cancel</button>
                  <button type="button" onClick={handleSave} disabled={!form.name.trim() || !form.content.trim()} className="flex-1 px-4 py-2 bg-primary text-primary-foreground text-xs font-bold uppercase tracking-widest rounded-md hover:bg-primary/90 transition-all shadow-md disabled:opacity-50">Save Template</button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
