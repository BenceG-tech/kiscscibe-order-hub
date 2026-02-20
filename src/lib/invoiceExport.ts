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
  const rows = invoices.map((inv) => ({
    "Dátum": inv.issue_date,
    "Partner": inv.partner_name,
    "Adószám": inv.partner_tax_id || "",
    "Számla szám": inv.invoice_number || "",
    "Típus": TYPE_LABELS[inv.type] || inv.type,
    "Kategória": CATEGORY_LABELS[inv.category] || inv.category,
    "ÁFA kulcs": `${inv.vat_rate}%`,
    "Nettó (Ft)": inv.net_amount,
    "ÁFA (Ft)": inv.vat_amount,
    "Bruttó (Ft)": inv.gross_amount,
    "Fizetési határidő": inv.due_date || "",
    "Fizetés dátuma": inv.payment_date || "",
    "Státusz": STATUS_LABELS[inv.status] || inv.status,
    "Megjegyzés": inv.notes || "",
  }));

  const ws1 = XLSX.utils.json_to_sheet(rows);

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

  const now = new Date();
  const ts = `${now.toISOString().slice(0, 10)}_${String(now.getHours()).padStart(2, "0")}${String(now.getMinutes()).padStart(2, "0")}`;
  XLSX.writeFile(wb, `bizonylatok_${ts}.xlsx`);
}

const VAT_RATES = [27, 5, 0];

export function exportVatSummaryToExcel(invoices: Invoice[], periodLabel: string) {
  // Sheet 1: ÁFA összesítő
  const vatRows: Record<string, any>[] = [];
  for (const rate of VAT_RATES) {
    const rateInvoices = invoices.filter((i) => i.vat_rate === rate);
    if (rateInvoices.length === 0 && rate !== 27) continue;
    const inc = rateInvoices.filter((i) => i.type === "incoming");
    const out = rateInvoices.filter((i) => i.type !== "incoming");
    vatRows.push({
      "ÁFA kulcs": `${rate}%`,
      "Irány": "Bejövő",
      "Nettó (Ft)": inc.reduce((s, i) => s + i.net_amount, 0),
      "ÁFA (Ft)": inc.reduce((s, i) => s + i.vat_amount, 0),
      "Bruttó (Ft)": inc.reduce((s, i) => s + i.gross_amount, 0),
      "Tételszám": inc.length,
    });
    vatRows.push({
      "ÁFA kulcs": `${rate}%`,
      "Irány": "Kimenő",
      "Nettó (Ft)": out.reduce((s, i) => s + i.net_amount, 0),
      "ÁFA (Ft)": out.reduce((s, i) => s + i.vat_amount, 0),
      "Bruttó (Ft)": out.reduce((s, i) => s + i.gross_amount, 0),
      "Tételszám": out.length,
    });
  }
  const ws1 = XLSX.utils.json_to_sheet(vatRows);

  // Sheet 2: Részletes
  const detailRows = [...invoices]
    .sort((a, b) => a.issue_date.localeCompare(b.issue_date))
    .map((inv) => ({
      "Dátum": inv.issue_date,
      "Partner": inv.partner_name,
      "Számla szám": inv.invoice_number || "",
      "Típus": TYPE_LABELS[inv.type] || inv.type,
      "Kategória": CATEGORY_LABELS[inv.category] || inv.category,
      "ÁFA kulcs": `${inv.vat_rate}%`,
      "Nettó (Ft)": inv.net_amount,
      "ÁFA (Ft)": inv.vat_amount,
      "Bruttó (Ft)": inv.gross_amount,
    }));
  const ws2 = XLSX.utils.json_to_sheet(detailRows);

  // Sheet 3: Kategória bontás
  const catMap: Record<string, { net: number; vat: number; gross: number }> = {};
  for (const inv of invoices) {
    const label = CATEGORY_LABELS[inv.category] || inv.category;
    if (!catMap[label]) catMap[label] = { net: 0, vat: 0, gross: 0 };
    const sign = inv.type === "incoming" ? -1 : 1;
    catMap[label].net += inv.net_amount * sign;
    catMap[label].vat += inv.vat_amount * sign;
    catMap[label].gross += inv.gross_amount * sign;
  }
  const catRows = Object.entries(catMap).map(([cat, vals]) => ({
    "Kategória": cat,
    "Nettó (Ft)": vals.net,
    "ÁFA (Ft)": vals.vat,
    "Bruttó (Ft)": vals.gross,
  }));
  const ws3 = XLSX.utils.json_to_sheet(catRows);

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws1, "ÁFA összesítő");
  XLSX.utils.book_append_sheet(wb, ws2, "Részletes");
  XLSX.utils.book_append_sheet(wb, ws3, "Kategória bontás");

  XLSX.writeFile(wb, `afa_osszesito_${periodLabel}.xlsx`);
}
