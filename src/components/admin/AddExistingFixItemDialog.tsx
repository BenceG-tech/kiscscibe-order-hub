import { useEffect, useMemo, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { ImageIcon, Search, Plus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { capitalizeFirst } from "@/lib/utils";
import { useToast } from "@/components/ui/use-toast";

interface MenuItem {
  id: string;
  name: string;
  price_huf: number;
  image_url: string | null;
  category_id: string | null;
}

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  targetCategoryId: string;
  targetCategoryName: string;
  nextDisplayOrderStart: number;
  onAdded: () => void;
}

const AddExistingFixItemDialog = ({
  open,
  onOpenChange,
  targetCategoryId,
  targetCategoryName,
  nextDisplayOrderStart,
  onAdded,
}: Props) => {
  const { toast } = useToast();
  const [items, setItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [saving, setSaving] = useState(false);
  const [onlyThisCategory, setOnlyThisCategory] = useState(true);

  useEffect(() => {
    if (!open) return;
    setSelected(new Set());
    setSearch("");
    void load();
  }, [open]);

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("menu_items")
      .select("id, name, price_huf, image_url, category_id")
      .eq("is_always_available", false)
      .eq("is_active", true)
      .order("name");
    if (error) toast({ title: "Hiba", description: error.message, variant: "destructive" });
    setItems((data || []) as MenuItem[]);
    setLoading(false);
  };

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return items.filter((it) => {
      if (onlyThisCategory && it.category_id !== targetCategoryId) return false;
      if (!q) return true;
      return it.name.toLowerCase().includes(q);
    });
  }, [items, search, onlyThisCategory, targetCategoryId]);

  const toggle = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleSave = async () => {
    if (selected.size === 0) return;
    setSaving(true);
    const ids = Array.from(selected);
    // Each selected item: set is_always_available=true, assign display_order, optionally move category
    const results = await Promise.all(
      ids.map((id, idx) =>
        supabase
          .from("menu_items")
          .update({
            is_always_available: true,
            display_order: nextDisplayOrderStart + idx,
          })
          .eq("id", id)
      )
    );
    setSaving(false);
    if (results.some((r) => r.error)) {
      toast({ title: "Hiba", description: "Nem sikerült minden tételt hozzáadni", variant: "destructive" });
    } else {
      toast({ title: "Hozzáadva", description: `${ids.length} tétel a fix listához` });
      onOpenChange(false);
      onAdded();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[calc(100dvh-2rem)] flex flex-col overflow-hidden">
        <DialogHeader>
          <DialogTitle>Meglévő tétel hozzáadása · {targetCategoryName}</DialogTitle>
        </DialogHeader>

        <div className="flex-shrink-0 space-y-2 pb-2">
          <div className="relative">
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Keresés név alapján..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8"
            />
          </div>
          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <Checkbox checked={onlyThisCategory} onCheckedChange={(v) => setOnlyThisCategory(!!v)} />
            <span>Csak a(z) <strong>{targetCategoryName}</strong> kategória tételei</span>
          </label>
        </div>

        <div className="flex-1 overflow-y-auto space-y-1 border-t pt-2">
          {loading ? (
            <p className="text-sm text-muted-foreground py-4 text-center">Betöltés...</p>
          ) : filtered.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">Nincs találat. Minden tétel már fix, vagy nincs ilyen kategóriában.</p>
          ) : (
            filtered.map((it) => {
              const isSelected = selected.has(it.id);
              return (
                <button
                  key={it.id}
                  type="button"
                  onClick={() => toggle(it.id)}
                  className={`w-full flex items-center gap-3 p-2 rounded-lg border text-left transition-colors ${
                    isSelected ? "border-primary bg-primary/10" : "border-border hover:bg-muted/40"
                  }`}
                >
                  <Checkbox checked={isSelected} className="pointer-events-none" />
                  {it.image_url ? (
                    <img src={it.image_url} alt={it.name} className="w-10 h-10 object-cover rounded" />
                  ) : (
                    <div className="w-10 h-10 rounded bg-muted flex items-center justify-center">
                      <ImageIcon className="h-4 w-4 text-muted-foreground/50" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm truncate">{capitalizeFirst(it.name)}</div>
                  </div>
                  <Badge variant="secondary" className="shrink-0">{it.price_huf} Ft</Badge>
                </button>
              );
            })
          )}
        </div>

        <div className="flex-shrink-0 border-t pt-3 flex gap-2 items-center">
          <span className="text-sm text-muted-foreground flex-1">
            {selected.size > 0 ? `${selected.size} kiválasztva` : "Válassz ki egyet vagy többet"}
          </span>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Mégse</Button>
          <Button onClick={handleSave} disabled={selected.size === 0 || saving}>
            <Plus className="h-4 w-4 mr-1" />
            Hozzáadás ({selected.size})
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AddExistingFixItemDialog;
