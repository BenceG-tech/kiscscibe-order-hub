import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format, startOfMonth, endOfMonth } from "date-fns";

interface OverdueData {
  overdueCount: number;
  overdueTotal: number;
  monthlyIncome: number;
  monthlyExpense: number;
  monthlyResult: number;
}

export const useOverdueInvoices = () => {
  return useQuery({
    queryKey: ["overdue-invoices"],
    queryFn: async (): Promise<OverdueData> => {
      const today = format(new Date(), "yyyy-MM-dd");
      const monthStart = format(startOfMonth(new Date()), "yyyy-MM-dd");
      const monthEnd = format(endOfMonth(new Date()), "yyyy-MM-dd");

      // Fetch overdue invoices
      const { data: overdue } = await supabase
        .from("invoices" as any)
        .select("gross_amount")
        .eq("status", "pending")
        .lt("due_date", today);

      // Fetch monthly invoices for summary
      const { data: monthly } = await supabase
        .from("invoices" as any)
        .select("type, gross_amount, status")
        .gte("issue_date", monthStart)
        .lte("issue_date", monthEnd)
        .neq("status", "cancelled");

      const overdueItems = (overdue || []) as any[];
      const monthlyItems = (monthly || []) as any[];

      const overdueCount = overdueItems.length;
      const overdueTotal = overdueItems.reduce((sum: number, i: any) => sum + (i.gross_amount || 0), 0);

      const monthlyIncome = monthlyItems
        .filter((i: any) => i.type === "outgoing" || i.type === "order_receipt")
        .reduce((sum: number, i: any) => sum + (i.gross_amount || 0), 0);

      const monthlyExpense = monthlyItems
        .filter((i: any) => i.type === "incoming")
        .reduce((sum: number, i: any) => sum + (i.gross_amount || 0), 0);

      return {
        overdueCount,
        overdueTotal,
        monthlyIncome,
        monthlyExpense,
        monthlyResult: monthlyIncome - monthlyExpense,
      };
    },
    refetchInterval: 60000,
  });
};
