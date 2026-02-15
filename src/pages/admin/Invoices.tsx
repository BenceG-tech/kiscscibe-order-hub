import { useState } from "react";
import AdminLayout from "./AdminLayout";
import { Button } from "@/components/ui/button";
import { Plus, Download } from "lucide-react";
import InvoiceSummaryCards from "@/components/admin/InvoiceSummaryCards";
import InvoiceFilters from "@/components/admin/InvoiceFilters";
import InvoiceListItem from "@/components/admin/InvoiceListItem";
import InvoiceFormDialog from "@/components/admin/InvoiceFormDialog";
import { useInvoices, type InvoiceFilters as Filters, type Invoice } from "@/hooks/useInvoices";
import { exportInvoicesToExcel } from "@/lib/invoiceExport";
import InfoTip from "@/components/admin/InfoTip";

const Invoices = () => {
  const [filters, setFilters] = useState<Filters>({});
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editInvoice, setEditInvoice] = useState<Invoice | null>(null);

  const { data: invoices = [], isLoading } = useInvoices(filters);

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
            <Button onClick={openNew} size="sm">
              <Plus className="h-4 w-4 mr-1" />
              Új bizonylat
            </Button>
          </div>
        </div>

        {/* Filters */}
        <InvoiceFilters filters={filters} onChange={setFilters} />

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
