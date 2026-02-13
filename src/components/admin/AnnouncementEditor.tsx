import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Megaphone, ChevronDown, Save, Loader2, Info, AlertTriangle, Gift, Eye } from "lucide-react";
import { cn } from "@/lib/utils";

interface AnnouncementData {
  enabled: boolean;
  title: string;
  message: string;
  type: "info" | "warning" | "promo";
  ctaText: string;
  ctaLink: string;
  imageUrl: string | null;
  updatedAt: string;
}

const DEFAULT_DATA: AnnouncementData = {
  enabled: false,
  title: "",
  message: "",
  type: "info",
  ctaText: "",
  ctaLink: "",
  imageUrl: null,
  updatedAt: new Date().toISOString(),
};

const TYPE_CONFIG = {
  info: { label: "Információ", icon: Info, color: "text-blue-500" },
  warning: { label: "Figyelmeztetés", icon: AlertTriangle, color: "text-amber-500" },
  promo: { label: "Akció / Promóció", icon: Gift, color: "text-primary" },
};

const AnnouncementEditor = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [form, setForm] = useState<AnnouncementData>(DEFAULT_DATA);
  const [saving, setSaving] = useState(false);
  const [open, setOpen] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ["announcement-settings"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("settings")
        .select("value_json")
        .eq("key", "announcement")
        .maybeSingle();
      if (error) throw error;
      return (data?.value_json as unknown as AnnouncementData) ?? null;
    },
  });

  useEffect(() => {
    if (data) setForm(data);
  }, [data]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload: AnnouncementData = {
        ...form,
        updatedAt: new Date().toISOString(),
      };
      const { error } = await supabase
        .from("settings")
        .upsert({ key: "announcement", value_json: payload as any }, { onConflict: "key" });
      if (error) throw error;
      queryClient.invalidateQueries({ queryKey: ["announcement-settings"] });
      queryClient.invalidateQueries({ queryKey: ["announcement-popup"] });
      toast({ title: "Értesítő mentve!" });
    } catch (err: any) {
      toast({ title: "Hiba", description: err.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const TypeIcon = TYPE_CONFIG[form.type]?.icon || Info;

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <Card>
        <CollapsibleTrigger asChild>
          <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
            <CardTitle className="flex items-center justify-between text-base">
              <div className="flex items-center gap-2">
                <Megaphone className="h-5 w-5 text-primary" />
                <span>Értesítő / Pop-up</span>
                {form.enabled && (
                  <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full font-medium">
                    Aktív
                  </span>
                )}
              </div>
              <ChevronDown className={cn("h-4 w-4 transition-transform", open && "rotate-180")} />
            </CardTitle>
          </CardHeader>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <CardContent className="space-y-4 pt-0">
            {/* Toggle */}
            <div className="flex items-center justify-between">
              <Label htmlFor="announcement-enabled" className="font-medium">
                Értesítő megjelenítése
              </Label>
              <Switch
                id="announcement-enabled"
                checked={form.enabled}
                onCheckedChange={(v) => setForm((f) => ({ ...f, enabled: v }))}
              />
            </div>

            {/* Type */}
            <div className="space-y-1.5">
              <Label>Típus</Label>
              <Select
                value={form.type}
                onValueChange={(v) => setForm((f) => ({ ...f, type: v as AnnouncementData["type"] }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(TYPE_CONFIG).map(([key, cfg]) => (
                    <SelectItem key={key} value={key}>
                      <span className="flex items-center gap-2">
                        <cfg.icon className={cn("h-4 w-4", cfg.color)} />
                        {cfg.label}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Title */}
            <div className="space-y-1.5">
              <Label>Cím</Label>
              <Input
                value={form.title}
                onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                placeholder="pl. Húsvéti nyitvatartás"
              />
            </div>

            {/* Message */}
            <div className="space-y-1.5">
              <Label>Üzenet</Label>
              <Textarea
                value={form.message}
                onChange={(e) => setForm((f) => ({ ...f, message: e.target.value }))}
                placeholder="pl. Április 18-21 között zárva tartunk."
                rows={3}
              />
            </div>

            {/* CTA */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Gomb szöveg (opcionális)</Label>
                <Input
                  value={form.ctaText}
                  onChange={(e) => setForm((f) => ({ ...f, ctaText: e.target.value }))}
                  placeholder="pl. Részletek"
                />
              </div>
              <div className="space-y-1.5">
                <Label>Gomb link (opcionális)</Label>
                <Input
                  value={form.ctaLink}
                  onChange={(e) => setForm((f) => ({ ...f, ctaLink: e.target.value }))}
                  placeholder="pl. /etlap"
                />
              </div>
            </div>

            {/* Preview toggle */}
            {form.title && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowPreview((p) => !p)}
                className="gap-1.5"
              >
                <Eye className="h-4 w-4" />
                {showPreview ? "Előnézet elrejtése" : "Előnézet"}
              </Button>
            )}

            {/* Mini Preview */}
            {showPreview && form.title && (
              <div
                className={cn(
                  "rounded-lg border-2 p-4 space-y-2",
                  form.type === "info" && "border-blue-300 bg-muted/50",
                  form.type === "warning" && "border-amber-300 bg-muted/50",
                  form.type === "promo" && "border-primary/50 bg-primary/5"
                )}
              >
                <div className="flex items-center gap-2">
                  <TypeIcon className={cn("h-5 w-5", TYPE_CONFIG[form.type].color)} />
                  <span className="font-semibold text-sm">{form.title}</span>
                </div>
                {form.message && <p className="text-sm text-muted-foreground">{form.message}</p>}
                {form.ctaText && (
                  <Button size="sm" variant="outline" className="mt-1 pointer-events-none">
                    {form.ctaText}
                  </Button>
                )}
              </div>
            )}

            {/* Save */}
            <Button onClick={handleSave} disabled={saving} className="w-full gap-2">
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              Mentés
            </Button>
          </CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
};

export default AnnouncementEditor;
