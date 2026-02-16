import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface RecurringInvoice {
  id: string;
  partner_name: string;
  partner_tax_id: string | null;
  category: string;
  gross_amount: number;
  vat_rate: number;
  net_amount: number;
  vat_amount: number;
  frequency: string;
  day_of_month: number;
  next_due_date: string;
  notes: string | null;
  is_active: boolean;
  created_at: string;
  created_by: string | null;
}

export type RecurringInvoiceInsert = Omit<RecurringInvoice, "id" | "created_at" | "created_by">;

export function useRecurringInvoices() {
  return useQuery({
    queryKey: ["recurring-invoices"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("recurring_invoices" as any)
        .select("*")
        .order("next_due_date", { ascending: true });
      if (error) throw error;
      return (data || []) as unknown as RecurringInvoice[];
    },
  });
}

export function useRecurringInvoiceMutations() {
  const qc = useQueryClient();
  const { toast } = useToast();

  const upsert = useMutation({
    mutationFn: async (inv: Partial<RecurringInvoice> & { id?: string }) => {
      if (inv.id) {
        const { error } = await supabase.from("recurring_invoices" as any).update(inv).eq("id", inv.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("recurring_invoices" as any).insert(inv);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["recurring-invoices"] });
      toast({ title: "Mentve" });
    },
    onError: (e: any) => toast({ title: "Hiba", description: e.message, variant: "destructive" }),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("recurring_invoices" as any).delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["recurring-invoices"] });
      toast({ title: "Törölve" });
    },
    onError: (e: any) => toast({ title: "Hiba", description: e.message, variant: "destructive" }),
  });

  const toggleActive = useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { error } = await supabase.from("recurring_invoices" as any).update({ is_active }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["recurring-invoices"] }),
    onError: (e: any) => toast({ title: "Hiba", description: e.message, variant: "destructive" }),
  });

  return { upsert, remove, toggleActive };
}
