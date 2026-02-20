import { useState, useMemo } from "react";
import AdminLayout from "./AdminLayout";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Plus, Download, AlertTriangle, FileSpreadsheet, Trash2, Check, XCircle, ArrowUpDown, ChevronLeft, ChevronRight } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import InvoiceSummaryCards from "@/components/admin/InvoiceSummaryCards";
import InvoiceFilters from "@/components/admin/InvoiceFilters";
import InvoiceListItem from "@/components/admin/InvoiceListItem";
import InvoiceFormDialog from "@/components/admin/InvoiceFormDialog";
import RecurringInvoices from "@/components/admin/RecurringInvoices";
import { useInvoices, useDeleteInvoice, useUpdateInvoice, type InvoiceFilters as Filters, type Invoice } from "@/hooks/useInvoices";
import { exportInvoicesToExcel, exportVatSummaryToExcel } from "@/lib/invoiceExport";
import { exportInvoicesToCsv } from "@/lib/invoiceCsvExport";
import InfoTip from "@/components/admin/InfoTip";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

const PAGE_SIZE = 20;

type SortKey = "issue_date" | "gross_amount" | "partner_name" | "status";
type SortDir = "asc" | "desc";

const Invoices = () => {
  const [filters, setFilters] = useState<Filters>({});
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editInvoice, setEditInvoice] = useState<Invoice | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [sortKey, setSortKey] = useState<SortKey>("issue_date");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [page, setPage] = useState(0);
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);

  const { data: allInvoices = [], isLoading } = useInvoices(filters);
  const deleteMut = useDeleteInvoice();
  const updateMut = useUpdateInvoice();

  // Sorting
  const sorted = useMemo(() => {
    const arr = [...allInvoices];
    arr.sort((a, b) => {
      let cmp = 0;
      if (sortKey === "issue_date") cmp = a.issue_date.localeCompare(b.issue_date);
      else if (sortKey === "gross_amount") cmp = a.gross_amount - b.gross_amount;
      else if (sortKey === "partner_name") cmp = a.partner_name.localeCompare(b.partner_name);
      else if (sortKey === "status") cmp = a.status.localeCompare(b.status);
      return sortDir === "asc" ? cmp : -cmp;
    });
    return arr;
  }, [allInvoices, sortKey, sortDir]);

  // Pagination
  const totalPages = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE));
  const paginated = sorted.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  const hasFilters = !!(filters.type || filters.status || filters.category || filters.dateFrom || filters.dateTo || filters.search);

  const overdueInvoices = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return allInvoices.filter(inv =>
      inv.due_date &&
      new Date(inv.due_date) < today &&
      inv.status !== "paid" &&
      inv.status !== "cancelled"
    );
  }, [allInvoices]);

  const openNew = () => {
    setEditInvoice(null);
    setDialogOpen(true);
  };

  const openEdit = (inv: Invoice) => {
    setEditInvoice(inv);
    setDialogOpen(true);
  };

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("desc");
    }
    setPage(0);
  };

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === paginated.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(paginated.map((i) => i.id)));
    }
  };

  const handleBulkDelete = async () => {
    for (const id of selectedIds) {
      const inv = allInvoices.find((i) => i.id === id);
      if (inv && inv.type === "order_receipt") continue;
      // Delete storage files
      if (inv?.file_urls && inv.file_urls.length > 0) {
        const paths = inv.file_urls.map((url) => {
          const parts = url.split("/invoices/");
          return parts.length > 1 ? parts[parts.length - 1].split("?")[0] : "";
        }).filter(Boolean);
        if (paths.length > 0) await supabase.storage.from("invoices").remove(paths);
      }
      await supabase.from("invoice_items" as any).delete().eq("invoice_id", id);
      deleteMut.mutate(id);
    }
    setSelectedIds(new Set());
    setBulkDeleteOpen(false);
    toast.success(`${selectedIds.size} bizonylat törölve`);
  };

  const handleBulkPaid = () => {
    const today = new Date().toISOString().split("T")[0];
    for (const id of selectedIds) {
      updateMut.mutate({ id, status: "paid", payment_date: today } as any);
    }
    setSelectedIds(new Set());
    toast.success(`${selectedIds.size} bizonylat fizetettre állítva`);
  };

  const handleDeleteSingle = async (inv: Invoice) => {
    if (inv.type === "order_receipt") return;
    if (inv.file_urls?.length > 0) {
      const paths = inv.file_urls.map((url) => {
        const parts = url.split("/invoices/");
        return parts.length > 1 ? parts[parts.length - 1].split("?")[0] : "";
      }).filter(Boolean);
      if (paths.length > 0) await supabase.storage.from("invoices").remove(paths);
    }
    await supabase.from("invoice_items" as any).delete().eq("invoice_id", inv.id);
    deleteMut.mutate(inv.id);
  };

  const SortButton = ({ label, field }: { label: string; field: SortKey }) => (
    <Button
      variant="ghost"
      size="sm"
      className={`h-7 text-xs gap-1 ${sortKey === field ? "text-primary" : "text-muted-foreground"}`}
      onClick={() => toggleSort(field)}
    >
      {label}
      <ArrowUpDown className="h-3 w-3" />
      {sortKey === field && <span className="text-[10px]">{sortDir === "asc" ? "↑" : "↓"}</span>}
    </Button>
  );

  return (
    <AdminLayout>
      <div className="py-4 sm:py-6 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-2">
          <h1 className="text-xl sm:text-2xl font-bold flex items-center gap-2">
            Számlák kezelése
            <InfoTip text="Rögzítsd a bejövő költségszámlákat és kövesd a pénzügyi helyzetet." />
          </h1>
          <div className="flex gap-2 flex-wrap">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" disabled={allInvoices.length === 0}>
                  <Download className="h-4 w-4 mr-1" />
                  Export
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem onClick={() => exportInvoicesToExcel(selectedIds.size > 0 ? allInvoices.filter(i => selectedIds.has(i.id)) : allInvoices)}>
                  Excel (.xlsx)
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => exportInvoicesToCsv(selectedIds.size > 0 ? allInvoices.filter(i => selectedIds.has(i.id)) : allInvoices)}>
                  CSV (.csv)
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" disabled={allInvoices.length === 0}>
                  <FileSpreadsheet className="h-4 w-4 mr-1" />
                  ÁFA export
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem onClick={() => {
                  const now = new Date();
                  exportVatSummaryToExcel(allInvoices, `${now.getFullYear()}_${String(now.getMonth() + 1).padStart(2, "0")}`);
                }}>Havi ÁFA export</DropdownMenuItem>
                <DropdownMenuItem onClick={() => {
                  const now = new Date();
                  const q = Math.ceil((now.getMonth() + 1) / 3);
                  exportVatSummaryToExcel(allInvoices, `${now.getFullYear()}_Q${q}`);
                }}>Negyedéves ÁFA export</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <Button onClick={openNew} size="sm">
              <Plus className="h-4 w-4 mr-1" />
              Új bizonylat
            </Button>
          </div>
        </div>

        {/* Overdue warning */}
        {overdueInvoices.length > 0 && (
          <div className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 border border-destructive/30 text-destructive text-sm font-medium">
            <AlertTriangle className="h-4 w-4 shrink-0" />
            Figyelem: {overdueInvoices.length} lejárt fizetési határidejű bizonylat!
          </div>
        )}

        {/* Filtered data warning */}
        {hasFilters && (
          <div className="flex items-center gap-2 p-2 rounded-lg bg-yellow-500/10 border border-yellow-500/30 text-yellow-700 dark:text-yellow-400 text-sm">
            Szűrt nézet — {allInvoices.length} számla látható
            <Button variant="ghost" size="sm" className="h-6 text-xs" onClick={() => setFilters({})}>
              Összes szűrő törlése
            </Button>
          </div>
        )}

        {/* Filters */}
        <InvoiceFilters filters={filters} onChange={(f) => { setFilters(f); setPage(0); }} />

        {/* Recurring Invoices */}
        <RecurringInvoices />

        {/* Summary */}
        <InvoiceSummaryCards invoices={allInvoices} />

        {/* Bulk actions bar */}
        {selectedIds.size > 0 && (
          <div className="flex items-center gap-2 p-2 rounded-lg bg-primary/10 border border-primary/30 text-sm">
            <span className="font-medium">{selectedIds.size} kiválasztva:</span>
            <Button variant="outline" size="sm" className="h-7 text-xs" onClick={handleBulkPaid}>
              <Check className="h-3 w-3 mr-1" />
              Fizetve
            </Button>
            <Button variant="outline" size="sm" className="h-7 text-xs text-destructive" onClick={() => setBulkDeleteOpen(true)}>
              <Trash2 className="h-3 w-3 mr-1" />
              Törlés
            </Button>
            <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => setSelectedIds(new Set())}>
              <XCircle className="h-3 w-3 mr-1" />
              Kijelölés törlése
            </Button>
          </div>
        )}

        {/* Sort bar */}
        {!isLoading && allInvoices.length > 0 && (
          <div className="flex items-center gap-1 flex-wrap">
            <span className="text-xs text-muted-foreground mr-1">Rendezés:</span>
            <SortButton label="Dátum" field="issue_date" />
            <SortButton label="Összeg" field="gross_amount" />
            <SortButton label="Partner" field="partner_name" />
            <SortButton label="Státusz" field="status" />
          </div>
        )}

        {/* List */}
        {isLoading ? (
          <div className="text-center py-12 text-muted-foreground">Betöltés...</div>
        ) : allInvoices.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            Még nincsenek bizonylatok. Kattints az "Új bizonylat" gombra!
          </div>
        ) : (
          <div className="space-y-2">
            {/* Select all */}
            <div className="flex items-center gap-2 px-2">
              <Checkbox
                checked={selectedIds.size === paginated.length && paginated.length > 0}
                onCheckedChange={toggleSelectAll}
              />
              <span className="text-xs text-muted-foreground">Mind kijelöl</span>
            </div>
            {paginated.map((inv) => (
              <div key={inv.id} className="flex items-center gap-2">
                <Checkbox
                  checked={selectedIds.has(inv.id)}
                  onCheckedChange={() => toggleSelect(inv.id)}
                  className="shrink-0 ml-2"
                />
                <div className="flex-1 min-w-0">
                  <InvoiceListItem
                    invoice={inv}
                    onClick={() => openEdit(inv)}
                    onDelete={() => handleDeleteSingle(inv)}
                  />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 pt-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page === 0}
              onClick={() => setPage(page - 1)}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-sm text-muted-foreground">
              {page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, sorted.length)} / {sorted.length}
            </span>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= totalPages - 1}
              onClick={() => setPage(page + 1)}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>

      <InvoiceFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        invoice={editInvoice}
      />

      {/* Bulk delete confirmation */}
      <AlertDialog open={bulkDeleteOpen} onOpenChange={setBulkDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Tömeges törlés</AlertDialogTitle>
            <AlertDialogDescription>
              Biztosan törlöd a kiválasztott {selectedIds.size} bizonylatot? Ez a művelet nem visszavonható.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Mégse</AlertDialogCancel>
            <AlertDialogAction onClick={handleBulkDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Törlés ({selectedIds.size})
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminLayout>
  );
};

export default Invoices;
