// Shared CORS configuration for all edge functions
// Only allow requests from known origins

const ALLOWED_ORIGINS = [
  "https://kiscscibe-order-hub.lovable.app",
  "https://id-preview--98ed56c3-1480-48d1-93ba-37af09bab92a.lovable.app",
  // Development
  "http://localhost:5173",
  "http://localhost:3000",
  "http://localhost:8080",
];

export function getCorsHeaders(req: Request): Record<string, string> {
  const origin = req.headers.get("Origin") || "";
  const isAllowed = ALLOWED_ORIGINS.some((allowed) =>
    origin === allowed || origin.endsWith(".lovable.app")
  );

  return {
    "Access-Control-Allow-Origin": isAllowed ? origin : ALLOWED_ORIGINS[0],
    "Access-Control-Allow-Headers":
      "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
  };
}

export function handleCorsPreflightRequest(req: Request): Response | null {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: getCorsHeaders(req) });
  }
  return null;
}
