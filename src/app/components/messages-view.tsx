import React, { useState, useMemo } from "react";
import {
  MessageSquare, Megaphone, Clock, FileText, Search, Plus,
  X, Eye, Edit2, RotateCcw, Trash2, MoreVertical,
  ChevronRight, ChevronLeft, Calendar as CalendarIcon,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { toast } from "sonner";
import {
  type MessageStatus, type MessagePort, type ChannelType,
  MESSAGE_PORTS, cn,
} from "./types";
import {
  Modal, PortBadge,
} from "./shared-ui";
import { ScheduledTab } from "./scheduled-tab";
import { TemplatesTab } from "./templates-tab";
import { NewMessageFlow } from "./new-message-flow";
import { NewBroadcastFlow } from "./new-broadcast-flow";
import { FilterDropdown } from "./discipleship-views";

// ---------- helpers ----------

function getInitials(name: string) {
  return name
    .split(" ")
    .map(p => p.charAt(0))
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function formatMsgTime(iso: string) {
  const d = new Date(iso);
  const date = d.toLocaleDateString("en-GB", { day: "2-digit", month: "2-digit", year: "numeric" });
  const time = d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true });
  return `${date}, ${time}`;
}

const STATUS_PILL: Record<MessageStatus, string> = {
  sent:       "bg-blue-50 text-blue-700 ring-1 ring-inset ring-blue-200",
  delivered:  "bg-sky-50 text-sky-700 ring-1 ring-inset ring-sky-200",
  read:       "bg-indigo-50 text-indigo-700 ring-1 ring-inset ring-indigo-200",
  failed:     "bg-rose-50 text-rose-700 ring-1 ring-inset ring-rose-200",
  scheduled:  "bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-200",
  received:   "bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-200",
};

const CHANNEL_PILL: Record<ChannelType, string> = {
  whatsapp:  "bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-200",
  telegram:  "bg-sky-50 text-sky-700 ring-1 ring-inset ring-sky-200",
  sms:       "bg-violet-50 text-violet-700 ring-1 ring-inset ring-violet-200",
  email:     "bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-200",
  messenger: "bg-blue-50 text-blue-700 ring-1 ring-inset ring-blue-200",
  smpp:      "bg-slate-100 text-slate-700 ring-1 ring-inset ring-slate-200",
};

const CHANNEL_LABEL: Record<ChannelType, string> = {
  whatsapp:  "whatsapp",
  telegram:  "telegram",
  sms:       "sms",
  email:     "email",
  messenger: "messenger",
  smpp:      "smpp",
};

export const MessagesView = ({
  contacts,
  messages,
  broadcasts,
  groups,
  notes: _notes,
  users: _users,
  onSendMessage: _onSendMessage,
  onRetryMessage,
  onCancelScheduled,
  onDeleteBroadcast,
  onDuplicateBroadcast: _onDuplicateBroadcast,
  onCreateBroadcast,
  onEditBroadcast,
  onDeleteMessage,
  onEditMessage,
  onDeleteConversation: _onDeleteConversation,
  onAddNote: _onAddNote,
  onDeleteNote: _onDeleteNote,
  templates,
  onCreateTemplate,
  onEditTemplate,
  onDeleteTemplate,
  onCreateGroup: _onCreateGroup,
  currentUser: _currentUser,
  preSelectedContactId: _preSelectedContactId,
}: any) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<"messages" | "group" | "scheduled" | "templates">("messages");
  const [statusFilter, setStatusFilter] = useState<MessageStatus | "all">("all");
  const [portFilter, setPortFilter] = useState<MessagePort | "all">("all");
  const [contactFilter, setContactFilter] = useState<string>("all");
  const [fromDate, setFromDate] = useState<string>("");
  const [toDate, setToDate] = useState<string>("");
  const [sort, setSort] = useState<"newest" | "oldest">("newest");

  const [pageSize, setPageSize] = useState(10);
  const [page, setPage] = useState(1);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  const [isNewMessageFlowOpen, setIsNewMessageFlowOpen] = useState(false);
  const [isNewBroadcastFlowOpen, setIsNewBroadcastFlowOpen] = useState(false);
  const [newMessage, setNewMessage] = useState("");

  // ---------- filters ----------

  const hasActiveFilters =
    statusFilter !== "all" ||
    portFilter !== "all" ||
    contactFilter !== "all" ||
    !!fromDate ||
    !!toDate ||
    sort !== "newest";

  const clearFilters = () => {
    setStatusFilter("all");
    setPortFilter("all");
    setContactFilter("all");
    setFromDate("");
    setToDate("");
    setSort("newest");
    setPage(1);
  };

  const filteredMessages = useMemo(() => {
    let msgs = messages as any[];
    if (statusFilter !== "all") msgs = msgs.filter(m => m.status === statusFilter);
    if (portFilter !== "all") msgs = msgs.filter(m => m.port === portFilter);
    if (contactFilter !== "all") msgs = msgs.filter(m => m.contactId === contactFilter);
    if (fromDate) {
      const from = new Date(fromDate).getTime();
      msgs = msgs.filter(m => new Date(m.createdAt).getTime() >= from);
    }
    if (toDate) {
      const to = new Date(toDate).getTime() + 24 * 60 * 60 * 1000 - 1;
      msgs = msgs.filter(m => new Date(m.createdAt).getTime() <= to);
    }
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      msgs = msgs.filter(m =>
        m.content.toLowerCase().includes(q) ||
        contacts.find((c: any) => c.id === m.contactId)?.name.toLowerCase().includes(q)
      );
    }
    return [...msgs].sort((a, b) => {
      const ta = new Date(a.createdAt).getTime();
      const tb = new Date(b.createdAt).getTime();
      return sort === "oldest" ? ta - tb : tb - ta;
    });
  }, [messages, statusFilter, portFilter, contactFilter, fromDate, toDate, searchQuery, sort, contacts]);

  const totalPages = Math.max(1, Math.ceil(filteredMessages.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const pageStart = (currentPage - 1) * pageSize;
  const pageMessages = filteredMessages.slice(pageStart, pageStart + pageSize);
  const rangeStart = filteredMessages.length === 0 ? 0 : pageStart + 1;
  const rangeEnd = Math.min(pageStart + pageSize, filteredMessages.length);

  const scheduledMessages = useMemo(() => (messages as any[]).filter(m => m.status === "scheduled"), [messages]);
  const scheduledBroadcasts = useMemo(() => (broadcasts as any[]).filter(b => b.status === "scheduled"), [broadcasts]);

  const tabItems = [
    { id: "messages" as const, label: "Messages", icon: MessageSquare, count: (messages as any[]).length },
    { id: "group" as const, label: "Group Messaging", icon: Megaphone, count: (broadcasts as any[]).length },
    { id: "scheduled" as const, label: "Scheduled", icon: Clock, count: scheduledMessages.length + scheduledBroadcasts.length },
    { id: "templates" as const, label: "Templates", icon: FileText, count: (templates as any[]).length },
  ];

  const channelOptions: { value: string; label: string }[] = [
    { value: "all", label: "All Channels" },
    ...MESSAGE_PORTS.map(p => ({ value: p.id, label: p.label })),
  ];

  const statusOptions: { value: string; label: string }[] = [
    { value: "all", label: "All Status" },
    { value: "sent", label: "Sent" },
    { value: "delivered", label: "Delivered" },
    { value: "read", label: "Read" },
    { value: "scheduled", label: "Scheduled" },
    { value: "received", label: "Received" },
    { value: "failed", label: "Failed" },
  ];

  const contactOptions: { value: string; label: string }[] = [
    { value: "all", label: "All Contacts" },
    ...(contacts as any[]).map(c => ({ value: c.id, label: c.name })),
  ];

  return (
    <div className="flex flex-col h-full bg-background overflow-hidden animate-in fade-in duration-300">
      {/* ---------- HEADER ---------- */}
      <div className="shrink-0 px-6 lg:px-10 pt-6 pb-4 flex flex-col gap-5">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">Messages</h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              View, send and manage your messaging activity across channels.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative hidden md:block">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search Messages..."
                value={searchQuery}
                onChange={(e) => { setSearchQuery(e.target.value); setPage(1); }}
                className="w-72 pl-10 pr-3 h-10 bg-background border border-input rounded-sm text-sm focus:outline-none focus:ring-2 focus:ring-ring transition-all"
              />
            </div>
            <button
              onClick={() => {
                if (activeTab === "group") setIsNewBroadcastFlowOpen(true);
                else setIsNewMessageFlowOpen(true);
              }}
              className="inline-flex items-center gap-2 h-10 px-4 bg-primary text-primary-foreground rounded-sm text-sm font-semibold hover:bg-primary/90 transition-all"
            >
              <Plus className="w-4 h-4" />
              {activeTab === "group" ? "New Broadcast" : "New Message"}
            </button>
          </div>
        </div>

        {/* ---------- TABS ---------- */}
        <div className="flex items-center gap-1 p-1 bg-muted/50 rounded-sm border border-border overflow-x-auto no-scrollbar w-fit">
          {tabItems.map(tab => (
            <button
              key={tab.id}
              onClick={() => { setActiveTab(tab.id); setPage(1); }}
              className={cn(
                "inline-flex items-center gap-2 px-4 h-8 text-xs font-semibold rounded-sm transition-all whitespace-nowrap",
                activeTab === tab.id
                  ? "bg-background text-foreground shadow-sm border border-border"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <tab.icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
              {tab.count !== undefined && (
                <span className={cn(
                  "inline-flex items-center justify-center min-w-[18px] h-[18px] px-1.5 rounded-sm text-[10px] font-bold",
                  activeTab === tab.id ? "bg-primary/10 text-primary" : "bg-muted-foreground/10 text-muted-foreground"
                )}>
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* ---------- FILTER BAR (Messages tab only) ---------- */}
        {activeTab === "messages" && (
          <div className="bg-card border border-border rounded-sm p-3 flex flex-wrap items-center gap-2">
            <FilterDropdown
              label="All Status"
              value={statusFilter}
              onChange={(v) => { setStatusFilter(v as any); setPage(1); }}
              options={statusOptions}
            />
            <FilterDropdown
              label="All Channels"
              value={portFilter}
              onChange={(v) => { setPortFilter(v as any); setPage(1); }}
              options={channelOptions}
            />
            <FilterDropdown
              label="All Contacts"
              value={contactFilter}
              onChange={(v) => { setContactFilter(v); setPage(1); }}
              options={contactOptions}
            />

            <div className="inline-flex items-center gap-2">
              <div className="relative">
                <CalendarIcon className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                <input
                  type="date"
                  value={fromDate}
                  onChange={(e) => { setFromDate(e.target.value); setPage(1); }}
                  placeholder="dd/mm/yyyy"
                  className="h-10 pl-8 pr-2 bg-background border border-input rounded-sm text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring transition-all w-[150px]"
                />
              </div>
              <span className="text-xs text-muted-foreground">To</span>
              <div className="relative">
                <CalendarIcon className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                <input
                  type="date"
                  value={toDate}
                  onChange={(e) => { setToDate(e.target.value); setPage(1); }}
                  placeholder="dd/mm/yyyy"
                  className="h-10 pl-8 pr-2 bg-background border border-input rounded-sm text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring transition-all w-[150px]"
                />
              </div>
            </div>

            <FilterDropdown
              label="Newest First"
              value={sort}
              onChange={(v) => { setSort(v as any); setPage(1); }}
              options={[
                { value: "newest", label: "Newest First" },
                { value: "oldest", label: "Oldest First" },
              ]}
            />

            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="inline-flex items-center gap-1.5 h-10 px-3 rounded-sm border border-rose-200 bg-rose-50 text-rose-700 text-sm font-semibold hover:bg-rose-100 transition-colors"
              >
                <X className="w-3.5 h-3.5" />
                Clear Filter
              </button>
            )}
          </div>
        )}
      </div>

      {/* ---------- CONTENT ---------- */}
      <div className="flex-1 flex overflow-hidden">
        {activeTab === "messages" && (
          <div className="flex-1 overflow-auto px-6 lg:px-10 pb-10 custom-scrollbar">
            <div className="bg-card border border-border rounded-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-border bg-muted/30">
                      <th className="px-4 py-3 text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Contact</th>
                      <th className="px-4 py-3 text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Message</th>
                      <th className="px-4 py-3 text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Channel</th>
                      <th className="px-4 py-3 text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Status</th>
                      <th className="px-4 py-3 text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Direction</th>
                      <th className="px-4 py-3 text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Time</th>
                      <th className="px-4 py-3 text-[11px] font-bold text-muted-foreground uppercase tracking-wider text-right w-28">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pageMessages.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="px-6 py-20 text-center">
                          <div className="flex flex-col items-center gap-2">
                            <div className="w-10 h-10 rounded-sm bg-muted flex items-center justify-center">
                              <MessageSquare className="w-4 h-4 text-muted-foreground" />
                            </div>
                            <p className="text-sm font-semibold text-foreground">No messages found</p>
                            <p className="text-xs text-muted-foreground">Try adjusting the filters or send a new message.</p>
                          </div>
                        </td>
                      </tr>
                    ) : pageMessages.map((msg: any) => {
                      const contact = (contacts as any[]).find((c: any) => c.id === msg.contactId);
                      const isOutgoing = msg.senderType !== "contact";
                      return (
                        <tr key={msg.id} className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors">
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-3">
                              <div className="w-9 h-9 rounded-full bg-muted border border-border flex items-center justify-center text-xs font-semibold text-muted-foreground shrink-0">
                                {contact ? getInitials(contact.name) : "?"}
                              </div>
                              <div className="min-w-0">
                                <p className="text-sm font-semibold text-foreground leading-tight truncate">{contact?.name || "Unknown"}</p>
                                <p className="text-xs text-muted-foreground mt-0.5 tabular-nums truncate">{contact?.phone}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <p className="text-sm text-foreground max-w-[320px] truncate">{msg.content}</p>
                          </td>
                          <td className="px-4 py-3">
                            <span className={cn(
                              "inline-flex items-center px-2 py-0.5 rounded-sm text-[11px] font-semibold lowercase",
                              CHANNEL_PILL[msg.port as ChannelType] || CHANNEL_PILL.smpp,
                            )}>
                              {CHANNEL_LABEL[msg.port as ChannelType] || msg.port}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <span className={cn(
                              "inline-flex items-center px-2 py-0.5 rounded-sm text-[11px] font-semibold capitalize",
                              STATUS_PILL[msg.status as MessageStatus] || STATUS_PILL.sent,
                            )}>
                              {msg.status}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <span className={cn(
                              "inline-flex items-center px-2 py-0.5 rounded-sm text-[11px] font-bold uppercase tracking-wider",
                              isOutgoing
                                ? "bg-blue-50 text-blue-700 ring-1 ring-inset ring-blue-200"
                                : "bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-200",
                            )}>
                              {isOutgoing ? "Outgoing" : "Incoming"}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-xs text-muted-foreground tabular-nums whitespace-nowrap">
                            {formatMsgTime(msg.createdAt)}
                          </td>
                          <td className="px-4 py-3 text-right">
                            <div className="inline-flex items-center gap-0.5">
                              <button
                                onClick={() => toast.info(`Viewing message from ${contact?.name || "contact"}`)}
                                className="p-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-sm transition-all"
                                aria-label="View message"
                              >
                                <Eye className="w-4 h-4" />
                              </button>
                              {msg.status === "failed" ? (
                                <button
                                  onClick={() => onRetryMessage && onRetryMessage(msg.id)}
                                  className="p-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-sm transition-all"
                                  aria-label="Retry message"
                                >
                                  <RotateCcw className="w-4 h-4" />
                                </button>
                              ) : (
                                <button
                                  onClick={() => onEditMessage && onEditMessage(msg)}
                                  className="p-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-sm transition-all"
                                  aria-label="Edit message"
                                >
                                  <Edit2 className="w-4 h-4" />
                                </button>
                              )}
                              <button
                                onClick={() => onDeleteMessage && onDeleteMessage(msg.id)}
                                className="p-2 text-muted-foreground hover:text-destructive hover:bg-destructive/5 rounded-sm transition-all"
                                aria-label="Delete message"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* ---------- PAGINATION ---------- */}
              <div className="px-4 py-3 border-t border-border flex items-center justify-between flex-wrap gap-3">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <span>Show</span>
                  <select
                    value={pageSize}
                    onChange={(e) => { setPageSize(Number(e.target.value)); setPage(1); }}
                    className="h-8 px-2 bg-background border border-input rounded-sm text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  >
                    {[10, 25, 50, 100].map(n => (
                      <option key={n} value={n}>{n}</option>
                    ))}
                  </select>
                </div>

                <p className="text-sm text-muted-foreground">
                  Showing {rangeStart} to {rangeEnd} of {filteredMessages.length} entries
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
          </div>
        )}

        {activeTab === "group" && (
          <div className="flex-1 overflow-auto px-6 lg:px-10 pb-10 custom-scrollbar">
            <div className="bg-card border border-border rounded-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-border bg-muted/30">
                      <th className="px-4 py-3 w-10 text-center">
                        <input type="checkbox" className="w-3.5 h-3.5 rounded-sm border-input cursor-pointer" />
                      </th>
                      <th className="px-4 py-3 text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Message</th>
                      <th className="px-4 py-3 text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Channel</th>
                      <th className="px-4 py-3 text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Status</th>
                      <th className="px-4 py-3 text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Target</th>
                      <th className="px-4 py-3 text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Stat (S/D/R/F)</th>
                      <th className="px-4 py-3 text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Date</th>
                      <th className="px-4 py-3 text-[11px] font-bold text-muted-foreground uppercase tracking-wider text-right w-28">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(broadcasts as any[]).map((bc: any) => (
                      <tr key={bc.id} className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors">
                        <td className="px-4 py-3 text-center">
                          <input type="checkbox" className="w-3.5 h-3.5 rounded-sm border-input cursor-pointer" />
                        </td>
                        <td className="px-4 py-3">
                          <div className="min-w-0">
                            <p className="text-sm font-semibold text-foreground leading-tight">{bc.name || "Message Title"}</p>
                            <p className="text-xs text-muted-foreground mt-0.5 truncate max-w-[260px]">{bc.content || "Reminder: Your subscription renews..."}</p>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span className={cn(
                            "inline-flex items-center px-2 py-0.5 rounded-sm text-[11px] font-semibold lowercase",
                            CHANNEL_PILL[bc.port as ChannelType] || CHANNEL_PILL.smpp,
                          )}>
                            {CHANNEL_LABEL[bc.port as ChannelType] || bc.port}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className={cn(
                            "inline-flex items-center px-2 py-0.5 rounded-sm text-[11px] font-semibold capitalize",
                            STATUS_PILL[bc.status as MessageStatus] || STATUS_PILL.sent,
                          )}>
                            {bc.status}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-xs font-medium text-muted-foreground">
                            {(groups as any[]).find((g: any) => g.id === bc.targetGroupId)?.name || "All Contacts"}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex gap-4">
                            {[
                              { label: "S", value: bc.stats.sent, color: "bg-muted-foreground/60" },
                              { label: "D", value: bc.stats.delivered, color: "bg-emerald-500" },
                              { label: "R", value: bc.stats.read, color: "bg-blue-500" },
                              { label: "F", value: bc.stats.failed, color: "bg-rose-500" },
                            ].map((stat, i) => (
                              <div key={i} className="flex flex-col items-center gap-1">
                                <div className="flex items-center gap-1.5">
                                  <div className={cn("w-1.5 h-1.5 rounded-full", stat.color)} />
                                  <span className="text-xs font-bold text-foreground">{stat.value}</span>
                                </div>
                                <span className="text-[8px] font-black text-muted-foreground uppercase opacity-40">{stat.label}</span>
                              </div>
                            ))}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-xs text-muted-foreground tabular-nums whitespace-nowrap">
                          {formatMsgTime(bc.createdAt)}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="inline-flex items-center gap-0.5">
                            <button className="p-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-sm transition-all">
                              <Eye className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => onEditBroadcast && onEditBroadcast(bc)}
                              className="p-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-sm transition-all"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => onDeleteBroadcast && onDeleteBroadcast(bc.id)}
                              className="p-2 text-muted-foreground hover:text-destructive hover:bg-destructive/5 rounded-sm transition-all"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
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
            filteredTemplates={templates}
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
          onSend={(broadcast: any) => {
            if (onCreateBroadcast) onCreateBroadcast(broadcast);
            else toast.success("Broadcast sent successfully!");
            setIsNewBroadcastFlowOpen(false);
          }}
        />
      </Modal>
    </div>
  );
};
