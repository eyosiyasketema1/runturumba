// ============================================================================
// Faith Journeys & Milestones Service
// Wraps the Supabase edge function API for use in React components
// Falls back to local state when Supabase is not configured
// ============================================================================

import { api, isSupabaseConfigured } from "./supabase";

// ─── Types (matching the database schema) ────────────────────────────────────

export interface FaithJourneyDB {
  id: string;
  contact_id: string;
  tenant_id: string;
  source: string;
  type: string;
  stage: string;
  indicators: number;
  total: number;
  milestone: string;
  validation: string;
  language: string;
  assigned_by: string | null;
  paused_at: string | null;
  started_at: string;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface MilestoneEntryDB {
  id: string;
  contact_milestone_id: string;
  key: string;
  label: string;
  date: string;
  state: string;
  sub: string[];
  sort_order: number;
  confirmed_by: string | null;
  confirmed_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface ContactMilestoneDB {
  id: string;
  contact_id: string;
  tenant_id: string;
  milestone_entries: MilestoneEntryDB[];
  created_at: string;
  updated_at: string;
}

// ─── Convert between DB and frontend formats ─────────────────────────────────

export function dbToFrontendJourney(j: FaithJourneyDB) {
  return {
    id: j.id,
    contactId: j.contact_id,
    tenantId: j.tenant_id,
    source: j.source,
    type: j.type,
    stage: j.stage,
    indicators: j.indicators,
    total: j.total,
    milestone: j.milestone,
    validation: j.validation,
    language: j.language,
    startedAt: j.started_at?.split("T")[0] || "",
  };
}

export function dbToFrontendMilestones(cm: ContactMilestoneDB) {
  return {
    id: cm.id,
    contactId: cm.contact_id,
    tenantId: cm.tenant_id,
    milestones: (cm.milestone_entries || [])
      .sort((a, b) => a.sort_order - b.sort_order)
      .map((e) => ({
        key: e.key,
        label: e.label,
        date: e.date,
        state: e.state,
        sub: e.sub || [],
        _entryId: e.id, // keep DB ID for updates
      })),
  };
}

// ─── API Functions ───────────────────────────────────────────────────────────

export const JourneysService = {
  /**
   * List all journeys for a tenant
   */
  async list(tenantId: string, filters?: { contactId?: string; stage?: string; type?: string }) {
    const params: Record<string, string> = { tenant_id: tenantId };
    if (filters?.contactId) params.contact_id = filters.contactId;
    if (filters?.stage) params.stage = filters.stage;
    if (filters?.type) params.type = filters.type;

    return api<FaithJourneyDB[]>("/journeys", { params });
  },

  /**
   * Get a single journey by ID
   */
  async get(id: string) {
    return api<FaithJourneyDB>(`/journeys/${id}`);
  },

  /**
   * Create a new journey
   */
  async create(data: {
    contact_id: string;
    tenant_id: string;
    source?: string;
    type?: string;
    language?: string;
    assigned_by?: string;
  }) {
    return api<FaithJourneyDB>("/journeys", { method: "POST", body: data });
  },

  /**
   * Update a journey
   */
  async update(id: string, data: Partial<{
    stage: string;
    indicators: number;
    milestone: string;
    validation: string;
    language: string;
    source: string;
    type: string;
    total: number;
    paused_at: string | null;
    completed_at: string | null;
  }>) {
    return api<FaithJourneyDB>(`/journeys/${id}`, { method: "PUT", body: data });
  },

  /**
   * Delete a journey
   */
  async delete(id: string) {
    return api(`/journeys/${id}`, { method: "DELETE" });
  },

  /**
   * Advance journey to the next stage
   */
  async advance(id: string) {
    return api<FaithJourneyDB>(`/journeys/${id}/advance`, { method: "POST" });
  },

  /**
   * Pause or unpause a journey
   */
  async togglePause(id: string) {
    return api<FaithJourneyDB>(`/journeys/${id}/pause`, { method: "POST" });
  },
};

export const MilestonesService = {
  /**
   * List all contact milestones for a tenant
   */
  async list(tenantId: string, contactId?: string) {
    const params: Record<string, string> = { tenant_id: tenantId };
    if (contactId) params.contact_id = contactId;

    return api<ContactMilestoneDB[]>("/journeys/milestones", { params });
  },

  /**
   * Get milestones for a specific contact
   */
  async getByContact(contactId: string, tenantId: string) {
    return api<ContactMilestoneDB>(`/journeys/milestones/${contactId}`, {
      params: { tenant_id: tenantId },
    });
  },

  /**
   * Create milestone record for a contact (with 4 default entries)
   */
  async create(contactId: string, tenantId: string) {
    return api<ContactMilestoneDB>("/journeys/milestones", {
      method: "POST",
      body: { contact_id: contactId, tenant_id: tenantId },
    });
  },

  /**
   * Update a single milestone entry (e.g., mark as done)
   */
  async updateEntry(entryId: string, data: Partial<{
    state: string;
    date: string;
    sub: string[];
    confirmed_by: string;
  }>) {
    return api<MilestoneEntryDB>(`/journeys/milestones/entries/${entryId}`, {
      method: "PUT",
      body: data,
    });
  },
};

export const JourneyStatsService = {
  /**
   * Get journey summary stats
   */
  async get(tenantId: string) {
    return api<{
      total_journeys: number;
      by_stage: Record<string, number>;
    }>("/journeys/stats", { params: { tenant_id: tenantId } });
  },
};
