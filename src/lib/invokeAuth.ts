import { supabase } from "@/integrations/supabase/client";

/**
 * Invoke an edge function with the current user's session JWT explicitly attached
 * as the Authorization header. This avoids cases where supabase.functions.invoke
 * sends the anon key instead of the user's access token (which causes admin-only
 * edge functions to return 401 Unauthorized).
 */
export async function invokeWithAuth<T = any>(
  name: string,
  body?: unknown,
): Promise<{ data: T | null; error: Error | null }> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.access_token) {
    return {
      data: null,
      error: new Error("Be kell jelentkezned a művelethez."),
    };
  }
  const { data, error } = await supabase.functions.invoke<T>(name, {
    body: body as any,
    headers: { Authorization: `Bearer ${session.access_token}` },
  });
  return { data: data ?? null, error: error ?? null };
}
