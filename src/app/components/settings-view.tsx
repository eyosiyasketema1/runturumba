import React, { useState } from "react";
import {
  User, Building2, CreditCard, Bell, Shield, Mail,
  Phone, Globe, Clock, MapPin, Camera, Save,
  Check, ChevronRight, Key, Smartphone, Lock, Eye,
  ArrowLeft, ArrowUpRight, Download, Sparkles, Pencil, Plus, Trash2, X,
  Brain, Share2, AlertCircle, BookOpen, Loader2, CheckCircle2, XCircle, ExternalLink, Zap, ShieldCheck, RotateCcw
} from "lucide-react";
import { motion } from "motion/react";
import { toast } from "sonner";

import { cn, type Tenant, type User as UserType, type Plan, PLAN_LIMITS } from "./types";
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
              <button className="absolute inset-0 rounded-full bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
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
                  {stat.max && <span className="text-muted-foreground/60"> / {stat.max}</span>}
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

// --- Main Settings View ---
export const SettingsView = ({
  tenant,
  user,
  onUpgrade,
  onUpdateTenant,
  onUpdateUser
}: {
  tenant: Tenant;
  user: UserType;
  onUpgrade: (plan: Plan) => void;
  onUpdateTenant: (data: Partial<Tenant>) => void;
  onUpdateUser: (data: Partial<UserType>) => void;
}) => {
  const [activeSection, setActiveSection] = useState("profile");

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
              {settingsNav.map((item) => {
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
                        isActive ? "text-muted-foreground" : "text-muted-foreground/60"
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
const ApiSection = () => {
  const [apiKeys] = useState([
    { id: "key-1", name: "Production API Key", key: "trb_live_a1b2c3d4e5f6g7h8i9j0", created: "Jan 15, 2026", lastUsed: "Feb 20, 2026", active: true },
    { id: "key-2", name: "Staging API Key", key: "trb_test_z9y8x7w6v5u4t3s2r1q0", created: "Feb 1, 2026", lastUsed: "Feb 18, 2026", active: true },
  ]);
  const [showKey, setShowKey] = useState<Record<string, boolean>>({});
  const [webhookSecret] = useState("whsec_k3p9m2n7x4b8v1c6");

  const toggleShowKey = (id: string) => setShowKey(prev => ({ ...prev, [id]: !prev[id] }));

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className="space-y-6"
    >
      <SectionHeader title="API & Integrations" description="Manage API keys and developer tools for integrating with Turumba." />
      <Separator />

      {/* API Keys */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-sm font-semibold">API Keys</CardTitle>
              <CardDescription className="text-xs">Use these keys to authenticate requests to the Turumba API.</CardDescription>
            </div>
            <Button size="sm" variant="outline" onClick={() => toast.success("New API key generated")}>
              <Key className="w-3.5 h-3.5" />
              Generate Key
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {apiKeys.map(ak => (
            <div key={ak.id} className="p-4 border rounded-lg bg-muted/10 space-y-2">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-foreground">{ak.name}</p>
                  <p className="text-xs text-muted-foreground">Created {ak.created} &middot; Last used {ak.lastUsed}</p>
                </div>
                <Badge variant="outline" className="text-xs text-emerald-600 border-emerald-200 bg-emerald-50">Active</Badge>
              </div>
              <div className="flex items-center gap-2 bg-muted/50 p-2 border rounded">
                <code className="text-xs font-mono text-foreground flex-1">
                  {showKey[ak.id] ? ak.key : ak.key.slice(0, 12) + "•".repeat(20)}
                </code>
                <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => toggleShowKey(ak.id)}>
                  <Eye className="w-3.5 h-3.5 text-muted-foreground" />
                </Button>
                <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => { navigator.clipboard?.writeText(ak.key); toast.success("API key copied"); }}>
                  <Download className="w-3.5 h-3.5 text-muted-foreground" />
                </Button>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Webhook Signing Secret */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-semibold">Webhook Signing Secret</CardTitle>
          <CardDescription className="text-xs">Use this secret to verify incoming webhook payloads from Turumba.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2 bg-muted/50 p-3 border rounded">
            <code className="text-xs font-mono text-foreground flex-1">
              {showKey["webhook"] ? webhookSecret : "whsec_" + "•".repeat(16)}
            </code>
            <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => toggleShowKey("webhook")}>
              <Eye className="w-3.5 h-3.5 text-muted-foreground" />
            </Button>
            <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => { navigator.clipboard?.writeText(webhookSecret); toast.success("Secret copied"); }}>
              <Download className="w-3.5 h-3.5 text-muted-foreground" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Rate Limits */}
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

      {/* Documentation Link */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <p className="text-sm font-medium text-foreground">API Documentation</p>
              <p className="text-[13px] text-muted-foreground">Full reference for all API endpoints, schemas, and examples.</p>
            </div>
            <Button variant="outline" size="sm" onClick={() => toast.info("API docs would open in a new tab")}>
              View Docs
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

// --- AI Configuration Section ---
type AIProvider = {
  id: string;
  name: string;
  icon: string;
  color: string;
  bgColor: string;
  keyPrefix: string;
  keyHint: string;
  docsUrl: string;
  features: string[];
};

const AI_PROVIDERS: AIProvider[] = [
  { id: "openai",    name: "OpenAI",    icon: "⚡", color: "text-emerald-700", bgColor: "bg-emerald-50 border-emerald-200", keyPrefix: "sk-",     keyHint: "Starts with sk- or sk-proj-",      docsUrl: "https://platform.openai.com/api-keys", features: ["Chat", "Classification", "Content Generation"] },
  { id: "anthropic", name: "Anthropic",  icon: "🔮", color: "text-violet-700",  bgColor: "bg-violet-50 border-violet-200",  keyPrefix: "sk-ant-", keyHint: "Starts with sk-ant-",              docsUrl: "https://console.anthropic.com/settings/keys", features: ["Chat", "Content Generation", "Sentiment Analysis"] },
  { id: "google",    name: "Google AI",  icon: "🌐", color: "text-blue-700",    bgColor: "bg-blue-50 border-blue-200",      keyPrefix: "AI",      keyHint: "Starts with AIza...",              docsUrl: "https://aistudio.google.com/apikey", features: ["Chat", "Translation", "Classification"] },
  { id: "cohere",    name: "Cohere",     icon: "🧬", color: "text-orange-700",  bgColor: "bg-orange-50 border-orange-200",  keyPrefix: "",        keyHint: "Alphanumeric key from dashboard",  docsUrl: "https://dashboard.cohere.com/api-keys", features: ["Classification", "Embeddings"] },
  { id: "mistral",   name: "Mistral",    icon: "💨", color: "text-sky-700",     bgColor: "bg-sky-50 border-sky-200",        keyPrefix: "",        keyHint: "API key from Mistral console",     docsUrl: "https://console.mistral.ai/api-keys", features: ["Chat", "Content Generation"] },
  { id: "azure",     name: "Azure OpenAI", icon: "☁️", color: "text-blue-700", bgColor: "bg-blue-50 border-blue-200",      keyPrefix: "",        keyHint: "32-character hex key",             docsUrl: "https://portal.azure.com", features: ["Chat", "Classification", "Content Generation"] },
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
                <Textarea value={newRuleText} onChange={e => setNewRuleText(e.target.value)} placeholder="Describe the rule AI must follow..." rows={2} />
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
                />
                <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-muted-foreground hover:text-red-500" onClick={() => { setRules(prev => prev.filter(x => x.id !== r.id)); toast.success("Rule removed"); }}>
                  <Trash2 className="w-3.5 h-3.5" />
                </Button>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

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
                      {isDone ? <CheckCircle2 className="w-3.5 h-3.5 text-primary" /> : <span className={cn("w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold", isCurrent ? "bg-foreground text-background" : "bg-muted text-muted-foreground")}>{num}</span>}
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
                          <span className="text-2xl">{p.icon}</span>
                          <span className="text-sm font-bold text-foreground">{p.name}</span>
                          <span className="text-[10px] text-muted-foreground leading-tight">{p.features.slice(0, 2).join(", ")}</span>
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
                      <span className="text-2xl">{selectedProvider.icon}</span>
                      <div>
                        <p className="text-sm font-bold text-foreground">{selectedProvider.name}</p>
                        <p className="text-xs text-muted-foreground">{selectedProvider.keyHint}</p>
                      </div>
                    </div>

                    <FormField label="Label (what's this key for?)">
                      <Input value={newKeyLabel} onChange={e => setNewKeyLabel(e.target.value)} placeholder={`e.g. Production ${selectedProvider.name}`} />
                    </FormField>

                    <FormField label="API Key">
                      <div className="flex gap-2">
                        <Input
                          value={newKeyValue}
                          onChange={e => { setNewKeyValue(e.target.value); if (verifyState !== "idle") setVerifyState("idle"); }}
                          placeholder={selectedProvider.keyPrefix ? `${selectedProvider.keyPrefix}...` : "Paste your API key here"}
                          type="password"
                          className="flex-1 font-mono"
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
                            : <div className="w-4 h-4 rounded-full border-2 border-muted-foreground/30 shrink-0" />
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
                    <span className="text-xl">{provider?.icon || "🔑"}</span>
                    <div>
                      <p className="text-sm font-bold text-foreground">Editing — {provider?.name || k.provider}</p>
                      <p className="text-xs text-muted-foreground">Update label, key, or feature assignments.</p>
                    </div>
                  </div>

                  <FormField label="Label">
                    <Input value={editLabel} onChange={e => setEditLabel(e.target.value)} />
                  </FormField>

                  <FormField label="API Key">
                    <div className="flex gap-2">
                      <Input
                        value={editKeyValue}
                        onChange={e => { setEditKeyValue(e.target.value); setEditKeyChanged(true); if (editVerifyState !== "idle") setEditVerifyState("idle"); }}
                        type="password"
                        className="flex-1 font-mono"
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
                    {!editKeyChanged && <p className="text-[11px] text-muted-foreground mt-1">Change the key value to re-verify.</p>}
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
                            : <div className="w-3.5 h-3.5 rounded-full border-2 border-muted-foreground/30 shrink-0" />
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
                  <div className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0 text-lg bg-muted border border-border">
                    {provider?.icon || "🔑"}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-bold text-foreground">{k.label}</p>
                      <Badge variant="secondary" className="text-[10px]">{provider?.name || k.provider}</Badge>
                      {k.verified ? (
                        <span className="inline-flex items-center gap-0.5 text-[10px] font-medium text-primary">
                          <CheckCircle2 className="w-3 h-3" /> Verified
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-0.5 text-[10px] font-medium text-amber-600">
                          <AlertCircle className="w-3 h-3" /> Unverified
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5 font-mono">
                      {showKeyValues[k.id] ? k.key : k.key.slice(0, 8) + "•••••••••••••••"}
                    </p>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="text-[11px] text-muted-foreground">Added {k.addedAt}</span>
                      {k.verifiedAt && <span className="text-[11px] text-muted-foreground">· Verified {k.verifiedAt}</span>}
                    </div>
                    {k.assignedFeatures && k.assignedFeatures.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-1.5">
                        {k.assignedFeatures.map(f => (
                          <span key={f} className="px-1.5 py-0.5 text-[10px] font-medium rounded bg-muted text-muted-foreground border border-border">{f}</span>
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
              <Input value={newKey} onChange={e => setNewKey(e.target.value)} placeholder="e.g. fellowship" />
            </FormField>
            <FormField label="Default Label" description="The standard name for this term">
              <Input value={newDefault} onChange={e => setNewDefault(e.target.value)} placeholder="e.g. Fellowship" />
            </FormField>
          </div>
          <FormField label="Description" description="What this term refers to">
            <Input value={newDesc} onChange={e => setNewDesc(e.target.value)} placeholder="e.g. A gathering for worship and community" />
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
                        {t.customLabel.trim() && <Badge variant="default" className="text-[10px]">Customized</Badge>}
                        {!isBuiltIn && <Badge variant="secondary" className="text-[10px]">Custom</Badge>}
                      </div>
                      <span className="text-[11px] text-muted-foreground font-mono">{t.key}</span>
                    </td>
                    <td className="px-4 py-3">
                      <Input
                        value={t.customLabel}
                        onChange={e => updateTerm(t.id, e.target.value)}
                        placeholder={t.defaultLabel}
                        className="h-8 text-sm max-w-[200px]"
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
                          <Badge variant="secondary" className="text-[10px] mr-1">Saved</Badge>
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