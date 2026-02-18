import { useState, useEffect, useMemo } from "react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Trash2, Lock, Plus, X, CalendarIcon, ChevronDown, ChevronUp } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { format } from "date-fns";
import { hu } from "date-fns/locale";
import InfoTip from "@/components/admin/InfoTip";
import InvoiceFileUpload, { type ExtractedInvoiceData } from "./InvoiceFileUpload";
import {
  useCreateInvoice, useUpdateInvoice, useDeleteInvoice, usePartnerSuggestions,
  useInvoiceItems, useUpsertInvoiceItems,
} from "@/hooks/useInvoices";
import { supabase } from "@/integrations/supabase/client";
import type { Invoice, InvoiceItem } from "@/hooks/useInvoices";
import PartnerSelector from "./PartnerSelector";
import type { Partner } from "@/hooks/usePartners";

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

const CATEGORY_MAP: Record<string, string> = {
  ingredients: "ingredient",
  utility: "utility",
  rent: "rent",
  equipment: "equipment",
  salary: "salary",
  tax: "tax",
  other: "other",
};

const UNITS = ["db", "kg", "l", "adag", "óra", "hónap"];

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

const aiHighlight = "bg-yellow-50 dark:bg-yellow-950/30 border-yellow-300";

type SpecialVat = null | "fordított" | "mentes" | "tárgyi";

const SPECIAL_VAT_NOTES: Record<string, string> = {
  fordított: "Fordított adózás",
  mentes: "ÁFA-mentes",
  tárgyi: "Tárgyi adómentes",
};

interface LocalLineItem {
  tempId: string;
  description: string;
  quantity: number;
  unit: string;
  unit_price: number;
  vat_rate: number;
  line_total: number;
}

const calcLineTotal = (qty: number, price: number, vatRate: number) =>
  Math.round(price * qty * (1 + vatRate / 100));

let tempCounter = 0;
const newTempId = () => `tmp_${++tempCounter}`;

const InvoiceFormDialog = ({ open, onOpenChange, invoice }: Props) => {
  const [form, setForm] = useState(defaultForm);
  const [selectedPartnerId, setSelectedPartnerId] = useState<string | null>(null);
  const [partnerFilter, setPartnerFilter] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [aiFilledFields, setAiFilledFields] = useState<Set<string>>(new Set());
  const [specialVat, setSpecialVat] = useState<SpecialVat>(null);
  const [showSpecial, setShowSpecial] = useState(false);
  const [paymentDate, setPaymentDate] = useState<Date>(new Date());
  const [showPaymentPicker, setShowPaymentPicker] = useState(false);
  const [lineItems, setLineItems] = useState<LocalLineItem[]>([]);

  const create = useCreateInvoice();
  const update = useUpdateInvoice();
  const del = useDeleteInvoice();
  const upsertItems = useUpsertInvoiceItems();
  const { data: partners } = usePartnerSuggestions();
  const { data: existingItems } = useInvoiceItems(invoice?.id);

  const isEdit = !!invoice;
  const isOrderReceipt = invoice?.type === "order_receipt";
  const isReadonly = isOrderReceipt;

  // Load existing line items when editing
  useEffect(() => {
    if (existingItems && existingItems.length > 0) {
      const vatRateNum = parseInt(form.vat_rate) || 27;
      setLineItems(existingItems.map((item) => ({
        tempId: newTempId(),
        description: item.description,
        quantity: item.quantity,
        unit: item.unit,
        unit_price: item.unit_price,
        vat_rate: vatRateNum,
        line_total: item.line_total,
      })));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [existingItems]);

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
      setSpecialVat(null);
      setSelectedPartnerId((invoice as any).partner_id || null);
    } else {
      setForm(defaultForm);
      setSpecialVat(null);
      setLineItems([]);
      setSelectedPartnerId(null);
    }
    setAiFilledFields(new Set());
    setPaymentDate(new Date());
  }, [invoice, open]);

  // Line items totals
  const hasLineItems = lineItems.length > 0;
  const lineGross = useMemo(() => lineItems.reduce((s, i) => s + i.line_total, 0), [lineItems]);
  const lineVatRate = parseInt(form.vat_rate) || 0;
  const lineNet = useMemo(() => Math.round(lineGross / (1 + lineVatRate / 100)), [lineGross, lineVatRate]);
  const lineVat = lineGross - lineNet;

  const grossNum = hasLineItems ? lineGross : (parseInt(form.gross_amount) || 0);
  const vatRate = parseInt(form.vat_rate) || 0;
  const netAmount = hasLineItems ? lineNet : Math.round(grossNum / (1 + vatRate / 100));
  const vatAmount = grossNum - netAmount;

  const filteredPartners = useMemo(() => {
    if (!partners || !partnerFilter) return [];
    return partners.filter((p) =>
      p.name.toLowerCase().includes(partnerFilter.toLowerCase())
    );
  }, [partners, partnerFilter]);

  const set = (key: string, val: any) => {
    setForm((f) => ({ ...f, [key]: val }));
    setAiFilledFields((prev) => {
      if (!prev.has(key)) return prev;
      const next = new Set(prev);
      next.delete(key);
      return next;
    });
  };

  const handleVatRate = (val: string) => {
    if (specialVat) return;
    set("vat_rate", val);
    // Update line items vat_rate too
    const num = parseInt(val) || 0;
    setLineItems((prev) => prev.map((item) => ({
      ...item,
      vat_rate: num,
      line_total: calcLineTotal(item.quantity, item.unit_price, num),
    })));
  };

  const handleSpecialVat = (type: SpecialVat) => {
    if (specialVat === type) {
      // Uncheck
      setSpecialVat(null);
      // Remove auto-note if it was set
      setForm((f) => ({
        ...f,
        notes: f.notes === SPECIAL_VAT_NOTES[type!] ? "" : f.notes,
      }));
    } else {
      setSpecialVat(type);
      set("vat_rate", "0");
      setLineItems((prev) => prev.map((item) => ({
        ...item,
        vat_rate: 0,
        line_total: calcLineTotal(item.quantity, item.unit_price, 0),
      })));
      if (type) {
        setForm((f) => ({
          ...f,
          vat_rate: "0",
          notes: SPECIAL_VAT_NOTES[type] || f.notes,
        }));
      }
    }
  };

  // Line item management
  const addLineItem = () => {
    const vr = parseInt(form.vat_rate) || 0;
    setLineItems((prev) => [
      ...prev,
      { tempId: newTempId(), description: "", quantity: 1, unit: "db", unit_price: 0, vat_rate: vr, line_total: 0 },
    ]);
  };

  const updateLineItem = (tempId: string, field: keyof LocalLineItem, value: any) => {
    setLineItems((prev) => prev.map((item) => {
      if (item.tempId !== tempId) return item;
      const updated = { ...item, [field]: value };
      if (field === "quantity" || field === "unit_price" || field === "vat_rate") {
        updated.line_total = calcLineTotal(
          field === "quantity" ? Number(value) : updated.quantity,
          field === "unit_price" ? Number(value) : updated.unit_price,
          field === "vat_rate" ? Number(value) : updated.vat_rate,
        );
      }
      return updated;
    }));
  };

  const removeLineItem = (tempId: string) => {
    setLineItems((prev) => prev.filter((i) => i.tempId !== tempId));
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

    setAiFilledFields(filled);

    if (filled.size > 0) {
      toast.success("AI kitöltötte a számla adatait — kérlek ellenőrizd!");
    } else {
      toast.info("Az AI nem talált új kitöltendő mezőt.");
    }
  };

  const handleSave = async (status: "draft" | "pending" | "paid" | "overdue" | "cancelled", pDate?: Date) => {
    if (!form.partner_name.trim()) return;

    const chosenPaymentDate = pDate || paymentDate;

    const payload = {
      type: form.type,
      status,
      partner_name: form.partner_name.trim(),
      partner_tax_id: form.partner_tax_id || null,
      partner_id: selectedPartnerId || null,
      invoice_number: form.invoice_number || null,
      issue_date: form.issue_date,
      due_date: form.due_date || null,
      payment_date: status === "paid" ? chosenPaymentDate.toISOString().split("T")[0] : null,
      category: form.category,
      gross_amount: grossNum,
      net_amount: netAmount,
      vat_amount: vatAmount,
      vat_rate: vatRate,
      notes: form.notes || null,
      file_urls: form.file_urls,
    };

    const saveItems = async (invoiceId: string) => {
      if (hasLineItems) {
        await upsertItems.mutateAsync({
          invoiceId,
          items: lineItems.map((i) => ({
            description: i.description,
            quantity: i.quantity,
            unit: i.unit,
            unit_price: i.unit_price,
            line_total: i.line_total,
          })),
        });
      } else if (isEdit && invoice) {
        // Clear items if user removed all of them
        await upsertItems.mutateAsync({ invoiceId, items: [] });
      }
    };

    if (isEdit && invoice) {
      update.mutate({ id: invoice.id, ...payload }, {
        onSuccess: async () => {
          await saveItems(invoice.id);
          onOpenChange(false);
        },
      });
    } else {
      create.mutate(payload, {
        onSuccess: async (data: any) => {
          if (data?.id) await saveItems(data.id);
          onOpenChange(false);
        },
      });
    }
  };

  const handleSavePaid = (date: Date) => {
    setShowPaymentPicker(false);
    handleSave("paid", date);
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

  const aiCn = (field: string) => aiFilledFields.has(field) ? aiHighlight : "";

  const fmt = (n: number) => n.toLocaleString("hu-HU");

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

          {/* Partner selector */}
          {!isReadonly && (
            <PartnerSelector
              value={selectedPartnerId}
              onSelect={(partner: Partner | null) => {
                setSelectedPartnerId(partner?.id || null);
                if (partner) {
                  set("partner_name", partner.name);
                  set("partner_tax_id", partner.tax_number || "");
                }
              }}
            />
          )}

          {/* Partner name (manual fallback) */}
          <div className="space-y-1.5 relative">
            <Label>Partner neve *</Label>
            <Input
              value={form.partner_name}
              onChange={(e) => {
                set("partner_name", e.target.value);
                setPartnerFilter(e.target.value);
                setShowSuggestions(true);
                // Clear partner link if user types manually
                if (selectedPartnerId) setSelectedPartnerId(null);
              }}
              onFocus={() => setShowSuggestions(true)}
              onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
              placeholder="pl. Metro Kft."
              disabled={isReadonly}
              className={aiCn("partner_name")}
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
              <SelectTrigger className={aiCn("category")}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CATEGORIES.map((c) => (
                  <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* ─── LINE ITEMS ─── */}
          {!isReadonly && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-semibold">Tételek</Label>
                <Button type="button" variant="outline" size="sm" onClick={addLineItem} className="h-7 text-xs gap-1">
                  <Plus className="h-3 w-3" />
                  Új tétel
                </Button>
              </div>

              {lineItems.length > 0 && (
                <div className="border rounded-lg overflow-hidden">
                  {/* Desktop header */}
                  <div className="hidden md:grid grid-cols-[2fr_1fr_1fr_1fr_1fr_1fr_auto] gap-1 px-2 py-1.5 bg-muted/50 text-xs font-medium text-muted-foreground">
                    <span>Leírás</span>
                    <span>Menny.</span>
                    <span>Egység</span>
                    <span>Egységár (Ft)</span>
                    <span>ÁFA%</span>
                    <span className="text-right">Összeg</span>
                    <span />
                  </div>

                  <div className="divide-y">
                    {lineItems.map((item) => (
                      <div key={item.tempId} className="p-2">
                        {/* Desktop row */}
                        <div className="hidden md:grid grid-cols-[2fr_1fr_1fr_1fr_1fr_1fr_auto] gap-1 items-center">
                          <Input
                            value={item.description}
                            onChange={(e) => updateLineItem(item.tempId, "description", e.target.value)}
                            placeholder="Leírás"
                            className="h-7 text-xs"
                          />
                          <Input
                            type="number"
                            min="0"
                            value={item.quantity}
                            onChange={(e) => updateLineItem(item.tempId, "quantity", Number(e.target.value))}
                            className="h-7 text-xs"
                          />
                          <Select value={item.unit} onValueChange={(v) => updateLineItem(item.tempId, "unit", v)}>
                            <SelectTrigger className="h-7 text-xs">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {UNITS.map((u) => <SelectItem key={u} value={u}>{u}</SelectItem>)}
                            </SelectContent>
                          </Select>
                          <Input
                            type="number"
                            min="0"
                            value={item.unit_price}
                            onChange={(e) => updateLineItem(item.tempId, "unit_price", Number(e.target.value))}
                            className="h-7 text-xs"
                          />
                          <Input
                            type="number"
                            min="0"
                            max="100"
                            value={item.vat_rate}
                            onChange={(e) => updateLineItem(item.tempId, "vat_rate", Number(e.target.value))}
                            disabled={!!specialVat}
                            className="h-7 text-xs"
                          />
                          <span className="text-xs font-medium text-right pr-1">
                            {fmt(item.line_total)} Ft
                          </span>
                          <Button type="button" variant="ghost" size="icon" className="h-6 w-6" onClick={() => removeLineItem(item.tempId)}>
                            <X className="h-3 w-3" />
                          </Button>
                        </div>

                        {/* Mobile card */}
                        <div className="md:hidden space-y-2">
                          <div className="flex items-center gap-2">
                            <Input
                              value={item.description}
                              onChange={(e) => updateLineItem(item.tempId, "description", e.target.value)}
                              placeholder="Tétel leírása"
                              className="h-8 text-sm flex-1"
                            />
                            <Button type="button" variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={() => removeLineItem(item.tempId)}>
                              <X className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                          <div className="grid grid-cols-3 gap-2">
                            <div className="space-y-1">
                              <p className="text-[10px] text-muted-foreground">Menny.</p>
                              <Input type="number" min="0" value={item.quantity} onChange={(e) => updateLineItem(item.tempId, "quantity", Number(e.target.value))} className="h-7 text-xs" />
                            </div>
                            <div className="space-y-1">
                              <p className="text-[10px] text-muted-foreground">Egység</p>
                              <Select value={item.unit} onValueChange={(v) => updateLineItem(item.tempId, "unit", v)}>
                                <SelectTrigger className="h-7 text-xs"><SelectValue /></SelectTrigger>
                                <SelectContent>{UNITS.map((u) => <SelectItem key={u} value={u}>{u}</SelectItem>)}</SelectContent>
                              </Select>
                            </div>
                            <div className="space-y-1">
                              <p className="text-[10px] text-muted-foreground">ÁFA%</p>
                              <Input type="number" min="0" max="100" value={item.vat_rate} onChange={(e) => updateLineItem(item.tempId, "vat_rate", Number(e.target.value))} disabled={!!specialVat} className="h-7 text-xs" />
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="flex-1 space-y-1">
                              <p className="text-[10px] text-muted-foreground">Egységár (Ft)</p>
                              <Input type="number" min="0" value={item.unit_price} onChange={(e) => updateLineItem(item.tempId, "unit_price", Number(e.target.value))} className="h-7 text-sm" />
                            </div>
                            <div className="text-right shrink-0">
                              <p className="text-[10px] text-muted-foreground">Összeg</p>
                              <p className="text-sm font-semibold">{fmt(item.line_total)} Ft</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Totals */}
                  <div className="border-t bg-muted/30 px-3 py-2 space-y-0.5 text-xs">
                    <div className="flex justify-between text-muted-foreground">
                      <span>Nettó összesen</span>
                      <span>{fmt(lineNet)} Ft</span>
                    </div>
                    <div className="flex justify-between text-muted-foreground">
                      <span>ÁFA összesen</span>
                      <span>{fmt(lineVat)} Ft</span>
                    </div>
                    <div className="flex justify-between font-semibold text-sm">
                      <span>Bruttó összesen</span>
                      <span>{fmt(lineGross)} Ft</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ─── AMOUNT + VAT ─── */}
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1.5">
              <Label className="flex items-center gap-1">
                Bruttó összeg (Ft)
                <InfoTip text="A teljes összeg ÁFA-val együtt." side="right" />
                {hasLineItems && <span className="text-[10px] text-muted-foreground ml-1">(tételekből)</span>}
              </Label>
              <Input
                type="number"
                value={hasLineItems ? lineGross : form.gross_amount}
                onChange={(e) => !hasLineItems && set("gross_amount", e.target.value)}
                placeholder="0"
                disabled={isReadonly || hasLineItems}
                readOnly={hasLineItems}
                className={cn(aiCn("gross_amount"), hasLineItems && "bg-muted cursor-not-allowed")}
              />
            </div>

            {/* VAT Rate – free input */}
            <div className="space-y-1.5">
              <Label className="flex items-center gap-1">
                ÁFA kulcs
                <InfoTip text="Adj meg tetszőleges %-ot, vagy válassz a gyorsgombok közül." side="right" />
              </Label>
              <div className="flex gap-1 items-center">
                {[27, 5, 0].map((rate) => (
                  <Button
                    key={rate}
                    type="button"
                    variant={parseInt(form.vat_rate) === rate && !specialVat ? "default" : "outline"}
                    size="sm"
                    className="h-8 px-2 text-xs shrink-0"
                    onClick={() => handleVatRate(String(rate))}
                    disabled={isReadonly || !!specialVat}
                  >
                    {rate}%
                  </Button>
                ))}
                <div className="relative flex items-center flex-1">
                  <Input
                    type="number"
                    min="0"
                    max="100"
                    value={form.vat_rate}
                    onChange={(e) => handleVatRate(e.target.value)}
                    disabled={isReadonly || !!specialVat}
                    className={cn("h-8 pr-6 text-xs", aiCn("vat_rate"), specialVat && "bg-muted")}
                  />
                  <span className="absolute right-2 text-xs text-muted-foreground pointer-events-none">%</span>
                </div>
              </div>

              {/* Speciális szekció */}
              {!isReadonly && (
                <div>
                  <button
                    type="button"
                    className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors mt-1"
                    onClick={() => setShowSpecial((v) => !v)}
                  >
                    {showSpecial ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                    Speciális ÁFA
                  </button>
                  {showSpecial && (
                    <div className="mt-1.5 space-y-1.5 pl-1 border-l-2 border-muted">
                      {(["fordított", "mentes", "tárgyi"] as SpecialVat[]).map((type) => (
                        <div key={type} className="flex items-center gap-2">
                          <Checkbox
                            id={`special-${type}`}
                            checked={specialVat === type}
                            onCheckedChange={() => handleSpecialVat(type)}
                          />
                          <label htmlFor={`special-${type}`} className="text-xs cursor-pointer">
                            {SPECIAL_VAT_NOTES[type!]}
                          </label>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
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

        <DialogFooter className="shrink-0 gap-2 sm:gap-2 flex-wrap">
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

              {/* Fizetve gomb + datepicker popover */}
              <Popover open={showPaymentPicker} onOpenChange={setShowPaymentPicker}>
                <PopoverTrigger asChild>
                  <Button
                    disabled={isPending || !form.partner_name.trim()}
                    onClick={() => setShowPaymentPicker(true)}
                  >
                    <CalendarIcon className="h-3.5 w-3.5 mr-1" />
                    Fizetve
                  </Button>
                </PopoverTrigger>
                <PopoverContent align="end" className="w-auto p-3 space-y-2">
                  <p className="text-xs font-medium text-muted-foreground">Fizetés dátuma</p>
                  <Calendar
                    mode="single"
                    selected={paymentDate}
                    onSelect={(d) => d && setPaymentDate(d)}
                    initialFocus
                    className="pointer-events-auto p-0"
                  />
                  <p className="text-xs text-center text-muted-foreground">
                    {format(paymentDate, "yyyy. MMMM d.", { locale: hu })}
                  </p>
                  <Button
                    className="w-full"
                    size="sm"
                    onClick={() => handleSavePaid(paymentDate)}
                    disabled={isPending}
                  >
                    Mentés fizetve
                  </Button>
                </PopoverContent>
              </Popover>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default InvoiceFormDialog;
