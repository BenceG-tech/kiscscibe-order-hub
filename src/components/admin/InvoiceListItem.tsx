import { Badge } from "@/components/ui/badge";
import { Paperclip } from "lucide-react";
import type { Invoice } from "@/hooks/useInvoices";

interface Props {
  invoice: Invoice;
  onClick: () => void;
}

const STATUS_MAP: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  draft: { label: "Piszkozat", variant: "secondary" },
  pending: { label: "Függőben", variant: "outline" },
  paid: { label: "Fizetve", variant: "default" },
  overdue: { label: "Lejárt", variant: "destructive" },
  cancelled: { label: "Sztornó", variant: "secondary" },
};

const CATEGORY_MAP: Record<string, string> = {
  ingredient: "Alapanyagok",
  utility: "Rezsi",
  rent: "Bérleti díj",
  equipment: "Felszerelés",
  salary: "Bér",
  tax: "Adó",
  food_sale: "Étel értékesítés",
  other: "Egyéb",
};

const fmt = (n: number) =>
  n.toLocaleString("hu-HU", { style: "currency", currency: "HUF", maximumFractionDigits: 0 });

const InvoiceListItem = ({ invoice, onClick }: Props) => {
  const isIncoming = invoice.type === "incoming";
  const status = STATUS_MAP[invoice.status] || STATUS_MAP.draft;

  return (
    <div
      onClick={onClick}
      className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 p-3 sm:p-4 rounded-lg border bg-card hover:bg-muted/50 cursor-pointer transition-colors"
    >
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-medium truncate">{invoice.partner_name}</span>
          <Badge variant="outline" className="text-[10px]">
            {CATEGORY_MAP[invoice.category] || invoice.category}
          </Badge>
        </div>
        <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
          <span>{new Date(invoice.issue_date).toLocaleDateString("hu-HU")}</span>
          {invoice.invoice_number && (
            <>
              <span>•</span>
              <span>{invoice.invoice_number}</span>
            </>
          )}
          {invoice.file_urls.length > 0 && (
            <>
              <span>•</span>
              <Paperclip className="h-3 w-3" />
              <span>{invoice.file_urls.length} fájl</span>
            </>
          )}
        </div>
      </div>

      <div className="flex items-center gap-3">
        <Badge variant={status.variant} className="text-xs whitespace-nowrap">
          {status.label}
        </Badge>
        <span className={`text-sm font-bold whitespace-nowrap ${isIncoming ? "text-destructive" : "text-green-600"}`}>
          {isIncoming ? "-" : "+"}{fmt(invoice.gross_amount)}
        </span>
      </div>
    </div>
  );
};

export default InvoiceListItem;
