import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export type AdminNoteStatus = "open" | "in_progress" | "done" | "rejected";
export type AdminNotePriority = "low" | "normal" | "high";

export interface AdminNote {
  id: string;
  title: string;
  body: string;
  page_route: string | null;
  context_label: string | null;
  status: AdminNoteStatus;
  priority: AdminNotePriority;
  created_by: string | null;
  created_by_email: string | null;
  created_by_name: string | null;
  resolved_by: string | null;
  resolved_at: string | null;
  created_at: string;
  updated_at: string;
}

export const NOTE_STATUS_LABELS: Record<AdminNoteStatus, string> = {
  open: "Nyitott",
  in_progress: "Folyamatban",
  done: "Kész",
  rejected: "Elvetve",
};

export const NOTE_PRIORITY_LABELS: Record<AdminNotePriority, string> = {
  low: "Alacsony",
  normal: "Normál",
  high: "Sürgős",
};

export const useAdminNotes = () =>
  useQuery({
    queryKey: ["admin_notes"],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("admin_notes")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(50);
      if (error) throw error;
      return (data || []) as AdminNote[];
    },
  });

export const useCreateAdminNote = () => {
  const { user, profile } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: Pick<AdminNote, "title" | "body" | "page_route" | "context_label" | "priority">) => {
      if (!user) throw new Error("Nincs bejelentkezett felhasználó");
      const { data, error } = await (supabase as any)
        .from("admin_notes")
        .insert({
          ...payload,
          status: "open",
          created_by: user.id,
          created_by_email: profile?.email || user.email,
          created_by_name: profile?.full_name,
        })
        .select("*")
        .single();
      if (error) throw error;
      return data as AdminNote;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin_notes"] });
      toast.success("Jegyzet mentve");
    },
    onError: (error: Error) => toast.error(error.message),
  });
};

export const useUpdateAdminNote = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...patch }: Partial<AdminNote> & { id: string }) => {
      const { data, error } = await (supabase as any)
        .from("admin_notes")
        .update(patch)
        .eq("id", id)
        .select("*")
        .single();
      if (error) throw error;
      return data as AdminNote;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin_notes"] }),
    onError: (error: Error) => toast.error(error.message),
  });
};
