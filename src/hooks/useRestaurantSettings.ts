import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface OpeningHours {
  mon_fri: string;
  sat: string;
  sun: string;
}

interface RestaurantAddress {
  zip: string;
  city: string;
  street: string;
  full: string;
}

interface RestaurantSettings {
  openingHours: OpeningHours;
  address: RestaurantAddress;
  isLoading: boolean;
}

// Fallback values matching confirmed data
const DEFAULT_OPENING_HOURS: OpeningHours = {
  mon_fri: "07:00-16:00",
  sat: "closed",
  sun: "closed",
};

const DEFAULT_ADDRESS: RestaurantAddress = {
  zip: "1141",
  city: "Budapest",
  street: "Vezér u. 110.",
  full: "1141 Budapest, Vezér u. 110.",
};

export const useRestaurantSettings = (): RestaurantSettings => {
  const { data, isLoading } = useQuery({
    queryKey: ["restaurant-settings"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("settings")
        .select("key, value_json")
        .in("key", ["opening_hours", "restaurant_address"]);

      if (error) {
        console.error("Error fetching restaurant settings:", error);
        return null;
      }

      const map = new Map(data?.map((r) => [r.key, r.value_json]) ?? []);
      return {
        openingHours: (map.get("opening_hours") as unknown as OpeningHours) ?? DEFAULT_OPENING_HOURS,
        address: (map.get("restaurant_address") as unknown as RestaurantAddress) ?? DEFAULT_ADDRESS,
      };
    },
    staleTime: 1000 * 60 * 30, // 30 min cache
    gcTime: 1000 * 60 * 60,
  });

  return {
    openingHours: data?.openingHours ?? DEFAULT_OPENING_HOURS,
    address: data?.address ?? DEFAULT_ADDRESS,
    isLoading,
  };
};

/**
 * Formats opening hours for a one-line display.
 * E.g. "H–P 7:00–16:00 • Szo–V Zárva"
 */
export const formatOpeningHoursOneLiner = (hours: OpeningHours): string => {
  const monFri = hours.mon_fri === "closed" ? "Zárva" : hours.mon_fri.replace("-", "–");
  const satSun =
    hours.sat === "closed" && hours.sun === "closed"
      ? "Zárva"
      : hours.sat === "closed"
      ? `V ${hours.sun.replace("-", "–")}`
      : hours.sun === "closed"
      ? `Szo ${hours.sat.replace("-", "–")}`
      : `Szo ${hours.sat.replace("-", "–")} • V ${hours.sun.replace("-", "–")}`;

  return `H–P ${monFri} • Szo–V ${satSun}`;
};

/**
 * Returns structured opening hours for detailed display (e.g. ContactInfo).
 */
export const getOpeningHoursList = (hours: OpeningHours) => {
  const days = [
    { day: "Hétfő", hours: hours.mon_fri, isOpen: hours.mon_fri !== "closed" },
    { day: "Kedd", hours: hours.mon_fri, isOpen: hours.mon_fri !== "closed" },
    { day: "Szerda", hours: hours.mon_fri, isOpen: hours.mon_fri !== "closed" },
    { day: "Csütörtök", hours: hours.mon_fri, isOpen: hours.mon_fri !== "closed" },
    { day: "Péntek", hours: hours.mon_fri, isOpen: hours.mon_fri !== "closed" },
    { day: "Szombat", hours: hours.sat === "closed" ? "Zárva" : hours.sat, isOpen: hours.sat !== "closed" },
    { day: "Vasárnap", hours: hours.sun === "closed" ? "Zárva" : hours.sun, isOpen: hours.sun !== "closed" },
  ];
  return days;
};
