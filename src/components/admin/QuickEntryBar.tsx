import { useState, useMemo, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Sparkles, Plus, Rows3, X } from "lucide-react";
import { format } from "date-fns";
import { hu } from "date-fns/locale";
import { searchMenuItems, matchMenuItem, type MenuItemLite, type CategoryLite } from "@/lib/categoryMatcher";
import { supabase } from "@/integrations/supabase/client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { capitalizeFirst } from "@/lib/utils";

interface Props {
  weekDates: Date[];
  initialDayIdx: number;
  menuItems: MenuItemLite[];
  categories: CategoryLite[];
  onAddItem: (date: string, itemId: string) => void;
}

const WEEKDAYS_SHORT = ["H", "K", "Sze", "Cs", "P"];

export default function QuickEntryBar({ weekDates, initialDayIdx, menuItems, categories, onAddItem }: Props) {
  const [dayIdx, setDayIdx] = useState(Math.max(0, Math.min(4, initialDayIdx)));
  const [query, setQuery] = useState("");
  const [showSuggest, setShowSuggest] = useState(false);
  const [bulkMode, setBulkMode] = useState(false);
  const [bulkText, setBulkText] = useState("");
  const [newItemCategory, setNewItemCategory] = useState<string>("");
  const [newItemOpen, setNewItemOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const qc = useQueryClient();

  const suggestions = useMemo(() => searchMenuItems(query, menuItems, 8), [query, menuItems]);
  const catById = useMemo(() => Object.fromEntries(categories.map(c => [c.id, c.name])), [categories]);

  const selectedDate = weekDates[dayIdx];
  const dateStr = format(selectedDate, "yyyy-MM-dd");

  const createItemMutation = useMutation({
    mutationFn: async ({ name, categoryId }: { name: string; categoryId: string | null }) => {
      const { data, error } = await supabase
        .from("menu_items")
        .insert({ name: capitalizeFirst(name), category_id: categoryId, price_huf: 0, is_active: true })
        .select("id")
        .single();
      if (error) throw error;
      return data.id as string;
    },
    onSuccess: (itemId, vars) => {
      qc.invalidateQueries({ queryKey: ["menu-items-all"] });
      onAddItem(dateStr, itemId);
      toast.success(`"${vars.name}" létrehozva és hozzáadva`);
      setQuery("");
      setNewItemOpen(false);
      setNewItemCategory("");
      inputRef.current?.focus();
    },
    onError: (e: any) => toast.error(`Hiba: ${e.message}`),
  });

  const handlePickSuggestion = (item: MenuItemLite) => {
    onAddItem(dateStr, item.id);
    const catName = item.category_id ? catById[item.category_id] : "?";
    toast.success(`${item.name} → ${WEEKDAYS_SHORT[dayIdx]} / ${catName}`);
    setQuery("");
    inputRef.current?.focus();
  };

  const handleEnter = () => {
    if (suggestions.length > 0) {
      handlePickSuggestion(suggestions[0]);
    } else if (query.trim()) {
      setNewItemOpen(true);
    }
  };

  const handleBulkSubmit = async () => {
    const lines = bulkText.split("\n").map(l => l.trim()).filter(Boolean);
    if (!lines.length) return;
    let added = 0;
    const unmatched: string[] = [];
    for (const line of lines) {
      const m = matchMenuItem(line, menuItems);
      if (m.item) {
        onAddItem(dateStr, m.item.id);
        added++;
      } else {
        unmatched.push(line);
      }
    }
    toast.success(`${added} étel hozzáadva${unmatched.length ? `, ${unmatched.length} ismeretlen` : ""}`);
    if (unmatched.length) {
      toast.info(`Ismeretlen: ${unmatched.join(", ")}`, { duration: 8000 });
    }
    setBulkText("");
  };

  return (
    <div className="rounded-lg border border-primary/30 bg-primary/5 p-3 space-y-3">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-2 text-sm font-medium">
          <Sparkles className="h-4 w-4 text-primary" />
          Gyors bevitel
        </div>
        <div className="flex items-center gap-1">
          {weekDates.map((d, idx) => (
            <Button
              key={idx}
              variant={idx === dayIdx ? "default" : "outline"}
              size="sm"
              className="h-8 px-2.5"
              onClick={() => setDayIdx(idx)}
            >
              <span className="font-medium">{WEEKDAYS_SHORT[idx]}</span>
              <span className="ml-1 text-xs opacity-70">{format(d, "dd.", { locale: hu })}</span>
            </Button>
          ))}
        </div>
        <Button
          variant={bulkMode ? "default" : "ghost"}
          size="sm"
          onClick={() => setBulkMode(b => !b)}
          className="h-8"
        >
          <Rows3 className="h-3.5 w-3.5 mr-1" />
          Több sor
        </Button>
      </div>

      {!bulkMode ? (
        <div className="relative">
          <Input
            ref={inputRef}
            value={query}
            onChange={e => { setQuery(e.target.value); setShowSuggest(true); }}
            onFocus={() => setShowSuggest(true)}
            onBlur={() => setTimeout(() => setShowSuggest(false), 200)}
            onKeyDown={e => {
              if (e.key === "Enter") { e.preventDefault(); handleEnter(); }
              if (e.key === "Escape") { setQuery(""); }
            }}
            placeholder="Étel neve... (Enter = hozzáad)"
            className="bg-background"
          />
          {showSuggest && query.trim() && (
            <div className="absolute z-50 mt-1 w-full bg-popover border rounded-md shadow-lg max-h-80 overflow-auto">
              {suggestions.map(s => (
                <button
                  key={s.id}
                  type="button"
                  onMouseDown={e => e.preventDefault()}
                  onClick={() => handlePickSuggestion(s)}
                  className="w-full px-3 py-2 text-left hover:bg-accent flex items-center justify-between gap-2 border-b last:border-b-0"
                >
                  <span className="text-sm">{s.name}</span>
                  {s.category_id && (
                    <Badge variant="secondary" className="text-xs shrink-0">
                      {catById[s.category_id] || "?"}
                    </Badge>
                  )}
                </button>
              ))}
              <Popover open={newItemOpen} onOpenChange={setNewItemOpen}>
                <PopoverTrigger asChild>
                  <button
                    type="button"
                    onMouseDown={e => e.preventDefault()}
                    onClick={() => setNewItemOpen(true)}
                    className="w-full px-3 py-2 text-left hover:bg-accent flex items-center gap-2 text-primary border-t bg-muted/30"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    <span className="text-sm">Új étel létrehozása: <strong>"{query}"</strong></span>
                  </button>
                </PopoverTrigger>
                <PopoverContent className="w-72" onOpenAutoFocus={e => e.preventDefault()}>
                  <div className="space-y-2">
                    <div className="text-sm font-medium">Kategória "{query}" ételhez</div>
                    <Select value={newItemCategory} onValueChange={setNewItemCategory}>
                      <SelectTrigger><SelectValue placeholder="Válassz kategóriát..." /></SelectTrigger>
                      <SelectContent>
                        {categories.map(c => (
                          <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <div className="flex gap-2 justify-end">
                      <Button variant="ghost" size="sm" onClick={() => setNewItemOpen(false)}>Mégse</Button>
                      <Button
                        size="sm"
                        disabled={!newItemCategory || createItemMutation.isPending}
                        onClick={() => createItemMutation.mutate({ name: query.trim(), categoryId: newItemCategory })}
                      >
                        Létrehoz + hozzáad
                      </Button>
                    </div>
                  </div>
                </PopoverContent>
              </Popover>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-2">
          <Textarea
            value={bulkText}
            onChange={e => setBulkText(e.target.value)}
            placeholder={"egy étel / sor\npl:\ngulyásleves\nrántott szelet\nhasábburgonya"}
            rows={5}
            className="bg-background font-mono text-sm"
          />
          <div className="flex justify-end gap-2">
            <Button variant="ghost" size="sm" onClick={() => setBulkText("")}>
              <X className="h-3.5 w-3.5 mr-1" /> Törlés
            </Button>
            <Button size="sm" onClick={handleBulkSubmit} disabled={!bulkText.trim()}>
              Hozzáadás a(z) {WEEKDAYS_SHORT[dayIdx]} naphoz
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
