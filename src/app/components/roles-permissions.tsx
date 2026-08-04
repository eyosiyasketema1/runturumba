import React, { useEffect, useMemo, useState } from "react";
import {
  Plus, Lock, MoreVertical, ChevronDown, ArrowLeft, Info, AlertTriangle,
  Trash2, Copy, Eye, Pencil, UserPlus, Users, X, Shield, Layers,
  ShieldAlert, Zap,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { toast } from "sonner";
import { cn } from "./types";
import { Card, CardContent } from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Separator } from "./ui/separator";
import { Switch } from "./ui/switch";
import { Badge } from "./ui/badge";
import { Textarea } from "./ui/textarea";
import { Avatar, AvatarFallback } from "./ui/avatar";

// ============================================================================
// Types
// ============================================================================

interface PermissionState {
  conversationHandling: Record<string, boolean>;
  moderationLifecycle: Record<string, boolean>;
  modalitiesSensitive: Record<string, boolean>;
  contentAutomation: Record<string, boolean>;
  coachingOps: Record<string, boolean>;
  administration: Record<string, boolean>;
  viewDataScope: Record<string, boolean>;
  featureToggles: Record<string, boolean>;
}

type PermGroupKey = keyof PermissionState;

interface UserTypeRecord {
  id: string;
  name: string;
  label: string;
  description: string;
}

interface RoleRecord {
  id: string;
  name: string;
  description: string;
  userTypeId: string;
  isSystem: boolean;
  memberCount: number;
  permissions: PermissionState;
}

interface Member {
  id: string;
  name: string;
  email: string;
  roleId: string;
}

type Screen = "list" | "builder" | "view";
type BuilderMode = "create" | "edit";

// ============================================================================
// Permission catalog — derived from Turumba Roles & Permissions Brainstorm
// ============================================================================

const CONVERSATION_HANDLING_PERMS: { id: string; label: string }[] = [
  { id: "chat.view_queue", label: "View chat queue" },
  { id: "chat.claim", label: "Claim a chat" },
  { id: "chat.reply", label: "Reply to chats" },
  { id: "chat.preview_toggle", label: "Toggle chat preview" },
  { id: "chat.return_to_queue", label: "Return chat to queue" },
  { id: "chat.merge", label: "Merge conversations" },
  { id: "chat.edit_sent", label: "Edit sent messages" },
  { id: "chat.mark_test", label: "Mark as test conversation" },
];

const MODERATION_LIFECYCLE_PERMS: { id: string; label: string }[] = [
  { id: "chat.transfer", label: "Transfer conversations" },
  { id: "chat.escalate", label: "Escalate conversations" },
  { id: "chat.mark_spam", label: "Mark as spam" },
  { id: "chat.block_seeker", label: "Block a seeker" },
  { id: "chat.alert_admin", label: "Alert admin" },
  { id: "chat.emergency_alert", label: "Emergency alert" },
  { id: "chat.log_church_connection", label: "Log church connection" },
  { id: "chat.report_bug", label: "Report a bug" },
];

const MODALITIES_SENSITIVE_PERMS: { id: string; label: string }[] = [
  { id: "msg.send_audio_video", label: "Send audio/video messages" },
  { id: "video.respond_asl", label: "Respond via ASL video" },
  { id: "msg.view_recorded_video", label: "View recorded video" },
];

const CONTENT_AUTOMATION_PERMS: { id: string; label: string }[] = [
  { id: "template.create", label: "Create message templates" },
  { id: "kb.author", label: "Author knowledge base" },
  { id: "newsfeed.publish", label: "Publish to newsfeed" },
  { id: "rules.author", label: "Author IF/THEN rules" },
  { id: "keywords.manage", label: "Manage keywords" },
  { id: "social.moderate_crud", label: "Moderate social content" },
  { id: "autoresponse.configure", label: "Configure auto-responses" },
];

const COACHING_OPS_PERMS: { id: string; label: string }[] = [
  { id: "feedback.write", label: "Write feedback notes" },
  { id: "team.view_load", label: "View team load" },
  { id: "team.drill_chats", label: "Drill into team chats" },
  { id: "review.queue_manage", label: "Manage review queue" },
  { id: "users.assign_region_topic", label: "Assign users to region/topic" },
  { id: "features.toggle_team", label: "Toggle team features" },
  { id: "platform.connect", label: "Connect platforms" },
  { id: "campaign.link_ads", label: "Link ad campaigns" },
  { id: "campaign.merge_drip", label: "Merge drip campaigns" },
];

const ADMINISTRATION_PERMS: { id: string; label: string }[] = [
  { id: "roles.define", label: "Define & edit roles" },
  { id: "roles.assign_user", label: "Assign roles to users" },
  { id: "usertype.manage", label: "Manage user types" },
  { id: "policy.configure", label: "Configure policies" },
];

const VIEW_DATA_PERMS: { id: string; label: string }[] = [
  { id: "view.own_chats", label: "View own chats" },
  { id: "view.team_chats", label: "View team chats" },
  { id: "view.language_chats", label: "View language chats" },
  { id: "view.region_chats", label: "View region chats" },
  { id: "view.all_chats", label: "View all chats" },
  { id: "view.seeker_pii", label: "View seeker PII" },
  { id: "view.feedback_notes", label: "View feedback notes" },
  { id: "view.analytics_team", label: "View team analytics" },
  { id: "view.analytics_global", label: "View global analytics" },
  { id: "audit.read", label: "Read audit log" },
  { id: "export.reports", label: "Export reports" },
];

const FEATURE_TOGGLE_PERMS: { id: string; label: string }[] = [
  { id: "toggle.block", label: "Block" },
  { id: "toggle.audio_video", label: "Audio / Video" },
  { id: "toggle.transfer", label: "Transfer" },
  { id: "toggle.spam", label: "Spam" },
  { id: "toggle.alerts", label: "Alerts" },
  { id: "toggle.merge", label: "Merge" },
];

const PERMISSION_GROUP_META: {
  key: PermGroupKey;
  title: string;
  category: string;
  sensitive?: boolean;
  perms: { id: string; label: string }[];
}[] = [
  { key: "conversationHandling", title: "Conversation Handling", category: "Action", perms: CONVERSATION_HANDLING_PERMS },
  { key: "moderationLifecycle", title: "Moderation & Lifecycle", category: "Action", perms: MODERATION_LIFECYCLE_PERMS },
  { key: "modalitiesSensitive", title: "Modalities — Sensitive", category: "Action", sensitive: true, perms: MODALITIES_SENSITIVE_PERMS },
  { key: "contentAutomation", title: "Content & Automation", category: "Action", perms: CONTENT_AUTOMATION_PERMS },
  { key: "coachingOps", title: "Coaching & Ops", category: "Action", perms: COACHING_OPS_PERMS },
  { key: "administration", title: "Administration", category: "Action", perms: ADMINISTRATION_PERMS },
  { key: "viewDataScope", title: "View / Data Scope", category: "View", perms: VIEW_DATA_PERMS },
  { key: "featureToggles", title: "Feature Toggles", category: "Feature", perms: FEATURE_TOGGLE_PERMS },
];

// ============================================================================
// Permission state builders
// ============================================================================

function emptyPermissions(): PermissionState {
  return {
    conversationHandling: Object.fromEntries(CONVERSATION_HANDLING_PERMS.map((p) => [p.id, false])),
    moderationLifecycle: Object.fromEntries(MODERATION_LIFECYCLE_PERMS.map((p) => [p.id, false])),
    modalitiesSensitive: Object.fromEntries(MODALITIES_SENSITIVE_PERMS.map((p) => [p.id, false])),
    contentAutomation: Object.fromEntries(CONTENT_AUTOMATION_PERMS.map((p) => [p.id, false])),
    coachingOps: Object.fromEntries(COACHING_OPS_PERMS.map((p) => [p.id, false])),
    administration: Object.fromEntries(ADMINISTRATION_PERMS.map((p) => [p.id, false])),
    viewDataScope: Object.fromEntries(VIEW_DATA_PERMS.map((p) => [p.id, false])),
    featureToggles: Object.fromEntries(FEATURE_TOGGLE_PERMS.map((p) => [p.id, false])),
  };
}

function setKeys(perms: PermissionState, changes: Partial<Record<PermGroupKey, string[]>>): PermissionState {
  const next = clonePermissions(perms);
  for (const key of Object.keys(changes) as PermGroupKey[]) {
    changes[key]?.forEach((id) => {
      if (id in next[key]) next[key][id] = true;
    });
  }
  return next;
}

function clonePermissions(p: PermissionState): PermissionState {
  return {
    conversationHandling: { ...p.conversationHandling },
    moderationLifecycle: { ...p.moderationLifecycle },
    modalitiesSensitive: { ...p.modalitiesSensitive },
    contentAutomation: { ...p.contentAutomation },
    coachingOps: { ...p.coachingOps },
    administration: { ...p.administration },
    viewDataScope: { ...p.viewDataScope },
    featureToggles: { ...p.featureToggles },
  };
}

function allOnPermissions(): PermissionState {
  const base = emptyPermissions();
  const all: Partial<Record<PermGroupKey, string[]>> = {};
  for (const group of PERMISSION_GROUP_META) {
    all[group.key] = group.perms.map((p) => p.id);
  }
  return setKeys(base, all);
}

function countGroup(obj: Record<string, boolean>): number {
  return Object.values(obj).filter(Boolean).length;
}

function totalEnabled(p: PermissionState): number {
  return PERMISSION_GROUP_META.reduce((sum, g) => sum + countGroup(p[g.key]), 0);
}

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  return ((parts[0]?.[0] ?? "") + (parts[1]?.[0] ?? "")).toUpperCase();
}

function generateId(prefix: string): string {
  return `${prefix}-${Date.now().toString(36)}-${Math.floor(Math.random() * 10000)}`;
}

// ============================================================================
// User Types — the broadest category of a person in the system
// ============================================================================

const USER_TYPES: UserTypeRecord[] = [
  {
    id: "ut-volunteer",
    name: "Volunteer",
    label: "front line",
    description: "Chat associates who handle live seeker conversations",
  },
  {
    id: "ut-volunteer-mgr",
    name: "Volunteer Manager",
    label: "coaching",
    description: "Team leads and coaches who oversee volunteer performance",
  },
  {
    id: "ut-language-mgr",
    name: "Language Ministry Manager",
    label: "language lead",
    description: "Content, rules, and feature access scoped to one language",
  },
  {
    id: "ut-social-media-mgr",
    name: "Social Media Manager",
    label: "campaigns",
    description: "Campaign managers and community moderators across platforms",
  },
  {
    id: "ut-executive",
    name: "Executive",
    label: "leadership",
    description: "Read-only executive dashboards, reporting, and campaign oversight",
  },
  {
    id: "ut-global-ops",
    name: "Global Ops Manager",
    label: "governance",
    description: "Define roles & permissions, assign users, platform admin, audit",
  },
  {
    id: "ut-trainer",
    name: "Trainer",
    label: "enablement",
    description: "Create practice chats, track trainee progress, author training KB",
  },
];

// ============================================================================
// Example role permission presets
// ============================================================================

const STANDARD_VOLUNTEER_PERMS = setKeys(emptyPermissions(), {
  conversationHandling: ["chat.view_queue", "chat.claim", "chat.reply", "chat.return_to_queue"],
  viewDataScope: ["view.own_chats"],
});

const SENIOR_VOLUNTEER_PERMS = setKeys(emptyPermissions(), {
  conversationHandling: ["chat.view_queue", "chat.claim", "chat.reply", "chat.return_to_queue", "chat.merge", "chat.edit_sent"],
  moderationLifecycle: ["chat.transfer", "chat.escalate", "chat.report_bug"],
  viewDataScope: ["view.own_chats", "view.team_chats"],
});

const ASL_VOLUNTEER_PERMS = setKeys(emptyPermissions(), {
  conversationHandling: ["chat.view_queue", "chat.claim", "chat.reply", "chat.return_to_queue"],
  modalitiesSensitive: ["video.respond_asl", "msg.view_recorded_video"],
  viewDataScope: ["view.own_chats"],
});

const TEAM_LEAD_PERMS = setKeys(emptyPermissions(), {
  conversationHandling: ["chat.view_queue"],
  coachingOps: ["feedback.write", "team.view_load", "team.drill_chats", "review.queue_manage"],
  viewDataScope: ["view.team_chats", "view.feedback_notes", "view.analytics_team"],
});

const LANGUAGE_LEAD_PERMS = setKeys(emptyPermissions(), {
  contentAutomation: ["template.create", "kb.author", "newsfeed.publish", "rules.author", "keywords.manage", "social.moderate_crud", "autoresponse.configure"],
  coachingOps: ["features.toggle_team", "feedback.write"],
  viewDataScope: ["view.language_chats", "view.feedback_notes", "view.analytics_team"],
  featureToggles: ["toggle.block", "toggle.audio_video", "toggle.transfer", "toggle.spam", "toggle.alerts", "toggle.merge"],
});

const CAMPAIGN_MANAGER_PERMS = setKeys(emptyPermissions(), {
  contentAutomation: ["social.moderate_crud"],
  coachingOps: ["campaign.link_ads", "campaign.merge_drip"],
  viewDataScope: ["view.analytics_team"],
});

const IE_EXECUTIVE_PERMS = setKeys(emptyPermissions(), {
  viewDataScope: ["view.all_chats", "view.analytics_global", "view.analytics_team", "audit.read", "export.reports"],
});

const GLOBAL_OPS_PERMS = setKeys(emptyPermissions(), {
  administration: ["roles.define", "roles.assign_user", "usertype.manage", "policy.configure"],
  coachingOps: ["users.assign_region_topic", "features.toggle_team", "platform.connect"],
  viewDataScope: ["view.all_chats", "view.analytics_global", "view.analytics_team", "view.feedback_notes", "audit.read", "export.reports"],
  featureToggles: ["toggle.block", "toggle.audio_video", "toggle.transfer", "toggle.spam", "toggle.alerts", "toggle.merge"],
});

const COMPLIANCE_OFFICER_PERMS = setKeys(emptyPermissions(), {
  viewDataScope: ["view.all_chats", "view.analytics_global", "audit.read", "export.reports"],
});

const LEAD_TRAINER_PERMS = setKeys(emptyPermissions(), {
  conversationHandling: ["chat.mark_test"],
  contentAutomation: ["template.create", "kb.author"],
  viewDataScope: ["view.team_chats", "view.feedback_notes", "view.analytics_team"],
});

const ASSISTANT_TRAINER_PERMS = setKeys(emptyPermissions(), {
  conversationHandling: ["chat.mark_test"],
  viewDataScope: ["view.team_chats", "view.feedback_notes"],
});

const CRISIS_TRAINED_PERMS = setKeys(emptyPermissions(), {
  conversationHandling: ["chat.view_queue", "chat.claim", "chat.reply", "chat.return_to_queue"],
  moderationLifecycle: ["chat.emergency_alert", "chat.escalate", "chat.alert_admin"],
  viewDataScope: ["view.own_chats"],
});

const TRAINEE_PERMS = setKeys(emptyPermissions(), {
  conversationHandling: ["chat.view_queue", "chat.claim", "chat.reply", "chat.mark_test"],
  viewDataScope: ["view.own_chats"],
});

const SENIOR_COACH_PERMS = setKeys(emptyPermissions(), {
  conversationHandling: ["chat.view_queue"],
  coachingOps: ["feedback.write", "team.view_load", "team.drill_chats", "review.queue_manage", "users.assign_region_topic"],
  viewDataScope: ["view.team_chats", "view.region_chats", "view.feedback_notes", "view.analytics_team"],
});

const CONTENT_EDITOR_PERMS = setKeys(emptyPermissions(), {
  contentAutomation: ["template.create", "kb.author", "newsfeed.publish", "keywords.manage"],
  viewDataScope: ["view.language_chats", "view.feedback_notes"],
});

const COMMUNITY_MODERATOR_PERMS = setKeys(emptyPermissions(), {
  contentAutomation: ["social.moderate_crud"],
  viewDataScope: ["view.analytics_team"],
});

const BOARD_VIEWER_PERMS = setKeys(emptyPermissions(), {
  viewDataScope: ["view.all_chats", "view.analytics_global", "export.reports"],
});

const PLATFORM_ADMIN_PERMS = setKeys(emptyPermissions(), {
  administration: ["roles.define", "roles.assign_user", "policy.configure"],
  coachingOps: ["platform.connect", "features.toggle_team"],
  viewDataScope: ["view.all_chats", "view.analytics_global", "view.analytics_team", "audit.read", "export.reports"],
  featureToggles: ["toggle.block", "toggle.audio_video", "toggle.transfer", "toggle.spam", "toggle.alerts", "toggle.merge"],
});

// ============================================================================
// Initial data
// ============================================================================

const INITIAL_ROLES: RoleRecord[] = [
  // ── Volunteer (front line) ─────────────────────────────────────────────
  {
    id: "role-std-volunteer",
    name: "Standard Volunteer",
    description: "Claim chat, reply, use templates & scripture library — the baseline volunteer role",
    userTypeId: "ut-volunteer",
    isSystem: true,
    memberCount: 24,
    permissions: STANDARD_VOLUNTEER_PERMS,
  },
  {
    id: "role-sr-volunteer",
    name: "Senior Volunteer",
    description: "Expanded access — transfer, merge, escalate conversations",
    userTypeId: "ut-volunteer",
    isSystem: false,
    memberCount: 8,
    permissions: SENIOR_VOLUNTEER_PERMS,
  },
  {
    id: "role-asl-volunteer",
    name: "ASL Volunteer",
    description: "Respond via ASL video with recorded-video access (sensitive)",
    userTypeId: "ut-volunteer",
    isSystem: false,
    memberCount: 3,
    permissions: ASL_VOLUNTEER_PERMS,
  },
  {
    id: "role-crisis-trained",
    name: "Crisis-Trained",
    description: "Emergency alert access for crisis-level conversations",
    userTypeId: "ut-volunteer",
    isSystem: false,
    memberCount: 5,
    permissions: CRISIS_TRAINED_PERMS,
  },
  {
    id: "role-trainee",
    name: "Trainee",
    description: "Practice-only — test chats only, excluded from live stats",
    userTypeId: "ut-volunteer",
    isSystem: false,
    memberCount: 6,
    permissions: TRAINEE_PERMS,
  },

  // ── Volunteer Manager (coaching) ───────────────────────────────────────
  {
    id: "role-team-lead",
    name: "Team Lead",
    description: "View team load, drill into chats, write feedback, manage review queue",
    userTypeId: "ut-volunteer-mgr",
    isSystem: true,
    memberCount: 4,
    permissions: TEAM_LEAD_PERMS,
  },
  {
    id: "role-senior-coach",
    name: "Senior Coach",
    description: "Regional scope — assign users to region/topic, broader view access",
    userTypeId: "ut-volunteer-mgr",
    isSystem: false,
    memberCount: 2,
    permissions: SENIOR_COACH_PERMS,
  },

  // ── Language Ministry Manager (language lead) ──────────────────────────
  {
    id: "role-language-lead",
    name: "Language Lead",
    description: "Full content & rules authoring scoped to one language, team feature toggles",
    userTypeId: "ut-language-mgr",
    isSystem: true,
    memberCount: 6,
    permissions: LANGUAGE_LEAD_PERMS,
  },
  {
    id: "role-content-editor",
    name: "Content Editor",
    description: "Create templates, author KB & newsfeed, manage keywords — no rules authoring",
    userTypeId: "ut-language-mgr",
    isSystem: false,
    memberCount: 3,
    permissions: CONTENT_EDITOR_PERMS,
  },

  // ── Social Media Manager (campaigns) ───────────────────────────────────
  {
    id: "role-campaign-mgr",
    name: "Campaign Manager",
    description: "Link ads, manage drip campaigns, moderate social content",
    userTypeId: "ut-social-media-mgr",
    isSystem: true,
    memberCount: 2,
    permissions: CAMPAIGN_MANAGER_PERMS,
  },
  {
    id: "role-community-mod",
    name: "Community Moderator",
    description: "Moderate social content only — comment CRUD, no campaign access",
    userTypeId: "ut-social-media-mgr",
    isSystem: false,
    memberCount: 4,
    permissions: COMMUNITY_MODERATOR_PERMS,
  },

  // ── Executive (leadership) ─────────────────────────────────────────────
  {
    id: "role-ie-executive",
    name: "IE Executive",
    description: "Executive dashboard, cross-platform & campaign reporting, export to Excel",
    userTypeId: "ut-executive",
    isSystem: true,
    memberCount: 2,
    permissions: IE_EXECUTIVE_PERMS,
  },
  {
    id: "role-board-viewer",
    name: "Board Viewer",
    description: "Read-only — view dashboards and export reports, no write access",
    userTypeId: "ut-executive",
    isSystem: false,
    memberCount: 3,
    permissions: BOARD_VIEWER_PERMS,
  },

  // ── Global Ops Manager (governance) ────────────────────────────────────
  {
    id: "role-global-ops",
    name: "Global Ops",
    description: "Define roles & permissions, assign users to region/topic, full platform admin",
    userTypeId: "ut-global-ops",
    isSystem: true,
    memberCount: 2,
    permissions: GLOBAL_OPS_PERMS,
  },
  {
    id: "role-compliance",
    name: "Compliance Officer",
    description: "Audit + retention review only — no role editing, view and export",
    userTypeId: "ut-global-ops",
    isSystem: false,
    memberCount: 1,
    permissions: COMPLIANCE_OFFICER_PERMS,
  },
  {
    id: "role-platform-admin",
    name: "Platform Admin",
    description: "Connect platforms, toggle features, define roles — operational admin without user type management",
    userTypeId: "ut-global-ops",
    isSystem: false,
    memberCount: 1,
    permissions: PLATFORM_ADMIN_PERMS,
  },

  // ── Trainer (enablement) ───────────────────────────────────────────────
  {
    id: "role-lead-trainer",
    name: "Lead Trainer",
    description: "Create practice chats, author training KB, view trainee stats, sign off promotions",
    userTypeId: "ut-trainer",
    isSystem: true,
    memberCount: 3,
    permissions: LEAD_TRAINER_PERMS,
  },
  {
    id: "role-asst-trainer",
    name: "Assistant Trainer",
    description: "Mark test conversations, view team feedback — no KB authoring",
    userTypeId: "ut-trainer",
    isSystem: false,
    memberCount: 2,
    permissions: ASSISTANT_TRAINER_PERMS,
  },
];

const INITIAL_MEMBERS: Member[] = [
  { id: "mem-1", name: "Eyosias Ketema", email: "eyosias@turumba.org", roleId: "role-global-ops" },
  { id: "mem-2", name: "Samson Usmael", email: "samson@turumba.org", roleId: "role-global-ops" },
  { id: "mem-3", name: "Sara Tadesse", email: "sara@turumba.org", roleId: "role-team-lead" },
  { id: "mem-4", name: "Daniel Hailu", email: "daniel@turumba.org", roleId: "role-language-lead" },
  { id: "mem-5", name: "Hanna Girma", email: "hanna@turumba.org", roleId: "role-sr-volunteer" },
  { id: "mem-6", name: "Yonas Tesfaye", email: "yonas@turumba.org", roleId: "role-std-volunteer" },
  { id: "mem-7", name: "Meron Alemu", email: "meron@turumba.org", roleId: "role-std-volunteer" },
  { id: "mem-8", name: "Abebe Bekele", email: "abebe@turumba.org", roleId: "role-lead-trainer" },
  { id: "mem-9", name: "Tigist Worku", email: "tigist@turumba.org", roleId: "role-ie-executive" },
  { id: "mem-10", name: "Dawit Mengistu", email: "dawit@turumba.org", roleId: "role-compliance" },
  { id: "mem-11", name: "Kidist Fikre", email: "kidist@turumba.org", roleId: "role-asl-volunteer" },
  { id: "mem-12", name: "Bereket Tadesse", email: "bereket@turumba.org", roleId: "role-crisis-trained" },
  { id: "mem-13", name: "Rahel Gizaw", email: "rahel@turumba.org", roleId: "role-campaign-mgr" },
  { id: "mem-14", name: "Solomon Desta", email: "solomon@turumba.org", roleId: "role-senior-coach" },
  { id: "mem-15", name: "Aster Negash", email: "aster@turumba.org", roleId: "role-content-editor" },
  { id: "mem-16", name: "Naomi Berhane", email: "naomi@turumba.org", roleId: "role-trainee" },
  { id: "mem-17", name: "Henok Tadesse", email: "henok@turumba.org", roleId: "role-platform-admin" },
  { id: "mem-18", name: "Mercy Alem", email: "mercy@turumba.org", roleId: "role-community-mod" },
];

// ============================================================================
// Small shared UI bits
// ============================================================================

function ModalShell({
  onClose,
  children,
  labelledBy,
  maxWidth = "max-w-lg",
}: {
  onClose: () => void;
  children: React.ReactNode;
  labelledBy: string;
  maxWidth?: string;
}) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
        aria-hidden="true"
      />
      <motion.div
        role="dialog"
        aria-modal="true"
        aria-labelledby={labelledBy}
        initial={{ opacity: 0, y: 12, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 12, scale: 0.98 }}
        transition={{ damping: 28, stiffness: 300 }}
        className={cn(
          "relative z-10 w-full bg-card rounded-sm border border-border overflow-hidden flex flex-col max-h-[90vh]",
          maxWidth
        )}
      >
        {children}
      </motion.div>
    </div>
  );
}

function PermissionToggleRow({
  label,
  checked,
  onChange,
  disabled,
  id,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
  disabled?: boolean;
  id: string;
}) {
  return (
    <div className="flex items-center justify-between gap-4 py-2.5">
      <Label htmlFor={id} className="text-sm font-normal text-foreground cursor-pointer">
        {label}
      </Label>
      <Switch id={id} checked={checked} onCheckedChange={onChange} disabled={disabled} aria-label={label} />
    </div>
  );
}

// Role card for the list view
function RoleCard({
  role,
  userType,
  onView,
  onEdit,
  onDuplicate,
  onDelete,
  onAssign,
  menuOpen,
  onToggleMenu,
}: {
  role: RoleRecord;
  userType?: UserTypeRecord;
  onView: () => void;
  onEdit: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
  onAssign: () => void;
  menuOpen: boolean;
  onToggleMenu: () => void;
}) {
  const enabled = totalEnabled(role.permissions);
  return (
    <Card
      className={cn(
        "transition-all cursor-pointer bg-card rounded-sm border border-border",
        role.isSystem ? "hover:border-border" : "hover:border-primary/30"
      )}
    >
      <CardContent className="p-4 flex items-center justify-between gap-4">
        <div className="flex items-start gap-3 min-w-0" onClick={onView}>
          <div
            className={cn(
              "mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-lg",
              role.isSystem ? "bg-muted text-muted-foreground" : "bg-primary/10 text-primary"
            )}
          >
            {role.isSystem ? <Lock className="w-4 h-4" /> : <Shield className="w-4 h-4" />}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <p className="font-bold text-foreground">{role.name}</p>
              <Badge variant={role.isSystem ? "outline" : "secondary"} className="text-xs">
                {role.isSystem ? "System" : "Custom"}
              </Badge>
              <Badge variant="outline" className="gap-1 text-xs">
                <Users className="w-3 h-3" />
                {role.memberCount}
              </Badge>
              <Badge variant="outline" className="text-xs">
                {enabled} perm{enabled !== 1 ? "s" : ""}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground mt-1">{role.description}</p>
          </div>
        </div>

        <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
          <Button
            variant="ghost"
            size="icon"
            title="Assign members"
            aria-label={`Assign members to ${role.name}`}
            onClick={onAssign}
          >
            <UserPlus className="w-4 h-4" />
          </Button>

          {role.isSystem ? (
            <Button variant="ghost" size="icon" title="View role" aria-label={`View ${role.name}`} onClick={onView}>
              <Eye className="w-4 h-4" />
            </Button>
          ) : (
            <div className="relative">
              <Button
                variant="ghost"
                size="icon"
                title="Role actions"
                aria-label={`Actions for ${role.name}`}
                aria-haspopup="menu"
                aria-expanded={menuOpen}
                onClick={onToggleMenu}
              >
                <MoreVertical className="w-4 h-4" />
              </Button>
              {menuOpen && (
                <>
                  <div className="fixed inset-0 z-10" onClick={onToggleMenu} aria-hidden="true" />
                  <div
                    role="menu"
                    className="absolute right-0 top-full mt-1 w-44 bg-card border rounded-sm z-20 py-1"
                  >
                    <button
                      role="menuitem"
                      onClick={onView}
                      className="w-full flex items-center gap-2 px-3 py-2 text-sm text-left hover:bg-accent"
                    >
                      <Eye className="w-4 h-4" /> View
                    </button>
                    <button
                      role="menuitem"
                      onClick={onEdit}
                      className="w-full flex items-center gap-2 px-3 py-2 text-sm text-left hover:bg-accent"
                    >
                      <Pencil className="w-4 h-4" /> Edit
                    </button>
                    <button
                      role="menuitem"
                      onClick={onDuplicate}
                      className="w-full flex items-center gap-2 px-3 py-2 text-sm text-left hover:bg-accent"
                    >
                      <Copy className="w-4 h-4" /> Duplicate
                    </button>
                    <Separator className="my-1" />
                    <button
                      role="menuitem"
                      onClick={onDelete}
                      className="w-full flex items-center gap-2 px-3 py-2 text-sm text-left text-destructive hover:bg-destructive/10"
                    >
                      <Trash2 className="w-4 h-4" /> Delete
                    </button>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// ============================================================================
// Main component
// ============================================================================

export const RolesPermissionsSection = () => {
  const [roles, setRoles] = useState<RoleRecord[]>(INITIAL_ROLES);
  const [members, setMembers] = useState<Member[]>(INITIAL_MEMBERS);

  const [screen, setScreen] = useState<Screen>("list");
  const [builderMode, setBuilderMode] = useState<BuilderMode>("create");
  const [activeRoleId, setActiveRoleId] = useState<string | null>(null);

  const [formName, setFormName] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [formUserTypeId, setFormUserTypeId] = useState<string>(USER_TYPES[0].id);
  const [formPermissions, setFormPermissions] = useState<PermissionState>(emptyPermissions());
  const [formErrors, setFormErrors] = useState<{ name?: string; permissions?: string }>({});

  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(PERMISSION_GROUP_META.map((g) => [g.key, true]))
  );

  const [openMenuRoleId, setOpenMenuRoleId] = useState<string | null>(null);

  const [isAssignOpen, setIsAssignOpen] = useState(false);
  const [assignContextRoleId, setAssignContextRoleId] = useState<string | null>(null);
  const [assignSelections, setAssignSelections] = useState<Record<string, string>>({});

  const [deleteRoleId, setDeleteRoleId] = useState<string | null>(null);

  // Derived
  const activeRole = useMemo(() => roles.find((r) => r.id === activeRoleId) ?? null, [roles, activeRoleId]);
  const deleteRole = useMemo(() => roles.find((r) => r.id === deleteRoleId) ?? null, [roles, deleteRoleId]);

  // Group roles by user type for the list view — system roles first
  const rolesByUserType = useMemo(() => {
    const map = new Map<string, RoleRecord[]>();
    for (const ut of USER_TYPES) map.set(ut.id, []);
    for (const role of roles) {
      const arr = map.get(role.userTypeId);
      if (arr) arr.push(role);
    }
    // Sort: system roles first, then custom
    for (const [key, arr] of map) {
      arr.sort((a, b) => (a.isSystem === b.isSystem ? 0 : a.isSystem ? -1 : 1));
    }
    return map;
  }, [roles]);

  function isNameTaken(name: string, excludeId?: string | null): boolean {
    const normalized = name.trim().toLowerCase();
    return roles.some((r) => r.id !== excludeId && r.name.trim().toLowerCase() === normalized);
  }

  function toggleExpand(key: string) {
    setExpandedGroups((prev) => ({ ...prev, [key]: !prev[key] }));
  }

  function togglePermission(group: PermGroupKey, id: string, value: boolean) {
    setFormPermissions((prev) => ({ ...prev, [group]: { ...prev[group], [id]: value } }));
  }

  function resetBuilderState() {
    setFormName("");
    setFormDescription("");
    setFormUserTypeId(USER_TYPES[0].id);
    setFormPermissions(emptyPermissions());
    setFormErrors({});
  }

  function openCreate(userTypeId?: string) {
    resetBuilderState();
    if (userTypeId) setFormUserTypeId(userTypeId);
    setBuilderMode("create");
    setActiveRoleId(null);
    setScreen("builder");
  }

  function openEdit(role: RoleRecord) {
    setFormName(role.name);
    setFormDescription(role.description);
    setFormUserTypeId(role.userTypeId);
    setFormPermissions(clonePermissions(role.permissions));
    setFormErrors({});
    setBuilderMode("edit");
    setActiveRoleId(role.id);
    setScreen("builder");
  }

  function openView(role: RoleRecord) {
    setFormName(role.name);
    setFormDescription(role.description);
    setFormUserTypeId(role.userTypeId);
    setFormPermissions(clonePermissions(role.permissions));
    setActiveRoleId(role.id);
    setScreen("view");
  }

  function handleDuplicate(role: RoleRecord) {
    const baseName = `Copy of ${role.name}`;
    let finalName = baseName;
    let i = 2;
    while (isNameTaken(finalName)) {
      finalName = `${baseName} ${i}`;
      i += 1;
    }
    const newRole: RoleRecord = {
      id: generateId("role"),
      name: finalName,
      description: role.description,
      userTypeId: role.userTypeId,
      isSystem: false,
      memberCount: 0,
      permissions: clonePermissions(role.permissions),
    };
    setRoles((prev) => [...prev, newRole]);
    toast.success(`Duplicated "${role.name}" as "${finalName}"`);
    openEdit(newRole);
  }

  function handleSave() {
    const errors: { name?: string; permissions?: string } = {};
    const trimmedName = formName.trim();

    if (!trimmedName) {
      errors.name = "Role name is required.";
    } else if (trimmedName.length > 50) {
      errors.name = "Role name must be 50 characters or fewer.";
    } else if (isNameTaken(trimmedName, builderMode === "edit" ? activeRoleId : null)) {
      errors.name = "A role with this name already exists.";
    }

    if (totalEnabled(formPermissions) === 0) {
      errors.permissions = "Select at least one permission before saving.";
    }

    setFormErrors(errors);
    if (Object.keys(errors).length > 0) {
      toast.error("Please fix the errors before saving.");
      return;
    }

    const trimmedDescription = formDescription.trim().slice(0, 200);

    if (builderMode === "create") {
      const newRole: RoleRecord = {
        id: generateId("role"),
        name: trimmedName,
        description: trimmedDescription,
        userTypeId: formUserTypeId,
        isSystem: false,
        memberCount: 0,
        permissions: formPermissions,
      };
      setRoles((prev) => [...prev, newRole]);
      toast.success(`Role "${trimmedName}" created`);
    } else if (activeRoleId) {
      setRoles((prev) =>
        prev.map((r) =>
          r.id === activeRoleId
            ? { ...r, name: trimmedName, description: trimmedDescription, userTypeId: formUserTypeId, permissions: formPermissions }
            : r
        )
      );
      toast.success(`Role "${trimmedName}" updated`);
    }

    setScreen("list");
  }

  function handleCancelBuilder() {
    setScreen("list");
  }

  function openAssign(role?: RoleRecord) {
    setAssignContextRoleId(role?.id ?? null);
    const selections: Record<string, string> = {};
    members.forEach((m) => (selections[m.id] = m.roleId));
    setAssignSelections(selections);
    setIsAssignOpen(true);
  }

  function handleAssignSave() {
    setMembers((prev) => prev.map((m) => ({ ...m, roleId: assignSelections[m.id] ?? m.roleId })));
    toast.success("Role assignments updated");
    setIsAssignOpen(false);
  }

  function handleDeleteConfirm() {
    if (!deleteRole) return;
    if (deleteRole.memberCount > 0) return;
    setRoles((prev) => prev.filter((r) => r.id !== deleteRole.id));
    toast.success(`Role "${deleteRole.name}" deleted`);
    setDeleteRoleId(null);
  }

  const isReadOnly = screen === "view" || (activeRole?.isSystem === true);

  // ──────────────────── Render ────────────────────

  return (
    <div className="p-6 lg:p-10">
      <AnimatePresence mode="wait">
        {/* ═══════════════════ LIST SCREEN ═══════════════════ */}
        {screen === "list" && (
          <motion.div
            key="list"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
            className="space-y-8"
          >
            {/* Header */}
            <header className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
              <div>
                <h2 className="text-2xl font-bold tracking-tight text-foreground">Roles & Permissions</h2>
                <p className="text-muted-foreground text-sm mt-1">
                  Hierarchical, delegated access control — User Type → Role → Permissions
                </p>
              </div>
              <Button onClick={() => openCreate()}>
                <Plus className="w-4 h-4 mr-2" />
                Create Role
              </Button>
            </header>

            {/* Three governing rules banner */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="flex items-start gap-3 rounded-sm border border-border bg-card p-4">
                <Lock className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
                <div>
                  <p className="text-xs font-bold text-foreground">No privilege escalation</p>
                  <p className="text-xs text-muted-foreground mt-0.5">You can only grant permissions you hold</p>
                </div>
              </div>
              <div className="flex items-start gap-3 rounded-sm border border-border bg-card p-4">
                <Layers className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
                <div>
                  <p className="text-xs font-bold text-foreground">Scope narrows down</p>
                  <p className="text-xs text-muted-foreground mt-0.5">Delegated scope can equal or narrow, never widen</p>
                </div>
              </div>
              <div className="flex items-start gap-3 rounded-sm border border-border bg-card p-4">
                <Eye className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
                <div>
                  <p className="text-xs font-bold text-foreground">Everything is audited</p>
                  <p className="text-xs text-muted-foreground mt-0.5">Every grant, revoke, and assignment is logged</p>
                </div>
              </div>
            </div>

            {/* Roles grouped by User Type */}
            {USER_TYPES.map((ut) => {
              const utRoles = rolesByUserType.get(ut.id) ?? [];
              return (
                <div key={ut.id} className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                        {ut.name}
                      </p>
                      <Badge variant="outline" className="text-[10px] font-normal">
                        {ut.label}
                      </Badge>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-xs h-7"
                      onClick={() => openCreate(ut.id)}
                    >
                      <Plus className="w-3 h-3 mr-1" />
                      Add Role
                    </Button>
                  </div>

                  {utRoles.length === 0 ? (
                    <Card className="bg-card rounded-sm border border-border">
                      <CardContent className="p-6 text-center text-muted-foreground text-sm">
                        No roles defined for {ut.name} yet.
                      </CardContent>
                    </Card>
                  ) : (
                    <div className="space-y-2">
                      {utRoles.map((role) => (
                        <RoleCard
                          key={role.id}
                          role={role}
                          userType={ut}
                          onView={() => openView(role)}
                          onEdit={() => openEdit(role)}
                          onDuplicate={() => handleDuplicate(role)}
                          onDelete={() => setDeleteRoleId(role.id)}
                          onAssign={() => openAssign(role)}
                          menuOpen={openMenuRoleId === role.id}
                          onToggleMenu={() => setOpenMenuRoleId((prev) => (prev === role.id ? null : role.id))}
                        />
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </motion.div>
        )}

        {/* ═══════════════════ BUILDER / VIEW SCREEN ═══════════════════ */}
        {(screen === "builder" || screen === "view") && (
          <motion.div
            key="builder"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
            className="space-y-6"
          >
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="icon" aria-label="Back to roles list" onClick={() => setScreen("list")}>
                <ArrowLeft className="w-4 h-4" />
              </Button>
              <h2 className="text-xl font-bold tracking-tight text-foreground">
                {screen === "view"
                  ? `View Role: ${activeRole?.name ?? ""}`
                  : builderMode === "create"
                  ? "Create Role"
                  : `Edit Role: ${activeRole?.name ?? ""}`}
              </h2>
              {activeRole?.isSystem && (
                <Badge variant="outline" className="text-xs gap-1">
                  <Lock className="w-3 h-3" /> System
                </Badge>
              )}
            </div>

            {screen === "view" && activeRole?.isSystem && (
              <div className="flex items-start gap-3 rounded-sm border border-blue-200 bg-blue-50 p-4 text-sm text-blue-900">
                <Info className="w-4 h-4 mt-0.5 shrink-0" />
                <p>System roles cannot be edited. Duplicate this role to create a custom version with different permissions.</p>
              </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Left column — metadata */}
              <div className="lg:col-span-4 space-y-6">
                <Card className="bg-card rounded-sm border border-border">
                  <CardContent className="p-4 space-y-4">
                    {/* User Type selector */}
                    <div className="space-y-1.5">
                      <Label htmlFor="role-user-type">User Type</Label>
                      <select
                        id="role-user-type"
                        value={formUserTypeId}
                        disabled={isReadOnly}
                        onChange={(e) => setFormUserTypeId(e.target.value)}
                        className={cn(
                          "w-full rounded-sm border border-border bg-background px-3 py-2 text-sm",
                          "focus:outline-none focus:ring-2 focus:ring-ring",
                          isReadOnly && "opacity-60 cursor-not-allowed"
                        )}
                      >
                        {USER_TYPES.map((ut) => (
                          <option key={ut.id} value={ut.id}>
                            {ut.name} — {ut.label}
                          </option>
                        ))}
                      </select>
                      <p className="text-xs text-muted-foreground">
                        {USER_TYPES.find((ut) => ut.id === formUserTypeId)?.description}
                      </p>
                    </div>

                    <Separator />

                    {/* Role name */}
                    <div className="space-y-1.5">
                      <Label htmlFor="role-name">Role Name</Label>
                      <Input
                        id="role-name"
                        value={formName}
                        maxLength={50}
                        disabled={isReadOnly}
                        placeholder="e.g. Senior Volunteer"
                        onChange={(e) => setFormName(e.target.value)}
                        aria-invalid={!!formErrors.name}
                      />
                      <div className="flex items-center justify-between">
                        {formErrors.name ? (
                          <p className="text-xs text-destructive">{formErrors.name}</p>
                        ) : (
                          <span />
                        )}
                        <p className="text-xs text-muted-foreground">{formName.length}/50</p>
                      </div>
                    </div>

                    {/* Role description */}
                    <div className="space-y-1.5">
                      <Label htmlFor="role-description">Description</Label>
                      <Textarea
                        id="role-description"
                        value={formDescription}
                        maxLength={200}
                        disabled={isReadOnly}
                        placeholder="Briefly describe what this role can do"
                        onChange={(e) => setFormDescription(e.target.value)}
                        rows={3}
                      />
                      <p className="text-xs text-muted-foreground text-right">{formDescription.length}/200</p>
                    </div>
                  </CardContent>
                </Card>

                {/* Permission summary */}
                <Card className="bg-card rounded-sm border border-border">
                  <CardContent className="p-4 space-y-3">
                    <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                      Permission Summary
                    </p>
                    <div className="space-y-2">
                      {PERMISSION_GROUP_META.map((group) => {
                        const count = countGroup(formPermissions[group.key]);
                        return (
                          <div key={group.key} className="flex items-center justify-between text-sm">
                            <span className="text-foreground flex items-center gap-1.5">
                              {group.sensitive && <ShieldAlert className="w-3 h-3 text-amber-500" />}
                              {group.title}
                            </span>
                            <Badge variant="outline">
                              {count}/{group.perms.length}
                            </Badge>
                          </div>
                        );
                      })}
                    </div>
                    <Separator />
                    <div className="flex items-center justify-between text-sm font-semibold">
                      <span>Total enabled</span>
                      <span>{totalEnabled(formPermissions)}</span>
                    </div>
                    {formErrors.permissions && (
                      <p className="text-xs text-destructive">{formErrors.permissions}</p>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Right column — permission catalog */}
              <div className="lg:col-span-8 space-y-4">
                <h3 className="text-sm font-bold uppercase tracking-widest text-muted-foreground">
                  Permission Catalog
                </h3>

                {PERMISSION_GROUP_META.map((group) => {
                  const expanded = expandedGroups[group.key];
                  const count = countGroup(formPermissions[group.key]);
                  return (
                    <Card key={group.key} className="overflow-hidden bg-card rounded-sm border border-border">
                      <button
                        type="button"
                        onClick={() => toggleExpand(group.key)}
                        aria-expanded={expanded}
                        className="w-full flex items-center justify-between gap-3 p-4 text-left hover:bg-accent/50 transition-colors"
                      >
                        <div className="flex items-center gap-2">
                          {group.sensitive && <ShieldAlert className="w-4 h-4 text-amber-500" />}
                          {group.category === "Feature" && <Zap className="w-4 h-4 text-muted-foreground" />}
                          <span className="font-semibold text-foreground">{group.title}</span>
                          <Badge variant="outline" className="text-xs">
                            {group.category}
                          </Badge>
                          <Badge variant="outline">
                            {count}/{group.perms.length}
                          </Badge>
                        </div>
                        <ChevronDown
                          className={cn("w-4 h-4 text-muted-foreground transition-transform", expanded && "rotate-180")}
                        />
                      </button>
                      <AnimatePresence initial={false}>
                        {expanded && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            className="overflow-hidden"
                          >
                            {group.sensitive && (
                              <div className="mx-4 mb-2 flex items-start gap-2 rounded-sm border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800">
                                <ShieldAlert className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                                <p>Sensitive permissions — may require justification and a second approver before granting.</p>
                              </div>
                            )}
                            {group.category === "Feature" && (
                              <div className="mx-4 mb-2 flex items-start gap-2 rounded-sm border border-blue-200 bg-blue-50 p-3 text-xs text-blue-800">
                                <Zap className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                                <p>Feature toggles are manager-flipped per team. A toggle off at team level hides the feature even if the role grants it.</p>
                              </div>
                            )}
                            <div className="px-4 pb-2 divide-y divide-border border-t">
                              {group.perms.map((perm) => (
                                <PermissionToggleRow
                                  key={perm.id}
                                  id={`perm-${perm.id}`}
                                  label={perm.label}
                                  checked={formPermissions[group.key][perm.id]}
                                  disabled={isReadOnly}
                                  onChange={(v) => togglePermission(group.key, perm.id, v)}
                                />
                              ))}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </Card>
                  );
                })}
              </div>
            </div>

            {/* Bottom action bar */}
            <div className="flex items-center justify-end gap-3 pt-2">
              {screen === "view" ? (
                activeRole?.isSystem ? (
                  <Button onClick={() => activeRole && handleDuplicate(activeRole)}>
                    <Copy className="w-4 h-4 mr-2" />
                    Duplicate to Customize
                  </Button>
                ) : (
                  <>
                    <Button variant="outline" onClick={() => activeRole && handleDuplicate(activeRole)}>
                      <Copy className="w-4 h-4 mr-2" />
                      Duplicate
                    </Button>
                    <Button onClick={() => activeRole && openEdit(activeRole)}>
                      <Pencil className="w-4 h-4 mr-2" />
                      Edit Role
                    </Button>
                  </>
                )
              ) : (
                <>
                  <Button variant="outline" onClick={handleCancelBuilder}>
                    Cancel
                  </Button>
                  <Button onClick={handleSave}>Save Role</Button>
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ═══════════════════ ASSIGN ROLE MODAL ═══════════════════ */}
      <AnimatePresence>
        {isAssignOpen && (
          <ModalShell onClose={() => setIsAssignOpen(false)} labelledBy="assign-role-title" maxWidth="max-w-xl">
            <div className="flex items-center justify-between p-5 border-b">
              <h3 id="assign-role-title" className="text-lg font-bold text-foreground">
                Assign Role
              </h3>
              <Button variant="ghost" size="icon" aria-label="Close" onClick={() => setIsAssignOpen(false)}>
                <X className="w-4 h-4" />
              </Button>
            </div>

            <div className="p-5 space-y-4">
              {assignContextRoleId && (
                <p className="text-sm text-muted-foreground">
                  Assigning members to{" "}
                  <span className="font-semibold text-foreground">
                    {roles.find((r) => r.id === assignContextRoleId)?.name}
                  </span>
                </p>
              )}
              <div className="space-y-4 max-h-[50vh] overflow-y-auto pr-1">
                {members.map((member) => (
                  <div key={member.id} className="flex flex-col sm:flex-row sm:items-center gap-3 pb-4 border-b last:border-b-0">
                    <div className="flex items-center gap-3 min-w-0 sm:w-48 shrink-0">
                      <Avatar className="size-9">
                        <AvatarFallback className="text-xs font-semibold">
                          {getInitials(member.name)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-foreground truncate">{member.name}</p>
                        <p className="text-xs text-muted-foreground truncate">{member.email}</p>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-1.5" role="radiogroup" aria-label={`Role for ${member.name}`}>
                      {roles.map((role) => {
                        const checked = assignSelections[member.id] === role.id;
                        return (
                          <label
                            key={role.id}
                            className={cn(
                              "flex items-center gap-1 px-2 py-1 rounded-sm border text-xs cursor-pointer transition-colors",
                              checked
                                ? "bg-primary text-primary-foreground border-primary"
                                : "bg-background text-foreground hover:bg-accent"
                            )}
                          >
                            <input
                              type="radio"
                              className="sr-only"
                              name={`role-select-${member.id}`}
                              checked={checked}
                              onChange={() =>
                                setAssignSelections((prev) => ({ ...prev, [member.id]: role.id }))
                              }
                            />
                            {role.name}
                          </label>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 p-5 border-t">
              <Button variant="outline" onClick={() => setIsAssignOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleAssignSave}>Save</Button>
            </div>
          </ModalShell>
        )}
      </AnimatePresence>

      {/* ═══════════════════ DELETE ROLE MODAL ═══════════════════ */}
      <AnimatePresence>
        {deleteRole && (
          <ModalShell onClose={() => setDeleteRoleId(null)} labelledBy="delete-role-title" maxWidth="max-w-md">
            <div className="p-5 space-y-4">
              <div className="flex items-center gap-3">
                <div className="flex size-10 items-center justify-center rounded-full bg-destructive/10 text-destructive">
                  <Trash2 className="w-5 h-5" />
                </div>
                <h3 id="delete-role-title" className="text-lg font-bold text-foreground">
                  Delete Role
                </h3>
              </div>

              <p className="text-sm text-muted-foreground">
                Are you sure you want to delete the role &ldquo;{deleteRole.name}&rdquo;? This action cannot be
                undone.
              </p>

              {deleteRole.memberCount > 0 && (
                <div className="flex items-start gap-3 rounded-sm border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
                  <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
                  <p>
                    This role has {deleteRole.memberCount} member{deleteRole.memberCount !== 1 ? "s" : ""} assigned. Reassign them before deleting.
                  </p>
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-3 p-5 border-t">
              <Button variant="outline" onClick={() => setDeleteRoleId(null)}>
                Cancel
              </Button>
              <Button
                variant="destructive"
                disabled={deleteRole.memberCount > 0}
                onClick={handleDeleteConfirm}
              >
                Delete Role
              </Button>
            </div>
          </ModalShell>
        )}
      </AnimatePresence>
    </div>
  );
};
