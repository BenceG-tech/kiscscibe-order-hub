import { useState, useMemo } from "react";
import AdminLayout from "./AdminLayout";
import { Button } from "@/components/ui/button";
import { Plus, Download, AlertTriangle, FileSpreadsheet } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import InvoiceSummaryCards from "@/components/admin/InvoiceSummaryCards";
import InvoiceFilters from "@/components/admin/InvoiceFilters";
import InvoiceListItem from "@/components/admin/InvoiceListItem";
import InvoiceFormDialog from "@/components/admin/InvoiceFormDialog";
import RecurringInvoices from "@/components/admin/RecurringInvoices";
import { useInvoices, type InvoiceFilters as Filters, type Invoice } from "@/hooks/useInvoices";
import { exportInvoicesToExcel, exportVatSummaryToExcel } from "@/lib/invoiceExport";
import InfoTip from "@/components/admin/InfoTip";

const Invoices = () => {
  const [filters, setFilters] = useState<Filters>({});
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editInvoice, setEditInvoice] = useState<Invoice | null>(null);

  const { data: invoices = [], isLoading } = useInvoices(filters);

  const overdueInvoices = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return invoices.filter(inv => 
      inv.due_date && 
      new Date(inv.due_date) < today && 
      inv.status !== "paid" && 
      inv.status !== "cancelled"
    );
  }, [invoices]);

  const openNew = () => {
    setEditInvoice(null);
    setDialogOpen(true);
  };

  const openEdit = (inv: Invoice) => {
    setEditInvoice(inv);
    setDialogOpen(true);
  };

  return (
    <AdminLayout>
      <div className="py-4 sm:py-6 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h1 className="text-xl sm:text-2xl font-bold flex items-center gap-2">
            Számlák kezelése
            <InfoTip text="Rögzítsd a bejövő költségszámlákat és kövesd a pénzügyi helyzetet." />
          </h1>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => exportInvoicesToExcel(invoices)} disabled={invoices.length === 0}>
              <Download className="h-4 w-4 mr-1" />
              Export
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" disabled={invoices.length === 0}>
                  <FileSpreadsheet className="h-4 w-4 mr-1" />
                  ÁFA export
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem onClick={() => {
                  const now = new Date();
                  const label = `${now.getFullYear()}_${String(now.getMonth() + 1).padStart(2, "0")}`;
                  exportVatSummaryToExcel(invoices, label);
                }}>Havi ÁFA export</DropdownMenuItem>
                <DropdownMenuItem onClick={() => {
                  const now = new Date();
                  const q = Math.ceil((now.getMonth() + 1) / 3);
                  exportVatSummaryToExcel(invoices, `${now.getFullYear()}_Q${q}`);
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

        {/* Filters */}
        <InvoiceFilters filters={filters} onChange={setFilters} />

        {/* Recurring Invoices */}
        <RecurringInvoices />

        {/* Summary */}
        <InvoiceSummaryCards invoices={invoices} />

        {/* List */}
        {isLoading ? (
          <div className="text-center py-12 text-muted-foreground">Betöltés...</div>
        ) : invoices.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            Még nincsenek bizonylatok. Kattints az "Új bizonylat" gombra!
          </div>
        ) : (
          <div className="space-y-2">
            {invoices.map((inv) => (
              <InvoiceListItem key={inv.id} invoice={inv} onClick={() => openEdit(inv)} />
            ))}
          </div>
        )}
      </div>

      <InvoiceFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        invoice={editInvoice}
      />
    </AdminLayout>
  );
};

export default Invoices;
