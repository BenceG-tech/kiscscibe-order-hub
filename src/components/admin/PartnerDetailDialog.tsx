import { useState } from "react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Trash2, Archive, TrendingUp, Receipt, Mail, Phone, MapPin, Building, CreditCard } from "lucide-react";
import {
  useUpdatePartner, useDeletePartner, usePartnerInvoices,
  PARTNER_CATEGORIES, PAYMENT_TERMS, type Partner,
} from "@/hooks/usePartners";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  partner: Partner;
}

const STATUS_COLORS: Record<string, string> = {
  draft: "secondary",
  pending: "outline",
  paid: "default",
  overdue: "destructive",
  cancelled: "secondary",
};
const STATUS_LABELS: Record<string, string> = {
  draft: "Piszkozat", pending: "Függőben", paid: "Fizetve", overdue: "Lejárt", cancelled: "Sztornó",
};

const fmt = (n: number) =>
  n.toLocaleString("hu-HU", { style: "currency", currency: "HUF", maximumFractionDigits: 0 });

const PartnerDetailDialog = ({ open, onOpenChange, partner }: Props) => {
  const [form, setForm] = useState({ ...partner });
  const [isDirty, setIsDirty] = useState(false);

  const update = useUpdatePartner();
  const del = useDeletePartner();
  const { data: invoices = [] } = usePartnerInvoices(partner.id, partner.name);

  const hasInvoices = invoices.length > 0;
  const totalGross = invoices.reduce((s, inv) => s + (inv.gross_amount || 0), 0);

  const set = (key: string, val: any) => {
    setForm((f) => ({ ...f, [key]: val }));
    setIsDirty(true);
  };

  const handleSave = () => {
    update.mutate({ id: partner.id, ...form }, {
      onSuccess: () => setIsDirty(false),
    });
  };

  const handleArchive = () => {
    update.mutate({ id: partner.id, is_active: false }, {
      onSuccess: () => onOpenChange(false),
    });
  };

  const handleDelete = () => {
    del.mutate(partner.id, {
      onSuccess: () => onOpenChange(false),
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl flex flex-col max-h-[calc(100dvh-2rem)] overflow-hidden">
        <DialogHeader className="shrink-0">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <DialogTitle className="flex items-center gap-2 flex-wrap">
                {partner.name}
                {!partner.is_active && (
                  <Badge variant="secondary" className="text-xs">Archivált</Badge>
                )}
              </DialogTitle>
              <p className="text-sm text-muted-foreground mt-0.5">
                {PARTNER_CATEGORIES[partner.category] || partner.category}
                {partner.tax_number && ` • ${partner.tax_number}`}
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <Switch
                checked={form.is_active}
                onCheckedChange={(v) => set("is_active", v)}
              />
              <span className="text-xs text-muted-foreground">{form.is_active ? "Aktív" : "Inaktív"}</span>
            </div>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-4 py-2">
          {/* Edit form */}
          <Tabs defaultValue="basic">
            <TabsList className="w-full">
              <TabsTrigger value="basic" className="flex-1">Alapadatok</TabsTrigger>
              <TabsTrigger value="contact" className="flex-1">Cím & Kapcsolat</TabsTrigger>
              <TabsTrigger value="financial" className="flex-1">Pénzügyi</TabsTrigger>
            </TabsList>

            <TabsContent value="basic" className="space-y-3 mt-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2 space-y-1.5">
                  <Label>Név *</Label>
                  <Input value={form.name} onChange={(e) => set("name", e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label>Rövid név</Label>
                  <Input value={form.short_name || ""} onChange={(e) => set("short_name", e.target.value || null)} />
                </div>
                <div className="space-y-1.5">
                  <Label>Kategória</Label>
                  <Select value={form.category} onValueChange={(v) => set("category", v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {Object.entries(PARTNER_CATEGORIES).map(([val, label]) => (
                        <SelectItem key={val} value={val}>{label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>Adószám</Label>
                  <Input value={form.tax_number || ""} onChange={(e) => set("tax_number", e.target.value || null)} placeholder="12345678-2-42" />
                </div>
                <div className="space-y-1.5">
                  <Label>EU adószám</Label>
                  <Input value={form.eu_vat_number || ""} onChange={(e) => set("eu_vat_number", e.target.value || null)} placeholder="HU12345678" />
                </div>
                <div className="col-span-2 space-y-1.5">
                  <Label>Fizetési feltétel</Label>
                  <Select value={form.payment_terms} onValueChange={(v) => set("payment_terms", v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {Object.entries(PAYMENT_TERMS).map(([val, label]) => (
                        <SelectItem key={val} value={val}>{label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="contact" className="space-y-3 mt-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label><MapPin className="h-3 w-3 inline mr-1" />Irányítószám</Label>
                  <Input value={form.postal_code || ""} onChange={(e) => set("postal_code", e.target.value || null)} />
                </div>
                <div className="space-y-1.5">
                  <Label>Város</Label>
                  <Input value={form.city || ""} onChange={(e) => set("city", e.target.value || null)} />
                </div>
                <div className="col-span-2 space-y-1.5">
                  <Label>Cím</Label>
                  <Input value={form.address || ""} onChange={(e) => set("address", e.target.value || null)} />
                </div>
                <div className="col-span-2 space-y-1.5">
                  <Label><Building className="h-3 w-3 inline mr-1" />Kapcsolattartó neve</Label>
                  <Input value={form.contact_name || ""} onChange={(e) => set("contact_name", e.target.value || null)} />
                </div>
                <div className="space-y-1.5">
                  <Label><Mail className="h-3 w-3 inline mr-1" />Email</Label>
                  <Input type="email" value={form.contact_email || ""} onChange={(e) => set("contact_email", e.target.value || null)} />
                </div>
                <div className="space-y-1.5">
                  <Label><Phone className="h-3 w-3 inline mr-1" />Telefon</Label>
                  <Input value={form.contact_phone || ""} onChange={(e) => set("contact_phone", e.target.value || null)} />
                </div>
              </div>
            </TabsContent>

            <TabsContent value="financial" className="space-y-3 mt-3">
              <div className="space-y-3">
                <div className="space-y-1.5">
                  <Label><CreditCard className="h-3 w-3 inline mr-1" />Bank neve</Label>
                  <Input value={form.bank_name || ""} onChange={(e) => set("bank_name", e.target.value || null)} />
                </div>
                <div className="space-y-1.5">
                  <Label>IBAN / Bankszámlaszám</Label>
                  <Input value={form.bank_iban || ""} onChange={(e) => set("bank_iban", e.target.value || null)} />
                </div>
                <div className="space-y-1.5">
                  <Label>Megjegyzés</Label>
                  <Textarea value={form.notes || ""} onChange={(e) => set("notes", e.target.value || null)} rows={3} />
                </div>
              </div>
            </TabsContent>
          </Tabs>

          {isDirty && (
            <div className="flex justify-end">
              <Button onClick={handleSave} disabled={update.isPending} size="sm">
                {update.isPending ? "Mentés..." : "Változások mentése"}
              </Button>
            </div>
          )}

          <Separator />

          {/* Linked invoices */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold flex items-center gap-2">
                <Receipt className="h-4 w-4" />
                Kapcsolt számlák
                <Badge variant="secondary">{invoices.length} db</Badge>
              </h3>
              {hasInvoices && (
                <div className="flex items-center gap-1.5 text-sm font-medium">
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                  <span>{fmt(totalGross)}</span>
                </div>
              )}
            </div>

            {invoices.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">
                Még nincs kapcsolt számla ehhez a partnerhez.
              </p>
            ) : (
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {invoices.map((inv: any) => (
                  <div key={inv.id} className="flex items-center justify-between py-2 px-3 rounded-md bg-muted/50 text-sm">
                    <div className="min-w-0">
                      <div className="font-medium truncate">
                        {inv.invoice_number || "Számla"} — {new Date(inv.issue_date).toLocaleDateString("hu-HU")}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {inv.category}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0 ml-2">
                      <Badge variant={(STATUS_COLORS[inv.status] || "secondary") as any} className="text-[10px]">
                        {STATUS_LABELS[inv.status] || inv.status}
                      </Badge>
                      <span className={`font-semibold text-xs ${inv.type === "incoming" ? "text-destructive" : "text-green-600"}`}>
                        {inv.type === "incoming" ? "-" : "+"}{fmt(inv.gross_amount)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer actions */}
        <div className="shrink-0 flex items-center justify-between pt-2 border-t">
          <div className="flex gap-2">
            {hasInvoices ? (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="outline" size="sm" className="text-muted-foreground gap-1.5">
                    <Archive className="h-4 w-4" />
                    Archiválás
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Partner archiválása</AlertDialogTitle>
                    <AlertDialogDescription>
                      Ennek a partnernek vannak kapcsolt számlái, ezért csak archiválható, nem törölhető.
                      Az archivált partner nem jelenik meg a partner-választóban.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Mégse</AlertDialogCancel>
                    <AlertDialogAction onClick={handleArchive}>Archiválás</AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            ) : (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="outline" size="sm" className="text-destructive gap-1.5">
                    <Trash2 className="h-4 w-4" />
                    Törlés
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Partner törlése</AlertDialogTitle>
                    <AlertDialogDescription>
                      Biztosan törlöd a(z) <strong>{partner.name}</strong> partnert? Ez a művelet nem visszavonható.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Mégse</AlertDialogCancel>
                    <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                      Törlés
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
          </div>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Bezárás</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PartnerDetailDialog;
