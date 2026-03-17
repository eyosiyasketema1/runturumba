import React from "react";
import {
  Clock, Send, Plus, Edit2, Ban, Megaphone,
  Users, Repeat, Calendar
} from "lucide-react";
import { cn } from "./types";

interface Message {
  id: string;
  contactId: string;
  tenantId: string;
  senderId: string;
  senderType: "user" | "contact";
  content: string;
  status: string;
  port: string;
  createdAt: string;
}

interface Broadcast {
  id: string;
  tenantId: string;
  name: string;
  targetGroupId: string;
  targetContactIds?: string[];
  content: string;
  status: string;
  port: string;
  stats: { sent: number; delivered: number; read: number; failed: number };
  scheduledAt?: string;
  frequency?: string;
  createdAt: string;
}

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

interface Group {
  id: string;
  name: string;
  description: string;
  contactCount: number;
  tenantId: string;
  createdAt: string;
}

export function ScheduledTab({
  scheduledMessages,
  scheduledBroadcasts,
  contacts,
  groups,
  PortBadge,
  onEditMessage,
  onCancelScheduled,
  onEditBroadcast,
  onDeleteBroadcast,
  onNewMessage,
}: {
  scheduledMessages: Message[];
  scheduledBroadcasts: Broadcast[];
  contacts: Contact[];
  groups: Group[];
  PortBadge: React.ComponentType<{ port: string }>;
  onEditMessage: (id: string, content: string) => void;
  onCancelScheduled: (id: string) => void;
  onEditBroadcast: (bc: Broadcast) => void;
  onDeleteBroadcast: (id: string) => void;
  onNewMessage: () => void;
}) {
  return (
    <div className="flex-1 bg-background overflow-y-auto custom-scrollbar animate-in fade-in duration-500">
      <div className="p-6 lg:p-10 max-w-7xl mx-auto space-y-10">
        <header className="flex flex-col gap-2">
          <h2 className="text-2xl font-bold tracking-tight text-foreground">Scheduled Queue</h2>
          <p className="text-muted-foreground text-sm">Manage your upcoming messages and broadcasts.</p>
        </header>

        {scheduledMessages.length === 0 && scheduledBroadcasts.length === 0 ? (
          <div className="py-24 text-center border-2 border-dashed border-border rounded-lg bg-muted/20 space-y-6">
            <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto border border-border shadow-sm">
              <Clock className="w-8 h-8 text-muted-foreground opacity-40" />
            </div>
            <div className="space-y-2">
              <p className="text-foreground font-bold">No items in the queue</p>
              <p className="text-muted-foreground text-sm max-w-[280px] mx-auto">Compose a message now and set a future date to see it appear here.</p>
            </div>
            <button
              onClick={onNewMessage}
              className="inline-flex items-center gap-2 px-6 py-2 bg-primary text-primary-foreground rounded-md text-sm font-bold hover:bg-primary/90 transition-all shadow-sm"
            >
              <Plus className="w-4 h-4" />
              Schedule Message
            </button>
          </div>
        ) : (
          <div className="space-y-10">
            {scheduledMessages.length > 0 && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-2">
                    <Send className="w-3.5 h-3.5" />
                    Individual Messages ({scheduledMessages.length})
                  </h3>
                </div>
                <div className="bg-card rounded-lg border border-border shadow-sm overflow-hidden">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="bg-muted/50 border-b border-border">
                        <th className="px-6 py-3 text-xs font-bold text-muted-foreground uppercase tracking-widest">Recipient</th>
                        <th className="px-6 py-3 text-xs font-bold text-muted-foreground uppercase tracking-widest">Message Preview</th>
                        <th className="px-6 py-3 text-xs font-bold text-muted-foreground uppercase tracking-widest">Channel</th>
                        <th className="px-6 py-3 text-xs font-bold text-muted-foreground uppercase tracking-widest">Release Date</th>
                        <th className="px-6 py-3 text-xs font-bold text-muted-foreground uppercase tracking-widest w-24"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/50">
                      {scheduledMessages.map(msg => {
                        const contact = contacts.find(c => c.id === msg.contactId);
                        return (
                          <tr key={msg.id} className="hover:bg-muted/30 transition-colors group">
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-xs font-bold text-primary">
                                  {contact?.name.charAt(0)}
                                </div>
                                <div>
                                  <p className="text-sm font-bold text-foreground leading-none">{contact?.name || "Unknown"}</p>
                                  <p className="text-xs text-muted-foreground mt-1">{contact?.phone}</p>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <p className="text-sm text-muted-foreground max-w-sm truncate">{msg.content}</p>
                            </td>
                            <td className="px-6 py-4"><PortBadge port={msg.port} /></td>
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-2">
                                <Calendar className="w-3.5 h-3.5 text-primary" />
                                <span className="text-xs font-bold text-foreground">
                                  {new Date(msg.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}
                                </span>
                                <span className="text-xs text-muted-foreground font-bold uppercase ml-1">
                                  at {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                              </div>
                            </td>
                            <td className="px-6 py-4 text-right">
                              <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button
                                  onClick={() => onEditMessage(msg.id, msg.content)}
                                  className="p-2 text-muted-foreground hover:text-primary hover:bg-muted rounded-md transition-all"
                                >
                                  <Edit2 className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => onCancelScheduled(msg.id)}
                                  className="p-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-md transition-all"
                                >
                                  <Ban className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {scheduledBroadcasts.length > 0 && (
              <div className="space-y-4">
                <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-2">
                  <Megaphone className="w-3.5 h-3.5" />
                  Scheduled Broadcasts ({scheduledBroadcasts.length})
                </h3>
                <div className="bg-card rounded-lg border border-border shadow-sm overflow-hidden">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="bg-muted/50 border-b border-border">
                        <th className="px-6 py-3 text-xs font-bold text-muted-foreground uppercase tracking-widest">Broadcast Name</th>
                        <th className="px-6 py-3 text-xs font-bold text-muted-foreground uppercase tracking-widest">Target</th>
                        <th className="px-6 py-3 text-xs font-bold text-muted-foreground uppercase tracking-widest">Channel</th>
                        <th className="px-6 py-3 text-xs font-bold text-muted-foreground uppercase tracking-widest">Scheduled For</th>
                        <th className="px-6 py-3 text-xs font-bold text-muted-foreground uppercase tracking-widest">Frequency</th>
                        <th className="px-6 py-3 text-xs font-bold text-muted-foreground uppercase tracking-widest w-24"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/50">
                      {scheduledBroadcasts.map(bc => (
                        <tr key={bc.id} className="hover:bg-muted/30 transition-colors group">
                          <td className="px-6 py-4">
                            <p className="text-sm font-bold text-foreground leading-tight">{bc.name}</p>
                            <p className="text-xs text-muted-foreground truncate max-w-xs mt-1">{bc.content}</p>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                              <Users className="w-3.5 h-3.5 opacity-60" />
                              <span className="truncate max-w-[120px]">
                                {bc.targetGroupId === "all" ? "All Contacts" : bc.targetGroupId === "direct" && bc.targetContactIds ? `${bc.targetContactIds.length} Contacts` : groups.find(g => g.id === bc.targetGroupId)?.name || "Group"}
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-4"><PortBadge port={bc.port} /></td>
                          <td className="px-6 py-4">
                            <div className="flex flex-col">
                              <span className="text-sm font-bold text-foreground">
                                {bc.scheduledAt ? new Date(bc.scheduledAt).toLocaleDateString([], { month: 'short', day: 'numeric' }) : "\u2014"}
                              </span>
                              <span className="text-xs text-muted-foreground font-bold uppercase tracking-wider">
                                {bc.scheduledAt ? new Date(bc.scheduledAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "No time"}
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            {bc.frequency && bc.frequency !== "once" ? (
                              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 bg-primary/10 text-primary text-xs font-bold rounded-md border border-primary/20 uppercase tracking-widest">
                                <Repeat className="w-3 h-3" />
                                {bc.frequency}
                              </span>
                            ) : (
                              <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest opacity-60">One-time</span>
                            )}
                          </td>
                          <td className="px-6 py-4 text-right">
                            <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button
                                onClick={() => onEditBroadcast(bc as any)}
                                className="p-2 text-muted-foreground hover:text-primary hover:bg-muted rounded-md transition-all"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => onDeleteBroadcast(bc.id)}
                                className="p-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-md transition-all"
                              >
                                <Ban className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
