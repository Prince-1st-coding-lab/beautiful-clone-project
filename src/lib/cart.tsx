import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

export type CartItem = { productId: string; qty: number };

const STORAGE_KEY = "beaute-cart-v1";

type CartContextValue = {
  items: CartItem[];
  count: number;
  hydrated: boolean;
  isOpen: boolean;
  openCart: () => void;
  closeCart: () => void;
  qtyOf: (productId: string) => number;
  add: (productId: string, qty?: number) => void;
  setQty: (productId: string, qty: number) => void;
  remove: (productId: string) => void;
  clear: () => void;
};

const CartContext = createContext<CartContextValue | null>(null);

function readStorage(): CartItem[] {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter((i) => i && typeof i.productId === "string" && Number.isFinite(i.qty))
      .map((i) => ({ productId: i.productId as string, qty: Math.max(1, Math.min(99, Number(i.qty))) }));
  } catch {
    return [];
  }
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [hydrated, setHydrated] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    setItems(readStorage());
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch {
      /* storage unavailable */
    }
  }, [items, hydrated]);

  const setQty = useCallback((productId: string, qty: number) => {
    setItems((prev) => {
      const next = Math.max(0, Math.min(99, qty));
      if (next === 0) return prev.filter((i) => i.productId !== productId);
      if (prev.some((i) => i.productId === productId)) {
        return prev.map((i) => (i.productId === productId ? { ...i, qty: next } : i));
      }
      return [...prev, { productId, qty: next }];
    });
  }, []);

  const add = useCallback((productId: string, qty = 1) => {
    setItems((prev) => {
      const existing = prev.find((i) => i.productId === productId);
      if (!existing) return [...prev, { productId, qty: Math.max(1, Math.min(99, qty)) }];
      return prev.map((i) =>
        i.productId === productId ? { ...i, qty: Math.min(99, i.qty + qty) } : i,
      );
    });
  }, []);

  const value = useMemo<CartContextValue>(
    () => ({
      items,
      count: items.reduce((sum, i) => sum + i.qty, 0),
      hydrated,
      isOpen,
      openCart: () => setIsOpen(true),
      closeCart: () => setIsOpen(false),
      qtyOf: (productId: string) => items.find((i) => i.productId === productId)?.qty ?? 0,
      add,
      setQty,
      remove: (productId: string) => setItems((prev) => prev.filter((i) => i.productId !== productId)),
      clear: () => setItems([]),
    }),
    [items, hydrated, isOpen, add, setQty],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used inside <CartProvider>");
  return ctx;
}
