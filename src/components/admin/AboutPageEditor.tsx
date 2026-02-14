import { useState, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Save,
  Loader2,
  Plus,
  Trash2,
  ArrowUp,
  ArrowDown,
  Upload,
  X,
  ImageIcon,
} from "lucide-react";

export interface AboutStat {
  id: string;
  number: string;
  label: string;
  icon: string;
}

export interface AboutValue {
  id: string;
  icon: string;
  title: string;
  description: string;
}

export interface AboutPageContent {
  heroTitle: string;
  heroSubtitle: string;
  heroImageUrl: string | null;
  storyTitle: string;
  storyParagraphs: string[];
  storyImageUrl: string | null;
  stats: AboutStat[];
  values: AboutValue[];
  missionTitle: string;
  missionText: string;
}

const ICON_OPTIONS = [
  "CalendarDays", "Users", "ChefHat", "Star", "Heart", "Clock", "Leaf",
  "Award", "Coffee", "Utensils", "MapPin", "ThumbsUp",
];

const DEFAULT_CONTENT: AboutPageContent = {
  heroTitle: "Rólunk",
  heroSubtitle: "Családi hagyományok, modern körülmények",
  heroImageUrl: null,
  storyTitle: "Történetünk",
  storyParagraphs: [
    "2018-ban nyitottuk meg első éttermünket a Vezér utcában, azzal a küldetéssel, hogy minőségi, otthonos ételeket kínáljunk kedvező áron.",
    "Kezdetben csak reggeliket és könnyű ebédeket szolgáltunk fel, de vendégeink kérésére bővítettük kínálatunkat. Ma már teljes értékű napi menüket és változatos à la carte ételeket készítünk.",
    "Büszkék vagyunk arra, hogy sok vendégünk már családtagként kezel minket, és nap mint nap visszatér hozzánk egy-egy finom falatra.",
  ],
  storyImageUrl: null,
  stats: [
    { id: "1", number: "2018", label: "Megnyitás éve", icon: "CalendarDays" },
    { id: "2", number: "500+", label: "Elégedett vendég", icon: "Users" },
    { id: "3", number: "50+", label: "Különböző étel", icon: "ChefHat" },
    { id: "4", number: "4.8", label: "Átlagos értékelés", icon: "Star" },
  ],
  values: [
    { id: "1", icon: "Heart", title: "Szeretettel főzünk", description: "Minden ételt családi receptek alapján, gondosan készítünk el" },
    { id: "2", icon: "Leaf", title: "Friss alapanyagok", description: "Napi friss beszerzés a legjobb minőségért" },
    { id: "3", icon: "Clock", title: "Gyors kiszolgálás", description: "Értékeljük az idődet, gyors és hatékony kiszolgálás" },
    { id: "4", icon: "Star", title: "Minőség", description: "Hagyományos magyar ízek modern körülmények között" },
  ],
  missionTitle: "Küldetésünk",
  missionText: "Célunk, hogy minden vendégünk úgy érezze magát nálunk, mintha otthon lenne. Friss alapanyagokból, szeretettel készített ételekkel szeretnénk boldoggá tenni a mindennapi életét, legyen szó egy gyors reggeliről vagy egy kiadós ebédről.",
};

const SETTINGS_KEY = "about_page";

const AboutPageEditor = () => {
  const queryClient = useQueryClient();
  const [editData, setEditData] = useState<AboutPageContent | null>(null);
  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  const { data: savedContent, isLoading } = useQuery({
    queryKey: ["about-page-content"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("settings")
        .select("value_json")
        .eq("key", SETTINGS_KEY)
        .maybeSingle();
      if (error) throw error;
      return (data?.value_json as unknown) as AboutPageContent | null;
    },
  });

  useEffect(() => {
    if (!isLoading) {
      setEditData(savedContent || null);
    }
  }, [isLoading, savedContent]);

  if (isLoading) {
    return (
      <div className="py-6 space-y-4">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  if (!editData) {
    return (
      <div className="py-6 space-y-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Rólunk oldal kezelése</h1>
          <p className="text-muted-foreground mt-1">Szerkessze a Rólunk oldal tartalmát</p>
        </div>
        <Card className="border-dashed border-2">
          <CardContent className="py-8 text-center space-y-4">
            <p className="text-muted-foreground">
              A Rólunk oldal tartalma még nincs beállítva. Töltse be az alapértelmezett tartalmat.
            </p>
            <Button onClick={() => { setEditData(DEFAULT_CONTENT); setHasChanges(true); }} variant="outline" className="gap-2">
              <Upload className="h-4 w-4" />
              Alapértelmezett tartalom betöltése
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const update = <K extends keyof AboutPageContent>(field: K, value: AboutPageContent[K]) => {
    setEditData(prev => prev ? { ...prev, [field]: value } : prev);
    setHasChanges(true);
  };

  const handleImageUpload = async (field: "heroImageUrl" | "storyImageUrl", e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const ext = file.name.split(".").pop();
      const path = `about/${field}-${Date.now()}.${ext}`;
      const { error } = await supabase.storage.from("menu-images").upload(path, file);
      if (error) throw error;
      const { data } = supabase.storage.from("menu-images").getPublicUrl(path);
      update(field, data.publicUrl);
      toast.success("Kép feltöltve");
    } catch (err) {
      console.error(err);
      toast.error("Hiba a kép feltöltésekor");
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from("settings")
        .upsert({ key: SETTINGS_KEY, value_json: editData as any }, { onConflict: "key" });
      if (error) throw error;
      queryClient.invalidateQueries({ queryKey: ["about-page-content"] });
      setHasChanges(false);
      toast.success("Rólunk oldal mentve!");
    } catch (err: any) {
      toast.error("Hiba a mentéskor", { description: err.message });
    } finally {
      setSaving(false);
    }
  };

  const ImageField = ({ label, field, value }: { label: string; field: "heroImageUrl" | "storyImageUrl"; value: string | null }) => (
    <div className="space-y-2">
      <Label>{label}</Label>
      <div className="flex items-start gap-3">
        {value ? (
          <div className="relative">
            <img src={value} alt="Preview" className="h-24 w-36 rounded-lg object-cover border" />
            <Button variant="destructive" size="icon" className="absolute -top-2 -right-2 h-6 w-6" onClick={() => update(field, null)}>
              <X className="h-3 w-3" />
            </Button>
          </div>
        ) : (
          <div className="h-24 w-36 rounded-lg border-2 border-dashed flex items-center justify-center bg-muted/50">
            <ImageIcon className="h-8 w-8 text-muted-foreground" />
          </div>
        )}
        <Input type="file" accept="image/*" onChange={(e) => handleImageUpload(field, e)} className="max-w-[200px]" />
      </div>
    </div>
  );

  return (
    <div className="py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Rólunk oldal kezelése</h1>
          <p className="text-muted-foreground mt-1">Szerkessze a Rólunk oldal tartalmát</p>
        </div>
        <Button onClick={handleSave} disabled={saving || !hasChanges} className="gap-2">
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          Mentés
        </Button>
      </div>

      {/* Hero Section */}
      <Card>
        <CardContent className="p-4 sm:p-6 space-y-4">
          <h2 className="font-bold text-lg text-foreground">Hero szekció</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Cím</Label>
              <Input value={editData.heroTitle} onChange={e => update("heroTitle", e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Alcím</Label>
              <Input value={editData.heroSubtitle} onChange={e => update("heroSubtitle", e.target.value)} />
            </div>
          </div>
          <ImageField label="Hero kép" field="heroImageUrl" value={editData.heroImageUrl} />
        </CardContent>
      </Card>

      {/* Stats */}
      <Card>
        <CardContent className="p-4 sm:p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-bold text-lg text-foreground">Statisztikák</h2>
            <Button variant="outline" size="sm" onClick={() => {
              update("stats", [...editData.stats, { id: String(Date.now()), number: "", label: "", icon: "Star" }]);
            }}>
              <Plus className="h-4 w-4 mr-1" /> Új
            </Button>
          </div>
          {editData.stats.map((stat, i) => (
            <div key={stat.id} className="flex flex-col md:flex-row gap-2 md:items-end p-3 md:p-0 rounded-lg md:rounded-none bg-muted/30 md:bg-transparent">
              <div className="flex-1 space-y-1">
                <Label className="text-xs">Szám</Label>
                <Input value={stat.number} onChange={e => {
                  const stats = [...editData.stats];
                  stats[i] = { ...stats[i], number: e.target.value };
                  update("stats", stats);
                }} />
              </div>
              <div className="flex-1 space-y-1">
                <Label className="text-xs">Címke</Label>
                <Input value={stat.label} onChange={e => {
                  const stats = [...editData.stats];
                  stats[i] = { ...stats[i], label: e.target.value };
                  update("stats", stats);
                }} />
              </div>
              <div className="w-full md:w-32 space-y-1">
                <Label className="text-xs">Ikon</Label>
                <select className="w-full h-10 rounded-md border border-input bg-background px-2 text-sm" value={stat.icon} onChange={e => {
                  const stats = [...editData.stats];
                  stats[i] = { ...stats[i], icon: e.target.value };
                  update("stats", stats);
                }}>
                  {ICON_OPTIONS.map(ic => <option key={ic} value={ic}>{ic}</option>)}
                </select>
              </div>
              <Button variant="ghost" size="icon" className="text-destructive self-end" onClick={() => {
                update("stats", editData.stats.filter((_, j) => j !== i));
              }}>
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Story Section */}
      <Card>
        <CardContent className="p-4 sm:p-6 space-y-4">
          <h2 className="font-bold text-lg text-foreground">Történetünk</h2>
          <div className="space-y-2">
            <Label>Szekció cím</Label>
            <Input value={editData.storyTitle} onChange={e => update("storyTitle", e.target.value)} />
          </div>
          <ImageField label="Történet kép" field="storyImageUrl" value={editData.storyImageUrl} />
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>Bekezdések</Label>
              <Button variant="outline" size="sm" onClick={() => update("storyParagraphs", [...editData.storyParagraphs, ""])}>
                <Plus className="h-4 w-4 mr-1" /> Új bekezdés
              </Button>
            </div>
            {editData.storyParagraphs.map((p, i) => (
              <div key={i} className="flex gap-2">
                <Textarea value={p} rows={4} className="flex-1" onChange={e => {
                  const paragraphs = [...editData.storyParagraphs];
                  paragraphs[i] = e.target.value;
                  update("storyParagraphs", paragraphs);
                }} />
                <div className="flex flex-col gap-1">
                  <Button variant="ghost" size="icon" className="h-8 w-8" disabled={i === 0} onClick={() => {
                    const paragraphs = [...editData.storyParagraphs];
                    [paragraphs[i], paragraphs[i - 1]] = [paragraphs[i - 1], paragraphs[i]];
                    update("storyParagraphs", paragraphs);
                  }}>
                    <ArrowUp className="h-3 w-3" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8" disabled={i === editData.storyParagraphs.length - 1} onClick={() => {
                    const paragraphs = [...editData.storyParagraphs];
                    [paragraphs[i], paragraphs[i + 1]] = [paragraphs[i + 1], paragraphs[i]];
                    update("storyParagraphs", paragraphs);
                  }}>
                    <ArrowDown className="h-3 w-3" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => {
                    update("storyParagraphs", editData.storyParagraphs.filter((_, j) => j !== i));
                  }}>
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Values */}
      <Card>
        <CardContent className="p-4 sm:p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-bold text-lg text-foreground">Értékeink</h2>
            <Button variant="outline" size="sm" onClick={() => {
              update("values", [...editData.values, { id: String(Date.now()), icon: "Star", title: "", description: "" }]);
            }}>
              <Plus className="h-4 w-4 mr-1" /> Új
            </Button>
          </div>
          {editData.values.map((val, i) => (
            <div key={val.id} className="flex flex-col md:flex-row gap-2 md:items-end p-3 md:p-0 rounded-lg md:rounded-none bg-muted/30 md:bg-transparent">
              <div className="w-full md:w-28 space-y-1">
                <Label className="text-xs">Ikon</Label>
                <select className="w-full h-10 rounded-md border border-input bg-background px-2 text-sm" value={val.icon} onChange={e => {
                  const values = [...editData.values];
                  values[i] = { ...values[i], icon: e.target.value };
                  update("values", values);
                }}>
                  {ICON_OPTIONS.map(ic => <option key={ic} value={ic}>{ic}</option>)}
                </select>
              </div>
              <div className="flex-1 space-y-1">
                <Label className="text-xs">Cím</Label>
                <Input value={val.title} onChange={e => {
                  const values = [...editData.values];
                  values[i] = { ...values[i], title: e.target.value };
                  update("values", values);
                }} />
              </div>
              <div className="flex-1 space-y-1">
                <Label className="text-xs">Leírás</Label>
                <Textarea value={val.description} rows={2} className="min-h-0" onChange={e => {
                  const values = [...editData.values];
                  values[i] = { ...values[i], description: e.target.value };
                  update("values", values);
                }} />
              </div>
              <Button variant="ghost" size="icon" className="text-destructive self-end" onClick={() => {
                update("values", editData.values.filter((_, j) => j !== i));
              }}>
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Mission */}
      <Card>
        <CardContent className="p-4 sm:p-6 space-y-4">
          <h2 className="font-bold text-lg text-foreground">Küldetés</h2>
          <div className="space-y-2">
            <Label>Cím</Label>
            <Input value={editData.missionTitle} onChange={e => update("missionTitle", e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Szöveg</Label>
            <Textarea value={editData.missionText} rows={6} onChange={e => update("missionText", e.target.value)} />
          </div>
        </CardContent>
      </Card>

      {/* Bottom save */}
      <div className="flex justify-end pb-8">
        <Button onClick={handleSave} disabled={saving || !hasChanges} className="gap-2" size="lg">
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          Mentés
        </Button>
      </div>
    </div>
  );
};

export default AboutPageEditor;
