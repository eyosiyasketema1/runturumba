import React, { useState, useMemo, useEffect, useRef } from "react";
import ReactDOM from "react-dom";
import {
  Plus, Search, Trash2, Check, X, AlertTriangle,
  Wifi, WifiOff, Activity, ArrowUp, ArrowDown,
  Copy, RefreshCw, Signal, Edit2, Eye, EyeOff,
  TestTube, Send, Clock, BarChart3, ChevronRight, ChevronLeft,
  Shield, Loader2, CircleCheck,
  CircleX, Info, Ellipsis, Bot,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { toast } from "sonner";
import {
  cn, type DeliveryChannel, type ChannelType, type ChannelStatus,
  type ChatEndpoint, type ConversationRule, type User, type TeamGroup,
  type Group, type Contact,
  CHANNEL_TYPES, formatTimeAgo
} from "./types";
import { ChatEndpointsView } from "./chat-endpoints-view";
import { Card, CardContent } from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Badge } from "./ui/badge";
import { Separator } from "./ui/separator";
import { Switch } from "./ui/switch";
import { Modal } from "./shared-ui";

// ============================================================
// Constants
// ============================================================

const statusConfig: Record<ChannelStatus, { label: string; color: string; bgColor: string; icon: any }> = {
  connected: { label: "Connected", color: "text-emerald-600", bgColor: "bg-emerald-50 border-emerald-200", icon: Wifi },
  disconnected: { label: "Disconnected", color: "text-muted-foreground", bgColor: "bg-muted border-border", icon: WifiOff },
  error: { label: "Error", color: "text-destructive", bgColor: "bg-destructive/5 border-destructive/20", icon: AlertTriangle },
  rate_limited: { label: "Rate Limited", color: "text-amber-600", bgColor: "bg-amber-50 border-amber-200", icon: Activity },
};

// Per-channel-type credential fields
const CHANNEL_CONFIG_FIELDS: Record<ChannelType, { key: string; label: string; placeholder: string; sensitive?: boolean; hint?: string }[]> = {
  whatsapp: [
    { key: "phoneNumber", label: "Business Phone Number", placeholder: "+1 555-0100", hint: "Include country code" },
    { key: "businessId", label: "WhatsApp Business Account ID", placeholder: "waba-123456" },
    { key: "apiKey", label: "API Key", placeholder: "whsk_live_...", sensitive: true },
  ],
  sms: [
    { key: "provider", label: "SMS Provider", placeholder: "e.g. Twilio, Vonage, Africa's Talking" },
    { key: "accountSid", label: "Account SID / API Key", placeholder: "AC..." },
    { key: "authToken", label: "Auth Token", placeholder: "Enter auth token", sensitive: true },
    { key: "fromNumber", label: "Sender Number", placeholder: "+15551234567" },
  ],
  email: [
    { key: "smtpHost", label: "SMTP Host", placeholder: "smtp.yourprovider.com" },
    { key: "smtpPort", label: "SMTP Port", placeholder: "587" },
    { key: "username", label: "Username", placeholder: "user@company.com" },
    { key: "password", label: "Password", placeholder: "Enter password", sensitive: true },
    { key: "fromAddress", label: "From Address", placeholder: "noreply@company.com" },
  ],
  telegram: [
    { key: "botToken", label: "Bot Token (from @BotFather)", placeholder: "123456789:AABBC...", sensitive: true },
    { key: "botUsername", label: "Bot Username", placeholder: "@YourBot" },
    { key: "webhookUrl", label: "Webhook URL (optional)", placeholder: "https://yourdomain.com/webhook" },
  ],
  messenger: [
    { key: "pageId", label: "Facebook Page ID", placeholder: "123456789" },
    { key: "appId", label: "App ID", placeholder: "987654321" },
    { key: "accessToken", label: "Page Access Token", placeholder: "EAABsbC...", sensitive: true },
    { key: "verifyToken", label: "Verify Token", placeholder: "your_verify_token", sensitive: true },
  ],
  smpp: [
    { key: "host", label: "SMSC Host", placeholder: "smsc.provider.com" },
    { key: "port", label: "SMSC Port", placeholder: "2775" },
    { key: "systemId", label: "System ID", placeholder: "your_system_id" },
    { key: "password", label: "Password", placeholder: "Enter password", sensitive: true },
    { key: "systemType", label: "System Type (optional)", placeholder: "transceiver" },
  ],
};

type SortKey = "name" | "status" | "sent" | "delivery" | "lastActive";
type SortDir = "asc" | "desc";

// ============================================================
// Props
// ============================================================

interface ChannelsViewProps {
  // ── Delivery Channels ──
  channels: DeliveryChannel[];
  onAddChannel: (channel: Omit<DeliveryChannel, "id" | "createdAt" | "stats">) => void;
  onUpdateChannel: (id: string, data: Partial<DeliveryChannel>) => void;
  onDeleteChannel: (id: string) => void;
  onToggleChannel: (id: string) => void;

  // ── Chat Endpoints (embedded panel) ──
  chatEndpoints: ChatEndpoint[];
  conversationRules: ConversationRule[];
  users: User[];
  teamGroups: TeamGroup[];
  groups: Group[];
  contacts: Contact[];
  onAddEndpoint: (data: Partial<ChatEndpoint>) => void;
  onUpdateEndpoint: (id: string, data: Partial<ChatEndpoint>) => void;
  onDeleteEndpoint: (id: string) => void;
  onAddRule: (data: Partial<ConversationRule>) => void;
  onUpdateRule: (id: string, data: Partial<ConversationRule>) => void;
  onDeleteRule: (id: string) => void;
  onReorderRules: (rules: ConversationRule[]) => void;
}

// ============================================================
// Main View
// ============================================================

export const ChannelsView = ({
  channels,
  onAddChannel,
  onUpdateChannel,
  onDeleteChannel,
  onToggleChannel,
  chatEndpoints,
  conversationRules,
  users,
  teamGroups,
  groups,
  contacts,
  onAddEndpoint,
  onUpdateEndpoint,
  onDeleteEndpoint,
  onAddRule,
  onUpdateRule,
  onDeleteRule,
  onReorderRules,
}: ChannelsViewProps) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<ChannelType | "all">("all");
  const [statusFilter, setStatusFilter] = useState<ChannelStatus | "all">("all");
  const [sortKey, setSortKey] = useState<SortKey>("name");
  const [sortDir, setSortDir] = useState<SortDir>("asc");

  // Chat Endpoints panel
  const [isChatEndpointsOpen, setIsChatEndpointsOpen] = useState(false);

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingChannel, setEditingChannel] = useState<DeliveryChannel | null>(null);
  const [detailChannel, setDetailChannel] = useState<DeliveryChannel | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [testingChannel, setTestingChannel] = useState<DeliveryChannel | null>(null);

  // Keep detail modal synced with live channel data
  const liveDetailChannel = useMemo(() => {
    if (!detailChannel) return null;
    return channels.find(c => c.id === detailChannel.id) || null;
  }, [detailChannel, channels]);

  const liveEditingChannel = useMemo(() => {
    if (!editingChannel) return null;
    return channels.find(c => c.id === editingChannel.id) || null;
  }, [editingChannel, channels]);

  // Filtering + sorting
  const filtered = useMemo(() => {
    let list = channels.filter(ch => {
      const q = searchQuery.toLowerCase();
      const matchesSearch = !q || ch.name.toLowerCase().includes(q) ||
        ch.type.toLowerCase().includes(q) ||
        (ch.senderName || "").toLowerCase().includes(q);
      const matchesType = typeFilter === "all" || ch.type === typeFilter;
      const matchesStatus = statusFilter === "all" || ch.status === statusFilter;
      return matchesSearch && matchesType && matchesStatus;
    });

    list.sort((a, b) => {
      let cmp = 0;
      switch (sortKey) {
        case "name": cmp = a.name.localeCompare(b.name); break;
        case "status": cmp = a.status.localeCompare(b.status); break;
        case "sent": cmp = a.stats.sent - b.stats.sent; break;
        case "delivery": {
          const rA = a.stats.sent > 0 ? a.stats.delivered / a.stats.sent : 0;
          const rB = b.stats.sent > 0 ? b.stats.delivered / b.stats.sent : 0;
          cmp = rA - rB;
          break;
        }
        case "lastActive": cmp = (a.lastActiveAt || "").localeCompare(b.lastActiveAt || ""); break;
      }
      return sortDir === "asc" ? cmp : -cmp;
    });

    return list;
  }, [channels, searchQuery, typeFilter, statusFilter, sortKey, sortDir]);

  // Stats
  const connectedCount = channels.filter(c => c.status === "connected" && c.enabled).length;
  const totalSent = channels.reduce((sum, ch) => sum + ch.stats.sent, 0);
  const totalDelivered = channels.reduce((sum, ch) => sum + ch.stats.delivered, 0);
  const totalFailed = channels.reduce((sum, ch) => sum + ch.stats.failed, 0);
  const deliveryRate = totalSent > 0 ? Math.round((totalDelivered / totalSent) * 100) : 0;
  const errorCount = channels.filter(c => c.status === "error").length;

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir(d => d === "asc" ? "desc" : "asc");
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  };

  const handleDuplicate = (ch: DeliveryChannel) => {
    onAddChannel({
      tenantId: ch.tenantId,
      name: `${ch.name} (Copy)`,
      type: ch.type,
      status: "disconnected",
      enabled: false,
      config: { ...ch.config },
      senderName: ch.senderName,
      defaultCountryCode: ch.defaultCountryCode,
      rateLimit: ch.rateLimit,
      priority: ch.priority,
    });
    toast.success(`Duplicated "${ch.name}"`);
  };

  return (
    <div className="space-y-8 p-6 lg:p-10 animate-in fade-in duration-500 relative">

      {/* ── Chat Endpoints Full-Page Overlay (portalled to body to escape stacking context) ── */}
      {ReactDOM.createPortal(
        <AnimatePresence>
        {isChatEndpointsOpen && (
          <motion.div
            key="chat-endpoints-panel"
            initial={{ opacity: 0, x: 32 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 32 }}
            transition={{ duration: 0.22, ease: "easeOut" }}
            className="fixed inset-0 z-[9999] bg-background flex flex-col"
          >
            {/* Panel top-nav */}
            <div className="shrink-0 border-b border-border bg-background px-5 py-3 flex items-center gap-3">
              <button
                onClick={() => setIsChatEndpointsOpen(false)}
                className="flex items-center gap-1.5 text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
                Channels
              </button>
              <span className="text-muted-foreground/40 text-sm">/</span>
              <div className="flex items-center gap-2">
                <Bot className="w-4 h-4 text-primary" />
                <span className="text-sm font-bold text-foreground">Chat Endpoints</span>
              </div>
              <div className="ml-auto flex items-center gap-2">
                <span className="text-xs text-muted-foreground hidden sm:block">
                  {chatEndpoints.length} endpoint{chatEndpoints.length !== 1 ? "s" : ""} · {conversationRules.length} rule{conversationRules.length !== 1 ? "s" : ""}
                </span>
                <button
                  onClick={() => setIsChatEndpointsOpen(false)}
                  className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                  title="Close"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Panel scrollable content */}
            <div className="flex-1 overflow-y-auto custom-scrollbar">
              <ChatEndpointsView
                chatEndpoints={chatEndpoints}
                conversationRules={conversationRules}
                users={users}
                teamGroups={teamGroups}
                groups={groups}
                contacts={contacts}
                onAddEndpoint={onAddEndpoint}
                onUpdateEndpoint={onUpdateEndpoint}
                onDeleteEndpoint={onDeleteEndpoint}
                onAddRule={onAddRule}
                onUpdateRule={onUpdateRule}
                onDeleteRule={onDeleteRule}
                onReorderRules={onReorderRules}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>,
      document.body
      )}

      {/* Header */}
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Delivery Channels</h1>
          <p className="text-muted-foreground text-sm mt-1">Manage your messaging connections — SMS, WhatsApp, Telegram, Email, and more.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => setIsChatEndpointsOpen(true)}>
            <Bot className="w-4 h-4 mr-2" />
            Chat Endpoints
            {chatEndpoints.length > 0 && (
              <span className="ml-1.5 inline-flex items-center justify-center w-5 h-5 text-[10px] font-bold bg-primary/10 text-primary border border-primary/20">
                {chatEndpoints.length}
              </span>
            )}
          </Button>
          <Button onClick={() => setIsAddModalOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Add Channel
          </Button>
        </div>
      </header>

      {/* Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {[
          { label: "Active", value: connectedCount, sub: `of ${channels.length} total`, accent: "" },
          { label: "Sent", value: totalSent.toLocaleString(), sub: "All time", accent: "" },
          { label: "Delivery Rate", value: `${deliveryRate}%`, sub: `${totalDelivered.toLocaleString()} delivered`, accent: "text-emerald-600" },
          { label: "Failed", value: totalFailed.toLocaleString(), sub: "Across all channels", accent: totalFailed > 0 ? "text-destructive" : "" },
          { label: "Errors", value: errorCount, sub: "Need attention", accent: errorCount > 0 ? "text-destructive" : "" },
        ].map((stat) => (
          <Card key={stat.label}>
            <CardContent className="p-4">
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{stat.label}</p>
              <p className={cn("text-2xl font-bold mt-1", stat.accent || "text-foreground")}>{stat.value}</p>
              <p className="text-[11px] text-muted-foreground">{stat.sub}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-3">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search channels..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 h-9 text-sm"
            />
          </div>
          {/* Type filter */}
          <div className="flex gap-1 p-1 bg-muted border border-border overflow-x-auto">
            <FilterButton active={typeFilter === "all"} onClick={() => setTypeFilter("all")}>All Types</FilterButton>
            {CHANNEL_TYPES.map(ct => (
              <FilterButton key={ct.id} active={typeFilter === ct.id} onClick={() => setTypeFilter(ct.id)}>
                <ct.icon className="w-3 h-3" />
                {ct.label}
              </FilterButton>
            ))}
          </div>
        </div>
        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          {/* Status filter */}
          <div className="flex gap-1 p-1 bg-muted border border-border">
            <FilterButton active={statusFilter === "all"} onClick={() => setStatusFilter("all")}>All Status</FilterButton>
            {(Object.keys(statusConfig) as ChannelStatus[]).map(s => {
              const cfg = statusConfig[s];
              return (
                <FilterButton key={s} active={statusFilter === s} onClick={() => setStatusFilter(s)}>
                  <cfg.icon className="w-3 h-3" />
                  {cfg.label}
                </FilterButton>
              );
            })}
          </div>
          {/* Sort */}
          <div className="flex items-center gap-1 ml-auto">
            <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mr-1">Sort:</span>
            {([
              { key: "name" as SortKey, label: "Name" },
              { key: "status" as SortKey, label: "Status" },
              { key: "sent" as SortKey, label: "Sent" },
              { key: "delivery" as SortKey, label: "Delivery" },
              { key: "lastActive" as SortKey, label: "Activity" },
            ]).map(s => (
              <button
                key={s.key}
                onClick={() => toggleSort(s.key)}
                className={cn(
                  "flex items-center gap-1 px-2 py-1 text-[11px] font-semibold transition-all",
                  sortKey === s.key ? "text-foreground" : "text-muted-foreground hover:text-foreground"
                )}
              >
                {s.label}
                {sortKey === s.key && (
                  sortDir === "asc" ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Channel Cards */}
      <div className="space-y-3">
        <AnimatePresence>
          {filtered.length === 0 ? (
            <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <Card>
                <CardContent className="p-12 text-center">
                  <Signal className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
                  <p className="text-sm font-medium text-muted-foreground">No channels found</p>
                  <p className="text-xs text-muted-foreground/70 mt-1">Try adjusting your filters or add a new channel.</p>
                  <Button size="sm" className="mt-4" onClick={() => setIsAddModalOpen(true)}>
                    <Plus className="w-3.5 h-3.5 mr-1.5" /> Add Channel
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          ) : (
            filtered.map((channel) => (
              <ChannelRow
                key={channel.id}
                channel={channel}
                onToggle={() => onToggleChannel(channel.id)}
                onDetail={() => setDetailChannel(channel)}
                onEdit={() => setEditingChannel(channel)}
                onDelete={() => setDeleteConfirmId(channel.id)}
                onDuplicate={() => handleDuplicate(channel)}
                onTest={() => setTestingChannel(channel)}
              />
            ))
          )}
        </AnimatePresence>
      </div>

      {/* ===== Modals ===== */}

      {/* Add Channel */}
      <AddChannelModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onAdd={(data) => { onAddChannel(data); setIsAddModalOpen(false); }}
      />

      {/* Edit Channel */}
      {liveEditingChannel && (
        <EditChannelModal
          isOpen={!!editingChannel}
          onClose={() => setEditingChannel(null)}
          channel={liveEditingChannel}
          onSave={(data) => { onUpdateChannel(liveEditingChannel.id, data); setEditingChannel(null); }}
        />
      )}

      {/* Channel Detail */}
      {liveDetailChannel && (
        <ChannelDetailDrawer
          isOpen={!!detailChannel}
          onClose={() => setDetailChannel(null)}
          channel={liveDetailChannel}
          onToggle={() => onToggleChannel(liveDetailChannel.id)}
          onEdit={() => { setDetailChannel(null); setTimeout(() => setEditingChannel(liveDetailChannel), 150); }}
          onDelete={() => { setDetailChannel(null); setDeleteConfirmId(liveDetailChannel.id); }}
          onDuplicate={() => handleDuplicate(liveDetailChannel)}
          onTest={() => { setDetailChannel(null); setTimeout(() => setTestingChannel(liveDetailChannel), 150); }}
          onReconnect={() => {
            onUpdateChannel(liveDetailChannel.id, { status: "connected", lastActiveAt: new Date().toISOString() });
            toast.success(`${liveDetailChannel.name} reconnected`);
          }}
        />
      )}

      {/* Delete Confirmation */}
      <DeleteConfirmModal
        isOpen={!!deleteConfirmId}
        channelName={channels.find(c => c.id === deleteConfirmId)?.name || ""}
        onClose={() => setDeleteConfirmId(null)}
        onConfirm={() => {
          if (deleteConfirmId) {
            onDeleteChannel(deleteConfirmId);
            toast.success("Channel removed");
          }
          setDeleteConfirmId(null);
        }}
      />

      {/* Test Connection */}
      {testingChannel && (
        <TestChannelModal
          isOpen={!!testingChannel}
          onClose={() => setTestingChannel(null)}
          channel={testingChannel}
          onStatusChange={(status) => onUpdateChannel(testingChannel.id, { status, lastActiveAt: new Date().toISOString() })}
        />
      )}
    </div>
  );
};


// ============================================================
// Shared tiny components
// ============================================================

const FilterButton = ({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) => (
  <button
    onClick={onClick}
    className={cn(
      "px-2.5 py-1.5 text-[11px] font-semibold transition-all flex items-center gap-1.5 whitespace-nowrap shrink-0",
      active ? "bg-background text-foreground shadow-sm border border-border" : "text-muted-foreground hover:text-foreground"
    )}
  >
    {children}
  </button>
);

const SensitiveField = ({ value }: { value: string }) => {
  const [visible, setVisible] = useState(false);
  if (!value) return <span className="text-muted-foreground/50 text-xs italic">Not set</span>;
  return (
    <span className="flex items-center gap-1.5 font-mono text-xs">
      {visible ? value : "•".repeat(Math.min(value.length, 16))}
      <button onClick={() => setVisible(!visible)} className="text-muted-foreground hover:text-foreground">
        {visible ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
      </button>
    </span>
  );
};


// ============================================================
// Channel Row Card
// ============================================================

const ChannelRow = ({ channel, onToggle, onDetail, onEdit, onDelete, onDuplicate, onTest }: {
  channel: DeliveryChannel;
  onToggle: () => void;
  onDetail: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onDuplicate: () => void;
  onTest: () => void;
}) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const typeInfo = CHANNEL_TYPES.find(ct => ct.id === channel.type);
  const statusInfo = statusConfig[channel.status];
  const StatusIcon = statusInfo.icon;
  const chDeliveryRate = channel.stats.sent > 0 ? Math.round((channel.stats.delivered / channel.stats.sent) * 100) : 0;

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false);
    };
    if (menuOpen) document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [menuOpen]);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.2 }}
    >
      <Card
        className={cn("transition-all hover:shadow-md cursor-pointer group", !channel.enabled && "opacity-60")}
        onClick={onDetail}
      >
        <CardContent className="p-5">
          <div className="flex items-center gap-4">
            {/* Icon */}
            <div className={cn("w-11 h-11 flex items-center justify-center shrink-0 border relative", typeInfo?.bgColor, typeInfo?.borderColor)}>
              {typeInfo && <typeInfo.icon className={cn("w-5 h-5", typeInfo.color)} />}
              {/* Connection dot */}
              <span className={cn(
                "absolute -bottom-0.5 -right-0.5 w-3 h-3 border-2 border-background rounded-full",
                channel.status === "connected" ? "bg-emerald-500" :
                channel.status === "error" ? "bg-destructive" :
                channel.status === "rate_limited" ? "bg-amber-500" : "bg-muted-foreground/40"
              )} />
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className="text-sm font-semibold text-foreground truncate">{channel.name}</p>
                <Badge variant="outline" className={cn("text-[9px] border", statusInfo.bgColor, statusInfo.color)}>
                  <StatusIcon className="w-2.5 h-2.5 mr-1" />
                  {statusInfo.label}
                </Badge>
                {!channel.enabled && <Badge variant="secondary" className="text-[9px]">Disabled</Badge>}
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                {typeInfo?.label} &middot; {channel.senderName || "No sender name"}
                {channel.lastActiveAt && <> &middot; Active {formatTimeAgo(channel.lastActiveAt)}</>}
              </p>
            </div>

            {/* Stats */}
            <div className="hidden md:flex items-center gap-6 text-center">
              <div>
                <p className="text-xs font-bold text-foreground">{channel.stats.sent.toLocaleString()}</p>
                <p className="text-[10px] text-muted-foreground">Sent</p>
              </div>
              <div>
                <p className={cn("text-xs font-bold", chDeliveryRate >= 90 ? "text-emerald-600" : chDeliveryRate >= 70 ? "text-amber-600" : "text-foreground")}>{chDeliveryRate}%</p>
                <p className="text-[10px] text-muted-foreground">Delivery</p>
              </div>
              <div>
                <p className={cn("text-xs font-bold", channel.stats.failed > 0 ? "text-destructive" : "text-foreground")}>{channel.stats.failed}</p>
                <p className="text-[10px] text-muted-foreground">Failed</p>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2" onClick={e => e.stopPropagation()}>
              <Switch checked={channel.enabled} onCheckedChange={onToggle} />
              {/* Context menu */}
              <div className="relative" ref={menuRef}>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => setMenuOpen(!menuOpen)}>
                  <Ellipsis className="w-4 h-4 text-muted-foreground" />
                </Button>
                <AnimatePresence>
                  {menuOpen && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95, y: -4 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95, y: -4 }}
                      transition={{ duration: 0.12 }}
                      className="absolute right-0 top-full mt-1 w-48 bg-popover border border-border shadow-lg z-50"
                    >
                      <div className="py-1">
                        <MenuButton icon={Eye} label="View Details" onClick={() => { setMenuOpen(false); onDetail(); }} />
                        <MenuButton icon={Edit2} label="Edit Channel" onClick={() => { setMenuOpen(false); onEdit(); }} />
                        <MenuButton icon={TestTube} label="Test Connection" onClick={() => { setMenuOpen(false); onTest(); }} />
                        <MenuButton icon={Copy} label="Duplicate" onClick={() => { setMenuOpen(false); onDuplicate(); }} />
                        <Separator className="my-1" />
                        <MenuButton icon={Trash2} label="Delete Channel" onClick={() => { setMenuOpen(false); onDelete(); }} destructive />
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

const MenuButton = ({ icon: Icon, label, onClick, destructive }: { icon: any; label: string; onClick: () => void; destructive?: boolean }) => (
  <button
    onClick={onClick}
    className={cn(
      "w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium transition-colors text-left",
      destructive ? "text-destructive hover:bg-destructive/5" : "text-foreground hover:bg-muted"
    )}
  >
    <Icon className="w-3.5 h-3.5" />
    {label}
  </button>
);


// ============================================================
// Add Channel Modal (3-step: Select Type → Credentials → Summary)
// ============================================================

const AddChannelModal = ({ isOpen, onClose, onAdd }: {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (data: any) => void;
}) => {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [selectedType, setSelectedType] = useState<ChannelType | null>(null);
  const [name, setName] = useState("");
  const [senderName, setSenderName] = useState("");
  const [rateLimit, setRateLimit] = useState("");
  const [priority, setPriority] = useState("");
  const [countryCode, setCountryCode] = useState("");
  const [config, setConfig] = useState<Record<string, string>>({});

  const reset = () => {
    setStep(1); setSelectedType(null); setName(""); setSenderName("");
    setRateLimit(""); setPriority(""); setCountryCode(""); setConfig({});
  };

  const handleClose = () => { reset(); onClose(); };

  const handleSubmit = () => {
    if (!selectedType || !name.trim()) return;
    onAdd({
      tenantId: "tenant-1",
      name: name.trim(),
      type: selectedType,
      status: "disconnected" as ChannelStatus,
      enabled: false,
      config,
      senderName: senderName.trim() || undefined,
      rateLimit: rateLimit ? parseInt(rateLimit) : undefined,
      priority: priority ? parseInt(priority) : undefined,
      defaultCountryCode: countryCode.trim() || undefined,
    });
    toast.success(`"${name}" channel created`);
    reset();
    onClose();
  };

  const fields = selectedType ? CHANNEL_CONFIG_FIELDS[selectedType] : [];
  const typeInfo = selectedType ? CHANNEL_TYPES.find(c => c.id === selectedType) : null;

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Add Delivery Channel" size="2xl">
      {/* Progress */}
      <div className="flex items-center gap-2 mb-6">
        {[
          { n: 1, label: "Channel Type" },
          { n: 2, label: "Configuration" },
          { n: 3, label: "Review" },
        ].map((s, i) => (
          <div key={s.n} className="contents">
            <div className="flex items-center gap-1.5">
              <div className={cn(
                "w-6 h-6 flex items-center justify-center text-[10px] font-bold border transition-all",
                step > s.n ? "bg-primary text-primary-foreground border-primary" :
                step === s.n ? "border-foreground text-foreground" : "border-muted-foreground/30 text-muted-foreground/40"
              )}>
                {step > s.n ? <Check className="w-3 h-3" /> : s.n}
              </div>
              <span className={cn("text-xs font-semibold", step >= s.n ? "text-foreground" : "text-muted-foreground/40")}>{s.label}</span>
            </div>
            {i < 2 && <div className={cn("flex-1 h-px", step > s.n ? "bg-primary" : "bg-border")} />}
          </div>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {/* Step 1: Type selection */}
        {step === 1 && (
          <motion.div key="s1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.2 }}>
            <p className="text-sm text-muted-foreground mb-4">Select the messaging platform to connect.</p>
            <div className="grid grid-cols-2 gap-3">
              {CHANNEL_TYPES.map(ct => (
                <button
                  key={ct.id}
                  onClick={() => { setSelectedType(ct.id); setStep(2); }}
                  className="flex items-start gap-3 p-4 border text-left transition-all hover:border-primary/40 hover:bg-muted/30"
                >
                  <div className={cn("w-10 h-10 flex items-center justify-center shrink-0 border", ct.bgColor, ct.borderColor)}>
                    <ct.icon className={cn("w-5 h-5", ct.color)} />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-foreground">{ct.label}</p>
                    <p className="text-[11px] text-muted-foreground mt-0.5">{ct.description}</p>
                  </div>
                </button>
              ))}
            </div>
          </motion.div>
        )}

        {/* Step 2: Config */}
        {step === 2 && (
          <motion.div key="s2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.2 }}>
            <button onClick={() => setStep(1)} className="text-xs text-primary font-semibold hover:underline mb-4 block">
              &larr; Change channel type
            </button>
            {typeInfo && (
              <div className="flex items-center gap-3 p-3 bg-muted/30 border mb-6">
                <div className={cn("w-8 h-8 flex items-center justify-center border", typeInfo.bgColor, typeInfo.borderColor)}>
                  <typeInfo.icon className={cn("w-4 h-4", typeInfo.color)} />
                </div>
                <div>
                  <p className="text-sm font-semibold">{typeInfo.label}</p>
                  <p className="text-[11px] text-muted-foreground">{typeInfo.description}</p>
                </div>
              </div>
            )}

            <div className="space-y-4 max-h-[50vh] overflow-y-auto pr-1">
              {/* Basics */}
              <div className="grid gap-2">
                <Label className="text-xs font-semibold">Channel Name <span className="text-destructive">*</span></Label>
                <Input placeholder="e.g. Main WhatsApp, Support SMS" value={name} onChange={e => setName(e.target.value)} className="h-9 text-sm" />
              </div>
              <div className="grid gap-2">
                <Label className="text-xs font-semibold">Sender Name</Label>
                <Input placeholder="e.g. Acme Corp, support@acme.com" value={senderName} onChange={e => setSenderName(e.target.value)} className="h-9 text-sm" />
                <p className="text-[11px] text-muted-foreground">The name or number recipients will see.</p>
              </div>

              <Separator />

              {/* Credentials */}
              <h4 className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Credentials & API Settings</h4>
              {fields.map(f => (
                <div key={f.key} className="grid gap-2">
                  <Label className="text-xs font-semibold">{f.label}</Label>
                  <Input
                    type={f.sensitive ? "password" : "text"}
                    placeholder={f.placeholder}
                    value={config[f.key] || ""}
                    onChange={e => setConfig(prev => ({ ...prev, [f.key]: e.target.value }))}
                    className="h-9 text-sm"
                  />
                  {f.hint && <p className="text-[11px] text-muted-foreground">{f.hint}</p>}
                </div>
              ))}

              <Separator />

              {/* Advanced */}
              <h4 className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Advanced Options</h4>
              <div className="grid grid-cols-3 gap-3">
                <div className="grid gap-2">
                  <Label className="text-xs font-semibold">Rate Limit</Label>
                  <Input type="number" placeholder="msg/hr" value={rateLimit} onChange={e => setRateLimit(e.target.value)} className="h-9 text-sm" />
                </div>
                <div className="grid gap-2">
                  <Label className="text-xs font-semibold">Priority</Label>
                  <Input type="number" placeholder="1-10" value={priority} onChange={e => setPriority(e.target.value)} className="h-9 text-sm" />
                </div>
                <div className="grid gap-2">
                  <Label className="text-xs font-semibold">Country Code</Label>
                  <Input placeholder="+1" value={countryCode} onChange={e => setCountryCode(e.target.value)} className="h-9 text-sm" />
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-4 mt-4 border-t">
              <Button variant="outline" size="sm" onClick={handleClose}>Cancel</Button>
              <Button size="sm" disabled={!name.trim()} onClick={() => setStep(3)}>
                Review <ChevronRight className="w-3.5 h-3.5 ml-1" />
              </Button>
            </div>
          </motion.div>
        )}

        {/* Step 3: Review */}
        {step === 3 && (
          <motion.div key="s3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.2 }}>
            <button onClick={() => setStep(2)} className="text-xs text-primary font-semibold hover:underline mb-4 block">
              &larr; Back to configuration
            </button>

            <div className="space-y-4">
              <div className="p-4 border bg-muted/20">
                <div className="flex items-center gap-3 mb-4">
                  {typeInfo && (
                    <div className={cn("w-10 h-10 flex items-center justify-center border", typeInfo.bgColor, typeInfo.borderColor)}>
                      <typeInfo.icon className={cn("w-5 h-5", typeInfo.color)} />
                    </div>
                  )}
                  <div>
                    <p className="text-sm font-bold text-foreground">{name || "Unnamed Channel"}</p>
                    <p className="text-[11px] text-muted-foreground">{typeInfo?.label} &middot; {senderName || "No sender name"}</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {fields.filter(f => config[f.key]).map(f => (
                    <div key={f.key} className="flex justify-between text-xs py-1">
                      <span className="text-muted-foreground">{f.label}</span>
                      {f.sensitive
                        ? <span className="font-mono text-foreground">{"•".repeat(8)}</span>
                        : <span className="font-mono text-foreground truncate max-w-[140px]">{config[f.key]}</span>}
                    </div>
                  ))}
                  {rateLimit && (
                    <div className="flex justify-between text-xs py-1">
                      <span className="text-muted-foreground">Rate Limit</span>
                      <span className="text-foreground">{rateLimit} msg/hr</span>
                    </div>
                  )}
                  {priority && (
                    <div className="flex justify-between text-xs py-1">
                      <span className="text-muted-foreground">Priority</span>
                      <span className="text-foreground">#{priority}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="p-3 bg-amber-50 border border-amber-200">
                <p className="text-[11px] text-amber-700">
                  <AlertTriangle className="w-3 h-3 inline mr-1 -mt-0.5" />
                  The channel will be created in <strong>Disconnected</strong> state. Use "Test Connection" to verify credentials, then enable the channel to go live.
                </p>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-4 mt-4 border-t">
              <Button variant="outline" size="sm" onClick={handleClose}>Cancel</Button>
              <Button size="sm" onClick={handleSubmit}>
                <Plus className="w-3.5 h-3.5 mr-1.5" />
                Create Channel
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </Modal>
  );
};


// ============================================================
// Edit Channel Modal
// ============================================================

const EditChannelModal = ({ isOpen, onClose, channel, onSave }: {
  isOpen: boolean;
  onClose: () => void;
  channel: DeliveryChannel;
  onSave: (data: Partial<DeliveryChannel>) => void;
}) => {
  const [name, setName] = useState(channel.name);
  const [senderName, setSenderName] = useState(channel.senderName || "");
  const [rateLimit, setRateLimit] = useState(channel.rateLimit?.toString() || "");
  const [priority, setPriority] = useState(channel.priority?.toString() || "");
  const [countryCode, setCountryCode] = useState(channel.defaultCountryCode || "");
  const [config, setConfig] = useState<Record<string, string>>({ ...channel.config });

  const typeInfo = CHANNEL_TYPES.find(c => c.id === channel.type);
  const fields = CHANNEL_CONFIG_FIELDS[channel.type];

  const handleSave = () => {
    onSave({
      name: name.trim(),
      senderName: senderName.trim() || undefined,
      rateLimit: rateLimit ? parseInt(rateLimit) : undefined,
      priority: priority ? parseInt(priority) : undefined,
      defaultCountryCode: countryCode.trim() || undefined,
      config,
    });
    toast.success(`"${name}" updated`);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Edit Channel" size="2xl">
      <div className="space-y-5 max-h-[65vh] overflow-y-auto pr-1">
        {/* Type header (read-only) */}
        {typeInfo && (
          <div className="flex items-center gap-3 p-3 bg-muted/30 border">
            <div className={cn("w-8 h-8 flex items-center justify-center border", typeInfo.bgColor, typeInfo.borderColor)}>
              <typeInfo.icon className={cn("w-4 h-4", typeInfo.color)} />
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold">{typeInfo.label}</p>
              <p className="text-[11px] text-muted-foreground">{typeInfo.description}</p>
            </div>
            <Badge variant="secondary" className="text-[9px]">Type cannot be changed</Badge>
          </div>
        )}

        {/* Basics */}
        <div className="grid gap-2">
          <Label className="text-xs font-semibold">Channel Name</Label>
          <Input value={name} onChange={e => setName(e.target.value)} className="h-9 text-sm" />
        </div>
        <div className="grid gap-2">
          <Label className="text-xs font-semibold">Sender Name</Label>
          <Input value={senderName} onChange={e => setSenderName(e.target.value)} className="h-9 text-sm" />
        </div>

        <Separator />

        {/* Credentials */}
        <h4 className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Credentials & API Settings</h4>
        {fields.map(f => (
          <div key={f.key} className="grid gap-2">
            <Label className="text-xs font-semibold">{f.label}</Label>
            <Input
              type={f.sensitive ? "password" : "text"}
              placeholder={f.placeholder}
              value={config[f.key] || ""}
              onChange={e => setConfig(prev => ({ ...prev, [f.key]: e.target.value }))}
              className="h-9 text-sm"
            />
          </div>
        ))}

        <Separator />

        {/* Advanced */}
        <h4 className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Advanced</h4>
        <div className="grid grid-cols-3 gap-3">
          <div className="grid gap-2">
            <Label className="text-xs font-semibold">Rate Limit</Label>
            <Input type="number" placeholder="msg/hr" value={rateLimit} onChange={e => setRateLimit(e.target.value)} className="h-9 text-sm" />
          </div>
          <div className="grid gap-2">
            <Label className="text-xs font-semibold">Priority</Label>
            <Input type="number" placeholder="1-10" value={priority} onChange={e => setPriority(e.target.value)} className="h-9 text-sm" />
          </div>
          <div className="grid gap-2">
            <Label className="text-xs font-semibold">Country Code</Label>
            <Input placeholder="+1" value={countryCode} onChange={e => setCountryCode(e.target.value)} className="h-9 text-sm" />
          </div>
        </div>
      </div>

      <div className="flex justify-end gap-2 pt-4 mt-4 border-t">
        <Button variant="outline" size="sm" onClick={onClose}>Cancel</Button>
        <Button size="sm" disabled={!name.trim()} onClick={handleSave}>
          <Check className="w-3.5 h-3.5 mr-1.5" />
          Save Changes
        </Button>
      </div>
    </Modal>
  );
};


// ============================================================
// Channel Detail Drawer (full detail with tabs)
// ============================================================

const ChannelDetailDrawer = ({ isOpen, onClose, channel, onToggle, onEdit, onDelete, onDuplicate, onTest, onReconnect }: {
  isOpen: boolean;
  onClose: () => void;
  channel: DeliveryChannel;
  onToggle: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onDuplicate: () => void;
  onTest: () => void;
  onReconnect: () => void;
}) => {
  const [tab, setTab] = useState<"overview" | "config" | "activity">("overview");
  const typeInfo = CHANNEL_TYPES.find(ct => ct.id === channel.type);
  const statusInfo = statusConfig[channel.status];
  const StatusIcon = statusInfo.icon;
  const deliveryRate = channel.stats.sent > 0 ? Math.round((channel.stats.delivered / channel.stats.sent) * 100) : 0;
  const fields = CHANNEL_CONFIG_FIELDS[channel.type];

  // Simulated activity log
  const activityLog = useMemo(() => {
    const base = new Date();
    return [
      { time: new Date(base.getTime() - 300000).toISOString(), event: "Message delivered", detail: `To +1555****23 via ${typeInfo?.label}`, status: "success" as const },
      { time: new Date(base.getTime() - 900000).toISOString(), event: "Message sent", detail: "Broadcast: Q1 Promo", status: "success" as const },
      { time: new Date(base.getTime() - 1800000).toISOString(), event: "Rate limit warning", detail: `Approaching ${channel.rateLimit || 1000} msg/hr limit`, status: "warning" as const },
      { time: new Date(base.getTime() - 3600000).toISOString(), event: "Connection restored", detail: "Auto-reconnect successful", status: "success" as const },
      { time: new Date(base.getTime() - 7200000).toISOString(), event: "Connection lost", detail: "Timeout after 30s", status: "error" as const },
      { time: new Date(base.getTime() - 14400000).toISOString(), event: "Message failed", detail: "Invalid recipient number", status: "error" as const },
      { time: new Date(base.getTime() - 28800000).toISOString(), event: "Channel enabled", detail: `By admin`, status: "info" as const },
      { time: new Date(base.getTime() - 43200000).toISOString(), event: "Config updated", detail: "Rate limit changed to 1000/hr", status: "info" as const },
    ];
  }, [channel, typeInfo]);

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="" size="3xl">
      <div className="space-y-6 -mt-2">
        {/* Header */}
        <div className="flex items-start gap-4">
          <div className={cn("w-14 h-14 flex items-center justify-center shrink-0 border relative", typeInfo?.bgColor, typeInfo?.borderColor)}>
            {typeInfo && <typeInfo.icon className={cn("w-7 h-7", typeInfo.color)} />}
            <span className={cn(
              "absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 border-2 border-background rounded-full",
              channel.status === "connected" ? "bg-emerald-500" :
              channel.status === "error" ? "bg-destructive" :
              channel.status === "rate_limited" ? "bg-amber-500" : "bg-muted-foreground/40"
            )} />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-bold text-foreground">{channel.name}</h3>
            <div className="flex items-center gap-2 mt-1 flex-wrap">
              <Badge variant="outline" className={cn("text-[10px] border", statusInfo.bgColor, statusInfo.color)}>
                <StatusIcon className="w-2.5 h-2.5 mr-1" />
                {statusInfo.label}
              </Badge>
              <span className="text-xs text-muted-foreground">{typeInfo?.label}</span>
              {channel.senderName && <span className="text-xs text-muted-foreground">&middot; {channel.senderName}</span>}
              {channel.createdAt && <span className="text-xs text-muted-foreground">&middot; Created {formatTimeAgo(channel.createdAt)}</span>}
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Switch checked={channel.enabled} onCheckedChange={onToggle} />
            <span className="text-xs text-muted-foreground font-medium w-14">{channel.enabled ? "Enabled" : "Disabled"}</span>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 p-1 bg-muted border border-border">
          {([
            { id: "overview" as const, label: "Overview", icon: BarChart3 },
            { id: "config" as const, label: "Configuration", icon: Shield },
            { id: "activity" as const, label: "Activity Log", icon: Clock },
          ]).map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={cn(
                "flex items-center gap-1.5 px-3 py-2 text-xs font-semibold transition-all flex-1 justify-center",
                tab === t.id ? "bg-background text-foreground shadow-sm border border-border" : "text-muted-foreground hover:text-foreground"
              )}
            >
              <t.icon className="w-3.5 h-3.5" />
              {t.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <AnimatePresence mode="wait">
          {tab === "overview" && (
            <motion.div key="overview" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-5">
              {/* Stats grid */}
              <div className="grid grid-cols-4 gap-3">
                <div className="p-3 bg-muted/30 border text-center">
                  <p className="text-xl font-bold text-foreground">{channel.stats.sent.toLocaleString()}</p>
                  <p className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider">Sent</p>
                </div>
                <div className="p-3 bg-muted/30 border text-center">
                  <p className="text-xl font-bold text-foreground">{channel.stats.delivered.toLocaleString()}</p>
                  <p className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider">Delivered</p>
                </div>
                <div className="p-3 bg-muted/30 border text-center">
                  <p className={cn("text-xl font-bold", deliveryRate >= 90 ? "text-emerald-600" : deliveryRate >= 70 ? "text-amber-600" : "text-destructive")}>{deliveryRate}%</p>
                  <p className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider">Delivery Rate</p>
                </div>
                <div className="p-3 bg-muted/30 border text-center">
                  <p className={cn("text-xl font-bold", channel.stats.failed > 0 ? "text-destructive" : "text-foreground")}>{channel.stats.failed}</p>
                  <p className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider">Failed</p>
                </div>
              </div>

              {/* Quick info */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2 p-4 border bg-muted/10">
                  <h5 className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Channel Info</h5>
                  <InfoRow label="Type" value={typeInfo?.label || channel.type} />
                  <InfoRow label="Sender" value={channel.senderName || "—"} />
                  <InfoRow label="Country Code" value={channel.defaultCountryCode || "—"} />
                  <InfoRow label="Rate Limit" value={channel.rateLimit ? `${channel.rateLimit.toLocaleString()} msg/hr` : "Unlimited"} />
                  <InfoRow label="Priority" value={channel.priority ? `#${channel.priority}` : "—"} />
                </div>
                <div className="space-y-2 p-4 border bg-muted/10">
                  <h5 className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Timeline</h5>
                  <InfoRow label="Created" value={channel.createdAt ? new Date(channel.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "—"} />
                  <InfoRow label="Last Active" value={channel.lastActiveAt ? formatTimeAgo(channel.lastActiveAt) : "Never"} />
                  <InfoRow label="Status Since" value={channel.lastActiveAt ? formatTimeAgo(channel.lastActiveAt) : "—"} />
                </div>
              </div>

              {/* Error banner */}
              {channel.status === "error" && (
                <div className="p-3 bg-destructive/5 border border-destructive/20 flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-destructive shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs font-semibold text-destructive">Connection Error</p>
                    <p className="text-[11px] text-muted-foreground mt-0.5">This channel has a connection error. Try reconnecting or verify your credentials in the Configuration tab.</p>
                  </div>
                </div>
              )}
              {channel.status === "rate_limited" && (
                <div className="p-3 bg-amber-50 border border-amber-200 flex items-start gap-2">
                  <Activity className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs font-semibold text-amber-700">Rate Limited</p>
                    <p className="text-[11px] text-amber-600/80 mt-0.5">This channel has hit its rate limit. Messages will queue until the limit resets.</p>
                  </div>
                </div>
              )}
            </motion.div>
          )}

          {tab === "config" && (
            <motion.div key="config" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-4">
              <div className="space-y-2 p-4 border bg-muted/10">
                <h5 className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-3">API Credentials</h5>
                {fields.map(f => (
                  <div key={f.key} className="flex justify-between items-center text-sm py-1.5">
                    <span className="text-muted-foreground text-xs">{f.label}</span>
                    {f.sensitive
                      ? <SensitiveField value={channel.config[f.key] || ""} />
                      : <span className="font-mono text-xs text-foreground">{channel.config[f.key] || <span className="text-muted-foreground/50 italic">Not set</span>}</span>}
                  </div>
                ))}
              </div>

              <div className="space-y-2 p-4 border bg-muted/10">
                <h5 className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-3">Delivery Settings</h5>
                <InfoRow label="Sender Name" value={channel.senderName || "—"} />
                <InfoRow label="Default Country Code" value={channel.defaultCountryCode || "—"} />
                <InfoRow label="Rate Limit" value={channel.rateLimit ? `${channel.rateLimit.toLocaleString()} msg/hr` : "Unlimited"} />
                <InfoRow label="Priority" value={channel.priority ? `#${channel.priority}` : "Default"} />
              </div>

              <Button variant="outline" size="sm" onClick={onEdit}>
                <Edit2 className="w-3.5 h-3.5 mr-1.5" />
                Edit Configuration
              </Button>
            </motion.div>
          )}

          {tab === "activity" && (
            <motion.div key="activity" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <div className="space-y-0 border">
                {activityLog.map((log, i) => (
                  <div key={i} className={cn("flex items-start gap-3 px-4 py-3 text-xs", i > 0 && "border-t")}>
                    <div className={cn(
                      "w-5 h-5 flex items-center justify-center shrink-0 mt-0.5",
                      log.status === "success" ? "text-emerald-600" :
                      log.status === "error" ? "text-destructive" :
                      log.status === "warning" ? "text-amber-600" : "text-muted-foreground"
                    )}>
                      {log.status === "success" ? <CircleCheck className="w-4 h-4" /> :
                       log.status === "error" ? <CircleX className="w-4 h-4" /> :
                       log.status === "warning" ? <AlertTriangle className="w-4 h-4" /> :
                       <Info className="w-4 h-4" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-foreground">{log.event}</p>
                      <p className="text-muted-foreground mt-0.5">{log.detail}</p>
                    </div>
                    <span className="text-[10px] text-muted-foreground shrink-0">{formatTimeAgo(log.time)}</span>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Action Bar */}
        <Separator />
        <div className="flex items-center gap-2 flex-wrap">
          <Button variant="outline" size="sm" onClick={onReconnect}>
            <RefreshCw className="w-3.5 h-3.5 mr-1.5" />
            Reconnect
          </Button>
          <Button variant="outline" size="sm" onClick={onTest}>
            <TestTube className="w-3.5 h-3.5 mr-1.5" />
            Test Connection
          </Button>
          <Button variant="outline" size="sm" onClick={onEdit}>
            <Edit2 className="w-3.5 h-3.5 mr-1.5" />
            Edit
          </Button>
          <Button variant="outline" size="sm" onClick={onDuplicate}>
            <Copy className="w-3.5 h-3.5 mr-1.5" />
            Duplicate
          </Button>
          <div className="flex-1" />
          <Button variant="destructive" size="sm" onClick={onDelete}>
            <Trash2 className="w-3.5 h-3.5 mr-1.5" />
            Remove
          </Button>
        </div>
      </div>
    </Modal>
  );
};

const InfoRow = ({ label, value }: { label: string; value: string }) => (
  <div className="flex justify-between items-center text-sm py-0.5">
    <span className="text-muted-foreground text-xs">{label}</span>
    <span className="font-medium text-foreground text-xs">{value}</span>
  </div>
);


// ============================================================
// Delete Confirmation Modal
// ============================================================

const DeleteConfirmModal = ({ isOpen, channelName, onClose, onConfirm }: {
  isOpen: boolean;
  channelName: string;
  onClose: () => void;
  onConfirm: () => void;
}) => {
  const [confirmText, setConfirmText] = useState("");
  const canDelete = confirmText.toLowerCase() === "delete";

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Delete Channel" size="sm">
      <div className="space-y-4">
        <div className="p-3 bg-destructive/5 border border-destructive/20">
          <p className="text-xs text-destructive font-medium">
            <AlertTriangle className="w-3.5 h-3.5 inline mr-1 -mt-0.5" />
            This action cannot be undone.
          </p>
        </div>
        <p className="text-sm text-muted-foreground">
          You are about to permanently delete <strong className="text-foreground">{channelName}</strong>. All associated configuration and message history will be removed.
        </p>
        <div className="grid gap-2">
          <Label className="text-xs font-semibold">Type "delete" to confirm</Label>
          <Input
            value={confirmText}
            onChange={e => setConfirmText(e.target.value)}
            placeholder="delete"
            className="h-9 text-sm"
          />
        </div>
        <div className="flex justify-end gap-2">
          <Button variant="outline" size="sm" onClick={onClose}>Cancel</Button>
          <Button variant="destructive" size="sm" disabled={!canDelete} onClick={() => { onConfirm(); setConfirmText(""); }}>
            <Trash2 className="w-3.5 h-3.5 mr-1.5" />
            Delete Channel
          </Button>
        </div>
      </div>
    </Modal>
  );
};


// ============================================================
// Test Connection Modal (animated multi-phase test)
// ============================================================

type TestPhase = "idle" | "dns" | "handshake" | "auth" | "send" | "done";
type TestResult = "pending" | "pass" | "fail";

const TEST_PHASES: { id: TestPhase; label: string; description: string }[] = [
  { id: "dns", label: "DNS Resolution", description: "Resolving endpoint hostname..." },
  { id: "handshake", label: "TLS Handshake", description: "Establishing secure connection..." },
  { id: "auth", label: "Authentication", description: "Verifying API credentials..." },
  { id: "send", label: "Test Message", description: "Sending a test ping..." },
];

const TestChannelModal = ({ isOpen, onClose, channel, onStatusChange }: {
  isOpen: boolean;
  onClose: () => void;
  channel: DeliveryChannel;
  onStatusChange: (status: ChannelStatus) => void;
}) => {
  const [phase, setPhase] = useState<TestPhase>("idle");
  const [results, setResults] = useState<Record<string, TestResult>>({});
  const [overallResult, setOverallResult] = useState<"idle" | "running" | "success" | "failed">("idle");
  const [testMessage, setTestMessage] = useState("");
  const typeInfo = CHANNEL_TYPES.find(c => c.id === channel.type);
  const timerRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  const clearTimers = () => {
    timerRef.current.forEach(t => clearTimeout(t));
    timerRef.current = [];
  };

  const runTest = () => {
    clearTimers();
    setResults({});
    setOverallResult("running");

    const hasCredentials = Object.values(channel.config).some(v => v && v.trim() && !v.startsWith("***"));
    const phases = TEST_PHASES;
    let delay = 0;

    phases.forEach((p, i) => {
      // Start phase
      const t1 = setTimeout(() => setPhase(p.id), delay);
      timerRef.current.push(t1);
      delay += 800 + Math.random() * 600;

      // Complete phase
      const t2 = setTimeout(() => {
        // Auth fails if no real credentials
        const willFail = p.id === "auth" && !hasCredentials;
        setResults(prev => ({ ...prev, [p.id]: willFail ? "fail" : "pass" }));

        if (willFail) {
          setPhase("done");
          setOverallResult("failed");
          return;
        }

        if (i === phases.length - 1) {
          setPhase("done");
          setOverallResult("success");
          onStatusChange("connected");
        }
      }, delay);
      timerRef.current.push(t2);
      delay += 200;
    });
  };

  useEffect(() => {
    return () => clearTimers();
  }, []);

  const handleClose = () => {
    clearTimers();
    setPhase("idle");
    setResults({});
    setOverallResult("idle");
    setTestMessage("");
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Test Connection" size="lg">
      <div className="space-y-5">
        {/* Channel info */}
        {typeInfo && (
          <div className="flex items-center gap-3 p-3 bg-muted/30 border">
            <div className={cn("w-8 h-8 flex items-center justify-center border", typeInfo.bgColor, typeInfo.borderColor)}>
              <typeInfo.icon className={cn("w-4 h-4", typeInfo.color)} />
            </div>
            <div>
              <p className="text-sm font-semibold">{channel.name}</p>
              <p className="text-[11px] text-muted-foreground">{typeInfo.label} &middot; {channel.senderName || "No sender"}</p>
            </div>
          </div>
        )}

        {/* Test phases */}
        <div className="border">
          {TEST_PHASES.map((p, i) => {
            const result = results[p.id];
            const isActive = phase === p.id && !result;
            const isFuture = !result && !isActive && overallResult !== "idle";
            const isAborted = overallResult === "failed" && !result && phase === "done";

            return (
              <div key={p.id} className={cn("flex items-center gap-3 px-4 py-3", i > 0 && "border-t")}>
                <div className="w-5 h-5 flex items-center justify-center shrink-0">
                  {result === "pass" ? (
                    <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}>
                      <CircleCheck className="w-4 h-4 text-emerald-600" />
                    </motion.div>
                  ) : result === "fail" ? (
                    <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}>
                      <CircleX className="w-4 h-4 text-destructive" />
                    </motion.div>
                  ) : isActive ? (
                    <Loader2 className="w-4 h-4 text-primary animate-spin" />
                  ) : isAborted ? (
                    <X className="w-3.5 h-3.5 text-muted-foreground/30" />
                  ) : (
                    <div className={cn("w-3 h-3 border", overallResult === "idle" ? "border-muted-foreground/30" : "border-muted-foreground/20")} />
                  )}
                </div>
                <div className="flex-1">
                  <p className={cn("text-xs font-semibold", isActive ? "text-foreground" : result ? "text-foreground" : "text-muted-foreground/50")}>
                    {p.label}
                  </p>
                  {(isActive || result) && (
                    <p className="text-[11px] text-muted-foreground mt-0.5">
                      {result === "fail" ? "Failed — check your credentials" : result === "pass" ? "Passed" : p.description}
                    </p>
                  )}
                </div>
                {isActive && <Badge className="text-[9px] bg-primary/10 text-primary border-primary/20" variant="outline">Testing</Badge>}
                {result === "pass" && <span className="text-[10px] text-emerald-600 font-semibold">OK</span>}
                {result === "fail" && <span className="text-[10px] text-destructive font-semibold">FAIL</span>}
              </div>
            );
          })}
        </div>

        {/* Results */}
        <AnimatePresence>
          {overallResult === "success" && (
            <motion.div initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} className="p-4 bg-emerald-50 border border-emerald-200">
              <div className="flex items-center gap-2">
                <CircleCheck className="w-5 h-5 text-emerald-600" />
                <div>
                  <p className="text-sm font-semibold text-emerald-700">Connection Successful</p>
                  <p className="text-[11px] text-emerald-600/80 mt-0.5">All checks passed. Channel is ready to send messages.</p>
                </div>
              </div>
            </motion.div>
          )}
          {overallResult === "failed" && (
            <motion.div initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} className="p-4 bg-destructive/5 border border-destructive/20">
              <div className="flex items-center gap-2">
                <CircleX className="w-5 h-5 text-destructive" />
                <div>
                  <p className="text-sm font-semibold text-destructive">Connection Failed</p>
                  <p className="text-[11px] text-muted-foreground mt-0.5">Authentication failed. Please verify your API credentials in the channel configuration.</p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Send test message (only when connected) */}
        {overallResult === "success" && (
          <div className="space-y-2 p-4 border bg-muted/10">
            <h5 className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Send a Test Message</h5>
            <div className="flex gap-2">
              <Input
                placeholder="Enter test message..."
                value={testMessage}
                onChange={e => setTestMessage(e.target.value)}
                className="h-9 text-sm flex-1"
              />
              <Button
                size="sm"
                disabled={!testMessage.trim()}
                onClick={() => {
                  toast.success(`Test message sent via ${channel.name}`);
                  setTestMessage("");
                }}
              >
                <Send className="w-3.5 h-3.5 mr-1.5" />
                Send
              </Button>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex justify-end gap-2 pt-2 border-t">
          <Button variant="outline" size="sm" onClick={handleClose}>Close</Button>
          {overallResult === "idle" || overallResult === "failed" ? (
            <Button size="sm" onClick={runTest}>
              <TestTube className="w-3.5 h-3.5 mr-1.5" />
              {overallResult === "failed" ? "Retry Test" : "Run Test"}
            </Button>
          ) : overallResult === "running" ? (
            <Button size="sm" disabled>
              <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
              Testing...
            </Button>
          ) : null}
        </div>
      </div>
    </Modal>
  );
};
