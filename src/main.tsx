import { createRoot } from "react-dom/client";
import { HelmetProvider } from "react-helmet-async";
import App from "./App.tsx";
import "./index.css";

// ── Stale-chunk auto-recovery ──────────────────────────────────────────────
// After a new deploy, tabs that loaded the previous build try to fetch lazy
// chunks whose hashed filenames no longer exist and throw
// "Importing a module script failed" / "Failed to fetch dynamically imported
// module". Reload once with a cache-bust query so the browser fetches the new
// index.html + new asset manifest. A sessionStorage flag prevents infinite
// reload loops if the real problem is not stale chunks.
const STALE_CHUNK_FLAG = "__stale_chunk_reload__";
const STALE_PATTERNS = [
  "Importing a module script failed",
  "Failed to fetch dynamically imported module",
  "error loading dynamically imported module",
  "ChunkLoadError",
];

const looksLikeStaleChunk = (msg: unknown): boolean => {
  if (typeof msg !== "string") return false;
  return STALE_PATTERNS.some((p) => msg.includes(p));
};

const recoverFromStaleChunk = () => {
  try {
    if (sessionStorage.getItem(STALE_CHUNK_FLAG) === "1") return;
    sessionStorage.setItem(STALE_CHUNK_FLAG, "1");
  } catch { /* private mode — proceed anyway */ }
  const url = new URL(window.location.href);
  url.searchParams.set("_r", Date.now().toString());
  window.location.replace(url.toString());
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

// Clear the flag once the fresh build has successfully loaded.
window.addEventListener("load", () => {
  try { sessionStorage.removeItem(STALE_CHUNK_FLAG); } catch { /* ignore */ }
});

createRoot(document.getElementById("root")!).render(
  <HelmetProvider>
    <App />
  </HelmetProvider>
);
