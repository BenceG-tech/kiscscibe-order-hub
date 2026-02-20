import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface Invoice {
  id: string;
  type: "incoming" | "outgoing" | "order_receipt";
  status: "draft" | "pending" | "paid" | "overdue" | "cancelled";
  invoice_number: string | null;
  partner_name: string;
  partner_tax_id: string | null;
  order_id: string | null;
  issue_date: string;
  due_date: string | null;
  payment_date: string | null;
  net_amount: number;
  vat_amount: number;
  gross_amount: number;
  vat_rate: number;
  category: string;
  notes: string | null;
  file_urls: string[];
  created_at: string;
  updated_at: string;
  created_by: string | null;
}

export type InvoiceInsert = Omit<Invoice, "id" | "created_at" | "updated_at">;

export interface InvoiceFilters {
  type?: string;
  status?: string;
  category?: string;
  dateFrom?: string;
  dateTo?: string;
  search?: string;
}

export const useInvoices = (filters?: InvoiceFilters) => {
  return useQuery({
    queryKey: ["invoices", filters],
    queryFn: async () => {
      let query = supabase
        .from("invoices" as any)
        .select("*")
        .order("issue_date", { ascending: false });

      if (filters?.type && filters.type !== "all") {
        query = query.eq("type", filters.type);
      }
      if (filters?.status && filters.status !== "all") {
        query = query.eq("status", filters.status);
      }
      if (filters?.category && filters.category !== "all") {
        query = query.eq("category", filters.category);
      }
      if (filters?.dateFrom) {
        query = query.gte("issue_date", filters.dateFrom);
      }
      if (filters?.dateTo) {
        query = query.lte("issue_date", filters.dateTo);
      }
      if (filters?.search) {
        query = query.or(`partner_name.ilike.%${filters.search}%,invoice_number.ilike.%${filters.search}%`);
      }

      const { data, error } = await query;
      if (error) throw error;
      return (data || []) as unknown as Invoice[];
    },
  });
};

export const usePartnerSuggestions = () => {
  return useQuery({
    queryKey: ["invoice-partners"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("invoices" as any)
        .select("partner_name, partner_tax_id")
        .order("partner_name");
      if (error) throw error;
      const unique = new Map<string, string | null>();
      (data || []).forEach((d: any) => {
        if (!unique.has(d.partner_name)) {
          unique.set(d.partner_name, d.partner_tax_id);
        }
      });
      return Array.from(unique.entries()).map(([name, taxId]) => ({
        name,
        taxId,
      }));
    },
  });
};

export const useCreateInvoice = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (invoice: Partial<InvoiceInsert>) => {
      const { data, error } = await supabase
        .from("invoices" as any)
        .insert(invoice as any)
        .select()
        .single();
      if (error) throw error;
      return data as unknown as Invoice;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["invoices"] });
      qc.invalidateQueries({ queryKey: ["invoice-partners"] });
      toast.success("Bizonylat sikeresen mentve");
    },
    onError: (err: Error) => {
      toast.error("Hiba a mentés során: " + err.message);
    },
  });
};

export const useUpdateInvoice = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Invoice> & { id: string }) => {
      const { data, error } = await supabase
        .from("invoices" as any)
        .update(updates as any)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data as unknown as Invoice;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["invoices"] });
      toast.success("Bizonylat frissítve");
    },
    onError: (err: Error) => {
      toast.error("Hiba a frissítés során: " + err.message);
    },
  });
};

export const useDeleteInvoice = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("invoices" as any)
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["invoices"] });
      toast.success("Bizonylat törölve");
    },
    onError: (err: Error) => {
      toast.error("Hiba a törlés során: " + err.message);
    },
  });
};
