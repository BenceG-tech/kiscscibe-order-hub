import { createRoot } from "react-dom/client";
import { HelmetProvider } from "react-helmet-async";
import App from "./App.tsx";
import "./index.css";

// ── Stale-chunk auto-recovery ──────────────────────────────────────────────
// After a new deploy, tabs that loaded the previous build try to fetch lazy
// chunks whose hashed filenames no longer exist and throw
// "Importing a module script failed" / "Failed to fetch dynamically imported
// module". Reload with a cache-bust query so the browser fetches the new
// index.html + new asset manifest. Up to MAX_ATTEMPTS reloads with growing
// backoff; the counter clears once the app mounts successfully. If all
// attempts fail, show a branded fallback message with a manual reload button
// instead of leaving a white screen.
const STALE_COUNT_KEY = "__stale_chunk_reload_count__";
const STALE_LAST_KEY = "__stale_chunk_reload_at__";
const MAX_ATTEMPTS = 3;
const BACKOFF_MS = [0, 2_000, 5_000];
const STALE_PATTERNS = [
  "Importing a module script failed",
  "Failed to fetch dynamically imported module",
  "error loading dynamically imported module",
  "ChunkLoadError",
  "not a valid JavaScript MIME type",
  "Expected a JavaScript-or-Wasm module script",
  "Unable to preload CSS",
];

const looksLikeStaleChunk = (msg: unknown): boolean => {
  if (typeof msg !== "string") return false;
  return STALE_PATTERNS.some((p) => msg.includes(p));
};

const readCount = (): number => {
  try {
    return Number(sessionStorage.getItem(STALE_COUNT_KEY) ?? "0");
  } catch {
    return 0;
  }
};

const showFallback = () => {
  const root = document.getElementById("root");
  const target = root ?? document.body;
  target.innerHTML = `
    <div style="min-height:100dvh;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:16px;background:#1F2A41;color:#FFF8E6;font-family:system-ui,sans-serif;text-align:center;padding:24px;">
      <div style="font-size:20px;font-weight:600;">Az oldal frissült</div>
      <div style="font-size:15px;opacity:0.8;max-width:320px;">Kérjük, töltsd újra az oldalt a legújabb verzió megtekintéséhez.</div>
      <button id="stale-reload-btn" style="margin-top:8px;padding:12px 28px;border:none;border-radius:9999px;background:#F6C22D;color:#1F2A41;font-size:16px;font-weight:700;cursor:pointer;">Oldal újratöltése</button>
    </div>`;
  document.getElementById("stale-reload-btn")?.addEventListener("click", () => {
    try {
      sessionStorage.removeItem(STALE_COUNT_KEY);
      sessionStorage.removeItem(STALE_LAST_KEY);
    } catch { /* ignore */ }
    window.location.reload();
  });
};

const recoverFromStaleChunk = () => {
  const count = readCount();
  if (count >= MAX_ATTEMPTS) {
    showFallback();
    return;
  }
  try {
    sessionStorage.setItem(STALE_COUNT_KEY, String(count + 1));
    sessionStorage.setItem(STALE_LAST_KEY, Date.now().toString());
  } catch { /* private mode — proceed anyway */ }
  const delay = BACKOFF_MS[Math.min(count, BACKOFF_MS.length - 1)];
  window.setTimeout(() => {
    const url = new URL(window.location.href);
    url.searchParams.set("_r", Date.now().toString());
    window.location.replace(url.toString());
  }, delay);
};

window.addEventListener("vite:preloadError", (event) => {
  event.preventDefault();
  recoverFromStaleChunk();
});

window.addEventListener("error", (event) => {
  if (looksLikeStaleChunk(event.message) || looksLikeStaleChunk((event.error as Error | undefined)?.message)) {
    recoverFromStaleChunk();
  }
});

window.addEventListener("unhandledrejection", (event) => {
  const reason = event.reason;
  const msg = typeof reason === "string" ? reason : (reason as Error | undefined)?.message;
  if (looksLikeStaleChunk(msg)) {
    recoverFromStaleChunk();
  }
});

const rootElement = document.getElementById("root");

if (!rootElement) {
  document.body.textContent = "Az oldal nem tölthető be. Kérjük, frissítse az oldalt.";
} else {
  createRoot(rootElement).render(
    <HelmetProvider>
      <App />
    </HelmetProvider>,
  );
  // App mounted successfully — clear the recovery counter so a future
  // deploy starts fresh.
  try {
    sessionStorage.removeItem(STALE_COUNT_KEY);
    sessionStorage.removeItem(STALE_LAST_KEY);
  } catch { /* ignore */ }
}
