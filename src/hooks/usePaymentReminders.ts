import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { addDays, format } from "date-fns";

export interface PaymentReminder {
  id: string;
  partner_name: string;
  gross_amount: number;
  due_date: string;
  status: string;
  days_until: number; // negative = overdue
}

export function usePaymentReminders() {
  return useQuery({
    queryKey: ["payment-reminders"],
    queryFn: async () => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const in3Days = format(addDays(today, 3), "yyyy-MM-dd");
      const todayStr = format(today, "yyyy-MM-dd");

      const { data, error } = await supabase
        .from("invoices")
        .select("id, partner_name, gross_amount, due_date, status")
        .not("status", "in", '("paid","cancelled")')
        .not("due_date", "is", null)
        .lte("due_date", in3Days)
        .order("due_date", { ascending: true });

      if (error) throw error;

      const reminders: PaymentReminder[] = (data || []).map((inv: any) => {
        const dueDate = new Date(inv.due_date);
        dueDate.setHours(0, 0, 0, 0);
        const diffMs = dueDate.getTime() - today.getTime();
        const days_until = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
        return { ...inv, days_until };
      });

      return {
        overdue: reminders.filter((r) => r.days_until < 0),
        dueToday: reminders.filter((r) => r.days_until === 0),
        upcoming: reminders.filter((r) => r.days_until > 0 && r.days_until <= 3),
      };
    },
    refetchInterval: 5 * 60 * 1000,
  });
}
