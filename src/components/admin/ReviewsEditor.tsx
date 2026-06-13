import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowDown, ArrowUp, Plus, Save, Trash2, Star } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { LoadingSpinner } from "@/components/ui/loading";

export interface ReviewItem {
  name: string;
  rating: number;
  text: string;
  verified: boolean;
}

const DEFAULT_REVIEWS: ReviewItem[] = [
  { name: "Kovács János", rating: 5, text: "Fantasztikus reggelik és kedves kiszolgálás! A rántotta tejszínes volt és a kávé tökéletes.", verified: true },
  { name: "Nagy Éva", rating: 5, text: "A napi menü mindig friss és finom. Az árak teljesen korrektek, a kiszolgálás gyors.", verified: true },
  { name: "Szabó Péter", rating: 5, text: "Jó ár-érték arány, bőséges adagok. A guláslevest különösen ajánlom!", verified: false },
];

const SETTINGS_KEY = "homepage_reviews";

const ReviewsEditor = () => {
  const [reviews, setReviews] = useState<ReviewItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("settings")
        .select("value_json")
        .eq("key", SETTINGS_KEY)
        .maybeSingle();
      const arr = Array.isArray(data?.value_json) ? (data!.value_json as unknown as ReviewItem[]) : null;
      setReviews(arr && arr.length > 0 ? arr : DEFAULT_REVIEWS);
      setLoading(false);
    })();
  }, []);

  const update = (idx: number, patch: Partial<ReviewItem>) => {
    setReviews(prev => prev.map((r, i) => (i === idx ? { ...r, ...patch } : r)));
  };

  const remove = (idx: number) => setReviews(prev => prev.filter((_, i) => i !== idx));

  const move = (idx: number, dir: -1 | 1) => {
    setReviews(prev => {
      const next = [...prev];
      const target = idx + dir;
      if (target < 0 || target >= next.length) return prev;
      [next[idx], next[target]] = [next[target], next[idx]];
      return next;
    });
  };

  const add = () => {
    setReviews(prev => [...prev, { name: "", rating: 5, text: "", verified: true }]);
  };

  const save = async () => {
    setSaving(true);
    try {
      const cleaned = reviews
        .map(r => ({ ...r, name: r.name.trim(), text: r.text.trim() }))
        .filter(r => r.name && r.text);
      const { error } = await supabase
        .from("settings")
        .upsert({ key: SETTINGS_KEY, value_json: cleaned as any }, { onConflict: "key" });
      if (error) throw error;
      toast({ title: "Mentve", description: `${cleaned.length} vélemény elmentve.` });
      setReviews(cleaned);
    } catch (e: any) {
      toast({ title: "Hiba", description: e.message || "Mentés sikertelen", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="flex justify-center py-12"><LoadingSpinner /></div>;
  }

  return (
    <div className="py-6 space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h1 className="text-2xl font-bold">Vélemények szerkesztése</h1>
          <p className="text-sm text-muted-foreground">
            A főoldalon megjelenő vendégértékelések. Minden vélemény 5 csillagos a nyilvános megjelenítésben.
          </p>
        </div>
        <Button onClick={save} disabled={saving}>
          <Save className="h-4 w-4 mr-2" />
          {saving ? "Mentés…" : "Mentés"}
        </Button>
      </div>

      <div className="space-y-3">
        {reviews.map((r, idx) => (
          <Card key={idx}>
            <CardContent className="p-4 space-y-3">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-semibold text-muted-foreground">#{idx + 1}</span>
                <div className="flex gap-1">
                  <Button size="icon" variant="ghost" onClick={() => move(idx, -1)} disabled={idx === 0}>
                    <ArrowUp className="h-4 w-4" />
                  </Button>
                  <Button size="icon" variant="ghost" onClick={() => move(idx, 1)} disabled={idx === reviews.length - 1}>
                    <ArrowDown className="h-4 w-4" />
                  </Button>
                  <Button size="icon" variant="ghost" onClick={() => remove(idx)} className="text-destructive hover:text-destructive">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto_auto] gap-3 items-end">
                <div>
                  <Label className="text-xs">Név</Label>
                  <Input value={r.name} onChange={e => update(idx, { name: e.target.value })} placeholder="Pl. Kovács János" />
                </div>
                <div>
                  <Label className="text-xs">Csillagok</Label>
                  <Select value={String(r.rating)} onValueChange={v => update(idx, { rating: Number(v) })}>
                    <SelectTrigger className="w-28">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {[5, 4, 3, 2, 1].map(n => (
                        <SelectItem key={n} value={String(n)}>
                          <span className="flex items-center gap-1">
                            {n} <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                          </span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center gap-2 pb-2">
                  <Switch checked={r.verified} onCheckedChange={v => update(idx, { verified: v })} />
                  <Label className="text-xs">Hitelesített</Label>
                </div>
              </div>

              <div>
                <Label className="text-xs">Vélemény szöveg</Label>
                <Textarea
                  value={r.text}
                  onChange={e => update(idx, { text: e.target.value })}
                  rows={3}
                  placeholder="A vendég értékelése…"
                />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Button variant="outline" onClick={add} className="w-full">
        <Plus className="h-4 w-4 mr-2" />
        Új vélemény hozzáadása
      </Button>

      <div className="flex justify-end pt-2">
        <Button onClick={save} disabled={saving} size="lg">
          <Save className="h-4 w-4 mr-2" />
          {saving ? "Mentés…" : "Mentés"}
        </Button>
      </div>
    </div>
  );
};

export default ReviewsEditor;
