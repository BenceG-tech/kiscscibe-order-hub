import * as XLSX from "xlsx";
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

export function exportInvoicesToExcel(invoices: Invoice[]) {
  // Sheet 1: Bizonylatok
  const rows = invoices.map((inv) => ({
    "Dátum": inv.issue_date,
    "Partner": inv.partner_name,
    "Számla szám": inv.invoice_number || "",
    "Típus": TYPE_LABELS[inv.type] || inv.type,
    "Kategória": CATEGORY_LABELS[inv.category] || inv.category,
    "Nettó (Ft)": inv.net_amount,
    "ÁFA (Ft)": inv.vat_amount,
    "Bruttó (Ft)": inv.gross_amount,
    "Státusz": STATUS_LABELS[inv.status] || inv.status,
  }));

  const ws1 = XLSX.utils.json_to_sheet(rows);

  // Sheet 2: Összesítő
  const incoming = invoices.filter((i) => i.type === "incoming");
  const outgoing = invoices.filter((i) => i.type !== "incoming");

  const inTotal = incoming.reduce((s, i) => s + i.gross_amount, 0);
  const outTotal = outgoing.reduce((s, i) => s + i.gross_amount, 0);

  const categoryTotals = invoices.reduce<Record<string, number>>((acc, inv) => {
    const label = CATEGORY_LABELS[inv.category] || inv.category;
    const sign = inv.type === "incoming" ? -1 : 1;
    acc[label] = (acc[label] || 0) + inv.gross_amount * sign;
    return acc;
  }, {});

  const summaryRows = [
    { "Megnevezés": "Bejövő (költség) összesen", "Összeg (Ft)": inTotal },
    { "Megnevezés": "Kimenő (bevétel) összesen", "Összeg (Ft)": outTotal },
    { "Megnevezés": "Eredmény", "Összeg (Ft)": outTotal - inTotal },
    { "Megnevezés": "", "Összeg (Ft)": "" },
    { "Megnevezés": "--- Kategória bontás ---", "Összeg (Ft)": "" },
    ...Object.entries(categoryTotals).map(([cat, amount]) => ({
      "Megnevezés": cat,
      "Összeg (Ft)": amount,
    })),
  ];

  const ws2 = XLSX.utils.json_to_sheet(summaryRows);

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws1, "Bizonylatok");
  XLSX.utils.book_append_sheet(wb, ws2, "Összesítő");

  const now = new Date().toISOString().slice(0, 7);
  XLSX.writeFile(wb, `bizonylatok_${now}.xlsx`);
}
