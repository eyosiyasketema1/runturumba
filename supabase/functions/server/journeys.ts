// ============================================================================
// Faith Journeys & Milestones API routes
// Phase 1: CRUD endpoints for faith_journeys, contact_milestones, milestone_entries
// ============================================================================

import { Hono } from "npm:hono";
import { createClient } from "jsr:@supabase/supabase-js@2.49.8";

const journeys = new Hono();

const supabase = () =>
  createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

// ─── Helper: standard error response ────────────────────────────────────────
function errorResponse(c: any, status: number, message: string) {
  return c.json({ error: message }, status);
}

// ═══════════════════════════════════════════════════════════════════════════════
// FAITH JOURNEYS
// ═══════════════════════════════════════════════════════════════════════════════

// GET /journeys?tenant_id=xxx — List all journeys for a tenant
journeys.get("/", async (c) => {
  const tenantId = c.req.query("tenant_id");
  if (!tenantId) return errorResponse(c, 400, "tenant_id is required");

  const contactId = c.req.query("contact_id");
  const stage = c.req.query("stage");
  const type = c.req.query("type");

  let query = supabase()
    .from("faith_journeys")
    .select("*")
    .eq("tenant_id", tenantId)
    .order("created_at", { ascending: false });

  if (contactId) query = query.eq("contact_id", contactId);
  if (stage) query = query.eq("stage", stage);
  if (type) query = query.eq("type", type);

  const { data, error } = await query;
  if (error) return errorResponse(c, 500, error.message);
  return c.json({ data });
});

// GET /journeys/:id — Get a single journey
journeys.get("/:id", async (c) => {
  const id = c.req.param("id");
  const { data, error } = await supabase()
    .from("faith_journeys")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) return errorResponse(c, 500, error.message);
  if (!data) return errorResponse(c, 404, "Journey not found");
  return c.json({ data });
});

// POST /journeys — Create a new journey
journeys.post("/", async (c) => {
  const body = await c.req.json();
  const { contact_id, tenant_id, source, type, language, assigned_by } = body;

  if (!contact_id || !tenant_id) {
    return errorResponse(c, 400, "contact_id and tenant_id are required");
  }

  const { data, error } = await supabase()
    .from("faith_journeys")
    .insert({
      contact_id,
      tenant_id,
      source: source || "Conversation",
      type: type || "Salvation",
      stage: "Touchpoint",
      indicators: 0,
      total: body.total || 7,
      milestone: body.milestone || "First contact",
      validation: "N/A",
      language: language || "Amharic",
      assigned_by: assigned_by || null,
      started_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) return errorResponse(c, 500, error.message);
  return c.json({ data }, 201);
});

// PUT /journeys/:id — Update a journey
journeys.put("/:id", async (c) => {
  const id = c.req.param("id");
  const body = await c.req.json();

  // Only allow updating specific fields
  const allowedFields: Record<string, boolean> = {
    stage: true,
    indicators: true,
    milestone: true,
    validation: true,
    language: true,
    source: true,
    type: true,
    total: true,
    paused_at: true,
    completed_at: true,
  };

  const updates: Record<string, any> = {};
  for (const [key, value] of Object.entries(body)) {
    if (allowedFields[key]) updates[key] = value;
  }

  if (Object.keys(updates).length === 0) {
    return errorResponse(c, 400, "No valid fields to update");
  }

  // Auto-set completed_at when reaching Decision with all indicators
  if (updates.stage === "Decision" && body.indicators >= body.total) {
    updates.completed_at = new Date().toISOString();
  }

  const { data, error } = await supabase()
    .from("faith_journeys")
    .update(updates)
    .eq("id", id)
    .select()
    .single();

  if (error) return errorResponse(c, 500, error.message);
  if (!data) return errorResponse(c, 404, "Journey not found");
  return c.json({ data });
});

// DELETE /journeys/:id — Delete a journey
journeys.delete("/:id", async (c) => {
  const id = c.req.param("id");
  const { error } = await supabase()
    .from("faith_journeys")
    .delete()
    .eq("id", id);

  if (error) return errorResponse(c, 500, error.message);
  return c.json({ success: true });
});

// POST /journeys/:id/advance — Advance a journey to the next stage
journeys.post("/:id/advance", async (c) => {
  const id = c.req.param("id");
  const stageOrder: string[] = ["Touchpoint", "Engaged", "Active Journey", "Decision"];

  // Fetch current journey
  const { data: journey, error: fetchErr } = await supabase()
    .from("faith_journeys")
    .select("*")
    .eq("id", id)
    .single();

  if (fetchErr || !journey) return errorResponse(c, 404, "Journey not found");

  const currentIdx = stageOrder.indexOf(journey.stage);
  if (currentIdx >= stageOrder.length - 1) {
    return errorResponse(c, 400, "Journey is already at the final stage");
  }

  const nextStage = stageOrder[currentIdx + 1];
  const updates: Record<string, any> = { stage: nextStage };

  // If reaching Decision and all indicators met, mark completed
  if (nextStage === "Decision" && journey.indicators >= journey.total) {
    updates.completed_at = new Date().toISOString();
  }

  const { data, error } = await supabase()
    .from("faith_journeys")
    .update(updates)
    .eq("id", id)
    .select()
    .single();

  if (error) return errorResponse(c, 500, error.message);
  return c.json({ data });
});

// POST /journeys/:id/pause — Pause/unpause a journey
journeys.post("/:id/pause", async (c) => {
  const id = c.req.param("id");

  const { data: journey, error: fetchErr } = await supabase()
    .from("faith_journeys")
    .select("paused_at")
    .eq("id", id)
    .single();

  if (fetchErr || !journey) return errorResponse(c, 404, "Journey not found");

  const { data, error } = await supabase()
    .from("faith_journeys")
    .update({ paused_at: journey.paused_at ? null : new Date().toISOString() })
    .eq("id", id)
    .select()
    .single();

  if (error) return errorResponse(c, 500, error.message);
  return c.json({ data });
});


// ═══════════════════════════════════════════════════════════════════════════════
// CONTACT MILESTONES
// ═══════════════════════════════════════════════════════════════════════════════

// GET /milestones?tenant_id=xxx — List all contact milestones for a tenant
journeys.get("/milestones", async (c) => {
  // Note: this route is mounted at /journeys/milestones
  const tenantId = c.req.query("tenant_id");
  if (!tenantId) return errorResponse(c, 400, "tenant_id is required");

  const contactId = c.req.query("contact_id");

  let query = supabase()
    .from("contact_milestones")
    .select("*, milestone_entries(*)")
    .eq("tenant_id", tenantId)
    .order("created_at", { ascending: false });

  if (contactId) query = query.eq("contact_id", contactId);

  const { data, error } = await query;
  if (error) return errorResponse(c, 500, error.message);

  // Sort milestone_entries by sort_order within each record
  const sorted = data?.map((cm: any) => ({
    ...cm,
    milestone_entries: (cm.milestone_entries || []).sort(
      (a: any, b: any) => a.sort_order - b.sort_order
    ),
  }));

  return c.json({ data: sorted });
});

// GET /milestones/:contactId — Get milestones for a specific contact
journeys.get("/milestones/:contactId", async (c) => {
  const contactId = c.req.param("contactId");
  const tenantId = c.req.query("tenant_id");
  if (!tenantId) return errorResponse(c, 400, "tenant_id is required");

  const { data, error } = await supabase()
    .from("contact_milestones")
    .select("*, milestone_entries(*)")
    .eq("contact_id", contactId)
    .eq("tenant_id", tenantId)
    .maybeSingle();

  if (error) return errorResponse(c, 500, error.message);
  if (!data) return errorResponse(c, 404, "Milestones not found for this contact");

  // Sort entries
  data.milestone_entries = (data.milestone_entries || []).sort(
    (a: any, b: any) => a.sort_order - b.sort_order
  );

  return c.json({ data });
});

// POST /milestones — Create milestone record for a contact (with 4 default entries)
journeys.post("/milestones", async (c) => {
  const body = await c.req.json();
  const { contact_id, tenant_id } = body;

  if (!contact_id || !tenant_id) {
    return errorResponse(c, 400, "contact_id and tenant_id are required");
  }

  // Create parent record
  const { data: cm, error: cmErr } = await supabase()
    .from("contact_milestones")
    .insert({ contact_id, tenant_id })
    .select()
    .single();

  if (cmErr) return errorResponse(c, 500, cmErr.message);

  // Create 4 default milestone entries
  const defaults = [
    { key: "salvation",  label: "Salvation Decision", sort_order: 0 },
    { key: "baptism",    label: "Baptism",            sort_order: 1 },
    { key: "community",  label: "Community",          sort_order: 2 },
    { key: "growth",     label: "Growth & Serving",   sort_order: 3 },
  ];

  const { data: entries, error: entryErr } = await supabase()
    .from("milestone_entries")
    .insert(
      defaults.map((d) => ({
        contact_milestone_id: cm.id,
        ...d,
        date: "Not Started",
        state: "pending",
        sub: [],
      }))
    )
    .select();

  if (entryErr) return errorResponse(c, 500, entryErr.message);
  return c.json({ data: { ...cm, milestone_entries: entries } }, 201);
});

// PUT /milestones/entries/:id — Update a single milestone entry
journeys.put("/milestones/entries/:id", async (c) => {
  const id = c.req.param("id");
  const body = await c.req.json();

  const allowedFields: Record<string, boolean> = {
    state: true,
    date: true,
    sub: true,
    confirmed_by: true,
    confirmed_at: true,
  };

  const updates: Record<string, any> = {};
  for (const [key, value] of Object.entries(body)) {
    if (allowedFields[key]) updates[key] = value;
  }

  // Auto-set confirmed_at when state changes to done
  if (updates.state === "done" && !updates.confirmed_at) {
    updates.confirmed_at = new Date().toISOString();
  }

  if (Object.keys(updates).length === 0) {
    return errorResponse(c, 400, "No valid fields to update");
  }

  const { data, error } = await supabase()
    .from("milestone_entries")
    .update(updates)
    .eq("id", id)
    .select()
    .single();

  if (error) return errorResponse(c, 500, error.message);
  if (!data) return errorResponse(c, 404, "Milestone entry not found");
  return c.json({ data });
});


// ═══════════════════════════════════════════════════════════════════════════════
// STATS / SUMMARY
// ═══════════════════════════════════════════════════════════════════════════════

// GET /stats?tenant_id=xxx — Journey and milestone summary stats
journeys.get("/stats", async (c) => {
  const tenantId = c.req.query("tenant_id");
  if (!tenantId) return errorResponse(c, 400, "tenant_id is required");

  // Journey counts by stage
  const { data: stageData, error: stageErr } = await supabase()
    .from("faith_journeys")
    .select("stage")
    .eq("tenant_id", tenantId);

  if (stageErr) return errorResponse(c, 500, stageErr.message);

  const stageCounts: Record<string, number> = {
    Touchpoint: 0,
    Engaged: 0,
    "Active Journey": 0,
    Decision: 0,
  };
  stageData?.forEach((j: any) => {
    if (stageCounts[j.stage] !== undefined) stageCounts[j.stage]++;
  });

  // Journey counts by type
  const typeCounts: Record<string, number> = {};
  stageData?.forEach((j: any) => {
    // Re-query would be needed for type, using stage data just for total
  });

  return c.json({
    data: {
      total_journeys: stageData?.length || 0,
      by_stage: stageCounts,
    },
  });
});


export default journeys;
