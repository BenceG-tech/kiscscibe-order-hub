import type { Invoice } from "@/hooks/useInvoices";

const TYPE_LABELS: Record<string, string> = {
  incoming: "Bejövő",
  outgoing: "Kimenő",
  order_receipt: "Rendelés",
};

const CATEGORY_LABELS: Record<string, string> = {
  ingredient: "Alapanyagok",
  utility: "Rezsi",
  rent: "Bérleti díj",
  equipment: "Felszerelés",
  salary: "Bér",
  tax: "Adó",
  food_sale: "Étel értékesítés",
  other: "Egyéb",
};

const STATUS_LABELS: Record<string, string> = {
  draft: "Piszkozat",
  pending: "Függőben",
  paid: "Fizetve",
  overdue: "Lejárt",
  cancelled: "Sztornó",
};

function escCsv(val: string | number | null | undefined): string {
  const s = String(val ?? "");
  if (s.includes(";") || s.includes('"') || s.includes("\n")) {
    return '"' + s.replace(/"/g, '""') + '"';
  }
  return s;
}

export function exportInvoicesToCsv(invoices: Invoice[]) {
  const headers = [
    "Dátum", "Partner", "Adószám", "Számla szám", "Típus", "Kategória",
    "ÁFA kulcs", "Nettó (Ft)", "ÁFA (Ft)", "Bruttó (Ft)",
    "Fizetési határidő", "Fizetés dátuma", "Státusz", "Megjegyzés",
  ];

  const rows = invoices.map((inv) => [
    inv.issue_date,
    inv.partner_name,
    inv.partner_tax_id || "",
    inv.invoice_number || "",
    TYPE_LABELS[inv.type] || inv.type,
    CATEGORY_LABELS[inv.category] || inv.category,
    `${inv.vat_rate}%`,
    inv.net_amount,
    inv.vat_amount,
    inv.gross_amount,
    inv.due_date || "",
    inv.payment_date || "",
    STATUS_LABELS[inv.status] || inv.status,
    inv.notes || "",
  ]);

  // UTF-8 BOM for Hungarian characters in Excel
  const bom = "\uFEFF";
  const csv = bom + [
    headers.join(";"),
    ...rows.map((r) => r.map(escCsv).join(";")),
  ].join("\n");

  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  const now = new Date();
  a.href = url;
  a.download = `bizonylatok_${now.toISOString().slice(0, 10)}_${String(now.getHours()).padStart(2, "0")}${String(now.getMinutes()).padStart(2, "0")}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}
