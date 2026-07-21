import type {Product, Variant} from './types';
import {slugify} from './utils';

const FIREBASE_FORBIDDEN_KEY = /[.#$\[\]\/]/;

export function normalizeSku(value: unknown): string {
  return String(value ?? '').trim();
}

export function isFirebaseSafeSku(sku: string): boolean {
  return Boolean(sku) && !FIREBASE_FORBIDDEN_KEY.test(sku);
}

export function assertFirebaseSafeSku(sku: string): void {
  if (!sku) throw new Error('Sản phẩm thiếu mã SKU.');
  if (!isFirebaseSafeSku(sku)) {
    throw new Error(`SKU “${sku}” chứa ký tự Firebase không hỗ trợ: . # $ [ ] /`);
  }
}

function canonicalVariant(variant: Variant, productSku: string, index: number): Variant {
  const sku = normalizeSku(variant.sku) || (index === 0 ? productSku : `${productSku}-${index + 1}`);
  return {
    ...variant,
    id: index === 0 ? productSku : sku,
    sku,
  };
}

export function canonicalProduct(product: Product): Product {
  const sku = normalizeSku(product.sku || product.id);
  assertFirebaseSafeSku(sku);
  const handle = slugify(product.handle || `${product.vendor}-${product.title}-${sku}`) || slugify(sku);
  const variants = (product.variants?.length ? product.variants : [{
    id: sku,
    title: 'Default Title',
    sku,
    price: product.price,
    compareAtPrice: product.compareAtPrice,
    inventory: product.inventory,
    optionValues: {},
  }]).map((variant, index) => canonicalVariant(variant, sku, index));
  const primary = variants[0];
  return {
    ...product,
    id: sku,
    sku,
    handle,
    images: [...new Set((product.images || []).map(item => item.trim()).filter(Boolean))],
    price: product.price || primary?.price || 0,
    compareAtPrice: product.compareAtPrice || primary?.compareAtPrice || 0,
    inventory: Number.isFinite(product.inventory) ? product.inventory : variants.reduce((sum, item) => sum + item.inventory, 0),
    variants,
  };
}

function routeValue(value: unknown): string {
  const raw = String(value ?? '').trim();
  try {
    return decodeURIComponent(raw);
  } catch {
    return raw;
  }
}

export function findProductByRoute(products: Product[], value: unknown): Product | undefined {
  const raw = routeValue(value);
  const normalized = slugify(raw);
  return products.find((product) =>
    product.handle === raw ||
    slugify(product.handle) === normalized ||
    product.id === raw ||
    product.sku === raw
  );
}

export function productsFromFirebase(value: Product[] | Record<string, Product> | null | undefined): Product[] {
  if (!value) return [];
  const list = Array.isArray(value) ? value : Object.entries(value).map(([key, product]) => ({...product, id: product.id || key, sku: product.sku || key}));
  const output: Product[] = [];
  for (const product of list) {
    try {
      output.push(canonicalProduct(product));
    } catch {
      // Keep legacy/demo records readable even when the old id is not a valid SKU.
      const fallback = normalizeSku(product.sku || product.id);
      if (fallback) output.push({...product, id: fallback, sku: fallback});
    }
  }
  return output;
}

export function productsToFirebaseRecord(products: Product[]): Record<string, Product> {
  return products.reduce<Record<string, Product>>((record, product) => {
    const canonical = canonicalProduct(product);
    record[canonical.sku] = canonical;
    return record;
  }, {});
}

export function productFirebasePath(sku: string): string {
  const normalized = normalizeSku(sku);
  assertFirebaseSafeSku(normalized);
  return `timeforge/products/${normalized}`;
}
