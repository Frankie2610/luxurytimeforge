/**
 * Lean public home catalog: never send the entire Firebase product collection to
 * a first-time home visitor. Other routes retain their complete catalog flow.
 * The RTDB "status" index already exists in firebase.rules.json.
 */
const clean = (value, limit = 240) => String(value ?? '').trim().slice(0, limit);
const number = (value) => Math.max(0, Number(value) || 0);
const list = (value) => Array.isArray(value) ? value.filter(Boolean) : Object.values(value || {}).filter(Boolean);
const homeProduct = (product, key) => {
  if (!product || product.status !== 'active' || product.published === false || !clean(product.handle) || number(product.price) <= 0) return null;
  const sku = clean(product.sku || key, 120);
  const variants = list(product.variants).slice(0, 6).map((item, i) => ({
    id: clean(item.id || (i === 0 ? sku : item.sku), 120),
    sku: clean(item.sku || sku, 120),
    title: clean(item.title || 'Mặc định', 120),
    price: number(item.price || product.price),
    compareAtPrice: number(item.compareAtPrice),
    inventory: number(item.inventory),
    optionValues: item.optionValues && typeof item.optionValues === 'object' ? item.optionValues : {},
  }));
  return {
    id: clean(product.id || sku, 120), sku, handle: clean(product.handle, 180),
    title: clean(product.title, 220), vendor: clean(product.vendor, 100),
    productType: clean(product.productType, 100), category: clean(product.category, 100),
    status: 'active', published: true,
    price: number(product.price), compareAtPrice: number(product.compareAtPrice),
    inventory: number(product.inventory), images: list(product.images).slice(0, 2).map(item => clean(item, 1500)),
    variants, tags: list(product.tags).slice(0, 12).map(item => clean(item, 80)),
    createdAt: clean(product.createdAt, 35), updatedAt: clean(product.updatedAt, 35),
  };
};

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({message: 'Method not allowed'});
  }
  const base = clean(process.env.FIREBASE_DATABASE_URL || process.env.VITE_FIREBASE_DATABASE_URL, 1000).replace(/\/$/, '');
  if (!/^https:\/\//.test(base)) return res.status(503).json({message: 'Storefront catalog unavailable'});
  const target = new URL(base + '/timeforge/products.json');
  target.searchParams.set('orderBy', '"status"');
  target.searchParams.set('equalTo', '"active"');
  target.searchParams.set('limitToFirst', '96');
  if (process.env.FIREBASE_DATABASE_AUTH) target.searchParams.set('auth', process.env.FIREBASE_DATABASE_AUTH);
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 6500);
  try {
    const upstream = await fetch(target, {signal: controller.signal, headers: {Accept: 'application/json'}});
    if (!upstream.ok) throw new Error('Catalog query returned ' + upstream.status);
    const raw = await upstream.json();
    const products = Object.entries(raw || {}).map(([key, product]) => homeProduct(product, key)).filter(Boolean).slice(0, 48);
    // Prevent crawler/visitor caches from holding a failed empty query as a healthy catalog.
    if (!products.length) return res.status(503).json({message: 'Storefront catalog not ready'});
    res.setHeader('Cache-Control', 'public, s-maxage=120, stale-while-revalidate=300');
    res.setHeader('X-TimeForge-Catalog-Scope', 'home-48');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    return res.status(200).json({products, scope: 'home', totalReturned: products.length});
  } catch (error) {
    console.warn('[TimeForge] Home feed failed:', error instanceof Error ? error.message : error);
    res.setHeader('Cache-Control', 'no-store');
    return res.status(503).json({message: 'Không thể tải sản phẩm nổi bật.'});
  } finally {
    clearTimeout(timeout);
  }
}
