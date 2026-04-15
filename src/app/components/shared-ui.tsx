import React, { useState } from "react";
import {
  X, Check, AlertTriangle, Info, Radio, Repeat, Bell,
  MessageSquare, Zap, Clock, AlertCircle, Building2, Plus,
  Crown, Users, Send, Database, CheckCheck, ShieldCheck,
  UserCheck, Edit2, Trash2, ChevronRight, ChevronDown
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import {
  cn,
  type Role, type Plan, type MessagePort, type ScheduleFrequency,
  type MessageStatus, type Tenant, type User, type Contact,
  type Message, type Broadcast,
  PLAN_LIMITS, MESSAGE_PORTS, SCHEDULE_FREQUENCIES,
  formatTimeAgo
} from "./types";

export { cn };

// --- Modal ---

export const Modal = ({ isOpen, onClose, title, children, size = "md" }: { isOpen: boolean; onClose: () => void; title: string; children: React.ReactNode; size?: "sm" | "md" | "lg" | "xl" | "2xl" | "3xl" | "4xl" | "5xl" }) => {
  if (!isOpen) return null;

  const sizeClasses = {
    sm: "max-w-sm",
    md: "max-w-md",
    lg: "max-w-lg",
    xl: "max-w-xl",
    "2xl": "max-w-2xl",
    "3xl": "max-w-3xl",
    "4xl": "max-w-4xl",
    "5xl": "max-w-5xl",
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-black/60 backdrop-blur-[2px]"
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.98, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.98, y: 10 }}
        transition={{ duration: 0.2, ease: "easeOut" }}
        className={cn(
          "relative bg-background w-full rounded-lg shadow-xl border border-border overflow-hidden flex flex-col max-h-[90vh]",
          sizeClasses[size] || sizeClasses.md
        )}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <h2 className="text-lg font-semibold tracking-tight text-foreground">{title}</h2>
          <button 
            onClick={onClose} 
            className="p-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-md transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="p-6 overflow-y-auto custom-scrollbar">
          {children}
        </div>
      </motion.div>
    </div>
  );
};

// --- RoleBadge ---

export const RoleBadge = ({ role }: { role: Role }) => {
  const styles = {
    admin: "bg-primary/10 text-primary border-primary/20",
    agent: "bg-blue-500/10 text-blue-600 border-blue-500/20",
    viewer: "bg-muted text-muted-foreground border-border"
  };

  return (
    <span className={cn(
      "px-2 py-0.5 rounded-full text-xs font-bold border uppercase tracking-wider",
      styles[role]
    )}>
      {role}
    </span>
  );
};

// --- StatCard ---

export const StatCard = ({ label, value, icon: Icon, trend }: any) => (
  <div className="bg-card p-6 rounded-lg border border-border shadow-sm">
    <div className="flex items-center justify-between mb-3">
      <div className="p-2 bg-muted rounded-md">
        <Icon className="w-4 h-4 text-muted-foreground" />
      </div>
      {trend && (
        <span className={cn(
          "text-xs font-bold px-1.5 py-0.5 rounded-full border",
          trend > 0 ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20" : "bg-rose-500/10 text-rose-600 border-rose-500/20"
        )}>
          {trend > 0 ? "+" : ""}{trend}%
        </span>
      )}
    </div>
    <div className="space-y-1">
      <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-widest">{label}</h3>
      <p className="text-2xl font-bold tracking-tight text-foreground">{value.toLocaleString()}</p>
    </div>
  </div>
);

// --- PortSelector ---

export const PortSelector = ({ value, onChange, size = "default" }: { value: MessagePort; onChange: (port: MessagePort) => void; size?: "default" | "compact" }) => {
  const isCompact = size === "compact";
  return (
    <div className="space-y-2">
      {!isCompact && <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-1.5 px-1"><Radio className="w-3 h-3" />Message Port</label>}
      <div className={cn("flex gap-1.5", isCompact ? "p-1 bg-muted rounded-md border border-border" : "p-1 bg-muted rounded-lg border border-border")}>
        {MESSAGE_PORTS.map(port => {
          const isActive = value === port.id;
          return (
            <button
              key={port.id}
              type="button"
              onClick={() => onChange?.(port.id)}
              className={cn(
                "flex items-center justify-center gap-1.5 transition-all font-semibold",
                isCompact
                  ? "px-3 py-1.5 rounded-sm text-xs"
                  : "flex-1 px-3 py-2 rounded-md text-xs",
                isActive
                  ? "bg-background text-foreground shadow-sm border border-border"
                  : "text-muted-foreground hover:text-foreground"
              )}
              title={port.label}
            >
              <port.icon className={cn(isCompact ? "w-3 h-3" : "w-3.5 h-3.5", isActive ? "text-primary" : "opacity-60")} />
              {!isCompact && port.label}
              {isCompact && <span className="hidden sm:inline">{port.label}</span>}
            </button>
          );
        })}
      </div>
    </div>
  );
};

// --- DropdownPortSelector ---

export const DropdownPortSelector = ({ value, onChange, label = "Select Channel" }: { value: MessagePort; onChange: (port: MessagePort) => void; label?: string }) => {
  const [isOpen, setIsOpen] = useState(false);
  const selectedPort = MESSAGE_PORTS.find(p => p.id === value);

  return (
    <div className="relative">
      <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-2 block px-1">{label}</label>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "w-full flex items-center justify-between px-3 py-2 bg-background border border-input rounded-md text-sm ring-offset-background transition-all hover:bg-muted/50 focus:ring-1 focus:ring-ring shadow-sm",
          isOpen && "ring-1 ring-ring border-ring"
        )}
      >
        <div className="flex items-center gap-3">
          {selectedPort && (
            <>
              <div className={cn("p-1.5 rounded-md", selectedPort.bgColor, selectedPort.color)}>
                <selectedPort.icon className="w-3.5 h-3.5" />
              </div>
              <span className="font-semibold text-foreground">{selectedPort.label}</span>
            </>
          )}
        </div>
        <ChevronDown className={cn("w-4 h-4 text-muted-foreground transition-transform duration-200", isOpen ? "rotate-180" : "rotate-0")} />
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
            <motion.div
              initial={{ opacity: 0, y: 5, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 5, scale: 0.98 }}
              className="absolute top-full left-0 right-0 mt-2 bg-popover border border-border rounded-md shadow-lg overflow-hidden z-50 p-1"
            >
              {MESSAGE_PORTS.map(port => {
                const isActive = value === port.id;
                return (
                  <button
                    key={port.id}
                    type="button"
                    onClick={() => {
                      onChange(port.id);
                      setIsOpen(false);
                    }}
                    className={cn(
                      "w-full flex items-center justify-between p-2 rounded-sm transition-all text-left",
                      isActive ? "bg-accent text-accent-foreground" : "hover:bg-muted text-muted-foreground hover:text-foreground"
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <div className={cn("p-1.5 rounded-md shadow-sm border border-border/10", port.bgColor, port.color)}>
                        <port.icon className="w-3.5 h-3.5" />
                      </div>
                      <div className="flex flex-col">
                        <span className="font-semibold text-sm">{port.label}</span>
                        <span className="text-xs opacity-70">Send via {port.label}</span>
                      </div>
                    </div>
                    {isActive && <Check className="w-3.5 h-3.5 text-primary" />}
                  </button>
                );
              })}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};


// --- PortBadge ---

export const PortBadge = ({ port }: { port: MessagePort }) => {
  const portInfo = MESSAGE_PORTS.find(p => p.id === port);
  if (!portInfo) return null;
  return (
    <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-bold border border-border bg-muted/50 text-foreground shadow-sm">
      <portInfo.icon className="w-3.5 h-3.5 opacity-60" />
      {portInfo.label}
    </span>
  );
};

// --- FrequencySelector ---

export const FrequencySelector = ({ value, onChange }: { value: ScheduleFrequency; onChange: (freq: ScheduleFrequency) => void }) => (
  <div className="space-y-2">
    <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-1.5 px-1">
      <Repeat className="w-3 h-3" />
      Frequency
    </label>
    <div className="flex gap-1.5 flex-wrap">
      {SCHEDULE_FREQUENCIES.map(freq => (
        <button
          key={freq.id}
          type="button"
          onClick={() => onChange?.(freq.id)}
          className={cn(
            "px-3 py-1.5 rounded-md text-xs font-bold uppercase tracking-wider transition-all border",
            value === freq.id
              ? "bg-primary text-primary-foreground border-primary shadow-sm"
              : "bg-background text-muted-foreground border-border hover:bg-muted hover:text-foreground shadow-sm"
          )}
          title={freq.description}
        >
          {freq.label}
        </button>
      ))}
    </div>
  </div>
);

// --- SubscriptionUsageBanner ---

export const SubscriptionUsageBanner = ({ usage, limit, onUpgrade }: { usage: number, limit: number, onUpgrade: () => void }) => {
  if (limit === Infinity) return null;
  const percentage = (usage / limit) * 100;
  const isAtLimit = usage >= limit;
  const isNearLimit = percentage >= 90;
  const isApproaching = percentage >= 70;

  if (!isApproaching) return null;

  const styles = isAtLimit
    ? { bg: "bg-destructive/5", border: "border-destructive/20", text: "text-destructive", sub: "text-destructive/80", icon: AlertTriangle, iconColor: "text-destructive", btn: "bg-destructive text-destructive-foreground hover:bg-destructive/90" }
    : isNearLimit
      ? { bg: "bg-amber-500/5", border: "border-amber-500/20", text: "text-amber-700", sub: "text-amber-700/80", icon: AlertTriangle, iconColor: "text-amber-600", btn: "bg-amber-600 text-white hover:bg-amber-700" }
      : { bg: "bg-primary/5", border: "border-primary/20", text: "text-primary", sub: "text-primary/80", icon: Info, iconColor: "text-primary", btn: "bg-primary text-primary-foreground hover:bg-primary/90" };

  return (
    <div className={cn("p-4 rounded-lg border flex flex-col md:flex-row items-center justify-between gap-4 mb-6 shadow-sm", styles.bg, styles.border)}>
      <div className="flex items-center gap-3">
        <styles.icon className={cn("w-5 h-5 shrink-0", styles.iconColor)} />
        <div className="space-y-0.5">
          <p className={cn("text-sm font-bold tracking-tight", styles.text)}>
            {isAtLimit ? "Contact limit reached" : isNearLimit ? "Approaching contact limit" : "Growing fast!"}
          </p>
          <p className={cn("text-xs font-medium", styles.sub)}>
            Using {usage} of {limit} contacts ({Math.round(percentage)}%). {isAtLimit ? "Upgrade to add more contacts." : "Consider upgrading your plan soon."}
          </p>
        </div>
      </div>
      <button
        onClick={onUpgrade}
        className={cn("px-4 py-2 text-xs font-bold uppercase tracking-wider rounded-md transition-colors shadow-sm whitespace-nowrap", styles.btn)}
      >
        Upgrade Plan
      </button>
    </div>
  );
};

// --- EmptyStateView ---

export const EmptyStateView = ({ onCreateOrg }: { onCreateOrg: () => void }) => (
  <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 text-center">
    <motion.div
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      className="max-w-md w-full"
    >
      <div className="w-16 h-16 bg-muted rounded-2xl flex items-center justify-center mx-auto mb-6 border border-border shadow-sm">
        <Building2 className="w-8 h-8 text-primary" />
      </div>
      <h1 className="text-2xl font-bold tracking-tight text-foreground mb-2">Welcome to Turumba</h1>
      <p className="text-sm text-muted-foreground mb-8 max-w-[300px] mx-auto">
        Create your first organization to get started with multi-channel messaging and automation.
      </p>
      <button
        onClick={onCreateOrg}
        className="w-full py-2.5 bg-primary text-primary-foreground rounded-md text-sm font-bold hover:bg-primary/90 transition-all shadow-sm flex items-center justify-center group"
      >
        <Plus className="w-4 h-4 mr-2 group-hover:rotate-90 transition-transform duration-300" />
        Create Organization
      </button>
    </motion.div>
  </div>
);

// --- NotificationDropdown ---

export const NotificationDropdown = ({
  messages,
  broadcasts,
  contacts,
  isOpen,
  onClose,
  onNavigate,
  onSeeAll,
}: {
  messages: Message[],
  broadcasts: Broadcast[],
  contacts: Contact[],
  isOpen: boolean,
  onClose: () => void,
  onNavigate: (view: string, contactId?: string) => void,
  onSeeAll?: () => void,
}) => {
  const notifications = React.useMemo(() => {
    const items: { id: string, type: string, icon: any, iconColor: string, title: string, description: string, time: string, read: boolean, action?: () => void }[] = [];

    const recentReceived = messages
      .filter(m => m.senderType === "contact" && m.status === "received")
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 4);

    recentReceived.forEach(msg => {
      const contact = contacts.find(c => c.id === msg.contactId);
      items.push({
        id: msg.id,
        type: "message",
        icon: MessageSquare,
        iconColor: "bg-primary/10 text-primary border-primary/10",
        title: `Message from ${contact?.name || "Unknown"}`,
        description: msg.content.length > 50 ? msg.content.substring(0, 50) + "..." : msg.content,
        time: formatTimeAgo(msg.createdAt),
        read: false,
        action: () => onNavigate("messages", msg.contactId)
      });
    });

    const failedMsgs = messages.filter(m => m.status === "failed").slice(0, 2);
    failedMsgs.forEach(msg => {
      const contact = contacts.find(c => c.id === msg.contactId);
      items.push({
        id: `failed-${msg.id}`,
        type: "alert",
        icon: AlertCircle,
        iconColor: "bg-destructive/10 text-destructive border-destructive/10",
        title: `Message failed`,
        description: `Failed to reach ${contact?.name || "Unknown"}`,
        time: formatTimeAgo(msg.createdAt),
        read: false,
        action: () => onNavigate("messages")
      });
    });

    const recentBroadcasts = broadcasts
      .filter(b => b.status === "delivered")
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 2);

    recentBroadcasts.forEach(bc => {
      items.push({
        id: bc.id,
        type: "broadcast",
        icon: Zap,
        iconColor: "bg-emerald-500/10 text-emerald-600 border-emerald-500/10",
        title: `Broadcast delivered`,
        description: `"${bc.name}" reached ${bc.stats.delivered} contacts.`,
        time: formatTimeAgo(bc.createdAt),
        read: true,
        action: () => onNavigate("messages")
      });
    });

    return items;
  }, [messages, broadcasts, contacts, onNavigate]);

  const unreadCount = notifications.filter(n => !n.read).length;

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 z-40" onClick={onClose} />
      <motion.div
        initial={{ opacity: 0, y: 10, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 10, scale: 0.98 }}
        className="absolute top-full right-0 mt-2 w-80 bg-popover rounded-lg shadow-xl border border-border overflow-hidden z-50 flex flex-col"
      >
        <div className="px-4 py-3 border-b border-border flex items-center justify-between bg-muted/30">
          <div className="flex items-center gap-2">
            <h3 className="text-xs font-bold uppercase tracking-widest text-foreground">Notifications</h3>
            {unreadCount > 0 && (
              <span className="px-1.5 py-0.5 bg-primary text-primary-foreground text-xs font-bold rounded-full">{unreadCount}</span>
            )}
          </div>
          <button className="text-xs font-bold text-primary hover:underline transition-colors uppercase tracking-wider">Clear</button>
        </div>

        <div className="max-h-[400px] overflow-y-auto custom-scrollbar bg-background">
          {notifications.length === 0 ? (
            <div className="p-10 text-center">
              <Bell className="w-8 h-8 text-muted/20 mx-auto mb-3" />
              <p className="text-xs font-medium text-muted-foreground">No notifications yet</p>
            </div>
          ) : (
            notifications.map(notif => (
              <button
                key={notif.id}
                onClick={() => {
                  notif.action?.();
                  onClose();
                }}
                className={cn(
                  "w-full flex items-start gap-3 p-4 text-left transition-all border-b border-border/40 last:border-0",
                  !notif.read ? "bg-muted/30" : "hover:bg-muted/50 opacity-80"
                )}
              >
                <div className={cn("p-2 rounded-md shrink-0 border", notif.iconColor)}>
                  <notif.icon className="w-3.5 h-3.5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <p className={cn("text-sm truncate tracking-tight", !notif.read ? "font-bold text-foreground" : "font-medium text-muted-foreground")}>
                      {notif.title}
                    </p>
                    {!notif.read && <div className="w-1.5 h-1.5 bg-primary rounded-full shrink-0 mt-1.5" />}
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{notif.description}</p>
                  <p className="text-xs text-muted-foreground/60 font-bold uppercase mt-1 tracking-wider">{notif.time}</p>
                </div>
              </button>
            ))
          )}
        </div>

        <div className="p-2 border-t border-border bg-muted/20">
          <button
            onClick={() => {
              // Prefer the dedicated activity overlay if the host wired one in;
              // fall back to the messages page for backwards compatibility.
              if (onSeeAll) onSeeAll();
              else onNavigate("messages");
              onClose();
            }}
            className="w-full py-2 text-xs font-bold uppercase tracking-widest text-primary hover:bg-primary/5 rounded-md transition-colors"
          >
            See all activity
          </button>
        </div>
      </motion.div>
    </>
  );
};