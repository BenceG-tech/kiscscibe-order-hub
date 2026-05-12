import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ImageIcon, Loader2 } from "lucide-react";
import { toast } from "sonner";

export interface DuplicateCandidate {
  id: string;
  name: string;
  category_id: string | null;
  price_huf: number | null;
  image_url: string | null;
  description: string | null;
  allergens: string[] | null;
  is_active: boolean;
  is_temporary?: boolean;
  is_always_available?: boolean;
}

export interface NewItemDraft {
  name: string;
  category_id: string | null;
  price_huf: number;
  image_url: string | null;
  description: string | null;
  allergens: string[];
  is_active: boolean;
  is_temporary?: boolean;
  is_always_available?: boolean;
}

interface Props {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  duplicates: DuplicateCandidate[];
  draft: NewItemDraft;
  /** Save (the current edit) without touching the duplicate(s). */
  onKeepBoth: () => void;
  /** Delete or archive the selected duplicate, then save current edit. */
  onReplaceExisting: (duplicateId: string) => void;
  /** Cancel — keep existing as is, do not save the new edit. */
  onKeepExisting: () => void;
  saving?: boolean;
}

export default function DuplicateResolverDialog({
  open,
  onOpenChange,
  duplicates,
  draft,
  onKeepBoth,
  onReplaceExisting,
  onKeepExisting,
  saving,
}: Props) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [categoryNames, setCategoryNames] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!open) return;
    setActiveIndex(0);
    (async () => {
      const ids = Array.from(
        new Set(
          [draft.category_id, ...duplicates.map((d) => d.category_id)].filter(
            Boolean
          ) as string[]
        )
      );
      if (ids.length === 0) return;
      const { data } = await supabase
        .from("menu_categories")
        .select("id, name")
        .in("id", ids);
      const map: Record<string, string> = {};
      (data || []).forEach((c: any) => (map[c.id] = c.name));
      setCategoryNames(map);
    })();
  }, [open, duplicates, draft.category_id]);

  const existing = duplicates[activeIndex];
  if (!existing) return null;

  const diff = (a: any, b: any) => JSON.stringify(a ?? "") !== JSON.stringify(b ?? "");

  const cardField = (label: string, value: React.ReactNode, highlight: boolean) => (
    <div
      className={`rounded-md px-2 py-1 text-sm ${
        highlight ? "bg-primary/15 border border-primary/30" : "bg-muted/30"
      }`}
    >
      <div className="text-[10px] uppercase tracking-wide text-muted-foreground">
        {label}
      </div>
      <div className="break-words">{value || <span className="text-muted-foreground italic">—</span>}</div>
    </div>
  );

  const renderCard = (
    title: string,
    data: {
      name: string;
      category_id: string | null;
      price_huf: number | null;
      image_url: string | null;
      description: string | null;
      allergens: string[] | null;
      is_active: boolean;
      is_temporary?: boolean;
      is_always_available?: boolean;
    },
    other: typeof data,
    accent: "muted" | "primary"
  ) => (
    <div
      className={`rounded-lg border-2 p-3 space-y-2 ${
        accent === "primary" ? "border-primary/60" : "border-border"
      }`}
    >
      <div className="flex items-center justify-between">
        <h4 className="font-semibold text-sm">{title}</h4>
        <Badge variant={data.is_active ? "default" : "secondary"} className="text-[10px]">
          {data.is_active ? "Aktív" : "Inaktív"}
        </Badge>
      </div>

      <div className="aspect-video w-full rounded-md overflow-hidden bg-muted flex items-center justify-center">
        {data.image_url ? (
          <img src={data.image_url} alt={data.name} className="w-full h-full object-cover" />
        ) : (
          <ImageIcon className="h-8 w-8 text-muted-foreground" />
        )}
      </div>

      {cardField("Név", data.name, diff(data.name?.toLowerCase(), other.name?.toLowerCase()))}
      {cardField(
        "Kategória",
        data.category_id ? categoryNames[data.category_id] || "…" : null,
        diff(data.category_id, other.category_id)
      )}
      {cardField(
        "Ár",
        data.price_huf != null ? `${data.price_huf.toLocaleString("hu-HU")} Ft` : null,
        diff(data.price_huf, other.price_huf)
      )}
      {cardField(
        "Leírás",
        data.description ? (
          <span className="line-clamp-3">{data.description}</span>
        ) : null,
        diff(data.description, other.description)
      )}
      {cardField(
        "Allergének",
        (data.allergens || []).length > 0 ? (
          <div className="flex flex-wrap gap-1">
            {(data.allergens || []).map((a) => (
              <Badge key={a} variant="outline" className="text-[10px]">
                {a}
              </Badge>
            ))}
          </div>
        ) : null,
        diff(
          [...(data.allergens || [])].sort().join(","),
          [...(other.allergens || [])].sort().join(",")
        )
      )}

      <div className="flex flex-wrap gap-1 pt-1">
        {data.is_always_available && (
          <Badge variant="outline" className="text-[10px]">Fix tétel</Badge>
        )}
        {data.is_temporary && (
          <Badge variant="outline" className="text-[10px]">Ideiglenes</Badge>
        )}
      </div>
    </div>
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[calc(100dvh-2rem)] flex flex-col overflow-hidden">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle>Duplikált étel találat</DialogTitle>
          <DialogDescription>
            Már létezik {duplicates.length > 1 ? `${duplicates.length} hasonló nevű étel` : "egy hasonló nevű étel"}.
            Hasonlítsd össze és döntsd el, mit szeretnél.
          </DialogDescription>
        </DialogHeader>

        {duplicates.length > 1 && (
          <div className="flex flex-wrap gap-1 flex-shrink-0">
            {duplicates.map((d, i) => (
              <Button
                key={d.id}
                size="sm"
                variant={i === activeIndex ? "default" : "outline"}
                onClick={() => setActiveIndex(i)}
                className="text-xs h-7"
              >
                {i + 1}. {d.name}
              </Button>
            ))}
          </div>
        )}

        <div className="flex-1 overflow-y-auto pr-1">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {renderCard("Meglévő", existing, draft as any, "muted")}
            {renderCard("Új / szerkesztett", draft as any, existing, "primary")}
          </div>
        </div>

        <div className="flex-shrink-0 pt-3 border-t space-y-2">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <Button
              variant="outline"
              onClick={onKeepExisting}
              disabled={saving}
            >
              Meglévő megtartása
            </Button>
            <Button
              variant="secondary"
              onClick={onKeepBoth}
              disabled={saving}
            >
              {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
              Mindkettő megtartása
            </Button>
          </div>
          <Button
            variant="destructive"
            className="w-full"
            onClick={() => onReplaceExisting(existing.id)}
            disabled={saving}
          >
            {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
            Meglévő ("{existing.name}") felülírása az újjal
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
