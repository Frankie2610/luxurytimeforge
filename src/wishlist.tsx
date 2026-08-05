import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

const WISHLIST_STORAGE_KEY = 'tf:wishlist:v1';
const MAX_WISHLIST_ITEMS = 100;

type WishlistContextValue = {
  ids: string[];
  has: (productId: string) => boolean;
  toggle: (productId: string) => void;
  addMany: (productIds: string[]) => void;
  remove: (productId: string) => void;
  clear: () => void;
};

const WishlistContext = createContext<WishlistContextValue | null>(null);

function normalizeWishlist(value: unknown) {
  if (!Array.isArray(value)) return [];
  return [...new Set(value.map((item) => String(item || '').trim()).filter(Boolean))].slice(0, MAX_WISHLIST_ITEMS);
}

function readWishlist() {
  if (typeof window === 'undefined') return [];
  try {
    return normalizeWishlist(JSON.parse(window.localStorage.getItem(WISHLIST_STORAGE_KEY) || '[]'));
  } catch {
    return [];
  }
}

export function WishlistProvider({children}: {children: ReactNode}) {
  const [ids, setIds] = useState<string[]>(readWishlist);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      try {
        window.localStorage.setItem(WISHLIST_STORAGE_KEY, JSON.stringify(ids));
      } catch {
        // Wishlist is a progressive enhancement; shopping remains available when storage is blocked.
      }
    }, 90);
    return () => window.clearTimeout(timer);
  }, [ids]);

  useEffect(() => {
    const sync = (event: StorageEvent) => {
      if (event.key !== WISHLIST_STORAGE_KEY) return;
      try {
        setIds(normalizeWishlist(JSON.parse(event.newValue || '[]')));
      } catch {
        setIds([]);
      }
    };
    window.addEventListener('storage', sync);
    return () => window.removeEventListener('storage', sync);
  }, []);

  const toggle = useCallback((productId: string) => {
    const normalizedId = productId.trim();
    if (!normalizedId) return;
    setIds((current) => current.includes(normalizedId)
      ? current.filter((id) => id !== normalizedId)
      : [normalizedId, ...current].slice(0, MAX_WISHLIST_ITEMS));
  }, []);
  const addMany = useCallback((productIds: string[]) => {
    const normalizedIds = normalizeWishlist(productIds);
    if (!normalizedIds.length) return;
    setIds((current) => normalizeWishlist([...normalizedIds, ...current]));
  }, []);
  const remove = useCallback((productId: string) => setIds((current) => current.filter((id) => id !== productId)), []);
  const clear = useCallback(() => setIds([]), []);
  const idSet = useMemo(() => new Set(ids), [ids]);
  const value = useMemo<WishlistContextValue>(() => ({
    ids,
    has: (productId) => idSet.has(productId),
    toggle,
    addMany,
    remove,
    clear,
  }), [addMany, clear, idSet, ids, remove, toggle]);

  return <WishlistContext.Provider value={value}>{children}</WishlistContext.Provider>;
}

export function useWishlist() {
  const value = useContext(WishlistContext);
  if (!value) throw new Error('useWishlist must be used inside WishlistProvider.');
  return value;
}
