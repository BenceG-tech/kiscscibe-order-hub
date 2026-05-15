// Shared authentication helpers for edge functions
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";

export interface AuthFailure {
  ok: false;
  response: Response;
}

export interface AuthSuccess {
  ok: true;
  userId: string;
}

/**
 * Require the caller to be an authenticated admin or owner.
 * On failure returns a Response (401/403); on success returns userId.
 */
export async function requireAdmin(
  req: Request,
  corsHeaders: Record<string, string>,
  opts: { allowStaff?: boolean } = {},
): Promise<AuthFailure | AuthSuccess> {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    console.warn("[auth] missing Bearer header");
    return {
      ok: false,
      response: new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }),
    };
  }

  const url = Deno.env.get("SUPABASE_URL")!;
  const service = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const token = authHeader.replace(/^Bearer\s+/i, "");

  // Use the service-role client to validate the token. This avoids edge cases
  // where the anon key is shorter-lived under the signing-keys system.
  const admin = createClient(url, service);
  const { data: userData, error: userErr } = await admin.auth.getUser(token);
  if (userErr || !userData?.user) {
    console.warn("[auth] getUser failed:", userErr?.message);
    return {
      ok: false,
      response: new Response(JSON.stringify({ error: "Invalid token" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }),
    };
  }

  const rpcName = opts.allowStaff ? "is_admin_or_staff" : "is_admin";
  const argName = opts.allowStaff ? "_user_id" : "check_user_id";
  const { data: ok, error: rpcErr } = await admin.rpc(
    rpcName as any,
    { [argName]: userData.user.id } as any,
  );
  if (rpcErr) {
    console.warn(`[auth] ${rpcName} rpc error:`, rpcErr.message);
  }
  if (!ok) {
    return {
      ok: false,
      response: new Response(JSON.stringify({ error: "Forbidden" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }),
    };
  }

  return { ok: true, userId: userData.user.id };
}

/**
 * Internal-call check: caller must present X-Internal-Secret matching the
 * service role key. Edge-function-to-edge-function calls supply this header.
 */
export function hasInternalSecret(req: Request): boolean {
  const provided = req.headers.get("x-internal-secret");
  const expected = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  return !!provided && !!expected && provided === expected;
}

export function requireInternalSecret(
  req: Request,
  corsHeaders: Record<string, string>,
): AuthFailure | { ok: true } {
  if (!hasInternalSecret(req)) {
    return {
      ok: false,
      response: new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }),
    };
  }
  return { ok: true };
}

/** Allow either admin auth OR internal secret (for cron/scheduled callers). */
export async function requireAdminOrInternal(
  req: Request,
  corsHeaders: Record<string, string>,
): Promise<AuthFailure | { ok: true }> {
  if (hasInternalSecret(req)) return { ok: true };
  const auth = await requireAdmin(req, corsHeaders);
  if (!auth.ok) return auth;
  return { ok: true };
}
