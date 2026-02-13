import { useState, useEffect } from "react";
import AdminLayout from "./AdminLayout";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/components/ui/use-toast";
import { Loader2, Plus, Tag, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { hu } from "date-fns/locale";

interface Coupon {
  id: string;
  code: string;
  discount_type: string;
  discount_value: number;
  min_order_huf: number;
  max_uses: number | null;
  used_count: number;
  valid_from: string;
  valid_until: string | null;
  is_active: boolean;
  created_at: string;
}

const Coupons = () => {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const { toast } = useToast();

  const [newCoupon, setNewCoupon] = useState({
    code: "",
    discount_type: "percentage" as "percentage" | "fixed",
    discount_value: 10,
    min_order_huf: 0,
    max_uses: "" as string | number,
    valid_until: "",
  });

  const fetchCoupons = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("coupons")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      toast({ title: "Hiba", description: error.message, variant: "destructive" });
    } else {
      setCoupons(data || []);
    }
    setLoading(false);
  };

  useEffect(() => { fetchCoupons(); }, []);

  const handleCreate = async () => {
    if (!newCoupon.code) {
      toast({ title: "Hiba", description: "Kupon kód megadása kötelező", variant: "destructive" });
      return;
    }

    const { error } = await supabase.from("coupons").insert({
      code: newCoupon.code.toUpperCase().trim(),
      discount_type: newCoupon.discount_type,
      discount_value: newCoupon.discount_value,
      min_order_huf: newCoupon.min_order_huf,
      max_uses: newCoupon.max_uses ? Number(newCoupon.max_uses) : null,
      valid_until: newCoupon.valid_until || null,
    });

    if (error) {
      toast({ title: "Hiba", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Kupon létrehozva!" });
      setDialogOpen(false);
      setNewCoupon({ code: "", discount_type: "percentage", discount_value: 10, min_order_huf: 0, max_uses: "", valid_until: "" });
      fetchCoupons();
    }
  };

  const toggleActive = async (id: string, currentActive: boolean) => {
    const { error } = await supabase.from("coupons").update({ is_active: !currentActive }).eq("id", id);
    if (error) {
      toast({ title: "Hiba", description: error.message, variant: "destructive" });
    } else {
      fetchCoupons();
    }
  };

  const deleteCoupon = async (id: string) => {
    const { error } = await supabase.from("coupons").delete().eq("id", id);
    if (error) {
      toast({ title: "Hiba", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Kupon törölve" });
      fetchCoupons();
    }
  };

  return (
    <AdminLayout>
      <div className="py-6 space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Kuponok</h1>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Új kupon
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Új kupon létrehozása</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 mt-4">
                <div>
                  <Label>Kupon kód</Label>
                  <Input
                    placeholder="pl. ELSO10"
                    value={newCoupon.code}
                    onChange={(e) => setNewCoupon(prev => ({ ...prev, code: e.target.value }))}
                    className="uppercase"
                  />
                </div>
                <div>
                  <Label>Kedvezmény típusa</Label>
                  <Select
                    value={newCoupon.discount_type}
                    onValueChange={(v) => setNewCoupon(prev => ({ ...prev, discount_type: v as any }))}
                  >
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="percentage">Százalék (%)</SelectItem>
                      <SelectItem value="fixed">Fix összeg (Ft)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Érték ({newCoupon.discount_type === "percentage" ? "%" : "Ft"})</Label>
                  <Input
                    type="number"
                    value={newCoupon.discount_value}
                    onChange={(e) => setNewCoupon(prev => ({ ...prev, discount_value: parseInt(e.target.value) || 0 }))}
                  />
                </div>
                <div>
                  <Label>Min. rendelési érték (Ft)</Label>
                  <Input
                    type="number"
                    value={newCoupon.min_order_huf}
                    onChange={(e) => setNewCoupon(prev => ({ ...prev, min_order_huf: parseInt(e.target.value) || 0 }))}
                  />
                </div>
                <div>
                  <Label>Max felhasználások (üres = korlátlan)</Label>
                  <Input
                    type="number"
                    value={newCoupon.max_uses}
                    onChange={(e) => setNewCoupon(prev => ({ ...prev, max_uses: e.target.value }))}
                    placeholder="Korlátlan"
                  />
                </div>
                <div>
                  <Label>Lejárat (üres = nincs lejárat)</Label>
                  <Input
                    type="datetime-local"
                    value={newCoupon.valid_until}
                    onChange={(e) => setNewCoupon(prev => ({ ...prev, valid_until: e.target.value }))}
                  />
                </div>
                <Button onClick={handleCreate} className="w-full">Létrehozás</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : coupons.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              <Tag className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Még nincs kupon. Hozz létre egyet!</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {coupons.map((coupon) => {
              const isExpired = coupon.valid_until && new Date(coupon.valid_until) < new Date();
              const isMaxed = coupon.max_uses !== null && coupon.used_count >= coupon.max_uses;

              return (
                <Card key={coupon.id} className={(!coupon.is_active || isExpired || isMaxed) ? "opacity-60" : ""}>
                  <CardContent className="py-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-mono text-lg font-bold">{coupon.code}</span>
                          <Badge variant={coupon.discount_type === "percentage" ? "default" : "secondary"}>
                            {coupon.discount_type === "percentage" ? `${coupon.discount_value}%` : `${coupon.discount_value} Ft`}
                          </Badge>
                          {!coupon.is_active && <Badge variant="outline">Inaktív</Badge>}
                          {isExpired && <Badge variant="destructive">Lejárt</Badge>}
                          {isMaxed && <Badge variant="destructive">Elfogyott</Badge>}
                        </div>
                        <p className="text-sm text-muted-foreground">
                          Felhasználva: {coupon.used_count}{coupon.max_uses ? `/${coupon.max_uses}` : ""} ·
                          Min: {coupon.min_order_huf.toLocaleString()} Ft
                          {coupon.valid_until ? ` · Lejárat: ${format(new Date(coupon.valid_until), "yyyy.MM.dd HH:mm", { locale: hu })}` : ""}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={coupon.is_active}
                          onCheckedChange={() => toggleActive(coupon.id, coupon.is_active)}
                        />
                        <Button variant="ghost" size="icon" onClick={() => deleteCoupon(coupon.id)}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default Coupons;
