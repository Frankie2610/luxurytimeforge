import {useCallback, useEffect, useState} from 'react';
import {asStringList} from './data-normalize';

const RECENTLY_VIEWED_KEY = 'tf.storefront.recently-viewed.v1';
const LIMIT = 8;

function readRecentlyViewed(): string[] {
  if (typeof window === 'undefined') return [];
  try {
    return asStringList(JSON.parse(window.localStorage.getItem(RECENTLY_VIEWED_KEY) || '[]')).slice(0, LIMIT);
  } catch {
    return [];
  }
}

export function useRecentlyViewedProduct(currentProductId = '') {
  const [ids, setIds] = useState<string[]>(readRecentlyViewed);

  useEffect(() => {
    if (!currentProductId) return;
    setIds((current) => {
      const next = [currentProductId, ...current.filter((id) => id !== currentProductId)].slice(0, LIMIT);
      try {window.localStorage.setItem(RECENTLY_VIEWED_KEY, JSON.stringify(next));} catch {}
      return next;
    });
  }, [currentProductId]);

  useEffect(() => {
    const sync = (event: StorageEvent) => {
      if (event.key === RECENTLY_VIEWED_KEY) setIds(readRecentlyViewed());
    };
    window.addEventListener('storage', sync);
    return () => window.removeEventListener('storage', sync);
  }, []);

  const clear = useCallback(() => {
    try {window.localStorage.removeItem(RECENTLY_VIEWED_KEY);} catch {}
    setIds([]);
  }, []);

  return {ids, clear};
}
