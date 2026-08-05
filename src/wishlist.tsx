import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useSyncExternalStore,
  type ReactNode,
} from 'react';

const WISHLIST_STORAGE_KEY = 'tf:wishlist:v1';
const MAX_WISHLIST_ITEMS = 100;
const EMPTY_WISHLIST: string[] = [];

type WishlistActions = {
  toggle: (productId: string) => void;
  addMany: (productIds: string[]) => void;
  remove: (productId: string) => void;
  clear: () => void;
};

type WishlistContextValue = WishlistActions & {
  ids: string[];
  has: (productId: string) => boolean;
};

const WishlistActionsContext = createContext<WishlistActions | null>(null);

function normalizeWishlist(value: unknown) {
  if (!Array.isArray(value)) return [];
  return [...new Set(value.map((item) => String(item || '').trim()).filter(Boolean))].slice(0, MAX_WISHLIST_ITEMS);
}

function readWishlist() {
  if (typeof window === 'undefined') return EMPTY_WISHLIST;
  try {
    return normalizeWishlist(JSON.parse(window.localStorage.getItem(WISHLIST_STORAGE_KEY) || '[]'));
  } catch {
    return EMPTY_WISHLIST;
  }
}

let wishlistSnapshot = readWishlist();
let wishlistIdSet = new Set(wishlistSnapshot);
let persistTimer: number | undefined;
const wishlistListeners = new Set<() => void>();

const sameWishlist = (left: string[], right: string[]) => left.length === right.length && left.every((id, index) => id === right[index]);
const subscribeWishlist = (listener: () => void) => {
  wishlistListeners.add(listener);
  return () => wishlistListeners.delete(listener);
};
const getWishlistSnapshot = () => wishlistSnapshot;
const getServerWishlistSnapshot = () => EMPTY_WISHLIST;
const getServerWishlistItemSnapshot = () => false;

function replaceWishlist(nextValue: string[], persist = true) {
  const next = normalizeWishlist(nextValue);
  if (sameWishlist(wishlistSnapshot, next)) return;
  wishlistSnapshot = next;
  wishlistIdSet = new Set(next);
  wishlistListeners.forEach((listener) => listener());

  if (!persist || typeof window === 'undefined') return;
  if (persistTimer !== undefined) window.clearTimeout(persistTimer);
  persistTimer = window.setTimeout(() => {
    try {
      window.localStorage.setItem(WISHLIST_STORAGE_KEY, JSON.stringify(wishlistSnapshot));
    } catch {
      // Wishlist is a progressive enhancement; shopping remains available when storage is blocked.
    }
  }, 90);
}

const wishlistActions: WishlistActions = {
  toggle: (productId: string) => {
    const normalizedId = productId.trim();
    if (!normalizedId) return;
    replaceWishlist(wishlistIdSet.has(normalizedId)
      ? wishlistSnapshot.filter((id) => id !== normalizedId)
      : [normalizedId, ...wishlistSnapshot]);
  },
  addMany: (productIds: string[]) => {
    const normalizedIds = normalizeWishlist(productIds);
    if (!normalizedIds.length) return;
    const current = wishlistSnapshot;
    replaceWishlist(normalizeWishlist([...normalizedIds, ...current]));
  },
  remove: (productId: string) => replaceWishlist(wishlistSnapshot.filter((id) => id !== productId)),
  clear: () => replaceWishlist([]),
};

function useWishlistActions() {
  const actions = useContext(WishlistActionsContext);
  if (!actions) throw new Error('useWishlist must be used inside WishlistProvider.');
  return actions;
}

export function WishlistProvider({children}: {children: ReactNode}) {
  useEffect(() => {
    const sync = (event: StorageEvent) => {
      if (event.key !== WISHLIST_STORAGE_KEY) return;
      try {
        replaceWishlist(normalizeWishlist(JSON.parse(event.newValue || '[]')), false);
      } catch {
        replaceWishlist([], false);
      }
    };
    window.addEventListener('storage', sync);
    return () => window.removeEventListener('storage', sync);
  }, []);

  return <WishlistActionsContext.Provider value={wishlistActions}>{children}</WishlistActionsContext.Provider>;
}

export function useWishlist(): WishlistContextValue {
  const actions = useWishlistActions();
  const ids = useSyncExternalStore(subscribeWishlist, getWishlistSnapshot, getServerWishlistSnapshot);
  const has = useCallback((productId: string) => wishlistIdSet.has(productId), []);
  return useMemo(() => ({ids, has, ...actions}), [actions, has, ids]);
}

export function useWishlistItem(productId: string) {
  const actions = useWishlistActions();
  const wished = useSyncExternalStore(
    subscribeWishlist,
    () => Boolean(productId && wishlistIdSet.has(productId)),
    getServerWishlistItemSnapshot,
  );
  const toggle = useCallback(() => actions.toggle(productId), [actions, productId]);
  return useMemo(() => ({wished, toggle}), [toggle, wished]);
}
