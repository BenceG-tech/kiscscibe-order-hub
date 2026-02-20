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
import { Checkbox } from "@/components/ui/checkbox";
import { Trash2, Lock, Plus, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import InfoTip from "@/components/admin/InfoTip";
import InvoiceFileUpload, { type ExtractedInvoiceData } from "./InvoiceFileUpload";
import { useCreateInvoice, useUpdateInvoice, useDeleteInvoice, usePartnerSuggestions } from "@/hooks/useInvoices";
import { usePartners } from "@/hooks/usePartners";
import { supabase } from "@/integrations/supabase/client";
import type { Invoice } from "@/hooks/useInvoices";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  invoice?: Invoice | null;
}

interface LineItem {
  id?: string;
  description: string;
  quantity: number;
  unit: string;
  unit_price: number;
  vat_rate: number;
  line_total: number;
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

const CATEGORY_MAP: Record<string, string> = {
  ingredients: "ingredient",
  utility: "utility",
  rent: "rent",
  equipment: "equipment",
  salary: "salary",
  tax: "tax",
  other: "other",
};

const UNITS = ["db", "kg", "l", "adag", "óra", "hónap", "csomag"];

const VAT_PRESETS = [27, 5, 0];

const defaultForm = {
  type: "incoming" as "incoming" | "outgoing",
  partner_name: "",
  partner_tax_id: "",
  partner_id: null as string | null,
  invoice_number: "",
  issue_date: new Date().toISOString().split("T")[0],
  due_date: "",
  payment_date: "",
  category: "ingredient",
  gross_amount: "",
  vat_rate: "27",
  vat_special: "" as "" | "reverse_charge" | "exempt" | "non_taxable",
  notes: "",
  file_urls: [] as string[],
  status: "draft" as string,
};

const aiHighlight = "bg-yellow-50 dark:bg-yellow-950/30 border-yellow-300";

const InvoiceFormDialog = ({ open, onOpenChange, invoice }: Props) => {
  const [form, setForm] = useState(defaultForm);
  const [lineItems, setLineItems] = useState<LineItem[]>([]);
  const [partnerFilter, setPartnerFilter] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [aiFilledFields, setAiFilledFields] = useState<Set<string>>(new Set());
  const [showPaymentDate, setShowPaymentDate] = useState(false);

  const create = useCreateInvoice();
  const update = useUpdateInvoice();
  const del = useDeleteInvoice();
  const { data: legacyPartners } = usePartnerSuggestions();
  const { data: partners = [] } = usePartners(true);

  const isEdit = !!invoice;
  const isOrderReceipt = invoice?.type === "order_receipt";
  const isReadonly = isOrderReceipt;

  useEffect(() => {
    if (invoice) {
      setForm({
        type: invoice.type as any,
        partner_name: invoice.partner_name,
        partner_tax_id: invoice.partner_tax_id || "",
        partner_id: (invoice as any).partner_id || null,
        invoice_number: invoice.invoice_number || "",
        issue_date: invoice.issue_date,
        due_date: invoice.due_date || "",
        payment_date: invoice.payment_date || "",
        category: invoice.category,
        gross_amount: String(invoice.gross_amount),
        vat_rate: String(invoice.vat_rate),
        vat_special: "",
        notes: invoice.notes || "",
        file_urls: invoice.file_urls || [],
        status: invoice.status,
      });
      // Load line items for existing invoice
      loadLineItems(invoice.id);
    } else {
      setForm(defaultForm);
      setLineItems([]);
    }
    setAiFilledFields(new Set());
    setShowPaymentDate(false);
  }, [invoice, open]);

  const loadLineItems = async (invoiceId: string) => {
    const { data } = await supabase
      .from("invoice_items" as any)
      .select("*")
      .eq("invoice_id", invoiceId)
      .order("id");
    if (data && (data as any[]).length > 0) {
      setLineItems((data as any[]).map((item: any) => ({
        id: item.id,
        description: item.description || "",
        quantity: item.quantity || 1,
        unit: item.unit || "db",
        unit_price: item.unit_price || 0,
        vat_rate: 27,
        line_total: item.line_total || 0,
      })));
    } else {
      setLineItems([]);
    }
  };

  const hasLineItems = lineItems.length > 0;

  const vatRate = form.vat_special ? 0 : (parseInt(form.vat_rate) || 0);

  // If line items exist, calculate totals from them
  const lineItemsTotalGross = lineItems.reduce((s, li) => s + li.line_total, 0);
  const effectiveGross = hasLineItems ? lineItemsTotalGross : (parseInt(form.gross_amount) || 0);
  const netAmount = Math.round(effectiveGross / (1 + vatRate / 100));
  const vatAmount = effectiveGross - netAmount;

  const allPartnerOptions = useMemo(() => {
    const fromPartners = partners.map((p) => ({
      id: p.id,
      name: p.name,
      taxId: p.tax_number,
    }));
    const fromLegacy = (legacyPartners || [])
      .filter((lp) => !fromPartners.some((fp) => fp.name === lp.name))
      .map((lp) => ({ id: null as string | null, name: lp.name, taxId: lp.taxId }));
    return [...fromPartners, ...fromLegacy];
  }, [partners, legacyPartners]);

  const filteredPartners = useMemo(() => {
    if (!partnerFilter) return allPartnerOptions.slice(0, 10);
    return allPartnerOptions.filter((p) =>
      p.name.toLowerCase().includes(partnerFilter.toLowerCase())
    ).slice(0, 10);
  }, [allPartnerOptions, partnerFilter]);

  const set = (key: string, val: any) => {
    setForm((f) => ({ ...f, [key]: val }));
    setAiFilledFields((prev) => {
      if (!prev.has(key)) return prev;
      const next = new Set(prev);
      next.delete(key);
      return next;
    });
  };

  // Line items management
  const addLineItem = () => {
    setLineItems((prev) => [...prev, {
      description: "",
      quantity: 1,
      unit: "db",
      unit_price: 0,
      vat_rate: vatRate,
      line_total: 0,
    }]);
  };

  const updateLineItem = (idx: number, key: keyof LineItem, val: any) => {
    setLineItems((prev) => {
      const next = [...prev];
      next[idx] = { ...next[idx], [key]: val };
      // Recalculate line_total
      if (key === "quantity" || key === "unit_price") {
        const qty = key === "quantity" ? Number(val) : next[idx].quantity;
        const price = key === "unit_price" ? Number(val) : next[idx].unit_price;
        next[idx].line_total = Math.round(qty * price);
      }
      return next;
    });
  };

  const removeLineItem = (idx: number) => {
    setLineItems((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleExtracted = (data: ExtractedInvoiceData) => {
    const filled = new Set<string>();

    setForm((f) => {
      const next = { ...f };
      if (data.partner_name && !f.partner_name.trim()) {
        next.partner_name = data.partner_name;
        filled.add("partner_name");
      }
      if (data.partner_tax_id && !f.partner_tax_id.trim()) {
        next.partner_tax_id = data.partner_tax_id;
        filled.add("partner_tax_id");
      }
      if (data.invoice_number && !f.invoice_number.trim()) {
        next.invoice_number = data.invoice_number;
        filled.add("invoice_number");
      }
      if (data.issue_date) {
        next.issue_date = data.issue_date;
        filled.add("issue_date");
      }
      if (data.due_date && !f.due_date) {
        next.due_date = data.due_date;
        filled.add("due_date");
      }
      if (data.gross_amount && !f.gross_amount) {
        next.gross_amount = String(data.gross_amount);
        filled.add("gross_amount");
      }
      if (data.vat_rate !== undefined) {
        next.vat_rate = String(data.vat_rate);
        filled.add("vat_rate");
      }
      if (data.category) {
        const mapped = CATEGORY_MAP[data.category] || data.category;
        if (CATEGORIES.some((c) => c.value === mapped)) {
          next.category = mapped;
          filled.add("category");
        }
      }
      return next;
    });

    // If line items came from AI, add them
    if (data.line_items && data.line_items.length > 0) {
      setLineItems(data.line_items.map((li) => ({
        description: li.description || "",
        quantity: li.quantity || 1,
        unit: "db",
        unit_price: li.unit_price || 0,
        vat_rate: vatRate,
        line_total: li.line_total || Math.round((li.quantity || 1) * (li.unit_price || 0)),
      })));
    }

    setAiFilledFields(filled);

    if (filled.size > 0 || (data.line_items && data.line_items.length > 0)) {
      toast.success("AI kitöltötte a számla adatait — kérlek ellenőrizd!");
    } else {
      toast.info("Az AI nem talált új kitöltendő mezőt.");
    }
  };

  const handleSave = async (status: "draft" | "pending" | "paid" | "overdue" | "cancelled") => {
    if (!form.partner_name.trim()) return;

    let paymentDate: string | null = null;
    if (status === "paid") {
      paymentDate = form.payment_date || new Date().toISOString().split("T")[0];
    }

    // Build VAT special note
    let notes = form.notes || null;
    if (form.vat_special === "reverse_charge" && !notes?.includes("Fordított adózás")) {
      notes = (notes ? notes + "\n" : "") + "Fordított adózás";
    }

    const payload = {
      type: form.type,
      status,
      partner_name: form.partner_name.trim(),
      partner_tax_id: form.partner_tax_id || null,
      partner_id: form.partner_id || null,
      invoice_number: form.invoice_number || null,
      issue_date: form.issue_date,
      due_date: form.due_date || null,
      payment_date: paymentDate,
      category: form.category,
      gross_amount: effectiveGross,
      net_amount: netAmount,
      vat_amount: vatAmount,
      vat_rate: vatRate,
      notes,
      file_urls: form.file_urls,
    };

    const onSuccess = async (savedInvoice: Invoice) => {
      // Save line items
      if (lineItems.length > 0) {
        // Delete old items first
        if (isEdit && invoice) {
          await supabase.from("invoice_items" as any).delete().eq("invoice_id", invoice.id);
        }
        const invoiceId = isEdit ? invoice!.id : savedInvoice.id;
        const items = lineItems.map((li) => ({
          invoice_id: invoiceId,
          description: li.description,
          quantity: li.quantity,
          unit: li.unit,
          unit_price: li.unit_price,
          line_total: li.line_total,
        }));
        await supabase.from("invoice_items" as any).insert(items as any);
      }
      onOpenChange(false);
    };

    if (isEdit && invoice) {
      update.mutate({ id: invoice.id, ...payload } as any, { onSuccess: (data) => onSuccess(data) });
    } else {
      create.mutate(payload, { onSuccess: (data) => onSuccess(data) });
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
    // Delete line items too
    await supabase.from("invoice_items" as any).delete().eq("invoice_id", invoice.id);
    del.mutate(invoice.id, { onSuccess: () => onOpenChange(false) });
  };

  const isPending = create.isPending || update.isPending || del.isPending;
  const aiCn = (field: string) => aiFilledFields.has(field) ? aiHighlight : "";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl flex flex-col max-h-[calc(100dvh-2rem)] overflow-hidden">
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
              ? "Ez a bizonylat automatikusan jött létre egy rendelésből."
              : "Töltsd ki az adatokat és csatolj fájlokat."}
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-4 py-2 pr-1">
          {/* Type */}
          <div className="space-y-1.5">
            <Label>Típus</Label>
            <Select value={form.type} onValueChange={(v) => set("type", v)} disabled={isReadonly}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="incoming">Bejövő (költség)</SelectItem>
                <SelectItem value="outgoing">Kimenő (bevétel)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Partner selector from partners table + legacy autocomplete */}
          <div className="space-y-1.5">
            <Label>Partner kiválasztása</Label>
            <Select
              value={form.partner_id || "__manual__"}
              onValueChange={(v) => {
                if (v === "__manual__") {
                  set("partner_id", null);
                  return;
                }
                const p = partners.find((pp) => pp.id === v);
                if (p) {
                  setForm((f) => ({
                    ...f,
                    partner_id: p.id,
                    partner_name: p.name,
                    partner_tax_id: p.tax_number || f.partner_tax_id,
                  }));
                }
              }}
              disabled={isReadonly}
            >
              <SelectTrigger>
                <SelectValue placeholder="Válassz partnert vagy írd be kézzel" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__manual__">Kézi bevitel</SelectItem>
                {partners.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.name} {p.tax_number ? `(${p.tax_number})` : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Partner name with autocomplete */}
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
              className={aiCn("partner_name")}
            />
            {showSuggestions && filteredPartners.length > 0 && !isReadonly && partnerFilter.length > 0 && (
              <div className="absolute z-10 top-full left-0 right-0 bg-popover border rounded-md shadow-md mt-1 max-h-32 overflow-y-auto">
                {filteredPartners.map((p) => (
                  <button
                    key={p.id || p.name}
                    type="button"
                    className="w-full text-left px-3 py-1.5 text-sm hover:bg-muted transition-colors"
                    onMouseDown={() => {
                      set("partner_name", p.name);
                      if (p.taxId) set("partner_tax_id", p.taxId);
                      if (p.id) set("partner_id", p.id);
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
              <Input value={form.partner_tax_id} onChange={(e) => set("partner_tax_id", e.target.value)} placeholder="12345678-2-42" disabled={isReadonly} className={aiCn("partner_tax_id")} />
            </div>
            <div className="space-y-1.5">
              <Label>Számla szám</Label>
              <Input value={form.invoice_number} onChange={(e) => set("invoice_number", e.target.value)} placeholder="M-2025/0234" disabled={isReadonly} className={aiCn("invoice_number")} />
            </div>
          </div>

          {/* Dates */}
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1.5">
              <Label>Kiállítás dátuma</Label>
              <Input type="date" value={form.issue_date} onChange={(e) => set("issue_date", e.target.value)} disabled={isReadonly} className={aiCn("issue_date")} />
            </div>
            <div className="space-y-1.5">
              <Label>Fizetési határidő</Label>
              <Input type="date" value={form.due_date} onChange={(e) => set("due_date", e.target.value)} disabled={isReadonly} className={aiCn("due_date")} />
            </div>
          </div>

          {/* Category */}
          <div className="space-y-1.5">
            <Label>Kategória</Label>
            <Select value={form.category} onValueChange={(v) => set("category", v)} disabled={isReadonly}>
              <SelectTrigger className={aiCn("category")}><SelectValue /></SelectTrigger>
              <SelectContent>
                {CATEGORIES.map((c) => (
                  <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* === LINE ITEMS === */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="flex items-center gap-1">
                Tételek
                <InfoTip text="Adj hozzá tételsorokat a részletes nyilvántartáshoz. Ha vannak tételek, az összeg automatikusan számolódik." side="right" />
              </Label>
              {!isReadonly && (
                <Button type="button" variant="outline" size="sm" onClick={addLineItem}>
                  <Plus className="h-3.5 w-3.5 mr-1" />
                  Új tétel
                </Button>
              )}
            </div>
            {lineItems.map((li, idx) => (
              <div key={idx} className="grid grid-cols-12 gap-1.5 items-end bg-muted/30 rounded-md p-2">
                <div className="col-span-12 sm:col-span-4 space-y-1">
                  {idx === 0 && <span className="text-[10px] text-muted-foreground">Leírás</span>}
                  <Input
                    value={li.description}
                    onChange={(e) => updateLineItem(idx, "description", e.target.value)}
                    placeholder="Tétel megnevezése"
                    className="h-8 text-sm"
                    disabled={isReadonly}
                  />
                </div>
                <div className="col-span-3 sm:col-span-1.5 space-y-1">
                  {idx === 0 && <span className="text-[10px] text-muted-foreground">Menny.</span>}
                  <Input
                    type="number"
                    value={li.quantity}
                    onChange={(e) => updateLineItem(idx, "quantity", parseFloat(e.target.value) || 0)}
                    className="h-8 text-sm"
                    disabled={isReadonly}
                  />
                </div>
                <div className="col-span-3 sm:col-span-2 space-y-1">
                  {idx === 0 && <span className="text-[10px] text-muted-foreground">Egység</span>}
                  <Select value={li.unit} onValueChange={(v) => updateLineItem(idx, "unit", v)} disabled={isReadonly}>
                    <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {UNITS.map((u) => <SelectItem key={u} value={u}>{u}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="col-span-3 sm:col-span-2 space-y-1">
                  {idx === 0 && <span className="text-[10px] text-muted-foreground">Egységár</span>}
                  <Input
                    type="number"
                    value={li.unit_price}
                    onChange={(e) => updateLineItem(idx, "unit_price", parseInt(e.target.value) || 0)}
                    className="h-8 text-sm"
                    disabled={isReadonly}
                  />
                </div>
                <div className="col-span-2 sm:col-span-2 space-y-1">
                  {idx === 0 && <span className="text-[10px] text-muted-foreground">Összeg</span>}
                  <Input
                    value={li.line_total.toLocaleString("hu-HU") + " Ft"}
                    className="h-8 text-sm"
                    readOnly
                    tabIndex={-1}
                  />
                </div>
                {!isReadonly && (
                  <div className="col-span-1 flex justify-center">
                    <Button type="button" variant="ghost" size="sm" className="h-8 w-8 p-0 text-destructive" onClick={() => removeLineItem(idx)}>
                      <X className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                )}
              </div>
            ))}
            {hasLineItems && (
              <div className="text-right text-sm font-medium text-muted-foreground pr-10">
                Tételek összesen: {lineItemsTotalGross.toLocaleString("hu-HU")} Ft
              </div>
            )}
          </div>

          {/* Amount + VAT */}
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1.5">
              <Label className="flex items-center gap-1">
                Bruttó összeg (Ft)
                <InfoTip text="A teljes összeg ÁFA-val együtt. Ha vannak tételek, automatikusan számolódik." side="right" />
              </Label>
              <Input
                type="number"
                value={hasLineItems ? effectiveGross : form.gross_amount}
                onChange={(e) => set("gross_amount", e.target.value)}
                placeholder="0"
                disabled={isReadonly || hasLineItems}
                className={cn(aiCn("gross_amount"), hasLineItems && "bg-muted")}
              />
            </div>
            <div className="space-y-1.5">
              <Label className="flex items-center gap-1">
                ÁFA kulcs
                <InfoTip text="Válassz a gyorsgombokkal vagy írj be bármilyen százalékot." side="right" />
              </Label>
              <div className="flex gap-1.5">
                {VAT_PRESETS.map((rate) => (
                  <Button
                    key={rate}
                    type="button"
                    variant={form.vat_rate === String(rate) && !form.vat_special ? "default" : "outline"}
                    size="sm"
                    className="h-8 px-2 text-xs"
                    onClick={() => {
                      set("vat_rate", String(rate));
                      set("vat_special", "");
                    }}
                    disabled={isReadonly}
                  >
                    {rate}%
                  </Button>
                ))}
                <Input
                  type="number"
                  min={0}
                  max={100}
                  value={form.vat_special ? "0" : form.vat_rate}
                  onChange={(e) => {
                    set("vat_rate", e.target.value);
                    set("vat_special", "");
                  }}
                  className={cn("h-8 w-16 text-sm text-center", aiCn("vat_rate"))}
                  placeholder="%"
                  disabled={isReadonly || !!form.vat_special}
                />
                <span className="flex items-center text-sm text-muted-foreground">%</span>
              </div>
            </div>
          </div>

          {/* VAT special options */}
          {!isReadonly && (
            <div className="flex flex-wrap gap-4 text-sm">
              <label className="flex items-center gap-2 cursor-pointer">
                <Checkbox
                  checked={form.vat_special === "reverse_charge"}
                  onCheckedChange={(checked) => set("vat_special", checked ? "reverse_charge" : "")}
                />
                Fordított adózás
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <Checkbox
                  checked={form.vat_special === "exempt"}
                  onCheckedChange={(checked) => set("vat_special", checked ? "exempt" : "")}
                />
                ÁFA-mentes
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <Checkbox
                  checked={form.vat_special === "non_taxable"}
                  onCheckedChange={(checked) => set("vat_special", checked ? "non_taxable" : "")}
                />
                Tárgyi adómentes
              </label>
            </div>
          )}

          {effectiveGross > 0 && (
            <p className="text-xs text-muted-foreground">
              Nettó: {netAmount.toLocaleString("hu-HU")} Ft | ÁFA ({vatRate}%): {vatAmount.toLocaleString("hu-HU")} Ft
              {form.vat_special && <span className="ml-2 text-yellow-600">({form.vat_special === "reverse_charge" ? "Fordított adózás" : form.vat_special === "exempt" ? "ÁFA-mentes" : "Tárgyi adómentes"})</span>}
            </p>
          )}

          {/* Files */}
          {!isReadonly && (
            <div className="space-y-1.5">
              <Label>Csatolt fájlok</Label>
              <InvoiceFileUpload
                fileUrls={form.file_urls}
                onChange={(urls) => set("file_urls", urls)}
                onExtracted={handleExtracted}
              />
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
              <div className="flex items-center gap-1">
                <Button onClick={() => {
                  if (!showPaymentDate) {
                    setShowPaymentDate(true);
                    if (!form.payment_date) set("payment_date", new Date().toISOString().split("T")[0]);
                  } else {
                    handleSave("paid");
                  }
                }} disabled={isPending || !form.partner_name.trim()}>
                  Fizetve
                </Button>
                {showPaymentDate && (
                  <Input
                    type="date"
                    value={form.payment_date}
                    onChange={(e) => set("payment_date", e.target.value)}
                    className="h-9 w-[140px] text-xs"
                  />
                )}
              </div>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default InvoiceFormDialog;
