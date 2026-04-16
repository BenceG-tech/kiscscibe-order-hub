import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface FaqItem {
  id: string;
  question: string;
  answer: string;
}

const DEFAULT_FAQS: FaqItem[] = [
  { id: "1", question: "Meddig lehet rendelni?", answer: "Aznap 14:30-ig adható le rendelés." },
  { id: "2", question: "Mennyi a várható átfutás?", answer: "Átlagosan 15–25 perc." },
  { id: "3", question: "Van kártyás fizetés?", answer: "Igen, a helyszínen és online is (hamarosan)." },
  { id: "4", question: "Számla kérhető?", answer: "Igen, kérlek jelezd rendeléskor." },
  { id: "5", question: "Tudok időpontra kérni átvételt?", answer: "Igen, választhatsz idősávot." },
];

export const useFaqItems = () => {
  const queryClient = useQueryClient();

  const { data: faqs = DEFAULT_FAQS, isLoading } = useQuery({
    queryKey: ["faq_items"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("settings")
        .select("value_json")
        .eq("key", "faq_items")
        .maybeSingle();

      if (error) throw error;
      if (!data) return DEFAULT_FAQS;
      return (data.value_json as unknown as FaqItem[]) || DEFAULT_FAQS;
    },
  });

  const saveMutation = useMutation({
    mutationFn: async (items: FaqItem[]) => {
      const payload = { key: "faq_items", value_json: items as unknown as Record<string, unknown> };
      const { error } = await supabase
        .from("settings")
        .upsert(payload as any, { onConflict: "key" });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["faq_items"] });
      toast.success("GYIK mentve!");
    },
    onError: () => {
      toast.error("Hiba a mentés során");
    },
  });

  return { faqs, isLoading, saveFaqs: saveMutation.mutate, isSaving: saveMutation.isPending };
};
