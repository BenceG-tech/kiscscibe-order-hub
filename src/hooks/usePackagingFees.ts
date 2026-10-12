import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { DEFAULT_PACKAGING_FEES, PackagingFees } from "@/lib/packagingFee";

/**
 * Dobozdíj beállítások a settings táblából (packaging_fees kulcs).
 * Hiányzó/hibás adat esetén az alapértelmezett 150/200 Ft érvényes.
 */
export const usePackagingFees = (): PackagingFees => {
  const { data } = useQuery({
    queryKey: ["packaging-fees"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("settings")
        .select("value_json")
        .eq("key", "packaging_fees")
        .maybeSingle();
      if (error || !data?.value_json) return null;
      const raw = data.value_json as { main_huf?: unknown; menu_huf?: unknown };
      const main_huf = Number(raw.main_huf);
      const menu_huf = Number(raw.menu_huf);
      if (!Number.isFinite(main_huf) || !Number.isFinite(menu_huf) || main_huf < 0 || menu_huf < 0) {
        return null;
      }
      return { main_huf, menu_huf } as PackagingFees;
    },
    staleTime: 1000 * 60 * 30,
    gcTime: 1000 * 60 * 60,
  });

  return data ?? DEFAULT_PACKAGING_FEES;
};
