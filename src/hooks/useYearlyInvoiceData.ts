import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface MonthlyData {
  month: number; // 1-12
  income: number;
  expense: number;
  result: number;
}

export function useYearlyInvoiceData() {
  const currentYear = new Date().getFullYear();
  const prevYear = currentYear - 1;

  return useQuery({
    queryKey: ["yearly-invoice-data", currentYear],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("invoices")
        .select("issue_date, type, gross_amount")
        .gte("issue_date", `${prevYear}-01-01`)
        .lte("issue_date", `${currentYear}-12-31`);

      if (error) throw error;

      const aggregate = (year: number): MonthlyData[] => {
        const months: MonthlyData[] = Array.from({ length: 12 }, (_, i) => ({
          month: i + 1,
          income: 0,
          expense: 0,
          result: 0,
        }));

        for (const inv of data || []) {
          const d = new Date(inv.issue_date);
          if (d.getFullYear() !== year) continue;
          const m = d.getMonth();
          if (inv.type === "incoming") {
            months[m].expense += inv.gross_amount;
          } else {
            months[m].income += inv.gross_amount;
          }
        }

        for (const m of months) {
          m.result = m.income - m.expense;
        }

        return months;
      };

      return {
        currentYear,
        prevYear,
        current: aggregate(currentYear),
        previous: aggregate(prevYear),
      };
    },
  });
}
