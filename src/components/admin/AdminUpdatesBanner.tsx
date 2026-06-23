import { useEffect, useMemo, useState } from "react";
import { CHANGELOG, type ChangelogEntry } from "@/data/adminChangelog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ChevronLeft, ChevronRight, Sparkles, X } from "lucide-react";

const STORAGE_KEY = "admin_updates_dismissed_v1";
const STORAGE_ALL_KEY = "admin_updates_all_dismissed_until";
const DAYS_VISIBLE = 7;

function loadDismissed(): string[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function entryId(e: ChangelogEntry): string {
  return `${e.date}|${e.title}`;
}

const typeStyle = (t: string) => {
  switch (t) {
    case "new":
      return { label: "ÚJ", className: "bg-emerald-600 text-white" };
    case "improved":
      return { label: "FEJLESZTÉS", className: "bg-blue-600 text-white" };
    case "fixed":
      return { label: "JAVÍTÁS", className: "bg-amber-500 text-white" };
    default:
      return { label: "FRISSÍTÉS", className: "bg-primary text-primary-foreground" };
  }
};

export const AdminUpdatesBanner = () => {
  const [dismissed, setDismissed] = useState<string[]>([]);
  const [allDismissedUntil, setAllDismissedUntil] = useState<number>(0);
  const [index, setIndex] = useState(0);

  useEffect(() => {
    setDismissed(loadDismissed());
    try {
      const v = localStorage.getItem(STORAGE_ALL_KEY);
      setAllDismissedUntil(v ? parseInt(v, 10) || 0 : 0);
    } catch {
      /* ignore */
    }
  }, []);

  const visible = useMemo(() => {
    const cutoff = Date.now() - DAYS_VISIBLE * 24 * 60 * 60 * 1000;
    return CHANGELOG.filter((e) => {
      const ts = new Date(e.date).getTime();
      if (Number.isNaN(ts) || ts < cutoff) return false;
      if (dismissed.includes(entryId(e))) return false;
      return true;
    });
  }, [dismissed]);

  // Reset index if it points past the list
  useEffect(() => {
    if (index >= visible.length) setIndex(0);
  }, [visible.length, index]);

  if (Date.now() < allDismissedUntil) return null;
  if (visible.length === 0) return null;

  const current = visible[index] ?? visible[0];
  const style = typeStyle(current.type);

  const dismissOne = () => {
    const next = [...dismissed, entryId(current)];
    setDismissed(next);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {
      /* ignore */
    }
  };

  const dismissAll = () => {
    const until = Date.now() + DAYS_VISIBLE * 24 * 60 * 60 * 1000;
    setAllDismissedUntil(until);
    try {
      localStorage.setItem(STORAGE_ALL_KEY, String(until));
    } catch {
      /* ignore */
    }
  };

  return (
    <div className="border-b bg-primary/10">
      <div className="mx-auto max-w-screen-xl px-3 sm:px-4 py-2.5 flex items-start gap-3">
        <Sparkles className="h-4 w-4 text-primary mt-1 shrink-0" />
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <Badge className={style.className}>{style.label}</Badge>
            <span className="text-sm font-semibold truncate">{current.title}</span>
            <span className="text-xs text-muted-foreground">· {current.date}</span>
            {visible.length > 1 && (
              <span className="text-xs text-muted-foreground ml-auto">
                {index + 1} / {visible.length}
              </span>
            )}
          </div>
          <p className="text-xs sm:text-sm text-muted-foreground line-clamp-2 sm:line-clamp-none">
            {current.description}
          </p>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          {visible.length > 1 && (
            <>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={() => setIndex((i) => (i - 1 + visible.length) % visible.length)}
                aria-label="Előző"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={() => setIndex((i) => (i + 1) % visible.length)}
                aria-label="Következő"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </>
          )}
          <Button variant="outline" size="sm" className="h-7 px-2 text-xs" onClick={dismissOne}>
            Megtekintve
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={dismissAll}
            aria-label="Mind elrejtése"
            title="Mind elrejtése"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};
