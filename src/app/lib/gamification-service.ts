// ============================================================================
// Gamification Service — Phase 2
// Profiles, points, streaks, rules, and engine processing
// ============================================================================

import { api } from "./supabase";

// ─── Types ───────────────────────────────────────────────────────────────────

export interface GamificationProfile {
  id: string;
  account_id: string;
  actor_id: string;
  actor_type: "seeker" | "mentor";
  total_xp: number;
  level: number;
  current_streak: number;
  longest_streak: number;
  last_activity_at: string | null;
  streak_anchor_date: string | null;
  tier: "bronze" | "silver" | "gold" | "platinum";
  timezone: string;
  created_at: string;
  updated_at: string;
}

export interface PointTransaction {
  id: string;
  account_id: string;
  actor_id: string;
  actor_type: string;
  points: number;
  reason: string;
  source_event_id: string | null;
  rule_id: string | null;
  metadata_: Record<string, any>;
  created_at: string;
}

export interface BehaviorRule {
  id: string;
  account_id: string;
  name: string;
  description: string;
  actor_type: string;
  trigger_event: string;
  conditions: Array<{ field: string; op: string; value: any }>;
  actions: Array<{ type: string; [key: string]: any }>;
  cooldown_seconds: number | null;
  daily_cap: number | null;
  priority: number;
  is_active: boolean;
  variant: string | null;
}

export interface XpAwardResult {
  transaction_id: string;
  new_total_xp: number;
  new_level: number;
  new_tier: string;
  level_changed: boolean;
}

export interface PointsSummary {
  total_xp: number;
  this_week: number;
  this_month: number;
}

export interface GamificationStats {
  total_profiles: number;
  seekers: number;
  mentors: number;
  total_xp_awarded: number;
  avg_seeker_xp: number;
  avg_mentor_xp: number;
  avg_streak: number;
  tier_distribution: {
    bronze: number;
    silver: number;
    gold: number;
    platinum: number;
  };
}

// ─── Helper: XP needed for next level ────────────────────────────────────────

export function xpForLevel(level: number): number {
  // level = floor(sqrt(xp / 50)) + 1
  // Solve for xp: xp = 50 * (level - 1)^2
  return 50 * (level - 1) * (level - 1);
}

export function xpProgress(totalXp: number, currentLevel: number): {
  currentLevelXp: number;
  nextLevelXp: number;
  progressPct: number;
} {
  const currentLevelXp = xpForLevel(currentLevel);
  const nextLevelXp = xpForLevel(currentLevel + 1);
  const range = nextLevelXp - currentLevelXp;
  const progress = totalXp - currentLevelXp;
  return {
    currentLevelXp,
    nextLevelXp,
    progressPct: range > 0 ? Math.min(100, Math.round((progress / range) * 100)) : 100,
  };
}

export function tierColor(tier: string): string {
  switch (tier) {
    case "platinum": return "#a855f7";
    case "gold": return "#f59e0b";
    case "silver": return "#94a3b8";
    case "bronze": return "#d97706";
    default: return "#94a3b8";
  }
}

// ─── API Functions ───────────────────────────────────────────────────────────

export const ProfilesService = {
  async list(accountId: string, actorType?: string) {
    const params: Record<string, string> = { account_id: accountId };
    if (actorType) params.actor_type = actorType;
    return api<GamificationProfile[]>("/gamification/profiles", { params });
  },

  async get(actorId: string, accountId: string) {
    return api<GamificationProfile>(`/gamification/profiles/${actorId}`, {
      params: { account_id: accountId },
    });
  },

  async create(accountId: string, actorId: string, actorType: string) {
    return api<GamificationProfile>("/gamification/profiles", {
      method: "POST",
      body: { account_id: accountId, actor_id: actorId, actor_type: actorType },
    });
  },
};

export const PointsService = {
  async history(actorId: string, accountId: string, limit = 50, offset = 0) {
    return api<PointTransaction[]>(`/gamification/points/${actorId}`, {
      params: { account_id: accountId, limit: String(limit), offset: String(offset) },
    });
  },

  async summary(actorId: string, accountId: string) {
    return api<PointsSummary>(`/gamification/points/${actorId}/summary`, {
      params: { account_id: accountId },
    });
  },

  async award(data: {
    account_id: string;
    actor_id: string;
    actor_type: string;
    points: number;
    reason: string;
    source_event_id?: string;
  }) {
    return api<XpAwardResult>("/gamification/points/award", {
      method: "POST",
      body: data,
    });
  },
};

export const StreakService = {
  async update(accountId: string, actorId: string, actorType: string) {
    return api<{ new_streak: number; streak_incremented: boolean }>("/gamification/streak/update", {
      method: "POST",
      body: { account_id: accountId, actor_id: actorId, actor_type: actorType },
    });
  },
};

export const RulesService = {
  async list(accountId: string) {
    return api<BehaviorRule[]>("/gamification/rules", {
      params: { account_id: accountId },
    });
  },

  async get(id: string) {
    return api<BehaviorRule>(`/gamification/rules/${id}`);
  },
};

export const EngineService = {
  async processEvent(data: {
    account_id: string;
    actor_id: string;
    actor_type: string;
    event_type: string;
    event_data?: Record<string, any>;
    source_event_id?: string;
  }) {
    return api<{ processed: number; actions: any[] }>("/gamification/engine/process", {
      method: "POST",
      body: data,
    });
  },
};

// ─── Badge Types & API (Phase 3) ────────────────────────────────────────────

export interface BadgeDefinition {
  id: string;
  account_id: string;
  slug: string;
  name: string;
  description: string;
  icon_url: string | null;
  category: "achievement" | "milestone" | "streak" | "special";
  criteria: Record<string, any>;
  rarity: "common" | "rare" | "epic" | "legendary";
  xp_reward: number;
  is_active: boolean;
}

export interface BadgeAward {
  id: string;
  account_id: string;
  actor_id: string;
  actor_type: string;
  badge_id: string;
  awarded_at: string;
  badge: BadgeDefinition;
}

export function rarityColor(rarity: string): string {
  switch (rarity) {
    case "legendary": return "#f59e0b";
    case "epic": return "#a855f7";
    case "rare": return "#3b82f6";
    case "common": return "#94a3b8";
    default: return "#94a3b8";
  }
}

export const BadgesService = {
  async listDefinitions(accountId: string) {
    return api<BadgeDefinition[]>("/gamification/badges", {
      params: { account_id: accountId },
    });
  },

  async listAwards(actorId: string, accountId: string) {
    return api<BadgeAward[]>(`/gamification/badges/${actorId}`, {
      params: { account_id: accountId },
    });
  },

  async check(accountId: string, actorId: string, actorType: string, badgeSlug: string) {
    return api<{ badge_slug: string; status: string; badge_name?: string; rarity?: string; xp_reward?: number }>(
      "/gamification/badges/check",
      {
        method: "POST",
        body: { account_id: accountId, actor_id: actorId, actor_type: actorType, badge_slug: badgeSlug },
      }
    );
  },
};

// ─── Leaderboard Types & API (Phase 4) ──────────────────────────────────────

export interface LeaderboardEntry {
  id: string;
  account_id: string;
  actor_id: string;
  actor_type: string;
  board_type: "weekly" | "monthly" | "all_time";
  period_key: string;
  xp_earned: number;
  rank: number;
}

export interface GamificationNotification {
  id: string;
  account_id: string;
  actor_id: string;
  actor_type: string;
  notification_type: "badge_earned" | "level_up" | "streak_milestone" | "milestone_completed" | "rank_change";
  title: string;
  body: string;
  payload: Record<string, any>;
  is_read: boolean;
  read_at: string | null;
  created_at: string;
}

export const LeaderboardService = {
  async get(accountId: string, boardType = "weekly", actorType?: string, limit = 20, period?: string) {
    const params: Record<string, string> = { account_id: accountId, board_type: boardType, limit: String(limit) };
    if (actorType) params.actor_type = actorType;
    if (period) params.period = period;
    return api<LeaderboardEntry[]>("/gamification/leaderboard", { params });
  },
};

export const NotificationsService = {
  async list(accountId: string, actorId: string, limit = 30, unreadOnly = false) {
    const params: Record<string, string> = { account_id: accountId, actor_id: actorId, limit: String(limit) };
    if (unreadOnly) params.unread = "true";
    return api<GamificationNotification[]>("/gamification/notifications", { params });
  },

  async markRead(id: string) {
    return api<GamificationNotification>(`/gamification/notifications/${id}/read`, { method: "PATCH" });
  },

  async markAllRead(accountId: string, actorId: string) {
    return api<{ status: string }>("/gamification/notifications/read-all", {
      method: "POST",
      body: { account_id: accountId, actor_id: actorId },
    });
  },
};

// ─── Admin Services (Phase 5) ───────────────────────────────────────────────

export interface GamificationAnalytics {
  xp_distribution: { label: string; count: number }[];
  badge_rates: { slug: string; name: string; rarity: string; earned: number; rate: number }[];
  streak_distribution: { label: string; count: number }[];
  tier_distribution: { bronze: number; silver: number; gold: number; platinum: number };
  xp_timeline: { date: string; xp: number }[];
  milestone_funnel: { stage: string; count: number }[];
  engagement_correlation: {
    actor_id: string;
    total_xp: number;
    engagement_events: number;
    current_streak: number;
    tier: "bronze" | "silver" | "gold" | "platinum";
  }[];
  totals: { profiles: number; seekers: number; mentors: number; badges_defined: number; badges_awarded: number; total_xp: number };
}

export const AdminRulesService = {
  async create(data: Record<string, any>) {
    return api<BehaviorRule>("/gamification/admin/rules", { method: "POST", body: data });
  },
  async update(id: string, data: Record<string, any>) {
    return api<BehaviorRule>(`/gamification/admin/rules/${id}`, { method: "PATCH", body: data });
  },
  async delete(id: string) {
    return api<{ deleted: boolean }>(`/gamification/admin/rules/${id}`, { method: "DELETE" });
  },
};

export const AdminBadgesService = {
  async create(data: Record<string, any>) {
    return api<BadgeDefinition>("/gamification/admin/badges", { method: "POST", body: data });
  },
  async update(id: string, data: Record<string, any>) {
    return api<BadgeDefinition>(`/gamification/admin/badges/${id}`, { method: "PATCH", body: data });
  },
  async delete(id: string) {
    return api<{ deleted: boolean }>(`/gamification/admin/badges/${id}`, { method: "DELETE" });
  },
};

export const AnalyticsService = {
  async get(accountId: string) {
    return api<GamificationAnalytics>("/gamification/analytics", {
      params: { account_id: accountId },
    });
  },
};

export const GamificationStatsService = {
  async get(accountId: string) {
    return api<GamificationStats>("/gamification/stats", {
      params: { account_id: accountId },
    });
  },
};

// ─── Re-engagement Types & API (Phase 6) ───────────────────────────────────

export interface ReengagementTemplate {
  id: string;
  account_id: string;
  slug: string;
  name: string;
  description: string;
  trigger_type: "manual" | "streak_broken" | "silence" | "dropout_risk";
  steps: Array<{ delay_hours: number; channel: string; message: string }>;
  is_active: boolean;
  created_at: string;
}

export interface AutomationEnrollment {
  id: string;
  account_id: string;
  actor_id: string;
  actor_type: string;
  template_id: string;
  status: "active" | "completed" | "cancelled";
  current_step: number;
  enrolled_at: string;
  last_step_at: string | null;
  completed_at: string | null;
  metadata_: Record<string, any>;
  reengagement_templates?: ReengagementTemplate;
}

export interface DripMessage {
  id: string;
  account_id: string;
  enrollment_id: string;
  step_index: number;
  message_content: string;
  channel: string;
  status: "pending" | "sent" | "delivered" | "failed";
  scheduled_at: string;
  sent_at: string | null;
  created_at: string;
}

export const ReengagementService = {
  async listTemplates(accountId: string) {
    return api<ReengagementTemplate[]>("/gamification/reengagement/templates", {
      params: { account_id: accountId },
    });
  },

  async enroll(data: {
    account_id: string;
    actor_id: string;
    actor_type?: string;
    template_slug: string;
    metadata?: Record<string, any>;
  }) {
    return api<{ enrollment_id: string; template_name: string; steps_count: number; status: string }>(
      "/gamification/reengagement/enroll",
      { method: "POST", body: data }
    );
  },

  async listEnrollments(actorId: string, accountId: string, status = "active") {
    return api<AutomationEnrollment[]>(`/gamification/reengagement/enrollments/${actorId}`, {
      params: { account_id: accountId, status },
    });
  },

  async cancelEnrollment(id: string) {
    return api<{ id: string; status: string }>(`/gamification/reengagement/enrollments/${id}/cancel`, {
      method: "PATCH",
    });
  },

  async getDrips(enrollmentId: string) {
    return api<DripMessage[]>(`/gamification/reengagement/drips/${enrollmentId}`);
  },

  async processDueDrips(limit = 50) {
    return api<{ processed: number; drips: any[] }>("/gamification/reengagement/process-drips", {
      method: "POST",
      body: { limit },
    });
  },
};

export const AdminReengagementService = {
  async createTemplate(data: Record<string, any>) {
    return api<ReengagementTemplate>("/gamification/admin/reengagement/templates", {
      method: "POST", body: data,
    });
  },
  async updateTemplate(id: string, data: Record<string, any>) {
    return api<ReengagementTemplate>(`/gamification/admin/reengagement/templates/${id}`, {
      method: "PATCH", body: data,
    });
  },
  async deleteTemplate(id: string) {
    return api<{ deleted: boolean }>(`/gamification/admin/reengagement/templates/${id}`, {
      method: "DELETE",
    });
  },
  /**
   * Tenant-wide enrollments list, joined to the template definition. Powers
   * the admin Re-engagement → Enrollments sub-tab.
   */
  async listAllEnrollments(
    accountId: string,
    opts: { status?: "all" | "active" | "completed" | "cancelled"; templateId?: string; limit?: number } = {}
  ) {
    const params: Record<string, string> = { account_id: accountId };
    if (opts.status) params.status = opts.status;
    if (opts.templateId) params.template_id = opts.templateId;
    if (opts.limit) params.limit = String(opts.limit);
    return api<AutomationEnrollment[]>("/gamification/admin/reengagement/enrollments", {
      params,
    });
  },
};
