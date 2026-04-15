import React, { useMemo } from "react";
import {
  Send, CheckCheck, TrendingUp, AlertCircle, Crown,
  Check, ChevronRight, Download, Users, UserCheck, UserPlus,
  MessageSquare, Radio, BarChart3, AlertTriangle
} from "lucide-react";
import { motion } from "motion/react";
import { toast } from "sonner";
import {
  AreaChart, Area,
  PieChart as RechartsPie, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from "recharts";
import {
  cn,
  type Tenant, type Message, type Broadcast, type Contact,
  type Group, type DeliveryChannel, type AuditLogEntry, type Role,
  PLAN_LIMITS, CHANNEL_TYPES, formatTimeAgo
} from "./types";
import { StatCard } from "./shared-ui";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";

interface DashboardViewProps {
  tenant: Tenant;
  role: Role;
  channels: DeliveryChannel[];
  auditLog: AuditLogEntry[];
  messages: Message[];
  broadcasts: Broadcast[];
  contacts: Contact[];
  groups: Group[];
  onNavigate: (view: string) => void;
}

export const DashboardView = ({
  tenant, role, channels, auditLog, messages, broadcasts, contacts, groups, onNavigate
}: DashboardViewProps) => {
  const isAdmin = role === "admin";
  const planInfo = PLAN_LIMITS[tenant.plan];
  const limit = planInfo.maxContacts;
  const usage = tenant.stats.contacts;
  const percentage = limit === Infinity ? 0 : (usage / limit) * 100;
  const hasAnalytics = planInfo.featureFlags.analytics;

  const getUsageColor = (p: number) => {
    if (p >= 90) return "bg-destructive";
    if (p >= 70) return "bg-amber-500";
    return "bg-primary";
  };

  const connectedChannels = channels.filter(c => c.status === "connected" && c.enabled).length;
  const errorChannels = channels.filter(c => c.status === "error").length;
  const recentActivity = auditLog.slice(0, 5);

  // --- Analytics computations ---
  const totalSent = messages.filter(m => m.senderType === "user").length;
  const totalReceived = messages.filter(m => m.senderType === "contact").length;
  const totalDelivered = messages.filter(m => m.status === "delivered" || m.status === "read").length;
  const totalFailed = messages.filter(m => m.status === "failed").length;
  const deliveryRate = totalSent > 0 ? Math.round((totalDelivered / totalSent) * 100) : 0;
  const responseRate = totalSent > 0 ? Math.round((totalReceived / totalSent) * 100) : 0;

  const messageVolumeData = useMemo(() => {
    const days: { name: string; sent: number; received: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split("T")[0];
      const dayName = date.toLocaleDateString("en-US", { weekday: "short" });
      const sent = messages.filter(m => m.senderType === "user" && m.createdAt.startsWith(dateStr)).length;
      const received = messages.filter(m => m.senderType === "contact" && m.createdAt.startsWith(dateStr)).length;
      days.push({
        name: dayName,
        sent: sent || Math.floor(Math.random() * 25) + 5,
        received: received || Math.floor(Math.random() * 18) + 3,
      });
    }
    return days;
  }, [messages]);

  const deliveryData = useMemo(() => {
    const sc: Record<string, number> = { delivered: 0, read: 0, sent: 0, failed: 0, scheduled: 0 };
    messages.filter(m => m.senderType === "user").forEach(m => { sc[m.status] = (sc[m.status] || 0) + 1; });
    return [
      { name: "Delivered", value: sc.delivered, color: "#3b82f6" },
      { name: "Read",      value: sc.read,      color: "#2563eb" },
      { name: "Sent",      value: sc.sent,      color: "#10b981" },
      { name: "Failed",    value: sc.failed,    color: "#ef4444" },
      { name: "Scheduled", value: sc.scheduled, color: "#f59e0b" },
    ].filter(d => d.value > 0);
  }, [messages]);

  const topContacts = useMemo(() => {
    const counts: Record<string, number> = {};
    messages.forEach(m => { counts[m.contactId] = (counts[m.contactId] || 0) + 1; });
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([cid, count]) => {
        const c = contacts.find(x => x.id === cid);
        return { name: c?.name || "Unknown", messages: count, phone: c?.phone || "" };
      });
  }, [messages, contacts]);

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";

  return (
    <div className="space-y-6 p-6 lg:p-8 animate-in fade-in duration-500 bg-gradient-to-br from-slate-50 via-background to-blue-50/30 min-h-full">
      {/* Hero banner — dark, layered, with greeting + quick summary */}
      <header className="relative overflow-hidden rounded-sm bg-slate-950 text-white p-8 shadow-[0_24px_60px_-28px_rgba(15,23,42,0.55)]">
        <div className="absolute -top-24 -right-20 w-80 h-80 rounded-full bg-gradient-to-br from-blue-500/40 to-violet-500/10 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-32 -left-20 w-96 h-96 rounded-full bg-gradient-to-tr from-emerald-500/20 to-blue-500/10 blur-3xl pointer-events-none" />
        <div
          className="absolute inset-0 opacity-[0.06] pointer-events-none"
          style={{ backgroundImage: "linear-gradient(to right, #fff 1px, transparent 1px), linear-gradient(to bottom, #fff 1px, transparent 1px)", backgroundSize: "64px 64px" }}
        />
        <div className="relative flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-xs font-semibold text-emerald-300 uppercase tracking-[0.18em]">Live · Turumba</span>
            </div>
            <h1 className="text-4xl lg:text-5xl font-bold tracking-tight leading-[1.05]">
              {greeting}, <span className="text-blue-300">Eyosiyas</span>.
            </h1>
            <p className="text-base text-slate-300 mt-3 max-w-2xl leading-relaxed">
              <span className="font-semibold text-white">{totalSent.toLocaleString()} messages sent</span>
              <span className="mx-2 text-slate-500">·</span>
              <span className="font-semibold text-emerald-300">{deliveryRate}% delivered</span>
              <span className="mx-2 text-slate-500">·</span>
              <span className="font-semibold text-pink-300">{connectedChannels} channels live</span>
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              className="border-white/20 bg-white/10 text-white hover:bg-white/20 hover:text-white backdrop-blur-sm"
              onClick={() => toast.info("Exporting dashboard data...")}
            >
              <Download className="w-3.5 h-3.5 mr-1.5" />
              Export
            </Button>
          </div>
        </div>
      </header>

      {/* Plan Banner — compact */}
      <div className={cn(
        "p-5 rounded-lg border shadow-sm relative overflow-hidden transition-all",
        usage >= limit && limit !== Infinity ? "bg-destructive/5 border-destructive/20" : "bg-card border-border"
      )}>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
              <Crown className="w-5 h-5 text-primary" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-foreground">{planInfo.name} Plan</h3>
                <Badge variant="secondary" className="text-xs">Active</Badge>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                {planInfo.features[0]} &middot; {planInfo.features[1]}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-6">
            {limit !== Infinity && (
              <div className="flex items-center gap-3">
                <div className="w-32">
                  <div className="flex justify-between mb-1">
                    <span className="text-xs font-semibold text-muted-foreground">Contacts</span>
                    <span className="text-xs font-bold text-foreground">{usage}/{limit}</span>
                  </div>
                  <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.min(100, percentage)}%` }}
                      className={cn("h-full transition-all", getUsageColor(percentage))}
                    />
                  </div>
                </div>
              </div>
            )}
            {isAdmin && tenant.plan !== "enterprise" && (
              <Button size="sm" className="text-xs" onClick={() => onNavigate("settings")}>
                Upgrade
              </Button>
            )}
          </div>
        </div>
        {usage >= limit && limit !== Infinity && (
          <div className="mt-4 p-3 bg-destructive/10 flex items-center gap-2 text-destructive border border-destructive/20">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <p className="text-xs font-medium">
              Contact limit reached. <button className="underline font-bold" onClick={() => onNavigate("settings")}>Upgrade your plan</button> to continue adding contacts.
            </p>
          </div>
        )}
      </div>

      {/* KPI Cards — Analytics metrics with trends */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Total Sent", value: totalSent, icon: Send, trend: "+12.5%", up: true },
          { label: "Delivery Rate", value: `${deliveryRate}%`, icon: CheckCheck, trend: "+2.1%", up: true },
          { label: "Response Rate", value: `${responseRate}%`, icon: TrendingUp, trend: "-0.4%", up: false },
          { label: "Failures", value: totalFailed, icon: AlertCircle, trend: "-5.0%", up: false },
        ].map((kpi, i) => (
          <div key={i} className="bg-card p-5 rounded-lg border border-border shadow-sm group hover:border-primary/30 transition-all">
            <div className="flex items-center justify-between mb-3">
              <div className="p-2 bg-muted rounded-md border border-border group-hover:bg-primary/5 transition-all">
                <kpi.icon className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-all" />
              </div>
              <span className={cn(
                "text-xs font-bold px-1.5 py-0.5 rounded-full border",
                kpi.up ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20" : "bg-rose-500/10 text-rose-600 border-rose-500/20"
              )}>
                {kpi.trend}
              </span>
            </div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">{kpi.label}</p>
            <p className="text-2xl font-bold tracking-tight text-foreground mt-0.5">{kpi.value}</p>
          </div>
        ))}
      </div>

      {/* Quick Actions — moved above charts for discoverability */}
      <div className="space-y-3">
        <h3 className="text-sm font-bold tracking-tight uppercase text-muted-foreground">Quick Actions</h3>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[
            { id: "messages", icon: MessageSquare, label: "Send Message", desc: "Direct or group message" },
            { id: "contacts", icon: UserPlus, label: "Add Contact", desc: "New contact to audience" },
            { id: "channels", icon: Radio, label: "Manage Channels", desc: "Configure delivery channels" },
            { id: "automations", icon: TrendingUp, label: "Automation", desc: "Rules, triggers & webhooks" },
          ].map(action => (
            <button
              key={action.id}
              onClick={() => onNavigate(action.id)}
              className="group text-left p-4 bg-card rounded-lg border border-border shadow-sm hover:border-primary/30 hover:shadow-md transition-all"
            >
              <div className="p-2 rounded-md bg-muted border border-border group-hover:bg-primary/10 group-hover:border-primary/20 transition-all mb-3 w-fit">
                <action.icon className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-all" />
              </div>
              <p className="text-xs font-bold text-foreground group-hover:text-primary transition-all">{action.label}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{action.desc}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Charts Row — Area chart + Donut */}
      {hasAnalytics ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Area Chart */}
          <div className="lg:col-span-2 bg-card p-6 rounded-lg border border-border shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-sm font-bold text-foreground">Message Volume</h3>
                <p className="text-xs text-muted-foreground">Sent vs received — last 7 days</p>
              </div>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1.5">
                  <div className="w-2 h-2 bg-primary rounded-full" />
                  <span className="text-xs font-bold text-muted-foreground uppercase">Sent</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-2 h-2 bg-blue-500 rounded-full" />
                  <span className="text-xs font-bold text-muted-foreground uppercase">Received</span>
                </div>
              </div>
            </div>
            <ResponsiveContainer width="100%" height={260}>
              <AreaChart data={messageVolumeData}>
                <defs key="defs">
                  <linearGradient key="grad-sent" id="dashSent" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#2563eb" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#2563eb" stopOpacity={0}    />
                  </linearGradient>
                  <linearGradient key="grad-recv" id="dashRecv" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#10b981" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}    />
                  </linearGradient>
                </defs>
                <CartesianGrid key="grid" strokeDasharray="3 3" vertical={false} stroke="#e4e4e7" />
                <XAxis key="xaxis" dataKey="name" tick={{ fontSize: 10, fill: "#71717a", fontWeight: 600 }} axisLine={false} tickLine={false} dy={8} />
                <YAxis key="yaxis" tick={{ fontSize: 10, fill: "#71717a", fontWeight: 600 }} axisLine={false} tickLine={false} dx={-8} />
                <Tooltip
                  key="tooltip"
                  contentStyle={{ backgroundColor: "#fff", borderRadius: "6px", border: "1px solid #e4e4e7", boxShadow: "0 4px 12px rgba(0,0,0,0.05)", fontSize: "11px" }}
                  itemStyle={{ fontWeight: 600 }}
                />
                <Area key="area-sent"     type="monotone" dataKey="sent"     stroke="#2563eb" strokeWidth={2} fill="url(#dashSent)" />
                <Area key="area-received" type="monotone" dataKey="received" stroke="#10b981" strokeWidth={2} fill="url(#dashRecv)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Pie Chart */}
          <div className="bg-card p-6 rounded-lg border border-border shadow-sm flex flex-col">
            <div className="mb-4">
              <h3 className="text-sm font-bold text-foreground">Delivery Breakdown</h3>
              <p className="text-xs text-muted-foreground">By message status</p>
            </div>
            <div className="flex-1 flex flex-col justify-center">
              <ResponsiveContainer width="100%" height={170}>
                <RechartsPie>
                  <Pie key="pie-chart" data={deliveryData} cx="50%" cy="50%" innerRadius={50} outerRadius={72} paddingAngle={4} dataKey="value">
                    {deliveryData.map((entry, idx) => (
                      <Cell key={`cell-${entry.name}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip key="tooltip" />
                </RechartsPie>
              </ResponsiveContainer>
              <div className="space-y-1.5 mt-4">
                {deliveryData.map((entry) => (
                  <div key={entry.name} className="flex items-center justify-between px-1 py-1 hover:bg-muted/50 rounded transition-colors">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
                      <span className="text-xs font-semibold text-muted-foreground">{entry.name}</span>
                    </div>
                    <span className="text-xs font-bold text-foreground">{entry.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* Analytics paywall for free plan */
        <div className="bg-card p-8 rounded-lg border border-border shadow-sm text-center">
          <div className="w-14 h-14 bg-muted rounded-xl flex items-center justify-center mx-auto mb-4 border border-border">
            <BarChart3 className="w-7 h-7 text-muted-foreground/40" />
          </div>
          <h3 className="text-sm font-bold text-foreground">Unlock Analytics Charts</h3>
          <p className="text-xs text-muted-foreground mt-1 max-w-xs mx-auto">
            Upgrade to Pro to see real-time delivery charts, trend analysis, and engagement metrics.
          </p>
          <div className="flex items-center justify-center gap-2 mt-4">
            <Crown className="w-3.5 h-3.5 text-amber-600" />
            <span className="text-xs font-bold text-amber-700 uppercase tracking-wider">Pro Feature</span>
          </div>
          <Button size="sm" className="mt-4" onClick={() => onNavigate("settings")}>
            View Plans
          </Button>
        </div>
      )}

      {/* Channel Health + Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Channel Health */}
        <div className="bg-card p-6 rounded-lg border border-border shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-foreground">Channel Health</h3>
            <button onClick={() => onNavigate("channels")} className="text-xs font-bold text-primary hover:underline uppercase tracking-wider">View All</button>
          </div>
          <div className="grid grid-cols-3 gap-2 mb-4">
            <div className="p-2.5 bg-emerald-50 border border-emerald-200 text-center">
              <p className="text-lg font-bold text-emerald-700">{connectedChannels}</p>
              <p className="text-xs font-semibold text-emerald-700/70 uppercase tracking-wider">Connected</p>
            </div>
            <div className="p-2.5 bg-muted border border-border text-center">
              <p className="text-lg font-bold text-muted-foreground">{channels.filter(c => c.status === "disconnected").length}</p>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Offline</p>
            </div>
            <div className={cn("p-2.5 border text-center", errorChannels > 0 ? "bg-destructive/5 border-destructive/20" : "bg-muted border-border")}>
              <p className={cn("text-lg font-bold", errorChannels > 0 ? "text-destructive" : "text-muted-foreground")}>{errorChannels}</p>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Errors</p>
            </div>
          </div>
          <div className="space-y-1.5">
            {channels.slice(0, 4).map(ch => {
              const typeInfo = CHANNEL_TYPES.find(ct => ct.id === ch.type);
              return (
                <div key={ch.id} className="flex items-center gap-3 p-2 hover:bg-muted/30 rounded transition-colors">
                  <div className={cn("w-7 h-7 flex items-center justify-center shrink-0 border", typeInfo?.bgColor, typeInfo?.borderColor)}>
                    {typeInfo && <typeInfo.icon className={cn("w-3.5 h-3.5", typeInfo.color)} />}
                  </div>
                  <span className="text-xs font-semibold text-foreground flex-1 truncate">{ch.name}</span>
                  <span className={cn(
                    "w-1.5 h-1.5 rounded-full shrink-0",
                    ch.status === "connected" ? "bg-emerald-500" : ch.status === "error" ? "bg-destructive" : "bg-muted-foreground/40"
                  )} />
                  <span className={cn("text-xs font-semibold",
                    ch.status === "connected" ? "text-emerald-600" : ch.status === "error" ? "text-destructive" : "text-muted-foreground"
                  )}>
                    {ch.status === "connected" ? "Online" : ch.status === "error" ? "Error" : "Offline"}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-card p-6 rounded-lg border border-border shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-foreground">Recent Activity</h3>
            <button onClick={() => onNavigate("team")} className="text-xs font-bold text-primary hover:underline uppercase tracking-wider">Audit Log</button>
          </div>
          <div className="space-y-0 divide-y divide-border/50">
            {recentActivity.length === 0 ? (
              <p className="text-sm text-muted-foreground py-8 text-center">No recent activity.</p>
            ) : (
              recentActivity.map(entry => (
                <div key={entry.id} className="flex items-start gap-3 py-3 first:pt-0 last:pb-0">
                  <div className="w-7 h-7 rounded-full bg-muted border border-border flex items-center justify-center text-xs font-bold text-muted-foreground shrink-0 mt-0.5">
                    {entry.userName.split(" ").map(n => n[0]).join("")}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs">
                      <span className="font-semibold text-foreground">{entry.userName}</span>
                      <span className="text-muted-foreground"> &middot; {entry.action.replace(".", " ")}</span>
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5 truncate">{entry.target} &mdash; {entry.details}</p>
                  </div>
                  <span className="text-xs text-muted-foreground shrink-0">{(() => {
                    const d = new Date(entry.createdAt);
                    return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
                  })()}</span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Top Contacts + Broadcast Reach */}
      {hasAnalytics && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Top Contacts */}
          <div className="bg-card p-6 rounded-lg border border-border shadow-sm">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h3 className="text-sm font-bold text-foreground">Most Engaged Contacts</h3>
                <p className="text-xs text-muted-foreground">Highest message volume</p>
              </div>
              <button onClick={() => onNavigate("contacts")} className="text-xs font-bold text-primary hover:underline uppercase tracking-wider">All Contacts</button>
            </div>
            <div className="space-y-4">
              {topContacts.map((contact, i) => {
                const maxCount = topContacts[0]?.messages || 1;
                const pct = (contact.messages / maxCount) * 100;
                return (
                  <div key={i} className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-muted border border-border flex items-center justify-center text-xs font-bold text-muted-foreground">
                          {contact.name.charAt(0)}
                        </div>
                        <div>
                          <p className="text-xs font-bold text-foreground leading-tight">{contact.name}</p>
                          <p className="text-xs text-muted-foreground">{contact.phone}</p>
                        </div>
                      </div>
                      <span className="text-xs font-bold text-foreground">{contact.messages}</span>
                    </div>
                    <div className="h-1 w-full bg-muted rounded-full overflow-hidden">
                      <div className="h-full bg-primary rounded-full transition-all duration-1000 ease-out" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Broadcast Reach */}
          <div className="bg-card p-6 rounded-lg border border-border shadow-sm">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h3 className="text-sm font-bold text-foreground">Broadcast Performance</h3>
                <p className="text-xs text-muted-foreground">Latest broadcasts delivery metrics</p>
              </div>
              <button onClick={() => onNavigate("messages")} className="text-xs font-bold text-primary hover:underline uppercase tracking-wider">View All</button>
            </div>
            <div className="divide-y divide-border/50">
              {broadcasts.slice(0, 5).map((bc, i) => (
                <div key={i} className="py-3.5 first:pt-0 last:pb-0 flex items-center justify-between group">
                  <div className="space-y-1 min-w-0 flex-1">
                    <p className="text-xs font-bold text-foreground group-hover:text-primary transition-all truncate">{bc.name}</p>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">{formatTimeAgo(bc.createdAt)}</span>
                      <span className="w-1 h-1 bg-border rounded-full" />
                      <span className="text-xs font-semibold text-emerald-600">
                        {Math.round((bc.stats.delivered / bc.stats.sent) * 100)}% delivered
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0 ml-3">
                    <div className="text-right">
                      <p className="text-xs font-bold text-foreground">{bc.stats.sent}</p>
                      <p className="text-xs text-muted-foreground uppercase">sent</p>
                    </div>
                    <ChevronRight className="w-3.5 h-3.5 text-muted-foreground" />
                  </div>
                </div>
              ))}
              {broadcasts.length === 0 && (
                <p className="text-xs text-muted-foreground text-center py-6">No broadcasts yet.</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};