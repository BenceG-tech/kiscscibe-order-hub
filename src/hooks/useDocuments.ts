import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";

export interface DocumentFolder {
  id: string;
  name: string;
  color: string;
  created_at: string;
}

export interface DocumentTag {
  id: string;
  name: string;
  color: string;
}

export interface DocumentRow {
  id: string;
  name: string;
  original_filename: string;
  file_path: string;
  file_size: number;
  mime_type: string | null;
  folder_id: string | null;
  tags: string[];
  description: string | null;
  is_starred: boolean;
  version: number;
  parent_document_id: string | null;
  is_latest_version: boolean;
  uploaded_by: string | null;
  uploaded_by_name: string | null;
  created_at: string;
  updated_at: string;
}

export const useFolders = () =>
  useQuery({
    queryKey: ["document_folders"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("document_folders")
        .select("*")
        .order("name");
      if (error) throw error;
      return data as DocumentFolder[];
    },
  });

export const useTags = () =>
  useQuery({
    queryKey: ["document_tags"],
    queryFn: async () => {
      const { data, error } = await supabase.from("document_tags").select("*").order("name");
      if (error) throw error;
      return data as DocumentTag[];
    },
  });

export const useDocuments = (filter?: {
  folderId?: string | null;
  starred?: boolean;
  search?: string;
  tag?: string;
}) =>
  useQuery({
    queryKey: ["documents", filter],
    queryFn: async () => {
      let q = supabase
        .from("documents")
        .select("*")
        .eq("is_latest_version", true)
        .order("created_at", { ascending: false });

      if (filter?.folderId !== undefined) {
        if (filter.folderId === null) q = q.is("folder_id", null);
        else q = q.eq("folder_id", filter.folderId);
      }
      if (filter?.starred) q = q.eq("is_starred", true);
      if (filter?.tag) q = q.contains("tags", [filter.tag]);

      const { data, error } = await q;
      if (error) throw error;
      let rows = data as DocumentRow[];
      if (filter?.search) {
        const norm = (s: string) =>
          s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
        const s = norm(filter.search);
        rows = rows.filter(
          (r) =>
            norm(r.name).includes(s) ||
            norm(r.original_filename).includes(s) ||
            (r.description && norm(r.description).includes(s)) ||
            r.tags.some((t) => norm(t).includes(s)),
        );
      }
      return rows;
    },
  });

export const useDocumentVersions = (parentId: string | null) =>
  useQuery({
    queryKey: ["document_versions", parentId],
    enabled: !!parentId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("documents")
        .select("*")
        .or(`id.eq.${parentId},parent_document_id.eq.${parentId}`)
        .order("version", { ascending: false });
      if (error) throw error;
      return data as DocumentRow[];
    },
  });

export const useUploadDocument = () => {
  const qc = useQueryClient();
  const { user, profile } = useAuth();

  return useMutation({
    mutationFn: async ({
      file,
      folderId,
      tags = [],
    }: {
      file: File;
      folderId: string | null;
      tags?: string[];
    }) => {
      if (!user) throw new Error("Nincs bejelentkezve");

      const displayName = file.name;
      // Verziókezelés: van-e ugyanilyen nevű, ugyanabban a mappában?
      let parentId: string | null = null;
      let nextVersion = 1;
      const existingQuery = supabase
        .from("documents")
        .select("*")
        .eq("name", displayName)
        .eq("is_latest_version", true);
      const { data: existing, error: exErr } = await (folderId
        ? existingQuery.eq("folder_id", folderId)
        : existingQuery.is("folder_id", null));
      if (exErr) throw exErr;

      if (existing && existing.length > 0) {
        const old = existing[0] as DocumentRow;
        parentId = old.parent_document_id ?? old.id;
        nextVersion = old.version + 1;
        const { error: updErr } = await supabase
          .from("documents")
          .update({ is_latest_version: false })
          .eq("id", old.id);
        if (updErr) throw updErr;
      }

      // Storage upload
      const ext = file.name.split(".").pop() || "bin";
      const path = `${user.id}/${crypto.randomUUID()}.${ext}`;
      const { error: upErr } = await supabase.storage
        .from("documents")
        .upload(path, file, { contentType: file.type });
      if (upErr) throw upErr;

      const { data: inserted, error: insErr } = await supabase
        .from("documents")
        .insert({
          name: displayName,
          original_filename: file.name,
          file_path: path,
          file_size: file.size,
          mime_type: file.type,
          folder_id: folderId,
          tags,
          version: nextVersion,
          parent_document_id: parentId,
          is_latest_version: true,
          uploaded_by: user.id,
          uploaded_by_name: profile?.full_name || profile?.email || null,
        })
        .select()
        .single();
      if (insErr) throw insErr;

      await supabase.from("document_activity").insert({
        document_id: inserted.id,
        action: nextVersion > 1 ? "uploaded_new_version" : "uploaded",
        user_id: user.id,
        user_name: profile?.full_name || profile?.email || null,
        details: { version: nextVersion, parent_id: parentId },
      });

      return inserted;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["documents"] });
      qc.invalidateQueries({ queryKey: ["document_versions"] });
    },
    onError: (e: any) => {
      toast({ title: "Feltöltés sikertelen", description: e.message, variant: "destructive" });
    },
  });
};

export const useUpdateDocument = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...patch }: Partial<DocumentRow> & { id: string }) => {
      const { error } = await supabase.from("documents").update(patch).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["documents"] });
    },
  });
};

export const useDeleteDocument = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (doc: DocumentRow) => {
      // Storage törlés (összes verzió fájlja)
      const { data: versions } = await supabase
        .from("documents")
        .select("file_path")
        .or(`id.eq.${doc.parent_document_id ?? doc.id},parent_document_id.eq.${doc.parent_document_id ?? doc.id}`);
      const paths = (versions ?? []).map((v: any) => v.file_path);
      if (paths.length) await supabase.storage.from("documents").remove(paths);
      const rootId = doc.parent_document_id ?? doc.id;
      const { error } = await supabase.from("documents").delete().eq("id", rootId);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["documents"] }),
    onError: (e: any) =>
      toast({ title: "Törlés sikertelen", description: e.message, variant: "destructive" }),
  });
};

export const useCreateFolder = () => {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async ({ name, color }: { name: string; color: string }) => {
      const { error } = await supabase
        .from("document_folders")
        .insert({ name, color, created_by: user?.id });
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["document_folders"] }),
  });
};

export const useDeleteFolder = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("document_folders").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["document_folders"] });
      qc.invalidateQueries({ queryKey: ["documents"] });
    },
  });
};

export const useCreateTag = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ name, color }: { name: string; color: string }) => {
      const { error } = await supabase.from("document_tags").insert({ name, color });
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["document_tags"] }),
  });
};

export const useDeleteTag = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("document_tags").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["document_tags"] }),
  });
};

export async function getSignedUrl(filePath: string): Promise<string | null> {
  const { data } = await supabase.storage.from("documents").createSignedUrl(filePath, 3600);
  return data?.signedUrl ?? null;
}
