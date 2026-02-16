import { useState } from "react";
import { useRecurringInvoices, useRecurringInvoiceMutations, type RecurringInvoice } from "@/hooks/useRecurringInvoices";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Trash2, RefreshCw } from "lucide-react";
import InfoTip from "./InfoTip";

const FREQ_LABELS: Record<string, string> = { monthly: "Havi", quarterly: "Negyedéves", yearly: "Éves" };
const CAT_OPTIONS = [
  { value: "rent", label: "Bérleti díj" },
  { value: "utility", label: "Rezsi" },
  { value: "salary", label: "Bér" },
  { value: "tax", label: "Adó" },
  { value: "equipment", label: "Felszerelés" },
  { value: "ingredient", label: "Alapanyagok" },
  { value: "other", label: "Egyéb" },
];

const fmt = (n: number) => `${n.toLocaleString("hu-HU")} Ft`;

const emptyForm = {
  partner_name: "",
  partner_tax_id: "",
  category: "rent",
  gross_amount: 0,
  vat_rate: 27,
  net_amount: 0,
  vat_amount: 0,
  frequency: "monthly",
  day_of_month: 1,
  next_due_date: new Date().toISOString().split("T")[0],
  notes: "",
  is_active: true,
};

const RecurringInvoices = () => {
  const { data: items = [], isLoading } = useRecurringInvoices();
  const { upsert, remove, toggleActive } = useRecurringInvoiceMutations();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState<any>(emptyForm);
  const [editId, setEditId] = useState<string | null>(null);

  const openNew = () => { setEditId(null); setForm({ ...emptyForm }); setDialogOpen(true); };
  const openEdit = (item: RecurringInvoice) => {
    setEditId(item.id);
    setForm({
      partner_name: item.partner_name,
      partner_tax_id: item.partner_tax_id || "",
      category: item.category,
      gross_amount: item.gross_amount,
      vat_rate: item.vat_rate,
      net_amount: item.net_amount,
      vat_amount: item.vat_amount,
      frequency: item.frequency,
      day_of_month: item.day_of_month,
      next_due_date: item.next_due_date,
      notes: item.notes || "",
      is_active: item.is_active,
    });
    setDialogOpen(true);
  };

  const recalcAmounts = (gross: number, vatRate: number) => {
    const net = Math.round(gross / (1 + vatRate / 100));
    return { net_amount: net, vat_amount: gross - net };
  };

  const handleSave = () => {
    const { net_amount, vat_amount } = recalcAmounts(form.gross_amount, form.vat_rate);
    const payload = { ...form, net_amount, vat_amount, partner_tax_id: form.partner_tax_id || null, notes: form.notes || null };
    if (editId) payload.id = editId;
    upsert.mutate(payload);
    setDialogOpen(false);
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <RefreshCw className="h-4 w-4" />
            Ismétlődő számlák
            <InfoTip text="Automatikusan létrejövő számlák (bérleti díj, rezsi stb.)." />
          </CardTitle>
          <Button size="sm" onClick={openNew}><Plus className="h-4 w-4 mr-1" />Új</Button>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <p className="text-sm text-muted-foreground">Betöltés...</p>
        ) : items.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nincs ismétlődő számla.</p>
        ) : (
          <div className="space-y-2">
            {items.map((item) => (
              <div key={item.id} className="flex items-center justify-between gap-2 p-2 rounded-md border text-sm">
                <div className="flex items-center gap-3 min-w-0">
                  <Switch checked={item.is_active} onCheckedChange={(v) => toggleActive.mutate({ id: item.id, is_active: v })} />
                  <div className="min-w-0">
                    <div className="font-medium truncate">{item.partner_name}</div>
                    <div className="text-xs text-muted-foreground">
                      {FREQ_LABELS[item.frequency] || item.frequency} · Köv.: {item.next_due_date}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="font-semibold">{fmt(item.gross_amount)}</span>
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(item)}>✏️</Button>
                  <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => remove.mutate(item.id)}>
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editId ? "Szerkesztés" : "Új ismétlődő számla"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>Partner neve *</Label>
              <Input value={form.partner_name} onChange={(e) => setForm({ ...form, partner_name: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Bruttó összeg (Ft) *</Label>
                <Input type="number" value={form.gross_amount} onChange={(e) => setForm({ ...form, gross_amount: Number(e.target.value) })} />
              </div>
              <div>
                <Label>ÁFA kulcs (%)</Label>
                <Select value={String(form.vat_rate)} onValueChange={(v) => setForm({ ...form, vat_rate: Number(v) })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="27">27%</SelectItem>
                    <SelectItem value="5">5%</SelectItem>
                    <SelectItem value="0">0%</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Kategória</Label>
                <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {CAT_OPTIONS.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Gyakoriság</Label>
                <Select value={form.frequency} onValueChange={(v) => setForm({ ...form, frequency: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="monthly">Havi</SelectItem>
                    <SelectItem value="quarterly">Negyedéves</SelectItem>
                    <SelectItem value="yearly">Éves</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Hónap napja</Label>
                <Input type="number" min={1} max={28} value={form.day_of_month} onChange={(e) => setForm({ ...form, day_of_month: Number(e.target.value) })} />
              </div>
              <div>
                <Label>Következő esedékesség</Label>
                <Input type="date" value={form.next_due_date} onChange={(e) => setForm({ ...form, next_due_date: e.target.value })} />
              </div>
            </div>
            <div>
              <Label>Megjegyzés</Label>
              <Input value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Mégse</Button>
            <Button onClick={handleSave} disabled={!form.partner_name || !form.gross_amount}>Mentés</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
};

export default RecurringInvoices;
