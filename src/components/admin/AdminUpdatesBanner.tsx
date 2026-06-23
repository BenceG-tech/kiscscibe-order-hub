import { useEffect, useMemo, useState } from "react";
import { CHANGELOG, type ChangelogEntry } from "@/data/adminChangelog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ChevronDown, ChevronLeft, ChevronRight, Sparkles, X } from "lucide-react";
import { toast } from "sonner";

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
  const [expanded, setExpanded] = useState(false);

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

  useEffect(() => {
    if (index >= visible.length) setIndex(0);
  }, [visible.length, index]);

  if (Date.now() < allDismissedUntil) return null;
  if (visible.length === 0) return null;

  const current = visible[index] ?? visible[0];
  const style = typeStyle(current.type);

  const persist = (next: string[]) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {
      /* ignore */
    }
  };

  const dismissOne = () => {
    const id = entryId(current);
    const prev = dismissed;
    const next = [...prev, id];
    setDismissed(next);
    persist(next);
    setExpanded(false);
    toast("Frissítés elrejtve", {
      description: "Csak ezen az eszközön nincs többé látható.",
      action: {
        label: "Visszavonás",
        onClick: () => {
          const restored = prev.filter((x) => x !== id);
          setDismissed(restored);
          persist(restored);
        },
      },
    });
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
      <div className="mx-auto max-w-screen-xl px-3 sm:px-4">
        {/* Compact bar — single row, ~36px */}
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="w-full flex items-center gap-2 py-1.5 text-left"
          aria-expanded={expanded}
        >
          <Sparkles className="h-3.5 w-3.5 text-primary shrink-0" />
          <Badge className={`${style.className} shrink-0 text-[10px] px-1.5 py-0 h-4`}>
            {style.label}
          </Badge>
          <span className="text-xs sm:text-sm font-medium truncate flex-1 min-w-0">
            {current.title}
          </span>
          {visible.length > 1 && (
            <span className="text-[11px] text-muted-foreground tabular-nums shrink-0">
              {index + 1}/{visible.length}
            </span>
          )}
          <ChevronDown
            className={`h-4 w-4 text-muted-foreground shrink-0 transition-transform ${expanded ? "rotate-180" : ""}`}
          />
          <span
            role="button"
            tabIndex={0}
            onClick={(e) => {
              e.stopPropagation();
              dismissAll();
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                e.stopPropagation();
                dismissAll();
              }
            }}
            aria-label="Sáv elrejtése"
            title="Sáv elrejtése"
            className="h-6 w-6 inline-flex items-center justify-center rounded-md hover:bg-muted shrink-0"
          >
            <X className="h-3.5 w-3.5" />
          </span>
        </button>

        {/* Expanded panel */}
        {expanded && (
          <div className="pb-3 pl-6 pr-1 space-y-2">
            <div className="text-[11px] text-muted-foreground">{current.date}</div>
            <p className="text-sm text-foreground whitespace-pre-wrap break-words">
              {current.description}
            </p>
            <div className="flex items-center justify-between gap-2 pt-1">
              <div className="flex items-center gap-1">
                {visible.length > 1 && (
                  <>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() =>
                        setIndex((i) => (i - 1 + visible.length) % visible.length)
                      }
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
              </div>
              <Button
                variant="outline"
                size="sm"
                className="h-7 px-2 text-xs"
                onClick={dismissOne}
              >
                Megtekintve
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
