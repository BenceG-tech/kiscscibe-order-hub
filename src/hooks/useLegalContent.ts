import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { simpleMarkdownToHtml } from "@/lib/simpleMarkdown";

export interface LegalSection {
  id: string;
  title: string;
  content: string;
}

export interface LegalPageContent {
  heroTitle: string;
  heroSubtitle: string;
  lastUpdated: string;
  sections: LegalSection[];
}

export type LegalPageKey = "legal_impresszum" | "legal_privacy" | "legal_terms" | "legal_cookies";

export const LEGAL_PAGE_CONFIG: Record<LegalPageKey, { label: string; path: string }> = {
  legal_impresszum: { label: "Impresszum", path: "/impresszum" },
  legal_privacy: { label: "Adatvédelem", path: "/adatvedelem" },
  legal_terms: { label: "ÁSZF", path: "/aszf" },
  legal_cookies: { label: "Cookie", path: "/cookie-szabalyzat" },
};

export const useLegalContent = (key: LegalPageKey) => {
  return useQuery({
    queryKey: ["legal-content", key],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("settings")
        .select("value_json")
        .eq("key", key)
        .maybeSingle();

      if (error) throw error;
      if (!data) return null;

      const raw = data.value_json as unknown as LegalPageContent;
      // Auto-convert markdown content to HTML for rendering
      return {
        ...raw,
        sections: raw.sections.map((s) => ({
          ...s,
          content: simpleMarkdownToHtml(s.content),
        })),
      };
    },
    staleTime: 5 * 60 * 1000,
  });
};

export const useAllLegalContent = () => {
  return useQuery({
    queryKey: ["legal-content-all"],
    queryFn: async () => {
      const keys: LegalPageKey[] = ["legal_impresszum", "legal_privacy", "legal_terms", "legal_cookies"];
      const { data, error } = await supabase
        .from("settings")
        .select("key, value_json")
        .in("key", keys);

      if (error) throw error;

      const result: Partial<Record<LegalPageKey, LegalPageContent>> = {};
      data?.forEach((row) => {
        result[row.key as LegalPageKey] = row.value_json as unknown as LegalPageContent;
      });
      return result;
    },
    staleTime: 5 * 60 * 1000,
  });
};
