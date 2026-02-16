import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface FavoriteOrderItem {
  item_id: string;
  name: string;
  price_huf: number;
  sides: { id: string; name: string; price_huf: number }[];
  modifiers: { id: string; label: string; price_delta_huf: number }[];
}

export interface FavoriteOrder {
  id: string;
  name: string;
  items: FavoriteOrderItem[];
  total_huf: number;
  savedAt: string;
}

const STORAGE_KEY = "kiscsibe-favorites";
const MAX_FAVORITES = 5;

export const useFavoriteOrders = () => {
  const [favorites, setFavorites] = useState<FavoriteOrder[]>([]);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) setFavorites(JSON.parse(saved));
    } catch {
      // ignore
    }
  }, []);

  const persist = (updated: FavoriteOrder[]) => {
    setFavorites(updated);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  };

  const saveFavorite = useCallback((order: Omit<FavoriteOrder, "id" | "savedAt">) => {
    const newFav: FavoriteOrder = {
      ...order,
      id: `fav_${Date.now()}`,
      savedAt: new Date().toISOString(),
    };
    const updated = [newFav, ...favorites].slice(0, MAX_FAVORITES);
    persist(updated);
    return newFav;
  }, [favorites]);

  const removeFavorite = useCallback((id: string) => {
    persist(favorites.filter(f => f.id !== id));
  }, [favorites]);

  const validateFavorite = useCallback(async (fav: FavoriteOrder): Promise<{ valid: boolean; unavailable: string[] }> => {
    const itemIds = fav.items.map(i => i.item_id);
    const { data } = await supabase
      .from("menu_items")
      .select("id, is_active")
      .in("id", itemIds);

    const activeIds = new Set((data || []).filter(i => i.is_active).map(i => i.id));
    const unavailable = fav.items.filter(i => !activeIds.has(i.item_id)).map(i => i.name);
    return { valid: unavailable.length === 0, unavailable };
  }, []);

  return { favorites, saveFavorite, removeFavorite, validateFavorite };
};
