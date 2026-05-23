import * as XLSX from "xlsx";
import { format, addDays } from "date-fns";
import { hu } from "date-fns/locale";

export const TEMPLATE_COLUMNS = [
  "Nap",
  "Levesek",
  "Főételek",
  "Köret",
  "Desszert",
  "Ár (Ft)",
] as const;

export const WEEKDAY_NAMES = ["Hétfő", "Kedd", "Szerda", "Csütörtök", "Péntek"];

export function buildWeekTemplate(weekStart: Date): XLSX.WorkBook {
  const aoa: (string | number)[][] = [];
  aoa.push([...TEMPLATE_COLUMNS]);
  for (let i = 0; i < 5; i++) {
    const d = addDays(weekStart, i);
    aoa.push([
      `${WEEKDAY_NAMES[i]} (${format(d, "MM.dd.", { locale: hu })})`,
      "",
      "",
      "",
      "",
      2200,
    ]);
  }
  const ws = XLSX.utils.aoa_to_sheet(aoa);
  ws["!cols"] = [{ wch: 22 }, { wch: 28 }, { wch: 28 }, { wch: 22 }, { wch: 22 }, { wch: 10 }];
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Heti Ajánlat");
  return wb;
}

export function downloadWeekTemplate(weekStart: Date) {
  const wb = buildWeekTemplate(weekStart);
  const fname = `heti_sablon_${format(weekStart, "yyyy-MM-dd")}.xlsx`;
  XLSX.writeFile(wb, fname);
}

export interface ParsedDayRow {
  dayIndex: number; // 0-4 Mon-Fri
  items: { name: string; columnHeader: string }[];
  price: number | null;
}

export function parseWeeklyExcel(file: File): Promise<ParsedDayRow[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = e => {
      try {
        const wb = XLSX.read(e.target?.result, { type: "binary" });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const rows = XLSX.utils.sheet_to_json<any[]>(ws, { header: 1 });
        if (rows.length < 2) return resolve([]);
        const header = (rows[0] as any[]).map(h => String(h ?? "").trim());
        const priceColIdx = header.findIndex(h => /ár|price/i.test(h));
        const itemCols: { idx: number; header: string }[] = header
          .map((h, idx) => ({ idx, header: h }))
          .filter(c => c.idx !== 0 && c.idx !== priceColIdx && c.header);

        const result: ParsedDayRow[] = [];
        for (let r = 1; r < rows.length && result.length < 5; r++) {
          const row = rows[r] as any[];
          if (!row) continue;
          const dayLabel = String(row[0] ?? "").toLowerCase();
          let dayIndex = WEEKDAY_NAMES.findIndex(n => dayLabel.includes(n.toLowerCase()));
          if (dayIndex < 0) dayIndex = result.length;
          const items: { name: string; columnHeader: string }[] = [];
          for (const c of itemCols) {
            const v = row[c.idx];
            if (v === undefined || v === null) continue;
            const cell = String(v).trim();
            if (!cell) continue;
            // allow multiple items separated by comma or newline
            cell.split(/[,\n;]+/).map(s => s.trim()).filter(Boolean).forEach(name => {
              items.push({ name, columnHeader: c.header });
            });
          }
          const priceRaw = priceColIdx >= 0 ? row[priceColIdx] : null;
          const price = priceRaw != null && priceRaw !== ""
            ? Number(String(priceRaw).replace(/[^\d]/g, ""))
            : null;
          result.push({ dayIndex, items, price: price && !isNaN(price) ? price : null });
        }
        resolve(result);
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = () => reject(new Error("Failed to read file"));
    reader.readAsBinaryString(file);
  });
}
