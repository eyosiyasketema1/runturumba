import React, { useState, useEffect, useMemo } from "react";
import {
  LayoutDashboard, Users, MessageSquare, Database, Settings,
  ChevronDown, Plus, LogOut, Bell, Search, Menu, X,
  Trash2, Edit2, Check, Building2,
  ShieldCheck, UserCheck, ArrowRight, Download, Tag,
  FileText, FileSpreadsheet, AlertTriangle, Crown,
  Zap, Settings2, ListFilter,
  Phone, Mail, StickyNote, BarChart3, Send,
  Globe, CreditCard, UserPlus, Info, Radio,
  UserSearch, Shield, GitBranch, Route, Library, Flag,
  Activity, TrendingUp, HelpCircle, Sparkles, PenTool, ChevronUp
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { toast, Toaster } from "sonner";
const imgAvatar = "https://ui-avatars.com/api/?name=User&background=6366f1&color=fff&size=128";

import Papa from "papaparse";
import * as XLSX from "xlsx";

import {
  INITIAL_TEMPLATES,
  type MessageTemplate,
} from "./components/message-data";

// Shared types, constants, data
import {
  cn,
  type Role, type Plan, type MessageStatus, type MessagePort, type ChannelType,
  type Tenant, type User, type Contact, type Group, type TeamGroup,
  type Message, type Broadcast, type ContactNote,
  type DeliveryChannel, type AutomationRule, type Webhook as WebhookType,
  type AuditLogEntry,
  type ChatEndpoint, type ConversationRule,
  PLAN_LIMITS, CHANNEL_TYPES,
  INITIAL_TENANTS, INITIAL_USERS, INITIAL_CONTACTS, INITIAL_GROUPS, INITIAL_TEAM_GROUPS,
  INITIAL_MESSAGES, INITIAL_BROADCASTS, INITIAL_NOTES,
  INITIAL_CHANNELS, INITIAL_AUTOMATIONS, INITIAL_WEBHOOKS, INITIAL_AUDIT_LOG,
  INITIAL_CHAT_ENDPOINTS, INITIAL_CONVERSATION_RULES
} from "./components/types";

// Shared UI components
import {
  Modal, RoleBadge, NotificationDropdown
} from "./components/shared-ui";

// Extracted views
import { DashboardView } from "./components/dashboard-view";
import { SettingsView } from "./components/settings-view";
import { MessagesView } from "./components/messages-view";
import { ContactsView } from "./components/contacts-view";
import { ContactDetailModal } from "./components/contact-detail-modal";
import { NewMessageFlow } from "./components/new-message-flow";
import { TeamManagement } from "./components/organization-user-crud";
import { ChannelsView } from "./components/channels-view";
import { AutomationView } from "./components/automation-view";
import { OnboardingFlow } from "./components/onboarding-flow";

import { ConversationView } from "./components/conversation-view";
import {
  SeekersView, MentorsView, MatchesView, FaithJourneysView, MilestonesView,
  ContentLibraryView, GrowthMetricsView, VitalAnalyticsView,
  ReportingView, ValidationsView, DiscipleshipDashboardView,
  MainDashboardView, VitalDashboardView
} from "./components/discipleship-views";
import {
  DropdownMenu, DropdownMenuTrigger, DropdownMenuContent,
  DropdownMenuItem, DropdownMenuSeparator
} from "./components/ui/dropdown-menu";

// --- Role System ---
// Super Admin is a dev/testing god-mode. The four product roles map to the
// Turumba Roles & Permissions spec. "Mentor" replaces the legacy "agent".
type ViewRole = "super_admin" | "admin" | "mentor_coach" | "content_creator" | "mentor";

const ROLE_OPTIONS: { id: ViewRole; label: string; description: string; icon: any }[] = [
  { id: "super_admin",     label: "Super Admin",     description: "Full developer view — all features",    icon: ShieldCheck },
  { id: "admin",           label: "Admin",           description: "Account administrator — full CRUD",    icon: Crown },
  { id: "mentor_coach",    label: "Mentor Coach",    description: "Oversees mentors and matches",         icon: UserCheck },
  { id: "content_creator", label: "Content Creator", description: "Creates devotionals and studies",      icon: PenTool },
  { id: "mentor",          label: "Mentor",          description: "Mentors assigned seekers (was Agent)", icon: Users },
];

// Which views each role can access. Views omitted from a role's list are
// hidden from the sidebar and blocked from being navigated to.
const ROLE_VIEW_ACCESS: Record<ViewRole, string[]> = {
  super_admin:     ["dashboard", "contacts", "messages", "conversations", "seekers", "mentors", "matches", "faith_journeys", "milestones", "channels", "automations", "content_library", "growth_metrics", "vital_analytics", "reporting", "validations", "team", "settings"],
  admin:           ["dashboard", "contacts", "messages", "conversations", "seekers", "mentors", "matches", "faith_journeys", "milestones", "channels", "automations", "content_library", "growth_metrics", "vital_analytics", "reporting", "validations", "team", "settings"],
  mentor_coach:    ["dashboard", "messages", "conversations", "seekers", "mentors", "matches", "faith_journeys", "milestones", "content_library", "growth_metrics", "vital_analytics", "reporting", "validations"],
  content_creator: ["dashboard", "content_library"],
  mentor:          ["dashboard", "contacts", "messages", "conversations", "seekers", "matches", "faith_journeys", "milestones", "content_library"],
};

// --- App Component ---

export default function App() {
  const [activeTenant, setActiveTenant] = useState<Tenant>(INITIAL_TENANTS[0]);
  const [currentUser, setCurrentUser] = useState<User>(INITIAL_USERS[0]);
  const [currentView, setCurrentView] = useState("dashboard");
  const [dashboardTab, setDashboardTab] = useState<"main" | "discipleship" | "collective">("main");
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isNewMessageFlowOpen, setIsNewMessageFlowOpen] = useState(false);
  const [viewMode, setViewMode] = useState<ViewRole>("super_admin");
  const [isRoleMenuOpen, setIsRoleMenuOpen] = useState(false);
  const [isOnboarding, setIsOnboarding] = useState(() => {
    return localStorage.getItem("turumba_onboarding_complete") !== "true";
  });
  
  // Data State
  const [contacts, setContacts] = useState<Contact[]>(INITIAL_CONTACTS);
  const [groups, setGroups] = useState<Group[]>(INITIAL_GROUPS);
  const [teamGroups, setTeamGroups] = useState<TeamGroup[]>(INITIAL_TEAM_GROUPS);
  const [messages, setMessages] = useState<Message[]>(INITIAL_MESSAGES);
  const [broadcasts, setBroadcasts] = useState<Broadcast[]>(INITIAL_BROADCASTS);
  const [notes, setNotes] = useState<ContactNote[]>(INITIAL_NOTES);
  const [users, setUsers] = useState<User[]>(INITIAL_USERS);
  const [channels, setChannels] = useState<DeliveryChannel[]>(INITIAL_CHANNELS);
  const [automations, setAutomations] = useState<AutomationRule[]>(INITIAL_AUTOMATIONS);
  const [webhooks, setWebhooks] = useState<WebhookType[]>(INITIAL_WEBHOOKS);
  const [chatEndpoints, setChatEndpoints] = useState<ChatEndpoint[]>(INITIAL_CHAT_ENDPOINTS);
  const [conversationRules, setConversationRules] = useState<ConversationRule[]>(INITIAL_CONVERSATION_RULES);
  
  // Selected state for modals
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isAddContactOpen, setIsAddContactOpen] = useState(false);
  const [newContactForm, setNewContactForm] = useState({ name: "", phone: "", email: "" });
  const [isLogoutConfirmOpen, setIsLogoutConfirmOpen] = useState(false);
  
  const navSections: { label: string; items: { id: string; name: string; icon: any; badge?: number }[] }[] = [
    {
      label: "Main",
      items: [
        { id: "dashboard",     name: "Dashboard",     icon: LayoutDashboard },
        { id: "contacts",      name: "Contacts",      icon: UserSearch },
        { id: "messages",      name: "Messages",      icon: MessageSquare, badge: 35 },
        { id: "conversations", name: "Conversations", icon: Send },
      ]
    },
    {
      label: "Discipleship",
      items: [
        { id: "seekers",        name: "Seekers",        icon: Users },
        { id: "mentors",        name: "Mentors",        icon: Shield },
        { id: "matches",        name: "Matches",        icon: GitBranch },
        { id: "faith_journeys", name: "Faith Journeys", icon: Route },
        { id: "milestones",     name: "Milestones",     icon: Flag },
      ]
    },
    {
      label: "Engage",
      items: [
        { id: "channels",        name: "Channels",        icon: Radio },
        { id: "automations",     name: "Automations",     icon: Zap },
        { id: "content_library", name: "Content Library", icon: Library },
      ]
    },
    {
      label: "153 Collective",
      items: [
        { id: "growth_metrics",  name: "Growth Metrics",   icon: TrendingUp },
        { id: "vital_analytics", name: "VITAL Analytics",  icon: Activity },
        { id: "reporting",       name: "Reporting",        icon: HelpCircle },
        { id: "validations",     name: "Validations",      icon: HelpCircle },
      ]
    },
    {
      label: "System",
      items: [
        { id: "team",     name: "Users",    icon: UserCheck },
        { id: "settings", name: "Settings", icon: Settings },
      ]
    },
  ];

  const allowedViewIds = ROLE_VIEW_ACCESS[viewMode];
  const filteredNavSections = navSections
    .map(s => ({ ...s, items: s.items.filter(i => allowedViewIds.includes(i.id)) }))
    .filter(s => s.items.length > 0);

  const currentRole = ROLE_OPTIONS.find(r => r.id === viewMode) || ROLE_OPTIONS[0];

  // If the current view becomes disallowed after a role switch, fall back to dashboard.
  useEffect(() => {
    if (!allowedViewIds.includes(currentView)) {
      setCurrentView("dashboard");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [viewMode]);

  const handleNavigate = (view: string) => {
    setCurrentView(view);
    setIsMobileSidebarOpen(false);
  };

  const handleSendMessage = (contactId: string, content: string, scheduledAt?: string, port: MessagePort = "whatsapp") => {
    const newMessage: Message = {
      id: `msg-${Date.now()}`,
      contactId,
      tenantId: activeTenant.id,
      senderId: currentUser.id,
      senderType: "user",
      content,
      status: scheduledAt ? "scheduled" : "sent",
      port,
      createdAt: scheduledAt || new Date().toISOString()
    };
    setMessages(prev => [newMessage, ...prev]);
    toast.success(scheduledAt ? "Message scheduled" : "Message sent");
  };

  const handleCreateBroadcast = (broadcastData: any) => {
    const newBroadcast: Broadcast = {
      id: `bc-${Date.now()}`,
      tenantId: activeTenant.id,
      name: broadcastData.name,
      targetGroupId: broadcastData.groupIds[0] || "all",
      content: broadcastData.content,
      status: broadcastData.isScheduled ? "scheduled" : "delivered",
      port: broadcastData.port,
      stats: { sent: 0, delivered: 0, read: 0, failed: 0 },
      scheduledAt: broadcastData.scheduledAt,
      frequency: broadcastData.frequency,
      createdAt: new Date().toISOString()
    };
    setBroadcasts(prev => [newBroadcast, ...prev]);
    toast.success(broadcastData.isScheduled ? "Broadcast scheduled!" : "Broadcast sent!");
  };

  const handleAddContact = () => {
    setNewContactForm({ name: "", phone: "", email: "" });
    setIsAddContactOpen(true);
  };

  const handleSaveNewContact = () => {
    if (!newContactForm.name.trim() || !newContactForm.phone.trim()) {
      toast.error("Name and phone number are required.");
      return;
    }
    const newContact: Contact = {
      id: `contact-${Date.now()}`,
      name: newContactForm.name.trim(),
      phone: newContactForm.phone.trim(),
      email: newContactForm.email.trim() || null,
      tags: [],
      groupIds: [],
      tenantId: activeTenant.id,
      createdAt: new Date().toISOString(),
    };
    setContacts(prev => [newContact, ...prev]);
    setIsAddContactOpen(false);
    toast.success(`"${newContact.name}" has been added.`);
  };

  const handleLogout = () => {
    // Clear persisted state
    localStorage.removeItem("turumba_onboarding_complete");
    
    // Reset all app state to initial values
    setActiveTenant(INITIAL_TENANTS[0]);
    setCurrentUser(INITIAL_USERS[0]);
    setCurrentView("dashboard");
    setContacts(INITIAL_CONTACTS);
    setGroups(INITIAL_GROUPS);
    setMessages(INITIAL_MESSAGES);
    setBroadcasts(INITIAL_BROADCASTS);
    setNotes(INITIAL_NOTES);
    setUsers(INITIAL_USERS);
    setChannels(INITIAL_CHANNELS);
    setAutomations(INITIAL_AUTOMATIONS);
    setWebhooks(INITIAL_WEBHOOKS);
    setChatEndpoints(INITIAL_CHAT_ENDPOINTS);
    setConversationRules(INITIAL_CONVERSATION_RULES);
    setSelectedContact(null);
    setIsDetailModalOpen(false);
    setIsAddContactOpen(false);
    setIsNotificationsOpen(false);
    setIsMobileSidebarOpen(false);
    setIsLogoutConfirmOpen(false);
    
    // Return to onboarding / login
    setIsOnboarding(true);
    toast.success("You've been signed out.");
  };

  const handleOnboardingComplete = (onboardingData: any) => {
    // Apply onboarding data to app state
    if (onboardingData.orgName) {
      setActiveTenant(prev => ({
        ...prev,
        name: onboardingData.orgName,
        industry: onboardingData.industry || prev.industry,
      }));
    }
    if (onboardingData.fullName) {
      setCurrentUser(prev => ({
        ...prev,
        name: onboardingData.fullName,
        email: onboardingData.email || prev.email,
      }));
    }
    // Add channels from onboarding
    if (onboardingData.selectedChannels?.length > 0) {
      const newChannels: DeliveryChannel[] = onboardingData.selectedChannels.map((chType: ChannelType, i: number) => ({
        id: `ch-onboard-${Date.now()}-${i}`,
        tenantId: activeTenant.id,
        name: `${CHANNEL_TYPES.find(c => c.id === chType)?.label || chType}`,
        type: chType,
        status: "disconnected" as const,
        enabled: false,
        config: onboardingData.channelConfigs?.[chType] || {},
        createdAt: new Date().toISOString(),
        stats: { sent: 0, delivered: 0, failed: 0 },
      }));
      setChannels(prev => [...newChannels, ...prev]);
    }
    // Add manual contacts from onboarding
    if (onboardingData.contactMethod === "manual" && onboardingData.manualContacts?.length > 0) {
      const newContacts: Contact[] = onboardingData.manualContacts
        .filter((c: any) => c.name.trim())
        .map((c: any, i: number) => ({
          id: `contact-onboard-${Date.now()}-${i}`,
          name: c.name.trim(),
          phone: c.phone.trim(),
          email: c.email.trim() || null,
          tags: [],
          groupIds: [],
          tenantId: activeTenant.id,
          createdAt: new Date().toISOString(),
        }));
      if (newContacts.length > 0) {
        setContacts(prev => [...newContacts, ...prev]);
      }
    }

    setIsOnboarding(false);
    localStorage.setItem("turumba_onboarding_complete", "true");
    toast.success(`Welcome to Turumba, ${onboardingData.fullName?.split(" ")[0] || "there"}!`);
  };

  // Show onboarding flow for new users
  if (isOnboarding) {
    return (
      <>
        <Toaster position="top-right" richColors closeButton />
        <OnboardingFlow onComplete={handleOnboardingComplete} />
      </>
    );
  }

  return (
    <div className="flex h-screen bg-background text-foreground font-sans antialiased overflow-hidden">
      <Toaster position="top-right" richColors closeButton />

      {/* Mobile sidebar overlay */}
      <AnimatePresence>
        {isMobileSidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsMobileSidebarOpen(false)}
            className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          />
        )}
      </AnimatePresence>
      
      {/* Sidebar */}
      <aside
        className={cn(
          "h-full bg-sidebar border-r border-sidebar-border transition-all duration-300 flex flex-col z-50 text-sidebar-foreground",
          "fixed lg:relative",
          isMobileSidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0",
          isSidebarCollapsed ? "lg:w-[72px] w-72" : "w-60"
        )}
      >
        {/* Logo */}
        <div className="flex items-center justify-between h-[64px] px-4">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-9 h-9 rounded-lg bg-primary flex items-center justify-center shrink-0 shadow-sm">
              <Globe className="w-4 h-4 text-primary-foreground" />
            </div>
            {(!isSidebarCollapsed || isMobileSidebarOpen) && (
              <div className="flex flex-col min-w-0">
                <span className="text-sm font-bold text-sidebar-foreground tracking-tight truncate">{activeTenant.name}</span>
                <span className="text-xs text-muted-foreground truncate">Workspace</span>
              </div>
            )}
          </div>
          <button
            onClick={() => setIsMobileSidebarOpen(false)}
            className="lg:hidden p-1.5 text-muted-foreground hover:text-foreground transition-colors"
            aria-label="Close menu"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <nav className="flex-1 px-3 py-2 space-y-4 overflow-y-auto no-scrollbar">
          {filteredNavSections.map((section) => (
            <div key={section.label} className="space-y-0.5">
              {(!isSidebarCollapsed || isMobileSidebarOpen) && (
                <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider px-2 pb-1.5 pt-2">{section.label}</p>
              )}
              {isSidebarCollapsed && !isMobileSidebarOpen && <div className="h-px bg-sidebar-border mx-2 mb-2" />}
              {section.items.map((item) => {
                const isActive = currentView === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => handleNavigate(item.id)}
                    title={isSidebarCollapsed && !isMobileSidebarOpen ? item.name : undefined}
                    aria-label={item.name}
                    className={cn(
                      "w-full flex items-center gap-3 px-2.5 py-2 rounded-md text-sm font-medium transition-all",
                      isActive
                        ? "bg-primary text-primary-foreground shadow-sm"
                        : "text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                    )}
                  >
                    <item.icon className="w-4 h-4 shrink-0" />
                    {(!isSidebarCollapsed || isMobileSidebarOpen) && (
                      <>
                        <span className="flex-1 text-left">{item.name}</span>
                        {item.badge && (
                          <span className={cn(
                            "px-1.5 py-0.5 text-xs font-semibold rounded-md",
                            isActive ? "bg-white/20 text-white" : "bg-primary/10 text-primary"
                          )}>
                            {item.badge}
                          </span>
                        )}
                      </>
                    )}
                  </button>
                );
              })}
            </div>
          ))}
        </nav>

      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 h-full relative z-10">
        <header className="h-[60px] border-b border-border bg-background px-4 lg:px-6 flex items-center justify-between z-20 sticky top-0">
          <div className="flex items-center gap-2">
            <button 
              onClick={() => setIsMobileSidebarOpen(true)}
              className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted transition-all lg:hidden"
              aria-label="Open menu"
            >
              <Menu className="w-5 h-5" />
            </button>
            <button 
              onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
              className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted transition-all hidden lg:flex"
              aria-label={isSidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="hidden md:flex items-center gap-2 ml-1">
              <div className="h-4 w-px bg-border" />
              <span className="text-sm font-semibold text-muted-foreground">Turumba</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Role Switcher Dropdown — preview each role's effect on the sidebar */}
            <div className="relative">
              <button
                onClick={() => setIsRoleMenuOpen(v => !v)}
                aria-haspopup="listbox"
                aria-expanded={isRoleMenuOpen}
                className={cn(
                  "flex items-center gap-2 pl-2.5 pr-2 py-1.5 text-xs font-semibold rounded-md border transition-all",
                  isRoleMenuOpen
                    ? "border-primary/40 bg-primary/5 text-foreground"
                    : "border-border bg-muted/40 text-foreground hover:bg-muted"
                )}
                title="Switch role to preview its view"
              >
                <span className="hidden sm:inline text-[10px] font-bold uppercase tracking-wider text-muted-foreground">View as</span>
                <currentRole.icon className="w-3.5 h-3.5 text-primary" />
                <span className="max-w-[120px] truncate">{currentRole.label}</span>
                {isRoleMenuOpen
                  ? <ChevronUp className="w-3.5 h-3.5 text-muted-foreground" />
                  : <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />}
              </button>

              <AnimatePresence>
                {isRoleMenuOpen && (
                  <>
                    <div className="fixed inset-0 z-30" onClick={() => setIsRoleMenuOpen(false)} />
                    <motion.div
                      initial={{ opacity: 0, y: -4 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -4 }}
                      transition={{ duration: 0.15 }}
                      className="absolute right-0 mt-2 w-72 bg-popover border border-border rounded-md shadow-lg z-40 overflow-hidden"
                      role="listbox"
                    >
                      <div className="px-3 py-2 border-b border-border bg-muted/30">
                        <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Preview Role</p>
                        <p className="text-xs text-muted-foreground mt-0.5">Switch to see what each role sees</p>
                      </div>
                      <div className="py-1">
                        {ROLE_OPTIONS.map(role => {
                          const isSelected = role.id === viewMode;
                          const RoleIcon = role.icon;
                          return (
                            <button
                              key={role.id}
                              role="option"
                              aria-selected={isSelected}
                              onClick={() => { setViewMode(role.id); setIsRoleMenuOpen(false); }}
                              className={cn(
                                "w-full flex items-start gap-3 px-3 py-2.5 text-left transition-colors",
                                isSelected ? "bg-primary/5" : "hover:bg-muted/50"
                              )}
                            >
                              <div className={cn(
                                "w-8 h-8 rounded-md flex items-center justify-center shrink-0",
                                isSelected ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                              )}>
                                <RoleIcon className="w-4 h-4" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between gap-2">
                                  <span className={cn("text-sm font-semibold truncate", isSelected ? "text-primary" : "text-foreground")}>{role.label}</span>
                                  {isSelected && <Check className="w-4 h-4 text-primary shrink-0" />}
                                </div>
                                <p className="text-xs text-muted-foreground leading-snug">{role.description}</p>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>
            <div className="hidden lg:block h-6 w-px bg-border" />
            <div className="relative">
              <button
                onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
                className="p-2 text-muted-foreground hover:text-foreground hover:bg-muted transition-all relative"
                aria-label="Notifications"
              >
                <Bell className="w-4.5 h-4.5" />
                <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-red-500 rounded-full" />
              </button>
              <NotificationDropdown
                messages={messages}
                broadcasts={broadcasts}
                contacts={contacts}
                isOpen={isNotificationsOpen}
                onClose={() => setIsNotificationsOpen(false)}
                onNavigate={(view) => { handleNavigate(view); setIsNotificationsOpen(false); }}
              />
            </div>
            <div className="hidden lg:block h-6 w-px bg-border" />
            <DropdownMenu>
              <DropdownMenuTrigger
                className="flex items-center gap-2.5 outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-sm p-0.5 hover:bg-muted/50 transition-colors"
                aria-label="Account menu"
              >
                <div className="hidden lg:flex flex-col items-end">
                  <span className="text-sm font-semibold text-foreground leading-tight">{currentUser.name}</span>
                  <span className="text-xs text-muted-foreground capitalize">{currentUser.role}</span>
                </div>
                <div className="w-8 h-8 rounded-sm bg-muted border border-border flex items-center justify-center shrink-0 overflow-hidden">
                  <img src={imgAvatar} alt={currentUser.name} className="w-full h-full object-cover" />
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-muted-foreground hidden lg:block" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-52">
                <div className="px-2 py-1.5">
                  <p className="text-sm font-semibold text-foreground truncate">{currentUser.name}</p>
                  <p className="text-xs text-muted-foreground truncate">{currentUser.email}</p>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem onSelect={() => handleNavigate("settings")}>
                  <Settings className="w-3.5 h-3.5" /> Account settings
                </DropdownMenuItem>
                <DropdownMenuItem onSelect={() => handleNavigate("team")}>
                  <UserCheck className="w-3.5 h-3.5" /> Users
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem variant="destructive" onSelect={() => setIsLogoutConfirmOpen(true)}>
                  <LogOut className="w-3.5 h-3.5" /> Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto custom-scrollbar">
          <AnimatePresence mode="wait">
            {currentView === "dashboard" && (
              <motion.div key="dashboard" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }}>
                {/* Dashboard tab switcher — each tab is a separate dashboard view */}
                <div className="px-6 pt-6">
                  <div
                    role="tablist"
                    aria-label="Dashboard views"
                    className="inline-flex items-center gap-1 bg-muted/60 border border-border rounded-full p-1"
                  >
                    {([
                      ["main",         "Main Dashboard",          LayoutDashboard],
                      ["discipleship", "Discipleship Dashboard",  Users],
                      ["collective",   "VITAL Dashboard", Activity],
                    ] as const).map(([k, label, Icon]) => {
                      const isActive = dashboardTab === k;
                      return (
                        <button
                          key={k}
                          role="tab"
                          aria-selected={isActive}
                          onClick={() => setDashboardTab(k)}
                          className={cn(
                            "flex items-center gap-2 px-4 py-1.5 text-sm font-semibold rounded-full transition-all",
                            isActive
                              ? "bg-primary text-primary-foreground shadow-sm"
                              : "text-muted-foreground hover:text-foreground"
                          )}
                        >
                          <Icon className="w-3.5 h-3.5" />
                          <span>{label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {dashboardTab === "main" && (
                  <MainDashboardView onNavigate={handleNavigate} />
                )}
                {dashboardTab === "discipleship" && (
                  <DiscipleshipDashboardView onNavigate={handleNavigate} />
                )}
                {dashboardTab === "collective" && (
                  <VitalDashboardView onNavigate={handleNavigate} />
                )}
              </motion.div>
            )}
            {currentView === "messages" && (
              <motion.div key="messages" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }} className="h-full">
                <MessagesView 
                  contacts={contacts}
                  messages={messages}
                  broadcasts={broadcasts}
                  groups={groups}
                  notes={notes}
                  users={users}
                  templates={INITIAL_TEMPLATES}
                  onSendMessage={handleSendMessage}
                  onCreateBroadcast={handleCreateBroadcast}
                  currentUser={currentUser}
                />
              </motion.div>
            )}
            {currentView === "conversations" && (
              <motion.div key="conversations" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }} className="h-full">
                <ConversationView
                  contacts={contacts}
                  messages={messages}
                  notes={notes}
                  users={users}
                  currentUser={currentUser}
                  onSendMessage={handleSendMessage}
                  conversationRules={conversationRules}
                  chatEndpoints={chatEndpoints}
                  groups={groups}
                  teamGroups={teamGroups}
                  viewMode={viewMode}
                  onAddRule={(data) => {
                    const newRule: ConversationRule = {
                      ...data as any,
                      id: `rule-${Date.now()}`,
                      tenantId: activeTenant.id,
                      createdAt: new Date().toISOString(),
                    };
                    setConversationRules(prev => [...prev, newRule]);
                  }}
                  onUpdateRule={(id, data) => {
                    setConversationRules(prev => prev.map(r => r.id === id ? { ...r, ...data } : r));
                  }}
                  onDeleteRule={(id) => {
                    setConversationRules(prev => prev.filter(r => r.id !== id));
                  }}
                  onReorderRules={(rules) => {
                    setConversationRules(rules);
                  }}
                />
              </motion.div>
            )}
            {currentView === "contacts" && (
              <motion.div key="contacts" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }}>
                <ContactsView 
                  contacts={contacts}
                  groups={groups}
                  usage={activeTenant.stats.contacts}
                  limit={PLAN_LIMITS[activeTenant.plan].maxContacts}
                  currentUserRole={currentUser.role}
                  onAddContact={handleAddContact}
                  onImportContacts={() => toast.info("Importing contacts...")}
                  onExportContacts={() => toast.info("Exporting contacts...")}
                  onDeleteContact={(id) => setContacts(prev => prev.filter(c => c.id !== id))}
                  onEditContact={(c) => { setSelectedContact(c); setIsDetailModalOpen(true); }}
                  onMessage={(id) => { handleNavigate("messages"); /* Logic to set active conversation would go here */ }}
                  onViewContact={(c) => { setSelectedContact(c); setIsDetailModalOpen(true); }}
                  onUpgradePlan={() => handleNavigate("settings")}
                />
              </motion.div>
            )}
            {currentView === "settings" && (
              <motion.div key="settings" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }}>
                <SettingsView 
                  tenant={activeTenant} 
                  user={currentUser}
                  onUpgrade={(plan) => setActiveTenant(prev => ({ ...prev, plan }))} 
                  onUpdateTenant={(data) => setActiveTenant(prev => ({ ...prev, ...data }))}
                  onUpdateUser={(data) => setCurrentUser(prev => ({ ...prev, ...data }))}
                />
              </motion.div>
            )}
            {currentView === "team" && (
              <motion.div key="team" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }}>
                <TeamManagement 
                  users={users}
                  teamGroups={teamGroups}
                  currentUserRole={currentUser.role}
                  auditLog={INITIAL_AUDIT_LOG}
                  onAddUser={(userData) => {
                    const newUser: User = {
                      id: `user-${Date.now()}`,
                      tenantId: activeTenant.id,
                      status: "pending",
                      ...userData as any
                    };
                    setUsers(prev => [...prev, newUser]);
                  }}
                  onUpdateUser={(id, data) => {
                    setUsers(prev => prev.map(u => u.id === id ? { ...u, ...data } : u));
                  }}
                  onDeleteUser={(id) => {
                    setUsers(prev => prev.filter(u => u.id !== id));
                  }}
                  onAddTeamGroup={(groupData) => {
                    const newGroup: TeamGroup = {
                      id: `tg-${Date.now()}`,
                      tenantId: activeTenant.id,
                      createdAt: new Date().toISOString(),
                      ...groupData as any
                    };
                    setTeamGroups(prev => [...prev, newGroup]);
                  }}
                  onUpdateTeamGroup={(id, data) => {
                    setTeamGroups(prev => prev.map(g => g.id === id ? { ...g, ...data } : g));
                  }}
                  onDeleteTeamGroup={(id) => {
                    setTeamGroups(prev => prev.filter(g => g.id !== id));
                  }}
                />
              </motion.div>
            )}
            {currentView === "channels" && (
              <motion.div key="channels" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }}>
                <ChannelsView 
                  channels={channels}
                  onAddChannel={(channelData) => {
                    const newChannel: DeliveryChannel = {
                      ...channelData as any,
                      id: `ch-${Date.now()}`,
                      createdAt: new Date().toISOString(),
                      stats: { sent: 0, delivered: 0, failed: 0 },
                    };
                    setChannels(prev => [newChannel, ...prev]);
                  }}
                  onUpdateChannel={(id, data) => {
                    setChannels(prev => prev.map(c => c.id === id ? { ...c, ...data } : c));
                  }}
                  onDeleteChannel={(id) => {
                    setChannels(prev => prev.filter(c => c.id !== id));
                  }}
                  onToggleChannel={(id) => {
                    setChannels(prev => prev.map(c => c.id === id ? { ...c, enabled: !c.enabled } : c));
                    toast.success("Channel updated");
                  }}
                  chatEndpoints={chatEndpoints}
                  conversationRules={conversationRules}
                  users={users}
                  teamGroups={teamGroups}
                  groups={groups}
                  contacts={contacts}
                  onAddEndpoint={(data) => {
                    const newEp: ChatEndpoint = {
                      ...data as any,
                      id: `ep-${Date.now()}`,
                      tenantId: activeTenant.id,
                      publicKey: `pk_live_${Math.random().toString(36).slice(2, 18)}`,
                      createdAt: new Date().toISOString(),
                    };
                    setChatEndpoints(prev => [newEp, ...prev]);
                  }}
                  onUpdateEndpoint={(id, data) => {
                    setChatEndpoints(prev => prev.map(ep => ep.id === id ? { ...ep, ...data } : ep));
                  }}
                  onDeleteEndpoint={(id) => {
                    setChatEndpoints(prev => prev.filter(ep => ep.id !== id));
                  }}
                  onAddRule={(data) => {
                    const newRule: ConversationRule = {
                      ...data as any,
                      id: `rule-${Date.now()}`,
                      tenantId: activeTenant.id,
                      createdAt: new Date().toISOString(),
                    };
                    setConversationRules(prev => [...prev, newRule]);
                  }}
                  onUpdateRule={(id, data) => {
                    setConversationRules(prev => prev.map(r => r.id === id ? { ...r, ...data } : r));
                  }}
                  onDeleteRule={(id) => {
                    setConversationRules(prev => prev.filter(r => r.id !== id));
                  }}
                  onReorderRules={(rules) => {
                    setConversationRules(rules);
                  }}
                />
              </motion.div>
            )}
            {currentView === "seekers" && (
              <motion.div key="seekers" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }}>
                <SeekersView canCreate={viewMode === "super_admin" || viewMode === "admin"} />
              </motion.div>
            )}
            {currentView === "mentors" && (
              <motion.div key="mentors" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }}>
                <MentorsView canCreate={viewMode === "super_admin" || viewMode === "admin"} />
              </motion.div>
            )}
            {currentView === "matches" && (
              <motion.div key="matches" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }}>
                <MatchesView />
              </motion.div>
            )}
            {currentView === "faith_journeys" && (
              <motion.div key="faith_journeys" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }}>
                <FaithJourneysView />
              </motion.div>
            )}
            {currentView === "milestones" && (
              <motion.div key="milestones" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }}>
                <MilestonesView />
              </motion.div>
            )}
            {currentView === "content_library" && (
              <motion.div key="content_library" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }}>
                <ContentLibraryView canEdit={viewMode === "super_admin" || viewMode === "admin" || viewMode === "content_creator"} />
              </motion.div>
            )}
            {currentView === "growth_metrics" && (
              <motion.div key="growth_metrics" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }}>
                <GrowthMetricsView />
              </motion.div>
            )}
            {currentView === "vital_analytics" && (
              <motion.div key="vital_analytics" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }}>
                <VitalAnalyticsView />
              </motion.div>
            )}
            {currentView === "reporting" && (
              <motion.div key="reporting" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }}>
                <ReportingView />
              </motion.div>
            )}
            {currentView === "validations" && (
              <motion.div key="validations" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }}>
                <ValidationsView />
              </motion.div>
            )}
            {currentView === "automations" && (
              <motion.div key="automations" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }}>
                <AutomationView 
                  automations={automations}
                  webhooks={webhooks}
                  onAddAutomation={(data) => {
                    const newRule: AutomationRule = {
                      ...data as any,
                      id: `auto-${Date.now()}`,
                      createdAt: new Date().toISOString(),
                      triggerCount: 0,
                      enabled: false,
                    };
                    setAutomations(prev => [...prev, newRule]);
                  }}
                  onToggleAutomation={(id) => {
                    setAutomations(prev => prev.map(a => a.id === id ? { ...a, enabled: !a.enabled } : a));
                    toast.success("Automation updated");
                  }}
                  onDeleteAutomation={(id) => {
                    setAutomations(prev => prev.filter(a => a.id !== id));
                    toast.success("Automation deleted");
                  }}
                  onUpdateAutomation={(id, data) => {
                    setAutomations(prev => prev.map(a => a.id === id ? { ...a, ...data } : a));
                  }}
                  onAddWebhook={(data) => {
                    const newWh: WebhookType = {
                      ...data as any,
                      id: `wh-${Date.now()}`,
                      createdAt: new Date().toISOString(),
                      failureCount: 0,
                      enabled: false,
                    };
                    setWebhooks(prev => [...prev, newWh]);
                  }}
                  onToggleWebhook={(id) => {
                    setWebhooks(prev => prev.map(w => w.id === id ? { ...w, enabled: !w.enabled } : w));
                    toast.success("Webhook updated");
                  }}
                  onDeleteWebhook={(id) => {
                    setWebhooks(prev => prev.filter(w => w.id !== id));
                    toast.success("Webhook deleted");
                  }}
                  onUpdateWebhook={(id, data) => {
                    setWebhooks(prev => prev.map(w => w.id === id ? { ...w, ...data } : w));
                  }}
                />
              </motion.div>
            )}

          </AnimatePresence>
        </div>
      </main>

      {/* New Message Flow Modal */}
      <Modal 
        isOpen={isNewMessageFlowOpen} 
        onClose={() => setIsNewMessageFlowOpen(false)} 
        title="New Message"
        size="3xl"
      >
        <NewMessageFlow 
          contacts={contacts}
          groups={groups}
          templates={INITIAL_TEMPLATES}
          onClose={() => setIsNewMessageFlowOpen(false)}
        />
      </Modal>

      {selectedContact && (
        <ContactDetailModal 
          isOpen={isDetailModalOpen}
          onClose={() => setIsDetailModalOpen(false)}
          contact={selectedContact}
          messages={messages.filter(m => m.contactId === selectedContact.id)}
          notes={notes.filter(n => n.contactId === selectedContact.id)}
          groups={groups}
          onAddNote={(content) => {
            const newNote: ContactNote = { id: `note-${Date.now()}`, contactId: selectedContact.id, authorId: currentUser.id, content, createdAt: new Date().toISOString() };
            setNotes(prev => [newNote, ...prev]);
          }}
          onDeleteNote={(id) => setNotes(prev => prev.filter(n => n.id !== id))}
        />
      )}

      {/* Add Contact Modal */}
      <Modal isOpen={isAddContactOpen} onClose={() => setIsAddContactOpen(false)} title="Add Contact" size="sm">
        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-xs font-semibold text-foreground">Full Name <span className="text-destructive">*</span></label>
            <input
              value={newContactForm.name}
              onChange={(e) => setNewContactForm(prev => ({ ...prev, name: e.target.value }))}
              placeholder="Jane Smith"
              className="w-full px-3 py-2.5 bg-muted/30 border border-input rounded-md text-sm focus:ring-1 focus:ring-ring outline-none"
              autoFocus
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-semibold text-foreground">Phone Number <span className="text-destructive">*</span></label>
            <input
              value={newContactForm.phone}
              onChange={(e) => setNewContactForm(prev => ({ ...prev, phone: e.target.value }))}
              placeholder="+1 (555) 000-0000"
              className="w-full px-3 py-2.5 bg-muted/30 border border-input rounded-md text-sm focus:ring-1 focus:ring-ring outline-none"
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-semibold text-foreground">Email <span className="text-muted-foreground font-normal">(optional)</span></label>
            <input
              value={newContactForm.email}
              onChange={(e) => setNewContactForm(prev => ({ ...prev, email: e.target.value }))}
              placeholder="jane@example.com"
              type="email"
              className="w-full px-3 py-2.5 bg-muted/30 border border-input rounded-md text-sm focus:ring-1 focus:ring-ring outline-none"
            />
          </div>
          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              onClick={() => setIsAddContactOpen(false)}
              className="px-4 py-2 text-sm font-semibold text-muted-foreground hover:text-foreground hover:bg-muted rounded-md transition-all"
            >
              Cancel
            </button>
            <button
              onClick={handleSaveNewContact}
              disabled={!newContactForm.name.trim() || !newContactForm.phone.trim()}
              className={cn(
                "px-4 py-2 text-sm font-bold rounded-md transition-all shadow-sm",
                newContactForm.name.trim() && newContactForm.phone.trim()
                  ? "bg-primary text-primary-foreground hover:bg-primary/90"
                  : "bg-muted text-muted-foreground cursor-not-allowed"
              )}
            >
              <span className="flex items-center gap-1.5">
                <UserPlus className="w-3.5 h-3.5" />
                Add Contact
              </span>
            </button>
          </div>
        </div>
      </Modal>

      {/* Sign Out Confirmation Modal */}
      <Modal isOpen={isLogoutConfirmOpen} onClose={() => setIsLogoutConfirmOpen(false)} title="Sign Out" size="sm">
        <div className="space-y-5">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 bg-muted rounded-lg border border-border flex items-center justify-center shrink-0">
              <LogOut className="w-5 h-5 text-muted-foreground" />
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">Are you sure you want to sign out?</p>
              <p className="text-xs text-muted-foreground mt-1">
                You'll be returned to the welcome screen. Any unsaved changes will be lost.
              </p>
            </div>
          </div>
          <div className="flex items-center justify-end gap-2">
            <button
              onClick={() => setIsLogoutConfirmOpen(false)}
              className="px-4 py-2 text-sm font-semibold text-muted-foreground hover:text-foreground hover:bg-muted rounded-md transition-all"
            >
              Cancel
            </button>
            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 px-4 py-2 text-sm font-bold bg-destructive text-white rounded-md hover:bg-destructive/90 transition-all shadow-sm"
            >
              <LogOut className="w-3.5 h-3.5" />
              Sign Out
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}