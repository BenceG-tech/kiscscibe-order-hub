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

export const usePartners = (activeOnly = false) => {
  return useQuery({
    queryKey: ["partners", activeOnly],
    queryFn: async () => {
      let query = supabase
        .from("partners" as any)
        .select("*")
        .order("name");
      if (activeOnly) {
        query = query.eq("is_active", true);
      }
      const { data, error } = await query;
      if (error) throw error;
      return (data || []) as unknown as Partner[];
    },
  });
};

export const useCreatePartner = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (partner: Partial<PartnerInsert>) => {
      const { data, error } = await supabase
        .from("partners" as any)
        .insert(partner as any)
        .select()
        .single();
      if (error) throw error;
      return data as unknown as Partner;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["partners"] });
      toast.success("Partner sikeresen mentve");
    },
    onError: (err: Error) => toast.error("Hiba: " + err.message),
  });
};

export const useUpdatePartner = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Partner> & { id: string }) => {
      const { data, error } = await supabase
        .from("partners" as any)
        .update(updates as any)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data as unknown as Partner;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["partners"] });
      toast.success("Partner frissítve");
    },
    onError: (err: Error) => toast.error("Hiba: " + err.message),
  });
};

export const useDeletePartner = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("partners" as any)
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["partners"] });
      toast.success("Partner törölve");
    },
    onError: (err: Error) => toast.error("Hiba: " + err.message),
  });
};
