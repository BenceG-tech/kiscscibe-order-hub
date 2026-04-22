import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type AuditAction = "insert" | "update" | "delete";

export interface AdminAuditLogEntry {
  id: string;
  created_at: string;
  actor_user_id: string | null;
  actor_email: string | null;
  actor_name: string | null;
  action: AuditAction;
  module: string;
  entity_table: string;
  entity_id: string | null;
  entity_label: string | null;
  before_data: Record<string, unknown> | null;
  after_data: Record<string, unknown> | null;
  changed_fields: string[];
}

export interface AuditLogFilters {
  search?: string;
  module?: string;
  action?: string;
  actor?: string;
  from?: string;
  to?: string;
}

export const MODULE_LABELS: Record<string, string> = {
  documents: "Dokumentumok",
  menu: "Étlap",
  daily_offer: "Napi ajánlat",
  invoices: "Számlák",
  partners: "Partnerek",
  content: "Tartalom",
  admin: "Admin",
};

export const ACTION_LABELS: Record<string, string> = {
  insert: "Létrehozás",
  update: "Módosítás",
  delete: "Törlés",
};

export const useAdminAuditLog = (filters: AuditLogFilters) =>
  useQuery({
    queryKey: ["admin_audit_log", filters],
    queryFn: async () => {
      let query = (supabase as any)
        .from("admin_audit_log")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(250);

      if (filters.module && filters.module !== "all") query = query.eq("module", filters.module);
      if (filters.action && filters.action !== "all") query = query.eq("action", filters.action);
      if (filters.actor) query = query.ilike("actor_email", `%${filters.actor}%`);
      if (filters.from) query = query.gte("created_at", `${filters.from}T00:00:00`);
      if (filters.to) query = query.lte("created_at", `${filters.to}T23:59:59`);
      if (filters.search) {
        const s = filters.search.replace(/[%]/g, "");
        query = query.or(`entity_label.ilike.%${s}%,entity_table.ilike.%${s}%,actor_email.ilike.%${s}%`);
      }

      const { data, error } = await query;
      if (error) throw error;
      return (data || []) as AdminAuditLogEntry[];
    },
  });
