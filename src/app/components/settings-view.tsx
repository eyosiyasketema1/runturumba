import React, { useState } from "react";
import {
  User, Building2, CreditCard, Bell, Shield, Mail,
  Phone, Globe, Clock, MapPin, Camera, Save,
  Check, ChevronRight, Key, Smartphone, Lock, Eye, EyeOff, Copy, CalendarDays,
  ArrowLeft, ArrowUpRight, Download, Sparkles, Pencil, Plus, Trash2, X,
  Brain, Share2, AlertCircle, BookOpen, Loader2, CheckCircle2, XCircle, ExternalLink, Zap, ShieldCheck, RotateCcw,
  MapPin, Users, MessageSquare, MoreVertical, PauseCircle, PlayCircle, RefreshCw
} from "lucide-react";
import { motion } from "motion/react";
import { toast } from "sonner";

import { cn, type Tenant, type User as UserType, type Plan, type OrgStatus, PLAN_LIMITS } from "./types";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Separator } from "./ui/separator";
import { Switch } from "./ui/switch";
import { Badge } from "./ui/badge";
import { Textarea } from "./ui/textarea";
import { Avatar, AvatarImage, AvatarFallback } from "./ui/avatar";

// --- Settings Navigation Items ---
const settingsNav = [
  { id: "profile", label: "Profile", icon: User, description: "Your personal information" },
  { id: "organization", label: "Organization", icon: Building2, description: "Workspace settings" },
  { id: "child-orgs", label: "Organizations", icon: Building2, description: "Manage sub-organizations", superOnly: true },
  { id: "billing", label: "Billing & Plans", icon: CreditCard, description: "Subscription management" },
  { id: "notifications", label: "Notifications", icon: Bell, description: "Alert preferences" },
  { id: "security", label: "Security", icon: Shield, description: "Password & authentication" },
  { id: "api", label: "API & Integrations", icon: Key, description: "API keys & developer tools" },
  { id: "ai", label: "AI Configuration", icon: Sparkles, description: "Business rules, API keys & sharing" },
  { id: "terminology", label: "Terminology", icon: Globe, description: "Customize labels & terms" },
];

// --- Section Header ---
const SectionHeader = ({ title, description }: { title: string; description: string }) => (
  <div className="space-y-1">
    <h2 className="text-lg font-semibold tracking-tight text-foreground">{title}</h2>
    <p className="text-sm text-muted-foreground">{description}</p>
  </div>
);

// --- Form Field Wrapper ---
const FormField = ({ label, description, children, htmlFor }: { label: string; description?: string; children: React.ReactNode; htmlFor?: string }) => (
  <div className="grid gap-2">
    <Label htmlFor={htmlFor} className="text-sm font-medium text-foreground">{label}</Label>
    {description && <p className="text-[13px] text-muted-foreground -mt-1">{description}</p>}
    {children}
  </div>
);

// --- Profile Section ---
const ProfileSection = ({ user, onUpdate }: { user: UserType; onUpdate: (data: Partial<UserType>) => void }) => {
  const [formData, setFormData] = useState({
    name: user.name,
    email: user.email,
    phone: "+1 (555) 012-3456",
    bio: "Product Manager at Acme Corp. Focusing on customer engagement and growth.",
  });
  const [isDirty, setIsDirty] = useState(false);

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setIsDirty(true);
  };

  const handleSave = () => {
    onUpdate({ name: formData.name, email: formData.email });
    setIsDirty(false);
    toast.success("Profile updated successfully");
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className="space-y-6"
    >
      <SectionHeader title="Profile" description="Manage your personal information and how others see you." />
      <Separator />

      {/* Avatar */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-5">
            <div className="relative group">
              <Avatar className="size-20 border-2 border-border">
                {user.avatar ? (
                  <AvatarImage src={user.avatar} alt={user.name} />
                ) : (
                  <AvatarFallback className="text-lg font-semibold bg-primary/10 text-primary">
                    {user.name.split(" ").map(n => n[0]).join("")}
                  </AvatarFallback>
                )}
              </Avatar>
              <button aria-label="Change profile photo" className="absolute inset-0 rounded-full bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                <Camera className="w-5 h-5 text-white" />
              </button>
            </div>
            <div className="space-y-1">
              <p className="text-sm font-semibold text-foreground">{user.name}</p>
              <p className="text-xs text-muted-foreground">{user.email}</p>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant="secondary" className="capitalize text-xs">{user.role}</Badge>
                <Badge variant="outline" className="capitalize text-xs text-emerald-600 border-emerald-200 bg-emerald-50">{user.status}</Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Personal Info */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-semibold">Personal Information</CardTitle>
          <CardDescription className="text-xs">Update your name, email, and contact details.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <FormField label="Full Name" htmlFor="name">
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => handleChange("name", e.target.value)}
                placeholder="Your full name"
              />
            </FormField>
            <FormField label="Email Address" htmlFor="email">
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => handleChange("email", e.target.value)}
                placeholder="you@example.com"
              />
            </FormField>
            <FormField label="Phone Number" htmlFor="phone">
              <Input
                id="phone"
                type="tel"
                value={formData.phone}
                onChange={(e) => handleChange("phone", e.target.value)}
                placeholder="+1 (555) 000-0000"
              />
            </FormField>
          </div>
          <FormField label="Bio" htmlFor="bio" description="Brief description for your profile.">
            <Textarea
              id="bio"
              value={formData.bio}
              onChange={(e) => handleChange("bio", e.target.value)}
              placeholder="Tell us about yourself..."
              className="min-h-[80px]"
            />
          </FormField>
        </CardContent>
      </Card>

      {/* Save Bar */}
      {isDirty && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between p-4 bg-muted/50 rounded-lg border"
        >
          <p className="text-sm text-muted-foreground">You have unsaved changes.</p>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={() => { setFormData({ name: user.name, email: user.email, phone: "+1 (555) 012-3456", bio: "Product Manager at Acme Corp. Focusing on customer engagement and growth." }); setIsDirty(false); }}>
              Discard
            </Button>
            <Button size="sm" onClick={handleSave}>
              <Save className="w-3.5 h-3.5" />
              Save Changes
            </Button>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
};

// --- Organization Section ---
const OrganizationSection = ({ tenant, onUpdate }: { tenant: Tenant; onUpdate: (data: Partial<Tenant>) => void }) => {
  const [formData, setFormData] = useState({
    name: tenant.name,
    industry: tenant.industry,
    website: "https://acme.com",
    timezone: "UTC-5 (Eastern Time)",
  });
  const [isDirty, setIsDirty] = useState(false);

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setIsDirty(true);
  };

  const handleSave = () => {
    onUpdate({ name: formData.name, industry: formData.industry });
    setIsDirty(false);
    toast.success("Organization updated");
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className="space-y-6"
    >
      <SectionHeader title="Organization" description="Manage your workspace identity and preferences." />
      <Separator />

      {/* Org Identity */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-semibold">Workspace Details</CardTitle>
          <CardDescription className="text-xs">This is how your organization appears across Turumba.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="flex items-center gap-4 p-4 bg-muted/40 rounded-lg border border-dashed">
            <div className="w-14 h-14 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
              <Building2 className="w-6 h-6 text-primary" />
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">{tenant.name}</p>
              <p className="text-xs text-muted-foreground">{tenant.industry} &middot; {PLAN_LIMITS[tenant.plan].name} Plan</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <FormField label="Organization Name" htmlFor="org-name">
              <Input
                id="org-name"
                value={formData.name}
                onChange={(e) => handleChange("name", e.target.value)}
                placeholder="e.g. Acme Corp"
              />
            </FormField>
            <FormField label="Industry" htmlFor="industry">
              <Input
                id="industry"
                value={formData.industry}
                onChange={(e) => handleChange("industry", e.target.value)}
                placeholder="e.g. E-commerce"
              />
            </FormField>
            <FormField label="Website" htmlFor="website">
              <Input
                id="website"
                value={formData.website}
                onChange={(e) => handleChange("website", e.target.value)}
                placeholder="https://example.com"
              />
            </FormField>
            <FormField label="Timezone" htmlFor="timezone">
              <Input
                id="timezone"
                value={formData.timezone}
                onChange={(e) => handleChange("timezone", e.target.value)}
                placeholder="UTC-5 (Eastern Time)"
              />
            </FormField>
          </div>
        </CardContent>
      </Card>

      {/* Quick Stats */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-semibold">Usage Overview</CardTitle>
          <CardDescription className="text-xs">Current resource consumption for your organization.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4">
            {[
              { label: "Contacts", value: tenant.stats.contacts.toLocaleString(), max: PLAN_LIMITS[tenant.plan].maxContacts === Infinity ? "Unlimited" : PLAN_LIMITS[tenant.plan].maxContacts.toLocaleString() },
              { label: "Messages Sent", value: tenant.stats.messages.toLocaleString(), max: null },
              { label: "Active Users", value: tenant.stats.activeUsers.toString(), max: null },
            ].map((stat) => (
              <div key={stat.label} className="text-center p-3 bg-muted/30 rounded-lg">
                <p className="text-xl font-bold text-foreground">{stat.value}</p>
                <p className="text-xs text-muted-foreground font-medium mt-0.5">
                  {stat.label}
                  {stat.max && <span className="text-muted-foreground"> / {stat.max}</span>}
                </p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {isDirty && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between p-4 bg-muted/50 rounded-lg border"
        >
          <p className="text-sm text-muted-foreground">You have unsaved changes.</p>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={() => { setFormData({ name: tenant.name, industry: tenant.industry, website: "https://acme.com", timezone: "UTC-5 (Eastern Time)" }); setIsDirty(false); }}>
              Discard
            </Button>
            <Button size="sm" onClick={handleSave}>
              <Save className="w-3.5 h-3.5" />
              Save Changes
            </Button>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
};

// --- Billing Section ---
const BillingSection = ({ tenant, onUpgrade }: { tenant: Tenant; onUpgrade: (plan: Plan) => void }) => {
  const currentPlan = tenant.plan;
  const planInfo = PLAN_LIMITS[currentPlan];
  const limit = planInfo.maxContacts;
  const usage = tenant.stats.contacts;
  const percentage = limit === Infinity ? 0 : Math.round((usage / limit) * 100);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

  const invoices = [
    { id: "INV-2026-002", date: "Feb 1, 2026", amount: planInfo.price === "$0" ? "$0.00" : "$49.00", status: "paid" as const },
    { id: "INV-2026-001", date: "Jan 1, 2026", amount: planInfo.price === "$0" ? "$0.00" : "$49.00", status: "paid" as const },
    { id: "INV-2025-012", date: "Dec 1, 2025", amount: planInfo.price === "$0" ? "$0.00" : "$49.00", status: "paid" as const },
    { id: "INV-2025-011", date: "Nov 1, 2025", amount: planInfo.price === "$0" ? "$0.00" : "$49.00", status: "paid" as const },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className="space-y-6"
    >
      <SectionHeader title="Billing & Plans" description="View your subscription, payment method, and invoices." />
      <Separator />

      {/* Current Subscription */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-sm font-semibold">Current Subscription</CardTitle>
              <CardDescription className="text-xs">Your active plan and billing cycle.</CardDescription>
            </div>
            {currentPlan !== "enterprise" && (
              <Button size="sm" variant="outline" onClick={() => setShowUpgradeModal(!showUpgradeModal)}>
                <ArrowUpRight className="w-3.5 h-3.5" />
                Change Plan
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="flex items-center gap-4 p-4 rounded-lg border bg-muted/20">
            <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
              <CreditCard className="w-5 h-5 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className="text-sm font-semibold text-foreground">{planInfo.name} Plan</p>
                <Badge variant="secondary" className="text-xs">Active</Badge>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                {planInfo.price === "$0"
                  ? "Free forever — no billing"
                  : <>Billed monthly &middot; <span className="font-medium text-foreground">{planInfo.price}</span>/month</>
                }
              </p>
            </div>
            {planInfo.price !== "$0" && (
              <div className="text-right shrink-0">
                <p className="text-xs text-muted-foreground">Next invoice</p>
                <p className="text-sm font-semibold text-foreground">Mar 1, 2026</p>
              </div>
            )}
          </div>

          {/* Usage meters */}
          {limit !== Infinity && (
            <div className="space-y-3">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Current Period Usage</p>
              <div className="space-y-4">
                {[
                  { label: "Contacts", used: usage, max: limit, pct: percentage },
                  { label: "Messages this month", used: tenant.stats.messages, max: planInfo.name === "Free" ? 500 : 25000, pct: Math.round((tenant.stats.messages / (planInfo.name === "Free" ? 500 : 25000)) * 100) },
                ].map((meter) => (
                  <div key={meter.label} className="space-y-1.5">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground text-xs">{meter.label}</span>
                      <span className="text-xs font-medium text-foreground">
                        {meter.used.toLocaleString()} / {meter.max.toLocaleString()}
                      </span>
                    </div>
                    <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                      <div
                        className={cn(
                          "h-full rounded-full transition-all duration-700",
                          meter.pct >= 90 ? "bg-destructive" : meter.pct >= 70 ? "bg-amber-500" : "bg-primary"
                        )}
                        style={{ width: `${Math.min(100, meter.pct)}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Upgrade Plan Inline (toggled) */}
      {showUpgradeModal && currentPlan !== "enterprise" && (
        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} transition={{ duration: 0.25 }}>
          <Card className="border-primary/20">
            <CardHeader>
              <CardTitle className="text-sm font-semibold">Change Plan</CardTitle>
              <CardDescription className="text-xs">Select a new plan. Changes take effect immediately.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {(Object.keys(PLAN_LIMITS) as Plan[]).map((planId) => {
                  const plan = PLAN_LIMITS[planId];
                  const isCurrent = currentPlan === planId;
                  return (
                    <button
                      key={planId}
                      disabled={isCurrent}
                      onClick={() => { onUpgrade(planId); setShowUpgradeModal(false); toast.success(`Switched to ${plan.name} plan`); }}
                      className={cn(
                        "relative text-left p-4 rounded-lg border transition-all",
                        isCurrent
                          ? "border-primary bg-primary/5 ring-1 ring-primary"
                          : "border-border hover:border-primary/40 hover:bg-muted/30 cursor-pointer"
                      )}
                    >
                      {isCurrent && (
                        <Badge className="absolute -top-2 right-3 text-xs">Current</Badge>
                      )}
                      <p className="text-sm font-semibold text-foreground">{plan.name}</p>
                      <div className="flex items-baseline gap-1 mt-1">
                        <span className="text-lg font-bold text-foreground">{plan.price}</span>
                        <span className="text-xs text-muted-foreground">/{plan.period}</span>
                      </div>
                      <ul className="mt-3 space-y-1">
                        {plan.features.slice(0, 3).map((f, i) => (
                          <li key={i} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                            <Check className="w-3 h-3 text-primary shrink-0" />
                            <span>{f}</span>
                          </li>
                        ))}
                      </ul>
                    </button>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Payment Method */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-sm font-semibold">Payment Method</CardTitle>
              <CardDescription className="text-xs">Card on file for automatic billing.</CardDescription>
            </div>
            <Button variant="ghost" size="sm" className="text-xs">
              Update
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {planInfo.price === "$0" ? (
            <p className="text-sm text-muted-foreground">No payment method required for the Free plan.</p>
          ) : (
            <div className="flex items-center gap-4">
              <div className="w-12 h-8 rounded bg-gradient-to-br from-blue-600 to-blue-800 flex items-center justify-center shrink-0">
                <span className="text-white text-xs font-bold">VISA</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground">Visa ending in 4242</p>
                <p className="text-xs text-muted-foreground">Expires 08/2028</p>
              </div>
              <Badge variant="outline" className="text-xs text-emerald-600 border-emerald-200 bg-emerald-50">Default</Badge>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Billing Address */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-sm font-semibold">Billing Address</CardTitle>
              <CardDescription className="text-xs">Used for invoices and tax purposes.</CardDescription>
            </div>
            <Button variant="ghost" size="sm" className="text-xs">
              Edit
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-muted-foreground space-y-0.5">
            <p className="font-medium text-foreground">{tenant.name}</p>
            <p>123 Business Ave, Suite 400</p>
            <p>San Francisco, CA 94102</p>
            <p>United States</p>
          </div>
        </CardContent>
      </Card>

      {/* Invoice History */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-semibold">Invoice History</CardTitle>
          <CardDescription className="text-xs">Past invoices and payment records.</CardDescription>
        </CardHeader>
        <CardContent>
          {planInfo.price === "$0" ? (
            <p className="text-sm text-muted-foreground">No invoices on the Free plan.</p>
          ) : (
            <div className="rounded-lg border overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-muted/40 text-left">
                    <th className="px-4 py-2.5 text-xs font-semibold text-muted-foreground">Invoice</th>
                    <th className="px-4 py-2.5 text-xs font-semibold text-muted-foreground">Date</th>
                    <th className="px-4 py-2.5 text-xs font-semibold text-muted-foreground">Amount</th>
                    <th className="px-4 py-2.5 text-xs font-semibold text-muted-foreground">Status</th>
                    <th className="px-4 py-2.5 text-xs font-semibold text-muted-foreground sr-only">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {invoices.map((inv, idx) => (
                    <tr key={inv.id} className={cn("border-t border-border", idx % 2 === 0 && "bg-background")}>
                      <td className="px-4 py-2.5 font-medium text-foreground text-xs">{inv.id}</td>
                      <td className="px-4 py-2.5 text-muted-foreground text-xs">{inv.date}</td>
                      <td className="px-4 py-2.5 text-foreground font-medium text-xs">{inv.amount}</td>
                      <td className="px-4 py-2.5">
                        <Badge variant="outline" className="text-xs capitalize text-emerald-600 border-emerald-200 bg-emerald-50">
                          {inv.status}
                        </Badge>
                      </td>
                      <td className="px-4 py-2.5">
                        <Button variant="ghost" size="sm" className="text-xs h-7 px-2" onClick={() => toast.info(`Downloading ${inv.id}...`)}>
                          <Download className="w-3 h-3" />
                          PDF
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
};

// --- Notifications Section ---
const NotificationsSection = () => {
  const [prefs, setPrefs] = useState({
    inAppMessages: true,
    inAppBroadcasts: true,
    inAppTeam: true,
    inAppBilling: true,
    emailMessages: true,
    emailBroadcasts: true,
    emailTeam: false,
    emailBilling: true,
    weeklyDigest: true,
    browserEnabled: false,
    browserMessages: true,
    browserBroadcasts: false,
    marketingEmails: false,
    dndEnabled: false,
  });
  const [dndFrom, setDndFrom] = useState("22:00");
  const [dndTo, setDndTo] = useState("08:00");

  const togglePref = (key: keyof typeof prefs) => {
    setPrefs(prev => ({ ...prev, [key]: !prev[key] }));
    toast.success("Preference updated");
  };

  const handleBrowserEnable = () => {
    if (!prefs.browserEnabled) {
      // Simulate permission request
      toast.info("Browser notifications enabled");
    }
    togglePref("browserEnabled");
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className="space-y-6"
    >
      <SectionHeader title="Notifications" description="Control how and when Turumba notifies you." />
      <Separator />

      {/* In-App Notifications */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
              <Bell className="w-4 h-4 text-primary" />
            </div>
            <div>
              <CardTitle className="text-sm font-semibold">In-App Notifications</CardTitle>
              <CardDescription className="text-xs">Alerts that appear in the notification bell inside Turumba.</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-0">
          {[
            { key: "inAppMessages" as const, label: "New messages", description: "When a contact sends or replies to a message." },
            { key: "inAppBroadcasts" as const, label: "Broadcast updates", description: "Delivery reports and failures for broadcasts." },
            { key: "inAppTeam" as const, label: "Team activity", description: "When teammates are added, removed, or change roles." },
            { key: "inAppBilling" as const, label: "Billing alerts", description: "Usage limits, upcoming renewals, and payment issues." },
          ].map((item, idx) => (
            <div key={item.key}>
              {idx > 0 && <Separator className="my-4" />}
              <div className="flex items-center justify-between">
                <div className="space-y-0.5 pr-4">
                  <p className="text-sm font-medium text-foreground">{item.label}</p>
                  <p className="text-[13px] text-muted-foreground">{item.description}</p>
                </div>
                <Switch
                  checked={prefs[item.key]}
                  onCheckedChange={() => togglePref(item.key)}
                  aria-label={item.label}
                />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Email Notifications */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-purple-100 flex items-center justify-center shrink-0">
              <Mail className="w-4 h-4 text-purple-600" />
            </div>
            <div>
              <CardTitle className="text-sm font-semibold">Email Notifications</CardTitle>
              <CardDescription className="text-xs">Emails sent to your account address.</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-0">
          {[
            { key: "emailMessages" as const, label: "Message summaries", description: "A digest of unread messages if you're away." },
            { key: "emailBroadcasts" as const, label: "Broadcast reports", description: "Full delivery report emailed after broadcasts complete." },
            { key: "emailTeam" as const, label: "Team changes", description: "When someone joins or leaves your workspace." },
            { key: "emailBilling" as const, label: "Billing receipts", description: "Payment confirmations and upcoming renewal reminders." },
            { key: "weeklyDigest" as const, label: "Weekly digest", description: "Summary of key metrics and activity every Monday." },
          ].map((item, idx) => (
            <div key={item.key}>
              {idx > 0 && <Separator className="my-4" />}
              <div className="flex items-center justify-between">
                <div className="space-y-0.5 pr-4">
                  <p className="text-sm font-medium text-foreground">{item.label}</p>
                  <p className="text-[13px] text-muted-foreground">{item.description}</p>
                </div>
                <Switch
                  checked={prefs[item.key]}
                  onCheckedChange={() => togglePref(item.key)}
                  aria-label={item.label}
                />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Browser / Desktop Notifications */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-sky-100 flex items-center justify-center shrink-0">
              <Globe className="w-4 h-4 text-sky-600" />
            </div>
            <div>
              <CardTitle className="text-sm font-semibold">Browser Notifications</CardTitle>
              <CardDescription className="text-xs">Desktop alerts even when Turumba is in the background.</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5 pr-4">
              <p className="text-sm font-medium text-foreground">Enable browser notifications</p>
              <p className="text-[13px] text-muted-foreground">Requires browser permission. You can revoke this anytime.</p>
            </div>
            <Switch
              checked={prefs.browserEnabled}
              onCheckedChange={handleBrowserEnable}
              aria-label="Enable browser notifications"
            />
          </div>
          {prefs.browserEnabled && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="space-y-0 pt-2 border-t">
              {[
                { key: "browserMessages" as const, label: "Incoming messages", description: "Show a desktop alert for new messages." },
                { key: "browserBroadcasts" as const, label: "Broadcast completions", description: "Alert when a broadcast finishes sending." },
              ].map((item, idx) => (
                <div key={item.key}>
                  {idx > 0 && <Separator className="my-4" />}
                  <div className="flex items-center justify-between pt-3">
                    <div className="space-y-0.5 pr-4 pl-2">
                      <p className="text-sm font-medium text-foreground">{item.label}</p>
                      <p className="text-[13px] text-muted-foreground">{item.description}</p>
                    </div>
                    <Switch
                      checked={prefs[item.key]}
                      onCheckedChange={() => togglePref(item.key)}
                      aria-label={item.label}
                    />
                  </div>
                </div>
              ))}
            </motion.div>
          )}
        </CardContent>
      </Card>

      {/* Do Not Disturb Schedule */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center shrink-0">
              <Clock className="w-4 h-4 text-amber-600" />
            </div>
            <div>
              <CardTitle className="text-sm font-semibold">Quiet Hours</CardTitle>
              <CardDescription className="text-xs">Pause all non-critical notifications during set times.</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5 pr-4">
              <p className="text-sm font-medium text-foreground">Enable quiet hours</p>
              <p className="text-[13px] text-muted-foreground">In-app and browser alerts will be silenced. Emails are unaffected.</p>
            </div>
            <Switch
              checked={prefs.dndEnabled}
              onCheckedChange={() => togglePref("dndEnabled")}
              aria-label="Enable quiet hours"
            />
          </div>
          {prefs.dndEnabled && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center gap-3 pt-2 border-t pl-2">
              <div className="grid gap-1.5">
                <Label className="text-xs text-muted-foreground">From</Label>
                <Input
                  type="time"
                  value={dndFrom}
                  onChange={(e) => setDndFrom(e.target.value)}
                  className="w-32 h-8 text-xs"
                  aria-label="Quiet hours start time"
                />
              </div>
              <span className="text-muted-foreground text-xs mt-5">to</span>
              <div className="grid gap-1.5">
                <Label className="text-xs text-muted-foreground">Until</Label>
                <Input
                  type="time"
                  value={dndTo}
                  onChange={(e) => setDndTo(e.target.value)}
                  className="w-32 h-8 text-xs"
                  aria-label="Quiet hours end time"
                />
              </div>
            </motion.div>
          )}
        </CardContent>
      </Card>

      {/* Marketing */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-semibold">Product & Marketing</CardTitle>
          <CardDescription className="text-xs">Occasional emails from Turumba about new features.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="space-y-0.5 pr-4">
              <p className="text-sm font-medium text-foreground">Product updates & tips</p>
              <p className="text-[13px] text-muted-foreground">New features, best practices, and platform news. No spam.</p>
            </div>
            <Switch
              checked={prefs.marketingEmails}
              onCheckedChange={() => togglePref("marketingEmails")}
              aria-label="Product updates and tips"
            />
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

// --- Security Section ---
const SecuritySection = () => {
  const [showPasswordForm, setShowPasswordForm] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className="space-y-6"
    >
      <SectionHeader title="Security" description="Manage your password and account protection." />
      <Separator />

      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-semibold">Password</CardTitle>
          <CardDescription className="text-xs">Last changed 3 months ago.</CardDescription>
        </CardHeader>
        <CardContent>
          {!showPasswordForm ? (
            <Button variant="outline" size="sm" onClick={() => setShowPasswordForm(true)}>
              <Key className="w-3.5 h-3.5" />
              Change Password
            </Button>
          ) : (
            <div className="space-y-4">
              <FormField label="Current Password" htmlFor="current-pw">
                <Input id="current-pw" type="password" placeholder="Enter current password" />
              </FormField>
              <FormField label="New Password" htmlFor="new-pw">
                <Input id="new-pw" type="password" placeholder="Enter new password" />
              </FormField>
              <FormField label="Confirm Password" htmlFor="confirm-pw">
                <Input id="confirm-pw" type="password" placeholder="Confirm new password" />
              </FormField>
              <div className="flex items-center gap-2 pt-1">
                <Button size="sm" onClick={() => { setShowPasswordForm(false); toast.success("Password updated successfully"); }}>
                  Update Password
                </Button>
                <Button variant="ghost" size="sm" onClick={() => setShowPasswordForm(false)}>
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-semibold">Two-Factor Authentication</CardTitle>
          <CardDescription className="text-xs">Add an extra layer of security to your account.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between p-4 bg-emerald-50 rounded-lg border border-emerald-200">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-emerald-100 flex items-center justify-center">
                <Shield className="w-4 h-4 text-emerald-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-emerald-900">2FA is enabled</p>
                <p className="text-xs text-emerald-700">Using authenticator app</p>
              </div>
            </div>
            <Badge variant="outline" className="border-emerald-300 text-emerald-700 bg-emerald-50 text-xs">Active</Badge>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-semibold">Active Sessions</CardTitle>
          <CardDescription className="text-xs">Devices where you're currently signed in.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-0">
          {[
            { device: "Chrome on macOS", location: "San Francisco, CA", current: true, time: "Now" },
            { device: "Safari on iPhone", location: "San Francisco, CA", current: false, time: "2 hours ago" },
          ].map((session, idx) => (
            <div key={idx}>
              {idx > 0 && <Separator className="my-3" />}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center">
                    {session.device.includes("iPhone") ? (
                      <Smartphone className="w-3.5 h-3.5 text-muted-foreground" />
                    ) : (
                      <Globe className="w-3.5 h-3.5 text-muted-foreground" />
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">
                      {session.device}
                      {session.current && <Badge variant="secondary" className="ml-2 text-xs">This device</Badge>}
                    </p>
                    <p className="text-xs text-muted-foreground">{session.location} &middot; {session.time}</p>
                  </div>
                </div>
                {!session.current && (
                  <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive hover:bg-destructive/10 text-xs">
                    Revoke
                  </Button>
                )}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card className="border-destructive/20">
        <CardHeader>
          <CardTitle className="text-sm font-semibold text-destructive">Danger Zone</CardTitle>
          <CardDescription className="text-xs">Irreversible actions for your account.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <p className="text-sm font-medium text-foreground">Delete Account</p>
              <p className="text-[13px] text-muted-foreground">Permanently remove your account and all data.</p>
            </div>
            <Button variant="destructive" size="sm">
              Delete Account
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

// --- Child Organizations Section (Tabbed) ---

const ORG_STATUS_CONFIG: Record<OrgStatus, { label: string; color: string; dot: string }> = {
  active: { label: "Active", color: "bg-emerald-50 text-emerald-700 border-emerald-200", dot: "bg-emerald-500" },
  suspended: { label: "Suspended", color: "bg-rose-50 text-rose-700 border-rose-200", dot: "bg-rose-500" },
  pending: { label: "Pending", color: "bg-amber-50 text-amber-700 border-amber-200", dot: "bg-amber-500" },
};

type OrgSettingsTab = "overview" | "rules" | "resources" | "activity";
const ORG_TABS: { id: OrgSettingsTab; label: string; icon: any }[] = [
  { id: "overview", label: "Overview", icon: Building2 },
  { id: "rules", label: "Rules & Policies", icon: Shield },
  { id: "resources", label: "Shared Resources", icon: Share2 },
  { id: "activity", label: "Activity & Audit", icon: Eye },
];

// ── Rules & Policies Sub-tab ──
const RulesPoliciesTab = () => {
  const [contentRules, setContentRules] = useState({
    requireDisclaimer: true, disclaimerText: "Message from GCM Ethiopia",
    blockedKeywords: "spam, gambling, politics",
    toneGuideline: "warm" as "formal" | "warm" | "casual",
    enforceLanguage: false, requiredLanguages: "Amharic, English",
  });
  const [automationRules, setAutomationRules] = useState({
    pushNewAutomations: true, lockEnforcedAutomations: true,
    enforcedAutomations: ["Welcome Message", "7-Day Onboarding Sequence", "Post-Lesson Check-in"],
  });
  const [userRules, setUserRules] = useState({
    maxUsersPerOrg: 25, requireAdmin: true, requireApprovalForInvites: false,
    allowedRoles: ["admin", "agent", "viewer"] as string[],
  });
  const [dataRules, setDataRules] = useState({
    retentionDays: 365, allowExport: true, allowBulkDelete: false,
    auditLogRetention: 90, superOrgCanAccess: true,
  });

  return (
    <div className="space-y-6">
      {/* Content & Messaging */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-semibold flex items-center gap-2"><Mail className="w-4 h-4 text-blue-500" /> Content & Messaging Rules</CardTitle>
          <CardDescription className="text-xs">Control messaging standards across all child organizations</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-foreground">Require Disclaimer</p>
              <p className="text-xs text-muted-foreground">All outgoing messages must include a disclaimer footer</p>
            </div>
            <Switch checked={contentRules.requireDisclaimer} onCheckedChange={(v) => setContentRules(p => ({ ...p, requireDisclaimer: v }))} aria-label="Require disclaimer" />
          </div>
          {contentRules.requireDisclaimer && (
            <FormField label="Disclaimer Text">
              <Input value={contentRules.disclaimerText} onChange={(e) => setContentRules(p => ({ ...p, disclaimerText: e.target.value }))} aria-label="Disclaimer text" />
            </FormField>
          )}
          <FormField label="Blocked Keywords" description="Comma-separated words that cannot appear in any outgoing message">
            <Textarea value={contentRules.blockedKeywords} onChange={(e) => setContentRules(p => ({ ...p, blockedKeywords: e.target.value }))} rows={2} aria-label="Blocked keywords" />
          </FormField>
          <FormField label="Tone Guideline">
            <select value={contentRules.toneGuideline} onChange={(e) => setContentRules(p => ({ ...p, toneGuideline: e.target.value as any }))} className="h-10 w-full px-3 rounded-md border border-input bg-background text-sm" aria-label="Tone guideline">
              <option value="formal">Formal</option>
              <option value="warm">Warm & Friendly</option>
              <option value="casual">Casual</option>
            </select>
          </FormField>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-foreground">Enforce Language Requirements</p>
              <p className="text-xs text-muted-foreground">Child orgs must support these languages</p>
            </div>
            <Switch checked={contentRules.enforceLanguage} onCheckedChange={(v) => setContentRules(p => ({ ...p, enforceLanguage: v }))} aria-label="Enforce language requirements" />
          </div>
          {contentRules.enforceLanguage && (
            <FormField label="Required Languages">
              <Input value={contentRules.requiredLanguages} onChange={(e) => setContentRules(p => ({ ...p, requiredLanguages: e.target.value }))} aria-label="Required languages" />
            </FormField>
          )}
          <Button size="sm" onClick={() => toast.success("Content rules saved")}><Save className="w-3.5 h-3.5 mr-1.5" /> Save Rules</Button>
        </CardContent>
      </Card>

      {/* Automation Rules */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-semibold flex items-center gap-2"><Zap className="w-4 h-4 text-amber-500" /> Automation Rules</CardTitle>
          <CardDescription className="text-xs">Manage automations pushed to child organizations</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-foreground">Auto-Push New Automations</p>
              <p className="text-xs text-muted-foreground">Newly created automations are automatically pushed to all child orgs</p>
            </div>
            <Switch checked={automationRules.pushNewAutomations} onCheckedChange={(v) => setAutomationRules(p => ({ ...p, pushNewAutomations: v }))} aria-label="Auto-push new automations" />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-foreground">Lock Enforced Automations</p>
              <p className="text-xs text-muted-foreground">Child orgs cannot edit or delete enforced automations (they can duplicate)</p>
            </div>
            <Switch checked={automationRules.lockEnforcedAutomations} onCheckedChange={(v) => setAutomationRules(p => ({ ...p, lockEnforcedAutomations: v }))} aria-label="Lock enforced automations" />
          </div>
          <div>
            <p className="text-sm font-medium text-foreground mb-2">Enforced Automations</p>
            <div className="space-y-2">
              {automationRules.enforcedAutomations.map((name, i) => (
                <div key={i} className="flex items-center justify-between px-3 py-2 bg-muted/30 border border-border rounded-md">
                  <div className="flex items-center gap-2">
                    <Zap className="w-3.5 h-3.5 text-amber-500" />
                    <span className="text-sm font-medium text-foreground">{name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs">{automationRules.lockEnforcedAutomations ? "Locked" : "Customizable"}</Badge>
                    <button onClick={() => { setAutomationRules(p => ({ ...p, enforcedAutomations: p.enforcedAutomations.filter((_, j) => j !== i) })); toast.success("Removed"); }} className="p-1 text-muted-foreground hover:text-destructive transition-colors"><X className="w-3 h-3" /></button>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <Button size="sm" onClick={() => toast.success("Automation rules saved")}><Save className="w-3.5 h-3.5 mr-1.5" /> Save Rules</Button>
        </CardContent>
      </Card>

      {/* User & Access Rules */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-semibold flex items-center gap-2"><Users className="w-4 h-4 text-indigo-500" /> User & Access Rules</CardTitle>
          <CardDescription className="text-xs">Control team management in child organizations</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <FormField label="Max Team Members Per Org" description="Set to 0 for unlimited">
            <Input type="number" min={0} value={userRules.maxUsersPerOrg} onChange={(e) => setUserRules(p => ({ ...p, maxUsersPerOrg: parseInt(e.target.value) || 0 }))} aria-label="Maximum team members per organization" />
          </FormField>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-foreground">Require At Least 1 Admin</p>
              <p className="text-xs text-muted-foreground">Every child org must have at least one admin user</p>
            </div>
            <Switch checked={userRules.requireAdmin} onCheckedChange={(v) => setUserRules(p => ({ ...p, requireAdmin: v }))} aria-label="Require at least one admin" />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-foreground">Require Approval for Invites</p>
              <p className="text-xs text-muted-foreground">Child org invitations need super org approval before being sent</p>
            </div>
            <Switch checked={userRules.requireApprovalForInvites} onCheckedChange={(v) => setUserRules(p => ({ ...p, requireApprovalForInvites: v }))} aria-label="Require approval for invites" />
          </div>
          <Button size="sm" onClick={() => toast.success("User rules saved")}><Save className="w-3.5 h-3.5 mr-1.5" /> Save Rules</Button>
        </CardContent>
      </Card>

      {/* Data & Privacy */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-semibold flex items-center gap-2"><Lock className="w-4 h-4 text-rose-500" /> Data & Privacy Rules</CardTitle>
          <CardDescription className="text-xs">Set data retention and access policies</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <FormField label="Data Retention Period (days)" description="How long contact and message data is kept">
            <select value={dataRules.retentionDays} onChange={(e) => setDataRules(p => ({ ...p, retentionDays: parseInt(e.target.value) }))} className="h-10 w-full px-3 rounded-md border border-input bg-background text-sm" aria-label="Data retention period">
              <option value={30}>30 days</option><option value={60}>60 days</option><option value={90}>90 days</option>
              <option value={180}>180 days</option><option value={365}>1 year</option><option value={730}>2 years</option>
            </select>
          </FormField>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-foreground">Allow Data Export</p>
              <p className="text-xs text-muted-foreground">Child orgs can export their contacts and message data</p>
            </div>
            <Switch checked={dataRules.allowExport} onCheckedChange={(v) => setDataRules(p => ({ ...p, allowExport: v }))} aria-label="Allow data export" />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-foreground">Allow Bulk Delete</p>
              <p className="text-xs text-muted-foreground">Child orgs can bulk-delete contacts (dangerous)</p>
            </div>
            <Switch checked={dataRules.allowBulkDelete} onCheckedChange={(v) => setDataRules(p => ({ ...p, allowBulkDelete: v }))} aria-label="Allow bulk delete" />
          </div>
          <FormField label="Audit Log Retention (days)">
            <select value={dataRules.auditLogRetention} onChange={(e) => setDataRules(p => ({ ...p, auditLogRetention: parseInt(e.target.value) }))} className="h-10 w-full px-3 rounded-md border border-input bg-background text-sm" aria-label="Audit log retention period">
              <option value={30}>30 days</option><option value={60}>60 days</option><option value={90}>90 days</option><option value={365}>1 year</option>
            </select>
          </FormField>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-foreground">Super Org Full Access</p>
              <p className="text-xs text-muted-foreground">Super org admins can view all child org data at any time</p>
            </div>
            <Switch checked={dataRules.superOrgCanAccess} onCheckedChange={(v) => setDataRules(p => ({ ...p, superOrgCanAccess: v }))} aria-label="Super org full access" />
          </div>
          <Button size="sm" onClick={() => toast.success("Data rules saved")}><Save className="w-3.5 h-3.5 mr-1.5" /> Save Rules</Button>
        </CardContent>
      </Card>
    </div>
  );
};

// ── Shared Resources Sub-tab ──
const MOCK_SHARED_RESOURCES = [
  { id: "r1", name: "Welcome Message", type: "automation" as const, status: "pushed" as const, pushedTo: 5, lastPushed: "2026-05-20" },
  { id: "r2", name: "7-Day Onboarding Sequence", type: "automation" as const, status: "pushed" as const, pushedTo: 5, lastPushed: "2026-05-18" },
  { id: "r3", name: "Post-Lesson Check-in", type: "automation" as const, status: "pushed" as const, pushedTo: 3, lastPushed: "2026-05-15" },
  { id: "r4", name: "Foundations of Faith Drip", type: "automation" as const, status: "not_shared" as const, pushedTo: 0, lastPushed: "" },
  { id: "r5", name: "Weekly Digest Template", type: "template" as const, status: "pushed" as const, pushedTo: 5, lastPushed: "2026-05-22" },
  { id: "r6", name: "Prayer Request Reply", type: "template" as const, status: "pushed" as const, pushedTo: 4, lastPushed: "2026-05-10" },
  { id: "r7", name: "What is Faith?", type: "content" as const, status: "pushed" as const, pushedTo: 5, lastPushed: "2026-04-28" },
  { id: "r8", name: "Understanding Grace", type: "content" as const, status: "not_shared" as const, pushedTo: 0, lastPushed: "" },
  { id: "r9", name: "Baptism Preparation Guide", type: "content" as const, status: "pushed" as const, pushedTo: 3, lastPushed: "2026-05-05" },
  { id: "r10", name: "Mentor Onboarding Checklist", type: "template" as const, status: "not_shared" as const, pushedTo: 0, lastPushed: "" },
];

const SharedResourcesTab = ({ childOrgCount }: { childOrgCount: number }) => {
  const [resources, setResources] = useState(MOCK_SHARED_RESOURCES);
  const [filterType, setFilterType] = useState<"all" | "automation" | "template" | "content">("all");

  const filtered = filterType === "all" ? resources : resources.filter(r => r.type === filterType);
  const typeIcon = (t: string) => t === "automation" ? Zap : t === "template" ? Mail : BookOpen;
  const typeColor = (t: string) => t === "automation" ? "text-amber-500" : t === "template" ? "text-blue-500" : "text-emerald-500";

  const handlePush = (id: string) => {
    setResources(prev => prev.map(r => r.id === id ? { ...r, status: "pushed" as const, pushedTo: childOrgCount, lastPushed: new Date().toISOString().slice(0, 10) } : r));
    toast.success("Resource pushed to all child organizations");
  };
  const handleUnpush = (id: string) => {
    setResources(prev => prev.map(r => r.id === id ? { ...r, status: "not_shared" as const, pushedTo: 0, lastPushed: "" } : r));
    toast.success("Resource unpushed");
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base font-semibold text-foreground">Shared Resources</h3>
          <p className="text-sm text-muted-foreground mt-0.5">Push automations, templates, and content to child organizations</p>
        </div>
        <select value={filterType} onChange={(e) => setFilterType(e.target.value as any)} className="h-9 px-3 rounded-md border border-input bg-background text-sm" aria-label="Filter by resource type">
          <option value="all">All types</option><option value="automation">Automations</option><option value="template">Templates</option><option value="content">Content</option>
        </select>
      </div>

      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Pushed", value: resources.filter(r => r.status === "pushed").length, color: "text-emerald-600" },
          { label: "Not Shared", value: resources.filter(r => r.status === "not_shared").length, color: "text-muted-foreground" },
          { label: "Total Resources", value: resources.length, color: "text-primary" },
        ].map(s => (
          <div key={s.label} className="bg-muted/30 border border-border rounded-lg px-4 py-3 text-center">
            <p className={cn("text-xl font-bold", s.color)}>{s.value}</p>
            <p className="text-xs text-muted-foreground">{s.label}</p>
          </div>
        ))}
      </div>

      <Card>
        <CardContent className="p-0">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground">Resource</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground">Type</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground">Status</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-muted-foreground">Pushed To</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-muted-foreground">Last Pushed</th>
                <th className="px-4 py-3 w-24"></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(res => {
                const TIcon = typeIcon(res.type);
                return (
                  <tr key={res.id} className="border-b border-border last:border-0 hover:bg-muted/20 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        <TIcon className={cn("w-4 h-4 shrink-0", typeColor(res.type))} />
                        <span className="font-medium text-foreground">{res.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3"><Badge variant="outline" className="text-xs capitalize">{res.type}</Badge></td>
                    <td className="px-4 py-3">
                      {res.status === "pushed"
                        ? <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700"><CheckCircle2 className="w-3 h-3" /> Pushed</span>
                        : <span className="text-xs text-muted-foreground">Not shared</span>}
                    </td>
                    <td className="px-4 py-3 text-right font-medium text-foreground tabular-nums">{res.pushedTo > 0 ? `${res.pushedTo} orgs` : "—"}</td>
                    <td className="px-4 py-3 text-right text-xs text-muted-foreground">{res.lastPushed || "—"}</td>
                    <td className="px-4 py-3 text-right">
                      {res.status === "pushed"
                        ? <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => handleUnpush(res.id)}>Unpush</Button>
                        : <Button size="sm" className="h-7 text-xs" onClick={() => handlePush(res.id)}>Push to All</Button>}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
};

// ── Activity & Audit Sub-tab ──
const MOCK_AUDIT_LOG = [
  { id: "a1", action: "org_created", description: "Created Dire Dawa Chapter", actor: "Admin", orgName: "Dire Dawa Chapter", timestamp: "2025-06-01T10:30:00Z" },
  { id: "a2", action: "rule_changed", description: "Updated content disclaimer text", actor: "Admin", orgName: "All orgs", timestamp: "2026-05-28T14:15:00Z" },
  { id: "a3", action: "automation_pushed", description: "Pushed 'Welcome Message' to all child orgs", actor: "Admin", orgName: "All orgs", timestamp: "2026-05-20T09:00:00Z" },
  { id: "a4", action: "org_suspended", description: "Suspended Mekelle Chapter — restructuring", actor: "Admin", orgName: "Mekelle Chapter", timestamp: "2026-05-15T11:45:00Z" },
  { id: "a5", action: "user_added", description: "Added mentor 'Desta Hailu' to Hawassa Chapter", actor: "Admin", orgName: "Hawassa Chapter", timestamp: "2026-05-12T08:20:00Z" },
  { id: "a6", action: "template_pushed", description: "Pushed 'Weekly Digest Template' to all orgs", actor: "Admin", orgName: "All orgs", timestamp: "2026-05-10T16:30:00Z" },
  { id: "a7", action: "org_activated", description: "Activated Bahir Dar Chapter", actor: "Admin", orgName: "Bahir Dar Chapter", timestamp: "2026-04-20T13:00:00Z" },
  { id: "a8", action: "rule_changed", description: "Set data retention to 1 year for all orgs", actor: "Admin", orgName: "All orgs", timestamp: "2026-04-15T10:00:00Z" },
  { id: "a9", action: "content_pushed", description: "Pushed 'What is Faith?' lesson to all orgs", actor: "Admin", orgName: "All orgs", timestamp: "2026-04-10T09:30:00Z" },
  { id: "a10", action: "org_created", description: "Created Bahir Dar Chapter", actor: "Admin", orgName: "Bahir Dar Chapter", timestamp: "2025-03-20T10:00:00Z" },
  { id: "a11", action: "org_created", description: "Created Hawassa Chapter", actor: "Admin", orgName: "Hawassa Chapter", timestamp: "2025-01-10T09:00:00Z" },
  { id: "a12", action: "org_created", description: "Created Addis Ababa Chapter", actor: "Admin", orgName: "Addis Ababa Chapter", timestamp: "2024-09-15T10:00:00Z" },
];

const ACTION_ICONS: Record<string, { icon: any; color: string }> = {
  org_created: { icon: Plus, color: "text-emerald-500" },
  org_suspended: { icon: PauseCircle, color: "text-rose-500" },
  org_activated: { icon: PlayCircle, color: "text-emerald-500" },
  rule_changed: { icon: Shield, color: "text-amber-500" },
  automation_pushed: { icon: Zap, color: "text-blue-500" },
  template_pushed: { icon: Mail, color: "text-violet-500" },
  content_pushed: { icon: BookOpen, color: "text-teal-500" },
  user_added: { icon: User, color: "text-indigo-500" },
};

const ActivityAuditTab = () => {
  const [filterAction, setFilterAction] = useState<string>("all");

  const filtered = filterAction === "all" ? MOCK_AUDIT_LOG : MOCK_AUDIT_LOG.filter(a => a.action === filterAction);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base font-semibold text-foreground">Activity & Audit Log</h3>
          <p className="text-sm text-muted-foreground mt-0.5">Track all super org actions across child organizations</p>
        </div>
        <select value={filterAction} onChange={(e) => setFilterAction(e.target.value)} className="h-9 px-3 rounded-md border border-input bg-background text-sm" aria-label="Filter by action type">
          <option value="all">All actions</option>
          <option value="org_created">Org created</option>
          <option value="org_suspended">Org suspended</option>
          <option value="org_activated">Org activated</option>
          <option value="rule_changed">Rule changed</option>
          <option value="automation_pushed">Automation pushed</option>
          <option value="template_pushed">Template pushed</option>
          <option value="content_pushed">Content pushed</option>
          <option value="user_added">User added</option>
        </select>
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="divide-y divide-border">
            {filtered.length === 0 ? (
              <div className="px-4 py-12 text-center text-muted-foreground">No activity matching this filter.</div>
            ) : filtered.map(entry => {
              const cfg = ACTION_ICONS[entry.action] || { icon: AlertCircle, color: "text-muted-foreground" };
              const AIcon = cfg.icon;
              const date = new Date(entry.timestamp);
              const timeAgo = (() => {
                const diff = Date.now() - date.getTime();
                const days = Math.floor(diff / 86400000);
                if (days === 0) return "Today";
                if (days === 1) return "Yesterday";
                if (days < 30) return `${days}d ago`;
                if (days < 365) return `${Math.floor(days / 30)}mo ago`;
                return `${Math.floor(days / 365)}y ago`;
              })();
              return (
                <div key={entry.id} className="flex items-start gap-3 px-4 py-3 hover:bg-muted/20 transition-colors">
                  <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center shrink-0 bg-muted/50 mt-0.5")}>
                    <AIcon className={cn("w-4 h-4", cfg.color)} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground">{entry.description}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-xs text-muted-foreground">{entry.actor}</span>
                      <span className="text-xs text-muted-foreground">·</span>
                      <span className="text-xs text-muted-foreground">{entry.orgName}</span>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-xs font-medium text-muted-foreground">{timeAgo}</p>
                    <p className="text-xs text-muted-foreground">{date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

const ChildOrgsSection = ({
  parentOrg, childOrgs, onCreateChildOrg, onUpdateChildOrg, onDeleteChildOrg, onViewChildOrg,
}: {
  parentOrg: Tenant;
  childOrgs: Tenant[];
  onCreateChildOrg?: (data: Partial<Tenant>) => void;
  onUpdateChildOrg?: (id: string, data: Partial<Tenant>) => void;
  onDeleteChildOrg?: (id: string) => void;
  onViewChildOrg?: (id: string) => void;
}) => {
  const [activeOrgTab, setActiveOrgTab] = useState<OrgSettingsTab>("overview");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newOrg, setNewOrg] = useState({ name: "", region: "", description: "" });
  const [selectedOrg, setSelectedOrg] = useState<Tenant | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const totalContacts = childOrgs.reduce((s, o) => s + o.stats.contacts, 0);
  const totalMessages = childOrgs.reduce((s, o) => s + o.stats.messages, 0);
  const totalUsers = childOrgs.reduce((s, o) => s + o.stats.activeUsers, 0);
  const activeCount = childOrgs.filter(o => o.orgStatus === "active").length;

  const handleCreate = () => {
    if (!newOrg.name.trim()) return;
    onCreateChildOrg?.(newOrg);
    setNewOrg({ name: "", region: "", description: "" });
    setIsCreateOpen(false);
    toast.success(`"${newOrg.name}" created`);
  };

  const handleStatusChange = (id: string, status: OrgStatus) => {
    onUpdateChildOrg?.(id, { orgStatus: status });
    const label = status === "active" ? "activated" : status === "suspended" ? "suspended" : "set to pending";
    toast.success(`Organization ${label}`);
  };

  // Detail view for a selected child org
  if (selectedOrg) {
    const org = childOrgs.find(o => o.id === selectedOrg.id) || selectedOrg;
    const statusCfg = ORG_STATUS_CONFIG[org.orgStatus || "active"];
    return (
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }} className="space-y-6">
        <div className="flex items-center gap-3">
          <button onClick={() => setSelectedOrg(null)} className="p-1.5 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div className="flex-1 min-w-0">
            <h2 className="text-lg font-semibold text-foreground">{org.name}</h2>
            <p className="text-sm text-muted-foreground">{org.region} · Created {new Date(org.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</p>
          </div>
          <span className={cn("inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-full border", statusCfg.color)}>
            <span className={cn("w-1.5 h-1.5 rounded-full", statusCfg.dot)} />
            {statusCfg.label}
          </span>
        </div>
        <Separator />

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: "Contacts", value: org.stats.contacts.toLocaleString(), icon: Users },
            { label: "Messages", value: org.stats.messages.toLocaleString(), icon: MessageSquare },
            { label: "Team Members", value: org.stats.activeUsers, icon: User },
          ].map(s => (
            <Card key={s.label}>
              <CardContent className="p-4 flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                  <s.icon className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-xl font-bold text-foreground">{s.value}</p>
                  <p className="text-xs text-muted-foreground">{s.label}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Details */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-semibold">Organization Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField label="Organization Name">
                <Input value={org.name} onChange={(e) => onUpdateChildOrg?.(org.id, { name: e.target.value })} aria-label="Organization name" />
              </FormField>
              <FormField label="Region">
                <Input value={org.region || ""} onChange={(e) => onUpdateChildOrg?.(org.id, { region: e.target.value })} aria-label="Region" />
              </FormField>
            </div>
            <FormField label="Description">
              <Textarea value={org.description || ""} onChange={(e) => onUpdateChildOrg?.(org.id, { description: e.target.value })} rows={3} aria-label="Description" />
            </FormField>
            <FormField label="Plan">
              <select
                value={org.plan}
                onChange={(e) => onUpdateChildOrg?.(org.id, { plan: e.target.value as Plan })}
                className="h-10 w-full px-3 rounded-md border border-input bg-background text-sm"
                aria-label="Plan"
              >
                <option value="free">Free</option>
                <option value="pro">Pro</option>
                <option value="enterprise">Enterprise</option>
              </select>
            </FormField>
          </CardContent>
        </Card>

        {/* Status Management */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-semibold">Status & Actions</CardTitle>
            <CardDescription className="text-xs">Control this organization's access and status</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-3">
              {org.orgStatus !== "active" && (
                <Button size="sm" onClick={() => handleStatusChange(org.id, "active")}>
                  <PlayCircle className="w-3.5 h-3.5 mr-1.5" /> Activate
                </Button>
              )}
              {org.orgStatus !== "suspended" && (
                <Button size="sm" variant="outline" onClick={() => handleStatusChange(org.id, "suspended")}>
                  <PauseCircle className="w-3.5 h-3.5 mr-1.5" /> Suspend
                </Button>
              )}
              <Button size="sm" variant="outline" onClick={() => onViewChildOrg?.(org.id)}>
                <ExternalLink className="w-3.5 h-3.5 mr-1.5" /> View Dashboard
              </Button>
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-destructive">Delete Organization</p>
                <p className="text-xs text-muted-foreground">This action cannot be undone. All data will be lost.</p>
              </div>
              <Button size="sm" variant="destructive" onClick={() => { onDeleteChildOrg?.(org.id); setSelectedOrg(null); toast.success("Organization deleted"); }}>
                <Trash2 className="w-3.5 h-3.5 mr-1.5" /> Delete
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }} className="space-y-6">
      <div className="flex items-center justify-between">
        <SectionHeader title="Organizations" description="Manage your sub-organizations and chapters." />
        {activeOrgTab === "overview" && (
          <Button size="sm" onClick={() => setIsCreateOpen(true)}>
            <Plus className="w-3.5 h-3.5 mr-1.5" /> New Organization
          </Button>
        )}
      </div>

      {/* Tab bar */}
      <div className="flex items-center gap-1 border-b border-border" role="tablist" aria-label="Organization settings">
        {ORG_TABS.map(tab => {
          const isActive = activeOrgTab === tab.id;
          const TabIcon = tab.icon;
          return (
            <button
              key={tab.id}
              role="tab"
              id={`tab-org-${tab.id}`}
              aria-selected={isActive}
              onClick={() => setActiveOrgTab(tab.id)}
              className={cn(
                "flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-all -mb-px",
                isActive
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground hover:border-border"
              )}
            >
              <TabIcon className="w-3.5 h-3.5" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Rules & Policies tab */}
      {activeOrgTab === "rules" && <div role="tabpanel" aria-labelledby="tab-org-rules"><RulesPoliciesTab /></div>}

      {/* Shared Resources tab */}
      {activeOrgTab === "resources" && <div role="tabpanel" aria-labelledby="tab-org-resources"><SharedResourcesTab childOrgCount={childOrgs.length} /></div>}

      {/* Activity & Audit tab */}
      {activeOrgTab === "activity" && <div role="tabpanel" aria-labelledby="tab-org-activity"><ActivityAuditTab /></div>}

      {/* Overview tab — original content below */}
      {activeOrgTab === "overview" && (<div role="tabpanel" aria-labelledby="tab-org-overview">


      {/* Summary stats */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { label: "Total Orgs", value: childOrgs.length, icon: Building2, color: "text-primary" },
          { label: "Active", value: activeCount, icon: CheckCircle2, color: "text-emerald-600" },
          { label: "Total Contacts", value: totalContacts.toLocaleString(), icon: Users, color: "text-blue-600" },
          { label: "Total Messages", value: totalMessages.toLocaleString(), icon: MessageSquare, color: "text-violet-600" },
        ].map(s => (
          <div key={s.label} className="bg-muted/30 border border-border rounded-lg px-4 py-3 flex items-center gap-3">
            <s.icon className={cn("w-4 h-4", s.color)} />
            <div>
              <p className="text-lg font-bold text-foreground leading-none">{s.value}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Orgs table */}
      <Card>
        <CardContent className="p-0">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground">Organization</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground">Region</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground">Status</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-muted-foreground">Contacts</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-muted-foreground">Team</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-muted-foreground">Plan</th>
                <th className="px-4 py-3 w-10"></th>
              </tr>
            </thead>
            <tbody>
              {childOrgs.length === 0 ? (
                <tr><td colSpan={7} className="px-4 py-12 text-center text-muted-foreground">No sub-organizations yet. Create one to get started.</td></tr>
              ) : childOrgs.map(org => {
                const statusCfg = ORG_STATUS_CONFIG[org.orgStatus || "active"];
                return (
                  <tr key={org.id} className="border-b border-border last:border-0 hover:bg-muted/20 transition-colors group cursor-pointer" onClick={() => setSelectedOrg(org)}>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                          <Building2 className="w-4 h-4 text-primary" />
                        </div>
                        <div className="min-w-0">
                          <p className="font-semibold text-foreground group-hover:text-primary transition-colors truncate">{org.name}</p>
                          {org.description && <p className="text-xs text-muted-foreground truncate max-w-[240px]">{org.description}</p>}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                        <MapPin className="w-3 h-3" /> {org.region || "—"}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={cn("inline-flex items-center gap-1.5 px-2 py-0.5 text-xs font-semibold rounded-full border", statusCfg.color)}>
                        <span className={cn("w-1.5 h-1.5 rounded-full", statusCfg.dot)} />
                        {statusCfg.label}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right font-medium text-foreground tabular-nums">{org.stats.contacts.toLocaleString()}</td>
                    <td className="px-4 py-3 text-right font-medium text-foreground tabular-nums">{org.stats.activeUsers}</td>
                    <td className="px-4 py-3 text-right">
                      <Badge variant="outline" className="text-xs capitalize">{org.plan}</Badge>
                    </td>
                    <td className="px-4 py-3 text-right" onClick={(e) => e.stopPropagation()}>
                      <button className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors" onClick={() => setSelectedOrg(org)}>
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </CardContent>
      </Card>
      </div>)}

      {/* Create org dialog */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <Card className="w-full max-w-md mx-4">
            <CardHeader>
              <CardTitle className="text-base font-semibold">Create New Organization</CardTitle>
              <CardDescription className="text-xs">Add a new sub-organization under {parentOrg.name}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField label="Organization Name" htmlFor="org-name">
                <Input id="org-name" placeholder="e.g. Jimma Chapter" value={newOrg.name} onChange={(e) => setNewOrg(prev => ({ ...prev, name: e.target.value }))} />
              </FormField>
              <FormField label="Region" htmlFor="org-region">
                <Input id="org-region" placeholder="e.g. Jimma" value={newOrg.region} onChange={(e) => setNewOrg(prev => ({ ...prev, region: e.target.value }))} />
              </FormField>
              <FormField label="Description" htmlFor="org-desc">
                <Textarea id="org-desc" placeholder="Brief description of this organization..." value={newOrg.description} onChange={(e) => setNewOrg(prev => ({ ...prev, description: e.target.value }))} rows={3} />
              </FormField>
              <div className="flex justify-end gap-2 pt-2">
                <Button variant="outline" size="sm" onClick={() => { setIsCreateOpen(false); setNewOrg({ name: "", region: "", description: "" }); }}>Cancel</Button>
                <Button size="sm" onClick={handleCreate} disabled={!newOrg.name.trim()}>Create Organization</Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </motion.div>
  );
};

// --- Main Settings View ---
export const SettingsView = ({
  tenant,
  user,
  onUpgrade,
  onUpdateTenant,
  onUpdateUser,
  childOrgs = [],
  onCreateChildOrg,
  onUpdateChildOrg,
  onDeleteChildOrg,
  onViewChildOrg,
}: {
  tenant: Tenant;
  user: UserType;
  onUpgrade: (plan: Plan) => void;
  onUpdateTenant: (data: Partial<Tenant>) => void;
  onUpdateUser: (data: Partial<UserType>) => void;
  childOrgs?: Tenant[];
  onCreateChildOrg?: (data: Partial<Tenant>) => void;
  onUpdateChildOrg?: (id: string, data: Partial<Tenant>) => void;
  onDeleteChildOrg?: (id: string) => void;
  onViewChildOrg?: (id: string) => void;
}) => {
  const [activeSection, setActiveSection] = useState("profile");
  const isSuperOrg = tenant.orgRole === "super";
  const filteredNav = settingsNav.filter(item => !item.superOnly || isSuperOrg);

  return (
    <div className="p-6 lg:p-10 animate-in fade-in duration-300">
      {/* Page Header */}
      <header className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Settings</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Manage your account, organization, and preferences.
        </p>
      </header>

      {/* Two-Column Card Container */}
      <Card className="overflow-hidden">
        <div className="flex flex-col lg:flex-row min-h-[600px]">
          {/* Left Navigation Column */}
          <nav className="lg:w-60 shrink-0 border-b lg:border-b-0 lg:border-r border-border bg-muted/30">
            <div className="p-3 space-y-0.5">
              <p className="px-3 pt-2 pb-3 text-xs font-bold text-muted-foreground uppercase tracking-widest">
                Settings
              </p>
              {filteredNav.map((item) => {
                const isActive = activeSection === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => setActiveSection(item.id)}
                    className={cn(
                      "w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-all text-left group relative",
                      isActive
                        ? "bg-background text-foreground shadow-sm border border-border"
                        : "text-muted-foreground hover:text-foreground hover:bg-background/60"
                    )}
                  >
                    <item.icon
                      className={cn(
                        "w-4 h-4 shrink-0 transition-colors",
                        isActive ? "text-primary" : "text-muted-foreground group-hover:text-foreground"
                      )}
                    />
                    <div className="flex flex-col min-w-0">
                      <span className="truncate">{item.label}</span>
                      <span className={cn(
                        "text-xs truncate transition-colors",
                        isActive ? "text-muted-foreground" : "text-muted-foreground"
                      )}>
                        {item.description}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </nav>

          {/* Right Content Column */}
          <div className="flex-1 min-w-0 p-6 lg:p-8 overflow-y-auto">
            {activeSection === "profile" && <ProfileSection user={user} onUpdate={onUpdateUser} />}
            {activeSection === "organization" && <OrganizationSection tenant={tenant} onUpdate={onUpdateTenant} />}
            {activeSection === "child-orgs" && isSuperOrg && (
              <ChildOrgsSection
                parentOrg={tenant}
                childOrgs={childOrgs}
                onCreateChildOrg={onCreateChildOrg}
                onUpdateChildOrg={onUpdateChildOrg}
                onDeleteChildOrg={onDeleteChildOrg}
                onViewChildOrg={onViewChildOrg}
              />
            )}
            {activeSection === "billing" && <BillingSection tenant={tenant} onUpgrade={onUpgrade} />}
            {activeSection === "notifications" && <NotificationsSection />}
            {activeSection === "security" && <SecuritySection />}
            {activeSection === "api" && <ApiSection />}
            {activeSection === "ai" && <AISection />}
            {activeSection === "terminology" && <TerminologySection />}
          </div>
        </div>
      </Card>
    </div>
  );
};

// --- API & Integrations Section ---
// ── API Key Types ──
type ApiKeyScope = "contacts:read" | "contacts:write" | "messages:read" | "messages:write" | "automations:read" | "automations:write" | "broadcasts:send" | "webhooks:manage" | "analytics:read";
interface ApiKeyEntry {
  id: string;
  name: string;
  key: string;
  prefix: string;
  scopes: ApiKeyScope[];
  created: string;
  lastUsed: string | null;
  expiresAt: string | null;
  status: "active" | "revoked";
}

const ALL_SCOPES: { id: ApiKeyScope; label: string; group: string; description: string }[] = [
  { id: "contacts:read",       label: "Read Contacts",       group: "Contacts",     description: "View contact profiles and lists" },
  { id: "contacts:write",      label: "Write Contacts",      group: "Contacts",     description: "Create, update, delete contacts" },
  { id: "messages:read",       label: "Read Messages",       group: "Messages",     description: "View conversation history" },
  { id: "messages:write",      label: "Send Messages",       group: "Messages",     description: "Send messages to contacts" },
  { id: "automations:read",    label: "Read Automations",    group: "Automations",  description: "View automation rules and flows" },
  { id: "automations:write",   label: "Write Automations",   group: "Automations",  description: "Create and modify automations" },
  { id: "broadcasts:send",     label: "Send Broadcasts",     group: "Broadcasts",   description: "Create and send broadcast messages" },
  { id: "webhooks:manage",     label: "Manage Webhooks",     group: "Webhooks",     description: "Create, update, delete webhooks" },
  { id: "analytics:read",      label: "Read Analytics",      group: "Analytics",    description: "View reports and dashboard metrics" },
];

const generateRandomKey = () => {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let result = "";
  for (let i = 0; i < 32; i++) result += chars.charAt(Math.floor(Math.random() * chars.length));
  return result;
};

const ApiSection = () => {
  const [apiKeys, setApiKeys] = useState<ApiKeyEntry[]>([
    { id: "key-1", name: "Production — Mobile App", key: "trb_live_a1b2c3d4e5f6g7h8i9j0klmnopqrstuv", prefix: "trb_live", scopes: ["contacts:read", "contacts:write", "messages:read", "messages:write", "broadcasts:send"], created: "Jan 15, 2026", lastUsed: "Jun 14, 2026", expiresAt: null, status: "active" },
    { id: "key-2", name: "Staging — Website Widget", key: "trb_test_z9y8x7w6v5u4t3s2r1q0abcdefghijkl", prefix: "trb_test", scopes: ["contacts:read", "messages:read", "messages:write"], created: "Feb 1, 2026", lastUsed: "Jun 10, 2026", expiresAt: "Dec 31, 2026", status: "active" },
    { id: "key-3", name: "Analytics Dashboard", key: "trb_live_m4n5o6p7q8r9s0t1u2v3wxyz12345678", prefix: "trb_live", scopes: ["analytics:read", "contacts:read"], created: "Mar 10, 2026", lastUsed: "Jun 12, 2026", expiresAt: "Sep 10, 2026", status: "active" },
    { id: "key-4", name: "Old Integration (revoked)", key: "trb_live_oldkey123456789abcdefghijklmnop", prefix: "trb_live", scopes: ["contacts:read", "messages:read"], created: "Nov 5, 2025", lastUsed: "Jan 3, 2026", expiresAt: null, status: "revoked" },
  ]);
  const [showKey, setShowKey] = useState<Record<string, boolean>>({});
  const [webhookSecret] = useState("whsec_k3p9m2n7x4b8v1c6d0e5f2g9");

  // ── Create Key Modal State ──
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newKeyName, setNewKeyName] = useState("");
  const [newKeyPrefix, setNewKeyPrefix] = useState<"trb_live" | "trb_test">("trb_live");
  const [newKeyScopes, setNewKeyScopes] = useState<ApiKeyScope[]>([]);
  const [newKeyExpiry, setNewKeyExpiry] = useState<"none" | "30" | "90" | "180" | "365">("none");
  const [justCreatedKey, setJustCreatedKey] = useState<string | null>(null);

  // ── Delete Confirmation ──
  const [deleteKeyId, setDeleteKeyId] = useState<string | null>(null);

  const toggleShowKey = (id: string) => setShowKey(prev => ({ ...prev, [id]: !prev[id] }));

  const toggleScope = (scope: ApiKeyScope) => {
    setNewKeyScopes(prev => prev.includes(scope) ? prev.filter(s => s !== scope) : [...prev, scope]);
  };

  const handleCreateKey = () => {
    if (!newKeyName.trim()) { toast.error("Please enter a key name"); return; }
    if (newKeyScopes.length === 0) { toast.error("Select at least one permission"); return; }
    const rawKey = generateRandomKey();
    const fullKey = `${newKeyPrefix}_${rawKey}`;
    const expiryMap: Record<string, string | null> = { none: null, "30": "30 days", "90": "90 days", "180": "6 months", "365": "1 year" };
    const now = new Date();
    const expiresLabel = newKeyExpiry !== "none" ? (() => {
      const d = new Date(now); d.setDate(d.getDate() + parseInt(newKeyExpiry));
      return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
    })() : null;
    const newEntry: ApiKeyEntry = {
      id: `key-${Date.now()}`,
      name: newKeyName.trim(),
      key: fullKey,
      prefix: newKeyPrefix,
      scopes: [...newKeyScopes],
      created: now.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
      lastUsed: null,
      expiresAt: expiresLabel,
      status: "active",
    };
    setApiKeys(prev => [newEntry, ...prev]);
    setJustCreatedKey(fullKey);
    toast.success(`API key "${newKeyName}" created`);
  };

  const handleRevokeKey = (id: string) => {
    setApiKeys(prev => prev.map(k => k.id === id ? { ...k, status: "revoked" as const } : k));
    toast.success("API key revoked");
  };

  const handleDeleteKey = (id: string) => {
    setApiKeys(prev => prev.filter(k => k.id !== id));
    setDeleteKeyId(null);
    toast.success("API key permanently deleted");
  };

  const handleResetCreate = () => {
    setNewKeyName(""); setNewKeyScopes([]); setNewKeyExpiry("none"); setNewKeyPrefix("trb_live"); setJustCreatedKey(null); setIsCreateOpen(false);
  };

  const activeKeys = apiKeys.filter(k => k.status === "active");
  const revokedKeys = apiKeys.filter(k => k.status === "revoked");

  // Group scopes for the create form
  const scopeGroups = ALL_SCOPES.reduce<Record<string, typeof ALL_SCOPES>>((acc, s) => {
    (acc[s.group] ??= []).push(s); return acc;
  }, {});

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className="space-y-6"
    >
      <SectionHeader title="API & Integrations" description="Generate and manage API keys for external developers and partners to integrate with Turumba." />
      <Separator />

      {/* ── Summary Stats ── */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { label: "Active Keys", value: activeKeys.length, color: "text-emerald-600", bg: "bg-emerald-50" },
          { label: "Revoked", value: revokedKeys.length, color: "text-red-600", bg: "bg-red-50" },
          { label: "Requests/min", value: "60", color: "text-blue-600", bg: "bg-blue-50" },
          { label: "Rate Limit", value: "Pro", color: "text-violet-600", bg: "bg-violet-50" },
        ].map(stat => (
          <div key={stat.label} className="flex items-center gap-3 p-3 border rounded-lg bg-card">
            <div className={cn("w-9 h-9 rounded-lg flex items-center justify-center shrink-0", stat.bg)}>
              <span className={cn("text-sm font-bold", stat.color)}>{stat.value}</span>
            </div>
            <p className="text-xs text-muted-foreground font-medium">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* ── Active API Keys ── */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-sm font-semibold">API Keys</CardTitle>
              <CardDescription className="text-xs">Generate keys for external developers and partners to authenticate with the Turumba API.</CardDescription>
            </div>
            <Button size="sm" onClick={() => setIsCreateOpen(true)}>
              <Plus className="w-3.5 h-3.5 mr-1.5" />
              Generate New Key
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {activeKeys.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <Key className="w-8 h-8 mx-auto mb-2 opacity-40" />
              <p className="text-sm font-medium">No active API keys</p>
              <p className="text-xs mt-1">Generate a key to start integrating with the Turumba API.</p>
            </div>
          )}
          {activeKeys.map(ak => (
            <div key={ak.id} className="p-4 border rounded-lg bg-card hover:bg-muted/10 transition-colors space-y-3">
              {/* Row 1: Name + Status */}
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold text-foreground truncate">{ak.name}</p>
                    <Badge variant="outline" className="text-xs text-emerald-600 border-emerald-200 bg-emerald-50 shrink-0">Active</Badge>
                  </div>
                  <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                    <span>Created {ak.created}</span>
                    <span>·</span>
                    <span>{ak.lastUsed ? `Last used ${ak.lastUsed}` : "Never used"}</span>
                    {ak.expiresAt && (
                      <>
                        <span>·</span>
                        <span className="inline-flex items-center gap-1"><CalendarDays className="w-3 h-3" /> Expires {ak.expiresAt}</span>
                      </>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <Button variant="ghost" size="sm" className="h-7 px-2 text-xs text-amber-600 hover:text-amber-700 hover:bg-amber-50" onClick={() => handleRevokeKey(ak.id)}>
                    Revoke
                  </Button>
                  <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-muted-foreground hover:text-red-600" onClick={() => setDeleteKeyId(ak.id)}>
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>
              {/* Row 2: Key display */}
              <div className="flex items-center gap-2 bg-muted/40 px-3 py-2 border rounded-md">
                <code className="text-xs font-mono text-foreground flex-1 select-all">
                  {showKey[ak.id] ? ak.key : ak.prefix + "_" + "•".repeat(32)}
                </code>
                <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => toggleShowKey(ak.id)} title={showKey[ak.id] ? "Hide" : "Reveal"}>
                  {showKey[ak.id] ? <EyeOff className="w-3.5 h-3.5 text-muted-foreground" /> : <Eye className="w-3.5 h-3.5 text-muted-foreground" />}
                </Button>
                <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => { navigator.clipboard?.writeText(ak.key); toast.success("Key copied to clipboard"); }} title="Copy">
                  <Copy className="w-3.5 h-3.5 text-muted-foreground" />
                </Button>
              </div>
              {/* Row 3: Scopes */}
              <div className="flex flex-wrap gap-1.5">
                {ak.scopes.map(scope => (
                  <span key={scope} className="inline-flex items-center px-2 py-0.5 text-xs font-medium rounded-full bg-muted border border-border text-muted-foreground">
                    {ALL_SCOPES.find(s => s.id === scope)?.label ?? scope}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* ── Revoked Keys ── */}
      {revokedKeys.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-semibold text-muted-foreground">Revoked Keys</CardTitle>
            <CardDescription className="text-xs">These keys are no longer valid. Delete them permanently if no longer needed.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {revokedKeys.map(ak => (
              <div key={ak.id} className="flex items-center justify-between p-3 border rounded-lg bg-muted/10 opacity-60">
                <div>
                  <p className="text-sm font-medium text-foreground line-through">{ak.name}</p>
                  <p className="text-xs text-muted-foreground">Revoked · Created {ak.created}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-xs text-red-600 border-red-200 bg-red-50">Revoked</Badge>
                  <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-muted-foreground hover:text-red-600" onClick={() => setDeleteKeyId(ak.id)}>
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* ── Webhook Signing Secret ── */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-semibold">Webhook Signing Secret</CardTitle>
          <CardDescription className="text-xs">Use this secret to verify incoming webhook payloads from Turumba.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2 bg-muted/40 px-3 py-2.5 border rounded-md">
            <code className="text-xs font-mono text-foreground flex-1">
              {showKey["webhook"] ? webhookSecret : "whsec_" + "•".repeat(24)}
            </code>
            <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => toggleShowKey("webhook")}>
              {showKey["webhook"] ? <EyeOff className="w-3.5 h-3.5 text-muted-foreground" /> : <Eye className="w-3.5 h-3.5 text-muted-foreground" />}
            </Button>
            <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => { navigator.clipboard?.writeText(webhookSecret); toast.success("Secret copied"); }}>
              <Copy className="w-3.5 h-3.5 text-muted-foreground" />
            </Button>
            <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => toast.info("Secret regenerated (mock)")}>
              <RefreshCw className="w-3.5 h-3.5 text-muted-foreground" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* ── Rate Limits ── */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-semibold">Rate Limits</CardTitle>
          <CardDescription className="text-xs">Current API rate limits for your plan.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4">
            {[
              { label: "Requests/min", value: "60", tier: "Pro" },
              { label: "Batch size", value: "100", tier: "Pro" },
              { label: "Webhooks/sec", value: "10", tier: "Pro" },
            ].map(rl => (
              <div key={rl.label} className="text-center p-3 bg-muted/30 rounded-lg">
                <p className="text-xl font-bold text-foreground">{rl.value}</p>
                <p className="text-xs text-muted-foreground font-medium mt-0.5">{rl.label}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* ── API Documentation ── */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <p className="text-sm font-medium text-foreground">API Documentation</p>
              <p className="text-[13px] text-muted-foreground">Full reference for all API endpoints, schemas, and examples.</p>
            </div>
            <Button variant="outline" size="sm" onClick={() => toast.info("API docs would open in a new tab")}>
              <ExternalLink className="w-3.5 h-3.5 mr-1.5" />
              View Docs
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* ══════════════════════════════════════════════════════════
          CREATE KEY MODAL
          ══════════════════════════════════════════════════════════ */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 animate-in fade-in duration-200">
          <div className="bg-card border border-border rounded-xl shadow-xl w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto animate-in zoom-in-95 duration-200">
            {justCreatedKey ? (
              /* ── Success State: Show generated key ── */
              <div className="p-6 space-y-5">
                <div className="text-center space-y-2">
                  <div className="w-12 h-12 rounded-full bg-emerald-50 flex items-center justify-center mx-auto">
                    <Check className="w-6 h-6 text-emerald-600" />
                  </div>
                  <h3 className="text-lg font-bold text-foreground">API Key Created</h3>
                  <p className="text-sm text-muted-foreground">Copy your key now — you won't be able to see it again.</p>
                </div>
                <div className="p-4 border-2 border-amber-200 bg-amber-50/50 rounded-lg space-y-3">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                    <p className="text-xs font-semibold text-amber-800">Save this key in a secure location</p>
                  </div>
                  <div className="flex items-center gap-2 bg-white p-3 border rounded-md">
                    <code className="text-xs font-mono text-foreground flex-1 break-all select-all">{justCreatedKey}</code>
                    <Button variant="outline" size="sm" className="shrink-0" onClick={() => { navigator.clipboard?.writeText(justCreatedKey); toast.success("Key copied!"); }}>
                      <Copy className="w-3.5 h-3.5 mr-1.5" /> Copy
                    </Button>
                  </div>
                </div>
                <Button className="w-full" onClick={handleResetCreate}>Done</Button>
              </div>
            ) : (
              /* ── Create Form ── */
              <div className="p-6 space-y-5">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-bold text-foreground">Generate New API Key</h3>
                    <p className="text-sm text-muted-foreground mt-0.5">Create a key for external developers or partner systems.</p>
                  </div>
                  <button onClick={handleResetCreate} className="p-1.5 rounded-md hover:bg-muted text-muted-foreground">
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <Separator />

                {/* Key Name */}
                <FormField label="Key Name" description="A descriptive label to identify this key (e.g., 'Partner CRM Integration').">
                  <Input value={newKeyName} onChange={e => setNewKeyName(e.target.value)} placeholder="e.g., Mobile App - Production" aria-label="Key name" />
                </FormField>

                {/* Environment */}
                <FormField label="Environment" description="Live keys access production data. Test keys work with sandbox data.">
                  <div className="flex gap-2">
                    {([["trb_live", "Production", "text-emerald-700 bg-emerald-50 border-emerald-200"], ["trb_test", "Test / Staging", "text-amber-700 bg-amber-50 border-amber-200"]] as const).map(([val, label, style]) => (
                      <button
                        key={val}
                        onClick={() => setNewKeyPrefix(val)}
                        className={cn(
                          "flex-1 py-2.5 px-4 rounded-lg border text-sm font-medium transition-all",
                          newKeyPrefix === val ? style + " ring-2 ring-offset-1 ring-primary/30" : "bg-card border-border text-muted-foreground hover:bg-muted/50"
                        )}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </FormField>

                {/* Permissions / Scopes */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm font-medium text-foreground">Permissions</Label>
                    <button onClick={() => setNewKeyScopes(newKeyScopes.length === ALL_SCOPES.length ? [] : ALL_SCOPES.map(s => s.id))} className="text-xs text-primary font-medium hover:underline">
                      {newKeyScopes.length === ALL_SCOPES.length ? "Deselect all" : "Select all"}
                    </button>
                  </div>
                  <p className="text-[13px] text-muted-foreground -mt-2">Choose what this key can access. Follow the principle of least privilege.</p>
                  <div className="space-y-4 max-h-[240px] overflow-y-auto pr-1">
                    {Object.entries(scopeGroups).map(([group, scopes]) => (
                      <div key={group}>
                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">{group}</p>
                        <div className="space-y-1">
                          {scopes.map(scope => (
                            <label key={scope.id} className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-muted/50 transition-colors cursor-pointer">
                              <input type="checkbox" checked={newKeyScopes.includes(scope.id)} onChange={() => toggleScope(scope.id)}
                                className="w-4 h-4 rounded border-border text-primary focus:ring-primary/30" />
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-foreground">{scope.label}</p>
                                <p className="text-xs text-muted-foreground">{scope.description}</p>
                              </div>
                            </label>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Expiration */}
                <FormField label="Expiration" description="Set an optional expiry date for added security. Keys can also be manually revoked.">
                  <div className="grid grid-cols-5 gap-1.5">
                    {([["none", "Never"], ["30", "30 days"], ["90", "90 days"], ["180", "6 months"], ["365", "1 year"]] as const).map(([val, label]) => (
                      <button
                        key={val}
                        onClick={() => setNewKeyExpiry(val)}
                        className={cn(
                          "py-2 px-2 rounded-md text-xs font-medium border transition-all text-center",
                          newKeyExpiry === val ? "bg-primary text-primary-foreground border-primary" : "bg-card border-border text-muted-foreground hover:bg-muted/50"
                        )}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </FormField>

                <Separator />

                {/* Actions */}
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={handleResetCreate}>Cancel</Button>
                  <Button onClick={handleCreateKey} disabled={!newKeyName.trim() || newKeyScopes.length === 0}>
                    <Key className="w-3.5 h-3.5 mr-1.5" />
                    Generate Key
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════
          DELETE CONFIRMATION MODAL
          ══════════════════════════════════════════════════════════ */}
      {deleteKeyId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 animate-in fade-in duration-200">
          <div className="bg-card border border-border rounded-xl shadow-xl w-full max-w-sm mx-4 p-6 space-y-4 animate-in zoom-in-95 duration-200">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center shrink-0">
                <Trash2 className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-foreground">Delete API Key</h3>
                <p className="text-xs text-muted-foreground mt-0.5">This action is permanent and cannot be undone. Any integrations using this key will immediately stop working.</p>
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" size="sm" onClick={() => setDeleteKeyId(null)}>Cancel</Button>
              <Button variant="destructive" size="sm" onClick={() => handleDeleteKey(deleteKeyId)}>
                <Trash2 className="w-3.5 h-3.5 mr-1.5" />
                Delete Permanently
              </Button>
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
};

// --- AI Configuration Section ---

// Company logo SVG components
const OpenAILogo = ({ className = "w-6 h-6" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M22.282 9.821a5.985 5.985 0 0 0-.516-4.91 6.046 6.046 0 0 0-6.51-2.9A6.065 6.065 0 0 0 4.981 4.18a5.985 5.985 0 0 0-3.998 2.9 6.046 6.046 0 0 0 .743 7.097 5.98 5.98 0 0 0 .51 4.911 6.051 6.051 0 0 0 6.515 2.9A5.985 5.985 0 0 0 13.26 24a6.056 6.056 0 0 0 5.772-4.206 5.99 5.99 0 0 0 3.997-2.9 6.056 6.056 0 0 0-.747-7.073zM13.26 22.43a4.476 4.476 0 0 1-2.876-1.04l.141-.081 4.779-2.758a.795.795 0 0 0 .392-.681v-6.737l2.02 1.168a.071.071 0 0 1 .038.052v5.583a4.504 4.504 0 0 1-4.494 4.494zM3.6 18.304a4.47 4.47 0 0 1-.535-3.014l.142.085 4.783 2.759a.771.771 0 0 0 .78 0l5.843-3.369v2.332a.08.08 0 0 1-.033.062L9.74 19.95a4.5 4.5 0 0 1-6.14-1.646zM2.34 7.896a4.485 4.485 0 0 1 2.366-1.973V11.6a.766.766 0 0 0 .388.676l5.815 3.355-2.02 1.168a.076.076 0 0 1-.071 0l-4.83-2.786A4.504 4.504 0 0 1 2.34 7.872zm16.597 3.855l-5.833-3.387L15.119 7.2a.076.076 0 0 1 .071 0l4.83 2.791a4.494 4.494 0 0 1-.676 8.105v-5.678a.79.79 0 0 0-.407-.667zm2.01-3.023l-.141-.085-4.774-2.782a.776.776 0 0 0-.785 0L9.409 9.23V6.897a.066.066 0 0 1 .028-.061l4.83-2.787a4.5 4.5 0 0 1 6.68 4.66zm-12.64 4.135l-2.02-1.164a.08.08 0 0 1-.038-.057V6.075a4.5 4.5 0 0 1 7.375-3.453l-.142.08L8.704 5.46a.795.795 0 0 0-.393.681zm1.097-2.365l2.602-1.5 2.607 1.5v2.999l-2.597 1.5-2.607-1.5z" />
  </svg>
);

const AnthropicLogo = ({ className = "w-6 h-6" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M13.827 3.52h3.603L24 20.48h-3.603l-6.57-16.96zm-7.258 0h3.767L16.906 20.48h-3.674l-1.561-4.075H5.104L3.543 20.48H0l6.569-16.96zm1.901 5.027l-2.493 6.165h4.981l-2.488-6.165z" />
  </svg>
);

const GoogleAILogo = ({ className = "w-6 h-6" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
  </svg>
);

const CohereLogo = ({ className = "w-6 h-6" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M8.55 13.14c2.67 0 4.75-.6 6.34-1.78a8.3 8.3 0 0 0 2.8-3.5C18.64 5.78 19 3.36 19 .96h5c0 3.07-.52 6.13-1.56 8.72a13.7 13.7 0 0 1-5.04 6.42C14.8 18.42 11.82 19.5 8.55 19.5c-2.76 0-5.14-.72-6.66-2.08C.37 16.06 0 14.16 0 12.48c0-1.72.5-3.4 1.65-4.62C2.79 6.64 4.49 6 6.52 6c1.7 0 3.16.52 4.17 1.55.98 1 1.42 2.28 1.42 3.55 0 .94-.44 1.52-.98 1.82-.44.25-.83.22-1.08.22H8.55z" />
  </svg>
);

const MistralLogo = ({ className = "w-6 h-6" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M3 3h4.5v4.5H3V3zm13.5 0H21v4.5h-4.5V3zM3 7.5h4.5V12H3V7.5zm4.5 0H12V12H7.5V7.5zm4.5 0h4.5V12H12V7.5zm4.5 0H21V12h-4.5V7.5zM3 12h4.5v4.5H3V12zm9 0h4.5v4.5H12V12zm4.5 0H21v4.5h-4.5V12zM3 16.5h4.5V21H3v-4.5zm4.5 0H12V21H7.5v-4.5zm4.5 0h4.5V21H12v-4.5zm4.5 0H21V21h-4.5v-4.5z" />
  </svg>
);

const AzureLogo = ({ className = "w-6 h-6" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M5.483 21.3H24L14.025 4.013l-3.038 8.347 5.836 6.938L5.483 21.3zM13.23 2.7L6.105 8.677 0 19.253h5.505l7.725-16.553z" fill="#0078D4" />
  </svg>
);

// Map provider id to logo component
const AI_PROVIDER_LOGOS: Record<string, React.ComponentType<{ className?: string }>> = {
  openai: OpenAILogo,
  anthropic: AnthropicLogo,
  google: GoogleAILogo,
  cohere: CohereLogo,
  mistral: MistralLogo,
  azure: AzureLogo,
};

type AIProvider = {
  id: string;
  name: string;
  icon: React.ReactNode;
  color: string;
  bgColor: string;
  keyPrefix: string;
  keyHint: string;
  docsUrl: string;
  features: string[];
};

const AI_PROVIDERS: AIProvider[] = [
  { id: "openai",    name: "OpenAI",       icon: <OpenAILogo className="w-7 h-7" />,    color: "text-emerald-700", bgColor: "bg-emerald-50 border-emerald-200", keyPrefix: "sk-",     keyHint: "Starts with sk- or sk-proj-",      docsUrl: "https://platform.openai.com/api-keys", features: ["Chat", "Classification", "Content Generation"] },
  { id: "anthropic", name: "Anthropic",     icon: <AnthropicLogo className="w-7 h-7" />, color: "text-violet-700",  bgColor: "bg-violet-50 border-violet-200",  keyPrefix: "sk-ant-", keyHint: "Starts with sk-ant-",              docsUrl: "https://console.anthropic.com/settings/keys", features: ["Chat", "Content Generation", "Sentiment Analysis"] },
  { id: "google",    name: "Google AI",     icon: <GoogleAILogo className="w-7 h-7" />,  color: "text-blue-700",    bgColor: "bg-blue-50 border-blue-200",      keyPrefix: "AI",      keyHint: "Starts with AIza...",              docsUrl: "https://aistudio.google.com/apikey", features: ["Chat", "Translation", "Classification"] },
  { id: "cohere",    name: "Cohere",        icon: <CohereLogo className="w-7 h-7" />,    color: "text-orange-700",  bgColor: "bg-orange-50 border-orange-200",  keyPrefix: "",        keyHint: "Alphanumeric key from dashboard",  docsUrl: "https://dashboard.cohere.com/api-keys", features: ["Classification", "Embeddings"] },
  { id: "mistral",   name: "Mistral",       icon: <MistralLogo className="w-7 h-7" />,   color: "text-sky-700",     bgColor: "bg-sky-50 border-sky-200",        keyPrefix: "",        keyHint: "API key from Mistral console",     docsUrl: "https://console.mistral.ai/api-keys", features: ["Chat", "Content Generation"] },
  { id: "azure",     name: "Azure OpenAI",  icon: <AzureLogo className="w-7 h-7" />,     color: "text-blue-700",    bgColor: "bg-blue-50 border-blue-200",      keyPrefix: "",        keyHint: "32-character hex key",             docsUrl: "https://portal.azure.com", features: ["Chat", "Classification", "Content Generation"] },
];

type AIApiKey = {
  id: string;
  provider: string;
  label: string;
  key: string;
  addedAt: string;
  active: boolean;
  verified: boolean;
  verifiedAt?: string;
  assignedFeatures?: string[];
};

type AIBusinessRule = {
  id: string;
  rule: string;
  enabled: boolean;
};

const INITIAL_AI_KEYS: AIApiKey[] = [
  { id: "aik-1", provider: "openai", label: "Production GPT-4", key: "sk-proj-a1b2c3d4e5f6g7h8i9j0k1l2m3n4", addedAt: "Jan 10, 2026", active: true, verified: true, verifiedAt: "Jan 10, 2026", assignedFeatures: ["Classification", "Content Generation"] },
  { id: "aik-2", provider: "anthropic", label: "Claude Sonnet", key: "sk-ant-z9y8x7w6v5u4t3s2r1q0p9o8n7m6", addedAt: "Feb 5, 2026", active: true, verified: true, verifiedAt: "Feb 5, 2026", assignedFeatures: ["Chat", "Sentiment Analysis"] },
];

const INITIAL_RULES: AIBusinessRule[] = [
  { id: "r-1", rule: "AI must not make theological claims that contradict the Nicene Creed or the organization's statement of faith.", enabled: true },
  { id: "r-2", rule: "AI-generated content must be reviewed by a human mentor before being sent to seekers in the Decision stage.", enabled: true },
  { id: "r-3", rule: "AI should escalate to a human when a seeker expresses crisis, self-harm, or urgent pastoral needs.", enabled: true },
  { id: "r-4", rule: "Limit AI-generated messages to 3 per day per seeker to avoid overwhelming them.", enabled: true },
  { id: "r-5", rule: "AI must not share seeker personal data across organizations unless explicitly permitted.", enabled: true },
  { id: "r-6", rule: "AI responses should always include at least one Scripture reference when discussing faith topics.", enabled: false },
];

const AISection = () => {
  const [aiKeys, setAiKeys] = useState<AIApiKey[]>(INITIAL_AI_KEYS);
  const [rules, setRules] = useState<AIBusinessRule[]>(INITIAL_RULES);
  const [sharedAI, setSharedAI] = useState(false);
  const [showAddKey, setShowAddKey] = useState(false);
  const [showAddRule, setShowAddRule] = useState(false);
  const [showKeyValues, setShowKeyValues] = useState<Record<string, boolean>>({});

  // Add key wizard state
  const [addStep, setAddStep] = useState<"provider" | "key" | "assign">("provider");
  const [newKeyProvider, setNewKeyProvider] = useState<string>("");
  const [newKeyLabel, setNewKeyLabel] = useState("");
  const [newKeyValue, setNewKeyValue] = useState("");
  const [verifyState, setVerifyState] = useState<"idle" | "verifying" | "success" | "error">("idle");
  const [verifyError, setVerifyError] = useState("");
  const [newKeyFeatures, setNewKeyFeatures] = useState<string[]>([]);

  const [newRuleText, setNewRuleText] = useState("");

  const selectedProvider = AI_PROVIDERS.find(p => p.id === newKeyProvider);

  const resetAddKey = () => {
    setAddStep("provider"); setNewKeyProvider(""); setNewKeyLabel(""); setNewKeyValue("");
    setVerifyState("idle"); setVerifyError(""); setNewKeyFeatures([]); setShowAddKey(false);
  };

  const verifyKey = () => {
    if (!newKeyValue.trim()) { toast.error("Enter an API key first"); return; }
    setVerifyState("verifying");
    // Simulate API verification
    setTimeout(() => {
      const provider = selectedProvider;
      if (provider && provider.keyPrefix && !newKeyValue.trim().startsWith(provider.keyPrefix)) {
        setVerifyState("error");
        setVerifyError(`Invalid key format. ${provider.keyHint}`);
      } else {
        setVerifyState("success");
        setVerifyError("");
      }
    }, 1500);
  };

  const toggleFeature = (feature: string) => {
    setNewKeyFeatures(prev => prev.includes(feature) ? prev.filter(f => f !== feature) : [...prev, feature]);
  };

  const addApiKey = () => {
    if (!newKeyLabel.trim() || !newKeyValue.trim()) { toast.error("Label and key are required"); return; }
    const now = new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
    setAiKeys(prev => [...prev, {
      id: `aik-${Date.now()}`,
      provider: newKeyProvider,
      label: newKeyLabel.trim(),
      key: newKeyValue.trim(),
      addedAt: now,
      active: true,
      verified: verifyState === "success",
      verifiedAt: verifyState === "success" ? now : undefined,
      assignedFeatures: newKeyFeatures.length > 0 ? newKeyFeatures : undefined,
    }]);
    resetAddKey();
    toast.success("AI API key added");
  };

  const reverifyKey = (id: string) => {
    toast.success("Re-verifying key...");
    setTimeout(() => {
      setAiKeys(prev => prev.map(k => k.id === id ? { ...k, verified: true, verifiedAt: new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) } : k));
      toast.success("Key verified successfully");
    }, 1500);
  };

  // ── Edit key state ──
  const [editingKeyId, setEditingKeyId] = useState<string | null>(null);
  const [editLabel, setEditLabel] = useState("");
  const [editKeyValue, setEditKeyValue] = useState("");
  const [editFeatures, setEditFeatures] = useState<string[]>([]);
  const [editVerifyState, setEditVerifyState] = useState<"idle" | "verifying" | "success" | "error">("idle");
  const [editVerifyError, setEditVerifyError] = useState("");
  const [editKeyChanged, setEditKeyChanged] = useState(false);

  const startEditing = (k: AIApiKey) => {
    setEditingKeyId(k.id);
    setEditLabel(k.label);
    setEditKeyValue(k.key);
    setEditFeatures(k.assignedFeatures || []);
    setEditVerifyState("idle");
    setEditKeyChanged(false);
  };

  const cancelEditing = () => { setEditingKeyId(null); };

  const verifyEditKey = (provider: string) => {
    if (!editKeyValue.trim()) { toast.error("Enter an API key"); return; }
    setEditVerifyState("verifying");
    const prov = AI_PROVIDERS.find(p => p.id === provider);
    setTimeout(() => {
      if (prov && prov.keyPrefix && !editKeyValue.trim().startsWith(prov.keyPrefix)) {
        setEditVerifyState("error");
        setEditVerifyError(`Invalid key format. ${prov.keyHint}`);
      } else {
        setEditVerifyState("success");
        setEditVerifyError("");
      }
    }, 1500);
  };

  const toggleEditFeature = (feature: string) => {
    setEditFeatures(prev => prev.includes(feature) ? prev.filter(f => f !== feature) : [...prev, feature]);
  };

  const saveEdit = (id: string) => {
    if (!editLabel.trim()) { toast.error("Label is required"); return; }
    if (editKeyChanged && editVerifyState !== "success") { toast.error("Please verify the new key first"); return; }
    const now = new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
    setAiKeys(prev => prev.map(k => k.id === id ? {
      ...k,
      label: editLabel.trim(),
      key: editKeyValue.trim(),
      verified: editKeyChanged ? editVerifyState === "success" : k.verified,
      verifiedAt: editKeyChanged && editVerifyState === "success" ? now : k.verifiedAt,
      assignedFeatures: editFeatures.length > 0 ? editFeatures : undefined,
    } : k));
    setEditingKeyId(null);
    toast.success("Provider updated");
  };

  const addRule = () => {
    if (!newRuleText.trim()) { toast.error("Rule description is required"); return; }
    setRules(prev => [...prev, { id: `r-${Date.now()}`, rule: newRuleText.trim(), enabled: true }]);
    setNewRuleText(""); setShowAddRule(false);
    toast.success("Business rule added");
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className="space-y-6"
    >
      <SectionHeader title="AI Configuration" description="Configure how AI is used across your organization — business rules, API keys, and sharing." />
      <Separator />

      {/* ── AI API Keys ── */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Key className="w-5 h-5 text-muted-foreground" />
              <div>
                <CardTitle className="text-base">AI API Keys</CardTitle>
                <CardDescription>Connect your AI providers — select a platform, enter your key, and verify.</CardDescription>
              </div>
            </div>
            <Button size="sm" variant="outline" onClick={() => { if (showAddKey) resetAddKey(); else setShowAddKey(true); }}>
              {showAddKey ? <X className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
              {showAddKey ? "Cancel" : "Add Provider"}
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {showAddKey && (
            <div className="border border-border rounded-lg bg-background overflow-hidden">
              {/* Step indicator */}
              <div className="flex items-center gap-0 border-b border-border bg-muted/30">
                {[
                  { step: "provider" as const, label: "Select Platform", num: 1 },
                  { step: "key" as const,      label: "Enter & Verify", num: 2 },
                  { step: "assign" as const,   label: "Assign Features", num: 3 },
                ].map(({ step, label, num }) => {
                  const isCurrent = addStep === step;
                  const isDone = (addStep === "key" && num === 1) || (addStep === "assign" && num <= 2);
                  return (
                    <div key={step} className={cn("flex items-center gap-2 px-4 py-2.5 text-xs font-semibold flex-1 border-r border-border last:border-0", isCurrent ? "bg-background text-foreground" : isDone ? "text-foreground/70" : "text-muted-foreground")}>
                      {isDone ? <CheckCircle2 className="w-3.5 h-3.5 text-primary" /> : <span className={cn("w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold", isCurrent ? "bg-foreground text-background" : "bg-muted text-muted-foreground")}>{num}</span>}
                      {label}
                    </div>
                  );
                })}
              </div>

              <div className="p-4">
                {/* Step 1: Select Provider */}
                {addStep === "provider" && (
                  <div className="space-y-3">
                    <p className="text-sm font-semibold text-foreground">Choose your AI provider</p>
                    <div className="grid grid-cols-3 gap-2">
                      {AI_PROVIDERS.map(p => (
                        <button
                          key={p.id}
                          onClick={() => { setNewKeyProvider(p.id); setAddStep("key"); }}
                          className="flex flex-col items-center gap-2 p-4 rounded-lg border border-border bg-background text-center transition-all hover:border-foreground/30 hover:shadow-sm"
                        >
                          <span className="flex items-center justify-center">{p.icon}</span>
                          <span className="text-sm font-bold text-foreground">{p.name}</span>
                          <span className="text-xs text-muted-foreground leading-tight">{p.features.slice(0, 2).join(", ")}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Step 2: Enter Key & Verify */}
                {addStep === "key" && selectedProvider && (
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <button onClick={() => setAddStep("provider")} className="text-muted-foreground hover:text-foreground transition-colors">
                        <ArrowLeft className="w-4 h-4" />
                      </button>
                      <span className="flex items-center justify-center">{selectedProvider.icon}</span>
                      <div>
                        <p className="text-sm font-bold text-foreground">{selectedProvider.name}</p>
                        <p className="text-xs text-muted-foreground">{selectedProvider.keyHint}</p>
                      </div>
                    </div>

                    <FormField label="Label (what's this key for?)">
                      <Input value={newKeyLabel} onChange={e => setNewKeyLabel(e.target.value)} placeholder={`e.g. Production ${selectedProvider.name}`} aria-label="Key label" />
                    </FormField>

                    <FormField label="API Key">
                      <div className="flex gap-2">
                        <Input
                          value={newKeyValue}
                          onChange={e => { setNewKeyValue(e.target.value); if (verifyState !== "idle") setVerifyState("idle"); }}
                          placeholder={selectedProvider.keyPrefix ? `${selectedProvider.keyPrefix}...` : "Paste your API key here"}
                          type="password"
                          className="flex-1 font-mono"
                          aria-label="API key"
                        />
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={verifyKey}
                          disabled={verifyState === "verifying" || !newKeyValue.trim()}
                          className={cn(
                            verifyState === "success" && "border-primary text-primary",
                            verifyState === "error" && "border-red-300 text-red-600",
                            (!newKeyValue.trim() || verifyState === "verifying") && "opacity-50 cursor-not-allowed"
                          )}
                        >
                          {verifyState === "verifying" && <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Verifying…</>}
                          {verifyState === "success" && <><CheckCircle2 className="w-3.5 h-3.5" /> Verified</>}
                          {verifyState === "error" && <><XCircle className="w-3.5 h-3.5" /> Failed</>}
                          {verifyState === "idle" && <><ShieldCheck className="w-3.5 h-3.5" /> Verify</>}
                        </Button>
                      </div>
                    </FormField>

                    {verifyState === "error" && (
                      <div className="flex items-center gap-2 px-3 py-2 bg-red-50 border border-red-200 rounded-md">
                        <XCircle className="w-3.5 h-3.5 text-red-500 shrink-0" />
                        <p className="text-xs text-red-700">{verifyError}</p>
                      </div>
                    )}

                    {verifyState === "success" && (
                      <div className="flex items-center gap-2 px-3 py-2 bg-muted/50 border border-border rounded-md">
                        <CheckCircle2 className="w-3.5 h-3.5 text-primary shrink-0" />
                        <p className="text-xs text-foreground">Key is valid and connected to {selectedProvider.name}.</p>
                      </div>
                    )}

                    <div className="flex items-center gap-2">
                      <ExternalLink className="w-3.5 h-3.5 text-muted-foreground" />
                      <a href={selectedProvider.docsUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-primary hover:underline font-medium">
                        Get your {selectedProvider.name} API key →
                      </a>
                    </div>

                    <div className="flex items-center gap-2">
                      <Lock className="w-3.5 h-3.5 text-muted-foreground" />
                      <p className="text-xs text-muted-foreground">Keys are encrypted and stored securely. Never exposed in client-side code.</p>
                    </div>

                    <div className="flex items-center justify-between pt-3 border-t border-border">
                      <Button variant="outline" size="sm" onClick={() => setAddStep("provider")}>Back</Button>
                      <Button size="sm" onClick={() => {
                        if (!newKeyLabel.trim()) { toast.error("Enter a label for this key"); return; }
                        if (!newKeyValue.trim()) { toast.error("Enter the API key"); return; }
                        if (verifyState !== "success") { toast.error("Please verify the key first"); return; }
                        setNewKeyFeatures([]);
                        setAddStep("assign");
                      }}>
                        Continue
                      </Button>
                    </div>
                  </div>
                )}

                {/* Step 3: Assign Features */}
                {addStep === "assign" && selectedProvider && (
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <button onClick={() => setAddStep("key")} className="text-muted-foreground hover:text-foreground transition-colors">
                        <ArrowLeft className="w-4 h-4" />
                      </button>
                      <div>
                        <p className="text-sm font-bold text-foreground">Assign features to {selectedProvider.name}</p>
                        <p className="text-xs text-muted-foreground">Choose which AI capabilities should use this key.</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      {["Chat / Conversations", "Content Generation", "Seeker Classification", "Mentor Matching", "Sentiment Analysis", "Translation"].map(feature => (
                        <button
                          key={feature}
                          onClick={() => toggleFeature(feature)}
                          className={cn("flex items-center gap-2 px-3 py-2.5 rounded-md border text-left text-sm transition-all",
                            newKeyFeatures.includes(feature)
                              ? "border-foreground/30 bg-muted/50 text-foreground font-semibold"
                              : "border-border bg-background text-muted-foreground hover:bg-muted/30"
                          )}
                        >
                          {newKeyFeatures.includes(feature)
                            ? <CheckCircle2 className="w-4 h-4 text-primary shrink-0" />
                            : <div className="w-4 h-4 rounded-full border-2 border-muted-foreground shrink-0" />
                          }
                          {feature}
                        </button>
                      ))}
                    </div>

                    <p className="text-xs text-muted-foreground">You can change these later. Leave empty for all features.</p>

                    <div className="flex items-center justify-between pt-3 border-t border-border">
                      <Button variant="outline" size="sm" onClick={() => setAddStep("key")}>Back</Button>
                      <Button size="sm" onClick={addApiKey}>
                        <Check className="w-3.5 h-3.5" /> Save Provider
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Saved keys list */}
          {aiKeys.map(k => {
            const provider = AI_PROVIDERS.find(p => p.id === k.provider);
            const isEditing = editingKeyId === k.id;

            if (isEditing) {
              return (
                <div key={k.id} className="p-4 rounded-lg border border-border bg-muted/10 space-y-4">
                  <div className="flex items-center gap-3">
                    <span className="flex items-center justify-center">{provider?.icon || <Key className="w-5 h-5 text-muted-foreground" />}</span>
                    <div>
                      <p className="text-sm font-bold text-foreground">Editing — {provider?.name || k.provider}</p>
                      <p className="text-xs text-muted-foreground">Update label, key, or feature assignments.</p>
                    </div>
                  </div>

                  <FormField label="Label">
                    <Input value={editLabel} onChange={e => setEditLabel(e.target.value)} aria-label="Key label" />
                  </FormField>

                  <FormField label="API Key">
                    <div className="flex gap-2">
                      <Input
                        value={editKeyValue}
                        onChange={e => { setEditKeyValue(e.target.value); setEditKeyChanged(true); if (editVerifyState !== "idle") setEditVerifyState("idle"); }}
                        type="password"
                        className="flex-1 font-mono"
                        aria-label="API key"
                      />
                      {editKeyChanged && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => verifyEditKey(k.provider)}
                          disabled={editVerifyState === "verifying" || !editKeyValue.trim()}
                          className={cn(
                            editVerifyState === "success" && "border-primary text-primary",
                            editVerifyState === "error" && "border-red-300 text-red-600",
                          )}
                        >
                          {editVerifyState === "verifying" && <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Verifying…</>}
                          {editVerifyState === "success" && <><CheckCircle2 className="w-3.5 h-3.5" /> Verified</>}
                          {editVerifyState === "error" && <><XCircle className="w-3.5 h-3.5" /> Failed</>}
                          {editVerifyState === "idle" && <><ShieldCheck className="w-3.5 h-3.5" /> Verify</>}
                        </Button>
                      )}
                    </div>
                    {!editKeyChanged && <p className="text-xs text-muted-foreground mt-1">Change the key value to re-verify.</p>}
                  </FormField>

                  {editVerifyState === "error" && (
                    <div className="flex items-center gap-2 px-3 py-2 bg-red-50 border border-red-200 rounded-md">
                      <XCircle className="w-3.5 h-3.5 text-red-500 shrink-0" />
                      <p className="text-xs text-red-700">{editVerifyError}</p>
                    </div>
                  )}

                  <div>
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Feature Assignments</p>
                    <div className="grid grid-cols-2 gap-2">
                      {["Chat / Conversations", "Content Generation", "Seeker Classification", "Mentor Matching", "Sentiment Analysis", "Translation"].map(feature => (
                        <button
                          key={feature}
                          onClick={() => toggleEditFeature(feature)}
                          className={cn("flex items-center gap-2 px-3 py-2 rounded-md border text-left text-xs transition-all",
                            editFeatures.includes(feature)
                              ? "border-foreground/30 bg-muted/50 text-foreground font-semibold"
                              : "border-border bg-background text-muted-foreground hover:bg-muted/30"
                          )}
                        >
                          {editFeatures.includes(feature)
                            ? <CheckCircle2 className="w-3.5 h-3.5 text-primary shrink-0" />
                            : <div className="w-3.5 h-3.5 rounded-full border-2 border-muted-foreground shrink-0" />
                          }
                          {feature}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-3 border-t border-border">
                    <Button variant="outline" size="sm" onClick={cancelEditing}>Cancel</Button>
                    <Button size="sm" onClick={() => saveEdit(k.id)}>
                      <Check className="w-3.5 h-3.5" /> Save Changes
                    </Button>
                  </div>
                </div>
              );
            }

            return (
              <div key={k.id} className={cn("flex items-center justify-between gap-4 p-3.5 rounded-lg border border-border transition-colors", k.active ? "hover:bg-muted/30" : "opacity-60")}>
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0 bg-muted border border-border">
                    {provider?.icon || <Key className="w-5 h-5 text-muted-foreground" />}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-bold text-foreground">{k.label}</p>
                      <Badge variant="secondary" className="text-xs">{provider?.name || k.provider}</Badge>
                      {k.verified ? (
                        <span className="inline-flex items-center gap-0.5 text-xs font-medium text-primary">
                          <CheckCircle2 className="w-3 h-3" /> Verified
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-0.5 text-xs font-medium text-amber-600">
                          <AlertCircle className="w-3 h-3" /> Unverified
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5 font-mono">
                      {showKeyValues[k.id] ? k.key : k.key.slice(0, 8) + "•••••••••••••••"}
                    </p>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="text-xs text-muted-foreground">Added {k.addedAt}</span>
                      {k.verifiedAt && <span className="text-xs text-muted-foreground">· Verified {k.verifiedAt}</span>}
                    </div>
                    {k.assignedFeatures && k.assignedFeatures.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-1.5">
                        {k.assignedFeatures.map(f => (
                          <span key={f} className="px-1.5 py-0.5 text-xs font-medium rounded bg-muted text-muted-foreground border border-border">{f}</span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <Button variant="ghost" size="sm" className="h-7 w-7 p-0" title={showKeyValues[k.id] ? "Hide key" : "Show key"} onClick={() => setShowKeyValues(prev => ({ ...prev, [k.id]: !prev[k.id] }))}>
                    <Eye className="w-3.5 h-3.5" />
                  </Button>
                  <Button variant="ghost" size="sm" className="h-7 w-7 p-0" title="Edit" onClick={() => startEditing(k)}>
                    <Pencil className="w-3.5 h-3.5" />
                  </Button>
                  <Button variant="ghost" size="sm" className="h-7 w-7 p-0" title="Re-verify" onClick={() => reverifyKey(k.id)}>
                    <RotateCcw className="w-3.5 h-3.5" />
                  </Button>
                  <Switch
                    checked={k.active}
                    onCheckedChange={v => { setAiKeys(prev => prev.map(x => x.id === k.id ? { ...x, active: v } : x)); toast.success(`${k.label} ${v ? "activated" : "deactivated"}`); }}
                    aria-label={`Toggle ${k.label}`}
                  />
                  <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-muted-foreground hover:text-red-500" onClick={() => { setAiKeys(prev => prev.filter(x => x.id !== k.id)); toast.success("Key removed"); }}>
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>

      {/* ── Shared AI Usage ── */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Share2 className="w-5 h-5 text-violet-600" />
            <div>
              <CardTitle className="text-base">Shared AI Across Organizations</CardTitle>
              <CardDescription>Allow child organizations under your account to use your AI configuration and API keys.</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-4 rounded-lg border border-border bg-muted/20">
            <div className="space-y-1">
              <p className="text-sm font-semibold text-foreground">Enable Shared AI Usage</p>
              <p className="text-xs text-muted-foreground leading-relaxed max-w-md">
                When enabled, child organizations inherit your AI business rules and API keys. They can use AI features without configuring their own keys.
              </p>
            </div>
            <Switch
              checked={sharedAI}
              onCheckedChange={v => { setSharedAI(v); toast.success(v ? "Shared AI enabled for child organizations" : "Shared AI disabled"); }}
              aria-label="Enable shared AI usage"
            />
          </div>
          {sharedAI && (
            <div className="p-4 rounded-lg border border-violet-200 bg-violet-50 space-y-3">
              <p className="text-sm font-semibold text-violet-800">Sharing is active</p>
              <p className="text-xs text-violet-600 leading-relaxed">
                All child organizations under your account now have access to your AI configuration and API keys. They will follow the same business rules you have defined above. Individual child orgs can still override specific settings if needed.
              </p>
              <div className="flex items-center gap-4 text-xs text-violet-700">
                <span className="font-semibold">{aiKeys.filter(k => k.active).length} API keys shared</span>
                <span>·</span>
                <span className="font-semibold">{rules.filter(r => r.enabled).length} rules enforced</span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── Business Logic Rules ── */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-amber-600" />
              <div>
                <CardTitle className="text-base">Business Logic &amp; Guardrails</CardTitle>
                <CardDescription>Set rules that govern how AI behaves in your ministry. These are enforced system-wide.</CardDescription>
              </div>
            </div>
            <Button size="sm" variant="outline" onClick={() => setShowAddRule(!showAddRule)}>
              {showAddRule ? <X className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
              {showAddRule ? "Cancel" : "Add Rule"}
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-2">
          {showAddRule && (
            <div className="p-4 border border-dashed border-amber-300 rounded-lg bg-amber-50 space-y-3">
              <FormField label="Rule Description">
                <Textarea value={newRuleText} onChange={e => setNewRuleText(e.target.value)} placeholder="Describe the rule AI must follow..." rows={2} aria-label="Rule description" />
              </FormField>
              <Button size="sm" onClick={addRule}><Check className="w-3.5 h-3.5" /> Add Rule</Button>
            </div>
          )}
          {rules.map((r, idx) => (
            <div key={r.id} className="flex items-start justify-between gap-3 p-3 rounded-lg border border-border hover:bg-muted/30 transition-colors">
              <div className="flex items-start gap-2.5 flex-1 min-w-0">
                <span className="text-xs font-bold text-muted-foreground mt-0.5 shrink-0 w-5">{idx + 1}.</span>
                <p className="text-sm text-foreground leading-relaxed">{r.rule}</p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <Switch
                  checked={r.enabled}
                  onCheckedChange={v => { setRules(prev => prev.map(x => x.id === r.id ? { ...x, enabled: v } : x)); toast.success(`Rule ${v ? "enabled" : "disabled"}`); }}
                  aria-label={`Toggle rule ${idx + 1}`}
                />
                <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-muted-foreground hover:text-red-500" onClick={() => { setRules(prev => prev.filter(x => x.id !== r.id)); toast.success("Rule removed"); }}>
                  <Trash2 className="w-3.5 h-3.5" />
                </Button>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </motion.div>
  );
};

// --- Terminology Section ---
type TermEntry = {
  id: string;
  key: string;
  defaultLabel: string;
  customLabel: string;
  description: string;
};

const DEFAULT_TERMS: TermEntry[] = [
  { id: "t-1",  key: "seeker",          defaultLabel: "Seeker",           customLabel: "", description: "A person exploring faith or being discipled" },
  { id: "t-2",  key: "mentor",          defaultLabel: "Mentor",           customLabel: "", description: "A person guiding a seeker in their journey" },
  { id: "t-3",  key: "mentor_coach",    defaultLabel: "Mentor Coach",     customLabel: "", description: "A leader who oversees and trains mentors" },
  { id: "t-4",  key: "journey",         defaultLabel: "Journey",          customLabel: "", description: "A seeker's discipleship path or automation flow" },
  { id: "t-5",  key: "milestone",       defaultLabel: "Milestone",        customLabel: "", description: "A key achievement in a seeker's faith journey" },
  { id: "t-6",  key: "group",           defaultLabel: "Group",            customLabel: "", description: "A collection of mentors or seekers organized together" },
  { id: "t-7",  key: "devotional",      defaultLabel: "Devotional",       customLabel: "", description: "A piece of spiritual content (Bible study, reading, etc.)" },
  { id: "t-8",  key: "campaign",        defaultLabel: "Campaign",         customLabel: "", description: "A structured outreach or content series" },
  { id: "t-9",  key: "contact",         defaultLabel: "Contact",          customLabel: "", description: "A person in the system (seeker, mentor, or other)" },
  { id: "t-10", key: "invitation",      defaultLabel: "Invitation",       customLabel: "", description: "A form sent to a prospective mentor to apply" },
  { id: "t-11", key: "automation",      defaultLabel: "Automation",       customLabel: "", description: "An automated workflow or journey builder flow" },
  { id: "t-12", key: "decision",        defaultLabel: "Decision",         customLabel: "", description: "The stage where a seeker makes a faith commitment" },
  { id: "t-13", key: "baptism",         defaultLabel: "Baptism",          customLabel: "", description: "The sacrament of baptism as a milestone" },
  { id: "t-14", key: "salvation",       defaultLabel: "Salvation",        customLabel: "", description: "The journey type focused on accepting Christ" },
  { id: "t-15", key: "discipleship",    defaultLabel: "Discipleship",     customLabel: "", description: "The overall process of growing in faith" },
  { id: "t-16", key: "congregation",    defaultLabel: "Congregation",     customLabel: "", description: "The church community or local body" },
  { id: "t-17", key: "small_group",     defaultLabel: "Small Group",      customLabel: "", description: "An intimate group for study, prayer, or fellowship" },
  { id: "t-18", key: "prayer_partner",  defaultLabel: "Prayer Partner",   customLabel: "", description: "A person paired with another for prayer support" },
];

const TerminologySection = () => {
  const [terms, setTerms] = useState<TermEntry[]>(DEFAULT_TERMS);
  const [savedValues, setSavedValues] = useState<Record<string, string>>({});
  const [searchQ, setSearchQ] = useState("");
  const [showAddCustom, setShowAddCustom] = useState(false);
  const [newKey, setNewKey] = useState("");
  const [newDefault, setNewDefault] = useState("");
  const [newDesc, setNewDesc] = useState("");

  const filtered = terms.filter(t =>
    t.defaultLabel.toLowerCase().includes(searchQ.toLowerCase()) ||
    t.customLabel.toLowerCase().includes(searchQ.toLowerCase()) ||
    t.key.toLowerCase().includes(searchQ.toLowerCase())
  );

  const updateTerm = (id: string, customLabel: string) => {
    setTerms(prev => prev.map(t => t.id === id ? { ...t, customLabel } : t));
  };

  const saveTerm = (t: TermEntry) => {
    setSavedValues(prev => ({ ...prev, [t.id]: t.customLabel }));
    toast.success(`"${t.defaultLabel}" saved as "${t.customLabel}"`);
  };

  const isDirty = (t: TermEntry) => {
    const saved = savedValues[t.id];
    if (saved === undefined) return t.customLabel.trim() !== "";
    return t.customLabel !== saved;
  };

  const resetTerm = (id: string) => {
    setTerms(prev => prev.map(t => t.id === id ? { ...t, customLabel: "" } : t));
    setSavedValues(prev => { const next = { ...prev }; delete next[id]; return next; });
  };

  const addCustomTerm = () => {
    if (!newKey.trim() || !newDefault.trim()) { toast.error("Key and default label are required"); return; }
    setTerms(prev => [...prev, { id: `t-${Date.now()}`, key: newKey.trim().toLowerCase().replace(/\s+/g, "_"), defaultLabel: newDefault.trim(), customLabel: "", description: newDesc.trim() }]);
    setNewKey(""); setNewDefault(""); setNewDesc(""); setShowAddCustom(false);
    toast.success("Custom term added");
  };

  const customizedCount = terms.filter(t => t.customLabel.trim()).length;

  const handleSave = () => {
    toast.success(`Terminology saved — ${customizedCount} term${customizedCount !== 1 ? "s" : ""} customized`);
  };

  const handleResetAll = () => {
    setTerms(prev => prev.map(t => ({ ...t, customLabel: "" })));
    setSavedValues({});
    toast.success("All terms reset to defaults");
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className="space-y-6"
    >
      <SectionHeader title="Terminology" description="Customize the words used throughout the platform to match your organization's language and culture." />
      <Separator />

      {/* Info banner */}
      <div className="flex items-start gap-3 p-4 rounded-lg border border-blue-200 bg-blue-50">
        <Globe className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-semibold text-blue-800">Make Turumba speak your language</p>
          <p className="text-xs text-blue-600 leading-relaxed mt-1">
            Every organization has its own vocabulary. Some call them "seekers," others say "new believers" or "students." Customize terms below and they will be reflected across the entire platform — dashboards, forms, automations, and more.
          </p>
        </div>
      </div>

      {/* Search + actions */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1">
          <input
            value={searchQ}
            onChange={e => setSearchQ(e.target.value)}
            placeholder="Search terms..."
            className="w-full h-9 pl-3 pr-3 border border-input rounded-md bg-background text-sm focus:outline-none focus:ring-1 focus:ring-ring"
            aria-label="Search terms"
          />
        </div>
        <Badge variant="secondary" className="text-xs shrink-0">{customizedCount} customized</Badge>
        <Button size="sm" variant="outline" onClick={() => setShowAddCustom(!showAddCustom)}>
          {showAddCustom ? <X className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
          {showAddCustom ? "Cancel" : "Add Term"}
        </Button>
      </div>

      {/* Add custom term form */}
      {showAddCustom && (
        <div className="p-4 border border-dashed border-primary/30 rounded-lg bg-primary/5 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <FormField label="Term Key" description="Internal identifier (e.g. small_group)">
              <Input value={newKey} onChange={e => setNewKey(e.target.value)} placeholder="e.g. fellowship" aria-label="Term key" />
            </FormField>
            <FormField label="Default Label" description="The standard name for this term">
              <Input value={newDefault} onChange={e => setNewDefault(e.target.value)} placeholder="e.g. Fellowship" aria-label="Default label" />
            </FormField>
          </div>
          <FormField label="Description" description="What this term refers to">
            <Input value={newDesc} onChange={e => setNewDesc(e.target.value)} placeholder="e.g. A gathering for worship and community" aria-label="Term description" />
          </FormField>
          <Button size="sm" onClick={addCustomTerm}><Check className="w-3.5 h-3.5" /> Add Term</Button>
        </div>
      )}

      {/* Terms table */}
      <Card>
        <CardContent className="p-0">
          <table className="w-full">
            <thead>
              <tr className="bg-muted/40 border-b border-border text-xs uppercase tracking-wider text-muted-foreground">
                <th className="px-4 py-3 text-left font-semibold">Default Term</th>
                <th className="px-4 py-3 text-left font-semibold">Your Custom Term</th>
                <th className="px-4 py-3 text-left font-semibold">Description</th>
                <th className="px-4 py-3 text-right font-semibold w-36">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={4} className="px-4 py-8 text-center text-sm text-muted-foreground">No terms match your search.</td></tr>
              ) : filtered.map(t => {
                const isBuiltIn = DEFAULT_TERMS.some(d => d.id === t.id);
                return (
                  <tr key={t.id} className="border-b border-border last:border-0 hover:bg-muted/20 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-foreground">{t.defaultLabel}</span>
                        {t.customLabel.trim() && <Badge variant="default" className="text-xs">Customized</Badge>}
                        {!isBuiltIn && <Badge variant="secondary" className="text-xs">Custom</Badge>}
                      </div>
                      <span className="text-xs text-muted-foreground font-mono">{t.key}</span>
                    </td>
                    <td className="px-4 py-3">
                      <Input
                        value={t.customLabel}
                        onChange={e => updateTerm(t.id, e.target.value)}
                        placeholder={t.defaultLabel}
                        className="h-8 text-sm max-w-[200px]"
                        aria-label={`Custom label for ${t.defaultLabel}`}
                      />
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground max-w-[240px]">{t.description}</td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        {isDirty(t) && (
                          <Button size="sm" className="h-7 text-xs" onClick={() => saveTerm(t)}>
                            <Save className="w-3 h-3" /> Save
                          </Button>
                        )}
                        {t.customLabel.trim() && !isDirty(t) && (
                          <Badge variant="secondary" className="text-xs mr-1">Saved</Badge>
                        )}
                        {t.customLabel.trim() && (
                          <Button variant="ghost" size="sm" className="h-7 text-xs text-muted-foreground hover:text-foreground" onClick={() => resetTerm(t.id)}>
                            Reset
                          </Button>
                        )}
                        {!isBuiltIn && (
                          <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-muted-foreground hover:text-red-500" onClick={() => { setTerms(prev => prev.filter(x => x.id !== t.id)); toast.success(`"${t.defaultLabel}" removed`); }}>
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </CardContent>
      </Card>

      {/* Reset All — bottom utility */}
      <div className="flex items-center justify-end">
        <Button variant="outline" size="sm" onClick={handleResetAll}>
          Reset All to Defaults
        </Button>
      </div>
    </motion.div>
  );
};