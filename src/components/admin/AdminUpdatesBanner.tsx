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
      <div className="mx-auto max-w-screen-xl px-3 sm:px-4 py-2.5">
        {/* Top row: icon + content */}
        <div className="flex items-start gap-2 sm:gap-3">
          <Sparkles className="h-4 w-4 text-primary mt-1 shrink-0" />
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1 mb-1">
              <Badge className={`${style.className} shrink-0 text-[10px] px-1.5 py-0`}>
                {style.label}
              </Badge>
              <span className="text-sm font-semibold break-words">{current.title}</span>
              <span className="text-[11px] text-muted-foreground">· {current.date}</span>
            </div>
            <p className="text-xs sm:text-sm text-muted-foreground line-clamp-3 sm:line-clamp-none">
              {current.description}
            </p>
          </div>
          {/* Desktop-only X */}
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 shrink-0 hidden sm:inline-flex"
            onClick={dismissAll}
            aria-label="Mind elrejtése"
            title="Mind elrejtése"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Bottom action row — pager + buttons, wraps neatly on mobile */}
        <div className="flex items-center justify-between gap-2 mt-2 pl-6">
          <div className="flex items-center gap-1">
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
                <span className="text-[11px] text-muted-foreground tabular-nums">
                  {index + 1} / {visible.length}
                </span>
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
          </div>
          <div className="flex items-center gap-1">
            <Button variant="outline" size="sm" className="h-7 px-2 text-xs" onClick={dismissOne}>
              Megtekintve
            </Button>
            {/* Mobile-only X here so it stays reachable */}
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 sm:hidden"
              onClick={dismissAll}
              aria-label="Mind elrejtése"
              title="Mind elrejtése"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

