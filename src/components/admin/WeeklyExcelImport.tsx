import { useState, useMemo } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { Upload, Download, Check, AlertCircle, FileSpreadsheet, X } from "lucide-react";
import { format, addDays } from "date-fns";
import { hu } from "date-fns/locale";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { downloadWeekTemplate, parseWeeklyExcel, WEEKDAY_NAMES, type ParsedDayRow } from "@/lib/weeklyExcelTemplate";
import { matchMenuItem, type MenuItemLite, type CategoryLite } from "@/lib/categoryMatcher";
import { capitalizeFirst } from "@/lib/utils";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  weekStart: Date;
  menuItems: MenuItemLite[];
  categories: CategoryLite[];
}

type ItemResolution =
  | { status: "exact"; itemId: string; itemName: string; columnHeader: string }
  | { status: "fuzzy"; itemId: string; itemName: string; originalName: string; columnHeader: string }
  | { status: "missing"; originalName: string; columnHeader: string; categoryId: string | null };

type ResolvedDay = { dayIndex: number; date: string; price: number | null; items: ItemResolution[] };

export default function WeeklyExcelImport({ open, onOpenChange, weekStart, menuItems, categories }: Props) {
  const qc = useQueryClient();
  const [file, setFile] = useState<File | null>(null);
  const [parsed, setParsed] = useState<ParsedDayRow[] | null>(null);
  const [resolved, setResolved] = useState<ResolvedDay[]>([]);
  const [mode, setMode] = useState<"merge" | "overwrite">("merge");
  const [importing, setImporting] = useState(false);
  const [progress, setProgress] = useState(0);

  const reset = () => { setFile(null); setParsed(null); setResolved([]); setProgress(0); };

  const handleFile = async (f: File) => {
    setFile(f);
    try {
      const rows = await parseWeeklyExcel(f);
      setParsed(rows);
      // resolve
      const r: ResolvedDay[] = rows.map(row => {
        const date = format(addDays(weekStart, row.dayIndex), "yyyy-MM-dd");
        const items: ItemResolution[] = row.items.map(it => {
          const m = matchMenuItem(it.name, menuItems);
          if (m.kind === "exact" && m.item) {
            return { status: "exact", itemId: m.item.id, itemName: m.item.name, columnHeader: it.columnHeader };
          }
          if (m.kind === "fuzzy" && m.item) {
            return { status: "fuzzy", itemId: m.item.id, itemName: m.item.name, originalName: it.name, columnHeader: it.columnHeader };
          }
          // try matching column header to a category
          const headerNorm = it.columnHeader.toLowerCase();
          const cat = categories.find(c => c.name.toLowerCase().includes(headerNorm) || headerNorm.includes(c.name.toLowerCase()));
          return { status: "missing", originalName: it.name, columnHeader: it.columnHeader, categoryId: cat?.id ?? null };
        });
        return { dayIndex: row.dayIndex, date, price: row.price, items };
      });
      setResolved(r);
    } catch (e: any) {
      toast.error(`Excel olvasási hiba: ${e.message}`);
    }
  };

  const totals = useMemo(() => {
    let exact = 0, fuzzy = 0, missing = 0;
    resolved.forEach(d => d.items.forEach(i => {
      if (i.status === "exact") exact++;
      else if (i.status === "fuzzy") fuzzy++;
      else missing++;
    }));
    return { exact, fuzzy, missing, total: exact + fuzzy + missing };
  }, [resolved]);

  const updateMissingCategory = (dayIdx: number, itemIdx: number, categoryId: string) => {
    setResolved(prev => prev.map((d, di) => di !== dayIdx ? d : {
      ...d,
      items: d.items.map((it, ii) => ii !== itemIdx ? it : (it.status === "missing" ? { ...it, categoryId } : it)),
    }));
  };

  const acceptFuzzy = (dayIdx: number, itemIdx: number) => {
    setResolved(prev => prev.map((d, di) => di !== dayIdx ? d : {
      ...d,
      items: d.items.map((it, ii) => {
        if (ii !== itemIdx || it.status !== "fuzzy") return it;
        return { status: "exact", itemId: it.itemId, itemName: it.itemName, columnHeader: it.columnHeader };
      }),
    }));
  };

  const rejectItem = (dayIdx: number, itemIdx: number) => {
    setResolved(prev => prev.map((d, di) => di !== dayIdx ? d : {
      ...d,
      items: d.items.filter((_, ii) => ii !== itemIdx),
    }));
  };

  const doImport = async () => {
    setImporting(true);
    setProgress(0);
    try {
      const total = resolved.length;
      let createdNew = 0;
      let addedItems = 0;

      for (let di = 0; di < resolved.length; di++) {
        const day = resolved[di];

        // 1. upsert daily_offer
        let { data: offer } = await supabase.from("daily_offers")
          .select("id").eq("date", day.date).maybeSingle();
        if (!offer) {
          const { data: created, error: insErr } = await supabase.from("daily_offers")
            .insert({ date: day.date, price_huf: day.price ?? 2200 })
            .select("id").single();
          if (insErr) throw insErr;
          offer = created;
        } else if (day.price != null) {
          await supabase.from("daily_offers").update({ price_huf: day.price }).eq("id", offer.id);
        }

        // 2. overwrite mode → delete existing items
        if (mode === "overwrite") {
          await supabase.from("daily_offer_items").delete().eq("daily_offer_id", offer!.id);
        }

        // 3. resolve missing items by creating them
        const toAdd: string[] = [];
        for (const it of day.items) {
          if (it.status === "missing") {
            if (!it.categoryId) continue; // skip if no category chosen
            const { data: newMi, error: e2 } = await supabase.from("menu_items")
              .insert({ name: capitalizeFirst(it.originalName), category_id: it.categoryId, price_huf: 0, is_active: true })
              .select("id").single();
            if (e2) { console.error(e2); continue; }
            toAdd.push(newMi.id);
            createdNew++;
          } else {
            toAdd.push(it.itemId);
          }
        }

        if (toAdd.length) {
          const rows = toAdd.map(item_id => ({ daily_offer_id: offer!.id, item_id }));
          const { error: e3 } = await supabase.from("daily_offer_items").insert(rows);
          if (e3) throw e3;
          addedItems += toAdd.length;
        }

        setProgress(Math.round(((di + 1) / total) * 100));
      }

      toast.success(`${resolved.length} nap, ${addedItems} étel importálva. ${createdNew ? `${createdNew} új étel létrehozva.` : ""}`);
      qc.invalidateQueries({ queryKey: ["daily-offers-week"] });
      qc.invalidateQueries({ queryKey: ["menu-items-all"] });
      reset();
      onOpenChange(false);
    } catch (e: any) {
      toast.error(`Import hiba: ${e.message}`);
    } finally {
      setImporting(false);
    }
  };

  const canImport = resolved.length > 0 && resolved.every(d => d.items.every(it => it.status !== "missing" || it.categoryId));

  return (
    <Dialog open={open} onOpenChange={v => { if (!v) reset(); onOpenChange(v); }}>
      <DialogContent className="max-w-4xl max-h-[calc(100dvh-2rem)] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5" /> Heti import (Excel)
          </DialogTitle>
          <DialogDescription>
            Töltsd fel a hét ajánlatait egyetlen Excel táblából. Hét kezdete: {format(weekStart, "yyyy. MMM d.", { locale: hu })}
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-auto space-y-4 py-2">
          {!parsed && (
            <>
              <div className="rounded-lg border-2 border-dashed p-6 text-center space-y-3">
                <FileSpreadsheet className="h-10 w-10 mx-auto text-muted-foreground" />
                <div className="text-sm text-muted-foreground">
                  Töltsd le a sablont az aktuális hét dátumaival, töltsd ki, és tedd vissza.
                </div>
                <div className="flex justify-center gap-2 flex-wrap">
                  <Button variant="outline" onClick={() => downloadWeekTemplate(weekStart)}>
                    <Download className="h-4 w-4 mr-2" />Sablon letöltése
                  </Button>
                  <label>
                    <input type="file" accept=".xlsx,.xls" className="hidden"
                      onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f); }} />
                    <Button asChild><span className="cursor-pointer"><Upload className="h-4 w-4 mr-2" />Excel feltöltése</span></Button>
                  </label>
                </div>
              </div>
            </>
          )}

          {parsed && (
            <div className="space-y-4">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <div className="flex items-center gap-2 text-sm">
                  <FileSpreadsheet className="h-4 w-4" />
                  <span className="font-medium">{file?.name}</span>
                  <Button variant="ghost" size="sm" onClick={reset}><X className="h-3 w-3" /></Button>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <Badge variant="default" className="bg-green-600">{totals.exact} pontos</Badge>
                  {totals.fuzzy > 0 && <Badge variant="default" className="bg-yellow-600">{totals.fuzzy} hasonló</Badge>}
                  {totals.missing > 0 && <Badge variant="destructive">{totals.missing} ismeretlen</Badge>}
                </div>
              </div>

              <div className="rounded-md border p-3 bg-muted/30">
                <Label className="text-sm font-medium mb-2 block">Ha a napon már van ajánlat:</Label>
                <RadioGroup value={mode} onValueChange={v => setMode(v as any)} className="flex gap-4">
                  <div className="flex items-center gap-2">
                    <RadioGroupItem value="merge" id="merge" />
                    <Label htmlFor="merge" className="font-normal cursor-pointer text-sm">Hozzáadás a meglévőhöz</Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <RadioGroupItem value="overwrite" id="overwrite" />
                    <Label htmlFor="overwrite" className="font-normal cursor-pointer text-sm">Felülírás (törli a régit)</Label>
                  </div>
                </RadioGroup>
              </div>

              <div className="space-y-3">
                {resolved.map((day, di) => (
                  <div key={di} className="border rounded-md p-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="font-medium text-sm">
                        {WEEKDAY_NAMES[day.dayIndex]} <span className="text-muted-foreground font-normal">({day.date})</span>
                      </div>
                      {day.price != null && <Badge variant="outline">{day.price} Ft</Badge>}
                    </div>
                    {day.items.length === 0 ? (
                      <div className="text-xs text-muted-foreground italic">Nincs étel</div>
                    ) : (
                      <ul className="space-y-1">
                        {day.items.map((it, ii) => (
                          <li key={ii} className="flex items-center gap-2 text-sm py-1">
                            {it.status === "exact" && <>
                              <Check className="h-3.5 w-3.5 text-green-600 shrink-0" />
                              <span>{it.itemName}</span>
                              <Badge variant="secondary" className="text-xs ml-auto">{it.columnHeader}</Badge>
                            </>}
                            {it.status === "fuzzy" && <>
                              <AlertCircle className="h-3.5 w-3.5 text-yellow-600 shrink-0" />
                              <span><span className="text-muted-foreground line-through">{it.originalName}</span> → <strong>{it.itemName}</strong></span>
                              <Button size="sm" variant="ghost" className="h-6 ml-auto" onClick={() => acceptFuzzy(di, ii)}>OK</Button>
                              <Button size="sm" variant="ghost" className="h-6" onClick={() => rejectItem(di, ii)}><X className="h-3 w-3" /></Button>
                            </>}
                            {it.status === "missing" && <>
                              <AlertCircle className="h-3.5 w-3.5 text-destructive shrink-0" />
                              <span className="flex-1">{it.originalName}</span>
                              <Select value={it.categoryId ?? ""} onValueChange={v => updateMissingCategory(di, ii, v)}>
                                <SelectTrigger className="h-7 text-xs w-40"><SelectValue placeholder="Kategória..." /></SelectTrigger>
                                <SelectContent>
                                  {categories.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                                </SelectContent>
                              </Select>
                              <Button size="sm" variant="ghost" className="h-6" onClick={() => rejectItem(di, ii)}><X className="h-3 w-3" /></Button>
                            </>}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                ))}
              </div>

              {importing && <Progress value={progress} className="h-2" />}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => { reset(); onOpenChange(false); }}>Mégse</Button>
          {parsed && (
            <Button onClick={doImport} disabled={!canImport || importing}>
              {importing ? "Importálás..." : `Import (${totals.total} étel)`}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
