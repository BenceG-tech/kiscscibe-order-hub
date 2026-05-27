import { Button } from "@/components/ui/button";
import { History, X } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { hu } from "date-fns/locale";

interface Props {
  savedAt: number;
  onRestore: () => void;
  onDiscard: () => void;
}

export function DraftRestoreBanner({ savedAt, onRestore, onDiscard }: Props) {
  return (
    <div className="flex items-center justify-between gap-2 rounded-md border border-amber-500/40 bg-amber-50 dark:bg-amber-950/30 px-3 py-2 text-sm">
      <div className="flex items-center gap-2 min-w-0">
        <History className="h-4 w-4 text-amber-600 shrink-0" />
        <span className="truncate">
          Mentetlen piszkozat{" "}
          <span className="text-muted-foreground">
            ({formatDistanceToNow(savedAt, { addSuffix: true, locale: hu })})
          </span>
        </span>
      </div>
      <div className="flex items-center gap-1 shrink-0">
        <Button size="sm" variant="default" onClick={onRestore} className="h-7 text-xs">
          Folytatás
        </Button>
        <Button size="sm" variant="ghost" onClick={onDiscard} className="h-7 w-7 p-0">
          <X className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  );
}

interface IndicatorProps {
  lastSavedAt: number | null;
}

export function DraftSavedIndicator({ lastSavedAt }: IndicatorProps) {
  if (!lastSavedAt) return null;
  return (
    <span className="text-[11px] text-muted-foreground">
      Piszkozat mentve {formatDistanceToNow(lastSavedAt, { addSuffix: true, locale: hu })}
    </span>
  );
}
