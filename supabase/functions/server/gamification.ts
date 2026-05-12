// ============================================================================
// Gamification API + Engine (Phase 2 + Phase 3)
// Profiles, points, behavior rules, badges, and the rules evaluation engine
// ============================================================================

import { Hono } from "npm:hono";
import { createClient } from "jsr:@supabase/supabase-js@2.49.8";

const gam = new Hono();

const supabase = () =>
  createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

function err(c: any, status: number, message: string) {
  return c.json({ error: message }, status);
}

// ═══════════════════════════════════════════════════════════════════════════════
// PROFILES
// ═══════════════════════════════════════════════════════════════════════════════

// GET /gamification/profiles?account_id=xxx — List all profiles
gam.get("/profiles", async (c) => {
  const accountId = c.req.query("account_id");
  if (!accountId) return err(c, 400, "account_id is required");

  const actorType = c.req.query("actor_type");
  let query = supabase()
    .from("gamification_profiles")
    .select("*")
    .eq("account_id", accountId)
    .order("total_xp", { ascending: false });

  if (actorType) query = query.eq("actor_type", actorType);

  const { data, error } = await query;
  if (error) return err(c, 500, error.message);
  return c.json({ data });
});

// GET /gamification/profiles/:actorId — Get a single profile
gam.get("/profiles/:actorId", async (c) => {
  const actorId = c.req.param("actorId");
  const accountId = c.req.query("account_id");
  if (!accountId) return err(c, 400, "account_id is required");

  const { data, error } = await supabase()
    .from("gamification_profiles")
    .select("*")
    .eq("account_id", accountId)
    .eq("actor_id", actorId)
    .maybeSingle();

  if (error) return err(c, 500, error.message);
  if (!data) return err(c, 404, "Profile not found");
  return c.json({ data });
});

// POST /gamification/profiles — Create or get a profile
gam.post("/profiles", async (c) => {
  const body = await c.req.json();
  const { account_id, actor_id, actor_type } = body;
  if (!account_id || !actor_id || !actor_type) {
    return err(c, 400, "account_id, actor_id, and actor_type are required");
  }

  const { data, error } = await supabase()
    .from("gamification_profiles")
    .upsert({
      account_id,
      actor_id,
      actor_type,
      total_xp: 0,
    }, { onConflict: "account_id,actor_id,actor_type" })
    .select()
    .single();

  if (error) return err(c, 500, error.message);
  return c.json({ data }, 201);
});


// ═══════════════════════════════════════════════════════════════════════════════
// POINTS
// ═══════════════════════════════════════════════════════════════════════════════

// GET /gamification/points/:actorId — Point transaction history
gam.get("/points/:actorId", async (c) => {
  const actorId = c.req.param("actorId");
  const accountId = c.req.query("account_id");
  if (!accountId) return err(c, 400, "account_id is required");

  const limit = parseInt(c.req.query("limit") || "50");
  const offset = parseInt(c.req.query("offset") || "0");

  const { data, error } = await supabase()
    .from("point_transactions")
    .select("*")
    .eq("account_id", accountId)
    .eq("actor_id", actorId)
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) return err(c, 500, error.message);
  return c.json({ data });
});

// GET /gamification/points/:actorId/summary — XP summary
gam.get("/points/:actorId/summary", async (c) => {
  const actorId = c.req.param("actorId");
  const accountId = c.req.query("account_id");
  if (!accountId) return err(c, 400, "account_id is required");

  const now = new Date();
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();

  // Get all transactions for this actor
  const { data: allTx, error } = await supabase()
    .from("point_transactions")
    .select("points, created_at")
    .eq("account_id", accountId)
    .eq("actor_id", actorId);

  if (error) return err(c, 500, error.message);

  const total = (allTx || []).reduce((sum: number, t: any) => sum + t.points, 0);
  const thisWeek = (allTx || [])
    .filter((t: any) => t.created_at >= weekAgo)
    .reduce((sum: number, t: any) => sum + t.points, 0);
  const thisMonth = (allTx || [])
    .filter((t: any) => t.created_at >= monthAgo)
    .reduce((sum: number, t: any) => sum + t.points, 0);

  return c.json({
    data: { total_xp: total, this_week: thisWeek, this_month: thisMonth },
  });
});

// POST /gamification/points/award — Manually award XP
gam.post("/points/award", async (c) => {
  const body = await c.req.json();
  const { account_id, actor_id, actor_type, points, reason } = body;

  if (!account_id || !actor_id || !actor_type || points === undefined || !reason) {
    return err(c, 400, "account_id, actor_id, actor_type, points, and reason are required");
  }

  // Call the award_xp database function
  const { data, error } = await supabase().rpc("award_xp", {
    p_account_id: account_id,
    p_actor_id: actor_id,
    p_actor_type: actor_type,
    p_points: points,
    p_reason: reason,
    p_source_event_id: body.source_event_id || null,
    p_rule_id: body.rule_id || null,
    p_metadata: body.metadata || {},
  });

  if (error) return err(c, 500, error.message);
  return c.json({ data: data?.[0] || data }, 201);
});


// ═══════════════════════════════════════════════════════════════════════════════
// STREAKS
// ═══════════════════════════════════════════════════════════════════════════════

// POST /gamification/streak/update — Update streak for an actor
gam.post("/streak/update", async (c) => {
  const body = await c.req.json();
  const { account_id, actor_id, actor_type } = body;

  if (!account_id || !actor_id || !actor_type) {
    return err(c, 400, "account_id, actor_id, and actor_type are required");
  }

  const { data, error } = await supabase().rpc("update_streak", {
    p_account_id: account_id,
    p_actor_id: actor_id,
    p_actor_type: actor_type,
  });

  if (error) return err(c, 500, error.message);
  return c.json({ data: data?.[0] || data });
});


// ═══════════════════════════════════════════════════════════════════════════════
// BEHAVIOR RULES
// ═══════════════════════════════════════════════════════════════════════════════

// GET /gamification/rules?account_id=xxx — List all rules
gam.get("/rules", async (c) => {
  const accountId = c.req.query("account_id");
  if (!accountId) return err(c, 400, "account_id is required");

  const { data, error } = await supabase()
    .from("behavior_rules")
    .select("*")
    .eq("account_id", accountId)
    .order("priority", { ascending: true });

  if (error) return err(c, 500, error.message);
  return c.json({ data });
});

// GET /gamification/rules/:id — Get a single rule
gam.get("/rules/:id", async (c) => {
  const id = c.req.param("id");
  const { data, error } = await supabase()
    .from("behavior_rules")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) return err(c, 500, error.message);
  if (!data) return err(c, 404, "Rule not found");
  return c.json({ data });
});


// ═══════════════════════════════════════════════════════════════════════════════
// ENGINE: Process an engagement event through the rules
// ═══════════════════════════════════════════════════════════════════════════════

// POST /gamification/engine/process — Process an event through behavior rules
gam.post("/engine/process", async (c) => {
  const body = await c.req.json();
  const { account_id, actor_id, actor_type, event_type, event_data } = body;

  if (!account_id || !actor_id || !actor_type || !event_type) {
    return err(c, 400, "account_id, actor_id, actor_type, and event_type are required");
  }

  const db = supabase();

  // 1. Load active rules for this trigger event
  const { data: rules, error: rulesErr } = await db
    .from("behavior_rules")
    .select("*")
    .eq("account_id", account_id)
    .eq("is_active", true)
    .eq("trigger_event", event_type)
    .order("priority", { ascending: true });

  if (rulesErr) return err(c, 500, rulesErr.message);
  if (!rules || rules.length === 0) {
    return c.json({ data: { processed: 0, actions: [] } });
  }

  const results: any[] = [];
  const eventPayload = { event_type, actor_type, actor_id, ...event_data };
  const sourceEventId = body.source_event_id || `evt-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

  // 2. Evaluate each rule
  for (const rule of rules) {
    // Check actor_type filter
    if (rule.actor_type !== "both" && rule.actor_type !== actor_type) continue;

    // Check cooldown
    if (rule.cooldown_seconds) {
      const cooldownCutoff = new Date(Date.now() - rule.cooldown_seconds * 1000).toISOString();
      const { data: recentTx } = await db
        .from("point_transactions")
        .select("id")
        .eq("rule_id", rule.id)
        .eq("actor_id", actor_id)
        .gte("created_at", cooldownCutoff)
        .limit(1);

      if (recentTx && recentTx.length > 0) continue; // Still in cooldown
    }

    // Check daily cap
    if (rule.daily_cap) {
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);
      const { data: todayTx } = await db
        .from("point_transactions")
        .select("id")
        .eq("rule_id", rule.id)
        .eq("actor_id", actor_id)
        .gte("created_at", todayStart.toISOString());

      if (todayTx && todayTx.length >= rule.daily_cap) continue; // Cap reached
    }

    // Evaluate conditions
    const conditions = rule.conditions || [];
    let allConditionsMet = true;

    for (const cond of conditions) {
      const fieldValue = getNestedField(eventPayload, cond.field);
      if (!evaluateCondition(fieldValue, cond.op, cond.value)) {
        allConditionsMet = false;
        break;
      }
    }

    if (!allConditionsMet) continue;

    // 3. Execute actions
    const actions = rule.actions || [];
    for (const action of actions) {
      try {
        const result = await executeAction(db, action, {
          account_id,
          actor_id,
          actor_type,
          rule_id: rule.id,
          source_event_id: sourceEventId,
          event_data: eventPayload,
        });
        results.push({ rule: rule.name, action: action.type, result });
      } catch (e: any) {
        results.push({ rule: rule.name, action: action.type, error: e.message });
      }
    }
  }

  return c.json({ data: { processed: results.length, actions: results } });
});


// ═══════════════════════════════════════════════════════════════════════════════
// BADGES (Phase 3)
// ═══════════════════════════════════════════════════════════════════════════════

// GET /gamification/badges?account_id=xxx — All badge definitions
gam.get("/badges", async (c) => {
  const accountId = c.req.query("account_id");
  if (!accountId) return err(c, 400, "account_id is required");

  const { data, error } = await supabase()
    .from("badge_definitions")
    .select("*")
    .eq("account_id", accountId)
    .eq("is_active", true)
    .order("rarity", { ascending: true });

  if (error) return err(c, 500, error.message);
  return c.json({ data });
});

// GET /gamification/badges/:actorId — Awarded badges for an actor (with badge details)
gam.get("/badges/:actorId", async (c) => {
  const actorId = c.req.param("actorId");
  const accountId = c.req.query("account_id");
  if (!accountId) return err(c, 400, "account_id is required");

  const { data, error } = await supabase()
    .from("badge_awards")
    .select("*, badge:badge_definitions(*)")
    .eq("account_id", accountId)
    .eq("actor_id", actorId)
    .order("awarded_at", { ascending: false });

  if (error) return err(c, 500, error.message);
  return c.json({ data });
});

// POST /gamification/badges/check — Evaluate and potentially award a badge
gam.post("/badges/check", async (c) => {
  const body = await c.req.json();
  const { account_id, actor_id, actor_type, badge_slug } = body;

  if (!account_id || !actor_id || !actor_type || !badge_slug) {
    return err(c, 400, "account_id, actor_id, actor_type, and badge_slug are required");
  }

  const db = supabase();
  const result = await checkAndAwardBadge(db, account_id, actor_id, actor_type, badge_slug);
  return c.json({ data: result });
});


// ═══════════════════════════════════════════════════════════════════════════════
// LEADERBOARDS (Phase 4)
// ═══════════════════════════════════════════════════════════════════════════════

// GET /gamification/leaderboard?account_id=xxx&board_type=weekly&actor_type=seeker&limit=20
gam.get("/leaderboard", async (c) => {
  const accountId = c.req.query("account_id");
  if (!accountId) return err(c, 400, "account_id is required");

  const boardType = c.req.query("board_type") || "weekly";
  const actorType = c.req.query("actor_type");
  const limit = parseInt(c.req.query("limit") || "20");

  // Determine current period key
  const now = new Date();
  let periodKey: string;
  if (boardType === "all_time") {
    periodKey = "all_time";
  } else if (boardType === "monthly") {
    periodKey = c.req.query("period") || `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  } else {
    // Weekly — compute ISO week
    periodKey = c.req.query("period") || getISOWeek(now);
  }

  // Recompute leaderboard before returning (ensures fresh data)
  const db = supabase();
  await db.rpc("recompute_leaderboard", {
    p_account_id: accountId,
    p_board_type: boardType,
    p_period_key: periodKey,
    p_actor_type: actorType || null,
  });

  // Fetch ranked entries
  let query = db
    .from("leaderboard_entries")
    .select("*")
    .eq("account_id", accountId)
    .eq("board_type", boardType)
    .eq("period_key", periodKey)
    .order("rank", { ascending: true })
    .limit(limit);

  if (actorType) query = query.eq("actor_type", actorType);

  const { data, error } = await query;
  if (error) return err(c, 500, error.message);
  return c.json({ data, period_key: periodKey });
});


// ═══════════════════════════════════════════════════════════════════════════════
// NOTIFICATIONS (Phase 4)
// ═══════════════════════════════════════════════════════════════════════════════

// GET /gamification/notifications?actor_id=xxx&account_id=xxx — List notifications
gam.get("/notifications", async (c) => {
  const accountId = c.req.query("account_id");
  const actorId = c.req.query("actor_id");
  if (!accountId || !actorId) return err(c, 400, "account_id and actor_id are required");

  const limit = parseInt(c.req.query("limit") || "30");
  const unreadOnly = c.req.query("unread") === "true";

  let query = supabase()
    .from("gamification_notifications")
    .select("*")
    .eq("account_id", accountId)
    .eq("actor_id", actorId)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (unreadOnly) query = query.eq("is_read", false);

  const { data, error } = await query;
  if (error) return err(c, 500, error.message);

  // Also return unread count
  const { count } = await supabase()
    .from("gamification_notifications")
    .select("id", { count: "exact", head: true })
    .eq("account_id", accountId)
    .eq("actor_id", actorId)
    .eq("is_read", false);

  return c.json({ data, unread_count: count || 0 });
});

// PATCH /gamification/notifications/:id/read — Mark single as read
gam.patch("/notifications/:id/read", async (c) => {
  const id = c.req.param("id");

  const { data, error } = await supabase()
    .from("gamification_notifications")
    .update({ is_read: true, read_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single();

  if (error) return err(c, 500, error.message);
  return c.json({ data });
});

// POST /gamification/notifications/read-all — Mark all as read
gam.post("/notifications/read-all", async (c) => {
  const body = await c.req.json();
  const { account_id, actor_id } = body;
  if (!account_id || !actor_id) return err(c, 400, "account_id and actor_id are required");

  const { error } = await supabase()
    .from("gamification_notifications")
    .update({ is_read: true, read_at: new Date().toISOString() })
    .eq("account_id", account_id)
    .eq("actor_id", actor_id)
    .eq("is_read", false);

  if (error) return err(c, 500, error.message);
  return c.json({ data: { status: "ok" } });
});


// ═══════════════════════════════════════════════════════════════════════════════
// ADMIN: Behavior Rules CRUD (Phase 5)
// ═══════════════════════════════════════════════════════════════════════════════

// POST /gamification/admin/rules — Create rule
gam.post("/admin/rules", async (c) => {
  const body = await c.req.json();
  const { account_id, name, trigger_event, actor_type, conditions, actions } = body;
  if (!account_id || !name || !trigger_event) {
    return err(c, 400, "account_id, name, and trigger_event are required");
  }

  const { data, error } = await supabase()
    .from("behavior_rules")
    .insert({
      account_id,
      name,
      description: body.description || "",
      actor_type: actor_type || "both",
      trigger_event,
      conditions: conditions || [],
      actions: actions || [],
      cooldown_seconds: body.cooldown_seconds || null,
      daily_cap: body.daily_cap || null,
      priority: body.priority || 100,
      is_active: body.is_active !== false,
    })
    .select()
    .single();

  if (error) return err(c, 500, error.message);
  return c.json({ data }, 201);
});

// PATCH /gamification/admin/rules/:id — Update rule
gam.patch("/admin/rules/:id", async (c) => {
  const id = c.req.param("id");
  const body = await c.req.json();

  const updates: Record<string, any> = {};
  for (const key of ["name", "description", "actor_type", "trigger_event", "conditions", "actions", "cooldown_seconds", "daily_cap", "priority", "is_active"]) {
    if (body[key] !== undefined) updates[key] = body[key];
  }

  const { data, error } = await supabase()
    .from("behavior_rules")
    .update(updates)
    .eq("id", id)
    .select()
    .single();

  if (error) return err(c, 500, error.message);
  return c.json({ data });
});

// DELETE /gamification/admin/rules/:id — Delete rule
gam.delete("/admin/rules/:id", async (c) => {
  const id = c.req.param("id");
  const { error } = await supabase()
    .from("behavior_rules")
    .delete()
    .eq("id", id);

  if (error) return err(c, 500, error.message);
  return c.json({ data: { deleted: true } });
});


// ═══════════════════════════════════════════════════════════════════════════════
// ADMIN: Badge Definitions CRUD (Phase 5)
// ═══════════════════════════════════════════════════════════════════════════════

// POST /gamification/admin/badges — Create badge
gam.post("/admin/badges", async (c) => {
  const body = await c.req.json();
  const { account_id, slug, name } = body;
  if (!account_id || !slug || !name) {
    return err(c, 400, "account_id, slug, and name are required");
  }

  const { data, error } = await supabase()
    .from("badge_definitions")
    .insert({
      account_id,
      slug,
      name,
      description: body.description || "",
      icon_url: body.icon_url || null,
      category: body.category || "achievement",
      criteria: body.criteria || {},
      rarity: body.rarity || "common",
      xp_reward: body.xp_reward || 0,
      is_active: body.is_active !== false,
    })
    .select()
    .single();

  if (error) return err(c, 500, error.message);
  return c.json({ data }, 201);
});

// PATCH /gamification/admin/badges/:id — Update badge
gam.patch("/admin/badges/:id", async (c) => {
  const id = c.req.param("id");
  const body = await c.req.json();

  const updates: Record<string, any> = {};
  for (const key of ["name", "description", "slug", "icon_url", "category", "criteria", "rarity", "xp_reward", "is_active"]) {
    if (body[key] !== undefined) updates[key] = body[key];
  }

  const { data, error } = await supabase()
    .from("badge_definitions")
    .update(updates)
    .eq("id", id)
    .select()
    .single();

  if (error) return err(c, 500, error.message);
  return c.json({ data });
});

// DELETE /gamification/admin/badges/:id — Delete badge
gam.delete("/admin/badges/:id", async (c) => {
  const id = c.req.param("id");
  const { error } = await supabase()
    .from("badge_definitions")
    .delete()
    .eq("id", id);

  if (error) return err(c, 500, error.message);
  return c.json({ data: { deleted: true } });
});


// ═══════════════════════════════════════════════════════════════════════════════
// ADMIN: Analytics (Phase 5)
// ═══════════════════════════════════════════════════════════════════════════════

// GET /gamification/analytics?account_id=xxx — Full analytics dashboard data
gam.get("/analytics", async (c) => {
  const accountId = c.req.query("account_id");
  if (!accountId) return err(c, 400, "account_id is required");

  const db = supabase();

  const [profilesRes, badgesRes, awardsRes, txRes] = await Promise.all([
    db.from("gamification_profiles").select("actor_type, total_xp, level, tier, current_streak").eq("account_id", accountId),
    db.from("badge_definitions").select("id, slug, name, rarity").eq("account_id", accountId).eq("is_active", true),
    db.from("badge_awards").select("badge_id, actor_id").eq("account_id", accountId),
    db.from("point_transactions").select("actor_id, points, reason, created_at").eq("account_id", accountId),
  ]);

  const profiles = profilesRes.data || [];
  const badges = badgesRes.data || [];
  const awards = awardsRes.data || [];
  const txs = txRes.data || [];

  const seekers = profiles.filter((p: any) => p.actor_type === "seeker");

  // XP distribution (histogram buckets)
  const xpBuckets = [0, 50, 200, 500, 1000, 2000, 5000];
  const xpDistribution = xpBuckets.map((min, i) => {
    const max = xpBuckets[i + 1] || Infinity;
    const label = max === Infinity ? `${min}+` : `${min}-${max}`;
    return { label, count: seekers.filter((s: any) => s.total_xp >= min && s.total_xp < max).length };
  });

  // Badge earning rates
  const totalSeekers = seekers.length || 1;
  const badgeRates = badges.map((b: any) => {
    const earnedCount = awards.filter((a: any) => a.badge_id === b.id).length;
    return { slug: b.slug, name: b.name, rarity: b.rarity, earned: earnedCount, rate: Math.round((earnedCount / totalSeekers) * 100) };
  });

  // Streak distribution
  const streakBuckets = [0, 1, 7, 14, 30, 60];
  const streakDistribution = streakBuckets.map((min, i) => {
    const max = streakBuckets[i + 1] || Infinity;
    const label = max === Infinity ? `${min}+` : `${min}-${max}`;
    return { label, count: profiles.filter((p: any) => p.current_streak >= min && p.current_streak < max).length };
  });

  // Tier distribution
  const tierDistribution = {
    bronze: profiles.filter((p: any) => p.tier === "bronze").length,
    silver: profiles.filter((p: any) => p.tier === "silver").length,
    gold: profiles.filter((p: any) => p.tier === "gold").length,
    platinum: profiles.filter((p: any) => p.tier === "platinum").length,
  };

  // Recent XP activity (last 7 days, grouped by day)
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const recentTxs = txs.filter((t: any) => new Date(t.created_at) >= sevenDaysAgo);
  const dailyXp: Record<string, number> = {};
  recentTxs.forEach((t: any) => {
    const day = t.created_at.slice(0, 10);
    dailyXp[day] = (dailyXp[day] || 0) + t.points;
  });
  const xpTimeline = Object.entries(dailyXp)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, xp]) => ({ date, xp }));

  return c.json({
    data: {
      xp_distribution: xpDistribution,
      badge_rates: badgeRates,
      streak_distribution: streakDistribution,
      tier_distribution: tierDistribution,
      xp_timeline: xpTimeline,
      totals: {
        profiles: profiles.length,
        seekers: seekers.length,
        mentors: profiles.length - seekers.length,
        badges_defined: badges.length,
        badges_awarded: awards.length,
        total_xp: txs.reduce((s: number, t: any) => s + t.points, 0),
      },
    },
  });
});


// ═══════════════════════════════════════════════════════════════════════════════
// STATS
// ═══════════════════════════════════════════════════════════════════════════════

// GET /gamification/stats?account_id=xxx — Summary stats
gam.get("/stats", async (c) => {
  const accountId = c.req.query("account_id");
  if (!accountId) return err(c, 400, "account_id is required");

  const db = supabase();

  const [profilesRes, txRes] = await Promise.all([
    db.from("gamification_profiles").select("actor_type, total_xp, level, tier, current_streak").eq("account_id", accountId),
    db.from("point_transactions").select("points").eq("account_id", accountId),
  ]);

  if (profilesRes.error) return err(c, 500, profilesRes.error.message);

  const profiles = profilesRes.data || [];
  const seekers = profiles.filter((p: any) => p.actor_type === "seeker");
  const mentors = profiles.filter((p: any) => p.actor_type === "mentor");

  return c.json({
    data: {
      total_profiles: profiles.length,
      seekers: seekers.length,
      mentors: mentors.length,
      total_xp_awarded: (txRes.data || []).reduce((s: number, t: any) => s + t.points, 0),
      avg_seeker_xp: seekers.length > 0 ? Math.round(seekers.reduce((s: number, p: any) => s + p.total_xp, 0) / seekers.length) : 0,
      avg_mentor_xp: mentors.length > 0 ? Math.round(mentors.reduce((s: number, p: any) => s + p.total_xp, 0) / mentors.length) : 0,
      avg_streak: profiles.length > 0 ? Math.round(profiles.reduce((s: number, p: any) => s + p.current_streak, 0) / profiles.length) : 0,
      tier_distribution: {
        bronze: profiles.filter((p: any) => p.tier === "bronze").length,
        silver: profiles.filter((p: any) => p.tier === "silver").length,
        gold: profiles.filter((p: any) => p.tier === "gold").length,
        platinum: profiles.filter((p: any) => p.tier === "platinum").length,
      },
    },
  });
});


// ─── Helper functions ────────────────────────────────────────────────────────

function getISOWeek(d: Date): string {
  const date = new Date(d.getTime());
  date.setHours(0, 0, 0, 0);
  date.setDate(date.getDate() + 3 - ((date.getDay() + 6) % 7));
  const week1 = new Date(date.getFullYear(), 0, 4);
  const weekNum = 1 + Math.round(((date.getTime() - week1.getTime()) / 86400000 - 3 + ((week1.getDay() + 6) % 7)) / 7);
  return `${date.getFullYear()}-W${String(weekNum).padStart(2, "0")}`;
}

function getNestedField(obj: any, path: string): any {
  return path.split(".").reduce((o, k) => o?.[k], obj);
}

function evaluateCondition(fieldValue: any, op: string, expected: any): boolean {
  switch (op) {
    case "eq":       return fieldValue === expected;
    case "ne":       return fieldValue !== expected;
    case "gt":       return typeof fieldValue === "number" && fieldValue > expected;
    case "gte":      return typeof fieldValue === "number" && fieldValue >= expected;
    case "lt":       return typeof fieldValue === "number" && fieldValue < expected;
    case "lte":      return typeof fieldValue === "number" && fieldValue <= expected;
    case "in":       return Array.isArray(expected) && expected.includes(fieldValue);
    case "contains": return typeof fieldValue === "string" && fieldValue.includes(expected);
    case "exists":   return expected ? fieldValue !== undefined && fieldValue !== null : fieldValue === undefined || fieldValue === null;
    default:         return false;
  }
}

async function executeAction(
  db: any,
  action: any,
  ctx: { account_id: string; actor_id: string; actor_type: string; rule_id: string; source_event_id: string; event_data: any }
): Promise<any> {
  switch (action.type) {
    case "award_xp": {
      const { data, error } = await db.rpc("award_xp", {
        p_account_id: ctx.account_id,
        p_actor_id: ctx.actor_id,
        p_actor_type: ctx.actor_type,
        p_points: action.points || 0,
        p_reason: ctx.event_data.event_type || "rule_triggered",
        p_source_event_id: ctx.source_event_id,
        p_rule_id: ctx.rule_id,
        p_metadata: { rule_action: action },
      });
      if (error) throw new Error(error.message);
      return data?.[0] || data;
    }

    case "update_streak": {
      const { data, error } = await db.rpc("update_streak", {
        p_account_id: ctx.account_id,
        p_actor_id: ctx.actor_id,
        p_actor_type: ctx.actor_type,
      });
      if (error) throw new Error(error.message);
      return data?.[0] || data;
    }

    case "check_badge": {
      const result = await checkAndAwardBadge(
        db,
        ctx.account_id,
        ctx.actor_id,
        ctx.actor_type,
        action.badge_slug
      );
      return result;
    }

    case "send_notification": {
      // Phase 4 — return placeholder for now
      return { template: action.template, status: "deferred_to_phase_4" };
    }

    case "advance_journey": {
      // Already handled in Phase 1
      return { journey_type: action.journey_type, status: "deferred" };
    }

    case "enroll_automation": {
      // Phase 6 — return placeholder
      return { automation_id: action.automation_id, status: "deferred_to_phase_6" };
    }

    default:
      return { status: "unknown_action_type" };
  }
}


// ─── Badge evaluation ───────────────────────────────────────────────────────

async function checkAndAwardBadge(
  db: any,
  accountId: string,
  actorId: string,
  actorType: string,
  badgeSlug: string
): Promise<any> {
  // 1. Find the badge definition
  const { data: badge, error: badgeErr } = await db
    .from("badge_definitions")
    .select("*")
    .eq("account_id", accountId)
    .eq("slug", badgeSlug)
    .eq("is_active", true)
    .maybeSingle();

  if (badgeErr) throw new Error(badgeErr.message);
  if (!badge) return { badge_slug: badgeSlug, status: "badge_not_found" };

  // 2. Check if already awarded
  const { data: existing } = await db
    .from("badge_awards")
    .select("id")
    .eq("actor_id", actorId)
    .eq("badge_id", badge.id)
    .maybeSingle();

  if (existing) return { badge_slug: badgeSlug, status: "already_awarded" };

  // 3. Evaluate criteria
  const met = await evaluateBadgeCriteria(db, accountId, actorId, actorType, badge.criteria);
  if (!met) return { badge_slug: badgeSlug, status: "criteria_not_met" };

  // 4. Award the badge (uses the SQL function which also awards bonus XP)
  const { data: awardResult, error: awardErr } = await db.rpc("award_badge", {
    p_account_id: accountId,
    p_actor_id: actorId,
    p_actor_type: actorType,
    p_badge_id: badge.id,
  });

  if (awardErr) throw new Error(awardErr.message);

  const result = awardResult?.[0] || awardResult;
  return {
    badge_slug: badgeSlug,
    badge_name: badge.name,
    rarity: badge.rarity,
    xp_reward: badge.xp_reward,
    status: result?.awarded ? "awarded" : "not_awarded",
    award_id: result?.award_id,
  };
}

async function evaluateBadgeCriteria(
  db: any,
  accountId: string,
  actorId: string,
  actorType: string,
  criteria: any
): Promise<boolean> {
  if (!criteria || !criteria.type) return false;

  switch (criteria.type) {
    case "threshold": {
      // Check if a profile field meets a threshold
      const { data: profile } = await db
        .from("gamification_profiles")
        .select(criteria.field)
        .eq("account_id", accountId)
        .eq("actor_id", actorId)
        .maybeSingle();

      if (!profile) return false;
      return (profile[criteria.field] || 0) >= criteria.value;
    }

    case "event_count": {
      // Count transactions with a specific reason
      const { data: txs, error } = await db
        .from("point_transactions")
        .select("id")
        .eq("account_id", accountId)
        .eq("actor_id", actorId)
        .eq("reason", criteria.event_type);

      if (error) return false;
      return (txs || []).length >= criteria.count;
    }

    case "streak": {
      const { data: profile } = await db
        .from("gamification_profiles")
        .select("current_streak")
        .eq("account_id", accountId)
        .eq("actor_id", actorId)
        .maybeSingle();

      if (!profile) return false;
      return (profile.current_streak || 0) >= criteria.min_days;
    }

    case "milestone": {
      // Check if a specific milestone is completed
      const { data: entries } = await db
        .from("milestone_entries")
        .select("id, state, contact_milestones!inner(contact_id)")
        .eq("contact_milestones.contact_id", actorId)
        .eq("key", criteria.milestone_type)
        .eq("state", "done");

      return (entries || []).length > 0;
    }

    case "journey": {
      // Check if any faith journey is completed (stage = 'Decision')
      let query = db
        .from("faith_journeys")
        .select("id")
        .eq("contact_id", actorId)
        .eq("stage", "Decision");

      if (criteria.journey_type && criteria.journey_type !== "any") {
        query = query.eq("type", criteria.journey_type);
      }

      const { data: journeys } = await query;
      return (journeys || []).length > 0;
    }

    case "compound": {
      // All sub-criteria must be met
      if (!Array.isArray(criteria.all)) return false;
      for (const sub of criteria.all) {
        const met = await evaluateBadgeCriteria(db, accountId, actorId, actorType, sub);
        if (!met) return false;
      }
      return true;
    }

    default:
      return false;
  }
}


export default gam;
