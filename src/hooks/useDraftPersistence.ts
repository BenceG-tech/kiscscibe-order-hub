import { useEffect, useRef, useState } from "react";

const TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days
const DEBOUNCE_MS = 500;

interface StoredDraft<T> {
  data: T;
  savedAt: number;
}

interface Options<T> {
  /** localStorage key */
  key: string;
  /** Current form values to persist */
  value: T;
  /** Whether the form is "dirty" (worth saving). Defaults to true. */
  enabled?: boolean;
  /** Callback to restore a saved draft into form state */
  onRestore: (data: T) => void;
  /** Whether this is a new record (drafts only loaded for new) */
  isNew: boolean;
  /** When the wrapping dialog is open (only run effects when open) */
  open: boolean;
}

export function useDraftPersistence<T>({
  key,
  value,
  enabled = true,
  onRestore,
  isNew,
  open,
}: Options<T>) {
  const [hasDraft, setHasDraft] = useState<{ savedAt: number } | null>(null);
  const [lastSavedAt, setLastSavedAt] = useState<number | null>(null);
  const [dismissed, setDismissed] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const initialCheckRef = useRef(false);

  // Check for existing draft on open
  useEffect(() => {
    if (!open || !isNew) {
      initialCheckRef.current = false;
      setHasDraft(null);
      setDismissed(false);
      setLastSavedAt(null);
      return;
    }
    if (initialCheckRef.current) return;
    initialCheckRef.current = true;
    try {
      const raw = localStorage.getItem(key);
      if (!raw) return;
      const parsed = JSON.parse(raw) as StoredDraft<T>;
      if (!parsed?.savedAt || Date.now() - parsed.savedAt > TTL_MS) {
        localStorage.removeItem(key);
        return;
      }
      setHasDraft({ savedAt: parsed.savedAt });
    } catch {
      // ignore
    }
  }, [open, isNew, key]);

  // Debounced save on value change
  useEffect(() => {
    if (!open || !isNew || !enabled || dismissed) return;
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      try {
        const payload: StoredDraft<T> = { data: value, savedAt: Date.now() };
        localStorage.setItem(key, JSON.stringify(payload));
        setLastSavedAt(payload.savedAt);
      } catch {
        // quota errors etc — ignore silently
      }
    }, DEBOUNCE_MS);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [value, open, isNew, enabled, dismissed, key]);

  const restore = () => {
    try {
      const raw = localStorage.getItem(key);
      if (!raw) return;
      const parsed = JSON.parse(raw) as StoredDraft<T>;
      onRestore(parsed.data);
      setHasDraft(null);
    } catch {
      // ignore
    }
  };

  const discard = () => {
    localStorage.removeItem(key);
    setHasDraft(null);
    setDismissed(true);
  };

  const clear = () => {
    localStorage.removeItem(key);
    setHasDraft(null);
    setLastSavedAt(null);
  };

  return { hasDraft, lastSavedAt, restore, discard, clear };
}
