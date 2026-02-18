import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface Partner {
  id: string;
  name: string;
  short_name: string | null;
  tax_number: string | null;
  eu_vat_number: string | null;
  address: string | null;
  postal_code: string | null;
  city: string | null;
  contact_name: string | null;
  contact_email: string | null;
  contact_phone: string | null;
  payment_terms: string;
  bank_name: string | null;
  bank_iban: string | null;
  category: string;
  is_active: boolean;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export type PartnerInsert = Omit<Partner, "id" | "created_at" | "updated_at">;

export interface PartnerFilters {
  search?: string;
  category?: string;
  is_active?: boolean | null;
}

export const PARTNER_CATEGORIES: Record<string, string> = {
  food_supplier: "Élelmiszer szállító",
  beverage: "Ital szállító",
  cleaning: "Takarítószer",
  equipment: "Felszerelés",
  utility: "Rezsi/közüzemi",
  service: "Szolgáltatás",
  other: "Egyéb",
};

export const PAYMENT_TERMS: Record<string, string> = {
  immediate: "Azonnal",
  net_8: "8 nap",
  net_15: "15 nap",
  net_30: "30 nap",
};

export const usePartners = (filters?: PartnerFilters) => {
  return useQuery({
    queryKey: ["partners", filters],
    queryFn: async () => {
      let query = (supabase as any)
        .from("partners")
        .select("*")
        .order("name", { ascending: true });

      if (filters?.is_active !== null && filters?.is_active !== undefined) {
        query = query.eq("is_active", filters.is_active);
      }
      if (filters?.category && filters.category !== "all") {
        query = query.eq("category", filters.category);
      }
      if (filters?.search) {
        query = query.or(`name.ilike.%${filters.search}%,tax_number.ilike.%${filters.search}%`);
      }

      const { data, error } = await query;
      if (error) throw error;
      return (data || []) as Partner[];
    },
  });
};

export const useActivePartners = () => {
  return useQuery({
    queryKey: ["partners", { is_active: true }],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("partners")
        .select("*")
        .eq("is_active", true)
        .order("name", { ascending: true });
      if (error) throw error;
      return (data || []) as Partner[];
    },
  });
};

export const usePartnerInvoices = (partnerId?: string, partnerName?: string) => {
  return useQuery({
    queryKey: ["partner-invoices", partnerId, partnerName],
    queryFn: async () => {
      if (!partnerId && !partnerName) return [];
      let query = (supabase as any)
        .from("invoices")
        .select("*")
        .order("issue_date", { ascending: false });

      if (partnerId && partnerName) {
        query = query.or(`partner_id.eq.${partnerId},partner_name.ilike.${partnerName}`);
      } else if (partnerId) {
        query = query.eq("partner_id", partnerId);
      } else if (partnerName) {
        query = query.ilike("partner_name", partnerName);
      }

      const { data, error } = await query;
      if (error) throw error;
      return (data || []) as any[];
    },
    enabled: !!partnerId || !!partnerName,
  });
};

export const useCreatePartner = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (partner: Partial<PartnerInsert>) => {
      const { data, error } = await (supabase as any)
        .from("partners")
        .insert(partner)
        .select()
        .single();
      if (error) throw error;
      return data as Partner;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["partners"] });
      toast.success("Partner sikeresen létrehozva");
    },
    onError: (err: Error) => {
      toast.error("Hiba a mentés során: " + err.message);
    },
  });
};

export const useUpdatePartner = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Partner> & { id: string }) => {
      const { data, error } = await (supabase as any)
        .from("partners")
        .update(updates)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data as Partner;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["partners"] });
      qc.invalidateQueries({ queryKey: ["partner-invoices"] });
      toast.success("Partner frissítve");
    },
    onError: (err: Error) => {
      toast.error("Hiba a frissítés során: " + err.message);
    },
  });
};

export const useDeletePartner = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase as any)
        .from("partners")
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["partners"] });
      toast.success("Partner törölve");
    },
    onError: (err: Error) => {
      toast.error("Hiba a törlés során: " + err.message);
    },
  });
};
