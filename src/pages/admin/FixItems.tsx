import { useEffect, useMemo, useState } from "react";
import AdminLayout from "./AdminLayout";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { LoadingSpinner } from "@/components/ui/loading";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import ImageUpload from "@/components/admin/ImageUpload";
import InfoTip from "@/components/admin/InfoTip";
import { capitalizeFirst } from "@/lib/utils";
import { GripVertical, Edit, Trash2, Plus, Eye, EyeOff, ImageIcon, List, Save, Pin } from "lucide-react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

interface MenuCategory {
  id: string;
  name: string;
  sort: number;
}

interface MenuItem {
  id: string;
  name: string;
  description: string | null;
  price_huf: number;
  image_url: string | null;
  allergens: string[] | null;
  category_id: string | null;
  is_active: boolean;
  is_always_available: boolean;
  display_order: number;
}

type DisplaySettings = Record<string, { showImages: boolean }>;

const SETTINGS_KEY = "always_available_display";

const FixItemRow = ({
  item,
  onEdit,
  onDelete,
  onToggleActive,
}: {
  item: MenuItem;
  onEdit: (it: MenuItem) => void;
  onDelete: (id: string) => void;
  onToggleActive: (it: MenuItem) => void;
}) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: item.id });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.6 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center gap-2 sm:gap-3 p-2 sm:p-3 border rounded-lg bg-card hover:bg-muted/40 transition-colors"
    >
      <button
        type="button"
        className="touch-none p-1 text-muted-foreground hover:text-foreground cursor-grab active:cursor-grabbing"
        aria-label="Húzd a sorrendezéshez"
        {...attributes}
        {...listeners}
      >
        <GripVertical className="h-5 w-5" />
      </button>

      {item.image_url ? (
        <img
          src={item.image_url}
          alt={item.name}
          className="w-10 h-10 sm:w-12 sm:h-12 object-cover rounded-md flex-shrink-0"
        />
      ) : (
        <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-md bg-muted flex items-center justify-center flex-shrink-0">
          <ImageIcon className="h-4 w-4 text-muted-foreground/50" />
        </div>
      )}

      <div className="flex-1 min-w-0">
        <div className="font-medium text-sm sm:text-base truncate">{capitalizeFirst(item.name)}</div>
        <div className="flex items-center gap-2 mt-0.5">
          <span className="text-xs sm:text-sm font-semibold text-primary">{item.price_huf} Ft</span>
          {!item.is_active && <Badge variant="secondary" className="text-[10px]">Inaktív</Badge>}
        </div>
      </div>

      <div className="flex items-center gap-1">
        <Button variant="ghost" size="sm" onClick={() => onToggleActive(item)} className="h-8 w-8 p-0" title={item.is_active ? "Inaktívvá tesz" : "Aktívvá tesz"}>
          {item.is_active ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4 text-muted-foreground" />}
        </Button>
        <Button variant="ghost" size="sm" onClick={() => onEdit(item)} className="h-8 w-8 p-0">
          <Edit className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            if (confirm(`Biztosan törlöd: "${item.name}"?`)) onDelete(item.id);
          }}
          className="h-8 w-8 p-0 text-destructive hover:text-destructive"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};

const FixItems = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState<MenuCategory[]>([]);
  const [items, setItems] = useState<MenuItem[]>([]);
  const [displaySettings, setDisplaySettings] = useState<DisplaySettings>({});

  const [editing, setEditing] = useState<MenuItem | null>(null);
  const [creatingForCategory, setCreatingForCategory] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({
    name: "",
    description: "",
    price_huf: "",
    category_id: "",
    allergens: "",
    image_url: "",
    is_active: true,
  });

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  useEffect(() => {
    void loadAll();
  }, []);

  const loadAll = async () => {
    setLoading(true);
    const [catsRes, itemsRes, settingsRes] = await Promise.all([
      supabase.from("menu_categories").select("*").order("sort"),
      supabase
        .from("menu_items")
        .select("*")
        .eq("is_always_available", true)
        .order("display_order")
        .order("name"),
      supabase.from("settings").select("value_json").eq("key", SETTINGS_KEY).maybeSingle(),
    ]);

    if (catsRes.error || itemsRes.error) {
      toast({ title: "Hiba", description: "Nem sikerült betölteni az adatokat", variant: "destructive" });
    }
    setCategories(catsRes.data || []);
    setItems((itemsRes.data || []) as MenuItem[]);
    setDisplaySettings((settingsRes.data?.value_json as DisplaySettings) || {});
    setLoading(false);
  };

  const grouped = useMemo(() => {
    const map = new Map<string, MenuItem[]>();
    for (const cat of categories) map.set(cat.id, []);
    const uncategorized: MenuItem[] = [];
    for (const it of items) {
      if (it.category_id && map.has(it.category_id)) map.get(it.category_id)!.push(it);
      else uncategorized.push(it);
    }
    for (const arr of map.values()) arr.sort((a, b) => a.display_order - b.display_order || a.name.localeCompare(b.name));
    return { map, uncategorized };
  }, [items, categories]);

  const handleDragEnd = async (event: DragEndEvent, categoryId: string) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const list = grouped.map.get(categoryId) || [];
    const oldIdx = list.findIndex((i) => i.id === active.id);
    const newIdx = list.findIndex((i) => i.id === over.id);
    if (oldIdx < 0 || newIdx < 0) return;
    const reordered = arrayMove(list, oldIdx, newIdx);

    // Optimistic update
    const updates = reordered.map((it, idx) => ({ ...it, display_order: idx + 1 }));
    setItems((prev) => {
      const others = prev.filter((p) => p.category_id !== categoryId);
      return [...others, ...updates];
    });

    // Persist
    const results = await Promise.all(
      updates.map((u) => supabase.from("menu_items").update({ display_order: u.display_order }).eq("id", u.id))
    );
    if (results.some((r) => r.error)) {
      toast({ title: "Hiba", description: "Nem sikerült a sorrendet menteni", variant: "destructive" });
      void loadAll();
    }
  };

  const toggleCategoryImages = async (categoryId: string, showImages: boolean) => {
    const next: DisplaySettings = { ...displaySettings, [categoryId]: { showImages } };
    setDisplaySettings(next);
    const { error } = await supabase
      .from("settings")
      .upsert({ key: SETTINGS_KEY, value_json: next }, { onConflict: "key" });
    if (error) {
      toast({ title: "Hiba", description: "Nem sikerült menteni a beállítást", variant: "destructive" });
      void loadAll();
    } else {
      toast({ title: "Beállítás mentve", description: showImages ? "Képes megjelenítés" : "Lista nézet (kép nélkül)" });
    }
  };

  const openEdit = (item: MenuItem) => {
    setEditing(item);
    setCreatingForCategory(null);
    setForm({
      name: item.name,
      description: item.description || "",
      price_huf: item.price_huf.toString(),
      category_id: item.category_id || "",
      allergens: (item.allergens || []).join(", "),
      image_url: item.image_url || "",
      is_active: item.is_active,
    });
    setDialogOpen(true);
  };

  const openCreate = (categoryId: string) => {
    setEditing(null);
    setCreatingForCategory(categoryId);
    setForm({
      name: "",
      description: "",
      price_huf: "",
      category_id: categoryId,
      allergens: "",
      image_url: "",
      is_active: true,
    });
    setDialogOpen(true);
  };

  const saveItem = async () => {
    if (!form.name.trim() || !form.price_huf || !form.category_id) {
      toast({ title: "Hiányzó adat", description: "Név, ár és kategória kötelező", variant: "destructive" });
      return;
    }
    const allergens = form.allergens.split(",").map((s) => s.trim()).filter(Boolean);
    const data = {
      name: capitalizeFirst(form.name.trim()),
      description: form.description || null,
      price_huf: parseInt(form.price_huf),
      category_id: form.category_id,
      allergens,
      image_url: form.image_url || null,
      is_active: form.is_active,
      is_always_available: true,
    };

    let res;
    if (editing) {
      res = await supabase.from("menu_items").update(data).eq("id", editing.id);
    } else {
      // Compute next display_order in target category
      const list = grouped.map.get(form.category_id) || [];
      const nextOrder = list.length > 0 ? Math.max(...list.map((i) => i.display_order)) + 1 : 1;
      res = await supabase.from("menu_items").insert({ ...data, display_order: nextOrder });
    }
    if (res.error) {
      toast({ title: "Hiba", description: res.error.message, variant: "destructive" });
      return;
    }
    toast({ title: "Mentve", description: editing ? "Tétel frissítve" : "Új tétel hozzáadva" });
    setDialogOpen(false);
    void loadAll();
  };

  const deleteItem = async (id: string) => {
    const { error } = await supabase.from("menu_items").delete().eq("id", id);
    if (error) {
      toast({ title: "Hiba", description: "Nem sikerült törölni", variant: "destructive" });
      return;
    }
    toast({ title: "Törölve" });
    void loadAll();
  };

  const toggleActive = async (item: MenuItem) => {
    const { error } = await supabase.from("menu_items").update({ is_active: !item.is_active }).eq("id", item.id);
    if (error) {
      toast({ title: "Hiba", variant: "destructive" });
      return;
    }
    void loadAll();
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex justify-center py-16"><LoadingSpinner className="h-8 w-8" /></div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6 py-4">
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold flex items-center gap-2">
              <Pin className="h-6 w-6 text-primary" />
              Fix tételek
              <InfoTip text="Az állandóan elérhető tételek (italok, savanyúság, desszertek). Húzással átrendezheted, kategóriánként beállíthatod hogy képpel vagy lista formában jelenjenek meg a vendégek számára." />
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Húzd a sorokat a sorrend változtatásához. Kategóriánként választhatsz képes vagy lista nézetet.
            </p>
          </div>
        </div>

        {categories.map((cat) => {
          const list = grouped.map.get(cat.id) || [];
          const showImages = displaySettings[cat.id]?.showImages !== false; // default ON

          return (
            <Card key={cat.id}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between gap-3 flex-wrap">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    {cat.name}
                    <Badge variant="secondary">{list.length} tétel</Badge>
                  </CardTitle>

                  <div className="flex items-center gap-3 flex-wrap">
                    <label className="flex items-center gap-2 text-sm cursor-pointer">
                      {showImages ? <ImageIcon className="h-4 w-4 text-primary" /> : <List className="h-4 w-4 text-muted-foreground" />}
                      <span>{showImages ? "Képes megjelenítés" : "Lista (kép nélkül)"}</span>
                      <Switch checked={showImages} onCheckedChange={(v) => toggleCategoryImages(cat.id, v)} />
                    </label>
                    <Button size="sm" onClick={() => openCreate(cat.id)}>
                      <Plus className="h-4 w-4 mr-1" />
                      Új tétel
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {list.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-4 text-center">Nincs tétel ebben a kategóriában.</p>
                ) : (
                  <DndContext
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    onDragEnd={(e) => handleDragEnd(e, cat.id)}
                  >
                    <SortableContext items={list.map((i) => i.id)} strategy={verticalListSortingStrategy}>
                      <div className="space-y-2">
                        {list.map((it) => (
                          <FixItemRow
                            key={it.id}
                            item={it}
                            onEdit={openEdit}
                            onDelete={deleteItem}
                            onToggleActive={toggleActive}
                          />
                        ))}
                      </div>
                    </SortableContext>
                  </DndContext>
                )}
              </CardContent>
            </Card>
          );
        })}

        {grouped.uncategorized.length > 0 && (
          <Card>
            <CardHeader><CardTitle className="text-lg">Kategória nélküli</CardTitle></CardHeader>
            <CardContent>
              <div className="space-y-2">
                {grouped.uncategorized.map((it) => (
                  <FixItemRow key={it.id} item={it} onEdit={openEdit} onDelete={deleteItem} onToggleActive={toggleActive} />
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="sm:max-w-lg max-h-[calc(100dvh-2rem)] flex flex-col overflow-hidden">
            <DialogHeader>
              <DialogTitle>{editing ? "Tétel szerkesztése" : "Új fix tétel"}</DialogTitle>
            </DialogHeader>
            <div className="flex-1 overflow-y-auto space-y-3 pr-1">
              <div>
                <label className="text-sm font-medium">Név</label>
                <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              </div>
              <div>
                <label className="text-sm font-medium">Leírás</label>
                <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-medium">Ár (Ft)</label>
                  <Input type="number" value={form.price_huf} onChange={(e) => setForm({ ...form, price_huf: e.target.value })} />
                </div>
                <div>
                  <label className="text-sm font-medium">Kategória</label>
                  <Select value={form.category_id} onValueChange={(v) => setForm({ ...form, category_id: v })}>
                    <SelectTrigger><SelectValue placeholder="Válassz" /></SelectTrigger>
                    <SelectContent>
                      {categories.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium">Allergének (vesszővel)</label>
                <Input value={form.allergens} onChange={(e) => setForm({ ...form, allergens: e.target.value })} placeholder="pl. tejtermék, glutén" />
              </div>
              <div>
                <label className="text-sm font-medium">Kép (opcionális)</label>
                <ImageUpload
                  currentImageUrl={form.image_url}
                  onImageUploaded={(url) => setForm({ ...form, image_url: url })}
                  onImageRemoved={() => setForm({ ...form, image_url: "" })}
                  bucketName="menu-images"
                />
              </div>
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={form.is_active} onChange={(e) => setForm({ ...form, is_active: e.target.checked })} />
                Aktív
              </label>
            </div>
            <div className="flex-shrink-0 border-t pt-3 flex gap-2">
              <Button onClick={saveItem} className="flex-1"><Save className="h-4 w-4 mr-2" />Mentés</Button>
              <Button variant="outline" onClick={() => setDialogOpen(false)}>Mégse</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
};

export default FixItems;
