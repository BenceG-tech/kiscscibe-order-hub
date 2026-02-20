import { useState, useEffect } from "react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useCreatePartner, useUpdatePartner, type Partner } from "@/hooks/usePartners";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  partner?: Partner | null;
}

const CATEGORIES = [
  { value: "food_supplier", label: "Alapanyag beszállító" },
  { value: "beverage", label: "Ital" },
  { value: "cleaning", label: "Takarítás" },
  { value: "equipment", label: "Felszerelés" },
  { value: "utility", label: "Közüzem" },
  { value: "service", label: "Szolgáltatás" },
  { value: "other", label: "Egyéb" },
];

const PAYMENT_TERMS = [
  { value: "immediate", label: "Azonnali" },
  { value: "net_8", label: "8 napos" },
  { value: "net_15", label: "15 napos" },
  { value: "net_30", label: "30 napos" },
];

const defaultForm = {
  name: "",
  short_name: "",
  tax_number: "",
  eu_vat_number: "",
  address: "",
  postal_code: "",
  city: "",
  contact_name: "",
  contact_email: "",
  contact_phone: "",
  payment_terms: "net_15",
  bank_name: "",
  bank_iban: "",
  category: "other",
  is_active: true,
  notes: "",
};

const PartnerFormDialog = ({ open, onOpenChange, partner }: Props) => {
  const [form, setForm] = useState(defaultForm);
  const create = useCreatePartner();
  const update = useUpdatePartner();
  const isEdit = !!partner;

  useEffect(() => {
    if (partner) {
      setForm({
        name: partner.name,
        short_name: partner.short_name || "",
        tax_number: partner.tax_number || "",
        eu_vat_number: partner.eu_vat_number || "",
        address: partner.address || "",
        postal_code: partner.postal_code || "",
        city: partner.city || "",
        contact_name: partner.contact_name || "",
        contact_email: partner.contact_email || "",
        contact_phone: partner.contact_phone || "",
        payment_terms: partner.payment_terms,
        bank_name: partner.bank_name || "",
        bank_iban: partner.bank_iban || "",
        category: partner.category,
        is_active: partner.is_active,
        notes: partner.notes || "",
      });
    } else {
      setForm(defaultForm);
    }
  }, [partner, open]);

  const set = (key: string, val: any) => setForm((f) => ({ ...f, [key]: val }));

  const handleSave = () => {
    if (!form.name.trim()) return;
    const payload = {
      name: form.name.trim(),
      short_name: form.short_name || null,
      tax_number: form.tax_number || null,
      eu_vat_number: form.eu_vat_number || null,
      address: form.address || null,
      postal_code: form.postal_code || null,
      city: form.city || null,
      contact_name: form.contact_name || null,
      contact_email: form.contact_email || null,
      contact_phone: form.contact_phone || null,
      payment_terms: form.payment_terms,
      bank_name: form.bank_name || null,
      bank_iban: form.bank_iban || null,
      category: form.category,
      is_active: form.is_active,
      notes: form.notes || null,
    };

    if (isEdit && partner) {
      update.mutate({ id: partner.id, ...payload }, { onSuccess: () => onOpenChange(false) });
    } else {
      create.mutate(payload, { onSuccess: () => onOpenChange(false) });
    }
  };

  const isPending = create.isPending || update.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg flex flex-col max-h-[calc(100dvh-2rem)] overflow-hidden">
        <DialogHeader className="shrink-0">
          <DialogTitle>{isEdit ? "Partner szerkesztése" : "Új partner"}</DialogTitle>
          <DialogDescription>Add meg a partner/beszállító adatait.</DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-4 py-2 pr-1">
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1.5 col-span-2 sm:col-span-1">
              <Label>Név *</Label>
              <Input value={form.name} onChange={(e) => set("name", e.target.value)} placeholder="pl. Metro Kft." />
            </div>
            <div className="space-y-1.5 col-span-2 sm:col-span-1">
              <Label>Rövid név</Label>
              <Input value={form.short_name} onChange={(e) => set("short_name", e.target.value)} placeholder="pl. Metro" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1.5">
              <Label>Adószám</Label>
              <Input value={form.tax_number} onChange={(e) => set("tax_number", e.target.value)} placeholder="12345678-2-42" />
            </div>
            <div className="space-y-1.5">
              <Label>EU adószám</Label>
              <Input value={form.eu_vat_number} onChange={(e) => set("eu_vat_number", e.target.value)} placeholder="HU12345678" />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <div className="space-y-1.5">
              <Label>Irányítószám</Label>
              <Input value={form.postal_code} onChange={(e) => set("postal_code", e.target.value)} placeholder="1145" />
            </div>
            <div className="space-y-1.5">
              <Label>Város</Label>
              <Input value={form.city} onChange={(e) => set("city", e.target.value)} placeholder="Budapest" />
            </div>
            <div className="space-y-1.5 col-span-3 sm:col-span-1">
              <Label>Cím</Label>
              <Input value={form.address} onChange={(e) => set("address", e.target.value)} placeholder="Kerepesi út 9." />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <div className="space-y-1.5">
              <Label>Kapcsolattartó</Label>
              <Input value={form.contact_name} onChange={(e) => set("contact_name", e.target.value)} placeholder="Kovács Péter" />
            </div>
            <div className="space-y-1.5">
              <Label>Email</Label>
              <Input type="email" value={form.contact_email} onChange={(e) => set("contact_email", e.target.value)} placeholder="info@metro.hu" />
            </div>
            <div className="space-y-1.5">
              <Label>Telefon</Label>
              <Input value={form.contact_phone} onChange={(e) => set("contact_phone", e.target.value)} placeholder="+36 1 234 5678" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1.5">
              <Label>Kategória</Label>
              <Select value={form.category} onValueChange={(v) => set("category", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((c) => (
                    <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Fizetési feltétel</Label>
              <Select value={form.payment_terms} onValueChange={(v) => set("payment_terms", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {PAYMENT_TERMS.map((t) => (
                    <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1.5">
              <Label>Bank neve</Label>
              <Input value={form.bank_name} onChange={(e) => set("bank_name", e.target.value)} placeholder="OTP Bank" />
            </div>
            <div className="space-y-1.5">
              <Label>IBAN / Számlaszám</Label>
              <Input value={form.bank_iban} onChange={(e) => set("bank_iban", e.target.value)} placeholder="HU42 1234 5678 9012 3456 7890 1234" />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Megjegyzés</Label>
            <Textarea value={form.notes} onChange={(e) => set("notes", e.target.value)} placeholder="Opcionális megjegyzés..." rows={2} />
          </div>

          <label className="flex items-center gap-2 text-sm">
            <Switch checked={form.is_active} onCheckedChange={(v) => set("is_active", v)} />
            Aktív partner
          </label>
        </div>

        <DialogFooter className="shrink-0">
          <Button variant="outline" onClick={() => onOpenChange(false)}>Mégse</Button>
          <Button onClick={handleSave} disabled={isPending || !form.name.trim()}>
            {isEdit ? "Mentés" : "Létrehozás"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default PartnerFormDialog;
