import React, { useState, useEffect, useMemo } from "react";
import { 
  MessageSquare, Send, Megaphone, Clock, FileText, Search, Plus, 
  X, Calendar, Check, CheckCheck, AlertCircle, ExternalLink, 
  Edit2, RotateCcw, Trash2, Copy, Sparkles, PanelRightOpen, 
  PanelRightClose, Phone, Mail, StickyNote, Repeat, Users, Eye,
  Zap, ArrowRight, MoreVertical, ChevronRight, ChevronLeft, Info
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { toast } from "sonner";
import {
  type Contact, type Message, type Broadcast, type Group, type ContactNote,
  type User, type MessageStatus, type MessagePort, type ScheduleFrequency,
  MESSAGE_PORTS, formatTimeAgo, copyToClipboard, cn
} from "./types";
import { 
  Modal, PortBadge, PortSelector, FrequencySelector, DropdownPortSelector 
} from "./shared-ui";
import { ScheduledTab } from "./scheduled-tab";
import { TemplatesTab } from "./templates-tab";
import { NewMessageFlow } from "./new-message-flow";
import { NewBroadcastFlow } from "./new-broadcast-flow";
import { type MessageTemplate } from "./message-data";

export const MessagesView = ({ 
  contacts, 
  messages, 
  broadcasts,
  groups,
  notes,
  users,
  onSendMessage, 
  onRetryMessage,
  onCancelScheduled,
  onDeleteBroadcast,
  onDuplicateBroadcast,
  onCreateBroadcast,
  onEditBroadcast,
  onDeleteMessage,
  onEditMessage,
  onDeleteConversation,
  onAddNote,
  onDeleteNote,
  templates,
  onCreateTemplate,
  onEditTemplate,
  onDeleteTemplate,
  onCreateGroup,
  currentUser,
  preSelectedContactId
}: any) => {
  const [newMessage, setNewMessage] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<"messages" | "group" | "scheduled" | "templates">("messages");
  const [statusFilter, setStatusFilter] = useState<MessageStatus | "all">("all");
  const [portFilter, setPortFilter] = useState<MessagePort | "all">("all");
  const [contactFilter, setContactFilter] = useState<string>("all");
  
  const [isNewMessageFlowOpen, setIsNewMessageFlowOpen] = useState(false);
  const [isNewBroadcastFlowOpen, setIsNewBroadcastFlowOpen] = useState(false);

  const filteredMessages = useMemo(() => {
    let msgs = messages;
    if (statusFilter !== "all") msgs = msgs.filter(m => m.status === statusFilter);
    if (portFilter !== "all") msgs = msgs.filter(m => m.port === portFilter);
    if (searchQuery) {
      msgs = msgs.filter(m => 
        m.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
        contacts.find(c => c.id === m.contactId)?.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    return [...msgs].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [messages, statusFilter, portFilter, searchQuery, contacts]);

  const scheduledMessages = useMemo(() => messages.filter(m => m.status === "scheduled"), [messages]);
  const scheduledBroadcasts = useMemo(() => broadcasts.filter(b => b.status === "scheduled"), [broadcasts]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !preSelectedContactId) return;
    onSendMessage(preSelectedContactId, newMessage, undefined, conversationPort);
    setNewMessage("");
  };

  const tabItems = [
    { id: "messages" as const, label: "Messages", icon: MessageSquare, count: 35 },
    { id: "group" as const, label: "Broadcasts", icon: Megaphone, count: 4 },
    { id: "scheduled" as const, label: "Scheduled", icon: Clock, count: 4 },
    { id: "templates" as const, label: "Templates", icon: FileText, count: 8 },
  ];

  return (
    <div className="flex flex-col h-full bg-background overflow-hidden animate-in fade-in duration-300">
      {/* Top Header */}
      <div className="border-b border-border bg-background shrink-0 px-6 py-6 flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <h2 className="text-xl font-bold tracking-tight text-foreground">
              {activeTab === "group" ? "Broadcast Messages" : 
               activeTab === "messages" ? "Message History" : 
               activeTab === "scheduled" ? "Scheduled Queue" : "Message Templates"}
            </h2>
            <p className="text-sm text-muted-foreground">
              {activeTab === "group" ? "Manage and track your group messaging activities." : 
               "View and manage your organization's messaging workflows."}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative hidden md:block">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input 
                type="text" 
                placeholder="Search Messages..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-72 pl-10 pr-4 py-2 bg-muted/50 border border-input rounded-md text-sm focus:ring-1 focus:ring-ring outline-none transition-all shadow-sm"
              />
            </div>
            <button 
              onClick={() => {
                if (activeTab === "group") setIsNewBroadcastFlowOpen(true);
                else setIsNewMessageFlowOpen(true);
              }}
              className="flex items-center gap-2 px-5 py-2.5 bg-primary text-primary-foreground rounded-md text-sm font-bold shadow-md hover:bg-primary/90 transition-all"
            >
              <Plus className="w-4 h-4" />
              {activeTab === "group" ? "New Broadcast" : "New Message"}
            </button>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1 p-1 bg-muted/50 rounded-lg border border-border overflow-x-auto no-scrollbar">
            {tabItems.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "flex items-center gap-2 px-4 py-1.5 text-xs font-bold rounded-md transition-all whitespace-nowrap",
                  activeTab === tab.id 
                    ? "bg-background text-primary shadow-sm border border-border" 
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <tab.icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
                {tab.count !== undefined && (
                  <span className={cn(
                    "ml-1 px-1.5 py-0.5 rounded-full text-[10px]",
                    activeTab === tab.id ? "bg-primary/10 text-primary" : "bg-muted-foreground/10 text-muted-foreground"
                  )}>
                    {tab.count}
                  </span>
                )}
              </button>
            ))}
          </div>

          <div className="hidden lg:flex items-center gap-2">
            <select
              value={portFilter}
              onChange={(e) => setPortFilter(e.target.value as any)}
              className="px-3 py-1.5 bg-background border border-input rounded-md text-xs font-bold shadow-sm outline-none focus:ring-1 focus:ring-ring"
            >
              <option value="all">All Channels</option>
              <option value="whatsapp">WhatsApp</option>
              <option value="sms">SMS</option>
              <option value="telegram">Telegram</option>
              <option value="email">Email</option>
              <option value="messenger">Messenger</option>
            </select>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="px-3 py-1.5 bg-background border border-input rounded-md text-xs font-bold shadow-sm outline-none focus:ring-1 focus:ring-ring"
            >
              <option value="all">All Status</option>
              <option value="sent">Sent</option>
              <option value="delivered">Delivered</option>
              <option value="read">Read</option>
              <option value="failed">Failed</option>
              <option value="scheduled">Scheduled</option>
            </select>
          </div>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {activeTab === "messages" && (
          <div className="flex-1 overflow-auto p-6 bg-muted/10 custom-scrollbar">
            <div className="max-w-7xl mx-auto space-y-6">
              <div className="bg-card rounded-lg border border-border shadow-sm overflow-hidden">
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-muted/50 border-b border-border">
                      <th className="px-6 py-3 text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Recipient</th>
                      <th className="px-6 py-3 text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Message</th>
                      <th className="px-6 py-3 text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Channel</th>
                      <th className="px-6 py-3 text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Status</th>
                      <th className="px-6 py-3 text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Time</th>
                      <th className="px-6 py-3 text-[10px] font-bold text-muted-foreground uppercase tracking-widest w-20"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/50">
                    {filteredMessages.map(msg => {
                      const contact = contacts.find(c => c.id === msg.contactId);
                      return (
                        <tr key={msg.id} className="hover:bg-muted/30 transition-colors group">
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-[10px] font-bold text-primary">
                                {contact?.name.charAt(0)}
                              </div>
                              <div>
                                <p className="text-sm font-bold text-foreground leading-none">{contact?.name || "Unknown"}</p>
                                <p className="text-[10px] text-muted-foreground mt-1">{contact?.phone}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <p className="text-sm text-muted-foreground max-w-md truncate">{msg.content}</p>
                          </td>
                          <td className="px-6 py-4">
                            <PortBadge port={msg.port} />
                          </td>
                          <td className="px-6 py-4 text-xs font-bold uppercase tracking-widest">
                            <span className={cn(
                              "px-2 py-0.5 rounded-md border capitalize",
                              msg.status === "received" ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20" :
                              msg.status === "failed" ? "bg-destructive/10 text-destructive border-destructive/20" :
                              "bg-muted text-muted-foreground border-border"
                            )}>
                              {msg.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-[10px] font-bold text-muted-foreground uppercase">
                            {formatTimeAgo(msg.createdAt)}
                          </td>
                          <td className="px-6 py-4 text-right">
                            <button onClick={() => {}} className="p-1.5 text-muted-foreground hover:text-primary transition-colors">
                              <ChevronRight className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {activeTab === "group" && (
          <div className="flex-1 overflow-auto bg-muted/10 custom-scrollbar">
            <div className="p-6">
              <div className="bg-card rounded-lg border border-border shadow-sm overflow-hidden">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-muted/50 border-b border-border">
                      <th className="px-6 py-4 w-12 text-[10px] font-bold text-muted-foreground uppercase tracking-widest text-center">
                        <input type="checkbox" className="rounded border-input shadow-sm focus:ring-1 focus:ring-ring" />
                      </th>
                      <th className="px-6 py-4 text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Message</th>
                      <th className="px-6 py-4 text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Channel</th>
                      <th className="px-6 py-4 text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Status</th>
                      <th className="px-6 py-4 text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Target</th>
                      <th className="px-6 py-4 text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Stat(S/D/R/F)</th>
                      <th className="px-6 py-4 text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Date</th>
                      <th className="px-6 py-4 text-[10px] font-bold text-muted-foreground uppercase tracking-widest w-24 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/50">
                    {broadcasts.map((bc: any) => (
                      <tr key={bc.id} className="hover:bg-muted/30 transition-colors group">
                        <td className="px-6 py-4 text-center">
                          <input type="checkbox" className="rounded border-input shadow-sm focus:ring-1 focus:ring-ring" />
                        </td>
                        <td className="px-6 py-4">
                          <div className="space-y-0.5">
                            <p className="text-sm font-bold text-foreground leading-none">{bc.name || "Message Title"}</p>
                            <p className="text-xs text-muted-foreground truncate max-w-[240px]">Reminder: Your subscription renews...</p>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <PortBadge port={bc.port} />
                        </td>
                        <td className="px-6 py-4 text-xs font-bold uppercase tracking-widest">
                          <span className={cn(
                            "px-2 py-0.5 rounded-md border capitalize",
                            bc.status === "sent" ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20" :
                            bc.status === "delivered" ? "bg-blue-500/10 text-blue-600 border-blue-500/20" :
                            bc.status === "failed" ? "bg-destructive/10 text-destructive border-destructive/20" :
                            bc.status === "scheduled" ? "bg-amber-500/10 text-amber-600 border-amber-500/20" :
                            "bg-muted text-muted-foreground border-border"
                          )}>
                            {bc.status}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-xs font-medium text-muted-foreground">
                            {groups.find((g: any) => g.id === bc.targetGroupId)?.name || "All Contacts"}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex gap-4">
                            {[
                              { label: "S", value: bc.stats.sent, color: "bg-muted-foreground/60" },
                              { label: "D", value: bc.stats.delivered, color: "bg-emerald-500" },
                              { label: "R", value: bc.stats.read, color: "bg-blue-500" },
                              { label: "F", value: bc.stats.failed, color: "bg-rose-500" }
                            ].map((stat, i) => (
                              <div key={i} className="flex flex-col items-center gap-1">
                                <div className="flex items-center gap-1.5">
                                  <div className={cn("w-1.5 h-1.5 rounded-full shadow-sm", stat.color)} />
                                  <span className="text-[10px] font-bold text-foreground">{stat.value}</span>
                                </div>
                                <span className="text-[8px] font-black text-muted-foreground uppercase opacity-40">{stat.label}</span>
                              </div>
                            ))}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-xs font-bold text-foreground">
                            {new Date(bc.createdAt).toLocaleDateString("en-US", { month: 'numeric', day: 'numeric', year: '2-digit' })}, {new Date(bc.createdAt).toLocaleTimeString("en-US", { hour: 'numeric', minute: '2-digit', hour12: true })}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button className="p-2 text-muted-foreground hover:text-primary hover:bg-muted rounded-md transition-all">
                              <Eye className="w-3.5 h-3.5" />
                            </button>
                            <button className="p-2 text-muted-foreground hover:text-primary hover:bg-muted rounded-md transition-all">
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button className="p-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-md transition-all">
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <div className="px-6 py-4 border-t border-border bg-muted/20 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">Show</span>
                    <select className="px-2 py-1 bg-background border border-input rounded text-xs outline-none focus:ring-1 focus:ring-ring shadow-sm">
                      <option>10</option>
                      <option>20</option>
                      <option>50</option>
                    </select>
                  </div>
                  <div className="text-xs text-muted-foreground">Showing 1 to 10 of 25 entries</div>
                  <div className="flex items-center gap-1">
                    <button className="p-1.5 text-muted-foreground hover:text-foreground transition-all"><ChevronLeft className="w-4 h-4" /></button>
                    <button className="w-8 h-8 rounded-md bg-muted text-muted-foreground text-xs font-bold hover:bg-muted/80 transition-all">1</button>
                    <button className="w-8 h-8 rounded-md bg-muted text-muted-foreground text-xs font-bold hover:bg-muted/80 transition-all">2</button>
                    <button className="w-8 h-8 rounded-md bg-primary text-primary-foreground text-xs font-bold shadow-sm">3</button>
                    <button className="w-8 h-8 rounded-md bg-muted text-muted-foreground text-xs font-bold hover:bg-muted/80 transition-all">4</button>
                    <button className="p-1.5 text-muted-foreground hover:text-foreground transition-all"><ChevronRight className="w-4 h-4" /></button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === "scheduled" && (
          <ScheduledTab 
            scheduledMessages={scheduledMessages}
            scheduledBroadcasts={scheduledBroadcasts}
            contacts={contacts}
            groups={groups}
            PortBadge={PortBadge}
            onEditMessage={onEditMessage}
            onCancelScheduled={onCancelScheduled}
            onEditBroadcast={onEditBroadcast}
            onDeleteBroadcast={onDeleteBroadcast}
            onNewMessage={() => setIsNewMessageFlowOpen(true)}
          />
        )}

        {activeTab === "templates" && (
          <TemplatesTab 
            templates={templates}
            filteredTemplates={templates} // Simplify filtering logic here
            templateCategory="all"
            setTemplateCategory={() => {}} 
            onCreateTemplate={onCreateTemplate}
            onEditTemplate={onEditTemplate}
            onDeleteTemplate={onDeleteTemplate}
            onUseTemplate={(content: string) => {
              setNewMessage(content);
              setActiveTab("messages");
            }}
          />
        )}
      </div>

      <Modal isOpen={isNewMessageFlowOpen} onClose={() => setIsNewMessageFlowOpen(false)} title="New Message" size="3xl">
        <NewMessageFlow 
          contacts={contacts} 
          groups={groups} 
          templates={templates} 
          onClose={() => setIsNewMessageFlowOpen(false)} 
        />
      </Modal>

      <Modal isOpen={isNewBroadcastFlowOpen} onClose={() => setIsNewBroadcastFlowOpen(false)} title="New Broadcast" size="3xl">
        <NewBroadcastFlow 
          contacts={contacts} 
          groups={groups} 
          templates={templates} 
          onClose={() => setIsNewBroadcastFlowOpen(false)} 
          onSend={(broadcast) => {
            if (onCreateBroadcast) onCreateBroadcast(broadcast);
            else toast.success("Broadcast sent successfully!");
            setIsNewBroadcastFlowOpen(false);
          }}
        />
      </Modal>
    </div>
  );
};