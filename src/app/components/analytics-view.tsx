import React, { useState } from "react";
import {
  BarChart3, Send, CheckCheck, TrendingUp, AlertCircle, Crown,
  Activity, Check, X, Zap, ChevronRight, Download, Calendar
} from "lucide-react";
import { motion } from "motion/react";
import { toast } from "sonner";
import {
  AreaChart, Area,
  BarChart, Bar,
  PieChart as RechartsPie, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from "recharts";
import {
  cn,
  type Tenant, type Message, type Broadcast, type Contact, type Group, type Plan, type DeliveryChannel,
  PLAN_LIMITS, CHANNEL_TYPES, formatTimeAgo
} from "./types";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";

const CHART_COLORS = ["#7c3aed", "#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#06b6d4", "#ec4899"];

export const AnalyticsView = ({
  tenant,
  messages,
  broadcasts,
  contacts,
  groups
}: {
  tenant: Tenant,
  messages: Message[],
  broadcasts: Broadcast[],
  contacts: Contact[],
  groups: Group[]
}) => {
  const planInfo = PLAN_LIMITS[tenant.plan];
  const hasAnalytics = planInfo.featureFlags.analytics;

  const messageVolumeData = React.useMemo(() => {
    const days: { name: string, sent: number, received: number, date: string }[] = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split("T")[0];
      const dayName = date.toLocaleDateString("en-US", { weekday: "short" });

      const sent = messages.filter(m =>
        m.senderType === "user" && m.createdAt.startsWith(dateStr)
      ).length;
      const received = messages.filter(m =>
        m.senderType === "contact" && m.createdAt.startsWith(dateStr)
      ).length;

      days.push({ name: dayName, sent: sent || Math.floor(Math.random() * 25) + 5, received: received || Math.floor(Math.random() * 18) + 3, date: dateStr });
    }
    return days;
  }, [messages]);

  const deliveryData = React.useMemo(() => {
    const statusCounts: Record<string, number> = { delivered: 0, read: 0, sent: 0, failed: 0, scheduled: 0 };
    messages.filter(m => m.senderType === "user").forEach(m => {
      statusCounts[m.status] = (statusCounts[m.status] || 0) + 1;
    });
    return [
      { name: "Delivered", value: statusCounts.delivered, color: "#3b82f6" },
      { name: "Read", value: statusCounts.read, color: "#7c3aed" },
      { name: "Sent", value: statusCounts.sent, color: "#10b981" },
      { name: "Failed", value: statusCounts.failed, color: "#ef4444" },
      { name: "Scheduled", value: statusCounts.scheduled, color: "#f59e0b" },
    ].filter(d => d.value > 0);
  }, [messages]);

  const topContacts = React.useMemo(() => {
    const contactMsgCount: Record<string, number> = {};
    messages.forEach(m => {
      contactMsgCount[m.contactId] = (contactMsgCount[m.contactId] || 0) + 1;
    });
    return Object.entries(contactMsgCount)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6)
      .map(([contactId, count]) => {
        const contact = contacts.find(c => c.id === contactId);
        return { name: contact?.name || "Unknown", messages: count, phone: contact?.phone || "" };
      });
  }, [messages, contacts]);

  const totalSent = messages.filter(m => m.senderType === "user").length;
  const totalReceived = messages.filter(m => m.senderType === "contact").length;
  const totalDelivered = messages.filter(m => m.status === "delivered" || m.status === "read").length;
  const totalFailed = messages.filter(m => m.status === "failed").length;
  const deliveryRate = totalSent > 0 ? Math.round((totalDelivered / totalSent) * 100) : 0;
  const responseRate = totalSent > 0 ? Math.round((totalReceived / totalSent) * 100) : 0;

  if (!hasAnalytics) {
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100vh-12rem)] text-center p-8 animate-in fade-in zoom-in-95 duration-500">
        <div className="w-20 h-20 bg-muted rounded-2xl flex items-center justify-center mb-6 border border-border shadow-sm">
          <BarChart3 className="w-10 h-10 text-muted-foreground opacity-40" />
        </div>
        <h2 className="text-2xl font-bold tracking-tight text-foreground">Advanced Analytics</h2>
        <p className="text-muted-foreground text-sm max-w-[320px] mt-2">
          Unlock detailed performance metrics and delivery insights by upgrading your plan.
        </p>
        <button className="mt-8 px-6 py-2.5 bg-primary text-primary-foreground rounded-md text-sm font-bold shadow-md hover:bg-primary/90 transition-all">
          View Plans & Pricing
        </button>
        <div className="mt-6 flex items-center gap-2 px-3 py-1 bg-amber-500/10 border border-amber-500/20 rounded-full">
          <Crown className="w-3.5 h-3.5 text-amber-600" />
          <span className="text-xs font-bold text-amber-700 uppercase tracking-wider">Pro Feature</span>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-10 space-y-10 animate-in fade-in duration-500">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Analytics</h1>
          <p className="text-muted-foreground text-sm">Measure the effectiveness of your active broadcasts.</p>
        </div>
        <div className="flex items-center gap-3">
          <button className="inline-flex items-center gap-2 px-4 py-2 bg-background border border-input rounded-md text-sm font-bold hover:bg-muted transition-all shadow-sm">
            <Download className="w-4 h-4" />
            Export Data
          </button>
          <div className="flex items-center gap-2 px-3 py-2 bg-primary/5 border border-primary/10 rounded-md">
            <Activity className="w-4 h-4 text-primary animate-pulse" />
            <span className="text-xs font-bold text-primary uppercase tracking-wider">Real-time</span>
          </div>
        </div>
      </header>

      {/* KPI Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: "Total Sent", value: totalSent, icon: Send, trend: "+12.5%", color: "primary" },
          { label: "Delivery Rate", value: `${deliveryRate}%`, icon: CheckCheck, trend: "+2.1%", color: "emerald" },
          { label: "Engagement", value: `${responseRate}%`, icon: TrendingUp, trend: "-0.4%", color: "amber" },
          { label: "Failures", value: totalFailed, icon: AlertCircle, trend: "-5.0%", color: "rose" }
        ].map((kpi, i) => (
          <div key={i} className="bg-card p-6 rounded-lg border border-border shadow-sm group hover:border-primary/30 transition-all">
            <div className="flex items-center justify-between mb-4">
              <div className="p-2.5 bg-muted rounded-md border border-border group-hover:bg-primary/5 transition-all">
                <kpi.icon className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-all" />
              </div>
              <span className={cn(
                "text-xs font-bold px-1.5 py-0.5 rounded-full border",
                kpi.trend.startsWith("+") ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20" : "bg-rose-500/10 text-rose-600 border-rose-500/20"
              )}>
                {kpi.trend}
              </span>
            </div>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-widest">{kpi.label}</p>
            <p className="text-3xl font-bold tracking-tight text-foreground mt-1">{kpi.value}</p>
          </div>
        ))}
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-card p-6 rounded-lg border border-border shadow-sm">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h3 className="text-lg font-bold tracking-tight text-foreground">Performance Over Time</h3>
              <p className="text-xs text-muted-foreground">Monitoring sent vs received message volume</p>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1.5"><div className="w-2 h-2 bg-primary rounded-full" /><span className="text-xs font-bold text-muted-foreground uppercase">Sent</span></div>
              <div className="flex items-center gap-1.5"><div className="w-2 h-2 bg-blue-500 rounded-full" /><span className="text-xs font-bold text-muted-foreground uppercase">Received</span></div>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={messageVolumeData}>
              <defs key="defs">
                <linearGradient key="grad-sent" id="colorSent" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#7c3aed" stopOpacity={0.1} />
                  <stop offset="95%" stopColor="#7c3aed" stopOpacity={0} />
                </linearGradient>
                <linearGradient key="grad-recv" id="colorReceived" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.1} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid key="grid" strokeDasharray="3 3" vertical={false} stroke="#e4e4e7" />
              <XAxis key="xaxis" dataKey="name" tick={{ fontSize: 11, fill: "#71717a", fontWeight: 600 }} axisLine={false} tickLine={false} dy={10} />
              <YAxis key="yaxis" tick={{ fontSize: 11, fill: "#71717a", fontWeight: 600 }} axisLine={false} tickLine={false} dx={-10} />
              <Tooltip
                key="tooltip"
                contentStyle={{ backgroundColor: "#ffffff", borderRadius: "8px", border: "1px solid #e4e4e7", boxShadow: "0 4px 12px rgba(0,0,0,0.05)", fontSize: "12px" }}
                itemStyle={{ fontWeight: "600" }}
              />
              <Area key="area-sent" type="monotone" dataKey="sent" stroke="#7c3aed" strokeWidth={2} fill="url(#colorSent)" />
              <Area key="area-received" type="monotone" dataKey="received" stroke="#3b82f6" strokeWidth={2} fill="url(#colorReceived)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-card p-6 rounded-lg border border-border shadow-sm flex flex-col">
          <div className="mb-6">
            <h3 className="text-lg font-bold tracking-tight text-foreground">Delivery Breakdown</h3>
            <p className="text-xs text-muted-foreground">Distribution by message status</p>
          </div>
          <div className="flex-1 flex flex-col justify-center">
            <ResponsiveContainer width="100%" height={200}>
              <RechartsPie>
                <Pie key="pie-chart" data={deliveryData} cx="50%" cy="50%" innerRadius={60} outerRadius={85} paddingAngle={4} dataKey="value">
                  {deliveryData.map((entry, index) => (
                    <Cell key={`cell-${entry.name}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip key="tooltip" />
              </RechartsPie>
            </ResponsiveContainer>
            <div className="space-y-2 mt-6">
              {deliveryData.map((entry) => (
                <div key={entry.name} className="flex items-center justify-between p-2 rounded-md hover:bg-muted/50 transition-colors">
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full shadow-sm" style={{ backgroundColor: entry.color }} />
                    <span className="text-xs font-semibold text-muted-foreground">{entry.name}</span>
                  </div>
                  <span className="text-xs font-bold text-foreground">{entry.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-card p-6 rounded-lg border border-border shadow-sm">
          <h3 className="text-lg font-bold tracking-tight text-foreground mb-1">Most Engaged Contacts</h3>
          <p className="text-xs text-muted-foreground mb-8">Contacts with the highest volume of interactions</p>
          <div className="space-y-6">
            {topContacts.map((contact, i) => {
              const maxCount = topContacts[0]?.messages || 1;
              const percentage = (contact.messages / maxCount) * 100;
              return (
                <div key={i} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-muted border border-border flex items-center justify-center text-xs font-bold text-muted-foreground">
                        {contact.name.charAt(0)}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-foreground leading-tight">{contact.name}</p>
                        <p className="text-xs font-bold text-muted-foreground uppercase opacity-60">{contact.phone}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-foreground">{contact.messages}</p>
                      <p className="text-xs font-bold text-muted-foreground uppercase opacity-60">msgs</p>
                    </div>
                  </div>
                  <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden border border-border/20">
                    <div
                      className="h-full bg-primary rounded-full transition-all duration-1000 ease-out"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="bg-card p-6 rounded-lg border border-border shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-bold tracking-tight text-foreground">Broadcast Reach</h3>
              <p className="text-xs text-muted-foreground">Latest broadcast performance metrics</p>
            </div>
            <button className="text-xs font-bold text-primary hover:underline">View All</button>
          </div>
          <div className="divide-y divide-border/50">
            {broadcasts.slice(0, 5).map((bc, i) => (
              <div key={i} className="py-4 first:pt-0 last:pb-0 flex items-center justify-between group">
                <div className="space-y-1">
                  <p className="text-sm font-bold text-foreground group-hover:text-primary transition-all">{bc.name}</p>
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest">{formatTimeAgo(bc.createdAt)}</span>
                    <span className="w-1 h-1 bg-border rounded-full" />
                    <span className="text-xs font-bold text-emerald-600 uppercase tracking-widest">{Math.round((bc.stats.delivered / bc.stats.sent) * 100)}% delivery</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="text-right hidden sm:block mr-2">
                    <p className="text-xs font-bold text-foreground">{bc.stats.sent}</p>
                    <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Targeted</p>
                  </div>
                  <button className="p-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-md transition-all">
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};