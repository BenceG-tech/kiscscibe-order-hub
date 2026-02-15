import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Paperclip, Bot, FileText, Image as ImageIcon, ExternalLink, AlertTriangle } from "lucide-react";
import { useUpdateInvoice, type Invoice } from "@/hooks/useInvoices";
import { differenceInDays } from "date-fns";

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

const isImageUrl = (url: string) => /\.(jpg|jpeg|png|gif|webp|heic|heif)/i.test(url);

const InvoiceListItem = ({ invoice, onClick }: Props) => {
  const isIncoming = invoice.type === "incoming";
  const isOrderReceipt = invoice.type === "order_receipt";
  const status = STATUS_MAP[invoice.status] || STATUS_MAP.draft;
  const update = useUpdateInvoice();

  const handleStatusChange = (newStatus: string) => {
    update.mutate({
      id: invoice.id,
      status: newStatus as any,
      ...(newStatus === "paid" ? { payment_date: new Date().toISOString().split("T")[0] } : {}),
    } as any);
  };

  // Get first image thumbnail
  const firstImage = invoice.file_urls.find(isImageUrl);

  return (
    <div
      onClick={onClick}
      className={`flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 p-3 sm:p-4 rounded-lg border bg-card hover:bg-muted/50 cursor-pointer transition-colors ${
        isOrderReceipt ? "border-l-4 border-l-primary/40" : ""
      }`}
    >
      {/* Thumbnail */}
      {firstImage && (
        <div className="hidden sm:block shrink-0">
          <img
            src={firstImage}
            alt="Csatolt kép"
            className="h-10 w-10 rounded object-cover border"
          />
        </div>
      )}

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-medium truncate">{invoice.partner_name}</span>
          <Badge variant="outline" className="text-[10px]">
            {CATEGORY_MAP[invoice.category] || invoice.category}
          </Badge>
          {isOrderReceipt && (
            <Badge variant="secondary" className="text-[10px] gap-1">
              <Bot className="h-3 w-3" />
              Auto
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground flex-wrap">
          <span>{new Date(invoice.issue_date).toLocaleDateString("hu-HU")}</span>
          {invoice.invoice_number && (
            <>
              <span>•</span>
              <span>{invoice.invoice_number}</span>
            </>
          )}
          {invoice.due_date && (() => {
            const daysOverdue = differenceInDays(new Date(), new Date(invoice.due_date));
            const isPastDue = daysOverdue > 0 && invoice.status !== "paid" && invoice.status !== "cancelled";
            return (
              <>
                <span>•</span>
                <span className={isPastDue ? "text-destructive font-medium flex items-center gap-1" : ""}>
                  {isPastDue && <AlertTriangle className="h-3 w-3" />}
                  Hat.idő: {new Date(invoice.due_date).toLocaleDateString("hu-HU")}
                  {isPastDue && ` (${daysOverdue} napja lejárt)`}
                </span>
              </>
            );
          })()}
          {invoice.file_urls.length > 0 && (
            <>
              <span>•</span>
              <span
                className="inline-flex items-center gap-1 hover:text-foreground"
                onClick={(e) => {
                  e.stopPropagation();
                  window.open(invoice.file_urls[0], "_blank");
                }}
              >
                {isImageUrl(invoice.file_urls[0]) ? <ImageIcon className="h-3 w-3" /> : <FileText className="h-3 w-3" />}
                {invoice.file_urls.length} fájl
                <ExternalLink className="h-2.5 w-2.5" />
              </span>
            </>
          )}
        </div>
      </div>

      <div className="flex items-center gap-3">
        {/* Quick status dropdown */}
        <div onClick={(e) => e.stopPropagation()}>
          <Select value={invoice.status} onValueChange={handleStatusChange}>
            <SelectTrigger className="h-7 w-auto border-0 p-0 shadow-none focus:ring-0">
              <Badge variant={status.variant} className="text-xs whitespace-nowrap cursor-pointer">
                {status.label}
              </Badge>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="draft">Piszkozat</SelectItem>
              <SelectItem value="pending">Függőben</SelectItem>
              <SelectItem value="paid">Fizetve</SelectItem>
              <SelectItem value="overdue">Lejárt</SelectItem>
              <SelectItem value="cancelled">Sztornó</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <span className={`text-sm font-bold whitespace-nowrap ${isIncoming ? "text-destructive" : "text-green-600"}`}>
          {isIncoming ? "-" : "+"}{fmt(invoice.gross_amount)}
        </span>
      </div>
    </div>
  );
};

export default InvoiceListItem;
