import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Sparkles, AlertTriangle, CheckCircle2, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { suggestAllergensForItem } from "@/data/allergenRules";

interface Suggestion {
  id: string;
  name: string;
  currentAllergens: string[];
  added: string[];
  reasons: string[];
}

const ALLERGEN_LABELS: Record<string, string> = {
  "1": "Glutén",
  "2": "Rákfélék",
  "3": "Tojás",
  "4": "Hal",
  "5": "Földimogyoró",
  "6": "Szója",
  "7": "Tej",
  "8": "Diófélék",
  "9": "Zeller",
  "10": "Mustár",
  "11": "Szezám",
  "12": "Kén-dioxid",
  "13": "Csillagfürt",
  "14": "Puhatestűek",
};

export const AllergenAutoAssign = () => {
  const { toast } = useToast();
  const [scanning, setScanning] = useState(false);
  const [applying, setApplying] = useState(false);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [scanned, setScanned] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const runScan = async () => {
    setScanning(true);
    setSuggestions([]);
    try {
      const { data, error } = await supabase
        .from("menu_items")
        .select("id, name, description, allergens")
        .eq("is_active", true);

      if (error) throw error;

      const result: Suggestion[] = [];
      for (const item of data ?? []) {
        const { added, reasons } = suggestAllergensForItem(
          item.name,
          item.description,
          item.allergens as string[] | null,
        );
        if (added.length > 0) {
          result.push({
            id: item.id,
            name: item.name,
            currentAllergens: (item.allergens as string[] | null) ?? [],
            added,
            reasons,
          });
        }
      }
      setSuggestions(result);
      setScanned(true);
      toast({
        title: "Vizsgálat kész",
        description: `${result.length} tételhez tudunk allergént javasolni.`,
      });
    } catch (e: any) {
      toast({ variant: "destructive", title: "Hiba", description: e.message });
    } finally {
      setScanning(false);
    }
  };

  const applyAll = async () => {
    setApplying(true);
    setConfirmOpen(false);
    let success = 0;
    let failed = 0;
    try {
      for (const s of suggestions) {
        const merged = Array.from(new Set([...s.currentAllergens, ...s.added]));
        const { error } = await supabase
          .from("menu_items")
          .update({ allergens: merged })
          .eq("id", s.id);
        if (error) failed++;
        else success++;
      }
      toast({
        title: "Allergének hozzáadva",
        description: `${success} tétel frissítve${failed ? `, ${failed} sikertelen` : ""}. Kérlek ellenőrizd!`,
      });
      setSuggestions([]);
      setScanned(false);
    } finally {
      setApplying(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" />
          Allergének automatikus hozzárendelése
        </CardTitle>
        <CardDescription>
          Az étel neve alapján javasolt allergéneket adunk hozzá az aktív tételekhez. 
          A meglévő allergéneket NEM írjuk felül, csak újakat adunk hozzá. 
          A vizsgálat után ellenőrizd a javaslatokat, mielőtt alkalmazod.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap gap-2">
          <Button onClick={runScan} disabled={scanning || applying} variant="outline">
            {scanning ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Sparkles className="h-4 w-4 mr-2" />}
            {scanned ? "Újraellenőrzés" : "Vizsgálat indítása"}
          </Button>
          {suggestions.length > 0 && (
            <Button onClick={() => setConfirmOpen(true)} disabled={applying}>
              {applying ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <CheckCircle2 className="h-4 w-4 mr-2" />}
              Alkalmazás mind a {suggestions.length} tételre
            </Button>
          )}
        </div>

        {scanned && suggestions.length === 0 && (
          <div className="rounded-md border border-border p-4 flex items-center gap-2 text-sm text-muted-foreground">
            <CheckCircle2 className="h-4 w-4 text-green-500" />
            Nincs új javaslat — minden ismert allergén már hozzá van rendelve.
          </div>
        )}

        {suggestions.length > 0 && (
          <div className="rounded-md border border-border">
            <div className="flex items-start gap-2 p-3 border-b bg-yellow-500/5">
              <AlertTriangle className="h-4 w-4 text-yellow-500 mt-0.5" />
              <p className="text-sm text-muted-foreground">
                <strong className="text-foreground">{suggestions.length}</strong> tételhez találtunk hozzáadandó allergént.
                Ez csak javaslat — alkalmazás után az adminok kézzel finomíthatják.
              </p>
            </div>
            <ScrollArea className="h-[400px]">
              <div className="divide-y">
                {suggestions.map((s) => (
                  <div key={s.id} className="p-3">
                    <div className="font-medium text-sm">{s.name}</div>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {s.added.map((a) => (
                        <Badge key={a} variant="secondary" className="text-xs">
                          + {a}: {ALLERGEN_LABELS[a] ?? a}
                        </Badge>
                      ))}
                    </div>
                    <div className="text-xs text-muted-foreground mt-1 italic">
                      {s.reasons.join(" · ")}
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>
        )}
      </CardContent>

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Allergének alkalmazása</AlertDialogTitle>
            <AlertDialogDescription>
              Biztosan hozzáadod a javasolt allergéneket {suggestions.length} tételhez?
              A meglévő allergének megmaradnak — csak újakat adunk hozzá.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Mégse</AlertDialogCancel>
            <AlertDialogAction onClick={applyAll}>Igen, alkalmazom</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
};
