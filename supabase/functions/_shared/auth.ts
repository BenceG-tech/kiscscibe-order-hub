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
    return {
      ok: false,
      response: new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }),
    };
  }

  const url = Deno.env.get("SUPABASE_URL")!;
  const anon = Deno.env.get("SUPABASE_ANON_KEY")!;
  const service = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

  const userClient = createClient(url, anon, {
    global: { headers: { Authorization: authHeader } },
  });

  const { data: userData, error: userErr } = await userClient.auth.getUser();
  if (userErr || !userData?.user) {
    return {
      ok: false,
      response: new Response(JSON.stringify({ error: "Invalid token" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }),
    };
  }

  const admin = createClient(url, service);
  const rpcName = opts.allowStaff ? "is_admin_or_staff" : "is_admin";
  const argName = opts.allowStaff ? "_user_id" : "check_user_id";
  const { data: ok } = await admin.rpc(rpcName as any, { [argName]: userData.user.id } as any);
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
export function requireInternalSecret(
  req: Request,
  corsHeaders: Record<string, string>,
): AuthFailure | { ok: true } {
  const provided = req.headers.get("x-internal-secret");
  const expected = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!provided || !expected || provided !== expected) {
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
