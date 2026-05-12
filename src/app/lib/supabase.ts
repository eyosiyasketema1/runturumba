// ============================================================================
// Supabase Client — shared instance for the web app
// ============================================================================

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || "";
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || "";

// Base URL for the Hono edge function server
const API_BASE = `${SUPABASE_URL}/functions/v1/server/make-server-161cb90c`;

interface ApiOptions {
  method?: string;
  body?: any;
  params?: Record<string, string>;
}

/**
 * Generic API caller for Supabase edge functions
 */
export async function api<T = any>(
  path: string,
  options: ApiOptions = {}
): Promise<{ data: T | null; error: string | null }> {
  const { method = "GET", body, params } = options;

  let url = `${API_BASE}${path}`;
  if (params) {
    const searchParams = new URLSearchParams(params);
    url += `?${searchParams.toString()}`;
  }

  try {
    const res = await fetch(url, {
      method,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      },
      body: body ? JSON.stringify(body) : undefined,
    });

    const json = await res.json();

    if (!res.ok) {
      return { data: null, error: json.error || `HTTP ${res.status}` };
    }

    return { data: json.data, error: null };
  } catch (err: any) {
    return { data: null, error: err.message || "Network error" };
  }
}

/**
 * Check if Supabase is configured
 */
export function isSupabaseConfigured(): boolean {
  return Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);
}
