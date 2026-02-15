import { useState, useEffect, useMemo } from "react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Trash2, Lock } from "lucide-react";
import InfoTip from "@/components/admin/InfoTip";
import InvoiceFileUpload from "./InvoiceFileUpload";
import { useCreateInvoice, useUpdateInvoice, useDeleteInvoice, usePartnerSuggestions } from "@/hooks/useInvoices";
import { supabase } from "@/integrations/supabase/client";
import type { Invoice } from "@/hooks/useInvoices";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  invoice?: Invoice | null;
}

const CATEGORIES = [
  { value: "ingredient", label: "Alapanyagok" },
  { value: "utility", label: "Rezsi" },
  { value: "rent", label: "Bérleti díj" },
  { value: "equipment", label: "Felszerelés" },
  { value: "salary", label: "Bér" },
  { value: "tax", label: "Adó" },
  { value: "food_sale", label: "Étel értékesítés" },
  { value: "other", label: "Egyéb" },
];

const defaultForm = {
  type: "incoming" as "incoming" | "outgoing",
  partner_name: "",
  partner_tax_id: "",
  invoice_number: "",
  issue_date: new Date().toISOString().split("T")[0],
  due_date: "",
  category: "ingredient",
  gross_amount: "",
  vat_rate: "27",
  notes: "",
  file_urls: [] as string[],
  status: "draft" as string,
};

const InvoiceFormDialog = ({ open, onOpenChange, invoice }: Props) => {
  const [form, setForm] = useState(defaultForm);
  const [partnerFilter, setPartnerFilter] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);

  const create = useCreateInvoice();
  const update = useUpdateInvoice();
  const del = useDeleteInvoice();
  const { data: partners } = usePartnerSuggestions();

  const isEdit = !!invoice;
  const isOrderReceipt = invoice?.type === "order_receipt";
  const isReadonly = isOrderReceipt;

  useEffect(() => {
    if (invoice) {
      setForm({
        type: invoice.type as any,
        partner_name: invoice.partner_name,
        partner_tax_id: invoice.partner_tax_id || "",
        invoice_number: invoice.invoice_number || "",
        issue_date: invoice.issue_date,
        due_date: invoice.due_date || "",
        category: invoice.category,
        gross_amount: String(invoice.gross_amount),
        vat_rate: String(invoice.vat_rate),
        notes: invoice.notes || "",
        file_urls: invoice.file_urls || [],
        status: invoice.status,
      });
    } else {
      setForm(defaultForm);
    }
  }, [invoice, open]);

  const grossNum = parseInt(form.gross_amount) || 0;
  const vatRate = parseInt(form.vat_rate) || 27;
  const netAmount = Math.round(grossNum / (1 + vatRate / 100));
  const vatAmount = grossNum - netAmount;

  const filteredPartners = useMemo(() => {
    if (!partners || !partnerFilter) return [];
    return partners.filter((p) =>
      p.name.toLowerCase().includes(partnerFilter.toLowerCase())
    );
  }, [partners, partnerFilter]);

  const set = (key: string, val: any) => setForm((f) => ({ ...f, [key]: val }));

  const handleSave = (status: "draft" | "pending" | "paid" | "overdue" | "cancelled") => {
    if (!form.partner_name.trim()) return;

    const payload = {
      type: form.type,
      status,
      partner_name: form.partner_name.trim(),
      partner_tax_id: form.partner_tax_id || null,
      invoice_number: form.invoice_number || null,
      issue_date: form.issue_date,
      due_date: form.due_date || null,
      payment_date: status === "paid" ? new Date().toISOString().split("T")[0] : null,
      category: form.category,
      gross_amount: grossNum,
      net_amount: netAmount,
      vat_amount: vatAmount,
      vat_rate: vatRate,
      notes: form.notes || null,
      file_urls: form.file_urls,
    };

    if (isEdit && invoice) {
      update.mutate({ id: invoice.id, ...payload }, { onSuccess: () => onOpenChange(false) });
    } else {
      create.mutate(payload, { onSuccess: () => onOpenChange(false) });
    }
  };

  const handleDelete = async () => {
    if (!invoice) return;

    if (invoice.file_urls && invoice.file_urls.length > 0) {
      const paths = invoice.file_urls.map((url) => {
        const parts = url.split("/invoices/");
        return parts.length > 1 ? parts[parts.length - 1].split("?")[0] : "";
      }).filter(Boolean);

      if (paths.length > 0) {
        await supabase.storage.from("invoices").remove(paths);
      }
    }

    del.mutate(invoice.id, { onSuccess: () => onOpenChange(false) });
  };

  const isPending = create.isPending || update.isPending || del.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg flex flex-col max-h-[calc(100dvh-2rem)] overflow-hidden">
        <DialogHeader className="shrink-0">
          <DialogTitle className="flex items-center gap-2">
            {isEdit ? "Bizonylat szerkesztése" : "Új bizonylat"}
            {isOrderReceipt && (
              <Badge variant="secondary" className="text-xs gap-1">
                <Lock className="h-3 w-3" />
                Automatikus
              </Badge>
            )}
          </DialogTitle>
          <DialogDescription>
            {isReadonly
              ? "Ez a bizonylat automatikusan jött létre egy rendelésből. Csak megtekintésre szolgál."
              : "Töltsd ki az adatokat és csatolj fájlokat."}
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-4 py-2 pr-1">
          {/* Type */}
          <div className="space-y-1.5">
            <Label>Típus</Label>
            <Select value={form.type} onValueChange={(v) => set("type", v)} disabled={isReadonly}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="incoming">Bejövő (költség)</SelectItem>
                <SelectItem value="outgoing">Kimenő (bevétel)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Partner */}
          <div className="space-y-1.5 relative">
            <Label>Partner neve *</Label>
            <Input
              value={form.partner_name}
              onChange={(e) => {
                set("partner_name", e.target.value);
                setPartnerFilter(e.target.value);
                setShowSuggestions(true);
              }}
              onFocus={() => setShowSuggestions(true)}
              onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
              placeholder="pl. Metro Kft."
              disabled={isReadonly}
            />
            {showSuggestions && filteredPartners.length > 0 && !isReadonly && (
              <div className="absolute z-10 top-full left-0 right-0 bg-popover border rounded-md shadow-md mt-1 max-h-32 overflow-y-auto">
                {filteredPartners.map((p) => (
                  <button
                    key={p.name}
                    type="button"
                    className="w-full text-left px-3 py-1.5 text-sm hover:bg-muted transition-colors"
                    onMouseDown={() => {
                      set("partner_name", p.name);
                      if (p.taxId) set("partner_tax_id", p.taxId);
                      setShowSuggestions(false);
                    }}
                  >
                    {p.name}
                    {p.taxId && <span className="text-muted-foreground ml-2 text-xs">{p.taxId}</span>}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Tax ID + Invoice number */}
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1.5">
              <Label>Adószám</Label>
              <Input value={form.partner_tax_id} onChange={(e) => set("partner_tax_id", e.target.value)} placeholder="12345678-2-42" disabled={isReadonly} />
            </div>
            <div className="space-y-1.5">
              <Label>Számla szám</Label>
              <Input value={form.invoice_number} onChange={(e) => set("invoice_number", e.target.value)} placeholder="M-2025/0234" disabled={isReadonly} />
            </div>
          </div>

          {/* Dates */}
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1.5">
              <Label>Kiállítás dátuma</Label>
              <Input type="date" value={form.issue_date} onChange={(e) => set("issue_date", e.target.value)} disabled={isReadonly} />
            </div>
            <div className="space-y-1.5">
              <Label>Fizetési határidő</Label>
              <Input type="date" value={form.due_date} onChange={(e) => set("due_date", e.target.value)} disabled={isReadonly} />
            </div>
          </div>

          {/* Category */}
          <div className="space-y-1.5">
            <Label>Kategória</Label>
            <Select value={form.category} onValueChange={(v) => set("category", v)} disabled={isReadonly}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CATEGORIES.map((c) => (
                  <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Amount + VAT */}
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1.5">
              <Label className="flex items-center gap-1">Bruttó összeg (Ft) <InfoTip text="A teljes összeg ÁFA-val együtt." side="right" /></Label>
              <Input type="number" value={form.gross_amount} onChange={(e) => set("gross_amount", e.target.value)} placeholder="0" disabled={isReadonly} />
            </div>
            <div className="space-y-1.5">
              <Label className="flex items-center gap-1">ÁFA kulcs <InfoTip text="A legtöbb számlára 27% vonatkozik." side="right" /></Label>
              <Select value={form.vat_rate} onValueChange={(v) => set("vat_rate", v)} disabled={isReadonly}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="27">27%</SelectItem>
                  <SelectItem value="5">5%</SelectItem>
                  <SelectItem value="0">0% (ÁFA mentes)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {grossNum > 0 && (
            <p className="text-xs text-muted-foreground">
              Nettó: {netAmount.toLocaleString("hu-HU")} Ft | ÁFA: {vatAmount.toLocaleString("hu-HU")} Ft
            </p>
          )}

          {/* Files */}
          {!isReadonly && (
            <div className="space-y-1.5">
              <Label>Csatolt fájlok</Label>
              <InvoiceFileUpload fileUrls={form.file_urls} onChange={(urls) => set("file_urls", urls)} />
            </div>
          )}

          {/* Notes */}
          <div className="space-y-1.5">
            <Label>Megjegyzés</Label>
            <Textarea
              value={form.notes}
              onChange={(e) => set("notes", e.target.value)}
              placeholder="Opcionális megjegyzés..."
              rows={2}
              disabled={isReadonly}
            />
          </div>
        </div>

        <DialogFooter className="shrink-0 gap-2 sm:gap-2">
          {isEdit && !isReadonly && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" size="sm" disabled={isPending} className="mr-auto">
                  <Trash2 className="h-4 w-4 mr-1" />
                  Törlés
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Biztosan törlöd ezt a bizonylatot?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Ez a művelet nem visszavonható. A csatolt fájlok is törlődnek.
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
          {isReadonly ? (
            <Button variant="outline" onClick={() => onOpenChange(false)}>Bezárás</Button>
          ) : (
            <>
              <Button variant="outline" onClick={() => handleSave("draft")} disabled={isPending || !form.partner_name.trim()}>
                Piszkozat
              </Button>
              <Button variant="secondary" onClick={() => handleSave("pending")} disabled={isPending || !form.partner_name.trim()}>
                Fizetésre vár
              </Button>
              <Button onClick={() => handleSave("paid")} disabled={isPending || !form.partner_name.trim()}>
                Fizetve
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default InvoiceFormDialog;
