import React, { createContext, useContext, useReducer, useEffect, useState, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";

interface CartModifier {
  id: string;
  label: string;
  price_delta_huf: number;
}

interface CartSide {
  id: string;
  name: string;
  price_huf: number;
}

interface CartItem {
  id: string;
  name: string;
  price_huf: number;
  quantity: number;
  modifiers: CartModifier[];
  sides: CartSide[];
  image_url?: string;
  // Daily item specific fields
  daily_type?: 'offer' | 'menu' | 'complete_menu';
  daily_date?: string; // YYYY-MM-DD format
  daily_id?: string; // daily_offer_id or daily_menu_id
  menu_id?: string; // For complete menus
  components?: {
    soup: { id: string; name: string; };
    main: { id: string; name: string; };
  };
}

interface CouponInfo {
  code: string;
  discount_type: 'percentage' | 'fixed';
  discount_value: number;
  discount_huf: number; // calculated discount amount
}

interface CartState {
  items: CartItem[];
  total: number;
  itemCount: number;
  coupon: CouponInfo | null;
  totalAfterDiscount: number;
}

type CartAction =
  | { type: "ADD_ITEM"; payload: Omit<CartItem, "quantity"> }
  | { type: "UPDATE_QUANTITY"; payload: { id: string; quantity: number } }
  | { type: "REMOVE_ITEM"; payload: { id: string } }
  | { type: "CLEAR_CART" }
  | { type: "LOAD_CART"; payload: CartItem[] }
  | { type: "SET_COUPON"; payload: CouponInfo | null };

const initialState: CartState = {
  items: [],
  total: 0,
  itemCount: 0,
  coupon: null,
  totalAfterDiscount: 0,
};

const calculateTotals = (items: CartItem[]): { total: number; itemCount: number } => {
  const total = items.reduce((sum, item) => {
    const modifiersTotal = item.modifiers.reduce((modSum, mod) => modSum + mod.price_delta_huf, 0);
    const sidesTotal = item.sides.reduce((sideSum, side) => sideSum + side.price_huf, 0);
    const itemTotal = item.price_huf + modifiersTotal + sidesTotal;
    return sum + (itemTotal * item.quantity);
  }, 0);
  
  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);
  
  return { total, itemCount };
};

const applyDiscount = (total: number, coupon: CouponInfo | null): { discount_huf: number; totalAfterDiscount: number } => {
  if (!coupon) return { discount_huf: 0, totalAfterDiscount: total };
  let discount_huf = 0;
  if (coupon.discount_type === 'percentage') {
    discount_huf = Math.round(total * coupon.discount_value / 100);
  } else {
    discount_huf = Math.min(coupon.discount_value, total);
  }
  return { discount_huf, totalAfterDiscount: total - discount_huf };
};

const cartReducer = (state: CartState, action: CartAction): CartState => {
  let newItems: CartItem[];
  let newCoupon = state.coupon;
  
  switch (action.type) {
    case "ADD_ITEM":
      const existingItemIndex = state.items.findIndex(item => 
        item.id === action.payload.id && 
        JSON.stringify(item.modifiers) === JSON.stringify(action.payload.modifiers) &&
        JSON.stringify(item.sides) === JSON.stringify(action.payload.sides) &&
        item.daily_type === action.payload.daily_type &&
        item.daily_date === action.payload.daily_date &&
        item.daily_id === action.payload.daily_id &&
        item.menu_id === action.payload.menu_id
      );
      
      if (existingItemIndex > -1) {
        newItems = state.items.map((item, index) =>
          index === existingItemIndex
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      } else {
        newItems = [...state.items, { ...action.payload, quantity: 1 }];
      }
      break;
      
    case "UPDATE_QUANTITY":
      if (action.payload.quantity <= 0) {
        newItems = state.items.filter(item => item.id !== action.payload.id);
      } else {
        newItems = state.items.map(item =>
          item.id === action.payload.id
            ? { ...item, quantity: action.payload.quantity }
            : item
        );
      }
      break;
      
    case "REMOVE_ITEM":
      newItems = state.items.filter(item => item.id !== action.payload.id);
      break;
      
    case "CLEAR_CART":
      newItems = [];
      newCoupon = null;
      break;
      
    case "LOAD_CART":
      newItems = action.payload;
      break;

    case "SET_COUPON":
      newItems = state.items;
      newCoupon = action.payload;
      break;
      
    default:
      return state;
  }
  
  const { total, itemCount } = calculateTotals(newItems);
  const { discount_huf, totalAfterDiscount } = applyDiscount(total, newCoupon);
  if (newCoupon) newCoupon = { ...newCoupon, discount_huf };
  
  return {
    items: newItems,
    total,
    itemCount,
    coupon: newCoupon,
    totalAfterDiscount,
  };
};

interface CartContextType {
  state: CartState;
  isCartLoaded: boolean;
  addItem: (item: Omit<CartItem, "quantity">) => void;
  addItemWithSides: (item: Omit<CartItem, "quantity" | "sides">, sides: CartSide[]) => void;
  updateQuantity: (id: string, quantity: number) => void;
  removeItem: (id: string) => void;
  clearCart: () => void;
  addDailyOffer: (offer: DailyOffer) => void;
  addDailyMenu: (menu: DailyMenu) => void;
  addCompleteMenu: (menu: CompleteMenu) => void;
  validateCartSides: () => Promise<{ valid: boolean; errors: string[] }>;
  applyCoupon: (code: string) => Promise<{ success: boolean; message: string }>;
  removeCoupon: () => void;
}

// Daily item interfaces for adding to cart
interface DailyOffer {
  id: string;
  date: string;
  price_huf: number;
  daily_offer_items?: Array<{
    menu_items?: {
      name: string;
    };
  }>;
}

interface DailyMenu {
  id: string;
  date: string;
  price_huf: number;
  daily_menu_items?: Array<{
    menu_items?: {
      name: string;
    };
  }>;
}

interface CompleteMenu {
  id: string;
  date: string;
  price_huf: number;
  soup: {
    id: string;
    name: string;
    description: string;
    price_huf: number;
  };
  main: {
    id: string;
    name: string;
    description: string;
    price_huf: number;
  };
  remaining_portions: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider = ({ children }: { children: ReactNode }) => {
  const [state, dispatch] = useReducer(cartReducer, initialState);
  const [isCartLoaded, setIsCartLoaded] = useState(false);
  
  const STORAGE_KEY = "kiscsibe-cart";
  
  // Load cart from localStorage on mount
  useEffect(() => {
    try {
      const savedCart = localStorage.getItem(STORAGE_KEY);
      if (savedCart) {
        const parsedCart = JSON.parse(savedCart);
        dispatch({ type: "LOAD_CART", payload: parsedCart });
      }
    } catch (error) {
      console.error("Error loading cart from localStorage:", error);
    }
    setIsCartLoaded(true);
  }, []);
  
  // Save cart to localStorage whenever it changes
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state.items));
    } catch (error) {
      console.error("Error saving cart to localStorage:", error);
    }
  }, [state.items]);
  
  const addItem = (item: Omit<CartItem, "quantity">) => {
    const itemWithSides = { ...item, sides: item.sides || [] };
    dispatch({ type: "ADD_ITEM", payload: itemWithSides });
  };

  const addItemWithSides = (item: Omit<CartItem, "quantity" | "sides">, sides: CartSide[]) => {
    const itemWithSides = { ...item, sides };
    dispatch({ type: "ADD_ITEM", payload: itemWithSides });
  };
  
  const updateQuantity = (id: string, quantity: number) => {
    dispatch({ type: "UPDATE_QUANTITY", payload: { id, quantity } });
  };
  
  const removeItem = (id: string) => {
    dispatch({ type: "REMOVE_ITEM", payload: { id } });
  };
  
  const clearCart = () => {
    dispatch({ type: "CLEAR_CART" });
  };

  const addDailyOffer = (offer: DailyOffer) => {
    const itemNames = offer.daily_offer_items?.map(item => item.menu_items?.name).filter(Boolean).join(', ') || 'Napi ajánlat';
    
    addItem({
      id: `daily_offer_${offer.id}`,
      name: `Napi ajánlat - ${itemNames}`,
      price_huf: offer.price_huf,
      modifiers: [],
      sides: [],
      daily_type: 'offer',
      daily_date: offer.date,
      daily_id: offer.id,
    });
  };

  const addDailyMenu = (menu: DailyMenu) => {
    const itemNames = menu.daily_menu_items?.map(item => item.menu_items?.name).filter(Boolean).join(', ') || 'Napi menü';
    
    addItem({
      id: `daily_menu_${menu.id}`,
      name: `Napi menü - ${itemNames}`,
      price_huf: menu.price_huf,
      modifiers: [],
      sides: [],
      daily_type: 'menu',
      daily_date: menu.date,
      daily_id: menu.id,
    });
  };

  const addCompleteMenu = (menu: CompleteMenu) => {
    addItem({
      id: `complete_menu_${menu.id}_${menu.soup.id}_${menu.main.id}`,
      name: `Napi menü - ${menu.soup.name} + ${menu.main.name}`,
      price_huf: menu.price_huf,
      modifiers: [],
      sides: [],
      daily_type: 'complete_menu',
      daily_date: menu.date,
      menu_id: menu.id,
      components: {
        soup: { id: menu.soup.id, name: menu.soup.name },
        main: { id: menu.main.id, name: menu.main.name }
      }
    });
  };

  const validateCartSides = async (): Promise<{ valid: boolean; errors: string[] }> => {
    const errors: string[] = [];
    
    for (const item of state.items) {
      // Skip daily items and items that already have sides
      if (item.daily_type || item.sides.length > 0) continue;
      
      try {
        const { data: sideConfigs } = await supabase
          .from('menu_item_sides')
          .select('is_required, min_select, max_select')
          .eq('main_item_id', item.id.replace(/^menu_/, ''));
          
        if (sideConfigs && sideConfigs.length > 0) {
          const config = sideConfigs[0];
          if (config.is_required && item.sides.length < config.min_select) {
            errors.push(`${item.name} - köret választása kötelező`);
          }
        }
      } catch (error) {
        console.error('Error validating sides for item:', item.id, error);
      }
    }
    
    return { valid: errors.length === 0, errors };
  };

  const applyCoupon = async (code: string): Promise<{ success: boolean; message: string }> => {
    try {
      const trimmedCode = code.trim().toUpperCase();
      const { data, error } = await supabase
        .from('coupons')
        .select('*')
        .eq('code', trimmedCode)
        .eq('is_active', true)
        .maybeSingle();

      if (error || !data) return { success: false, message: 'Érvénytelen kupon kód' };

      // Check expiry
      if (data.valid_until && new Date(data.valid_until) < new Date()) {
        return { success: false, message: 'Ez a kupon lejárt' };
      }

      // Check usage limit
      if (data.max_uses !== null && data.used_count >= data.max_uses) {
        return { success: false, message: 'Ez a kupon elfogyott' };
      }

      // Check minimum order
      if (state.total < data.min_order_huf) {
        return { success: false, message: `Minimum rendelési érték: ${data.min_order_huf.toLocaleString()} Ft` };
      }

      dispatch({
        type: "SET_COUPON",
        payload: {
          code: data.code,
          discount_type: data.discount_type as 'percentage' | 'fixed',
          discount_value: data.discount_value,
          discount_huf: 0, // will be calculated by reducer
        }
      });

      return { success: true, message: `Kupon alkalmazva: ${data.discount_type === 'percentage' ? `${data.discount_value}%` : `${data.discount_value} Ft`} kedvezmény` };
    } catch (err) {
      return { success: false, message: 'Hiba a kupon ellenőrzésekor' };
    }
  };

  const removeCoupon = () => {
    dispatch({ type: "SET_COUPON", payload: null });
  };
  
  return (
    <CartContext.Provider value={{
      state,
      isCartLoaded,
      addItem,
      addItemWithSides,
      updateQuantity,
      removeItem,
      clearCart,
      addDailyOffer,
      addDailyMenu,
      addCompleteMenu,
      validateCartSides,
      applyCoupon,
      removeCoupon,
    }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
};