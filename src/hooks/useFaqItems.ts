import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface FaqItem {
  id: string;
  question: string;
  answer: string;
}

const DEFAULT_FAQS: FaqItem[] = [
  { id: "1", question: "Meddig lehet aznapra rendelni?", answer: "Az aznapi rendelést 15:30-ig tudod leadni." },
  { id: "2", question: "Mennyi a várható átfutás?", answer: "Átlagosan 15–25 perc." },
  { id: "3", question: "Lehet kártyával fizetni?", answer: "Igen, átvételkor a helyszínen bankkártyával is fizethetsz." },
  { id: "4", question: "Számla kérhető?", answer: "Igen, kérlek jelezd rendeléskor." },
  { id: "5", question: "Tudok időpontra kérni átvételt?", answer: "Igen, választhatsz idősávot." },
  { id: "6", question: "Hol vehetem át a rendelést?", answer: "A rendelés személyesen vehető át a Kiscsibe Étteremben: 1141 Budapest, Vezér u. 110." },
  { id: "7", question: "Mikor vagytok nyitva?", answer: "Hétfőtől péntekig 7:00 és 16:00 között várunk, hétvégén zárva tartunk." },
  { id: "8", question: "Hol találom az allergéneket?", answer: "Az ételek mellett feltüntetjük az allergén információkat. Érzékenység vagy allergia esetén kérjük, rendelés előtt egyeztess velünk." },
];

const isFaqItem = (value: unknown): value is FaqItem => {
  if (!value || typeof value !== "object") return false;
  const item = value as Record<string, unknown>;
  return typeof item.id === "string"
    && typeof item.question === "string"
    && item.question.trim().length > 0
    && typeof item.answer === "string"
    && item.answer.trim().length > 0;
};

const parseFaqItems = (value: unknown): FaqItem[] => {
  if (!Array.isArray(value) || value.length === 0 || !value.every(isFaqItem)) return DEFAULT_FAQS;
  return value;
};

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
      return parseFaqItems(data.value_json);
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
