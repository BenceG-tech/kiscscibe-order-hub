import React, { createContext, useContext, useReducer, useEffect, ReactNode } from "react";

interface CartModifier {
  id: string;
  label: string;
  price_delta_huf: number;
}

interface CartItem {
  id: string;
  name: string;
  price_huf: number;
  quantity: number;
  modifiers: CartModifier[];
  image_url?: string;
  // Daily item specific fields
  daily_type?: 'offer' | 'menu';
  daily_date?: string; // YYYY-MM-DD format
  daily_id?: string; // daily_offer_id or daily_menu_id
}

interface CartState {
  items: CartItem[];
  total: number;
  itemCount: number;
}

type CartAction =
  | { type: "ADD_ITEM"; payload: Omit<CartItem, "quantity"> }
  | { type: "UPDATE_QUANTITY"; payload: { id: string; quantity: number } }
  | { type: "REMOVE_ITEM"; payload: { id: string } }
  | { type: "CLEAR_CART" }
  | { type: "LOAD_CART"; payload: CartItem[] };

const initialState: CartState = {
  items: [],
  total: 0,
  itemCount: 0,
};

const calculateTotals = (items: CartItem[]): { total: number; itemCount: number } => {
  const total = items.reduce((sum, item) => {
    const itemTotal = item.price_huf + item.modifiers.reduce((modSum, mod) => modSum + mod.price_delta_huf, 0);
    return sum + (itemTotal * item.quantity);
  }, 0);
  
  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);
  
  return { total, itemCount };
};

const cartReducer = (state: CartState, action: CartAction): CartState => {
  let newItems: CartItem[];
  
  switch (action.type) {
    case "ADD_ITEM":
      const existingItemIndex = state.items.findIndex(item => 
        item.id === action.payload.id && 
        JSON.stringify(item.modifiers) === JSON.stringify(action.payload.modifiers) &&
        item.daily_type === action.payload.daily_type &&
        item.daily_date === action.payload.daily_date &&
        item.daily_id === action.payload.daily_id
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
      break;
      
    case "LOAD_CART":
      newItems = action.payload;
      break;
      
    default:
      return state;
  }
  
  const { total, itemCount } = calculateTotals(newItems);
  
  return {
    items: newItems,
    total,
    itemCount,
  };
};

interface CartContextType {
  state: CartState;
  addItem: (item: Omit<CartItem, "quantity">) => void;
  updateQuantity: (id: string, quantity: number) => void;
  removeItem: (id: string) => void;
  clearCart: () => void;
  addDailyOffer: (offer: DailyOffer) => void;
  addDailyMenu: (menu: DailyMenu) => void;
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

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider = ({ children }: { children: ReactNode }) => {
  const [state, dispatch] = useReducer(cartReducer, initialState);
  
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
    dispatch({ type: "ADD_ITEM", payload: item });
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
      daily_type: 'menu',
      daily_date: menu.date,
      daily_id: menu.id,
    });
  };
  
  return (
    <CartContext.Provider value={{
      state,
      addItem,
      updateQuantity,
      removeItem,
      clearCart,
      addDailyOffer,
      addDailyMenu,
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